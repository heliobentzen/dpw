# M05 — Migrações: evoluir o banco com segurança

> **Pré-requisito:** M04 · **Duração:** média · **Semana:** 6
> **Ementa:** *Atualização do banco de dados a partir das alterações nas classes geradoras.*
> **No projeto:** o banco da equipe passa a nascer só de migrações · P2 (pré-requisito) e P3 (critério 1)

## Por que este módulo existe no projeto

Até aqui o `synchronize` alterava o banco sozinho. Funciona enquanto o banco é descartável.
A partir da semana 14, o banco do projeto vai estar **em produção, com dados reais da
organização** — e o `synchronize`, diante de uma coluna encurtada, apaga e recria vazia, sem
aviso.

Há um segundo motivo, que só aparece em equipe: **quatro pessoas, quatro bancos locais, um
banco de produção**. Sem um registro versionado de cada mudança, ninguém sabe se o banco de
um colega está igual ao seu. A migração é esse registro: um arquivo no Git, revisado em PR,
aplicado na mesma ordem em toda máquina.

## 🎯 Ao final do módulo

1. O `synchronize` está desligado e o banco do projeto é criado só por migrações.
2. A equipe sabe gerar, **ler**, aplicar e reverter uma migração.
3. Qualquer integrante apaga o banco e o recria idêntico com um comando.

---

## 📖 Conceitos

### 1. Migração: a mudança escrita antes de rodar

Uma migração é um arquivo com duas funções:

```ts
export class AdicionaTelefone1788295597072 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pessoa" ADD "telefone" varchar(20) NOT NULL DEFAULT ''`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pessoa" DROP COLUMN "telefone"`);
  }
}
```

| Elemento | Função |
| --- | --- |
| O número no nome | *Timestamp*: define a **ordem** de aplicação. Nunca edite |
| `up()` | Aplica a mudança |
| `down()` | Desfaz — na ordem inversa |
| Tabela `migrations` no banco | Registra o que já rodou; é assim que o TypeORM sabe o que falta |
| SQL cru, não repositório | A entidade de hoje pode não existir quando alguém rodar isto num banco antigo |

### 2. Gerar não é aplicar

```text
muda a entidade → migration:generate → LER O SQL → migration:run → commit
```

O passo do meio é humano. O `migration:generate` faz **a mesma dedução** que o
`synchronize`: diante de uma coluna encurtada, ele também escreve `DROP COLUMN` + `ADD
COLUMN`. A diferença é que agora vocês **leem antes** e podem escolher: aceitar, reescrever o
SQL (`ALTER COLUMN ... TYPE`), salvar o dado antes, ou desistir da mudança.

### 3. Duas formas de criar

| Comando | Quando |
| --- | --- |
| `migration:generate` | A mudança está **nas entidades**: o TypeORM compara e escreve |
| `migration:create` | A mudança está **na regra**, não na estrutura: arquivo vazio, vocês escrevem o SQL |

Exemplo de `migration:create`: a organização decide que todo cadastro antigo sem telefone
recebe `"não informado"`. Nenhuma entidade mudou — é uma **migração de dados**.

### 4. Reverter é parte do plano

`migration:revert` desfaz **a última aplicada**, uma por vez. Um `down()` nunca executado é
suposição, não plano de retorno. Se uma migração de dados não tem volta perfeita, **declare
isso num comentário** no `down()`.

### 5. Mudança em produção: expandir e contrair

Durante um deploy, versão antiga e nova do código rodam juntas por alguns minutos. Um
`RENAME COLUMN` instantâneo derruba a versão antiga, que procura o nome velho. Por isso,
mudança incompatível em produção se faz em passos:

| Passo | Migração | Código |
| --- | --- | --- |
| 1. Expandir | Cria a coluna nova, mantém a velha | Escreve nas duas |
| 2. Migrar | `UPDATE nova = velha` | — |
| 3. Trocar leitura | — | Lê só a nova |
| 4. Contrair | Remove a velha | — |

**No projeto:** até a semana 14 o banco de produção não existe, e mudanças simples bastam.
Depois do deploy (M12), toda renomeação ou remoção segue este padrão.

---

## 🧩 No projeto da equipe

Uma pessoa faz os passos 1 a 4 num PR; o resto da equipe faz o passo 5 depois do merge.

### Passo 1 — Um `DataSource` para a CLI

A CLI do TypeORM roda **fora do Nest** e precisa da configuração num arquivo próprio.

```bash
cd backend
npm install dotenv
npm install -D ts-node
```

`backend/src/data-source.ts`:

```ts
import "dotenv/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";

