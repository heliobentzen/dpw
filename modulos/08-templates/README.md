# M08 — Templates: interfaces com o usuário

> **CH:** 6h (3h teóricas · 3h práticas) · **Semanas 10–11** · **Pré-requisitos:** M06, M07
> **Ementa:** *Templates: Criação de interfaces com o usuário utilizando o framework escolhido.*

## 🎯 Objetivos

1. Escrever templates com a linguagem do Django: variáveis, tags, filtros.
2. Estruturar a interface com herança de templates e componentes reutilizáveis.
3. Servir arquivos estáticos corretamente em desenvolvimento e produção.
4. Construir interfaces responsivas e acessíveis sem framework JavaScript.
5. Exibir mensagens, paginação e estados vazios de forma consistente.

---

## 📖 Teoria (3h)

### 1. A linguagem de templates (30 min)

O Django Template Language (DTL) é **deliberadamente limitado**. Não dá para escrever
Python arbitrário dentro dele — e isso é uma decisão de projeto: mantém a lógica na view,
onde é testável, e o template com apresentação.

```django
{{ variavel }}                      variável
{{ objeto.atributo }}               atributo, chave de dict, índice ou método sem argumentos
{{ valor|filtro:"arg" }}            filtro
{% tag %}...{% endtag %}            tag
{# comentário de uma linha #}
{% comment %}bloco{% endcomment %}
```

Resolução de `{{ obra.autor }}`, nesta ordem: dicionário `obra["autor"]` → atributo
`obra.autor` → método `obra.autor()` (sem argumentos) → índice `obra[autor]`. Se nada
resolver, o resultado é vazio — **silenciosamente**. Isso torna erro de digitação difícil
de perceber; suspeite sempre que algo aparecer em branco.

### 2. Tags essenciais (30 min)

```django
{% if obra.exemplares_disponiveis > 0 %}
  <span class="tag tag--ok">Disponível</span>
{% elif obra.exemplares.exists %}
  <span class="tag tag--alerta">Todos emprestados</span>
{% else %}
  <span class="tag">Sem exemplares</span>
{% endif %}

{% for obra in obras %}
  <li>{{ forloop.counter }}. {{ obra.titulo }}</li>
{% empty %}
  <li>Nenhuma obra encontrada.</li>
{% endfor %}
```

`{% empty %}` é o jeito idiomático de tratar **estado vazio** — item de rubrica na
avaliação de interface.

Variáveis do `forloop`: `counter` (1-based), `counter0`, `revcounter`, `first`, `last`,
`parentloop`.

```django
{% url 'acervo:obra_detail' obra.pk %}
{% url 'acervo:obra_list' as lista_url %}

{% include "acervo/_card_obra.html" with obra=obra destaque=True %}
{% include "acervo/_card_obra.html" with obra=obra only %}   {# isola o contexto #}

{% with total=obra.exemplares.count %}{{ total }} exemplar{{ total|pluralize:"es" }}{% endwith %}

{% load static %}
<img src="{% static 'acervo/img/logo.svg' %}" alt="BiblioCom">

{% csrf_token %}
{% now "d/m/Y" %}
{% spaceless %}...{% endspaceless %}
```

### 3. Filtros essenciais (25 min)

```django
{{ nome|upper }} {{ nome|lower }} {{ nome|title }} {{ nome|capfirst }}
{{ texto|truncatechars:100 }} {{ texto|truncatewords:20 }}
{{ texto|linebreaks }} {{ texto|linebreaksbr }}
{{ texto|striptags }} {{ texto|wordcount }}

{{ data|date:"d/m/Y" }} {{ data|date:"d \d\e F \d\e Y" }} {{ hora|time:"H:i" }}
{{ data|timesince }} {{ data|timeuntil }} {{ data|naturalday }}   {# humanize #}

{{ valor|default:"—" }} {{ valor|default_if_none:"não informado" }}
{{ lista|length }} {{ lista|first }} {{ lista|last }} {{ lista|join:", " }}
{{ lista|slice:":5" }} {{ dicionario|length }}

{{ numero|floatformat:2 }} {{ bytes|filesizeformat }} {{ n|pluralize }} {{ n|pluralize:"es" }}
{{ preco|intcomma }}   {# humanize #}

{{ url|urlencode }} {{ texto|escape }} {{ html|safe }}
```

Para `intcomma`, `naturaltime` e afins, acrescente
`"django.contrib.humanize"` ao `INSTALLED_APPS` e `{% load humanize %}` no template.

**Sobre `|safe` e `escape`:** o DTL escapa **tudo** por padrão. `|safe` desliga a
proteção. Use apenas em conteúdo que você mesmo gerou e sabe ser seguro — **nunca** em
texto vindo do usuário. Esta é a origem da maior parte dos XSS em projetos Django (M11).

