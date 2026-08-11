# M06 — Views: mapeamento de URLs e processamento de requisições

> **CH:** 6h (3h teóricas · 3h práticas) · **Semanas 7–8** · **Pré-requisitos:** M05
> **Ementa:** *Views: Mapeamento de URLs; Criação de classes / métodos / funções para
> processamento de requisições.*

## 🎯 Objetivos

1. Mapear URLs para views com parâmetros tipados, prefixos e namespaces.
2. Escrever views como **função** (FBV) e como **classe** (CBV), sabendo quando usar cada uma.
3. Processar GET e POST corretamente, aplicando o padrão PRG.
4. Devolver respostas adequadas: HTML, redirecionamento, JSON, arquivo, 404.
5. Nunca escrever URL na mão — usar `reverse()` / `{% url %}` / `get_absolute_url()`.

---

## 📖 Teoria (3h)

### 1. Mapeamento de URLs (45 min)

#### O grafo de URLconfs

```
config/urls.py                      (raiz, apontada por ROOT_URLCONF)
├── path("admin/", admin.site.urls)
├── path("", include("acervo.urls"))              -> /obras/, /obras/42/
└── path("emprestimos/", include("emprestimos.urls"))
```

```python
# config/urls.py
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("acervo.urls")),
    path("emprestimos/", include("emprestimos.urls")),
]
```

```python
# acervo/urls.py
from django.urls import path

from . import views

app_name = "acervo"          # habilita o namespace 'acervo:'

urlpatterns = [
    path("", views.home, name="home"),
    path("obras/", views.ObraListView.as_view(), name="obra_list"),
    path("obras/nova/", views.ObraCreateView.as_view(), name="obra_create"),
    path("obras/<int:pk>/", views.ObraDetailView.as_view(), name="obra_detail"),
    path("obras/<int:pk>/editar/", views.ObraUpdateView.as_view(), name="obra_update"),
    path("obras/<int:pk>/excluir/", views.ObraDeleteView.as_view(), name="obra_delete"),
    path("autores/<slug:slug>/", views.autor_detail, name="autor_detail"),
]
```

O Django testa os padrões **na ordem** e usa o primeiro que casar. Padrão genérico antes
de específico esconde o específico:

```python
# ❌ /obras/nova/ nunca é alcançada: <str:slug> casa antes
path("obras/<str:slug>/", ...),
path("obras/nova/", ...),

# ✅ específico primeiro
path("obras/nova/", ...),
path("obras/<str:slug>/", ...),
```

#### Converters

| Converter | Casa com | Exemplo |
|---|---|---|
| `str` | Qualquer texto **exceto** `/` | `<str:nome>` |
| `int` | Dígitos (≥ 0) | `<int:pk>` |
| `slug` | Letras, números, `-` e `_` | `<slug:slug>` |
| `uuid` | UUID formatado | `<uuid:id>` |
| `path` | Qualquer texto **inclusive** `/` | `<path:arquivo>` |

Converter customizado, quando o padrão precisa de validação própria:

```python
# acervo/converters.py
class AnoConverter:
    regex = r"(18|19|20)\d{2}"

    def to_python(self, value):
        return int(value)

    def to_url(self, value):
        return str(value)
```

```python
from django.urls import register_converter
from . import converters

register_converter(converters.AnoConverter, "ano")
urlpatterns = [path("acervo/<ano:ano>/", views.por_ano, name="por_ano")]
```

#### Nomear e reverter

**Nunca escreva URL literal no código ou no template.** Se a rota mudar, tudo quebra
silenciosamente.

```python
from django.urls import reverse, reverse_lazy

reverse("acervo:obra_detail", kwargs={"pk": 42})       # -> "/obras/42/"
reverse("acervo:obra_list")                            # -> "/obras/"
```

```html
<a href="{% url 'acervo:obra_detail' obra.pk %}">{{ obra.titulo }}</a>
```

```python
class Obra(models.Model):
    def get_absolute_url(self):
        return reverse("acervo:obra_detail", kwargs={"pk": self.pk})
```

Com `get_absolute_url`, o admin ganha o botão "Ver no site" e as CBVs de criação/edição
sabem para onde redirecionar sozinhas.

> `reverse_lazy` é a versão preguiçosa, necessária em atributos de classe e em
> `settings.py`, avaliados antes do carregamento das URLs.

### 2. Views baseadas em função (45 min)

