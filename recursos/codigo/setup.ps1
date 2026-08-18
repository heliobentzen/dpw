# =============================================================================
#  DPW - Preparacao do ambiente (Windows)
#
#  Uso:
#      .\setup.ps1                    prepara o basico (Git + Python + projeto)
#      .\setup.ps1 -Etapa frontend    acrescenta Node + pnpm       (antes do M03)
#      .\setup.ps1 -Etapa banco       acrescenta Docker/PostgreSQL (antes do M05)
#
#  O script e IDEMPOTENTE: rodar de novo nao quebra nada, so completa o que falta.
#
#  Nota para quem for ler o codigo: as mensagens estao sem acento de proposito.
#  O PowerShell 5.1 le arquivos .ps1 como ANSI quando nao ha BOM, e acentos
#  apareceriam corrompidos no terminal. E a mesma familia de problema que o
#  material discute em "> grava em UTF-16".
# =============================================================================

[CmdletBinding()]
param(
    [ValidateSet("base", "frontend", "banco")]
    [string]$Etapa = "base",

    [string]$Raiz = "C:\dev\bibliocom"
)

$ErrorActionPreference = "Stop"

# No PowerShell 7.4+ um comando externo que sai com codigo != 0 vira excecao.
# Aqui isso atrapalha: "git config --get" sai com 1 quando a chave nao existe,
# o que para nos e informacao, nao falha. Desligamos so esse comportamento.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

# --- Apresentacao ------------------------------------------------------------

