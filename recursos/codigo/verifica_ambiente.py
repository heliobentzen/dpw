"""
Verificação do ambiente da disciplina DPW — material de apoio do M00.

Confere as DUAS camadas: Python/Django/DRF (backend) e Node/pnpm (frontend).

Rode com o ambiente virtual ativo:

    python verifica_ambiente.py

Saída: um relatório com OK/FALHA por item e a dica de correção quando falhar.
Código de saída 0 se tudo passar, 1 caso contrário (útil em CI).
"""

import os
import platform
import shutil
import subprocess
import sys

falhas = 0
WINDOWS = platform.system() == "Windows"


def check(nome: str, condicao: bool, dica: str) -> None:
    global falhas
    print(f"[{'OK   ' if condicao else 'FALHA'}] {nome}")
    if not condicao:
        print(f"          -> {dica}")
        falhas += 1


def info(texto: str) -> None:
    print(f"[INFO ] {texto}")


print("=" * 62)
print("  Verificação do ambiente — Desenvolvimento de Projeto Web")
print("=" * 62)
info(f"Sistema: {platform.system()} {platform.release()}")
if WINDOWS:
    info("Guia de setup do Windows: docs/ambiente-setup-windows.md")
    info("Tabela de equivalências:  recursos/comandos-windows.md")

# --- Python ---------------------------------------------------------------
check(
    "Python >= 3.12",
    sys.version_info >= (3, 12),
    "Instale Python 3.12+ e recrie o ambiente virtual",
)
info(f"Versão detectada: {sys.version.split()[0]}")

check(
    "Ambiente virtual ativo",
    sys.prefix != sys.base_prefix,
    r".venv\Scripts\Activate.ps1" if WINDOWS else "source .venv/bin/activate",
)

# --- Git ------------------------------------------------------------------
git = shutil.which("git")
check("Git instalado", git is not None, "Instale o Git: https://git-scm.com/downloads")

if git:
    nome = subprocess.run(
        ["git", "config", "--global", "user.name"], capture_output=True, text=True
    ).stdout.strip()
    email = subprocess.run(
        ["git", "config", "--global", "user.email"], capture_output=True, text=True
    ).stdout.strip()
    check(
        "Git configurado (user.name e user.email)",
        bool(nome and email),
        'git config --global user.name "Seu Nome" && '
        'git config --global user.email "voce@exemplo.com"',
    )

# --- Django ---------------------------------------------------------------
try:
    import django

    check(
        "Django >= 5.0",
        django.VERSION >= (5, 0),
        "pip install 'django>=5.0,<6.0'",
    )
    info(f"Django {django.get_version()}")
except ImportError:
    check("Django instalado", False, "pip install 'django>=5.0,<6.0'")

# --- DRF e python-dotenv --------------------------------------------------
try:
    import rest_framework

    check("Django REST Framework", True, "")
    info(f"DRF {rest_framework.VERSION}")
except ImportError:
    check("Django REST Framework", False, "pip install djangorestframework")

try:
    import dotenv  # noqa: F401

    check("python-dotenv instalado", True, "")
except ImportError:
    check("python-dotenv instalado", False, "pip install python-dotenv")

# --- Node e pnpm (frontend) ----------------------------------------------
node = shutil.which("node")
check("Node.js instalado", node is not None, "Instale o Node 20 LTS (https://nodejs.org)")

if node:
    versao = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()
    info(f"Node {versao}")
    try:
        maior = int(versao.lstrip("v").split(".")[0])
        check("Node >= 20", maior >= 20, "Atualize para o Node 20 LTS (use fnm ou nvm)")
    except ValueError:
        check("Node >= 20", False, "Não foi possível ler a versão do Node")

pnpm = shutil.which("pnpm")
check("pnpm instalado", pnpm is not None, "corepack enable; corepack prepare pnpm@latest --activate")
if pnpm:
    # `pnpm` é um .cmd no Windows: usar o caminho resolvido evita depender de shell=True
    versao_pnpm = subprocess.run([pnpm, "--version"], capture_output=True, text=True)
    info(f"pnpm {versao_pnpm.stdout.strip()}")