```python
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from .models import Obra


def obra_list(request):
    termo = request.GET.get("q", "").strip()
    obras = Obra.objects.select_related("autor")
    if termo:
        obras = obras.filter(titulo__icontains=termo)
    return render(request, "acervo/obra_list.html", {"obras": obras, "termo": termo})


def obra_detail(request, pk):
    obra = get_object_or_404(Obra.objects.select_related("autor", "editora"), pk=pk)
    return render(request, "acervo/obra_detail.html", {"obra": obra})
```

#### Tratando GET e POST na mesma view

```python
def obra_create(request):
    if request.method == "POST":
        form = ObraForm(request.POST)
        if form.is_valid():
            obra = form.save()
            messages.success(request, f"Obra '{obra.titulo}' cadastrada.")
            return redirect("acervo:obra_detail", pk=obra.pk)   # PRG
        messages.error(request, "Corrija os erros abaixo.")
    else:
        form = ObraForm()
    return render(request, "acervo/obra_form.html", {"form": form})
```

Este é **o** esqueleto de view com formulário. Guarde-o. Note:

- POST inválido **não** redireciona: re-renderiza o formulário com os erros e os dados.
- POST válido **sempre** redireciona (PRG).
- GET só monta o formulário vazio.

#### Restringir métodos

```python
from django.views.decorators.http import require_GET, require_POST, require_http_methods

@require_POST
def obra_delete(request, pk):
    obra = get_object_or_404(Obra, pk=pk)
    obra.delete()
    messages.success(request, "Obra excluída.")
    return redirect("acervo:obra_list")
```

Uma requisição GET a essa rota recebe `405 Method Not Allowed` — exatamente o que se quer
para uma operação destrutiva (lembre do M01: bots seguem links GET).

#### Objetos de resposta

```python
from django.http import (FileResponse, Http404, HttpResponse, HttpResponseNotFound,
                         JsonResponse, HttpResponseRedirect)
from django.shortcuts import redirect, render

render(request, "template.html", contexto)               # HTML
redirect("acervo:obra_list")                             # 302 por nome de rota
redirect(obra)                                           # usa get_absolute_url()
redirect("/caminho/", permanent=True)                    # 301
JsonResponse({"ok": True})                               # application/json
FileResponse(open("relatorio.pdf", "rb"))                # download
HttpResponse(status=204)                                 # sem conteúdo
raise Http404("Obra não encontrada")                     # 404
```

### 3. Views baseadas em classe (45 min)

CBVs organizam por **método HTTP** e trazem comportamento pronto por herança.

```python
from django.views import View


class ObraView(View):
    def get(self, request, pk):
        ...
    def post(self, request, pk):
        ...
```

#### Genéricas de CRUD

```python
from django.urls import reverse_lazy
from django.views.generic import (CreateView, DeleteView, DetailView, ListView, UpdateView)

from .models import Obra


class ObraListView(ListView):
    model = Obra
    paginate_by = 20
    # template: acervo/obra_list.html | contexto: object_list e obra_list

    def get_queryset(self):
        qs = super().get_queryset().select_related("autor")
        termo = self.request.GET.get("q", "").strip()
        if termo:
            qs = qs.filter(titulo__icontains=termo)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["termo"] = self.request.GET.get("q", "")
        return ctx


class ObraDetailView(DetailView):
    model = Obra
    queryset = Obra.objects.select_related("autor", "editora").prefetch_related("categorias")
    # template: acervo/obra_detail.html | contexto: object e obra


class ObraCreateView(CreateView):
    model = Obra
    form_class = ObraForm
    # template: acervo/obra_form.html
    # sucesso: get_absolute_url() do objeto criado


class ObraUpdateView(UpdateView):
    model = Obra
    form_class = ObraForm


class ObraDeleteView(DeleteView):
    model = Obra
    success_url = reverse_lazy("acervo:obra_list")
    # template: acervo/obra_confirm_delete.html
```

**Convenções que a CBV assume (e que confundem no começo):**

| CBV | Template padrão | Nome no contexto |
|---|---|---|
| `ListView` | `<app>/<model>_list.html` | `object_list`, `<model>_list` |
| `DetailView` | `<app>/<model>_detail.html` | `object`, `<model>` |
| `CreateView`/`UpdateView` | `<app>/<model>_form.html` | `form`, `object` |
| `DeleteView` | `<app>/<model>_confirm_delete.html` | `object` |

Sobrescreva com `template_name`, `context_object_name`, `success_url`.

