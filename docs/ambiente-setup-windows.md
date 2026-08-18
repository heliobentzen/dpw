# Setup do ambiente no Windows 🪟

Guia **completo e independente**. Não é tradução do guia Linux: é o caminho do Windows do
começo ao fim, com **cada linha explicada**. Se você usa Windows, este é o único arquivo de
instalação que precisa abrir — não alterne entre ele e
[`ambiente-setup.md`](ambiente-setup.md) (que é Linux/macOS).

> **Como ler.** Cada passo tem três partes: o **bloco de comandos** (cole inteiro), a
> **tabela linha a linha** (o que cada comando faz) e o **"deu certo se…"** (como conferir
> antes de seguir). Não pule a conferência: no Windows, quase todo erro de setup só aparece
> três aulas depois, disfarçado de outra coisa.

**Tempo:** 60–90 min na primeira vez.

---

## Índice

| Passo | Assunto | Quando |
|---|---|---|
| [0](#passo-0--decisões-antes-de-digitar-qualquer-coisa) | Decisões antes de digitar | agora |
| [1](#passo-1--abrir-o-powershell-e-liberar-scripts) | PowerShell e política de scripts | agora |
| [2](#passo-2--criar-a-pasta-de-trabalho) | Pasta de trabalho | agora |
| [3](#passo-3--instalar-o-python) | Python 3.12 | agora |
| [4](#passo-4--instalar-e-configurar-o-git) | Git + SSH | agora |
| [5](#passo-5--ambiente-virtual-e-dependências-do-backend) | venv + Django/DRF | agora |
| [6](#passo-6--nodejs-e-pnpm-frontend) | Node 20 + pnpm | agora |
| [7](#passo-7--vs-code) | VS Code | agora |
| [8](#passo-8--docker-e-postgresql) | Docker + PostgreSQL | **a partir do M05** |
| [9](#passo-9--verificação-final) | Verificação | agora |
| [10](#passo-10--rodar-o-sistema-completo) | Rodar os dois servidores | a partir do M08 |
| [11](#passo-11--gitignore-e-gitattributes) | `.gitignore` e `.gitattributes` | no primeiro commit |
| [12](#passo-12--erros-e-diagnóstico) | Erros e diagnóstico | quando quebrar |

---

## Passo 0 — Decisões antes de digitar qualquer coisa

Três decisões que, se tomadas erradas agora, custam horas depois. Nenhuma delas é sobre
comando: é sobre **onde** e **em que shell** você vai trabalhar.

### 0.1 Escolha o terminal — e fique com ele

| Caminho | O que é | Recomendação |
|---|---|---|
| **PowerShell** | O terminal nativo do Windows | ✅ **É o que este guia usa.** Escolha este |
| **Git Bash** | Um shell Unix que vem junto com o Git | Alternativa: os comandos do guia Linux funcionam como estão |
| **WSL2 (Ubuntu)** | Um Linux completo dentro do Windows | Instale antes do **M16 (deploy)**, não agora |

**Não misture.** Um `.venv` criado no PowerShell não ativa no Git Bash da mesma forma, e um
criado no WSL2 **não funciona no Windows de jeito nenhum** (são sistemas de arquivos e
binários diferentes). Escolha um, faça a disciplina inteira nele.

Se você não tem preferência: **PowerShell**. É o que a sua máquina já tem, é o que aparece
no VS Code por padrão, e é o que este guia detalha.

### 0.2 Escolha a pasta — fora do OneDrive, sem espaço e sem acento ⚠️

Esta é a causa nº 1 de problemas inexplicáveis no Windows e **nenhum tutorial avisa**.

| ❌ Evite | Por quê |
|---|---|
| `C:\Users\João Silva\Documents\projetos` | O `Documents` costuma ser **sincronizado pelo OneDrive**. O OneDrive vai tentar subir as ~30.000 arquivinhos de `node_modules` e `.venv` para a nuvem: o `pnpm install` trava, o Git acusa mudanças fantasma e arquivos ficam bloqueados em uso |
| `C:\Users\João Silva\dev` | O **espaço** em "João Silva" quebra ferramentas que não põem aspas nos caminhos |
| `C:\Users\João Silva\dev` | O **acento** em "João" quebra ferramentas que assumem ASCII |
| `C:\Users\...\Área de Trabalho\...` | Espaço **e** acento |

| ✅ Use | Por quê |
|---|---|
| `C:\dev` | Curto (ajuda no limite de 260 caracteres), sem espaço, sem acento, fora do OneDrive |

Se o seu `Documents` está no OneDrive (é o padrão em máquina nova e em conta institucional),
**não** basta pausar a sincronização — coloque o projeto em `C:\dev` e pronto. Criamos essa
pasta no Passo 2.

### 0.3 Saiba o que você **não** vai instalar

Para não perder tempo procurando:

- **PostgreSQL nativo:** não instale. Usaremos um container Docker (Passo 8), a partir do M05.
- **Gunicorn:** não roda no Windows (depende de módulos POSIX que não existem aqui). No M16
  usaremos o **Waitress** para a verificação local; o Gunicorn continua no servidor, que é Linux.
- **`make`:** não existe no Windows e não é usado neste material.

---

## Passo 1 — Abrir o PowerShell e liberar scripts

### 1.1 Abrir o PowerShell

Tecle `Win`, digite `powershell`, e abra o **Windows PowerShell**.

> Se você tem o **Windows Terminal** (padrão no Windows 11), use-o: ele lida melhor com
> acentos e emojis, e permite abas — útil no Passo 10, em que precisamos de dois terminais.

### 1.2 Descobrir a sua versão

```powershell
$PSVersionTable.PSVersion
```

| Linha | O que faz |
|---|---|
| `$PSVersionTable.PSVersion` | Lê a variável automática `$PSVersionTable` (uma tabela com dados da instalação) e mostra o campo `PSVersion` |

**Deu certo se:** apareceu uma tabela com `Major`, `Minor`, `Build`, `Revision`.

**Anote o número em `Major`.** Ele muda o que funciona:

| `Major` | Significa | Consequência prática |
|---|---|---|
| **5** | PowerShell 5.1, o que vem com o Windows | O operador `&&` **não existe**; `>` grava arquivo em UTF-16 (ver 5.4) |
| **7** ou mais | PowerShell 7, instalado à parte | `&&` funciona; `>` grava em UTF-8 |

Este guia funciona nos dois. Onde houver diferença, ela está sinalizada com ⚠️.

> **Quer o PowerShell 7?** É opcional, mas torna sua vida parecida com a de quem usa Linux:
> ```powershell
> winget install Microsoft.PowerShell
> ```
> Depois **feche e abra** o terminal — o novo se chama "PowerShell", sem o "Windows" na frente.

### 1.3 Liberar a execução de scripts ⚠️

Faça isto **agora**, não quando der erro. Por padrão o Windows bloqueia a execução de
scripts `.ps1` — e o ativador do ambiente virtual (Passo 5) é um `.ps1`. Sem isto, o Passo 5
falha com `Activate.ps1 cannot be loaded because running scripts is disabled`.

```powershell
Get-ExecutionPolicy -Scope CurrentUser
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Linha | O que faz |
|---|---|
| `Get-ExecutionPolicy -Scope CurrentUser` | Mostra a política atual. `Undefined` ou `Restricted` = scripts bloqueados |
| `Set-ExecutionPolicy` | Muda a política |
| `-Scope CurrentUser` | Aplica **só ao seu usuário**. Sem isto o comando exige terminal de administrador e altera a máquina toda — desnecessário e mais invasivo |
| `-ExecutionPolicy RemoteSigned` | Permite rodar scripts que **você** criou localmente; scripts **baixados da internet** continuam exigindo assinatura digital. É o meio-termo seguro |

Confirme com `S` (ou `Y`) quando perguntar.

**Deu certo se:** rodar `Get-ExecutionPolicy -Scope CurrentUser` de novo responde `RemoteSigned`.

> **Por que não `Unrestricted` ou `Bypass`?** Porque desligam a proteção contra scripts
> baixados — exatamente o vetor que a política existe para conter. `RemoteSigned` resolve o
> nosso caso (scripts locais) sem abrir o resto.

### 1.4 Desligar os atalhos falsos de Python ⚠️

O Windows vem com **stubs** de `python.exe` e `python3.exe` que não são o Python: são
atalhos que **abrem a Microsoft Store**. Se você digitar `python` antes de instalar de
verdade, a Store abre e o terminal não responde nada — sintoma que confunde muita gente, e
que também atrapalha *depois* de instalar, porque o stub pode ter prioridade no PATH.

**Desligue agora:**

1. `Win` → digite `alias` → abra **"Gerenciar aliases de execução de aplicativo"**
   (*Manage app execution aliases*).
2. **Desative** `python.exe` e `python3.exe` (os que dizem *App Installer*).

Não há comando para isso — é interface gráfica mesmo.

---

## Passo 2 — Criar a pasta de trabalho

```powershell
New-Item -ItemType Directory -Force -Path C:\dev
Set-Location C:\dev
```

| Linha | O que faz |
|---|---|
| `New-Item` | Cria um item no sistema de arquivos |
| `-ItemType Directory` | O item é uma pasta (o padrão seria arquivo) |
| `-Force` | Não reclama se a pasta já existir. Sem isto, rodar duas vezes dá erro |
| `-Path C:\dev` | Onde criar |
| `Set-Location C:\dev` | Entra na pasta. É o `cd` do PowerShell — na verdade `cd` **é** apelido de `Set-Location`, então `cd C:\dev` faz o mesmo e é mais curto |

**Deu certo se:** o prompt agora começa com `PS C:\dev>`.

> **Por que `New-Item` e não `mkdir`?** `mkdir` funciona (é apelido de `New-Item -ItemType Directory`),
> mas não aceita `-Force` da mesma forma em todas as versões. Como você vai repetir estes
> comandos e reinstalar coisas, a forma idempotente evita erro bobo.

---

## Passo 3 — Instalar o Python

### 3.1 Instalar

Duas opções. A primeira é mais rápida se você tem o `winget` (Windows 10 21H1+ e Windows 11):

```powershell
winget install --id Python.Python.3.12 --scope user
```

| Trecho | O que faz |
|---|---|
| `winget install` | Gerenciador de pacotes oficial da Microsoft |
| `--id Python.Python.3.12` | Identifica o pacote **exato**. Sem o `--id`, o winget faz busca por nome e pode oferecer outro pacote |
| `--scope user` | Instala só para o seu usuário — não exige administrador e evita conflito com um Python instalado pela instituição |

**Alternativa gráfica** (se o winget não existir ou falhar): baixe em
<https://www.python.org/downloads/> a versão **3.12 ou superior** e, na **primeira tela do
instalador**, marque **"Add python.exe to PATH"** antes de clicar em *Install Now*.

> ⚠️ Essa caixinha é o erro nº 1 da turma. Se você esquecer, o Windows não encontra o
> `python` e a única saída limpa é rodar o instalador de novo em *Modify* → *Repair*.

### 3.2 Fechar e reabrir o terminal

**Obrigatório.** O PATH é lido quando o terminal abre; um terminal já aberto não enxerga o
Python recém-instalado. Feche a janela e abra outra.

### 3.3 Conferir

```powershell
python --version
py -0
```

| Linha | O que faz |
|---|---|
| `python --version` | Mostra a versão do Python que está no PATH |
| `py -0` | Lista **todos** os Pythons instalados na máquina. O `py` é o *Python Launcher for Windows*, instalado junto com o Python. O marcador `*` indica o padrão |

**Deu certo se:** `python --version` respondeu `Python 3.12.x` (ou superior).

**Se abriu a Microsoft Store:** você pulou o Passo 1.4. Volte e desative os aliases.

**Se disse `command not found` / `não é reconhecido`:** o PATH não foi configurado. Use o
`py`, que funciona mesmo sem PATH, e prefixe os comandos deste guia:

```powershell
py -3.12 --version
```

---

## Passo 4 — Instalar e configurar o Git

### 4.1 Instalar

```powershell
winget install --id Git.Git --scope user
```

Ou baixe em <https://git-scm.com/download/win>. **Aceite todos os padrões do instalador** —
eles já incluem o Git Bash e o OpenSSH.

Feche e reabra o terminal.

### 4.2 Configurar identidade e comportamento

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
| `git --version` | Confere a instalação | Deve responder `git version 2.x` |
| `user.name` | Nome que aparece em cada commit | Sem isto o Git recusa criar commits |
| `user.email` | E-mail do commit | **Use o mesmo e-mail da sua conta no GitHub**, senão os commits não são atribuídos a você no perfil |
| `init.defaultBranch main` | Novos repositórios nascem com a branch `main` | O padrão antigo era `master`; o GitHub usa `main` |
| `pull.rebase false` | `git pull` faz *merge*, não *rebase* | Evita que a turma caia num rebase interativo sem saber o que fazer |
| `core.autocrlf input` | Ao **commitar**, converte CRLF → LF; ao **baixar**, não converte nada | ⚠️ Ver 4.3 |

O `--global` grava em `C:\Users\<você>\.gitconfig` e vale para todos os seus repositórios.

### 4.3 Por que `core.autocrlf input` ⚠️

Windows termina linha com dois caracteres (`\r\n`, "CRLF"); Linux com um (`\n`, "LF"). O
servidor onde vamos publicar no M16 é Linux.

Se um arquivo `build.sh` for para o Git com CRLF, o servidor lê a primeira linha como
`#!/usr/bin/env bash\r`, procura um interpretador chamado `bash\r`, não acha, e o deploy
morre com:

```
bash: ./build.sh: /usr/bin/env: bad interpreter: No such file or directory
```

Nada nessa mensagem sugere "finais de linha". É meia hora de depuração garantida.

`core.autocrlf input` resolve **na sua máquina**. No Passo 11 criamos o `.gitattributes`,
que resolve **para a equipe inteira** — inclusive para quem não configurou nada.

### 4.4 Chave SSH (evita digitar senha a cada `push`)

```powershell
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

| Trecho | O que faz |
|---|---|
| `ssh-keygen` | Gera um par de chaves: uma privada (fica na sua máquina) e uma pública (você entrega ao GitHub) |
| `-t ed25519` | Algoritmo da chave. Ed25519 é o recomendado hoje — mais curto e mais seguro que RSA |
| `-C "seu-email@..."` | Comentário gravado dentro da chave. Serve só para você identificá-la depois na lista do GitHub |

Pressione `Enter` nas três perguntas (local padrão e senha vazia). Local padrão =
`C:\Users\<você>\.ssh\id_ed25519`.

> **Senha vazia é aceitável aqui?** Numa máquina pessoal de uso didático, sim — é o
> compromisso que este guia adota para não travar a turma. Em máquina compartilhada ou de
> laboratório, **ponha uma senha** e leia o quadro do 4.5.

Agora copie a chave **pública** e cadastre no GitHub:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

| Trecho | O que faz |
|---|---|
| `Get-Content` | Lê o conteúdo do arquivo (é o `cat` do PowerShell) |
| `$env:USERPROFILE` | Variável de ambiente com o caminho da sua pasta de usuário (`C:\Users\<você>`). Usar a variável evita digitar seu nome de usuário |
| `.ssh\id_ed25519.pub` | O arquivo `.pub` é a chave **pública** — a que pode ser divulgada. **Nunca** copie o arquivo sem `.pub` |
| `\| Set-Clipboard` | Manda o conteúdo para a área de transferência |

No navegador: **github.com → Settings → SSH and GPG keys → New SSH key** → cole (`Ctrl+V`) →
dê um nome (ex.: "Notebook da faculdade") → *Add SSH key*.

Teste:

```powershell
ssh -T git@github.com
```

Digite `yes` quando perguntar sobre a autenticidade do host (é normal, só na primeira vez).

**Deu certo se:** respondeu `Hi <seu-usuario>! You've successfully authenticated, but GitHub
does not provide shell access.` — a segunda metade da frase **não é erro**, é o esperado.

### 4.5 Só se você pôs senha na chave: ligar o `ssh-agent`

No Windows o serviço `ssh-agent` vem **desativado**, então a senha da chave seria pedida a
cada `push`. Abra o PowerShell **como administrador** (`Win` → digite `powershell` →
`Ctrl+Shift+Enter`) e rode:

```powershell
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

Depois, no terminal normal:

```powershell
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

| Linha | O que faz |
|---|---|
| `Set-Service -StartupType Automatic` | Faz o serviço subir junto com o Windows |
| `Start-Service ssh-agent` | Sobe agora, sem esperar o próximo boot |
| `ssh-add <caminho da chave privada>` | Entrega a chave ao agente, que passa a responder pelas senhas |

---

## Passo 5 — Ambiente virtual e dependências do backend

### 5.1 Por que ambiente virtual

Sem ele, todo pacote vai para o Python global e os projetos brigam: o projeto A precisa de
Django 4.2, o B de Django 5.1, e um sobrescreve o outro. O `venv` cria uma pasta com um
Python e uma biblioteca só daquele projeto. **Um projeto, um ambiente.**

### 5.2 Criar a estrutura e o ambiente

```powershell
New-Item -ItemType Directory -Force -Path C:\dev\bibliocom\backend
Set-Location C:\dev\bibliocom\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

| Linha | O que faz |
|---|---|
| `New-Item ... -Path C:\dev\bibliocom\backend` | Cria a pasta do backend. Com `-Force`, cria também a `bibliocom` intermediária |
| `Set-Location ...` | Entra nela |
| `python -m venv .venv` | Roda o **módulo** `venv` do Python (`-m`) para criar o ambiente na pasta `.venv`. O nome com ponto na frente é convenção: some da listagem e já está no `.gitignore` |
| `.\.venv\Scripts\Activate.ps1` | **Ativa** o ambiente |

Três detalhes do ativador que geram dúvida:

| Detalhe | Explicação |
|---|---|
| `.\` no começo | O PowerShell **não executa** nada da pasta atual sem caminho explícito, por segurança (evita que um `ls.ps1` malicioso na pasta seja executado no lugar do comando `ls`) |
| `Scripts`, não `bin` | No Linux o executável fica em `.venv/bin/`; no Windows, em `.venv\Scripts\`. É a diferença de layout que mais confunde quem alterna entre os dois |
| `Activate.ps1` | É a versão PowerShell. Existem também `activate.bat` (CMD) e `activate` (Git Bash) na mesma pasta — use a que combina com o seu terminal |

**Deu certo se:** o prompt passou a mostrar `(.venv)` na frente:

```
(.venv) PS C:\dev\bibliocom\backend>
```

⚠️ **Se `(.venv)` não aparecer, PARE.** Tudo que você instalar daqui em diante vai para o
Python global, e o erro só se manifesta lá na frente, quando o projeto não rodar na máquina
de outra pessoa. Se falhou com `cannot be loaded`, volte ao [Passo 1.3](#13-liberar-a-execução-de-scripts-).

Para sair do ambiente, algum dia: `deactivate`.

> **Toda vez que abrir um terminal novo, você precisa ativar de novo.** O ambiente vale
> para aquela janela, não para a máquina. É a segunda causa mais comum de
> `ModuleNotFoundError: No module named 'django'`.

### 5.3 Instalar as dependências

```powershell
python -m pip install --upgrade pip
pip install "django>=5.0,<6.0" djangorestframework django-cors-headers python-dotenv dj-database-url drf-spectacular
```

| Trecho | O que faz |
|---|---|
| `python -m pip` | Chama o pip **através do Python ativo**. Garante que é o pip do `.venv`, e não outro que esteja no PATH. Escrever `pip` direto quase sempre dá no mesmo, mas quando não dá, o erro é obscuro |
| `--upgrade pip` | Atualiza o próprio pip. O `venv` costuma criar o ambiente com uma versão antiga |
| `"django>=5.0,<6.0"` | Fixa a faixa de versão: 5.x sim, 6.0 não. As **aspas** são obrigatórias, senão o PowerShell interpreta o `>` como redirecionamento para arquivo e cria um arquivo chamado `=5.0,` |
| `djangorestframework` | Camada de API (usada do M03 em diante) |
| `django-cors-headers` | Libera o navegador a chamar a API de outra origem (M02, M16) |
| `python-dotenv` | Lê variáveis do arquivo `.env` |
| `dj-database-url` | Converte a `DATABASE_URL` da hospedagem em configuração do Django (M16) |
| `drf-spectacular` | Gera o schema OpenAPI, de onde saem os tipos do frontend (M07) |

Repare que **está tudo em uma linha só**. Se quiser quebrar em várias, use a **crase**
(`` ` ``) no fim de cada linha:

```powershell
pip install "django>=5.0,<6.0" djangorestframework `
            django-cors-headers python-dotenv
```

⚠️ A crase precisa ser **o último caractere da linha**. Um único espaço depois dela e o
PowerShell trata a linha como terminada — e o comando roda pela metade, sem erro visível.
Como isso é difícil de ver na tela, **este material usa linha única** nos comandos de
instalação.

### 5.4 Congelar as dependências — o erro do `>` ⚠️

Esta é a armadilha mais cara deste passo, e a mais silenciosa.

```powershell
pip freeze | Out-File -FilePath requirements.txt -Encoding ascii
```

| Trecho | O que faz |
|---|---|
| `pip freeze` | Lista os pacotes instalados no ambiente, com a versão exata de cada um |
| `\| Out-File` | Grava a saída num arquivo |
| `-FilePath requirements.txt` | O nome padrão que o `pip install -r` procura |
| `-Encoding ascii` | **A parte que importa.** Força texto puro de 1 byte por caractere |

⚠️ **Por que não usar `pip freeze > requirements.txt`?**

No **PowerShell 5.1** (o que vem no Windows), o operador `>` grava o arquivo em **UTF-16**,
com dois bytes por caractere e um marcador BOM no início. O arquivo *parece* normal quando
aberto no editor, mas o `pip` lê a primeira linha como lixo e falha:

```
ERROR: Invalid requirement: 'ÿþd'
```

Ou, pior, o arquivo simplesmente não instala nada e ninguém entende por quê. O sintoma
aparece na máquina do **colega**, dias depois, quando ele clona o repositório.

No PowerShell 7 o `>` já grava UTF-8 e o problema não existe — mas como você não sabe em
qual versão o colega está, **use sempre a forma com `Out-File -Encoding ascii`**. Funciona
nos dois.

O mesmo cuidado vale para **qualquer** `>` que gere arquivo de texto lido por outra
ferramenta (`.env`, `.txt`, `.json`).

**Deu certo se:** o comando abaixo mostra os pacotes de forma legível, uma linha cada:

```powershell
Get-Content requirements.txt
```

---

## Passo 6 — Node.js e pnpm (frontend)

### 6.1 Instalar o Node 20 LTS

```powershell
winget install --id OpenJS.NodeJS.LTS
```

Ou baixe o instalador `.msi` em <https://nodejs.org> e escolha a versão **LTS** (o botão da
esquerda). Aceite os padrões.

**Feche e reabra o terminal** (de novo: PATH).

> **E o `fnm`/`nvm`, que o guia Linux recomenda?** São gerenciadores de versão do Node. No
> Windows eles exigem um passo extra: adicionar uma linha ao seu *perfil* do PowerShell,
> senão a versão escolhida **não sobrevive ao fechar o terminal** — sintoma que parece
> desinstalação aleatória. Para uma disciplina que usa uma única versão do Node, o
> instalador oficial é mais simples e não tem essa pegadinha. Se você já usa `fnm`, siga com
> ele: rode `fnm env --use-on-cd | Out-String | Invoke-Expression` e adicione essa mesma
> linha ao arquivo em `$PROFILE`.

### 6.2 Conferir

```powershell
node --version
npm --version
```

**Deu certo se:** `node --version` respondeu `v20.x` ou superior.

### 6.3 Habilitar o pnpm

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

| Linha | O que faz |
|---|---|
| `corepack enable` | O Corepack vem junto com o Node 20. Ele cria os atalhos de `pnpm` e `yarn` sem precisar instalar nada |
| `corepack prepare pnpm@latest --activate` | Baixa a última versão do pnpm e a marca como a ativa |
| `pnpm --version` | Confere. Deve responder `9.x` ou superior |

**Se `corepack enable` falhar com `EPERM` ou erro de link simbólico:** o Windows exige
privilégio para criar links simbólicos fora do Modo de Desenvolvedor. Duas saídas — a
segunda é mais simples:

```powershell
npm install -g pnpm
```

| Linha | O que faz |
|---|---|
| `npm install -g pnpm` | Instala o pnpm globalmente pelo npm, sem depender de link simbólico |

**Deu certo se:** `pnpm --version` responde um número.

> **Por que pnpm e não npm?** Instala mais rápido e usa muito menos disco, porque guarda os
> pacotes num único armazém e liga cada projeto a ele — diferença sentida num laboratório
> com 40 máquinas. Tudo neste material funciona com `npm`: troque `pnpm` por `npm` e
> `pnpm dlx` por `npx`.

### 6.4 Excluir a pasta do antivírus ⚠️

O Windows Defender inspeciona cada um dos milhares de arquivos que o `pnpm install` cria.
O resultado é uma instalação que leva minutos em vez de segundos, e um `runserver` que
demora a recarregar.

**Win** → *Segurança do Windows* → *Proteção contra vírus e ameaças* → *Gerenciar
configurações* → *Adicionar ou remover exclusões* → **Adicionar uma exclusão** → *Pasta* →
`C:\dev`.

> Excluir uma pasta de projeto do antivírus é uma decisão consciente: você está dizendo que
> confia no que baixa ali. Vale para `C:\dev`, não para a máquina inteira.

---

## Passo 7 — VS Code

### 7.1 Instalar

```powershell
winget install --id Microsoft.VisualStudioCode --scope user
```

### 7.2 Extensões

| Extensão | Camada | Para quê |
|---|---|---|
| **Python** (Microsoft) | 🔵 | Interpretador, depurador |
| **Ruff** (Astral) | 🔵 | Lint e formatação Python |
| **ESLint** | 🟣 | Lint JavaScript/TypeScript |
| **Prettier** | 🟣 | Formatação |
| **Tailwind CSS IntelliSense** | 🟣 | Autocomplete de classes — praticamente obrigatória |
| **SQLite Viewer** | 🔵 | Abrir o `db.sqlite3` |
| **GitLens** | ambos | Histórico e autoria linha a linha |

Instale pela interface (`Ctrl+Shift+X`) ou pelo terminal:

```powershell
code --install-extension ms-python.python
code --install-extension charliermarsh.ruff
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### 7.3 Configurar o projeto ⚠️

Crie `C:\dev\bibliocom\.vscode\settings.json` com:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}\\backend\\.venv\\Scripts\\python.exe",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "files.eol": "\n",
  "editor.formatOnSave": true,
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "files.exclude": { "**/__pycache__": true, "**/*.pyc": true, "**/node_modules": true }
}
```

| Chave | O que faz |
|---|---|
| `python.defaultInterpreterPath` | Aponta para o Python **do ambiente virtual**. ⚠️ No Windows o caminho é `.venv\Scripts\python.exe` — em tutoriais Linux aparece `.venv/bin/python`, que **não existe aqui**. Com o caminho errado, o VS Code sublinha `import django` como erro mesmo com tudo instalado |
| `terminal.integrated.defaultProfile.windows` | Faz o terminal embutido abrir no PowerShell, o mesmo shell deste guia |
| `files.eol` | Salva arquivos novos com LF, evitando gerar CRLF que o `.gitattributes` teria de corrigir depois |
| `editor.formatOnSave` | Formata ao salvar — elimina discussão de estilo no code review |
| `files.exclude` | Some com pastas geradas da barra lateral |

**Deu certo se:** abrindo `C:\dev\bibliocom` no VS Code (`code C:\dev\bibliocom`), a barra
inferior mostra o interpretador com `(.venv)` no nome.

---

## Passo 8 — Docker e PostgreSQL

> ⏭️ **Só é necessário a partir do M05.** Se você está fazendo o M00, pule para o
> [Passo 9](#passo-9--verificação-final). Até o M04 usamos SQLite, que não exige instalação.

### 8.1 Pré-requisito: WSL2

O Docker Desktop no Windows **roda sobre o WSL2**. Instale-o primeiro, em um PowerShell
**como administrador**:

```powershell
wsl --install
```

| Linha | O que faz |
|---|---|
| `wsl --install` | Habilita os recursos do Windows necessários, instala o WSL2 e o Ubuntu |

**Reinicie o computador.** Na volta, uma janela do Ubuntu pede um usuário e senha do Linux
— crie-os (não precisa ser igual ao do Windows) e feche.

> **Isso não muda o seu fluxo de trabalho.** Você continua no PowerShell; o WSL2 fica ali só
> como motor do Docker. Ele volta a ser útil de propósito no M16.

**Se `wsl --install` falhar** dizendo que a virtualização está desabilitada: é preciso ativar
*Intel VT-x* ou *AMD-V* na BIOS/UEFI da máquina. Em notebook institucional, isso pode exigir
o setor de TI — avise o docente com antecedência.

### 8.2 Instalar o Docker Desktop

```powershell
winget install --id Docker.DockerDesktop
```

Depois de instalar, **abra o Docker Desktop pelo menu Iniciar** e espere o ícone da baleia
ficar estável. O daemon só responde com o aplicativo aberto — diferente do Linux, onde é um
serviço de sistema.

### 8.3 Subir o PostgreSQL

Crie `C:\dev\bibliocom\docker-compose.yml`:

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

| Linha | O que faz |
|---|---|
| `docker compose up -d` | Lê o `docker-compose.yml` e sobe os serviços. `-d` (*detached*) devolve o terminal em vez de prender a janela nos logs |
| `docker compose ps` | Lista o que está rodando |

**Deu certo se:** a coluna de status mostra `healthy` (pode levar ~15 s na primeira vez,
enquanto a imagem é baixada).

E instale o driver no ambiente virtual do backend:

```powershell
Set-Location C:\dev\bibliocom\backend
.\.venv\Scripts\Activate.ps1
pip install "psycopg[binary]"
```

| Trecho | O que faz |
|---|---|
| `psycopg` | Driver PostgreSQL do Python |
| `[binary]` | Instala a versão já compilada. Sem isto, o pip tentaria **compilar** o driver, o que no Windows exige o compilador C da Microsoft — instalação de vários GB que ninguém quer. As aspas são necessárias por causa dos colchetes |

**Se a porta 5432 estiver ocupada:** você (ou a instituição) tem um PostgreSQL nativo
rodando. Troque a linha de portas para `"5433:5432"` e use `5433` na `DATABASE_URL`. Para
descobrir quem ocupa:

```powershell
Get-NetTCPConnection -LocalPort 5432 | Select-Object OwningProcess
Get-Process -Id <o número que apareceu>
```

---

## Passo 9 — Verificação final

Com o ambiente virtual **ativo**:

```powershell
Set-Location C:\dev\bibliocom\backend
.\.venv\Scripts\Activate.ps1
python C:\dev\dpw\recursos\codigo\verifica_ambiente.py
```

> Ajuste o caminho para onde você clonou o repositório do material.

O script confere Python, ambiente virtual ativo, Git configurado, Django, DRF, Node, pnpm,
Docker — e, no Windows, também `curl.exe`, `.gitattributes` e `core.autocrlf`.

**Só avance para a primeira aula com todos os itens em `OK`.**

### Verificação manual, se preferir

```powershell
python --version
node --version
pnpm --version
git --version
curl.exe --version
python -c "import django, rest_framework; print(django.get_version(), rest_framework.VERSION)"
```

| Linha | O que faz |
|---|---|
| `curl.exe --version` | ⚠️ O `.exe` **não é enfeite**. No PowerShell, `curl` sozinho é apelido de `Invoke-WebRequest`, um comando diferente com outros parâmetros. Todo `curl` dos roteiros vira `curl.exe` aqui |
| `python -c "..."` | Executa a expressão direto, sem criar arquivo. Prova que Django e DRF estão instalados **neste** ambiente |

---

## Passo 10 — Rodar o sistema completo

> ⏭️ Necessário a partir do **M08**, quando o frontend passa a existir.

São dois servidores, cada um na sua janela. No Windows Terminal, `Ctrl+Shift+T` abre uma aba
nova; no PowerShell clássico, abra outra janela.

**Terminal 1 — backend (Django, porta 8000):**

```powershell
Set-Location C:\dev\bibliocom\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

| Linha | O que faz |
|---|---|
| `Set-Location` | Entra na pasta do backend |
| `.\.venv\Scripts\Activate.ps1` | Ativa o ambiente. **Terminal novo = ativação nova** |
| `python manage.py runserver` | Sobe o servidor de desenvolvimento em <http://localhost:8000> |

**Terminal 2 — frontend (Vite, porta 5173):**

```powershell
Set-Location C:\dev\bibliocom\frontend
pnpm dev
```

| Linha | O que faz |
|---|---|
| `Set-Location` | Entra na pasta do frontend. **Não precisa de venv** — é Node, não Python |
| `pnpm dev` | Sobe o Vite em <http://localhost:5173>, com recarga automática |

Abra <http://localhost:5173> no navegador. O Vite encaminha `/api` ao Django (configurado no
M03), então o navegador vê tudo na mesma origem — o que evita CORS em desenvolvimento e
reproduz a topologia de produção.

Para parar qualquer um dos dois: `Ctrl+C` na janela correspondente.

**Se disser que a porta está em uso:** sobrou um processo de uma execução anterior.

```powershell
Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

| Trecho | O que faz |
|---|---|
| `Get-NetTCPConnection -LocalPort 8000` | Acha a conexão que ocupa a porta |
| `Select-Object -ExpandProperty OwningProcess` | Extrai só o número do processo dono |
| `Stop-Process -Force` | Encerra esse processo |

Ou, mais simples, troque de porta: `python manage.py runserver 8001` / `pnpm dev --port 5174`.

---

## Passo 11 — `.gitignore` e `.gitattributes`

Ambos vão na **raiz** (`C:\dev\bibliocom`) e entram no **primeiro commit**.

### 11.1 `.gitignore`

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

# Windows
Thumbs.db
desktop.ini
```

As duas últimas linhas são específicas do Windows: o Explorer cria esses arquivos sozinho
ao abrir pastas, e eles aparecem no `git status` de quem nunca os criou.

> **Nunca** comite `.env`, `db.sqlite3`, `node_modules/` ou `SECRET_KEY`. Segredo que entra
> no histórico do Git é segredo vazado — mesmo depois de removido, continua nos commits
> anteriores.

### 11.2 `.gitattributes` — obrigatório 🪟

```gitattributes
# normaliza finais de linha no repositório
* text=auto eol=lf

# arquivos que DEVEM ter LF, sempre
*.sh     text eol=lf
*.py     text eol=lf
*.yml    text eol=lf
*.yaml   text eol=lf
Procfile text eol=lf

# arquivos que podem ter CRLF no Windows
*.bat text eol=crlf
*.ps1 text eol=crlf

# binários: não converter nada
*.png binary
*.jpg binary
*.pdf binary
```

| Linha | O que faz |
|---|---|
| `* text=auto eol=lf` | Todo arquivo detectado como texto é gravado no repositório com LF |
| `*.sh text eol=lf` | Reforço explícito para os que **quebram o deploy** se tiverem CRLF |
| `*.bat`, `*.ps1` `eol=crlf` | Scripts do Windows precisam de CRLF para rodar corretamente ao serem baixados |
| `*.png binary` | Impede o Git de tentar "consertar" finais de linha dentro de imagens, o que as corromperia |

O `.gitattributes` vale para **todo mundo que clona o repositório**, inclusive quem nunca
configurou `core.autocrlf`. É por isso que ele não é opcional: sua equipe tem alguém no
Windows — você.

### 11.3 Criar arquivo pelo PowerShell, se preferir o terminal

```powershell
New-Item -ItemType File -Path .gitignore
code .gitignore
```

| Linha | O que faz |
|---|---|
| `New-Item -ItemType File` | Cria o arquivo vazio (é o `touch` do PowerShell) |
| `code .gitignore` | Abre no VS Code para você colar o conteúdo |

⚠️ **Não** use `echo "..." > .gitignore` — cai no mesmo problema de UTF-16 do
[Passo 5.4](#54-congelar-as-dependências--o-erro-do--). Crie pelo editor.

---

## Passo 12 — Erros e diagnóstico

### 12.1 Instalação

| Mensagem | Causa | Solução |
|---|---|---|
| Abre a **Microsoft Store** ao digitar `python` | Alias de execução ativo | [Passo 1.4](#14-desligar-os-atalhos-falsos-de-python-) |
| `python : O termo 'python' não é reconhecido` | Faltou "Add to PATH" na instalação | Reinstale marcando a caixa, ou use `py -3.12` no lugar de `python` |
| `Activate.ps1 cannot be loaded because running scripts is disabled` | Política de execução | [Passo 1.3](#13-liberar-a-execução-de-scripts-) |
| `winget : O termo 'winget' não é reconhecido` | Windows desatualizado | Use os instaladores gráficos indicados em cada passo |
| `corepack : EPERM` / erro de link simbólico | Privilégio para links simbólicos | `npm install -g pnpm` ([6.3](#63-habilitar-o-pnpm)) |

### 12.2 Ambiente virtual

| Sintoma | Causa | Solução |
|---|---|---|
| `(.venv)` não aparece no prompt | Ambiente não ativado | `.\.venv\Scripts\Activate.ps1` — **em todo terminal novo** |
| `ModuleNotFoundError: No module named 'django'` | Ambiente não ativado, ou instalou antes de ativar | Ative e rode `pip install -r requirements.txt` |
| `requirements.txt` com 200 linhas | `pip freeze` rodou fora do ambiente e capturou o Python global | Ative, apague o arquivo e refaça o [5.4](#54-congelar-as-dependências--o-erro-do--) |
| `ERROR: Invalid requirement: 'ÿþd'` | `requirements.txt` gravado em UTF-16 pelo `>` | Refaça com `Out-File -Encoding ascii` ([5.4](#54-congelar-as-dependências--o-erro-do--)) |
| VS Code sublinha `import django` mesmo com tudo instalado | Interpretador apontado para `bin/python` (caminho de Linux) | Corrija para `.venv\Scripts\python.exe` ([7.3](#73-configurar-o-projeto-)) |

### 12.3 Comandos do material que não funcionam como estão

| No material | No PowerShell | Por quê |
|---|---|---|
| `curl -i http://...` | `curl.exe -i http://...` | `curl` é apelido de `Invoke-WebRequest` |
| `DEBUG=False python manage.py check` | `$env:DEBUG="False"` <br> `python manage.py check` | Não existe variável inline. ⚠️ A variável **fica na sessão** — limpe com `Remove-Item Env:\DEBUG` |
| `cd backend && python manage.py runserver` | duas linhas separadas | `&&` não existe no PowerShell 5.1. `;` **não** é equivalente: ele executa o segundo comando mesmo se o primeiro falhar |
| `gunicorn config.wsgi` | `waitress-serve --port=8000 config.wsgi:application` | Gunicorn depende de módulos POSIX inexistentes no Windows |
| `grep -r "texto" pasta/` | `Select-String -Path pasta\* -Pattern "texto"` | Comandos diferentes |
| `pip freeze > requirements.txt` | `pip freeze \| Out-File -FilePath requirements.txt -Encoding ascii` | O `>` grava UTF-16 no PowerShell 5.1 |
| `comando1 \` <br> `  --opcao` | `comando1` `` ` `` <br> `  --opcao` | Continuação de linha é crase, não barra invertida — e não pode haver espaço depois dela |

📖 Tabela completa de equivalências:
[`../recursos/comandos-windows.md`](../recursos/comandos-windows.md).

### 12.4 Lentidão e travamentos

| Sintoma | Causa | Solução |
|---|---|---|
| `pnpm install` leva minutos | Antivírus varrendo `node_modules` | Exclua `C:\dev` do Defender ([6.4](#64-excluir-a-pasta-do-antivírus-)) |
| Git acusa mudanças em arquivos que você não tocou | Projeto dentro do OneDrive | Mova para `C:\dev` ([0.2](#02-escolha-a-pasta--fora-do-onedrive-sem-espaço-e-sem-acento-)) |
| `Filename too long` no `git clone` ou no `pnpm install` | Limite de 260 caracteres | PowerShell como administrador: `git config --system core.longpaths true` |
| Arquivo "em uso" e não pode ser apagado | OneDrive ou antivírus segurando | Mesma solução: pasta fora do OneDrive, excluída do Defender |
| Docker não responde | Docker Desktop fechado | Abra pelo menu Iniciar e espere a baleia estabilizar |

### 12.5 Acentos quebrados no terminal

```powershell
chcp 65001
```

| Linha | O que faz |
|---|---|
| `chcp 65001` | Troca a página de código do console para UTF-8. Vale só para a sessão atual |

Solução permanente: use o **Windows Terminal**, que já é UTF-8.

---

## Se travar

1. Confira se o comando cai em uma das linhas da tabela [12.3](#123-comandos-do-material-que-não-funcionam-como-estão).
2. Procure o equivalente em [`../recursos/comandos-windows.md`](../recursos/comandos-windows.md).
3. Ainda assim travou? **Abra o Git Bash** (instalado junto com o Git) e cole o comando
   original do material. Resolve a maioria dos casos sem tradução.
4. É deploy ou algo específico de Linux? **Use o WSL2** ([8.1](#81-pré-requisito-wsl2)).

E avise o docente: se um roteiro tem comando sem alternativa documentada, **é falha do
material, não sua**.
