# M12 — Autenticação e gestão de usuários

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 12** · **Pré-requisitos:** M07, M10, M11
> **Ementa:** *Tópicos relevantes: Gestão de usuários.*

Primeiro módulo genuinamente **ponta a ponta**: a mesma funcionalidade atravessa banco,
API, cache do cliente, roteamento e interface.

## 🎯 Objetivos

1. Distinguir autenticação de autorização e implementar as duas nas duas camadas.
2. Escolher o mecanismo de autenticação **pelo modelo de ameaça**, não pela moda.
3. Estender o model de usuário e implementar o fluxo completo de gestão.
4. Modelar papéis com grupos e permissões, incluindo autorização por objeto.
5. Proteger rotas no cliente sabendo que isso **não** é segurança.

---

## 📖 Teoria (2h)

### 1. Autenticação × autorização (10 min)

| | Autenticação | Autorização |
|---|---|---|
| Pergunta | *Quem é você?* | *O que você pode fazer?* |
| Falha | `401` | `403` |
| Backend | `authenticate()`, sessão | `permission_classes`, `get_queryset` |
| Frontend | Tela de login, contexto de sessão | Esconder o que não pode usar |

Papéis do BiblioCom:

```
anônimo        → consulta o catálogo público
associado      → vê o próprio histórico, faz reserva
bibliotecário  → registra empréstimo/devolução, cadastra obras
coordenação    → tudo + relatórios + gestão de usuários
```

### 2. Sessão × token: a decisão (35 min) ⭐

Este é o ponto do curso em que uma decisão de arquitetura tem consequência direta de
segurança. Três opções reais:

| | Sessão + cookie `HttpOnly` | JWT em `localStorage` | JWT em cookie `HttpOnly` |
|---|---|---|---|
| Onde fica o segredo | No servidor; o cookie é só um id | No navegador, legível por JS | No navegador, ilegível por JS |
| **XSS rouba a sessão?** | ❌ Não | ✅ **Sim, trivialmente** | ❌ Não |
| Precisa de CSRF? | ✅ Sim | ❌ Não | ✅ Sim |
| Revogar acesso agora | ✅ Apagar a sessão | ❌ Difícil (só com lista de revogação) | ❌ Difícil |
| Funciona entre domínios | Com CORS + credenciais | ✅ Naturalmente | Com CORS + credenciais |
| Serve app mobile | Desajeitado | ✅ Sim | Desajeitado |
| Complexidade | Baixa (nativo do Django) | Média (refresh, expiração) | Alta |