function Write-Titulo($texto) {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "  $texto" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

function Write-Passo($texto) { Write-Host "`n> $texto" -ForegroundColor White }
function Write-Ok($texto)    { Write-Host "  [OK]   $texto" -ForegroundColor Green }
function Write-Pulo($texto)  { Write-Host "  [JA]   $texto" -ForegroundColor DarkGray }
function Write-Aviso($texto) { Write-Host "  [!]    $texto" -ForegroundColor Yellow }
function Write-Erro($texto)  { Write-Host "  [ERRO] $texto" -ForegroundColor Red }

function Test-Comando($nome) {
    return [bool](Get-Command $nome -ErrorAction SilentlyContinue)
}

# Instala via winget so se o comando ainda nao existir.
function Install-SeFaltar($comando, $wingetId, $rotulo) {
    if (Test-Comando $comando) {
        Write-Pulo "$rotulo ja instalado"
        return $true
    }
    if (-not (Test-Comando "winget")) {
        Write-Erro "$rotulo nao esta instalado e o winget nao existe nesta maquina."
        Write-Host "         Instale manualmente e rode o script de novo."
        return $false
    }
    Write-Host "  ...    instalando $rotulo (pode levar alguns minutos)"
    winget install --id $wingetId --scope user --accept-source-agreements --accept-package-agreements
    Write-Aviso "$rotulo instalado. FECHE e ABRA o terminal, depois rode o script de novo."
    return $false
}

# =============================================================================
#  Etapa: base  -  Git + Python + estrutura do projeto
# =============================================================================

function Invoke-EtapaBase {
    Write-Titulo "DPW - ambiente basico (Git + Python + projeto)"

    # --- 1. Politica de execucao ---------------------------------------------
    Write-Passo "Politica de execucao de scripts"
    $politica = Get-ExecutionPolicy -Scope CurrentUser
    if ($politica -in @("Restricted", "Undefined")) {
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
        Write-Ok "ajustada para RemoteSigned (permite ativar o ambiente virtual)"
    }
    else {
        Write-Pulo "ja permite scripts locais ($politica)"
    }

    # --- 2. Ferramentas ------------------------------------------------------
    Write-Passo "Ferramentas"
    $pronto = $true
    if (-not (Install-SeFaltar "git"    "Git.Git"                        "Git"))    { $pronto = $false }
    if (-not (Install-SeFaltar "python" "Python.Python.3.12"             "Python")) { $pronto = $false }
    if (-not (Install-SeFaltar "code"   "Microsoft.VisualStudioCode"     "VS Code")) {
        Write-Aviso "VS Code e opcional para o script seguir."
    }
    if (-not $pronto) {
        Write-Host ""
        Write-Aviso "Feche o terminal, abra outro e rode: .\setup.ps1"
        return
    }

    # Confere a versao do Python: o material exige 3.12+
    $versao = (python -c "import sys; print('%d.%d' % sys.version_info[:2])")
    if ([version]$versao -lt [version]"3.12") {
        Write-Erro "Python $versao encontrado; o material precisa de 3.12 ou superior."
        return
    }
    Write-Ok "Python $versao"

    # --- 3. Identidade no Git ------------------------------------------------
    Write-Passo "Identidade do Git"
    $nome  = (git config --global user.name)
    $email = (git config --global user.email)
    if ([string]::IsNullOrWhiteSpace($nome)) {
        $nome = Read-Host "  Seu nome completo"
        git config --global user.name $nome
    }
    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = Read-Host "  Seu e-mail (o MESMO da conta do GitHub)"
        git config --global user.email $email
    }
    git config --global init.defaultBranch main
    git config --global pull.rebase false
    git config --global core.autocrlf input
    Write-Ok "$nome <$email>, autocrlf=input, branch padrao main"

    # --- 4. Pasta do projeto -------------------------------------------------
    Write-Passo "Pasta do projeto"
    if ($Raiz -match "OneDrive") {
        Write-Aviso "O caminho contem OneDrive. A sincronizacao trava o Git e o pnpm."
        Write-Host  "         Use: .\setup.ps1 -Raiz C:\dev\bibliocom"
    }
    New-Item -ItemType Directory -Force -Path "$Raiz\backend" | Out-Null
    Write-Ok $Raiz

    # --- 5. Repositorio ------------------------------------------------------
    Write-Passo "Repositorio Git"
    if (Test-Path "$Raiz\.git") {
        Write-Pulo "repositorio ja existe"
    }
    else {
        git -C $Raiz init --quiet
        Write-Ok "git init"
    }

    # --- 6. Arquivos da raiz -------------------------------------------------
    #  Escritos pelo script justamente para evitar o Bloco de Notas, que grava
    #  ".gitignore.txt" sem avisar. Conteudo em ASCII: sem BOM, sem surpresa.
    Write-Passo "Arquivos de configuracao"
    New-Arquivo "$Raiz\.gitignore"     (Get-ConteudoGitignore)
    New-Arquivo "$Raiz\.gitattributes" (Get-ConteudoGitattributes)

    # --- 7. Ambiente virtual -------------------------------------------------
    Write-Passo "Ambiente virtual"
    $venv = "$Raiz\backend\.venv"
    $py   = "$venv\Scripts\python.exe"
    if (Test-Path $py) {
        Write-Pulo "ambiente virtual ja existe"
    }
    else {
        python -m venv $venv
        Write-Ok "criado em backend\.venv"
    }

    # Usamos o python DE DENTRO do .venv. Assim nao dependemos de "ativar":
    # ativacao vale so para a janela atual, e o script roda em outra.
    Write-Passo "Dependencias do backend"
    & $py -m pip install --upgrade pip --quiet
    & $py -m pip install --quiet "django>=5.0,<6.0" djangorestframework django-cors-headers python-dotenv dj-database-url drf-spectacular
    & $py -m pip freeze | Out-File -FilePath "$Raiz\backend\requirements.txt" -Encoding ascii
    Write-Ok "Django, DRF e apoio instalados; requirements.txt gerado"

    Write-Resumo-Base
}

# =============================================================================
#  Etapa: frontend  -  Node + pnpm (necessario a partir do M03)
# =============================================================================

