# M04 — Entidades: classes que geram o banco

> **CH:** 6h (3h teóricas · 3h práticas) · **Semana 4** · **Pré-requisito:** M03

O módulo central da ementa: *"classes para geração automática do banco de dados"*. Aqui uma
classe TypeScript vira uma tabela, e a relação entre classes vira chave estrangeira.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que um ORM resolve e o que ele cobra em troca.
2. Escrever entidades com `@Entity()` e ver o banco nascer delas.
3. Modelar relações 1:N e N:N, escolhendo o comportamento de exclusão.
4. Justificar cada `nullable`, cada `unique` e cada índice que você criar.

---

## 📖 Teoria (3h)

### 1. O problema que o ORM resolve

Sem ORM, o acesso a dados é assim:

```ts
const { rows } = await pool.query(
  "SELECT id, titulo, ano_publicacao FROM obra WHERE id = $1", [id]
);
const obra = rows[0];        // tipo: any. O TypeScript não sabe nada sobre isto.
```

Três problemas:

1. **Sem tipo.** `obra.titolo` (com o erro de digitação) compila e só falha em produção.
2. **SQL espalhado.** A mesma consulta aparece em cinco arquivos, com variações sutis.
3. **Esquema em dois lugares.** A tabela está no banco, a expectativa está no código, e
   nada garante que combinem.

Um ORM (*Object-Relational Mapper*) faz a classe ser a **única fonte de verdade**: dela
saem o tipo, a consulta e a tabela.

```ts
const obra = await this.repo.findOneBy({ id });   // tipo: Obra | null
```

### 2. O que o ORM cobra

| Custo | Onde é tratado |
|---|---|
| Você escreve menos SQL — e entende menos SQL | O M06 exige ler o SQL gerado (`logging: true`) antes de aceitar qualquer consulta |
| Consultas ingênuas viram lentidão (problema N+1) | M06 dedica uma seção inteira ao N+1, com medição |
| Abstração vaza: casos difíceis exigem SQL de novo | M06 mostra o `QueryBuilder` e quando descer para SQL puro |

> O ORM não dispensa saber SQL. Ele dispensa **escrever** o SQL trivial — que é ~90% do CRUD.

### 3. Da classe à tabela

```
┌────────────────────────┐                ┌──────────────────────────┐
│ @Entity()              │   TypeORM      │ CREATE TABLE obra (      │
│ class Obra {           │  ──────────▶   │   id        SERIAL PK,   │
│   @PrimaryGeneratedCol │                │   titulo    VARCHAR(200),│
│   id: number;          │                │   ano       INTEGER NULL │
│   @Column()            │                │ );                       │
│   titulo: string;      │                └──────────────────────────┘
│ }                      │
└────────────────────────┘
```

Duas formas de o TypeORM aplicar isso no banco:

| Modo | Como funciona | Quando usar |
|---|---|---|
| `synchronize: true` | A cada inicialização, o TypeORM compara entidades × banco e **altera a tabela** | **Só em desenvolvimento**, e só neste módulo |
| Migrações | Você gera um arquivo versionado com o `ALTER TABLE` e o aplica de propósito | Sempre que houver dado que importa. É o M05 |

> ⚠️ **`synchronize: true` em produção apaga dados.** Ele altera colunas para casar com a
> entidade, sem perguntar e sem backup. Usamos neste módulo porque o banco é descartável e
> o foco é ver a classe virar tabela; o M05 existe justamente para tirá-lo do caminho.

### 4. `@Column`: cada opção é uma decisão

```ts
@Column({ type: "varchar", length: 200 })
titulo: string;
```

| Opção | Pergunta que ela responde |
|---|---|
| `type` | Que tipo de coluna? Sem isto, o TypeORM infere do tipo TS — e `number` vira `integer`, o que quebra valores decimais |
| `length` | Qual o limite? `varchar(200)` é uma **regra de negócio**, não detalhe técnico |
| `nullable: true` | Este dado pode não existir? |
| `unique: true` | Pode repetir? |
| `default` | O que vale quando ninguém informou? |

