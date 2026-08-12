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

### Passo 1 — Instalar e verificar (30 min)

Siga [`../../docs/ambiente-setup.md`](../../docs/ambiente-setup.md), seções 3 a 5, e rode
o script `verifica_ambiente.py` da seção 8. **Só avance com todos os itens em OK.**

> 🪟 **No Windows, leia antes a seção 1.1** — você precisa escolher entre PowerShell, Git
> Bash e WSL2, e conhecer as quatro armadilhas que não são tradução de comando.

### Passo 2 — Criar o repositório do BiblioCom (30 min)

```bash
# Linux/macOS/WSL/Git Bash
mkdir bibliocom && cd bibliocom
git init
python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install "django>=5.0,<6.0" python-dotenv
pip freeze > requirements.txt
```

```powershell
# Windows PowerShell
mkdir bibliocom; cd bibliocom
git init
git config core.autocrlf input        # evita CRLF quebrar o deploy no M16
python -m venv .venv
.venv\Scripts\Activate.ps1            # se bloquear: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

python -m pip install --upgrade pip
pip install "django>=5.0,<6.0" python-dotenv
pip freeze > requirements.txt
```

Crie o `.gitignore` (seção 10 do setup), o **`.gitattributes`** e o `README.md`.

> 🪟 **O `.gitattributes` não é opcional se alguém da equipe usa Windows.** Sem ele, um
> `build.sh` salvo com CRLF quebra o deploy no M16 com a mensagem `bad interpreter` — e
> ninguém relaciona a causa ao efeito. Conteúdo em
> [`../../docs/ambiente-setup.md`](../../docs/ambiente-setup.md#gitattributes--obrigatório-se-alguém-da-equipe-usa-windows-).

```markdown
# BiblioCom

Sistema de gestão para bibliotecas comunitárias — estudo de caso da disciplina DPW.

## Como rodar

```bash
# Linux / macOS / WSL / Git Bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

```powershell
# Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

Acesse <http://localhost:8000>.
```

Primeiro commit:

```bash
git add .
git commit -m "chore: inicializa projeto com venv e dependencias"
```

### Passo 3 — Publicar no GitHub (20 min)

Crie o repositório **vazio** em github.com (sem README, sem .gitignore — você já tem) e:

```bash
git remote add origin git@github.com:<seu-usuario>/bibliocom.git
git branch -M main
git push -u origin main
```

### Passo 4 — Ciclo de branch e Pull Request (40 min, em duplas)

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

### Passo 5 — Proteger a branch principal (extra, 5 min)

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
| 🪟 `Activate.ps1 cannot be loaded` | Política do PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| 🪟 Git marca o arquivo inteiro como alterado | Finais de linha; falta `.gitattributes` + `core.autocrlf input` |

## ✅ Checklist de saída

- [ ] `python verifica_ambiente.py` termina com "Ambiente pronto"
- [ ] Repositório `bibliocom` no GitHub, com `.gitignore`, `.gitattributes` e `README.md`
- [ ] 🪟 Windows: caminho escolhido (PowerShell / Git Bash / WSL2) e `core.autocrlf input`
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
- 🪟 [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md) — equivalências e armadilhas do Windows
