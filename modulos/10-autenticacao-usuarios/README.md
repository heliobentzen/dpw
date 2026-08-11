# M10 — Autenticação e gestão de usuários

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 12** · **Pré-requisitos:** M06, M07, M08
> **Ementa:** *Tópicos relevantes: Gestão de usuários.*

## 🎯 Objetivos

1. Distinguir autenticação de autorização e implementar as duas.
2. Usar e estender o sistema de usuários do framework, escolhendo a estratégia certa.
3. Implementar cadastro, login, logout, troca e recuperação de senha.
4. Modelar papéis com grupos e permissões, incluindo autorização por objeto.
5. Aplicar boas práticas de armazenamento de senha e política de acesso.

---

## 📖 Teoria (2h)

### 1. Autenticação × autorização (15 min)

| | Autenticação | Autorização |
|---|---|---|
| Pergunta | *Quem é você?* | *O que você pode fazer?* |
| Falha | `401` | `403` |
| Django | `authenticate()`, `login()`, sessão | permissões, grupos, `test_func` |

Fluxo do BiblioCom:

```
anônimo          → vê o catálogo público
associado        → vê o próprio histórico, faz reserva
bibliotecário    → registra empréstimo/devolução, cadastra obras
coordenação      → tudo + relatórios + gestão de usuários
```

### 2. Como o Django guarda senhas (20 min)

Senha **nunca** é armazenada. Guarda-se o resultado de uma função de hash lenta, com sal:

```
pbkdf2_sha256$720000$k3Jd8xQ2vN1p$Ax9f2...
└─── algoritmo ──┘ └iterações┘ └─ sal ─┘ └─ hash ─┘
```

Propriedades: **sal** (impede tabelas pré-computadas), **iterações altas** (torna a força
bruta cara), **migração automática** (ao logar, o Django re-hasheia se o padrão mudou).

```python
user.set_password("nova")     # ✅ hasheia
user.password = "nova"        # ❌ grava texto puro — nunca faça isso
user.check_password("nova")   # comparação em tempo constante
```

Para reforçar (Argon2 é o padrão recomendado hoje):

```python
# settings.py
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
```
```bash
pip install "django[argon2]"
```

### 3. Estendendo o usuário: três estratégias (30 min) ⭐

| Estratégia | Quando | Custo |
|---|---|---|
| **Perfil `OneToOne`** | Projeto já em produção; só faltam campos extras | Baixo; exige `select_related` |
| **`AbstractUser`** | Projeto novo; quer campos extras e manter tudo do padrão | Baixo, **se feito antes da 1ª migração** |
| **`AbstractBaseUser`** | Login por e-mail/CPF, requisitos incomuns | Alto; reimplementa gerenciador e permissões |

> ⚠️ **Decida antes da primeira migração.** Trocar `AUTH_USER_MODEL` com o banco já criado
> é uma das operações mais dolorosas do Django. Se o projeto da equipe pode vir a precisar
> de campos no usuário, comece com `AbstractUser` — o custo hoje é zero.

**Recomendação do material:** `AbstractUser` desde o dia 1.

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
    email = models.EmailField("e-mail", unique=True)     # e-mail único: quase sempre desejável

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def eh_equipe(self):
        return self.papel in {self.Papel.BIBLIOTECARIO, self.Papel.COORDENACAO}
```

```python
# settings.py
AUTH_USER_MODEL = "contas.Usuario"
```

No código, **nunca** importe `User` diretamente:

```python
from django.conf import settings
from django.contrib.auth import get_user_model

autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)  # em models
Usuario = get_user_model()                                                      # em views/scripts
```

### 4. Views de autenticação prontas (25 min)

```python
# config/urls.py
from django.urls import include, path

urlpatterns = [
    path("contas/", include("django.contrib.auth.urls")),
]
```

Isso cria, de uma vez:

| URL | Nome | Função |
|---|---|---|
| `contas/login/` | `login` | Entrar |
| `contas/logout/` | `logout` | Sair (**POST**) |
| `contas/password_change/` | `password_change` | Trocar senha |
| `contas/password_reset/` | `password_reset` | Solicitar recuperação |
| `contas/reset/<uidb64>/<token>/` | `password_reset_confirm` | Definir nova senha |

Templates esperados em `templates/registration/`: `login.html`,
`password_change_form.html`, `password_reset_form.html`, `password_reset_email.html`,
`password_reset_confirm.html`, `password_reset_done.html`, `password_reset_complete.html`.

```python
# settings.py
LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "acervo:home"
LOGOUT_REDIRECT_URL = "acervo:home"
```

> **Logout é POST desde o Django 5.0.** Um `<a href="/contas/logout/">` deixa de funcionar
> — e isso é correto: logout altera estado no servidor. Volte ao M01.

### 5. Cadastro de usuário (15 min)

```python
# contas/forms.py
from django.contrib.auth.forms import UserCreationForm

from .models import Usuario


