"""
Verificação do ambiente da disciplina DPW — material de apoio do M00.

Rode com o ambiente virtual ativo:

    python verifica_ambiente.py

Saída: um relatório com OK/FALHA por item e a dica de correção quando falhar.
Código de saída 0 se tudo passar, 1 caso contrário (útil em CI).
"""

import shutil
import subprocess
import sys

falhas = 0


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
    "Ative o venv: source .venv/bin/activate (Linux/macOS) "
    "ou .venv\\Scripts\\Activate.ps1 (Windows)",
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

# --- python-dotenv --------------------------------------------------------
try:
    import dotenv  # noqa: F401

    check("python-dotenv instalado", True, "")
except ImportError:
    check("python-dotenv instalado", False, "pip install python-dotenv")

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
else:
    print(f"{falhas} item(ns) precisam de correção antes da aula.")
print("-" * 62)

sys.exit(0 if falhas == 0 else 1)
