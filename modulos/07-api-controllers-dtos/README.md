# M07 — API: mapeamento de URLs, views e serializers

> **CH:** 6h (3h teóricas · 3h práticas) · **Semanas 6–7** · **Pré-requisitos:** M02, M06
> **Ementa:** *Views: Mapeamento de URLs; Criação de classes / métodos / funções para
> processamento de requisições.* (+ *operações CRUD a partir da API do framework*)

O módulo que fecha o backend. Ao final dele existe uma API real, documentada e testável —
que é o **pré-requisito para o frontend começar** na semana 8.

## 🎯 Objetivos

1. Mapear URLs para views com parâmetros tipados, prefixos, namespaces e routers.
2. Escrever views como **função**, como **classe** (`APIView`) e como **ViewSet**, sabendo
   quando usar cada uma.
3. Serializar e **validar** dados com `Serializer` e `ModelSerializer`.
4. Implementar filtros, busca, ordenação e paginação.
5. Gerar documentação OpenAPI e tipos TypeScript a partir do código.

---

## 📖 Teoria (3h)

### 1. Mapeamento de URLs (30 min)

#### O grafo de URLconfs

```
config/urls.py                                (raiz, apontada por ROOT_URLCONF)
├── path("admin/", admin.site.urls)
├── path("api/", include("acervo.urls"))      -> /api/obras/, /api/obras/42/
└── path("api/schema/", SpectacularAPIView)   -> OpenAPI
```

```python
# acervo/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("obras", views.ObraViewSet, basename="obra")
router.register("autores", views.AutorViewSet, basename="autor")
router.register("emprestimos", views.EmprestimoViewSet, basename="emprestimo")

app_name = "acervo"

urlpatterns = [
    path("", include(router.urls)),
    path("relatorios/acervo/", views.relatorio_acervo, name="relatorio_acervo"),
]
```

**Uma linha de `router.register` gera seis rotas:**

| Rota | Método | Ação do ViewSet | Status |
|---|---|---|---|
| `/api/obras/` | GET | `list` | 200 |
| `/api/obras/` | POST | `create` | 201 |
| `/api/obras/{id}/` | GET | `retrieve` | 200 |
| `/api/obras/{id}/` | PUT | `update` | 200 |
| `/api/obras/{id}/` | PATCH | `partial_update` | 200 |
| `/api/obras/{id}/` | DELETE | `destroy` | 204 |

É o contrato do M02 materializado — e é por isso que o contrato vem antes: o router
**impõe** a convenção de recurso + método, e desvios ficam evidentes.

#### Converters (rotas fora do router)

| Converter | Casa com | Exemplo |
|---|---|---|
| `str` | Texto sem `/` | `<str:slug>` |
| `int` | Dígitos | `<int:pk>` |
| `slug` | `a-z0-9-_` | `<slug:slug>` |
| `uuid` | UUID | `<uuid:id>` |
| `path` | Texto **com** `/` | `<path:arquivo>` |

O Django testa os padrões **na ordem**; padrão genérico antes de específico esconde o
específico:

```python
# ❌ /api/obras/destaques/ nunca é alcançada
path("obras/<str:slug>/", ...),
path("obras/destaques/", ...),

# ✅ literal primeiro
path("obras/destaques/", ...),
path("obras/<str:slug>/", ...),
```

#### Nomear e reverter

```python
from django.urls import reverse
reverse("acervo:obra-detail", kwargs={"pk": 42})    # -> "/api/obras/42/"
```

O router nomeia as rotas como `<basename>-list` e `<basename>-detail`. Use `reverse()` nos
testes (M14) — nunca escreva a URL literal.

### 2. Views: três níveis de abstração (45 min) ⭐

O DRF oferece três formas de processar uma requisição. A ementa pede as três: *classes /
métodos / funções*.

