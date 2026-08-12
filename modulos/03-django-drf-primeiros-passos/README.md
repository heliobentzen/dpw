# M03 — Django + DRF: primeiros passos

> **CH:** 3h (1h teórica · 2h práticas) · **Semana 3** · **Pré-requisitos:** M00, M01, M02

Módulo de bootstrap: nascem aqui os **dois projetos** que serão usados até o fim da
disciplina.

## 🎯 Objetivos

1. Explicar o que o framework resolve e o padrão MTV do Django numa API.
2. Criar o projeto Django com DRF e o projeto React com Vite, lado a lado.
3. Percorrer o ciclo requisição → URLconf → view → JSON → tela.
4. Configurar variáveis de ambiente e o proxy de desenvolvimento.

---

## 📖 Teoria (1h)

### 1. O que o framework assume por você (20 min)

No M01 você escreveu um servidor que roteava com `if`, lia query string na mão e montava
resposta com f-string. Funciona para 3 rotas. Para 300, você reescreveria — mal — o que um
framework já faz:

| Responsabilidade | Sem framework | Django + DRF |
|---|---|---|
| Roteamento | `if self.path == ...` | `urls.py` + `DefaultRouter` |
| Parsing da requisição | `parse_qs`, `rfile.read` | `request.query_params`, `request.data` |
| Acesso a dados | SQL em string | ORM |
| Serialização | `json.dumps` na mão | `Serializer` |
| Validação | `if not campo` espalhado | `Serializer` declarativo |
| Sessão/usuário | do zero | `contrib.auth` |
| Segurança | do zero | CSRF, permissões, *throttling* |
| Migração de esquema | `ALTER TABLE` manual | Migrações versionadas |
| Documentação | escrita à mão, desatualizada | OpenAPI gerado do código |

**Inversão de controle:** biblioteca é código que *você chama*; framework é código que
*chama o seu*.

### 2. MTV numa arquitetura de API (20 min)

| Camada Django | Papel no MPA | Papel na API |
|---|---|---|
| **Model** | Estrutura e regras dos dados | **igual** |
| **View** | Recebe a requisição, devolve HTML | Recebe a requisição, devolve **JSON** |
| **Template** | Monta o HTML | **não existe** — quem monta é o React |

A camada que some do Django reaparece do outro lado, em JSX. E entre as duas entra uma
camada nova, que não existia:

> **Serializer** — traduz objeto Python ↔ JSON, **e valida** a entrada. É o equivalente,
> na API, do que o `Form` era no Django com templates.

### 3. O ciclo completo, agora com dois projetos (20 min)

```
Navegador (http://localhost:5173)
   │  o usuário clica em "Dom Casmurro"
   ▼
React Router muda a tela  ──── sem ir ao servidor
   ▼
TanStack Query dispara  fetch("/api/obras/42/")
   │
   ▼
Proxy do Vite  ──── reescreve para http://localhost:8000/api/obras/42/
   ▼
Servidor WSGI (runserver em dev, Gunicorn em produção)
   ▼
MIDDLEWARE (segurança, sessão, autenticação, CORS)
   ▼
URLconf: config/urls.py → acervo/urls.py → router → ObraViewSet
   ▼
View: consulta o Model (ORM → SQL → banco)
   ▼
Serializer: objeto Python → dict
   ▼
Renderer: dict → JSON  →  HttpResponse(200, application/json)
   ▼
De volta ao React: Query guarda no cache, o componente renderiza
   ▼
Navegador pinta a tela
```

Guarde este diagrama: quando algo não funcionar, a pergunta é **em qual etapa parou?** — e
agora há duas ferramentas para descobrir: o terminal do Django e a aba Network do
navegador.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Backend: projeto, app e DRF (35 min)

