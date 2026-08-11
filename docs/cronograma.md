# Cronograma — 20 semanas × 5h = 100h

Este arquivo é a **fonte canônica de carga horária**. Se algum outro documento divergir,
vale o que está aqui.

> **Stack:** Django + Django REST Framework (backend) · React + TypeScript + Tailwind
> (frontend). Ver [`decisoes-tecnicas.md`](decisoes-tecnicas.md).

## 1. Distribuição global

| Bloco | CH | Teórica | Prática |
|---|---:|---:|---:|
| Módulos de conteúdo (M00–M17) | 69 | 32 | 37 |
| Avaliação teórica integrada | 1 | 1 | 0 |
| Projeto integrador (Etapas 1–4) | 20 | 5 | 15 |
| Atividades extensionistas | 10 | 2 | 8 |
| **Total** | **100** | **40** | **60** |

## 2. Carga horária por módulo

| Módulo | Camada | CH | T | P | Semanas |
|---|---|---:|---:|---:|---|
| M00 Ambiente e ferramentas | ambos | 3 | 1 | 2 | 1 |
| M01 Fundamentos da web e HTTP | — | 5 | 3 | 2 | 1–2 |
| M02 Arquitetura desacoplada e contrato de API | — | 2 | 2 | 0 | 2 |
| M03 Django + DRF: primeiros passos | back | 3 | 1 | 2 | 3 |
| M04 Model: classes que geram o banco | back | 6 | 3 | 3 | 3–4 |
| M05 Migrações | back | 3 | 1 | 2 | 4–5 |
| M06 ORM: consultas e CRUD | back | 5 | 2 | 3 | 5–6 |
| M07 API: URLs, views e serializers | back | 6 | 3 | 3 | 6–7 |
| M08 React: fundamentos | front | 5 | 2 | 3 | 8–9 |
| M09 Tailwind e construção de interfaces | front | 4 | 1 | 3 | 9–10 |
| M10 Rotas e navegação | front | 2 | 1 | 1 | 10 |
| M11 Dados e formulários no cliente | front | 4 | 2 | 2 | 11 |
| M12 Autenticação e gestão de usuários | ambos | 5 | 2 | 3 | 12 |
| M13 Segurança | ambos | 5 | 3 | 2 | 13 |
| M14 Testes e qualidade | ambos | 3 | 1 | 2 | 14 |
| M15 Django Admin (back-office) | back | 2 | 1 | 1 | 15 |
| M16 Deploy dos dois artefatos | ambos | 4 | 2 | 2 | 16 |
| M17 Observabilidade e manutenção | ambos | 2 | 1 | 1 | 17 |
| **Total** | | **69** | **32** | **37** | |

**Distribuição por camada:** backend 25h · frontend 15h · transversal/ambos 29h.

## 3. Cronograma semanal

| Sem | Conteúdo | h | Entregas / marcos |
|---:|---|---:|---|
| 1 | M00 Ambiente — Python + Node (3h) · M01 Web e HTTP — parte 1 (2h) | 5 | Ambiente validado (`django-admin` e `pnpm` ok) |
| 2 | M01 Web e HTTP — parte 2 (3h) · M02 Arquitetura desacoplada (2h) | 5 | **E0**: relatório de inspeção HTTP |
| 3 | M03 Django + DRF (3h) · M04 Models (2h) | 5 | API respondendo JSON |
| 4 | M04 Models (4h) · M05 Migrações (1h) | 5 | **E1**: modelo de dados do BiblioCom |
| 5 | M05 Migrações (2h) · M06 ORM (3h) | 5 | Migrações versionadas · PostgreSQL |
| 6 | M06 ORM (2h) · M07 API (2h) · **Projeto Etapa 1** (1h) | 5 | **E2**: caderno de consultas ORM |
| 7 | M07 API — serializers, validação, filtros (4h) · **Etapa 1** (1h) | 5 | **E3**: API CRUD documentada (OpenAPI) |
| 8 | M08 React — componentes e estado (3h) · **Etapa 1** (2h) · **Etapa 2** (0h) | 5 | **P1**: tema do projeto aprovado |
| 9 | M08 React (2h) · M09 Tailwind (2h) · **Etapa 2** (1h) | 5 | |
| 10 | M09 Tailwind (2h) · M10 Rotas (2h) · **Avaliação teórica** (1h) | 5 | **A1**: prova (HTTP, ORM, arquitetura) |
| 11 | M11 Dados e formulários (4h) · **Etapa 2** (1h) | 5 | **E4**: SPA consumindo a API · **P2**: planejamento |
| 12 | M12 Autenticação ponta a ponta (5h) | 5 | **E5**: login, papéis e rotas protegidas |
| 13 | M13 Segurança (5h) | 5 | **E6**: checklist OWASP aplicado |
| 14 | M14 Testes (3h) · **Etapa 2** (2h) | 5 | **E7**: suíte verde (pytest + Vitest) |
| 15 | M15 Django Admin (2h) · **Extensão** — diagnóstico e plano (3h) | 5 | **X1**: plano de ação extensionista |
| 16 | M16 Deploy — API + SPA (4h) · **Extensão** (1h) | 5 | **E8**: os dois artefatos no ar |
| 17 | M17 Observabilidade (2h) · **Etapa 3** (3h) | 5 | |
| 18 | **Etapa 3** — desenvolvimento e testes (5h) | 5 | **P3**: sistema entregue e implantado |
| 19 | **Extensão** — execução com a organização parceira (5h) | 5 | **X2**: evidências da ação |
| 20 | **Etapa 4** — relatório e apresentação (4h) · **Extensão** — devolutiva (1h) | 5 | **P4**: relatório + apresentação · **X3**: relato |

