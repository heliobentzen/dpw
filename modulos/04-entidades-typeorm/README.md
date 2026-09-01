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
5. Reconhecer o limite do `synchronize` — o que motiva o M05.

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
| Você escreve menos SQL — e entende menos SQL | O M06 exige ler o SQL gerado antes de aceitar qualquer consulta |
| Consultas ingênuas viram lentidão (problema N+1) | M06 dedica uma seção ao N+1, com medição |
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

**A decisão mais cara é `nullable`.** Coluna que aceita nulo obriga **todo** código que a lê
a tratar a ausência. Torne nulo só o que é genuinamente opcional no mundo real. Para texto
opcional, prefira `default: ""` a `nullable: true`: ter string vazia **e** `null` querendo
dizer "sem valor" é a origem de metade dos `if` defensivos de qualquer sistema.

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

> `CASCADE` escolhido no automático é como apagar uma editora e levar o catálogo junto. A
> pergunta certa é sempre: *"este registro faz sentido sozinho?"*

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
@Column({ length: 13, default: "" })
isbn: string;
```

Indexe o que aparece em `WHERE`, `ORDER BY` ou `JOIN` **com frequência**. Índice não é de
graça: ocupa espaço e deixa a escrita mais lenta. Chave primária e estrangeira já vêm
indexadas.

💼 **No mercado:** modelagem é onde o erro custa mais caro. Um campo mal tipado vira migração
de dados seis meses depois, com o sistema em produção e o cliente perguntando por quê. Em
*code review*, `nullable: true` e `CASCADE` sem justificativa são os dois comentários mais
frequentes.

---

## 🛠️ Roteiro prático (3h)

> 📦 **Instale o Docker antes desta aula** — o PostgreSQL sobe nele, logo no passo 1.
> 🐧 [`ambiente-setup.md`, seção 7](../../docs/ambiente-setup.md#7-postgresql-via-docker-a-partir-do-m04) ·
> 🪟 [`ambiente-setup-windows.md`, passo 7](../../docs/ambiente-setup-windows.md#passo-7--docker-e-postgresql)
> — no Windows o Docker exige o WSL2, então **não deixe para a hora da aula**.

O roteiro constrói **uma entidade por vez**, e cada passo termina com o banco na mão para
conferir. Se um passo falhar, você sabe qual linha foi.

### Passo 1 — Subir o banco e conectar (25 min)

#### 1a. O PostgreSQL

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
docker compose up -d
docker compose ps
```

O `docker-compose.yml` está nos guias de setup. O `-d` (*detached*) devolve o terminal;
sem ele o banco ocupa a janela.

**Deu certo se:** o `docker compose ps` mostra o serviço com `State` em `running`.

#### 1b. Os pacotes

```bash
cd backend
npm install @nestjs/typeorm typeorm pg
```

| Pacote | Para quê |
|---|---|
| `typeorm` | O ORM |
| `@nestjs/typeorm` | A integração: expõe repositórios para injeção |
| `pg` | O driver do PostgreSQL. O ORM fala com o banco através dele |

#### 1c. A variável de conexão

Em `backend/.env`:

```ini
DATABASE_URL=postgres://bibliocom:devpassword@localhost:5432/bibliocom
```

E a chave correspondente em `.env.example`, **sem o valor** — a regra do M03 vale sempre:

```ini
DATABASE_URL=
```

Acrescente ao esquema de validação do M03, em `src/config/esquema-env.ts`:

```ts
DATABASE_URL: z
  .string("DATABASE_URL é obrigatória")
  .startsWith("postgres", "DATABASE_URL deve começar com postgres://"),
```

> Esta linha existe pelo motivo do M03: melhor a aplicação não subir do que subir e falhar
> na primeira consulta, com um erro que não menciona o `.env`.

#### 1d. Ligar o TypeOrmModule

Em `src/app.module.ts`, ao lado do `ConfigModule`:

