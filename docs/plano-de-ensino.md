# Plano de Ensino — Desenvolvimento de Projeto Web

Este é o **único** lugar do material com carga horária e calendário. Os módulos indicam só
uma duração relativa (curta, média, longa); cada instituição ajusta as horas à sua grade.

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Disciplina | Desenvolvimento de Projeto Web |
| Carga horária | 100h — 40h teóricas, 60h práticas, das quais 10h extensionistas |
| Formato padrão | 20 semanas × 5h, presencial ou híbrido, em laboratório |
| Pré-requisitos | Lógica de programação, POO, banco de dados relacional e **JavaScript moderno** |
| Stack | Node 24 LTS, TypeScript, NestJS 12, TypeORM, PostgreSQL 16, Swagger/OpenAPI, Git/GitHub, Docker, GitHub Actions, deploy em PaaS |

Por que esta stack: [`decisoes-tecnicas.md`](decisoes-tecnicas.md).

## 2. Ementa (oficial)

> Introdução a aplicações web: Como funcionam; Protocolo HTTP: métodos POST e GET.
> Framework de desenvolvimento Web – Model: Utilização de classes para geração automática
> do banco de dados; Atualização do banco de dados a partir das alterações nas classes
> geradoras; Geração de consultas ao BD e operações CRUD a partir da API do framework.
> Framework de desenvolvimento Web – Views: Mapeamento de URLs; Criação de classes /
> métodos / funções para processamento de requisições. Framework de desenvolvimento Web –
> Templates: Criação de interfaces com o usuário utilizando o framework escolhido. Tópicos
> relevantes: Segurança, Gestão de usuários; Implantação (deploy) do sistema.
> Desenvolvimento de atividades extensionistas.

## 3. Rastreabilidade ementa → módulos