**Conferência:** Etapa 1 = 1+1+2 = 4h · Etapa 2 = 1+1+2 = 4h · Etapa 3 = 3+5 = 8h ·
Etapa 4 = 4h · Extensão = 3+1+5+1 = 10h.

## 4. Marcos e prazos

| Código | Marco | Semana | Peso |
|---|---|---:|---:|
| E0–E8 | Atividades práticas dos módulos (portfólio) | 2–16 | 20% |
| A1 | Avaliação teórica | 10 | 15% |
| P1 | Etapa 1 — tema definido | 8 | 7,5% |
| P2 | Etapa 2 — planejamento | 11 | 7,5% |
| P3 | Etapa 3 — sistema | 18 | 30% |
| P4 | Etapa 4 — relatório e apresentação | 20 | 10% |
| X1–X3 | Atividades extensionistas | 15–20 | 10% |

## 5. A ponte entre backend e frontend

O ponto de maior risco desta arquitetura é a semana 8: a turma troca de linguagem, de
paradigma e de ferramenta ao mesmo tempo. Três decisões do material reduzem esse risco:

1. **O contrato vem antes** (M02, semana 2). A turma entende cliente/servidor e formato de
   resposta **antes** de escrever qualquer React.
2. **A API já existe** (M07, semana 7). Quando o React entra, há um backend real,
   documentado e testável com `curl` — nada de dados falsos.
3. **O mesmo domínio** (BiblioCom) atravessa as duas camadas. A turma não aprende um
   domínio novo junto com uma tecnologia nova.

## 6. Variações de calendário

**Semestre de 15 semanas (~6,7h/semana):** una as semanas 3+4, 5+6, 9+10 e 14+15. **Não**
comprima as semanas 16–20 (deploy, projeto e extensão).

**Base de JavaScript.** O cronograma padrão assume o pré-requisito atendido — é o caso da
turma a que este material se destina. Para turmas sem essa base, acrescente 4h de
nivelamento (`const/let`, arrow functions, destructuring, *spread*, `map`/`filter`, módulos
ES, Promises, `async/await`) antes da semana 8, retirando 2h de M06 e 2h de M15; material em
[`../recursos/js-para-react.md`](../recursos/js-para-react.md).

**Formato intensivo (5 semanas × 20h):** semana 1 = M00–M06; semana 2 = M07 + Etapa 1;
semana 3 = M08–M11 + Etapa 2; semana 4 = M12–M16 + Etapa 3; semana 5 = M17 + Etapa 4 +
extensão. Inicie o contato com a organização parceira **antes** do primeiro dia de aula.

**EaD / híbrido:** as 40h teóricas migram bem para assíncrono. As práticas exigem síncrono
ou monitoria, especialmente M05 (migrações), M08 (primeiro contato com React), M13
(segurança) e M16 (deploy) — onde o erro é silencioso e o feedback precisa ser rápido.