```ts
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEnv }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,     // ⚠️ só neste módulo — ver M05
      logging: true,         // mostra o SQL gerado. Mantenha ligado
    }),
    AcervoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

| Opção | O que faz |
|---|---|
| `autoLoadEntities: true` | Registra sozinho toda entidade declarada com `forFeature` — evita a lista manual que sempre fica desatualizada |
| `synchronize: true` | Cria e altera tabelas a partir das entidades, a cada boot |
| `logging: true` | **Imprime cada SQL no terminal.** É a única forma de saber o que o ORM está realmente fazendo |

```bash
npm run start:dev
```

**Deu certo se:** a aplicação sobe e o terminal mostra `query: SELECT version()`. Ainda não
há nenhuma entidade, então nenhuma tabela é criada — e é isso mesmo.

⚠️ **Se aparecer `ECONNREFUSED ::1:5432`**, o Docker não está de pé ou a porta é outra.
Confira com `docker compose ps` antes de mexer no código.

### Passo 2 — A primeira entidade, sozinha (25 min)

Uma só, para ver o mecanismo inteiro sem ruído.

`src/acervo/entidades/autor.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
```

| Linha | Decisão |
|---|---|
| `@Entity()` | "Esta classe é uma tabela". Sem este decorator, nada acontece |
| `@PrimaryGeneratedColumn()` | `id` inteiro auto-incrementado |
| `nome` sem `nullable` | Autora **precisa** ter nome. O padrão do TypeORM é `NOT NULL` |
| `nascimento` com `nullable` | Nem toda data de nascimento é conhecida. Aqui o nulo é honesto |
| `biografia` com `default: ""` | Texto opcional. `""` em vez de `null` poupa `if` em todo lugar que exibe |

Registre no `src/acervo/acervo.module.ts`:

```ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Autor } from "./entidades/autor.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Autor])],
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

`forFeature` é o que disponibiliza os repositórios para injeção (M06) — e o que o
`autoLoadEntities` observa. **Entidade fora do `forFeature` é entidade que não existe** para
o TypeORM, e o erro que isso produz não menciona `forFeature`.

Salve e olhe o terminal. Entre as consultas de inspeção, esta linha:

```
query: CREATE TABLE "autor" ("id" SERIAL NOT NULL, "nome" character varying(150) NOT NULL,
"nascimento" date, "biografia" text NOT NULL DEFAULT '',
CONSTRAINT "PK_51d3959df48c82010ae1c4907fb" PRIMARY KEY ("id"))
```

**Leia essa linha com a classe ao lado.** É a ementa acontecendo, e cada decisão que você
tomou está ali: `character varying(150)` veio do `length`, `date` veio do `type`,
`NOT NULL` veio da ausência de `nullable`, `DEFAULT ''` veio do `default`.

**Deu certo se:**

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c "\d autor"
```

mostra as quatro colunas.

> ⚠️ **O `CREATE TABLE` aparece uma vez só.** Na segunda inicialização a tabela já bate com
> a entidade, então não há nada a fazer e o log só traz as consultas de inspeção. Se você
> não viu o `CREATE TABLE`, role o terminal para cima — ele passou.

### Passo 3 — Mudar a classe, ver o banco mudar (15 min)

Acrescente à `Autor`:

```ts
@Column({ length: 60, default: "" })
nacionalidade: string;
```

Salve. O `start:dev` reinicia sozinho e o log mostra:

```
query: ALTER TABLE "autor" ADD "nacionalidade" character varying(60) NOT NULL DEFAULT ''
```

**Sem nenhum SQL escrito por você** — é o segundo item da ementa ("atualização do banco de
dados a partir das classes") acontecendo. Confira com o `\d autor` de novo.

Este é o ciclo que o resto do roteiro repete: **muda a classe, olha o SQL, confere o banco.**

### Passo 4 — A segunda entidade e a primeira relação (30 min)

#### 4a. A entidade `Obra`, ainda sem relação

`src/acervo/entidades/obra.entity.ts`:

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
```

| Trecho | Decisão |
|---|---|
| `anoPublicacao: number \| null` | O tipo TS **acompanha** o `nullable`. Se divergirem, o TypeScript mente para você |
| `@Index()` no `isbn` | Busca por ISBN é frequente no balcão. Ele aparece no log como um `CREATE INDEX` separado |
| `@CreateDateColumn` / `@UpdateDateColumn` | O TypeORM preenche sozinho. Auditoria mínima, custo zero |

