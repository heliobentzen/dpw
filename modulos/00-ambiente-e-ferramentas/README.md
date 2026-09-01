# M00 — Ambiente e ferramentas

> **CH:** 3h (1h teórica · 2h prática) · **Semana 1** · **Pré-requisito:** nenhum

Módulo complementar: a ementa não pede, mas sem ele nada funciona. Pode virar
pré-atividade assíncrona.

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

Não há comando de "ativar": basta estar dentro da pasta. Outros ecossistemas pedem um passo
explícito. Em Python, por exemplo, você ativa um *ambiente virtual* em cada terminal novo, e
esquecer disso rende uma tarde inteira de erro estranho. Aqui esse passo não existe.

> **O que substitui a ativação é a pasta em que você está.** Rodar `npm run test` dentro de
> `backend/` e dentro de `frontend/` executa suítes diferentes. Quem decide é o
> `package.json` mais próximo.

### 2. Reprodutibilidade

Se o projeto só roda na sua máquina, ele não existe. O que garante que roda em qualquer
lugar:

| Artefato | Função |
|---|---|
| `package.json` | Quais dependências, e em que faixa de versão |
| **`package-lock.json`** | A versão **exata** de cada uma, e das dependências delas |
| `.env.example` | Quais variáveis de ambiente são necessárias (sem os valores) |
| `README.md` | Como subir o projeto em ≤ 5 comandos |
| `docker-compose.yml` | Serviços externos (banco) idênticos para todos |

⚠️ **O arquivo de lock é versionado.** É ele, e não o `package.json`, que garante que você e
seu colega instalem exatamente as mesmas versões. O `package.json` diz `"react": "^19.0.0"`,
o que aceita tanto a 19.0.0 quanto a 19.4.2; o lock registra qual delas foi. Apagar o lock
"para resolver um problema" troca o seu bug por um bug que só aparece na máquina dos outros,
o que é uma forma criativa de não resolver nada.

💼 **No mercado:** a primeira tarefa de quem entra num time é *rodar o projeto localmente*.
Times maduros medem esse tempo. A meta é minutos, não dias.

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

Só três coisas hoje: **Node 20, Git e VS Code**. Docker e PostgreSQL entram no M04, quando
passam a servir para alguma coisa. Instalar tudo agora só antecipa problemas.

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
npm --version      # 9 ou superior
git --version
code --version
```

> Repare no que **não** está na lista: nenhum segundo runtime, nenhum ambiente virtual para
> ativar. Backend e frontend rodam sobre o mesmo Node.

### Passo 2 — Criar o monorepo (25 min)

Aqui começa o conteúdo do módulo. **Digite os comandos, não cole sem ler.** Cada linha
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
| criar a pasta | O projeto fica em `dev/bibliocom`. 🪟 **Fora do OneDrive, sem espaço nem acento no caminho.** O OneDrive tenta sincronizar as 30 mil dependências e trava o Git |
| entrar na pasta | Todo o resto acontece daqui |

#### O manifesto do projeto

```bash
npm init -y
```

Isso cria um `package.json`. Abra-o e **edite** para:

```json
{
  "name": "bibliocom",
  "private": true,
  "workspaces": ["backend", "frontend", "pacotes/*"],
  "scripts": {
    "dev:api": "npm run -w backend start:dev",
    "dev:web": "npm run -w frontend dev"
  }
}
```

| Campo | O que faz |
|---|---|
| `"private": true` | Impede publicação acidental no npm. **Obrigatório** na raiz de um workspace |
| `"workspaces"` | Declara os projetos do monorepo. É esta linha que faz um único `npm install` na raiz resolver os três |
| `scripts` | Atalhos que rodam de qualquer pasta. `npm run dev:api` sobe o backend sem você precisar entrar nele |
| `-w backend` | "*workspace* backend": roda o script lá dentro, a partir da raiz |

As pastas ainda não existem: nascem no M03 e no M08. Declará-las agora é o que faz o
`npm install` já saber onde procurar quando elas chegarem.

**Por que monorepo:** um único PR mostra a mudança completa, de entidade a tela. Com dois
repositórios, a mesma mudança vira dois PRs, que alguém pode mesclar fora de ordem e quebrar
produção na sexta-feira.

**Deu certo se:** `npm install` roda sem erro e cria `node_modules/` e `package-lock.json`.

⚠️ **O `package-lock.json` é versionado; o `node_modules/` não.** O primeiro é a receita, o
segundo é o bolo. Confundir os dois é como versionar 30 mil arquivos que qualquer um
reconstrói com um comando, e é assim que nasce repositório de 500 MB.

### Passo 3 — Versionar o projeto (25 min)

O ambiente existe, mas nada dele está versionado. Agora criamos o repositório e, antes do
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
| `git init` | Cria o repositório. Passa a existir a pasta oculta `.git`, onde mora todo o histórico |
| `git config core.autocrlf input` | Ao commitar, converte CRLF → LF. Relevante sobretudo no Windows: sem isto, o deploy do M16 falha com `bad interpreter` e ninguém relaciona a causa ao efeito |

A estrutura agora:

```
bibliocom/                 ← raiz do repositório
├── package.json           scripts e metadados   — PRECISA entrar no Git
├── package-lock.json      versões exatas        — PRECISA entrar no Git
└── node_modules/          dependências baixadas — NÃO pode entrar no Git
```

A coluna da direita é o assunto do próximo arquivo. O `.gitignore` é onde você diz o que
entra e o que fica de fora.

#### 3b. `.gitignore`: o que fica de fora

Crie `.gitignore` **na raiz** (`bibliocom/`):

```gitignore
# Node
node_modules/
dist/
.vite/
*.tsbuildinfo
coverage/

