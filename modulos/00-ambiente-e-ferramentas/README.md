# M00 — Ambiente e ferramentas

> **CH:** 3h (1h teórica · 2h prática) · **Semana 1** · **Pré-requisito:** nenhum

Módulo complementar (não exigido pela ementa), mas sem ele nada funciona. Pode ser
convertido em pré-atividade assíncrona.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o papel de ambiente virtual, gerenciador de pacotes e controle de versão.
2. Preparar um projeto Node reprodutível, com dependências versionadas.
3. Usar o fluxo Git básico em equipe (branch → commit → push → PR).
4. Diagnosticar sozinho os erros mais comuns de instalação.

---

## 📖 Teoria (1h)

### 1. Por que dependências ficam no projeto

Projeto A precisa do React 18; projeto B, do React 19. Instalados globalmente, um
sobrescreve o outro.

O Node resolve isso por padrão: **cada projeto tem sua própria pasta `node_modules/`**, e o
`import` procura a partir do arquivo que importou, subindo até encontrá-la.

```
maquina/
├── projeto-a/node_modules/     React 18
└── projeto-b/node_modules/     React 19
```

Não há comando de "ativar": basta estar dentro da pasta. Em outros ecossistemas isso exige
um passo explícito — em Python, por exemplo, um *ambiente virtual* que precisa ser ativado
em cada terminal novo, e cuja ausência é uma fonte clássica de erro. Aqui esse passo não
existe, e é um dos motivos de a stack única simplificar o setup.

> **O que substitui a ativação** é a pasta em que você está. Rodar `pnpm test` de dentro de
> `backend/` e de dentro de `frontend/` executa suítes diferentes — o `pnpm` decide pelo
> `package.json` mais próximo.

### 2. Reprodutibilidade

Se o projeto só roda na sua máquina, ele não existe. O que garante que roda em qualquer
lugar:

| Artefato | Função |
|---|---|
| `package.json` | Quais dependências, e em que faixa de versão |
| **`pnpm-lock.yaml`** | A versão **exata** de cada uma, e das dependências delas |
| `.env.example` | Quais variáveis de ambiente são necessárias (sem os valores) |
| `README.md` | Como subir o projeto em ≤ 5 comandos |
| `docker-compose.yml` | Serviços externos (banco) idênticos para todos |

⚠️ **O arquivo de lock é versionado.** É ele — não o `package.json` — que garante que você e
seu colega instalem exatamente as mesmas versões. `package.json` diz `"react": "^19.0.0"`, o
que aceita 19.0.0 e 19.4.2; o lock fixa qual foi. Apagá-lo "para resolver um problema" é
trocar um bug por um bug que só acontece na máquina dos outros.

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

### Passo 1 — Instalar as ferramentas (20 min)

Só três coisas hoje: **Node 20, Git e VS Code**. Docker e PostgreSQL entram no M05, quando
passam a ser usados — instalar tudo agora seria montar peças sem saber para que servem.

Siga o guia do **seu** sistema. Eles são independentes: você abre um só.

| Seu sistema | Guia | O que fazer hoje |
|---|---|---|
| 🪟 **Windows** | [`docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) | Passos 0 a 5 |
| 🐧 **Linux** / 🍎 **macOS** | [`docs/ambiente-setup.md`](../../docs/ambiente-setup.md) | Seções 3 a 5 |
| 🪟→🐧 **WSL2** | instale o WSL2 pelo passo 7.1 do guia Windows, depois siga o guia **Linux** dentro do Ubuntu | — |

> 🪟 **Quem está no Windows não deve seguir o guia Linux "adaptando".** Metade dos problemas
> da primeira semana vem daí. O guia próprio existe para você não precisar traduzir nada.

**Deu certo se:** os quatro comandos abaixo respondem uma versão.

```bash
node --version      # v20 ou superior
pnpm --version      # 9 ou superior
git --version
code --version
```

> Repare no que **não** está na lista: nenhum segundo runtime, nenhum ambiente virtual para
> ativar. Backend e frontend rodam sobre o mesmo Node.

### Passo 2 — Criar o monorepo (25 min)

Aqui começa o conteúdo do módulo. **Digite os comandos, não copie sem ler** — cada linha
corresponde a um conceito que a avaliação teórica cobra.

#### 🐧 Linux / 🍎 macOS / WSL2 / Git Bash

```bash
mkdir -p ~/dev/bibliocom
cd ~/dev/bibliocom
```

#### 🪟 Windows (PowerShell)

```powershell
New-Item -ItemType Directory -Force -Path C:\dev\bibliocom
Set-Location C:\dev\bibliocom
```

| Linha | O que faz |
|---|---|
| criar a pasta | O projeto fica em `dev/bibliocom`. 🪟 **Fora do OneDrive e sem espaço ou acento no caminho** — o OneDrive sincroniza `node_modules` e trava o Git |
| entrar na pasta | Todo o resto acontece daqui |

#### O manifesto do projeto

```bash
pnpm init
```

Isso cria um `package.json`. Abra-o e **edite** para:

```json
{
  "name": "bibliocom",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter backend start:dev",
    "dev:web": "pnpm --filter frontend dev"
  }
}
```

| Campo | O que faz |
|---|---|
| `"private": true` | Impede publicação acidental no npm. **Obrigatório** na raiz de um workspace |
| `scripts` | Atalhos que rodam de qualquer pasta. `pnpm dev:api` sobe o backend sem você precisar entrar nele |

E `pnpm-workspace.yaml`, que declara os projetos do monorepo:

```yaml
packages:
  - "backend"
  - "frontend"
  - "pacotes/*"
