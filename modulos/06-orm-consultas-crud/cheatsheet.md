# Cola — Repository e QueryBuilder

Exemplos com `Pessoa` e `Atendimento` (um atendimento pertence a uma pessoa e inclui vários
serviços). Troque pelas entidades do projeto.

## Injetar

```ts
constructor(
  @InjectRepository(Atendimento) private readonly atendimentos: Repository<Atendimento>,
  private readonly dataSource: DataSource,          // para transações
) {}
```

## CRUD

```ts
// ler
await this.atendimentos.find();
await this.atendimentos.findOneBy({ id });                   // Atendimento | null
await this.atendimentos.findAndCount({ skip: 0, take: 20 }); // [itens, total]
await this.atendimentos.existsBy({ pessoaId, concluidoEm: IsNull() }); // boolean

// criar — create() monta, save() grava
const a = this.atendimentos.create({ descricao: "Orientação", pessoa });
await this.atendimentos.save(a);

// atualizar
await this.atendimentos.update(id, { descricao: "Y" });      // rápido, sem hooks
const b = await this.atendimentos.findOneBy({ id });         // com hooks e checagem de existência
Object.assign(b, dados);
await this.atendimentos.save(b);

// remover
await this.atendimentos.delete(id);                          // { affected: 0 | 1 }
await this.atendimentos.softDelete(id);                      // precisa de @DeleteDateColumn
```

## Filtros do `Repository`

```ts
import { In, LessThan, MoreThan, ILike, IsNull, Not, Between } from "typeorm";

await this.atendimentos.find({
  where: {
    criadoEm: Between(inicio, fim),
    pessoa: { nome: ILike("%silva%") },      // filtra por relação
    concluidoEm: Not(IsNull()),
    id: In([1, 2, 3]),
  },
  relations: { pessoa: true, servicos: true },
  order: { criadoEm: "DESC" },
  skip: 0,
  take: 20,
});
```

`where` como **array** vira `OR`:

```ts
where: [{ descricao: ILike("%x%") }, { pessoaId: 7 }]
```

## QueryBuilder

```ts
const qb = this.atendimentos.createQueryBuilder("a")
  .leftJoinAndSelect("a.pessoa", "pessoa")   // JOIN + traz colunas
  .leftJoin("a.servicos", "serv")            // JOIN só para filtrar
  .where("a.criadoEm >= :desde", { desde })
  .andWhere("serv.id = :id", { id })
  .orderBy("a.criadoEm", "DESC")
  .skip(0).take(20);

await qb.getMany();         // Atendimento[]
await qb.getManyAndCount(); // [Atendimento[], number]
await qb.getOne();          // Atendimento | null
await qb.getRawMany();      // linhas cruas — para agregação
```

### Filtro opcional

```ts
if (termo) qb.andWhere("pessoa.nome ILIKE :termo", { termo: `%${termo}%` });
```

### Agregação

```ts
await this.atendimentos.createQueryBuilder("a")
  .select("serv.nome", "servico")
  .addSelect("COUNT(a.id)", "total")
  .innerJoin("a.servicos", "serv")
  .groupBy("serv.nome")
  .having("COUNT(a.id) > :min", { min: 3 })
  .getRawMany();
```

## ⚠️ Parâmetros, nunca concatenação

```ts
.where(`pessoa.nome = '${entrada}'`)                 // ❌ injeção de SQL
.where("pessoa.nome = :nome", { nome: entrada })     // ✅
```

## N+1

```ts
// ❌ N+1: com take 50 são 51 consultas; com 200, são 201
const lista = await this.atendimentos.find({ take: 50 });
for (const a of lista) {
  const p = await this.pessoas.findOneBy({ id: a.pessoaId });
  if (p) a.pessoa = p;
}

// ✅ 2 consultas, e continuam 2 com take 200
await this.atendimentos.find({ take: 50, relations: { pessoa: true } });
```

São 2 e não 1 porque, com `take` + relação, o TypeORM busca primeiro os ids da página e
depois os dados. O que importa não é 1 ou 2: é que **2 não cresce**.

**Detectar:** com `logging: true`, se o número de SELECTs cresce com o tamanho da lista, é N+1.

## Transação

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Item, itemId, { disponivel: false });
});
```

Use o `manager` de dentro — usar `this.repo` escapa da transação.

## Ver o SQL

```ts
logging: true             // no DataSource
console.log(qb.getSql()); // consulta específica
```

## Erros

| Mensagem | Causa |
|---|---|
| relação `undefined` | Faltou `relations` / `leftJoinAndSelect` |
| `syntax error at or near` | Parâmetro como `$x` ou `?x`; no TypeORM é `:x` |
| `save()` criou em vez de atualizar | Objeto sem `id` |
| `ILIKE` falha | É do PostgreSQL. Em outro banco: `LOWER(a) LIKE LOWER(b)` |
| Transação não desfez | Usou `this.repo` em vez do `manager` |