function Invoke-EtapaFrontend {
    Write-Titulo "DPW - ambiente do frontend (Node + pnpm)"

    if (-not (Install-SeFaltar "node" "OpenJS.NodeJS.LTS" "Node.js")) { return }

    $versaoNode = (node --version).TrimStart("v").Split(".")[0]
    if ([int]$versaoNode -lt 20) {
        Write-Erro "Node $versaoNode encontrado; o material precisa da versao 20 ou superior."
        return
    }
    Write-Ok "Node $(node --version)"

    Write-Passo "pnpm"
    if (Test-Comando "pnpm") {
        Write-Pulo "pnpm ja instalado ($(pnpm --version))"
    }
    else {
        # corepack e o caminho oficial, mas depende de link simbolico e pode
        # falhar com EPERM no Windows. Se falhar, caimos no npm.
        try {
            corepack enable
            corepack prepare pnpm@latest --activate
            Write-Ok "pnpm habilitado via corepack"
        }
        catch {
            Write-Aviso "corepack falhou (comum no Windows); instalando pelo npm"
            npm install -g pnpm
            Write-Ok "pnpm instalado via npm"
        }
    }

    Write-Host ""
    Write-Ok "Pronto para o M03. Lembre de excluir $Raiz do antivirus:"
    Write-Host "       Seguranca do Windows > Protecao contra virus > Exclusoes > Pasta"
}

# =============================================================================
#  Etapa: banco  -  Docker + PostgreSQL (necessario a partir do M05)
# =============================================================================

function Invoke-EtapaBanco {
    Write-Titulo "DPW - banco de dados (Docker + PostgreSQL)"

    if (-not (Test-Comando "wsl")) {
        Write-Erro "WSL nao encontrado. Em um PowerShell COMO ADMINISTRADOR, rode:"
        Write-Host "         wsl --install"
        Write-Host "         Reinicie o computador e rode este script de novo."
        return
    }
    Write-Ok "WSL presente"

    if (-not (Install-SeFaltar "docker" "Docker.DockerDesktop" "Docker Desktop")) { return }

    Write-Passo "Docker em execucao"
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Erro "Docker instalado, mas nao esta rodando."
        Write-Host "         Abra o Docker Desktop pelo menu Iniciar, espere a baleia"
        Write-Host "         estabilizar, e rode este script de novo."
        return
    }
    Write-Ok "Docker respondendo"

    New-Arquivo "$Raiz\docker-compose.yml" (Get-ConteudoCompose)

    Write-Passo "Subindo o PostgreSQL"
    docker compose -f "$Raiz\docker-compose.yml" up -d
    Write-Ok "PostgreSQL na porta 5432 (usuario/banco: bibliocom, senha: devpassword)"

    Write-Passo "Driver do PostgreSQL no ambiente virtual"
    & "$Raiz\backend\.venv\Scripts\python.exe" -m pip install --quiet "psycopg[binary]"
    Write-Ok "psycopg instalado"
}

# =============================================================================
#  Apoio
# =============================================================================

function New-Arquivo($caminho, $conteudo) {
    $nome = Split-Path $caminho -Leaf
    if (Test-Path $caminho) {
        Write-Pulo "$nome ja existe (nao foi sobrescrito)"
        return
    }
    Set-Content -Path $caminho -Value $conteudo -Encoding ascii
    Write-Ok "$nome criado"
}

function Get-ConteudoGitignore {
    return @'
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
'@
}

function Get-ConteudoGitattributes {
    return @'
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
'@
}

function Get-ConteudoCompose {
    return @'
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
'@
}

function Write-Resumo-Base {
    Write-Host ""
    Write-Host ("-" * 70) -ForegroundColor Cyan
    Write-Host "  Ambiente basico pronto." -ForegroundColor Green
    Write-Host ("-" * 70) -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Projeto em: $Raiz"
    Write-Host ""
    Write-Host "  Para trabalhar, abra o terminal e rode as DUAS linhas:"
    Write-Host ""
    Write-Host "      Set-Location $Raiz\backend"           -ForegroundColor Yellow
    Write-Host "      .\.venv\Scripts\Activate.ps1"         -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  O prompt deve passar a mostrar (.venv). Isso vale por janela:"
    Write-Host "  terminal novo, ativacao nova."
    Write-Host ""
    Write-Host "  Proximos momentos:"
    Write-Host "      antes do M03:  .\setup.ps1 -Etapa frontend"
    Write-Host "      antes do M05:  .\setup.ps1 -Etapa banco"
    Write-Host ""
}

# =============================================================================
#  Execucao
# =============================================================================

switch ($Etapa) {
    "base"     { Invoke-EtapaBase }
    "frontend" { Invoke-EtapaFrontend }
    "banco"    { Invoke-EtapaBanco }
}