### 4. Herança de templates (35 min) ⭐

O recurso mais importante do módulo. Um layout, várias páginas.

```django
{# templates/base.html #}
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% block titulo %}BiblioCom{% endblock %}</title>
  <meta name="description" content="{% block descricao %}Biblioteca comunitária{% endblock %}">
  {% load static %}
  <link rel="stylesheet" href="{% static 'css/estilo.css' %}">
  {% block css_extra %}{% endblock %}
</head>
<body>
  <a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>

  {% include "_cabecalho.html" %}
  {% include "_mensagens.html" %}

  <main id="conteudo" class="container">
    {% block conteudo %}{% endblock %}
  </main>

  {% include "_rodape.html" %}
  {% block js_extra %}{% endblock %}
</body>
</html>
```

```django
{# acervo/templates/acervo/obra_list.html #}
{% extends "base.html" %}

{% block titulo %}Acervo — BiblioCom{% endblock %}

{% block conteudo %}
  <h1>Acervo</h1>
  ...
{% endblock %}
```

Regras: `{% extends %}` **na primeira linha**; herança de até 3 níveis (`base.html` →
`base_area.html` → página); `{{ block.super }}` para acrescentar sem substituir.

**Onde ficam os templates:**

```python
# settings.py
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],        # templates do projeto (base, erros, parciais)
    "APP_DIRS": True,                         # + <app>/templates/<app>/
    ...
}]
```

Convenção: `_nome.html` (com underline) para *partials* que só são incluídos, nunca
renderizados diretamente.

### 5. Arquivos estáticos (25 min)

```python
# settings.py
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]      # estáticos do projeto
STATIC_ROOT = BASE_DIR / "staticfiles"        # destino do collectstatic (produção)

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"               # uploads dos usuários
```

```
static/                    ← do projeto (CSS global, logo)
└── css/estilo.css
acervo/static/acervo/      ← do app (namespaced, evita colisão)
└── js/busca.js
```

```django
{% load static %}
<link rel="stylesheet" href="{% static 'css/estilo.css' %}">
<script src="{% static 'acervo/js/busca.js' %}" defer></script>
<img src="{{ obra.capa.url }}" alt="Capa de {{ obra.titulo }}">   {# mídia: usa .url #}
```

> **Estático × mídia** — estático é o que **você** entrega junto com o código (CSS, JS,
> ícones). Mídia é o que o **usuário** envia (capas, anexos). Nunca use `{% static %}`
> para mídia, nem versione a pasta `media/`.

Em produção: `python manage.py collectstatic` reúne tudo em `STATIC_ROOT`, e o servidor
web (ou WhiteNoise) serve dali. Detalhes no M14.

### 6. Contexto e context processors (20 min)

```python
# acervo/context_processors.py
from .models import Emprestimo


def indicadores(request):
    if not request.user.is_authenticated:
        return {}
    return {"total_atrasos": Emprestimo.objects.filter(devolvido_em__isnull=True).count()}
```

```python
# settings.py -> TEMPLATES[0]["OPTIONS"]["context_processors"]
"acervo.context_processors.indicadores",
```

Agora `{{ total_atrasos }}` está disponível em **todos** os templates.

> ⚠️ Context processor roda em **toda** requisição. Uma consulta pesada aqui deixa o site
> inteiro lento. Mantenha-os triviais ou use cache.

### 7. Tags e filtros customizados (20 min)

```python
# acervo/templatetags/acervo_extras.py   (a pasta precisa de __init__.py)
from django import template

register = template.Library()


@register.filter
def situacao_css(emprestimo):
    if emprestimo.devolvido_em:
        return "situacao--ok"
    return "situacao--atraso" if emprestimo.esta_atrasado else "situacao--ativo"


@register.simple_tag(takes_context=True)
def querystring(context, **kwargs):
    """Preserva a query string atual, alterando só os parâmetros informados.

    Uso: <a href="?{% querystring page=3 %}">  -> mantém q, categoria, ordenacao...
    """
    params = context["request"].GET.copy()
    for chave, valor in kwargs.items():
        if valor is None:
            params.pop(chave, None)
        else:
            params[chave] = valor
    return params.urlencode()


@register.inclusion_tag("acervo/_badge_disponibilidade.html")
def badge_disponibilidade(obra):
    return {"disponiveis": obra.exemplares_disponiveis, "total": obra.exemplares.count()}
```

```django
{% load acervo_extras %}
<tr class="{{ emprestimo|situacao_css }}">
<a href="?{% querystring page=pagina.next_page_number %}">Próxima</a>
{% badge_disponibilidade obra %}
```

