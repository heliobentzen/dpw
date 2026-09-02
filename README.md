# DPW — Desenvolvimento de Projeto Web

Material didático completo da disciplina **Desenvolvimento de Projeto Web** — 100 horas


> **Stack:** TypeScript ponta a ponta, em arquitetura desacoplada.
> **Backend** — Node 20 · TypeScript · NestJS 12 · TypeORM · PostgreSQL 16
> **Frontend** — React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query
> **Comum** — monorepo npm · tipos compartilhados · Git/GitHub · Docker · CI · deploy em PaaS
>
> **Uma linguagem em toda a stack.** Na semana 8, quando a turma passa para o frontend, ela
> troca de camada e não de idioma. É o que mais suaviza a virada do curso.
>
> A ementa fala em "framework escolhido". Ver
> [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md) para a justificativa completa,
> incluindo **por que TypeORM e não Prisma** (a ementa pede *classes* que geram o banco) e
> a **ressalva sobre o item "Templates"**.

---

## Como navegar

| Pasta | O que contém |
|---|---|
| [`docs/`](docs/) | Plano de ensino, cronograma, setup, decisões técnicas, glossário, troubleshooting |
| [`modulos/`](modulos/) | 18 módulos de conteúdo (69h), cada um com teoria, roteiro prático, exercícios e checklist |
| [`projeto/`](projeto/) | Projeto integrador em 4 etapas (20h) + trilha extensionista (10h) |
| [`avaliacao/`](avaliacao/) | Rubricas, pesos, política de recuperação e critérios de correção |
| [`recursos/`](recursos/) | Código de apoio, guia do Windows, referência de JS/TS, checklists imprimíveis |

**Comece por aqui:**

