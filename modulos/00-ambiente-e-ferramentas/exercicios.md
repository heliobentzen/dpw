# M00 — Exercícios

> **Trabalho individual.** Todos os exercícios são feitos e entregues por você, sozinho.
>
> **Entrega:** um único link — a URL do seu repositório `dpw-exercicios` no GitHub. Tudo
> que comprova os cinco exercícios está lá dentro, e o `README.md` é o índice que leva a
> cada evidência.

---

## Como entregar

### 1. Crie o repositório

**Público**, chamado `dpw-exercicios`, na sua conta. Separado do `bibliocom`: este é o seu
caderno; aquele é o sistema.

```bash
mkdir -p ~/dev/dpw-exercicios && cd ~/dev/dpw-exercicios
git init
```

```powershell
New-Item -ItemType Directory -Force -Path C:\dev\dpw-exercicios
Set-Location C:\dev\dpw-exercicios
git init
```

### 2. Estrutura obrigatória

```
dpw-exercicios/
├── README.md              ← o índice da entrega (modelo abaixo)
├── .gitignore
├── .gitattributes
├── package.json
├── package-lock.json
├── .env.example
└── evidencias/
    ├── e1-ambiente.md
    ├── e2-arqueologia.md
    ├── e3-conflito.md
    ├── e4-desfazer.md
    └── e5-diagnostico.md
```

### 3. Como gerar um link permanente no GitHub

Metade da nota é conseguir **provar** o que você fez. Três tipos de link:

| O que provar | Como obter o link |
|---|---|
| Um **commit** | Abra o commit no GitHub e copie a URL: `…/commit/<hash>` |
| Um **trecho de arquivo** | Abra o arquivo, clique no número da linha (arraste para várias) e tecle `y` — a URL vira permanente, presa ao commit |
| O **histórico ramificado** | `…/network` mostra o grafo de branches e merges |

⚠️ Sem teclar `y`, o link aponta para a branch e **muda** a cada commit novo. Quando o
professor abrir, vai encontrar outra coisa.

### 4. Modelo do `README.md`

````markdown
# DPW — Exercícios do M00

**Nome:** Seu Nome Completo
**Ambiente:** Windows 11 + PowerShell 7 (ou Ubuntu 24.04, macOS 15…)

