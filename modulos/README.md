# Módulos de conteúdo

70 horas: 18 módulos (69h) + 1h de avaliação teórica integrada.
Cada módulo é autocontido e segue a mesma estrutura:

```
README.md          Objetivos · Teoria · Roteiro prático · Erros comuns · Checklist · No mercado
exercicios.md      Atividades sem passo a passo, com critérios de verificação
cheatsheet.md      Referência rápida (quando o volume de sintaxe justifica)
```

🔵 backend · 🟣 frontend · ⚪ transversal

## Trilha

### Bloco 1 — Fundamentos (10h) ⚪
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [00](00-ambiente-e-ferramentas/) | Ambiente e ferramentas | 3 | Ambiente validado |
| [01](01-fundamentos-web-http/) | Fundamentos da web e HTTP | 5 | **E0** — relatório de inspeção HTTP |
| [02](02-arquitetura-desacoplada/) | Arquitetura desacoplada e contrato de API | 2 | Contrato do BiblioCom |

### Bloco 2 — Backend: dados e API (23h) 🔵
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [03](03-django-drf-primeiros-passos/) | Django + DRF: primeiros passos | 3 | API respondendo JSON |
| [04](04-models-orm/) | Model: classes que geram o banco | 6 | **E1** — modelo de dados |
| [05](05-migracoes/) | Migrações | 3 | Migrações versionadas |
| [06](06-orm-consultas-crud/) | ORM: consultas e CRUD | 5 | **E2** — caderno de consultas |
| [07](07-api-urls-views-serializers/) | API: URLs, views e serializers | 6 | **E3** — API documentada |

### Bloco 3 — Frontend: interface (15h) 🟣
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [08](08-react-fundamentos/) | React: fundamentos | 5 | |
| [09](09-tailwind-e-interface/) | Tailwind e construção de interfaces | 4 | |
| [10](10-rotas-e-navegacao/) | Rotas e navegação | 2 | |
| [11](11-dados-e-formularios/) | Dados e formulários no cliente | 4 | **E4** — SPA consumindo a API |

### Bloco 4 — Transversais e produção (21h) ⚪
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [12](12-autenticacao-usuarios/) | Autenticação e gestão de usuários | 5 | **E5** — login e rotas protegidas |
| [13](13-seguranca/) | Segurança | 5 | **E6** — checklist OWASP |
| [14](14-testes-e-qualidade/) | Testes e qualidade | 3 | **E7** — suíte verde nas duas camadas |
| [15](15-django-admin/) | Django Admin (back-office) | 2 | |
| [16](16-deploy/) | Deploy dos dois artefatos | 4 | **E8** — API e SPA no ar |
| [17](17-observabilidade-e-manutencao/) | Observabilidade e manutenção | 2 | |

## Dependências entre módulos

```
M00 ──▶ M01 ──▶ M02 ──┬──▶ M03 ──▶ M04 ──▶ M05 ──▶ M06 ──▶ M07 ─┐
                      │                                  🔵     │
                      │                                         │  o contrato
                      │                                         ▼  já existe
                      └────────────────────────────▶ M08 ──▶ M09 ──▶ M10 ──▶ M11
                                                          🟣               │
                                                                          ▼
                                        M12 ──▶ M13 ──▶ M14 ──▶ M16 ──▶ M17
                                                                    ⚪
                                        M15 (independente, a partir do M04)
```

**A regra que estrutura o curso:** o frontend (M08) só começa depois que a API existe
(M07). A turma nunca escreve React contra dados falsos — o `curl` do M01 e a
documentação OpenAPI do M07 são o contrato.

**Não pule** M01, M02, M04, M05 e M07: todo o resto depende deles.

## Estudo de caso: BiblioCom

Todos os módulos constroem o mesmo sistema, incrementalmente.

| Módulo | O que o BiblioCom ganha | Camada |
|---|---|---|
| M02 | Contrato de API definido (recursos, rotas, formatos) | ⚪ |
| M03 | `backend/` (Django+DRF) e `frontend/` (Vite) rodando lado a lado | ⚪ |
| M04 | `Autor`, `Editora`, `Obra`, `Exemplar`, `Associado`, `Emprestimo` | 🔵 |
| M05 | Campos novos, migração de dados, PostgreSQL | 🔵 |
| M06 | Consultas de catálogo, disponibilidade, atrasos, relatórios | 🔵 |
| M07 | `/api/obras/`, `/api/emprestimos/`, filtros, paginação, OpenAPI | 🔵 |
| M08 | Componentes `ObraCard`, `ObraList`, estado e efeitos | 🟣 |
| M09 | Design system em Tailwind: cores, tipografia, componentes base | 🟣 |
| M10 | Rotas `/obras`, `/obras/:id`, `/emprestimos`, layout e 404 | 🟣 |
| M11 | Listagem com cache, busca com *debounce*, formulários validados | 🟣 |
| M12 | Login, papéis, rotas protegidas, sessão ponta a ponta | ⚪ |
| M13 | Correção de vulnerabilidades plantadas nas duas camadas | ⚪ |
| M14 | pytest no backend, Vitest + Testing Library no frontend | ⚪ |
| M15 | Admin customizado para a coordenação da biblioteca | 🔵 |
| M16 | API e SPA no ar, mesmo site, HTTPS, CI/CD | ⚪ |
| M17 | Logs, healthcheck, backup e plano de manutenção | ⚪ |

## Pré-requisito de JavaScript

Os módulos 08–11 assumem JS moderno (`const/let`, arrow functions, destructuring,
`map`/`filter`/`reduce`, módulos ES, Promises, `async/await`, *spread*, encadeamento
opcional) — **pré-requisito atendido**.

As 15h do bloco de frontend foram dimensionadas com essa premissa: elas são para o modelo
mental do React (estado, efeitos, imutabilidade, cache, contrato), não para sintaxe. Se a
turma travar em `map` ou destructuring, o problema não é o módulo — é o pré-requisito, e a
referência de consulta está em
[`../recursos/js-para-react.md`](../recursos/js-para-react.md).
