# Setup do ambiente no Windows 🪟

Se você usa Windows, este é o **único** arquivo de instalação que precisa abrir — não
alterne entre ele e [`ambiente-setup.md`](ambiente-setup.md), que é Linux/macOS.

> **Como ler.** Cada passo tem três partes: o **bloco de comandos** (cole inteiro), a
> **tabela linha a linha** (o que cada comando faz) e o **"deu certo se…"** (como conferir
> antes de seguir). Não pule a conferência: no Windows, quase todo erro de setup só aparece
> três aulas depois, disfarçado de outra coisa.
>
> **Você digita tudo.** Não há script que monte o ambiente por você — configurar projeto,
> instalar dependência e versionar código *são* conteúdo da disciplina, não preparação para
> ela. O que existe é um script que **confere** o resultado (passo 8): ele diagnostica, não faz.

## Um runtime só

A stack é **TypeScript ponta a ponta**. Isso significa que você instala **Node e pnpm**, e
nada além disso do lado de linguagem — não há Python, `venv`, `pip` nem um segundo
ecossistema de pacotes para manter. É o maior ganho colateral da escolha de stack, e ele
aparece justo aqui, no setup.

## O que entra em cada momento

| Momento | O que entra | Passos |
|---|---|---|
| **Semana 1** (M00) | Terminal, Git, Node 20, pnpm, VS Code, monorepo, primeiro commit | 0 a 5, 8, 9 |
| **Antes do M03** | Dependências do backend (NestJS CLI, TypeORM) | 6 |
| **Antes do M05** | Docker + PostgreSQL | 7 |
| **A partir do M08** | Rodar os dois servidores juntos | 10 |

**Tempo da semana 1:** 30–45 min.

---

## Índice

