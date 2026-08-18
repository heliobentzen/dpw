# Setup do ambiente — Linux e macOS

> ## 🪟 Está no Windows?
>
> **Use o guia próprio: [`ambiente-setup-windows.md`](ambiente-setup-windows.md).**
>
> Ele é completo e independente. Não é tradução deste arquivo, e você **não** precisa
> alternar entre os dois. Vale também se você optou por **Git Bash**; se optou por **WSL2**,
> instale-o pelo guia do Windows e siga **este** arquivo lá dentro, porque o WSL2 é Linux.

## O que entra em cada momento

Você **não** instala tudo na primeira aula. Cada coisa entra na aula em que passa a ser
necessária — assim você monta menos peças de uma vez, e cada uma chega com o problema que
ela resolve à vista.

| Momento | O que entra | Seções |
|---|---|---|
| **Semana 1** (M00) | Python, Git, VS Code, ambiente virtual, Django, primeiro commit | 2, 3, 5, 6, 8, 10 |
| **Antes do M03** | Node 20 + pnpm; DRF e as demais dependências do backend | 4 |
| **Antes do M05** | Docker + PostgreSQL | 7 |
| **A partir do M08** | Rodar os dois servidores juntos | 9 |

Na semana 1 você instala **um único pacote Python: o Django**. As outras dependências entram
no M03, quando o projeto passa a usá-las — e você vê o `requirements.txt` crescer junto com
o que o sistema faz. É assim que gestão de dependência se aprende.

> **Você digita tudo.** Não há script que monte o ambiente por você — criar um ambiente
> virtual, instalar dependência e versionar código *são* conteúdo da disciplina, não
> preparação para ela. O que existe é um script que **confere** o resultado (seção 8): ele
> diagnostica, não faz.

**Tempo da semana 1:** 30–45 min.

## Como trabalhar no dia a dia

Duas linhas, sempre as mesmas, toda vez que abrir um terminal:

```bash
cd ~/dev/bibliocom/backend
source .venv/bin/activate
```

O prompt passa a mostrar `(.venv)`. **Isso vale por janela** — terminal novo, ativação nova.
É a causa nº 1 de `ModuleNotFoundError: No module named 'django'`.

---

## Passo a passo

> São **dois** ambientes: Python (backend) e Node (frontend). Eles são independentes —
> cada um com seu gerenciador de pacotes, seu arquivo de dependências e seu diretório.

## 1. O que será instalado

| Ferramenta | Versão mínima | Camada | Para quê |
|---|---|---|---|
| Python | 3.12 | 🔵 | Linguagem do backend |
| pip / venv | (vem com Python) | 🔵 | Dependências e isolamento |
| **Node.js** | **20 LTS** | 🟣 | Runtime do frontend |
| **pnpm** | 9 | 🟣 | Gerenciador de pacotes |
| Git | 2.40 | ambos | Versionamento |
| VS Code (ou PyCharm/WebStorm) | atual | ambos | Editor |
| Docker Desktop | atual | 🔵 | PostgreSQL local (a partir do M05) |
| PostgreSQL | 16 | 🔵 | Banco de produção-like |

> Até o M04 usamos **SQLite** (embutido, zero instalação). PostgreSQL entra no M05, para
> que a diferença entre "banco de brinquedo" e "banco de verdade" seja sentida na prática.

## 2. Estrutura do repositório

```
bibliocom/
├── backend/            projeto Django + DRF
│   ├── .venv/          ambiente virtual Python (fora do Git)
│   ├── config/
│   ├── acervo/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
├── frontend/           projeto React + Vite
│   ├── node_modules/   (fora do Git)
│   ├── src/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── .env
├── docker-compose.yml
├── .gitignore
└── README.md
```

**Um repositório, dois projetos** (*monorepo*). Para uma equipe de 4 pessoas numa
disciplina, isso é mais simples que dois repositórios: um único PR mostra a mudança
completa (campo novo no model → serializer → tipo no cliente → tela), e não há
dessincronização entre repositórios.

---

## 3. Python (backend)

### macOS

```bash
# macOS (Homebrew)
brew install python@3.12
python3 --version
```


### Linux (Debian/Ubuntu) — inclui WSL2

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip
python3 --version
```

### Ambiente virtual e dependências

```bash
mkdir -p ~/dev/bibliocom/backend && cd ~/dev/bibliocom/backend
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
pip install "django>=5.0,<6.0"
pip freeze > requirements.txt
```

**Um pacote só, de propósito.** DRF, `django-cors-headers`, `python-dotenv`,
`dj-database-url` e `drf-spectacular` entram no **M03**, cada um no momento em que o projeto
passa a usá-lo. Instalar seis pacotes hoje seria decorar uma lista; instalar cada um quando
ele resolve um problema concreto é aprender para que serve.

O prompt passa a mostrar `(.venv)`. Se não mostrar, o ambiente **não** está ativo e tudo
que você instalar vai para o lugar errado. Para sair: `deactivate`.

---

## 4. Node.js e pnpm (frontend)

> ⏭️ **Só é necessário a partir do M03.** Na semana 1, pule para a seção 5.

### Instalação recomendada: via `fnm` (gerencia versões)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL
fnm install 20 && fnm use 20
```

Alternativa simples: instalador oficial em <https://nodejs.org> (escolha **LTS**).

```bash
node --version    # v20.x ou superior
npm --version
```

### pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

