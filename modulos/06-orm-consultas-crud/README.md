# M05 — ORM: consultas ao banco e operações CRUD

> **CH:** 6h (2h teóricas · 4h práticas) · **Semanas 5–6** · **Pré-requisitos:** M03, M04
> **Ementa:** *Geração de consultas ao BD e operações CRUD a partir da API do framework.*

## 🎯 Objetivos

1. Executar as quatro operações CRUD pela API do ORM.
2. Construir consultas com filtros, lookups, ordenação, fatiamento e agregação.
3. Explicar a preguiça (*laziness*) do QuerySet e quando o banco é realmente consultado.
4. Diagnosticar e corrigir o problema N+1 com `select_related` e `prefetch_related`.
5. Garantir consistência com transações.

---

## 📖 Teoria (2h)

### 1. QuerySet é preguiçoso (25 min)

```python
qs = Obra.objects.filter(ano_publicacao__gte=1900)   # nenhuma consulta ainda
qs = qs.exclude(isbn="")                              # nenhuma consulta ainda
qs = qs.order_by("titulo")                            # nenhuma consulta ainda
print(qs.query)                                       # mostra o SQL, ainda sem executar

for obra in qs:                                       # AQUI o banco é consultado
    print(obra.titulo)

for obra in qs:                                       # cache: NÃO consulta de novo
    print(obra.autor)
```

**O que dispara a consulta:** iterar, `list()`, `len()`, fatiar com passo, `bool()`,
`repr()`, `count()`, `exists()`, `get()`, `first()`, `last()`, `aggregate()`.

**Por que importa:** você pode montar a consulta em pedaços (filtros condicionais numa
view de busca) sem custo, e o banco é acessado uma única vez, no fim.

```python
qs = Obra.objects.all()
if termo:
    qs = qs.filter(titulo__icontains=termo)
if categoria:
    qs = qs.filter(categorias__slug=categoria)
if ano:
    qs = qs.filter(ano_publicacao=ano)
# uma consulta só, ao renderizar
```

### 2. CRUD (30 min)

#### Create

```python
# 1. instanciar e salvar
obra = Obra(titulo="Memórias Póstumas", autor=machado)
obra.save()

# 2. atalho (instancia e salva)
obra = Obra.objects.create(titulo="Quincas Borba", autor=machado)

# 3. em lote (rápido, mas NÃO chama save() nem sinais)
Obra.objects.bulk_create([Obra(titulo=t, autor=machado) for t in titulos])

# 4. buscar ou criar — evita duplicata em condição de corrida
categoria, criada = Categoria.objects.get_or_create(
    slug="romance", defaults={"nome": "Romance"}
)
```

#### Read

```python
Obra.objects.all()                       # QuerySet com todas
Obra.objects.get(pk=1)                   # UM objeto; erro se 0 ou 2+
Obra.objects.filter(autor=machado)       # QuerySet filtrado
Obra.objects.exclude(isbn="")            # negação
Obra.objects.first() / .last()           # ou None
Obra.objects.count()
Obra.objects.exists()
```

> **`get()` × `filter()`:** `get()` devolve **o objeto** e lança `DoesNotExist` ou
> `MultipleObjectsReturned`. `filter()` devolve **um QuerySet**, possivelmente vazio.
> Em views, use `get_object_or_404()`, que converte a exceção em resposta 404.

#### Update

```python
# 1. objeto a objeto (chama save(), dispara sinais e validações do save)
obra = Obra.objects.get(pk=1)
obra.titulo = "Novo título"
obra.save(update_fields=["titulo"])       # UPDATE só dessa coluna

# 2. em massa (UM comando SQL; NÃO chama save() nem sinais)
Obra.objects.filter(ano_publicacao__lt=1900).update(destaque=True)

# 3. com valor calculado no banco (sem trazer os dados para o Python)
from django.db.models import F
Exemplar.objects.filter(pk=7).update(vezes_emprestado=F("vezes_emprestado") + 1)
```

