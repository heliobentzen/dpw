# M12 — Deploy da API

> **Pré-requisitos:** M10, M11 · **Duração:** média
> **Ementa:** *Tópicos relevantes: Implantação (deploy) do sistema.*

O módulo em que o projeto deixa de ser exercício e vira sistema. Regra: ao final dele **todo
mundo tem uma URL pública funcionando**, com o BiblioCom e não com o projeto da equipe. O
projeto vem depois, quando o caminho já não tem surpresa.

> **A teoria não está num bloco separado.** Ela está nas etapas 1, 5 e 14 — em que a gente
> para de digitar e pensa — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que muda entre o servidor de desenvolvimento e o de produção.
2. Preparar a API para rodar atrás do proxy de uma plataforma, com HTTPS e cookie seguro.
3. Ensaiar o deploy na sua máquina antes de fazê-lo de verdade.
4. Publicar a API e o PostgreSQL gerenciado, com migrações aplicadas na subida.
5. Verificar o deploy, automatizá-lo a partir da `main` e saber reverter.

---

## 🧭 Por que este módulo vem perto do fim

Até aqui, o BiblioCom foi construído e verificado em ambiente controlado. O M12 introduz a
diferença decisiva entre "funciona na minha máquina" e "pode ser usado por outras pessoas".

Cozinhar em casa e abrir um restaurante usam as mesmas receitas. O que muda é todo o resto:
a cozinha é de outra pessoa, os ingredientes chegam por fornecedor, há fiscalização, e um
erro não estraga o seu jantar — estraga o de cinquenta clientes. Deploy é isso: o mesmo
código, num ambiente com regras próprias.

- O ambiente de produção tem restrições próprias (porta, disco, proxy).
- Configuração e segredos não podem depender do código local.
- Migrações alteram dados reais e exigem plano de reversão.
- Uma URL pública só é evidência de sucesso se o sistema puder ser **verificado**.

```mermaid
flowchart LR
    U(["Clientes<br/>Swagger, curl, apps"]) -- HTTPS --> P["Proxy da plataforma<br/>TLS e roteamento"]
    P -- "HTTP + X-Forwarded-Proto" --> A["Contêiner da API<br/>node dist/main.js"]
    A -- "SQL (rede interna)" --> D[("PostgreSQL<br/>gerenciado")]
    G["GitHub<br/>main"] -- "CI verde" --> B["Build na plataforma<br/>npm ci + nest build"]
    B -- "migrações, depois start" --> A
```

## 📋 Como este módulo funciona

Mesmo formato dos anteriores. As etapas 1 a 8 acontecem **na sua máquina**: preparam o
código e ensaiam o deploy. Só a partir da 9 entra a plataforma.

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

### As quinze etapas

