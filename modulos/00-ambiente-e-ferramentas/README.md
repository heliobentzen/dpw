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

**Escolha o seu guia — são independentes, siga só um:**

| Seu sistema | Guia | Observação |
|---|---|---|
| 🪟 **Windows** | [`docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) | Completo, do zero, com cada linha explicada. Passos 0 a 7 e 9 |
| 🐧 **Linux** / 🍎 **macOS** | [`docs/ambiente-setup.md`](../../docs/ambiente-setup.md) | Seções 3 a 5, depois a verificação da seção 8 |
| 🪟→🐧 **WSL2** | o guia **Linux**, dentro do Ubuntu | Instale o WSL2 pelo passo 8.1 do guia Windows e siga o guia Linux de lá em diante |

Ao final, rode o `verifica_ambiente.py`. **Só avance com todos os itens em OK.**

> 🪟 **Quem está no Windows não deve seguir o guia Linux "adaptando".** Metade dos problemas
> da primeira semana vem daí. O guia próprio existe justamente para você não precisar
> traduzir nada.

### Passo 2 — Criar o repositório do BiblioCom (30 min)

Se você seguiu o guia de setup até o fim, a pasta e o ambiente virtual já existem. Aqui
transformamos isso num **repositório Git publicado**.

A estrutura a esta altura — repare que o `.venv` fica **dentro de `backend/`**, não na raiz:

```
bibliocom/            ← a raiz do repositório, onde rodamos o git init
└── backend/
    ├── .venv/        ← criado no setup
    └── requirements.txt
```

#### 2a. Iniciar o repositório

##### 🐧 Linux / 🍎 macOS / WSL2 / Git Bash

```bash
cd ~/dev/bibliocom          # ou onde você criou a pasta
git init
```

##### 🪟 Windows (PowerShell)

```powershell
New-Item -ItemType Directory -Force -Path C:\dev\bibliocom
Set-Location C:\dev\bibliocom
git init
git config core.autocrlf input
```

| Linha | O que faz |
|---|---|
| `New-Item -ItemType Directory -Force` | Garante que a pasta existe. Sem esta linha, se você tiver pulado ou interrompido o setup, o `Set-Location` falha com `Cannot find path ... because it does not exist` — e o `git init` seguinte criaria um repositório **na pasta errada** |
| `Set-Location C:\dev\bibliocom` | Entra na pasta (`cd` é apelido deste comando) |
| `git init` | Cria o repositório: passa a existir a pasta oculta `.git` com todo o histórico |
| `git config core.autocrlf input` | Ao commitar, converte CRLF → LF. Sem isto, o deploy do M16 falha com `bad interpreter` e ninguém relaciona a causa ao efeito |

**Deu certo se:** `git status` responde `On branch main` e lista `backend/` como não rastreado.
Se responder `not a git repository`, o `git init` rodou em outro lugar — confira com
`Get-Location`.

#### 2b. Criar os três arquivos da raiz

| Arquivo | Conteúdo | Por quê |
|---|---|---|
| `.gitignore` | 🐧 [setup, seção 10](../../docs/ambiente-setup.md#10-gitignore-do-repositório) · 🪟 [setup Windows, 11.1](../../docs/ambiente-setup-windows.md#111-gitignore) | Mantém `.venv/`, `.env` e `node_modules/` fora do Git |
| `.gitattributes` | 🐧 [setup, seção 10](../../docs/ambiente-setup.md#gitattributes--obrigatório-se-alguém-da-equipe-usa-windows-) · 🪟 [setup Windows, 11.2](../../docs/ambiente-setup-windows.md#112-gitattributes--obrigatório-) | **Não é opcional.** Protege a equipe inteira do problema de finais de linha, inclusive quem nunca configurou nada |
| `README.md` | modelo abaixo | Como subir o projeto em ≤ 5 comandos |

> 🪟 **Não crie esses arquivos pelo Bloco de Notas.** O Windows esconde extensões conhecidas
> e o Bloco de Notas acrescenta `.txt` ao salvar: você digita `.gitignore`, ele grava
> `.gitignore.txt`, o Explorer mostra "`.gitignore`" — e o Git **ignora o arquivo**, porque
> o nome está errado. Como a tela não denuncia nada, o sintoma vira "meu `.gitignore` não
> funciona".
>
> Crie pelo terminal e edite no VS Code:
>
> ```powershell
> New-Item -ItemType File -Path .gitignore, .gitattributes, README.md
> code .
> ```
>
> | Trecho | O que faz |
> |---|---|
> | `New-Item -ItemType File -Path a, b, c` | Cria os três arquivos vazios de uma vez, com o nome exato |
> | `code .` | Abre a pasta inteira no VS Code, para você colar o conteúdo de cada um |
>
> Confira os nomes reais com `Get-ChildItem -Force` (o `-Force` mostra arquivos ocultos —
> tudo que começa com ponto). Se aparecer `.gitignore.txt`, renomeie:
> `Rename-Item .gitignore.txt .gitignore`.

Também **não** use `echo ... > arquivo` para gerar esses arquivos: no PowerShell 5.1 o `>`
grava em UTF-16, e o Git lê a primeira linha como lixo.

Modelo do `README.md` — ele traz **as duas plataformas**, porque quem clona o repositório
pode estar em qualquer uma, e todos os comandos rodam a partir de `backend/`, que é onde
vive o ambiente virtual:

````markdown
# BiblioCom

Sistema de gestão para bibliotecas comunitárias — estudo de caso da disciplina DPW.

## Como rodar

### Linux / macOS

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Windows (PowerShell)

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

Acesse <http://localhost:8000>.
````

> O `.env.example` e o `manage.py` só passam a existir no **M03**, quando o projeto Django é
> criado. Até lá, o `README.md` descreve o destino, não o presente — e é assim mesmo:
> escrever o "como rodar" antes ajuda a perceber quando um passo a mais se tornou necessário.

#### 2c. Primeiro commit

```bash
git status
```

⚠️ **Leia a saída antes de commitar.** Se `.venv/`, `.env`, `db.sqlite3` ou `node_modules/`
aparecerem, seu `.gitignore` está errado, incompleto ou salvou com o nome trocado. Corrija
agora: depois de commitado, o arquivo continua no histórico mesmo que você o remova.

```bash
git add .
git commit -m "chore: inicializa estrutura do projeto"
```

| Linha | O que faz |
|---|---|
| `git add .` | Move para a *staging area* tudo que mudou e não está no `.gitignore` |
| `git commit -m "..."` | Grava o snapshot com a mensagem |

> 🪟 **`warning: CRLF will be replaced by LF` não é erro.** É o `core.autocrlf input`
> fazendo exatamente o que você pediu em 2a: guardando o arquivo com finais de linha do
> Linux. Na sua pasta o arquivo continua com CRLF. Pode seguir.

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

🪟 **Erros de Windows** (política de execução, `python` abrindo a Microsoft Store, `pip install -r`
falhando com `Invalid requirement: 'ÿþd'`, OneDrive travando o Git) estão catalogados em
[`docs/ambiente-setup-windows.md`, passo 12](../../docs/ambiente-setup-windows.md#passo-12--erros-e-diagnóstico).

## ✅ Checklist de saída

- [ ] `python verifica_ambiente.py` termina com "Ambiente pronto"
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
