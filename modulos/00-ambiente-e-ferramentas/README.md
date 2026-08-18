# M00 — Ambiente e ferramentas

> **CH:** 3h (1h teórica · 2h prática) · **Semana 1** · **Pré-requisito:** nenhum

Módulo complementar (não exigido pela ementa), mas sem ele nada funciona. Pode ser
convertido em pré-atividade assíncrona.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o papel de ambiente virtual, gerenciador de pacotes e controle de versão.
2. Preparar um ambiente Python isolado e reprodutível.
3. Usar o fluxo Git básico em equipe (branch → commit → push → PR).
4. Diagnosticar sozinho os erros mais comuns de instalação.

---

## 📖 Teoria (1h)

### 1. Por que ambiente virtual

Projeto A precisa de Django 4.2; projeto B, de Django 5.1. Instalados no Python global,
um sobrescreve o outro. O ambiente virtual (`venv`) cria uma pasta com um Python e um
`site-packages` próprios: **um projeto, um ambiente**.

```
maquina/
├── Python global            (não instale nada aqui)
├── projeto-a/.venv/         Django 4.2
└── projeto-b/.venv/         Django 5.1
```

### 2. Reprodutibilidade

Se o projeto só roda na sua máquina, ele não existe. O que garante que roda em qualquer
lugar:

| Artefato | Função |
|---|---|
| `requirements.txt` (ou `pyproject.toml`) | Lista exata de dependências e versões |
| `.env.example` | Quais variáveis de ambiente são necessárias (sem os valores) |
| `README.md` | Como subir o projeto em ≤ 5 comandos |
| `docker-compose.yml` | Serviços externos (banco, cache) idênticos para todos |

💼 **No mercado:** a primeira tarefa de qualquer pessoa que entra num time é *rodar o
projeto localmente*. Times maduros medem esse tempo — a meta é minutos, não dias.

### 3. Git: o modelo mental

Git guarda **snapshots** do projeto, não diferenças. Três áreas:

```
working directory  ──git add──▶  staging area  ──git commit──▶  repositório local
                                                                     │
                                                                 git push
                                                                     ▼
                                                              repositório remoto
```

Comandos que resolvem 95% do dia a dia:

```bash
git status                       # onde estou, o que mudou
git add <arquivo>                # seleciona o que entra no commit
git commit -m "mensagem"         # grava o snapshot
git log --oneline --graph        # histórico
git switch -c feat/cadastro-obra # cria e vai para uma branch
git switch main
git pull origin main             # traz o que os outros fizeram
git push -u origin feat/cadastro-obra
```

### 4. Mensagens de commit (Conventional Commits)

```
<tipo>(<escopo opcional>): <o que mudou, no imperativo>

feat(acervo): adiciona cadastro de obra
fix(emprestimo): corrige calculo de data de devolucao
docs: atualiza instrucoes de instalacao
refactor(views): extrai regra de disponibilidade para o model
test(acervo): cobre limite de emprestimos por associado
chore: atualiza dependencias
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
Regra: a mensagem responde **por que**, o diff mostra **o quê**. Nada de "ajustes",
"update" ou "final v2 agora vai".

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Instalar as ferramentas (25 min)

Só três coisas hoje: **Python, Git e VS Code**. Node, Docker e PostgreSQL entram nos módulos
em que passam a ser usados — instalar tudo agora seria montar seis peças de uma vez, sem
saber para que servem.

Siga o guia do **seu** sistema. Eles são independentes: você abre um só.

| Seu sistema | Guia | O que fazer hoje |
|---|---|---|
| 🪟 **Windows** | [`docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) | Passos 0 a 4 e 7 |
| 🐧 **Linux** / 🍎 **macOS** | [`docs/ambiente-setup.md`](../../docs/ambiente-setup.md) | Seções 2, 3, 5 e 6 |
| 🪟→🐧 **WSL2** | instale o WSL2 pelo passo 8.1 do guia Windows, depois siga o guia **Linux** dentro do Ubuntu | — |

> 🪟 **Quem está no Windows não deve seguir o guia Linux "adaptando".** Metade dos problemas
> da primeira semana vem daí. O guia próprio existe para você não precisar traduzir nada.