A tag `querystring` resolve o problema mais chato da paginação com filtros — e é o tipo de
utilidade que se leva para todos os projetos seguintes.

### 8. Interatividade sem SPA: HTMX (15 min, opcional)

```html
<script src="{% static 'js/htmx.min.js' %}" defer></script>

<input type="search" name="q"
       hx-get="{% url 'acervo:obra_list_parcial' %}"
       hx-trigger="keyup changed delay:400ms"
       hx-target="#resultados"
       hx-indicator="#carregando">
<div id="resultados">{% include "acervo/_lista_obras.html" %}</div>
```

```python
def obra_list_parcial(request):
    obras = buscar_obras(request.GET.get("q"))
    return render(request, "acervo/_lista_obras.html", {"obras": obras})
```

A view devolve **um fragmento de HTML**, não JSON. O modelo mental continua sendo
requisição/resposta — por isso HTMX cabe nesta disciplina e um framework SPA não caberia.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Layout base (40 min)

Crie `templates/base.html` com a estrutura da teoria e os parciais `_cabecalho.html`,
`_rodape.html` e `_mensagens.html`.

```django
{# templates/_mensagens.html #}
{% if messages %}
  <div class="mensagens" role="status" aria-live="polite">
    {% for m in messages %}
      <div class="mensagem mensagem--{{ m.tags }}">
        {{ m }}
        <button type="button" class="mensagem__fechar" aria-label="Fechar">&times;</button>
      </div>
    {% endfor %}
  </div>
{% endif %}
```

```django
{# templates/_cabecalho.html #}
<header class="cabecalho">
  <a href="{% url 'acervo:home' %}" class="logo">BiblioCom</a>
  <nav aria-label="Principal">
    <a href="{% url 'acervo:obra_list' %}">Acervo</a>
    <a href="{% url 'emprestimos:list' %}">Empréstimos</a>
    {% if user.is_authenticated %}
      <span>Olá, {{ user.get_short_name|default:user.username }}</span>
      <form method="post" action="{% url 'logout' %}">{% csrf_token %}
        <button type="submit">Sair</button>
      </form>
    {% else %}
      <a href="{% url 'login' %}">Entrar</a>
    {% endif %}
  </nav>
</header>
```

> Repare: **logout por POST**. Volte ao M01 e explique por quê.

### Passo 2 — CSS próprio, sem framework (40 min)

```css
/* static/css/estilo.css */
:root {
  --cor-fundo: #ffffff;
  --cor-texto: #1a1a1a;
  --cor-primaria: #1d4ed8;
  --cor-borda: #d4d4d8;
  --cor-ok: #15803d;
  --cor-alerta: #b45309;
  --cor-erro: #b91c1c;
  --espaco: 1rem;
  --raio: 6px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --cor-fundo: #18181b;
    --cor-texto: #f4f4f5;
    --cor-borda: #3f3f46;
    --cor-primaria: #93c5fd;
  }
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: var(--cor-texto);
  background: var(--cor-fundo);
}

.container { max-width: 72rem; margin-inline: auto; padding: var(--espaco); }

.grade {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--espaco);
}

.cartao {
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  padding: var(--espaco);
}

/* foco visível: requisito de acessibilidade, não enfeite */
:focus-visible { outline: 3px solid var(--cor-primaria); outline-offset: 2px; }

.pular-para-conteudo {
  position: absolute; left: -9999px;
}
.pular-para-conteudo:focus { left: var(--espaco); top: var(--espaco); }

table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--cor-borda); }

@media (max-width: 40rem) {
  .cabecalho { flex-direction: column; }
  table.responsiva thead { display: none; }
  table.responsiva td { display: block; }
  table.responsiva td::before { content: attr(data-rotulo) ": "; font-weight: 600; }
}
```

CSS moderno (Grid, custom properties, `prefers-color-scheme`) resolve o layout desta
aplicação sem nenhuma dependência. Isso é intencional: o objetivo do módulo é a camada de
template, não a escolha de framework CSS.

### Passo 3 — Templates do acervo (60 min)

Implemente:

- `acervo/obra_list.html` — grade de cartões, busca, filtros, paginação, estado vazio
- `acervo/_card_obra.html` — parcial do cartão
- `acervo/obra_detail.html` — dados, categorias, lista de exemplares com situação
- `acervo/obra_form.html` — reutiliza o `_form.html` do M07
- `acervo/obra_confirm_delete.html` — confirmação explícita, com POST