#### Pontos de extensão mais usados

```python
class ObraCreateView(CreateView):
    def get_queryset(self): ...          # que objetos esta view enxerga
    def get_context_data(self, **kw): ...# dados extras para o template
    def get_form_kwargs(self): ...       # passa o request/usuário ao form
    def form_valid(self, form): ...      # o que fazer quando validar
    def form_invalid(self, form): ...    # quando não validar
    def get_success_url(self): ...       # para onde ir depois
    def dispatch(self, request, *a, **kw): ...  # antes de tudo (permissões)
```

```python
class ObraCreateView(CreateView):
    model = Obra
    form_class = ObraForm

    def form_valid(self, form):
        form.instance.cadastrada_por = self.request.user
        messages.success(self.request, "Obra cadastrada com sucesso.")
        return super().form_valid(form)
```

#### FBV ou CBV?

| Situação | Escolha |
|---|---|
| CRUD padrão de um model | **CBV genérica** — menos código, comportamento testado |
| Lógica de negócio complexa e específica | **FBV** — fluxo explícito, fácil de ler |
| Precisa reaproveitar comportamento entre views | **CBV + mixins** |
| Está aprendendo | **FBV primeiro** — nada é implícito |
| A equipe passa mais tempo lendo a documentação da CBV que escrevendo a lógica | **FBV** |

