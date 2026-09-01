# Setup do ambiente — Linux e macOS

> ## 🪟 Está no Windows?
>
> **Use o guia próprio: [`ambiente-setup-windows.md`](ambiente-setup-windows.md).**
>
> Ele é completo e independente. Não é tradução deste arquivo, e você **não** precisa
> alternar entre os dois. Vale também se você optou por **Git Bash**; se optou por **WSL2**,
> instale-o pelo guia do Windows e siga **este** arquivo lá dentro, porque o WSL2 é Linux.

## Um runtime só

A stack é **TypeScript ponta a ponta**. Você instala **o Node** (que já traz o npm), e nada além disso do
lado de linguagem — não há Python, `venv`, `pip` nem um segundo ecossistema de pacotes para
manter. O backend e o frontend compartilham runtime, gerenciador de pacotes e sintaxe.

## O que entra em cada momento

| Momento | O que entra | Seções |
|---|---|---|
| **Semana 1** (M00) | Git, Node 20, VS Code, monorepo, primeiro commit | 1 a 5, 8, 9 |
| **Antes do M03** | Dependências do backend (NestJS CLI, TypeORM) | 6 |
| **Antes do M04** | Docker + PostgreSQL | 7 |
| **A partir do M08** | Rodar os dois servidores juntos | 10 |

> **Você digita tudo.** Não há script que monte o ambiente por você — configurar projeto,
> instalar dependência e versionar código *são* conteúdo da disciplina, não preparação para
> ela. O que existe é um script que **confere** o resultado (seção 8): ele diagnostica, não faz.

**Tempo da semana 1:** 20–30 min.

## Como trabalhar no dia a dia

```bash
cd ~/dev/bibliocom
npm run dev:api      # backend  → http://localhost:3000
npm run dev:web      # frontend → http://localhost:5173
```

Sem ativar ambiente virtual, sem `source` nenhum: as dependências vivem em `node_modules/`
dentro do projeto, e o `npm` as encontra pela pasta em que você está.

---

## 1. O que será instalado

| Ferramenta | Versão mínima | Camada | Para quê |
|---|---|---|---|
| Node.js | **20 LTS** | ambas | Runtime do backend **e** do frontend |
| Git | 2.40 | ambas | Versionamento |
| VS Code (ou WebStorm) | atual | ambas | Editor |
| Docker | atual | 🔵 | PostgreSQL local (a partir do M04) |
| PostgreSQL | 16 | 🔵 | Banco de produção-like |

> O banco entra só no M04, quando há entidade para gerar tabela. Usamos **PostgreSQL desde
> o primeiro dia de banco**: é o mesmo que roda em produção (M16), então nada do que você
> escrever precisa ser refeito depois por diferença de dialeto.

## 2. Estrutura do repositório

```
bibliocom/                    monorepo (workspaces do npm)
├── package.json              scripts da raiz
├── backend/                  NestJS + TypeORM
│   ├── src/
│   ├── openapi.json          contrato gerado (M07)
│   └── .env
├── frontend/                 React + Vite
│   ├── src/
│   └── .env
├── pacotes/tipos/            @bibliocom/tipos — DTOs e enums (M15)
├── docker-compose.yml
├── .gitignore
└── README.md
```

**Um repositório, três projetos.** Um `npm install` na raiz resolve os três, e um PR mostra
a mudança completa: entidade → DTO → tipo → tela.

---

## 3. Git e GitHub

```bash
git --version
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

Use no `user.email` **o mesmo e-mail da conta do GitHub**, senão os commits não são
atribuídos a você.

Chave SSH (evita digitar token a cada push):

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
cat ~/.ssh/id_ed25519.pub   # cole em github.com > Settings > SSH and GPG keys
ssh -T git@github.com       # deve responder "Hi <usuario>!"
```

## 4. Node.js e npm

### Instalação recomendada: via `fnm` (gerencia versões)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL
fnm install 20 && fnm use 20
```

Alternativa simples: instalador oficial em <https://nodejs.org> (escolha **LTS**), ou o
gerenciador de pacotes da sua distribuição.

```bash
node --version    # v20.x ou superior
```

### npm

Não há nada a instalar: o npm vem junto com o Node.

```bash
npm --version    # 10.x ou superior
```

> **Por que npm?** Ele já está instalado — zero passo extra — e é o que aparece em todo
> tutorial, resposta de fórum e documentação, sem precisar traduzir comando. Os *workspaces*
> que o monorepo usa funcionam nele desde a versão 7. Alternativas como pnpm e yarn são
> comuns no mercado e valem conhecer depois; numa turma iniciante elas cobram uma instalação
> a mais e, no Windows, atrito com links simbólicos — custo sem retorno pedagógico.

## 5. VS Code

**Agora, duas extensões:**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

| Extensão | Para quê |
|---|---|
| **ESLint** | Lint de TypeScript nas duas camadas |
| **Prettier** | Formatação |

**Depois, quando o módulo pedir:**

| Extensão | Antes do | Para quê |
|---|---|---|
| **PostgreSQL** (ms-ossdata.vscode-pgsql) | M04 | Ver as tabelas que as entidades geraram, sem sair do editor |
| **Tailwind CSS IntelliSense** | M09 | Autocomplete de classes — praticamente obrigatória |
| **GitLens** | quando quiser | Histórico e autoria linha a linha |

`.vscode/settings.json` sugerido:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "'([^']*)'"]],
  "files.exclude": { "**/node_modules": true, "**/dist": true }
}
```

