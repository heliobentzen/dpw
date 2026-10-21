# M04 — Entidades: classes que geram o banco

> **Pré-requisito:** M03 · **Duração:** longa

O módulo central da ementa: *"classes para geração automática do banco de dados"*. Uma
classe TypeScript vira tabela; a relação entre classes vira chave estrangeira.

> A teoria vem quando o código pede: as etapas 5, 8, 12 e 18 são de raciocínio.

## 📌 O que a avaliação cobra

| Onde | O quê |
| --- | --- |
| [Portfólio](../../avaliacao/rubrica-portfolio.md) | entrega **E1** — ver [📦 Entrega E1](#-entrega-e1--modelo-de-dados) no fim |
| [Projeto](../../avaliacao/) | Etapa 2 · critério 1 · Etapa 3 · bloco A (modelagem). |
| Etapas ➕ opcionais | 15, 16, 18 — nenhuma rubrica as cobra |

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que um ORM resolve e o que ele cobra em troca.
2. Escrever entidades com `@Entity()` e ver o banco nascer delas.
3. Modelar relações 1:N e N:N, escolhendo o comportamento de exclusão.
4. Justificar cada `nullable`, cada `unique` e cada índice que você criar.
5. Reconhecer o limite do `synchronize` — o que motiva o M05.

## 🧭 O que você vai construir

Seis tabelas, nenhuma linha de SQL escrita por você:

```mermaid
erDiagram
    AUTOR ||--o{ OBRA : escreve
    OBRA }o--o{ CATEGORIA : "classificada em"
    OBRA ||--o{ EXEMPLAR : "tem cópias"
    EXEMPLAR ||--o{ EMPRESTIMO : "sai em"
    ASSOCIADO ||--o{ EMPRESTIMO : faz
```

| Símbolo | Lê-se |
|---|---|
| `\|\|` | exatamente um |
| `o{` | zero ou muitos |
| `}o--o{` | muitos para muitos — vira uma tabela intermediária (etapa 13) |

Ao final, `\dt` lista essas tabelas mais a intermediária `obra_categoria` — e cada coluna
terá saído de uma decisão que você sabe justificar.

## 📋 Como este módulo funciona

Mesmo formato do M03 (**Faça → Linha a linha → Rode → Deu certo se**), **uma entidade por
vez**, conferindo o banco ao fim de cada etapa.

> 🪟 Comandos iguais nos três sistemas. O `psql` roda **dentro do contêiner** (`docker
> compose exec`), sem instalar cliente de PostgreSQL.

### As dezoito etapas

| # | Etapa | Duração | O que entra |
| --- | --- | --- | --- |
| 1 | [Subir o banco](#etapa-1--subir-o-banco) | média | Docker Compose |
| 2 | [Instalar o TypeORM](#etapa-2--instalar-o-typeorm) | curta | ORM, driver |
| 3 | [A variável de conexão](#etapa-3--a-variável-de-conexão) | média | `DATABASE_URL`, e uma armadilha |
| 4 | [Ligar o TypeOrmModule](#etapa-4--ligar-o-typeormmodule) | média | `forRoot`, `synchronize`, `logging` |
| 5 | [**O que um ORM resolve**](#etapa-5--o-que-um-orm-resolve) | média | **o porquê do ORM** |
| 6 | [A primeira entidade](#etapa-6--a-primeira-entidade) | longa | `@Entity`, `@Column`, `forFeature` |
| 7 | [Ler o `CREATE TABLE`](#etapa-7--ler-o-create-table) | média | do decorator ao SQL |
| 8 | [**Cada opção é uma decisão**](#etapa-8--cada-opção-é-uma-decisão) | longa | **`nullable`, `unique`, `default`** |
| 9 | [Mudar a classe, ver o `ALTER`](#etapa-9--mudar-a-classe-ver-o-alter) | média | o ciclo do módulo |
| 10 | [A segunda entidade](#etapa-10--a-segunda-entidade) | média | datas automáticas |
| 11 | [A primeira relação: 1:N](#etapa-11--a-primeira-relação-1n) | longa | `@ManyToOne`, `@OneToMany`, FK |
| 12 | [**`onDelete` é decisão de negócio**](#etapa-12--ondelete-é-decisão-de-negócio) | média | **`RESTRICT`, `CASCADE`, `SET NULL`** |
| 13 | [Relação N:N](#etapa-13--relação-nn) | longa | `@ManyToMany`, `@JoinTable` |
| 14 | [1:N com `CASCADE`](#etapa-14--1n-com-cascade) | longa | `enum`, campo derivado |
| 15 | [Índices](#etapa-15--índices) ➕ | média | `@Index` |
| 16 | [O limite do `synchronize`](#etapa-16--o-limite-do-synchronize) ➕ | longa | dois experimentos destrutivos |
| 17 | [Modelar empréstimo](#etapa-17--modelar-empréstimo) | longa | por sua conta |
| 18 | [O que o ORM cobra](#etapa-18--o-que-o-orm-cobra) ➕ | curta | fecho |

> 📦 **Instale o Docker antes desta aula** — o PostgreSQL sobe nele, logo na etapa 1. Siga o
> [guia de ambiente, passo 7](../../docs/ambiente-setup.md#passo-7--docker-e-postgresql-antes-do-m04).
> No Windows o Docker exige o WSL2, então **não deixe para a hora da aula**.

---

## Etapa 1 — Subir o banco

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

O `docker-compose.yml` (do guia de setup) descreve o serviço `db`: PostgreSQL 16, usuário
`bibliocom` e um volume para os dados sobreviverem a reinícios.

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

**Deu certo se:** responde `Did not find any relations.` — banco vazio, pronto para receber
as tabelas das suas classes.

---

## Etapa 2 — Instalar o TypeORM

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

> Trocando PostgreSQL por MySQL, só o `pg` mudaria.

**Deu certo se:** o comando termina sem erro e os três aparecem em `dependencies` no
`package.json`.

---

## Etapa 3 — A variável de conexão

O endereço do banco muda entre a sua máquina e o servidor, então vai para o `.env` (M03).

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

### ⚠️ Esta linha não é opcional — é uma armadilha silenciosa

O `validate` do `ConfigModule` não só **confere** as variáveis: ele as **substitui** pelo que
o esquema devolveu. Variável fora do esquema **deixa de existir** para a aplicação:

```
o .env tem DATABASE_URL  →  o esquema não a declara  →  o validate a descarta
→  o TypeORM recebe undefined  →  erro:
   "no PostgreSQL user name specified in startup packet"
```

A mensagem não menciona `.env`, esquema nem `DATABASE_URL`. **Guarde este sintoma.**

---

## Etapa 4 — Ligar o TypeOrmModule

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

> ⚠️ **`synchronize: true` em produção apaga dados**: altera colunas sem perguntar e sem
> backup. Aqui o banco é descartável; a etapa 16 mostra o estrago, e o M05 o substitui.

**Rode:**

```powershell
npm run start:dev
```

**Deu certo se:** a aplicação sobe e o terminal mostra `query: SELECT version()`. Sem
entidades ainda, **nenhuma tabela é criada** — correto.

⚠️ **Se aparecer `ECONNREFUSED ::1:5432`**, o contêiner não está de pé ou a porta é outra.
Confira com `docker compose ps` antes de mexer no código.

---

## Etapa 5 — O que um ORM resolve

Pare o teclado. Antes da primeira entidade, entenda o que o ORM vai fazer por você.

### Como seria sem ORM

```ts
const { rows } = await pool.query(
  "SELECT id, titulo, ano_publicacao FROM obra WHERE id = $1", [id]
);
const obra = rows[0];        // tipo: any. O TypeScript não sabe nada sobre isto.
```

Funciona, com três problemas que aparecem quando o projeto cresce:

| Problema | Como se manifesta |
| --- | --- |
| **Sem tipo** | `obra.titolo` (erro de digitação) **compila**. Vira `undefined` em produção |
| **SQL espalhado** | A mesma consulta em cinco arquivos; alguém acrescenta uma coluna e corrige só quatro |
| **Esquema em dois lugares** | Tabela no banco, expectativa no código, e **nada garante que combinem** até rodar |

### O que o ORM faz

Pense num **intérprete numa reunião**: você fala português, a outra pessoa japonês, e ele
traduz nos dois sentidos. O ORM (*Object-Relational Mapper*) traduz entre **objetos** do
TypeScript e **tabelas** do banco — e, como todo intérprete, às vezes erra o tom (etapa 18).

A classe vira a **única fonte de verdade**: dela saem o tipo, a consulta e a tabela.

```ts
const obra = await this.repo.findOneBy({ id });   // tipo: Obra | null
```

Os três problemas desaparecem de uma vez:

```mermaid
flowchart TB
    O["class Obra<br/>(com decorators)"] --> T["o TIPO<br/>que o TypeScript confere"]
    O --> B["a TABELA<br/>no banco"]
    O --> Q["a CONSULTA<br/>gerada"]
```

`obra.titolo` vira erro de compilação, a consulta não diverge da classe, e a tabela
**também** nasce dela — o item da ementa deste módulo.

Duas formas de o TypeORM aplicar a classe no banco, uma por módulo:

| Modo | Como funciona | Quando |
| --- | --- | --- |
| `synchronize: true` | A cada inicialização, compara entidades × banco e **altera a tabela** | **Só em desenvolvimento**, e só neste módulo |
| Migrações | Você gera um arquivo versionado com o `ALTER TABLE` e o aplica de propósito | Sempre que houver dado que importa. É o M05 |

O que o ORM **cobra** fica para a etapa 18, depois de você ver o que ele entrega.

---

## Etapa 6 — A primeira entidade

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

> **Decorators** de novo: o mecanismo do `@Controller` do M03, lido por outra ferramenta.

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

**Entidade fora do `forFeature` não existe** para o TypeORM — e o erro não menciona
`forFeature`. É o primo do `can't resolve dependencies` do M03.

**Deu certo se:** o `start:dev` reiniciou sem erro. O que houve no banco é a próxima etapa.

---

## Etapa 7 — Ler o `CREATE TABLE`

**Rode:** role o terminal do `start:dev` para cima até esta linha:

```
query: CREATE TABLE "autor" ("id" SERIAL NOT NULL, "nome" character varying(150) NOT NULL,
"nascimento" date, "biografia" text NOT NULL DEFAULT '',
CONSTRAINT "PK_51d3959df48c82010ae1c4907fb" PRIMARY KEY ("id"))
```

**Leia com a classe ao lado** — cada decisão sua está ali:

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

> ⚠️ **O `CREATE TABLE` aparece uma vez só.** Nas inicializações seguintes a tabela já bate
> com a entidade. Se não o viu, role para cima ou recrie o banco.

---

## Etapa 8 — Cada opção é uma decisão

Quatro colunas, quatro decisões — talvez sem perceber. São elas que separam modelagem de
digitação.

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

Coluna que aceita nulo obriga **todo** código que a lê a tratar a ausência — `if`
espalhados pela aplicação, para sempre. Compare:

| Coluna | Escolha | Por quê |
| --- | --- | --- |
| `nascimento` | `nullable: true` | Nem toda data de nascimento é conhecida. **Aqui o nulo é honesto**: ele significa "não sabemos", que é diferente de qualquer data |
| `biografia` | `default: ""` | Texto opcional. Aqui o nulo seria **redundante**: string vazia já significa "sem biografia" |

**A regra:** para texto opcional, prefira `default: ""` a `nullable: true`. String vazia
**e** `null` significando a mesma coisa geram `if` defensivos e bugs em que
`if (autor.biografia)` funciona num registro e falha no outro. Torne nulo só o que é
**genuinamente opcional no mundo real**, e saiba dizer o que o nulo significa ali.

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

## Etapa 9 — Mudar a classe, ver o `ALTER`

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

**Sem SQL escrito por você** — o segundo item da ementa: *"atualização do banco de dados a
partir das classes"*.

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d autor"
```

**Deu certo se:** a coluna `nacionalidade` está lá.

> Sem o `DEFAULT ''`, uma coluna `NOT NULL` nova falharia em tabela com linhas — não haveria
> o que pôr nelas. Isso volta no M05, com dado de verdade.

---

## Etapa 10 — A segunda entidade

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

> **Auditoria mínima a custo zero**: saber quando um registro nasceu e mudou resolve metade
> das perguntas de suporte.

**Faça:** acrescente `Obra` ao `forFeature` do `AcervoModule`.

**Deu certo se:** o log traz um `CREATE TABLE "obra"` com as sete colunas, e
`\d obra` as confirma. Repare que `criadoEm` virou `TIMESTAMP NOT NULL DEFAULT now()`.

---

## Etapa 11 — A primeira relação: 1:N

Uma autora tem muitas obras; cada obra tem uma autora. A relação mais comum que existe.

### 11a. O lado que carrega a chave

**Faça:** na `Obra`:

```ts
import { ManyToOne, type Relation } from "typeorm";
import { Autor } from "./autor.entity.js";

  @ManyToOne(() => Autor, (autor) => autor.obras, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  autor: Relation<Autor>;

  @Column()
  autorId: number;
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@ManyToOne` | "Muitas obras para uma autora". **É este lado que carrega a chave estrangeira** |
| `() => Autor` | Uma função, não a classe direto. Os dois arquivos se referenciam, e a função adia a resolução — sem ela, dá erro de importação circular |
| `(autor) => autor.obras` | Aponta o **outro lado** da relação. É o que permite navegar nos dois sentidos |
| `Relation<Autor>` | Para o TypeScript, é só `Autor`. A embalagem existe por causa do ESM — ver o quadro abaixo |
| `type Relation` no import | `Relation` é só um tipo, não existe em tempo de execução. O `type` avisa o compilador para não procurá-lo no JavaScript gerado |
| `nullable: false` | Obra sem autora não existe no nosso domínio |
| `onDelete: "RESTRICT"` | O que acontece com as obras quando a autora é apagada — assunto da etapa 12 |
| `@Column() autorId` | Declara em TypeScript a coluna que o `@ManyToOne` **já criava** |

> **Por que `Relation<>`: o ovo e a galinha.** `obra.entity.ts` importa `Autor`, e
> `autor.entity.ts` importa `Obra`. No ESM, um arquivo encontra o outro **pela metade**,
> ainda sem a classe pronta. E os decorators gravam o tipo de cada propriedade no momento em
> que o arquivo carrega: com `autor: Autor`, o TypeScript tenta ler `Autor` antes de ela
> existir, e a API nem sobe:
>
> ```
> ReferenceError: Cannot access 'Autor' before initialization
> ```
>
> `Relation<Autor>` é um tipo que o TypeScript não consegue gravar como classe, então ele
> grava um genérico `Object` e não procura ninguém. **Regra prática: toda propriedade de
> relação (`@ManyToOne`, `@OneToMany`, `@ManyToMany`) usa `Relation<>`.** A coluna comum
> (`@Column`) não precisa.

### 11b. O outro lado

**Faça:** na `Autor`:

```ts
import { OneToMany, type Relation } from "typeorm";
import { Obra } from "./obra.entity.js";

  @OneToMany(() => Obra, (obra) => obra.autor)
  obras: Relation<Obra[]>;
```

| Trecho | O que faz |
| --- | --- |
| `@OneToMany` | **Não cria coluna nenhuma.** Só permite navegar de autora para obras |
| `Relation<Obra[]>` | Um array de obras, na embalagem da regra prática. Ele vem vazio até você pedir a relação explicitamente — assunto do M06 |

### 11c. Por que declarar o `autorId` se ele já existia

Sem essa linha, a coluna existe **no banco** mas não **no TypeScript** — e quem precisa do
id da autora sem carregá-la acaba escrevendo `(obra as any).autorId`. Com `any` some o
autocompletar e a checagem. O M06 usa esse campo, com tipo.

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

## Etapa 12 — `onDelete` é decisão de negócio

Você escreveu `onDelete: "RESTRICT"` sem discutir. Essa linha decide o que acontece com o
acervo quando alguém aperta "excluir".

**As três opções:**

| Valor | O que o banco faz | Quando é a resposta certa |
| --- | --- | --- |
| `RESTRICT` | **Impede** apagar a autora enquanto houver obras dela | **Padrão sensato.** Erro alto é melhor que perda silenciosa |
| `CASCADE` | Apaga as obras junto | Só quando o filho **não existe** sem o pai |
| `SET NULL` | Zera a referência, mantém a obra | Quando o vínculo é genuinamente opcional |

**A pergunta que decide:** *"este registro faz sentido sozinho?"*

- Obra sem autora? Faz sentido — a obra existe no mundo. Logo, **não** é `CASCADE`.
- Exemplar sem obra? Não — "o volume 3 de nada" não significa nada. Logo, **é** `CASCADE`
  (etapa 14).

> `CASCADE` no automático é apagar uma editora e levar o catálogo junto — sem erro, sem
> aviso, até alguém procurar um livro que sumiu.

⚠️ **Justificativa técnica não vale.** "Usei `CASCADE` para não dar erro de chave
estrangeira" é o raciocínio invertido: o erro existia **para** avisar que você ia apagar algo
que importa. A justificativa tem de ser de negócio.

**Anote, por escrito**, para as relações que este módulo vai criar:

| Relação | `onDelete` | Justificativa **de negócio** |
| --- | --- | --- |
| `Obra` → `Autor` | `RESTRICT` | |
| `Exemplar` → `Obra` | | |
| `Emprestimo` → `Exemplar` | | |
| `Emprestimo` → `Associado` | | |

Você vai precisar dessas respostas na etapa 17.

---

## Etapa 13 — Relação N:N

Uma obra tem várias categorias e vice-versa. Nenhum lado consegue guardar a referência numa
coluna — entra uma terceira tabela.

**Faça:** crie `src\acervo\entidades\categoria.entity.ts`:

```ts
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { Obra } from "./obra.entity.js";

@Entity()
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80, unique: true })
  nome: string;

  @ManyToMany(() => Obra, (obra) => obra.categorias)
  obras: Relation<Obra[]>;
}
```

**Faça:** na `Obra`, o lado **dono** — o que leva o `@JoinTable`:

```ts
import { JoinTable, ManyToMany, type Relation } from "typeorm";
import { Categoria } from "./categoria.entity.js";

  @ManyToMany(() => Categoria, (categoria) => categoria.obras)
  @JoinTable({ name: "obra_categoria" })
  categorias: Relation<Categoria[]>;
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

> **Quando a N:N deixa de servir:** se a ligação tiver dados próprios (*desde quando*, *quem
> classificou*), crie uma entidade com dois `@ManyToOne`. É o caso de `Emprestimo`, na etapa 17.

---

## Etapa 14 — 1:N com `CASCADE`

**Obra** × **exemplar** é o coração do domínio: *um* "Dom Casmurro" no catálogo, *três*
volumes na estante.

**Faça:** crie `src\acervo\entidades\exemplar.entity.ts`:

```ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm";
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
  obra: Relation<Obra>;

  @Column()
  obraId: number;
}
```

**Faça:** o outro lado, na `Obra`:

```ts
import { OneToMany } from "typeorm";
import { Exemplar } from "./exemplar.entity.js";

  @OneToMany(() => Exemplar, (exemplar) => exemplar.obra)
  exemplares: Relation<Exemplar[]>;
```

**Linha a linha:**

| Decisão | Por quê |
| --- | --- |
| `tombo` com `unique` | O número de tombo é o identificador **físico** do volume. Duplicado é erro de catalogação, e o banco deve recusar |
| `enum` em vez de texto livre | O conjunto de estados é fechado. Texto livre vira `"Bom"`, `"bom"` e `"BOM"` no mesmo banco, e aí nenhum relatório fecha |
| `estado` **e** `disponivel` separados | `estado` é a condição **física** do volume; `disponivel` diz se ele está na estante ou emprestado. Um exemplar em bom estado pode estar fora, e um desgastado pode estar disponível |
| `onDelete: "CASCADE"` **aqui** | Aplicando o critério da etapa 12: um exemplar **não existe** sem a obra. É o caso legítimo de cascata |

> **Sobre o `disponivel`:** é um campo **derivado** (daria para consultar os empréstimos em
> aberto). Guardá-lo troca uma consulta por uma **obrigação**: manter os dois em sincronia.
> Por isso, no M06, emprestar e marcar indisponível vão na **mesma transação** — senão,
> dois leitores aparecem com o mesmo volume na mão.

**Rode:** salve e leia o log. Agora o `CREATE TABLE` vem precedido de um `CREATE TYPE`:

```
query: CREATE TYPE "public"."exemplar_estado_enum" AS ENUM('novo', 'bom', 'desgastado', 'descartado')
query: CREATE TABLE "exemplar" (... "estado" "public"."exemplar_estado_enum" NOT NULL DEFAULT 'bom' ...)
```

O PostgreSQL tem **tipo enumerado de verdade**: o tipo nasce antes da tabela que o usa. No
M05 ele aparece na migração — e alterar um enum é bem mais chato que alterar um `varchar`.

**Deu certo se:** `\d exemplar` mostra `estado` com o tipo `exemplar_estado_enum` e a chave
estrangeira com `ON DELETE CASCADE`.

---

## Etapa 15 — Índices

> ➕ **Opcional.** Nenhuma rubrica cobra esta etapa — faça se houver tempo.

Sem índice, o banco varre a tabela inteira — como procurar um assunto num livro sem índice
remissivo. Com 50 registros ninguém nota; com 50 mil, a requisição trava.

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

O `isbn` merece um: o balcão busca por ISBN o dia inteiro, e a coluna não é chave de nada.

> Índice é fácil de errar por excesso. A pergunta é "**esta coluna é buscada com
> frequência?**", não "pode ser buscada?". O M06 mede a diferença em vez de supor.

---

## Etapa 16 — O limite do `synchronize`

> ➕ **Opcional.** Nenhuma rubrica cobra esta etapa — faça se houver tempo.

Até aqui as mudanças eram fáceis. Agora provoque o difícil — **com dado no banco**, a única
situação em que a diferença aparece.

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

Nenhum erro, aplicação no ar, coluna vazia. O `synchronize` não sabe encurtar coluna com
dado, então fez o que sabe: apagou e recriou.

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

O `synchronize` não é burro — deduzir a renomeação é um bom palpite. **O problema é não saber
qual comportamento você vai receber antes de rodar**, e um deles apaga dados. (Renomeie duas
colunas do mesmo tipo de uma vez e o palpite pode trocá-las.)

> Por isso existe o M05. Migração é onde a decisão fica **escrita antes de rodar**, revisada
> em *pull request* e aplicada na mesma ordem em toda máquina: você lê o `ALTER TABLE` antes,
> em vez de descobrir depois o que ele fez.

**Desfaça as duas mudanças antes de seguir.**

---

## Etapa 17 — Modelar empréstimo

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

> **Dica:** `Emprestimo` liga duas entidades **e tem dados próprios** (as datas) — o caso da
> etapa 13: entidade com dois `@ManyToOne`, ambos com `Relation<>` (etapa 11).

> **A justificativa é o exercício.** Modelagem sem justificativa é chute, e o chute cobra a
> conta no M05 (migração de dados) e no M06 (consultas lentas).

---

## Etapa 18 — O que o ORM cobra

> ➕ **Opcional.** Nenhuma rubrica cobra esta etapa — faça se houver tempo.

Você viu o que o ORM entrega. Agora, o preço.

| Custo | Onde este curso trata |
| --- | --- |
| Você escreve menos SQL — e por isso **entende** menos SQL | O M06 exige ler o SQL gerado antes de aceitar qualquer consulta. É por isso que o `logging: true` fica ligado |
| Consultas ingênuas viram lentidão silenciosa (problema N+1) | O M06 dedica uma seção ao N+1, **com medição**, não com aviso |
| A abstração vaza: casos difíceis exigem SQL de novo | O M06 mostra o `QueryBuilder` e quando descer para SQL puro |
| O dialeto continua embaixo | Você viu na etapa 14: `enum` do PostgreSQL não é `enum` de outro banco. O M05 volta a isso |

> **O ORM não dispensa saber SQL.** Dispensa **escrever** o SQL trivial (uns 90% do CRUD). Os
> outros 10% decidem se a aplicação aguenta o segundo ano de uso.

Em uma frase: **o banco do BiblioCom nasceu de classes TypeScript**, e cada coluna, chave
estrangeira e índice saiu de uma decisão que você sabe defender.

💼 **No mercado:** modelagem é onde o erro custa mais caro — campo mal tipado vira migração de
dados meses depois, em produção. Em *code review*, `nullable: true` e `CASCADE` sem
justificativa são os comentários mais frequentes.

---

## 🤖 IA no fluxo

A IA escreve entidades TypeORM muito bem — e erra as decisões com a mesma facilidade:
`nullable: true` em tudo, `CASCADE` em toda relação, `float` para dinheiro, e quase nunca o
`Relation<>` que o ESM exige (etapa 11).

Use-a para o rascunho e para **explicar o SQL** do `logging: true`. As decisões das etapas 8
e 12 são de negócio: se você não defende uma linha da entidade com um motivo do domínio, ela
não está pronta.

## 💣 Pegadinha de mercado

**`nullable: true` por precaução.** Parece prudente; na prática espalha `if (x === null)`
por todo código que lê a coluna — até o dia em que metade das obras aparece sem ano no
relatório da diretoria. O padrão é **obrigatório**; anulável é exceção justificada.

## 🧩 Desafio de fixação

A biblioteca passa a cobrar **multa** por atraso: R$ 0,50 por dia, com teto de R$ 10,00. A
multa é uma coluna em `Emprestimo` ou uma entidade própria? Pense em: o associado pode pagar
em parcelas? A coordenação pode perdoar uma multa? O valor da diária pode mudar no futuro sem
alterar multas antigas? Escreva o `@Column` (ou a entidade) e justifique cada opção.

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `ECONNREFUSED ::1:5432` | O contêiner do banco não está de pé. `docker compose ps` |
| `no PostgreSQL user name specified in startup packet` | `DATABASE_URL` chegou vazia. Quase sempre: falta a chave no esquema do `validate` — ver etapa 3 |
| `password authentication failed` | `DATABASE_URL` não bate com o `docker-compose.yml` |
| `Entity metadata for Obra#autor was not found` | A entidade não está no `forFeature` do módulo |
| `ReferenceError: Cannot access 'Obra' before initialization` | Propriedade de relação sem `Relation<>` — quadro da etapa 11 |
| `Cannot read properties of undefined (reading 'name')` na inicialização | Importação circular: use `() => Entidade`, nunca a classe direta |
| `error TS1272: A type referenced in a decorated signature must be imported with 'import type'` | Faltou o `type` antes de `Relation` no import — etapa 11 |
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

## 📦 Entrega E1 — Modelo de dados

**Essencial** — exatamente o que a [rubrica do portfólio](../../avaliacao/rubrica-portfolio.md) verifica:

- [ ] Entidades TypeORM com relações 1-N e N-N, **migradas** (as migrações chegam no M05)
- [ ] Diagrama ER (pode ser em Mermaid)
- [ ] O `onDelete` de cada chave estrangeira justificado por regra de negócio (etapa 12)
- [ ] *Seed* com dados de exemplo (o `semear.ts` do M06 serve)

**➕ Para ir além** — conta para o nível Excelente, não é obrigatório:

- Índices medidos (etapa 15)
- Os experimentos com o `synchronize` (etapa 16)

**Prazo:** ver o [plano de ensino](../../docs/plano-de-ensino.md#9-cronograma-semanal).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Relations](https://typeorm.io/relations)
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [Use The Index, Luke — índices na prática](https://use-the-index-luke.com/pt)
