# Decisões técnicas do material

Documento que registra **por que** cada escolha foi feita e **como adaptá-la**. Serve
também de exemplo de ADR (*Architecture Decision Record*) — formato que as equipes vão
reproduzir na Etapa 2 do projeto.

> **Histórico.** Este material passou por três versões:
>
> 1. Django com renderização no servidor (templates DTL);
> 2. Django/DRF como API + SPA em React (ADR-01, superado);
> 3. **TypeScript ponta a ponta**: NestJS + TypeORM no backend, React no frontend
>    (**ADR-10**, vigente).
>
> Os ADRs superados foram mantidos: entender por que uma decisão foi revista é parte do
> que a Etapa 2 do projeto cobra.

---

## ADR-10 — TypeScript ponta a ponta: NestJS + TypeORM + React

- **Status:** aceito · **Data:** 2026-08-18 · **Substitui:** ADR-01

**Contexto.** A escolha anterior (Django/DRF + React) resolvia bem a ementa, mas carregava
duas premissas que foram reexaminadas:

1. **Mercado.** Nas pesquisas de uso mais recentes, Django aparece por volta da 4ª a 6ª
   posição entre frameworks de backend, atrás de Node/Express, ASP.NET Core e Spring Boot.
   No mercado brasileiro o descolamento é maior: Java/Spring domina o *enterprise*,
   Node/NestJS domina *startups* e *scale-ups*, PHP/Laravel domina PME e e-commerce, e o
   Python brasileiro pende mais para dados e ML do que para web.
2. **Duas linguagens em 100h.** O material ensinava Python **e** TypeScript. Como o
   pré-requisito de JavaScript está atendido por esta turma, metade dessa carga era
   redundante: a turma já traz o modelo mental da linguagem que o frontend usa.

**Decisão.** Uma linguagem em toda a stack.

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  FRONTEND (SPA)              │  HTTP  │  BACKEND (API REST)          │
│  React 19 + TypeScript       │ ◀────▶ │  NestJS 11 + TypeScript      │
│  Vite · Tailwind 4           │  JSON  │  TypeORM · PostgreSQL        │
│  React Router · TanStack     │        │  class-validator · Swagger   │
│  React Hook Form + Zod       │        │  Passport · Argon2           │
└──────────────────────────────┘        └──────────────────────────────┘
              └──────────── @bibliocom/tipos ────────────┘
                     tipos compartilhados (M15)