> **Por que pnpm e não npm?** Instala mais rápido e usa muito menos disco (links para um
> armazém compartilhado) — diferença sentida num laboratório com 40 máquinas e projetos de
> vários semestres. Tudo neste material funciona com `npm` trocando `pnpm` por `npm`; só o
> `pnpm dlx` vira `npx`.

### Criar o projeto React (feito no M03; aqui só para conferir a instalação)

```bash
cd bibliocom
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm install
pnpm dev            # abre em http://localhost:5173
```

---

## 5. Git e GitHub

```bash
git --version
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

Chave SSH (evita digitar token a cada push):

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
cat ~/.ssh/id_ed25519.pub   # cole em github.com > Settings > SSH and GPG keys
ssh -T git@github.com       # deve responder "Hi <usuario>!"
```

---

## 6. VS Code

**Agora, duas:**

```bash
code --install-extension ms-python.python
code --install-extension charliermarsh.ruff
```

| Extensão | Para quê |
|---|---|
| **Python** (Microsoft) | Reconhece o interpretador do `.venv`, dá autocomplete e depurador |
| **Ruff** (Astral) | Lint e formatação de Python |

**Depois, quando o módulo pedir** — não instale hoje o que só vai usar em seis semanas:

| Extensão | Instale antes do | Para quê |
|---|---|---|
| **SQLite Viewer** | M04 | Inspecionar o `db.sqlite3` gerado pelo Model |
| **ESLint** · **Prettier** | M08 | Lint e formatação de TypeScript |
| **Tailwind CSS IntelliSense** | M09 | Autocomplete de classes — praticamente obrigatória |
| **GitLens** | quando quiser | Histórico e autoria linha a linha |

`.vscode/settings.json` sugerido:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/.venv/bin/python",
  "editor.formatOnSave": true,
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "'([^']*)'"]],
  "files.exclude": { "**/__pycache__": true, "**/*.pyc": true, "**/node_modules": true }
}
```

---

## 7. PostgreSQL via Docker (a partir do M05)

> ⏭️ Até o M04 usamos SQLite, que não exige instalação.

`docker-compose.yml` na raiz:

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

---

## 8. Verificação do ambiente

Rode o script de [`../recursos/codigo/verifica_ambiente.py`](../recursos/codigo/verifica_ambiente.py):

```bash
python recursos/codigo/verifica_ambiente.py
```

Ele confere Python, venv, Django, DRF, **Node, pnpm**, Git e Docker. **Só avance com todos
os itens em OK.**

---

## 9. Rodar o sistema completo (dois terminais)

```bash
# terminal 1 — backend
cd backend && source .venv/bin/activate
python manage.py runserver          # http://localhost:8000

# terminal 2 — frontend
cd frontend
pnpm dev                            # http://localhost:5173
```

O Vite é configurado (M03) para encaminhar `/api` ao Django, de modo que o navegador veja
tudo na mesma origem — o que evita CORS em desenvolvimento e reproduz a topologia de
produção:

```ts
// frontend/vite.config.ts
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

---

## 10. `.gitignore` do repositório

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
```

> **Nunca** comite `.env`, `db.sqlite3`, `node_modules/` ou `SECRET_KEY`. Segredo que entra
> no histórico do Git é segredo vazado — mesmo depois de removido, continua nos commits
> anteriores.

### `.gitattributes` — obrigatório se alguém da equipe usa Windows 🪟

```gitattributes
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
```

Sem isso, um `build.sh` salvo no Windows chega ao servidor com `\r\n` e o deploy falha com
`bad interpreter: No such file or directory` — mensagem que não diz nada sobre a causa real.
**Crie o arquivo no primeiro commit**, junto com o `.gitignore`.

> Este arquivo é responsabilidade de **quem cria o repositório**, mesmo que essa pessoa use
> Linux: ele protege a equipe inteira, inclusive quem entra depois sem configurar nada.
> Quem está no Windows encontra o passo detalhado em
> [`ambiente-setup-windows.md`](ambiente-setup-windows.md#112-gitattributes--obrigatório-).

**Atenção ao `.env` do frontend:** ele **não** é secreto (é embutido no bundle em tempo de
build e qualquer pessoa lê no DevTools), mas segue fora do Git porque muda por ambiente.
Nunca coloque chave de API nele. Detalhado no M13.

---

## 11. Problemas frequentes

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ModuleNotFoundError: django` | venv não ativo | Ative o venv e reinstale |
| `pnpm: command not found` | Corepack não habilitado | `corepack enable` |
| `EACCES` ao instalar pacote global | Permissão | Use `fnm`/`corepack`, nunca `sudo npm -g` |
| `npm ERR! network` no laboratório | Proxy/firewall | `npm config set proxy http://...` e libere `registry.npmjs.org` |
| `Cannot find module 'react'` | Faltou `pnpm install` | Rode na pasta `frontend/` |
| `port 5173 already in use` | Outro Vite rodando | `pnpm dev --port 5174` |
| `port 5432 already in use` | PostgreSQL local ativo | Pare o serviço ou use `5433:5432` |
| Requisição do front dá **CORS error** | Chamou `localhost:8000` direto | Use o caminho `/api` (proxy do Vite) |

🪟 **Erros de Windows** têm tabela própria, com causa e diagnóstico:
[`ambiente-setup-windows.md`, passo 12](ambiente-setup-windows.md#passo-12--erros-e-diagnóstico).

Mais casos em [`faq-troubleshooting.md`](faq-troubleshooting.md).
