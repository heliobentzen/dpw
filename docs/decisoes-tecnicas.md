# Decisões técnicas do material

Documento que registra **por que** cada escolha foi feita e **como adaptá-la**. Serve
também de exemplo de ADR (*Architecture Decision Record*) — formato que as equipes vão
reproduzir na Etapa 2 do projeto.

---

## ADR-01 — Framework: Django

**Contexto.** A ementa exige um framework que ofereça: classes que geram o banco
automaticamente, atualização do banco a partir das classes, API de consulta/CRUD,
mapeamento de URLs, views baseadas em funções *e* classes, sistema de templates,
autenticação/gestão de usuários e caminho de deploy.

**Decisão.** Django 5.x.

**Justificativa.**

| Item da ementa | Recurso nativo do Django |
|---|---|
| Classes geram o banco | `models.Model` + `makemigrations` |
| Atualizar o banco a partir das classes | Sistema de migrações versionadas |
| Consultas e CRUD via API | ORM (`QuerySet`, `Manager`) |
| Mapeamento de URLs | `urls.py`, `path()`, `include()`, namespaces |
| Classes / métodos / funções para requisições | FBV e CBV (incl. genéricas de CRUD) |
| Templates | Django Template Language |
| Gestão de usuários | `django.contrib.auth` completo |
| Segurança | CSRF, XSS-escaping, ORM parametrizado, `SECURE_*` |

Nenhum outro framework mainstream cobre a ementa inteira sem bibliotecas de terceiros.
Django é "batteries included" — o que reduz o custo cognitivo para uma turma que está
aprendendo o *conceito*, não a *cola entre bibliotecas*.

**Consequências.** O estudante aprende um framework opinado; a transferência para
frameworks minimalistas (Flask/FastAPI/Express) exige um esforço extra, tratado no M13.

**Adaptação a outros frameworks.** O material é modular; a teoria (M01, M11, M14, M15) é
independente de stack. Equivalências:

| Conceito | Django | Laravel | Rails | Spring Boot | Next.js + Prisma |
|---|---|---|---|---|---|
| Model | `models.Model` | Eloquent Model | ActiveRecord | `@Entity` (JPA) | `schema.prisma` |
| Migração | `makemigrations`/`migrate` | `artisan migrate` | `rails db:migrate` | Flyway/Liquibase | `prisma migrate` |
| Consulta | QuerySet | Query Builder | `where`/`joins` | Spring Data JPA | Prisma Client |
| URL → handler | `urls.py` | `routes/web.php` | `config/routes.rb` | `@RequestMapping` | file-based routing |
| Template | DTL | Blade | ERB | Thymeleaf | JSX/RSC |
| Auth | `contrib.auth` | Breeze/Fortify | Devise | Spring Security | NextAuth/Auth.js |

Ao trocar de framework, mantenha os módulos, roteiros e rubricas; troque apenas os
comandos e os trechos de código.

---

## ADR-02 — Banco: SQLite → PostgreSQL

**Decisão.** SQLite nos módulos M00–M03; PostgreSQL a partir do M04 e obrigatório em
produção.

**Justificativa.** SQLite remove atrito no começo (zero instalação). Mas SQLite tem
tipagem dinâmica, suporte parcial a `ALTER TABLE` e concorrência de escrita limitada —
características que **escondem** erros que só aparecem em produção. Trocar de banco no
M04 ensina, de graça, a lição mais importante do ORM: *o código da aplicação não muda*.

**Consequência.** Uma aula extra de configuração; em troca, "funciona na minha máquina"
deixa de ser justificativa aceita.

---

## ADR-03 — Configuração por variáveis de ambiente

**Decisão.** `SECRET_KEY`, `DEBUG`, `DATABASE_URL` e `ALLOWED_HOSTS` vêm de variáveis de
ambiente, carregadas de `.env` em desenvolvimento (`python-dotenv`); `.env` fora do Git,
com `.env.example` versionado.

**Justificativa.** Fator III do [12-Factor App](https://12factor.net/pt_br/config). É o
padrão universal de mercado e o vetor nº 1 de vazamento de credenciais quando ignorado.

---

## ADR-04 — Interatividade sem SPA

**Decisão.** As interfaces são renderizadas no servidor (templates). Interatividade
pontual com **HTMX** (opcional, M08) em vez de React/Vue.

**Justificativa.** A ementa trata de templates, não de frontend SPA. Introduzir um
framework JS consumiria ~20h e deslocaria o foco. HTMX entrega atualização parcial de
página com ~10 linhas de HTML, dentro do modelo mental de requisição/resposta que a
disciplina está construindo. Equipes que já dominam JS podem usar SPA + API (M13) na
Etapa 3, mediante justificativa técnica no ADR do projeto.

---

## ADR-05 — Testes com `pytest-django`

**Decisão.** `pytest` + `pytest-django`, com `unittest`/`TestCase` do Django apresentado
como base conceitual.

**Justificativa.** `pytest` domina o ecossistema Python atual (fixtures, parametrização,
saída legível). O `TestCase` do Django é mostrado porque aparece em bases legadas e na
documentação oficial.

---

## ADR-06 — Deploy em PaaS

**Decisão.** Deploy em PaaS (Render / Railway / Fly.io) com Gunicorn + WhiteNoise +
PostgreSQL gerenciado. VPS com Nginx é apresentado como alternativa documentada.

**Justificativa.** A ementa pede "implantação do sistema", não administração de
servidores. A PaaS entrega HTTPS, banco gerenciado e deploy contínuo em uma aula, e é o
alvo real da maioria dos projetos pequenos e médios. O caminho VPS fica documentado para
quem precisa (contrato, soberania de dados, custo).

---

## ADR-07 — Estudo de caso: biblioteca comunitária

**Decisão.** O sistema-exemplo (BiblioCom) é uma biblioteca comunitária.

**Justificativa.** Precisa de: entidades com relações 1-N e N-N (obra → exemplar,
associado ↔ empréstimo), regras de negócio não triviais (limite de empréstimos, atraso,
multa, reserva), papéis distintos (associado, bibliotecário, coordenação) e relatórios.
Além disso, é um domínio **verossímil como demanda extensionista** e livre de
sensibilidade jurídica (ao contrário de saúde ou finanças, que trariam discussões de LGPD
com dados sensíveis logo na primeira semana).

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
