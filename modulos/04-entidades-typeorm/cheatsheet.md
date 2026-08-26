# Cola — Entidades TypeORM

## Esqueleto

```ts
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()                      // nome da tabela = nome da classe em minúsculas
export class Obra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  titulo: string;
}
```

`@Entity("acervo_obra")` força outro nome de tabela.

## Colunas

| Decorator | Gera |
|---|---|
| `@PrimaryGeneratedColumn()` | `SERIAL PRIMARY KEY` |
| `@PrimaryGeneratedColumn("uuid")` | `UUID PRIMARY KEY` |
| `@Column({ length: 200 })` | `varchar(200)` |
| `@Column({ type: "text" })` | `text` |
| `@Column({ type: "int" })` | `integer` |
| `@Column({ type: "decimal", precision: 10, scale: 2 })` | `decimal(10,2)` — **dinheiro** |
| `@Column({ type: "boolean", default: false })` | `boolean NOT NULL DEFAULT false` |
| `@Column({ type: "date" })` | `date` (sem hora) |
| `@Column({ type: "timestamptz" })` | `timestamp with time zone` |
| `@Column({ type: "enum", enum: Estado })` | `enum` nativo. O TypeORM cria um `CREATE TYPE` antes da tabela |
| `@CreateDateColumn()` | preenchido na criação |
| `@UpdateDateColumn()` | atualizado a cada `save` |
| `@DeleteDateColumn()` | exclusão lógica (`softDelete`) |

### Opções

| Opção | Efeito |
|---|---|
| `nullable: true` | Aceita `NULL`. **Acompanhe no tipo TS:** `number \| null` |
| `unique: true` | Índice único |
| `default: valor` | Padrão no banco |
| `select: false` | Não vem em `find()` — use em `senhaHash` |

> ⚠️ Nunca `float`/`double` para dinheiro. Use `decimal`.

## Relações

```ts
// 1:N — o @ManyToOne carrega a chave estrangeira
@ManyToOne(() => Autor, (a) => a.obras, { nullable: false, onDelete: "RESTRICT" })
autor: Autor;

@OneToMany(() => Obra, (o) => o.autor)
obras: Obra[];

// N:N — @JoinTable em UM só lado
@ManyToMany(() => Categoria, (c) => c.obras)
@JoinTable({ name: "obra_categoria" })
categorias: Categoria[];

// 1:1
@OneToOne(() => Perfil, { cascade: true })
@JoinColumn()
perfil: Perfil;
```

Sempre `() => Entidade` (função), nunca a classe direta — evita erro de importação circular.

### `onDelete`

| Valor | O que acontece | Quando |
|---|---|---|
| `RESTRICT` | Impede apagar o pai | **Padrão sensato** |
| `CASCADE` | Apaga os filhos junto | Filho não existe sem o pai (`Exemplar → Obra`) |
| `SET NULL` | Zera a referência | Vínculo opcional |

Pergunta que decide: *"este registro faz sentido sozinho?"*

## Índices

```ts
@Index()                                    // coluna
@Column({ length: 13 })
isbn: string;

@Index(["autor", "anoPublicacao"])          // composto, na classe
@Index(["tombo"], { unique: true })
@Entity()
export class Obra {}
```

Indexe o que aparece em `WHERE`/`ORDER BY`/`JOIN` com frequência. PK e FK já são indexadas.

## Registrar

```ts
// no módulo do domínio
@Module({ imports: [TypeOrmModule.forFeature([Autor, Obra])] })

// no app.module.ts
TypeOrmModule.forRoot({
  type: "postgres",
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: false,          // ⚠️ true só no M04
  logging: true,
})
```

## Conferir o que foi gerado

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c "\d obra"    # uma tabela
docker compose exec db psql -U bibliocom -d bibliocom -c "\dt"          # todas
```

## Erros

| Mensagem | Causa |
|---|---|
| `Entity metadata for X#y was not found` | Falta no `forFeature` |
| `Cannot read properties of undefined (reading 'name')` | Importação circular — use `() => Entidade` |
| `ECONNREFUSED ::1:5432` | O contêiner do banco não subiu. `docker compose ps` |
| Tudo virou `varchar(255)` | Faltou `type`/`length` |
| `null value in column "x" violates not-null constraint` | Campo obrigatório sem valor ou sem `default` |
