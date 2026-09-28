# Cronograma — 20 semanas × 5h

Este arquivo e o [plano de ensino](plano-de-ensino.md) são os **únicos** lugares do material
com carga horária. É uma referência administrativa: os módulos indicam só uma duração
relativa (curta, média, longa), e cada instituição ajusta as horas à sua grade.

> **Stack principal:** NestJS + TypeORM + PostgreSQL (backend). O escopo atual do curso
> é backend-first. Ver [`decisoes-tecnicas.md`](decisoes-tecnicas.md).

## 1. Distribuição global

| Bloco | CH | Teórica | Prática |
| --- | ---: | ---: | ---: |
| Módulos de conteúdo (M00–M13) | 55 | 27 | 28 |
| Avaliação teórica integrada | 1 | 1 | 0 |
| Projeto integrador (Etapas 1–3) | 20 | 5 | 15 |
| Atividades extensionistas | 10 | 2 | 8 |
| Reserva da grade (atendimento às equipes, revisão, reposição) | 14 | 5 | 9 |
| **Total** | **100** | **40** | **60** |

A **reserva** existe porque o conteúdo não precisa preencher a grade inteira. Ela fica nas
semanas 16 a 18, quando as equipes mais precisam de atendimento, e absorve imprevistos
(feriado, aula perdida) sem comprimir módulo nenhum.

## 2. Carga horária por módulo

| Módulo | Duração | CH | T | P | Semanas |
| --- | --- | ---: | ---: | ---: | --- |
| M00 Ambiente e ferramentas | média | 3 | 1 | 2 | 1 |
| M01 Fundamentos da web e HTTP | longa | 5 | 3 | 2 | 1–2 |
| M02 Arquitetura desacoplada e contrato de API | curta | 2 | 2 | 0 | 2 |
| M03 NestJS: a primeira API, passo a passo | média | 4 | 2 | 2 | 3 |
| M04 Entidades: classes que geram o banco | longa | 6 | 3 | 3 | 3–4 |
| M05 Migrações | média | 3 | 1 | 2 | 5 |
| M06 Repository e QueryBuilder: consultas e CRUD | longa | 5 | 2 | 3 | 5–6 |
| M07 API: rotas, controllers e DTOs | longa | 6 | 3 | 3 | 7–8 |
| M08 Autenticação e autorização na API | longa | 5 | 2 | 3 | 9 |
| M09 Segurança de APIs | longa | 5 | 3 | 2 | 10–11 |
| M10 Testes e qualidade no backend | média | 3 | 1 | 2 | 12 |
| M11 Tipos compartilhados e contrato OpenAPI | curta | 2 | 1 | 1 | 13 |
| M12 Deploy da API | média | 4 | 2 | 2 | 14 |
| M13 Observabilidade e manutenção | curta | 2 | 1 | 1 | 15 |
| **Total** | | **55** | **27** | **28** | |

**Por bloco:** fundamentos (M00–M02) 10h · backend (M03–M07) 24h · segurança, qualidade e
produção (M08–M13) 21h.

## 3. Cronograma semanal

| Sem | Conteúdo | h | Entregas / marcos |
| ---: | --- | ---: | --- |
| 1 | M00 Ambiente (3h) · M01 Web e HTTP — parte 1 (2h) | 5 | Ambiente validado |
| 2 | M01 Web e HTTP — parte 2 (3h) · M02 Arquitetura desacoplada (2h) | 5 | **E0**: relatório de inspeção HTTP |
| 3 | M03 NestJS (4h) · M04 Entidades — início (1h) | 5 | API respondendo JSON + Swagger |
| 4 | M04 Entidades (5h) | 5 | **E1**: modelo de dados |
| 5 | M05 Migrações (3h) · M06 Consultas — parte 1 (2h) | 5 | Migrações versionadas |
| 6 | M06 Consultas — parte 2 (3h) · **Etapa 1** (2h) | 5 | **E2**: caderno de consultas |
| 7 | M07 API — parte 1 (4h) · **Etapa 1** (1h) | 5 | Tema e organização parceira |
| 8 | M07 API — parte 2 (2h) · **Etapa 1** (3h) | 5 | **E3**: API documentada (OpenAPI) |
| 9 | M08 Autenticação (5h) | 5 | **E4**: login e rotas protegidas |
| 10 | M09 Segurança — parte 1 (2h) · **Etapa 1** (2h) · Avaliação teórica (1h) | 5 | **P1**: definição e planejamento · **A1** |
| 11 | M09 Segurança — parte 2 (3h) · **Etapa 2** (2h) | 5 | **E5**: checklist OWASP · sprint 1 |
| 12 | M10 Testes (3h) · **Etapa 2** (2h) | 5 | **E6**: suíte verde (Vitest + Supertest) |
| 13 | M11 Tipos compartilhados (2h) · **Etapa 2** (3h) | 5 | **E7**: schema versionado |
| 14 | M12 Deploy (4h) · **Extensão** — diagnóstico (1h) | 5 | **E8**: API no ar |
| 15 | M13 Observabilidade (2h) · **Extensão** — plano de ação (3h) | 5 | **X1**: plano de ação |
| 16 | **Etapa 2** (1h) · Reserva — atendimento às equipes (4h) | 5 | Integração |
| 17 | Reserva — atendimento às equipes (5h) | 5 | Correções finais |
| 18 | Reserva — atendimento às equipes (5h) | 5 | **P2**: sistema entregue e implantado |
| 19 | **Etapa 3** (2h) · **Extensão** — execução (3h) | 5 | Rascunho do relatório · **X2**: evidências |
| 20 | **Etapa 3** (2h) · **Extensão** — execução e devolutiva (3h) | 5 | **P3**: relatório + apresentação · **X3**: relato |

**Conferência:** Etapa 1 = 2+1+3+2 = 8h · Etapa 2 = 2+2+3+1 = 8h · Etapa 3 = 2+2 = 4h ·
Extensão = 1+3+3+3 = 10h · Reserva = 4+5+5 = 14h.

## 4. Marcos e prazos

| Código | Marco | Semana | Peso |
| --- | --- | ---: | ---: |
| E0–E8 | Atividades práticas dos módulos (portfólio) | 2–14 | 20% |
| A1 | Avaliação teórica | 10 | 15% |
| P1 | Etapa 1 — definição e planejamento | 10 | 15% |
| P2 | Etapa 2 — sistema | 18 | 30% |
| P3 | Etapa 3 — relatório e encerramento | 20 | 10% |
| X1–X3 | Atividades extensionistas | 15–20 | 10% |

## 5. Variações de calendário

**Semestre de 15 semanas (~6,7h/semana):** mantenha a mesma sequência em encontros maiores.
Se faltar tempo, a **reserva** é a primeira a encolher; **não** comprima as etapas do
projeto nem a extensão.

**Formato intensivo (5 semanas × 20h):** semana 1 = M00–M06; semana 2 = M07 + Etapa 1;
semanas 3 e 4 = Etapa 2 + M08–M13; semana 5 = Etapa 3 + extensão. Inicie o contato
com a organização parceira **antes** do primeiro dia de aula.

**EaD / híbrido:** as 40h teóricas migram bem para assíncrono. As práticas exigem síncrono
ou monitoria, especialmente M05 (migrações), M09 (segurança) e M12 (deploy) — onde o erro é silencioso e o feedback precisa ser rápido.
