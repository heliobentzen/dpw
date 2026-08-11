# M14 — Testes e qualidade

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 14** · **Pré-requisitos:** M07, M11, M12
> Módulo complementar à ementa, exigido pela realidade: a Etapa 3 pede *"realização dos
> testes"*.

Três horas para duas suítes. O módulo é deliberadamente seletivo: cobre o que **quebra o
projeto quando falha**, e trata o resto como leitura. Ver
[ADR-09](../../docs/decisoes-tecnicas.md#adr-09--o-custo-em-carga-horária).

## 🎯 Objetivos

1. Priorizar o que testar quando o tempo é escasso.
2. Testar model, serializer, permissões e API com `pytest-django`.
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
| 1 | **Regra de negócio** | É o que o sistema faz de único | 🔵 model |
| 2 | **Controle de acesso** | Falha aqui é incidente, não bug | 🔵 API |
| 3 | **Validação** | Protege a integridade dos dados | 🔵 serializer |
| 4 | **Contrato** | Divergência silenciosa entre camadas | ⚪ CI |
| 5 | Componente com lógica | Formulário, filtro, estado | 🟣 |
| 6 | Fluxo completo (e2e) | Caro e frágil; 1 ou 2 no máximo | ⚪ |

**Não teste:** o framework (o Django já é testado), componentes puramente visuais,
`getters` triviais.

> Numa arquitetura desacoplada, o item 4 é o que mais dá prejuízo e o que menos gente
> testa: os dois lados passam nos próprios testes e o sistema não funciona.

### 2. Backend com `pytest-django` (20 min)

```bash
pip install pytest pytest-django pytest-cov model-bakery
```

```ini
# backend/pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = test_*.py
addopts = -v --tb=short --reuse-db
```

```python
# backend/conftest.py
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def bibliotecario(db, django_user_model):
    return django_user_model.objects.create_user(
        username="bib", password="senha-de-teste-123", papel="BIBLIOTECARIO",
        email="bib@exemplo.org",
    )


@pytest.fixture
def cliente_bib(api_client, bibliotecario):
    api_client.force_authenticate(bibliotecario)
    return api_client
```

**Regra de negócio (prioridade 1):**

```python
@pytest.mark.django_db
def test_exemplar_nao_pode_ter_dois_emprestimos_ativos(exemplar, associado):
    Emprestimo.objects.create(exemplar=exemplar, associado=associado)
    with pytest.raises(IntegrityError):
        Emprestimo.objects.create(exemplar=exemplar, associado=associado)
```

Testar a **restrição do banco** (M04), e não só a validação do serializer, garante que a
regra vale para toda escrita — inclusive pelo admin e por comandos.

**Controle de acesso (prioridade 2)** — a matriz do M12 vira teste parametrizado:

```python
@pytest.mark.django_db
@pytest.mark.parametrize(
    "papel,metodo,rota,esperado",
    [
        (None,            "get",  "obra-list",   200),
        (None,            "post", "obra-list",   401),
        ("ASSOCIADO",     "post", "obra-list",   403),
        ("BIBLIOTECARIO", "post", "obra-list",   201),
        ("ASSOCIADO",     "get",  "relatorios",  403),
        ("COORDENACAO",   "get",  "relatorios",  200),
    ],
)
def test_matriz_de_acesso(api_client, django_user_model, autor, papel, metodo, rota, esperado):
    if papel:
        u = django_user_model.objects.create_user("u", password="x", papel=papel)
        atribuir_permissoes(u)
        api_client.force_authenticate(u)

    url = reverse(f"acervo:{rota}")
    dados = {"titulo": "T", "autor": autor.pk} if metodo == "post" else None
    resposta = getattr(api_client, metodo)(url, dados, format="json")

    assert resposta.status_code == esperado, f"{papel} {metodo} {rota}"
```

Uma falha de autorização introduzida por engano passa a quebrar o CI. É, provavelmente, o
teste de maior retorno do projeto inteiro.

**Validação (prioridade 3):**

```python
@pytest.mark.django_db
@pytest.mark.parametrize("isbn,valido", [
    ("9788535914849", True), ("978-85-359-1484-9", True),
    ("123", False), ("abcdefghijklm", False), ("", True),
])
def test_validacao_de_isbn(autor, isbn, valido):
    s = ObraCreateSerializer(data={"titulo": "T", "autor": autor.pk, "isbn": isbn})
    assert s.is_valid() == valido
```

### 3. Frontend com Vitest + Testing Library (20 min)

```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react \
            @testing-library/user-event @testing-library/jest-dom msw
```

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
# no CI, após rodar os testes das duas camadas
cd backend && python manage.py spectacular --file ../frontend/schema.yml
cd ../frontend && pnpm tipos && git diff --exit-code src/api/schema.d.ts
```

Se o schema mudou e os tipos não foram regenerados, o CI falha. Combinado com o
`tsc --noEmit`, um campo renomeado no backend quebra o build do frontend **antes** de
chegar a produção.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Backend: as três prioridades (50 min)

Configure `pytest.ini` e `conftest.py`, e escreva ao menos 15 testes:

- 6 de regra de negócio (prazo, limite, disponibilidade, atraso, devolução, constraint)
- 6 da matriz de acesso (parametrizados, incluindo IDOR)
- 3 de validação de serializer (parametrizados)

```bash
pytest -v --cov=. --cov-report=term-missing
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
      SECRET_KEY: chave-apenas-para-ci
      DEBUG: "False"
      DATABASE_URL: postgres://test:test@localhost:5432/test
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12", cache: pip }
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: python manage.py makemigrations --check --dry-run
      - run: python manage.py check --deploy
      - run: pytest --cov=. --cov-fail-under=60
      - run: python manage.py spectacular --file schema.yml
      - uses: actions/upload-artifact@v4
        with: { name: schema, path: backend/schema.yml }

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
        with: { name: schema, path: frontend }
      - name: Tipos sincronizados com a API
        run: |
          pnpm tipos
          git diff --exit-code src/api/schema.d.ts
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
| Esquecer `@pytest.mark.django_db` | `Database access not allowed` |
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
- [ ] `ruff check` e `pnpm lint` sem erros
- [ ] `tsc --noEmit` sem erros
- [ ] **Teste de contrato no CI** (tipos sincronizados)
- [ ] CI verde nos dois jobs; `main` protegida
- [ ] Ao menos 1 teste de regressão a partir de um bug real

## 📦 Entrega E7 — Suíte verde nas duas camadas

Repositório com CI verde, badge no README, relatório de cobertura do backend e a lista de
testes com o que cada um garante.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [pytest-django](https://pytest-django.readthedocs.io/)
- [DRF — Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [Vitest](https://vitest.dev/)
- [Testing Library — princípios](https://testing-library.com/docs/guiding-principles)
- [MSW](https://mswjs.io/)
- [Testing Library — queries por prioridade](https://testing-library.com/docs/queries/about#priority) ⭐
