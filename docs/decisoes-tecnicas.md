# Decisões técnicas da disciplina

Por que a stack e a organização da disciplina são estas, registradas em ADRs
(*Architecture Decision Records*). Serve também de exemplo do formato que as equipes usam no
projeto ([modelo](../projeto/modelos-de-documentos/adr.md)).

| ADR | Decisão |
| --- | --- |
| [01](#adr-01--backend-em-typescript-nestjs--typeorm) | Backend em TypeScript: NestJS + TypeORM |
| [02](#adr-02--o-item-templates-da-ementa) | O item "Templates" da ementa é atendido pelo contrato da API |
| [03](#adr-03--monorepo-com-workspaces) | Monorepo com workspaces do npm |
| [04](#adr-04--postgresql-desde-o-m04) | PostgreSQL desde o M04, sem SQLite |
| [05](#adr-05--npm-como-gerenciador-de-pacotes) | npm, e não pnpm |
| [06](#adr-06--nestjs-12-e-módulos-esm) | NestJS 12 e módulos ESM |
| [07](#adr-07--node-24-lts-e-npm-11) | Node 24 LTS e npm 11 |
| [08](#adr-08--configuração-por-variáveis-de-ambiente) | Configuração por variáveis de ambiente |
| [09](#adr-09--autenticação-por-sessão-com-cookie) | Autenticação por sessão com cookie |
| [10](#adr-10--sessões-guardadas-no-postgresql) | Sessões guardadas no PostgreSQL |
| [11](#adr-11--um-projeto-de-equipe-do-início-ao-fim) | Um projeto de equipe do início ao fim (decisão didática) |

---

## ADR-01 — Backend em TypeScript: NestJS + TypeORM

- **Status:** aceito

**Contexto.** A disciplina tem 100 horas, a turma de ADS chega a ela sabendo JavaScript, e o
mercado de backend em Node/TypeScript é amplo, inclusive em vagas remotas acessíveis a quem
mora fora das capitais. Ensinar uma segunda linguagem só para o backend consumiria carga
horária sem ganho.

**Decisão.** Backend em TypeScript, com **NestJS** (framework) e **TypeORM** (ORM), sobre
PostgreSQL.

| Item da ementa | Onde é atendido |
| --- | --- |
| Classes geram o banco | `@Entity()` do TypeORM (M04) |
| Atualizar o banco pelas classes | `migration:generate` (M05) |
| Consultas e CRUD pela API do framework | `Repository` e `QueryBuilder` (M06) |
| Mapeamento de URLs | `@Controller` e `@Get` (M03, M07) |
| Classes / métodos para requisições | Controllers são classes, *handlers* são métodos (M07) |
| Templates: interface com o usuário | Contrato da API: Swagger e OpenAPI (ADR-02) |
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

## ADR-02 — O item "Templates" da ementa

- **Status:** aceito

A ementa diz *"Templates: criação de interfaces com o usuário utilizando o framework
escolhido"*. No escopo backend-first, a interface do sistema é o **contrato da API**: o
Swagger em `/api/docs`, gerado pelo próprio NestJS, e o schema OpenAPI consumido por
clientes externos (M03, M07, M11).

> ⚠️ **Esta decisão depende do colegiado do curso.** Se o colegiado exigir leitura estrita
> (telas renderizadas pelo framework), a alternativa é um *template engine* do próprio
> NestJS (Handlebars ou EJS) em duas ou três telas administrativas. Ela não é a recomendada:
> rende pouco pedagogicamente e tem pouco alinhamento com o mercado.

---

## ADR-03 — Monorepo com workspaces

- **Status:** aceito

**Decisão.**

```text
projeto/               o repositório da equipe
├── package.json        workspaces + scripts da raiz
├── backend/            NestJS + TypeORM
└── pacotes/tipos/      @projeto/tipos — tipos gerados do contrato OpenAPI (M11)
```

**Consequências.** Um `npm install` na raiz resolve tudo, e o pacote de tipos é consumido
por qualquer cliente da API, com verificação de contrato no CI. Em troca, a turma precisa
entender *workspaces* — 20 minutos no M00.

---

## ADR-04 — PostgreSQL desde o M04

- **Status:** aceito

**Contexto.** Começar em SQLite e trocar para PostgreSQL depois invalida trabalho: as
migrações geradas num banco não rodam no outro e precisariam ser apagadas e refeitas.

**Decisão.** PostgreSQL em Docker desde o primeiro passo do M04. SQLite não aparece no
material.

**Consequências.** *A favor:* um dialeto só do M04 ao M12; as migrações de desenvolvimento são
as mesmas de produção; o `enum` nativo vira conteúdo do M04. *Contra:* a turma precisa de
Docker já no M04 — no Windows, WSL2 — e os guias avisam com antecedência.

---

## ADR-05 — npm como gerenciador de pacotes

- **Status:** aceito

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

## ADR-06 — NestJS 12 e módulos ESM

- **Status:** aceito

**Contexto.** O `nest new` do NestJS 12 gera módulos **ESM**, imports de arquivo próprio com
`.js`, `await` no topo do `main.ts` e **Vitest** no lugar do Jest. Boa parte dos tutoriais
(e das respostas de IA) ainda mostra o formato do NestJS 11.

**Decisão.** Adotar o NestJS 12. A CLI é fixada em `@12` (M03, etapa 2), para que toda a turma
gere o mesmo projeto; os pacotes `@nestjs/*` acompanham a versão do projeto sem fixar.

| | NestJS 11 (tutoriais) | NestJS 12 (disciplina) |
| --- | --- | --- |
| Instalar pacote `@nestjs/*` | Versões inconsistentes entre pacotes; erros `ERESOLVE` opacos | `npm install @nestjs/swagger` e pronto |
| Import de arquivo próprio | `from "./pessoas.service"` | `from "./pessoas.service.js"` |
| Testes | Jest | Vitest |

**Consequências.** O `.js` em import de arquivo `.ts` estranha na primeira semana, mas é uma
regra só, com erro que diz a correção (M03, etapa 5a). O `ts-node` é instalado explicitamente
(M05).

---

## ADR-07 — Node 24 LTS e npm 11

- **Status:** aceito

**Contexto.** O Node 20 está fora de suporte, e o npm 10 falha ao instalar o projeto do
NestJS 12 (`Cannot read properties of null (reading 'edgesOut')`).

**Decisão.** Node 24 LTS, que traz o npm 11. Quem não puder atualizar o Node atualiza só o
npm (`npm install -g npm@11`). O `verifica-ambiente.mjs`, o M00 e o M03 conferem as versões.

**Consequências.** `nest new` funciona na primeira tentativa. Os laboratórios do campus
precisam estar com o Node 24 antes do semestre ([plano de ensino](plano-de-ensino.md#6-recursos-necessários)).

---

## ADR-08 — Configuração por variáveis de ambiente

- **Status:** aceito

**Decisão.** Nenhum segredo no código. O backend lê a configuração via `@nestjs/config`,
validada na inicialização (M03, etapa 17). O `.env` fica fora do Git; o `.env.example`, com
as chaves sem valor, fica dentro.

---

## ADR-09 — Autenticação por sessão com cookie

- **Status:** aceito

**Decisão.** Sessão com cookie `HttpOnly`, `Secure` e `SameSite=Lax`, via `express-session`,
com senha guardada em Argon2 e *guards* do Nest por papel (M08). **Não** JWT guardado em
`localStorage`.

**Justificativa.** Token em `localStorage` é legível por qualquer script da página: um XSS
vira roubo de sessão. Cookie `HttpOnly` não é. JWT é a escolha certa quando há múltiplos
domínios ou clientes móveis — o M09 ensina a decidir pelo modelo de ameaça, não por moda, e
cada equipe registra um ADR próprio dessa escolha no M08.

---

## ADR-10 — Sessões guardadas no PostgreSQL

- **Status:** aceito · complementa a ADR-09

**Contexto.** Por padrão, o `express-session` guarda as sessões na memória do processo: todo
deploy ou reinício desloga todo mundo, e duas instâncias não enxergam as sessões uma da outra.

**Decisão.** Sessões no próprio PostgreSQL, com `connect-pg-simple`, numa tabela criada por
migração escrita à mão (M12). O M08 começa com a memória, para não somar um conceito à
primeira aula de autenticação.

**Consequências.** *A favor:* nenhum serviço novo para hospedar; o processo volta a ser
descartável (12 fatores, fator VI). *Contra:* uma consulta a mais por requisição autenticada.

---

## ADR-11 — Um projeto de equipe do início ao fim

- **Status:** aceito

**Contexto.** Construir um sistema de exemplo nas aulas e, em paralelo, o projeto da equipe
dobra o trabalho: o estudante faz tudo duas vezes, em dois domínios, e o projeto real só
começa a ser programado no fim do semestre.

**Decisão.**

1. O código da turma é o do projeto da equipe. Cada módulo mostra o conceito com um trecho
   curto e genérico (pessoas, atendimentos, agendamentos — sem continuidade entre módulos) e
   termina com **🧩 No projeto da equipe**: o que aplicar no sistema da equipe.
2. A nota vem de quatro entregas da equipe: P1 (15%), P2 (25%), P3 (40%) e P4 (20%). O
   acompanhamento individual se faz pelo fator de participação (commits, avaliação por pares,
   arguição oral, observação), que não é uma entrega.
3. A P1 (problema, escopo) fica na semana 4, antes do M04: o modelo de dados feito em aula é o
   do domínio da equipe.
4. Nenhuma entrega depende de organização externa. O projeto atende a um problema
   comunitário **fundamentado** (pesquisa, relatos, personas); levar o sistema a uma
   organização real é uma trilha opcional que vale até +1,0 de bônus. Motivo: agenda,
   conexão e disponibilidade das organizações estão fora do controle da equipe, e não
   devem reprovar ninguém numa disciplina técnica.

**Consequências.** *A favor:* um só sistema, aprendido e entregue; cada conteúdo tem um "para
quê" concreto; nenhuma equipe depende de terceiros para ser aprovada. *Contra:* os roteiros
não são copiáveis — a equipe precisa traduzir o exemplo para o seu domínio, o que exige mais
atendimento do docente nas semanas 5 a 9; e o contato com usuários de verdade depende do
teste com usuário (P3) e da trilha opcional. A arguição oral da P4 é o principal instrumento
para verificar o domínio individual. Se o PPC atribuir carga horária extensionista a esta
disciplina, ver o [plano de ensino](plano-de-ensino.md#10-adaptações).
