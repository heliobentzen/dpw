# Windows — referência de comandos

**Este arquivo é de consulta, não de instalação.** Para montar o ambiente, siga
[`../docs/ambiente-setup-windows.md`](../docs/ambiente-setup-windows.md), que é um guia
completo e independente, do zero até os dois servidores rodando.

Use **este** arquivo durante o curso, quando um roteiro trouxer um comando em formato
Linux/macOS e você precisar do equivalente. Ele traz a tabela de equivalências (seção 3) e
as armadilhas em detalhe (seções 2 e 4).

| Preciso de… | Vá para |
|---|---|
| Instalar Node, pnpm, Git, Docker | [`../docs/ambiente-setup-windows.md`](../docs/ambiente-setup-windows.md) |
| Traduzir um comando do roteiro | [seção 3](#3-tabela-de-equivalências) deste arquivo |
| Entender por que algo quebrou | [seção 2](#2-as-cinco-armadilhas-que-não-são-tradução) deste arquivo |
| Instalar o WSL2 | [seção 1.1](#instalar-o-wsl2-opcional-10-min) deste arquivo |

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

## 2. As cinco armadilhas que não são tradução

Nenhuma delas se resolve trocando o comando por um equivalente — todas exigem entender o
que o Windows faz de diferente.

| # | Armadilha | Aparece em |
|---|---|---|
| [2.1](#21-curl-no-powershell-não-é-o-curl-) | `curl` é apelido de `Invoke-WebRequest` | M01, M07, M12, M13, M16 |
| [2.2](#22-variáveis-de-ambiente-inline-não-existem-) | Variáveis inline não existem — e ficam na sessão | M13, M16 |
| [2.3](#23--não-existe-no-powershell-51-) | `&&` não existe no PowerShell 5.1 | todos |
| [2.4](#24--grava-arquivo-em-utf-16-) | `>` grava arquivo em UTF-16 | M07, M15, M16 |
| [2.5](#25-a-crase-de-continuação-e-o-espaço-invisível-) | Espaço depois da crase corta o comando | todos |

### 2.1 `curl` no PowerShell não é o `curl` ⚠️

No PowerShell, `curl` é **apelido de `Invoke-WebRequest`**, que tem outros parâmetros.
Comandos do material como `curl -X POST -d '...'` falham com erro confuso.

```powershell
curl -X POST http://localhost:3000/api/obras     # ❌ erro de parâmetro
curl.exe -X POST http://localhost:3000/api/obras # ✅ o curl de verdade
```

**Regra:** no PowerShell, escreva sempre **`curl.exe`**. O binário existe em todo Windows
10/11 — não precisa instalar nada. No Git Bash e no WSL, `curl` já é o correto.

Alternativa nativa, se preferir:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Get
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post `
  -ContentType "application/json" `
  -Body '{"titulo":"Dom Casmurro","autorId":1}'
```

`Invoke-RestMethod` já converte o JSON em objeto — bom para inspecionar, ruim para ver a
resposta crua. Para os exercícios do M01, que pedem para **ver os cabeçalhos e o corpo**,
use `curl.exe -i` ou `curl.exe -v`. Para ver o corpo de uma resposta de **erro**, acrescente
`-SkipHttpErrorCheck`, senão o `Invoke-RestMethod` lança exceção e você não lê a mensagem.

### 2.2 Variáveis de ambiente inline não existem ⚠️

```bash
# Linux/macOS — define a variável só para este comando
NODE_ENV=production node dist/main.js
```

```powershell
# Windows PowerShell — define, executa, e a variável PERMANECE na sessão
$env:NODE_ENV="production"; node dist/main.js

# para limpar depois:
Remove-Item Env:\NODE_ENV
```

> ⚠️ **A diferença que causa bug:** no Linux a variável vale só para aquele comando; no
> PowerShell ela **fica na sessão**. Se você rodar `$env:NODE_ENV="production"` e depois
> `pnpm start:dev`, o servidor sobe em modo produção — sem recarregar, com log diferente —
> e você vai perder tempo procurando a causa. **Feche o terminal ou limpe a variável**
> depois de testar.

### 2.3 `&&` não existe no PowerShell 5.1 ⚠️

O Windows 10/11 vem com **PowerShell 5.1**. O operador `&&` só foi adicionado no
**PowerShell 7**. Ou seja: metade dos comandos encadeados de qualquer tutorial falha.

```powershell
cd backend && pnpm start:dev     # ❌ PowerShell 5.1: erro de sintaxe
```

Três saídas:

```powershell
# 1. linhas separadas (o que este material usa)
cd backend
pnpm start:dev

# 2. ponto e vírgula — executa o segundo INDEPENDENTE de o primeiro falhar
cd backend; pnpm start:dev

# 3. instale o PowerShell 7, e aí o && funciona como no Linux
winget install Microsoft.PowerShell
```

> ⚠️ `;` **não é equivalente a `&&`.** Em `mkdir x && cd x`, se o `mkdir` falhar o `cd` não
> roda; com `;`, roda mesmo assim — e você acaba num diretório errado sem perceber. Para
> comandos onde a ordem importa, prefira linhas separadas.

Descubra sua versão:

```powershell
$PSVersionTable.PSVersion
```

### 2.4 `>` grava arquivo em UTF-16 ⚠️

No **PowerShell 5.1** — o que vem instalado no Windows — o operador `>` não grava texto
puro: grava **UTF-16**, com dois bytes por caractere e um marcador BOM no início. O arquivo
parece normal no editor, mas outras ferramentas leem lixo.

```powershell
pnpm list --depth 0 --json > dependencias.json     # ❌ arquivo em UTF-16
```

O erro aparece depois, na máquina de **outra pessoa**, quando ela clona o repositório:

```
SyntaxError: Unexpected token 'ÿ', "..." is not valid JSON
```

Forma correta, que funciona no PowerShell 5.1 **e** no 7:

```powershell
pnpm list --depth 0 --json | Out-File -FilePath dependencias.json -Encoding utf8
```

> Nem todo comando precisa disso: quando o próprio programa grava o arquivo — como o
> `pnpm gerar:schema` do M03, que chama `writeFileSync` — quem escolhe a codificação é o
> Node, e ele sempre usa UTF-8. O problema é só do `>` do PowerShell.

| Trecho | O que faz |
|---|---|
| `\| Out-File` | Grava a saída num arquivo, com controle explícito de codificação |
| `-Encoding utf8` | UTF-8. Use `ascii` quando o conteúdo for garantidamente sem acento |

Vale para **todo** `>` que gere arquivo de texto lido por outra ferramenta: `openapi.json`,
`.env`, `.txt`, `.json`. Para criar arquivo de configuração, prefira o editor:

```powershell
New-Item -ItemType File -Path .gitignore
code .gitignore
```

> No **PowerShell 7** o `>` já grava UTF-8 e o problema não existe. Como você não sabe em
> qual versão o colega está, use sempre `Out-File` com `-Encoding` explícito.

### 2.5 A crase de continuação e o espaço invisível ⚠️

Para quebrar um comando longo em várias linhas, o Linux usa `\` e o PowerShell usa a crase
(`` ` ``). A diferença perigosa é que a crase precisa ser **o último caractere da linha**:

```powershell
pnpm add @nestjs/typeorm `
          typeorm
```

Se houver **um único espaço depois da crase**, o PowerShell trata a linha como terminada.
O comando roda pela metade — instala `@nestjs/typeorm`, ignora o resto — e **não há mensagem de
erro**. Como espaço em branco no fim da linha é invisível, o diagnóstico é penoso.

Por isso este material escreve comandos de instalação em **linha única**, por mais longos
que fiquem. Se precisar quebrar, ative "renderizar espaços em branco" no editor
(*View → Render Whitespace* no VS Code).

---

## 3. Tabela de equivalências

### Ambiente virtual

| Linux/macOS | PowerShell | Git Bash |
|---|---|---|
| `pnpm install` | `pnpm install` | `pnpm install` |
| `pnpm --filter backend dev` | idem | idem |
| `deactivate` | `deactivate` | `deactivate` |
| `which node` | `Get-Command node` | `which node` |

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
| `ps aux \| grep node` | `Get-Process node` |

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
| `cmd1 && cmd2` | linhas separadas (ou `;`, ou PowerShell 7) |
| `VAR=x cmd` | `$env:VAR="x"; cmd` |
| `export VAR=x` | `$env:VAR="x"` |
| `$(comando)` | `$(comando)` ou `(comando)` |

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
| **Pasta do projeto** | ⚠️ Use `C:\dev`. Dentro do `Documents` o OneDrive sincroniza `node_modules`, travando `pnpm install` e produzindo mudanças fantasma no Git. Espaços e acentos no caminho também quebram ferramentas |
| **Docker Desktop** | Exige WSL2 habilitado. Instale o WSL antes do Docker |
| **PostgreSQL local** | Prefira o container Docker ao instalador nativo |
| **Caminhos longos** | `node_modules` pode passar de 260 caracteres. Habilite: `git config --system core.longpaths true` e ative *Long Paths* no Windows |
| **Antivírus** | Windows Defender pode deixar `pnpm install` e `runserver` lentos. Adicione a pasta do projeto às exclusões |
| **Node e pnpm** | Funcionam nativamente, sem ressalva |
| **`make`** | Não existe. Use scripts do `package.json` (`pnpm <script>`) |
| **Emoji/acentos no terminal** | Se aparecerem quebrados: `chcp 65001` ou use o Windows Terminal |

---

## 6. Verificação: o ambiente está pronto?

```powershell
node --version             # v20+
pnpm --version             # 9+
git --version
curl.exe --version         # note o .exe
docker info                # só a partir do M05

node recursos\codigo\verifica-ambiente.mjs
```

O script detecta o sistema operacional e ajusta as dicas de correção.

---

## 7. Se algo do material não funcionar

1. Confira se o comando cai em uma das **cinco armadilhas** da seção 2.
2. Procure o equivalente na tabela da seção 3.
3. Ainda assim travou? **Abra o Git Bash** e cole o comando original — resolve a maioria
   dos casos, sem tradução.
4. É deploy ou algo específico de Linux? **Use o WSL2.**

E avise o docente: se um roteiro tem comando sem alternativa documentada, é falha do
material, não sua.
