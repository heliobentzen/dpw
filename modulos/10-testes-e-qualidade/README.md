# M10 — Testes e qualidade no backend

> **Pré-requisitos:** M08, M09 · **Duração:** média · **Semana:** 12
> **No projeto:** testes das regras e da matriz de acesso, rodando no CI a cada PR · P3 (critério 4)

## Por que este módulo existe no projeto

Da semana 12 até a 18, quatro pessoas vão mexer no mesmo código todos os dias, corrigindo
bugs da P2, acrescentando histórias e ajustando o que a organização pedir. Cada mudança pode
quebrar algo que funcionava — uma regra da organização, um guard esquecido numa rota nova.
Sem testes, isso é descoberto **por quem usa**, na frente de vocês — ou na demonstração da
P4.

O teste automatizado é o que permite mudar sem medo. E o **CI** é o que garante que ele
roda: um teste que depende de alguém lembrar de rodar não protege nada.

## 🎯 Ao final do módulo

1. As regras de negócio do cenário principal têm testes que **falham quando a regra quebra**.
2. A matriz de acesso do M08 é conferida automaticamente, célula por célula.
3. O CI roda lint, build, migrações e testes a cada PR, e a `main` só aceita merge com CI verde.

---

## 📖 Conceitos

### 1. O que um teste prova

Todo teste tem a forma **AAA**: *Arrange* (prepara a situação), *Act* (executa), *Assert*
(confere). Ele prova algo estreito e precioso: **para esta entrada, o código faz isto** — e
continua fazendo, depois que alguém mexer.

| Teste bom | Teste ruim |
| --- | --- |
| Falha quando a **regra** quebra | Falha quando alguém renomeia uma variável |
| Diz no nome o que garante | Chama-se `teste1` ou `should work` |
| Roda igual hoje, amanhã e no CI | Depende da data, da rede ou da ordem |

> **Antes de confiar num teste, veja-o falhar.** Quebre a regra de propósito (troque `>=` por
> `>`) e confira que algum teste reclama. Teste que nunca ficou vermelho pode estar testando
> nada.

### 2. Dois níveis

| | **Unitário** | **E2E** (ponta a ponta) |
| --- | --- | --- |
| O que testa | Uma regra, isolada | A API montada, com HTTP e banco de verdade |
| Dependências | **Dublês** (objetos que fingem ser o repositório) | Reais |
| Pega | Erro de lógica | Guard esquecido, pipe desligado, migração faltando, formato errado |
| Velocidade | Milissegundos | Segundos |

Um **dublê** é como o dublê do cinema: só precisa parecer o ator naquela cena. Só é possível
porque o service **recebe** os repositórios pelo construtor (M03): no teste, entregamos outra
coisa no lugar.

### 3. Regra pura: o código mais fácil de testar

Separar a regra do acesso ao banco deixa o teste trivial:

```ts
// src/agendamentos/regras.ts
export const ANTECEDENCIA_MINIMA_HORAS = 2;

export function podeCancelar(inicio: Date, agora: Date): boolean {
  const horas = (inicio.getTime() - agora.getTime()) / 3_600_000;
  return horas >= ANTECEDENCIA_MINIMA_HORAS;
}
```

```ts
// src/agendamentos/regras.spec.ts
describe("podeCancelar", () => {
  const inicio = new Date("2026-09-14T10:00:00Z");
  it.each([
    ["2026-09-14T07:00:00Z", true],    // 3h antes
    ["2026-09-14T08:00:00Z", true],    // exatamente 2h: a fronteira
    ["2026-09-14T08:01:00Z", false],   // 1h59 antes
  ])("pedido às %s → %s", (agora, esperado) => {
    expect(podeCancelar(inicio, new Date(agora))).toBe(esperado);
  });
});
```

Datas **fixas**, com fuso explícito. E os casos de **fronteira** (exatamente 2h): é lá que
`>=` e `>` se distinguem.

