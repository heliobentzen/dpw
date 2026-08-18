#!/usr/bin/env bash
# =============================================================================
#  DPW — Preparação do ambiente (Linux, macOS, WSL2, Git Bash)
#
#  Uso:
#      ./setup.sh                  prepara o básico (Git + Python + projeto)
#      ./setup.sh frontend         acrescenta Node + pnpm       (antes do M03)
#      ./setup.sh banco            acrescenta Docker/PostgreSQL (antes do M05)
#
#  O script é IDEMPOTENTE: rodar de novo não quebra nada, só completa o que falta.
# =============================================================================

set -euo pipefail

ETAPA="${1:-base}"
RAIZ="${RAIZ:-$HOME/dev/bibliocom}"

# --- Apresentação ------------------------------------------------------------

titulo() { printf '\n\033[36m%s\n  %s\n%s\033[0m\n' "$(printf '=%.0s' {1..70})" "$1" "$(printf '=%.0s' {1..70})"; }
passo()  { printf '\n\033[1m> %s\033[0m\n' "$1"; }
ok()     { printf '  \033[32m[OK]  \033[0m %s\n' "$1"; }
pulo()   { printf '  \033[90m[JA]  \033[0m %s\n' "$1"; }
aviso()  { printf '  \033[33m[!]   \033[0m %s\n' "$1"; }
erro()   { printf '  \033[31m[ERRO]\033[0m %s\n' "$1"; }

tem() { command -v "$1" >/dev/null 2>&1; }

# Escolhe o gerenciador de pacotes do sistema, para as mensagens de instalação.
como_instalar() {
  if tem apt;    then echo "sudo apt install -y $1"
  elif tem dnf;  then echo "sudo dnf install -y $1"
  elif tem brew; then echo "brew install $1"
  else                echo "instale '$1' pelo gerenciador de pacotes do seu sistema"
  fi
}

py() { if tem python3; then echo python3; else echo python; fi; }

# =============================================================================
#  Etapa: base — Git + Python + estrutura do projeto
# =============================================================================

etapa_base() {
  titulo "DPW — ambiente básico (Git + Python + projeto)"

  # --- 1. Ferramentas --------------------------------------------------------
  passo "Ferramentas"
  local faltou=0
  for cmd in git "$(py)"; do
    if tem "$cmd"; then
      pulo "$cmd presente"
    else
      erro "$cmd não encontrado — $(como_instalar "$cmd")"
      faltou=1
    fi
  done
  [ "$faltou" -eq 0 ] || return 1

  local versao
  versao="$($(py) -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
  if [ "$($(py) -c 'import sys; print(sys.version_info >= (3,12))')" != "True" ]; then
    erro "Python $versao encontrado; o material precisa de 3.12 ou superior."
    return 1
  fi
  ok "Python $versao"

  # --- 2. Identidade no Git --------------------------------------------------
  passo "Identidade do Git"
  if [ -z "$(git config --global user.name || true)" ]; then
    read -r -p "  Seu nome completo: " nome
    git config --global user.name "$nome"
  fi
  if [ -z "$(git config --global user.email || true)" ]; then
    read -r -p "  Seu e-mail (o MESMO da conta do GitHub): " email
    git config --global user.email "$email"
  fi
  git config --global init.defaultBranch main
  git config --global pull.rebase false
  ok "$(git config --global user.name) <$(git config --global user.email)>"

  # --- 3. Pasta e repositório ------------------------------------------------
  passo "Pasta do projeto"
  mkdir -p "$RAIZ/backend"
  ok "$RAIZ"

  passo "Repositório Git"
  if [ -d "$RAIZ/.git" ]; then
    pulo "repositório já existe"
  else
    git -C "$RAIZ" init --quiet
    ok "git init"
  fi

  # --- 4. Arquivos da raiz ---------------------------------------------------
  passo "Arquivos de configuração"
  criar_arquivo "$RAIZ/.gitignore"     conteudo_gitignore
  criar_arquivo "$RAIZ/.gitattributes" conteudo_gitattributes

  # --- 5. Ambiente virtual ---------------------------------------------------
  passo "Ambiente virtual"
  local venv="$RAIZ/backend/.venv"
  if [ -x "$venv/bin/python" ]; then
    pulo "ambiente virtual já existe"
  else
    "$(py)" -m venv "$venv"
    ok "criado em backend/.venv"
  fi

  # Usamos o python de DENTRO do .venv: assim não dependemos de "ativar",
  # que vale só para a janela atual — e o script roda em outra.
  passo "Dependências do backend"
  "$venv/bin/python" -m pip install --upgrade pip --quiet
  "$venv/bin/python" -m pip install --quiet \
      "django>=5.0,<6.0" djangorestframework django-cors-headers \
      python-dotenv dj-database-url drf-spectacular
  "$venv/bin/python" -m pip freeze > "$RAIZ/backend/requirements.txt"
  ok "Django, DRF e apoio instalados; requirements.txt gerado"

  resumo_base
}