Acrescente `Obra` ao `forFeature`. Salve e confira no log: um `CREATE TABLE "obra"` e, logo
depois, um `CREATE INDEX ... ON "obra" ("isbn")` — o índice é um comando à parte.

#### 4b. Ligar as duas

Agora a relação. Na `Obra`:

```ts
import { ManyToOne } from "typeorm";
import { Autor } from "./autor.entity";

  @ManyToOne(() => Autor, (autor) => autor.obras, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  autor: Autor;

  @Column()
  autorId: number;
```

E o outro lado, na `Autor`:

```ts
import { OneToMany } from "typeorm";
import { Obra } from "./obra.entity";

  @OneToMany(() => Obra, (obra) => obra.autor)
  obras: Obra[];
```

| Trecho | O que faz |
|---|---|
| `@ManyToOne` na `Obra` | É este lado que **carrega a chave estrangeira** |
| `@OneToMany` na `Autor` | Não cria coluna nenhuma. Só permite navegar de autora para obras |
| `@Column() autorId` | Declara em TypeScript a coluna que o `@ManyToOne` **já criava**. Não gera nada novo no banco — só deixa de esconder o `autorId` do TypeScript |

> O `autorId` explícito parece redundante e não é. Sem ele, qualquer código que precise do
> id do autor sem carregar a autora inteira acaba escrevendo `(obra as any).autorId` — e
> `any` é onde o TypeScript para de ajudar. O M06 usa esse campo.

Salve e leia o log:

```
query: ALTER TABLE "obra" ADD CONSTRAINT "FK_1fa7f93a22a39f6fc2b0228ec4c"
FOREIGN KEY ("autorId") REFERENCES "autor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
```

**Deu certo se:** `\d obra` mostra a coluna `autorId` e a chave estrangeira com
`ON DELETE RESTRICT`.

Responda, olhando o schema:

1. Por que a coluna se chama `autorId` e não `autor`?
2. O `@OneToMany` da `Autor` criou alguma coluna em `autor`? Por quê?
3. Que nome o TypeORM deu à constraint? De onde vem esse nome?

### Passo 5 — Relação N:N (20 min)

`src/acervo/entidades/categoria.entity.ts`:

```ts
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Obra } from "./obra.entity";

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

E, na `Obra`, o lado **dono** — o que leva o `@JoinTable`:

```ts
  @ManyToMany(() => Categoria, (categoria) => categoria.obras)
  @JoinTable({ name: "obra_categoria" })
  categorias: Categoria[];
```

Acrescente `Categoria` ao `forFeature`, salve e leia:

```
query: CREATE TABLE "obra_categoria" ("obraId" integer NOT NULL, "categoriaId" integer NOT NULL,
CONSTRAINT "PK_9fd0a5c81d237ac86d52ba04278" PRIMARY KEY ("obraId", "categoriaId"))
```

**Deu certo se:** `\d obra_categoria` mostra **duas** colunas e uma chave primária composta.

Repare em três coisas que o log entrega de graça:

| Observação | Por que importa |
|---|---|
| A tabela **não tem `id` próprio** | A chave primária é o par. É isso que impede a mesma obra receber a mesma categoria duas vezes |
| Vieram **dois `CREATE INDEX`**, um por coluna | Sem eles, filtrar por categoria varreria a tabela inteira |
| Nem `Obra` nem `Categoria` ganharam coluna | Numa N:N a ligação mora fora das duas tabelas. É a diferença estrutural para a 1:N |

### Passo 6 — 1:N com `CASCADE`, e por que aqui é diferente (20 min)

A diferença entre **obra** e **exemplar** é o coração do domínio: a biblioteca tem *um*
"Dom Casmurro" no catálogo e *três* volumes na estante.

`src/acervo/entidades/exemplar.entity.ts`:

```ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Obra } from "./obra.entity";

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

  @Column({ type: "enum", enum: EstadoExemplar, default: EstadoExemplar.BOM })
  estado: EstadoExemplar;

  @Column({ type: "boolean", default: true })
  disponivel: boolean;

  @ManyToOne(() => Obra, (obra) => obra.exemplares, {
    nullable: false,
    onDelete: "CASCADE",
  })
  obra: Obra;

  @Column()
  obraId: number;
}
```

E o outro lado, na `Obra`:

```ts
  @OneToMany(() => Exemplar, (exemplar) => exemplar.obra)
  exemplares: Exemplar[];