| Passo | Assunto | Quando |
|---|---|---|
| [0](#passo-0--decisões-antes-de-digitar-qualquer-coisa) | Decisões antes de digitar | semana 1 |
| [1](#passo-1--powershell-e-política-de-scripts) | PowerShell e política de scripts | semana 1 |
| [2](#passo-2--pasta-de-trabalho) | Pasta de trabalho | semana 1 |
| [3](#passo-3--git) | Git + SSH | semana 1 |
| [4](#passo-4--nodejs-e-pnpm) | Node 20 + pnpm | semana 1 |
| [5](#passo-5--vs-code) | VS Code | semana 1 |
| [6](#passo-6--dependências-do-backend) | Backend | **antes do M03** |
| [7](#passo-7--docker-e-postgresql) | Docker + PostgreSQL | **antes do M05** |
| [8](#passo-8--verificação) | Verificação | semana 1 |
| [9](#passo-9--gitignore-e-gitattributes) | `.gitignore` e `.gitattributes` | no 1º commit |
| [10](#passo-10--rodar-o-sistema-completo) | Rodar os dois servidores | a partir do M08 |
| [11](#passo-11--erros-e-diagnóstico) | **Erros e diagnóstico** | quando quebrar |

---

## Passo 0 — Decisões antes de digitar qualquer coisa

Duas decisões que, se tomadas erradas agora, custam horas depois. Nenhuma delas é sobre
comando: é sobre **onde** e **em que shell** você vai trabalhar.

### 0.1 Escolha o terminal — e fique com ele

| Caminho | O que é | Recomendação |
|---|---|---|
| **PowerShell** | O terminal nativo do Windows | ✅ **É o que este guia usa** |
| **Git Bash** | Um shell Unix que vem junto com o Git | Alternativa: os comandos do guia Linux funcionam como estão |
| **WSL2 (Ubuntu)** | Um Linux completo dentro do Windows | Instale antes do **M05** (Docker), não agora |

Se você não tem preferência: **PowerShell**.

### 0.2 Escolha a pasta — fora do OneDrive, sem espaço e sem acento ⚠️

Esta é a origem da maior parte dos problemas inexplicáveis no Windows, e **nenhum tutorial avisa**.

| ❌ Evite | Por quê |
|---|---|
| `C:\Users\João Silva\Documents\projetos` | O `Documents` costuma ser **sincronizado pelo OneDrive**. Ele vai tentar subir as dezenas de milhares de arquivos de `node_modules` para a nuvem: o `pnpm install` trava, o Git acusa mudanças fantasma e arquivos ficam bloqueados em uso |
| `C:\Users\João Silva\dev` | O **espaço** quebra ferramentas que não põem aspas nos caminhos |
| `C:\Users\João Silva\dev` | O **acento** quebra ferramentas que assumem ASCII |

| ✅ Use | Por quê |
|---|---|
| `C:\dev` | Curto (ajuda no limite de 260 caracteres), sem espaço, sem acento, fora do OneDrive |

> ⚠️ Isto pesa mais nesta stack do que em qualquer outra: um monorepo com backend e frontend
> tem **duas** árvores de `node_modules`, e elas são profundas. Não negocie a pasta.

---

## Passo 1 — PowerShell e política de scripts

### 1.1 Abrir e conferir a versão

Tecle `Win`, digite `powershell`, abra o **Windows PowerShell**. Se você tem o **Windows
Terminal** (padrão no Windows 11), prefira-o: lida melhor com acentos e permite abas — útil
no passo 10, em que precisamos de dois terminais.

```powershell
$PSVersionTable.PSVersion
```

**Anote o número em `Major`.** Ele muda o que funciona:

| `Major` | Significa | Consequência prática |
|---|---|---|
| **5** | PowerShell 5.1, o que vem com o Windows | O operador `&&` **não existe**; `>` grava em UTF-16 |
| **7** ou mais | PowerShell 7, instalado à parte | `&&` funciona; `>` grava em UTF-8 |

Este guia funciona nos dois. Onde houver diferença, ela está sinalizada com ⚠️.

> **Quer o PowerShell 7?** Opcional, mas aproxima sua experiência da de quem usa Linux:
> `winget install Microsoft.PowerShell`. Depois **feche e abra** o terminal.

### 1.2 Liberar a execução de scripts ⚠️

Faça isto **agora**, não quando der erro. Por padrão o Windows bloqueia scripts `.ps1` — e o
`pnpm` é distribuído como um deles.

```powershell
Get-ExecutionPolicy -Scope CurrentUser
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Linha | O que faz |
|---|---|
| `Get-ExecutionPolicy -Scope CurrentUser` | Mostra a política atual. `Undefined` ou `Restricted` = scripts bloqueados |
| `-Scope CurrentUser` | Aplica **só ao seu usuário**. Sem isto o comando exige terminal de administrador e altera a máquina toda — desnecessário e mais invasivo |
| `-ExecutionPolicy RemoteSigned` | Permite scripts **locais**; os baixados da internet continuam exigindo assinatura. É o meio-termo seguro |

Confirme com `S` (ou `Y`).

**Deu certo se:** rodar `Get-ExecutionPolicy -Scope CurrentUser` responde `RemoteSigned`.

---

## Passo 2 — Pasta de trabalho

```powershell
New-Item -ItemType Directory -Force -Path C:\dev
Set-Location C:\dev
```

| Linha | O que faz |
|---|---|
| `New-Item -ItemType Directory` | Cria uma pasta |
| `-Force` | Não reclama se já existir. Sem isto, rodar duas vezes dá erro |
| `Set-Location C:\dev` | Entra na pasta. É o `cd` do PowerShell — na verdade `cd` **é** apelido dele |

**Deu certo se:** o prompt mostra `PS C:\dev>`.

---

## Passo 3 — Git

### 3.1 Instalar

```powershell
winget install --id Git.Git --scope user
```

Ou baixe em <https://git-scm.com/download/win>. **Aceite os padrões** — eles já incluem o
Git Bash e o OpenSSH.

**Feche e reabra o terminal.** O PATH é lido quando o terminal abre.

### 3.2 Configurar

```powershell
git --version
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
```

| Linha | O que faz | Por que importa |
|---|---|---|
| `user.name` | Nome que aparece em cada commit | Sem isto o Git recusa criar commits |
| `user.email` | E-mail do commit | **Use o mesmo do GitHub**, senão os commits não são atribuídos a você |
| `init.defaultBranch main` | Novos repositórios nascem em `main` | O GitHub usa `main` |
| `pull.rebase false` | `git pull` faz *merge* | Evita a turma cair num rebase interativo sem saber o que fazer |
| `core.autocrlf input` | Ao commitar, converte CRLF → LF | ⚠️ Ver 3.3 |

### 3.3 Por que `core.autocrlf input` ⚠️

Windows termina linha com `\r\n`; Linux, com `\n`. O servidor do M16 é Linux.

Um `.sh` que vá para o Git com CRLF faz o servidor ler `#!/usr/bin/env bash\r`, procurar um
interpretador chamado `bash\r`, não achar, e o deploy morre com:

```
bash: ./build.sh: /usr/bin/env: bad interpreter: No such file or directory
```

Nada nessa mensagem sugere "finais de linha". É meia hora de depuração garantida.

`core.autocrlf input` resolve **na sua máquina**; o `.gitattributes` do passo 9 resolve
**para a equipe inteira**.

### 3.4 Chave SSH

```powershell
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

| Trecho | O que faz |
|---|---|
| `ssh-keygen` | Gera um par de chaves: a privada fica na sua máquina, a pública você entrega ao GitHub |
| `-t ed25519` | Algoritmo recomendado hoje — mais curto e mais seguro que RSA |
| `-C "..."` | Comentário gravado na chave, para você a identificar depois na lista do GitHub |

`Enter` nas três perguntas. Depois copie a chave **pública**:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

| Trecho | O que faz |
|---|---|
| `$env:USERPROFILE` | Caminho da sua pasta de usuário — evita digitar seu nome |
| `.pub` | A chave **pública**, que pode ser divulgada. **Nunca** copie o arquivo sem `.pub` |
| `\| Set-Clipboard` | Manda para a área de transferência |

No navegador: **github.com → Settings → SSH and GPG keys → New SSH key** → cole → nomeie →
*Add SSH key*. Teste:

```powershell
ssh -T git@github.com
```

**Deu certo se:** respondeu `Hi <seu-usuario>! You've successfully authenticated, but GitHub
does not provide shell access.` — a segunda metade **não é erro**, é o esperado.

---

## Passo 4 — Node.js e pnpm

### 4.1 Instalar o Node 20 LTS

```powershell
winget install --id OpenJS.NodeJS.LTS
```

Ou baixe o `.msi` em <https://nodejs.org> e escolha **LTS** (o botão da esquerda).

**Feche e reabra o terminal.**

```powershell
node --version
npm --version
```

**Deu certo se:** `node --version` responde `v20.x` ou superior.

> **E o `fnm`/`nvm`?** São gerenciadores de versão. No Windows exigem um passo extra —
> adicionar uma linha ao seu perfil do PowerShell — sem o qual a versão escolhida **não
> sobrevive ao fechar o terminal**, sintoma que parece desinstalação aleatória. Para uma
> disciplina com uma única versão de Node, o instalador oficial é mais simples. Se você já
> usa `fnm`, rode `fnm env --use-on-cd | Out-String | Invoke-Expression` e ponha essa linha
> no arquivo em `$PROFILE`.

### 4.2 Habilitar o pnpm

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

| Linha | O que faz |
|---|---|
| `corepack enable` | O Corepack vem com o Node 20 e cria os atalhos de `pnpm` sem instalar nada |
| `corepack prepare pnpm@latest --activate` | Baixa a última versão e a marca como ativa |

**Se falhar com `EPERM` ou erro de link simbólico:** o Windows exige privilégio para criar
links simbólicos fora do Modo de Desenvolvedor. Saída mais simples:

```powershell
npm install -g pnpm
```

**Deu certo se:** `pnpm --version` responde `9.x` ou superior.

> **Por que pnpm e não npm?** Instala mais rápido e usa muito menos disco, porque guarda os
> pacotes num único armazém e liga cada projeto a ele — diferença sentida num laboratório
> com 40 máquinas, e ainda maior num monorepo com duas árvores de dependências. Ele também
> é quem gerencia os *workspaces* do M03. Tudo funciona com `npm`, mas os workspaces exigem
> configuração diferente.

### 4.3 Excluir a pasta do antivírus ⚠️

O Windows Defender inspeciona cada um dos milhares de arquivos que o `pnpm install` cria. O
resultado é uma instalação de minutos em vez de segundos.

**Win** → *Segurança do Windows* → *Proteção contra vírus e ameaças* → *Gerenciar
configurações* → *Adicionar ou remover exclusões* → **Adicionar uma exclusão** → *Pasta* →
`C:\dev`.

> Excluir uma pasta do antivírus é uma decisão consciente: você está dizendo que confia no
> que baixa ali. Vale para `C:\dev`, não para a máquina inteira.

### 4.4 Caminhos longos ⚠️

Num monorepo, `node_modules` aninhado passa fácil dos 260 caracteres que o Windows aceita
por padrão. Num PowerShell **como administrador**:

```powershell
git config --system core.longpaths true
```

Ative também *Long Paths* no Windows (Editor de Política de Grupo ou registro). O sintoma
sem isto é `Filename too long` no meio de um `pnpm install`, sem indicar o motivo real.

---

## Passo 5 — VS Code

```powershell
winget install --id Microsoft.VisualStudioCode --scope user
```

**Agora, duas extensões:**

```powershell
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

| Extensão | Para quê |
|---|---|
| **ESLint** | Lint de TypeScript nas duas camadas |
| **Prettier** | Formatação |

**Depois, quando o módulo pedir** — não instale hoje o que só vai usar em semanas:

| Extensão | Antes do | Para quê |
|---|---|---|
| **SQLite Viewer** | M04 | Ver as tabelas que as entidades geraram |
| **Tailwind CSS IntelliSense** | M09 | Autocomplete de classes — praticamente obrigatória |
| **GitLens** | quando quiser | Histórico e autoria linha a linha |

Crie `C:\dev\bibliocom\.vscode\settings.json`:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "files.eol": "\n",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": { "**/node_modules": true, "**/dist": true }
}
```

| Chave | O que faz |
|---|---|
| `files.eol` | Salva arquivos novos com LF, evitando gerar CRLF que o `.gitattributes` teria de corrigir |
| `typescript.tsdk` | Usa o TypeScript **do projeto**, não o embutido no editor. Sem isto, o editor pode acusar erros que o `tsc` não acusa — e vice-versa |
| `editor.formatOnSave` | Elimina discussão de estilo no code review |

---

## Passo 6 — Dependências do backend

> ⏭️ **Só a partir do M03.** Na semana 1, pule para o [passo 8](#passo-8--verificação).

O M03 conduz a criação do projeto NestJS e do monorepo. O comando central é:

```powershell
pnpm dlx @nestjs/cli new backend --package-manager pnpm --skip-git
```

| Trecho | O que faz |
|---|---|
| `pnpm dlx` | Executa a CLI **sem instalá-la** globalmente. É o `npx` do pnpm |
| `--skip-git` | **Importante:** sem isto, a CLI cria um segundo repositório dentro do seu |

Siga o roteiro do [M03](../modulos/03-nestjs-primeiros-passos/) — os passos e as
explicações estão lá.

---

## Passo 7 — Docker e PostgreSQL

> ⏭️ **Só a partir do M05.** Até o M04 usamos SQLite, que não exige instalação.

### 7.1 Pré-requisito: WSL2

O Docker Desktop no Windows **roda sobre o WSL2**. Num PowerShell **como administrador**:

```powershell
wsl --install
```

**Reinicie o computador.** Na volta, uma janela do Ubuntu pede usuário e senha do Linux —
crie-os e feche.

> Isto não muda o seu fluxo: você continua no PowerShell, e o WSL2 fica só como motor do
> Docker.

**Se falhar** dizendo que a virtualização está desabilitada: é preciso ativar *Intel VT-x*
ou *AMD-V* na BIOS/UEFI. Em notebook institucional isso pode exigir o setor de TI — **avise
o docente com antecedência**.

### 7.2 Docker Desktop

```powershell
winget install --id Docker.DockerDesktop
```

Depois **abra o Docker Desktop pelo menu Iniciar** e espere a baleia estabilizar. O daemon
só responde com o aplicativo aberto — diferente do Linux, onde é serviço de sistema.

### 7.3 Subir o PostgreSQL

`C:\dev\bibliocom\docker-compose.yml`:

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

```powershell
Set-Location C:\dev\bibliocom
docker compose up -d
docker compose ps
```

**Deu certo se:** a coluna de status mostra `healthy` (pode levar ~15 s na primeira vez).

**Se a porta 5432 estiver ocupada:** troque para `"5433:5432"` e ajuste a `DATABASE_URL`.
Para descobrir quem ocupa:

```powershell
Get-NetTCPConnection -LocalPort 5432 | Select-Object OwningProcess
Get-Process -Id <o número que apareceu>
```

---

## Passo 8 — Verificação

```powershell
node C:\dev\dpw\recursos\codigo\verifica-ambiente.mjs
```

> Ajuste o caminho para onde você clonou o repositório do material.

O script confere Node, pnpm, Git configurado, Docker — e, no Windows, também `curl.exe`,
`.gitattributes`, `core.autocrlf`, OneDrive e acentos no caminho. Ele aceita
`--etapa m00|m03|m05` e cobra só o que já deveria existir.

**Só avance com todos os itens da etapa em `OK`.**

### Verificação manual

```powershell
node --version
pnpm --version
git --version
curl.exe --version
```

| Linha | O que faz |
|---|---|
| `curl.exe --version` | ⚠️ O `.exe` faz falta. No PowerShell, `curl` sozinho é apelido de `Invoke-WebRequest`, um comando diferente. Todo `curl` dos roteiros vira `curl.exe` aqui |

---

## Passo 9 — `.gitignore` e `.gitattributes`

Ambos na **raiz** (`C:\dev\bibliocom`), no **primeiro commit**.

> 🪟 **Não crie pelo Bloco de Notas.** Ele acrescenta `.txt` ao salvar e o Explorer esconde
> a extensão: você digita `.gitignore`, ele grava `.gitignore.txt`, a tela mostra
> "`.gitignore`" — e o Git ignora o arquivo. Crie pelo terminal e edite no VS Code:
>
> ```powershell
> New-Item -ItemType File -Path .gitignore, .gitattributes
> code .
> ```
>
> Confira os nomes reais com `Get-ChildItem -Force`.

### 9.1 `.gitignore`

```gitignore
# Node
node_modules/
dist/
.vite/
*.tsbuildinfo
coverage/

# Banco local
*.sqlite
*.sqlite-journal

# Ambiente
.env
.env.*
!.env.example

# Editores
.vscode/
.idea/

# Windows
Thumbs.db
desktop.ini
```

> **Nunca** comite `.env`, `node_modules/` ou o `SESSION_SECRET`. Segredo que entra no
> histórico do Git é segredo vazado — mesmo removido, continua nos commits anteriores.

### 9.2 `.gitattributes` — obrigatório 🪟

```gitattributes
* text=auto eol=lf

*.sh     text eol=lf
*.ts     text eol=lf
*.tsx    text eol=lf
*.json   text eol=lf
*.yml    text eol=lf

*.bat text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
*.pdf binary
```

Vale para **todo mundo que clona o repositório**, inclusive quem nunca configurou
`core.autocrlf`. É por isso que não é opcional: sua equipe tem alguém no Windows — você.

⚠️ **Não** use `echo ... > arquivo` para gerar estes arquivos: no PowerShell 5.1 o `>` grava
em UTF-16 e o Git lê a primeira linha como lixo.

---

## Passo 10 — Rodar o sistema completo

> ⏭️ A partir do **M08**, quando o frontend passa a existir.

Dois servidores, cada um na sua janela. No Windows Terminal, `Ctrl+Shift+T` abre uma aba.

**Terminal 1 — backend (porta 3000):**

```powershell
Set-Location C:\dev\bibliocom\backend
pnpm start:dev
```

**Terminal 2 — frontend (porta 5173):**

```powershell
Set-Location C:\dev\bibliocom\frontend
pnpm dev
```

Abra <http://localhost:5173>. O Vite encaminha `/api` ao NestJS (configurado no M03), então
o navegador vê tudo na mesma origem — o que evita CORS em desenvolvimento e reproduz a
topologia de produção.

`Ctrl+C` para parar. **Se a porta estiver em uso:**

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

---

## Passo 11 — Erros e diagnóstico

### 11.1 Instalação

| Mensagem | Causa | Solução |
|---|---|---|
| `pnpm : não pode ser carregado porque a execução de scripts foi desabilitada` | Política de execução | [Passo 1.2](#12-liberar-a-execução-de-scripts-) |
| `node : O termo 'node' não é reconhecido` | Terminal aberto antes da instalação | Feche e reabra |
| `corepack : EPERM` / erro de link simbólico | Privilégio para links simbólicos | `npm install -g pnpm` |
| `winget : não é reconhecido` | Windows desatualizado | Use os instaladores gráficos |
| `Filename too long` | Limite de 260 caracteres | `git config --system core.longpaths true` ([4.4](#44-caminhos-longos-)) |

### 11.2 Comandos do material que não funcionam como estão

| No material | No PowerShell | Por quê |
|---|---|---|
| `curl -i http://...` | `curl.exe -i http://...` | `curl` é apelido de `Invoke-WebRequest` |
| `NODE_ENV=production node dist/main.js` | `$env:NODE_ENV="production"` <br> `node dist/main.js` | Não existe variável inline. ⚠️ Ela **fica na sessão** — limpe com `Remove-Item Env:\NODE_ENV` |
| `cd backend && pnpm start:dev` | duas linhas separadas | `&&` não existe no PowerShell 5.1. `;` **não** é equivalente: executa o segundo mesmo se o primeiro falhar |
| `grep -r "texto" src/` | `Select-String -Path src\* -Pattern "texto"` | Comandos diferentes |
| `comando > arquivo.json` | `comando \| Out-File -FilePath arquivo.json -Encoding utf8` | O `>` grava UTF-16 no PowerShell 5.1 |
| `comando \` <br> `  --opcao` | `comando` `` ` `` <br> `  --opcao` | Continuação é crase — e **sem espaço depois dela** |

📖 Tabela completa: [`../recursos/comandos-windows.md`](../recursos/comandos-windows.md).

### 11.3 Lentidão e travamentos

| Sintoma | Causa | Solução |
|---|---|---|
| `pnpm install` leva minutos | Antivírus varrendo `node_modules` | Exclua `C:\dev` ([4.3](#43-excluir-a-pasta-do-antivírus-)) |
| Git acusa mudanças que você não fez | Projeto dentro do OneDrive | Mova para `C:\dev` ([0.2](#02-escolha-a-pasta--fora-do-onedrive-sem-espaço-e-sem-acento-)) |
| Arquivo "em uso" e não pode ser apagado | OneDrive ou antivírus | Mesma solução |
| Docker não responde | Docker Desktop fechado | Abra pelo menu Iniciar |
| VS Code acusa erro que o `tsc` não acusa | Versões diferentes de TypeScript | `"typescript.tsdk"` no `settings.json` ([Passo 5](#passo-5--vs-code)) |

### 11.4 Acentos quebrados no terminal

```powershell
chcp 65001
```

Troca a página de código do console para UTF-8, só na sessão atual. Solução permanente: use
o **Windows Terminal**.

---

## Se travar

1. Confira se o comando cai na tabela [11.2](#112-comandos-do-material-que-não-funcionam-como-estão).
2. Procure o equivalente em [`../recursos/comandos-windows.md`](../recursos/comandos-windows.md).
3. Ainda travou? **Abra o Git Bash** (instalado com o Git) e cole o comando original.
4. É deploy ou algo específico de Linux? **Use o WSL2** ([7.1](#71-pré-requisito-wsl2)).

E avise o docente: se um roteiro tem comando sem alternativa documentada, **é falha do
material, não sua**.