#### Nível 1 — função (`@api_view`)

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def relatorio_acervo(request):
    """Tudo explícito: nenhuma convenção escondida."""
    dados = Obra.objects.aggregate(
        total_obras=Count("id"),
        total_exemplares=Count("exemplares"),
    )
    return Response(dados)
```

**Use quando:** o endpoint não é um CRUD sobre um model — relatórios, ações de domínio,
integrações.

#### Nível 2 — classe (`APIView`)

```python
from rest_framework.views import APIView


class ObraListAPIView(APIView):
    def get(self, request):
        obras = Obra.objects.select_related("autor")
        return Response(ObraSerializer(obras, many=True).data)

    def post(self, request):
        serializer = ObraCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)     # 400 automático com os erros
        obra = serializer.save()
        return Response(ObraSerializer(obra).data, status=201)
```

Organiza por **método HTTP**: um método Python por verbo. **Use quando:** o fluxo é
específico demais para um ViewSet, mas ainda é um recurso.

#### Nível 3 — `ModelViewSet`

```python
from rest_framework import viewsets


class ObraViewSet(viewsets.ModelViewSet):
    queryset = Obra.objects.select_related("autor", "editora").prefetch_related("categorias")
    serializer_class = ObraSerializer
```

Duas linhas úteis, seis rotas, paginação, validação e documentação. **Use quando:** é CRUD
padrão sobre um model — o caso da maioria dos recursos.

#### Como escolher

| Situação | Escolha |
|---|---|
| CRUD padrão de um model | **`ModelViewSet`** |
| CRUD com regras muito próprias | `ModelViewSet` + sobrescrever os métodos |
| Recurso sem model, ou fluxo peculiar | `APIView` |
| Relatório, ação, integração, healthcheck | **`@api_view`** |
| Está aprendendo o mecanismo | `@api_view` primeiro — nada é implícito |

> A regra honesta: use a abstração mais alta **que você consegue explicar**. `ModelViewSet`
> que a equipe não entende vira caixa-preta na primeira exceção. Consulte
> [cdrf.co](https://www.cdrf.co/) para ver o que cada classe realmente faz.

#### Pontos de extensão do ViewSet

```python
class ObraViewSet(viewsets.ModelViewSet):
    def get_queryset(self):          # QUE objetos esta view enxerga (controle de acesso!)
        ...
    def get_serializer_class(self):  # serializer diferente para leitura e escrita
        ...
    def perform_create(self, serializer):   # o que fazer ao salvar
        serializer.save(cadastrada_por=self.request.user)
    def get_permissions(self):       # permissões por ação
        ...
```

#### Ações customizadas

```python
from rest_framework.decorators import action


class EmprestimoViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=["post"])
    def devolver(self, request, pk=None):
        """POST /api/emprestimos/42/devolver/"""
        emprestimo = self.get_object()
        if emprestimo.devolvido_em:
            return Response({"detail": "Empréstimo já devolvido."}, status=409)
        emprestimo.devolver()
        return Response(EmprestimoSerializer(emprestimo).data)

    @action(detail=False, methods=["get"])
    def atrasados(self, request):
        """GET /api/emprestimos/atrasados/"""
        qs = self.get_queryset().filter(
            devolvido_em__isnull=True, previsao_devolucao__lt=timezone.localdate()
        )
        return Response(self.get_serializer(qs, many=True).data)
```

`detail=True` gera `/{id}/acao/`; `detail=False` gera `/acao/`.

### 3. Serializers (50 min) ⭐

O serializer faz **três** coisas: converte objeto → JSON, converte JSON → objeto e
**valida**. É o `Form` do Django, adaptado a API.

```python
from rest_framework import serializers

from .models import Obra


class AutorResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Autor
        fields = ["id", "nome"]


class ObraSerializer(serializers.ModelSerializer):
    """Leitura: relações aninhadas, campos calculados."""

    autor = AutorResumoSerializer(read_only=True)
    exemplares_total = serializers.IntegerField(read_only=True)
    exemplares_disponiveis = serializers.IntegerField(read_only=True)

    class Meta:
        model = Obra
        fields = ["id", "titulo", "subtitulo", "autor", "editora", "ano_publicacao",
                  "isbn", "sinopse", "exemplares_total", "exemplares_disponiveis"]