---

## 🧩 No projeto da equipe

### Passo 1 — O teste que já estava vermelho

```bash
cd backend
npm test
```

O `nest new` criou `src/app.controller.spec.ts` no M03, e provavelmente ele está falhando
desde então — ninguém rodou. Corrijam ou apaguem. **Teste que não roda é pior que teste
nenhum**: dá a sensação de segurança sem a segurança.

### Passo 2 — As regras do cenário principal

Listem as regras de negócio do projeto (as que lançam `409`/`422`, os limites, os prazos).
Para cada uma:

1. Se ela está misturada com banco, extraiam a parte pura para `regras.ts`.
2. Escrevam o teste, **incluindo as fronteiras**.
3. Quebrem a regra de propósito e confiram que o teste falha. Desfaçam.

### Passo 3 — O service com dublês

Para o método do service que implementa o cenário principal, testem os caminhos de erro e
que **nada é gravado quando a regra recusa**:

```ts
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

describe("AgendamentosService.marcar", () => {
  const agendamentos = { existsBy: vi.fn() };
  const manager = { create: vi.fn((_e, dados) => dados), save: vi.fn() };
  const dataSource = { transaction: vi.fn((trabalho) => trabalho(manager)) };
  let servico: AgendamentosService;

  beforeEach(async () => {
    vi.clearAllMocks();
    agendamentos.existsBy.mockResolvedValue(false);          // o caminho feliz
    const modulo = await Test.createTestingModule({
      providers: [
        AgendamentosService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Agendamento), useValue: agendamentos },
      ],
    }).compile();
    servico = modulo.get(AgendamentosService);
  });

  it("grava quando o horário está livre", async () => {
    await servico.marcar(7, new Date("2026-09-14T10:00:00Z"));
    expect(manager.save).toHaveBeenCalledTimes(1);
  });

  it("recusa horário ocupado com 409 e não grava nada", async () => {
    agendamentos.existsBy.mockResolvedValue(true);
    await expect(servico.marcar(7, new Date("2026-09-14T10:00:00Z"))).rejects.toThrow(ConflictException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
```

| Trecho | Por quê |
| --- | --- |
| `{ provide: X, useValue: dublê }` | "Quando alguém pedir `X`, entregue o dublê" |
| `getRepositoryToken(Entidade)` | O nome interno que o `@InjectRepository` procura |
| `await expect(...).rejects.toThrow(...)` | Sem o `await`, o teste termina antes da `Promise` |
| `vi.setSystemTime(...)` | Se o service usa `new Date()`, fixe o relógio (e `vi.useRealTimers()` no fim) |

### Passo 4 — Preparar o E2E

O teste E2E monta a aplicação **sem o `main.ts`**. Se a montagem (prefixo, pipes, sessão,
helmet) estiver espalhada no `main.ts`, o teste prova uma API diferente da de produção. Movam
tudo para `src/configurar-app.ts`:

```ts
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import session from "express-session";
import helmet from "helmet";

// Montagem única: o main.ts e os testes usam exatamente a mesma API.
export function configurarApp(app: NestExpressApplication): void {
  app.use(helmet());
  app.useBodyParser("json", { limit: "20kb" });
  app.enableCors({ origin: (process.env.CORS_ORIGENS ?? "").split(",").filter(Boolean), credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use(session({ /* exatamente a configuração do M08 */ }));
}
```

O `main.ts` passa a ser: criar a app, `configurarApp(app)`, Swagger, `listen`. (No M12, a
sessão ganha o armazenamento no PostgreSQL — **aqui**, num lugar só.)

Banco **separado** para testes (eles apagam tudo):

```bash
docker compose exec db createdb -U app app_teste
```

