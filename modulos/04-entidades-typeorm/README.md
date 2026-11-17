# M04 — Entidades: classes que geram o banco

> **Pré-requisito:** M03 · **Duração:** longa · **Semanas:** 5–6
> **Ementa:** *Utilização de classes para geração automática do banco de dados.*
> **No projeto:** as entidades do domínio da equipe viram classes e tabelas · P2 (critério 1) e P3 (critério 1)

## Por que este módulo existe no projeto

Na P1, a equipe desenhou as "coisas" do domínio e como elas se ligam. Agora esse desenho
vira **classes TypeScript**, e o banco nasce delas. É o módulo onde os erros custam mais
caro: um campo mal decidido hoje vira, na semana 16, uma migração com dados reais da
organização.

Por isso o foco não é a sintaxe — é **decidir e justificar** cada coluna. Toda opção de uma
entidade (`nullable`, `unique`, `onDelete`) responde a uma pergunta sobre a organização, e a
P2 confere se vocês sabem responder.

## 🎯 Ao final do módulo

1. O PostgreSQL roda em Docker e a API se conecta a ele.
2. As entidades do domínio da equipe existem, com relações 1:N e N:N.
3. Cada `nullable`, `unique` e `onDelete` tem uma justificativa **de negócio** escrita.

---

## 📖 Conceitos

### 1. O que um ORM resolve

Sem ORM, a consulta é texto e o resultado não tem tipo:

```ts
const { rows } = await pool.query("SELECT id, nome FROM pessoa WHERE id = $1", [id]);
rows[0].nmoe;   // erro de digitação: compila, e vira undefined em produção
```

O **ORM** (*Object-Relational Mapper*) é um intérprete entre objetos e tabelas. A classe vira
a **única fonte de verdade**: dela saem o tipo que o TypeScript confere, a tabela no banco e
as consultas.

```mermaid
flowchart LR
    C["class Pessoa<br/>(com decorators)"] --> T["o tipo"]
    C --> B["a tabela"]
    C --> Q["as consultas"]
```

O preço: consultas ingênuas ficam lentas sem ninguém perceber (M06). Por isso o `logging`
fica ligado o curso inteiro — **o ORM não dispensa ler SQL**, só escrever o SQL trivial.

### 2. Uma entidade, e o SQL que sai dela

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Pessoa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 14, unique: true })
  cpf: string;

  @Column({ type: "date", nullable: true })
  nascimento: string | null;

  @Column({ type: "text", default: "" })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;
}
```

```sql
CREATE TABLE "pessoa" ("id" SERIAL NOT NULL, "nome" character varying(150) NOT NULL,
  "cpf" character varying(14) NOT NULL, "nascimento" date, "observacoes" text NOT NULL DEFAULT '',
  "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_..." UNIQUE ("cpf"), ...)
```

Cada opção virou uma linha do SQL. **O padrão do TypeORM é `NOT NULL`**: obrigatório, a não
ser que vocês digam o contrário.

### 3. Cada opção é uma pergunta sobre a organização

| Opção | A pergunta |
| --- | --- |
| `type` | Que tipo de dado? (Sem isto, `number` vira `integer` e quebra decimais) |
| `length` | Qual o limite? É regra de negócio: alguém decidiu que nome cabe em 150 |
| `nullable` | Este dado **pode não existir no mundo real**? |
| `unique` | Pode repetir? |
| `default` | O que vale quando ninguém informou? |

**A decisão mais cara é `nullable`.** Coluna anulável obriga todo código que a lê a tratar a
ausência, para sempre. A regra:

- **Texto opcional** → `default: ""`, não `nullable`. String vazia já significa "não informado".
- **Nulo só quando ele significa algo**: `nascimento: null` é "não sabemos"; `concluidoEm: null`
  é "ainda não concluiu". Saiba dizer o que o nulo significa.
- **Dinheiro nunca é `float`** (o arredondamento binário come centavos): use
  `type: "decimal", precision: 10, scale: 2`.
- **Conjunto fechado de valores** → `enum`, nunca texto livre (senão aparecem `"Ativo"`,
  `"ativo"` e `"ATIVO"` no mesmo banco).

> **LGPD:** CPF, endereço, saúde. Antes de criar a coluna, pergunte se a organização
> **precisa** desse dado. Dado que não é coletado não vaza (M09).

### 4. Relação 1:N — o lado "muitos" carrega a chave

Uma pessoa tem muitos atendimentos; cada atendimento é de uma pessoa.

```ts
// atendimento.entity.ts
@ManyToOne(() => Pessoa, (pessoa) => pessoa.atendimentos, { nullable: false, onDelete: "RESTRICT" })
pessoa: Relation<Pessoa>;

