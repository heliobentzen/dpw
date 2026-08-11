# M06 — Exercícios

## E06.1 — Projetar o mapa de URLs (individual)

Projete o `urlpatterns` completo do BiblioCom. Para cada rota: caminho, método(s)
aceito(s), view, nome e quem pode acessar.

| Caminho | Métodos | View | `name` | Acesso |
|---|---|---|---|---|
| `/` | GET | `home` | `acervo:home` | público |
| `/obras/` | | | | |
| `/obras/nova/` | | | | |
| `/obras/<pk>/` | | | | |
| `/obras/<pk>/editar/` | | | | |
| `/obras/<pk>/excluir/` | | | | |
| `/obras/<pk>/exemplares/` | | | | |
| `/autores/` | | | | |
| `/autores/<slug>/` | | | | |
| `/categorias/<slug>/` | | | | |
| `/associados/` | | | | |
| `/emprestimos/` | | | | |
| `/emprestimos/novo/` | | | | |
| `/emprestimos/<pk>/devolver/` | | | | |
| `/emprestimos/atrasados/` | | | | |
| `/relatorios/mensal/<ano>/<mes>/` | | | | |

Critérios de avaliação: coerência (recursos no plural, hierarquia), métodos corretos
(nada que altere dados em GET) e nomes previsíveis.

---

## E06.2 — Ordem dos padrões (individual)

Descubra por que este `urlpatterns` está errado, prove no navegador e corrija:

```python
urlpatterns = [
    path("obras/<str:slug>/", views.obra_por_slug, name="obra_slug"),
    path("obras/nova/", views.obra_create, name="obra_create"),
    path("obras/<int:pk>/", views.obra_detail, name="obra_detail"),
    path("obras/atrasadas/", views.obras_atrasadas, name="obras_atrasadas"),
]
```

Responda: quais das 4 rotas ficam inalcançáveis? Qual view responde a `/obras/42/`?

---

## E06.3 — FBV completa (individual)

Implemente `autor_detail(request, slug)` que mostra:

- dados do autor;
- todas as obras dele, **paginadas** (10 por página);
- total de obras e total de exemplares;
- quantas obras estão emprestadas no momento;
- 404 se o slug não existir.

Requisito: no máximo **3 consultas** ao banco (prove com `CaptureQueriesContext`).

---

## E06.4 — Mesma view, dois estilos (individual) ⭐

Implemente a listagem de empréstimos em atraso **duas vezes**:

- `/emprestimos/atrasados/` como FBV
- `/emprestimos/atrasados-cbv/` como `ListView`

Ambas com: filtro opcional por associado, ordenação por dias de atraso (decrescente),
paginação de 25 e o total de dias de atraso somado.

**Entrega:** o código das duas + tabela comparativa (linhas, o que é explícito, o que é
implícito, esforço para adicionar controle de acesso) + sua recomendação justificada para
o projeto da equipe.

---

## E06.5 — POST, PRG e 405 (individual)

Implemente `/emprestimos/<pk>/renovar/` que estende a previsão de devolução em 14 dias,
com estas regras:

- só aceita POST (GET deve devolver **405**);
- recusa se o empréstimo já foi devolvido;
- recusa se já houve 2 renovações (adicione o campo `renovacoes`);
- recusa se o empréstimo está em atraso;
- em qualquer recusa: mensagem de erro e redirect de volta;
- em sucesso: mensagem com a nova data e redirect.

**Entrega:** código + 5 comandos `curl` demonstrando cada caminho, com o status de cada.

---

## E06.6 — Middleware de auditoria (individual)

Escreva um middleware que registre, para toda requisição **que altera dados** (POST, PUT,
PATCH, DELETE):

```
2026-08-11 14:32:07 | ana.souza | POST /emprestimos/novo/ | 302 | 45ms
```

Requisitos: não registrar GET; não registrar dados do corpo (senhas!); usar o módulo
`logging`, não `print`; funcionar com usuário anônimo.

Responda: **por que não registrar o corpo da requisição?** Cite dois riscos.

---

## E06.7 — Páginas de erro (individual)

Crie templates de 404, 403 e 500 com a identidade visual do BiblioCom. Teste com
`DEBUG=False` e `ALLOWED_HOSTS=["localhost"]`.

Cuidado: o template de 500 **não pode** usar context processors nem acessar o banco — se
o banco caiu, a página de erro precisa continuar funcionando. Explique por quê.

---

## E06.8 — Desafio: busca com estado na URL (individual)

Implemente `/obras/` de forma que **todo** o estado da busca esteja na URL:

- termo, categoria, faixa de anos, disponibilidade, ordenação e página;
- ao mudar de página, os filtros se mantêm;
- ao mudar um filtro, a paginação volta para a página 1;
- a URL é copiável e compartilhável e reproduz exatamente a mesma tela;
- entradas inválidas (`?page=abc`, `?ordenar=;DROP TABLE`) não quebram nada.

Responda: **por que este é o caso de uso canônico de GET?** Relacione com *safe*,
idempotência e cache do M01.

---

## Gabarito parcial

**E06.2** — `<str:slug>` casa com `nova`, `atrasadas` e até com `42`. Só a primeira rota é
alcançável. Correção: rotas literais primeiro, depois `<int:pk>`, depois `<slug:slug>`.

**E06.7** — Com `DEBUG=False`, o template de 500 é renderizado com um contexto vazio,
justamente porque a causa provável do erro é a indisponibilidade de alguma dependência
(banco, cache). Um template que consulta o banco na página de erro produz um segundo erro
e o usuário vê a página branca do servidor.
