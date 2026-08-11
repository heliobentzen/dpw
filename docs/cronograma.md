# Cronograma — 20 semanas × 5h = 100h

Este arquivo é a **fonte canônica de carga horária**. Se algum outro documento divergir,
vale o que está aqui.

## 1. Distribuição global

| Bloco | CH | Teórica | Prática |
|---|---:|---:|---:|
| Módulos de conteúdo (M00–M15) | 69 | 32 | 37 |
| Avaliação teórica integrada | 1 | 1 | 0 |
| Projeto integrador (Etapas 1–4) | 20 | 5 | 15 |
| Atividades extensionistas | 10 | 2 | 8 |
| **Total** | **100** | **40** | **60** |

## 2. Carga horária por módulo

| Módulo | CH | T | P | Semanas |
|---|---:|---:|---:|---|
| M00 Ambiente e ferramentas | 3 | 1 | 2 | 1 |
| M01 Fundamentos da web e HTTP | 6 | 4 | 2 | 1–2 |
| M02 Django: primeiros passos | 4 | 1 | 3 | 2–3 |
| M03 Model: classes que geram o banco | 6 | 3 | 3 | 3–4 |
| M04 Migrações | 3 | 1 | 2 | 4–5 |
| M05 ORM: consultas e CRUD | 6 | 2 | 4 | 5–6 |
| M06 URLs e Views | 6 | 3 | 3 | 7–8 |
| M07 Forms e validação | 4 | 2 | 2 | 9 |
| M08 Templates e interface | 6 | 3 | 3 | 10–11 |
| M09 Django Admin | 2 | 1 | 1 | 11 |
| M10 Autenticação e gestão de usuários | 5 | 2 | 3 | 12 |
| M11 Segurança | 5 | 3 | 2 | 13 |
| M12 Testes e qualidade | 4 | 2 | 2 | 14 |
| M13 APIs e integrações | 2 | 1 | 1 | 15 |
| M14 Deploy | 5 | 2 | 3 | 16 |
| M15 Observabilidade e manutenção | 2 | 1 | 1 | 17 |
| **Total** | **69** | **32** | **37** | |

## 3. Cronograma semanal

| Sem | Conteúdo | h | Entregas / marcos |
|---:|---|---:|---|
| 1 | M00 Ambiente (3h) · M01 Web e HTTP — parte 1 (2h) | 5 | Ambiente validado (`django-admin --version`) |
| 2 | M01 Web e HTTP — parte 2 (4h) · M02 Django start (1h) | 5 | **E0**: relatório de inspeção HTTP |
| 3 | M02 Django start (3h) · M03 Models (2h) | 5 | Projeto BiblioCom rodando local |
| 4 | M03 Models (4h) · M04 Migrações (1h) | 5 | **E1**: modelo de dados do BiblioCom |
| 5 | M04 Migrações (2h) · M05 ORM/CRUD (3h) | 5 | Migrações versionadas no Git |
| 6 | M05 ORM/CRUD (3h) · **Projeto Etapa 1** (2h) | 5 | **E2**: exercícios de ORM |
| 7 | M06 URLs e Views (5h) | 5 | |
| 8 | M06 URLs e Views (1h) · **Etapa 1** (2h) · **Etapa 2** (2h) | 5 | **P1**: tema do projeto aprovado |
| 9 | M07 Forms e validação (4h) · **Etapa 2** (1h) | 5 | **E3**: CRUD completo com formulários |
| 10 | **Avaliação teórica** (1h) · M08 Templates (4h) | 5 | **A1**: prova (HTTP, ORM, arquitetura) |
| 11 | M08 Templates (2h) · M09 Admin (2h) · **Etapa 2** (1h) | 5 | **P2**: documentos de planejamento |
| 12 | M10 Autenticação e usuários (5h) | 5 | **E4**: área autenticada com papéis |
| 13 | M11 Segurança (5h) | 5 | **E5**: checklist OWASP aplicado |
| 14 | M12 Testes (4h) · **Extensão** — diagnóstico (1h) | 5 | **E6**: suíte de testes verde |
| 15 | M13 APIs (2h) · **Extensão** — planejamento e contato (3h) | 5 | **X1**: plano de ação extensionista |
| 16 | M14 Deploy (5h) | 5 | **E7**: BiblioCom no ar (URL pública) |
| 17 | M15 Observabilidade (2h) · **Etapa 3** (3h) | 5 | |
| 18 | **Etapa 3** — desenvolvimento e testes (5h) | 5 | **P3**: sistema entregue e implantado |
| 19 | **Extensão** — execução com a organização parceira (5h) | 5 | **X2**: evidências da ação |
| 20 | **Etapa 4** — relatório e apresentação (4h) · **Extensão** — devolutiva (1h) | 5 | **P4**: relatório + apresentação · **X3**: relato de experiência |

## 4. Marcos e prazos

| Código | Marco | Semana | Peso |
|---|---|---:|---:|
| E0–E7 | Atividades práticas dos módulos (portfólio) | 2–16 | 20% |
| A1 | Avaliação teórica | 10 | 15% |
| P1 | Etapa 1 — tema definido | 8 | 7,5% |
| P2 | Etapa 2 — planejamento | 11 | 7,5% |
| P3 | Etapa 3 — sistema | 18 | 30% |
| P4 | Etapa 4 — relatório e apresentação | 20 | 10% |
| X1–X3 | Atividades extensionistas | 15–20 | 10% |

## 5. Variações de calendário

**Semestre de 15 semanas (~6,7h/semana):** una as semanas 2+3, 4+5, 10+11 e 14+15; mantenha
todas as entregas. **Não** comprima as semanas 16–20 (deploy, projeto e extensão) — é onde
a disciplina se materializa.

**Formato intensivo (5 semanas × 20h):** semana 1 = M00–M05; semana 2 = M06–M09 + Etapa 1;
semana 3 = M10–M13 + Etapa 2; semana 4 = M14–M15 + Etapa 3; semana 5 = Etapa 4 + extensão.
A extensão exige agenda externa — inicie o contato com a organização parceira **antes** do
primeiro dia de aula.

**EaD / híbrido:** as horas teóricas (40h) migram bem para assíncrono com vídeo + leitura +
quiz; as horas práticas (60h) exigem síncrono ou monitoria, especialmente M04 (migrações),
M11 (segurança) e M14 (deploy), onde o erro é silencioso e o feedback precisa ser rápido.
