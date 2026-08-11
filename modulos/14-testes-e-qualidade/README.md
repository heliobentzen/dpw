# M14 — Testes e qualidade de código

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 14** · **Pré-requisitos:** M06–M12
> Módulo complementar à ementa, exigido pela realidade: a Etapa 3 do projeto pede
> *"realização dos testes"*.

## 🎯 Objetivos

1. Escrever testes de model, view, form e regra de negócio.
2. Usar `pytest-django` com fixtures e parametrização.
3. Medir cobertura e interpretá-la sem cair na armadilha da métrica.
4. Configurar lint, formatação e integração contínua.
5. Transformar bug em teste de regressão.

---

## 📖 Teoria (1h)

### 1. Por que testar (20 min)

O argumento honesto não é "qualidade": é **velocidade sustentada**. Sem testes, cada
alteração exige reverificar tudo à mão, e o custo de mudar cresce até o projeto travar.
Com testes, a equipe altera código com confiança.

Na Etapa 3, o efeito é imediato: quatro pessoas mexendo no mesmo sistema, sem testes,
quebram o trabalho uma da outra e só descobrem na apresentação.

**Pirâmide (adaptada a este projeto):**

```
        /\        e2e (2–3)      fluxo completo pelo navegador — lentos, frágeis
       /  \
      /----\      integração (10–20)  view + banco + template
     /      \
    /--------\    unitários (30–50)   model, regra de negócio, form — rápidos
```

Priorize: (1) regra de negócio, (2) controle de acesso, (3) fluxo principal. Não teste o
framework — ele já é testado.

### 2. Anatomia de um teste (25 min)

Padrão **AAA**: *Arrange, Act, Assert*.

```python
# acervo/tests/test_models.py
import pytest
from django.utils import timezone

from acervo.models import Emprestimo


@pytest.mark.django_db
def test_emprestimo_calcula_previsao_de_devolucao(exemplar, associado):
    # Arrange / Act
    emprestimo = Emprestimo.objects.create(exemplar=exemplar, associado=associado)

    # Assert
    esperado = emprestimo.emprestado_em + timezone.timedelta(days=Emprestimo.PRAZO_DIAS)
    assert emprestimo.previsao_devolucao == esperado
```

O nome do teste é documentação: descreva **o comportamento**, não o método.
`test_emprestimo_calcula_previsao_de_devolucao` > `test_save`.

### 3. `pytest-django` (25 min)

```bash
pip install pytest pytest-django pytest-cov model-bakery
```

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = test_*.py
addopts = -v --tb=short --reuse-db
```

```python
# conftest.py (na raiz)
import pytest
from django.contrib.auth import get_user_model

from acervo.models import Associado, Autor, Exemplar, Obra


@pytest.fixture
def autor(db):
    return Autor.objects.create(nome="Machado de Assis")


@pytest.fixture
def obra(db, autor):
    return Obra.objects.create(titulo="Dom Casmurro", autor=autor, ano_publicacao=1899)


@pytest.fixture
def exemplar(db, obra):
    return Exemplar.objects.create(obra=obra, tombo="0001")


@pytest.fixture
def associado(db):
    return Associado.objects.create(nome="Ana Souza", email="ana@exemplo.org")


@pytest.fixture
def bibliotecario(db, django_user_model):
    user = django_user_model.objects.create_user(
        username="bib", password="senha-de-teste-123", papel="BIBLIOTECARIO"
    )
    return user


@pytest.fixture
def cliente_bibliotecario(client, bibliotecario):
    client.force_login(bibliotecario)
    return client
```

Fixtures compõem: `exemplar` puxa `obra`, que puxa `autor`. Você declara só o que o teste
precisa.

`model_bakery` gera objetos sem você escrever todos os campos:

```python
from model_bakery import baker