```bash
# Linux/macOS/WSL
mkdir -p bibliocom/backend && cd bibliocom/backend
python3 -m venv .venv && source .venv/bin/activate
pip install "django>=5.0,<6.0" djangorestframework django-cors-headers \
            python-dotenv dj-database-url drf-spectacular
pip freeze > requirements.txt

django-admin startproject config .     # o ponto evita a pasta duplicada
python manage.py startapp acervo
```

```powershell
# Windows PowerShell
New-Item -ItemType Directory -Force -Path bibliocom\backend; cd bibliocom\backend
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install "django>=5.0,<6.0" djangorestframework django-cors-headers `
            python-dotenv dj-database-url drf-spectacular
pip freeze > requirements.txt

django-admin startproject config .
python manage.py startapp acervo
```

> 🪟 Se `Activate.ps1` for bloqueado: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
> Demais equivalências em
> [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md).

```python
# config/settings.py
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "acervo",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",          # antes do CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "BiblioCom API",
    "DESCRIPTION": "API do sistema de gestão de biblioteca comunitária.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True
```

> `DEFAULT_PERMISSION_CLASSES` como `IsAuthenticated` é **negar por padrão**: cada endpoint
> público precisa declarar isso explicitamente. O contrário — abrir por padrão e lembrar de
> fechar — é como nascem as falhas de controle de acesso do M13.

### Passo 2 — Variáveis de ambiente (20 min)

```ini
# backend/.env  — conteudo do arquivo, nao comandos do terminal
SECRET_KEY=troque-esta-chave
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

```python
# config/settings.py (logo após os imports)
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]          # falha alto se faltar — proposital
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
CORS_ALLOW_CREDENTIALS = True
```

Gere uma chave nova:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copie `.env` para `.env.example` **sem os valores** e versione só o exemplo.

### Passo 3 — Primeiro endpoint (25 min)

```python
# acervo/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    """Endpoint de diagnóstico: prova que a API responde e que o proxy funciona."""
    return Response({
        "servico": "BiblioCom API",
        "versao": "1.0.0",
        "metodo": request.method,
        "caminho": request.path,
        "autenticado": request.user.is_authenticated,
        "parametros": dict(request.query_params),
    })
```

```python
# acervo/urls.py  (criar)
from django.urls import path

from . import views

app_name = "acervo"

urlpatterns = [
    path("ping/", views.ping, name="ping"),
]
```

```python
# config/urls.py
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("acervo.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
```

```bash
python manage.py migrate
python manage.py runserver
```

Confira, nesta ordem:

```bash
# Linux/macOS/WSL/Git Bash
curl http://localhost:8000/api/ping/
curl "http://localhost:8000/api/ping/?q=teste&pagina=2"     # veja os parâmetros no JSON
```
```powershell
# Windows PowerShell — curl.exe, nao curl (que e alias de Invoke-WebRequest)
curl.exe http://localhost:8000/api/ping/
curl.exe "http://localhost:8000/api/ping/?q=teste&pagina=2"
```

E abra <http://localhost:8000/api/docs/> — a documentação OpenAPI já existe, gerada do
código.

### Passo 4 — Frontend: Vite + React + TypeScript + Tailwind (30 min)

```bash
cd bibliocom
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm install
pnpm add -D tailwindcss @tailwindcss/vite
```

```ts
// frontend/vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/admin": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
```

```css
/* frontend/src/index.css */
@import "tailwindcss";
```

> **Por que o proxy?** Sem ele, o navegador vê duas origens diferentes
> (`localhost:5173` e `localhost:8000`) e bloqueia a requisição por CORS. Com o proxy, o
> navegador só conhece `localhost:5173` — e isso reproduz a topologia de produção, onde SPA
> e API ficam sob o **mesmo site** (ADR-07). CORS fica configurado como rede de segurança,
> mas o caminho feliz não depende dele.

### Passo 5 — O frontend fala com o backend (30 min)

