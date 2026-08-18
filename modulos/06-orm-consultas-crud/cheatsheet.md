# Cola — Repository e QueryBuilder

## Injetar

```ts
constructor(
  @InjectRepository(Obra) private readonly obras: Repository<Obra>,
  private readonly dataSource: DataSource,          // para transações
) {}
```

## CRUD

```ts
// ler
await this.obras.find();
await this.obras.findOneBy({ id });                 // Obra | null
await this.obras.findAndCount({ skip: 0, take: 20 }); // [itens, total]
await this.obras.existsBy({ isbn });                // boolean

// criar — create() monta, save() grava
const obra = this.obras.create({ titulo: "X", autor });
await this.obras.save(obra);

// atualizar
await this.obras.update(id, { titulo: "Y" });       // rápido, sem hooks
const o = await this.obras.findOneBy({ id });       // com hooks e validação
Object.assign(o, dados);
await this.obras.save(o);

// remover
await this.obras.delete(id);                        // { affected: 0 | 1 }
await this.obras.softDelete(id);                    // precisa de @DeleteDateColumn
```

## Filtros do `Repository`

```ts
import { In, LessThan, MoreThan, Like, ILike, IsNull, Not, Between } from "typeorm";

await this.obras.find({
  where: {
    anoPublicacao: LessThan(1900),
    autor: { nome: ILike("%machado%") },      // filtra por relação
    isbn: Not(IsNull()),
    id: In([1, 2, 3]),
  },
  relations: { autor: true, categorias: true },
  order: { titulo: "ASC" },
  skip: 0,
  take: 20,
});
```

`where` como **array** vira `OR`:

```ts
where: [{ titulo: ILike("%x%") }, { isbn: "978..." }]
```

## QueryBuilder

```ts
const qb = this.obras.createQueryBuilder("obra")
  .leftJoinAndSelect("obra.autor", "autor")   // JOIN + traz colunas
  .leftJoin("obra.categorias", "cat")         // JOIN só para filtrar
  .where("obra.anoPublicacao < :ano", { ano: 1900 })
  .andWhere("cat.id = :id", { id })
  .orderBy("obra.titulo", "ASC")
  .skip(0).take(20);

await qb.getMany();        // Obra[]
await qb.getManyAndCount(); // [Obra[], number]
await qb.getOne();         // Obra | null
await qb.getRawMany();     // linhas cruas — para agregação
```

### Filtro opcional

```ts
if (termo) qb.andWhere("obra.titulo ILIKE :termo", { termo: `%${termo}%` });
```

### Agregação

```ts
await this.obras.createQueryBuilder("obra")
  .select("autor.nome", "autor")
  .addSelect("COUNT(obra.id)", "total")
  .innerJoin("obra.autor", "autor")
  .groupBy("autor.nome")
  .having("COUNT(obra.id) > :min", { min: 3 })
  .getRawMany();
```

## ⚠️ Parâmetros, nunca concatenação

```ts
.where(`obra.titulo = '${entrada}'`)                  // ❌ injeção de SQL
.where("obra.titulo = :titulo", { titulo: entrada })  // ✅
```

## N+1

```ts
// ❌ 1 + N consultas
const obras = await this.obras.find();
for (const o of obras) o.autor = await this.autores.findOneBy({ id: o.autorId });

// ✅ 1 consulta
await this.obras.find({ relations: { autor: true } });
```

**Detectar:** com `logging: true`, se o número de SELECTs cresce com o tamanho da lista, é N+1.

## Transação

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, id, { disponivel: false });
});
```

Use o `manager` de dentro — usar `this.repo` escapa da transação.

## Ver o SQL

```ts
logging: true            // no DataSource
console.log(qb.getSql()); // consulta específica
```

## Erros

| Mensagem | Causa |
|---|---|
| relação `undefined` | Faltou `relations` / `leftJoinAndSelect` |
| `syntax error at or near` | Parâmetro como `$x` ou `?x`; no TypeORM é `:x` |
| `save()` criou em vez de atualizar | Objeto sem `id` |
| `ILIKE` falha | É do PostgreSQL; no SQLite use `LIKE` |
| Transação não desfez | Usou `this.repo` em vez do `manager` |
