# Módulos de conteúdo

70 horas: 12 módulos backend/transversais (69h) + 1h de avaliação teórica integrada.
Cada módulo é autocontido e segue a mesma estrutura:

```
README.md          Objetivos · Teoria · Roteiro prático · Erros comuns · Checklist · No mercado
exercicios.md      Atividades sem passo a passo, com critérios de verificação
cheatsheet.md      Referência rápida (quando o volume de sintaxe justifica)
```

🔵 backend · ⚪ transversal

## Trilha

### Bloco 1 — Fundamentos (10h) ⚪

| # | Módulo | CH | Entrega |
| --- | --- | ---: | --- |
| [00](00-ambiente-e-ferramentas/) | Ambiente e ferramentas | 3 | Ambiente validado |
| [01](01-fundamentos-web-http/) | Fundamentos da web e HTTP | 5 | **E0** — relatório de inspeção HTTP |
| [02](02-arquitetura-desacoplada/) | Arquitetura desacoplada e contrato de API | 2 | Contrato do BiblioCom |

### Bloco 2 — Backend: aplicação, dados e API (29h) 🔵

| # | Módulo | CH | Entrega |
| --- | --- | ---: | --- |
| [03](03-nestjs-primeiros-passos/) | NestJS: módulos, controllers, providers e Swagger | 4 | API respondendo JSON + Swagger UI em `/api/docs` |
| [04](04-entidades-typeorm/) | Entidades: classes que geram o banco | 6 | **E1** — modelo de dados |
| [05](05-migracoes/) | Migrações | 3 | Migrações versionadas |
| [06](06-orm-consultas-crud/) | Repository e QueryBuilder: consultas e CRUD | 5 | **E2** — caderno de consultas |
| [07](07-api-controllers-dtos/) | API: rotas, controllers, DTOs e documentação Swagger | 6 | **E3** — API documentada, com OpenAPI versionado |

### Bloco 3 — Segurança, qualidade e operação (25h) ⚪

| # | Módulo | CH | Entrega |
| --- | --- | ---: | --- |
| [12](12-autenticacao-usuarios/) | Autenticação e autorização na API | 5 | **E5** — login e rotas protegidas |
| [13](13-seguranca/) | Segurança de APIs | 5 | **E6** — checklist OWASP |
| [14](14-testes-e-qualidade/) | Testes e qualidade no backend | 3 | **E7** — suíte de API verde |
| [16](16-deploy/) | Deploy da API | 4 | **E8** — API no ar |
| [17](17-observabilidade-e-manutencao/) | Observabilidade e manutenção da API | 2 | Operação documentada |

## Dependências entre módulos

```
M00 ──▶ M01 ──▶ M02 ──▶ M03 ──▶ M04 ──▶ M05 ──▶ M06 ──▶ M07 ──▶ M12 ──▶ M13 ──▶ M14 ──▶ M16 ──▶ M17
                     🔵                                      ⚪
```

**A regra que estrutura o curso:** cada módulo acrescenta uma camada executável ao mesmo
backend. O Swagger nasce no M03, é completado no M07 e acompanha a API até o deploy.

**Não pule** M01, M02, M04, M05 e M07: todo o resto depende deles.

## Estudo de caso: BiblioCom

Todos os módulos constroem o mesmo sistema, incrementalmente.

| Módulo | O que o BiblioCom ganha | Camada |
| --- | --- | --- |
| M02 | Contrato de API definido (recursos, rotas, formatos) | ⚪ |
| M03 | `backend/` (NestJS) respondendo JSON, com Swagger UI e schema OpenAPI configurados | 🔵 |
| M04 | `Autor`, `Editora`, `Obra`, `Exemplar`, `Associado`, `Emprestimo` | 🔵 |
| M05 | Migrações versionadas e PostgreSQL reproduzível | 🔵 |
| M06 | Consultas de catálogo, disponibilidade, atrasos, relatórios | 🔵 |
| M07 | `/api/obras/`, `/api/emprestimos/`, filtros, paginação e documentação Swagger/OpenAPI revisada | 🔵 |
| M12 | Login, papéis e rotas protegidas na API | ⚪ |
| M13 | Correção de vulnerabilidades da API | ⚪ |
| M14 | Jest/Supertest, lint e CI do backend | ⚪ |
| M16 | API no ar, HTTPS, banco gerenciado e CI/CD | ⚪ |
| M17 | Logs, healthcheck, backup e plano de manutenção | ⚪ |