```django
{# acervo/obra_list.html #}
{% extends "base.html" %}
{% load acervo_extras %}

{% block titulo %}Acervo — BiblioCom{% endblock %}

{% block conteudo %}
  <h1>Acervo</h1>

  <form method="get" class="busca" role="search">
    <label for="id_q">Buscar</label>
    <input type="search" id="id_q" name="q" value="{{ termo }}" placeholder="título ou autor">
    <button type="submit">Buscar</button>
    {% if termo or categoria %}
      <a href="{% url 'acervo:obra_list' %}">Limpar filtros</a>
    {% endif %}
  </form>

  <p class="resumo">
    {{ pagina.paginator.count }} obra{{ pagina.paginator.count|pluralize }} encontrada{{ pagina.paginator.count|pluralize }}
    {% if termo %}para "{{ termo }}"{% endif %}
  </p>

  <div class="grade">
    {% for obra in obras %}
      {% include "acervo/_card_obra.html" with obra=obra only %}
    {% empty %}
      <p class="vazio">
        Nenhuma obra encontrada.
        {% if termo %}Tente outro termo{% else %}<a href="{% url 'acervo:obra_create' %}">Cadastre a primeira</a>{% endif %}.
      </p>
    {% endfor %}
  </div>

  {% include "_paginacao.html" with pagina=pagina %}
{% endblock %}
```

```django
{# templates/_paginacao.html #}
{% load acervo_extras %}
{% if pagina.paginator.num_pages > 1 %}
  <nav class="paginacao" aria-label="Paginação">
    {% if pagina.has_previous %}
      <a href="?{% querystring page=1 %}">Primeira</a>
      <a href="?{% querystring page=pagina.previous_page_number %}">Anterior</a>
    {% endif %}
    <span aria-current="page">Página {{ pagina.number }} de {{ pagina.paginator.num_pages }}</span>
    {% if pagina.has_next %}
      <a href="?{% querystring page=pagina.next_page_number %}">Próxima</a>
      <a href="?{% querystring page=pagina.paginator.num_pages %}">Última</a>
    {% endif %}
  </nav>
{% endif %}
```

### Passo 4 — Tags customizadas (25 min)

Crie `acervo/templatetags/acervo_extras.py` com `querystring`, `situacao_css` e uma
`inclusion_tag` à sua escolha. Não esqueça do `__init__.py` na pasta.

### Passo 5 — Auditoria de interface (15 min)

Percorra o sistema respondendo:

- [ ] Funciona em tela de 360px de largura?
- [ ] Funciona só com teclado?
- [ ] Todo estado vazio tem mensagem e próximo passo?
- [ ] Toda ação destrutiva pede confirmação?
- [ ] Toda ação bem-sucedida dá feedback?
- [ ] Contraste ≥ 4.5:1?
- [ ] Toda imagem tem `alt` significativo (ou `alt=""` se decorativa)?
- [ ] Títulos em hierarquia (`h1` → `h2` → `h3`, sem pular)?

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `TemplateDoesNotExist` | App no `INSTALLED_APPS`; caminho `app/templates/app/x.html` |
| CSS não carrega | `{% load static %}`, caminho, `collectstatic` em produção |
| `{% extends %}` fora da 1ª linha | Precisa ser a primeira tag |
| Variável em branco | Nome errado — o DTL silencia; confira o contexto |
| `|safe` em texto do usuário | XSS |
| Lógica pesada no template | Mova para a view, model ou template tag |
| `{% for %}` acessando FK sem `select_related` | N+1 na renderização |
| Perder filtros ao paginar | Use a tag `querystring` |
| `{% static %}` para mídia | Use `objeto.arquivo.url` |
| Data em formato americano | `{{ data|date:"d/m/Y" }}` e `LANGUAGE_CODE = "pt-br"` |

## ✅ Checklist de saída

- [ ] `base.html` com blocos e parciais reutilizados por todas as páginas
- [ ] Mensagens do framework exibidas em todas as telas
- [ ] Estado vazio tratado em toda listagem
- [ ] Paginação preservando filtros
- [ ] Ao menos 1 filtro e 1 tag customizados
- [ ] CSS próprio, responsivo, com foco visível
- [ ] Checklist de acessibilidade do Passo 5 todo respondido
- [ ] Nenhum `|safe` sobre conteúdo do usuário

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [Django — Templates](https://docs.djangoproject.com/pt-br/5.0/topics/templates/)
- [Django — Referência de tags e filtros](https://docs.djangoproject.com/en/5.0/ref/templates/builtins/)
- [MDN — CSS Grid](https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_grid_layout)
- [WCAG 2.2 — resumo em português](https://www.w3.org/Translations/WCAG22-pt-br/)
- [HTMX — documentação](https://htmx.org/docs/)
