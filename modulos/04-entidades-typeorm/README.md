# M04 — Entidades: classes que geram o banco

> **CH:** 6h (3h teóricas · 3h práticas) · **Semana 4** · **Pré-requisito:** M03

O módulo central da ementa: *"classes para geração automática do banco de dados"*. Aqui uma
classe TypeScript vira uma tabela, e a relação entre classes vira chave estrangeira.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 5, 8, 12 e 18 — em
> que a gente para de digitar e pensa — mais as explicações dentro de cada etapa. Conceito
> chega quando o código pede, e não antes.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que um ORM resolve e o que ele cobra em troca.
2. Escrever entidades com `@Entity()` e ver o banco nascer delas.
3. Modelar relações 1:N e N:N, escolhendo o comportamento de exclusão.
4. Justificar cada `nullable`, cada `unique` e cada índice que você criar.
5. Reconhecer o limite do `synchronize` — o que motiva o M05.

## 🧭 O que você vai construir

Seis tabelas, nenhuma linha de SQL escrita por você:

```
autor ──1:N──▶ obra ──N:N──▶ categoria
                 │
                 └──1:N──▶ exemplar ──1:N──▶ emprestimo ◀──1:N── associado
```

Ao final, `\dt` no PostgreSQL lista essas tabelas mais a intermediária `obra_categoria`, e
cada coluna delas terá saído de uma decisão que você tomou e sabe justificar.

## 📋 Como este módulo funciona

Mesmo formato do M03: **uma entidade por vez**, e cada etapa termina com o banco na mão para
conferir. Se um passo falhar, você sabe qual linha foi.

| Parte | O que é |
| --- | --- |
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

> 🪟 Os comandos são os mesmos nos três sistemas. O `psql` roda **dentro do contêiner**, por
> `docker compose exec`, então não é preciso instalar cliente de PostgreSQL na sua máquina.

### As dezoito etapas

