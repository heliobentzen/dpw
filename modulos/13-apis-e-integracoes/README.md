# M13 — APIs e integrações

> **CH:** 2h (1h teórica · 1h prática) · **Semana 15** · **Pré-requisitos:** M06, M10
> Módulo complementar. Objetivo: dar à equipe capacidade de **integrar** o sistema com o
> mundo (app mobile, planilha, outro serviço), sem transformar a disciplina em curso de API.

## 🎯 Objetivos

1. Explicar o que é uma API HTTP e quando ela se justifica.
2. Expor um endpoint JSON com Django puro e com Django REST Framework.
3. Comparar autenticação por sessão e por token.
4. Consumir uma API externa com tratamento de falha.

---

## 📖 Teoria (1h)

### 1. Quando você precisa de uma API

Você **precisa** quando: há um cliente que não é o navegador (app mobile, script, outro
sistema), quando terceiros vão integrar, ou quando o frontend é uma SPA.

Você **não precisa** quando o consumidor é a sua própria página renderizada no servidor —
nesse caso, devolver HTML (inclusive fragmentos, via HTMX) é mais simples, mais rápido de
escrever e evita duplicar regra de negócio em dois lugares.

> No BiblioCom, a API se justifica por um caso concreto: um totem de consulta na entrada da
> biblioteca e a possibilidade de a prefeitura agregar o acervo de várias bibliotecas
> comunitárias.

### 2. Princípios REST, em prático

| Recurso | Método | Significado | Status de sucesso |
|---|---|---|---|
| `/api/obras/` | GET | Lista | 200 |
| `/api/obras/` | POST | Cria | 201 + `Location` |
| `/api/obras/42/` | GET | Detalha | 200 |
| `/api/obras/42/` | PUT | Substitui | 200 |
| `/api/obras/42/` | PATCH | Atualiza parte | 200 |
| `/api/obras/42/` | DELETE | Remove | 204 |

É o M01 aplicado: substantivos na URL, verbos no método, status como contrato.

### 3. JSON com Django puro

```python
# acervo/api.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Obra


@require_GET
def obras_json(request):
    termo = request.GET.get("q", "").strip()
    qs = Obra.objects.select_related("autor").order_by("titulo")
    if termo:
        qs = qs.filter(titulo__icontains=termo)

    dados = [
        {
            "id": o.pk,
            "titulo": o.titulo,
            "autor": o.autor.nome,
            "ano": o.ano_publicacao,
            "disponiveis": o.exemplares_disponiveis,
            "url": request.build_absolute_uri(o.get_absolute_url()),
        }
        for o in qs[:100]
    ]
    return JsonResponse({"total": qs.count(), "resultados": dados})
```

Suficiente para endpoints simples e de leitura. Vira insustentável quando aparecem
escrita, validação, paginação, filtros, versionamento e documentação.

### 4. Django REST Framework

```bash
pip install djangorestframework
```

```python
# acervo/serializers.py
from rest_framework import serializers

from .models import Obra


class ObraSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source="autor.nome", read_only=True)
    disponiveis = serializers.IntegerField(source="exemplares_disponiveis", read_only=True)

    class Meta:
        model = Obra
        fields = ["id", "titulo", "subtitulo", "autor", "autor_nome",
                  "ano_publicacao", "isbn", "disponiveis"]
        read_only_fields = ["id"]
```

```python
# acervo/api.py
from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

from .models import Obra
from .serializers import ObraSerializer


class ObraViewSet(viewsets.ModelViewSet):
    queryset = Obra.objects.select_related("autor").order_by("titulo")
    serializer_class = ObraSerializer
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    filterset_fields = ["autor", "ano_publicacao"]
    search_fields = ["titulo", "isbn", "autor__nome"]
```

```python
# config/urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("obras", ObraViewSet)

urlpatterns += [path("api/", include(router.urls))]
```

Seis rotas, paginação, filtros, permissões e uma interface navegável — em ~20 linhas. É o
mesmo princípio do admin: convenção sobre configuração.

### 5. Autenticação: sessão × token

