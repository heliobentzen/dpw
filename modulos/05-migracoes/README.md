# M05 — Migrações

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 5** · **Pré-requisito:** M04

O `synchronize: true` do M04 foi um andaime. Aqui ele cai, e o banco passa a evoluir por
arquivos versionados — que é como se altera um banco que tem dado dentro.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar por que `synchronize` não pode ir para produção.
2. Gerar, revisar e aplicar migrações; e reverter quando der errado.
3. Escrever uma migração de **dados**, não só de esquema.
4. Planejar uma mudança incompatível pela estratégia expandir/contrair.

---

## 📖 Teoria (1h)

### 1. O que o `synchronize` não sabe decidir

O `synchronize` compara entidades × banco e aplica a diferença. Ele acerta o caso fácil
(coluna nova, tabela nova) e **erra sozinho** o caso difícil:

| Mudança | O que o `synchronize` faz | O que deveria acontecer |
|---|---|---|
| Renomear `sinopse` → `resumo` | Ele **não vê** renomeação: apaga `sinopse` e cria `resumo` vazia | Copiar os dados |
| `varchar(200)` → `varchar(50)` | Trunca ou falha, dependendo do banco | Decidir o que fazer com os textos longos |
| `nullable` → `NOT NULL` com linhas nulas | Falha | Preencher um padrão, depois apertar a regra |

O problema não é o `synchronize` ser ruim; é que essas perguntas **não têm resposta
automática**. Elas dependem do negócio. Migração é o lugar onde a resposta fica registrada,
revisada em PR e aplicada na mesma ordem em toda máquina.

### 2. Uma migração é código versionado

```ts
export class AdicionaDestaqueEmObra1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { /* aplicar */ }
  public async down(queryRunner: QueryRunner): Promise<void> { /* desfazer */ }
}
```

| Elemento | Função |
|---|---|
| O número no nome | *Timestamp*. Define a **ordem** de aplicação. Nunca o edite |
| `up()` | O que a mudança faz |
| `down()` | Como voltar atrás. `down` vazio significa "mudança irreversível" — declare isso de propósito, não por preguiça |
| tabela `migrations` | O TypeORM registra ali o que já rodou. É assim que ele sabe o que falta |

### 3. Migração de esquema × migração de dados

```ts
// esquema: muda a forma
await queryRunner.query(`ALTER TABLE "obra" ADD "destaque" boolean NOT NULL DEFAULT false`);

// dados: muda o conteúdo
await queryRunner.query(`UPDATE "obra" SET destaque = true WHERE "anoPublicacao" < 1900`);
```

As duas são migrações. A segunda o TypeORM **não gera para você** — ela sai da sua cabeça,
porque só você sabe a regra.

### 4. Expandir e contrair

Como renomear uma coluna sem derrubar o sistema? Não de uma vez.

```
    ANTES              EXPANDIR             MIGRAR            CONTRAIR
  ┌─────────┐      ┌─────────────┐     ┌─────────────┐     ┌─────────┐
  │ sinopse │  →   │ sinopse     │  →  │ sinopse     │  →  │ resumo  │
  └─────────┘      │ resumo (novo)│     │ resumo(cópia)│     └─────────┘
                   └─────────────┘     └─────────────┘
                    código escreve       código lê de
                    nos dois              resumo
```

| Passo | Migração | Deploy |
|---|---|---|
| 1. Expandir | Cria `resumo`, mantém `sinopse` | Código escreve nas duas |
| 2. Migrar | `UPDATE resumo = sinopse` | — |
| 3. Trocar leitura | — | Código lê só `resumo` |
| 4. Contrair | Remove `sinopse` | — |

Parece burocracia até a primeira vez que um deploy é revertido: com expandir/contrair, o
código antigo continua funcionando com o banco novo. Sem ele, reverter significa restaurar
backup.

💼 **No mercado:** "como você renomearia uma coluna de uma tabela com 10 milhões de linhas,
sem downtime?" é pergunta clássica de entrevista pleno. A resposta é esta seção.

---

## 🛠️ Roteiro prático (2h)