`F()` evita a condição de corrida clássica: ler `10`, somar `1` e gravar `11` — enquanto
outra requisição fez o mesmo, perdendo um incremento. Com `F()`, quem soma é o banco.

#### Delete

```python
obra = Obra.objects.get(pk=1)
obra.delete()                                  # respeita on_delete
Obra.objects.filter(destaque=False).delete()   # em massa
```

> Em sistemas reais, prefira **exclusão lógica** (`ativo = False`) para dados com valor
> histórico. Apagar é irreversível; desativar não.

### 3. Lookups: o vocabulário dos filtros (30 min)

```python
Obra.objects.filter(campo__lookup=valor)
```

| Categoria | Lookups |
|---|---|
| Comparação | `exact`, `iexact`, `gt`, `gte`, `lt`, `lte` |
| Texto | `contains`, `icontains`, `startswith`, `istartswith`, `endswith`, `iendswith`, `regex` |
| Conjunto | `in`, `range`, `isnull` |
| Data | `year`, `month`, `day`, `week_day`, `date`, `time`, `quarter` |
| Relação | atravessa com `__`: `obra__autor__nome__icontains` |

O prefixo `i` significa *case-insensitive*.

```python
Obra.objects.filter(titulo__icontains="casmurro")
Obra.objects.filter(ano_publicacao__range=(1850, 1900))
Obra.objects.filter(autor__nome__startswith="Mach")            # atravessa a FK
Emprestimo.objects.filter(emprestado_em__year=2026, emprestado_em__month=3)
Obra.objects.filter(categorias__slug__in=["romance", "conto"]).distinct()
Emprestimo.objects.filter(devolvido_em__isnull=True)
```

> `distinct()` é necessário ao filtrar por relação N-N: o JOIN pode repetir a mesma obra.

#### Consultas complexas: `Q`

```python
from django.db.models import Q

# OU
Obra.objects.filter(Q(titulo__icontains=t) | Q(autor__nome__icontains=t))

# E com negação
Obra.objects.filter(Q(ano_publicacao__gte=1900) & ~Q(isbn=""))

# construção dinâmica
condicoes = Q()
if termo:
    condicoes &= Q(titulo__icontains=termo) | Q(sinopse__icontains=termo)
if apenas_disponiveis:
    condicoes &= Q(exemplares__emprestimos__devolvido_em__isnull=True)
Obra.objects.filter(condicoes).distinct()
```

### 4. Ordenação, fatiamento e valores (15 min)

```python
Obra.objects.order_by("titulo")            # crescente
Obra.objects.order_by("-criado_em")        # decrescente
Obra.objects.order_by("autor__nome", "-ano_publicacao")
Obra.objects.order_by("?")                 # aleatório (caro; evite em tabelas grandes)

Obra.objects.all()[:10]                    # LIMIT 10
Obra.objects.all()[10:20]                  # LIMIT 10 OFFSET 10

Obra.objects.values("titulo", "autor__nome")        # lista de dicts
Obra.objects.values_list("titulo", flat=True)       # lista de strings
Obra.objects.only("titulo")                          # carrega só essa coluna
Obra.objects.defer("sinopse")                        # carrega tudo menos essa
```

`values()` e `values_list()` são muito mais leves quando você só precisa de dados para um
gráfico, um `<select>` ou um CSV.

### 5. Agregação e anotação (20 min)

**Agregar** = um número para o QuerySet inteiro. **Anotar** = um número para cada objeto.