```

**Justificativa — o mapa da ementa.**

| Item da ementa | Onde é atendido |
|---|---|
| Classes geram o banco | Classes `@Entity()` do TypeORM + `synchronize` em dev (M04) |
| Atualizar o banco pelas classes | `migration:generate` compara entidades × banco (M05) |
| Consultas e CRUD via API do framework | `Repository` e `QueryBuilder` (M06) |
| Mapeamento de URLs | `@Controller('obras')` + `@Get(':id')` (M07) **e** React Router (M10) |
| Classes / métodos / funções para requisições | Controllers são **classes**, *handlers* são **métodos**, Providers são serviços injetados (M07) |
| **Templates: criação de interfaces** | Componentes React + Tailwind (M08, M09) — ver ADR-11 |
| Gestão de usuários | Passport + Guards + entidade `Usuario` (M12) |
| Segurança | M13 (OWASP aplicado a API + SPA) |
| Implantação | M16 (dois artefatos) |

**Por que TypeORM e não Prisma.** Prisma é excelente e cresce rápido, mas seu schema é uma
**DSL própria** (`schema.prisma`), não classes. A ementa pede literalmente *"classes para
geração automática do banco de dados"*. No TypeORM, `@Entity()` decora uma classe
TypeScript comum, e é essa classe que gera a tabela — o item central da ementa fica
atendido ao pé da letra, não por interpretação. Drizzle tem o mesmo descasamento de Prisma.

**Por que NestJS e não Express puro.** Express não tem opinião sobre estrutura: em 100h,
uma turma iniciante produziria um `app.js` de 800 linhas. NestJS traz módulos, injeção de
dependência e camadas explícitas — que é justamente o que a disciplina precisa **ensinar**.
E é o framework TypeScript de backend com maior adoção corporativa.

**Consequências.**

| Ganho | Custo |
|---|---|
| Uma linguagem só: a transição backend→frontend na semana 8 deixa de ser troca de idioma | NestJS exige entender **injeção de dependência e decorators** já no M03 — conceitos que o Django não cobrava tão cedo |
| Tipos compartilhados entre as camadas (M15), impossível na stack anterior | Perdemos o **Django Admin**: não há back-office pronto (ver ADR-12) |
| `class-validator` no backend e Zod no frontend têm o mesmo modelo mental | `contrib.auth` some: autenticação vira Passport + hash explícito (mais horas em M12) |
| Alinhamento com vagas de Node/TypeScript, o segmento que mais contrata júnior | Segurança deixa de ser "o framework já protege" e passa a ser configuração explícita (M13 muda de tom) |

---

## ADR-11 — O item "Templates" da ementa

- **Status:** aceito · **Herdado do ADR-01, revalidado**

A ementa diz *"Templates: criação de interfaces com o usuário utilizando o framework
escolhido"*. Nesta arquitetura **não existe motor de templates no servidor**: a interface é
construída com componentes React.

A leitura adotada é que o item **está atendido** — o objetivo pedagógico ("criar a interface
do usuário com o framework escolhido") é cumprido, com JSX no lugar de um DTL/Blade, e o
framework escolhido para a camada de interface sendo o React.

> ⚠️ **Esta é a única decisão que depende da sua coordenação.** Se a instituição exigir
> leitura estrita — um único framework cobrindo Model–View–Template — a alternativa é usar
> um *template engine* do próprio NestJS (Handlebars ou EJS via `@nestjs/serve-static`)
> para duas ou três telas administrativas, mantendo o React para o restante. O material
> registra a alternativa, mas **não a recomenda**: rendimento pedagógico baixo e nenhum
> alinhamento de mercado.

---

## ADR-12 — Back-office: construído, não herdado

- **Status:** aceito · **Data:** 2026-08-18 · **Consequência do ADR-10**

**Contexto.** O Django Admin dava, de graça, um painel administrativo completo — e o
material dedicava 2h (M15) a customizá-lo. NestJS não tem equivalente.

**Alternativas consideradas.**

| Opção | Por que não |
|---|---|
| AdminJS (painel automático para Node) | Adiciona uma dependência pesada e opinativa para ensinar a customizá-la — conhecimento que não transfere |
| Construir um CRUD administrativo em React | Duplica exatamente o que M07–M11 já ensinam. Repetição sem conceito novo |

**Decisão.** As 2h do M15 passam a ensinar **tipos compartilhados entre backend e
frontend** — um pacote `@bibliocom/tipos` no monorepo, consumido pelas duas camadas, com
teste de contrato no CI.

**Justificativa.** É o ganho que *só* existe nesta stack e que justifica tê-la escolhido:
mudar um campo na entidade quebra a compilação do frontend **antes** do deploy, não em
produção. Rende mais que customizar um painel que a turma não levaria consigo.

A "gestão de usuários" da ementa continua atendida pelo M12, que ganhou o CRUD
administrativo de usuários e papéis que antes ficava implícito no Admin.

---

## ADR-13 — Monorepo com workspaces do pnpm

- **Status:** aceito · **Data:** 2026-08-18

**Contexto.** Com as duas camadas na mesma linguagem, elas podem compartilhar código.
Compartilhar exige que estejam no mesmo repositório e que o gerenciador de pacotes entenda
essa relação.

**Decisão.**

```
bibliocom/
├── package.json          workspaces + scripts na raiz
├── pnpm-workspace.yaml
├── backend/              NestJS + TypeORM
├── frontend/             React + Vite
└── pacotes/tipos/        @bibliocom/tipos — DTOs e enums compartilhados
```

**Consequências.** Um `pnpm install` na raiz resolve as três. Um PR mostra a mudança
completa (entidade → DTO → tipo → tela). Em contrapartida, a turma precisa entender
*workspaces* — 20 minutos no M03, que se pagam no M15.

---

## ADR-02 — Banco: SQLite → PostgreSQL

- **Status:** aceito · **Atualizado para o TypeORM**

**Decisão.** SQLite nos módulos M03–M04, PostgreSQL a partir do M05.

**Justificativa.** SQLite não exige instalação: a turma escreve entidades e vê tabelas
nascerem na primeira aula de backend. A troca no M05 é feita mudando o `type` do
`DataSource` — e é exatamente aí que a promessa do ORM ("o código da aplicação não muda")
se demonstra sozinha.

**Consequência declarada.** SQLite e PostgreSQL divergem em tipos e em migrações. O M05
mostra a divergência em vez de escondê-la: é conteúdo, não acidente.

---

## ADR-03 — Configuração por variáveis de ambiente, nos dois artefatos

- **Status:** aceito

**Decisão.** Nenhum segredo no código. Backend lê via `@nestjs/config`; frontend via
`import.meta.env`.

**A distinção que mais gera bug:**

| | Backend (`.env` do NestJS) | Frontend (`VITE_*`) |
|---|---|---|
| Quando é lida | **Execução** | **Build** |
| Quem enxerga | Só o servidor | **Qualquer pessoa**, no bundle |
| Pode conter segredo | Sim | **Nunca** |
| Mudar exige | Reiniciar | **Rebuild** |

---

## ADR-05 — TypeScript nas duas camadas

- **Status:** aceito · **Reforçado pelo ADR-10**

**Decisão.** TypeScript no backend e no frontend, com `strict: true`.

**Justificativa.** Antes, TypeScript era só do frontend e custava horas de aprendizado
isoladas. Agora ele é o idioma único da disciplina: o que a turma aprende sobre tipos no
M04 (entidades) vale no M11 (formulários). O custo de aprender TS é pago uma vez e rende
nas duas camadas.

---

## ADR-06 — Estado do servidor com TanStack Query

- **Status:** aceito

**Decisão.** TanStack Query para dados vindos da API. Sem Redux, sem Zustand.

**Justificativa.** A maior parte do "estado global" de um CRUD é **cache de servidor**, não
estado de cliente. TanStack Query resolve carregamento, erro, revalidação e invalidação —
os quatro estados de tela que o M08 ensina.

---

## ADR-07 — Autenticação por sessão com cookie, não JWT em `localStorage`

- **Status:** aceito · **Atualizado para NestJS**

**Decisão.** Sessão com cookie `HttpOnly`, `Secure`, `SameSite=Lax`, via
`express-session` + `passport-local`. **Não** JWT guardado em `localStorage`.

**Justificativa.** Token em `localStorage` é legível por qualquer JavaScript da página: um
XSS vira roubo de sessão. Cookie `HttpOnly` não é acessível por script. Como os dois
artefatos são publicados no mesmo domínio (M16), não há motivo para JWT.

**O raciocínio é o conteúdo.** O M13 ensina a decidir pelo modelo de ameaça, não a decorar
que "JWT é melhor". JWT é a escolha certa quando há múltiplos domínios ou clientes móveis —
não é o nosso caso, e o material diz por quê.

---

## ADR-08 — Tailwind, sem biblioteca de componentes

- **Status:** aceito

**Decisão.** Tailwind puro, sem Material UI, Chakra ou shadcn/ui.

**Justificativa.** Biblioteca de componentes esconde exatamente o que o M09 precisa
ensinar: espaçamento, hierarquia visual, estados e responsividade. Quem aprendeu com
utilitários consegue usar qualquer biblioteca depois; o contrário não vale.

---

## ADR-09 — O custo em carga horária

- **Status:** aceito · **Revisado pelo ADR-10** · **Registra um trade-off**

**Contexto.** A disciplina tem 100h fixas.

**O que a mudança para TypeScript ponta a ponta liberou e consumiu:**

| Movimento | Horas |
|---|---|
| M08 (React) cai de 5h para 4h — TypeScript já é conhecido desde o M03 | **−1h** |
| M03 sobe de 3h para 4h — injeção de dependência e decorators exigem mais | **+1h** |
| M15 troca Django Admin por tipos compartilhados | 2h → 2h |
| M12 absorve o CRUD de usuários que o Admin dava de graça | dentro das 5h |

O total dos módulos segue **69h**, e a disciplina, **100h (40T + 60P)**.

**Consequências — declaradas honestamente:**

- **A transição da semana 8 deixou de ser um precipício.** Antes, a turma trocava de
  linguagem no meio do curso. Agora troca de camada, no mesmo idioma. Este é o maior ganho
  pedagógico do ADR-10.
- **O M03 ficou mais denso.** Módulos, providers e injeção de dependência são abstratos, e
  chegam antes de a turma ter um sistema para justificá-los. A mitigação é o M02, que
  apresenta a arquitetura antes do código.
- **Segurança dá mais trabalho.** O Django protegia por padrão; aqui, `helmet`,
  `ValidationPipe` e CSRF são configuração explícita. Isso custa tempo no M13 — mas em
  compensação a turma **vê** cada proteção, em vez de herdá-la sem saber.
- **Testes seguem apertados** (3h para Jest no backend e Vitest no frontend). O módulo
  prioriza teste de regra de negócio e de componente crítico; e2e vira leitura. Ganho
  parcial: as duas ferramentas têm API quase idêntica, o que antes não acontecia com
  pytest.
- Turma **sem** base de JavaScript não cabe em 100h — e agora o risco é maior, porque não
  há mais um bloco em outra linguagem para amortecer. Esta oferta tem o pré-requisito
  atendido. Para outras, o cronograma prevê 4h de nivelamento.

---

## ADR-01 — Arquitetura desacoplada: API REST + SPA *(superado)*

- **Status:** superado pelo ADR-10 · **Data:** 2026-08-11

Estabeleceu a separação em dois artefatos, com Django/DRF no backend. **A separação
continua valendo**; o que mudou foi o framework do backend. Registrado porque a decisão de
desacoplar é independente da linguagem escolhida — e é ela que o M02 ensina.

---

## ADR-04 — Modo híbrido *(superado)*

- **Status:** superado pelo ADR-11

Previa Django com templates + ilhas de React, caso a coordenação exigisse leitura estrita da
ementa. Substituído pela alternativa registrada no ADR-11.

---

## Como escrever um ADR (modelo para a Etapa 2)

```markdown
# ADR-00X — Título curto e afirmativo

- **Status:** proposto | aceito | superado por ADR-00Y
- **Data:** AAAA-MM-DD

## Contexto
O que é verdade hoje que torna esta decisão necessária.

## Decisão
O que foi decidido, no presente do indicativo.

## Alternativas consideradas
O que mais foi avaliado e por que foi descartado.
Uma alternativa sem motivo de descarte não foi avaliada de verdade.

## Consequências
O que melhora e o que piora. **As duas colunas.**
Um ADR só com vantagens é propaganda, não decisão.
```
