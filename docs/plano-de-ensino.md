# Plano de Ensino — Desenvolvimento de Projeto Web

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Disciplina | Desenvolvimento de Projeto Web |
| Carga horária total | 100 horas |
| Carga horária teórica | 40 horas |
| Carga horária prática | 60 horas |
| Carga horária extensionista | 10 horas (creditadas dentro da CH total) |
| Modalidade sugerida | Presencial ou híbrida, com laboratório de informática |
| Pré-requisitos | Lógica de programação; POO; banco de dados relacional; **JavaScript moderno** (atendido — ver §11) |
| Stack — backend | Node 20, TypeScript, NestJS 12, TypeORM, PostgreSQL 16, Swagger/OpenAPI |
| Stack — comum | Git/GitHub, Docker, GitHub Actions, deploy em PaaS |

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

| Item da ementa | Onde é tratado | Camada |
| --- | --- | --- |
| Introdução a aplicações web: como funcionam | M01, M02 | — |
| Protocolo HTTP: métodos POST e GET | M01 (+ M07 na prática da API) | — |
| Model: classes que geram o banco automaticamente | M04 | 🔵 |
| Atualização do banco a partir das alterações nas classes | M05 (migrações) | 🔵 |
| Consultas ao BD e CRUD pela API do framework | M06 (Repository/QueryBuilder) + M07 (Controllers) | 🔵 |
| Views: mapeamento de URLs | M07 (`@Controller`, `@Get`, `@Post`) | 🔵 |
| Views: classes/métodos/funções de processamento de requisições | M07 (FBV, `APIView`, `ViewSet`) | 🔵 |
| **Interface com o usuário** | API documentada e consumida por clientes externos | 🔵 |
| Segurança | M13 (transversal em M07, M12, M16) | 🔵🟣 |
| Gestão de usuários | M12 | 🔵🟣 |
| Implantação (deploy) | M16 (+ M17 pós-deploy) | 🔵🟣 |
| Atividades extensionistas | `projeto/extensao/` | — |

