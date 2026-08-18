# M17 — Exercícios

## E17.1 — O log que responde perguntas (individual)

Um associado liga dizendo que "o sistema não deixou eu pegar o livro, ontem à tarde".

1. Com o log atual, você consegue descobrir o que aconteceu? Tente.
2. Liste as perguntas que você **não** conseguiu responder.
3. Acrescente os campos que faltavam.
4. Reproduza o cenário e confirme que agora responde.

| Pergunta | Consegui? | O que faltava |
|---|---|---|
| Quem era o usuário? | | |
| Que exemplar era? | | |
| Qual regra recusou? | | |
| Que horas foi? | | |
| Houve erro, ou foi recusa esperada? | | |

> **O critério de um bom log não é volume, é responder perguntas.** Este exercício mede
> isso diretamente.

---

## E17.2 — Vazamento pelo log (individual) ⚠️

1. **Remova** o `redact` da configuração do Pino.
2. Faça login e uma requisição autenticada.
3. Procure no log: o cookie de sessão aparece? E a senha, no `POST /auth/login`?
4. Copie o valor do cookie encontrado e use-o num `curl` com `-H "Cookie: ..."`.
5. Você conseguiu agir como aquele usuário?
6. Recoloque o `redact` e confirme que os campos viraram `[Redacted]`.

Responda: quem tem acesso aos logs do seu projeto? É o mesmo conjunto de pessoas que tem
acesso ao banco?

---

## E17.3 — Healthcheck honesto (individual) ⭐

1. Escreva um healthcheck que só devolve `{"status":"ok"}`, sem tocar em nada.
2. **Derrube o banco** (`docker compose stop db`).
3. Chame o healthcheck. O que ele responde?
4. Chame um endpoint real. O que acontece?
5. Troque pelo healthcheck com `pingCheck` e repita 2 a 4.

| | Banco no ar | Banco fora |
|---|---|---|
| Healthcheck ingênuo | | |
| Healthcheck com `pingCheck` | | |

Responda: se a plataforma usa o healthcheck para decidir se reinicia o serviço, o que o
ingênuo provoca?

---

## E17.4 — Níveis de log (individual)

Classifique cada evento no nível certo e justifique:

| Evento | `debug` / `log` / `warn` / `error` | Justificativa |
|---|---|---|
| Empréstimo registrado com sucesso | | |
| Tentativa de login com senha errada | | |
| 10 tentativas de login falhas do mesmo IP em 1 min | | |
| Banco indisponível | | |
| Consulta demorou 3 segundos | | |
| Usuário tentou acessar recurso de outro (IDOR) | | |
| Valor de uma variável durante o cálculo do prazo | | |
| Campo obrigatório faltando no formulário | | |

Pegadinha: o último caso é erro **do usuário**, não do sistema. Vale log?

---

## E17.5 — Restaurar o backup (em duplas) ⭐⭐

Backup que nunca foi restaurado não é backup — é esperança.

1. Gere um backup do banco de desenvolvimento.
2. Anote o número de obras.
3. **Apague** algumas linhas e altere outras.
4. Restaure o backup **num banco separado**.
5. Confirme que os dados voltaram.
6. Cronometrem: quanto tempo levou da decisão até o sistema utilizável?

Entreguem o procedimento escrito, com os comandos exatos, em `docs/restauracao.md`. Ele
precisa ser executável por alguém da equipe que **não** participou deste exercício — testem
isso trocando de dupla.

---

## E17.6 — Um incidente de verdade (em equipe)

Provoquem uma falha em produção (ou no ambiente de staging) e conduzam o incidente:

1. Uma pessoa quebra algo sem avisar as demais (ex.: variável de ambiente errada).
2. As demais detectam **pelo monitoramento**, não pelo aviso.
3. Diagnosticam pelos logs.
4. Corrigem ou revertem.
5. Escrevem o *post-mortem*.

O *post-mortem* responde: o que aconteceu, quanto tempo até detectar, quanto tempo até
resolver, qual a causa raiz, e **o que impediria a repetição**.

> Sem culpados. O objetivo é o sistema, não a pessoa — e um post-mortem que aponta culpado
> garante que ninguém relate o próximo incidente.

---

## E17.7 — Rotina de manutenção (em equipe)

Preencham para o projeto de vocês, com **nome e data**, não "a equipe":

| Frequência | Tarefa | Responsável | Como verificar que foi feito |
|---|---|---|---|
| Semanal | Revisar erros novos no Sentry | | |
| Semanal | Conferir que o backup rodou | | |
| Mensal | `pnpm audit` e atualizar dependências críticas | | |
| Trimestral | **Testar a restauração do backup** | | |
| Semestral | Revisar acessos e remover contas inativas | | |

---

## Gabarito parcial

**E17.2** — Sem `redact`, o `pino-http` registra os cabeçalhos completos por padrão,
incluindo `Cookie`. Como o cookie **é** a sessão, quem lê o log assume a identidade de
qualquer usuário que passou pelo sistema — sem precisar de senha e sem deixar rastro de
invasão. É por isso que log é dado sensível.

**E17.3** — O healthcheck ingênuo responde 200 com o banco fora: a plataforma conclui que o
serviço está saudável e **não** reinicia nem alerta, enquanto todo endpoint real devolve 500.
O monitoramento passa a esconder a falha em vez de revelá-la — pior que não ter monitoramento.

**E17.4** — Login com senha errada é `warn` (esperado, mas relevante); 10 falhas em 1 minuto
é `error` ou alerta (ataque em curso). Campo obrigatório faltando é erro do usuário, tratado
pela validação (M07): **não vai para o log** — encheria o volume de ruído e escondera o que
importa. IDOR é `warn` no mínimo: alguém está sondando.
