# M14 — Testes e qualidade

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 14** · **Pré-requisitos:** M07, M11, M12
> Módulo complementar à ementa, exigido pela realidade: a Etapa 3 pede *"realização dos
> testes"*.

Três horas para duas suítes. O módulo é deliberadamente seletivo: cobre o que **quebra o
projeto quando falha**, e trata o resto como leitura. Ver
[ADR-09](../../docs/decisoes-tecnicas.md#adr-09--o-custo-em-carga-horária).

## 🎯 Objetivos

1. Priorizar o que testar quando o tempo é escasso.
2. Testar regra de negócio, DTOs, permissões e API com Jest e Supertest.
3. Testar componentes e formulários com Vitest + Testing Library.
4. Garantir o **contrato** entre as camadas no CI.
5. Configurar lint, formatação e integração contínua para os dois projetos.

---

## 📖 Teoria (1h)

### 1. O que testar quando o tempo é curto (15 min)

O argumento não é "qualidade": é **velocidade sustentada**. Com quatro pessoas mexendo no
mesmo sistema, sem testes cada alteração exige reverificar tudo à mão — e a equipe descobre
o que quebrou na apresentação.

Prioridade, nesta ordem:

| # | O que | Por quê | Camada |
|---|---|---|---|
| 1 | **Regra de negócio** | É o que o sistema faz de único | 🔵 service |
| 2 | **Controle de acesso** | Falha aqui é incidente, não bug | 🔵 API |
| 3 | **Validação** | Protege a integridade dos dados | 🔵 DTO |
| 4 | **Contrato** | Divergência silenciosa entre camadas | ⚪ CI |
| 5 | Componente com lógica | Formulário, filtro, estado | 🟣 |
| 6 | Fluxo completo (e2e) | Caro e frágil; 1 ou 2 no máximo | ⚪ |

**Não teste:** o framework (NestJS e TypeORM já são testados), componentes puramente visuais,
`getters` triviais.

> Numa arquitetura desacoplada, o item 4 é o que mais dá prejuízo e o que menos gente
> testa: os dois lados passam nos próprios testes e o sistema não funciona.

### 2. Backend com Jest (20 min)

O NestJS já vem com Jest configurado — o `nest new` do M03 criou `jest` e os scripts. Falta
só o utilitário de dados:

```bash
cd ~/dev/bibliocom/backend
pnpm add -D @faker-js/faker supertest @types/supertest
```

| Pacote | Para quê |
|---|---|
| `jest` | Já instalado pelo `nest new`. Executor e biblioteca de asserção |
| `supertest` | Faz requisições HTTP contra a aplicação **sem subir servidor** |
| `@faker-js/faker` | Gera dados plausíveis, evitando `"teste1"`, `"teste2"` |

> Jest e Vitest têm API praticamente idêntica (`describe`, `it`, `expect`). O que você
> aprender aqui vale na seção 3, sobre o frontend.

**Regra de negócio (prioridade 1):**

```ts
describe("EmprestimosService", () => {
  it("recusa segundo empréstimo ativo do mesmo exemplar", async () => {
    await service.emprestar(exemplar.id, associado.id);

    await expect(service.emprestar(exemplar.id, outroAssociado.id))
      .rejects.toThrow(ConflictException);
  });

  it("recusa o quarto empréstimo em aberto do mesmo associado", async () => {
    for (const ex of tresExemplares) await service.emprestar(ex.id, associado.id);

    await expect(service.emprestar(quarto.id, associado.id))
      .rejects.toThrow(UnprocessableEntityException);
  });
});
```

Teste também a **restrição do banco** (M04), não só a validação do DTO — assim a regra vale
para toda escrita, inclusive por script ou migração:

```ts
it("impede tombo duplicado no nível do banco", async () => {
  await repo.save(repo.create({ tombo: "A-001", obra }));
  await expect(repo.save(repo.create({ tombo: "A-001", obra })))
    .rejects.toThrow(QueryFailedError);
});
```

**Controle de acesso (prioridade 2)** — a matriz do M12 vira teste parametrizado:

```ts
describe("matriz de acesso", () => {
  it.each([
    [null,            "get",    "/api/obras", 200],
    [null,            "post",   "/api/obras", 401],
    ["associado",     "post",   "/api/obras", 403],
    ["bibliotecario", "post",   "/api/obras", 201],
    ["associado",     "get",    "/api/relatorios", 403],
    ["coordenacao",   "get",    "/api/relatorios", 200],
    ["bibliotecario", "delete", "/api/obras/1", 403],
    ["coordenacao",   "delete", "/api/obras/1", 204],
  ])("%s %s %s -> %i", async (papel, metodo, rota, esperado) => {
    const req = request(app.getHttpServer())[metodo](rota);
    if (papel) req.set("Cookie", await sessaoDe(papel));
    if (metodo === "post") req.send({ titulo: "T", autorId: autor.id });

    await req.expect(esperado);
  });
});
```

`it.each` recebe a tabela e roda um teste por linha, com nome legível. Uma falha de
autorização introduzida por engano passa a quebrar o CI — é, provavelmente, o teste de maior
retorno do projeto inteiro.

**Validação (prioridade 3):**

```ts
it.each([
  ["9788535914849", true],
  ["978-85-359-1484-9", true],
  ["123", false],
  ["abcdefghijklm", false],
  ["", true],
])("ISBN %s -> válido: %s", async (isbn, valido) => {
  const erros = await validate(Object.assign(new CriarObraDto(), {
    titulo: "T", autorId: autor.id, isbn,
  }));
  expect(erros.length === 0).toBe(valido);
});
```

Repare que isto testa o **DTO isolado**, sem HTTP e sem banco: milissegundos por caso, o que
permite cobrir muitas combinações.

### 3. Frontend com Vitest e Testing Library (25 min)

Mesma API do Jest, executor diferente — o Vitest roda sobre o Vite e reaproveita a
configuração que o projeto já tem.

```bash
# Linux / macOS / WSL / Git Bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react \
            @testing-library/user-event @testing-library/jest-dom msw
```

```powershell
# Windows PowerShell — linha única de propósito (ver nota abaixo)
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

> 🪟 A quebra de linha no PowerShell é a **crase** (`` ` ``), não a barra invertida — e ela
> precisa ser o **último caractere da linha**. Um espaço depois dela encerra o comando em
> silêncio: metade dos pacotes é instalada e não há mensagem de erro. Por isso os comandos
> de instalação deste material vêm em linha única, por mais longos que fiquem.

