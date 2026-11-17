# Setup do ambiente

Um guia só, para **Windows, Linux e macOS**. Quando o comando muda de sistema, aparecem os
dois blocos lado a lado: 🪟 **Windows (PowerShell)** e 🐧 **Linux e macOS**.

> **Você digita tudo.** Configurar projeto, instalar dependência e versionar código são
> conteúdo da disciplina. O único script do material **confere** o resultado (passo 6): ele
> diagnostica, não instala.

## O que entra em cada momento

| Momento | O que instalar | Passos |
| --- | --- | --- |
| **Semana 1** (M00) | Terminal, Git, Node 24, VS Code, primeiro commit | 0 a 6, 8 |
| **Antes do M03** | Nada: o M03 cria o projeto NestJS com você | — |
| **Antes do M04** | Docker + PostgreSQL. 🪟 Exige WSL2: **não deixe para a véspera** | 7 |

Um runtime só: o **Node**, que já traz o npm. O banco roda no Docker, então não há
PostgreSQL para instalar na máquina.

| Ferramenta | Versão mínima |
| --- | --- |
| Node.js | 24 LTS (traz o npm 11) |
| Git | 2.40 |
| VS Code | atual |
| Docker | atual (a partir do M04) |

---

## Passo 0 — Duas decisões antes de digitar

### Terminal 🪟

| Opção | Quando usar |
| --- | --- |
| **PowerShell** | ✅ Padrão deste guia no Windows |
| **Git Bash** | Vem com o Git; os comandos 🐧 funcionam colados |
| **WSL2** | Um Linux dentro do Windows; útil a partir do deploy (M12) |

Escolha um e fique com ele. Sem preferência? PowerShell.

### Pasta

| Sistema | Use | Evite |
| --- | --- | --- |
| 🪟 | `C:\dev` | Qualquer pasta dentro de `Documents` (sincronizada pelo **OneDrive**), com **espaço** ou **acento** |
| 🐧 | `~/dev` | Caminhos com espaço ou acento |

> ⚠️ **OneDrive é a origem da maioria dos problemas "inexplicáveis" no Windows:** ele tenta
> sincronizar os milhares de arquivos de `node_modules`, o `npm install` trava e o Git acusa
> mudanças fantasmas. Não negocie a pasta.

---

## Passo 1 — Preparar o terminal 🪟

*Só no Windows. No Linux e no macOS, pule para o passo 2.*

```powershell
$PSVersionTable.PSVersion
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Linha | O que faz |
| --- | --- |
| `$PSVersionTable` | Mostra a versão. `Major` **5** = PowerShell 5.1, sem `&&` e com `>` gravando em UTF-16. `Major` **7** não tem essas pegadinhas |
| `Set-ExecutionPolicy … RemoteSigned` | Libera scripts locais, como o próprio `npm`. Só para o seu usuário |

**Deu certo se:** `Get-ExecutionPolicy -Scope CurrentUser` responde `RemoteSigned`.

> Prefira o **Windows Terminal** (padrão no Windows 11): lida melhor com acentos e tem abas.

---

## Passo 2 — Pasta de trabalho

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `New-Item -ItemType Directory -Force C:\dev`<br>`Set-Location C:\dev` | `mkdir -p ~/dev`<br>`cd ~/dev` |

---

## Passo 3 — Git

**Instalar:**

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `winget install --id Git.Git --scope user`<br>e **feche e reabra o terminal** | Linux: gerenciador da distribuição (`sudo apt install git`)<br>macOS: `xcode-select --install` |

**Configurar** (igual nos três sistemas):

```bash
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

| Linha | Por que importa |
| --- | --- |
| `user.email` | **Use o mesmo e-mail do GitHub**, senão os commits não são atribuídos a você |
| `pull.rebase false` | `git pull` faz *merge*, sem cair num rebase interativo |

🪟 **Mais duas linhas no Windows:**

```powershell
git config --global core.autocrlf input
git config --system core.longpaths true    # este, num PowerShell como administrador
```

`autocrlf` evita enviar finais de linha do Windows (CRLF) para o servidor Linux do deploy.
`longpaths` evita o erro `Filename too long` nas pastas profundas do `node_modules`.

**Chave SSH** (para não digitar senha a cada `push`):

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

