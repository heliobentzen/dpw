# Decisões técnicas do material

Documento que registra **por que** cada escolha foi feita e **como adaptá-la**. Serve
também de exemplo de ADR (*Architecture Decision Record*) — formato que as equipes vão
reproduzir na Etapa 2 do projeto.

> **Histórico:** a primeira versão deste material usava Django com renderização no
> servidor (templates DTL). A partir da revisão de 2026, a arquitetura passou a ser
> **desacoplada**: API REST em Django/DRF e SPA em React + TypeScript + Tailwind.
> Os ADR-01 e ADR-04 registram a mudança e o que ela custa.

---

## ADR-01 — Arquitetura desacoplada: API REST + SPA

- **Status:** aceito · **Data:** 2026-08-11 · **Substitui:** ADR-04 (versão anterior)

**Contexto.** A ementa exige um framework que ofereça: classes que geram o banco,
atualização do banco a partir das classes, API de consulta/CRUD, mapeamento de URLs, views
como classes/métodos/funções, criação de interfaces com o usuário, gestão de usuários,
segurança e deploy. A instituição optou por alinhar o material às tecnologias de frontend
predominantes no mercado brasileiro (React e Tailwind).

**Decisão.** Arquitetura em dois artefatos:

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  FRONTEND (SPA)              │  HTTP  │  BACKEND (API REST)          │
│  React 19 + TypeScript       │ ◀────▶ │  Django 5 + DRF              │
│  Vite · Tailwind 4           │  JSON  │  PostgreSQL                  │
│  React Router · TanStack     │        │  drf-spectacular (OpenAPI)   │
│  React Hook Form + Zod       │        │                              │
└──────────────────────────────┘        └──────────────────────────────┘
```

**Justificativa.**

| Item da ementa | Onde é atendido |
|---|---|
| Classes geram o banco | `models.Model` + `makemigrations` (M04) |
| Atualizar o banco pelas classes | Sistema de migrações (M05) |
| Consultas e CRUD via API do framework | ORM (M06) + DRF ViewSets (M07) |
| Mapeamento de URLs | `urls.py` + `DefaultRouter` (M07) **e** React Router (M10) |
| Classes / métodos / funções para requisições | FBV, CBV, `APIView` e `ViewSet` (M07) |
| **Templates: criação de interfaces com o usuário** | **Componentes React + Tailwind (M08, M09)** — ver ressalva abaixo |
| Gestão de usuários | `contrib.auth` + fluxo no cliente (M12) |
| Segurança | M13 (OWASP adaptado a SPA) |
| Implantação | M16 (dois artefatos) |

**⚠️ Ressalva sobre o item "Templates".** A ementa diz *"Templates: criação de interfaces
com o usuário utilizando o framework escolhido"*. Nesta arquitetura **não existem templates
Django**: a interface é construída com componentes React. A leitura adotada é que o item
está atendido — o objetivo pedagógico ("criar a interface com o usuário usando o framework
escolhido") é cumprido, com JSX no lugar do DTL e o framework escolhido para a camada de
interface sendo o React.

Se a coordenação exigir leitura estrita (um único framework cobrindo Model–View–Template),
use o **modo híbrido** descrito no ADR-04. A decisão é institucional, não técnica; o
material suporta as duas.

**Consequências.**

*Fica melhor:* alinhamento com o mercado; separação clara de responsabilidades; a mesma API
serve web, mobile e integrações; o estudante sai com duas competências vendáveis.

*Fica pior:* dois projetos, dois deploys, dois conjuntos de dependências e dois ecossistemas
de teste. A complexidade cresce, e ela é real — não decorativa. Ver ADR-09 sobre o custo em
carga horária.

**Adaptação a outras stacks.** A teoria (M01, M02, M13, M16, M17) é independente. Backend:
Laravel + API Resources, Rails + Jbuilder, Spring Boot + `@RestController`, FastAPI +
Pydantic. Frontend: Vue 3 + Pinia, Svelte, Angular. Mantenha os módulos, roteiros e
rubricas; troque os comandos e os trechos de código.

---

## ADR-04 — Modo híbrido como alternativa documentada

- **Status:** aceito (alternativa) · **Data:** 2026-08-11

**Contexto.** Nem toda instituição aceita que a interface saia do framework do backend, e
nem toda turma tem base de JavaScript para absorver React em 15h.

**Decisão.** Documentar o **modo híbrido** como caminho alternativo, sem material próprio:
Django com templates DTL renderizando as telas de CRUD, Tailwind via CLI para o estilo, e
React montado apenas em "ilhas" de interatividade (busca com filtros, painel de
indicadores), consumindo a API do M07.

**Quando escolher o híbrido:** turma sem base de JS; leitura estrita da ementa; menos de
15h disponíveis para frontend; projeto extensionista cujo parceiro precisa de algo simples
e durável.

**O que muda:** M08 cai para 3h (React só como ilha), M09 vira "Tailwind + templates
Django" e M10/M11 saem, liberando ~8h. Os módulos de backend não mudam.

**Consequências.** O híbrido entrega mais rápido e é mais fácil de manter por terceiros —
argumento relevante num projeto extensionista. Em troca, o estudante não pratica gestão de
estado e roteamento no cliente, que é o que as vagas de frontend pedem.

---

## ADR-02 — Banco: SQLite → PostgreSQL

**Decisão.** SQLite nos módulos M03–M04; PostgreSQL a partir do M05 e obrigatório em
produção.

**Justificativa.** SQLite remove atrito no começo. Mas tem tipagem dinâmica, suporte parcial
a `ALTER TABLE` e concorrência de escrita limitada — características que **escondem** erros
que só aparecem em produção. Trocar de banco no M05 ensina, de graça, a lição central do
ORM: *o código da aplicação não muda*.

---

## ADR-03 — Configuração por variáveis de ambiente, nos dois artefatos

**Decisão.** Backend: `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS`,
`CORS_ALLOWED_ORIGINS` via ambiente (`python-dotenv` em dev). Frontend: `VITE_API_URL` via
`.env`, lido em tempo de **build**.

**Justificativa.** Fator III do [12-Factor](https://12factor.net/pt_br/config).

**⚠️ Diferença crítica que a turma precisa entender:** variável de ambiente no backend é
**secreta e lida em tempo de execução**; variável `VITE_*` é **pública e embutida no bundle
em tempo de build**. Qualquer pessoa abre o DevTools e lê. Por isso **nunca** coloque chave
de API, token ou segredo em `VITE_*`. Tratado no M13.

---

## ADR-05 — TypeScript no frontend

**Decisão.** React com **TypeScript**, não JavaScript puro.

**Justificativa.** É o padrão do mercado em projetos React novos, e resolve um problema
específico desta arquitetura: o contrato da API deixa de ser suposição. Os tipos gerados a
partir do schema OpenAPI (`openapi-typescript`, M07) fazem o compilador acusar quando o
backend muda um campo — exatamente a classe de erro mais comum em projeto desacoplado de
equipe iniciante.

**Consequências.** Curva de aprendizado maior nas primeiras aulas. Mitigação: o material usa
TS "de superfície" (tipos de props, retorno de API e formulários), sem genéricos avançados,
e o `tsconfig` começa com `strict: false` no M08, endurecendo no M11.

---

## ADR-06 — Estado do servidor com TanStack Query

**Decisão.** **TanStack Query** para dados vindos da API; `useState`/`useContext` para
estado local de UI. **Sem** Redux, Zustand ou MobX.

**Justificativa.** A maior parte do "estado global" de um CRUD é, na verdade, cache de dados
do servidor — e é isso que o TanStack Query resolve, com cache, revalidação, estados de
carregamento e erro prontos. Introduzir uma biblioteca de estado global levaria a turma a
reimplementar mal o que o Query já faz. A regra ensinada é: *estado do servidor no Query;
estado de UI no componente; contexto só para sessão e tema*.

---

## ADR-07 — Autenticação por sessão com cookie, não JWT em `localStorage`

- **Status:** aceito · **Relevante para:** M12, M13

**Decisão.** Autenticação por **sessão do Django com cookie `HttpOnly`**, com frontend e
API servidos sob o **mesmo site** (mesmo domínio, caminhos diferentes: `/` e `/api/`).

**Alternativas consideradas.**

| Opção | Prós | Contras | Por que não |
|---|---|---|---|
| Sessão + cookie `HttpOnly` (escolhida) | JS não lê o token (imune a roubo via XSS); revogação imediata; nativo do Django | Exige mesmo site ou CORS com credenciais; precisa de CSRF | — |
| JWT em `localStorage` | Simples; funciona entre domínios | **Qualquer XSS rouba o token**; revogação difícil; renovação manual | Padrão mais comum em tutoriais e um dos mais inseguros |
| JWT em cookie `HttpOnly` | Seguro contra XSS | Volta a precisar de CSRF; complexidade de refresh sem ganho real aqui | Complexidade sem benefício no nosso cenário |

**Justificativa.** O argumento de "JWT é stateless e escala" não se aplica a um sistema de
biblioteca comunitária, e o custo — token legível por qualquer script injetado — é real. A
disciplina ensina a decisão pelo modelo de ameaça, não pela moda. JWT é apresentado no M12
com os *trade-offs*, e é a escolha correta quando existe app mobile ou consumidor de outro
domínio.

**Consequências.** Deploy precisa servir SPA e API sob o mesmo site (M16). Em
desenvolvimento, o proxy do Vite resolve; em produção, o roteamento da PaaS.

---

## ADR-08 — Tailwind, sem biblioteca de componentes

**Decisão.** **Tailwind CSS 4**, com componentes próprios. Sem Material UI, Chakra ou
Bootstrap. `shadcn/ui` é citado como referência de padrões acessíveis, para consulta.

**Justificativa.** Biblioteca de componentes entrega telas bonitas rápido e ensina pouco:
o estudante aprende a API da biblioteca, não CSS nem acessibilidade. Com Tailwind, cada
componente é construído — e os requisitos de foco visível, contraste e semântica (cobrados
na rubrica) precisam ser resolvidos, não herdados.

---

## ADR-09 — O custo em carga horária

- **Status:** aceito · **Registra um trade-off, não uma escolha técnica**

**Contexto.** A disciplina tem 100h fixas. Acrescentar React, TypeScript, Tailwind,
roteamento e cache de dados exige ~15h que não existiam.

**Decisão.** As 15h saíram de: templates Django (−6h, removido), formulários Django
(−4h, absorvido em serializers e React Hook Form), M01 HTTP (−1h), ORM (−1h), testes (−1h),
Django Admin mantido em 2h e deploy reduzido de 5h para 4h.

**Consequências — declaradas honestamente:**

- O tempo por tecnologia caiu. A turma sai sabendo **construir** com React, não **dominar**
  React. O material assume que a profundidade vem depois, no projeto e fora da disciplina.
- **Testes ficaram apertados** (3h para pytest *e* Vitest). O módulo prioriza teste de
  regra de negócio no backend e teste de componente crítico no frontend; e2e vira leitura.
- Turma sem base de JavaScript **não** cabe em 100h. Isso não é opinião: é aritmética. Para
  esses casos, o cronograma prevê 4h de nivelamento (retiradas de M06 e M15) ou o modo
  híbrido do ADR-04.
- O deploy ficou mais complexo (dois artefatos, CORS, variáveis de build) com menos tempo.
  Mitigação: o M16 traz um roteiro único, testado, em vez de comparar plataformas.

Registrar o custo é parte da decisão. Uma equipe que não sabe o que perdeu não pode
compensar depois.

---

## Como escrever um ADR (modelo para a Etapa 2)

```markdown
# ADR-NN — <decisão em uma linha>

- **Status:** proposto | aceito | substituído por ADR-MM
- **Data:** AAAA-MM-DD
- **Decisores:** <nomes>

## Contexto
Qual problema/força motiva a decisão? O que é fato, o que é restrição?

## Decisão
O que foi decidido, em voz ativa: "Vamos usar X".

## Alternativas consideradas
| Opção | Prós | Contras | Por que não |
|---|---|---|---|

## Consequências
O que fica mais fácil e o que fica mais difícil a partir de agora.
```
