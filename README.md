# DPW — Desenvolvimento de Projeto Web

Material didático completo da disciplina **Desenvolvimento de Projeto Web** — 100 horas
(**40h teóricas + 60h práticas**), com projeto integrador em equipe e **atividades
extensionistas** curricularizadas.

> **Stack:** arquitetura desacoplada.
> **Backend** — Python 3.12 · Django 5 · Django REST Framework · PostgreSQL 16
> **Frontend** — React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query
> **Comum** — Git/GitHub · Docker · CI (GitHub Actions) · deploy em PaaS
>
> A ementa fala em "framework escolhido". Ver
> [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md) para a justificativa completa,
> a **ressalva sobre o item "Templates"** e o **modo híbrido** (Django + templates +
> Tailwind + ilhas de React), caso sua instituição exija leitura estrita da ementa.

---

## Como navegar

| Pasta | O que contém |
|---|---|
| [`docs/`](docs/) | Plano de ensino, cronograma, setup, decisões técnicas, glossário, troubleshooting |
| [`modulos/`](modulos/) | 18 módulos de conteúdo (69h), cada um com teoria, roteiro prático, exercícios e checklist |
| [`projeto/`](projeto/) | Projeto integrador em 4 etapas (20h) + trilha extensionista (10h) |
| [`avaliacao/`](avaliacao/) | Rubricas, pesos, política de recuperação e critérios de correção |
| [`recursos/`](recursos/) | Código de apoio, guia do Windows, ponte JS, checklists imprimíveis |

**Comece por aqui:**

1. Estudante → [`docs/plano-de-ensino.md`](docs/plano-de-ensino.md) → [`docs/ambiente-setup.md`](docs/ambiente-setup.md) → [`modulos/00-ambiente-e-ferramentas/`](modulos/00-ambiente-e-ferramentas/)
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

### Backend — 23h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 03 | [Django + DRF: primeiros passos](modulos/03-django-drf-primeiros-passos/) | 3 | 1 | 2 |
| 04 | [Model: classes que geram o banco](modulos/04-models-orm/) | 6 | 3 | 3 |
| 05 | [Migrações](modulos/05-migracoes/) | 3 | 1 | 2 |
| 06 | [ORM: consultas e CRUD](modulos/06-orm-consultas-crud/) | 5 | 2 | 3 |
| 07 | [API: URLs, views e serializers](modulos/07-api-urls-views-serializers/) | 6 | 3 | 3 |

### Frontend — 15h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 08 | [React: fundamentos](modulos/08-react-fundamentos/) | 5 | 2 | 3 |
| 09 | [Tailwind e construção de interfaces](modulos/09-tailwind-e-interface/) | 4 | 1 | 3 |
| 10 | [Rotas e navegação](modulos/10-rotas-e-navegacao/) | 2 | 1 | 1 |
| 11 | [Dados e formulários no cliente](modulos/11-dados-e-formularios/) | 4 | 2 | 2 |

### Transversais e produção — 21h
| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 12 | [Autenticação e gestão de usuários](modulos/12-autenticacao-usuarios/) | 5 | 2 | 3 |
| 13 | [Segurança](modulos/13-seguranca/) | 5 | 3 | 2 |
| 14 | [Testes e qualidade](modulos/14-testes-e-qualidade/) | 3 | 1 | 2 |
| 15 | [Django Admin (back-office)](modulos/15-django-admin/) | 2 | 1 | 1 |
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
bibliocom/
├── backend/          Django + DRF + PostgreSQL     (M03–M07, M15)
└── frontend/         React + TS + Vite + Tailwind  (M08–M11)
```

O domínio é o mesmo nas duas camadas: quando a turma troca de linguagem na semana 8, o
único elemento novo é a tecnologia — as entidades e as regras já são conhecidas. Essa
continuidade é intencional e é o principal amortecedor da transição backend→frontend.

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

## Desenvolvimento no Windows 🪟

Os roteiros usam comandos no formato Linux/macOS. Há três caminhos no Windows — PowerShell
nativo, Git Bash ou WSL2 — todos válidos para a disciplina inteira.

**Quatro coisas quebram em silêncio e não são resolvidas trocando o comando:** `curl` é
alias de `Invoke-WebRequest` no PowerShell; variáveis de ambiente inline não existem;
Gunicorn não roda no Windows; e finais de linha CRLF quebram o deploy.

📖 [`recursos/comandos-windows.md`](recursos/comandos-windows.md) — **leia a seção 2 antes
da primeira aula.**

## Pré-requisito de JavaScript

Os módulos 08–11 assumem **JavaScript moderno** (`const/let`, arrow functions,
destructuring, *spread*, `map`/`filter`, módulos ES, Promises e `async/await`) — pré-requisito
atendido pela turma a que este material se destina.

Para apoio individual de quem chegar com lacunas, e para outras turmas que venham a usar
este material, há uma referência de ponte Python→JavaScript em
[`recursos/js-para-react.md`](recursos/js-para-react.md), com um diagnóstico de 20 minutos
e a compensação de carga prevista em
[`docs/cronograma.md`](docs/cronograma.md#6-variações-de-calendário).

## Licença

Conteúdo sob [CC0 1.0](LICENSE) — uso livre, inclusive comercial e sem atribuição.
