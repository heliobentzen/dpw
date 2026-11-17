# M12 — Deploy da API

> **Pré-requisitos:** M10, M11 · **Duração:** média · **Semanas:** 13–14
> **Ementa:** *Implantação (deploy) do sistema.*
> **No projeto:** a API da equipe no ar, com HTTPS e banco gerenciado · P3 (critério 5, eliminatório) e P4 (demonstração)

## Por que este módulo existe no projeto

Uma API que só roda em `localhost` não serve a ninguém. A P3 é eliminatória se a API não
estiver no ar, e a demonstração da P4 é **em produção**. Na trilha opcional, a visita à
organização na semana 14 serve para **abrir o `/health` no equipamento de lá**.

Por isso o deploy acontece **agora**, e não na véspera: toda primeira subida tropeça em
alguma coisa (porta, proxy, variável esquecida, plano gratuito que dorme). Descobrir isso na
semana 14 deixa quatro semanas para resolver; na semana 18, nenhuma.

## 🎯 Ao final do módulo

1. A API da equipe está numa URL pública com HTTPS, ligada a um PostgreSQL gerenciado.
2. Cada merge na `main` com CI verde vira deploy automático, com migrações aplicadas antes.
3. `docs/deploy.md` permite que **outra pessoa** refaça o deploy do zero.

---

## 📖 Conceitos

### 1. Da sua máquina para a rua: cinco dos 12 fatores

| Fator | Em uma frase | No projeto |
| --- | --- | --- |
| Configuração no ambiente | Nada que muda entre ambientes fica no código | `.env` local, painel da plataforma em produção (M03) |
| Vínculo de porta | A aplicação escuta na porta que **mandarem** | `process.env.PORT` |
| Processos descartáveis | O processo morre e renasce a qualquer momento | Sessões no banco, não na memória |
| Paridade dev/prod | Desenvolvimento parecido com produção | PostgreSQL desde o M04 |
| Logs como fluxo | A aplicação escreve no terminal; a plataforma guarda | M13 |

### 2. Onde implantar

Uma **PaaS** com serviço web e PostgreSQL gerenciado no mesmo painel (Render, Railway e
similares). Os botões mudam de plataforma para plataforma; os conceitos — comando de build,
comando de início, variáveis, URL interna do banco — são os mesmos.

> ⚠️ **Camada gratuita muda de política sem avisar.** O banco gratuito expira? O serviço
> "dorme"? Tenham um plano B (um banco de outro fornecedor, como o Neon) e anotem na matriz
> de riscos.

> 💡 **Pensem na P4 desde já:** ela pede o sistema pronto para ser transferido. Criem as
> contas com um e-mail **do projeto** (não pessoal) e registrem o custo mensal. Na trilha
> opcional, a titularidade passa de fato para a organização.

### 3. Atrás do proxy

Na plataforma, ninguém fala direto com a API: um **proxy** recebe o HTTPS e repassa por HTTP,
avisando no cabeçalho `X-Forwarded-Proto: https`. É a recepção de um hotel ligando para o
quarto: "visita pela entrada principal". Se a API não confiar na recepção, vê HTTP, conclui
que a conexão é insegura e **não envia o cookie `Secure`** do M08. Sintoma: login responde
200, e a requisição seguinte, 401. A correção é uma linha: `app.set("trust proxy", 1)` —
confiar **só no primeiro** proxy (confiar em qualquer um deixaria forjar o IP e enganar o
limite de login do M09).

### 4. Deploy com dados dentro

Do segundo deploy em diante, há usuários e dados. Por alguns minutos, **a API antiga atende
com o banco já migrado** — por isso migração precisa ser compatível para trás (M05) e o
contrato também (M11). Reverter tem dois níveis: código com bug → *rollback* do deploy;
dado destruído → **restaurar o backup** (testado no M13).

---

## 🧩 No projeto da equipe

O papel de *Ops* da sprint conduz; o resto da equipe acompanha e revisa os PRs.

### Passo 1 — Preparar o código

`backend/package.json`:

```json
"start:prod": "node dist/main.js",
"migration:run:prod": "typeorm -d dist/data-source.js migration:run",
"seed:admin": "node dist/seed-admin.js"
```

Em produção os arquivos já estão compilados: `typeorm`, não `typeorm-ts-node-esm`. O
`data-source.ts` do M05 acha as migrações em `dist/` sozinho.