| Item da ementa | Onde é tratado |
| --- | --- |
| Aplicações web e HTTP (GET e POST) | M01, M02 (+ M07 na prática) |
| Classes que geram o banco | M04 |
| Atualização do banco pelas classes | M05 (migrações) |
| Consultas e CRUD pela API do framework | M06 |
| Mapeamento de URLs e classes que processam requisições | M03, M07 |
| Interface com o usuário | Contrato da API: Swagger e OpenAPI (M03, M07, M11) — ver [ADR-11](decisoes-tecnicas.md#adr-11--o-item-templates-da-ementa) |
| Gestão de usuários | M08 |
| Segurança | M09 (transversal em M07, M08, M12) |
| Implantação | M12 (+ M13) |
| Atividades extensionistas | [`projeto/extensao/`](../projeto/extensao/) |

**Complementares** (não exigidos pela ementa, incluídos pelo mercado): M00, M10, M11, M13.

## 4. Objetivos

**Geral:** capacitar o estudante a **projetar, construir, testar e implantar** uma API web,
com boas práticas de modelagem, segurança e trabalho em equipe, aplicando-a a **uma demanda
real de uma organização parceira**.

**Específicos.** Ao final, o estudante será capaz de:

1. Explicar o ciclo requisição–resposta e a diferença entre GET e POST numa API REST.
2. Justificar a separação entre API e clientes e definir o **contrato** entre eles.
3. Modelar um domínio em classes e evoluir o banco por migrações versionadas.
4. Implementar CRUD com o ORM, com consultas filtradas, paginadas e sem N+1.
5. Expor uma API REST validada e documentada em OpenAPI.
6. Implementar autenticação e autorização por papéis, escolhendo o mecanismo pelo modelo de
   ameaça.
7. Identificar e mitigar as vulnerabilidades mais comuns em APIs.
8. Escrever testes automatizados e mantê-los num pipeline de CI.
9. Implantar a API com HTTPS, banco gerenciado e deploy reproduzível.
10. Trabalhar em equipe com fluxo Git, revisão de código e documentação técnica.
11. Atender uma organização parceira: levantar a necessidade, entregar a solução e
    registrar o impacto.

## 5. Metodologia

- **Aula expositiva dialogada** (40h), sempre a partir de um problema do estudo de caso
  (BiblioCom).
- **Laboratório guiado e aberto** (60h): todo módulo termina com código rodando e um commit.
- **Aprendizagem baseada em projeto:** cada módulo entrega uma peça que o projeto reaproveita.
- **Pareamento e revisão de código** obrigatórios no desenvolvimento do projeto.
- **Extensão:** interação com a organização parceira, do diagnóstico à devolutiva.

## 6. Recursos necessários

Providencie **antes do semestre** — a falha nº 1 desta disciplina é logística, não técnica.

| Quando | O quê |
| --- | --- |
| −6 a −4 semanas | Mapear e formalizar 2 a 4 organizações parceiras candidatas (carta de anuência) |
| −3 semanas | Organização GitHub da turma |
| −2 semanas | Laboratório com Node 24, Git, VS Code e Docker; acesso liberado a `registry.npmjs.org` (proxy bloqueando o `npm install` é o problema mais comum) |
| −2 semanas | 🪟 Laboratório Windows: WSL2 habilitado e `C:\dev` excluída do antivírus |
| −2 semanas | Contas em PaaS (Render, Railway, Fly.io ou similar), ou GitHub Student Pack |
| −1 semana | Enviar o [guia de ambiente](ambiente-setup.md) à turma |

## 7. Avaliação

Detalhes, rubricas e regras em [`../avaliacao/`](../avaliacao/README.md).

| Código | Instrumento | Semana | Peso |
| --- | --- | ---: | ---: |
| E0–E8 | Portfólio de atividades práticas (individual) | 2–14 | 20% |
| A1 | Avaliação teórica (individual) | 10 | 15% |
| P1 | Projeto — Etapa 1: definição e planejamento | 10 | 15% |
| P2 | Projeto — Etapa 2: sistema preliminar | 12 | 10% |
| P3 | Projeto — Etapa 3: sistema final, implantado | 18 | 20% |
| P4 | Projeto — Etapa 4: relatório e apresentação | 20 | 10% |
| X1–X3 | Atividades extensionistas | 15–20 | 10% |

**Aprovação:** média ≥ 6,0, frequência conforme o regimento **e** entrega das Etapas 3 e 4 e
da extensão (eliminatórias).

## 8. Carga horária

| Bloco | CH | T | P |
| --- | ---: | ---: | ---: |
| Módulos de conteúdo (M00–M13) | 55 | 27 | 28 |
| Avaliação teórica | 1 | 1 | 0 |
| Projeto integrador (Etapas 1–4) | 20 | 5 | 15 |
| Atividades extensionistas | 10 | 2 | 8 |
| Reserva (atendimento às equipes, reposição) | 14 | 5 | 9 |
| **Total** | **100** | **40** | **60** |

| Módulo | Duração | CH | T | P |
| --- | --- | ---: | ---: | ---: |
| M00 Ambiente e ferramentas | média | 3 | 1 | 2 |
| M01 Fundamentos da web e HTTP | longa | 5 | 3 | 2 |
| M02 Arquitetura desacoplada e contrato de API | curta | 2 | 2 | 0 |
| M03 NestJS: a primeira API | média | 4 | 2 | 2 |
| M04 Entidades: classes que geram o banco | longa | 6 | 3 | 3 |
| M05 Migrações | média | 3 | 1 | 2 |
| M06 Consultas e CRUD | longa | 5 | 2 | 3 |
| M07 API: rotas, controllers e DTOs | longa | 6 | 3 | 3 |
| M08 Autenticação e autorização | longa | 5 | 2 | 3 |
| M09 Segurança de APIs | longa | 5 | 3 | 2 |
| M10 Testes e qualidade | média | 3 | 1 | 2 |
| M11 Tipos compartilhados e contrato OpenAPI | curta | 2 | 1 | 1 |
| M12 Deploy da API | média | 4 | 2 | 2 |
| M13 Observabilidade e manutenção | curta | 2 | 1 | 1 |

## 9. Cronograma semanal

| Sem | Conteúdo | Entregas |
| ---: | --- | --- |
| 1 | M00 (3h) · M01 — parte 1 (2h) | Ambiente validado |
| 2 | M01 — parte 2 (3h) · M02 (2h) | **E0** inspeção HTTP |
| 3 | M03 (4h) · M04 — início (1h) | API respondendo JSON |
| 4 | M04 (5h) | **E1** modelo de dados |
| 5 | M05 (3h) · M06 — parte 1 (2h) | Migrações versionadas |
| 6 | M06 — parte 2 (3h) · **Etapa 1** (2h) | **E2** caderno de consultas |
| 7 | M07 — parte 1 (4h) · **Etapa 1** (1h) | Tema e organização parceira |
| 8 | M07 — parte 2 (2h) · **Etapa 1** (3h) | **E3** API documentada |
| 9 | M08 (5h) | **E4** login e rotas protegidas |
| 10 | M09 — parte 1 (2h) · **Etapa 1** (2h) · avaliação teórica (1h) | **P1** · **A1** |
| 11 | M09 — parte 2 (3h) · **Etapa 2** (2h) | **E5** checklist OWASP |
| 12 | M10 (3h) · **Etapa 2** (2h) | **E6** testes no CI · **P2** sistema preliminar |
| 13 | M11 (2h) · **Etapa 3** (3h) | **E7** schema versionado |
| 14 | M12 (4h) · **Extensão** — diagnóstico (1h) | **E8** API no ar |
| 15 | M13 (2h) · **Extensão** — plano de ação (3h) | **X1** plano de ação |
| 16 | **Etapa 3** (1h) · reserva (4h) | Deploy do projeto |
| 17 | Reserva (5h) | Correções finais |
| 18 | Reserva (5h) | **P3** sistema final |
| 19 | **Etapa 4** (2h) · **Extensão** — implantação (3h) | **X2** implantação e capacitação |
| 20 | **Etapa 4** (2h) · **Extensão** — devolutiva (3h) | **P4** relatório e apresentação · **X3** devolutiva |

**Conferência:** Etapa 1 = 8h · Etapas 2, 3 e 4 = 4h cada · Extensão = 10h · Reserva = 14h.
A reserva fica nas semanas 16 a 18, quando as equipes mais precisam de atendimento, e absorve
feriados sem comprimir módulo nenhum.

## 10. Adaptações

**Semestre de 15 semanas:** mesma sequência, em encontros maiores. Se faltar tempo, a
**reserva** encolhe primeiro.

**Formato intensivo (5 × 20h):** semana 1 = M00–M06; semana 2 = M07 + Etapa 1; semanas 3–4 =
Etapas 2 e 3 + M08–M13; semana 5 = Etapa 4 + extensão. Feche a parceria **antes** do início.

**Comprimir conteúdo**, se necessário, nesta ordem: M13 vira leitura (mantenha healthcheck e
restauração de backup em aula) → M11 vira leitura → M10 fica só com regra de negócio e matriz
de acesso → M00 vira pré-atividade com o `verifica-ambiente.mjs` como comprovante.
**Nunca corte** M01, M02, M04 a M09 e M12 (itens da ementa), nem as etapas do projeto e a
extensão (eliminatórias).

**EaD / híbrido:** a teoria migra bem para assíncrono. A prática exige síncrono ou monitoria,
sobretudo M05, M09 e M12, onde o erro é silencioso.

## 11. Bibliografia

**Básica**

1. NESTJS. *NestJS Documentation*. <https://docs.nestjs.com/>
2. TYPEORM. *TypeORM Documentation*. <https://typeorm.io/>
3. MAGALHÃES, Kamil. **NestJS: A Progressive Node.js Framework**. Packt, 2024.

**Complementar**

1. CHERNY, Boris. **Programming TypeScript**. Sebastopol: O'Reilly, 2019.
2. MOZILLA. *MDN Web Docs — HTTP*. <https://developer.mozilla.org/pt-BR/docs/Web/HTTP>
3. OWASP FOUNDATION. *OWASP API Security Top 10*. <https://owasp.org/API-Security/>
4. BRASIL. **Lei nº 13.709/2018 (LGPD)**.
5. WIGGINS, Adam. *The Twelve-Factor App*. <https://12factor.net/pt_br/>

**Extensão**

1. BRASIL. **Resolução CNE/CES nº 7/2018** — Diretrizes para a Extensão na Educação Superior.
2. FORPROEX. **Política Nacional de Extensão Universitária**, 2012.
3. FREIRE, Paulo. **Extensão ou comunicação?** Rio de Janeiro: Paz e Terra, 1977.
