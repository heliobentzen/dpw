# M02 — Django: primeiros passos

> **CH:** 4h (1h teórica · 3h práticas) · **Semanas 2–3** · **Pré-requisitos:** M00, M01

Módulo de bootstrap: nasce aqui o projeto que será usado até o fim da disciplina.

## 🎯 Objetivos

1. Explicar o que um framework web resolve e o padrão MTV do Django.
2. Criar um projeto e um app, entendendo a diferença entre os dois.
3. Percorrer o ciclo requisição→URLconf→view→template→resposta em código real.
4. Configurar o projeto para ler variáveis de ambiente desde o primeiro dia.

---

## 📖 Teoria (1h)

### 1. O que o framework assume por você

No M01 você escreveu um servidor que roteava com `if`, lia query string na mão e montava
HTML com f-string. Isso funciona para 3 rotas. Para 300, você acabaria reescrevendo — mal —
o que um framework já faz:

| Responsabilidade | Sem framework | Django |
|---|---|---|
| Roteamento | `if self.path == ...` | `urls.py` com `path()` |
| Parsing de requisição | `parse_qs`, `rfile.read` | `request.GET`, `request.POST` |
| Acesso a dados | SQL string | ORM |
| Geração de HTML | f-string (com risco de XSS) | Template com escape automático |
| Sessão/usuário | do zero | `contrib.auth` + `contrib.sessions` |
| Segurança | do zero | CSRF, XSS, clickjacking por padrão |
| Migração de esquema | ALTER TABLE manual | Migrações versionadas |
| Admin | do zero | `contrib.admin` |

**Inversão de controle:** biblioteca é código que *você chama*; framework é código que
*chama o seu*. Você não escreve o laço principal — escreve as peças que ele invoca.

### 2. MTV: o MVC do Django

| Camada Django | Papel | Equivalente MVC |
|---|---|---|
| **Model** | Estrutura e regras dos dados; fala com o banco | Model |
| **Template** | Apresentação (HTML) | View |
| **View** | Recebe a requisição, orquestra, devolve resposta | Controller |

O "Controller" do MVC clássico, no Django, é o próprio framework (URLconf + middlewares).
A confusão de nomes é histórica; o que importa é a **separação de responsabilidades**.

### 3. O ciclo completo de uma requisição

```
Navegador
   │  GET /obras/42/
   ▼
Servidor WSGI (runserver em dev, Gunicorn em produção)
   ▼
MIDDLEWARE (segurança, sessão, autenticação, CSRF, mensagens)   ── entrada
   ▼
URLconf: config/urls.py -> acervo/urls.py -> casa <int:pk>
   ▼
View: acervo/views.py::obra_detail(request, pk=42)
   │   ├─ consulta o Model (ORM -> SQL -> banco)
   │   └─ monta o contexto {"obra": obra}
   ▼
Template: acervo/templates/acervo/obra_detail.html
   ▼
HttpResponse (status, cabeçalhos, corpo)
   ▼
MIDDLEWARE                                                       ── saída
   ▼
Navegador
```

Guarde este diagrama. Quando algo não funcionar, a pergunta é sempre: **em que etapa
parou?**

### 4. Projeto × app

```
bibliocom/                  ← repositório
├── manage.py               ← CLI do projeto
├── config/                 ← PROJETO: configuração global
│   ├── settings.py
│   ├── urls.py             ← URLconf raiz
│   ├── wsgi.py / asgi.py   ← ponto de entrada dos servidores
└── acervo/                 ← APP: um módulo funcional
    ├── models.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    ├── apps.py
    ├── migrations/
    ├── templates/acervo/
    └── static/acervo/
```

- **Projeto**: a configuração. Um por repositório.
- **App**: uma unidade funcional coesa e, idealmente, reutilizável. Vários por projeto.

Como dividir apps no BiblioCom: `acervo` (obras, exemplares), `emprestimos`
(empréstimo, devolução, reserva), `associados` (cadastro e perfil), `relatorios`.
Comece com **um** app; divida quando um arquivo passar de ~300 linhas ou quando duas
áreas mudarem por motivos diferentes.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Criar projeto e app (20 min)

Com o venv ativo, dentro do repositório `bibliocom` criado no M00:

```bash
django-admin startproject config .    # o ponto evita a pasta duplicada
python manage.py startapp acervo
python manage.py runserver
```

Acesse <http://localhost:8000> — deve aparecer o foguete de boas-vindas.

> O `.` no final do `startproject` é importante: sem ele você acaba com
> `bibliocom/bibliocom/manage.py`, estrutura que confunde a turma inteira.

Registre o app em `config/settings.py`:

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "acervo",                      # <-- nosso app
]
```

### Passo 2 — Localização e configuração básica (15 min)

```python
# config/settings.py
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True                      # armazena em UTC, exibe no fuso local
```

> `USE_TZ = True` desde o início evita a dor clássica de "o empréstimo venceu 3h antes".

### Passo 3 — Variáveis de ambiente (25 min)

Nunca deixe `SECRET_KEY` no código. Crie `.env` (fora do Git) e `.env.example` (no Git):

```bash
# .env
SECRET_KEY=django-insecure-troque-esta-chave-em-producao
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

```bash
# .env.example  (versionado, SEM valores reais)
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

Em `config/settings.py`, logo após os imports:

```python
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]          # falha alto se faltar — proposital
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")
```

Gere uma chave nova:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

> `os.environ["SECRET_KEY"]` (que quebra) é melhor que `os.getenv("SECRET_KEY", "abc")`
> (que silenciosamente usa uma chave insegura em produção). **Falhe alto, falhe cedo.**

### Passo 4 — Primeira view e primeira URL (30 min)

```python
# acervo/views.py
from django.http import HttpResponse