obra = baker.make("acervo.Obra")                       # tudo preenchido automaticamente
obras = baker.make("acervo.Obra", _quantity=30)
obra = baker.make("acervo.Obra", titulo="Específico")  # só o que importa para o teste
```

### 4. O que testar em cada camada (30 min)

#### Model — regra de negócio

```python
@pytest.mark.django_db
class TestEmprestimo:
    def test_nao_esta_atrasado_dentro_do_prazo(self, exemplar, associado):
        e = Emprestimo.objects.create(exemplar=exemplar, associado=associado)
        assert e.esta_atrasado is False
        assert e.dias_de_atraso == 0

    def test_esta_atrasado_apos_o_prazo(self, exemplar, associado):
        e = Emprestimo.objects.create(
            exemplar=exemplar,
            associado=associado,
            previsao_devolucao=timezone.localdate() - timedelta(days=3),
        )
        assert e.esta_atrasado is True
        assert e.dias_de_atraso == 3

    def test_devolver_marca_data_e_libera_exemplar(self, exemplar, associado):
        e = Emprestimo.objects.create(exemplar=exemplar, associado=associado)
        assert exemplar.disponivel is False
        e.devolver()
        assert e.devolvido_em == timezone.localdate()
        assert exemplar.disponivel is True

    def test_exemplar_nao_pode_ter_dois_emprestimos_ativos(self, exemplar, associado):
        Emprestimo.objects.create(exemplar=exemplar, associado=associado)
        with pytest.raises(IntegrityError):
            Emprestimo.objects.create(exemplar=exemplar, associado=associado)
```

O último teste verifica a `UniqueConstraint` do M04 — testar a **restrição do banco**, e
não só a validação do form, é o que garante que a regra vale para toda escrita.

#### View — status, contexto e efeito

```python
# acervo/tests/test_views.py
from django.urls import reverse


@pytest.mark.django_db
def test_lista_de_obras_responde_200(client, obra):
    resposta = client.get(reverse("acervo:obra_list"))
    assert resposta.status_code == 200
    assert obra.titulo in resposta.content.decode()


@pytest.mark.django_db
def test_busca_filtra_por_titulo(client, obra):
    baker.make("acervo.Obra", titulo="Outro Livro")
    resposta = client.get(reverse("acervo:obra_list"), {"q": "Casmurro"})
    assert list(resposta.context["obras"]) == [obra]


@pytest.mark.django_db
def test_criar_obra_exige_permissao(client, autor):
    resposta = client.post(reverse("acervo:obra_create"), {"titulo": "X", "autor": autor.pk})
    assert resposta.status_code in (302, 403)
    assert not Obra.objects.filter(titulo="X").exists()


@pytest.mark.django_db
def test_bibliotecario_cria_obra(cliente_bibliotecario, autor):
    resposta = cliente_bibliotecario.post(
        reverse("acervo:obra_create"),
        {"titulo": "Nova Obra", "autor": autor.pk, "ano_publicacao": 2020},
    )
    assert resposta.status_code == 302                       # PRG
    assert Obra.objects.filter(titulo="Nova Obra").exists()
```

#### Form — validação

```python
@pytest.mark.django_db
@pytest.mark.parametrize(
    "isbn,valido",
    [
        ("9788535914849", True),
        ("978-85-359-1484-9", True),
        ("123", False),
        ("abcdefghijklm", False),
        ("", True),                    # opcional
    ],
)
def test_validacao_de_isbn(autor, isbn, valido):
    form = ObraForm({"titulo": "T", "autor": autor.pk, "isbn": isbn})
    assert form.is_valid() == valido
```

`parametrize` transforma 5 testes quase idênticos em um. É onde o pytest brilha.

#### Controle de acesso — a matriz do M12 virando teste

```python
@pytest.mark.django_db
@pytest.mark.parametrize(
    "papel,rota,esperado",
    [
        (None, "acervo:obra_list", 200),
        (None, "acervo:obra_create", 302),
        ("ASSOCIADO", "acervo:obra_create", 403),
        ("BIBLIOTECARIO", "acervo:obra_create", 200),
        ("ASSOCIADO", "acervo:relatorios", 403),
        ("COORDENACAO", "acervo:relatorios", 200),
    ],
)
def test_matriz_de_acesso(client, django_user_model, papel, rota, esperado):
    if papel:
        user = django_user_model.objects.create_user("u", password="x", papel=papel)
        atribuir_permissoes(user)
        client.force_login(user)
    assert client.get(reverse(rota)).status_code == esperado
