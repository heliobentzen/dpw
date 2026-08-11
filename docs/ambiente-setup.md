# Setup do ambiente de desenvolvimento

Guia único de instalação. Siga na ordem; ao final, rode a **verificação** da seção 7.

## 1. O que será instalado

| Ferramenta | Versão mínima | Para quê |
|---|---|---|
| Python | 3.12 | Linguagem do framework |
| pip / venv | (vem com Python) | Dependências e isolamento |
| Git | 2.40 | Versionamento |
| VS Code (ou PyCharm) | atual | Editor |
| Docker Desktop | atual | PostgreSQL local (opcional no início) |
| PostgreSQL | 16 | Banco de produção-like (a partir do M04) |

> Até o M03 usamos **SQLite** (embutido, zero instalação). PostgreSQL entra no M04, para
> que a diferença entre "banco de brinquedo" e "banco de verdade" seja sentida na prática.

## 2. Python

### Windows

1. Baixe em <https://www.python.org/downloads/> a versão 3.12+.
2. Na primeira tela do instalador, **marque "Add python.exe to PATH"**. Esse é o erro nº 1
   da turma toda semestre.
3. Verifique no PowerShell:

```powershell
python --version
py -3.12 --version
```

### macOS

```bash
brew install python@3.12
python3 --version
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip
python3 --version
```

## 3. Git e GitHub

```bash
git --version
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

Crie uma chave SSH e cadastre no GitHub (evita digitar senha/token a cada push):

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
cat ~/.ssh/id_ed25519.pub   # copie e cole em github.com > Settings > SSH and GPG keys
ssh -T git@github.com       # deve responder "Hi <usuario>!"
```

## 4. Ambiente virtual e Django

**Sempre** um ambiente virtual por projeto. Instalar pacotes no Python global é fonte
garantida de conflito de versões.

```bash
mkdir bibliocom && cd bibliocom
python3 -m venv .venv

# ativar:
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\Activate.ps1       # Windows PowerShell

python -m pip install --upgrade pip
pip install "django>=5.0,<6.0" python-dotenv
pip freeze > requirements.txt
```

O prompt passa a mostrar `(.venv)`. Se não mostrar, o ambiente **não** está ativo e tudo
que você instalar vai para o lugar errado.

Para sair: `deactivate`.

### Alternativa moderna: `uv`

`uv` é um gerenciador de pacotes/ambientes 10–100× mais rápido, já dominante em projetos
Python novos. Se a turma tiver maturidade, use-o:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # Linux/macOS
uv init bibliocom && cd bibliocom
uv add django python-dotenv
uv run python manage.py runserver
```

## 5. VS Code

Extensões recomendadas:

- **Python** (Microsoft) — interpretador, debug, lint
- **Django** (Baptiste Darthenay) — realce de sintaxe de templates
- **Ruff** (Astral) — lint e formatação
- **SQLite Viewer** — inspecionar o `db.sqlite3`
- **GitLens** — histórico e blame

Selecione o interpretador do venv: `Ctrl+Shift+P` → *Python: Select Interpreter* →
`./.venv/bin/python`.

Arquivo `.vscode/settings.json` sugerido:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "editor.formatOnSave": true,
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "files.exclude": { "**/__pycache__": true, "**/*.pyc": true },
  "emmet.includeLanguages": { "django-html": "html" }
}
```

## 6. PostgreSQL via Docker (a partir do M04)

`docker-compose.yml` na raiz do projeto:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bibliocom
      POSTGRES_USER: bibliocom
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bibliocom"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
```

```bash
docker compose up -d
docker compose ps          # deve estar "healthy"
pip install "psycopg[binary]"
```

## 7. Verificação do ambiente

Salve como `verifica_ambiente.py` e rode com o venv ativo:

```python
"""Verificação do ambiente da disciplina DPW. Rode: python verifica_ambiente.py"""
import shutil
import subprocess
import sys

ok = True


def check(nome, condicao, dica):
    global ok
    print(f"[{'OK ' if condicao else 'FALHA'}] {nome}")
    if not condicao:
        print(f"        -> {dica}")
        ok = False


check("Python >= 3.12", sys.version_info >= (3, 12), "Instale Python 3.12+ e recrie o venv")
check("Ambiente virtual ativo", sys.prefix != sys.base_prefix, "Ative o venv (source .venv/bin/activate)")
check("Git instalado", shutil.which("git") is not None, "Instale o Git")

try:
    import django

    check("Django >= 5.0", django.VERSION >= (5, 0), "pip install 'django>=5.0,<6.0'")
    print(f"        Django {django.get_version()}")
except ImportError:
    check("Django instalado", False, "pip install 'django>=5.0,<6.0'")

if shutil.which("docker"):
    r = subprocess.run(["docker", "info"], capture_output=True)
    check("Docker rodando", r.returncode == 0, "Abra o Docker Desktop (opcional até o M04)")
else:
    print("[INFO ] Docker não instalado (opcional até o M04)")

print("\n" + ("Ambiente pronto. Bom curso!" if ok else "Corrija os itens acima antes da aula."))
sys.exit(0 if ok else 1)
```

## 8. `.gitignore` do projeto

```gitignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/

# Django
*.log
db.sqlite3
db.sqlite3-journal
/media/
/staticfiles/

# Ambiente
.env
.env.*
!.env.example

# Editores
.vscode/
.idea/
.DS_Store
```

> **Nunca** comite `.env`, `db.sqlite3` ou `SECRET_KEY`. Segredo que entra no histórico do
> Git é segredo vazado — mesmo depois de removido, ele continua nos commits anteriores.

## 9. Problemas frequentes

| Sintoma | Causa provável | Solução |
|---|---|---|
| `python: command not found` (Windows) | PATH não configurado | Reinstale marcando "Add to PATH", ou use `py` |
| `Activate.ps1 cannot be loaded` | Política de execução do PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `ModuleNotFoundError: django` | venv não ativo ou pacote no Python global | Ative o venv e reinstale |
| `port 5432 already in use` | PostgreSQL local já rodando | Pare o serviço ou mude a porta para `5433:5432` |
| `pg_config executable not found` | Falta binário do psycopg | Use `psycopg[binary]`, não `psycopg2` compilado |

Mais casos em [`faq-troubleshooting.md`](faq-troubleshooting.md).