```

| Decisão | Por quê |
|---|---|
| `tombo` com `unique` | Número de tombo é o identificador físico. Duplicado é erro de catalogação |
| `enum` em vez de string livre | O conjunto de estados é fechado. String livre vira `"Bom"`, `"bom"` e `"BOM"` no mesmo banco |
| `estado` **e** `disponivel` separados | `estado` é a condição **física** do volume; `disponivel` diz se ele está na estante ou emprestado. Um exemplar em bom estado pode estar fora, e um desgastado pode estar disponível |
| `onDelete: "CASCADE"` **aqui** | Um exemplar **não existe** sem a obra. É o caso legítimo de cascata — diferente de `Obra → Autor` |

> O `disponivel` é um campo **derivado**: em tese dá para descobrir se um exemplar está
> emprestado consultando os empréstimos em aberto. Mantê-lo materializado troca uma consulta
> por uma obrigação — manter os dois em sincronia. É por isso que o M06 emprestar e marcar
> indisponível vão na **mesma transação**: separados, eles divergem.

Salve e leia o log. Desta vez vieram **duas** linhas antes do `CREATE TABLE`:

```
query: CREATE TYPE "public"."exemplar_estado_enum" AS ENUM('novo', 'bom', 'desgastado', 'descartado')
query: CREATE TABLE "exemplar" (... "estado" "public"."exemplar_estado_enum" NOT NULL DEFAULT 'bom' ...)
```

O PostgreSQL tem tipo enumerado de verdade: o TypeORM cria o **tipo** primeiro e só depois a
tabela que o usa. Guarde isso — no M05 esse tipo aparece na migração, e alterar um enum
existente é mais chato do que alterar um `varchar`.

**Deu certo se:** `\d exemplar` mostra `estado` com o tipo `exemplar_estado_enum` e a chave
estrangeira com `ON DELETE CASCADE`.

### Passo 7 — O limite do `synchronize` (15 min)

Até aqui tudo funcionou porque as mudanças eram fáceis. Agora provoque o difícil, **com
dado dentro do banco** — que é a única situação em que a diferença aparece.

#### 7a. Colocar dado no banco

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c \
  "INSERT INTO autor (nome, biografia) VALUES ('Machado de Assis', 'Texto bem longo aqui');"
```

#### 7b. Encurtar uma coluna

Na entidade `Autor`, troque o tipo da `biografia`:

```ts
@Column({ type: "varchar", length: 10, default: "" })
biografia: string;
```

Salve e leia o log:

```
query: ALTER TABLE "autor" DROP COLUMN "biografia"
query: ALTER TABLE "autor" ADD "biografia" character varying(10) NOT NULL DEFAULT ''
```

