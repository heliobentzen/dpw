# DPW — Desenvolvimento de Projeto Web

Material didático completo da disciplina **Desenvolvimento de Projeto Web**.

> **Escopo atual do repositório:** backend-first.
> **Backend** — Node 20 · TypeScript · NestJS 12 · TypeORM · PostgreSQL 16
> **Comum** — monorepo npm · Git/GitHub · Docker · CI · deploy em PaaS
>
> Este repositório foi reduzido para priorizar a API, a regra de negócio e a operação do
> sistema. O frontend foi removido do escopo principal e não é requisito do projeto.
>
> A ementa fala em "framework escolhido". Ver
> [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md) para a justificativa completa,
> incluindo **por que TypeORM e não Prisma** (a ementa pede *classes* que geram o banco).

---

## Como navegar

| Pasta | O que contém |
| --- | --- |
| [`docs/`](docs/) | Plano de ensino, cronograma, setup, decisões técnicas, glossário, troubleshooting |
| [`modulos/`](modulos/) | 14 módulos de conteúdo (M00–M13), cada um com roteiro guiado, exercícios e checklist |
| [`projeto/`](projeto/) | Projeto integrador em 3 etapas + trilha extensionista |
| [`avaliacao/`](avaliacao/) | Rubricas, pesos, política de recuperação e critérios de correção |
| [`recursos/`](recursos/) | Código de apoio, guia do Windows, checklists imprimíveis |

**Comece por aqui:**