```

As pastas ainda não existem — elas nascem no M03 e no M08. Declarar agora é o que faz um
único `pnpm install` na raiz resolver as três quando chegarem.

**Por que monorepo:** um único PR mostra a mudança completa — entidade → DTO → tipo → tela.
Com dois repositórios, a mesma mudança viraria dois PRs, que podem ser mesclados fora de
ordem e quebrar produção.

**Deu certo se:** `pnpm install` roda sem erro e cria `node_modules/` e `pnpm-lock.yaml`.

⚠️ **O `pnpm-lock.yaml` é versionado**, o `node_modules/` não. O primeiro é a receita exata;
o segundo é o resultado, reconstruível a qualquer momento. Confundir os dois é o erro que
faz repositórios de 500 MB.

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
├── package.json           scripts e metadados   — PRECISA entrar no Git
├── pnpm-lock.yaml         versões exatas        — PRECISA entrar no Git
├── pnpm-workspace.yaml    quais são os projetos — PRECISA entrar no Git
└── node_modules/          dependências baixadas — NÃO pode entrar no Git
```

As duas colunas dessa lista resumem o próximo arquivo: o `.gitignore` é onde você diz qual
é qual.

#### 3b. `.gitignore` — o que não entra

Crie `.gitignore` **na raiz** (`bibliocom/`):

```gitignore
# Node
node_modules/
dist/
.vite/
*.tsbuildinfo
coverage/

# Banco local (a partir do M04)
*.sqlite
*.sqlite-journal

# Logs
*.log

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
| `node_modules/` | É **reconstruível** a partir do `package.json` + `pnpm-lock.yaml`. São dezenas de milhares de arquivos: versioná-los incha o repositório e gera conflito a cada instalação |
| `*.sqlite` | É o **seu** banco local. O de outra pessoa é outro; o de produção é outro ainda |
| `dist/`, `coverage/` | Saída de build e de teste. Geradas por comando, não escritas por pessoa |
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
pnpm install          # instala backend, frontend e pacotes de uma vez
pnpm dev:api          # http://localhost:3000
pnpm dev:web          # http://localhost:5173
```

Funciona igual no Windows, macOS e Linux — é o mesmo runtime nos três.
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
`README.md`, `package.json`, `pnpm-lock.yaml` e `pnpm-workspace.yaml`.

⚠️ Se `node_modules/`, `.env` ou algum `.sqlite` aparecerem, pare e corrija o `.gitignore` antes de
commitar. Depois de commitado, o arquivo continua no histórico mesmo que você o remova.

> 🪟 **`warning: CRLF will be replaced by LF` não é erro.** É o `core.autocrlf input`
> guardando o arquivo com finais de linha do Linux. Na sua pasta ele continua com CRLF.

#### 3f. Conferir o ambiente

```bash
node ~/dpw/recursos/codigo/verifica-ambiente.mjs
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
| `Cannot find module` depois de clonar | Faltou `pnpm install` na raiz |
| `node_modules/` aparece no `git status` | Falta a linha no `.gitignore` |
| Colega tem versão diferente da sua | O `pnpm-lock.yaml` não foi commitado, ou alguém o apagou |
| `.env` aparece em `git status` | Falta a linha no `.gitignore` |
| Push rejeitado | Alguém enviou antes; `git pull --rebase origin main` |
| Commit "wip" a cada 3 minutos | Commits devem ser unidades coerentes de mudança |

🪟 **Erros de Windows** (política de execução bloqueando o `pnpm`, OneDrive travando o Git,
`Filename too long` no `node_modules`) estão catalogados em
[`docs/ambiente-setup-windows.md`, passo 12](../../docs/ambiente-setup-windows.md#passo-11--erros-e-diagnóstico).

## ✅ Checklist de saída

- [ ] `node verifica-ambiente.mjs` termina com "Ambiente da etapa M00 pronto"
- [ ] `pnpm install` roda sem erro na raiz
- [ ] `package.json` com `"private": true` e `pnpm-workspace.yaml` declarando os três projetos
- [ ] Repositório `bibliocom` no GitHub, com `.gitignore`, `.gitattributes` e `README.md`
- [ ] 🪟 Windows: terminal escolhido, projeto em `C:\dev` (fora do OneDrive), `core.autocrlf input`
      e `core.longpaths` habilitado
- [ ] `node_modules/` **não** versionado; `pnpm-lock.yaml` **sim**
- [ ] Ao menos 2 commits com mensagem no padrão Conventional Commits
- [ ] Ao menos 1 Pull Request revisado e mesclado por outra pessoa
- [ ] Chave SSH configurada (push sem digitar senha)

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Pro Git (livro completo, em português)](https://git-scm.com/book/pt-br/v2)
- [Learn Git Branching (visual e interativo)](https://learngitbranching.js.org/?locale=pt_BR)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [pnpm — workspaces](https://pnpm.io/workspaces)
- [Node.js — resolução de módulos](https://nodejs.org/api/modules.html#all-together)
- 🪟 [`../../docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) — setup completo do Windows, passo a passo
- 🪟 [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md) — tabela de equivalências, para consulta durante o curso
