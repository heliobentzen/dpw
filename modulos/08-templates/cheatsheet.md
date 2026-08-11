# M08 — Cheatsheet: Templates

## Sintaxe

```django
{{ variavel }}
{{ objeto.atributo }}
{{ valor|filtro:"argumento" }}
{% tag %}
{# comentário #}
{% comment %}bloco{% endcomment %}
{% verbatim %}{{ isto não é processado }}{% endverbatim %}
```

## Tags de controle

```django
{% if a and b or not c %}...{% elif d %}...{% else %}...{% endif %}
{% if valor in lista %}  {% if x == y %}  {% if lista %}

{% for item in lista %}
  {{ forloop.counter }} {{ forloop.counter0 }} {{ forloop.revcounter }}
  {{ forloop.first }} {{ forloop.last }} {{ forloop.parentloop.counter }}
{% empty %}
  nenhum item
{% endfor %}

{% for k, v in dicionario.items %}{{ k }}: {{ v }}{% endfor %}
{% cycle 'par' 'impar' %}
{% with total=obra.exemplares.count %}{{ total }}{% endwith %}
{% firstof a b "padrão" %}
{% regroup obras by autor as por_autor %}
```

## Herança e inclusão

```django
{% extends "base.html" %}          {# PRIMEIRA linha do arquivo #}
{% block nome %}...{% endblock %}
{% block nome %}{{ block.super }} + extra{% endblock %}

{% include "app/_parcial.html" %}
{% include "app/_parcial.html" with obra=o titulo="X" %}
{% include "app/_parcial.html" with obra=o only %}    {# isola o contexto #}
```

## URLs e estáticos

```django
{% url 'app:nome' %}
{% url 'app:nome' obj.pk %}
{% url 'app:nome' pk=obj.pk %}
{% url 'app:nome' as u %}<a href="{{ u }}">

{% load static %}
{% static 'css/estilo.css' %}
{% static 'app/js/x.js' %}
{{ objeto.imagem.url }}            {# MÍDIA: nunca use {% static %} #}
```

## Filtros

```django
{# texto #}
upper lower title capfirst
truncatechars:100 truncatewords:20 truncatechars_html:100
linebreaks linebreaksbr striptags wordcount
slugify escape safe center:20 ljust:10 cut:" "

{# data/hora #}
date:"d/m/Y" date:"d/m/Y H:i" time:"H:i" timesince timeuntil
date:"\d\e F \d\e Y"

{# números #}
floatformat floatformat:2 add:5 divisibleby:3 filesizeformat
pluralize pluralize:"es" pluralize:"a,as"

{# listas #}
length first last join:", " slice:":5" dictsort:"nome" random

{# padrões #}
default:"—" default_if_none:"n/d" yesno:"sim,não,talvez"

{# urls #}
urlencode urlize
```

Com `{% load humanize %}` (requer `django.contrib.humanize`):
`intcomma`, `intword`, `naturalday`, `naturaltime`, `ordinal`, `apnumber`.

## Mensagens

```django
{% if messages %}
  <div role="status" aria-live="polite">
  {% for m in messages %}
    <div class="mensagem mensagem--{{ m.tags }}">{{ m }}</div>
  {% endfor %}
  </div>
{% endif %}
```

```python
from django.contrib import messages
messages.debug/info/success/warning/error(request, "texto")
```

## Formulários

```django
<form method="post" enctype="multipart/form-data" novalidate>
  {% csrf_token %}
  {{ form.as_div }}          {# ou as_p, as_ul, as_table #}

  {{ form.non_field_errors }}
  {{ form.titulo.label_tag }}
  {{ form.titulo }}
  {{ form.titulo.errors }}
  {{ form.titulo.help_text }}
  {{ form.titulo.value }}
  {{ form.titulo.id_for_label }}
  {{ form.titulo.field.required }}

  {{ formset.management_form }}
  <button type="submit">Salvar</button>
</form>
```

## Paginação

```django
{% if pagina.has_previous %}
  <a href="?page={{ pagina.previous_page_number }}">Anterior</a>
{% endif %}
Página {{ pagina.number }} de {{ pagina.paginator.num_pages }}
({{ pagina.paginator.count }} itens)
{% if pagina.has_next %}
  <a href="?page={{ pagina.next_page_number }}">Próxima</a>
{% endif %}
```

## Tags e filtros customizados

```
app/
└── templatetags/
    ├── __init__.py        ← OBRIGATÓRIO
    └── app_extras.py
```

```python
from django import template
register = template.Library()

@register.filter
def meu_filtro(valor, arg=None): ...

@register.simple_tag
def minha_tag(a, b): ...

@register.simple_tag(takes_context=True)
def com_contexto(context, **kwargs): ...

@register.inclusion_tag("app/_parcial.html")
def componente(obj): return {"obj": obj}
```

```django
{% load app_extras %}
{{ valor|meu_filtro:"x" }}
{% minha_tag 1 2 %}
{% minha_tag 1 2 as resultado %}
```

## Settings relevantes

```python
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",   # necessário para a tag querystring
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
        "acervo.context_processors.indicadores",
    ]},
}]

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

## Acessibilidade — mínimo exigido na rubrica

```html
<html lang="pt-br">
<a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
<main id="conteudo">
<nav aria-label="Principal">
<img src="..." alt="descrição significativa">    <!-- alt="" se decorativa -->
<label for="id_campo">Rótulo</label><input id="id_campo">
<div role="alert">erro</div>
<button type="submit">   <!-- botão é <button>, não <div onclick> -->
:focus-visible { outline: 3px solid; }
```