`Enter` nas três perguntas. Copie a chave **pública** (`.pub`, nunca a outra):

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub \| Set-Clipboard` | `cat ~/.ssh/id_ed25519.pub` e copie a saída |

Cole em **github.com → Settings → SSH and GPG keys → New SSH key** e teste:

```bash
ssh -T git@github.com
```

**Deu certo se:** responde `Hi <seu-usuario>! You've successfully authenticated…`. O "but
GitHub does not provide shell access" no fim **não é erro**.

---

## Passo 4 — Node.js e npm

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `winget install --id OpenJS.NodeJS.LTS`<br>e **feche e reabra o terminal** | Recomendado, com o gerenciador de versões `fnm`:<br>`curl -fsSL https://fnm.vercel.app/install \| bash`<br>`exec $SHELL`<br>`fnm install 24 && fnm use 24` |

Alternativa nos três sistemas: o instalador **LTS** em <https://nodejs.org>.

```bash
node --version    # v24.x ou superior
npm --version     # 11.x ou superior
```

O **npm vem junto com o Node**: não há nada mais a instalar.

> ⚠️ **npm 10 não serve.** Ele falha ao instalar o projeto do NestJS 12 com
> `Cannot read properties of null (reading 'edgesOut')`. Atualize o Node ou só o npm:
> `npm install -g npm@11`.

