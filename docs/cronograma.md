# Cronograma — 20 semanas × 5h = 100h

Este arquivo é a **fonte canônica de carga horária**. Se algum outro documento divergir,
vale o que está aqui.

> **Stack principal:** NestJS + TypeORM + PostgreSQL (backend). O escopo atual do curso
> foi reduzido para backend-first. Ver [`decisoes-tecnicas.md`](decisoes-tecnicas.md).

## 1. Distribuição global

| Bloco | CH | Teórica | Prática |
| --- | ---: | ---: | ---: |
| Módulos de conteúdo (M00–M13) | 69 | 32 | 37 |
| Avaliação teórica integrada | 1 | 1 | 0 |
| Projeto integrador (Etapas 1–3) | 20 | 5 | 15 |
| Atividades extensionistas | 10 | 2 | 8 |
| **Total** | **100** | **40** | **60** |

## 2. Carga horária por módulo

| Módulo | Camada | CH | T | P | Semanas |
| --- | --- | ---: | ---: | ---: | --- |
| M00 Ambiente e ferramentas | ambos | 3 | 1 | 2 | 1 |
| M01 Fundamentos da web e HTTP | — | 5 | 3 | 2 | 1–2 |
| M02 Arquitetura desacoplada e contrato de API | — | 2 | 2 | 0 | 2 |
| M03 NestJS: módulos, controllers e providers | back | 4 | 2 | 2 | 3 |
| M04 Model: classes que geram o banco | back | 6 | 3 | 3 | 3–4 |
| M05 Migrações | back | 3 | 1 | 2 | 4–5 |
| M06 ORM: consultas e CRUD | back | 5 | 2 | 3 | 5–6 |
| M07 API: rotas, controllers e DTOs | back | 6 | 3 | 3 | 6–7 |
| M08 Autenticação e gestão de usuários | backend | 5 | 2 | 3 | 8 |
| M09 Segurança | backend | 5 | 3 | 2 | 9 |
| M10 Testes e qualidade | backend | 3 | 1 | 2 | 10 |
| M11 Tipos compartilhados entre as camadas | opcional | 2 | 1 | 1 | 11 |
| M12 Deploy da API | backend | 4 | 2 | 2 | 12 |
| M13 Observabilidade e manutenção | backend | 2 | 1 | 1 | 13 |
| **Total** | | **69** | **32** | **37** | |

**Distribuição por camada:** backend principal 45h · transversal 9h.

## 3. Cronograma semanal

| Sem | Conteúdo | h | Entregas / marcos |
| ---: | --- | ---: | --- |
| 1 | M00 Ambiente — Node + monorepo (3h) · M01 Web e HTTP — parte 1 (2h) | 5 | Ambiente validado (`node` e `npm` ok) |
| 2 | M01 Web e HTTP — parte 2 (3h) · M02 Arquitetura desacoplada (2h) | 5 | **E0**: relatório de inspeção HTTP |
| 3 | M03 NestJS (4h) · M04 Entidades (1h) | 5 | API respondendo JSON |
| 4 | M04 Models (4h) · M05 Migrações (1h) | 5 | **E1**: modelo de dados do BiblioCom |
| 5 | M05 Migrações (2h) · M06 ORM (3h) | 5 | Migrações versionadas · PostgreSQL |
| 6 | M06 ORM (2h) · M07 API (2h) · **Projeto Etapa 1** (1h) | 5 | **E2**: caderno de consultas ORM |
| 7 | M07 API — DTOs, validação, filtros (4h) · **Etapa 1** (1h) | 5 | **E3**: API CRUD documentada (OpenAPI) |
| 8 | M08 Autenticação (3h) · **Etapa 1** (2h) | 5 | Definição do tema, parceiro e MVP |
| 9 | M09 Segurança (3h) · **Etapa 1** (2h) | 5 | Backlog, riscos e arquitetura |
| 10 | M10 Testes (3h) · **Etapa 1** (2h) | 5 | **P1**: definição e planejamento aprovados · **A1**: avaliação teórica |
| 11 | M11 Tipos compartilhados (2h) · **Etapa 2** — início do desenvolvimento (3h) | 5 | Sprint 1 iniciada |
| 12 | M08 Autenticação ponta a ponta (2h) · **Etapa 2** — desenvolvimento (3h) | 5 | **E5**: login, papéis e rotas protegidas |
| 13 | M09 Segurança (2h) · **Etapa 2** — desenvolvimento (3h) | 5 | **E6**: checklist OWASP aplicado |
| 14 | M10 Testes (3h) · **Etapa 2** — desenvolvimento (2h) | 5 | **E7**: suíte verde (Jest + Supertest) |
| 15 | M11 Tipos compartilhados (2h) · **Extensão** — diagnóstico e plano (3h) | 5 | **X1**: plano de ação extensionista |
| 16 | M12 Deploy da API (4h) · **Etapa 2** (1h) | 5 | **E8**: API implantada |
| 17 | M13 Observabilidade (2h) · **Etapa 2** (3h) | 5 | Integração e correções finais |
| 18 | **Etapa 2** — desenvolvimento, testes e entrega (5h) | 5 | **P2**: sistema entregue e implantado |
| 19 | **Etapa 3** — relatório e encerramento (4h) · **Extensão** (1h) | 5 | Rascunho do relatório · **X2**: evidências |
| 20 | **Etapa 3** — relatório e apresentação (4h) · **Extensão** — devolutiva (1h) | 5 | **P3**: relatório + apresentação · **X3**: relato |

**Conferência:** Etapa 1 = 1+2+2+2+1 = 8h · Etapa 2 = 3+3+3+2+1+3+5 = 20h
de desenvolvimento apoiado pelas aulas · Etapa 3 = 4+4 = 8h · Extensão = 3+1+5+1 = 10h.

## 4. Marcos e prazos

| Código | Marco | Semana | Peso |
| --- | --- | ---: | ---: |
| E0–E8 | Atividades práticas dos módulos (portfólio) | 2–16 | 20% |
| A1 | Avaliação teórica | 10 | 15% |
| P1 | Etapa 1 — definição e planejamento | 10 | 15% |
| P2 | Etapa 2 — sistema | 18 | 30% |
| P3 | Etapa 3 — relatório e encerramento | 19–20 | 10% |
| X1–X3 | Atividades extensionistas | 15–20 | 10% |

## 5. Variações de calendário

**Semestre de 15 semanas (~6,7h/semana):** una as semanas 3+4, 5+6, 9+10 e 14+15. **Não**
comprima as semanas 11–20 (desenvolvimento, relatório e extensão).

**Formato intensivo (5 semanas × 20h):** semana 1 = M00–M06; semana 2 = M07 + Etapa 1;
semanas 3 e 4 = Etapa 2 + M08–M13; semana 5 = Etapa 3 + extensão. Inicie o contato
com a organização parceira **antes** do primeiro dia de aula.

**EaD / híbrido:** as 40h teóricas migram bem para assíncrono. As práticas exigem síncrono
ou monitoria, especialmente M05 (migrações), M13
(segurança) e M12 (deploy) — onde o erro é silencioso e o feedback precisa ser rápido.
