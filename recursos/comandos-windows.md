# Desenvolvimento no Windows — guia de equivalências

Os roteiros do material usam comandos no formato Linux/macOS. Este arquivo traz o
equivalente no Windows, os **três caminhos possíveis** e as armadilhas que não são
simples tradução de comando.

> **Leia a seção 2 antes da primeira aula.** Três coisas quebram em silêncio no Windows e
> não são resolvidas trocando o comando: o `curl`, as variáveis de ambiente inline e o
> Gunicorn.

---

## 1. Escolha o seu caminho

| Caminho | Como é | Quando escolher |
|---|---|---|
| **A. PowerShell nativo** | Windows puro; comandos diferentes | Padrão. Funciona para tudo na disciplina |
| **B. Git Bash** | Shell Unix sobre Windows (vem com o Git) | Quer colar os comandos do material sem traduzir |
| **C. WSL2 (Ubuntu)** | Linux completo dentro do Windows | ⭐ Recomendado a partir do M16 (deploy) |

**Recomendação do material:** comece com **A ou B**, e instale o **WSL2** antes do M16.
Produção é Linux; quem faz deploy tendo desenvolvido em Linux encontra menos surpresa. Os
três caminhos são válidos para a disciplina inteira — nenhuma entrega depende disso.

### Instalar o WSL2 (opcional, 10 min)

```powershell
wsl --install -d Ubuntu
# reinicie, crie usuário e senha do Linux
```

Depois, dentro do Ubuntu, siga os roteiros **exatamente como estão escritos**. O VS Code
integra com a extensão *WSL*, e o Docker Desktop usa o WSL2 como backend.

> ⚠️ **Se usar WSL2, mantenha o projeto no sistema de arquivos do Linux**
> (`~/projetos/bibliocom`), **não** em `/mnt/c/...`. Acessar o disco do Windows a partir do
> WSL é muito lento — `pnpm install` pode levar minutos em vez de segundos.

---

## 2. As três armadilhas que não são tradução

### 2.1 `curl` no PowerShell não é o `curl` ⚠️

No PowerShell, `curl` é **apelido de `Invoke-WebRequest`**, que tem outros parâmetros.
Comandos do material como `curl -X POST -d '...'` falham com erro confuso.

```powershell
curl -X POST http://localhost:8000/api/obras/     # ❌ erro de parâmetro
curl.exe -X POST http://localhost:8000/api/obras/ # ✅ o curl de verdade
```

**Regra:** no PowerShell, escreva sempre **`curl.exe`**. O binário existe em todo Windows
10/11 — não precisa instalar nada. No Git Bash e no WSL, `curl` já é o correto.

Alternativa nativa, se preferir:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/obras/" -Method Get
Invoke-RestMethod -Uri "http://localhost:8000/api/obras/" -Method Post `
  -ContentType "application/json" `
  -Body '{"titulo":"Dom Casmurro","autor":1}'
```

`Invoke-RestMethod` já converte o JSON em objeto — bom para inspecionar, ruim para ver a
resposta crua. Para os exercícios do M01, que pedem para **ver os cabeçalhos e o corpo**,
use `curl.exe -i` ou `curl.exe -v`.

### 2.2 Variáveis de ambiente inline não existem ⚠️

```bash
# Linux/macOS — define a variável só para este comando
DEBUG=False python manage.py check --deploy
```

```powershell
# Windows PowerShell — define, executa, e a variável PERMANECE na sessão
$env:DEBUG="False"; python manage.py check --deploy