Apaguem `test/app.e2e-spec.ts` (o gerado pelo `nest new`) e ajustem `vitest.config.e2e.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const BANCO_DE_TESTE = process.env.DATABASE_URL_TESTE ?? "postgres://app:devpassword@localhost:5432/app_teste";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: "./",
    include: ["**/*.e2e-spec.ts"],
    globalSetup: ["./test/preparar-banco.ts"],
    fileParallelism: false,                     // os arquivos apagam o mesmo banco
    env: {
      DATABASE_URL: BANCO_DE_TESTE,
      SESSION_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
      NOME_ORGANIZACAO: "Teste",
      CORS_ORIGENS: "",
    },
  },
});
```

`test/preparar-banco.ts` — roda uma vez e recria o esquema **pelas migrações** (o M05 provado
a cada execução):

```ts
import { execSync } from "node:child_process";

export default function prepararBanco() {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TESTE ?? "postgres://app:devpassword@localhost:5432/app_teste" };
  execSync("npm run typeorm schema:drop", { env, stdio: "inherit" });
  execSync("npm run migration:run", { env, stdio: "inherit" });
}
```

`test/apoio.ts` — montar a app, limpar o banco, criar um usuário por papel:

```ts
import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { DataSource } from "typeorm";
import { AppModule } from "../src/app.module.js";
import { AuthService } from "../src/auth/auth.service.js";
import { Papel } from "../src/auth/usuario.entity.js";
import { configurarApp } from "../src/configurar-app.js";

export const SENHA = "senha-de-teste-bem-longa";

export async function criarApp(): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })   // vários logins seguidos
    .compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();
  return app;
}

export async function limparBanco(app: INestApplication) {
  const fonte = app.get(DataSource);
  const tabelas = fonte.entityMetadatas.map((e) => `"${e.tableName}"`).join(", ");
  await fonte.query(`TRUNCATE ${tabelas} RESTART IDENTITY CASCADE`);
}

export async function criarUsuarios(app: INestApplication) {
  const auth = app.get(AuthService);
  await auth.criar("Coordenação", "coord@teste.org", SENHA, Papel.COORDENACAO);
  await auth.criar("Operador", "oper@teste.org", SENHA, Papel.OPERADOR);
}
```

### Passo 5 — A matriz de acesso, automatizada

A tabela do M08 vira teste. `test/acesso.e2e-spec.ts`:

```ts
import request from "supertest";
import { criarApp, criarUsuarios, limparBanco, SENHA } from "./apoio.js";

describe("Matriz de acesso", () => {
  let app: INestApplication;
  const agentes: Record<string, ReturnType<typeof request.agent>> = {};

  beforeAll(async () => {
    app = await criarApp();
    await limparBanco(app);
    await criarUsuarios(app);
    // ...insira aqui os registros que as rotas abaixo precisam
    agentes.anonimo = request.agent(app.getHttpServer());
    for (const [nome, email] of [["operador", "oper@teste.org"], ["coordenacao", "coord@teste.org"]]) {
      agentes[nome] = request.agent(app.getHttpServer());   // guarda o cookie, como o -c/-b do curl
      await agentes[nome].post("/api/sessao").send({ email, senha: SENHA }).expect(200);
    }
  });

  afterAll(() => app.close());   // devolve as conexões com o banco

  it.each([
    ["anonimo", "post", "/api/<recurso>", 401],
    ["operador", "delete", "/api/<recurso>/1", 403],
    ["coordenacao", "delete", "/api/<recurso>/1", 204],
    // ...uma linha por célula da matriz do docs/api.md
  ] as const)("%s: %s %s → %i", async (quem, metodo, rota, status) => {
    await agentes[quem][metodo](rota).send({}).expect(status);
  });
});
```

Acrescentem um arquivo E2E para o **cenário principal**: o caminho feliz, o caso de conflito
(`409`/`422`) e um corpo inválido (`400`), conferindo também **o banco** depois (a transação
gravou as duas coisas?). E um teste de **IDOR** (M09): outra pessoa recebe 404.

```bash
npm run test:e2e
```