1. Estudante → [`docs/plano-de-ensino.md`](docs/plano-de-ensino.md) → [monte o ambiente](#montagem-do-ambiente) → [`modulos/00-ambiente-e-ferramentas/`](modulos/00-ambiente-e-ferramentas/)
2. Docente → [`docs/guia-do-docente.md`](docs/guia-do-docente.md) → [`docs/cronograma.md`](docs/cronograma.md)
3. Equipe de projeto → [`projeto/README.md`](projeto/README.md)

---

## Trilha de módulos (69h)

### Fundamentos — 10h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 00 | [Ambiente e ferramentas](modulos/00-ambiente-e-ferramentas/) | 3 | 1 | 2 |
| 01 | [Fundamentos da web e HTTP](modulos/01-fundamentos-web-http/) | 5 | 3 | 2 |
| 02 | [Arquitetura desacoplada e contrato de API](modulos/02-arquitetura-desacoplada/) | 2 | 2 | 0 |

### Backend — 24h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 03 | [NestJS: módulos, controllers e providers](modulos/03-nestjs-primeiros-passos/) | 4 | 2 | 2 |
| 04 | [Entidades: classes que geram o banco](modulos/04-entidades-typeorm/) | 6 | 3 | 3 |
| 05 | [Migrações](modulos/05-migracoes/) | 3 | 1 | 2 |
| 06 | [Repository e QueryBuilder: consultas e CRUD](modulos/06-orm-consultas-crud/) | 5 | 2 | 3 |
| 07 | [API: rotas, controllers e DTOs](modulos/07-api-controllers-dtos/) | 6 | 3 | 3 |

### Frontend — 14h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 08 | [React: fundamentos](modulos/08-react-fundamentos/) | 4 | 1 | 3 |
| 09 | [Tailwind e construção de interfaces](modulos/09-tailwind-e-interface/) | 4 | 1 | 3 |
| 10 | [Rotas e navegação](modulos/10-rotas-e-navegacao/) | 2 | 1 | 1 |
| 11 | [Dados e formulários no cliente](modulos/11-dados-e-formularios/) | 4 | 2 | 2 |

### Transversais e produção — 21h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 12 | [Autenticação e gestão de usuários](modulos/12-autenticacao-usuarios/) | 5 | 2 | 3 |
| 13 | [Segurança](modulos/13-seguranca/) | 5 | 3 | 2 |
| 14 | [Testes e qualidade](modulos/14-testes-e-qualidade/) | 3 | 1 | 2 |
| 15 | [Tipos compartilhados entre as camadas](modulos/15-tipos-compartilhados/) | 2 | 1 | 1 |
| 16 | [Deploy dos dois artefatos](modulos/16-deploy/) | 4 | 2 | 2 |
| 17 | [Observabilidade e manutenção](modulos/17-observabilidade-e-manutencao/) | 2 | 1 | 1 |
| — | Avaliação teórica integrada (semana 10) | 1 | 1 | 0 |
| | **Subtotal** | **70** | **33** | **37** |

## Projeto integrador (20h) + Extensão (10h)

| Etapa | CH | T | P |
|---|---:|---:|---:|
| [1. Definição do tema](projeto/etapa-1-definicao-do-tema/) | 4 | 2 | 2 |
| [2. Planejamento](projeto/etapa-2-planejamento/) | 4 | 1 | 3 |
| [3. Desenvolvimento do sistema](projeto/etapa-3-desenvolvimento/) | 8 | 0 | 8 |
| [4. Relatório técnico e encerramento](projeto/etapa-4-relatorio-e-encerramento/) | 4 | 2 | 2 |
| [Atividades extensionistas](projeto/extensao/) | 10 | 2 | 8 |
| **Subtotal** | **30** | **7** | **23** |

**Total geral: 100h — 40h teóricas + 60h práticas.**

---

## Estudo de caso condutor

Todos os módulos evoluem **um mesmo sistema**, construído incrementalmente:

> **BiblioCom** — sistema de gestão para uma **biblioteca comunitária**: cadastro de
> acervo, associados, empréstimos, devoluções, reservas e relatórios.

```
bibliocom/                    monorepo (workspaces do npm)
├── backend/       NestJS + TypeORM + PostgreSQL   (M03–M07)
├── frontend/      React + Vite + Tailwind         (M08–M11)
└── pacotes/tipos/ @bibliocom/tipos — DTOs e enums (M15)
```

O domínio **e a linguagem** são os mesmos nas duas camadas: o TypeScript do M04 é o mesmo do
M11. A continuidade é proposital, e é o que evita que a semana 8 pareça o começo de outro
curso.

O projeto da equipe é **outro sistema**, de tema livre, definido na Etapa 1. O BiblioCom é
referência de código, não o entregável.

---

## Convenções do material

- 🎯 **Objetivos** — o que você deve saber fazer ao final.
- 📖 **Teoria** — conceito, com o "porquê" antes do "como".
- 🛠️ **Roteiro prático** — passo a passo executável, comando a comando.
- 🧪 **Exercícios** — atividades individuais com critérios de verificação.
- ⚠️ **Erros comuns** — o que quebra na prática e como diagnosticar.
- ✅ **Checklist de saída** — critério objetivo de conclusão do módulo.
- 💼 **No mercado** — como o assunto aparece em vagas, code reviews e produção.
- 🔵 **Backend** / 🟣 **Frontend** — camada tratada no trecho.

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
|---|---|---|
| **Semana 1** (M00) | Node 20, Git, VS Code, monorepo, primeiro commit | `node recursos/codigo/verifica-ambiente.mjs` |
| **Antes do M03** | NestJS CLI e as dependências do backend | `--etapa m03` |
| **Antes do M04** | Docker + PostgreSQL | `--etapa m04` |

**A stack tem um runtime só.** A semana 1 instala **o Node**, e acabou: não há segundo
ecossistema de pacotes para manter, nem ambiente virtual para lembrar de ativar.

Guias: [`docs/ambiente-setup.md`](docs/ambiente-setup.md) (Linux/macOS) ou
[`docs/ambiente-setup-windows.md`](docs/ambiente-setup-windows.md) (Windows).

## Desenvolvimento no Windows 🪟

O Windows tem **guia de setup próprio e independente** — não é tradução do guia Linux:

📖 **[`docs/ambiente-setup-windows.md`](docs/ambiente-setup-windows.md)** — do zero até os
dois servidores rodando, com **cada linha explicada** e a conferência de cada etapa.

Quem usa Windows segue só esse arquivo. Quem usa Linux/macOS segue
[`docs/ambiente-setup.md`](docs/ambiente-setup.md). Não é preciso alternar entre os dois.

Durante o curso, quando um roteiro trouxer comando em formato Linux,
[`recursos/comandos-windows.md`](recursos/comandos-windows.md) traz a tabela de
equivalências e as **seis armadilhas** que não se resolvem trocando o comando: `curl` é
alias de `Invoke-WebRequest`; variáveis de ambiente inline não existem; `&&` não existe no
PowerShell 5.1; `>` grava arquivos em UTF-16; e um espaço
depois da crase de continuação corta o comando em silêncio.

## Pré-requisito de JavaScript

Os módulos 08–11 assumem **JavaScript moderno** (`const/let`, arrow functions,
destructuring, *spread*, `map`/`filter`, módulos ES, Promises e `async/await`) — pré-requisito
atendido pela turma a que este material se destina.

Para apoio individual de quem chegar com lacunas, e para outras turmas que venham a usar
este material, há uma referência de JavaScript moderno em
[`recursos/js-para-react.md`](recursos/js-para-react.md), com um diagnóstico de 20 minutos
e a compensação de carga prevista em
[`docs/cronograma.md`](docs/cronograma.md#6-variações-de-calendário).

## Licença

Conteúdo sob [CC0 1.0](LICENSE) — uso livre, inclusive comercial e sem atribuição.