`main.ts` — a porta que a plataforma mandar, em todas as interfaces:

```ts
await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
```

> ⚠️ **Não** criem a variável `PORT` no painel: quem a define é a plataforma.

`configurar-app.ts` — primeira linha da função:

```ts
app.set("trust proxy", 1);
```

### Passo 2 — Sessões no PostgreSQL

Em memória, todo deploy desloga todo mundo, e duas instâncias não compartilham sessões
([ADR-10](../../docs/decisoes-tecnicas.md#adr-10--sessões-guardadas-no-postgresql)).

```bash
npm install connect-pg-simple
npm install -D @types/connect-pg-simple
npm run migration:create src/migracoes/CriaSessao
```

```ts
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`CREATE TABLE "sessao" ("sid" varchar NOT NULL PRIMARY KEY, "sess" json NOT NULL, "expire" timestamp(6) NOT NULL)`);
  await queryRunner.query(`CREATE INDEX "IDX_sessao_expire" ON "sessao" ("expire")`);
}
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE "sessao"`);
}
```

No `configurar-app.ts`:

```ts
import connectPgSimple from "connect-pg-simple";

app.use(
  session({
    name: "sid",
    store: new (connectPgSimple(session))({ conString: process.env.DATABASE_URL, tableName: "sessao" }),
    // ...o resto igual ao M08
  }),
);
```

**Deu certo se** um login sobrevive a um reinício da API, e o `npm run test:e2e` continua
verde.

### Passo 3 — `/api/health`

`src/saude/saude.controller.ts`, registrado no `AppModule`:

```ts
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

Pública, sem guard: quem pergunta é a plataforma (e, no M13, o monitor). API de pé com banco
fora não está bem — por isso o `SELECT 1`.

### Passo 4 — Ensaio geral na própria máquina

Subam **como a plataforma vai subir**: banco vazio, código compilado, variáveis de produção.

```bash
docker compose exec db createdb -U app app_ensaio
```

```powershell
# Windows PowerShell — as variáveis do terminal vencem as do .env
$env:NODE_ENV="production"
$env:DATABASE_URL="postgres://app:devpassword@localhost:5432/app_ensaio"
$env:SESSION_SECRET="ensaio-local-com-mais-de-trinta-e-dois-caracteres"
$env:NOME_ORGANIZACAO="Ensaio"
$env:ADMIN_EMAIL="adm@ensaio.org"
$env:ADMIN_SENHA="senha-do-ensaio-bem-longa"
npm run build; npm run migration:run:prod; npm run seed:admin; npm run start:prod
```

```bash
# Linux / macOS / WSL / Git Bash
export NODE_ENV=production DATABASE_URL=postgres://app:devpassword@localhost:5432/app_ensaio \
  SESSION_SECRET=ensaio-local-com-mais-de-trinta-e-dois-caracteres NOME_ORGANIZACAO=Ensaio \
  ADMIN_EMAIL=adm@ensaio.org ADMIN_SENHA=senha-do-ensaio-bem-longa
npm run build && npm run migration:run:prod && npm run seed:admin && npm run start:prod
```

Noutro terminal, `curl` no `/api/health` e um login com `-H "X-Forwarded-Proto: https"`.
**Deu certo se** o login devolve `Set-Cookie` com `Secure`. **Depois, fechem o terminal** (ou
`Remove-Item Env:\NODE_ENV, Env:\DATABASE_URL, ...`): senão o próximo `start:dev` aponta para
o banco do ensaio.

### Passo 5 — Banco e serviço na plataforma

**PostgreSQL 16**, na mesma região da API. A plataforma mostra duas URLs: a **interna** (a
API usa) e a **externa** (vocês usam, da própria máquina, para tarefas pontuais). Guardem as
duas num gerenciador de senhas — **nunca** num arquivo do repositório. Liguem o **backup
automático**.

**Serviço web**, ligado ao repositório:

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Diretório raiz | a **raiz** do repositório (onde está o `package-lock.json`) |
| Build | `npm ci && npm run build -w backend` |
| Início | `npm run migration:run:prod -w backend && npm run start:prod -w backend` |
| Health check | `/api/health` |

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | a URL **interna** |
| `SESSION_SECRET` | um **novo**, só de produção (nunca o do `.env` ou do CI) |
| `NOME_ORGANIZACAO` | o nome da organização |
| `CORS_ORIGENS` | vazio, enquanto não houver cliente web |

