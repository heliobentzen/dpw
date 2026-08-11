# M13 — Exercícios

> **Regra de conduta.** Toda exploração é feita **exclusivamente** contra o seu ambiente
> local ou contra sistemas para os quais você tem autorização explícita por escrito. Testar
> sistemas de terceiros sem autorização é crime (Lei 12.737/2012, art. 154-A do Código
> Penal). Nesta disciplina, o alvo é sempre o seu próprio código.

---

## E13.1 — Laboratório completo (em duplas) ⭐

18 casos, nas duas camadas:

- [`vulneravel.py`](../../recursos/codigo/vulneravel.py) — 10 casos de backend
- [`vulneravel.tsx`](../../recursos/codigo/vulneravel.tsx) — 8 casos de frontend

Para cada um:

| Campo | Conteúdo |
|---|---|
| Vulnerabilidade | Nome e categoria OWASP |
| Camada | Backend / frontend / ambas |
| Impacto | O que o atacante consegue, em termos de negócio |
| Exploração | Payload/URL/comando exato |
| Evidência | Print ou saída de `curl` |
| Correção | Diff |
| Por que funciona | 2–3 linhas |

Divisão sugerida: cada pessoa ataca metade e corrige a outra metade; depois revisam
mutuamente.

---

## E13.2 — CORS não é segurança (individual) ⭐

1. Configure `CORS_ALLOWED_ORIGINS = []` e chame a API de `localhost:5173` sem o proxy.
   Capture o erro do console.
2. Faça a **mesma** requisição com `curl`. Funciona? Por quê?
3. Configure `CORS_ALLOW_ALL_ORIGINS = True` **e** `CORS_ALLOW_CREDENTIALS = True`.
4. Suba uma página em `localhost:9000` que faz `fetch("http://localhost:8000/api/emprestimos/", {credentials: "include"})` e exibe a resposta.
5. Estando logado no BiblioCom noutra aba, abra a página maliciosa. O que ela consegue ler?
6. Corrija para lista explícita e repita o passo 5.

**Entrega:** evidências + respostas:

- Quem bloqueia a requisição: o navegador ou o servidor?
- Por que o `curl` nunca é afetado?
- CORS protege a **sua API** ou o **usuário de outro site**?
- Por que o material prefere *same-site* a configurar CORS?

---

## E13.3 — XSS em React (individual)

Demonstre e corrija cada tipo:

| Tipo | Como demonstrar no BiblioCom |
|---|---|
| Armazenado | Sinopse com payload, renderizada com `dangerouslySetInnerHTML` |
| Via URL | `href` vindo do usuário com `javascript:alert(1)` |
| Via atributo | `style` ou `src` montado com entrada do usuário |

Payloads: `<img src=x onerror=alert(1)>`, `"><svg onload=alert(1)>`,
`javascript:alert(document.cookie)`.

Responda: **por que `{textoDoUsuario}` é seguro e `dangerouslySetInnerHTML` não é?** E por
que o cookie `HttpOnly` reduz — mas não elimina — o impacto de um XSS?

---

## E13.4 — Segredo no bundle (individual)

1. Adicione `VITE_CHAVE_SECRETA=nao-deveria-vazar-42` ao `.env` do frontend e use-a.
2. `pnpm build`
3. `grep -r "nao-deveria-vazar-42" dist/`
4. Abra o arquivo encontrado e localize o valor.
5. Agora repita com a variável **sem** o prefixo `VITE_`. Ela aparece? O componente
   funciona?
6. Escreva a regra em uma frase, e o desenho correto quando o navegador precisa de um
   serviço que exige chave secreta.

---

## E13.5 — Hardening completo (individual)

Aplique ao **projeto da equipe** e documente antes/depois:

- [ ] `check --deploy` limpo
- [ ] Cabeçalhos de segurança (nota A em securityheaders.com, após o M16)
- [ ] CSP funcional, sem `unsafe-inline` em `script-src`
- [ ] `connect-src` restrito
- [ ] CORS com lista explícita, ou dispensado por *same-site*
- [ ] `pip-audit` e `pnpm audit` sem alertas críticos ou altos
- [ ] `detect-secrets scan` limpo, inclusive no histórico
- [ ] Nenhum segredo no bundle (`grep` no `dist/`)
- [ ] Rate limit no login
- [ ] Serializers minimizados

---

## E13.6 — Mapa de dados pessoais (em equipe) ⭐

| Dado | Finalidade | Base legal (art. 7º) | Quem acessa | Retenção | Proteção | É necessário? |
|---|---|---|---|---|---|---|

Depois:

1. Risque as linhas com "não" na última coluna e **remova os campos do sistema**.
2. Confira: a **API** ainda devolve algum campo que a tela não usa? Minimize o serializer.
3. Escreva o aviso de privacidade (máx. 1 página, linguagem de 9º ano).
4. Descreva como o sistema atende aos direitos de acesso, correção e eliminação.
5. Escreva o plano de resposta a incidente: quem faz o quê nas primeiras 24h, e quem
   precisa ser comunicado (titulares e ANPD).

---

## E13.7 — Revisão cruzada (em equipes)

Cada equipe revisa **outra** usando o
[checklist de segurança](../../recursos/checklists/seguranca.md).

Regras: revisar código, não pessoas; toda observação com evidência (`arquivo:linha`) e
sugestão de correção; nenhuma exploração fora do ambiente local da equipe revisada, e
sempre com o conhecimento dela.

**Entrega:** relatório (máx. 2 páginas) + resposta da equipe revisada dizendo o que
corrigiu, o que não corrigiu e por quê.

---

## E13.8 — Desafio: o que o `RotaProtegida` não protege

Escreva um roteiro de 10 passos que uma pessoa mal-intencionada seguiria para acessar
funcionalidade administrativa do BiblioCom **tendo apenas uma conta de associado**, usando
só o navegador e o `curl`.

Para cada passo, indique: o que ela tenta, o que o sistema responde, e **qual controle**
(no seu código) a impede. Se algum passo funcionar, você encontrou uma falha real — corrija
antes de entregar.

Este exercício é a síntese do módulo: pensar como atacante é o único jeito confiável de
descobrir o que ficou aberto.

---

## Gabarito parcial

**E13.2** — Quem bloqueia é o **navegador**: a resposta chega, mas ele se recusa a entregá-la
ao JavaScript por falta de `Access-Control-Allow-Origin`. `curl` não implementa a política
de mesma origem, então nunca é afetado. Consequência: **CORS não protege a sua API** — ele
protege o usuário de outro site contra ter suas credenciais usadas para ler dados. Proteger
a API é papel da autenticação e da autorização.

**E13.3** — `{texto}` passa pelo escape automático do React: `<` vira `&lt;` e o navegador
renderiza caracteres, não marcação. `dangerouslySetInnerHTML` atribui direto ao
`innerHTML`, e aí a string é interpretada como HTML. `HttpOnly` impede que o script leia o
cookie, mas o script roda **dentro** da sessão da vítima: ele pode fazer requisições
autenticadas (criar, excluir, exfiltrar) sem nunca ver o cookie.

**E13.4 (5)** — Variáveis sem o prefixo `VITE_` não são expostas ao código do cliente pelo
Vite: o componente passa a receber `undefined`. Isso demonstra que o prefixo é justamente o
mecanismo de "declarar como público" — e por isso ele nunca deve conter segredo.
