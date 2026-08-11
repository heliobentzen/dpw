# M15 — Django Admin

> **CH:** 2h (1h teórica · 1h prática) · **Semana 15** · **Pré-requisitos:** M04, M07
> Módulo complementar (não exigido pela ementa), mas de altíssimo retorno: entrega um
> back-office funcional em minutos e é o que viabiliza o projeto extensionista sair do
> papel dentro da carga horária.

## 🎯 Objetivos

1. Configurar o admin para uso real por uma equipe não técnica.
2. Customizar listagens, filtros, buscas e formulários.
3. Implementar ações em massa e edição *inline*.
4. Reconhecer os limites do admin — e quando **não** usá-lo.

---

## 📖 Teoria (1h)

### 1. O que o admin é e o que não é

O admin é uma interface CRUD gerada a partir dos models, destinada a **pessoas de
confiança da equipe** (staff). Ele é excelente para: cadastro de dados de apoio, correção
pontual, inspeção e operação interna nos primeiros meses de um sistema.

**Ele não é:** interface para o usuário final, nem substituto de telas com regra de
negócio, nem lugar para expor dados sensíveis a quem não deveria vê-los. Todo campo do
model fica visível a quem tem acesso, e a granularidade de permissões é por model, não por
registro (a menos que você programe isso).

> No BiblioCom: a **coordenação** usa o admin (`/admin/`) para cadastrar categorias,
> editoras e corrigir dados. O **balcão** usa a SPA (M08–M11), que aplica as regras de
> empréstimo e foi desenhada para o celular. Confundir os dois papéis é o erro de projeto
> mais comum — e, numa arquitetura desacoplada, o mais caro.

**Consequência de segurança:** o admin fica no mesmo domínio da SPA e usa a mesma sessão.
Um usuário com `is_staff` acessa dados que a API talvez não exponha. Trate `is_staff` como
privilégio real, não como "acesso ao painel" (M13).

### 2. Registro básico

```python
# acervo/admin.py
from django.contrib import admin

from .models import Autor, Categoria, Editora, Emprestimo, Exemplar, Obra


@admin.register(Autor)
class AutorAdmin(admin.ModelAdmin):
    list_display = ["nome", "nascimento", "total_obras"]
    search_fields = ["nome"]
    ordering = ["nome"]

    @admin.display(description="obras", ordering="_total")
    def total_obras(self, obj):
        return obj._total

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_total=Count("obras"))
```

### 3. Opções mais usadas

```python
@admin.register(Obra)
class ObraAdmin(admin.ModelAdmin):
    # listagem
    list_display = ["titulo", "autor", "ano_publicacao", "disponiveis", "criado_em"]
    list_display_links = ["titulo"]
    list_filter = ["categorias", "editora", "ano_publicacao"]
    search_fields = ["titulo", "subtitulo", "isbn", "autor__nome"]
    list_select_related = ["autor", "editora"]        # evita N+1 na listagem
    list_per_page = 50
    date_hierarchy = "criado_em"
    ordering = ["titulo"]
    list_editable = ["ano_publicacao"]                # edição direta na lista

    # formulário
    fieldsets = [
        ("Identificação", {"fields": ["titulo", "subtitulo", "isbn"]}),
        ("Autoria e publicação", {"fields": ["autor", "editora", "ano_publicacao"]}),
        ("Classificação", {"fields": ["categorias"]}),
        ("Descrição", {"fields": ["sinopse"], "classes": ["collapse"]}),
    ]
    filter_horizontal = ["categorias"]                # widget melhor para M2M
    autocomplete_fields = ["autor", "editora"]        # busca em vez de <select> gigante
    readonly_fields = ["criado_em", "atualizado_em"]
    prepopulated_fields = {"slug": ("titulo",)}
    save_on_top = True
```

`autocomplete_fields` exige `search_fields` no admin do model referenciado — e resolve o
problema real de um `<select>` com 20.000 opções travando o navegador.

### 4. Inlines

```python
class ExemplarInline(admin.TabularInline):        # ou StackedInline
    model = Exemplar
    extra = 1
    fields = ["tombo", "estado", "adquirido_em"]
    show_change_link = True


@admin.register(Obra)
class ObraAdmin(admin.ModelAdmin):
    inlines = [ExemplarInline]
```

Cadastra obra e exemplares na mesma tela.

### 5. Ações em massa

