# Plano de Ensino — Desenvolvimento de Projeto Web

## 1. Identificação

| Campo | Valor |
|---|---|
| Disciplina | Desenvolvimento de Projeto Web |
| Carga horária total | 100 horas |
| Carga horária teórica | 40 horas |
| Carga horária prática | 60 horas |
| Carga horária extensionista | 10 horas (creditadas dentro da CH total) |
| Modalidade sugerida | Presencial ou híbrida, com laboratório de informática |
| Pré-requisitos | Lógica de programação; POO; banco de dados relacional; **JavaScript moderno** (atendido — ver §11) |
| Stack — backend | Python 3.12, Django 5, Django REST Framework, PostgreSQL 16 |
| Stack — frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query |
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
|---|---|---|
| Introdução a aplicações web: como funcionam | M01, M02 | — |
| Protocolo HTTP: métodos POST e GET | M01 (+ M07 na prática da API) | — |
| Model: classes que geram o banco automaticamente | M04 | 🔵 |
| Atualização do banco a partir das alterações nas classes | M05 (migrações) | 🔵 |
| Consultas ao BD e CRUD pela API do framework | M06 (ORM) + M07 (ViewSets) | 🔵 |
| Views: mapeamento de URLs | M07 (`urls.py`, `DefaultRouter`) + M10 (React Router) | 🔵🟣 |
| Views: classes/métodos/funções de processamento de requisições | M07 (FBV, `APIView`, `ViewSet`) | 🔵 |
| **Templates: interfaces com o usuário** | **M08, M09, M11 (componentes React + Tailwind)** ⚠️ | 🟣 |
| Segurança | M13 (transversal em M07, M12, M16) | 🔵🟣 |
| Gestão de usuários | M12 | 🔵🟣 |
| Implantação (deploy) | M16 (+ M17 pós-deploy) | 🔵🟣 |
| Atividades extensionistas | `projeto/extensao/` | — |

> ⚠️ **Ressalva sobre "Templates".** Nesta arquitetura não há templates Django: a interface
> é feita com componentes React. A leitura adotada é que o objetivo pedagógico do item —
> *criar a interface com o usuário usando o framework escolhido* — está cumprido, com JSX
> no lugar do DTL. Se a coordenação exigir leitura estrita, adote o **modo híbrido**
> (ADR-04 em [`decisoes-tecnicas.md`](decisoes-tecnicas.md)), que mantém templates Django
> estilizados com Tailwind e usa React apenas em ilhas de interatividade. A decisão é
> institucional; o material suporta as duas.

