# M07 — Cheatsheet: URLs, Views e Serializers (DRF)

## URLconf e router

```python
# config/urls.py
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("acervo.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
```

```python
# acervo/urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("obras", views.ObraViewSet, basename="obra")

app_name = "acervo"
urlpatterns = [
    path("", include(router.urls)),
    path("relatorios/acervo/", views.relatorio_acervo, name="relatorio_acervo"),
]
```

Rotas geradas: `obra-list` (`/obras/`) e `obra-detail` (`/obras/{pk}/`).
Ações customizadas viram `obra-<nome-da-acao>`.

### Converters

| | Casa com |
|---|---|
| `<str:x>` | texto sem `/` |
| `<int:x>` | dígitos |
| `<slug:x>` | `a-z0-9-_` |
| `<uuid:x>` | UUID |
| `<path:x>` | texto **com** `/` |

## Views — três níveis

```python
# função
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def minha_view(request):
    if request.method == "POST":
        ...
    return Response({...}, status=200)

# classe
class MinhaAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request): ...
    def post(self, request): ...

# viewset
class ObraViewSet(viewsets.ModelViewSet):
    queryset = Obra.objects.all()
    serializer_class = ObraSerializer
```

### Variantes de ViewSet

| Classe | Ações |
|---|---|
| `ModelViewSet` | list, create, retrieve, update, partial_update, destroy |
| `ReadOnlyModelViewSet` | list, retrieve |
| `GenericViewSet` + mixins | escolha as ações |

```python
class ObraViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    ...
```

### Pontos de extensão

```python
class ObraViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.eh_equipe:
            qs = qs.filter(publicada=True)       # controle de acesso
        return qs

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return ObraCreateSerializer
        return ObraSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(cadastrada_por=self.request.user)   # servidor decide

    def perform_destroy(self, instance):
        instance.excluida_em = timezone.now()               # exclusão lógica
        instance.save(update_fields=["excluida_em"])
```

### Ações customizadas

```python
@action(detail=True, methods=["post"])
def devolver(self, request, pk=None):        # POST /api/emprestimos/42/devolver/
    ...

@action(detail=False, methods=["get"], url_path="em-atraso")
def atrasados(self, request):                 # GET /api/emprestimos/em-atraso/
    ...
```

## Serializers

```python
class ObraSerializer(serializers.ModelSerializer):
    autor = AutorResumoSerializer(read_only=True)          # aninhado na leitura
    autor_id = serializers.PrimaryKeyRelatedField(
        queryset=Autor.objects.all(), source="autor", write_only=True
    )
    disponiveis = serializers.IntegerField(read_only=True)  # vem do annotate
    url = serializers.HyperlinkedIdentityField(view_name="acervo:obra-detail")

    class Meta:
        model = Obra
        fields = ["id", "titulo", "autor", "autor_id", "disponiveis", "url"]
        read_only_fields = ["id"]
        extra_kwargs = {"isbn": {"required": False}}
```

### Tipos de campo

```python
serializers.CharField(max_length=200, allow_blank=True, trim_whitespace=True)
serializers.IntegerField(min_value=0, max_value=100)
serializers.DecimalField(max_digits=8, decimal_places=2)   # dinheiro: vira string no JSON
serializers.BooleanField(default=False)
serializers.DateField() / DateTimeField()
serializers.ChoiceField(choices=Situacao.choices)
serializers.EmailField() / URLField() / UUIDField()
serializers.ImageField() / FileField()
serializers.SerializerMethodField()          # calculado; cuidado com N+1
serializers.PrimaryKeyRelatedField(queryset=...)
serializers.SlugRelatedField(slug_field="nome", queryset=...)
serializers.StringRelatedField()             # usa __str__
```

```python
def get_situacao(self, obj):                 # para SerializerMethodField
    return "atrasado" if obj.esta_atrasado else "ok"
```

### Validação