# Banco local (a partir do M04)

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
| `node_modules/` | É **reconstruível** a partir do `package.json` + `package-lock.json`. São dezenas de milhares de arquivos: versioná-los incha o repositório e gera conflito a cada instalação |
| `dist/`, `coverage/` | Saída de build e de teste. Geradas por comando, não escritas por pessoa |
| `.env` | Contém segredo. **Segredo que entra no Git é segredo vazado** — mesmo removido depois, continua nos commits anteriores |
| `!.env.example` | A `!` **desfaz** o ignore da linha acima. O `.env.example` entra sim: ele documenta *quais* variáveis existem, sem os valores |

> 🪟 **Não crie este arquivo pelo Bloco de Notas.** Ele acrescenta `.txt` ao salvar e o
> Explorer esconde a extensão: você digita `.gitignore`, ele grava `.gitignore.txt`, a tela
> mostra "`.gitignore`" — e o Git ignora o arquivo. Use o VS Code (`code .gitignore`) e
> confira os nomes reais com `Get-ChildItem -Force`.

#### 3c. `.gitattributes`: proteção da equipe

Crie também `.gitattributes` na raiz:

```gitattributes
* text=auto eol=lf

*.sh   text eol=lf
*.ts   text eol=lf
*.tsx  text eol=lf
*.json text eol=lf
*.yml  text eol=lf

*.bat text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
```

O `core.autocrlf` do passo 3a protege **você**; o `.gitattributes` protege **quem clonar**,
inclusive quem não configurou nada. Por isso um é versionado e o outro não.

Ele precisa estar no **primeiro commit**. Arquivo já commitado com CRLF continua com CRLF,
e ninguém vai lembrar disso quando o deploy quebrar no M16.

#### 3d. README: como rodar o projeto

Crie `README.md` na raiz:

````markdown
# BiblioCom

Sistema de gestão para bibliotecas comunitárias. Estudo de caso da disciplina DPW.

## Como rodar

### Linux / macOS

```bash
npm install          # instala backend, frontend e pacotes de uma vez
npm run dev:api          # http://localhost:3000
npm run dev:web          # http://localhost:5173
```