**Deu certo se:** os três comandos abaixo respondem uma versão.

```bash
python3 --version      # 🪟 Windows: python --version
git --version
code --version
```

### Passo 2 — Criar o ambiente virtual (20 min)

Aqui começa o conteúdo do módulo. **Digite os comandos, não copie sem ler** — cada linha
corresponde a um conceito que a avaliação teórica cobra.

#### 🐧 Linux / 🍎 macOS / WSL2 / Git Bash

```bash
mkdir -p ~/dev/bibliocom/backend
cd ~/dev/bibliocom/backend
python3 -m venv .venv
source .venv/bin/activate
```

#### 🪟 Windows (PowerShell)

```powershell
New-Item -ItemType Directory -Force -Path C:\dev\bibliocom\backend
Set-Location C:\dev\bibliocom\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

| Linha | O que faz |
|---|---|
| criar a pasta | O projeto fica em `dev/bibliocom`. 🪟 **Fora do OneDrive e sem espaço ou acento no caminho** — o OneDrive sincroniza o `.venv` e trava o Git |
| entrar na pasta | Todo o resto acontece daqui |
| `python -m venv .venv` | Roda o **módulo** `venv` (`-m`) e cria o ambiente na pasta `.venv`. É este comando que materializa o conceito da teoria: um Python e uma biblioteca **só deste projeto** |
| ativar | Põe o `.venv` na frente do PATH desta janela. 🪟 O `.\` é obrigatório no PowerShell, e o executável fica em `Scripts\`, não em `bin/` |

**Deu certo se:** o prompt passou a mostrar `(.venv)` na frente.

⚠️ **Se `(.venv)` não aparecer, PARE.** Tudo que instalar daqui em diante vai para o Python
global, e o erro só se manifesta lá na frente, quando o projeto não roda na máquina de outra
pessoa. 🪟 Se falhou com `Activate.ps1 cannot be loaded`, rode
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

> **Terminal novo, ativação nova.** O ambiente vale para a janela, não para a máquina. É a
> segunda causa mais comum de `ModuleNotFoundError: No module named 'django'`.

#### Instalar a primeira dependência

```bash
python -m pip install --upgrade pip
pip install "django>=5.0,<6.0"
pip freeze > requirements.txt
```

🪟 **No PowerShell, a última linha é outra:**

```powershell
pip freeze | Out-File -FilePath requirements.txt -Encoding ascii
```

| Linha | O que faz |
|---|---|
| `python -m pip` | Chama o pip **através do Python ativo** — garante que é o do `.venv` |
| `pip install "django>=5.0,<6.0"` | Instala o Django 5.x. As aspas fixam a faixa de versão e, no PowerShell, impedem que o `>` seja lido como redirecionamento |
| `pip freeze > requirements.txt` | Congela as versões exatas. É este arquivo que faz o projeto rodar igual na máquina de outra pessoa |
| 🪟 `Out-File -Encoding ascii` | No PowerShell 5.1 o `>` grava **UTF-16**, e o `pip install -r` falha depois com `Invalid requirement: 'ÿþd'` — na máquina do colega, dias depois |

**Um pacote só, de propósito.** DRF, `python-dotenv` e as outras dependências entram no
**M03**, cada uma quando o projeto passa a usá-la. Você vai ver o `requirements.txt` crescer
junto com o que o sistema faz — que é como gestão de dependência se aprende.

**Deu certo se:** `python -c "import django; print(django.get_version())"` responde `5.x`, e
`requirements.txt` tem poucas linhas. Se tiver 200, o `pip freeze` rodou **fora** do
ambiente virtual e capturou o Python do sistema inteiro.


### Passo 3 — Versionar o projeto (25 min)

O ambiente existe, mas nada dele está versionado. Agora criamos o repositório — e, antes do
primeiro commit, decidimos **o que não entra nele**.

#### 3a. Iniciar o repositório

```bash
cd ~/dev/bibliocom            # 🪟 Windows: Set-Location C:\dev\bibliocom
git init
git config core.autocrlf input
```

| Linha | O que faz |
|---|---|
| `cd ~/dev/bibliocom` | Sobe um nível: a raiz do repositório é `bibliocom`, não `backend`. O repositório abraça as duas camadas |
| `git init` | Cria o repositório — passa a existir a pasta oculta `.git` com todo o histórico |
| `git config core.autocrlf input` | Ao commitar, converte CRLF → LF. Relevante sobretudo no Windows: sem isto, o deploy do M16 falha com `bad interpreter` e ninguém relaciona a causa ao efeito |

A estrutura agora:

```
bibliocom/                 ← raiz do repositório
└── backend/
    ├── .venv/             ambiente virtual — NÃO pode entrar no Git
    └── requirements.txt   dependências — PRECISA entrar no Git