// Roda como .ts pela CLI (desenvolvimento) e como .js em dist/ (produção).
const pasta = dirname(fileURLToPath(import.meta.url));
const ext = import.meta.url.endsWith(".ts") ? "ts" : "js";

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [`${pasta}/**/*.entity.${ext}`],
  migrations: [`${pasta}/migracoes/*.${ext}`],
  synchronize: false,
});
```

A CLI procura a exportação **padrão** (`export default`). Os caminhos calculados fazem o
mesmo arquivo funcionar no deploy (M12), onde só existe `dist/`.

### Passo 2 — Desligar o `synchronize` na aplicação

No `app.module.ts`:

```ts
TypeOrmModule.forRoot({
  type: "postgres",
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: false,                    // ← era true
  migrations: ["dist/migracoes/*.js"],   // ← a aplicação roda compilada
  logging: true,
}),
```

> São **dois programas, dois caminhos**: a aplicação lê `dist/migracoes/*.js`; a CLI lê
> `src/migracoes/*.ts`. Se um comando "não enxerga" as migrações, quase sempre é o caminho do
> outro programa. E se esquecer o `synchronize: false` aqui, a aplicação desfaz o trabalho das
> migrações ao subir.

### Passo 3 — Os atalhos

Em `backend/package.json`, nos `scripts`:

```json
"typeorm": "typeorm-ts-node-esm -d src/data-source.ts",
"migration:generate": "npm run typeorm migration:generate",
"migration:run": "npm run typeorm migration:run",
"migration:revert": "npm run typeorm migration:revert",
"migration:create": "typeorm-ts-node-esm migration:create",
"migration:check": "npm run typeorm migration:generate src/migracoes/Pendente -- --check"
```

O `migration:create` não leva o `-d` (ele só cria um arquivo vazio e recusa o parâmetro com
`Unknown argument: d`).

### Passo 4 — A migração inicial

O banco atual veio do `synchronize`. Recriem pelo caminho oficial — **é a última vez que
apagar o banco é inofensivo**:

```bash
docker compose down -v && docker compose up -d
npm run migration:generate src/migracoes/Inicial
```

**Leiam o arquivo gerado** com o `docs/modelo-de-dados.md` ao lado: cada `CREATE TABLE`,
`CREATE TYPE` (enums) e `FOREIGN KEY ... ON DELETE` deve corresponder a uma decisão de
vocês. Depois:

```bash
npm run migration:run
npm run migration:check     # "No changes in database schema were found"
```

Acrescentem ao README da raiz:

````markdown
## Banco de dados

O esquema é criado **só** por migrações.

```bash
docker compose up -d
cd backend
npm run migration:run
```

Mudou uma entidade? `npm run migration:generate src/migracoes/NomeDaMudanca`, **leia o SQL**,
`npm run migration:run`, e commite a migração junto com a entidade.
````

### Passo 5 — Cada integrante recria o banco do zero

Depois do merge, **cada pessoa**, na própria máquina:

```bash
git pull
docker compose down -v && docker compose up -d
cd backend && npm run migration:run
```

**Deu certo se** todos chegam ao mesmo esquema só com o README. É a promessa do módulo.

### As regras da equipe para migrações

Combinem e registrem no contrato de equipe:

| Regra | Por quê |
| --- | --- |
| **Entidade e migração no mesmo PR** | Uma sem a outra quebra o banco de quem fizer `pull` |
| **Uma migração por PR, gerada sobre a `main` atualizada** | Duas migrações geradas em paralelo, a partir do mesmo estado, podem repetir ou conflitar a mesma mudança |
| **Se a `main` andou antes do merge**: apague a sua migração, `git pull`, `migration:run`, gere de novo | É mais rápido que consertar à mão |
| **Nunca edite uma migração que já está na `main`** | Ela já rodou em outros bancos; crie uma nova |
| **O revisor do PR lê o SQL** | Procura `DROP COLUMN` e `DROP TABLE` inesperados |

No M10, o CI passa a rodar `migration:run` e `migration:check` num banco vazio: migração
esquecida deixa o PR vermelho.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `Unknown argument: d` | `migration:create` chamado pelo script `typeorm`; use o atalho próprio |
| `No changes in database schema were found` logo após mudar a entidade | O arquivo não foi salvo, ou a entidade não bate com o padrão `**/*.entity.ts` |
| A aplicação recria tabelas ao subir | Faltou `synchronize: false` no `app.module.ts` |
| `relation "x" already exists` | O banco veio do `synchronize`; recrie com `down -v` (só antes de ter dados reais) |
| `column "x" contains null values` | Coluna `NOT NULL` nova sem `default` numa tabela com linhas |
| Colega roda `migration:run` e dá erro de duplicata | Duas migrações paralelas fizeram a mesma mudança; siga a regra "gerar sobre a `main`" |

## 🤖 IA no fluxo

Peça *"explique cada linha desta migração e aponte o que pode perder dado"* — é um bom
segundo par de olhos. Mas "esse dado pode sumir?" é pergunta de negócio: a IA não sabe quanto
vale aquela coluna para a organização.

## ✅ Marco do módulo

- [ ] `synchronize: false`; migração inicial versionada em `backend/src/migracoes/`
- [ ] `migration:run`, `migration:revert` e `migration:check` funcionando
- [ ] **Cada integrante** recriou o banco do zero só com o README
- [ ] Regras de migração registradas no contrato de equipe

## 📚 Para aprofundar

- [TypeORM — Migrations](https://typeorm.io/migrations)
- [Martin Fowler — Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [Parallel change (expand/contract)](https://martinfowler.com/bliki/ParallelChange.html)
