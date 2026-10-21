# Decisões técnicas do material

Por que a stack é esta, registrado em ADRs (*Architecture Decision Records*). Serve também de
exemplo do formato que as equipes usam no projeto ([modelo](../projeto/modelos-de-documentos/adr.md)).

| ADR | Decisão |
| --- | --- |
| [10](#adr-10--backend-em-typescript-nestjs--typeorm) | Backend em TypeScript: NestJS + TypeORM |
| [11](#adr-11--o-item-templates-da-ementa) | O item "Templates" da ementa é atendido pelo contrato da API |
| [13](#adr-13--monorepo-com-workspaces) | Monorepo com workspaces do npm |
| [14](#adr-14--postgresql-desde-o-m04) | PostgreSQL desde o M04, sem SQLite |
| [15](#adr-15--npm-como-gerenciador-de-pacotes) | npm, e não pnpm |
| [16](#adr-16--nestjs-12-e-módulos-esm) | NestJS 12 e módulos ESM |
| [17](#adr-17--node-24-lts-e-npm-11) | Node 24 LTS e npm 11 |
| [03](#adr-03--configuração-por-variáveis-de-ambiente) | Configuração por variáveis de ambiente |
| [07](#adr-07--autenticação-por-sessão-com-cookie) | Autenticação por sessão com cookie |
| [18](#adr-18--sessões-guardadas-no-postgresql) | Sessões guardadas no PostgreSQL |

> **Histórico.** O material começou em Django e passou por uma versão com SPA em React. O
> escopo atual é **backend-first**; os ADRs daquelas versões (01, 02, 04, 05, 06, 08, 09 e
> 12) foram superados e retirados deste arquivo. Continuam no histórico do Git.

---

## ADR-10 — Backend em TypeScript: NestJS + TypeORM

- **Status:** aceito · **Data:** 2026-08-18

**Contexto.** A disciplina tem 100 horas, a turma já sabe JavaScript, e o mercado brasileiro
de backend em Node/TypeScript é amplo. Ensinar uma segunda linguagem só para o backend
consumia carga horária sem ganho.

**Decisão.** Backend em TypeScript, com **NestJS** (framework) e **TypeORM** (ORM), sobre
PostgreSQL.

| Item da ementa | Onde é atendido |
| --- | --- |
| Classes geram o banco | `@Entity()` do TypeORM (M04) |
| Atualizar o banco pelas classes | `migration:generate` (M05) |
| Consultas e CRUD pela API do framework | `Repository` e `QueryBuilder` (M06) |
| Mapeamento de URLs | `@Controller` e `@Get` (M03, M07) |
| Classes / métodos para requisições | Controllers são classes, *handlers* são métodos (M07) |
| Templates: interface com o usuário | Contrato da API: Swagger e OpenAPI (ADR-11) |
| Gestão de usuários, segurança, implantação | M08, M09, M12 |

**Alternativas.**

| Alternativa | Por que não |
| --- | --- |
| Prisma | O schema é uma DSL própria, não classes. A ementa pede *"classes para geração automática do banco"* |
| Express puro | Sem estrutura: em 100h, uma turma iniciante produz um `app.js` de 800 linhas. O NestJS impõe módulos, injeção e camadas, que é o que a disciplina ensina |

**Consequências.** *A favor:* uma linguagem só; estrutura explícita; alinhamento com vagas de
Node. *Contra:* o M03 fica denso (módulos, injeção e decorators chegam juntos), e segurança
vira configuração explícita (`helmet`, `ValidationPipe`), não padrão herdado — o que custa
tempo no M09, mas deixa cada proteção visível.

---

## ADR-11 — O item "Templates" da ementa

- **Status:** aceito

A ementa diz *"Templates: criação de interfaces com o usuário utilizando o framework
escolhido"*. No escopo backend-first, a interface do sistema é o **contrato da API**: o
Swagger em `/api/docs`, gerado pelo próprio NestJS, e o schema OpenAPI consumido por
clientes externos (M03, M07, M11).

> ⚠️ **Esta é a única decisão que depende da coordenação.** Se a instituição exigir leitura
> estrita (telas renderizadas pelo framework), a alternativa é um *template engine* do
> próprio NestJS (Handlebars ou EJS) em duas ou três telas administrativas. O material
> registra a alternativa, mas não a recomenda: baixo rendimento pedagógico e pouco
> alinhamento com o mercado.

---

## ADR-13 — Monorepo com workspaces

- **Status:** aceito · **Data:** 2026-08-18 · ferramenta revista pela ADR-15

**Decisão.**

```text
bibliocom/
├── package.json        workspaces + scripts da raiz
├── backend/            NestJS + TypeORM
└── pacotes/tipos/      @bibliocom/tipos — DTOs e enums compartilhados (M11)
```

**Consequências.** Um `npm install` na raiz resolve tudo, e o pacote de tipos é consumido
por qualquer cliente da API, com verificação de contrato no CI. Em troca, a turma precisa
entender *workspaces* — 20 minutos no M00.

---

## ADR-14 — PostgreSQL desde o M04

- **Status:** aceito · **Data:** 2026-08-26 · supera a antiga ADR-02 (SQLite até o M04)

**Contexto.** Começar em SQLite e trocar para PostgreSQL depois invalidava trabalho: as
migrações geradas num banco não rodam no outro, e o roteiro mandava apagá-las e refazer.

**Decisão.** PostgreSQL em Docker desde o primeiro passo do M04. SQLite não aparece no
material.

**Consequências.** *A favor:* um dialeto só do M04 ao M12; as migrações de desenvolvimento são
as mesmas de produção; o `enum` nativo vira conteúdo do M04. *Contra:* a turma precisa de
Docker já no M04 — no Windows, WSL2 — e os guias avisam com antecedência.

---

## ADR-15 — npm como gerenciador de pacotes

- **Status:** aceito · **Data:** 2026-09-01

**Decisão.** npm, que já vem com o Node. Os projetos do monorepo ficam no campo `workspaces`
do `package.json` da raiz.

| Critério | npm | pnpm |
| --- | --- | --- |
| Instalação | nenhuma | passo extra |
| Windows | sem ressalva | depende de links simbólicos (Modo de Desenvolvedor ou administrador) |
| Tutoriais e fóruns | tudo, sem tradução | é preciso traduzir os comandos |
| Disco e rigor de dependências | duplica; permissivo | compartilha; rigoroso |

**Consequências.** As vantagens do pnpm (disco e rigor) pagam-se em dezenas de repositórios,
não num curso com um. O rigor perdido é compensado em parte pelo `npm ci` no CI (M10), que
falha quando o lockfile não bate com o `package.json`.

---

## ADR-16 — NestJS 12 e módulos ESM

- **Status:** aceito · **Data:** 2026-09-02

**Contexto.** O `nest new` do NestJS 12 gera módulos **ESM**, imports de arquivo próprio com
`.js`, `await` no topo do `main.ts` e **Vitest** no lugar do Jest.

**Decisão.** Adotar o NestJS 12. A CLI é fixada em `@12` (M03, etapa 2), por
reprodutibilidade da turma; os pacotes `@nestjs/*` acompanham a versão do projeto sem fixar.

| | NestJS 11 | NestJS 12 |
| --- | --- | --- |
| Instalar pacote `@nestjs/*` | Versões inconsistentes entre pacotes; erros `ERESOLVE` opacos | `npm install @nestjs/swagger` e pronto |
| Import de arquivo próprio | `from "./acervo.service"` | `from "./acervo.service.js"` |
| Testes | Jest | Vitest |

**Consequências.** O `.js` em import de arquivo `.ts` estranha na primeira semana, mas é uma
regra só, com erro que diz a correção (M03, etapa 5a). O `ERESOLVE` evitado não vira regra:
vira consulta ao professor. O `ts-node` passa a ser instalado explicitamente (M05).

---

## ADR-17 — Node 24 LTS e npm 11

- **Status:** aceito · **Data:** 2026-10-01

**Contexto.** O Node 20 saiu de suporte em abril de 2026, e o npm 10 falha ao instalar o
projeto do NestJS 12 (`Cannot read properties of null (reading 'edgesOut')`).

**Decisão.** Node 24 LTS, que traz o npm 11. Quem não puder atualizar o Node atualiza só o
npm (`npm install -g npm@11`). O `verifica-ambiente.mjs`, o M00 e o M03 conferem as versões.

**Consequências.** `nest new` funciona na primeira tentativa. Laboratórios com imagem antiga
precisam ser atualizados antes do semestre.

---

## ADR-03 — Configuração por variáveis de ambiente

- **Status:** aceito

**Decisão.** Nenhum segredo no código. O backend lê a configuração via `@nestjs/config`,
validada na inicialização (M03, etapa 17). O `.env` fica fora do Git; o `.env.example`, com
as chaves sem valor, fica dentro.

---

## ADR-07 — Autenticação por sessão com cookie

- **Status:** aceito

**Decisão.** Sessão com cookie `HttpOnly`, `Secure` e `SameSite=Lax`, via `express-session`,
com senha guardada em Argon2 e *guards* do Nest por papel (M08). **Não** JWT guardado em
`localStorage`.

**Justificativa.** Token em `localStorage` é legível por qualquer script da página: um XSS
vira roubo de sessão. Cookie `HttpOnly` não é. JWT é a escolha certa quando há múltiplos
domínios ou clientes móveis — o M09 ensina a decidir pelo modelo de ameaça, não por moda, e
o portfólio (E4) pede um ADR próprio dessa escolha.

---

## ADR-18 — Sessões guardadas no PostgreSQL

- **Status:** aceito · **Data:** 2026-10-01 · complementa a ADR-07

**Contexto.** Por padrão, o `express-session` guarda as sessões na memória do processo: todo
deploy ou reinício desloga todo mundo, e duas instâncias não enxergam as sessões uma da outra.

**Decisão.** Sessões no próprio PostgreSQL, com `connect-pg-simple`, numa tabela criada por
migração escrita à mão (M12). O M08 começa com a memória, para não somar um conceito à
primeira aula de autenticação.

**Consequências.** *A favor:* nenhum serviço novo para hospedar; o processo volta a ser
descartável (12 fatores, fator VI). *Contra:* uma consulta a mais por requisição autenticada.