class ObraCreateSerializer(serializers.ModelSerializer):
    """Escrita: só ids, e só o que o cliente pode definir."""

    class Meta:
        model = Obra
        fields = ["titulo", "subtitulo", "autor", "editora", "categorias",
                  "ano_publicacao", "isbn", "sinopse"]
```

> **Aninhe na leitura, use id na escrita** — a decisão do contrato (M02) implementada. A
> tela quer `autor.nome` sem uma segunda requisição; o formulário só precisa mandar
> `autor: 7`.

```python
class ObraViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return ObraCreateSerializer
        return ObraSerializer
```

> ⚠️ **Nunca use `fields = "__all__"`.** Quando alguém adicionar `aprovada_por_admin` ao
> model, o campo aparece na API pública sem ninguém perceber. É *mass assignment* (M13).

#### Validação

O DRF valida em três níveis, na mesma ordem do `Form` do Django:

```python
class ObraCreateSerializer(serializers.ModelSerializer):

    # 1. por campo
    def validate_isbn(self, valor):
        limpo = valor.replace("-", "").replace(" ", "")
        if limpo and (not limpo.isdigit() or len(limpo) not in (10, 13)):
            raise serializers.ValidationError("O ISBN deve ter 10 ou 13 dígitos.")
        return limpo                      # SEMPRE retorne o valor (limpo)

    def validate_ano_publicacao(self, valor):
        atual = timezone.localdate().year
        if valor and valor > atual:
            raise serializers.ValidationError(f"O ano não pode ser maior que {atual}.")
        return valor

    # 2. entre campos
    def validate(self, attrs):
        if attrs.get("subtitulo") and not attrs.get("titulo"):
            raise serializers.ValidationError(
                {"titulo": "Informe o título antes do subtítulo."}
            )
        return attrs
```

Erro de validação vira, automaticamente, uma resposta **400** no formato do contrato:

```json
{
  "isbn": ["O ISBN deve ter 10 ou 13 dígitos."],
  "ano_publicacao": ["O ano não pode ser maior que 2026."]
}
```

**Validação de unicidade ao editar** — a pegadinha clássica:

```python
class Meta:
    validators = [
        serializers.UniqueTogetherValidator(
            queryset=Obra.objects.all(), fields=["titulo", "autor"],
            message="Já existe uma obra com este título para este autor.",
        )
    ]
```

O DRF exclui a própria instância automaticamente na edição — ao contrário do `Form`, onde
era preciso lembrar do `exclude(pk=self.instance.pk)`.

#### Serializer com regra de negócio

```python
class EmprestimoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emprestimo
        fields = ["exemplar", "associado"]

    def validate_exemplar(self, exemplar):
        if not exemplar.disponivel:
            raise serializers.ValidationError("Este exemplar já está emprestado.")
        return exemplar

    def validate_associado(self, associado):
        if not associado.pode_pegar_emprestado:
            raise serializers.ValidationError("Associado inativo ou no limite de empréstimos.")
        return associado
```

> A regra continua vivendo no **model** (M04); o serializer apenas a consulta e traduz para
> uma mensagem. Isso mantém a regra válida também no admin, no shell e nos comandos.

### 4. Filtros, busca, ordenação e paginação (30 min)

```bash
pip install django-filter
```

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
```

```python
class ObraViewSet(viewsets.ModelViewSet):
    filterset_fields = ["autor", "editora", "ano_publicacao", "categorias"]
    search_fields = ["titulo", "subtitulo", "isbn", "autor__nome"]
    ordering_fields = ["titulo", "ano_publicacao", "criado_em"]
    ordering = ["titulo"]
```

```
GET /api/obras/?search=casmurro&autor=7&ordering=-ano_publicacao&page=2
```