> 📦 **Instale o Docker antes desta aula** — ele entra no Passo 5.
> 🐧 [`ambiente-setup.md`, seção 7](../../docs/ambiente-setup.md#7-postgresql-via-docker-a-partir-do-m05) ·
> 🪟 [`ambiente-setup-windows.md`, passo 7](../../docs/ambiente-setup-windows.md#passo-7--docker-e-postgresql)
> — no Windows o Docker exige o WSL2, então **não deixe para a hora da aula**.

### Passo 1 — Desligar o `synchronize` (20 min)

O TypeORM CLI precisa de um `DataSource` que ele consiga carregar sozinho, fora do Nest.
Crie `backend/src/data-source.ts`:

```ts
import "dotenv/config";
import { DataSource } from "typeorm";

export default new DataSource({
  type: "sqlite",
  database: "bibliocom.sqlite",
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migracoes/*.ts"],
  synchronize: false,
});
```

| Linha | O que faz |
|---|---|
| `import "dotenv/config"` | Carrega o `.env`. A CLI roda fora do Nest, então o `ConfigModule` não está disponível |
| `entities: [...]` | Onde procurar as classes. É delas que a migração é derivada |
| `migrations: [...]` | Onde gravar e de onde ler os arquivos |
| `synchronize: false` | **A linha do módulo.** A partir daqui, o banco só muda por migração |

Em `app.module.ts`, troque `synchronize: true` por `synchronize: false` e acrescente
`migrations: ["dist/migracoes/*.js"]`.

> Repare no `dist/`: a aplicação roda **compilada**, a CLI roda o **fonte**. Caminhos
> diferentes para a mesma coisa é a confusão nº 1 deste módulo.

Acrescente ao `package.json` do backend:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs -d src/data-source.ts",
    "migration:generate": "pnpm typeorm migration:generate",
    "migration:run": "pnpm typeorm migration:run",
    "migration:revert": "pnpm typeorm migration:revert"
  }
}
```

### Passo 2 — A migração inicial (25 min)

Apague o `bibliocom.sqlite` — vamos recriar o banco pelo caminho oficial:

```bash
# Linux / macOS / WSL / Git Bash
rm bibliocom.sqlite
pnpm migration:generate src/migracoes/Inicial
pnpm migration:run
```

```powershell
# Windows PowerShell
Remove-Item bibliocom.sqlite
pnpm migration:generate src/migracoes/Inicial
pnpm migration:run
```

**Abra o arquivo gerado e leia.** Ele é o M04 inteiro, em SQL: cada `CREATE TABLE`, cada
chave estrangeira, cada índice.

| Comando | O que faz |
|---|---|
| `migration:generate <caminho>` | Compara entidades × banco e **escreve** o arquivo. Não aplica |
| `migration:run` | Aplica o que ainda não rodou, em ordem de timestamp |

**Deu certo se:** a tabela `migrations` existe e tem uma linha.

> ⚠️ **Gerar não é aplicar.** São dois comandos porque entre eles existe um passo humano:
> **revisar**. Migração que ninguém leu é migração que apaga dados.

### Passo 3 — Uma coluna nova, do jeito certo (20 min)

Acrescente à entidade `Obra`:

```ts
@Column({ type: "boolean", default: false })
destaque: boolean;
```

```bash
pnpm migration:generate src/migracoes/AdicionaDestaque
pnpm migration:run
```

Confira o arquivo: deve conter um `ADD "destaque"` com `DEFAULT false`. O `default` importa
— sem ele, as linhas existentes ficariam nulas numa coluna `NOT NULL`, e a migração falharia.

Agora reverta e observe:

```bash
pnpm migration:revert
```

A coluna some. Rode `migration:run` de novo e ela volta. **É este par que torna o deploy
reversível.**

### Passo 4 — Migração de dados (25 min)

Crie uma migração **vazia** e escreva o SQL você mesmo:

```bash
pnpm typeorm migration:create src/migracoes/DestacaObrasAntigas
```

> `migration:create` (vazia) é diferente de `migration:generate` (derivada das entidades).
> Migração de dados não pode ser gerada: a regra está na sua cabeça, não nas classes.

```ts
export class DestacaObrasAntigas1738000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "obra" SET "destaque" = 1 WHERE "anoPublicacao" IS NOT NULL AND "anoPublicacao" < 1900`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "obra" SET "destaque" = 0`);
  }
}
```

⚠️ Repare no `down`: ele **não** restaura o estado anterior com fidelidade — zera tudo,
inclusive destaques marcados à mão. Isso é honesto e deve estar comentado no arquivo.
Migração de dados frequentemente não é perfeitamente reversível; declare isso em vez de
fingir que é.

### Passo 5 — Trocar SQLite por PostgreSQL (20 min)

Este passo demonstra a promessa central do ORM: **o código da aplicação não muda**.

```bash
docker compose up -d          # docker-compose.yml nos guias de setup
pnpm add pg
pnpm remove sqlite3
```

No `data-source.ts` e no `app.module.ts`, troque o bloco de conexão:

```ts
type: "postgres",
url: process.env.DATABASE_URL,
```

`backend/.env`:

```ini
DATABASE_URL=postgres://bibliocom:devpassword@localhost:5432/bibliocom
```

```bash
pnpm migration:run
```

**Deu certo se:** as tabelas nasceram no PostgreSQL, **sem nenhuma alteração em entidade,
service ou controller**.

> ⚠️ **As migrações que você gerou são SQL do SQLite.** Se `migration:run` falhar no
> PostgreSQL, é esperado e é o conteúdo: apague `src/migracoes/`, apague o banco e gere de
> novo contra o PostgreSQL. Cada banco tem seu dialeto — o ORM abstrai o **código**, não o
> **SQL gerado**. Daqui em diante, gere migrações contra o mesmo banco que roda em produção.

Note também: `simple-enum` do M04 vira `enum` de verdade no PostgreSQL. O tipo que o SQLite
não tinha existe aqui.

### Passo 6 — Renomear com expandir/contrair (30 min, em duplas)

Renomeie `Obra.sinopse` para `Obra.resumo` **sem perder dados**, nos quatro passos da
teoria. Uma migração por passo:

1. `ExpandeResumo` — adiciona `resumo`
2. `CopiaSinopseParaResumo` — `UPDATE obra SET resumo = sinopse`
3. *(sem migração — seria o deploy do código que lê `resumo`)*
4. `RemoveSinopse` — remove `sinopse`

Ao final, rode `migration:revert` quatro vezes e confira que o banco voltou ao início, com
os dados intactos.

**Pergunta para a dupla responder por escrito:** entre os passos 1 e 4, o sistema aceita
ser revertido para a versão anterior do código? E entre 3 e 4? Justifiquem.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `No changes in database schema were found` | As entidades já batem com o banco. Você salvou o arquivo? |
| `Cannot find module 'src/data-source.ts'` | Rode o comando de dentro de `backend/` |
| A migração roda pela CLI mas não na aplicação | Caminhos diferentes: `src/**/*.ts` na CLI, `dist/**/*.js` na app |
| `QueryFailedError: relation already exists` | O banco já tinha as tabelas do `synchronize`. Apague e recrie pelas migrações |
| Migração gerada no SQLite falha no PostgreSQL | Esperado — dialetos diferentes. Regenere contra o banco de produção |
| `migration:revert` desfez a errada | Ele reverte **a última aplicada**, sempre. Não escolhe |
| Conflito de merge em migração | Duas pessoas geraram no mesmo dia. Renomeie o timestamp da mais nova para depois |
| Coluna nova `NOT NULL` falha | Faltou `default`, e há linhas existentes |

## ✅ Checklist de saída

- [ ] `synchronize: false` nos dois lugares
- [ ] Migração inicial gerada, **lida** e aplicada
- [ ] Uma migração de esquema aplicada e revertida com sucesso
- [ ] Uma migração de **dados**, escrita à mão, com `down` honesto
- [ ] PostgreSQL rodando; nenhuma entidade ou service alterado na troca
- [ ] Renomeação feita por expandir/contrair, sem perda de dados
- [ ] Migrações versionadas no Git; `bibliocom.sqlite` **não**
- [ ] Você sabe explicar por que gerar e aplicar são comandos separados

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Migrations](https://typeorm.io/migrations)
- [Expand/Contract pattern (Martin Fowler)](https://martinfowler.com/bliki/ParallelChange.html)
- [PostgreSQL — ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