Não existe resposta única. O critério honesto: *qual das duas fica mais fácil de entender
daqui a seis meses?* Consulte [ccbv.co.uk](https://ccbv.co.uk/) para ver o que cada CBV faz.

### 4. O objeto `request` (25 min)

```python
request.method              # "GET", "POST", ...
request.path                # "/obras/42/"
request.get_full_path()     # "/obras/42/?ordem=titulo"
request.GET                 # QueryDict da query string
request.POST                # QueryDict do corpo do formulário
request.FILES               # arquivos enviados
request.body                # corpo cru (JSON, por exemplo)
request.headers["User-Agent"]
request.COOKIES
request.session             # dict persistente por usuário
request.user                # usuário autenticado ou AnonymousUser
request.META["REMOTE_ADDR"]
request.is_secure()
```

`QueryDict` é imutável e aceita chaves repetidas:

```python
request.GET.get("q", "")            # valor único, com default
request.GET.getlist("categoria")    # ["romance", "conto"]
```

**Sessão:**

```python
request.session["ultima_busca"] = termo
request.session.get("ultima_busca", "")
del request.session["ultima_busca"]
request.session.set_expiry(3600)
```

### 5. Middleware: o que roda antes e depois (20 min)

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

A ordem importa: cada um envolve os seguintes, como camadas de cebola. `request.user` só
existe porque o `AuthenticationMiddleware` rodou antes da sua view.

Middleware próprio:

```python
# acervo/middleware.py
import logging
import time

logger = logging.getLogger(__name__)


class TempoDeRespostaMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response          # roda uma vez, na inicialização

    def __call__(self, request):
        inicio = time.monotonic()
        response = self.get_response(request)     # chama a view (ou o próximo middleware)
        duracao = (time.monotonic() - inicio) * 1000
        response["X-Tempo-ms"] = f"{duracao:.1f}"
        if duracao > 500:
            logger.warning("Resposta lenta: %s %s (%.0f ms)", request.method, request.path, duracao)
        return response
```

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Rotas do acervo (30 min)

Implemente em `acervo/urls.py` as 7 rotas listadas na teoria e, em `views.py`, versões
provisórias que devolvem `HttpResponse` com o nome da rota. Verifique todas no navegador
antes de escrever qualquer lógica.

### Passo 2 — FBVs de listagem, detalhe e busca (50 min)

```python
# acervo/views.py
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, render

from .models import Obra


def obra_list(request):
    termo = request.GET.get("q", "").strip()
    categoria = request.GET.get("categoria", "")

    obras = (
        Obra.objects.select_related("autor", "editora")
        .prefetch_related("categorias")
        .annotate(total_exemplares=Count("exemplares", distinct=True))
    )

    if termo:
        obras = obras.filter(
            Q(titulo__icontains=termo)
            | Q(subtitulo__icontains=termo)
            | Q(autor__nome__icontains=termo)
        ).distinct()

    if categoria:
        obras = obras.filter(categorias__slug=categoria)

    paginator = Paginator(obras, 12)
    pagina = paginator.get_page(request.GET.get("page"))

    return render(request, "acervo/obra_list.html", {
        "pagina": pagina,
        "obras": pagina.object_list,
        "termo": termo,
        "categoria": categoria,
    })


def obra_detail(request, pk):
    obra = get_object_or_404(
        Obra.objects.select_related("autor", "editora").prefetch_related("categorias", "exemplares"),
        pk=pk,
    )
    return render(request, "acervo/obra_detail.html", {"obra": obra})
```

Teste: `/obras/?q=cidade&page=2`. Observe que os filtros **se preservam** entre páginas se
o template repassar os parâmetros (você fará isso no M08).

### Passo 3 — Ação com POST e PRG (40 min)

```python
# emprestimos/views.py
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST

from acervo.models import Associado, Exemplar
from acervo.services import registrar_emprestimo


@require_POST
def emprestar(request, exemplar_pk):
    exemplar = get_object_or_404(Exemplar, pk=exemplar_pk)
    associado = get_object_or_404(Associado, pk=request.POST.get("associado"))
    try:
        emprestimo = registrar_emprestimo(exemplar, associado)
    except ValidationError as e:
        messages.error(request, e.message)
        return redirect("acervo:obra_detail", pk=exemplar.obra_id)

    messages.success(
        request,
        f"Empréstimo registrado. Devolver até {emprestimo.previsao_devolucao:%d/%m/%Y}.",
    )
    return redirect("emprestimos:detail", pk=emprestimo.pk)


@require_POST
def devolver(request, pk):
    emprestimo = get_object_or_404(Emprestimo, pk=pk, devolvido_em__isnull=True)
    emprestimo.devolver()
    messages.success(request, "Devolução registrada.")
    return redirect("emprestimos:list")
```

Teste com `curl` que GET nessas rotas devolve **405**:

```bash
curl -i http://localhost:8000/emprestimos/1/devolver/
```

### Passo 4 — Converter para CBV (40 min)

Reescreva `obra_list` e `obra_detail` como `ListView` e `DetailView`, mantendo o mesmo
comportamento (busca, filtro, paginação, otimização de consultas). Depois compare:

| Critério | FBV | CBV |
|---|---|---|
| Linhas de código | | |
| O que está explícito | | |
| O que está implícito | | |
| Facilidade para adicionar "só bibliotecários acessam" | | |
| Legibilidade para quem nunca viu Django | | |

Escreva sua conclusão em 5 linhas. **Não existe resposta certa** — existe justificativa.

### Passo 5 — Middleware de tempo de resposta (20 min)

Implemente o `TempoDeRespostaMiddleware` da teoria, registre-o em `settings.MIDDLEWARE` e
confirme com `curl -I` que o cabeçalho `X-Tempo-ms` aparece. Provoque uma resposta lenta
(`time.sleep(0.6)` numa view) e veja o log de aviso.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| URL literal no template | `{% url 'app:nome' %}` |
| Padrão genérico antes do específico | Reordene o `urlpatterns` |
| `Obra.objects.get()` sem tratamento | `get_object_or_404()` |
| Não redirecionar após POST | Aplique PRG |
| Alterar dados em GET | Use POST + `@require_POST` |
| Regra de negócio na view | Model ou `services.py` |
| Esquecer `select_related` na view de lista | N+1 na página inteira |
| `reverse()` em atributo de classe | Use `reverse_lazy` |
| View retornando `None` | Falta `return` |
| Confiar em `request.GET` sem validar | Toda entrada externa é suspeita (M11) |

## ✅ Checklist de saída

- [ ] URLs com namespace, todas nomeadas
- [ ] Ao menos uma view com `int`, uma com `slug` e uma sem parâmetro
- [ ] Mesma funcionalidade implementada como FBV e como CBV, com comparação escrita
- [ ] Busca com filtros combinados e paginação funcionando
- [ ] Ação de escrita apenas por POST, com PRG e mensagem de feedback
- [ ] `get_absolute_url()` implementado nos models principais
- [ ] Nenhuma URL literal no código ou nos templates
- [ ] Middleware próprio funcionando

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [Django — Despachante de URLs](https://docs.djangoproject.com/pt-br/5.0/topics/http/urls/)
- [Django — Views](https://docs.djangoproject.com/pt-br/5.0/topics/http/views/)
- [Django — Class-based views](https://docs.djangoproject.com/en/5.0/topics/class-based-views/)
- [Classy Class-Based Views](https://ccbv.co.uk/) — o que cada CBV realmente faz