| # | Exercício | Evidência |
|---|---|---|
| 1 | Ambiente reprodutível | [evidencias/e1-ambiente.md](evidencias/e1-ambiente.md) · [commit inicial](https://github.com/USUARIO/dpw-exercicios/commit/HASH) |
| 2 | Arqueologia de histórico | [evidencias/e2-arqueologia.md](evidencias/e2-arqueologia.md) |
| 3 | Conflito de merge | [evidencias/e3-conflito.md](evidencias/e3-conflito.md) · [commit de merge](…/commit/HASH) · [grafo](…/network) |
| 4 | Desfazer sem pânico | [evidencias/e4-desfazer.md](evidencias/e4-desfazer.md) · [commit de revert](…/commit/HASH) |
| 5 | Diagnóstico | [evidencias/e5-diagnostico.md](evidencias/e5-diagnostico.md) |

## Como rodar

```bash
npm install
npm run verificar
```
````

---

## E00.1 — Ambiente reprodutível

Monte o repositório de forma que **outra pessoa consiga reproduzi-lo**.

1. `npm init -y` e edite o `package.json`: `"private": true` e um script
   `"verificar": "node --version && npm --version"`.
2. Instale uma dependência qualquer para o lock existir: `npm install -D prettier`.
3. Crie o `.gitignore` (com `node_modules/`), o `.gitattributes` e o
   `.env.example` com as chaves `SESSION_SECRET=` e `DATABASE_URL=`, **sem valores**.
4. Commit.

**Prova de que é reprodutível** — rode e registre a saída:

```bash
rm -rf node_modules
npm ci
git status --short
```

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
git status --short
```

`git status` precisa sair **vazio**: o `package-lock.json` não pode ter mudado.

**Em `evidencias/e1-ambiente.md`:**
- a saída completa dos três comandos, em bloco de código;
- link permanente para o seu `.gitignore` no GitHub;
- uma frase: por que o `package-lock.json` é versionado e o `node_modules/` não?

**Verificação:**
- [ ] `git status` vazio depois de reinstalar
- [ ] `node_modules/` **não** aparece no repositório do GitHub
- [ ] `.env.example` tem as chaves e nenhum valor
- [ ] `--frozen-lockfile` não acusou divergência

---

## E00.2 — Arqueologia de histórico

Clone um repositório público real — use `nestjs/nest`, a stack da disciplina:

```bash
git clone --filter=blob:none https://github.com/nestjs/nest.git /tmp/nest
cd /tmp/nest
```

Responda com **o comando que usou e a saída**:

| # | Pergunta |
|---|---|
| 1 | Quantos commits o repositório tem? |
| 2 | Qual foi o primeiro commit, e em que data? |
| 3 | Quem mais modificou `packages/core/injector/injector.ts`? |
| 4 | O que mudou no último commit que tocou esse arquivo? |
| 5 | Quantos commits foram feitos nos últimos 90 dias? |

> Dica: `git rev-list --count`, `git log --reverse`, `git shortlog -sn --`, `git show`,
> `git log --since`.

**Em `evidencias/e2-arqueologia.md`:** as 5 perguntas, cada uma com o comando em bloco de
código e a saída (pode recortar as linhas relevantes).

**Verificação:**
- [ ] 5 comandos, todos reais e executados
- [ ] Saídas coladas, não descritas
- [ ] Nenhuma resposta usa a interface web do GitHub — o exercício é sobre `git`

---

## E00.3 — Conflito de merge, provocado sozinho ⭐

Você **vai** viver isso na Etapa 3. Melhor descobrir agora, sem a nota do projeto em jogo e
sem ser às 23h da véspera. E dá para provocar sozinho: duas branches suas, saindo do mesmo
ponto.

```bash
# no seu dpw-exercicios, com a main já commitada
git switch -c feat/titulo-a
# edite a LINHA 1 do README.md e commit
git switch main
git merge feat/titulo-a

git switch -c feat/titulo-b main~1     # ← parte da main ANTES do merge
# edite a MESMA linha 1, de outro jeito, e commit
git switch main
git merge feat/titulo-b                # ← conflito
```

O `main~1` é o truque. A segunda branch nasce do estado anterior, que é exatamente o que
acontece quando um colega começou a trabalhar antes de você integrar o seu.

Resolva **à mão**, entendendo os marcadores:

```
<<<<<<< HEAD
versão que já está na main
=======
versão da sua branch
>>>>>>> feat/titulo-b
```

**Em `evidencias/e3-conflito.md`:**
- a saída do `git merge` que acusou o conflito;
- o conteúdo do arquivo **durante** o conflito, com os marcadores (copie antes de resolver);
- a saída de `git log --graph --oneline --all`;
- link permanente para o **commit de merge** e para a página `…/network`;
- em 3 linhas: **por que o Git não conseguiu resolver sozinho?**

**Verificação:**
- [ ] O grafo mostra duas branches convergindo num commit de merge
- [ ] O commit de merge tem **dois pais** (`git show --format=%P <hash>` devolve dois hashes)
- [ ] Nenhum marcador `<<<<<<<` sobrou no arquivo final
- [ ] A explicação fala de *linhas alteradas em ambos os lados*, não "deu erro"

---

## E00.4 — Desfazer sem pânico

Cinco situações que acontecem toda semana, e que separam quem resolve em 10 segundos de quem
apaga a pasta e clona de novo. Execute cada uma **de verdade** no `dpw-exercicios` e registre
o comando e o efeito.

| # | Cenário | Comando |
|---|---|---|
| 1 | Editei um arquivo e quero descartar a alteração (ainda não fiz `add`) | |
| 2 | Fiz `git add` do arquivo errado e quero tirá-lo do stage | |
| 3 | A mensagem do último commit está errada (ainda não fiz push) | |
| 4 | Quero desfazer o último commit, mas manter as alterações no working directory | |
| 5 | Quero reverter um commit **já enviado** para o remoto | |

> Dica: `git restore`, `git restore --staged`, `git commit --amend`, `git reset --soft
> HEAD~1`, `git revert`.

**Em `evidencias/e4-desfazer.md`:**
- a tabela preenchida;
- para cada caso, a saída de `git status` ou `git log --oneline -3` **antes e depois**;
- a saída de `git reflog -10` no final;
- link permanente para o **commit de revert** do caso 5;
- em 3 linhas: **por que o caso 5 é diferente do 4?**

> ⚠️ **O `reflog` só registra o que move o `HEAD`** — ou seja, os casos 3, 4 e 5. Os casos
> 1 e 2 mexem no *working directory* e no *stage*, não no histórico, e por isso **não
> aparecem lá**. É a prova de `git status` antes/depois que vale para eles. Perceber essa
> diferença é parte do exercício: `restore` desfaz o trabalho; `reset` e `revert` mexem no
> histórico.

**Verificação:**
- [ ] O `reflog` mostra as operações 3, 4 e 5 (`commit (amend)`, `reset`, `revert`)
- [ ] Os casos 1 e 2 estão comprovados por `git status` antes/depois
- [ ] Existe um commit de `Revert "..."` no histórico público
- [ ] A explicação menciona que reescrever histórico já enviado quebra o repositório de quem já baixou

---

## E00.5 — Roteiro de diagnóstico

Um colega diz: *"Instalei o pacote, mas o `import` fala que não existe."*

Escreva um roteiro de diagnóstico em **até 5 passos**. Cada passo precisa ter:

| Coluna | Conteúdo |
|---|---|
| Comando | O que rodar, exatamente |
| Se a saída for X | O que isso indica |
| Então | Qual a correção, ou qual o próximo passo |

Depois, **prove que o roteiro funciona**: quebre o ambiente de propósito (apague
`node_modules`, ou rode o comando da pasta errada, ou desinstale o pacote), rode seu próprio
roteiro e registre a saída até achar a causa.

**Em `evidencias/e5-diagnostico.md`:** a tabela de 5 passos + a demonstração com a falha
provocada.

**Verificação:**
- [ ] Os passos vão do mais barato ao mais caro (não comece reinstalando tudo)
- [ ] Cada passo **elimina** uma hipótese — não é lista de comandos soltos
- [ ] A demonstração mostra o roteiro encontrando a causa real

> Dos cinco, é o que mais serve na vida profissional: treina **método**, não
> comando decorado.

---

## Entrega

**Envie apenas a URL do repositório:** `https://github.com/SEU-USUARIO/dpw-exercicios`

Antes de enviar, abra esse link numa **janela anônima** e confira:

- [ ] O repositório é público e abre sem login
- [ ] O `README.md` aparece na home, com a tabela de evidências preenchida
- [ ] **Todos os links da tabela funcionam** ao clicar
- [ ] Os links de commit são permanentes (`…/commit/<hash>`), não `…/blob/main/…`
- [ ] Nenhum arquivo `.env` com valor real foi commitado
- [ ] `node_modules/` não está no repositório

> Link quebrado é evidência ausente. O que o professor não conseguir abrir, não existiu.

## Critérios de correção

| Exercício | O que é verificado | Peso |
|---|---|---|
| E00.1 | Reprodutibilidade comprovada; `.gitignore` correto; sem segredo versionado | 20% |
| E00.2 | 5 comandos reais com saída colada | 15% |
| E00.3 | Commit de merge com dois pais; explicação correta da causa | 25% |
| E00.4 | `reflog` com as 5 operações; commit de revert público | 25% |
| E00.5 | Roteiro que elimina hipóteses, com demonstração | 15% |

**Autoria individual.** Cada repositório tem seus próprios hashes, datas e autor. Trabalhos
com histórico idêntico ao de outra pessoa são tratados pela política de integridade do
plano de ensino.