**A decisão mais consequente é `nullable`.** Uma coluna que aceita nulo obriga **todo**
código que a lê a tratar a ausência. Torne nulo só o que é genuinamente opcional no mundo
real — e, quando um texto for opcional, prefira `default: ""` a `nullable: true`: string
vazia e `null` significando "sem valor" é a origem de metade dos `if` defensivos.

### 5. Relações

#### 1:N — uma autora, muitas obras

```ts
@Entity()
export class Autor {
  @OneToMany(() => Obra, (obra) => obra.autor)
  obras: Obra[];
}

@Entity()
export class Obra {
  @ManyToOne(() => Autor, (autor) => autor.obras, { nullable: false, onDelete: "RESTRICT" })
  autor: Autor;
}
```

| Trecho | O que faz |
|---|---|
| `() => Autor` | Função, não a classe direto. Evita erro de importação circular: os dois arquivos se referenciam |
| `(autor) => autor.obras` | O **outro lado** da relação. É o que permite navegar nos dois sentidos |
| `@ManyToOne` | O lado que **carrega a chave estrangeira**. A coluna `autorId` nasce em `obra` |
| `onDelete` | O que acontece com as obras quando a autora é apagada — ver abaixo |

**`onDelete` é decisão de negócio, não de banco:**

| Valor | Efeito | Quando |
|---|---|---|
| `RESTRICT` | Impede apagar a autora enquanto houver obras | **Padrão sensato.** Erro alto é melhor que perda silenciosa |
| `CASCADE` | Apaga as obras junto | Só quando o filho **não existe** sem o pai (um item dentro de um pedido) |
| `SET NULL` | Zera a referência, mantém a obra | Quando o vínculo é opcional |

> Escolher `CASCADE` sem pensar é como apagar uma editora e perder o catálogo. A pergunta
> certa é: *"este registro faz sentido sozinho?"*

#### N:N — uma obra tem várias categorias, uma categoria tem várias obras

```ts
@ManyToMany(() => Categoria, (categoria) => categoria.obras)
@JoinTable({ name: "obra_categoria" })
categorias: Categoria[];
```

O `@JoinTable` vai **em um só dos lados** — o dono da relação — e cria a tabela intermediária.

> Quando a ligação precisar de dados próprios (ex.: *desde quando* uma obra está numa
> categoria), N:N deixa de servir: crie uma entidade própria com dois `@ManyToOne`. É a
> mesma decisão que aparece em `Emprestimo`, que liga exemplar e associado **e** carrega
> datas.

### 6. Índices

O banco varre a tabela inteira quando não há índice. Com 50 registros ninguém nota; com
50 mil, a tela trava.

```ts
@Index()
@Column({ length: 13 })
isbn: string;
```

Regra prática: indexe o que aparece em `WHERE`, `ORDER BY` ou `JOIN` **com frequência**.
Índice não é grátis — ocupa espaço e torna a escrita mais lenta. Chave primária e chave
estrangeira já são indexadas automaticamente.

💼 **No mercado:** modelagem é onde erro custa mais caro. Um campo mal tipado vira migração
de dados seis meses depois, com sistema em produção. Em *code review*, `nullable: true` sem
justificativa e `CASCADE` sem justificativa são os dois comentários mais frequentes.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Instalar e conectar (25 min)

```bash
cd ~/dev/bibliocom/backend      # 🪟 Windows: Set-Location C:\dev\bibliocom\backend
pnpm add @nestjs/typeorm typeorm sqlite3
```

| Pacote | Para quê |
|---|---|
| `typeorm` | O ORM |
| `@nestjs/typeorm` | A integração: expõe repositórios para injeção |
| `sqlite3` | Driver do banco deste módulo. **Zero instalação** — o banco é um arquivo |

Em `src/app.module.ts`:

```ts
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "bibliocom.sqlite",
      autoLoadEntities: true,
      synchronize: true,     // ⚠️ só neste módulo — ver M05
      logging: true,         // mostra o SQL gerado. Mantenha ligado
    }),
    AcervoModule,
  ],
})
export class AppModule {}
```

| Opção | O que faz |
|---|---|
| `autoLoadEntities: true` | Registra sozinho toda entidade declarada com `forFeature` — evita a lista manual que sempre fica desatualizada |
| `synchronize: true` | Cria e altera tabelas a partir das entidades, a cada boot |
| `logging: true` | **Imprime cada SQL no terminal.** É a única forma de saber o que o ORM está realmente fazendo |