Agora confira o dado:

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT nome, biografia FROM autor;"
```

**A biografia sumiu.** Não houve erro, a aplicação subiu normalmente, e a coluna existe com
o tipo novo — vazia. O `synchronize` não sabe encurtar uma coluna com dado dentro, então
fez o que sabe: apagou e recriou.

#### 7c. Renomear uma coluna

Coloque um texto na `sinopse` da obra 1 e renomeie a propriedade para `resumo` na entidade.
Salve e leia o log:

```
query: ALTER TABLE "obra" RENAME COLUMN "sinopse" TO "resumo"
```

Confira o dado: **ele sobreviveu.** O TypeORM viu uma coluna sumindo e outra do mesmo tipo
aparecendo, e deduziu que era uma renomeação.

#### 7d. A conclusão, que não é a óbvia

| Mudança | O que o `synchronize` fez | Custo |
|---|---|---|
| Renomear coluna | Deduziu e renomeou | Nenhum — **desta vez** |
| Encurtar coluna com dado | Apagou e recriou, vazia | Perda total, **sem aviso** |

A lição não é "o `synchronize` é burro". Ele é razoavelmente esperto — a dedução da
renomeação é um bom palpite. **O problema é que você não sabe qual dos dois comportamentos
vai acontecer antes de rodar**, e um deles apaga dados sem perguntar. A dedução também tem
limite: renomeie duas colunas do mesmo tipo de uma vez e o palpite pode trocar as duas.

> É por isso que existe o M05. Migração não é "o jeito difícil de fazer a mesma coisa": é
> onde a decisão fica **escrita antes de rodar**, revisada em *pull request* e aplicada na
> mesma ordem em toda máquina. Você lê o `ALTER TABLE` e decide se ele pode rodar, em vez
> de descobrir depois o que ele fez.

Desfaça as duas mudanças antes de seguir.

### Passo 8 — Modelar empréstimo (30 min)

Agora é com você, e sem código pronto. `Associado` e `Emprestimo`, com as regras:

- Associado tem nome, e-mail único e data de inscrição.
- Empréstimo liga **um exemplar** a **um associado**, com data de saída, previsão de
  devolução e devolução efetiva (que pode não ter acontecido ainda).
- Apagar um associado com empréstimo em aberto **não pode** funcionar.
- Um exemplar emprestado não pode ser apagado.

Escreva as entidades, registre no `forFeature`, suba e confira o schema com `\d emprestimo`.
Depois, justifique por escrito, em uma linha cada: todo `nullable`, todo `unique`, todo
`onDelete` e todo índice que você criou.

> A justificativa **é** o exercício. Modelagem sem justificativa é chute, e o chute cobra a
> conta no M06, quando as consultas começam a doer.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `ECONNREFUSED ::1:5432` | O contêiner do banco não está de pé. `docker compose ps` |
| `password authentication failed` | `DATABASE_URL` não bate com o `docker-compose.yml` |
| `Entity metadata for Obra#autor was not found` | A entidade não está no `forFeature` do módulo |
| `Cannot read properties of undefined (reading 'name')` na inicialização | Importação circular: use `() => Entidade`, nunca a classe direta |
| Nenhum `CREATE TABLE` no log | A tabela já existe e já bate com a entidade. Não é erro |
| Coluna não aparece no banco | O `start:dev` não reiniciou, ou falta `@Column()` na propriedade |
| `null value in column "x" violates not-null constraint` | Campo obrigatório sem valor; ou você tornou obrigatória uma coluna que já tinha linhas vazias |
| Tudo virou `varchar(255)` | Faltou `type`/`length` no `@Column` |
| Apagar autora apagou as obras | Você usou `CASCADE` onde cabia `RESTRICT` |
| Uma coluna ficou vazia depois de você mudar o tipo | O `synchronize` apagou e recriou. É o passo 7, e é o motivo do M05 |

## ✅ Checklist de saída

- [ ] PostgreSQL rodando em Docker, com `DATABASE_URL` validada no `.env`
- [ ] Seis entidades: `Autor`, `Obra`, `Categoria`, `Exemplar`, `Associado`, `Emprestimo`
- [ ] O banco foi gerado **a partir das classes**, sem SQL escrito à mão
- [ ] Você viu o `ALTER TABLE` acontecer ao mudar uma classe
- [ ] 1:N e N:N implementadas, com a tabela intermediária conferida no `\d`
- [ ] Todo `nullable`, `unique`, `onDelete` e índice tem justificativa escrita
- [ ] `logging: true` ligado, e você **leu** o SQL gerado
- [ ] Você provocou o limite do `synchronize` e anotou o que aconteceu
- [ ] Você sabe dizer por que `Exemplar → Obra` é `CASCADE` e `Obra → Autor` é `RESTRICT`

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Relations](https://typeorm.io/relations)
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [Use The Index, Luke — índices na prática](https://use-the-index-luke.com/pt)