```python
def validate_<campo>(self, valor):    # 1. por campo
    if ...: raise serializers.ValidationError("mensagem")
    return valor                       # SEMPRE retorne

def validate(self, attrs):            # 2. entre campos
    if attrs["fim"] < attrs["inicio"]:
        raise serializers.ValidationError({"fim": "Deve ser após o início."})
    return attrs

class Meta:                            # 3. declarativa
    validators = [
        UniqueTogetherValidator(queryset=Obra.objects.all(), fields=["titulo", "autor"])
    ]
```

```python
serializer.is_valid(raise_exception=True)     # 400 automático no formato do contrato
serializer.validated_data
serializer.errors
```

## Permissões

```python
from rest_framework.permissions import (AllowAny, IsAuthenticated, IsAdminUser,
                                        IsAuthenticatedOrReadOnly, BasePermission)

class EhEquipeOuSomenteLeitura(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.is_authenticated and request.user.eh_equipe

    def has_object_permission(self, request, view, obj):
        return request.user.eh_equipe or obj.associado.user_id == request.user.id
```

## Filtros, busca, ordenação, paginação

```python
class ObraViewSet(viewsets.ModelViewSet):
    filterset_fields = ["autor", "ano_publicacao"]
    search_fields = ["titulo", "autor__nome"]        # ?search=
    ordering_fields = ["titulo", "ano_publicacao"]   # ?ordering= (lista de permissões!)
    ordering = ["titulo"]
```

```python
# filtro customizado
import django_filters

class ObraFilter(django_filters.FilterSet):
    ano_min = django_filters.NumberFilter(field_name="ano_publicacao", lookup_expr="gte")
    ano_max = django_filters.NumberFilter(field_name="ano_publicacao", lookup_expr="lte")
    disponivel = django_filters.BooleanFilter(method="filtrar_disponivel")

    class Meta:
        model = Obra
        fields = ["autor", "ano_min", "ano_max", "disponivel"]

    def filtrar_disponivel(self, queryset, name, value):
        ...
```

```python
class PaginacaoPadrao(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100                    # limite: senão o cliente pede tudo
```

## Status e respostas

```python
from rest_framework import status
from rest_framework.response import Response

Response(dados)                                     # 200
Response(dados, status=status.HTTP_201_CREATED)
Response(status=status.HTTP_204_NO_CONTENT)
Response({"detail": "..."}, status=status.HTTP_409_CONFLICT)

from rest_framework.exceptions import (ValidationError, NotFound, PermissionDenied,
                                       NotAuthenticated, Throttled)
raise NotFound("Obra não encontrada.")
raise PermissionDenied("Você não pode alterar esta obra.")
```

| Situação | Status |
|---|---|
| Leitura ok | 200 |
| Criado | 201 |
| Removido / sem corpo | 204 |
| Dados inválidos | 400 |
| Não autenticado | 401 |
| Autenticado, sem permissão | 403 |
| Não existe (ou não é seu) | 404 |
| Conflito de estado | 409 |
| Excesso de requisições | 429 |

## Documentação e tipos

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

@extend_schema(
    summary="...",
    parameters=[OpenApiParameter("search", str)],
    responses={200: ObraSerializer(many=True)},
    examples=[OpenApiExample("Exemplo", value={"titulo": "Dom Casmurro"})],
)
```

```bash
python manage.py spectacular --file schema.yml
pnpm dlx openapi-typescript ../backend/schema.yml -o src/api/schema.d.ts
```

## Anti-padrões

| ❌ | ✅ |
|---|---|
| `fields = "__all__"` | lista explícita |
| `SerializerMethodField` que consulta o banco | `annotate` no queryset |
| Endpoint sem paginação | `PAGE_SIZE` + `max_page_size` |
| `ordering` livre | `ordering_fields` declarado |
| `get_queryset` sem filtrar por usuário | filtre — evita IDOR |
| Mesmo serializer para ler e escrever | dois serializers |
| Campo sensível vindo do cliente | `perform_create(serializer.save(user=...))` |
| 200 para tudo | status correto por situação |
