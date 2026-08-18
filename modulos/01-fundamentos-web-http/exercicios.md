# M01 — Exercícios

## E01.1 — Classificar métodos (individual)

Para cada operação de uma biblioteca, indique o **método HTTP**, a **URL** e justifique em
uma linha usando os conceitos de *safe* e *idempotente*.

| # | Operação | Método | URL | Justificativa |
|---|---|---|---|---|
| 1 | Listar todas as obras | | | |
| 2 | Buscar obras por título | | | |
| 3 | Ver detalhes da obra 42 | | | |
| 4 | Cadastrar uma obra nova | | | |
| 5 | Corrigir o ano de publicação da obra 42 | | | |
| 6 | Substituir todos os dados da obra 42 | | | |
| 7 | Excluir a obra 42 | | | |
| 8 | Registrar empréstimo do exemplar 7 | | | |
| 9 | Renovar o empréstimo 15 | | | |
| 10 | Fazer login | | | |
| 11 | Fazer logout | | | |
| 12 | Baixar o relatório mensal em PDF | | | |

> Atenção às pegadinhas: 9 e 11 costumam ser respondidas errado. Logout altera estado no
> servidor (destrói a sessão) — portanto **não** é GET.

---

## E01.2 — Ler mensagens HTTP (individual)

Identifique **todos** os problemas em cada mensagem e reescreva-a corretamente.

**(a)**
```http
GET /conta/transferir?de=123&para=456&valor=1000&senha=minhasenha HTTP/1.1
Host: banco.exemplo.com
```

**(b)**
```http
POST /api/obras HTTP/1.1
Host: biblioteca.exemplo.org
Content-Type: text/html

{"titulo": "Dom Casmurro"}
```

**(c)**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"erro": "usuario nao autenticado"}
```

**(d)**
```http
HTTP/1.1 301 Moved Permanently
Location: /obra/17/
Set-Cookie: sessionid=abc123
```

---

## E01.3 — Diagnóstico por status (individual)

Para cada situação, diga qual status você esperaria e o que investigaria primeiro:

1. Formulário de cadastro enviado com e-mail já usado.
2. Usuário anônimo tenta acessar `/admin/`.
3. Usuário logado (associado) tenta acessar `/relatorios/financeiro/`.
4. Requisição `DELETE` para uma rota que só aceita `GET` e `POST`.
5. Aplicação lança `ZeroDivisionError` dentro da view.
6. A aplicação está fora do ar e o Nginx continua respondendo.
7. Usuário tentou logar 50 vezes em 1 minuto.
8. Navegador já tem a versão atual do CSS em cache.

---

## E01.4 — Estender o servidor mínimo (individual) ⭐

A partir do `servidor-minimo.mjs` do roteiro prático, implemente:

1. Rota `GET /recados/<n>` que mostra apenas o recado de índice `n`, com **404** se não
   existir.
2. Rota `POST /recados/<n>/excluir` que remove o recado e redireciona (**PRG**).
3. Um contador de visitas usando cookie: leia o cabeçalho `Cookie`, incremente e devolva
   `Set-Cookie`. Exiba "esta é sua Nª visita".
4. Escape do conteúdo do recado com `html.escape()`. **Antes** de implementar, envie o
   recado `<script>alert('xss')</script>` e observe o que acontece. Depois, compare.

O item 4 é a primeira experiência prática com XSS — retomada no M13.

---

## E01.5 — Medir o mundo real (individual)

Escolha três sites brasileiros de perfis diferentes (um portal de notícias, um e-commerce,
um site institucional/governo). Para cada um, colete no DevTools:

| Métrica | Site A | Site B | Site C |
|---|---|---|---|
| Nº de requisições da página inicial | | | |
| Peso total transferido | | | |
| Tempo até o *DOMContentLoaded* | | | |
| Versão do HTTP usada (coluna Protocol) | | | |
| Nº de domínios de terceiros contactados | | | |
| Usa HTTPS com HSTS? | | | |

Escreva 5 linhas comparando: **o que explica a diferença de peso e de tempo?**

---

## E01.6 — Debate dirigido (em grupo, 20 min)

*"Se o HTTPS criptografa tudo, por que ainda importa se os dados vão por GET ou POST?"*

Cada grupo defende uma posição e apresenta em 3 minutos. Pontos que a discussão precisa
tocar: histórico do navegador, logs do servidor, cabeçalho `Referer`, cache, compartilhamento
de link, e o fato de que TLS protege **em trânsito**, não **nos extremos**.

---

## Gabarito parcial

**E01.1** — 1: `GET /obras/`. 2: `GET /obras/?q=...` (busca não altera estado; a URL deve
ser compartilhável). 5: `PATCH /obras/42/`. 6: `PUT /obras/42/`. 8: `POST /emprestimos/`.
9: `POST /emprestimos/15/renovar/` — renovar **não** é idempotente (cada chamada estende o
prazo), logo não é PUT. 11: `POST /logout/` — altera estado.

**E01.2 (a)** — segredo e operação financeira via GET: dados no histórico/logs, requisição
repetível por F5 e cache, vulnerável a CSRF. Correto: `POST /conta/transferir` com os dados
no corpo, autenticação por sessão/token (nunca senha em cada requisição) e token CSRF.

**E01.2 (c)** — status mentiroso: erro de autenticação deve ser `401` (ou `403`), não `200`.
Clientes automatizados e monitoramento decidem pelo status.