> `ordering_fields` explícito é **controle de acesso**, não estética: sem ele, o cliente
> ordena por qualquer campo, inclusive de relações, e vaza a existência e a ordem de dados
> que não deveria ver (M13).

**Paginação nunca é opcional.** Um endpoint sem paginação funciona com 50 registros e
derruba o servidor com 50.000.

### 5. Documentação e tipos (25 min) ⭐

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter


class ObraViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Lista as obras do acervo",
        parameters=[OpenApiParameter("search", str, description="Busca em título e autor")],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

```bash
python manage.py spectacular --file schema.yml     # gera o OpenAPI
```

E, no frontend, os tipos saem do mesmo schema:

```bash
cd frontend
pnpm add -D openapi-typescript
pnpm dlx openapi-typescript ../backend/schema.yml -o src/api/schema.d.ts
```

```ts
import type { components } from "./api/schema";

type Obra = components["schemas"]["Obra"];    // sempre sincronizado com o backend
```

**Por que isso importa:** renomear `titulo` no serializer muda o schema, que muda o tipo,
que faz o TypeScript **falhar na compilação**. É a defesa concreta contra o contrato
quebrado em silêncio, descrito no M02. Coloque a geração no CI (M14).

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — CRUD de Obra com ViewSet (50 min)

Implemente `ObraSerializer`, `ObraCreateSerializer` e `ObraViewSet` conforme a teoria,
registre no router e teste **todas** as seis rotas:

```bash
# Linux/macOS/WSL/Git Bash
curl http://localhost:8000/api/obras/
curl http://localhost:8000/api/obras/1/
curl -X POST http://localhost:8000/api/obras/ \
     -H "Content-Type: application/json" \
     -d '{"titulo":"Memórias Póstumas","autor":1,"ano_publicacao":1881}'
curl -X PATCH http://localhost:8000/api/obras/1/ \
     -H "Content-Type: application/json" -d '{"ano_publicacao":1899}'
curl -X DELETE http://localhost:8000/api/obras/1/ -i
```

```powershell
# Windows PowerShell. Para corpos JSON, o caminho de menor atrito e um arquivo:
'{"titulo":"Memorias Postumas","autor":1,"ano_publicacao":1881}' | Set-Content obra.json

curl.exe http://localhost:8000/api/obras/
curl.exe http://localhost:8000/api/obras/1/
curl.exe -X POST http://localhost:8000/api/obras/ -H "Content-Type: application/json" -d "@obra.json"
curl.exe -X PATCH http://localhost:8000/api/obras/1/ -H "Content-Type: application/json" -d '{\"ano_publicacao\":1899}'
curl.exe -X DELETE http://localhost:8000/api/obras/1/ -i
```

