# M05 — Migrações

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 5** · **Pré-requisito:** M04

O `synchronize: true` do M04 foi um andaime. Aqui ele cai, e o banco passa a evoluir por
arquivos versionados — que é como se altera um banco que tem dado dentro.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 1, 6, 9 e 11 — em
> que a gente para de digitar e lê — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar por que `synchronize` não pode ir para produção.
2. Gerar, revisar e aplicar migrações; e reverter quando der errado.
3. Escrever uma migração de **dados**, não só de esquema.
4. Planejar uma mudança incompatível pela estratégia expandir/contrair.

---

## 🧭 O que você vai construir

Uma pasta `src/migracoes/` com quatro ou cinco arquivos numerados, versionados no Git, que
descrevem **toda** a história do banco — do `CREATE TABLE` inicial até a última coluna
renomeada. Qualquer pessoa que clonar o repositório reproduz o banco exato rodando um
comando.

E, mais importante: a partir daqui **nenhuma mudança no banco acontece sem alguém ter lido o
SQL antes**.

## 📋 Como este módulo funciona

Mesmo formato do M03 e do M04. Doze etapas curtas, e as duas primeiras existem para você
entender *por que* está desmontando algo que funcionava.

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

### As doze etapas

| # | Etapa | Min | O que entra |
|---|---|---|---|
| 1 | [**Por que trocar o que funciona**](#etapa-1--por-que-trocar-o-que-funciona-15-min) | 15 | **o porquê das migrações** |
| 2 | [Um `DataSource` para a CLI](#etapa-2--um-datasource-para-a-cli-15-min) | 15 | `data-source.ts`, `ts-node` |
| 3 | [Desligar o `synchronize`](#etapa-3--desligar-o-synchronize-10-min) | 10 | dois lugares, dois programas |
| 4 | [Os atalhos](#etapa-4--os-atalhos-10-min) | 10 | scripts, e um que não aceita `-d` |
| 5 | [A migração inicial](#etapa-5--a-migração-inicial-15-min) | 15 | `generate` e `run` |
| 6 | [**Ler a migração gerada**](#etapa-6--ler-a-migração-gerada-15-min) | 15 | **anatomia de uma migração** |
| 7 | [Uma coluna nova](#etapa-7--uma-coluna-nova-15-min) | 15 | o ciclo completo |
| 8 | [Reverter](#etapa-8--reverter-15-min) | 15 | `down`, e por que testá-lo |
| 9 | [**A mesma destruição, agora visível**](#etapa-9--a-mesma-destruição-agora-visível-15-min) | 15 | **o argumento do módulo** |
| 10 | [Migração de dados](#etapa-10--migração-de-dados-20-min) | 20 | `create` vs `generate` |
| 11 | [**Expandir e contrair**](#etapa-11--expandir-e-contrair-15-min) | 15 | **deploy sem downtime** |
| 12 | [Expandir e contrair na prática](#etapa-12--expandir-e-contrair-na-prática-20-min) | 20 | quatro migrações |

---

## Etapa 1 — Por que trocar o que funciona (15 min)

Você terminou o M04 com um banco completo, gerado sozinho a partir das classes. Funcionava.
Por que desmontar isso?

Porque na etapa 16 do M04 você viu o `synchronize` fazer duas coisas muito diferentes com a
mesma naturalidade:

| Mudança | O que ele fez | Consequência |
|---|---|---|
| Renomear uma coluna | Deduziu e emitiu `RENAME COLUMN` | Acertou — **naquele caso** |
| Renomear **duas** colunas do mesmo tipo de uma vez | Deduz, e pode trocar uma pela outra | Dados no campo errado |
| `text` → `varchar(10)` com dado dentro | `DROP COLUMN` seguido de `ADD COLUMN` | **Perda total, sem aviso** |
| `nullable` → `NOT NULL` com linhas nulas | Falha na inicialização | A aplicação não sobe |

### O problema não é que ele erre

Repare na segunda coluna da tabela: em dois dos quatro casos o `synchronize` acertou. Ele é
razoavelmente esperto.

**O problema é que você não sabe qual comportamento vai receber antes de rodar** — e um deles
apaga dados em silêncio, com a aplicação subindo normalmente e nenhum erro em lugar nenhum.

### Por que não dá para automatizar melhor

Essas perguntas **não têm resposta automática**, e não é limitação de ferramenta:

- Os textos que não cabem em `varchar(10)` devem ser truncados, movidos para outra tabela, ou
  a mudança deve ser recusada?
- A coluna nova `NOT NULL` recebe qual valor nas linhas que já existem?
- Renomear `sinopse` para `resumo` é renomeação mesmo, ou são dois campos diferentes e o
  antigo deve sumir?

Só quem conhece o negócio responde. **Migração é o lugar onde essa resposta fica registrada**
— escrita antes de rodar, revisada em *pull request*, e aplicada na mesma ordem em toda
máquina, da sua até a de produção.

> A troca que este módulo faz, em uma frase: você deixa de **descobrir** o que aconteceu com
> o banco e passa a **decidir** o que vai acontecer.

💼 **No mercado:** `synchronize: true` num repositório é achado de auditoria. Saber explicar
por que ele não pode ir para produção é pergunta corriqueira em entrevista de backend.

---

## Etapa 2 — Um `DataSource` para a CLI (15 min)

A CLI do TypeORM roda **fora do Nest**: não tem `ConfigModule`, não tem injeção de
dependência e não conhece o `app.module.ts`. Ela precisa de um arquivo que exporte a
configuração sozinho.

**Faça:** crie `backend\src\data-source.ts`:

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `import "dotenv/config"` | Carrega o `.env` para dentro do `process.env`. Sem o Nest, o `ConfigModule` não está aqui para fazer isso |
| `export default` | A CLI procura a **exportação padrão**. Exportação nomeada não serve, e o erro que isso dá não diz isso |
| `entities: [...]` | Onde procurar as classes. É delas que a migração é derivada |
| `migrations: [...]` | Onde gravar os arquivos novos e de onde ler os existentes |
| `synchronize: false` | **A linha do módulo.** A partir daqui, o banco só muda por migração |
| `src/**/*.ts` | Caminhos do **fonte**, não do compilado. A CLI lê `.ts`; a aplicação lê `.js`. Volta na etapa 3 |

**Faça:** instale as duas dependências que faltam:

```powershell
cd backend
```

```powershell
npm install dotenv
```

```powershell
npm install -D ts-node
```

| Pacote | Para quê |
|---|---|
| `dotenv` | Lê o arquivo `.env`. O `ConfigModule` usa isso por baixo, mas aqui não há Nest |
| `ts-node` | Faz a CLI executar os seus `.ts` **direto**, sem compilar antes. É `-D` porque só o desenvolvimento precisa — em produção os arquivos já estão compilados (M16) |

> O `ts-node` não vem no projeto do Nest 12: a aplicação em si não precisa dele. Quem precisa
> é a CLI do TypeORM.

**Deu certo se:** o arquivo salva sem erro de tipo. Ele ainda não é usado por nada — a etapa
4 cria os atalhos que o chamam.

---

## Etapa 3 — Desligar o `synchronize` (10 min)

**Faça:** em `src\app.module.ts`, troque `synchronize: true` por `synchronize: false` e
acrescente a linha das migrações:

```ts
TypeOrmModule.forRoot({
  type: "postgres",
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: false,                        // ← era true
  migrations: ["dist/migracoes/*.js"],       // ← nova
  logging: true,
}),
```

**São dois lugares porque são dois programas:**

| Programa | Arquivo de configuração | Caminho das migrações |
|---|---|---|
| A **aplicação** (`npm run start:dev`) | `app.module.ts` | `dist/migracoes/*.js` — ela roda **compilada** |
| A **CLI** (`npm run migration:*`) | `data-source.ts` | `src/migracoes/*.ts` — ela roda o **fonte** |

> Caminhos diferentes para a mesma coisa. **Guarde isso: é o que mais confunde neste módulo.**
> Se um comando de migração parecer não enxergar seus arquivos, é quase sempre porque você
> olhou para o caminho do outro programa.

⚠️ **Esquecer o `synchronize: false` do `app.module.ts` é o erro clássico.** Tudo parece
funcionar — as migrações rodam, o banco muda — até alguém subir a aplicação e o `synchronize`
desfazer o trabalho delas, porque ele compara entidades × banco e "corrige" o que achar
diferente.

**Deu certo se:** a aplicação sobe e, no log, **não** há mais nenhum `CREATE TABLE` nem
`ALTER TABLE` na inicialização.

---

## Etapa 4 — Os atalhos (10 min)

**Faça:** em `backend\package.json`, ao lado dos scripts que já existem:

```json
"typeorm": "typeorm-ts-node-esm -d src/data-source.ts",
"migration:generate": "npm run typeorm migration:generate",
"migration:run": "npm run typeorm migration:run",
"migration:revert": "npm run typeorm migration:revert",
"migration:create": "typeorm-ts-node-esm migration:create"
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `typeorm-ts-node-esm` | Executa a CLI através do `ts-node`, para ela ler os `.ts` direto |
| o sufixo `-esm` | Casa com o projeto ESM que o `nest new` criou (M03). A variante `-commonjs` é para projetos no formato antigo |
| `-d src/data-source.ts` | Diz à CLI onde está a configuração da etapa 2 |
| os três `npm run typeorm …` | Reaproveitam o primeiro, acrescentando o subcomando. Assim o `-d` fica escrito num lugar só |

⚠️ **Repare que o `migration:create` é diferente: ele não passa o `-d`.**

Esse subcomando só **escreve um arquivo vazio** — não conecta no banco, não lê entidade
nenhuma, e por isso **recusa** o parâmetro. Se você o chamar pelo atalho `typeorm`, recebe:

```
Unknown argument: d
```

Um erro que não explica nada. Por isso ele tem script próprio.

**Deu certo se:**

```powershell
npm run typeorm -- --help
```

lista os subcomandos disponíveis.

---

## Etapa 5 — A migração inicial (15 min)

O banco de hoje foi construído pelo `synchronize`. Vamos recriá-lo pelo caminho oficial, para
que exista uma migração descrevendo o estado inicial.

**Faça:**

```powershell
docker compose down -v
```

```powershell
docker compose up -d
```

| Trecho | O que faz |
|---|---|
| `down` | Para e remove os contêineres |
| `-v` | Remove também o **volume** — ou seja, o banco inteiro |

> Aqui isso é seguro porque não há nada que importe dentro. **É a última vez no curso que
> essa frase será verdadeira** — daqui em diante o banco tem dado, e é justamente por isso
> que o módulo existe.

**Faça:**

```powershell
npm run migration:generate src/migracoes/Inicial
```

| Comando | O que faz |
|---|---|
| `migration:generate <caminho>` | Compara entidades × banco e **escreve** o arquivo. **Não aplica** |
| `migration:run` | Aplica o que ainda não rodou, em ordem de *timestamp* |

**Deu certo se:** aparece `Migration /…/src/migracoes/<números>-Inicial.ts has been generated
successfully.`

> ⚠️ **Gerar não é aplicar.** São dois comandos porque entre eles cabe um passo humano:
> **revisar**. Migração que ninguém leu é migração que apaga dados calada — exatamente o que
> a etapa 16 do M04 mostrou o `synchronize` fazendo. A próxima etapa é a revisão.

---

## Etapa 6 — Ler a migração gerada (15 min)

**Faça:** abra o arquivo. Ele é o M04 inteiro, em SQL.

```ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1788295597072 implements MigrationInterface {
  name = 'Inicial1788295597072'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "categoria" (...)`);
    await queryRunner.query(`CREATE TYPE "public"."exemplar_estado_enum" AS ENUM(...)`);
    await queryRunner.query(`CREATE TABLE "exemplar" (...)`);
    // …
    await queryRunner.query(`ALTER TABLE "obra" ADD CONSTRAINT "FK_1fa7f93a…" FOREIGN KEY …`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "obra" DROP CONSTRAINT "FK_1fa7f93a…"`);
    // …
    await queryRunner.query(`DROP TABLE "categoria"`);
  }
}
```

**Anatomia — o que olhar em qualquer migração:**

| Elemento | Função |
|---|---|
| O número no nome da classe | *Timestamp* de quando foi gerada. Define a **ordem** de aplicação. **Nunca o edite** |
| `up()` | O que a mudança faz |
| `down()` | Como voltar atrás. Repare que ele desfaz **na ordem inversa** — constraint antes de tabela, senão o banco recusa |
| `queryRunner.query` | SQL cru. Migração não usa repositório: a entidade de hoje pode não existir mais quando alguém rodar isto num banco antigo |
| tabela `migrations` | O TypeORM registra ali o que já rodou. É assim que ele sabe o que falta |

**Duas coisas para reparar no arquivo:**

1. **A ordem do `CREATE TYPE`.** Ele vem **antes** do `CREATE TABLE "exemplar"` que o usa —
   no PostgreSQL o enum é um objeto do banco, e a coluna não pode referenciar um tipo que
   ainda não existe. Você viu isso no M04; agora está escrito num arquivo que você controla.
2. **Os nomes das constraints.** `PK_51d3959df48c82010ae1c4907fb`, `FK_1fa7f93a…` — *hashes*
   gerados pelo TypeORM. Feios, e **propositalmente estáveis**: é assim que o `down()`
   consegue derrubar exatamente a constraint que o `up()` criou.

**Faça:** agora sim, aplique:

```powershell
npm run migration:run
```

**Deu certo se:** o terminal mostra `Migration Inicial<timestamp> has been executed
successfully`, e:

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT * FROM migrations;"
```

devolve uma linha.

---

## Etapa 7 — Uma coluna nova (15 min)

O ciclo completo, agora com uma mudança pequena.

**Faça:** acrescente à entidade `Obra`:

```ts
@Column({ type: "boolean", default: false })
destaque: boolean;
```

**Faça:**

```powershell
npm run migration:generate src/migracoes/AdicionaDestaque
```

**Rode:** confira o arquivo **antes** de aplicar. Ele deve ter uma linha só:

```ts
await queryRunner.query(`ALTER TABLE "obra" ADD "destaque" boolean NOT NULL DEFAULT false`);
```

O `DEFAULT false` importa: sem ele, as linhas existentes ficariam nulas numa coluna
`NOT NULL`, e a migração **falharia**. O TypeORM só soube colocá-lo porque você escreveu
`default: false` na entidade — a decisão da etapa 8 do M04 pagando dividendo aqui.

**Faça:**

```powershell
npm run migration:run
```

**Deu certo se:** `\d obra` mostra a coluna `destaque`, e a tabela `migrations` agora tem
duas linhas.

---

## Etapa 8 — Reverter (15 min)

Esta é a metade que quase ninguém testa — e a que importa às duas da manhã.

**Faça:**

```powershell
npm run migration:revert
```

**Rode:** o log mostra `ALTER TABLE "obra" DROP COLUMN "destaque"`. Confirme:

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "\d obra"
```

**Deu certo se:** a coluna sumiu.

**Faça:** rode `npm run migration:run` de novo. Ela volta.

**É este par que torna o deploy reversível.** Um `down()` que ninguém executou é uma
**suposição**, não um plano de retorno — e a hora de descobrir que ele não funciona não é com
o sistema fora do ar.

| Detalhe | Consequência |
|---|---|
| `revert` desfaz **a última aplicada**, sempre | Ele não escolhe e não aceita o nome de uma migração específica |
| Uma por vez | Para voltar três, rode três vezes |
| `down` vazio significa "irreversível" | Declare isso **de propósito**, com um comentário, não por preguiça |

---

## Etapa 9 — A mesma destruição, agora visível (15 min)

Esta etapa é o argumento inteiro do módulo em cinco minutos de trabalho.

**Faça:** repita a provocação da etapa 16 do M04. Encurte a `biografia` da `Autor`:

```ts
@Column({ type: "varchar", length: 10, default: "" })
biografia: string;
```

**Faça:**

```powershell
npm run migration:generate src/migracoes/EncurtaBiografia
```

**⚠️ Não rode.** Abra o arquivo:

```ts
await queryRunner.query(`ALTER TABLE "autor" DROP COLUMN "biografia"`);
await queryRunner.query(`ALTER TABLE "autor" ADD "biografia" character varying(10) NOT NULL DEFAULT ''`);
```

É **exatamente** o que o `synchronize` fez no M04 — o mesmo `DROP`, o mesmo `ADD`, a mesma
perda de dados.

**A diferença inteira do módulo está em uma palavra: agora você está lendo isso antes de
acontecer.**

E aqui você tem escolha:

| Opção | Como |
|---|---|
| Aceitar a perda | Rodar a migração como está, sabendo o que ela faz |
| Truncar em vez de apagar | Trocar o SQL à mão por `ALTER COLUMN "biografia" TYPE varchar(10)` |
| Salvar antes | Acrescentar um `UPDATE` que move o texto longo para outro lugar, antes do `ALTER` |
| Recusar a mudança | Concluir que a regra de negócio está errada e o campo deve continuar `text` |

Nenhuma dessas decisões o `synchronize` conseguiria tomar, porque **nenhuma delas está na
entidade**. Elas dependem de saber o que aqueles textos são e quanto valem.

**Faça:** apague o arquivo gerado e desfaça a mudança na entidade — este passo era para ler,
não para aplicar.

> ⚠️ **Um aviso para a etapa 12:** o `migration:generate` deduz renomeação exatamente como o
> `synchronize` faz. Se você renomear uma propriedade e mandar gerar, vem um `RENAME COLUMN`
> pronto. Às vezes é o que você quer; na etapa 12, é justamente o que não queremos.

---

## Etapa 10 — Migração de dados (20 min)

Regra nova, vinda da coordenação: obras publicadas antes de 1900 entram em destaque.

Isso não está em nenhuma entidade. Não há o que o TypeORM compare para gerar — a regra está
na cabeça de quem pediu.

**Faça:**

```powershell
npm run migration:create src/migracoes/DestacaObrasAntigas
```

| Comando | Quando usar |
|---|---|
| `migration:generate` | A mudança está **nas entidades**. O TypeORM compara e escreve |
| `migration:create` | A mudança está **na sua cabeça**. Ele cria o arquivo vazio e você escreve |

O arquivo nasce com `up` e `down` vazios.

**Faça:** preencha:

```ts
export class DestacaObrasAntigas1738000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "obra" SET "destaque" = true
       WHERE "anoPublicacao" IS NOT NULL AND "anoPublicacao" < 1900`,
    );
  }

  // ⚠️ Este down NÃO restaura o estado anterior: zera tudo, inclusive
  // destaques marcados à mão depois. Ver comentário abaixo.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "obra" SET "destaque" = false`);
  }
}
```

**Linha a linha:**

| Trecho | Por quê |
|---|---|
| `= true` | Booleano do PostgreSQL. Alguns bancos aceitam `1`; este não — e o erro seria de tipo, não de sintaxe |
| `IS NOT NULL AND < 1900` | Obras sem ano ficariam de fora de qualquer jeito, mas escrever a condição deixa a intenção **explícita para quem revisar** |
| `"anoPublicacao"` com aspas | Nome em *camelCase* no PostgreSQL exige aspas. Sem elas, o banco procuraria `anopublicacao` |
| SQL cru, não repositório | A entidade de hoje pode não existir mais quando alguém rodar isto num banco antigo. Migração fala com o banco, não com o código |

**Faça:** ponha dado para a regra morder:

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "INSERT INTO autor (nome) VALUES ('Machado de Assis'); INSERT INTO obra (titulo, \"anoPublicacao\", \"autorId\") VALUES ('Dom Casmurro', 1899, 1), ('Grande Sertão', 1956, 1);"
```

**Faça:**

```powershell
npm run migration:run
```

**Rode:**

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT titulo, \"anoPublicacao\", destaque FROM obra;"
```

**Deu certo se:** *Dom Casmurro* está com `destaque = t` e *Grande Sertão* com `f`.

### Olhe o `down` de novo

Ele zera **todos** os destaques, inclusive os que alguém marcou à mão depois da migração.
Não é reversível de verdade — é o mais próximo disso que dá para fazer sem guardar o estado
anterior numa tabela auxiliar.

**Comente essa limitação no arquivo**, como está no exemplo. Migração de dados raramente é
perfeitamente reversível, e é muito melhor **declarar** a limitação do que descobri-la no
pior momento possível.

---

## Etapa 11 — Expandir e contrair (15 min)

Última parada de raciocínio antes do exercício final.

**A pergunta:** como renomear uma coluna sem derrubar o sistema?

Você já sabe que o `RENAME COLUMN` funciona e preserva os dados — viu no M04. Então por que
não usá-lo e pronto?

### Porque o deploy não é instantâneo

Em produção, quando você sobe uma versão nova, por alguns minutos **as duas versões do código
estão rodando ao mesmo tempo**: as instâncias antigas ainda atendendo requisições enquanto as
novas sobem.

```
minuto 0    código v1 rodando           banco com coluna "sinopse"
minuto 1    v1 e v2 rodando juntos      ← e agora?
minuto 2    só v2 rodando               banco com coluna "resumo"
```

Um `RENAME` instantâneo derruba a v1 na hora: ela procura `sinopse`, que deixou de existir.
Todas as requisições que ela estiver atendendo falham.

### A solução: quatro passos, nunca um

```
    ANTES              EXPANDIR             MIGRAR            CONTRAIR
  ┌─────────┐      ┌──────────────┐    ┌──────────────┐    ┌─────────┐
  │ sinopse │  →   │ sinopse      │ →  │ sinopse      │ →  │ resumo  │
  └─────────┘      │ resumo (novo)│    │ resumo(cópia)│    └─────────┘
                   └──────────────┘    └──────────────┘
                    código escreve      código lê de
                    nos dois             resumo
```

| Passo | Migração | Deploy |
|---|---|---|
| 1. Expandir | Cria `resumo`, **mantém** `sinopse` | Código escreve nas duas |
| 2. Migrar | `UPDATE resumo = sinopse` | — |
| 3. Trocar leitura | — | Código lê só `resumo` |
| 4. Contrair | Remove `sinopse` | — |

**Em nenhum momento existe uma versão do código incompatível com o banco.** É isso que a
estratégia compra.

Parece burocracia até o dia em que você precisa **reverter** um deploy. Com expandir/contrair,
o código antigo continua funcionando com o banco novo. Sem ele, reverter significa restaurar
backup — e aí a conversa muda de tom.

💼 **No mercado:** *"como você renomearia uma coluna de uma tabela com 10 milhões de linhas,
sem downtime?"* é pergunta clássica de entrevista pleno. A resposta é esta etapa.

---

## Etapa 12 — Expandir e contrair na prática (20 min)

Agora é com você. Renomeie `Obra.sinopse` para `Obra.resumo` **sem perder dados e sem janela
em que o sistema quebre**.

**Antes de começar:** ponha texto na `sinopse` de alguma obra, para ter o que preservar.

**Uma migração por passo:**

| # | Nome | Conteúdo |
|---|---|---|
| 1 | `ExpandeResumo` | `ADD COLUMN "resumo"` — sem tocar em `sinopse` |
| 2 | `CopiaSinopseParaResumo` | `UPDATE obra SET resumo = sinopse` |
| 3 | *(sem migração)* | Seria o deploy do código que passa a ler `resumo` |
| 4 | `RemoveSinopse` | `DROP COLUMN "sinopse"` |

⚠️ **Use `migration:create` nos três, e escreva o SQL você mesmo.**

Se você usar `migration:generate` no passo 1, o TypeORM vai deduzir uma renomeação e gerar um
`RENAME COLUMN` — que é **exatamente** o que este exercício existe para evitar. O aviso da
etapa 9 era sobre isto.

**Ao final:** rode `npm run migration:revert` três vezes e confira que o banco voltou ao
início **com os dados intactos**.

**Responda por escrito:**

1. Depois do passo 1, o código **antigo** ainda funciona com o banco novo? Por quê?
2. E depois do passo 4?
3. Entre quais passos o deploy pode ser revertido com segurança total?
4. Se o passo 3 falhar em produção, qual é o plano?

**Deu certo se:** as três migrações aplicam e revertem sem erro, e o texto que você pôs na
`sinopse` está em `resumo` ao final do passo 2.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Unknown argument: d` | Você chamou `migration:create` pelo script `typeorm`, que fixa o `-d`. Use o script `migration:create` — etapa 4 |
| `No changes in database schema were found` | As entidades já batem com o banco. Você salvou o arquivo? |
| `Cannot find module 'src/data-source.ts'` | Rode o comando de dentro de `backend/` |
| `DataSource is not set` / a CLI não acha a configuração | Faltou `export default` no `data-source.ts` — etapa 2 |
| A migração roda pela CLI mas não na aplicação | Caminhos diferentes: `src/**/*.ts` na CLI, `dist/**/*.js` na app — etapa 3 |
| `QueryFailedError: relation already exists` | O banco ainda tem as tabelas do `synchronize`. `docker compose down -v` e recrie pelas migrações |
| As tabelas voltaram a mudar sozinhas | Faltou `synchronize: false` no `app.module.ts` — só o `data-source.ts` não basta |
| `migration:revert` desfez a errada | Ele reverte **a última aplicada**, sempre. Não escolhe |
| Conflito de merge em migração | Duas pessoas geraram no mesmo dia. Renomeie o *timestamp* da mais nova para depois |
| Coluna nova `NOT NULL` falha | Faltou `default` na entidade, e há linhas existentes |
| Gerou `RENAME` quando você queria expandir/contrair | Use `migration:create`, não `generate` — etapa 12 |

## ✅ Checklist de saída

- [ ] `synchronize: false` nos **dois** lugares
- [ ] Migração inicial gerada, **lida** e aplicada; tabela `migrations` com registro
- [ ] Uma migração de esquema aplicada, revertida e reaplicada
- [ ] Uma migração de **dados**, escrita à mão, com `down` honesto e comentado
- [ ] Você gerou a migração destrutiva da etapa 9, **leu e não aplicou**
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