# para limpar depois:
Remove-Item Env:\DEBUG
```

```cmd
:: Windows CMD
set DEBUG=False && python manage.py check --deploy
```

> ⚠️ **A diferença que causa bug:** no Linux a variável vale só para aquele comando; no
> PowerShell ela **fica na sessão**. Se você rodar `$env:DEBUG="False"` e depois
> `python manage.py runserver`, o servidor sobe com `DEBUG=False` — sem páginas de erro
> detalhadas, sem servir estáticos — e você vai perder tempo procurando a causa. **Feche o
> terminal ou limpe a variável** depois de testar.

### 2.3 Gunicorn não roda no Windows ⚠️

O Gunicorn depende de módulos POSIX (`fcntl`) que não existem no Windows. O comando
simplesmente falha na importação.

**Isso não é problema em produção** — a PaaS roda Linux, e o `Procfile` continua com
Gunicorn. O problema é só na **verificação local** que o M16 pede.

Solução: use **Waitress**, servidor WSGI de produção que roda no Windows.

```powershell
pip install waitress
$env:DEBUG="False"; $env:SECRET_KEY="teste"; $env:ALLOWED_HOSTS="localhost"
waitress-serve --port=8000 config.wsgi:application
```

O objetivo da verificação local é provar que a aplicação funciona **fora do `runserver`**,
com `DEBUG=False` e estáticos coletados. Waitress cumpre isso.

> Se estiver no WSL2, use Gunicorn normalmente — é Linux.

---

## 3. Tabela de equivalências

### Ambiente virtual

| Linux/macOS | PowerShell | Git Bash |
|---|---|---|
| `python3 -m venv .venv` | `python -m venv .venv` | `python -m venv .venv` |
| `source .venv/bin/activate` | `.venv\Scripts\Activate.ps1` | `source .venv/Scripts/activate` |
| `deactivate` | `deactivate` | `deactivate` |
| `which python` | `Get-Command python` | `which python` |

Se `Activate.ps1` for bloqueado:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Arquivos e diretórios

| Linux/macOS | PowerShell |
|---|---|
| `ls -la` | `Get-ChildItem -Force` (ou `ls`) |
| `mkdir -p a/b/c` | `New-Item -ItemType Directory -Force -Path a/b/c` |
| `rm arquivo` | `Remove-Item arquivo` |
| `rm -rf pasta` | `Remove-Item -Recurse -Force pasta` |
| `cp -r origem destino` | `Copy-Item -Recurse origem destino` |
| `mv a b` | `Move-Item a b` |
| `cat arquivo` | `Get-Content arquivo` |
| `touch arquivo` | `New-Item -ItemType File arquivo` |
| `pwd` | `Get-Location` |

### Busca em arquivos

| Linux/macOS | PowerShell |
|---|---|
| `grep "texto" arquivo` | `Select-String "texto" arquivo` |
| `grep -r "texto" pasta/` | `Select-String -Recurse "texto" pasta/*` |
| `grep -i "texto"` | `Select-String -Pattern "texto"` (já é case-insensitive) |
| `comando \| grep "x"` | `comando \| Select-String "x"` |

Exemplo do M13 (procurar segredo no bundle):

```bash
# Linux/macOS
grep -r "minha-chave-secreta" dist/
```
```powershell
# PowerShell
Select-String -Recurse "minha-chave-secreta" dist/*
```

### Processos e portas

| Linux/macOS | PowerShell |
|---|---|
| `lsof -ti:8000 \| xargs kill -9` | `Get-NetTCPConnection -LocalPort 8000 \| Select-Object -Expand OwningProcess \| Stop-Process -Force` |
| `ps aux \| grep python` | `Get-Process python` |

Ou, mais simples:

```powershell
netstat -ano | findstr :8000      # descubra o PID
taskkill /PID <pid> /F
```

### Continuação de linha

```bash
# Linux/macOS: barra invertida
curl -X POST http://localhost:8000/api/obras/ \
     -H "Content-Type: application/json" \
     -d '{"titulo":"X"}'
```

```powershell
# PowerShell: crase (backtick)
curl.exe -X POST http://localhost:8000/api/obras/ `
     -H "Content-Type: application/json" `
     -d '{\"titulo\":\"X\"}'
```

> ⚠️ **Aspas em JSON no PowerShell.** O PowerShell processa aspas duplas antes de passar ao
> `curl.exe`. Três saídas, da mais simples à mais robusta:
>
> ```powershell
> # 1. aspas simples por fora, escapando as duplas
> curl.exe -X POST http://localhost:8000/api/obras/ -H "Content-Type: application/json" -d '{\"titulo\":\"X\"}'
>
> # 2. arquivo (melhor para corpos grandes — e é o que o material recomenda)
> curl.exe -X POST http://localhost:8000/api/obras/ -H "Content-Type: application/json" -d "@obra.json"
>
> # 3. Invoke-RestMethod, sem sofrimento com aspas
> Invoke-RestMethod -Uri "http://localhost:8000/api/obras/" -Method Post -ContentType "application/json" -Body '{"titulo":"X"}'
> ```

### Scripts

| Linux/macOS | PowerShell |
|---|---|
| `chmod +x build.sh` | (não se aplica) |
| `./build.sh` | `.\build.ps1` ou `bash build.sh` (Git Bash/WSL) |

O `build.sh` do M16 **roda na PaaS, que é Linux** — não precisa executá-lo no Windows. Mas
veja a seção 4 sobre finais de linha.

---

## 4. Finais de linha (CRLF × LF) ⚠️

Windows grava `\r\n`; Linux espera `\n`. Um `build.sh` criado no Windows e enviado ao Git
com CRLF falha na PaaS com uma mensagem enigmática:

```
bash: ./build.sh: /usr/bin/env: bad interpreter: No such file or directory
```

**Prevenção.** Crie `.gitattributes` na raiz do repositório — no **primeiro commit**:

```gitattributes
# normaliza finais de linha
* text=auto eol=lf

# arquivos que DEVEM ter LF, sempre
*.sh    text eol=lf
*.py    text eol=lf
*.yml   text eol=lf
*.yaml  text eol=lf
Procfile text eol=lf

# arquivos que podem ter CRLF no Windows
*.bat   text eol=crlf
*.ps1   text eol=crlf

# binários: não mexer
*.png binary
*.jpg binary
*.pdf binary
```

E configure o Git:

```powershell
git config --global core.autocrlf input
```

> Este arquivo é a diferença entre um deploy que funciona e duas horas de depuração
> remota. **Adicione-o no M00**, junto com o `.gitignore`.

---

## 5. Outras diferenças que aparecem no curso

| Situação | No Windows |
|---|---|
| **Docker Desktop** | Exige WSL2 habilitado. Instale o WSL antes do Docker |
| **PostgreSQL local** | Prefira o container Docker ao instalador nativo |
| **Caminhos longos** | `node_modules` pode passar de 260 caracteres. Habilite: `git config --system core.longpaths true` e ative *Long Paths* no Windows |
| **Antivírus** | Windows Defender pode deixar `pnpm install` e `runserver` lentos. Adicione a pasta do projeto às exclusões |
| **Node e pnpm** | Funcionam nativamente, sem ressalva |
| **`make`** | Não existe. Use scripts do `package.json` (`pnpm <script>`) |
| **Emoji/acentos no terminal** | Se aparecerem quebrados: `chcp 65001` ou use o Windows Terminal |
| **`python` × `python3`** | No Windows é `python` (ou `py -3.12`); no material aparece `python3` |

---

## 6. Verificação: o ambiente está pronto?

```powershell
python --version           # 3.12+
node --version             # v20+
pnpm --version
git --version
curl.exe --version         # note o .exe
docker info                # opcional até o M05

python recursos\codigo\verifica_ambiente.py
```

O script detecta o sistema operacional e ajusta as dicas de correção.

---

## 7. Se algo do material não funcionar

1. Confira se o comando cai em uma das **três armadilhas** da seção 2.
2. Procure o equivalente na tabela da seção 3.
3. Ainda assim travou? **Abra o Git Bash** e cole o comando original — resolve a maioria
   dos casos, sem tradução.
4. É deploy ou algo específico de Linux? **Use o WSL2.**

E avise o docente: se um roteiro tem comando sem alternativa documentada, é falha do
material, não sua.