| # | Etapa | Min | O que entra |
| --- | --- | --- | --- |
| 1 | [Subir o banco](#etapa-1--subir-o-banco-15-min) | 15 | Docker Compose |
| 2 | [Instalar o TypeORM](#etapa-2--instalar-o-typeorm-10-min) | 10 | ORM, driver |
| 3 | [A variável de conexão](#etapa-3--a-variável-de-conexão-15-min) | 15 | `DATABASE_URL`, e uma armadilha |
| 4 | [Ligar o TypeOrmModule](#etapa-4--ligar-o-typeormmodule-15-min) | 15 | `forRoot`, `synchronize`, `logging` |
| 5 | [**O que um ORM resolve**](#etapa-5--o-que-um-orm-resolve-20-min) | 20 | **o porquê do ORM** |
| 6 | [A primeira entidade](#etapa-6--a-primeira-entidade-25-min) | 25 | `@Entity`, `@Column`, `forFeature` |
| 7 | [Ler o `CREATE TABLE`](#etapa-7--ler-o-create-table-15-min) | 15 | do decorator ao SQL |
| 8 | [**Cada opção é uma decisão**](#etapa-8--cada-opção-é-uma-decisão-25-min) | 25 | **`nullable`, `unique`, `default`** |
| 9 | [Mudar a classe, ver o `ALTER`](#etapa-9--mudar-a-classe-ver-o-alter-15-min) | 15 | o ciclo do módulo |
| 10 | [A segunda entidade](#etapa-10--a-segunda-entidade-20-min) | 20 | datas automáticas |
| 11 | [A primeira relação: 1:N](#etapa-11--a-primeira-relação-1n-30-min) | 30 | `@ManyToOne`, `@OneToMany`, FK |
| 12 | [**`onDelete` é decisão de negócio**](#etapa-12--ondelete-é-decisão-de-negócio-20-min) | 20 | **`RESTRICT`, `CASCADE`, `SET NULL`** |
| 13 | [Relação N:N](#etapa-13--relação-nn-25-min) | 25 | `@ManyToMany`, `@JoinTable` |
| 14 | [1:N com `CASCADE`](#etapa-14--1n-com-cascade-25-min) | 25 | `enum`, campo derivado |
| 15 | [Índices](#etapa-15--índices-15-min) | 15 | `@Index` |
| 16 | [O limite do `synchronize`](#etapa-16--o-limite-do-synchronize-25-min) | 25 | dois experimentos destrutivos |
| 17 | [Modelar empréstimo](#etapa-17--modelar-empréstimo-35-min) | 35 | por sua conta |
| 18 | [O que o ORM cobra](#etapa-18--o-que-o-orm-cobra-10-min) | 10 | fecho |

> 📦 **Instale o Docker antes desta aula** — o PostgreSQL sobe nele, logo na etapa 1.
> 🐧 [`ambiente-setup.md`, seção 7](../../docs/ambiente-setup.md#7-postgresql-via-docker-a-partir-do-m04) ·
> 🪟 [`ambiente-setup-windows.md`, passo 7](../../docs/ambiente-setup-windows.md#passo-7--docker-e-postgresql)
> — no Windows o Docker exige o WSL2, então **não deixe para a hora da aula**.

---

## Etapa 1 — Subir o banco (15 min)

**Faça:**

```powershell
cd C:\dev\bibliocom
```

```powershell
docker compose up -d
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `docker compose` | Lê o `docker-compose.yml` da pasta e sobe os serviços descritos nele |
| `up` | Cria e inicia os contêineres |
| `-d` | *detached*: devolve o terminal. Sem ele, o banco ocupa a janela e você precisa de outra |

O `docker-compose.yml` foi criado no guia de setup e descreve um serviço chamado `db`, com
PostgreSQL 16, usuário `bibliocom` e um volume para os dados sobreviverem a reinícios.

**Rode:**

```powershell
docker compose ps
```

**Deu certo se:** aparece uma linha com o serviço `db` e `State` em `running`.

> Na primeira vez o Docker baixa a imagem do PostgreSQL — uns 80 MB. Depois é instantâneo.

**Confira que dá para falar com ele:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\dt"
```

| Trecho | O que faz |
| --- | --- |
| `exec db` | Executa um comando **dentro** do contêiner chamado `db` |
| `psql` | O cliente de linha de comando do PostgreSQL, que já vem na imagem |
| `-U bibliocom -d bibliocom` | Usuário e banco, ambos definidos no `docker-compose.yml` |
| `-c "\dt"` | Roda um comando e sai. `\dt` lista as tabelas |

**Deu certo se:** responde `Did not find any relations.` — o banco existe e está vazio. É
exatamente o que queremos: as tabelas vão nascer das suas classes.

---

## Etapa 2 — Instalar o TypeORM (10 min)

**Faça:**

```powershell
cd backend
```

```powershell
npm install @nestjs/typeorm typeorm pg
```

**Linha a linha:**

| Pacote | Para quê |
| --- | --- |
| `typeorm` | O ORM propriamente dito: quem traduz classe em tabela e método em SQL |
| `@nestjs/typeorm` | A ponte com o Nest. É ela que permite injetar repositórios pelo construtor, como no M03 |
| `pg` | O **driver** do PostgreSQL: quem realmente fala o protocolo do banco pela rede. O TypeORM não conversa com banco nenhum sozinho |

> Três pacotes, três papéis distintos. Se você trocasse o PostgreSQL por MySQL, só o `pg`
> mudaria — os outros dois continuariam iguais. Guarde isso para a etapa 18.

**Deu certo se:** o comando termina sem erro e os três aparecem em `dependencies` no
`package.json`.

---

## Etapa 3 — A variável de conexão (15 min)

O endereço do banco não pode estar escrito no código: ele muda entre a sua máquina e o
servidor. Vai para o `.env`, como o M03 ensinou.

**Faça:** em `backend\.env`, acrescente:

```ini
DATABASE_URL=postgres://bibliocom:devpassword@localhost:5432/bibliocom
```

**Linha a linha** — a URL tem cinco partes:

| Parte | Valor | O que é |
| --- | --- | --- |
| esquema | `postgres://` | Qual banco. É o que o TypeORM lê para escolher o driver |
| usuário e senha | `bibliocom:devpassword` | Definidos no `docker-compose.yml` |
| host | `localhost` | A sua máquina. O contêiner publicou a porta nela |
| porta | `5432` | A porta padrão do PostgreSQL |
| banco | `/bibliocom` | Qual banco dentro do servidor. Um servidor hospeda vários |

E a chave correspondente em `.env.example`, **sem o valor** — a regra do M03 vale sempre:

```ini
DATABASE_URL=
```

**Faça:** acrescente ao esquema de validação do M03, em `src\config\esquema-env.ts`:

```ts
DATABASE_URL: z
  .string("DATABASE_URL é obrigatória")
  .startsWith("postgres", "DATABASE_URL deve começar com postgres://"),
```

> Esta linha existe pelo motivo do M03: melhor a aplicação não subir do que subir e falhar
> na primeira consulta, com um erro que não menciona o `.env`.

### ⚠️ E ela não é opcional — é uma armadilha silenciosa

O `validate` do `ConfigModule` não apenas **confere** as variáveis: ele **substitui** o
conjunto delas pelo que o seu esquema devolveu. Variável que não está no esquema
simplesmente **deixa de existir** para a aplicação.

Se você esquecer esta linha, acontece isto:

```
o .env tem DATABASE_URL  →  o esquema não a declara  →  o validate a descarta
→  o TypeORM recebe undefined  →  erro:
   "no PostgreSQL user name specified in startup packet"
```

A mensagem não menciona `.env`, nem esquema, nem `validate`, nem `DATABASE_URL`. **Guarde
este sintoma** — ele custa meia hora de quem não o conhece.

---

## Etapa 4 — Ligar o TypeOrmModule (15 min)

**Faça:** em `src\app.module.ts`, ao lado do `ConfigModule`:

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

**Linha a linha:**

| Opção | O que faz |
| --- | --- |
| `forRoot` | Mesma convenção do `ConfigModule` no M03: "configure este módulo aqui, uma vez só" |
| `type: "postgres"` | Diz ao TypeORM qual dialeto falar. É o que faz ele escolher o driver `pg` |
| `url: process.env.DATABASE_URL` | O endereço da etapa 3. Repare que a **ordem importa**: o `ConfigModule` vem antes na lista, e é ele que carrega o `.env` para dentro do `process.env` |
| `autoLoadEntities: true` | Registra sozinho toda entidade declarada com `forFeature` — evita a lista manual que sempre fica desatualizada |
| `synchronize: true` | Cria e altera tabelas a partir das entidades, **a cada boot** |
| `logging: true` | **Imprime cada SQL no terminal.** É a única forma de saber o que o ORM está realmente fazendo |

> ⚠️ **`synchronize: true` em produção apaga dados.** Ele altera colunas para casar com a
> entidade, sem perguntar e sem backup. Usamos neste módulo porque o banco é descartável e o
> foco é ver a classe virar tabela; a etapa 16 mostra o estrago que ele faz, e o M05 existe
> justamente para tirá-lo do caminho.

**Rode:**

```powershell
npm run start:dev
```

**Deu certo se:** a aplicação sobe e o terminal mostra `query: SELECT version()`. Ainda não
há nenhuma entidade, então **nenhuma tabela é criada** — e é isso mesmo.

⚠️ **Se aparecer `ECONNREFUSED ::1:5432`**, o contêiner não está de pé ou a porta é outra.
Confira com `docker compose ps` antes de mexer no código.

---

## Etapa 5 — O que um ORM resolve (20 min)

Pare o teclado. Você acabou de conectar a aplicação a um banco e ainda não consultou nada.
Antes de escrever a primeira entidade, vale entender o que exatamente essa peça vai fazer
por você — e o que ela vai cobrar.

### Como seria sem ORM

```ts
const { rows } = await pool.query(
  "SELECT id, titulo, ano_publicacao FROM obra WHERE id = $1", [id]
);
const obra = rows[0];        // tipo: any. O TypeScript não sabe nada sobre isto.
```

Funciona. E tem três problemas que só aparecem quando o projeto cresce:

| Problema | Como se manifesta |
| --- | --- |
| **Sem tipo** | `obra.titolo`, com o erro de digitação, **compila**. O TypeScript não tem como saber o que aquele `SELECT` devolve. O erro aparece em produção, como `undefined` na tela |
| **SQL espalhado** | A mesma consulta aparece em cinco arquivos, com variações sutis. Alguém acrescenta uma coluna e corrige quatro das cinco |
| **Esquema em dois lugares** | A tabela está no banco, a expectativa está no código, e **nada garante que combinem**. A coluna `ano_publicacao` foi renomeada no banco? O código só descobre ao rodar |

### O que o ORM faz

Ele torna a classe a **única fonte de verdade**: dela saem o tipo, a consulta e a tabela.

```ts
const obra = await this.repo.findOneBy({ id });   // tipo: Obra | null
```

Os três problemas desaparecem de uma vez:

```
                    ┌──────────────┐
                    │   class Obra │
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        o TIPO que    a TABELA no   a CONSULTA
        o TS confere    banco        gerada
```

`obra.titolo` passa a ser erro de compilação. A consulta nasce da classe, então não há como
divergir dela. E a tabela **também** nasce da classe — que é o item da ementa deste módulo.

### O caminho concreto

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

Duas formas de o TypeORM aplicar isso no banco — e você vai usar as duas, uma por módulo:

| Modo | Como funciona | Quando |
| --- | --- | --- |
| `synchronize: true` | A cada inicialização, compara entidades × banco e **altera a tabela** | **Só em desenvolvimento**, e só neste módulo |
| Migrações | Você gera um arquivo versionado com o `ALTER TABLE` e o aplica de propósito | Sempre que houver dado que importa. É o M05 |

O que o ORM **cobra** em troca fica para a etapa 18, quando você já tiver visto o que ele
entrega. Agora, a primeira entidade.

---

## Etapa 6 — A primeira entidade (25 min)

Uma só, para ver o mecanismo inteiro sem ruído.

**Faça:** crie `src\acervo\entidades\autor.entity.ts`:

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

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@Entity()` | "Esta classe é uma tabela." Sem este decorator, a classe é só uma classe e nada acontece |
| `@PrimaryGeneratedColumn()` | Chave primária inteira, gerada pelo banco a cada inserção |
| `@Column({ length: 150 })` | Uma coluna. O `length` vira `varchar(150)` |
| `nascimento: string \| null` | O tipo TypeScript **acompanha** o `nullable: true`. Se divergirem, o TypeScript mente para você |
| `type: "date"` | Sem isto o TypeORM inferiria do tipo TS. `string` viraria `varchar`, e você perderia comparação de datas no banco |
| `type: "text"` | Texto sem limite. Diferente de `varchar(n)`, que tem teto |

> São **decorators** de novo — o mesmo mecanismo do `@Controller` e do `@Get` do M03, lido
> por outra ferramenta. Segundo uso do mesmo conceito; o terceiro vem no M07.

**Faça:** registre no `src\acervo\acervo.module.ts`:

```ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Autor } from "./entidades/autor.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Autor])],
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

| Trecho | O que faz |
| --- | --- |
| `forFeature([Autor])` | Declara **quais entidades este módulo usa**. É o que disponibiliza os repositórios para injeção no M06 |
| `.js` no import | A regra do M03, etapa 5a: import de arquivo seu termina em `.js` |

**Entidade fora do `forFeature` é entidade que não existe** para o TypeORM — e o erro que
isso produz não menciona `forFeature`. É o primo do `can't resolve dependencies` do M03.

**Deu certo se:** você salvou e o `start:dev` reiniciou sem erro. O que aconteceu no banco é
a próxima etapa.

---

## Etapa 7 — Ler o `CREATE TABLE` (15 min)

**Rode:** role o terminal do `start:dev` para cima. Entre as consultas de inspeção, esta
linha apareceu:

```
query: CREATE TABLE "autor" ("id" SERIAL NOT NULL, "nome" character varying(150) NOT NULL,
"nascimento" date, "biografia" text NOT NULL DEFAULT '',
CONSTRAINT "PK_51d3959df48c82010ae1c4907fb" PRIMARY KEY ("id"))
```

**Leia essa linha com a classe ao lado.** É a ementa acontecendo, e cada decisão que você
tomou está ali:

| No SQL | Veio de |
| --- | --- |
| `"autor"` | O nome da classe, em minúsculas. O TypeORM converte por convenção |
| `SERIAL NOT NULL` + `PRIMARY KEY` | `@PrimaryGeneratedColumn()` |
| `character varying(150)` | `length: 150` |
| `NOT NULL` no `nome` | A **ausência** de `nullable`. O padrão do TypeORM é obrigatório |
| `date` sem `NOT NULL` | `type: "date", nullable: true` |
| `text NOT NULL DEFAULT ''` | `type: "text", default: ""` |
| `PK_51d3959d…` | Nome gerado pelo TypeORM. Feio e **propositalmente estável** — é assim que o M05 consegue derrubar exatamente a constraint certa |

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d autor"
```

**Deu certo se:** aparecem as quatro colunas, com os tipos da tabela acima.

> ⚠️ **O `CREATE TABLE` aparece uma vez só.** Na segunda inicialização a tabela já bate com a
> entidade, então não há nada a fazer e o log só traz consultas de inspeção. Se você não viu
> o `CREATE TABLE`, ele passou — role para cima ou derrube e recrie o banco.

---

## Etapa 8 — Cada opção é uma decisão (25 min)

Você escreveu quatro colunas e tomou quatro decisões sem talvez perceber. Esta etapa é para
percebê-las, porque são elas que separam modelagem de digitação.

```ts
@Column({ type: "varchar", length: 200, nullable: false, unique: true, default: "" })
```

| Opção | A pergunta que ela responde |
| --- | --- |
| `type` | Que tipo de coluna? Sem isto, o TypeORM infere do tipo TS — e `number` vira `integer`, o que **quebra valores decimais** |
| `length` | Qual o limite? `varchar(200)` é uma **regra de negócio**, não detalhe técnico: alguém decidiu que título de obra cabe em 200 caracteres |
| `nullable` | Este dado pode não existir? |
| `unique` | Pode repetir? |
| `default` | O que vale quando ninguém informou? |

### A decisão mais cara é `nullable`

Coluna que aceita nulo obriga **todo** código que a lê a tratar a ausência. Um `nullable`
descuidado se paga em `if` espalhados por toda a aplicação, para sempre.

Compare as duas colunas que você escreveu:

| Coluna | Escolha | Por quê |
| --- | --- | --- |
| `nascimento` | `nullable: true` | Nem toda data de nascimento é conhecida. **Aqui o nulo é honesto**: ele significa "não sabemos", que é diferente de qualquer data |
| `biografia` | `default: ""` | Texto opcional. Aqui o nulo seria **redundante**: string vazia já significa "sem biografia" |

**A regra:** para texto opcional, prefira `default: ""` a `nullable: true`. Ter string vazia
**e** `null` querendo dizer a mesma coisa é a origem de metade dos `if` defensivos de
qualquer sistema — e de bugs em que `if (autor.biografia)` funciona num registro e falha no
outro.

Torne nulo só o que é **genuinamente opcional no mundo real**, e saiba dizer o que o nulo
significa naquela coluna.

**Exercite agora**, por escrito, antes de seguir. Para cada dado, qual `@Column`?

| Dado | `type` | `nullable`? | `default`? |
| --- | --- | --- | --- |
| CPF do associado | | | |
| Valor da multa por atraso | | | |
| Data de devolução efetiva | | | |
| Aceita receber avisos por e-mail | | | |

> Duas pegadinhas: dinheiro **nunca** é `float` (arredondamento binário come centavos — use
> `decimal`), e "data de devolução efetiva" é o caso raro em que `nullable` é a resposta
> certa, porque `null` significa "ainda não devolveu". O exercício E04.1 tem mais dez.

---

## Etapa 9 — Mudar a classe, ver o `ALTER` (15 min)

Este é o ciclo que o resto do módulo repete: **muda a classe, olha o SQL, confere o banco.**

**Faça:** acrescente à `Autor`:

```ts
@Column({ length: 60, default: "" })
nacionalidade: string;
```

Salve. O `start:dev` reinicia sozinho e o log mostra:

```
query: ALTER TABLE "autor" ADD "nacionalidade" character varying(60) NOT NULL DEFAULT ''
```

**Sem nenhum SQL escrito por você.** É o segundo item da ementa acontecendo — *"atualização
do banco de dados a partir das classes"*.

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d autor"
```

**Deu certo se:** a coluna `nacionalidade` está lá.

> Repare no `DEFAULT ''`: sem ele, uma coluna `NOT NULL` nova falharia se já houvesse linhas
> — não haveria o que pôr nelas. O `default` da entidade é o que torna a mudança possível.
> Isso volta no M05, e lá vale dado de verdade.

---

## Etapa 10 — A segunda entidade (20 min)

**Faça:** crie `src\acervo\entidades\obra.entity.ts` — ainda **sem relação nenhuma**:

```ts
import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

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

**Linha a linha** — só o que é novo:

| Trecho | O que faz |
| --- | --- |
| `anoPublicacao: number \| null` | Obra sem ano conhecido existe. E o tipo TS acompanha o `nullable`, como na etapa 8 |
| `@CreateDateColumn()` | O TypeORM preenche na inserção e **nunca mais altera** |
| `@UpdateDateColumn()` | O TypeORM atualiza a cada `save`. Você não escreve uma linha para isso |
| `anoPublicacao`, `criadoEm` | Nomes em *camelCase* viram colunas em *camelCase* entre aspas no PostgreSQL. Por isso o `psql` exige `"anoPublicacao"` com aspas nas consultas à mão |

> `@CreateDateColumn` e `@UpdateDateColumn` são **auditoria mínima a custo zero**: saber
> quando um registro nasceu e quando mudou pela última vez resolve metade das perguntas de
> suporte, e você não paga nada por elas.

**Faça:** acrescente `Obra` ao `forFeature` do `AcervoModule`.

**Deu certo se:** o log traz um `CREATE TABLE "obra"` com as sete colunas, e
`\d obra` as confirma. Repare que `criadoEm` virou `TIMESTAMP NOT NULL DEFAULT now()`.

---

## Etapa 11 — A primeira relação: 1:N (30 min)

Uma autora tem muitas obras; cada obra tem uma autora. É a relação mais comum que existe.

### 11a. O lado que carrega a chave

**Faça:** na `Obra`:

```ts
import { ManyToOne } from "typeorm";
import { Autor } from "./autor.entity.js";

  @ManyToOne(() => Autor, (autor) => autor.obras, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  autor: Autor;

  @Column()
  autorId: number;
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@ManyToOne` | "Muitas obras para uma autora". **É este lado que carrega a chave estrangeira** |
| `() => Autor` | Uma função, não a classe direto. Os dois arquivos se referenciam, e a função adia a resolução — sem ela, dá erro de importação circular |
| `(autor) => autor.obras` | Aponta o **outro lado** da relação. É o que permite navegar nos dois sentidos |
| `nullable: false` | Obra sem autora não existe no nosso domínio |
| `onDelete: "RESTRICT"` | O que acontece com as obras quando a autora é apagada — assunto da etapa 12 |
| `@Column() autorId` | Declara em TypeScript a coluna que o `@ManyToOne` **já criava** |

### 11b. O outro lado

**Faça:** na `Autor`:

```ts
import { OneToMany } from "typeorm";
import { Obra } from "./obra.entity.js";

  @OneToMany(() => Obra, (obra) => obra.autor)
  obras: Obra[];
```

| Trecho | O que faz |
| --- | --- |
| `@OneToMany` | **Não cria coluna nenhuma.** Só permite navegar de autora para obras |
| `obras: Obra[]` | Um array. Ele vem vazio até você pedir a relação explicitamente — assunto do M06 |

### 11c. Por que declarar o `autorId` se ele já existia

Parece redundante e não é. Sem essa linha, a coluna existe **no banco** mas não existe **no
TypeScript** — e qualquer código que precise do id da autora sem carregar a autora inteira
acaba escrevendo `(obra as any).autorId`.

`any` é onde o TypeScript para de ajudar: some o autocompletar, some a checagem, e o erro de
digitação volta a ser problema de produção. O M06 usa esse campo, e vai usá-lo com tipo.

**Rode:** salve e leia o log:

```
query: ALTER TABLE "obra" ADD "autorId" integer NOT NULL
query: ALTER TABLE "obra" ADD CONSTRAINT "FK_1fa7f93a22a39f6fc2b0228ec4c"
FOREIGN KEY ("autorId") REFERENCES "autor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
```

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d obra"
```

**Deu certo se:** a coluna `autorId` está lá e, no rodapé, aparece a chave estrangeira com
`ON DELETE RESTRICT`.

**Responda, olhando o schema:**

1. Por que a coluna se chama `autorId` e não `autor`?
2. O `@OneToMany` da `Autor` criou alguma coluna em `autor`? Por quê?
3. Se você apagasse a linha `@Column() autorId`, a coluna sumiria do banco?

---

## Etapa 12 — `onDelete` é decisão de negócio (20 min)

Você escreveu `onDelete: "RESTRICT"` na etapa anterior sem discutir. Agora discuta — porque
essa é a linha que decide o que acontece com o acervo quando alguém aperta "excluir".

**As três opções:**

| Valor | O que o banco faz | Quando é a resposta certa |
| --- | --- | --- |
| `RESTRICT` | **Impede** apagar a autora enquanto houver obras dela | **Padrão sensato.** Erro alto é melhor que perda silenciosa |
| `CASCADE` | Apaga as obras junto | Só quando o filho **não existe** sem o pai |
| `SET NULL` | Zera a referência, mantém a obra | Quando o vínculo é genuinamente opcional |

**A pergunta que decide:** *"este registro faz sentido sozinho?"*

- Uma obra faz sentido sem autora? Sim — a obra continua existindo no mundo, só perdeu o
  vínculo no seu sistema. Logo, **não** é `CASCADE`.
- Um exemplar faz sentido sem a obra dele? Não — "o volume 3 de nada" não significa coisa
  alguma. Logo, **é** `CASCADE`. É o caso da etapa 14.

> `CASCADE` escolhido no automático é como apagar uma editora e levar o catálogo junto. E o
> pior é que funciona: não há erro, não há aviso, e ninguém descobre até alguém procurar um
> livro que sumiu.

⚠️ **Uma justificativa técnica não vale.** "Usei `CASCADE` para não dar erro de chave
estrangeira" é exatamente o raciocínio invertido: o erro estava lá **para** te avisar de que
você ia apagar algo que importa. A justificativa tem de ser de negócio.

**Anote, por escrito**, para as relações que este módulo vai criar:

| Relação | `onDelete` | Justificativa **de negócio** |
| --- | --- | --- |
| `Obra` → `Autor` | `RESTRICT` | |
| `Exemplar` → `Obra` | | |
| `Emprestimo` → `Exemplar` | | |
| `Emprestimo` → `Associado` | | |

Você vai precisar dessas respostas na etapa 17.

---

## Etapa 13 — Relação N:N (25 min)

Uma obra tem várias categorias; uma categoria tem várias obras. Nenhum dos dois lados
consegue guardar a referência numa coluna — e é aí que entra uma terceira tabela.

**Faça:** crie `src\acervo\entidades\categoria.entity.ts`:

```ts
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Obra } from "./obra.entity.js";

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

**Faça:** na `Obra`, o lado **dono** — o que leva o `@JoinTable`:

```ts
import { JoinTable, ManyToMany } from "typeorm";
import { Categoria } from "./categoria.entity.js";

  @ManyToMany(() => Categoria, (categoria) => categoria.obras)
  @JoinTable({ name: "obra_categoria" })
  categorias: Categoria[];
```

| Trecho | O que faz |
| --- | --- |
| `@ManyToMany` | Declara a relação nos dois lados |
| `@JoinTable` | **Vai em um lado só** — o "dono" — e é ele que cria a tabela intermediária |
| `{ name: "obra_categoria" }` | Sem isto o TypeORM inventa um nome. Nomear é melhor: você vai ler esse nome em log e em migração |
| `unique: true` no `nome` | Duas categorias "Romance" seriam erro de cadastro, não dado legítimo |

**Faça:** acrescente `Categoria` ao `forFeature`, salve e leia:

```
query: CREATE TABLE "obra_categoria" ("obraId" integer NOT NULL, "categoriaId" integer NOT NULL,
CONSTRAINT "PK_9fd0a5c81d237ac86d52ba04278" PRIMARY KEY ("obraId", "categoriaId"))
query: CREATE INDEX "IDX_b351e0d325bff14c7669fbce87" ON "obra_categoria" ("obraId")
query: CREATE INDEX "IDX_b727e68cd375f5c721d60a024c" ON "obra_categoria" ("categoriaId")
```

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d obra_categoria"
```

**Deu certo se:** a tabela tem **duas** colunas e uma chave primária composta.

**Três coisas que o log entregou de graça:**

| Observação | Por que importa |
| --- | --- |
| A tabela **não tem `id` próprio** | A chave primária é o **par**. É isso que impede a mesma obra receber a mesma categoria duas vezes — a regra está no banco, não num `if` |
| Vieram **dois `CREATE INDEX`**, um por coluna | Sem eles, "quais obras desta categoria" varreria a tabela inteira |
| Nem `obra` nem `categoria` ganharam coluna | Numa N:N a ligação mora **fora** das duas tabelas. É a diferença estrutural para a 1:N da etapa 11 |

> **Quando a N:N deixa de servir:** se a ligação precisar de dados próprios — *desde quando*
> uma obra está numa categoria, *quem* a classificou —, não há onde pôr. Aí você cria uma
> entidade própria com dois `@ManyToOne`. É exatamente o caso de `Emprestimo`, que liga
> exemplar e associado **e** carrega datas. Guarde para a etapa 17.

---

## Etapa 14 — 1:N com `CASCADE` (25 min)

A diferença entre **obra** e **exemplar** é o coração do domínio: a biblioteca tem *um*
"Dom Casmurro" no catálogo e *três* volumes na estante.

**Faça:** crie `src\acervo\entidades\exemplar.entity.ts`:

```ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Obra } from "./obra.entity.js";

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

**Faça:** o outro lado, na `Obra`:

```ts
import { OneToMany } from "typeorm";
import { Exemplar } from "./exemplar.entity.js";

  @OneToMany(() => Exemplar, (exemplar) => exemplar.obra)
  exemplares: Exemplar[];
```

**Linha a linha:**

| Decisão | Por quê |
| --- | --- |
| `tombo` com `unique` | O número de tombo é o identificador **físico** do volume. Duplicado é erro de catalogação, e o banco deve recusar |
| `enum` em vez de texto livre | O conjunto de estados é fechado. Texto livre vira `"Bom"`, `"bom"` e `"BOM"` no mesmo banco, e aí nenhum relatório fecha |
| `estado` **e** `disponivel` separados | `estado` é a condição **física** do volume; `disponivel` diz se ele está na estante ou emprestado. Um exemplar em bom estado pode estar fora, e um desgastado pode estar disponível |
| `onDelete: "CASCADE"` **aqui** | Aplicando o critério da etapa 12: um exemplar **não existe** sem a obra. É o caso legítimo de cascata |

> **Sobre o `disponivel`:** ele é um campo **derivado** — em tese dá para descobrir se um
> exemplar está emprestado consultando os empréstimos em aberto. Mantê-lo materializado troca
> uma consulta por uma **obrigação**: manter os dois em sincronia. É por isso que, no M06,
> emprestar e marcar indisponível vão na **mesma transação**. Separados, eles divergem — e o
> sintoma é dois leitores aparecendo com o mesmo volume na mão.

**Rode:** salve e leia o log. Desta vez vieram **duas** linhas antes do `CREATE TABLE`:

```
query: CREATE TYPE "public"."exemplar_estado_enum" AS ENUM('novo', 'bom', 'desgastado', 'descartado')
query: CREATE TABLE "exemplar" (... "estado" "public"."exemplar_estado_enum" NOT NULL DEFAULT 'bom' ...)
```

O PostgreSQL tem **tipo enumerado de verdade**: o TypeORM cria o *tipo* primeiro e só depois
a tabela que o usa — a coluna não pode referenciar um tipo que ainda não existe.

Guarde isso: no M05 esse `CREATE TYPE` aparece na migração, e alterar um enum existente é
bem mais chato do que alterar um `varchar`.

**Deu certo se:** `\d exemplar` mostra `estado` com o tipo `exemplar_estado_enum` e a chave
estrangeira com `ON DELETE CASCADE`.

---

## Etapa 15 — Índices (15 min)

O banco varre a tabela inteira quando não há índice. Com 50 registros ninguém nota; com 50
mil, a tela trava.

**Faça:** na `Obra`, acrescente o decorator acima do `isbn`:

```ts
import { Index } from "typeorm";

  @Index()
  @Column({ length: 13, default: "" })
  isbn: string;
```

**Rode:** salve e leia:

```
query: CREATE INDEX "IDX_825ff861a4d720c3dce9c2aa54" ON "obra" ("isbn")
```

**Deu certo se:** é um comando **separado** do `CREATE TABLE`. Índice não é parte da tabela;
é uma estrutura à parte que aponta para ela.

**A regra:** indexe o que aparece em `WHERE`, `ORDER BY` ou `JOIN` **com frequência**.

| Fato | Consequência |
| --- | --- |
| Índice ocupa espaço | Uma tabela pode ter mais índice que dado |
| Índice deixa a **escrita** mais lenta | Cada `INSERT` atualiza a tabela **e** todos os índices dela |
| Chave primária e estrangeira **já vêm indexadas** | Você não precisa declará-las de novo — e declarar cria um índice duplicado, que só custa |

Por que o `isbn` merece um: busca por ISBN é o que o balcão faz o dia inteiro, e a coluna não
é chave de nada — então ninguém a indexou por você.

> Índice é a otimização mais fácil de errar por excesso. A pergunta não é "esta coluna pode
> ser buscada?", é "**esta coluna é buscada com frequência?**". O M06 mede a diferença com o
> banco cheio, em vez de supor.

---

## Etapa 16 — O limite do `synchronize` (25 min)

Até aqui tudo funcionou porque as mudanças eram fáceis: coluna nova, tabela nova. Agora
provoque o difícil — **com dado dentro do banco**, que é a única situação em que a diferença
aparece.

### 16a. Colocar dado

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "INSERT INTO autor (nome, biografia) VALUES ('Machado de Assis', 'Texto bem longo aqui');"
```

### 16b. Encurtar uma coluna

**Faça:** na `Autor`, troque o tipo da `biografia`:

```ts
@Column({ type: "varchar", length: 10, default: "" })
biografia: string;
```

Salve e leia o log:

```
query: ALTER TABLE "autor" DROP COLUMN "biografia"
query: ALTER TABLE "autor" ADD "biografia" character varying(10) NOT NULL DEFAULT ''
```

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT nome, biografia FROM autor;"
```

**Deu certo se:** a biografia **sumiu**.

Não houve erro. A aplicação subiu normalmente. A coluna existe, com o tipo novo, vazia. O
`synchronize` não sabe encurtar uma coluna com dado dentro, então fez o que sabe: apagou e
recriou.

### 16c. Renomear uma coluna

**Faça:** ponha um texto na `sinopse` de alguma obra e renomeie a propriedade para `resumo`
na entidade. Salve e leia:

```
query: ALTER TABLE "obra" RENAME COLUMN "sinopse" TO "resumo"
```

**Deu certo se:** o dado **sobreviveu**. O TypeORM viu uma coluna sumindo e outra do mesmo
tipo aparecendo, e deduziu que era uma renomeação.

### 16d. A conclusão, que não é a óbvia

| Mudança | O que o `synchronize` fez | Custo |
| --- | --- | --- |
| Renomear coluna | Deduziu e renomeou | Nenhum — **desta vez** |
| Encurtar coluna com dado | Apagou e recriou, vazia | Perda total, **sem aviso** |

A lição não é "o `synchronize` é burro". Ele é razoavelmente esperto — deduzir a renomeação é
um bom palpite, e muita ferramenta não faz isso.

**O problema é que você não sabe qual dos dois comportamentos vai receber antes de rodar**, e
um deles apaga dados sem perguntar. A dedução também tem limite: renomeie duas colunas do
mesmo tipo de uma vez e o palpite pode trocar as duas.

> É por isso que existe o M05. Migração não é "o jeito difícil de fazer a mesma coisa": é
> onde a decisão fica **escrita antes de rodar**, revisada em *pull request* e aplicada na
> mesma ordem em toda máquina. Você lê o `ALTER TABLE` e decide se ele pode rodar, em vez de
> descobrir depois o que ele fez.

**Desfaça as duas mudanças antes de seguir.**

---

## Etapa 17 — Modelar empréstimo (35 min)

Agora é com você, e sem código pronto. Duas entidades: `Associado` e `Emprestimo`.

**As regras do domínio:**

- Associado tem nome, e-mail único e data de inscrição.
- Empréstimo liga **um exemplar** a **um associado**, com data de saída, previsão de
  devolução e devolução efetiva — que pode não ter acontecido ainda.
- Apagar um associado que tem empréstimo em aberto **não pode** funcionar.
- Um exemplar emprestado não pode ser apagado.

**O que fazer:**

1. Escreva as duas entidades.
2. Registre-as no `forFeature`.
3. Suba e confira com `\d emprestimo` e `\d associado`.
4. **Justifique por escrito**, em uma linha cada: todo `nullable`, todo `unique`, todo
   `onDelete` e todo índice que você criou.

**Deu certo se:** as tabelas existem, as chaves estrangeiras têm o `ON DELETE` que você
escolheu, e você consegue defender cada escolha usando o critério da etapa 12.

> **Uma dica sobre o `Emprestimo`:** repare que ele liga duas entidades **e carrega dados
> próprios** (as três datas). É exatamente o caso que a etapa 13 antecipou — quando a ligação
> tem dados, ela deixa de ser N:N e vira entidade, com dois `@ManyToOne`.

> **A justificativa é o exercício.** Modelagem sem justificativa é chute, e o chute cobra a
> conta no M06, quando as consultas começam a doer, e no M05, quando corrigi-la exige migração
> de dados.

---

## Etapa 18 — O que o ORM cobra (10 min)

A etapa 5 prometeu esta conversa. Você já viu o que o ORM entrega — agora o preço.

| Custo | Onde este curso trata |
| --- | --- |
| Você escreve menos SQL — e por isso **entende** menos SQL | O M06 exige ler o SQL gerado antes de aceitar qualquer consulta. É por isso que o `logging: true` fica ligado |
| Consultas ingênuas viram lentidão silenciosa (problema N+1) | O M06 dedica uma seção ao N+1, **com medição**, não com aviso |
| A abstração vaza: casos difíceis exigem SQL de novo | O M06 mostra o `QueryBuilder` e quando descer para SQL puro |
| O dialeto continua embaixo | Você viu na etapa 14: `enum` do PostgreSQL não é `enum` de outro banco. O M05 volta a isso |

> **O ORM não dispensa saber SQL.** Ele dispensa **escrever** o SQL trivial — que é uns 90%
> do CRUD. Os outros 10% continuam sendo seus, e são justamente os que decidem se a aplicação
> aguenta o segundo ano de uso.

E o que você conquistou nestas seis horas, em uma frase: **o banco inteiro do BiblioCom
existe e nasceu de classes TypeScript**, com cada coluna, cada chave estrangeira e cada
índice saindo de uma decisão que você consegue defender.

💼 **No mercado:** modelagem é onde o erro custa mais caro. Um campo mal tipado vira migração
de dados seis meses depois, com o sistema em produção e o cliente perguntando por quê. Em
*code review*, `nullable: true` e `CASCADE` sem justificativa são os dois comentários mais
frequentes — e agora você sabe responder aos dois.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `ECONNREFUSED ::1:5432` | O contêiner do banco não está de pé. `docker compose ps` |
| `no PostgreSQL user name specified in startup packet` | `DATABASE_URL` chegou vazia. Quase sempre: falta a chave no esquema do `validate` — ver etapa 3 |
| `password authentication failed` | `DATABASE_URL` não bate com o `docker-compose.yml` |
| `Entity metadata for Obra#autor was not found` | A entidade não está no `forFeature` do módulo |
| `Cannot read properties of undefined (reading 'name')` na inicialização | Importação circular: use `() => Entidade`, nunca a classe direta |
| `error TS2835: Relative import paths need explicit file extensions…` | Faltou o `.js` no import da entidade. A própria mensagem sugere a correção |
| Nenhum `CREATE TABLE` no log | A tabela já existe e já bate com a entidade. Não é erro |
| Coluna não aparece no banco | O `start:dev` não reiniciou, ou falta `@Column()` na propriedade |
| `null value in column "x" violates not-null constraint` | Campo obrigatório sem valor; ou você tornou obrigatória uma coluna que já tinha linhas vazias |
| Tudo virou `varchar(255)` | Faltou `type`/`length` no `@Column` |
| Apagar autora apagou as obras | Você usou `CASCADE` onde cabia `RESTRICT` — etapa 12 |
| Uma coluna ficou vazia depois de você mudar o tipo | O `synchronize` apagou e recriou. É a etapa 16, e é o motivo do M05 |

## ✅ Checklist de saída

- [ ] PostgreSQL rodando em Docker, com `DATABASE_URL` validada no esquema
- [ ] Seis entidades: `Autor`, `Obra`, `Categoria`, `Exemplar`, `Associado`, `Emprestimo`
- [ ] O banco foi gerado **a partir das classes**, sem SQL escrito à mão
- [ ] Você viu o `ALTER TABLE` acontecer ao mudar uma classe
- [ ] 1:N e N:N implementadas, com a tabela intermediária conferida no `\d`
- [ ] Todo `nullable`, `unique`, `onDelete` e índice tem justificativa escrita **de negócio**
- [ ] `logging: true` ligado, e você **leu** o SQL gerado
- [ ] Você provocou os dois experimentos da etapa 16 e anotou o que aconteceu em cada
- [ ] Você sabe dizer por que `Exemplar → Obra` é `CASCADE` e `Obra → Autor` é `RESTRICT`
- [ ] Você sabe dizer o que o ORM cobra, além do que ele entrega

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Relations](https://typeorm.io/relations)
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [Use The Index, Luke — índices na prática](https://use-the-index-luke.com/pt)
