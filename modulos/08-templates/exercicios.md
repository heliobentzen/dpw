# M08 — Exercícios

## E08.1 — Refatorar duplicação (individual)

Você recebe três templates (`obra_list.html`, `autor_list.html`, `associado_list.html`)
com 80% de HTML idêntico e nenhuma herança.

1. Extraia `base.html` com os blocos necessários.
2. Extraia `_lista_generica.html` reutilizável.
3. Extraia `_paginacao.html` e `_busca.html`.
4. Meça: quantas linhas havia antes e depois?

**Entrega:** commit "antes" e commit "depois" + contagem de linhas (`wc -l`).

---

## E08.2 — Componentes do BiblioCom (individual)

Crie os parciais e demonstre cada um em uso:

| Parcial | Recebe | Mostra |
|---|---|---|
| `_card_obra.html` | `obra` | capa, título, autor, disponibilidade, link |
| `_badge_situacao.html` | `emprestimo` | ativo / atrasado / devolvido, com cor e texto |
| `_tabela_exemplares.html` | `exemplares` | tombo, estado, situação, ação |
| `_alerta.html` | `tipo`, `mensagem` | caixa de aviso reutilizável |
| `_vazio.html` | `mensagem`, `acao_url`, `acao_texto` | estado vazio padronizado |

Requisito: todos usam `{% include ... only %}` — sem dependência do contexto externo.

---

## E08.3 — Filtros e tags customizados (individual) ⭐

Implemente em `acervo/templatetags/acervo_extras.py`:

```python
@register.filter
def moeda(valor):
    """1234.5 -> 'R$ 1.234,50'"""

@register.filter
def telefone(valor):
    """'11987654321' -> '(11) 98765-4321'; devolve o original se não casar"""

@register.filter
def dias_restantes(emprestimo):
    """'vence em 3 dias' / 'vence hoje' / 'atrasado há 5 dias'"""

@register.simple_tag(takes_context=True)
def querystring(context, **kwargs):
    """Preserva os filtros da URL, alterando só os parâmetros passados."""

@register.simple_tag(takes_context=True)
def menu_ativo(context, nome_da_rota):
    """Devolve 'ativo' se a rota atual for essa (para destacar o menu)."""

@register.inclusion_tag("acervo/_estrelas.html")
def estrelas(nota, maximo=5):
    """Renderiza avaliação visual, acessível a leitor de tela."""
```

Escreva um template de demonstração exercitando todos, incluindo casos de borda
(`None`, string vazia, valor inválido).

---

## E08.4 — Responsividade (individual)

Torne todas as telas usáveis em 360px de largura, sem rolagem horizontal:

- menu que colapsa;
- tabela de empréstimos que vira lista de cartões (`data-rotulo` + `::before`);
- grade de obras de 1 → 2 → 4 colunas conforme a largura;
- formulários em coluna única no celular;
- alvos de toque com ao menos 44×44px.

**Entrega:** prints em 360px, 768px e 1280px de **todas** as telas.

---

## E08.5 — Auditoria de acessibilidade (em duplas) ⭐

Audite o BiblioCom com a extensão **axe DevTools** (ou Lighthouse) e produza:

| Problema | Página | Gravidade | Critério WCAG | Correção aplicada |
|---|---|---|---|---|

Depois, faça o **teste do teclado**: percorra um fluxo completo (buscar obra → abrir →
registrar empréstimo → confirmar) usando **apenas** Tab, Shift+Tab, Enter e Espaço.
Registre onde travou.

Meta: zero problemas de gravidade *critical* ou *serious*.

---

## E08.6 — XSS no template (individual)

1. Crie uma obra cuja sinopse seja:
   `<script>alert('xss')</script><img src=x onerror="alert('xss2')">`
2. Exiba com `{{ obra.sinopse }}`. O que acontece? Veja o HTML gerado (Ctrl+U).
3. Troque para `{{ obra.sinopse|safe }}`. O que acontece agora?
4. Troque para `{{ obra.sinopse|striptags }}`. E agora?
5. Reverta para a forma segura.

**Entrega:** os 3 HTMLs gerados + explicação de quando `|safe` é aceitável (e de como
sanitizar HTML de verdade, quando o usuário precisa mesmo enviar formatação).

---

## E08.7 — Estados de interface (individual)

Toda tela tem quatro estados. Implemente e demonstre os quatro em `/obras/`:

| Estado | Como testar | O que a tela mostra |
|---|---|---|
| Carregando | (com HTMX) atraso de rede simulado | indicador visual |
| Vazio | banco sem obras | mensagem + ação sugerida |
| Com conteúdo | banco populado | a lista |
| Erro | busca inválida / banco fora | mensagem clara, sem traceback |

Este é o exercício que mais aparece em avaliação de portfólio profissional: quase todo
projeto de estudante trata só o terceiro estado.

---

## E08.8 — Desafio: busca dinâmica com HTMX (individual)

Implemente busca que atualiza os resultados enquanto a pessoa digita:

- debounce de 400ms;
- indicador de carregamento;
- atualiza a URL do navegador (`hx-push-url`) para manter o link compartilhável;
- **funciona sem JavaScript** (o `<form method="get">` continua submetendo normalmente).

O último requisito é o que separa progressive enhancement de dependência de JS. Explique
como você garantiu isso.

---

## Gabarito parcial

**E08.3** (`querystring`) — requer
`django.template.context_processors.request` nos `context_processors`, senão
`context["request"]` não existe.

**E08.6** — Com `{{ }}`, o Django converte `<` em `&lt;` e nada executa. Com `|safe`, o
script roda: é um XSS armazenado. `|striptags` remove as tags, mas **não** é sanitização
confiável para HTML rico. Quando o usuário precisa enviar formatação, use uma biblioteca
de sanitização com lista de permissões (ex.: `nh3`/`bleach`) **no momento de salvar**, e
não no de exibir.
