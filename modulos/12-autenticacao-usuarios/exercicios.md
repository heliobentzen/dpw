# M12 — Exercícios

## E12.1 — Matriz de acesso completa (individual) ⭐

Estenda a matriz do roteiro para **todas** as rotas da API (mínimo 15) e todos os papéis,
incluindo o caso "usuário autenticado acessando recurso de outra pessoa".

Para cada célula registre: status esperado, status obtido pela **API** (via `curl`) e o que
a **interface** faz.

| Rota | Método | Anônimo | Associado | Assoc. (recurso de outro) | Bibliotecário | Coordenação |
|---|---|---|---|---|---|---|

**Este é o exercício mais importante do módulo.** Toda falha de autorização real começa com
uma célula que ninguém testou.

---

## E12.2 — Escolher o mecanismo (individual, discursivo)

Para cada cenário, escolha entre sessão+cookie, JWT em `localStorage` e JWT em cookie
`HttpOnly`, justificando pelo modelo de ameaça:

| # | Cenário | Escolha | Justificativa |
|---|---|---|---|
| 1 | BiblioCom: SPA e API no mesmo domínio | | |
| 2 | O mesmo sistema + app mobile React Native | | |
| 3 | API pública consumida por outras prefeituras | | |
| 4 | SPA em `app.exemplo.org`, API em `api.exemplo.org` | | |
| 5 | Sistema bancário com exigência de revogação imediata | | |
| 6 | Integração servidor-a-servidor, sem navegador | | |

Depois responda: **por que a maior parte dos tutoriais ensina a opção mais insegura?**

---

## E12.3 — Provar que o frontend não protege (individual) ⭐

1. Logue como **associado** na interface.
2. Confirme que o botão "Nova obra" não aparece e que `/obras/nova` redireciona.
3. Agora ignore a interface:

```bash
curl -b cookies-associado.txt -X POST http://localhost:8000/api/obras/ \
     -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
     -d '{"titulo":"Teste de invasão","autor":1}' -i
```

4. Qual o status? Se for **201**, corrija o backend e repita.
5. Repita para: `PATCH`, `DELETE`, `/api/relatorios/` e `/api/emprestimos/{de-outro}/`.
6. Abra o DevTools → Sources e **encontre no bundle** o código do `RotaProtegida`.

**Entrega:** as 5 saídas de `curl` + o print do passo 6 + 5 linhas explicando por que
esconder no cliente nunca é proteção.

---

## E12.4 — IDOR nas duas camadas (em duplas)

1. Crie dois associados (A e B), cada um com empréstimos.
2. Logado como A, descubra o id de um empréstimo de B.
3. Acesse `/emprestimos/<id-de-B>` na interface e `GET /api/emprestimos/<id-de-B>/` na API.
4. Se conseguiu ver, corrija de **duas** formas e compare:
   - `has_object_permission` numa `BasePermission`
   - filtro no `get_queryset`
5. Qual devolve 403 e qual devolve 404? **Qual é preferível e por quê?**
6. Repita para edição e exclusão.

---

## E12.5 — CSRF na prática (individual)

1. Faça um POST pela interface e observe, na aba Network, o cabeçalho `X-CSRFToken`.
2. Remova o envio do cabeçalho no `api/client.ts` e tente de novo. Qual status?
3. Descubra onde o cookie `csrftoken` é definido. Ele é `HttpOnly`? E o `sessionid`?
4. Explique por que os dois cookies têm configurações diferentes de `HttpOnly`.
5. Simule um ataque CSRF: crie uma página em `localhost:9000` com um formulário que envia
   POST para `localhost:8000/api/obras/`. Funciona? Por quê?
6. Teste o efeito de `SESSION_COOKIE_SAMESITE = "Strict"`.

---

## E12.6 — Fluxo completo de gestão de usuários (individual)

Implemente:

| Fluxo | Requisitos |
|---|---|
| Cadastro | Validação de senha forte, e-mail único, papel definido **pelo servidor** |
| Login | Mensagem genérica, redireciona para a rota pretendida |
| Logout | POST, limpa o cache do Query |
| Perfil | Edita nome, e-mail e telefone — **nunca** `papel` ou `is_superuser` |
| Trocar senha | Exige a senha atual |
| Recuperar senha | Token de uso único, expiração curta, e-mail no console em dev |

Depois, ataque o próprio sistema: envie `{"papel": "COORDENACAO"}` no PATCH do perfil. O
que acontece? Se funcionar, você encontrou uma escalada de privilégio — corrija e explique
a correção.

---

## E12.7 — Bloqueio por tentativas (individual)

Implemente bloqueio após 5 tentativas falhas em 15 minutos:

- chave de bloqueio por **usuário + IP** (por que não só por um dos dois?)
- resposta `429` com cabeçalho `Retry-After`
- armazenamento no cache do Django, não no banco
- log de cada tentativa falha, **sem** a senha
- a interface mostra quanto tempo falta

Responda: qual o risco de bloquear só por usuário? E só por IP (pense em NAT
compartilhado numa escola)?

---

## E12.8 — Desafio: convite em vez de autocadastro

Numa biblioteca comunitária o cadastro costuma ser presencial. Implemente:

1. A coordenação cadastra o associado e gera um **convite** com token de uso único, válido
   por 7 dias.
2. O link é entregue por e-mail ou impresso.
3. Ao abrir, a pessoa define a própria senha e ativa a conta.
4. O token é invalidado após o uso ou a expiração.

Cuidados: `secrets.token_urlsafe()`, guardar o **hash** do token no banco, comparação em
tempo constante, e a rota de ativação precisa ser pública mas não enumerável.

---

## Gabarito parcial

**E12.2 (1)** — Sessão + cookie. Mesmo site elimina o problema de CORS, `HttpOnly` protege
contra roubo por XSS e a revogação é imediata. **(2)** — Aparece o app mobile: sessão por
cookie fica desajeitada, e JWT (com *refresh* em armazenamento seguro do dispositivo) passa
a se justificar. Note que a API pode aceitar **os dois** mecanismos simultaneamente.

**E12.2 (última)** — Porque JWT em `localStorage` é o que funciona mais rápido num tutorial
de 15 minutos: não exige CSRF, não exige mesmo domínio, não exige entender cookies. O custo
só aparece quando há um XSS — e aí não aparece no tutorial.

**E12.4 (5)** — `has_object_permission` devolve **403** e, com isso, confirma que o objeto
existe. Filtrar o queryset devolve **404**: quem não pode ver não descobre nem a
existência. Para recursos privados, 404 é preferível.

**E12.6** — Se `papel` estiver no serializer de perfil, o PATCH promove o usuário. Correções:
serializer com `fields` explícito e restrito; campos sensíveis definidos no servidor
(`perform_update`); e nunca confiar em campo vindo do cliente para decisão de autorização.