> **Por que npm, e não pnpm ou yarn?** Já vem instalado, todo tutorial usa e, no Windows, não
> depende de links simbólicos. Ver [ADR-05](decisoes-tecnicas.md#adr-05--npm-como-gerenciador-de-pacotes).

🪟 **Exclua `C:\dev` do antivírus.** O Windows Defender inspeciona cada arquivo do
`npm install`, e a instalação leva minutos em vez de segundos: *Segurança do Windows →
Proteção contra vírus e ameaças → Gerenciar configurações → Exclusões → Adicionar → Pasta →
`C:\dev`*.

---

## Passo 5 — VS Code

🪟 `winget install --id Microsoft.VisualStudioCode --scope user` · 🐧 instalador em
<https://code.visualstudio.com>.

**Agora, só duas extensões:**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

**Antes do M04:** a extensão **PostgreSQL** (`ms-ossdata.vscode-pgsql`), para ver as tabelas
sem sair do editor.

Crie `.vscode/settings.json` na pasta do projeto:

```json
{
  "files.eol": "\n",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": { "**/node_modules": true, "**/dist": true }
}
```

| Chave | O que faz |
| --- | --- |
| `files.eol` | Salva com fim de linha Unix (LF), igual ao servidor |
| `typescript.tsdk` | Usa o TypeScript **do projeto**, não o do editor. Sem isto, o editor e o `tsc` discordam |

---

## Passo 6 — Verificação

Rode a partir da pasta onde está este material:

```bash
node recursos/codigo/verifica-ambiente.mjs
```

O script confere Node, npm, Git e, no Windows, `curl.exe`, `core.autocrlf`, OneDrive e acentos
no caminho. Use `--etapa m03` antes do M03 e `--etapa m04` antes do M04: ele cobra só o que
já deveria existir. Para cada falha, mostra o comando que corrige.

**Só avance com todos os itens em `OK`.**

> 🪟 Nos roteiros, todo `curl` vira **`curl.exe`**: no PowerShell, `curl` sozinho é outro
> comando (`Invoke-WebRequest`).

---

## Passo 7 — Docker e PostgreSQL (antes do M04)

### 🪟 Pré-requisito no Windows: WSL2

O Docker Desktop roda sobre o WSL2. Num PowerShell **como administrador**:

```powershell
wsl --install
```

**Reinicie o computador.** Se aparecer "virtualização desabilitada", é preciso ativar
*Intel VT-x* ou *AMD-V* na BIOS. Em máquina institucional, isso pode depender da TI — **avise
o docente com antecedência**.

### Docker Desktop

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `winget install --id Docker.DockerDesktop`<br>e **abra o Docker Desktop** pelo menu Iniciar | macOS: Docker Desktop em <https://docker.com><br>Linux: Docker Engine pelo gerenciador da distribuição |

### Subir o PostgreSQL

Crie `docker-compose.yml` na raiz do projeto:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
```

```bash
docker compose up -d
docker compose ps
```

**Deu certo se:** o status mostra `healthy` (até ~15 s na primeira vez). Porta 5432 ocupada?
Troque para `"5433:5432"` e ajuste a `DATABASE_URL`.

---

## Passo 8 — `.gitignore` e `.gitattributes`

Os dois na **raiz do repositório**, no **primeiro commit**.

> 🪟 **Não crie pelo Bloco de Notas:** ele grava `.gitignore.txt` e esconde a extensão. Crie
> pelo terminal (`New-Item -ItemType File .gitignore, .gitattributes`) e edite no VS Code.
> E nunca gere esses arquivos com `echo … >` no PowerShell 5.1: o `>` grava em UTF-16.

**`.gitignore`:**

```gitignore
node_modules/
dist/
*.tsbuildinfo
coverage/

.env
.env.*
!.env.example

.vscode/
.idea/
.DS_Store
Thumbs.db
```

> **Nunca** commite `.env` nem segredos. Segredo que entra no histórico do Git está vazado,
> mesmo que seja apagado depois.

**`.gitattributes`** — obrigatório se alguém da equipe usa Windows:

```gitattributes
* text=auto eol=lf
*.ps1 text eol=crlf
*.bat text eol=crlf
*.png binary
*.jpg binary
*.pdf binary
```

Sem ele, um script salvo no Windows chega ao servidor com CRLF e o deploy falha com
`bad interpreter: No such file or directory` — mensagem que não aponta a causa. Quem cria o
repositório cria este arquivo, mesmo que use Linux: ele protege a equipe inteira.

---

## Passo 9 — Rodar a API no dia a dia

A partir do M04:

| 🪟 Windows | 🐧 Linux e macOS |
| --- | --- |
| `Set-Location C:\dev\projeto`<br>`docker compose up -d`<br>`Set-Location backend`<br>`npm run start:dev` | `cd ~/dev/projeto`<br>`docker compose up -d`<br>`cd backend`<br>`npm run start:dev` |

**Deu certo se:** <http://localhost:3000/api/docs> abre o Swagger. O `docker compose up -d`
não faz nada se o banco já estiver no ar, então pode rodá-lo sempre.

---

## Passo 10 — Erros e diagnóstico

### Em qualquer sistema

| Sintoma | Causa | Solução |
| --- | --- | --- |
| `Cannot find module` após clonar | Faltou instalar | `npm install` **na raiz** |
| `npm ERR! network` no laboratório | Proxy ou firewall | Libere `registry.npmjs.org` |
| `EADDRINUSE` / porta 3000 em uso | Outro servidor aberto | Feche-o com `Ctrl+C` |
| Porta 5432 em uso | PostgreSQL local ativo | Pare o serviço ou use `"5433:5432"` |
| Editor acusa erro que o `tsc` não acusa | TypeScript do editor ≠ do projeto | `typescript.tsdk` no `settings.json` |
| 🐧 `EACCES` ao instalar pacote global | Permissão | Use o `fnm`; nunca `sudo npm -g` |

### 🪟 No Windows

| Sintoma | Causa | Solução |
| --- | --- | --- |
| `npm : não pode ser carregado… execução de scripts desabilitada` | Política de execução | Passo 1 |
| `O termo 'node' não é reconhecido` | Terminal aberto antes da instalação | Feche e reabra |
| `Filename too long` | Limite de 260 caracteres | `core.longpaths` (passo 3) |
| `npm install` demora minutos | Antivírus | Exclusão de `C:\dev` (passo 4) |
| Git acusa mudanças que você não fez | Projeto no OneDrive | Mova para `C:\dev` |
| Docker não responde | Docker Desktop fechado | Abra pelo menu Iniciar |
| Acentos quebrados no terminal | Página de código | `chcp 65001`, ou use o Windows Terminal |

### 🪟 Comandos que mudam no PowerShell

| Nos roteiros | No PowerShell |
| --- | --- |
| `curl -i http://…` | `curl.exe -i http://…` |
| `NODE_ENV=production node dist/main.js` | `$env:NODE_ENV="production"` e, na linha seguinte, `node dist/main.js` |
| `cd backend && npm run start:dev` | Duas linhas separadas (`&&` não existe no 5.1) |
| `comando > arquivo.json` | `comando \| Out-File arquivo.json -Encoding utf8` |
| Continuação de linha com `\` | Crase `` ` ``, **sem espaço depois** |

Tabela completa em [`../recursos/comandos-windows.md`](../recursos/comandos-windows.md).

**Travou?** Tente o mesmo comando no **Git Bash**. Se um roteiro tem comando sem alternativa
para o seu sistema, **é falha do material**: avise o docente. Mais casos em
[`faq-troubleshooting.md`](faq-troubleshooting.md).