1. Estudante → [`docs/plano-de-ensino.md`](docs/plano-de-ensino.md) → [monte o ambiente](#montagem-do-ambiente) → [`modulos/00-ambiente-e-ferramentas/`](modulos/00-ambiente-e-ferramentas/)
2. Docente → [`docs/guia-do-docente.md`](docs/guia-do-docente.md) → [`docs/cronograma.md`](docs/cronograma.md)
3. Equipe de projeto → [`projeto/README.md`](projeto/README.md)

---

## Trilha de módulos

A coluna **Duração** é relativa (curta, média, longa) e serve para você calibrar o fôlego de
cada módulo. A carga horária oficial fica no [plano de ensino](docs/plano-de-ensino.md) e no
[cronograma](docs/cronograma.md).

### Fundamentos

| # | Módulo | Duração |
| --- | --- | --- |
| 00 | [Ambiente e ferramentas](modulos/00-ambiente-e-ferramentas/) | média |
| 01 | [Fundamentos da web e HTTP](modulos/01-fundamentos-web-http/) | longa |
| 02 | [Arquitetura desacoplada e contrato de API](modulos/02-arquitetura-desacoplada/) | curta |

### Backend

| # | Módulo | Duração |
| --- | --- | --- |
| 03 | [NestJS: a primeira API, passo a passo](modulos/03-nestjs-primeiros-passos/) | média |
| 04 | [Entidades: classes que geram o banco](modulos/04-entidades-typeorm/) | longa |
| 05 | [Migrações](modulos/05-migracoes/) | média |
| 06 | [Repository e QueryBuilder: consultas e CRUD](modulos/06-orm-consultas-crud/) | longa |
| 07 | [API: rotas, controllers e DTOs](modulos/07-api-controllers-dtos/) | longa |

### Segurança, qualidade e produção

| # | Módulo | Duração |
| --- | --- | --- |
| 08 | [Autenticação e autorização na API](modulos/08-autenticacao-usuarios/) | longa |
| 09 | [Segurança de APIs](modulos/09-seguranca/) | longa |
| 10 | [Testes e qualidade no backend](modulos/10-testes-e-qualidade/) | média |
| 11 | [Tipos compartilhados e contrato OpenAPI](modulos/11-tipos-compartilhados/) | curta |
| 12 | [Deploy da API](modulos/12-deploy/) | média |
| 13 | [Observabilidade e manutenção](modulos/13-observabilidade-e-manutencao/) | curta |

## Projeto integrador e extensão

| Etapa | Entrega |
| --- | --- |
| [1. Definição e planejamento](projeto/etapa-1-definicao-do-tema/) | P1 |
| [2. Desenvolvimento](projeto/etapa-3-desenvolvimento/) | P2 |
| [3. Relatório e encerramento](projeto/etapa-4-relatorio-e-encerramento/) | P3 |
| [Atividades extensionistas](projeto/extensao/) | X1–X3 |

---

## Estudo de caso condutor

Todos os módulos evoluem **um mesmo sistema**, construído incrementalmente:

> **BiblioCom** — sistema de gestão para uma **biblioteca comunitária**: cadastro de
> acervo, associados, empréstimos, devoluções, reservas e relatórios.

```
bibliocom/                    monorepo (workspace do npm)
├── backend/       NestJS + TypeORM + PostgreSQL   (M03–M07)
├── pacotes/tipos/ @bibliocom/tipos — DTOs e enums (M11)
└── README.md      documentação do escopo backend-first
```

O foco do repositório agora está no backend. O frontend foi removido do escopo principal
do curso e não faz parte da entrega obrigatória do projeto.

O projeto da equipe é **outro sistema**, de tema livre, definido na Etapa 1. O BiblioCom é
referência de código, não o entregável.

---

## Convenções do material

- 🎯 **Objetivos** — o que você deve saber fazer ao final.
- 📖 **Teoria** — conceito, com o "porquê" antes do "como".
- 🛠️ **Etapas guiadas** — cada uma com **Faça** (o comando ou código), **Linha a linha**
  (o porquê de cada parte), **Rode** e **Deu certo se** (como conferir sozinho).
- 🧪 **Exercícios** — atividades individuais com critérios de verificação.
- ⚠️ **Erros comuns** — o que quebra na prática e como diagnosticar.
- ✅ **Checklist de saída** — critério objetivo de conclusão do módulo.
- 💼 **No mercado** — como o assunto aparece em vagas, code reviews e produção.
- 🤖 **IA no fluxo** — onde um assistente de IA ajuda, e o que continua sendo decisão sua.

### Convenção dos blocos de comando

Todo bloco **executável** que difere entre plataformas aparece em pares:

````markdown
```bash
# Linux / macOS / WSL / Git Bash
...
```
```powershell
# Windows PowerShell
...
```
````

Nunca um comentário `# Windows: ...` **dentro** de um bloco Unix. Isso obriga a editar o
comando antes de rodar, que é justo o contrário do que um roteiro deveria fazer. Blocos
idênticos nas três plataformas (`git`, `npm`, `npx`) aparecem uma vez só; blocos que são
**conteúdo de arquivo** (`.env`, `.gitattributes`) usam ` ```ini `, não ` ```bash `.

Achou um bloco sem alternativa? É falha do material, não sua. Abra uma issue.

## Montagem do ambiente

O ambiente é montado **pela turma, comando a comando**. Instalar dependência, configurar
projeto e versionar código são conteúdo da disciplina, não preparação para ela. Não existe
script que faça isso no lugar do aluno; existe um que **confere** o resultado
([`verifica-ambiente.mjs`](recursos/codigo/verifica-ambiente.mjs)).

Em compensação, **nada é instalado antes da hora**. A montagem acontece em três momentos,
cada peça chegando junto com o problema que ela resolve:

| Momento | O que entra | Conferir com |
| --- | --- | --- |
| **Início** (M00) | Node 20, Git, VS Code, monorepo, primeiro commit | `node recursos/codigo/verifica-ambiente.mjs` |
| **Antes do M03** | NestJS CLI e as dependências do backend | `--etapa m03` |
| **Antes do M04** | Docker + PostgreSQL | `--etapa m04` |

**A stack tem um runtime só.** O M00 instala **o Node**, e acabou: não há segundo
ecossistema de pacotes para manter, nem ambiente virtual para lembrar de ativar.

Guias: [`docs/ambiente-setup.md`](docs/ambiente-setup.md) (Linux/macOS) ou
[`docs/ambiente-setup-windows.md`](docs/ambiente-setup-windows.md) (Windows).

## Desenvolvimento no Windows 🪟

O Windows tem **guia de setup próprio e independente** — não é tradução do guia Linux:

📖 **[`docs/ambiente-setup-windows.md`](docs/ambiente-setup-windows.md)** — do zero até a
API rodando, com **cada linha explicada** e a conferência de cada etapa.

Quem usa Windows segue só esse arquivo. Quem usa Linux/macOS segue
[`docs/ambiente-setup.md`](docs/ambiente-setup.md). Não é preciso alternar entre os dois.

Durante o curso, quando um roteiro trouxer comando em formato Linux,
[`recursos/comandos-windows.md`](recursos/comandos-windows.md) traz a tabela de
equivalências e as **armadilhas** que não se resolvem trocando o comando: `curl` é
alias de `Invoke-WebRequest`; variáveis de ambiente inline não existem; `&&` não existe no
PowerShell 5.1; `>` grava arquivos em UTF-16; e um espaço
depois da crase de continuação corta o comando em silêncio.

## Licença

Conteúdo sob [CC0 1.0](LICENSE) — uso livre, inclusive comercial e sem atribuição.
