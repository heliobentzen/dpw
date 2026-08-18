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

### Passo 1 — Montar o ambiente (30 min)

Um script faz a montagem inteira: instala o que falta, cria a pasta, o repositório, o
ambiente virtual, as dependências e os arquivos de configuração.

#### 🪟 Windows (PowerShell)

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
git clone https://github.com/heliobentzen/dpw.git $HOME\dpw
& $HOME\dpw\recursos\codigo\setup.ps1
```

#### 🐧 Linux / 🍎 macOS / WSL2

```bash
git clone https://github.com/heliobentzen/dpw.git ~/dpw
bash ~/dpw/recursos/codigo/setup.sh
```

**Deu certo se:** apareceu `Ambiente básico pronto.` no final.

O script é **idempotente**: se parar no meio, ou se você quiser conferir depois, rode de
novo — ele pula o que já existe. Quando algo falta, ele diz exatamente o quê e para, em vez
de seguir e quebrar três passos adiante.

> 🔍 **Abra o script e leia antes de rodar** — ele está comentado justamente para isso.
> Executar script vindo da internet sem ler é um hábito ruim, e este é um bom lugar para não
> adquiri-lo. É também a forma mais rápida de entender o que compõe um ambiente Python.

#### Você instala em três momentos, não de uma vez

| Quando | O que entra | 🪟 Windows | 🐧 Linux/macOS |
|---|---|---|---|
| **Hoje** | Git, Python, VS Code, projeto, venv | `.\setup.ps1` | `./setup.sh` |
| Antes do **M03** | Node 20 + pnpm | `.\setup.ps1 -Etapa frontend` | `./setup.sh frontend` |
| Antes do **M05** | Docker + PostgreSQL | `.\setup.ps1 -Etapa banco` | `./setup.sh banco` |

Menos software na máquina hoje significa menos coisa dando errado ao mesmo tempo. O docente
avisa na aula anterior a cada momento; o próprio módulo também lembra na abertura.

#### Se o script falhar — ou se você quiser fazer à mão

Os guias trazem o passo a passo completo, com **cada linha explicada** e critério de
conferência. São independentes: siga só o do seu sistema.

| Seu sistema | Guia |
|---|---|
| 🪟 **Windows** | [`docs/ambiente-setup-windows.md`](../../docs/ambiente-setup-windows.md) |
| 🐧 **Linux** / 🍎 **macOS** | [`docs/ambiente-setup.md`](../../docs/ambiente-setup.md) |
| 🪟→🐧 **WSL2** | instale o WSL2 pelo passo 8.1 do guia Windows, depois siga o guia **Linux** dentro do Ubuntu |

> 🪟 **Quem está no Windows não deve seguir o guia Linux "adaptando".** Metade dos problemas
> da primeira semana vem daí.

#### Conferir

```bash
python recursos/codigo/verifica_ambiente.py
```

**Só avance com todos os itens em OK.** O script de verificação diz, para cada falha, o
comando exato que a corrige.

### Passo 2 — Entender e publicar o repositório (30 min)

O script já criou a estrutura. Agora você vai **entender o que ele fez** e transformar isso
num repositório publicado.

```
bibliocom/                 ← raiz do repositório (o git init rodou aqui)
├── .git/                  histórico
├── .gitignore             o que NÃO entra no Git
├── .gitattributes         normalização de finais de linha
└── backend/
    ├── .venv/             ambiente virtual — ignorado pelo Git
    └── requirements.txt   dependências com versão fixada
```

Repare: o `.venv` fica **dentro de `backend/`**, não na raiz.

#### 2a. O que o script fez, e por quê

| O que ele fez | Por que importa |
|---|---|
| `git init` | Cria o repositório — a pasta oculta `.git` com todo o histórico |
| `git config core.autocrlf input` | Ao commitar, converte CRLF → LF. Sem isto, o deploy do M16 falha com `bad interpreter` e ninguém relaciona a causa ao efeito |
| Criou o `.gitignore` | Mantém `.venv/`, `.env` e `node_modules/` fora do Git |
| Criou o `.gitattributes` | Mesma proteção de finais de linha, mas para **a equipe inteira** — inclusive quem clonar sem ter configurado nada |
| `python -m venv .venv` | Um Python e uma biblioteca só deste projeto. Sem ele, o projeto A precisa de Django 4.2, o B de 5.1, e um sobrescreve o outro |
| `pip freeze > requirements.txt` | Congela as versões. É o que faz o projeto rodar igual na máquina de outra pessoa |

Confirme você mesmo:

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
git status
```

**Deu certo se:** responde `On branch main` e **não** lista `.venv/`. Se listar, o
`.gitignore` não está sendo respeitado — chame o docente antes de commitar.

> 🪟 Por que o script cria esses arquivos em vez de mandar você criar: o Bloco de Notas
> acrescenta `.txt` ao salvar e o Explorer esconde a extensão. Você digita `.gitignore`, ele
> grava `.gitignore.txt`, a tela mostra "`.gitignore`" — e o Git ignora o arquivo. Para
> conferir nomes reais no PowerShell: `Get-ChildItem -Force`.

#### 2b. Escrever o README

Este é seu, o script não escreve por você — descrever como rodar o projeto é parte do
trabalho. Crie `README.md` na raiz:

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
> criado. Até lá o README descreve o destino, não o presente — e é assim mesmo: escrever o
> "como rodar" antes ajuda a perceber quando um passo a mais se tornou necessário.

💼 **No mercado:** a primeira tarefa de quem entra num time é *rodar o projeto localmente*.
Times maduros medem esse tempo — a meta é minutos, não dias. Seu README é o que decide isso.

#### 2c. Primeiro commit

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

⚠️ Se `.venv/`, `.env` ou `db.sqlite3` aparecerem no `git status`, pare e corrija o
`.gitignore`. Depois de commitado, o arquivo continua no histórico mesmo que você o remova.

> 🪟 **`warning: CRLF will be replaced by LF` não é erro.** É o `core.autocrlf input`
> guardando o arquivo com finais de linha do Linux. Na sua pasta ele continua com CRLF.


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
