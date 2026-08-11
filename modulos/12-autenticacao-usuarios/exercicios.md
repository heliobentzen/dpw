# M10 — Exercícios

## E10.1 — Matriz de acesso completa (individual) ⭐

Estenda a matriz do roteiro prático para **todas** as rotas do BiblioCom (mínimo 15) e
**todos** os papéis, incluindo o usuário autenticado que tenta acessar o recurso de outra
pessoa.

Para cada célula, registre: status HTTP esperado, status obtido, e o comando/URL usado.
Marque em vermelho as divergências e corrija-as.

**Este é o exercício mais importante do módulo.** Toda falha de autorização real começa com
uma célula que ninguém testou.

---

## E10.2 — Perfil do usuário (individual)

Implemente `/contas/perfil/`:

- exibe e permite editar nome, e-mail e telefone;
- **não** permite editar `papel`, `is_staff`, `is_superuser` (pense em por quê);
- exige senha atual para trocar o e-mail;
- mostra histórico de empréstimos do próprio usuário;
- mostra a data do último acesso.

Depois, tente enviar `papel=COORDENACAO` por `curl` direto no POST de edição. O que
acontece? Se funcionar, você acabou de encontrar uma escalada de privilégio no seu próprio
sistema — corrija e explique a correção.

---

## E10.3 — Login por e-mail (individual)

Faça o sistema aceitar login por **e-mail ou username**. Duas abordagens possíveis:

**(a)** Backend de autenticação customizado:

```python
class EmailOuUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        ...
```

**(b)** `AbstractBaseUser` com `USERNAME_FIELD = "email"`.

Implemente **(a)**. Cuidados obrigatórios: e-mail único e case-insensitive; tempo de
resposta semelhante para usuário existente e inexistente (por quê?); mensagem de erro
genérica.

---

## E10.4 — Política de senha e bloqueio (individual)

1. Configure `min_length=12` e todos os validadores.
2. Escreva um validador customizado que rejeite senhas contendo o nome da biblioteca.
3. Implemente bloqueio temporário após 5 tentativas falhas do mesmo usuário em 15 min
   (use cache ou um model `TentativaLogin`).
4. Registre em log toda tentativa falha (sem a senha!).

Responda: por que o bloqueio deve ser por **usuário + IP**, e não só por IP? E qual o
risco de bloquear só por usuário?

---

## E10.5 — Grupos por comando (individual)

Reescreva o comando `criar_grupos` para ser **idempotente e declarativo**:

- rodar duas vezes não duplica nem quebra;
- remove permissões que saíram da definição;
- aceita `--dry-run` mostrando o que mudaria;
- imprime um resumo: grupo, permissões adicionadas, removidas.

Rode em um banco limpo e em um banco já configurado. Compare as saídas.

---

## E10.6 — IDOR na prática (em duplas) ⭐

1. Crie dois associados (A e B), cada um com empréstimos.
2. Logado como A, descubra o id de um empréstimo de B (dica: a paginação e os ids
   sequenciais ajudam — e esse é justamente o problema).
3. Acesse `/emprestimos/<id-de-B>/`. Conseguiu ver?
4. Se sim, corrija de **duas** maneiras diferentes e compare:
   - `UserPassesTestMixin` com `test_func`;
   - filtro no `get_queryset`.
5. Responda: qual das duas devolve 403 e qual devolve 404? **Qual é preferível e por quê?**
6. Repita o ataque nos endpoints de edição e exclusão. Eles estavam protegidos?

---

## E10.7 — Auditoria de acesso (individual)

Implemente registro de eventos de segurança em um model `EventoAcesso`:

| Campo | Conteúdo |
|---|---|
| `usuario` | quem (ou nulo se anônimo) |
| `evento` | LOGIN_OK, LOGIN_FALHA, LOGOUT, SENHA_ALTERADA, ACESSO_NEGADO |
| `ip` | endereço de origem |
| `user_agent` | navegador |
| `criado_em` | quando |

Use os sinais `user_logged_in`, `user_login_failed` e `user_logged_out`.

Regras: **nunca** registrar senha; considerar que o IP pode vir de proxy
(`X-Forwarded-For` — e por que confiar nesse cabeçalho cegamente é perigoso?); definir
prazo de retenção dos registros (LGPD).

---

## E10.8 — Desafio: convite em vez de autocadastro (individual)

Numa biblioteca comunitária, o cadastro costuma ser presencial. Implemente:

1. A coordenação cadastra o associado e gera um **convite** com token de uso único e
   validade de 7 dias.
2. O link é entregue por e-mail (ou impresso).
3. Ao abrir o link, a pessoa define a própria senha e ativa a conta.
4. O token é invalidado após o uso ou após expirar.

Cuidados: token criptograficamente aleatório (`secrets.token_urlsafe`), guardado como
**hash** no banco, comparado em tempo constante, e nunca reutilizável.

---

## Gabarito parcial

**E10.2** — Se `papel` estiver no `fields` do form (ou se você usou `fields = "__all__"`),
o POST manipulado promove o usuário. Correções: `fields` explícito e restrito; nunca
confiar em campos ocultos ou desabilitados no HTML (`disabled` não impede o envio);
definir campos sensíveis no servidor, em `form_valid`.

**E10.6 (5)** — `test_func` devolve **403** e, com isso, confirma que o objeto existe.
Filtrar o queryset devolve **404**: quem não pode ver não descobre nem a existência. Para
recursos privados, 404 é preferível — não vaza informação por *side channel*.