```python
@admin.action(description="Marcar exemplares selecionados como desgastados")
def marcar_desgastado(modeladmin, request, queryset):
    atualizados = queryset.update(estado=Exemplar.Estado.DESGASTADO)
    modeladmin.message_user(request, f"{atualizados} exemplar(es) atualizado(s).")


@admin.register(Exemplar)
class ExemplarAdmin(admin.ModelAdmin):
    actions = [marcar_desgastado]
```

### 6. Colunas calculadas e formatadas

```python
@admin.display(description="Situação", boolean=False)
def situacao(self, obj):
    if obj.devolvido_em:
        return format_html('<span style="color:green">Devolvido</span>')
    if obj.esta_atrasado:
        return format_html('<b style="color:#b91c1c">Atrasado ({} dias)</b>', obj.dias_de_atraso)
    return "Ativo"
```

> Use `format_html` — nunca concatenação de strings — para gerar HTML no admin. Ela escapa
> os argumentos automaticamente. `mark_safe` sobre dado do usuário é XSS.

### 7. Restringir o que cada pessoa vê

```python
class EmprestimoAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(registrado_por=request.user)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser       # ninguém mais apaga histórico
```

### 8. Personalizar a identidade

```python
# config/urls.py ou config/admin.py
admin.site.site_header = "BiblioCom — Administração"
admin.site.site_title = "BiblioCom"
admin.site.index_title = "Painel de gestão"
```

---

## 🛠️ Roteiro prático (1h)

### Passo 1 — Superusuário e registro (10 min)

```bash
python manage.py createsuperuser
python manage.py runserver
```

```python
# acervo/admin.py
from django.contrib import admin
from .models import Autor, Categoria, Editora, Exemplar, Obra, Associado, Emprestimo

admin.site.register([Autor, Categoria, Editora, Exemplar, Obra, Associado, Emprestimo])
```

Acesse `/admin/` e navegue. Note como está **inutilizável** para volume real: listas sem
colunas úteis, sem busca, sem filtro.

### Passo 2 — Tornar o admin utilizável (30 min)

Configure `ObraAdmin`, `ExemplarAdmin`, `AssociadoAdmin` e `EmprestimoAdmin` com
`list_display`, `list_filter`, `search_fields`, `list_select_related`,
`autocomplete_fields` e `date_hierarchy`.

Meça o antes e o depois com o Debug Toolbar: quantas consultas a listagem de obras fazia
sem `list_select_related` e quantas faz depois?

### Passo 3 — Inline, ação e coluna calculada (20 min)

1. `ExemplarInline` dentro de `ObraAdmin`.
2. Ação "Registrar devolução" em `EmprestimoAdmin`, que só afeta empréstimos em aberto e
   informa quantos foram processados.
3. Coluna `situacao` colorida em `EmprestimoAdmin`.
4. Bloqueie a exclusão de empréstimos para não superusuários.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Usar o admin como sistema do usuário final | Construa telas próprias com as regras |
| Listagem lenta | `list_select_related` e `list_per_page` |
| `<select>` com milhares de itens | `autocomplete_fields` |
| `mark_safe` com dado do usuário | `format_html` |
| Dar `is_staff` a todo mundo | Permissões por grupo (M12) |
| Deixar `/admin/` na URL padrão em produção | Mude o caminho e restrinja acesso (M13) |

## ✅ Checklist de saída

- [ ] Todos os models registrados com admin customizado
- [ ] Listagens com colunas úteis, filtros e busca
- [ ] `list_select_related` aplicado, com medição antes/depois
- [ ] Ao menos 1 inline, 1 ação em massa e 1 coluna calculada
- [ ] Exclusão de dados históricos restrita
- [ ] Cabeçalho e títulos personalizados

## 🧪 Exercícios rápidos

1. Configure o admin de forma que uma pessoa da coordenação consiga, em **até 3 cliques**,
   descobrir todos os empréstimos em atraso de um associado específico.
2. Crie uma ação que exporte a seleção em CSV (`HttpResponse` com
   `Content-Disposition: attachment`).
3. Adicione um filtro customizado (`admin.SimpleListFilter`) "Situação do empréstimo" com
   as opções Ativo / Atrasado / Devolvido.
4. Faça a listagem de obras exibir a quantidade de exemplares disponíveis, ordenável, sem
   gerar N+1 (dica: `annotate` no `get_queryset`).

## 📚 Para aprofundar

- [Django — The Django admin site](https://docs.djangoproject.com/pt-br/5.0/ref/contrib/admin/)
- [Django — Admin actions](https://docs.djangoproject.com/en/5.0/ref/contrib/admin/actions/)
- [django-import-export](https://django-import-export.readthedocs.io/) — importação/exportação em planilha
