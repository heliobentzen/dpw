# DPW — Desenvolvimento de Projeto Web

Material didático completo da disciplina **Desenvolvimento de Projeto Web** — 100 horas
(**40h teóricas + 60h práticas**), com projeto integrador em equipe e **atividades
extensionistas** curricularizadas.

> **Stack adotada:** Python 3.12+ · Django 5.x · PostgreSQL · HTML/CSS · Git/GitHub · Docker · Deploy em PaaS.
> A ementa fala em "framework escolhido"; este material adota **Django** por cobrir
> literalmente todos os itens da ementa (classes que geram o banco, migrações,
> ORM/CRUD, mapeamento de URLs, views, templates, autenticação, segurança e deploy).
> Ver [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md) para a justificativa e
> para o caminho de adaptação a outros frameworks (Laravel, Rails, Spring Boot, Next.js).

---

## Como navegar

| Pasta | O que contém |
|---|---|
| [`docs/`](docs/) | Plano de ensino, cronograma, setup de ambiente, decisões técnicas, glossário, troubleshooting |
| [`modulos/`](modulos/) | 16 módulos de conteúdo (70h), cada um com teoria, roteiro prático, exercícios e checklist |
| [`projeto/`](projeto/) | Projeto integrador em 4 etapas (20h) + trilha extensionista (10h) |
| [`avaliacao/`](avaliacao/) | Rubricas, pesos, política de recuperação e critérios de correção |
| [`recursos/`](recursos/) | Código de apoio, snippets, checklists imprimíveis |

**Comece por aqui:**

1. Estudante → [`docs/plano-de-ensino.md`](docs/plano-de-ensino.md) → [`docs/ambiente-setup.md`](docs/ambiente-setup.md) → [`modulos/00-ambiente-e-ferramentas/`](modulos/00-ambiente-e-ferramentas/)
2. Docente → [`docs/guia-do-docente.md`](docs/guia-do-docente.md) → [`docs/cronograma.md`](docs/cronograma.md)
3. Equipe de projeto → [`projeto/README.md`](projeto/README.md)

---

## Trilha de módulos (70h)

| # | Módulo | CH | T | P |
|---|---|---:|---:|---:|
| 00 | [Ambiente e ferramentas](modulos/00-ambiente-e-ferramentas/) | 3 | 1 | 2 |
| 01 | [Fundamentos da web e HTTP](modulos/01-fundamentos-web-http/) | 6 | 4 | 2 |
| 02 | [Django: primeiros passos](modulos/02-django-primeiros-passos/) | 4 | 1 | 3 |
| 03 | [Model: classes que geram o banco](modulos/03-models-orm/) | 6 | 3 | 3 |
| 04 | [Migrações: evoluir o banco](modulos/04-migracoes/) | 3 | 1 | 2 |
| 05 | [ORM: consultas e CRUD](modulos/05-orm-consultas-crud/) | 6 | 2 | 4 |
| 06 | [URLs e Views](modulos/06-urls-e-views/) | 6 | 3 | 3 |
| 07 | [Forms e validação](modulos/07-forms-e-validacao/) | 4 | 2 | 2 |
| 08 | [Templates e interface](modulos/08-templates/) | 6 | 3 | 3 |
| 09 | [Django Admin](modulos/09-django-admin/) | 2 | 1 | 1 |
| 10 | [Autenticação e gestão de usuários](modulos/10-autenticacao-usuarios/) | 5 | 2 | 3 |
| 11 | [Segurança de aplicações web](modulos/11-seguranca/) | 5 | 3 | 2 |
| 12 | [Testes e qualidade](modulos/12-testes-e-qualidade/) | 4 | 2 | 2 |
| 13 | [APIs e integrações](modulos/13-apis-e-integracoes/) | 2 | 1 | 1 |
| 14 | [Deploy / implantação](modulos/14-deploy/) | 5 | 2 | 3 |
| 15 | [Observabilidade e manutenção](modulos/15-observabilidade-e-manutencao/) | 2 | 1 | 1 |
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

Esse recorte foi escolhido porque (a) exercita todos os itens da ementa, (b) tem
modelagem rica o suficiente (relações 1-N e N-N, regras de negócio, permissões) e
(c) é um caso real de **extensão universitária** — bibliotecas comunitárias,
associações de moradores e ONGs costumam controlar acervo em papel ou planilha.

O projeto da equipe é **outro sistema**, de tema livre, definido na Etapa 1. O
BiblioCom é referência de código, não o entregável.

---

## Convenções do material

- 🎯 **Objetivos** — o que você deve saber fazer ao final.
- 📖 **Teoria** — conceito, com o "porquê" antes do "como".
- 🛠️ **Roteiro prático** — passo a passo executável, comando a comando.
- 🧪 **Exercícios** — atividades individuais com gabarito de verificação.
- ⚠️ **Erros comuns** — o que quebra na prática e como diagnosticar.
- ✅ **Checklist de saída** — critério objetivo de conclusão do módulo.
- 💼 **No mercado** — como o assunto aparece em vagas, code reviews e produção.

## Licença

Conteúdo sob [CC0 1.0](LICENSE) — uso livre, inclusive comercial e sem atribuição.