Conteúdos **complementares** (não exigidos pela ementa, incluídos por demanda de mercado):
M00 (ambiente), M03 (bootstrap), M14 (testes), M15 (Admin), M17 (observabilidade). Podem
ser comprimidos — ver [`guia-do-docente.md`](guia-do-docente.md#5-compressão-do-conteúdo).

## 4. Objetivo geral

Capacitar o estudante a **projetar, construir, testar e implantar** uma API web robusta em
arquitetura desacoplada, aplicando boas práticas de segurança, modelagem de dados e trabalho
em equipe, e a **aplicar essa capacidade em uma demanda real de uma organização parceira**
(dimensão extensionista).

## 5. Objetivos específicos

Ao final da disciplina, o estudante será capaz de:

1. Explicar o ciclo requisição–resposta e o papel do HTTP, incluindo a diferença semântica
   e prática entre GET e POST, e como ela se manifesta numa API REST.
2. Justificar a escolha entre renderização no servidor e SPA a partir de requisitos, e
   definir o **contrato** entre cliente e servidor.
3. Modelar um domínio em classes e evoluir o esquema do banco por meio de migrações
   versionadas.
4. Implementar CRUD com a API do ORM, com consultas filtradas, agregadas e otimizadas.
5. Expor esse CRUD como API REST versionada, validada, paginada e documentada (OpenAPI).
6. Mapear URLs para controllers no servidor e expor contratos claros para clientes.
7. Modelar contratos de API e regras de negócio com validação, filtros e paginação.
8. Implementar autenticação e autorização por papéis ponta a ponta, escolhendo o mecanismo
   pelo modelo de ameaça.
9. Identificar e mitigar as vulnerabilidades web mais comuns em APIs e serviços.
10. Escrever testes automatizados para backend e validar comportamento em produção.
11. Implantar a API em produção, com HTTPS, banco gerenciado e CI/CD.
12. Trabalhar em equipe com fluxo Git, revisão de código e documentação técnica.
13. Interagir com uma organização parceira, levantar sua necessidade, entregar solução e
    registrar o impacto.

## 6. Competências e alinhamento com o mercado

| Competência | Evidência avaliável | Como aparece em vagas |
| --- | --- | --- |
| Modelagem com ORM | Entidades do projeto + migrações limpas | "TypeORM", "ORM", "modelagem relacional" |
| Construção de API REST | API documentada em OpenAPI | "REST", "NestJS", "API design" |
| Modelagem relacional | Entidades, migrações e consultas do backend | "TypeORM", "SQL", "modelo de dados" |
| Segurança aplicada | Checklist OWASP do projeto | "OWASP", "LGPD" |
| Testes automatizados | Suíte verde no CI | "Jest", "Supertest", "testes de API" |
| Deploy e configuração | API em produção com HTTPS e banco gerenciado | "CI/CD", "cloud", "12-factor" |
| Comunicação técnica | Relatório + apresentação | Toda vaga |

## 7. Metodologia

- **Aula expositiva dialogada** (40h), sempre ancorada num problema do estudo de caso.
- **Laboratório guiado** e **laboratório aberto** (60h).
- **Aprendizagem baseada em projeto**: cada módulo entrega uma peça reutilizável.
- **Pair programming** e **revisão por pares** obrigatórios na Etapa 3.
- **Extensão**: interação dialógica com organização parceira, do diagnóstico à entrega.

Regras de ouro do material: **nenhum módulo termina sem código rodando**, e a **API é a base
obrigatória do projeto**. O frontend, quando usado, é complementar e opcional.

## 8. Recursos necessários

- Laboratório com **Node.js 20+** (o npm vem junto), Git, editor e acesso à internet.
- ⚠️ Acesso liberado ao registro npm e ao PyPI. Proxy corporativo bloqueando `npm install`
  é a falha logística nº 1 desta disciplina.
- Conta GitHub por estudante; organização GitHub para as equipes.
- Conta em PaaS para deploy (Render, Railway, Fly.io ou similar) — **um serviço** para a API,
  com banco gerenciado.
- Docker Desktop (recomendado para PostgreSQL local).

## 9. Avaliação

Detalhamento em [`../avaliacao/README.md`](../avaliacao/README.md).

| Instrumento | Peso | Momento |
| --- | ---: | --- |
| Atividades práticas dos módulos (portfólio E0–E8) | 20% | Contínuo |
| Avaliação teórica | 15% | Semana 10 |
| Projeto — Etapa 1 (definição e planejamento) | 15% | Semana 10 |
| Projeto — Etapa 3 (sistema desenvolvido e implantado) | 30% | Semana 18 |
| Projeto — Etapa 3 (relatório técnico + apresentação) | 10% | Semanas 19 e 20 |
| Atividades extensionistas | 10% | Semanas 15–20 |

**Aprovação:** média ponderada ≥ 6,0 **e** frequência conforme regimento **e** entrega
obrigatória das Etapas 3 e 4 e das atividades extensionistas (itens eliminatórios).

## 10. Bibliografia

### Básica

1. NESTJS. *NestJS Documentation*. <https://docs.nestjs.com/>
2. TYPEORM. *TypeORM Documentation*. <https://typeorm.io/>
3. MAGALHÃES, Kamil. **NestJS: A Progressive Node.js Framework**. Packt, 2024.

### Complementar

1. CHERNY, Boris. **Programming TypeScript**. Sebastopol: O'Reilly, 2019.
2. MOZILLA. *MDN Web Docs — HTTP*. <https://developer.mozilla.org/pt-BR/docs/Web/HTTP>
3. OWASP FOUNDATION. *OWASP Top 10:2021*. <https://owasp.org/Top10/>
4. BRASIL. **Lei nº 13.709/2018 (LGPD)**.
5. WIGGINS, Adam. *The Twelve-Factor App*. <https://12factor.net/pt_br/>
6. W3C. *WCAG 2.2*. <https://www.w3.org/Translations/WCAG22-pt-br/>

### Sobre extensão

 1. BRASIL. **Resolução CNE/CES nº 7/2018** — Diretrizes para a Extensão na Educação Superior.
 2. FORPROEX. **Política Nacional de Extensão Universitária**, 2012.
 3. FREIRE, Paulo. **Extensão ou comunicação?** Rio de Janeiro: Paz e Terra, 1977.
