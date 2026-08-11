# M06 — Cheatsheet: URLs e Views

## URLconf

```python
# config/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("acervo.urls")),
    path("emprestimos/", include("emprestimos.urls")),
]

if settings.DEBUG:                       # servir mídia só em desenvolvimento
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

```python
# app/urls.py
app_name = "acervo"

urlpatterns = [
    path("", views.home, name="home"),
    path("obras/", views.ObraListView.as_view(), name="obra_list"),
    path("obras/<int:pk>/", views.ObraDetailView.as_view(), name="obra_detail"),
    path("autores/<slug:slug>/", views.autor_detail, name="autor_detail"),
    re_path(r"^arquivo/(?P<ano>\d{4})/$", views.por_ano, name="por_ano"),
]
```

### Converters

| | Casa com |
|---|---|
| `<str:x>` | texto sem `/` |
| `<int:x>` | dígitos |
| `<slug:x>` | `a-z0-9-_` |
| `<uuid:x>` | UUID |
| `<path:x>` | texto **com** `/` |

### Reverter URLs

```python
from django.urls import reverse, reverse_lazy
reverse("acervo:obra_detail", kwargs={"pk": 42})
reverse("acervo:obra_detail", args=[42])
reverse_lazy("acervo:obra_list")            # em atributos de classe e settings
```

```html
{% url 'acervo:obra_detail' obra.pk %}
{% url 'acervo:obra_list' %}?q={{ termo|urlencode }}
```

```python
class Obra(models.Model):
    def get_absolute_url(self):
        return reverse("acervo:obra_detail", kwargs={"pk": self.pk})
```

## FBV

```python
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_GET, require_POST


def lista(request):
    return render(request, "app/lista.html", {"objetos": Model.objects.all()})


def detalhe(request, pk):
    obj = get_object_or_404(Model, pk=pk)
    return render(request, "app/detalhe.html", {"obj": obj})


def criar(request):
    if request.method == "POST":
        form = MeuForm(request.POST, request.FILES)
        if form.is_valid():
            obj = form.save()
            messages.success(request, "Salvo.")
            return redirect(obj)                     # PRG
    else:
        form = MeuForm()
    return render(request, "app/form.html", {"form": form})


@require_POST
def excluir(request, pk):
    get_object_or_404(Model, pk=pk).delete()
    return redirect("app:lista")
```

## CBV

```python
from django.views.generic import (ListView, DetailView, CreateView,
                                  UpdateView, DeleteView, TemplateView, FormView, View)


class ObraListView(ListView):
    model = Obra
    paginate_by = 20
    context_object_name = "obras"
    template_name = "acervo/obra_list.html"

    def get_queryset(self):
        return super().get_queryset().select_related("autor")

    def get_context_data(self, **kw):
        ctx = super().get_context_data(**kw)
        ctx["extra"] = ...
        return ctx


class ObraCreateView(CreateView):
    model = Obra
    form_class = ObraForm
    success_url = reverse_lazy("acervo:obra_list")

    def form_valid(self, form):
        form.instance.criado_por = self.request.user
        return super().form_valid(form)
```

### Convenções

| CBV | Template | Contexto |
|---|---|---|
| `ListView` | `app/model_list.html` | `object_list`, `model_list` |
| `DetailView` | `app/model_detail.html` | `object`, `model` |
| `Create/UpdateView` | `app/model_form.html` | `form`, `object` |
| `DeleteView` | `app/model_confirm_delete.html` | `object` |

### Mixins úteis

```python
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin, UserPassesTestMixin

class Minha(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    permission_required = "acervo.view_obra"
    raise_exception = True       # 403 em vez de redirecionar ao login
```

## request

```python
request.method / .path / .get_full_path()
request.GET.get("q", "") / .getlist("cat")
request.POST.get("campo")
request.FILES["arquivo"]
request.body                      # bytes crus (JSON)
request.headers["User-Agent"]
request.COOKIES.get("nome")
request.session["chave"] = valor
request.user / request.user.is_authenticated
request.is_secure()
```

## Respostas

```python
render(request, "t.html", ctx)
render(request, "t.html", ctx, status=422)
redirect("app:nome", pk=1)              # 302
redirect(obj)                            # usa get_absolute_url()
redirect("https://...", permanent=True)  # 301
JsonResponse({"ok": True})
JsonResponse([...], safe=False)
HttpResponse("texto", content_type="text/plain")
HttpResponse(status=204)
FileResponse(open(caminho, "rb"), as_attachment=True, filename="r.pdf")
StreamingHttpResponse(gerador)
raise Http404("mensagem")
raise PermissionDenied
```

## Decoradores

```python
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.cache import cache_page, never_cache
from django.contrib.auth.decorators import login_required, permission_required, user_passes_test

@require_POST
@login_required
@permission_required("acervo.add_obra", raise_exception=True)
@cache_page(60 * 15)
```

## Paginação

```python
from django.core.paginator import Paginator

paginator = Paginator(queryset, 20)
pagina = paginator.get_page(request.GET.get("page"))   # trata None e valores inválidos
```

```html
{% if pagina.has_previous %}
  <a href="?page={{ pagina.previous_page_number }}&q={{ termo|urlencode }}">Anterior</a>
{% endif %}
Página {{ pagina.number }} de {{ pagina.paginator.num_pages }}
{% if pagina.has_next %}
  <a href="?page={{ pagina.next_page_number }}&q={{ termo|urlencode }}">Próxima</a>
{% endif %}
```

## Middleware

```python
class MeuMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # antes da view
        response = self.get_response(request)
        # depois da view
        return response

    def process_exception(self, request, exception):
        ...
```

## Páginas de erro customizadas

```python
# config/urls.py
handler404 = "config.views.pagina_404"
handler500 = "config.views.pagina_500"
handler403 = "config.views.pagina_403"
```

Templates: `templates/404.html`, `500.html`, `403.html` (só aparecem com `DEBUG=False`).