# =============================================================================
#  Etapa: frontend — Node + pnpm (necessário a partir do M03)
# =============================================================================

etapa_frontend() {
  titulo "DPW — ambiente do frontend (Node + pnpm)"

  if ! tem node; then
    erro "Node.js não encontrado."
    echo  "         Instale o Node 20 LTS: https://nodejs.org  (ou use fnm/nvm)"
    return 1
  fi

  local maior
  maior="$(node --version | tr -d 'v' | cut -d. -f1)"
  if [ "$maior" -lt 20 ]; then
    erro "Node $maior encontrado; o material precisa da versão 20 ou superior."
    return 1
  fi
  ok "Node $(node --version)"

  passo "pnpm"
  if tem pnpm; then
    pulo "pnpm já instalado ($(pnpm --version))"
  else
    corepack enable
    corepack prepare pnpm@latest --activate
    ok "pnpm habilitado via corepack"
  fi

  printf '\n'
  ok "Pronto para o M03."
}

# =============================================================================
#  Etapa: banco — Docker + PostgreSQL (necessário a partir do M05)
# =============================================================================

etapa_banco() {
  titulo "DPW — banco de dados (Docker + PostgreSQL)"

  if ! tem docker; then
    erro "Docker não encontrado — https://docs.docker.com/engine/install/"
    return 1
  fi
  if ! docker info >/dev/null 2>&1; then
    erro "Docker instalado, mas o daemon não responde."
    echo  "         Linux: sudo systemctl start docker"
    echo  "         macOS: abra o Docker Desktop"
    return 1
  fi
  ok "Docker respondendo"

  criar_arquivo "$RAIZ/docker-compose.yml" conteudo_compose

  passo "Subindo o PostgreSQL"
  docker compose -f "$RAIZ/docker-compose.yml" up -d
  ok "PostgreSQL na porta 5432 (usuário/banco: bibliocom, senha: devpassword)"

  passo "Driver do PostgreSQL no ambiente virtual"
  "$RAIZ/backend/.venv/bin/python" -m pip install --quiet "psycopg[binary]"
  ok "psycopg instalado"
}

# =============================================================================
#  Apoio
# =============================================================================

criar_arquivo() {
  local caminho="$1" gerador="$2"
  if [ -f "$caminho" ]; then
    pulo "$(basename "$caminho") já existe (não foi sobrescrito)"
  else
    "$gerador" > "$caminho"
    ok "$(basename "$caminho") criado"
  fi
}

conteudo_gitignore() {
cat <<'ARQUIVO'
# Python
__pycache__/
*.py[cod]
.venv/
venv/

# Django
*.log
db.sqlite3
db.sqlite3-journal
/backend/media/
/backend/staticfiles/

# Node
node_modules/
dist/
.vite/
*.tsbuildinfo

# Ambiente
.env
.env.*
!.env.example

# Editores
.vscode/
.idea/
.DS_Store

# Windows
Thumbs.db
desktop.ini
ARQUIVO
}

conteudo_gitattributes() {
cat <<'ARQUIVO'
# Normaliza finais de linha. Sem isto, um build.sh salvo no Windows chega ao
# servidor com CRLF e o deploy falha com "bad interpreter".
* text=auto eol=lf

*.sh     text eol=lf
*.py     text eol=lf
*.yml    text eol=lf
*.yaml   text eol=lf
Procfile text eol=lf

*.bat text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
*.pdf binary
ARQUIVO
}

conteudo_compose() {
cat <<'ARQUIVO'
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
ARQUIVO
}

resumo_base() {
  printf '\n\033[36m%s\033[0m\n' "$(printf -- '-%.0s' {1..70})"
  printf '\033[32m  Ambiente básico pronto.\033[0m\n'
  printf '\033[36m%s\033[0m\n\n' "$(printf -- '-%.0s' {1..70})"
  echo "  Projeto em: $RAIZ"
  echo ""
  echo "  Para trabalhar, abra o terminal e rode as DUAS linhas:"
  echo ""
  printf '\033[33m      cd %s/backend\033[0m\n' "$RAIZ"
  printf '\033[33m      source .venv/bin/activate\033[0m\n'
  echo ""
  echo "  O prompt deve passar a mostrar (.venv). Isso vale por janela:"
  echo "  terminal novo, ativação nova."
  echo ""
  echo "  Próximos momentos:"
  echo "      antes do M03:  ./setup.sh frontend"
  echo "      antes do M05:  ./setup.sh banco"
  echo ""
}

# =============================================================================
#  Execução
# =============================================================================

case "$ETAPA" in
  base)     etapa_base ;;
  frontend) etapa_frontend ;;
  banco)    etapa_banco ;;
  *)        erro "Etapa desconhecida: $ETAPA (use: base, frontend ou banco)"; exit 1 ;;
esac