| | Sessão (cookie) | Token |
|---|---|---|
| Cliente típico | Navegador, mesmo domínio | App mobile, script, outro serviço |
| Estado | No servidor | No token (JWT) ou em tabela |
| CSRF | Necessário | Não se aplica (não é enviado automaticamente) |
| Revogação | Imediata | Difícil com JWT sem lista de revogação |
| Complexidade | Baixa | Média |

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",   # navegador
        "rest_framework.authentication.TokenAuthentication",     # integrações
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
```

```bash
curl -H "Authorization: Token 9944b09199c6..." https://bibliocom.org/api/obras/
```

> Token é credencial. Trate como senha: só por HTTPS, nunca na query string, nunca em log,
> com escopo e prazo mínimos, e revogável.

### 6. Consumir API externa

```python
import logging

import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)


def buscar_dados_por_isbn(isbn: str) -> dict | None:
    """Consulta a Open Library. Devolve None em qualquer falha — nunca quebra o cadastro."""
    try:
        r = requests.get(
            "https://openlibrary.org/api/books",
            params={"bibkeys": f"ISBN:{isbn}", "format": "json", "jscmd": "data"},
            timeout=5,                      # SEMPRE defina timeout
        )
        r.raise_for_status()
        dados = r.json().get(f"ISBN:{isbn}")
        if not dados:
            return None
        return {
            "titulo": dados.get("title", ""),
            "autores": [a["name"] for a in dados.get("authors", [])],
            "ano": (dados.get("publish_date") or "")[-4:],
        }
    except (RequestException, ValueError, KeyError):
        logger.warning("Falha ao consultar ISBN %s", isbn, exc_info=True)
        return None
```

Regras não negociáveis ao consumir serviço externo: **timeout sempre**; falha externa
**nunca** derruba sua funcionalidade; cache do que for estável; nunca chame API lenta
dentro do ciclo de requisição sem plano B.

---

## 🛠️ Roteiro prático (1h)

### Passo 1 — Endpoint de disponibilidade em Django puro (25 min)

Implemente `GET /api/disponibilidade/?q=<termo>` que devolve, para cada obra:

```json
{
  "consultado_em": "2026-08-11T14:32:07-03:00",
  "total": 2,
  "resultados": [
    {"id": 42, "titulo": "Dom Casmurro", "autor": "Machado de Assis",
     "exemplares": 3, "disponiveis": 1, "url": "https://.../obras/42/"}
  ]
}
```

Requisitos: só GET; máximo 100 resultados; nenhum dado pessoal; sem N+1 (prove com o
Debug Toolbar); testado com `curl` e com um teste automatizado.

### Passo 2 — Consumir a API por ISBN (25 min)

No formulário de cadastro de obra, ofereça "Buscar por ISBN": a pessoa digita o ISBN, o
sistema consulta a Open Library e preenche os campos.

Trate: ISBN inexistente, serviço fora do ar, timeout, resposta malformada. Em **todos** os
casos, o cadastro manual continua funcionando.

### Passo 3 — Documentar (10 min)

Escreva `docs/api.md` com: endpoints, parâmetros, exemplo de requisição e resposta, códigos
de erro e limites. Se usar DRF, gere com `drf-spectacular` (OpenAPI/Swagger).

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| API sem timeout | Uma dependência lenta derruba seu site |
| Status 200 para erro | Use o status correto |
| Token na query string | Vai para log e histórico; use cabeçalho |
| Expor todos os campos do model | Serializer com `fields` explícito |
| API sem paginação | Uma consulta traz 100.000 registros |
| Duplicar regra de negócio entre view e API | Extraia para `services.py` |
| `@csrf_exempt` para "consertar" a API | Use autenticação por token |

## ✅ Checklist de saída

- [ ] Endpoint JSON funcionando, testado e documentado
- [ ] Sem dados pessoais expostos
- [ ] Consumo de API externa com timeout e tratamento de falha
- [ ] Regra de negócio compartilhada entre view HTML e API
- [ ] `docs/api.md` escrito

## 🧪 Exercícios rápidos

1. Adicione paginação ao endpoint e documente o formato.
2. Implemente `GET /api/obras/<id>/exemplares/` com a situação de cada exemplar.
3. Implemente autenticação por token e teste com `curl`.
4. Escreva testes para os dois endpoints, incluindo o caso "termo não encontrado".
5. Compare: quantas linhas para fazer o CRUD completo em Django puro versus em DRF?

## 📚 Para aprofundar

- [Django REST Framework](https://www.django-rest-framework.org/)
- [MDN — Trabalhando com JSON](https://developer.mozilla.org/pt-BR/docs/Learn/JavaScript/Objects/JSON)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/) — OpenAPI automático
- [requests](https://requests.readthedocs.io/)