def home(request):
    return HttpResponse("<h1>BiblioCom</h1><p>Sistema de gestão de biblioteca comunitária.</p>")
```

```python
# acervo/urls.py  (criar o arquivo)
from django.urls import path

from . import views

app_name = "acervo"

urlpatterns = [
    path("", views.home, name="home"),
]
```

```python
# config/urls.py
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("acervo.urls")),
]
```

Recarregue <http://localhost:8000>.

### Passo 5 — Inspecionar o objeto `request` (30 min)

Substitua a view para investigar o que o M01 ensinou, agora do lado do servidor:

```python
# acervo/views.py
from django.http import HttpResponse


def home(request):
    linhas = [
        f"<h1>BiblioCom</h1>",
        f"<p><b>Método:</b> {request.method}</p>",
        f"<p><b>Caminho:</b> {request.path}</p>",
        f"<p><b>Query string (request.GET):</b> {dict(request.GET)}</p>",
        f"<p><b>Seguro (HTTPS)?</b> {request.is_secure()}</p>",
        f"<p><b>User-Agent:</b> {request.headers.get('User-Agent')}</p>",
        f"<p><b>Usuário:</b> {request.user}</p>",
        "<hr><h2>Cabeçalhos recebidos</h2><ul>",
        *[f"<li><b>{k}</b>: {v}</li>" for k, v in request.headers.items()],
        "</ul>",
    ]
    return HttpResponse("\n".join(linhas))
```

Acesse `http://localhost:8000/?q=teste&pagina=2` e confira que `request.GET` traz
exatamente o que você viu no `curl` do M01.

### Passo 6 — Primeiro template (40 min)

```bash
mkdir -p acervo/templates/acervo
```

```html
<!-- acervo/templates/acervo/home.html -->
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BiblioCom</title>
</head>
<body>
  <h1>BiblioCom</h1>
  <p>Sistema de gestão para bibliotecas comunitárias.</p>

  <h2>Método da requisição</h2>
  <p>{{ metodo }}</p>

  <h2>Funcionalidades previstas</h2>
  <ul>
    {% for item in funcionalidades %}
      <li>{{ item }}</li>
    {% empty %}
      <li>Nenhuma funcionalidade cadastrada.</li>
    {% endfor %}
  </ul>
</body>
</html>
```

```python
# acervo/views.py
from django.shortcuts import render


def home(request):
    contexto = {
        "metodo": request.method,
        "funcionalidades": [
            "Catálogo de obras",
            "Controle de exemplares",
            "Empréstimo e devolução",
            "Cadastro de associados",
            "Relatórios",
        ],
    }
    return render(request, "acervo/home.html", contexto)
```

> **Por que `acervo/templates/acervo/home.html`, com o nome do app repetido?** O Django
> junta os diretórios de templates de todos os apps num único espaço de nomes. Sem o
> subdiretório, dois apps com `home.html` colidiriam e venceria o primeiro do
> `INSTALLED_APPS` — um bug difícil de achar.

### Passo 7 — Rota com parâmetro (20 min)

```python
# acervo/urls.py
urlpatterns = [
    path("", views.home, name="home"),
    path("saudacao/<str:nome>/", views.saudacao, name="saudacao"),
]
```

```python
# acervo/views.py
def saudacao(request, nome):
    return render(request, "acervo/saudacao.html", {"nome": nome})
```

```html
<!-- acervo/templates/acervo/saudacao.html -->
<h1>Olá, {{ nome }}!</h1>
<p><a href="{% url 'acervo:home' %}">Voltar ao início</a></p>
```

Teste `/saudacao/maria/` e depois `/saudacao/<script>alert(1)</script>/` — observe que o
Django **escapou** o script. Compare com o servidor mínimo do M01, que não escapava.

### Passo 8 — Commit (10 min)

```bash
git add .
git commit -m "feat: cria projeto config e app acervo com home e saudacao"
git push
```

---

## ⚠️ Erros comuns

| Sintoma | Causa |
|---|---|
| `TemplateDoesNotExist` | App fora do `INSTALLED_APPS`, ou faltou o subdiretório com o nome do app |
| Pasta `bibliocom/bibliocom/` | Esqueceu o `.` no `startproject` |
| `KeyError: 'SECRET_KEY'` | `.env` não existe ou `load_dotenv` não foi chamado |
| Alterei a view e nada muda | Erro de sintaxe impediu o reload — olhe o terminal |
| `NoReverseMatch` em `{% url 'home' %}` | Faltou o namespace: `{% url 'acervo:home' %}` |
| `DEBUG` sempre `False` | `os.getenv("DEBUG")` devolve string; `"False"` é verdadeiro em Python — por isso comparamos com `== "True"` |

## ✅ Checklist de saída

- [ ] Projeto `config` e app `acervo` criados e versionados
- [ ] `SECRET_KEY`, `DEBUG` e `ALLOWED_HOSTS` vindos de `.env`; `.env` fora do Git
- [ ] `.env.example` versionado
- [ ] Idioma pt-br e fuso America/Sao_Paulo configurados
- [ ] Duas rotas funcionando, uma delas com parâmetro
- [ ] Template renderizando dados vindos da view
- [ ] Sei apontar, no meu código, cada etapa do diagrama do ciclo de requisição

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Escrevendo seu primeiro app, parte 1 (pt-br)](https://docs.djangoproject.com/pt-br/5.0/intro/tutorial01/)
- [Django — Como o Django processa uma requisição](https://docs.djangoproject.com/en/5.0/topics/http/urls/#how-django-processes-a-request)
- [Django Settings — referência completa](https://docs.djangoproject.com/en/5.0/ref/settings/)
