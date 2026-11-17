# Plano de Ensino — Desenvolvimento de Projeto Web

Este é o **único** lugar do material com carga horária e calendário. Os módulos indicam só
uma duração relativa (curta, média, longa).

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Instituição | Instituto Federal de Educação, Ciência e Tecnologia de Pernambuco (IFPE) — Campus Palmares |
| Curso | Tecnologia em Análise e Desenvolvimento de Sistemas (ADS) — graduação tecnológica |
| Disciplina | Desenvolvimento de Projeto Web |
| Carga horária | 100h — 40h teóricas, 60h práticas |
| Formato | 20 semanas × 5h, presencial, em laboratório |
| Pré-requisitos | Lógica de programação, POO, banco de dados relacional e **JavaScript moderno** |
| Stack | Node 24 LTS, TypeScript, NestJS 12, TypeORM, PostgreSQL 16, Swagger/OpenAPI, Git/GitHub, Docker, GitHub Actions, deploy em PaaS |

Por que esta stack: [`decisoes-tecnicas.md`](decisoes-tecnicas.md).

## 2. Ementa (PPC do curso)

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
| Aplicações web e HTTP (GET e POST) | M01, M02 |
| Classes que geram o banco | M04 |
| Atualização do banco pelas classes | M05 (migrações) |
| Consultas e CRUD pela API do framework | M06 |
| Mapeamento de URLs e classes que processam requisições | M03, M07 |
| Interface com o usuário | Contrato da API: Swagger e OpenAPI (M03, M07, M11) — ver [ADR-02](decisoes-tecnicas.md#adr-02--o-item-templates-da-ementa) |
| Gestão de usuários | M08 |
| Segurança | M09 (transversal em M07, M08, M12) |
| Implantação | M12 (+ M13) |
| Atividades extensionistas | Projeto voltado a uma demanda comunitária (todas as equipes) + [trilha opcional de parceria real](../projeto/extensao/) — ver seção 10 |

**Complementares** (não exigidos pela ementa, incluídos pelo mercado): M00, M10, M11, M13.

**Lugar no curso.** A disciplina junta o que a turma de ADS viu separado — lógica, orientação a
objetos, banco de dados, engenharia de software — num sistema único, construído em equipe e
colocado no ar. É, para muitos estudantes, o primeiro sistema completo do portfólio
profissional e a base para o estágio e o TCC.

## 4. Objetivos

**Geral:** capacitar o estudante a **projetar, construir, testar e implantar**, em equipe,
uma API web que atende **uma demanda de uma comunidade** — do próprio campus ou da região.

**Específicos.** Ao final, o estudante será capaz de:

1. Explicar o ciclo requisição–resposta e a diferença entre GET e POST numa API REST.
2. Justificar a separação entre API e clientes e definir o **contrato** entre eles.
3. Modelar um domínio em classes e evoluir o banco por migrações versionadas.
4. Implementar CRUD com o ORM, com consultas filtradas, paginadas e sem N+1.
5. Expor uma API REST validada e documentada em OpenAPI.
6. Implementar autenticação e autorização por papéis.
7. Identificar e mitigar as vulnerabilidades mais comuns em APIs.
8. Escrever testes automatizados e mantê-los num pipeline de CI.
9. Implantar a API com HTTPS, banco gerenciado e deploy reproduzível.
10. Trabalhar em equipe com fluxo Git, revisão de código e documentação técnica.
11. Fundamentar um problema comunitário, desenhar a solução para pessoas reais (personas)
    e preparar o sistema para ser entregue a quem vai mantê-lo.

## 5. Metodologia

**Um projeto, do primeiro ao último dia.** O código que a turma escreve é o do projeto da
equipe.

- **Semanas 1–4:** as equipes se formam, escolhem um problema comunitário e o fundamentam
  (P1), enquanto os módulos M00–M03 dão a base técnica.
- **Semanas 5–14:** cada aula segue o mesmo ciclo — **por que** o assunto existe no projeto
  → **conceito** com um exemplo curto → **aplicação no projeto da equipe**, em laboratório. A
  aula termina com um commit no repositório da equipe.
- **Semanas 15–20:** atendimento às equipes, teste com usuário e encerramento.

Pareamento e revisão de código (PR) são obrigatórios desde o M00. Nenhuma etapa depende de
uma organização externa; a equipe que quiser trabalhar com uma organização real segue a
[trilha opcional](../projeto/extensao/), que vale bônus.

## 6. Recursos necessários

Providencie **antes do semestre** — a falha nº 1 desta disciplina é logística, não técnica.

| Quando | O quê |
| --- | --- |
| ➕ opcional | Uma lista de setores do campus e de organizações de Palmares e da Mata Sul abertos a receber equipes, para quem quiser seguir a trilha de parceria |
| −3 semanas | Organização GitHub da turma |
| −2 semanas | Laboratório do campus com Node 24, Git, VS Code e Docker; acesso liberado a `registry.npmjs.org` na rede do campus (proxy bloqueando o `npm install` é o problema mais comum) |
| −2 semanas | 🪟 Laboratório Windows: WSL2 habilitado e `C:\dev` excluída do antivírus |
| −2 semanas | Contas em PaaS (Render, Railway, Fly.io ou similar); o GitHub Student Pack, solicitado com o e-mail institucional, dá créditos extras |
| −1 semana | Enviar o [guia de ambiente](ambiente-setup.md) à turma |

## 7. Avaliação

**Toda a nota vem do projeto da equipe**, e nenhuma entrega exige organização externa. Detalhes, rubricas e o fator de participação em
[`../avaliacao/`](../avaliacao/README.md).

| Código | Entrega | Semana | Peso |
| --- | --- | ---: | ---: |
| P1 | Definição e planejamento | 4 | 15% |
| P2 | Sistema preliminar (com recuperação) | 10 | 25% |
| P3 | Sistema final, implantado | 18 | 40% |
| P4 | Relatório e apresentação | 19–20 | 20% |
| ➕ | Parceria com a comunidade (opcional) | 2–20 | bônus até +1,0 |

**Aprovação:** média ≥ 6,0, frequência mínima de 75% (Organização Acadêmica do IFPE) **e**
entrega de P3 e P4 (eliminatórias).

## 8. Carga horária

| Bloco | CH | T | P |
| --- | ---: | ---: | ---: |
| Módulos de conteúdo (M00–M13), aplicados ao projeto | 55 | 27 | 28 |
| Projeto integrador (Etapas 1–4) | 30 | 7 | 23 |
| Reserva (atendimento às equipes, reposição) | 15 | 6 | 9 |
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
| M11 Contrato OpenAPI versionado | curta | 2 | 1 | 1 |
| M12 Deploy da API | média | 4 | 2 | 2 |
| M13 Observabilidade e manutenção | curta | 2 | 1 | 1 |

## 9. Cronograma semanal

| Sem | Aula (5h) | Marco no projeto da equipe |
| ---: | --- | --- |
| 1 | M00 (3h) · Projeto: apresentação, equipes e organizações (2h) | Equipe formada · repositório criado · contrato de equipe |
| 2 | M01 (5h) | Pesquisa do problema (fora da aula) |
| 3 | M02 (2h) · Etapa 1 (3h) | Contrato inicial da API (`docs/api.md`) |
| 4 | M03 (4h) · Etapa 1 (1h) | **P1** · `backend/` respondendo |
| 5 | M04 (5h) | Entidades do domínio |
| 6 | M04 (1h) · M05 (3h) · M06 (1h) | Banco criado por migrações |
| 7 | M06 (4h) · Etapa 2 (1h) | Consultas do cenário principal |
| 8 | M07 (5h) | CRUD validado, com DTOs |
| 9 | M07 (1h) · M08 (4h) | Login no projeto |
| 10 | M08 (1h) · Etapa 2 (4h) | **P2** — demonstração em aula |
| 11 | M09 (5h) | Autorização por dono · correções de segurança |
| 12 | M10 (3h) · Etapa 3 (2h) | Testes no CI |
| 13 | M11 (2h) · M12 (3h) | Contrato versionado |
| 14 | M12 (1h) · M13 (2h) · Etapa 3 (2h) | **API do projeto no ar** |
| 15 | Etapa 3 — histórias restantes e teste com usuário (5h) | Teste com usuário |
| 16 | Reserva — atendimento às equipes (5h) | Correções do teste com usuário |
| 17 | Reserva — atendimento às equipes (5h) | Correções finais |
| 18 | Reserva — atendimento às equipes (5h) | **P3** |
| 19 | Etapa 4 — relatório e ensaio da apresentação (5h) | Relatório |
| 20 | Etapa 4 — apresentações e arguição (5h) | **P4** |

**Conferência:** módulos = 55h · Etapa 1 = 6h (sem. 1, 3, 4) · Etapa 2 = 5h · Etapa 3 = 9h ·
Etapa 4 = 10h · Reserva = 15h. A reserva fica nas semanas 16 a 18, quando as
equipes mais precisam de atendimento, e absorve feriados sem comprimir módulo nenhum.

> **Por que a P1 é na semana 4?** Porque o M04 (semana 5) modela as entidades **do domínio
> da equipe**. Sem o problema entendido, não há o que modelar.

## 10. Adaptações

**Semestre encurtado** (feriados, reposições, calendário acadêmico alterado): a **reserva**
encolhe primeiro. A P1 continua antes do M04.

**Comprimir conteúdo**, se ainda faltar tempo, nesta ordem: M13 vira leitura (mantenha healthcheck e
restauração de backup em aula) → M11 vira leitura → M10 fica só com regra de negócio e matriz
de acesso → M00 vira pré-atividade com o `verifica-ambiente.mjs` como comprovante.
**Nunca corte** M01, M02, M04 a M09 e M12 (itens da ementa), nem as etapas do projeto.

**Extensão curricular.** A ementa cita "atividades extensionistas". Neste plano elas são
atendidas pelo **projeto voltado a uma demanda comunitária** (problema fundamentado,
personas, sistema pronto para ser entregue), sem compromisso com organização externa. Se o
PPC atribuir a esta disciplina carga horária extensionista com interação real, a
coordenação do curso torna obrigatória a [trilha de parceria](../projeto/extensao/) (até 10h
das semanas 14–20 e da reserva), registrada junto à coordenação de extensão do campus, e
converte o bônus em peso de 15%, reduzindo P2 para 20%, P3 para 35% e P4 para 15%.

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