```ts
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: "jsdom", setupFiles: "./src/teste/setup.ts", globals: true },
});
```

```ts
// src/teste/setup.ts
import "@testing-library/jest-dom/vitest";
import { server } from "./servidor-mock";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**A regra da Testing Library:** teste o que o **usuário** vê e faz, não a implementação.

```tsx
// src/components/ObraCard.test.tsx
import { render, screen } from "@testing-library/react";

test("mostra disponibilidade quando há exemplares livres", () => {
  render(<ObraCard titulo="Dom Casmurro" autor="Machado" ano={1899} disponiveis={2} />);

  expect(screen.getByRole("heading", { name: "Dom Casmurro" })).toBeInTheDocument();
  expect(screen.getByText(/2 disponível/i)).toBeInTheDocument();
});

test("avisa quando todos estão emprestados", () => {
  render(<ObraCard titulo="X" autor="Y" ano={2000} disponiveis={0} />);
  expect(screen.getByText(/todos emprestados/i)).toBeInTheDocument();
});
```

Prefira `getByRole` a `getByTestId`: se o teste encontra o elemento pelo papel acessível,
um leitor de tela também encontra. **O teste vira uma verificação de acessibilidade de
graça.**

**MSW** simula a API sem tocar no backend:

```ts
// src/teste/servidor-mock.ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  http.get("/api/obras/", () =>
    HttpResponse.json({
      count: 1, next: null, previous: null,
      results: [{ id: 1, titulo: "Dom Casmurro", autor: { id: 1, nome: "Machado" },
                  ano_publicacao: 1899, exemplares_total: 3, exemplares_disponiveis: 2 }],
    }),
  ),
);
```

```tsx
test("exibe erro de validação vindo do servidor", async () => {
  server.use(
    http.post("/api/obras/", () =>
      HttpResponse.json({ isbn: ["Já existe uma obra com este ISBN."] }, { status: 400 }),
    ),
  );

  const usuario = userEvent.setup();
  render(<ObraFormPage />, { wrapper: ComProviders });

  await usuario.type(screen.getByLabelText(/título/i), "Teste");
  await usuario.click(screen.getByRole("button", { name: /salvar/i }));

  expect(await screen.findByText(/já existe uma obra com este isbn/i)).toBeInTheDocument();
});
```

Este teste cobre o caminho mais importante do M11: o erro do DRF chegando ao campo certo.

### 4. Teste de contrato (5 min) ⭐

O teste que só existe nesta arquitetura — e o que evita o bug mais caro:

```bash
# no CI, após rodar os testes das duas camadas.
# O runner do GitHub Actions e Linux — aqui o && e sempre valido.
cd backend && pnpm gerar:schema          # escreve openapi.json (M07)
cd .. && pnpm --filter @bibliocom/tipos gerar
git diff --exit-code pacotes/tipos/src/api.d.ts
```

Se o schema mudou e os tipos não foram regenerados, o CI falha. Combinado com o
`tsc --noEmit`, um campo renomeado no backend quebra o build do frontend **antes** de
chegar a produção.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Backend: as três prioridades (50 min)

Monte o cenário de teste e escreva ao menos 15 testes.

O banco de teste é um **segundo banco PostgreSQL**, não o de desenvolvimento e não SQLite
em memória: um teste que passa num banco com tipagem e transações diferentes das de produção
prova pouco. Acrescente um segundo serviço ao `docker-compose.yml`, na porta `5433`, e uma
`DATABASE_URL` própria em `.env.test`. Recrie o esquema por suíte com
`dataSource.synchronize(true)` — aqui o `synchronize` é adequado, porque o banco é
descartável de verdade.

Os 15 testes:

- 6 de regra de negócio (prazo, limite, disponibilidade, atraso, devolução, restrição do banco)
- 6 da matriz de acesso (com `it.each`, incluindo IDOR)
- 3 de validação de DTO (com `it.each`)

```bash
pnpm test --coverage
```

### Passo 2 — Frontend: componente e formulário (40 min)

Configure Vitest, Testing Library e MSW, e escreva ao menos 6 testes:

| Teste | O que garante |
|---|---|
| `ObraCard` mostra os dados | Renderização básica |
| `ObraCard` com 0 disponíveis | Caminho alternativo |
| Listagem exibe estado vazio | Estado tratado |
| Listagem exibe erro de rede | Estado tratado |
| Formulário valida no cliente (Zod) | Validação local |
| Formulário exibe erro 400 do servidor no campo | **Integração do contrato** |

```bash
pnpm vitest run
```

### Passo 3 — CI para os dois projetos (30 min)

```yaml
# .github/workflows/ci.yml
name: CI
on: { push: { branches: [main] }, pull_request: }

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-retries 10
    env:
      SESSION_SECRET: segredo-apenas-para-ci
      NODE_ENV: test
      DATABASE_URL: postgres://test:test@localhost:5432/test
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test --coverage --coverageThreshold='{"global":{"lines":60}}'
      - run: pnpm gerar:schema
      - uses: actions/upload-artifact@v4
        with: { name: schema, path: backend/openapi.json }

  frontend:
    runs-on: ubuntu-latest
    needs: backend
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, cache-dependency-path: frontend/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with: { name: schema, path: backend }
      - name: Tipos sincronizados com a API
        run: |
          pnpm --filter @bibliocom/tipos gerar
          git diff --exit-code ../pacotes/tipos/src/api.d.ts
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm vitest run
      - run: pnpm build