Acrescente `bibliocom.sqlite` ao `.gitignore` — é o seu banco local, não o da equipe.

### Passo 2 — As primeiras entidades (40 min)

`src/acervo/entidades/autor.entity.ts`:

```ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Obra } from "./obra.entity";

@Entity()
export class Autor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ type: "date", nullable: true })
  nascimento: string | null;

  @Column({ type: "text", default: "" })
  biografia: string;

  @OneToMany(() => Obra, (obra) => obra.autor)
  obras: Obra[];
}
```

| Linha | Decisão |
|---|---|
| `@PrimaryGeneratedColumn()` | `id` inteiro auto-incrementado |
| `nome` sem `nullable` | Autora **precisa** ter nome. O padrão do TypeORM é `NOT NULL` |
| `nascimento` com `nullable` | Nem toda data de nascimento é conhecida. Aqui o nulo é honesto |
| `biografia` com `default: ""` | Texto opcional. `""` em vez de `null` poupa `if` em todo lugar que exibe |

`src/acervo/entidades/obra.entity.ts`:

```ts
import {
  Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany,
  ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";
import { Autor } from "./autor.entity";
import { Categoria } from "./categoria.entity";
import { Exemplar } from "./exemplar.entity";

@Entity()
export class Obra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ length: 200, default: "" })
  subtitulo: string;

  @Column({ type: "int", nullable: true })
  anoPublicacao: number | null;

  @Index()
  @Column({ length: 13, default: "" })
  isbn: string;

  @Column({ type: "text", default: "" })
  sinopse: string;

  @ManyToOne(() => Autor, (autor) => autor.obras, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  autor: Autor;

  @ManyToMany(() => Categoria, (categoria) => categoria.obras)
  @JoinTable({ name: "obra_categoria" })
  categorias: Categoria[];

  @OneToMany(() => Exemplar, (exemplar) => exemplar.obra)
  exemplares: Exemplar[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
```

| Trecho | Decisão |
|---|---|
| `@Index()` no `isbn` | Busca por ISBN é frequente no balcão |
| `onDelete: "RESTRICT"` | Apagar uma autora com obras deve **falhar**, não apagar o acervo |
| `@CreateDateColumn` / `@UpdateDateColumn` | O TypeORM preenche sozinho. Auditoria mínima, custo zero |
| `anoPublicacao: number \| null` | O tipo TS **acompanha** o `nullable`. Se divergirem, o TypeScript mente para você |

`src/acervo/entidades/categoria.entity.ts`:

```ts
@Entity()
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80, unique: true })
  nome: string;

  @ManyToMany(() => Obra, (obra) => obra.categorias)
  obras: Obra[];
}
```

`src/acervo/entidades/exemplar.entity.ts` — a diferença entre **obra** e **exemplar** é o
coração do domínio: a biblioteca tem *um* "Dom Casmurro" no catálogo e *três* volumes na
estante.

```ts
export enum EstadoExemplar {
  NOVO = "novo",
  BOM = "bom",
  DESGASTADO = "desgastado",
  DESCARTADO = "descartado",
}

@Entity()
export class Exemplar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  tombo: string;

  @Column({ type: "simple-enum", enum: EstadoExemplar, default: EstadoExemplar.BOM })
  estado: EstadoExemplar;

  @ManyToOne(() => Obra, (obra) => obra.exemplares, {
    nullable: false,
    onDelete: "CASCADE",
  })
  obra: Obra;
}
```

| Decisão | Por quê |
|---|---|
| `tombo` com `unique` | Número de tombo é o identificador físico. Duplicado é erro de catalogação |
| `enum` em vez de string livre | O conjunto de estados é fechado. String livre vira `"Bom"`, `"bom"` e `"BOM"` no mesmo banco |
| `onDelete: "CASCADE"` **aqui** | Um exemplar **não existe** sem a obra. É o caso legítimo de cascata — diferente de `Obra → Autor` |

Registre no `src/acervo/acervo.module.ts`:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([Autor, Obra, Categoria, Exemplar])],
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