Acompanhem o log do primeiro deploy até o fim: `npm ci` → `nest build` → migrações →
`Nest application successfully started`.

### Passo 6 — O primeiro usuário em produção

Da própria máquina, contra a URL **externa**, com as variáveis só na sessão do terminal:

```powershell
$env:DATABASE_URL="<URL externa>"; $env:ADMIN_EMAIL="<e-mail da coordenação da organização>"; $env:ADMIN_SENHA="<senha longa, só de produção>"
npm run build; npm run seed:admin
Remove-Item Env:\DATABASE_URL, Env:\ADMIN_EMAIL, Env:\ADMIN_SENHA
```

### Passo 7 — Verificar o que está no ar

Percorram o [checklist de deploy](../../recursos/checklists/deploy.md):

- [ ] `https://<sua-api>/api/health` → `{"status":"ok"}`
- [ ] Cabeçalhos com `strict-transport-security`, sem `x-powered-by`
- [ ] Login devolve `Set-Cookie` com `Secure`, e a rota seguinte responde 200
- [ ] `/api/docs` abre; `http://` redireciona para `https://`
- [ ] **Abram a URL num celular com 4G** — fora da rede do campus

### Passo 8 — Deploy contínuo

Liguem o deploy automático a partir da `main` (e, se a plataforma oferecer, "esperar o CI").
O caminho de toda mudança passa a ser:

```mermaid
flowchart LR
    B[branch] --> PR[PR] --> CI{CI verde?}
    CI -- não --> B
    CI -- sim --> M[merge na main] --> D[deploy] --> H{health ok?}
    H -- sim --> N[nova versão no ar]
    H -- não --> V[versão anterior continua]
```

Testem com um PR pequeno e visível (a descrição no `swagger.ts`).

### Passo 9 — `docs/deploy.md`

O teste de qualidade é um só: **outra pessoa consegue refazer o deploy do zero só com ele.**
Contém: arquitetura (C4 nível 2 com os nomes reais), contas e **onde** ficam os segredos
(nunca o valor), passo a passo, tabela de variáveis, verificação, como reverter código e
como restaurar o banco, custo mensal, e as decisões (plataforma, plano B, Swagger público).
É também a base do termo de transferência da P4.

> **Se o projeto recebe arquivos:** o disco do contêiner é apagado a cada deploy. Antes de
> uso real, os arquivos vão para um armazenamento de objetos (S3, R2 ou similar).

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| Serviço sobe e nunca recebe tráfego | Porta fixa no código, ou `PORT` definida à mão no painel |
| Login 200, a requisição seguinte 401 | Falta `trust proxy` |
| Todo deploy desloga todo mundo | Sessões na memória |
| `relation "sessao" does not exist` | A migração `CriaSessao` não rodou nesse banco |
| `npm ci` falha na plataforma | Diretório raiz configurado como `backend/` |
| Deploy "verde" e `/health` com 503 | A `DATABASE_URL` interna está errada |
| `password authentication failed` no seed remoto | Usou a URL interna de fora da plataforma |
| `500` sem detalhes | Comportamento **correto**; leiam o log da plataforma |

## 🤖 IA no fluxo

Útil para ler log de deploy — mas **apaguem os segredos antes de colar** (URLs com senha,
`SESSION_SECRET`, cookies). E desconfiem de "soluções" que afrouxam a segurança: `secure:
false`, `trust proxy: true`, `synchronize: true` "só para subir".

## ✅ Marco do módulo

- [ ] API do projeto no ar com HTTPS, banco gerenciado e backup automático
- [ ] Migrações aplicadas pelo comando de início; sessões no PostgreSQL; `trust proxy`
- [ ] `/api/health` como health check; `SESSION_SECRET` exclusivo de produção
- [ ] Deploy automático a partir da `main` protegida pelo CI
- [ ] `docs/deploy.md` reproduzível, com custo mensal; URL testada fora da rede do campus

## 📚 Para aprofundar

- [The Twelve-Factor App](https://12factor.net/pt_br/)
- [Express — Behind proxies](https://expressjs.com/en/guide/behind-proxies.html)
- [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple)
- [NestJS — Deployment](https://docs.nestjs.com/deployment)