**A escolha do material: sessão com cookie `HttpOnly`**, com SPA e API sob o **mesmo site**
([ADR-07](../../docs/decisoes-tecnicas.md#adr-07--autenticação-por-sessão-com-cookie-não-jwt-em-localstorage)).

O raciocínio, que é o que importa aprender:

> A maioria dos tutoriais ensina JWT em `localStorage` porque é o mais fácil de fazer
> funcionar. Mas `localStorage` é legível por **qualquer** JavaScript que rode na página —
> inclusive o de um XSS, ou o de uma dependência do npm comprometida. Um cookie `HttpOnly`
> não é. Como o BiblioCom não tem app mobile nem consumidor de outro domínio, o argumento
> a favor do JWT ("stateless", "escala") não se aplica, e o custo (roubo de sessão via XSS,
> revogação difícil) é real.
>
> **JWT é a escolha certa quando há app mobile ou cliente de outro domínio.** Aí o
> *trade-off* muda, e a mitigação passa a ser: expiração curta, *refresh token* em cookie
> `HttpOnly` e lista de revogação.

Decidir pelo modelo de ameaça — e não pelo que é mais comum no YouTube — é a competência
que este módulo quer instalar.

### 3. Estendendo o usuário (20 min)

| Estratégia | Quando | Custo |
|---|---|---|
| Perfil `OneToOne` | Projeto já em produção | Baixo; exige `select_related` |
| **`AbstractUser`** | **Projeto novo** | Baixo, **se feito antes da 1ª migração** |
| `AbstractBaseUser` | Login por e-mail/CPF, requisitos incomuns | Alto |

> ⚠️ **Decida antes da primeira migração.** Trocar `AUTH_USER_MODEL` com o banco criado é
> uma das operações mais dolorosas do Django.

```python
# contas/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    class Papel(models.TextChoices):
        ASSOCIADO = "ASSOCIADO", "Associado"
        BIBLIOTECARIO = "BIBLIOTECARIO", "Bibliotecário"
        COORDENACAO = "COORDENACAO", "Coordenação"

    papel = models.CharField(max_length=15, choices=Papel.choices, default=Papel.ASSOCIADO)
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField("e-mail", unique=True)

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def eh_equipe(self) -> bool:
        return self.papel in {self.Papel.BIBLIOTECARIO, self.Papel.COORDENACAO}
```

```python
AUTH_USER_MODEL = "contas.Usuario"
```

No código, **nunca** importe `User` direto: use `settings.AUTH_USER_MODEL` em models e
`get_user_model()` em views e scripts.

**Senhas** nunca são armazenadas — guarda-se um hash lento com sal:

```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
```
```python
user.set_password("nova")     # ✅ hasheia
user.password = "nova"        # ❌ grava texto puro — nunca
```

### 4. Endpoints de sessão (25 min)

```python
# contas/api.py
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    usuario = authenticate(
        request,
        username=request.data.get("username"),
        password=request.data.get("password"),
    )
    if usuario is None:
        # mensagem única: revelar "usuário não existe" permite enumerar contas
        return Response({"detail": "Credenciais inválidas."}, status=401)

    login(request, usuario)        # rotaciona a sessão (defesa contra session fixation)
    return Response(UsuarioSerializer(usuario).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=204)


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def eu_view(request):
    """Quem é o usuário atual? Também entrega o cookie CSRF ao carregar a SPA."""
    if not request.user.is_authenticated:
        return Response({"detail": "Não autenticado."}, status=401)
    return Response(UsuarioSerializer(request.user).data)
```

**O CSRF na SPA.** Com autenticação por sessão, o CSRF continua necessário (M13). O fluxo:

1. A SPA chama `GET /api/auth/eu/` ao iniciar → o servidor devolve o cookie `csrftoken`.
2. Em toda escrita, o cliente lê esse cookie e o envia no cabeçalho `X-CSRFToken`.

```ts
// src/api/client.ts
function lerCookie(nome: string): string | null {
  return document.cookie.split("; ").find((c) => c.startsWith(`${nome}=`))?.split("=")[1] ?? null;
}

export async function api<T>(caminho: string, init?: RequestInit): Promise<T> {
  const metodo = (init?.method ?? "GET").toUpperCase();
  const precisaCsrf = !["GET", "HEAD", "OPTIONS"].includes(metodo);

  const r = await fetch(`/api${caminho}`, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(precisaCsrf ? { "X-CSRFToken": lerCookie("csrftoken") ?? "" } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!r.ok) throw new ApiError(r.status, await r.json().catch(() => null));
  return r.status === 204 ? (null as T) : r.json();
}
```

> Note que o cookie `csrftoken` **não** é `HttpOnly` — ele precisa ser lido pelo JS. Isso é
> seguro porque ele não autentica ninguém sozinho: a autenticação está no `sessionid`, que
> **é** `HttpOnly`. Os dois cookies têm papéis diferentes.

### 5. Autorização em quatro níveis (25 min)

#### Nível 1 — exigir autenticação

```python
class ObraViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
```

#### Nível 2 — permissões por papel

```python
class EhEquipeOuSomenteLeitura(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.eh_equipe
```

#### Nível 3 — permissões do Django, por grupo

```python
# contas/management/commands/criar_grupos.py
PAPEIS = {
    "Associado": ["view_obra", "view_exemplar"],
    "Bibliotecario": ["view_obra", "add_obra", "change_obra", "add_emprestimo",
                      "registrar_devolucao", "view_associado", "add_associado"],
    "Coordenacao": "__all__",
}
```

Comando versionado > cliques no admin: reprodutível em qualquer ambiente e no CI.

#### Nível 4 — autorização por objeto ⭐

Permissão de model diz "pode ver empréstimos". Não diz "pode ver **este** empréstimo".

```python
class EmprestimoViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = Emprestimo.objects.select_related("exemplar__obra", "associado")
        if self.request.user.eh_equipe:
            return qs
        return qs.filter(associado__user=self.request.user)
```

**Filtrar o queryset** é melhor que checar depois: quem tenta `/api/emprestimos/999/` de
outra pessoa recebe **404**, e não descobre nem que o registro existe. É a defesa contra
**IDOR** (M13).

### 6. Sessão no cliente (25 min)

```tsx
// src/auth/AuthContext.tsx
import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Usuario = { id: number; username: string; papel: string; eh_equipe: boolean };

const AuthContext = createContext<{
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (c: { username: string; password: string }) => Promise<void>;
  sair: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: usuario, isPending } = useQuery({
    queryKey: ["eu"],
    queryFn: () => api<Usuario>("/auth/eu/"),
    retry: false,                                  // 401 não é para repetir
    staleTime: 5 * 60_000,
  });

  const entrarMut = useMutation({
    mutationFn: (c: { username: string; password: string }) =>
      api<Usuario>("/auth/login/", { method: "POST", body: JSON.stringify(c) }),
    onSuccess: (u) => queryClient.setQueryData(["eu"], u),
  });

  const sairMut = useMutation({
    mutationFn: () => api<null>("/auth/logout/", { method: "POST" }),
    onSuccess: () => queryClient.clear(),          // limpa TODO o cache: dados de outra pessoa
  });

  return (
    <AuthContext.Provider
      value={{
        usuario: usuario ?? null,
        carregando: isPending,
        entrar: async (c) => { await entrarMut.mutateAsync(c); },
        sair: async () => { await sairMut.mutateAsync(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
```

> `queryClient.clear()` no logout **não é detalhe**. Sem ele, o cache continua com os dados
> da pessoa anterior — e o próximo login num computador compartilhado (balcão da
> biblioteca!) exibe informações que não deveria.

```tsx
// src/auth/RotaProtegida.tsx
import { Navigate, Outlet, useLocation } from "react-router";

export function RotaProtegida({ papeis }: { papeis?: string[] }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <Carregando />;          // não pisca o login para quem está logado
  if (!usuario) return <Navigate to="/login" state={{ de: local.pathname }} replace />;
  if (papeis && !papeis.includes(usuario.papel)) return <SemPermissao />;

  return <Outlet />;
}
```

> ⚠️ **`RotaProtegida` não é segurança.** O código está no *bundle* que qualquer pessoa
> baixa, e a API pode ser chamada por `curl`. Ela é **experiência do usuário**: evita
> mostrar telas que resultariam em 403. A proteção real está nas `permission_classes` e no
> `get_queryset` do DRF. Prove isso no roteiro prático.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Model de usuário e grupos (40 min)

> Se o projeto já tem migrações, o caminho de menor dor **em desenvolvimento** é: criar o
> app, definir `AUTH_USER_MODEL`, apagar o banco e as migrações dos apps próprios, migrar
> do zero. Faça agora — não em produção.

```bash
cd backend && python manage.py startapp contas
```

Implemente `Usuario`, configure `AUTH_USER_MODEL`, migre, crie o superusuário e o comando
`criar_grupos`. Crie 3 usuários de teste, um por papel.

### Passo 2 — Endpoints de sessão (40 min)

Implemente `login`, `logout` e `eu` conforme a teoria. Teste com `curl`, guardando cookies:

```bash
# obtém o cookie CSRF
curl -c cookies.txt http://localhost:8000/api/auth/eu/ -i

# login (precisa do cabeçalho CSRF)
CSRF=$(grep csrftoken cookies.txt | awk '{print $7}')
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
     -d '{"username":"bib","password":"senha-de-teste-123"}' -i

# agora autenticado
curl -b cookies.txt http://localhost:8000/api/auth/eu/

# logout
curl -b cookies.txt -X POST http://localhost:8000/api/auth/logout/ -H "X-CSRFToken: $CSRF" -i
```

Teste também: senha errada, usuário inexistente (**a mensagem é a mesma?**) e POST sem
`X-CSRFToken` (deve dar 403).

### Passo 3 — Autorização no backend (40 min)

Aplique os quatro níveis:

| Recurso | Regra |
|---|---|
| `GET /api/obras/` | público |
| `POST/PATCH/DELETE /api/obras/` | só equipe |
| `GET /api/emprestimos/` | equipe vê tudo; associado vê só os seus |
| `GET /api/emprestimos/{id}/` | **404** se não for seu |
| `POST /api/emprestimos/` | só equipe |
| `GET /api/relatorios/` | só coordenação |

### Passo 4 — Sessão no cliente (40 min)

Implemente `AuthProvider`, `useAuth`, `RotaProtegida` e a página de login (com React Hook
Form + Zod, do M11). Requisitos:

- ao entrar, volta para a rota pretendida (`state.de`)
- o cabeçalho mostra o nome e o botão "Sair"
- links de ações que a pessoa não pode fazer não aparecem
- o logout limpa o cache e volta para o início

### Passo 5 — Matriz de acesso, verificada nas duas camadas (20 min) ⭐

Preencha executando **cada** célula. Duas colunas por caso: o que a **interface** faz e o
que a **API** responde.

| Rota | Anônimo | Associado | Bibliotecário | Coordenação |
|---|---|---|---|---|
| `GET /api/obras/` | 200 | 200 | 200 | 200 |
| `POST /api/obras/` | 401 | 403 | 201 | 201 |
| `GET /api/emprestimos/` | 401 | só os seus | todos | todos |
| `GET /api/emprestimos/{de-outro}/` | 401 | **404** | 200 | 200 |
| `POST /api/emprestimos/` | 401 | 403 | 201 | 201 |
| `GET /api/relatorios/` | 401 | 403 | 403 | 200 |

**Agora o teste que fecha o módulo:** logado como associado, chame `POST /api/obras/` com
`curl`, ignorando completamente a interface.

```bash
curl -b cookies-associado.txt -X POST http://localhost:8000/api/obras/ \
     -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
     -d '{"titulo":"Invasão"}' -i
```

Se vier **403**, sua segurança está no lugar certo. Se vier **201**, você estava confiando
no `RotaProtegida` — e acabou de descobrir por que ele não é segurança.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `user.password = "x"` | `user.set_password("x")` |
| Trocar `AUTH_USER_MODEL` após a 1ª migração | Decida antes |
| JWT em `localStorage` "porque é mais fácil" | Decida pelo modelo de ameaça |
| Mensagem de login que revela se o usuário existe | Mensagem única |
| Só esconder o link no React | Proteja a API |
| Permissão de model sem checagem de objeto | Filtre o queryset (IDOR) |
| Logout sem `queryClient.clear()` | Cache com dados da pessoa anterior |
| `retry` na query `/auth/eu/` | Repete o 401 três vezes |
| Faltou `X-CSRFToken` na escrita | 403 em todo POST |
| `credentials` ausente no `fetch` | O cookie não é enviado |
| Piscar a tela de login para quem está logado | Trate o estado `carregando` |

## ✅ Checklist de saída

- [ ] `AUTH_USER_MODEL` customizado, migrado desde o início
- [ ] Argon2 configurado; nenhuma senha em texto puro
- [ ] `login`, `logout` e `eu` funcionando, testados com `curl`
- [ ] CSRF funcionando na SPA (cookie lido, cabeçalho enviado)
- [ ] 3 grupos criados por comando versionado
- [ ] Autorização nos 4 níveis, com queryset filtrado por usuário
- [ ] `AuthProvider`, `RotaProtegida` e página de login funcionando
- [ ] Logout limpa o cache do Query
- [ ] Matriz de acesso verificada nas duas camadas
- [ ] **Provei com `curl` que a API recusa o que a interface esconde**

## 📦 Entrega E5 — Autenticação ponta a ponta

Sistema com login, 3 papéis, rotas protegidas no cliente, autorização real no servidor e a
matriz de acesso verificada — incluindo a evidência do teste com `curl` ignorando a
interface.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Autenticação](https://docs.djangoproject.com/pt-br/5.0/topics/auth/)
- [Django — Customizando autenticação](https://docs.djangoproject.com/en/5.0/topics/auth/customizing/)
- [DRF — Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP — JWT for Java (o raciocínio vale para qualquer stack)](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