@Column()
pessoaId: number;
```

```ts
// pessoa.entity.ts — este lado não cria coluna nenhuma; só permite navegar
@OneToMany(() => Atendimento, (atendimento) => atendimento.pessoa)
atendimentos: Relation<Atendimento[]>;
```

| Trecho | Por quê |
| --- | --- |
| `() => Pessoa` | Uma função, não a classe direto: os dois arquivos se importam, e a função adia a resolução |
| `Relation<Pessoa>` | **Obrigatório em toda propriedade de relação** neste projeto (ESM). Sem ele, a API não sobe: `Cannot access 'Pessoa' before initialization`. Importe com `import { type Relation } from "typeorm"` |
| `@Column() pessoaId` | A coluna já existe no banco; declará-la dá acesso ao id com tipo, sem carregar a pessoa |

### 5. `onDelete` é decisão de negócio

| Valor | O que o banco faz ao apagar o "pai" | Quando |
| --- | --- | --- |
| `RESTRICT` | **Impede** enquanto houver filhos | **Padrão sensato**: erro alto é melhor que perda silenciosa |
| `CASCADE` | Apaga os filhos junto | Só quando o filho **não existe sem o pai** |
| `SET NULL` | Zera a referência | Quando o vínculo é genuinamente opcional |

**A pergunta:** *este registro faz sentido sozinho?*

- Atendimento sem a pessoa? É o **histórico** da organização — não pode sumir. `RESTRICT`.
- Anexo de um atendimento sem o atendimento? Não significa nada. `CASCADE`.

> "Usei `CASCADE` para não dar erro de chave estrangeira" é o raciocínio invertido: o erro
> existia **para avisar** que algo importante ia ser apagado.

### 6. Relação N:N — uma tabela no meio

Um atendimento envolve vários serviços; um serviço aparece em vários atendimentos.

```ts
// atendimento.entity.ts — o lado "dono" leva o @JoinTable
@ManyToMany(() => Servico, (servico) => servico.atendimentos)
@JoinTable({ name: "atendimento_servico" })
servicos: Relation<Servico[]>;
```

O TypeORM cria a tabela `atendimento_servico` com **chave primária composta** (o par não se
repete) e um índice por coluna.

> **Se a ligação tem dados próprios** (data, quantidade, quem registrou), ela deixa de ser
> N:N e vira **uma entidade com dois `@ManyToOne`**. Empréstimo, matrícula, reserva e
> inscrição são quase sempre este caso.

### 7. `synchronize`: cômodo, e só por enquanto

Neste módulo o TypeORM altera as tabelas sozinho a cada inicialização (`synchronize: true`).
Muda a classe → salva → o log mostra o `ALTER TABLE`. É ótimo para aprender e **perigoso com
dados**: encurtar uma coluna preenchida faz o TypeORM apagá-la e recriá-la vazia, sem aviso.
O M05 troca isso por migrações, antes de existir qualquer dado que importe.

---

## 🧩 No projeto da equipe

### Passo 1 — Subir o banco

Instale o Docker ([guia de ambiente, passo 7](../../docs/ambiente-setup.md#passo-7--docker-e-postgresql-antes-do-m04)
— no Windows exige WSL2, **não deixe para a hora da aula**). Na raiz do repositório, crie
`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
```

```bash
docker compose up -d
docker compose exec db psql -U app -d app -c "\dt"    # "Did not find any relations."
```

### Passo 2 — Conectar a API

```bash
cd backend
npm install @nestjs/typeorm typeorm pg
```

`backend/.env` (e a chave, sem valor, no `.env.example`):

```ini
DATABASE_URL=postgres://app:devpassword@localhost:5432/app
```

No esquema do M03 (`src/config/esquema-env.ts`):

```ts
DATABASE_URL: z.string("DATABASE_URL é obrigatória").startsWith("postgres", "DATABASE_URL deve começar com postgres://"),
```

> ⚠️ **Esta linha não é opcional.** O `validate` **descarta** toda variável que não está no
> esquema. Sem ela, o TypeORM recebe `undefined` e o erro é `no PostgreSQL user name
> specified in startup packet` — sem mencionar `.env` nem esquema.

No `app.module.ts`, depois do `ConfigModule`:

```ts
TypeOrmModule.forRoot({
  type: "postgres",
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: true,    // só até o M05
  logging: true,        // mostra o SQL gerado; mantenham ligado
}),
```

**Deu certo se** a API sobe e o log mostra `query: SELECT version()`.

### Passo 3 — Uma entidade por vez

Organizem por área do domínio: `src/<area>/entidades/<nome>.entity.ts`, registrada no módulo
da área com `TypeOrmModule.forFeature([Entidade])`. **Entidade fora do `forFeature` não
existe** para o TypeORM.

O ciclo, para cada entidade da P1:

1. Escreva a classe.
2. Salve e **leia o `CREATE TABLE` / `ALTER TABLE` no log**.
3. Confira no banco: `docker compose exec db psql -U app -d app -c "\d <tabela>"`.
4. Commit.

Comecem pelas entidades do **cenário principal**. Dividam: cada par faz uma área, e um PR por
área. Quem revisa confere as justificativas do passo 4.

### Passo 4 — Justificar o modelo

Criem `docs/modelo-de-dados.md` com:

1. O **diagrama ER** em Mermaid:

   ```mermaid
   erDiagram
       PESSOA ||--o{ ATENDIMENTO : "é atendida em"
       ATENDIMENTO }o--o{ SERVICO : inclui
       ATENDIMENTO ||--o{ ANEXO : tem
   ```

2. Uma **tabela de decisões**, uma linha por coluna anulável, única ou chave estrangeira:

   | Entidade.campo | Decisão | Justificativa **de negócio** |
   | --- | --- | --- |
   | `Atendimento.pessoa` | `RESTRICT` | O histórico de atendimentos é o que a coordenação usa para relatórios; não pode sumir |
   | `Pessoa.cpf` | `unique` | A organização identifica as pessoas pelo CPF no balcão |
   | `Atendimento.concluidoEm` | `nullable` | `null` = atendimento em andamento |

Se uma decisão não é óbvia ("o que acontece com o histórico se alguém sair?"), registrem num [ADR](../../projeto/modelos-de-documentos/adr.md): é material da P4.

### Mínimo para a P2

- [ ] 5+ entidades, com ao menos uma 1:N e uma N:N (ou entidade de ligação com dados)
- [ ] Todas as propriedades de relação com `Relation<>`
- [ ] `docs/modelo-de-dados.md` com diagrama e decisões justificadas

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `ECONNREFUSED ::1:5432` | O contêiner não está de pé: `docker compose ps` |
| `no PostgreSQL user name specified in startup packet` | `DATABASE_URL` fora do esquema do `validate` |
| `password authentication failed` | `DATABASE_URL` não bate com o `docker-compose.yml` |
| `Entity metadata for X#y was not found` | A entidade não está no `forFeature` |
| `ReferenceError: Cannot access 'X' before initialization` | Propriedade de relação sem `Relation<>` |
| `error TS1272 ... must be imported with 'import type'` | Faltou `type` antes de `Relation` no import |
| Tudo virou `varchar(255)` | Faltou `type`/`length` no `@Column` |
| Uma coluna ficou vazia depois de mudar o tipo | Foi o `synchronize`. É o motivo do M05 |
| Apagar um cadastro apagou o histórico | `CASCADE` onde cabia `RESTRICT` |

## 🤖 IA no fluxo

A IA escreve entidades rápido e erra as decisões com a mesma facilidade: `nullable: true` em
tudo, `CASCADE` em toda relação, `float` para dinheiro, e quase nunca o `Relation<>`. Use-a
para o rascunho e para explicar o SQL do log. As decisões são de negócio: se ninguém da
equipe defende uma linha com um motivo da organização, ela não está pronta.

## ✅ Marco do módulo

- [ ] `docker-compose.yml` na raiz; a API conecta com `DATABASE_URL` validada
- [ ] Entidades do domínio da equipe no código, via PRs revisados, com o banco gerado delas
- [ ] `docs/modelo-de-dados.md` com diagrama ER e justificativa de cada decisão
- [ ] Cada integrante sabe explicar por que uma relação é `RESTRICT` e outra `CASCADE`

## 📚 Para aprofundar

- [`cheatsheet.md`](cheatsheet.md) — referência rápida de decorators e opções
- [TypeORM — Entities](https://typeorm.io/entities) · [Relations](https://typeorm.io/relations)
- [NestJS — Database](https://docs.nestjs.com/techniques/database)
- [Slides do M04](../../slides/m04-entidades.html)
