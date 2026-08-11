# M06 — Cheatsheet: ORM

## CRUD

```python
# CREATE
obj = Model(campo=valor); obj.save()
obj = Model.objects.create(campo=valor)
Model.objects.bulk_create([...])                 # não chama save() nem sinais
obj, criado = Model.objects.get_or_create(chave=v, defaults={...})
obj, criado = Model.objects.update_or_create(chave=v, defaults={...})

# READ
Model.objects.all()
Model.objects.get(pk=1)                          # DoesNotExist / MultipleObjectsReturned
Model.objects.filter(...) / .exclude(...)
Model.objects.first() / .last() / .count() / .exists()
get_object_or_404(Model, pk=1)                   # em views

# UPDATE
obj.campo = v; obj.save(update_fields=["campo"])
Model.objects.filter(...).update(campo=v)        # 1 SQL, sem save()/sinais
Model.objects.filter(pk=1).update(n=F("n") + 1)  # atômico no banco

# DELETE
obj.delete()
Model.objects.filter(...).delete()
```

## Lookups

```python
__exact  __iexact  __contains  __icontains
__startswith __istartswith __endswith __iendswith
__gt __gte __lt __lte
__in __range __isnull __regex __iregex
__year __month __day __week_day __quarter __date __time __hour
__relacao__campo__lookup        # atravessa relações
```

```python
Obra.objects.filter(titulo__icontains="casa")
Obra.objects.filter(ano__range=(1900, 1950))
Obra.objects.filter(autor__nome__startswith="Mach")
Obra.objects.filter(categorias__slug__in=["a", "b"]).distinct()
Emp.objects.filter(devolvido_em__isnull=True)
Emp.objects.filter(emprestado_em__year=2026, emprestado_em__month=3)
```

## Q — OU, E, NÃO

```python
from django.db.models import Q

Model.objects.filter(Q(a=1) | Q(b=2))       # OU
Model.objects.filter(Q(a=1) & ~Q(b=2))      # E NÃO

cond = Q()
if termo: cond &= Q(titulo__icontains=termo)
if ano:   cond &= Q(ano=ano)
Model.objects.filter(cond)
```

## Ordenação, fatiamento, projeção

```python
.order_by("campo", "-outro", "rel__campo")
.order_by("?")                      # aleatório (caro)
qs[:10] / qs[10:20]                 # LIMIT / OFFSET
.values("a", "rel__b")              # dicts
.values_list("a", flat=True)        # lista simples
.distinct()
.only("a") / .defer("b")
.reverse()
```

## Agregação e anotação

```python
from django.db.models import Count, Sum, Avg, Max, Min, Q, F, Value
from django.db.models.functions import TruncMonth, Coalesce, Concat, Lower, Length

# um número para o QuerySet
Model.objects.aggregate(total=Count("id"), media=Avg("valor"))

# um número por objeto
Autor.objects.annotate(n=Count("obras")).order_by("-n")

# contagem condicional
Obra.objects.annotate(
    emprestados=Count("exemplares__emprestimos",
                      filter=Q(exemplares__emprestimos__devolvido_em__isnull=True),
                      distinct=True)
)

# GROUP BY
Emp.objects.values("associado__nome").annotate(total=Count("id")).order_by("-total")

# série temporal
Emp.objects.annotate(mes=TruncMonth("emprestado_em")).values("mes").annotate(n=Count("id"))
```

## Expressões

```python
from django.db.models import F, Value, Case, When, IntegerField, ExpressionWrapper, DurationField

.update(estoque=F("estoque") - 1)                 # atômico
.filter(devolvido_em__gt=F("previsao_devolucao")) # compara colunas
.annotate(dias=ExpressionWrapper(F("devolvido_em") - F("emprestado_em"),
                                 output_field=DurationField()))
.annotate(nivel=Case(
    When(atrasos__gte=3, then=Value("BLOQUEADO")),
    When(atrasos__gte=1, then=Value("ATENCAO")),
    default=Value("OK"),
))
```

## Performance

```python
.select_related("fk", "fk__fk2")        # FK e OneToOne (JOIN)
.prefetch_related("m2m", "fk_reversa")  # M2M e reversas (2ª consulta)
.prefetch_related(Prefetch("exemplares",
    queryset=Exemplar.objects.filter(estado="BOM")))
.only(...) / .defer(...)
.iterator(chunk_size=2000)              # QuerySets enormes, sem cache
.exists() em vez de bool(qs)
.count() em vez de len(qs)
```

### Medir

```python
print(qs.query)                     # SQL gerado
print(qs.explain())                 # plano de execução

from django.db import connection
from django.test.utils import CaptureQueriesContext
with CaptureQueriesContext(connection) as ctx:
    ...
print(len(ctx), [q["sql"] for q in ctx.captured_queries])
```

## Transações

```python
from django.db import transaction

@transaction.atomic
def operacao(): ...

with transaction.atomic():
    ...
    transaction.on_commit(lambda: enviar_email())   # só se o commit acontecer

# bloqueio pessimista (PostgreSQL)
Exemplar.objects.select_for_update().get(pk=1)
```

## SQL bruto (último recurso)

```python
Model.objects.raw("SELECT * FROM app_model WHERE campo = %s", [valor])   # SEMPRE com %s

from django.db import connection
with connection.cursor() as cur:
    cur.execute("SELECT ... WHERE x = %s", [valor])
    linhas = cur.fetchall()
```

⚠️ **Nunca** use f-string/concatenação para montar SQL — é injeção de SQL (M13).

## Anti-padrões

| ❌ | ✅ |
|---|---|
| `for o in qs: o.fk.campo` | `qs.select_related("fk")` |
| `for o in qs: o.itens.count()` | `qs.annotate(n=Count("itens"))` |
| `len(qs)` | `qs.count()` |
| `if qs:` | `if qs.exists():` |
| `qs[0]` | `qs.first()` |
| `obj.n += 1; obj.save()` | `.update(n=F("n") + 1)` |
| `Model.objects.all()` e filtrar em Python | filtrar no ORM |
| f-string em `raw()` | parâmetros `%s` |
