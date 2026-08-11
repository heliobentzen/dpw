# Módulos de conteúdo

70 horas divididas em 16 módulos (69h) + 1h de avaliação teórica integrada.
Cada módulo é autocontido e segue a mesma estrutura:

```
README.md          Objetivos · Teoria · Roteiro prático · Erros comuns · Checklist · No mercado
exercicios.md      Atividades sem passo a passo, com critérios de verificação
cheatsheet.md      Referência rápida (quando o volume de sintaxe justifica)
```

## Trilha

### Bloco 1 — Fundamentos (13h)
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [00](00-ambiente-e-ferramentas/) | Ambiente e ferramentas | 3 | Ambiente validado |
| [01](01-fundamentos-web-http/) | Fundamentos da web e HTTP | 6 | **E0** — relatório de inspeção HTTP |
| [02](02-django-primeiros-passos/) | Django: primeiros passos | 4 | Projeto rodando |

### Bloco 2 — Model / dados (15h)
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [03](03-models-orm/) | Model: classes que geram o banco | 6 | **E1** — modelo de dados |
| [04](04-migracoes/) | Migrações | 3 | Migrações versionadas |
| [05](05-orm-consultas-crud/) | ORM: consultas e CRUD | 6 | **E2** — exercícios de ORM |

### Bloco 3 — View e Template (18h)
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [06](06-urls-e-views/) | URLs e Views | 6 | |
| [07](07-forms-e-validacao/) | Forms e validação | 4 | **E3** — CRUD com formulários |
| [08](08-templates/) | Templates e interface | 6 | |
| [09](09-django-admin/) | Django Admin | 2 | |

### Bloco 4 — Qualidade e produção (18h)
| # | Módulo | CH | Entrega |
|---|---|---:|---|
| [10](10-autenticacao-usuarios/) | Autenticação e gestão de usuários | 5 | **E4** — área autenticada |
| [11](11-seguranca/) | Segurança | 5 | **E5** — checklist OWASP |
| [12](12-testes-e-qualidade/) | Testes e qualidade | 4 | **E6** — suíte verde |
| [13](13-apis-e-integracoes/) | APIs e integrações | 2 | |
| [14](14-deploy/) | Deploy | 5 | **E7** — URL pública |
| [15](15-observabilidade-e-manutencao/) | Observabilidade e manutenção | 2 | |

## Dependências entre módulos

```
M00 ──▶ M01 ──▶ M02 ──▶ M03 ──▶ M04 ──▶ M05 ──┐
                          │                    │
                          └────────────────────┼──▶ M06 ──▶ M07 ──▶ M08
                                               │            │       │
                                               └──▶ M09     │       │
                                                            ▼       ▼
                                                       M10 ──▶ M11 ──▶ M12 ──▶ M13 ──▶ M14 ──▶ M15
```

Regra prática: **não pule M01, M03, M04 e M06** — todos os demais dependem deles.

## Estudo de caso: BiblioCom

Todos os módulos constroem o mesmo sistema, incrementalmente.

| Módulo | O que o BiblioCom ganha |
|---|---|
| M02 | Projeto `config` + app `acervo`, página inicial |
| M03 | `Autor`, `Editora`, `Obra`, `Exemplar`, `Associado`, `Emprestimo` |
| M04 | Campos novos (`isbn`, `ativo`), migração de dados, PostgreSQL |
| M05 | Consultas de catálogo, disponibilidade, atrasos, relatórios |
| M06 | Rotas e views de listagem, detalhe, busca, empréstimo, devolução |
| M07 | Formulários de obra, associado e empréstimo com regras de negócio |
| M08 | Layout base, templates de todas as telas, paginação, mensagens |
| M09 | Admin customizado para a coordenação |
| M10 | Login, papéis (associado / bibliotecário / coordenação), perfil |
| M11 | Correção de vulnerabilidades plantadas de propósito |
| M12 | Testes de model, view, form e regra de negócio |
| M13 | Endpoint JSON de disponibilidade do acervo |
| M14 | Sistema no ar, com PostgreSQL gerenciado e HTTPS |
| M15 | Logs, healthcheck, backup e plano de manutenção |