> 🪟 O PowerShell reescreve aspas duplas antes de repassar ao `curl.exe`. Use arquivo
> (`-d "@arquivo.json"`), escape com `\"`, ou rode estes comandos no **Git Bash**/**WSL**.
> Ver [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md#continuação-de-linha).

Confira o status de cada uma contra o contrato que você escreveu no M02.

### Passo 2 — Anotações e desempenho (30 min)

`exemplares_total` e `exemplares_disponiveis` não podem ser propriedades Python: isso é
N+1 (M06). Anote no queryset:

```python
class ObraViewSet(viewsets.ModelViewSet):
    queryset = (
        Obra.objects.select_related("autor", "editora")
        .prefetch_related("categorias")
        .annotate(
            exemplares_total=Count("exemplares", distinct=True),
            exemplares_disponiveis=Count(
                "exemplares",
                filter=Q(exemplares__emprestimos__devolvido_em__isnull=True),
                distinct=True,
            ),
        )
        .order_by("titulo")
    )
```

Meça com o Debug Toolbar ou `CaptureQueriesContext`: quantas consultas a listagem de 20
obras faz **antes** e **depois**? Registre.

### Passo 3 — Validação (40 min)

Implemente todas as validações da teoria e prove cada uma com `curl`:

| Teste | Esperado |
|---|---|
| `titulo` vazio | 400, `{"titulo": ["Este campo não pode ser em branco."]}` |
| `isbn: "abc"` | 400, mensagem do `validate_isbn` |
| `ano_publicacao: 2999` | 400 |
| `autor: 99999` | 400, chave estrangeira inválida |
| Campo inexistente no corpo | Ignorado silenciosamente — **por quê?** |
| `id` enviado no POST | Ignorado (`read_only`) — **por quê isso importa?** |

As duas últimas linhas são as importantes: elas mostram que o serializer é uma **lista de
permissões**, não uma peneira.

### Passo 4 — Filtros e ação customizada (30 min)

1. Configure `filterset_fields`, `search_fields` e `ordering_fields`.
2. Implemente `EmprestimoViewSet` com as ações `devolver` (detail) e `atrasados` (list).
3. Teste combinações: `?search=&ordering=&page=`.
4. Tente ordenar por um campo **fora** de `ordering_fields`. O que acontece?

### Passo 5 — Documentar e gerar tipos (30 min)

1. Anote os endpoints com `@extend_schema`.
2. Abra `/api/docs/` e navegue: os exemplos batem com a realidade?
3. Gere `schema.yml` e, no frontend, `src/api/schema.d.ts`.
4. Compare o schema gerado com o `docs/contrato-api.md` que você escreveu no M02.
   **Onde divergiram?** Corrija o que estiver errado — pode ser o contrato, pode ser o
   código.

O passo 4 é o fechamento do bloco de backend: o contrato projetado encontra o contrato
implementado.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `fields = "__all__"` | Lista explícita (*mass assignment*) |
| Propriedade Python no serializer | N+1; use `annotate` no queryset |
| Endpoint sem paginação | Configure `PAGE_SIZE` |
| `ordering` livre pelo cliente | Declare `ordering_fields` |
| `get_queryset` sem filtro por usuário | IDOR (M13) |
| `validate_<campo>` sem `return` | O valor vira `None` silenciosamente |
| Mesmo serializer para leitura e escrita | Expõe campos demais ou obriga aninhamento na escrita |
| Status 200 para criação | Use 201 e devolva o objeto criado |
| Regra de negócio só no serializer | Coloque no model; o serializer traduz |
| Documentação escrita à mão | Desatualiza em uma semana; gere do código |

## ✅ Checklist de saída

- [ ] CRUD completo de ao menos 2 recursos via `ModelViewSet`
- [ ] Ao menos 1 `APIView` e 1 `@api_view` implementados e justificados
- [ ] Serializers separados para leitura e escrita, com `fields` explícito
- [ ] Validação por campo e entre campos, testada com `curl`
- [ ] Ao menos 2 ações customizadas (`@action`)
- [ ] Filtros, busca, ordenação e paginação funcionando
- [ ] Nenhuma consulta N+1 (medido)
- [ ] `/api/docs/` navegável e coerente
- [ ] `schema.d.ts` gerado no frontend
- [ ] Contrato do M02 confrontado com a implementação, e divergências resolvidas

## 📦 Entrega E3 — API documentada

API do BiblioCom no ar (local) com: 2+ recursos em CRUD completo, validação de servidor,
filtros e paginação, 2 ações customizadas, documentação OpenAPI e o comparativo
contrato-projetado × contrato-implementado.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [DRF — Serializers](https://www.django-rest-framework.org/api-guide/serializers/)
- [DRF — ViewSets](https://www.django-rest-framework.org/api-guide/viewsets/)
- [DRF — Filtering](https://www.django-rest-framework.org/api-guide/filtering/)
- [Classy DRF](https://www.cdrf.co/) — o que cada classe do DRF realmente faz
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)
- [Django — Despachante de URLs](https://docs.djangoproject.com/pt-br/5.0/topics/http/urls/)