```

Uma falha de autorização introduzida por engano passa a quebrar o CI. Este é,
provavelmente, o teste de maior retorno do projeto inteiro.

### 5. Cobertura: útil e enganosa (10 min)

```bash
pytest --cov=. --cov-report=term-missing --cov-report=html
```

Cobertura mostra o que **nunca foi executado** — e isso é informação valiosa. O que ela
**não** mostra: se as asserções fazem sentido, se os casos de borda foram considerados, se
a regra de negócio está certa. 100% de cobertura com `assert True` é 0% de garantia.

Meta razoável para o projeto: **≥ 60% no geral, ≥ 90% nas regras de negócio e no controle
de acesso**.

### 6. Lint, formatação e CI (10 min)

```bash
pip install ruff
```

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py312"
exclude = ["migrations"]

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "DJ", "S"]   # erros, imports, upgrades, bugs, django, segurança
ignore = ["S101"]                                 # assert é normal em testes
```

```bash
ruff check .          # lint
ruff check . --fix
ruff format .         # formatação
```

`pre-commit` para não depender de disciplina individual:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

```bash
pip install pre-commit && pre-commit install
```

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Configurar o ambiente de testes (20 min)

Instale as dependências, crie `pytest.ini`, `conftest.py` e a estrutura:

```
acervo/tests/
├── __init__.py
├── test_models.py
├── test_views.py
├── test_forms.py
└── test_permissoes.py
```

```bash
pytest -v
```

### Passo 2 — Testar a regra de negócio (40 min)

Escreva ao menos 10 testes cobrindo:

- cálculo da previsão de devolução
- `esta_atrasado` (antes, no dia, depois do prazo)
- `dias_de_atraso`
- `devolver()` e liberação do exemplar
- limite de empréstimos por associado
- associado inativo não pode pegar emprestado
- exemplar baixado não fica disponível
- restrição de empréstimo duplicado (`IntegrityError`)
- `exemplares_disponiveis` da obra
- transação que desfaz tudo em caso de erro

### Passo 3 — Testar views e permissões (40 min)

- listagem responde 200 e mostra as obras
- busca filtra corretamente (inclusive sem resultados)
- detalhe de obra inexistente devolve 404
- criação exige permissão (anônimo, associado, bibliotecário)
- POST válido cria e redireciona (PRG)
- POST inválido não cria e devolve 200 com erros
- exclusão só por POST (GET devolve 405)
- **IDOR:** associado A não acessa empréstimo de B (404)
- a matriz de acesso parametrizada do M12

### Passo 4 — CI no GitHub Actions (20 min)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  testes:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s
          --health-timeout 5s --health-retries 10

    env:
      SECRET_KEY: chave-apenas-para-ci-nao-usar-em-producao
      DEBUG: "False"
      DATABASE_URL: postgres://test:test@localhost:5432/test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip

      - run: pip install -r requirements.txt

      - name: Lint
        run: ruff check .

      - name: Migrações sem pendências
        run: python manage.py makemigrations --check --dry-run

      - name: Verificação de deploy
        run: python manage.py check --deploy

      - name: Testes
        run: pytest --cov=. --cov-report=term-missing --cov-fail-under=60
```

Ative a proteção da branch `main` exigindo o CI verde antes do merge. A partir daqui,
ninguém quebra o trabalho de ninguém sem que o robô avise.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Esquecer `@pytest.mark.django_db` | `Database access not allowed` |
| Testes dependentes da ordem de execução | Cada teste monta o próprio cenário |
| Testar o framework (`test_charfield_salva`) | Teste **sua** regra |
| Asserção só de `status_code` | Verifique também o efeito no banco |
| Perseguir 100% de cobertura | Cubra o que importa, bem |
| Teste que depende de rede ou data real | Isole com mock / `freezegun` |
| Fixture gigante usada por todos | Fixtures pequenas e compostas |
| Bug corrigido sem teste | Todo bug vira teste de regressão |

## ✅ Checklist de saída

- [ ] `pytest` roda verde localmente
- [ ] ≥ 20 testes, cobrindo model, view, form e permissões
- [ ] Matriz de acesso automatizada
- [ ] Cobertura ≥ 60%, com regras de negócio ≥ 90%
- [ ] `ruff check` sem erros
- [ ] CI configurado e verde
- [ ] Branch `main` protegida exigindo CI
- [ ] Ao menos 1 teste de regressão a partir de um bug real

## 📦 Entrega E6 — Suíte de testes

Repositório com CI verde, badge no README, relatório de cobertura e a lista de testes com
o que cada um garante.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Testes](https://docs.djangoproject.com/pt-br/5.0/topics/testing/)
- [pytest-django](https://pytest-django.readthedocs.io/)
- [model_bakery](https://model-bakery.readthedocs.io/)
- [Ruff](https://docs.astral.sh/ruff/)