```tsx
// frontend/src/App.tsx
import { useEffect, useState } from "react";

type Ping = {
  servico: string;
  versao: string;
  metodo: string;
  autenticado: boolean;
};

export default function App() {
  const [dados, setDados] = useState<Ping | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/ping/")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setDados)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  // os quatro estados do M02, já na primeira tela
  if (carregando) return <p className="p-8 text-slate-500">Carregando…</p>;
  if (erro) return <p className="p-8 text-red-700">Falha ao contatar a API: {erro}</p>;
  if (!dados) return <p className="p-8">Nada a exibir.</p>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold text-slate-900">BiblioCom</h1>
      <p className="mt-2 text-slate-600">Sistema de gestão para bibliotecas comunitárias.</p>

      <dl className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-4">
        <dt className="font-medium">Serviço</dt>
        <dd>{dados.servico}</dd>
        <dt className="font-medium">Versão</dt>
        <dd>{dados.versao}</dd>
        <dt className="font-medium">Autenticado</dt>
        <dd>{dados.autenticado ? "sim" : "não"}</dd>
      </dl>
    </main>
  );
}
```

```bash
pnpm dev
```

Abra <http://localhost:5173>. Na aba **Network**, confirme: a requisição sai para
`/api/ping/`, na mesma origem, e volta `200 application/json`.

**Este é o momento pedagógico do módulo.** Duas linguagens, dois processos, um contrato
— e o M01 inteiro visível na aba Network.

### Passo 6 — Commit (10 min)

```bash
cd ..
git add .
git commit -m "feat: cria backend Django+DRF e frontend React+Vite com proxy"
```

> 🪟 Comandos de Git são idênticos nas três plataformas. Evite encadear com `&&`: o
> PowerShell 5.1 (padrão do Windows) não suporta esse operador — use linhas separadas.

---

## ⚠️ Erros comuns

| Sintoma | Causa |
|---|---|
| Pasta `bibliocom/bibliocom/` | Esqueceu o `.` no `startproject` |
| `KeyError: 'SECRET_KEY'` | `.env` ausente ou `load_dotenv` não chamado |
| `DEBUG` sempre falso/verdadeiro | `os.getenv` devolve string; compare com `== "True"` |
| `404` em `/api/ping/` | Faltou `include()` em `config/urls.py`, ou a barra final |
| `401` no `/api/ping/` | Faltou `@permission_classes([AllowAny])` — o padrão é negar |
| **CORS error** no navegador | Chamou `http://localhost:8000` direto; use `/api` (proxy) |
| `ECONNREFUSED` no proxy | O `runserver` não está de pé no outro terminal |
| Tailwind não aplica estilo | Faltou `@import "tailwindcss"` no `index.css` ou o plugin no Vite |
| Alterei o Python e nada muda | Erro de sintaxe impediu o reload — olhe o terminal do Django |

## ✅ Checklist de saída

- [ ] `backend/` e `frontend/` no mesmo repositório, com `.gitignore` correto
- [ ] DRF, CORS e drf-spectacular instalados e configurados
- [ ] `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS` vindos de `.env`
- [ ] `.env.example` versionado; `.env` fora do Git
- [ ] `/api/ping/` respondendo JSON, testado com `curl`
- [ ] `/api/docs/` abrindo o Swagger
- [ ] Proxy do Vite funcionando (Network mostra a chamada em `/api`, sem CORS)
- [ ] Tailwind aplicando estilo
- [ ] Os quatro estados (carregando, erro, vazio, conteúdo) já tratados no `App.tsx`
- [ ] Sei apontar, no meu código, cada etapa do diagrama do ciclo de requisição

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Primeiros passos (pt-br)](https://docs.djangoproject.com/pt-br/5.0/intro/tutorial01/)
- [DRF — Quickstart](https://www.django-rest-framework.org/tutorial/quickstart/)
- [Vite — Guia](https://vite.dev/guide/)
- [Tailwind — Instalação com Vite](https://tailwindcss.com/docs/installation/using-vite)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)