```

Proteja a `main` exigindo os dois jobs verdes antes do merge.

O passo "Tipos sincronizados" é o **teste de contrato**: o job do frontend baixa o schema
gerado pelo backend no mesmo commit e falha se os tipos estiverem defasados.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Testes compartilhando o mesmo banco | Banco de teste próprio, recriado por suíte |
| Teste verde na máquina, vermelho no CI | Suíte dependendo de dado deixado por outra. Limpe as tabelas entre elas |
| Testar o framework | Teste **sua** regra |
| Só `status_code` na asserção | Verifique também o efeito no banco |
| `getByTestId` para tudo | `getByRole` — testa acessibilidade junto |
| Testar estado interno do componente | Teste o que o usuário vê |
| Frontend chamando o backend real no teste | Use MSW |
| Testes dependentes da ordem | Cada teste monta o próprio cenário |
| Perseguir 100% de cobertura | Cubra o que importa |
| Bug corrigido sem teste | Todo bug vira teste de regressão |
| CI só no backend | O contrato quebra justamente entre as camadas |

## ✅ Checklist de saída

- [ ] ≥ 15 testes no backend (regra, acesso, validação)
- [ ] Matriz de acesso automatizada e parametrizada
- [ ] ≥ 6 testes no frontend, incluindo o erro 400 no formulário
- [ ] MSW simulando a API, sem depender do backend
- [ ] Cobertura ≥ 60% no backend
- [ ] `pnpm lint` sem erros nas duas camadas
- [ ] `pnpm tsc --noEmit` sem erros nas duas camadas
- [ ] **Teste de contrato no CI** (tipos sincronizados)
- [ ] CI verde nos dois jobs; `main` protegida
- [ ] Ao menos 1 teste de regressão a partir de um bug real

## 📦 Entrega E7 — Suíte verde nas duas camadas

Repositório com CI verde, badge no README, relatório de cobertura do backend e a lista de
testes com o que cada um garante.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest](https://jestjs.io/pt-BR/)
- [Supertest](https://github.com/ladjs/supertest)
- [Vitest](https://vitest.dev/)
- [Testing Library — princípios](https://testing-library.com/docs/guiding-principles)
- [MSW](https://mswjs.io/)
- [Testing Library — queries por prioridade](https://testing-library.com/docs/queries/about#priority) ⭐
