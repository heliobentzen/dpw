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

O `synchronize` compara entidades × banco e aplica a diferença. No passo 7 do M04 você viu
os dois comportamentos dele lado a lado:

| Mudança | O que o `synchronize` faz | Consequência |
|---|---|---|
| Renomear uma coluna | Deduz a renomeação e emite `RENAME COLUMN` | Acerta — **quando o palpite está certo** |
| Renomear **duas** colunas do mesmo tipo de uma vez | Deduz, e pode trocar uma pela outra | Dados no campo errado |
| `text` → `varchar(10)` com dado dentro | `DROP COLUMN` seguido de `ADD COLUMN` | **Perda total, sem aviso** |
| `nullable` → `NOT NULL` com linhas nulas | Falha na inicialização | A aplicação não sobe |

O `synchronize` não é ruim, e o problema não é que ele erre. **É que você não sabe qual dos
comportamentos vai acontecer antes de rodar** — e um deles apaga dados em silêncio, com a
aplicação subindo normalmente.

Essas perguntas não têm resposta automática: elas dependem do negócio. Ninguém além de você
sabe se os textos longos devem ser truncados, movidos para outra tabela ou recusados.
Migração é o lugar onde a resposta fica registrada **antes de rodar**, revisada em *pull
request* e aplicada na mesma ordem em toda máquina.

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

> **"Mas o `synchronize` renomeia sozinho!"** Renomeia — num banco parado. Em produção o
> código antigo ainda está rodando enquanto o novo sobe: por alguns minutos, duas versões
> falam com o mesmo banco. Um `RENAME` instantâneo derruba a versão antiga na hora. É por
> isso que expandir/contrair existe mesmo quando a ferramenta sabe renomear.

Parece burocracia até o dia em que você precisa reverter um deploy. Com expandir/contrair,
o código antigo continua funcionando com o banco novo. Sem ele, reverter significa restaurar
backup, e aí a conversa muda de tom.

💼 **No mercado:** "como você renomearia uma coluna de uma tabela com 10 milhões de linhas,
sem downtime?" é pergunta clássica de entrevista pleno. A resposta é esta seção.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Desligar o `synchronize` (25 min)

#### 1a. Um `DataSource` para a CLI

A CLI do TypeORM roda **fora do Nest**: ela não tem `ConfigModule`, não tem injeção de
dependência e não conhece o `app.module.ts`. Ela precisa de um arquivo que exporte a
configuração sozinho.

Crie `backend/src/data-source.ts`:

```ts
import "dotenv/config";
import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migracoes/*.ts"],
  synchronize: false,
});
```

| Linha | O que faz |
|---|---|
| `import "dotenv/config"` | Carrega o `.env`. Sem o Nest, o `ConfigModule` não está disponível |
| `export default` | A CLI procura a exportação padrão. Exportação nomeada não serve |
| `entities: [...]` | Onde procurar as classes. É delas que a migração é derivada |
| `migrations: [...]` | Onde gravar e de onde ler os arquivos |
| `synchronize: false` | **A linha do módulo.** A partir daqui, o banco só muda por migração |

```bash
cd backend
pnpm add dotenv
```

#### 1b. Desligar na aplicação também

Em `app.module.ts`, troque `synchronize: true` por `synchronize: false` e acrescente
`migrations: ["dist/migracoes/*.js"]`.

> Repare no `dist/`: a aplicação roda **compilada**, a CLI roda o **fonte**. Caminhos
> diferentes para a mesma coisa. Guarde isso: é o que mais confunde neste módulo.

São dois lugares porque são dois programas. Esquecer o do `app.module.ts` é o erro clássico:
tudo parece funcionar, até alguém subir a aplicação e o `synchronize` desfazer o trabalho
das migrações.

#### 1c. Os atalhos

Em `backend/package.json`:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs -d src/data-source.ts",
    "migration:generate": "pnpm typeorm migration:generate",
    "migration:run": "pnpm typeorm migration:run",
    "migration:revert": "pnpm typeorm migration:revert",
    "migration:create": "typeorm-ts-node-commonjs migration:create"
  }
}
```

| Script | Detalhe |
|---|---|
| `typeorm-ts-node-commonjs` | Executa a CLI através do `ts-node`, para ela ler os `.ts` direto. Já vem instalado com o projeto do Nest |
| `-d src/data-source.ts` | Diz à CLI onde está a configuração |
| `migration:create` **sem o `-d`** | ⚠️ Este comando só escreve um arquivo vazio: não conecta no banco e **recusa** o `-d`. Passá-lo dá `Unknown argument: d` |

### Passo 2 — A migração inicial (20 min)

O banco de hoje foi construído pelo `synchronize`. Vamos recriá-lo pelo caminho oficial,
para que exista uma migração descrevendo o estado inicial.

```bash
docker compose down -v && docker compose up -d
```

O `-v` apaga o volume — o banco inteiro. Aqui isso é seguro porque não há nada que importe
dentro; é a última vez no curso que essa frase será verdadeira.

```bash
pnpm migration:generate src/migracoes/Inicial
```

| Comando | O que faz |
|---|---|
| `migration:generate <caminho>` | Compara entidades × banco e **escreve** o arquivo. Não aplica |
| `migration:run` | Aplica o que ainda não rodou, em ordem de timestamp |

**Abra o arquivo gerado e leia.** Ele é o M04 inteiro, em SQL: cada `CREATE TABLE`, cada
`CREATE TYPE` do enum, cada índice, cada chave estrangeira — e um `down()` que desfaz tudo
na ordem inversa.

Repare nos nomes das constraints: `PK_51d3959df48c82010ae1c4907fb`, `FK_1fa7f93a...`. São
*hashes* gerados pelo TypeORM. Feios, e propositalmente estáveis: é assim que o `down()`
consegue derrubar exatamente a constraint que o `up()` criou.

```bash
pnpm migration:run
```

**Deu certo se:** o terminal mostra `Migration Inicial<timestamp> has been executed
successfully`, e a tabela `migrations` tem uma linha:

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT * FROM migrations;"
```