Conteúdos **complementares** (não exigidos pela ementa, incluídos por demanda de mercado):
M00 (ambiente), M03 (bootstrap), M14 (testes), M15 (Admin), M17 (observabilidade). Podem
ser comprimidos — ver [`guia-do-docente.md`](guia-do-docente.md#compressão-do-conteúdo).

## 4. Objetivo geral

Capacitar o estudante a **projetar, construir, testar e implantar** uma aplicação web
completa em arquitetura desacoplada — API REST e interface em SPA —, aplicando boas
práticas de segurança e de trabalho em equipe, e a **aplicar essa capacidade em uma demanda
real de uma organização parceira** (dimensão extensionista).

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
6. Mapear URLs para views no servidor **e** rotas para telas no cliente.
7. Construir interfaces com componentes React, TypeScript e Tailwind, responsivas e
   acessíveis.
8. Gerenciar estado de servidor com cache e revalidação, e formulários com validação em
   duas camadas.
9. Implementar autenticação e autorização por papéis ponta a ponta, escolhendo o mecanismo
   pelo modelo de ameaça.
10. Identificar e mitigar as vulnerabilidades web mais comuns, inclusive as específicas de
    arquitetura desacoplada (CORS, exposição de segredo em bundle, roubo de token).
11. Escrever testes automatizados nas duas camadas.
12. Implantar dois artefatos em produção, com HTTPS, banco gerenciado e CI/CD.
13. Trabalhar em equipe com fluxo Git, revisão de código e documentação técnica.
14. Interagir com uma organização parceira, levantar sua necessidade, entregar solução e
    registrar o impacto.

## 6. Competências e alinhamento com o mercado

| Competência | Evidência avaliável | Como aparece em vagas |
|---|---|---|
| Modelagem com ORM | Modelo do projeto + migrações limpas | "Django", "ORM", "modelagem relacional" |
| Construção de API REST | API documentada em OpenAPI | "REST", "DRF", "API design" |
| React + TypeScript | Interface do projeto | "React", "TypeScript", "SPA" |
| CSS utilitário | Interface responsiva e acessível | "Tailwind", "responsivo", "acessibilidade" |
| Estado e cache no cliente | Listagens com carregamento e erro tratados | "TanStack Query", "state management" |
| Integração entre camadas | Sistema funcionando ponta a ponta | "full stack" |
| Versionamento colaborativo | Histórico de commits/PRs | "Git", "code review" |
| Segurança aplicada | Checklist OWASP do projeto | "OWASP", "LGPD" |
| Testes automatizados | Suíte verde no CI | "pytest", "Vitest", "Testing Library" |
| Deploy e configuração | Dois artefatos no ar | "CI/CD", "cloud", "12-factor" |
| Comunicação técnica | Relatório + apresentação | Toda vaga |

## 7. Metodologia

- **Aula expositiva dialogada** (40h), sempre ancorada num problema do estudo de caso.
- **Laboratório guiado** e **laboratório aberto** (60h).
- **Aprendizagem baseada em projeto**: cada módulo entrega uma peça reutilizável.
- **Pair programming** e **revisão por pares** obrigatórios na Etapa 3.
- **Extensão**: interação dialógica com organização parceira, do diagnóstico à entrega.

Regras de ouro do material: **nenhum módulo termina sem código rodando**, e **o frontend
só entra depois que existe uma API real** (semana 8, após o M07).

## 8. Recursos necessários

- Laboratório com Python 3.12+, **Node.js 20+**, Git, editor e acesso à internet.
- ⚠️ Acesso liberado ao registro npm e ao PyPI. Proxy corporativo bloqueando `npm install`
  é a falha logística nº 1 desta disciplina.
- Conta GitHub por estudante; organização GitHub para as equipes.
- Conta em PaaS para deploy (Render, Railway, Fly.io ou similar) — **dois serviços** por
  equipe (API e SPA) ou um serviço servindo os dois.
- Docker Desktop (recomendado para PostgreSQL local).

## 9. Avaliação

Detalhamento em [`../avaliacao/README.md`](../avaliacao/README.md).

| Instrumento | Peso | Momento |
|---|---:|---|
| Atividades práticas dos módulos (portfólio E0–E8) | 20% | Contínuo |
| Avaliação teórica | 15% | Semana 10 |
| Projeto — Etapa 1 (tema) e Etapa 2 (planejamento) | 15% | Semanas 8 e 11 |
| Projeto — Etapa 3 (sistema desenvolvido e implantado) | 30% | Semana 18 |
| Projeto — Etapa 4 (relatório técnico + apresentação) | 10% | Semana 20 |
| Atividades extensionistas | 10% | Semanas 15–20 |

**Aprovação:** média ponderada ≥ 6,0 **e** frequência conforme regimento **e** entrega
obrigatória das Etapas 3 e 4 e das atividades extensionistas (itens eliminatórios).

## 10. Bibliografia

### Básica

1. DJANGO SOFTWARE FOUNDATION. *Django Documentation* (5.x). <https://docs.djangoproject.com/pt-br/5.0/>
2. ENCODE. *Django REST Framework Documentation*. <https://www.django-rest-framework.org/>
3. META PLATFORMS. *React Documentation*. <https://react.dev/>
4. MELÉ, Antonio. **Django 5 By Example**. 5. ed. Birmingham: Packt, 2024.

### Complementar

5. TAILWIND LABS. *Tailwind CSS Documentation*. <https://tailwindcss.com/docs>
6. BANKS, Alex; PORCELLO, Eve. **Learning React**. 2. ed. O'Reilly, 2020.
7. VINCENT, William S. **Django for APIs**. WelcomeToCode, 2024.
8. MOZILLA. *MDN Web Docs — HTTP*. <https://developer.mozilla.org/pt-BR/docs/Web/HTTP>
9. OWASP FOUNDATION. *OWASP Top 10:2021*. <https://owasp.org/Top10/>
10. BRASIL. **Lei nº 13.709/2018 (LGPD)**.
11. WIGGINS, Adam. *The Twelve-Factor App*. <https://12factor.net/pt_br/>
12. W3C. *WCAG 2.2*. <https://www.w3.org/Translations/WCAG22-pt-br/>

### Sobre extensão

13. BRASIL. **Resolução CNE/CES nº 7/2018** — Diretrizes para a Extensão na Educação Superior.
14. FORPROEX. **Política Nacional de Extensão Universitária**, 2012.
15. FREIRE, Paulo. **Extensão ou comunicação?** Rio de Janeiro: Paz e Terra, 1977.

## 11. Nota sobre o pré-requisito de JavaScript

Os módulos 08–11 (15h) assumem JavaScript moderno. **Este pré-requisito está atendido** pela
turma a que o material se destina, o que sustenta a alocação de 15h para o bloco de
frontend — ela pressupõe que o tempo seja gasto com o modelo mental do React (estado,
efeitos, imutabilidade, cache), e não com sintaxe de JavaScript.

O que ainda vale fazer:

1. **Confirmar na semana 1**, com o diagnóstico de 20 minutos de
   [`../recursos/js-para-react.md`](../recursos/js-para-react.md). Não é para decidir o
   cronograma — é para identificar **quem individualmente** chega com lacuna e direcionar
   monitoria, antes da semana 8.
2. Manter o mesmo material como referência de consulta (ponte Python→JavaScript) durante os
   módulos 08–11.

**Para outras turmas ou instituições que adotem este material** e não tenham o
pré-requisito, as saídas continuam documentadas: 4h de nivelamento retiradas de M06 e M15,
ou o modo híbrido do ADR-04.