# --- Específico do Windows ------------------------------------------------
if WINDOWS:
    print("-" * 62)
    print("  Verificações específicas do Windows")
    print("-" * 62)

    # 1. curl.exe: no PowerShell, `curl` é alias de Invoke-WebRequest
    check(
        "curl.exe disponível",
        shutil.which("curl.exe") is not None or shutil.which("curl") is not None,
        "Use sempre 'curl.exe' no PowerShell — 'curl' é alias de Invoke-WebRequest",
    )

    # 2. Pasta do projeto fora do OneDrive, sem espaço e sem acento no caminho
    #    (causa nº 1 de lentidão, arquivo bloqueado e mudança fantasma no Git)
    cwd = os.getcwd()
    check(
        "Projeto fora do OneDrive",
        "onedrive" not in cwd.lower(),
        "Mova o projeto para C:\\dev — o OneDrive sincroniza .venv e node_modules, "
        "travando o pnpm install e produzindo mudanças fantasma no Git",
    )
    check(
        "Caminho sem espaço nem acento",
        " " not in cwd and cwd.isascii(),
        f"Caminho atual: {cwd} — mova para C:\\dev. Espaços e acentos quebram "
        "ferramentas que não põem aspas nos caminhos",
    )

    # 3. .gitattributes e autocrlf: evitam CRLF quebrando o deploy no M16
    raiz = None
    for pasta in (".", "..", "../.."):
        if os.path.isdir(os.path.join(pasta, ".git")):
            raiz = pasta
            break
    if raiz:
        check(
            ".gitattributes presente",
            os.path.isfile(os.path.join(raiz, ".gitattributes")),
            "Crie o .gitattributes com '*.sh text eol=lf' — sem ele o deploy falha "
            "com 'bad interpreter' (ver docs/ambiente-setup-windows.md, passo 11.2)",
        )
        autocrlf = subprocess.run(
            ["git", "config", "--get", "core.autocrlf"],
            capture_output=True, text=True,
        ).stdout.strip()
        check(
            "git core.autocrlf = input",
            autocrlf == "input",
            "git config --global core.autocrlf input",
        )
    else:
        info("Fora de um repositório Git — verificação de finais de linha pulada")

    # 4. requirements.txt em UTF-16: o `>` do PowerShell 5.1 grava assim, e o
    #    `pip install -r` falha com "Invalid requirement: 'ÿþd'" na máquina do colega.
    for pasta in (".", "backend"):
        req = os.path.join(pasta, "requirements.txt")
        if os.path.isfile(req):
            with open(req, "rb") as f:
                inicio = f.read(4)
            check(
                f"{req} em texto puro (não UTF-16)",
                not inicio.startswith((b"\xff\xfe", b"\xfe\xff")),
                "Gerado com '>' no PowerShell 5.1, que grava UTF-16. Refaça com: "
                "pip freeze | Out-File -FilePath requirements.txt -Encoding ascii",
            )
            break

    # 5. Avisos que não são verificáveis por script, mas custam caro quando ignorados
    info("Gunicorn não roda no Windows. No M16, use: pip install waitress")
    info('Variáveis inline: use $env:DEBUG="False"; python ... (e limpe depois)')
    info("Ao gerar arquivo de texto, use Out-File -Encoding ascii — nunca '>'")

# --- Docker (opcional até o M04) -----------------------------------------
if shutil.which("docker"):
    rodando = subprocess.run(["docker", "info"], capture_output=True).returncode == 0
    check(
        "Docker em execução",
        rodando,
        "Abra o Docker Desktop (opcional até o M04)",
    )
else:
    info("Docker não instalado — opcional até o M04")

# --- Resultado ------------------------------------------------------------
print("-" * 62)
if falhas == 0:
    print("Ambiente pronto. Bom curso!")
    if WINDOWS:
        print("Antes da primeira aula, leia as seis armadilhas do Windows:")
        print("  recursos/comandos-windows.md (seção 2)")
else:
    print(f"{falhas} item(ns) precisam de correção antes da aula.")
print("-" * 62)

sys.exit(0 if falhas == 0 else 1)