| # | Etapa | Duração | O que entra |
|---|---|---|---|
| 1 | [**Da sua máquina para a rua**](#etapa-1--da-sua-máquina-para-a-rua) | curta | **12 fatores** |
| 2 | [Onde implantar](#etapa-2--onde-implantar) | curta | PaaS, banco gerenciado |
| 3 | [O que o servidor roda](#etapa-3--o-que-o-servidor-roda) | curta | scripts de produção |
| 4 | [A porta e o endereço](#etapa-4--a-porta-e-o-endereço) | curta | `PORT`, `0.0.0.0` |
| 5 | [**Atrás do proxy**](#etapa-5--atrás-do-proxy) | média | **`trust proxy`, cookie `Secure`** |
| 6 | [Sessões que sobrevivem](#etapa-6--sessões-que-sobrevivem) | média | `connect-pg-simple` |
| 7 | [Um endpoint de saúde](#etapa-7--um-endpoint-de-saúde) | curta | `/api/health` |
| 8 | [Ensaio geral](#etapa-8--ensaio-geral) | média | produção na sua máquina |
| 9 | [O banco gerenciado](#etapa-9--o-banco-gerenciado) | curta | URL interna e externa |
| 10 | [O serviço da API](#etapa-10--o-serviço-da-api) | média | build, start, variáveis |
| 11 | [O primeiro usuário](#etapa-11--o-primeiro-usuário) | curta | `seed:admin` remoto |
| 12 | [Verificar o que está no ar](#etapa-12--verificar-o-que-está-no-ar) | curta | checklist de deploy |
| 13 | [Deploy contínuo](#etapa-13--deploy-contínuo) | curta | `main` → produção |
| 14 | [**Mudar o que já está no ar**](#etapa-14--mudar-o-que-já-está-no-ar) | média | **ordem, compatibilidade, reversão** |
| 15 | [O roteiro de deploy](#etapa-15--o-roteiro-de-deploy) | curta | `docs/deploy.md` |

---

## Etapa 1 — Da sua máquina para a rua

Uma lista ficou famosa por resumir o que faz uma aplicação rodar bem em qualquer servidor:
os **12 fatores**. Cinco deles mudam o seu código neste módulo:

| Fator | Em uma frase | No BiblioCom |
|---|---|---|
| **Configuração no ambiente** | Nada que muda entre ambientes fica no código | `.env` local, painel da plataforma em produção (M03) |
| **Vínculo de porta** | A aplicação escuta na porta que **mandarem** | `process.env.PORT` — etapa 4 |
| **Processos descartáveis** | O processo pode morrer e renascer a qualquer momento | Sessões no banco, não na memória — etapa 6 |
| **Paridade dev/prod** | Desenvolvimento parecido com produção | PostgreSQL desde o M04, ensaio geral na etapa 8 |
| **Logs como fluxo** | A aplicação escreve no terminal; a plataforma guarda | Nada a fazer — o Nest já escreve no terminal (M13) |

Repare que o M04 escolheu PostgreSQL desde o começo justamente para que esta etapa não
tivesse surpresa de banco.

---

## Etapa 2 — Onde implantar

| Opção | Custo | Esforço | Quando |
|---|---|---|---|
| **PaaS** (Render, Railway e similares) | Grátis a baixo | Baixo | ✅ Recomendado para a disciplina |
| VPS + Nginx | Baixo | Alto | Quando há requisito de contrato ou custo em escala |
| Nuvem gerenciada (AWS, GCP, Azure) | Variável | Muito alto | Empresa com equipe de infraestrutura |

Este módulo usa como exemplo uma PaaS com **serviço web** e **PostgreSQL gerenciado** no
mesmo painel, como o Render. Os nomes dos botões variam de plataforma para plataforma; os
conceitos — comando de build, comando de início, variáveis, URL interna do banco — são os
mesmos em todas.

> ⚠️ **Camada gratuita muda de política sem avisar** — e costuma avisar na semana da
> entrega. Antes do semestre, confira: o banco gratuito expira? O serviço "dorme" quando
> ninguém usa? Tenha um plano B, como um banco gerenciado de outro fornecedor (Neon, por
> exemplo) ligado ao mesmo serviço web.

---

## Etapa 3 — O que o servidor roda

**Faça:** confira e complete os scripts de `backend\package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main.js",
    "migration:run:prod": "typeorm -d dist/data-source.js migration:run",
    "seed:admin": "node dist/seed-admin.js"
  }
}
```

| Script | Quando roda | O que faz |
|---|---|---|
| `build` | Uma vez por deploy | Compila o TypeScript para `dist/` |
| `start:prod` | A cada subida do processo | Sobe a API **compilada**. Sem `--watch`, sem compilar de novo |
| `migration:run:prod` | Antes do `start:prod` | Aplica as migrações pendentes (M05) |
| `seed:admin` | Uma vez, à mão | Cria o primeiro usuário (M08) |

| Detalhe | Por quê |
|---|---|
| `typeorm`, e não `typeorm-ts-node-esm` | Em produção os arquivos **já estão compilados**. Usar o `ts-node` arrastaria uma ferramenta de desenvolvimento para o servidor |
| `-d dist/data-source.js` | O mesmo `data-source.ts` do M05, compilado. Ele foi escrito para achar entidades e migrações tanto em `src/` quanto em `dist/` — este é o momento em que isso importa |

**Rode:**

```powershell
npm run build
```

**Deu certo se:** existem `dist\main.js`, `dist\data-source.js` e `dist\migracoes\` com um
`.js` para cada migração.

---

## Etapa 4 — A porta e o endereço

**Faça:** em `src\main.ts`, troque a última linha do `bootstrap()` por:

```ts
await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
```

| Trecho | Por quê |
|---|---|
| `process.env.PORT` | A plataforma **decide** a porta e a informa por variável. Porta fixa sobe e nunca recebe tráfego |
| `?? 3000` | Na sua máquina, sem a variável, continua a de sempre |
| `"0.0.0.0"` | Escutar em todas as interfaces de rede. Só em `localhost`, a API ficaria inacessível de fora do contêiner |

> ⚠️ **Não** crie a variável `PORT` no painel da plataforma: quem a define é ela. Defini-la à
> mão é um jeito comum de o serviço subir e o roteador procurá-lo em outra porta.

---

## Etapa 5 — Atrás do proxy

Na plataforma, ninguém fala com a sua API diretamente. Existe um **proxy** na frente: ele
recebe o HTTPS, cuida do certificado, e repassa a requisição à API por **HTTP**, na rede
interna — acrescentando um cabeçalho, `X-Forwarded-Proto: https`, que conta como a conexão
chegou.

É como a **recepção de um hotel**: o hóspede chega pela porta da frente, e a recepção liga
para o quarto dizendo "visita para você, veio pela entrada principal". Se o quarto não
confiar na recepção, ele só sabe que alguém subiu pelo elevador de serviço.

E aqui o cookie do M08 cobra a conta: com `NODE_ENV=production`, ele é `secure` — só pode
viajar em conexão HTTPS. A API vê HTTP, conclui que a conexão é insegura e **não envia o
cookie**. O login responde `200`, e a requisição seguinte responde `401`.

**Rode** — reproduza o problema na sua máquina, **antes** de vê-lo em produção. Num terminal,
suba a API em modo produção (no PowerShell, a variável fica na sessão — a etapa 8 mostra
como limpar):

```powershell
$env:NODE_ENV="production"
```

```powershell
npm run build
```

```powershell
node dist/main.js
```

Noutro terminal, faça login fingindo ser o proxy:

```powershell
curl.exe -s -i -X POST http://localhost:3000/api/sessao -H "X-Forwarded-Proto: https" -H "Content-Type: application/json" -d '{\"email\":\"coordenacao@bibliocom.org\",\"senha\":\"troque-esta-senha-longa\"}'
```

**A falha:** `HTTP/1.1 200 OK`, o corpo com a coordenação, e **nenhum** `Set-Cookie`.

**Faça:** em `src\configurar-app.ts` (M10), na primeira linha da função:

```ts
export function configurarApp(app: NestExpressApplication): void {
  app.set("trust proxy", 1);
  // …o resto igual
```

| Trecho | O que faz |
|---|---|
| `app.set(…)` | Uma configuração do Express, que o Nest usa por baixo |
| `"trust proxy"` | "Acredite nos cabeçalhos `X-Forwarded-*`": a conexão real é a que o proxy relatou |
| `1` | Confie **só no primeiro** proxy à frente. Confiar em qualquer um deixaria um cliente forjar o cabeçalho e se passar por outro IP — o que também enganaria o limite de tentativas do M09 |

**Rode** de novo: pare a API (`Ctrl+C`), `npm run build`, `node dist/main.js`, e repita o
`curl.exe`.

**Deu certo se:** agora aparece

```
Set-Cookie: bibliocom.sid=s%3A…; Path=/; Expires=…; HttpOnly; Secure; SameSite=Lax
```

com o `Secure` que não existia em desenvolvimento. Pare a API e limpe a variável:

```powershell
Remove-Item Env:\NODE_ENV
```

---

## Etapa 6 — Sessões que sobrevivem

A sessão do M08 mora na memória do processo. Em produção, o processo é **descartável**: a
plataforma o reinicia a cada deploy, quando ele "dorme" por falta de uso, ou quando decide
movê-lo de máquina. A cada reinício, todo mundo é deslogado. E com duas instâncias da API,
cada uma teria a sua memória — o login feito numa não valeria na outra.

A solução é guardar as sessões num lugar que todas as instâncias enxergam e que sobrevive a
reinícios: o próprio PostgreSQL.

**Faça:**

```powershell
npm install connect-pg-simple
```

```powershell
npm install -D @types/connect-pg-simple
```

**Faça:** a tabela, por migração — escrita à mão, porque ela não vem de uma entidade:

```powershell
npm run migration:create src/migracoes/CriaSessao
```

Preencha:

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`CREATE TABLE "sessao" (
    "sid" varchar NOT NULL PRIMARY KEY,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  )`);
  await queryRunner.query(`CREATE INDEX "IDX_sessao_expire" ON "sessao" ("expire")`);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE "sessao"`);
}
```

| Coluna | O que guarda |
|---|---|
| `sid` | O identificador que vai no cookie |
| `sess` | O conteúdo da sessão: `usuarioId` e `papel` (M08) |
| `expire` | Quando ela vence. O índice existe porque a biblioteca apaga as vencidas de tempos em tempos, procurando por esta coluna |

```powershell
npm run migration:run
```

**Faça:** em `src\configurar-app.ts`, dê à sessão um lugar para morar:

```ts
import connectPgSimple from "connect-pg-simple";

  app.use(
    session({
      name: "bibliocom.sid",
      store: new (connectPgSimple(session))({
        conString: process.env.DATABASE_URL,
        tableName: "sessao",
      }),
      secret: process.env.SESSION_SECRET!,
      // …o resto igual
```

| Trecho | O que faz |
|---|---|
| `connectPgSimple(session)` | Cria a classe do armazenamento, ligada ao `express-session` |
| `new (…)({…})` | Os parênteses em volta são necessários: primeiro se cria a classe, depois se instancia |
| `conString` | O mesmo banco da aplicação |
| `tableName: "sessao"` | A tabela que a migração criou |

**Rode:** `npm run start:dev`, faça login com `curl.exe -c cookies.txt` (M08), **reinicie a
API** e chame `GET /api/sessao` com `-b cookies.txt`.

**Deu certo se:** a sessão continua válida depois do reinício — e
`SELECT count(*) FROM sessao;` mostra uma linha. Rode também `npm run test:e2e`: o banco de
teste ganha a tabela pelas migrações, e tudo continua verde.

> `npm run migration:check` continua limpo: o TypeORM só compara as tabelas que vêm de
> entidades, e ignora a `sessao`.

---

## Etapa 7 — Um endpoint de saúde

A plataforma precisa de um jeito de perguntar "você está bem?" — para saber quando o deploy
novo pode receber tráfego, e para reiniciar o processo se ele travar. A resposta tem de
envolver o banco: API de pé com banco fora do ar não está bem.

**Faça:** crie `src\saude\saude.controller.ts`:

```ts
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";

@ApiTags("saude")
@Controller("health")
export class SaudeController {
  constructor(private readonly banco: DataSource) {}

  @Get()
  async verificar() {
    try {
      await this.banco.query("SELECT 1");
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Banco de dados indisponível");
    }
  }
}
```

E registre-o no `AppModule`: `controllers: [AppController, SaudeController]`.

| Trecho | Por quê |
|---|---|
| `DataSource` injetado | O próprio TypeORM, que o `TypeOrmModule` já disponibiliza |
| `SELECT 1` | A consulta mais barata possível. Só prova que o banco responde |
| `503 Service Unavailable` | O status que diz "estou de pé, mas não consigo atender". Plataformas e monitores entendem |
| Rota pública, sem guard | Quem pergunta é a plataforma, que não faz login. E a resposta não revela nada |

**Rode:** `curl.exe -s http://localhost:3000/api/health` → `{"status":"ok"}`. Pare o banco
(`docker compose stop db`), repita: `503`. Suba o banco de novo.

> O M13 volta a este endpoint para ligar um monitor externo nele.

---

## Etapa 8 — Ensaio geral

Antes de subir para a plataforma, suba **como a plataforma vai subir** — banco vazio,
código compilado, variáveis de produção. Este passo economiza a maior parte da depuração
remota.

**Faça:** um banco vazio, só para o ensaio:

```powershell
docker compose exec db createdb -U bibliocom bibliocom_ensaio
```

**Faça:** as variáveis de produção, na sessão do PowerShell:

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="postgres://bibliocom:devpassword@localhost:5432/bibliocom_ensaio"
$env:SESSION_SECRET="ensaio-local-com-mais-de-trinta-e-dois-caracteres"
$env:NOME_BIBLIOTECA="BiblioCom"
$env:ADMIN_EMAIL="adm@ensaio.org"
$env:ADMIN_SENHA="senha-do-ensaio-bem-longa"
```

**Faça** — a sequência que a plataforma vai executar:

```powershell
npm run build
```

```powershell
npm run migration:run:prod
```

```powershell
npm run seed:admin
```

```powershell
npm run start:prod
```

**Rode**, noutro terminal:

```powershell
curl.exe -s http://localhost:3000/api/health
```

```powershell
curl.exe -s -i -X POST http://localhost:3000/api/sessao -H "X-Forwarded-Proto: https" -H "Content-Type: application/json" -d '{\"email\":\"adm@ensaio.org\",\"senha\":\"senha-do-ensaio-bem-longa\"}'
```

**Deu certo se:** as migrações rodam **todas** no banco vazio, o *seed* cria o usuário, o
`health` responde `ok` e o login devolve um `Set-Cookie` com `Secure`.

**Faça** — ao terminar, **limpe a sessão do PowerShell**. Senão, o próximo `start:dev` sobe
em modo produção, apontando para o banco do ensaio:

```powershell
Remove-Item Env:\NODE_ENV, Env:\DATABASE_URL, Env:\SESSION_SECRET, Env:\NOME_BIBLIOTECA, Env:\ADMIN_EMAIL, Env:\ADMIN_SENHA
```

> **Por que funciona sem o `.env`?** As variáveis definidas no terminal **vencem** as do
> arquivo. Em produção não haverá `.env` nenhum — só as variáveis do painel.

---

## Etapa 9 — O banco gerenciado

**Faça**, no painel da plataforma: **New → PostgreSQL**, versão 16 (a mesma do Docker), na
mesma região em que vai ficar a API.

A plataforma mostra **duas** URLs de conexão:

| URL | Quem usa | Por quê |
|---|---|---|
| **Interna** (*Internal Database URL*) | A API, rodando na mesma plataforma | Rede privada: mais rápida e sem exposição à internet |
| **Externa** (*External Database URL*) | Você, da sua máquina, para tarefas pontuais | Passa pela internet, com senha e criptografia |

Copie as duas para um lugar seguro — um gerenciador de senhas, **nunca** um arquivo do
repositório.

> Se o banco for de outro fornecedor, ele exige conexão criptografada vinda de fora.
> Acrescente `?sslmode=require` ao final da URL; o driver do PostgreSQL entende sozinho.

---

## Etapa 10 — O serviço da API

**Faça:** **New → Web Service**, ligado ao seu repositório do GitHub.

| Campo | Valor | Por quê |
|---|---|---|
| Branch | `main` | Produção é o que está na principal |
| Diretório raiz | a raiz do repositório | O `package-lock.json` do *workspace* está lá (M00) |
| Comando de build | `npm ci && npm run build -w backend` | Instala exatamente o lock e compila |
| Comando de início | `npm run migration:run:prod -w backend && npm run start:prod -w backend` | Migrações **antes** da API. Se uma migração falhar, a API nova não sobe — e a anterior continua no ar |
| Health check | `/api/health` | O deploy só recebe tráfego depois de responder `200` aqui |

**Faça:** as variáveis de ambiente do serviço:

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | a URL **interna** da etapa 9 |
| `SESSION_SECRET` | um **novo**, gerado só para produção (M08, etapa 7) |
| `NOME_BIBLIOTECA` | o nome da biblioteca |
| `CORS_ORIGENS` | as origens dos clientes no navegador, se houver; vazio, se não |

> ⚠️ O `SESSION_SECRET` de produção **nunca** é o mesmo do seu `.env`, nem do CI. Quem tem o
> segredo fabrica cookies válidos.

**Faça:** crie o serviço e acompanhe os **logs** do primeiro deploy até o fim.

**Deu certo se:** os logs mostram, nesta ordem, o `npm ci`, o `nest build`, as migrações
(`Migration … has been executed successfully`) e o `Nest application successfully started`
— e o painel marca o serviço como no ar.

---

## Etapa 11 — O primeiro usuário

O banco de produção está vazio: sem usuário, ninguém faz login. O `seed:admin` do M08
resolve, rodado **da sua máquina**, contra a URL **externa**.

**Faça**, da pasta `backend\`, com um build atualizado:

```powershell
$env:DATABASE_URL="<a URL externa da etapa 9>"
$env:ADMIN_EMAIL="coordenacao@suabiblioteca.org"
$env:ADMIN_SENHA="<uma senha longa, só para produção>"
```

```powershell
npm run seed:admin
```

```powershell
Remove-Item Env:\DATABASE_URL, Env:\ADMIN_EMAIL, Env:\ADMIN_SENHA
```

| Detalhe | Por quê |
|---|---|
| Rodar da sua máquina | Funciona em qualquer plataforma, mesmo nas que não oferecem terminal no plano gratuito |
| Variáveis na sessão, e não no `.env` | O `.env` é do desenvolvimento. Misturar as credenciais de produção nele é o primeiro passo para commitá-las |
| `Remove-Item` logo depois | O próximo comando que você rodar não vai, por engano, contra o banco de produção |

**Deu certo se:** aparece `Usuário de coordenação pronto`. Guarde a senha no gerenciador de
senhas.

---

## Etapa 12 — Verificar o que está no ar

**Faça:** percorra o bloco "Depois de cada deploy" do
[checklist de deploy](../../recursos/checklists/deploy.md). Os comandos centrais:

```powershell
curl.exe -s https://SUA-API/api/health
```

```powershell
curl.exe -s -I https://SUA-API/api/obras
```

```powershell
curl.exe -s -i -c prod.txt -X POST https://SUA-API/api/sessao -H "Content-Type: application/json" -d '{\"email\":\"coordenacao@suabiblioteca.org\",\"senha\":\"…\"}'
```

```powershell
curl.exe -s -b prod.txt https://SUA-API/api/sessao
```

**Deu certo se:**

- [ ] `health` responde `{"status":"ok"}`
- [ ] os cabeçalhos trazem `strict-transport-security` e **não** trazem `x-powered-by`
- [ ] o login devolve um `Set-Cookie` com `Secure`, e o `GET /api/sessao` com ele responde `200`
- [ ] `https://SUA-API/api/docs` abre o Swagger
- [ ] `http://` (sem o `s`) redireciona para `https://`

Apague o `prod.txt` ao terminar: ele é uma sessão de coordenação válida.

> **E o Swagger em produção?** Neste projeto ele fica público de propósito: a API é aberta
> e a documentação é parte da entrega. Numa API interna de empresa, a decisão costuma ser a
> oposta — desligá-lo ou protegê-lo. Registre a decisão no `docs/deploy.md`.

---

## Etapa 13 — Deploy contínuo

**Faça:** no serviço, ligue o **deploy automático** a partir da `main`. Se a plataforma
oferecer a opção de esperar o CI do GitHub, ligue também.

O caminho de uma mudança passa a ser:

```mermaid
flowchart LR
    B[branch] --> PR[pull request]
    PR --> CI{CI verde?}
    CI -- não --> B
    CI -- sim --> M[merge na main]
    M --> D[deploy automático]
    D --> H{health ok?}
    H -- sim --> N[nova versão no ar]
    H -- não --> V[versão anterior continua]
```

A proteção da branch do M10 garante o losango do meio: código vermelho não chega à `main`.
O *health check* garante o último: versão que não responde não substitui a anterior.

**Rode:** abra um *pull request* com uma mudança pequena e visível — o `NOME_BIBLIOTECA` não,
que é variável; por exemplo, a descrição no `swagger.ts`. Faça o *merge* com o CI verde.

**Deu certo se:** minutos depois, sem você tocar no painel, o Swagger de produção mostra a
descrição nova.

---

## Etapa 14 — Mudar o que já está no ar

O primeiro deploy é o fácil: não havia nada antes. Os seguintes acontecem com usuários
usando, e com dados dentro.

**A ordem de um deploy com migração:**

```
1. Backup do banco                ← antes de tudo
2. Migrações                       ← o comando de início faz
3. API nova sobe e responde /health
4. Tráfego passa para a versão nova
5. Verificação (etapa 12)
6. Se falhar: reverter
```

Entre os passos 2 e 4, **a API antiga continua atendendo com o banco já migrado**. Por isso
a regra do M05 vale aqui com toda a força: migração precisa ser **compatível para trás**. E a
regra do M11 vale para o contrato: o cliente que já existe não pode quebrar.

| Mudança | Compatível? | Como fazer |
|---|---|---|
| Coluna nova opcional; campo novo na resposta | ✅ | Direto |
| Coluna nova obrigatória | ❌ | Expandir (opcional) → migrar dados → contrair (obrigatória), em deploys separados |
| Renomear coluna ou campo do contrato | ❌ | Expandir → migrar → contrair (M05, M11) |
| Remover rota | ❌ | Marcar como obsoleta → avisar → remover |

**Reverter** tem dois níveis:

| Situação | O que fazer |
|---|---|
| O código novo tem um bug, e a migração foi compatível | Reverter o deploy: a plataforma tem "rollback", ou `git revert` + push. O código antigo funciona com o banco novo |
| A migração destruiu ou corrompeu dados | Restaurar o backup. Você testou a restauração antes, certo? (M13) |

**Faça:** ligue o backup automático do banco no painel, e anote no `docs/deploy.md` onde ele
fica e quanto tempo é guardado.

> **Arquivos enviados somem a cada deploy.** O disco do contêiner é recriado do zero — é o
> "processo descartável" da etapa 1. As capas de obra do M07 precisam ir para um
> armazenamento de objetos (S3, R2 ou similar) antes de o sistema ter uso real.

---

## Etapa 15 — O roteiro de deploy

**Faça:** escreva `docs\deploy.md`. O teste de qualidade é um só: **outra pessoa da turma
consegue fazer o deploy de novo, do zero, só com ele.**

| Seção | O que contém |
|---|---|
| Arquitetura | O diagrama do começo do módulo, com os nomes reais dos seus serviços |
| Pré-requisitos | Contas, acessos, onde ficam os segredos (o **lugar**, nunca o valor) |
| Passo a passo | Etapas 9 a 11, com os valores de cada campo |
| Variáveis | A tabela da etapa 10, com o que cada uma faz |
| Verificação | Os comandos da etapa 12 |
| Reversão | Como reverter o código, como restaurar o banco |
| Decisões | Swagger público ou não, plataforma escolhida, plano B |

---

## 🤖 IA no fluxo

Assistentes de IA são úteis para ler log de deploy: cole a saída de erro e pergunte o que
ela quer dizer. Antes de colar, **apague tudo que for segredo** — URLs de banco com senha,
o `SESSION_SECRET`, cookies. O log de build costuma imprimir variáveis de ambiente.

E desconfie de sugestões que "resolvem" o problema afrouxando a segurança: `secure: false` no
cookie, `trust proxy` como `true` (confiar em qualquer proxy), `synchronize: true` "só para
subir". Funcionam, e abrem exatamente as portas que os módulos anteriores fecharam.

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| Serviço sobe e nunca recebe tráfego | Porta fixa no código, ou `PORT` definida à mão no painel — etapa 4 |
| Login `200`, e a requisição seguinte `401` | Falta o `trust proxy`: o cookie `Secure` não foi enviado — etapa 5 |
| Todo mundo é deslogado a cada deploy | Sessões na memória — etapa 6 |
| `relation "sessao" does not exist` | A migração `CriaSessao` não rodou nesse banco |
| Deploy falha em `migration:run:prod` com `Cannot find module …entity.ts` | O `data-source.ts` ainda usa caminhos fixos de `src/` — veja a versão do M05 |
| `npm ci` falha na plataforma | O diretório raiz do serviço é `backend/`, onde não há lock. Use a raiz do repositório |
| Deploy "verde" e API respondendo `503` | O `health` não alcança o banco: confira a `DATABASE_URL` interna |
| `password authentication failed` no *seed* remoto | Usou a URL interna da sua máquina. De fora, só a externa funciona |
| `500` sem detalhes | Comportamento **correto**. Leia os logs da plataforma; nunca devolva `erro.stack` |
| Capas de obra sumiram | Disco efêmero — etapa 14 |
| O `start:dev` local passou a usar o banco do ensaio | Faltou o `Remove-Item` das variáveis — etapa 8 |

## 💣 Pegadinha de mercado

**Fazer o primeiro deploy na véspera da entrega.** Toda equipe acha que "é só subir". E toda
primeira subida tem pelo menos um tropeço: porta, proxy, variável esquecida, banco gratuito
que expirou, camada gratuita que dorme. Por isso este módulo faz o deploy do **BiblioCom**,
cedo, e o do projeto vem depois — quando o caminho já foi percorrido uma vez sem pressa.

## ✅ Checklist de saída

- [ ] API no ar, com HTTPS, numa URL pública
- [ ] PostgreSQL gerenciado, com as migrações aplicadas pelo comando de início
- [ ] `trust proxy` configurado, e o cookie de sessão chega com `Secure`
- [ ] Sessões no PostgreSQL: um deploy não desloga ninguém
- [ ] `/api/health` respondendo, e usado como *health check* da plataforma
- [ ] Ensaio geral feito na sua máquina antes do primeiro deploy
- [ ] Variáveis de produção no painel; `SESSION_SECRET` exclusivo de produção
- [ ] Usuário de coordenação criado pelo script, com as variáveis limpas depois
- [ ] Deploy automático a partir da `main`, protegida pelo CI
- [ ] Backup automático ligado
- [ ] `docs/deploy.md` reproduzível por outra pessoa

## 📦 Entrega E8

A URL pública da API e o `docs/deploy.md`, com o diagrama, o passo a passo, as variáveis
(sem os valores secretos), a verificação, o plano de reversão e as decisões tomadas.

## 🧩 Desafio de fixação

A equipe quer acrescentar `Associado.telefone`, **obrigatório**, e o sistema já tem mil
associados em produção. Descreva os deploys necessários, em ordem: o que cada um muda no
banco, o que muda no código, e em qual deles seria seguro reverter só o código.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Checklist em
[`../../recursos/checklists/deploy.md`](../../recursos/checklists/deploy.md).

## 📚 Para aprofundar

- [The Twelve-Factor App (pt-br)](https://12factor.net/pt_br/)
- [Express — Behind proxies](https://expressjs.com/en/guide/behind-proxies.html)
- [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple)
- [TypeORM — Migrations](https://typeorm.io/migrations)
- [NestJS — Deployment](https://docs.nestjs.com/deployment)