class CadastroForm(UserCreationForm):
    class Meta:
        model = Usuario
        fields = ["username", "first_name", "last_name", "email", "telefone"]


# contas/views.py
from django.contrib.auth import login
from django.views.generic import CreateView


class CadastroView(CreateView):
    form_class = CadastroForm
    template_name = "registration/cadastro.html"

    def form_valid(self, form):
        resposta = super().form_valid(form)
        login(self.request, self.object)          # já entra logo após cadastrar
        return resposta

    def get_success_url(self):
        return reverse("acervo:home")
```

Validadores de senha (ative todos):

```python
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
```

### 6. Autorização (30 min)

#### Nível 1 — exigir login

```python
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin


@login_required
def meus_emprestimos(request): ...


class MinhaView(LoginRequiredMixin, ListView): ...
```

#### Nível 2 — permissões

O Django cria 4 permissões por model: `add_`, `change_`, `delete_`, `view_`.

```python
from django.contrib.auth.decorators import permission_required
from django.contrib.auth.mixins import PermissionRequiredMixin


@permission_required("acervo.add_obra", raise_exception=True)
def obra_create(request): ...


class ObraCreateView(PermissionRequiredMixin, CreateView):
    permission_required = "acervo.add_obra"
    raise_exception = True        # 403 em vez de redirecionar para o login
```

```django
{% if perms.acervo.add_obra %}
  <a href="{% url 'acervo:obra_create' %}">Nova obra</a>
{% endif %}
```

Permissões customizadas:

```python
class Emprestimo(models.Model):
    class Meta:
        permissions = [
            ("registrar_devolucao", "Pode registrar devolução"),
            ("ver_relatorios", "Pode ver relatórios gerenciais"),
        ]
```

#### Nível 3 — grupos (papéis)

```python
# contas/management/commands/criar_grupos.py
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

PAPEIS = {
    "Associado": ["view_obra", "view_exemplar"],
    "Bibliotecario": ["view_obra", "add_obra", "change_obra", "view_exemplar",
                      "add_exemplar", "change_exemplar", "add_emprestimo",
                      "registrar_devolucao", "view_associado", "add_associado"],
    "Coordenacao": "__all__",
}


class Command(BaseCommand):
    help = "Cria os grupos de papéis do BiblioCom com suas permissões."

    def handle(self, *args, **options):
        for nome, codigos in PAPEIS.items():
            grupo, _ = Group.objects.get_or_create(name=nome)
            if codigos == "__all__":
                grupo.permissions.set(Permission.objects.all())
            else:
                grupo.permissions.set(Permission.objects.filter(codename__in=codigos))
            self.stdout.write(self.style.SUCCESS(f"Grupo '{nome}' configurado."))
```

Comando versionado > cliques no admin: reprodutível em qualquer ambiente, inclusive em
produção e no CI.

#### Nível 4 — autorização por objeto ⭐

Permissão de model diz "pode ver empréstimos". Não diz "pode ver **este** empréstimo".

```python
from django.contrib.auth.mixins import UserPassesTestMixin


class EmprestimoDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Emprestimo

    def test_func(self):
        emprestimo = self.get_object()
        u = self.request.user
        return u.eh_equipe or emprestimo.associado.user_id == u.id
```

Alternativa mais robusta — **filtrar o queryset**, para que o objeto sequer exista para
quem não pode vê-lo:

```python
class EmprestimoDetailView(LoginRequiredMixin, DetailView):
    def get_queryset(self):
        qs = Emprestimo.objects.select_related("exemplar__obra", "associado")
        if self.request.user.eh_equipe:
            return qs
        return qs.filter(associado__user=self.request.user)