`typescript.tsdk` faz o editor usar o TypeScript **do projeto**, não o embutido. Sem isto,
o editor pode acusar erros que o `tsc` não acusa — e vice-versa.

---

## 6. Dependências do backend

> ⏭️ **Só a partir do M03.** Na semana 1, pule para a seção 8.

O M03 conduz a criação do projeto NestJS e do monorepo:

```bash
nest new backend --skip-git
```

`npx` executa um pacote sem instalá-lo no projeto — vem junto com o npm. O `--skip-git` é
importante: sem ele, a CLI cria um segundo repositório dentro do seu.

Siga o roteiro do [M03](../modulos/03-nestjs-primeiros-passos/).

## 7. PostgreSQL via Docker (a partir do M04)

> ⏭️ Só é preciso antes do M04 — até lá não há entidade nem tabela.

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
npm install -w backend pg
```

## 8. Verificação do ambiente

```bash
node recursos/codigo/verifica-ambiente.mjs
```

Confere Node, npm, Git configurado e Docker. Aceita `--etapa m00|m03|m04` e cobra só o que
já deveria existir naquele ponto do curso. Ele **diagnostica e não instala**: para cada
falha, imprime o comando exato que corrige.

**Só avance com todos os itens da etapa em `OK`.**

## 9. Rodar o sistema completo (dois terminais)

> ⏭️ A partir do **M08**, quando o frontend passa a existir.

```bash
# terminal 1 — backend
cd ~/dev/bibliocom/backend
npm run start:dev            # http://localhost:3000

# terminal 2 — frontend
cd ~/dev/bibliocom/frontend
npm run dev                  # http://localhost:5173
```

Ou, da raiz, usando os scripts do workspace: `npm run dev:api` e `npm run dev:web`.

O Vite encaminha `/api` ao NestJS, então o navegador vê tudo na mesma origem — evita CORS em
desenvolvimento e reproduz a topologia de produção.

## 10. `.gitignore` do repositório

```gitignore
# Node
node_modules/
dist/
.vite/
*.tsbuildinfo
coverage/

# Banco local

# Ambiente
.env
.env.*
!.env.example

# Editores
.vscode/
.idea/
.DS_Store
```

> **Nunca** comite `.env`, `node_modules/` ou o `SESSION_SECRET`. Segredo que entra no
> histórico do Git é segredo vazado — mesmo removido, continua nos commits anteriores.

### `.gitattributes` — obrigatório se alguém da equipe usa Windows 🪟

```gitattributes
* text=auto eol=lf

*.sh   text eol=lf
*.ts   text eol=lf
*.tsx  text eol=lf
*.json text eol=lf
*.yml  text eol=lf

*.bat text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
*.pdf binary
```

Sem isso, um `.sh` salvo no Windows chega ao servidor com `\r\n` e o deploy falha com
`bad interpreter: No such file or directory` — mensagem que não diz nada sobre a causa real.
**Crie o arquivo no primeiro commit**, junto com o `.gitignore`.

> Este arquivo é responsabilidade de **quem cria o repositório**, mesmo que essa pessoa use
> Linux: ele protege a equipe inteira, inclusive quem entra depois sem configurar nada.

**Atenção ao `.env` do frontend:** ele **não** é secreto (é embutido no bundle em tempo de
build e qualquer pessoa lê no DevTools), mas segue fora do Git porque muda por ambiente.
Nunca coloque chave de API nele. Detalhado no M13.

---

## 11. Problemas frequentes

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Cannot find module` após clonar | Faltou instalar | `npm install` **na raiz** |
| `Cannot find module '@bibliocom/tipos'` | Workspace não resolvido | `npm install` na raiz; confira o campo `workspaces` do `package.json` |
| `EACCES` ao instalar pacote global | Permissão | Use `fnm` ou mude o prefixo do npm, nunca `sudo npm -g` |
| `npm ERR! network` no laboratório | Proxy/firewall | Libere `registry.npmjs.org` |
| `port 5173 already in use` | Outro Vite rodando | `npm run dev --port 5174` |
| `port 3000 already in use` | Outro Nest rodando | `PORT=3001 npm run start:dev` |
| `port 5432 already in use` | PostgreSQL local ativo | Pare o serviço ou use `5433:5432` |
| Requisição do front dá **CORS error** | Chamou `localhost:3000` direto | Use o caminho `/api` (proxy do Vite) |
| Editor acusa erro que o `tsc` não acusa | Versões diferentes de TypeScript | `"typescript.tsdk"` no `settings.json` |

🪟 **Erros de Windows** têm tabela própria:
[`ambiente-setup-windows.md`, passo 11](ambiente-setup-windows.md#passo-11--erros-e-diagnóstico).

Mais casos em [`faq-troubleshooting.md`](faq-troubleshooting.md).