```python
from django.db.models import Avg, Count, Max, Min, Sum, Q

# agregação
Obra.objects.aggregate(total=Count("id"), ano_medio=Avg("ano_publicacao"))
# {'total': 128, 'ano_medio': 1954.3}

# anotação
autores = Autor.objects.annotate(qtd_obras=Count("obras")).order_by("-qtd_obras")
for a in autores:
    print(a.nome, a.qtd_obras)

# anotação com filtro embutido
Obra.objects.annotate(
    total_exemplares=Count("exemplares", distinct=True),
    emprestados=Count("exemplares__emprestimos",
                      filter=Q(exemplares__emprestimos__devolvido_em__isnull=True),
                      distinct=True),
)

# agrupar por (values + annotate = GROUP BY)
Emprestimo.objects.values("associado__nome").annotate(total=Count("id")).order_by("-total")
```

### 6. O problema N+1 (20 min) ⭐

```python
# ❌ 1 consulta para as obras + 1 consulta POR obra para o autor = 101 consultas
for obra in Obra.objects.all()[:100]:
    print(obra.titulo, obra.autor.nome)
```

```python
# ✅ 1 consulta com JOIN
for obra in Obra.objects.select_related("autor", "editora")[:100]:
    print(obra.titulo, obra.autor.nome)

# ✅ para N-N e reverso de FK: 2 consultas
for obra in Obra.objects.prefetch_related("categorias", "exemplares"):
    print(obra.titulo, [c.nome for c in obra.categorias.all()])
```

| Ferramenta | Usar em | Como funciona |
|---|---|---|
| `select_related` | `ForeignKey`, `OneToOne` (ida) | `JOIN` numa consulta só |
| `prefetch_related` | `ManyToMany`, FK reversa | Consulta separada + junção em Python |

**Como detectar:**

```python
from django.db import connection, reset_queries
reset_queries()
lista = list(Obra.objects.all()[:50])
for o in lista:
    _ = o.autor.nome
print(len(connection.queries))     # com DEBUG=True
```

Ou instale o **Django Debug Toolbar** — ele mostra o número de consultas em cada página.

💼 **No mercado:** N+1 é a causa nº 1 de páginas lentas em aplicações com ORM. Saber
identificá-lo e corrigi-lo é diferencial concreto em entrevista e em code review.

### 7. Transações (10 min)

```python
from django.db import transaction

@transaction.atomic
def registrar_emprestimo(exemplar, associado):
    emprestimo = Emprestimo.objects.create(exemplar=exemplar, associado=associado)
    exemplar.vezes_emprestado = F("vezes_emprestado") + 1
    exemplar.save(update_fields=["vezes_emprestado"])
    return emprestimo

# ou como bloco
with transaction.atomic():
    ...
```

Se qualquer exceção escapar do bloco, **nada** é gravado. Use sempre que uma operação
envolver mais de uma escrita que precisam ser consistentes entre si.

---

## 🛠️ Roteiro prático (4h)

### Passo 1 — Preparar dados de volume (30 min)

Sem volume, todo problema de desempenho fica invisível. Crie um comando de gestão:

```python
# acervo/management/commands/popular.py
import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from acervo.models import Associado, Autor, Categoria, Editora, Emprestimo, Exemplar, Obra

NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabi", "Hugo", "Iara", "João"]
SOBRENOMES = ["Silva", "Souza", "Costa", "Lima", "Alves", "Rocha", "Dias", "Melo"]
PALAVRAS = ["Memórias", "O Cortiço", "Sertão", "Cidade", "Vento", "Rio", "Casa", "Noite"]


class Command(BaseCommand):
    help = "Popula o banco com dados de exemplo para exercícios de ORM."

    def add_arguments(self, parser):
        parser.add_argument("--obras", type=int, default=200)
        parser.add_argument("--associados", type=int, default=80)

    def handle(self, *args, **opts):
        autores = [Autor.objects.create(nome=f"{n} {s}")
                   for n in NOMES for s in SOBRENOMES[:3]]
        editoras = [Editora.objects.create(nome=f"Editora {i}") for i in range(1, 6)]
        categorias = [
            Categoria.objects.create(nome=c, slug=c.lower())
            for c in ["Romance", "Conto", "Poesia", "Infantil", "Técnico"]
        ]

        obras = []
        for i in range(opts["obras"]):
            o = Obra.objects.create(
                titulo=f"{random.choice(PALAVRAS)} {i}",
                autor=random.choice(autores),
                editora=random.choice(editoras),
                ano_publicacao=random.randint(1880, 2025),
            )
            o.categorias.set(random.sample(categorias, k=random.randint(1, 3)))
            obras.append(o)

        exemplares = []
        for o in obras:
            for j in range(random.randint(1, 4)):
                exemplares.append(Exemplar.objects.create(obra=o, tombo=f"{o.pk:05d}-{j}"))

        associados = [
            Associado.objects.create(nome=f"{random.choice(NOMES)} {random.choice(SOBRENOMES)}")
            for _ in range(opts["associados"])
        ]

        hoje = timezone.localdate()
        for ex in random.sample(exemplares, k=len(exemplares) // 3):
            inicio = hoje - timedelta(days=random.randint(0, 120))
            emp = Emprestimo.objects.create(
                exemplar=ex,
                associado=random.choice(associados),
                emprestado_em=inicio,
                previsao_devolucao=inicio + timedelta(days=14),
            )
            if random.random() < 0.7:
                emp.devolvido_em = inicio + timedelta(days=random.randint(1, 30))
                emp.save(update_fields=["devolvido_em"])

        self.stdout.write(self.style.SUCCESS(
            f"{len(obras)} obras, {len(exemplares)} exemplares, {len(associados)} associados."
        ))
```

```bash
python manage.py popular --obras 300 --associados 100
```

### Passo 2 — CRUD no shell (40 min)

```bash
python manage.py shell
```

Execute e registre o resultado de cada bloco:

```python
from acervo.models import *
from django.db.models import Q, Count, Avg, Max, Min, Sum, F

# CREATE
autor = Autor.objects.create(nome="Clarice Lispector")
obra = Obra.objects.create(titulo="A Hora da Estrela", autor=autor, ano_publicacao=1977)
cat, criada = Categoria.objects.get_or_create(slug="romance", defaults={"nome": "Romance"})
obra.categorias.add(cat)

# READ
Obra.objects.count()
Obra.objects.filter(autor=autor)
Obra.objects.get(titulo="A Hora da Estrela")
Obra.objects.filter(titulo__icontains="hora").exists()

# UPDATE
obra.ano_publicacao = 1977
obra.save(update_fields=["ano_publicacao"])
Obra.objects.filter(ano_publicacao__lt=1900).update(destaque=True)

# DELETE
Obra.objects.filter(titulo__startswith="Teste").delete()
```

### Passo 3 — 20 consultas do BiblioCom (90 min) ⭐

Escreva cada consulta, execute e anote o SQL (`print(qs.query)`) e o nº de resultados:

1. Todas as obras publicadas antes de 1900, ordenadas por título.
2. Obras cujo título contém "cidade" (sem diferenciar maiúsculas).
3. Obras do autor cujo nome começa com "Ana".
4. Obras das categorias "Romance" **ou** "Poesia", sem repetição.
5. Obras **sem** ISBN cadastrado.
6. Os 10 autores com mais obras.
7. Quantidade de exemplares por obra, ordenada da maior para a menor.
8. Obras que não têm nenhum exemplar.
9. Exemplares atualmente emprestados.
10. Exemplares disponíveis da obra de `pk=1`.
11. Empréstimos em atraso (não devolvidos, previsão vencida).
12. Associados com 3 ou mais empréstimos ativos.
13. Total de empréstimos por mês nos últimos 6 meses.
14. Média de dias entre empréstimo e devolução.
15. A obra mais emprestada de todos os tempos.
16. Associados que nunca pegaram nada emprestado.
17. Empréstimos do associado `pk=1`, com dados do exemplar e da obra, em **1 consulta**.
18. Obras com o total de exemplares e o total de emprestados, anotados.
19. Busca combinada: termo em título **ou** nome do autor **ou** sinopse.
20. Top 5 categorias por número de empréstimos.