`forFeature` é o que disponibiliza os repositórios para injeção (M06) — e o que o
`autoLoadEntities` observa.

### Passo 3 — Ver o banco nascer (30 min)

```bash
pnpm start:dev
```

Observe o terminal: o TypeORM imprime cada `CREATE TABLE` que executou. **Leia essas
linhas** — é literalmente a ementa acontecendo.

Confira as tabelas geradas:

```bash
pnpm dlx sqlite3 bibliocom.sqlite ".schema obra"
```

Perguntas para responder olhando o schema:

1. Que nome a coluna da chave estrangeira recebeu? Por quê `autorId` e não `autor`?
2. `obra_categoria` tem `id` próprio? Quais colunas ela tem?
3. Onde apareceu o índice do `isbn`?
4. `criadoEm` virou que tipo no SQLite?

### Passo 4 — Mudar a classe, ver o banco mudar (25 min)

Acrescente à `Obra`:

```ts
@Column({ type: "int", nullable: true })
numeroPaginas: number | null;
```

Salve. O `start:dev` reinicia e o log mostra o `ALTER TABLE`. **Sem nenhum SQL escrito por
você** — é o segundo item da ementa ("atualização do banco de dados a partir das classes")
acontecendo.

Agora tente o que **não** funciona: mude `titulo` para `nullable: false` **depois** de já
haver linhas com título vazio, ou reduza `length` de 200 para 10. Anote o erro.

> Esse limite é exatamente o motivo do M05. O `synchronize` sabe criar e alargar; não sabe
> decidir o que fazer com dado existente que não cabe na nova regra. Migração é onde essa
> decisão fica registrada.

### Passo 5 — Modelar empréstimo (40 min, em duplas)

Agora vocês. `Associado` e `Emprestimo`, com as regras:

- Associado tem nome, e-mail único e data de inscrição.
- Empréstimo liga **um exemplar** a **um associado**, com data de saída, previsão de
  devolução e devolução efetiva (que pode não ter acontecido ainda).
- Apagar um associado com empréstimo em aberto **não pode** funcionar.
- Um exemplar emprestado não pode ser apagado.

Escreva as entidades, suba e confira o schema. Depois, justifique por escrito, em uma linha
cada: todo `nullable`, todo `unique`, todo `onDelete` e todo índice que você criou.

> A justificativa **é** o exercício. Entidade sem justificativa é chute que a turma
> descobre estar errado no M06, quando as consultas começam a doer.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Entity metadata for Obra#autor was not found` | A entidade não está no `forFeature` do módulo |
| `Cannot read properties of undefined (reading 'name')` na inicialização | Importação circular: use `() => Entidade`, nunca a classe direta |
| Coluna não aparece no banco | O `start:dev` não reiniciou, ou falta `@Column()` na propriedade |
| `SQLITE_CONSTRAINT: NOT NULL constraint failed` | Campo obrigatório sem valor; ou você tornou obrigatória uma coluna que já tinha linhas vazias |
| `DataTypeNotSupportedError` | Tipo que o SQLite não tem (`enum` puro). Use `simple-enum` até o M05 |
| Tudo virou `varchar(255)` | Faltou `type`/`length` no `@Column` |
| Apagar autora apagou as obras | Você usou `CASCADE` onde cabia `RESTRICT` |

## ✅ Checklist de saída

- [ ] Cinco entidades: `Autor`, `Obra`, `Categoria`, `Exemplar`, `Associado`, `Emprestimo`
- [ ] O banco foi gerado **a partir das classes**, sem SQL escrito à mão
- [ ] Você viu o `ALTER TABLE` acontecer ao mudar uma classe
- [ ] 1:N e N:N implementadas, com a tabela intermediária conferida no schema
- [ ] Todo `nullable`, `unique`, `onDelete` e índice tem justificativa escrita
- [ ] `logging: true` ligado, e você **leu** o SQL gerado
- [ ] `bibliocom.sqlite` no `.gitignore`
- [ ] Você sabe dizer por que `Exemplar → Obra` é `CASCADE` e `Obra → Autor` é `RESTRICT`

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Relations](https://typeorm.io/relations)
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [Use The Index, Luke — índices na prática](https://use-the-index-luke.com/pt)