```

Resultado: quem tenta `/emprestimos/999/` de outra pessoa recebe **404**, não 403 — e
assim nem descobre que o registro existe. Esta é a defesa contra **IDOR** (M11).

### 7. Sessão e política de acesso (15 min)

```python
# settings.py
SESSION_COOKIE_AGE = 60 * 60 * 8              # 8 horas
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG             # exige HTTPS em produção
```

```python
request.session.cycle_key()      # rotaciona o id da sessão (o login() já faz)
```

Rotacionar a sessão no login evita **session fixation**: um atacante que plantou um id de
sessão no navegador da vítima não fica com a sessão autenticada.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — App `contas` com `AbstractUser` (40 min)

> Se o projeto já tem migrações aplicadas, o caminho de menor dor em ambiente de
> **desenvolvimento** é: criar o app, definir `AUTH_USER_MODEL`, apagar o banco e as
> migrações dos apps próprios, e migrar do zero. Faça isso agora — não em produção.

```bash
python manage.py startapp contas
```

Implemente o model `Usuario` da teoria, configure `AUTH_USER_MODEL`, migre e crie o
superusuário. Ajuste `Associado.user` para `settings.AUTH_USER_MODEL`.

### Passo 2 — Login, logout e templates (40 min)

```python
# config/urls.py
path("contas/", include("django.contrib.auth.urls")),
path("contas/cadastro/", CadastroView.as_view(), name="cadastro"),
```

```django
{# templates/registration/login.html #}
{% extends "base.html" %}
{% block titulo %}Entrar — BiblioCom{% endblock %}
{% block conteudo %}
  <h1>Entrar</h1>

  {% if form.errors %}
    <div class="alerta alerta--erro" role="alert">
      Usuário ou senha incorretos.
    </div>
  {% endif %}

  <form method="post">
    {% csrf_token %}
    {% include "acervo/_form.html" with form=form %}
    <button type="submit">Entrar</button>
    <input type="hidden" name="next" value="{{ next }}">
  </form>

  <p><a href="{% url 'password_reset' %}">Esqueci minha senha</a></p>
  <p><a href="{% url 'cadastro' %}">Criar conta</a></p>
{% endblock %}
```

> **Mensagem genérica de propósito.** "Usuário não existe" versus "senha incorreta"
> permite enumerar contas válidas. Uma única mensagem para os dois casos.

### Passo 3 — Recuperação de senha (30 min)

```python
# settings.py — em desenvolvimento, o e-mail vai para o terminal
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "nao-responda@bibliocom.exemplo.org"
```

Crie os templates de reset e percorra o fluxo inteiro: solicitar → copiar o link do
terminal → definir nova senha → entrar com ela.

Observe o token na URL e responda: por que ele expira? O que acontece se você usá-lo duas
vezes?

### Passo 4 — Grupos e permissões (40 min)

1. Implemente o comando `criar_grupos` e execute-o.
2. Crie 3 usuários de teste, um por papel.
3. Proteja as views:
   - catálogo: público
   - detalhe do próprio empréstimo: `LoginRequiredMixin` + queryset filtrado
   - cadastro/edição de obra: `permission_required("acervo.add_obra")`
   - registro de empréstimo: `permission_required("acervo.add_emprestimo")`
   - relatórios: `permission_required("acervo.ver_relatorios")`
4. No template, esconda os links que a pessoa não pode usar (`{% if perms... %}`).

> Esconder o link **não** é controle de acesso — é usabilidade. A proteção real está na
> view. Prove: pegue a URL de cadastro de obra e acesse logada como associado. Deve dar
> 403.

### Passo 5 — Teste de matriz de acesso (30 min) ⭐

Preencha executando cada combinação. Toda célula deve ser verificada de fato.

| Rota | Anônimo | Associado | Bibliotecário | Coordenação |
|---|---|---|---|---|
| `/obras/` | 200 | 200 | 200 | 200 |
| `/obras/nova/` | 302→login | 403 | 200 | 200 |
| `/emprestimos/` | 302→login | só os próprios | todos | todos |
| `/emprestimos/<id-de-outro>/` | 302→login | **404** | 200 | 200 |
| `/emprestimos/novo/` | 302→login | 403 | 200 | 200 |
| `/relatorios/` | 302→login | 403 | 403 | 200 |
| `/admin/` | 302→login | 302→login | 302 ou 200 | 200 |

Esta matriz vira teste automatizado no M12 e item de rubrica na Etapa 3.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `user.password = "x"` | `user.set_password("x")` |
| `from django.contrib.auth.models import User` | `settings.AUTH_USER_MODEL` / `get_user_model()` |
| Trocar `AUTH_USER_MODEL` depois da 1ª migração | Decida antes |
| Só esconder o link no template | Proteja a view |
| Mensagem de login que revela se o usuário existe | Mensagem única |
| Permissão de model sem checagem de objeto | Filtre o queryset (IDOR) |
| Logout por link `<a>` | Formulário POST |
| `SESSION_COOKIE_SECURE=True` em dev HTTP | Condicione ao `DEBUG` |
| Guardar dados sensíveis na sessão | A sessão é referenciada por um cookie que pode vazar |

## ✅ Checklist de saída

- [ ] `AUTH_USER_MODEL` customizado, migrado desde o início
- [ ] Cadastro, login, logout, troca e recuperação de senha funcionando
- [ ] Templates de autenticação integrados ao layout do sistema
- [ ] 3 grupos criados por comando versionado
- [ ] Views protegidas nos 4 níveis (login, permissão, papel, objeto)
- [ ] Matriz de acesso preenchida e verificada
- [ ] Argon2 configurado
- [ ] Nenhuma senha em texto puro em lugar nenhum

## 📦 Entrega E4 — Área autenticada

Sistema com autenticação completa, 3 papéis funcionando e a matriz de acesso verificada
(com prints ou saída de `curl` de cada célula).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Autenticação de usuários](https://docs.djangoproject.com/pt-br/5.0/topics/auth/)
- [Django — Customizando autenticação](https://docs.djangoproject.com/en/5.0/topics/auth/customizing/)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [django-allauth](https://docs.allauth.org/) — login social, verificação de e-mail, MFA