Os mesmos comandos valem no Windows, no macOS e no Linux.
````

Este arquivo é o que decide se alguém consegue rodar seu projeto. Ele cresce junto com o
código: no M03 ganha os comandos do backend, no M04 o banco em Docker. Um README
desatualizado é pior que nenhum, porque manda a pessoa por um caminho que não existe mais.

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

**Deu certo se:** o `git status` listou **seis itens**: `.gitignore`, `.gitattributes`,
`README.md`, `package.json` e `package-lock.json`.

⚠️ Se `node_modules/` ou `.env` aparecerem, pare e corrija o `.gitignore`
antes de commitar. Depois de commitado, o arquivo fica no histórico mesmo que você o apague
no commit seguinte.

> 🪟 **`warning: CRLF will be replaced by LF` não é erro.** É o `core.autocrlf input`
> guardando o arquivo com finais de linha do Linux. Na sua pasta ele continua com CRLF.

#### 3f. Conferir o ambiente

```bash
node ~/dpw/recursos/codigo/verifica-ambiente.mjs
```

Este script **não instala nada**. Ele confere e, para cada falha, diz o comando exato que
corrige. Rode-o sempre que algo parar de funcionar.

**Só avance com os itens da semana 1 em OK.** As dependências do backend e o Docker aparecem
como pendentes até os módulos em que entram, e isso é esperado.


### Passo 4 — Publicar no GitHub (20 min)

Crie o repositório **vazio** em github.com. Sem README, sem `.gitignore`: você já tem os dois, e deixar o GitHub criar outros só rende conflito no primeiro push.

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

Em *Settings → Branches → Add rule*: exija Pull Request antes do merge e ao menos uma
aprovação. Vale para o projeto da equipe também, e evita o clássico push direto na `main` às
vésperas da entrega.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Cannot find module` depois de clonar | Faltou `npm install` na raiz |
| `node_modules/` aparece no `git status` | Falta a linha no `.gitignore` |
| Colega tem versão diferente da sua | O `package-lock.json` não foi commitado, ou alguém o apagou |
| `.env` aparece em `git status` | Falta a linha no `.gitignore` |
| Push rejeitado | Alguém enviou antes; `git pull --rebase origin main` |
| Cinco commits `wip` seguidos | Commit é unidade coerente de mudança, não botão de salvar |

🪟 **Erros de Windows** (política de execução bloqueando o `npm`, OneDrive travando o Git,
`Filename too long` no `node_modules`) estão catalogados em
[`docs/ambiente-setup-windows.md`, passo 11](../../docs/ambiente-setup-windows.md#passo-11--erros-e-diagnóstico).

## ✅ Checklist de saída

- [ ] `node verifica-ambiente.mjs` termina com "Ambiente da etapa M00 pronto"
- [ ] `npm install` roda sem erro na raiz
- [ ] `package.json` com `"private": true` e `workspaces` declarando os três projetos
- [ ] Repositório `bibliocom` no GitHub, com `.gitignore`, `.gitattributes` e `README.md`
- [ ] 🪟 Windows: terminal escolhido, projeto em `C:\dev` (fora do OneDrive), `core.autocrlf input`
      e `core.longpaths` habilitado
- [ ] `node_modules/` **não** versionado; `package-lock.json` **sim**
- [ ] Ao menos 2 commits com mensagem no padrão Conventional Commits
- [ ] Ao menos 1 Pull Request revisado e mesclado por outra pessoa
- [ ] Chave SSH configurada (push sem digitar senha)

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Pro Git (livro completo, em português)](https://git-scm.com/book/pt-br/v2)
- [Learn Git Branching (visual e interativo)](https://learngitbranching.js.org/?locale=pt_BR)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [npm — workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Node.js — resolução de módulos](https://nodejs.org/api/modules.html#all-together)
- 🪟 [`../../docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) — setup completo do Windows, passo a passo
- 🪟 [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md) — tabela de equivalências, para consulta durante o curso