> ⚠️ **Gerar não é aplicar.** São dois comandos porque entre eles cabe um passo humano:
> **revisar**. Migração que ninguém leu é migração que apaga dados calada — exatamente o
> que o passo 7 do M04 mostrou o `synchronize` fazendo.

### Passo 3 — Uma coluna nova, do jeito certo (25 min)

#### 3a. Gerar e aplicar

Acrescente à entidade `Obra`:

```ts
@Column({ type: "boolean", default: false })
destaque: boolean;
```

```bash
pnpm migration:generate src/migracoes/AdicionaDestaque
```

Confira o arquivo antes de aplicar. Ele deve ter uma linha só:

```ts
await queryRunner.query(`ALTER TABLE "obra" ADD "destaque" boolean NOT NULL DEFAULT false`);
```

O `DEFAULT false` importa: sem ele, as linhas existentes ficariam nulas numa coluna
`NOT NULL`, e a migração falharia. O TypeORM só soube colocá-lo porque você escreveu
`default: false` na entidade.

```bash
pnpm migration:run
```

#### 3b. Reverter, que é a metade que ninguém testa

```bash
pnpm migration:revert
```

O log mostra `ALTER TABLE "obra" DROP COLUMN "destaque"` e a coluna some. Confirme:

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c "\d obra"
```

Rode `pnpm migration:run` de novo e ela volta.

**É este par que torna o deploy reversível.** Um `down()` que ninguém executou é uma
suposição, não um plano de retorno — e a hora de descobrir que ele não funciona não é às
duas da manhã com o sistema fora do ar.

> `migration:revert` desfaz **a última aplicada**, sempre, uma por vez. Ele não escolhe e
> não aceita o nome de uma migração específica.

#### 3c. A mesma mudança destrutiva, agora visível

Repita a provocação do M04, agora com migração no caminho. Encurte a `biografia` da `Autor`:

```ts
@Column({ type: "varchar", length: 10, default: "" })
biografia: string;
```

```bash
pnpm migration:generate src/migracoes/EncurtaBiografia
```

**Não rode.** Abra o arquivo:

```ts
await queryRunner.query(`ALTER TABLE "autor" DROP COLUMN "biografia"`);
await queryRunner.query(`ALTER TABLE "autor" ADD "biografia" character varying(10) NOT NULL DEFAULT ''`);
```

É exatamente o que o `synchronize` fez no M04 — o mesmo `DROP` seguido do mesmo `ADD`, a
mesma perda de dados. **A diferença inteira do módulo está em uma palavra: agora você está
lendo isso antes de acontecer.**

Aqui você tem escolha. Pode aceitar; pode trocar por um `ALTER COLUMN ... TYPE varchar(10)`
escrito à mão, que trunca em vez de apagar; pode decidir que a regra de negócio está errada
e o campo deve continuar `text`. Nenhuma dessas decisões o `synchronize` conseguiria tomar,
porque nenhuma delas está na entidade.

Apague o arquivo gerado e desfaça a mudança na entidade — este passo era para ler, não para
aplicar.

### Passo 4 — Migração de dados (25 min)

Regra nova: obras publicadas antes de 1900 entram em destaque. Isso não está em nenhuma
entidade — está na cabeça de quem pediu.

```bash
pnpm migration:create src/migracoes/DestacaObrasAntigas
```

> `migration:create` (vazia) é diferente de `migration:generate` (derivada das entidades).
> Migração de dados não pode ser gerada: a regra não está nas classes.

O arquivo nasce com `up` e `down` vazios. Preencha:

```ts
export class DestacaObrasAntigas1738000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "obra" SET "destaque" = true
       WHERE "anoPublicacao" IS NOT NULL AND "anoPublicacao" < 1900`,
    );
  }

  // ⚠️ Este down NÃO restaura o estado anterior: zera tudo, inclusive
  // destaques marcados à mão. Ver comentário abaixo.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "obra" SET "destaque" = false`);
  }
}
```

| Trecho | Por quê |
|---|---|
| `= true` | Booleano do PostgreSQL. Alguns bancos aceitam `1`; este não |
| `IS NOT NULL AND < 1900` | Sem a primeira condição, obras sem ano ficam de fora do `WHERE` de qualquer jeito — mas escrevê-la deixa a intenção explícita para quem revisar |
| `queryRunner.query` com SQL cru | Migração usa SQL, não o repositório. A entidade de hoje pode não existir mais quando alguém rodar isto num banco antigo |

Antes de aplicar, coloque dado para a regra morder:

```bash
docker compose exec db psql -U bibliocom -d bibliocom -c \
  "INSERT INTO autor (nome) VALUES ('Machado de Assis');
   INSERT INTO obra (titulo, \"anoPublicacao\", \"autorId\") VALUES
     ('Dom Casmurro', 1899, 1), ('Grande Sertão', 1956, 1);"
```

```bash
pnpm migration:run
docker compose exec db psql -U bibliocom -d bibliocom -c \
  "SELECT titulo, \"anoPublicacao\", destaque FROM obra;"
```

**Deu certo se:** *Dom Casmurro* está com `destaque = t` e *Grande Sertão* com `f`.

⚠️ **Olhe o `down` de novo.** Ele zera **todos** os destaques, inclusive os que alguém
marcou à mão depois. Não é reversível de verdade — é o mais próximo disso que dá para fazer
sem guardar o estado anterior numa tabela auxiliar. Comente essa limitação no arquivo, como
está no exemplo. Migração de dados raramente é perfeitamente reversível, e é melhor declarar
a limitação do que descobri-la no pior momento possível.

### Passo 5 — Renomear com expandir/contrair (25 min)

Renomeie `Obra.sinopse` para `Obra.resumo` **sem perder dados e sem janela em que o sistema
quebre**, nos quatro passos da teoria. Uma migração por passo:

| # | Migração | Conteúdo |
|---|---|---|
| 1 | `ExpandeResumo` | `ADD COLUMN "resumo"` — sem tocar em `sinopse` |
| 2 | `CopiaSinopseParaResumo` | `UPDATE obra SET resumo = sinopse` |
| 3 | *(sem migração)* | Seria o deploy do código que passa a ler `resumo` |
| 4 | `RemoveSinopse` | `DROP COLUMN "sinopse"` |

Comece pondo texto na `sinopse` de alguma obra, para ter o que preservar. Ao final, rode
`pnpm migration:revert` três vezes e confira que o banco voltou ao início **com os dados
intactos**.

⚠️ Use `migration:create` nos quatro, e escreva o SQL você mesmo. Se você usar
`migration:generate` no passo 1, o TypeORM vai deduzir uma renomeação e gerar um
`RENAME COLUMN` — que é exatamente o que este exercício existe para evitar.

**Responda por escrito:** entre os passos 1 e 4, o sistema aceita ser revertido para a
versão anterior do código? E depois do 4? Justifique.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Unknown argument: d` | Você chamou `migration:create` pelo script `typeorm`, que fixa o `-d`. Use o script `migration:create` |
| `No changes in database schema were found` | As entidades já batem com o banco. Você salvou o arquivo? |
| `Cannot find module 'src/data-source.ts'` | Rode o comando de dentro de `backend/` |
| `DataSource is not set` / a CLI não acha a configuração | Faltou `export default` no `data-source.ts` |
| A migração roda pela CLI mas não na aplicação | Caminhos diferentes: `src/**/*.ts` na CLI, `dist/**/*.js` na app |
| `QueryFailedError: relation already exists` | O banco ainda tem as tabelas do `synchronize`. `docker compose down -v` e recrie pelas migrações |
| As tabelas voltaram a mudar sozinhas | Faltou `synchronize: false` no `app.module.ts` — só o `data-source.ts` não basta |
| `migration:revert` desfez a errada | Ele reverte **a última aplicada**, sempre. Não escolhe |
| Conflito de merge em migração | Duas pessoas geraram no mesmo dia. Renomeie o timestamp da mais nova para depois |
| Coluna nova `NOT NULL` falha | Faltou `default` na entidade, e há linhas existentes |

## ✅ Checklist de saída

- [ ] `synchronize: false` nos **dois** lugares
- [ ] Migração inicial gerada, **lida** e aplicada; tabela `migrations` com registro
- [ ] Uma migração de esquema aplicada, revertida e reaplicada
- [ ] Uma migração de **dados**, escrita à mão, com `down` honesto e comentado
- [ ] Renomeação feita por expandir/contrair, sem perda de dados
- [ ] Migrações versionadas no Git
- [ ] Você sabe explicar por que gerar e aplicar são comandos separados
- [ ] Você sabe explicar por que expandir/contrair existe mesmo com o `RENAME` disponível

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Migrations](https://typeorm.io/migrations)
- [Expand/Contract pattern (Martin Fowler)](https://martinfowler.com/bliki/ParallelChange.html)
- [PostgreSQL — ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