```

Essas duas últimas linhas resumem o próximo arquivo.

#### 3b. `.gitignore` — o que não entra

Crie `.gitignore` **na raiz** (`bibliocom/`):

```gitignore
# Python
__pycache__/
*.py[cod]
.venv/

# Django
*.log
db.sqlite3
/backend/media/
/backend/staticfiles/

# Node (a partir do M03)
node_modules/
dist/

# Ambiente
.env
.env.*
!.env.example

# Editores e sistema
.vscode/
.idea/
.DS_Store
Thumbs.db
```

| Padrão | Por que fica de fora |
|---|---|
| `.venv/`, `node_modules/` | São **reconstruíveis** a partir do `requirements.txt` e do `package.json`. Versionar cópias de dependência incha o repositório e gera conflito a cada `pip install` |
| `db.sqlite3` | É o **seu** banco local. O banco de outra pessoa é outro; o de produção é outro ainda |
| `.env` | Contém segredo. **Segredo que entra no Git é segredo vazado** — mesmo removido depois, continua nos commits anteriores |
| `!.env.example` | A `!` **desfaz** o ignore da linha acima. O `.env.example` entra sim: ele documenta *quais* variáveis existem, sem os valores |

> 🪟 **Não crie este arquivo pelo Bloco de Notas.** Ele acrescenta `.txt` ao salvar e o
> Explorer esconde a extensão: você digita `.gitignore`, ele grava `.gitignore.txt`, a tela
> mostra "`.gitignore`" — e o Git ignora o arquivo. Use o VS Code (`code .gitignore`) e
> confira os nomes reais com `Get-ChildItem -Force`.

#### 3c. `.gitattributes` — proteção da equipe

Crie também `.gitattributes` na raiz:

```gitattributes
* text=auto eol=lf

*.sh     text eol=lf
*.py     text eol=lf
*.yml    text eol=lf
Procfile text eol=lf

