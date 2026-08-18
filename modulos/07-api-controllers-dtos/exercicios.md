# M07 — Exercícios

## E07.1 — Projetar o mapa de rotas (individual)

Projete a API completa do BiblioCom. Para cada rota: caminho, método, view responsável,
quem pode acessar e status de sucesso.

| Caminho | Método | View | Quem pode | Sucesso |
|---|---|---|---|---|
| `/api/obras/` | GET | `ObraViewSet.list` | público | 200 |
| `/api/obras/` | POST | | | |
| `/api/obras/{id}/` | GET | | | |
| `/api/obras/{id}/` | PATCH | | | |
| `/api/obras/{id}/` | DELETE | | | |
| `/api/obras/{id}/exemplares/` | GET | | | |
| `/api/autores/` | GET | | | |
| `/api/emprestimos/` | GET | | | |
| `/api/emprestimos/` | POST | | | |
| `/api/emprestimos/{id}/devolver/` | POST | | | |
| `/api/emprestimos/{id}/renovar/` | POST | | | |
| `/api/emprestimos/em-atraso/` | GET | | | |
| `/api/relatorios/acervo/` | GET | | | |
| `/api/relatorios/mensal/` | GET | | | |

Critérios: recursos no plural, nenhum verbo na URL (exceto ações legítimas), nada que
altere dados em GET, e nomes previsíveis.

---

## E07.2 — Os três níveis (individual) ⭐

Implemente `/api/relatorios/acervo/` **três vezes**: como `@api_view`, como `APIView` e
como `@action` num ViewSet.

Depois preencha:

| Critério | `@api_view` | `APIView` | `@action` |
|---|---|---|---|
| Linhas de código | | | |
| O que está explícito | | | |
| O que está implícito | | | |
| Esforço para adicionar permissão | | | |
| Aparece bem no `/api/docs/`? | | | |
| Legibilidade para quem nunca viu DRF | | | |

Escreva sua recomendação para o projeto da equipe, em 5 linhas. **Não existe resposta
certa** — existe justificativa.

---

## E07.3 — Leitura × escrita (individual)

Implemente `ObraSerializer` e `ObraCreateSerializer` e demonstre com `curl`:

1. `GET /api/obras/1/` devolve `autor` como **objeto** com `id` e `nome`.
2. `POST /api/obras/` aceita `autor` como **id**.
3. Enviar `"id": 999` no POST **não** define o id. Por quê?
4. Enviar `"exemplares_disponiveis": 50` no POST é ignorado. Por quê?
5. Enviar um campo que não existe no serializer é ignorado. Por quê isso é seguro?
6. Adicione um campo `aprovada` ao model **sem** adicioná-lo ao serializer. Ele aparece na
   API? E se você usasse `fields = "__all__"`?

O item 6 é uma demonstração de *mass assignment* no seu próprio código.

---

## E07.4 — Validação completa (individual)

Implemente e prove com `curl` (guarde a saída de cada um):

| # | Regra | Onde | Status esperado |
|---|---|---|---|
| 1 | ISBN com 10 ou 13 dígitos, aceitando hífens | `validate_isbn` | 400 |
| 2 | Ano entre 1400 e o ano atual | `validate_ano_publicacao` | 400 |
| 3 | Título não pode ser só espaços | `validate_titulo` | 400 |
| 4 | Tombo do exemplar no formato `NNNNN-N` | validator do model | 400 |
| 5 | Exemplar precisa estar disponível para emprestar | `validate_exemplar` | 400 |
| 6 | Associado precisa estar ativo e abaixo do limite | `validate_associado` | 400 |
| 7 | ISBN único, **inclusive ao editar** | `UniqueValidator` | 400 |
| 8 | Devolver um empréstimo já devolvido | `@action` | 409 |

O item 7 é a pegadinha: verifique que editar uma obra **sem mudar o ISBN** continua
funcionando.

---

## E07.5 — Caçada ao N+1 na API (individual) ⭐

1. Implemente `exemplares_disponiveis` como `SerializerMethodField` que consulta o banco.
2. Meça quantas consultas `GET /api/obras/` faz com 20 obras.
3. Reimplemente com `annotate` + `IntegerField(read_only=True)`.
4. Meça de novo.

| Versão | Consultas | Tempo |
|---|---|---|
| `SerializerMethodField` | | |
| `annotate` | | |

Responda: **por que o `SerializerMethodField` é uma armadilha tão comum?** (dica: ele
funciona perfeitamente no teste com 3 registros)

---

## E07.6 — Contrato projetado × implementado (em equipe) ⭐

Compare o `docs/contrato-api.md` que a equipe escreveu no M02 com o `schema.yml` gerado
agora:

| Item | No contrato | Na implementação | Quem estava certo? | O que fizemos |
|---|---|---|---|---|
| Nome do campo X | | | | |
| Formato da data | | | | |
| Estrutura da paginação | | | | |
| Formato do erro | | | | |
| Status de criação | | | | |

Para cada divergência, decidam: corrigir o código ou corrigir o contrato? Registrem a
decisão. Este exercício é o fechamento do bloco de backend.

---

## E07.7 — Ordenação como falha de segurança (individual)

1. Remova `ordering_fields` do `ObraViewSet` (deixando o `OrderingFilter` ativo).
2. Tente: `?ordering=cadastrada_por__email`, `?ordering=cadastrada_por__password`.
3. O que a ordem dos resultados revela, mesmo sem exibir o campo?
4. Restaure `ordering_fields` e teste de novo.

Escreva 5 linhas explicando por que uma lista de permissões é melhor que uma lista de
proibições — aqui e em geral.

---

## E07.8 — Desafio: paginação por cursor

A paginação por página (`?page=3`) tem um problema com dados que mudam: se um registro é
inserido enquanto o usuário navega, ele vê itens repetidos ou pulados.

1. Implemente `CursorPagination` em `EmprestimoViewSet`.
2. Demonstre o problema com `PageNumberPagination`: abra a página 2, insira um registro no
   topo pelo admin, avance para a página 3 e observe.
3. Repita com `CursorPagination`.
4. Compare: o que se ganha e o que se perde? (dica: dá para pular direto para a página 7?)

---

## Gabarito parcial

**E07.3 (3, 4)** — `id` é `read_only` por padrão em `ModelSerializer`, e
`exemplares_disponiveis` foi declarado `read_only=True`. Campos somente-leitura são
**ignorados na entrada**, não rejeitados. Isso é intencional: o serializer é uma lista de
permissões do que o cliente pode escrever.

**E07.5** — O `SerializerMethodField` dispara uma consulta **por objeto serializado**. Com
3 registros no teste, são 4 consultas e ninguém percebe; com 20 por página em produção, são
21; e o problema cresce linearmente com o `page_size`. O `annotate` resolve no banco, numa
consulta só.

**E07.7** — Ordenar por `cadastrada_por__email` revela a ordem alfabética dos e-mails
associados aos registros, mesmo sem exibi-los: comparando duas ordenações, dá para inferir
informação sobre um campo que a API nunca devolve. É vazamento por canal lateral, e a
defesa é declarar explicitamente o que **pode** ser ordenado.