**Prove que o teste vigia:** tirem o `PapeisGuard` de uma rota e rodem de novo. Uma linha da
matriz tem de ficar vermelha.

### Passo 6 — O CI

Na **raiz** do repositório, `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_USER: app, POSTGRES_PASSWORD: devpassword, POSTGRES_DB: app }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://app:devpassword@localhost:5432/app
      DATABASE_URL_TESTE: postgres://app:devpassword@localhost:5432/app_teste
      SESSION_SECRET: segredo-do-ci-que-nao-protege-nada-real
      NOME_ORGANIZACAO: CI
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run lint -w backend
      - run: npm run build -w backend
      - name: O esquema nasce do zero e bate com as entidades
        run: |
          npm run migration:run -w backend
          npm run migration:check -w backend
      - run: npm test -w backend
      - name: Testes E2E
        run: |
          PGPASSWORD=devpassword psql -h localhost -U app -c "CREATE DATABASE app_teste"
          npm run test:e2e -w backend
```

O `SESSION_SECRET` escrito aqui só é aceitável porque não protege nada real. Segredo de
produção nunca vai neste arquivo (M12).

Depois do primeiro CI verde:

1. Em *Settings → Branches*, na regra da `main`, exijam **"status checks"** com o job
   `backend`. Quebrar a `main` deixa de ser possível — não só proibido.
2. Acrescentem o badge ao README:
   `![CI](https://github.com/<organizacao>/<repo>/actions/workflows/ci.yml/badge.svg)`
3. Registrem em `docs/plano-de-teste.md` ([modelo](../../projeto/modelos-de-documentos/plano-de-teste.md))
   o que é testado e onde.

> A partir daqui, **toda história nova chega com teste no mesmo PR**. O revisor confere.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `describe is not defined` | O arquivo não está no `include`, ou faltou `globals: true` |
| `Nest can't resolve dependencies of the XService (?, …)` | Falta um `provide` no módulo de teste; o `?` mostra qual |
| Teste passa sozinho e falha com os outros | Estado compartilhado: faltou `vi.clearAllMocks()` ou `beforeEach` limpando o banco |
| E2E apagou o banco de desenvolvimento | O `DATABASE_URL` de teste não foi aplicado; confira o `env` do Vitest |
| `too many clients already` | Faltou `app.close()` no `afterAll` |
| Teste muda de resultado conforme o dia | Usa `new Date()`; fixe com `vi.setSystemTime` |
| E2E com `429` | Faltou o `overrideGuard(ThrottlerGuard)` |
| CI falha em `migration:check` | Entidade mudou sem migração (M05) |

## 🤖 IA no fluxo

Gerar teste é das coisas que a IA faz melhor. Confiram no que voltar: cada teste falharia se
a regra quebrasse? O nome diz o comportamento? Os dublês fingem métodos que o código
realmente chama? Um padrão comum é o teste que confere que o dublê devolveu o que mandaram
ele devolver — passa sempre e não prova nada.

## ✅ Marco do módulo

- [ ] Regras do cenário principal com testes unitários, incluindo as fronteiras
- [ ] Service do cenário principal testado com dublês: erros e "nada gravado quando recusa"
- [ ] `configurarApp` usado pelo `main.ts` e pelos testes
- [ ] Matriz de acesso completa automatizada; teste de IDOR; E2E do cenário principal
- [ ] CI verde, obrigatório para merge na `main`, com badge no README
- [ ] 15+ testes no total (mínimo da P3)

## 📚 Para aprofundar

- [Vitest](https://vitest.dev/) · [Supertest](https://github.com/ladjs/supertest)
- [NestJS — Testing](https://docs.nestjs.com/fundamentals/testing)
- [GitHub Actions — serviços de contêiner](https://docs.github.com/pt/actions/using-containerized-services/about-service-containers)
- [Martin Fowler — Test Double](https://martinfowler.com/bliki/TestDouble.html)