Dicas: 8 → `filter(exemplares__isnull=True)`; 13 → `TruncMonth` de
`django.db.models.functions`; 14 → `ExpressionWrapper` com `F("devolvido_em") -
F("emprestado_em")`; 17 → `select_related("exemplar__obra")`.

### Passo 4 — Caçar e corrigir o N+1 (50 min) ⭐

```bash
pip install django-debug-toolbar
```

```python
# config/settings.py  (só em desenvolvimento)
if DEBUG:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
    INTERNAL_IPS = ["127.0.0.1"]
```

```python
# config/urls.py
if settings.DEBUG:
    urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
```

Agora, no shell, meça:

```python
from django.db import connection, reset_queries
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as ctx:
    for o in Obra.objects.all()[:50]:
        _ = o.autor.nome
print("consultas:", len(ctx))          # ~51

with CaptureQueriesContext(connection) as ctx:
    for o in Obra.objects.select_related("autor")[:50]:
        _ = o.autor.nome
print("consultas:", len(ctx))          # 1
```

Repita para: (a) categorias de cada obra; (b) exemplares de cada obra; (c) empréstimos de
cada associado com o nome da obra. Registre "antes → depois" de cada caso numa tabela.

### Passo 5 — Transação (30 min)

Implemente e teste:

```python
# acervo/services.py
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Emprestimo


@transaction.atomic
def registrar_emprestimo(exemplar, associado):
    if not exemplar.disponivel:
        raise ValidationError("Exemplar não está disponível.")
    if not associado.pode_pegar_emprestado:
        raise ValidationError("Associado atingiu o limite ou está inativo.")
    return Emprestimo.objects.create(exemplar=exemplar, associado=associado)
```

Teste no shell: tente emprestar um exemplar já emprestado e um associado no limite.
Confirme que nada foi gravado nos casos de erro.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `get()` sem tratar `DoesNotExist` | `get_object_or_404()` na view, `filter().first()` fora dela |
| Loop com acesso a FK sem `select_related` | N+1 |
| `.count()` dentro de um loop | Use `annotate(Count(...))` |
| `len(qs)` só para contar | Use `qs.count()` (não carrega os objetos) |
| `if qs:` para testar existência | Use `qs.exists()` |
| `update()` esperando que `save()` seja chamado | `update()` não chama `save()` nem sinais |
| Filtro N-N sem `distinct()` | Resultados duplicados |
| `x += 1` em Python e depois `save()` | Condição de corrida; use `F()` |
| Escrever SQL com f-string | Injeção de SQL — ver M11 |

## ✅ Checklist de saída

- [ ] Sei explicar quando o QuerySet vai ao banco
- [ ] As 20 consultas do Passo 3 escritas, executadas e com SQL registrado
- [ ] Sei a diferença entre `aggregate` e `annotate` e uso os dois
- [ ] Reduzi ao menos 3 casos de N+1, com medição antes/depois
- [ ] Usei `F()` para atualização atômica
- [ ] Usei `transaction.atomic` numa operação com múltiplas escritas
- [ ] Comando `popular` versionado e funcionando

## 📦 Entrega E2 — Caderno de consultas

Notebook ou arquivo `.md` com as 20 consultas: código do ORM, SQL gerado, nº de resultados
e um comentário de uma linha explicando **o que a consulta responde para a biblioteca**.
Mais a tabela de otimização N+1 (antes → depois).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [Django — Fazendo consultas](https://docs.djangoproject.com/pt-br/5.0/topics/db/queries/)
- [Django — Referência de QuerySet](https://docs.djangoproject.com/en/5.0/ref/models/querysets/)
- [Django — Agregação](https://docs.djangoproject.com/en/5.0/topics/db/aggregation/)
- [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/)
