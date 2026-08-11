# M13 — Exercícios

> **Regra de conduta.** Toda exploração é feita **exclusivamente** contra o seu próprio
> ambiente local ou contra sistemas para os quais você tem autorização explícita por
> escrito. Testar sistemas de terceiros sem autorização é crime (Lei 12.737/2012, art.
> 154-A do Código Penal). Nesta disciplina, o alvo é sempre o seu próprio código.

---

## E11.1 — Laboratório de vulnerabilidades (em duplas) ⭐

Trabalhe sobre [`../../recursos/codigo/vulneravel.py`](../../recursos/codigo/vulneravel.py),
que tem **10 casos**. Para cada um, entregue:

| Campo | Conteúdo |
|---|---|
| Vulnerabilidade | Nome e categoria OWASP |
| Impacto | O que um atacante consegue, em termos de negócio |
| Exploração | Payload/URL exato que demonstra |
| Evidência | Print ou saída do `curl` |
| Correção | Diff do código |
| Por que funciona | 2–3 linhas |

Divisão sugerida: cada pessoa ataca 5 casos e corrige os outros 5; depois trocam e
revisam.

---

## E11.2 — CSRF na prática (em duplas)

1. Suba o BiblioCom em `localhost:8000` e faça login.
2. Crie um segundo servidor em `localhost:9000` (basta `python -m http.server 9000`) com
   uma página contendo o formulário de ataque:

```html
<h1>Você ganhou um livro grátis!</h1>
<form action="http://localhost:8000/obras/1/excluir/" method="post" id="f"></form>
<script>document.getElementById("f").submit()</script>
```

3. Com a proteção CSRF **desligada** (`@csrf_exempt`), abra a página maliciosa. O que
   aconteceu?
4. Religue a proteção. Tente de novo. Qual o status agora?
5. Inspecione o valor de `csrftoken` no cookie e o `csrfmiddlewaretoken` no formulário
   legítimo. Por que o site atacante não consegue obter esse valor?
6. Teste o efeito de `SESSION_COOKIE_SAMESITE = "Strict"` no mesmo ataque.

**Entrega:** relato com evidências dos passos 3, 4 e 6.

---

## E11.3 — XSS: os três tipos (individual)

Demonstre no BiblioCom, e depois corrija:

| Tipo | Como demonstrar |
|---|---|
| **Refletido** | Payload na query string exibido sem escape na página de busca |
| **Armazenado** | Payload salvo na sinopse de uma obra, exibido com `|safe` |
| **Baseado em DOM** | JS que insere `location.hash` com `innerHTML` |

Payloads para testar: `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`,
`"><svg onload=alert(1)>`, `javascript:alert(1)` (em `href`).

Para cada um: por que o escape padrão do Django pegou ou não pegou? Qual a correção
específica daquele contexto (HTML, atributo, URL, JS)?

---

## E11.4 — Injeção de SQL com e sem ORM (individual)

1. Crie uma view de busca com `raw()` e f-string.
2. Explore com: `' OR '1'='1`, `' UNION SELECT ...`, `'; --`.
3. Ative o log de SQL e mostre a consulta efetivamente executada.
4. Corrija de duas formas: com parâmetros `%s` e com o ORM.
5. Compare o SQL gerado nas duas correções.

Responda: **por que a parametrização resolve, se o valor continua vindo do usuário?**
(A resposta correta fala sobre a separação entre o comando e os dados no protocolo do
banco, não sobre "escapar caracteres".)

---

## E11.5 — Hardening do projeto (individual)

Aplique ao **projeto da sua equipe** e documente com o antes/depois:

- [ ] `check --deploy` limpo
- [ ] Todos os cabeçalhos de segurança
- [ ] CSP funcional (sem `unsafe-inline`)
- [ ] `pip-audit` sem alertas críticos
- [ ] `detect-secrets` limpo, inclusive no histórico
- [ ] Rate limit no login
- [ ] Log de eventos de segurança

**Entrega:** relatório com a saída de cada comando antes e depois.

---

## E11.6 — Mapa de dados pessoais (em equipe) ⭐

Para o projeto da equipe, preencha:

| Dado coletado | Finalidade | Base legal (art. 7º) | Quem acessa | Retenção | Proteção | É mesmo necessário? |
|---|---|---|---|---|---|---|

Depois:

1. Risque as linhas em que a última coluna é "não" e **remova os campos do sistema**.
2. Escreva o aviso de privacidade (máx. 1 página, linguagem de 9º ano).
3. Descreva como o sistema atende aos direitos de acesso, correção e eliminação.
4. Escreva o **plano de resposta a incidente**: se vazar, quem faz o quê nas primeiras 24h,
   e quem precisa ser comunicado (titulares e ANPD).

---

## E11.7 — Revisão de segurança cruzada (em equipes)

Cada equipe revisa o código de **outra** equipe usando o
[checklist de segurança](../../recursos/checklists/seguranca.md).

Regras: revisar código, não pessoas; toda observação vem com evidência (arquivo:linha) e
sugestão de correção; nada de exploração fora do ambiente local da equipe revisada, e
sempre com o conhecimento dela.

**Entrega:** relatório de revisão (máx. 2 páginas) + resposta da equipe revisada dizendo o
que corrigiu, o que não corrigiu e por quê.

Este exercício vale duplamente: treina revisão de segurança e é o formato exato de um code
review profissional.

---

## E11.8 — Desafio: rate limiting (individual)

Implemente limitação de taxa **sem** biblioteca externa:

- 5 tentativas de login por usuário em 15 minutos;
- 20 buscas por minuto por IP;
- resposta `429 Too Many Requests` com o cabeçalho `Retry-After`;
- armazenamento no cache do Django (não no banco);
- não pode bloquear usuários legítimos atrás de NAT compartilhado (pense em como).

Depois compare sua implementação com `django-axes` e `django-ratelimit`: o que elas fazem
que a sua não faz?

---

## Gabarito parcial

**E11.2 (5)** — A política de mesma origem impede que `localhost:9000` leia cookies ou o
DOM de `localhost:8000`. O atacante consegue **enviar** a requisição (e o navegador anexa o
cookie de sessão), mas não consegue **ler** o token. É por isso que a defesa CSRF funciona
com um segredo que precisa ser lido para ser enviado.

**E11.4** — Com parâmetros, o driver envia o comando e os dados em canais separados: o
banco compila o SQL **antes** de conhecer o valor, e nenhum conteúdo do valor pode virar
sintaxe. Escapar caracteres é uma mitigação frágil, dependente de charset e de contexto;
parametrizar é estrutural.