*.bat text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
```

O `core.autocrlf` do passo 3a protege **você**; o `.gitattributes` protege **quem clonar**,
inclusive sem ter configurado nada. Por isso ele é versionado e aquele não.

Ele precisa estar no **primeiro commit**: arquivos já commitados com CRLF continuam assim.

#### 3d. README — como rodar o projeto

Crie `README.md` na raiz:

````markdown
# BiblioCom

Sistema de gestão para bibliotecas comunitárias — estudo de caso da disciplina DPW.

## Como rodar

### Linux / macOS

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Windows (PowerShell)

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
````

💼 **No mercado:** a primeira tarefa de quem entra num time é *rodar o projeto localmente*.
Times maduros medem esse tempo — a meta é minutos, não dias. O README é o que decide isso.
Ele cresce junto com o projeto: no M03 ganha `migrate` e `runserver`, no M05 o banco.

#### 3e. Primeiro commit

```bash
git status
git add .
git commit -m "chore: inicializa estrutura do projeto"
```

| Linha | O que faz |
|---|---|
| `git status` | Mostra o que entraria no commit. **Leia antes de commitar** |
| `git add .` | Move para a *staging area* tudo que mudou e não está no `.gitignore` |
| `git commit -m "..."` | Grava o snapshot com a mensagem |

**Deu certo se:** o `git status` listou **4 itens** — `.gitignore`, `.gitattributes`,
`README.md` e `backend/requirements.txt`.

⚠️ Se `.venv/`, `.env` ou `db.sqlite3` aparecerem, pare e corrija o `.gitignore` antes de
commitar. Depois de commitado, o arquivo continua no histórico mesmo que você o remova.

> 🪟 **`warning: CRLF will be replaced by LF` não é erro.** É o `core.autocrlf input`
> guardando o arquivo com finais de linha do Linux. Na sua pasta ele continua com CRLF.

#### 3f. Conferir o ambiente

```bash
python ~/dpw/recursos/codigo/verifica_ambiente.py
```

Este script **não instala nada** — ele confere e, para cada falha, diz o comando exato que
corrige. Rode-o sempre que algo parar de funcionar.

**Só avance com os itens da semana 1 em OK.** Node, pnpm e Docker aparecem como pendentes
até os módulos em que entram; isso é esperado.


### Passo 4 — Publicar no GitHub (20 min)

Crie o repositório **vazio** em github.com (sem README, sem .gitignore — você já tem) e:

```bash
git remote add origin git@github.com:<seu-usuario>/bibliocom.git
git branch -M main
git push -u origin main
```

### Passo 5 — Ciclo de branch e Pull Request (30 min, em duplas)

Uma pessoa é dona do repositório e adiciona a outra como colaboradora
(*Settings → Collaborators*).

```bash
git switch -c docs/instrucoes-de-uso
# edite o README.md, acrescente uma seção "Equipe"
git add README.md
git commit -m "docs: adiciona secao de equipe ao README"
git push -u origin docs/instrucoes-de-uso
```

No GitHub: **Compare & pull request** → descreva o que mudou e por quê → peça revisão à
dupla → a dupla comenta pelo menos uma sugestão → aplique → *Merge*.

Depois, sincronize e limpe:

```bash
git switch main
git pull origin main
git branch -d docs/instrucoes-de-uso
```

Inverta os papéis e repita.

### Passo 6 — Proteger a branch principal (extra, 5 min)

Em *Settings → Branches → Add rule*: exija Pull Request antes do merge e ao menos 1
aprovação. Isso passa a valer para o projeto da equipe.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `(.venv)` não aparece no prompt | O venv não foi ativado; tudo que instalar vai para o Python global |
| `requirements.txt` com 200 linhas | Você rodou `pip freeze` sem venv, capturando o sistema inteiro |
| `.env` aparece em `git status` | Falta a linha no `.gitignore` |
| Push rejeitado | Alguém enviou antes; `git pull --rebase origin main` |
| Commit "wip" a cada 3 minutos | Commits devem ser unidades coerentes de mudança |

🪟 **Erros de Windows** (política de execução, `python` abrindo a Microsoft Store, `pip install -r`
falhando com `Invalid requirement: 'ÿþd'`, OneDrive travando o Git) estão catalogados em
[`docs/ambiente-setup-windows.md`, passo 12](../../docs/ambiente-setup-windows.md#passo-12--erros-e-diagnóstico).

## ✅ Checklist de saída

- [ ] `python verifica_ambiente.py` termina com "Ambiente da etapa M00 pronto"
- [ ] Ambiente virtual ativa e mostra `(.venv)` no prompt
- [ ] `requirements.txt` com **poucas** linhas (só Django e suas dependências diretas)
- [ ] Repositório `bibliocom` no GitHub, com `.gitignore`, `.gitattributes` e `README.md`
- [ ] 🪟 Windows: terminal escolhido, projeto em `C:\dev` (fora do OneDrive), `core.autocrlf input`
      e `requirements.txt` legível com `Get-Content`
- [ ] `.venv/` **não** versionado
- [ ] Ao menos 2 commits com mensagem no padrão Conventional Commits
- [ ] Ao menos 1 Pull Request revisado e mesclado por outra pessoa
- [ ] Chave SSH configurada (push sem digitar senha)

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Pro Git (livro completo, em português)](https://git-scm.com/book/pt-br/v2)
- [Learn Git Branching (visual e interativo)](https://learngitbranching.js.org/?locale=pt_BR)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [Python venv — documentação oficial](https://docs.python.org/pt-br/3/library/venv.html)
- 🪟 [`../../docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) — setup completo do Windows, passo a passo
- 🪟 [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md) — tabela de equivalências, para consulta durante o curso
