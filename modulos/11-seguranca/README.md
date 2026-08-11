# M11 — Segurança de aplicações web

> **CH:** 5h (3h teóricas · 2h práticas) · **Semana 13** · **Pré-requisitos:** M06, M07, M10
> **Ementa:** *Tópicos relevantes: Segurança.*

O módulo é organizado sobre o **OWASP Top 10:2021**, com a pergunta prática: *o que o
Django já faz por mim, o que ele faz se eu configurar, e o que só eu posso fazer?*

## 🎯 Objetivos

1. Explicar as principais classes de vulnerabilidade web e como se manifestam.
2. Identificar código vulnerável e corrigi-lo.
3. Configurar o framework para produção segura.
4. Aplicar princípios de proteção de dados pessoais (LGPD) ao projeto.
5. Executar uma revisão de segurança e produzir um relatório.

---

## 📖 Teoria (3h)

### 0. Três princípios que organizam tudo (10 min)

1. **Nunca confie na entrada.** Tudo que vem do cliente — formulário, URL, cabeçalho,
   cookie, arquivo, JSON — pode ter sido forjado.
2. **Defesa em profundidade.** Nenhuma camada é suficiente sozinha: navegador, aplicação e
   banco.
3. **Menor privilégio.** Cada pessoa, processo e credencial recebe o mínimo necessário,
   pelo menor tempo necessário.

### 1. A01 — Quebra de controle de acesso (30 min)

A campeã do Top 10. Já vista no M10; aqui, os padrões de ataque.

#### IDOR — referência direta insegura a objeto

```python
# ❌ qualquer pessoa logada vê o empréstimo de qualquer outra
def emprestimo_detail(request, pk):
    emprestimo = get_object_or_404(Emprestimo, pk=pk)
    return render(request, "...", {"emprestimo": emprestimo})

# ✅ o filtro faz parte da consulta
def emprestimo_detail(request, pk):
    qs = Emprestimo.objects.all() if request.user.eh_equipe else \
         Emprestimo.objects.filter(associado__user=request.user)
    emprestimo = get_object_or_404(qs, pk=pk)
    return render(request, "...", {"emprestimo": emprestimo})
```

#### Mass assignment

```python
# ❌ um POST com papel=COORDENACAO promove o usuário
class PerfilForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = "__all__"

# ✅
        fields = ["first_name", "last_name", "email", "telefone"]
```

#### Escalada por parâmetro oculto

Campos `hidden` e `disabled` no HTML **não** protegem nada — o cliente controla o corpo da
requisição. Qualquer decisão sensível é tomada no servidor:

```python
def form_valid(self, form):
    form.instance.registrado_por = self.request.user     # servidor decide, não o cliente
    return super().form_valid(form)
```

#### Checklist A01

- [ ] Toda view que acessa objeto de usuário filtra o queryset
- [ ] `fields` explícito em todo form
- [ ] Nada sensível decidido a partir de campo do cliente
- [ ] Rotas de escrita exigem POST e permissão
- [ ] Negar por padrão: público é exceção declarada, não o contrário

### 2. A03 — Injeção (30 min)

#### SQL

```python
# ❌ injeção clássica
nome = request.GET["nome"]
Obra.objects.raw(f"SELECT * FROM acervo_obra WHERE titulo = '{nome}'")
# entrada: ' OR '1'='1  ->  devolve tudo
# entrada: '; DROP TABLE acervo_obra; --  ->  catástrofe

# ✅ ORM (parametrizado por construção)
Obra.objects.filter(titulo=nome)

# ✅ raw parametrizado, quando realmente necessário
Obra.objects.raw("SELECT * FROM acervo_obra WHERE titulo = %s", [nome])
```

A regra é simples: **dados nunca são concatenados em comandos**. Vale para SQL, para shell
(`subprocess` com lista, nunca `shell=True` com string) e para caminhos de arquivo.

#### XSS — Cross-Site Scripting

O Django escapa por padrão. Você desliga a proteção quando:

```django
{{ comentario|safe }}                     ❌ com dado do usuário
{% autoescape off %}{{ x }}{% endautoescape %}   ❌
```

```python
mark_safe(f"<b>{nome_do_usuario}</b>")    ❌
format_html("<b>{}</b>", nome_do_usuario) ✅  (escapa os argumentos)
```

Onde o escape **não** protege sozinho: dentro de `<script>`, em atributos de evento
(`onclick`), em `href="javascript:..."` e em CSS. Nesses contextos, o escape de HTML não é
o escape certo.

```django
{# ❌ #} <a href="{{ url_informada }}">          {# javascript:alert(1) #}
{# ✅ #} <a href="{{ url_informada|urlize }}">   {# ou valide o esquema no servidor #}

{# para passar dados a JS: #}
{{ dados|json_script:"dados-obra" }}
<script>const dados = JSON.parse(document.getElementById("dados-obra").textContent);</script>
```

Quando o usuário precisa mesmo enviar HTML formatado, **sanitize na escrita** com lista de
permissões (`nh3`, `bleach`) — não confie em filtrar na exibição.

#### Path traversal e injeção de comando

```python
# ❌
caminho = os.path.join(MEDIA_ROOT, request.GET["arquivo"])   # ../../etc/passwd
os.system(f"convert {nome_arquivo} saida.png")               # ; rm -rf /

# ✅
from django.utils._os import safe_join
caminho = safe_join(MEDIA_ROOT, nome_validado)
subprocess.run(["convert", nome_arquivo, "saida.png"], check=True)   # lista, sem shell
```

### 3. CSRF — Cross-Site Request Forgery (25 min)

**O ataque:** você está logada no BiblioCom. Visita `site-malicioso.com`, que contém:

```html
<form action="https://bibliocom.org/obras/42/excluir/" method="post" id="f">
</form>
<script>document.getElementById("f").submit()</script>
```

O navegador envia seu cookie de sessão junto. Sem proteção, a obra é excluída.

**A defesa:** um token secreto, por sessão, que o site atacante não consegue ler
(política de mesma origem) nem adivinhar.

```django
<form method="post">{% csrf_token %}...</form>
```

```python
MIDDLEWARE = [..., "django.middleware.csrf.CsrfViewMiddleware", ...]
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = ["https://bibliocom.exemplo.org"]
```

Para requisições AJAX:

```javascript
fetch(url, {
  method: "POST",
  headers: {"X-CSRFToken": getCookie("csrftoken"), "Content-Type": "application/json"},
  body: JSON.stringify(dados),
});
```

> ⚠️ `@csrf_exempt` é quase sempre um erro. Se você precisou dele, o problema está em
> outro lugar — quase sempre em uma rota de API que deveria usar autenticação por token
> (M13), não por sessão.

Isso explica também por que **GET nunca pode alterar dados**: um `<img src="/excluir/42/">`
no site atacante dispensa formulário e não é coberto por proteção CSRF.

### 4. A02 — Falhas criptográficas e segredos (25 min)

| Item | Regra |
|---|---|
| `SECRET_KEY` | Variável de ambiente; nunca no Git; ≥ 50 caracteres aleatórios |
| Senhas | Hash com Argon2/PBKDF2; nunca texto puro, nunca criptografia reversível |
| Trânsito | HTTPS obrigatório, HSTS ativado |
| Dados sensíveis | Criptografe em repouso ou, melhor, **não colete** |
| Tokens | `secrets.token_urlsafe()`; guarde o hash, não o token |
| Logs | Nunca registre senha, token, CPF completo ou cartão |

```python
# produção
DEBUG = False
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")   # atrás de proxy
```

**Vazou a `SECRET_KEY`?** Ela assina sessões, tokens de reset de senha e mensagens. Vazou
= todas as sessões forjáveis. Gere outra, faça deploy, e todos os usuários serão
deslogados — que é o comportamento desejado.

### 5. A05 — Configuração insegura (20 min)

```python
DEBUG = True         # em produção: expõe código-fonte, settings, SQL e variáveis
ALLOWED_HOSTS = ["*"]  # aceita qualquer Host: habilita envenenamento de cache e de links
```

A página de erro do Django com `DEBUG=True` mostra o traceback, o conteúdo de `settings`
(exceto o que ele consegue mascarar), as variáveis locais de cada frame e as consultas
recentes. É a falha de configuração mais explorada em aplicações Django expostas.

```bash
python manage.py check --deploy       # rode antes de todo deploy
```

Outros itens: `/admin/` em caminho previsível, mensagens de erro detalhadas ao usuário,
diretório de mídia servindo arquivos executáveis, dependências desatualizadas.

### 6. A07 — Falhas de identificação e autenticação (20 min)

| Falha | Mitigação |
|---|---|
| Senha fraca | `AUTH_PASSWORD_VALIDATORS`, mínimo 12 caracteres |
| Força bruta | Bloqueio progressivo por usuário+IP; `django-axes` |
| Enumeração de usuários | Mensagem genérica; tempo de resposta uniforme |
| Session fixation | `login()` rotaciona a sessão (padrão do Django) |
| Sessão eterna | `SESSION_COOKIE_AGE`; logout explícito |
| Token de reset reutilizável | Uso único, expiração curta |
| Sem segundo fator | MFA em contas administrativas |

### 7. A09 — Falhas de log e monitoramento (15 min)

Não detectar é tão grave quanto não prevenir. Registre: login (sucesso e falha), alteração
de permissão, acesso negado, operações destrutivas, erros 5xx.

**Nunca registre:** senha, token, cookie de sessão, dado pessoal sensível, corpo completo
de requisição de autenticação.

```python
logger.warning("acesso negado: usuario=%s rota=%s ip=%s",
               request.user.pk, request.path, obter_ip(request))
```

Note: `usuario=%s` com o **id**, não com o nome — minimização de dados no log.

### 8. LGPD aplicada ao projeto (25 min)

A Lei 13.709/2018 se aplica a qualquer tratamento de dados pessoais — inclusive num
projeto de extensão universitária com uma biblioteca comunitária.

| Princípio | Como se traduz em código |
|---|---|
| **Finalidade** | Cada campo coletado tem um motivo declarado. Sem "vai que precisa" |
| **Necessidade / minimização** | Precisa mesmo do CPF para emprestar um livro? |
| **Transparência** | Aviso de privacidade acessível, em linguagem simples |
| **Segurança** | Controle de acesso, criptografia em trânsito, log de acesso |
| **Qualidade** | O titular pode corrigir seus dados |
| **Não discriminação** | Sem uso dos dados para excluir pessoas do serviço |

Direitos do titular a implementar (ou, no mínimo, documentar como atender):

- **Acesso** — exportar os próprios dados
- **Correção** — editar o perfil
- **Eliminação** — excluir a conta (e o que fazer com o histórico de empréstimos? há base
  legal de guarda; documente a decisão)
- **Portabilidade** — exportar em formato legível por máquina
- **Informação** — quem mais tem acesso

**Dados sensíveis** (art. 5º, II — saúde, origem racial, religião, biometria, dados de
crianças) exigem base legal específica e cuidado redobrado. Regra prática para o projeto:
**se não é essencial, não colete**. O dado que você não tem não vaza.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Aplicação vulnerável: encontre e corrija (60 min) ⭐

Este código está em [`vulneravel.py`](../../recursos/codigo/vulneravel.py). **Cada view
tem pelo menos uma vulnerabilidade.** Trabalhe em duplas: uma pessoa ataca, a outra
corrige.

```python
# 1
def busca(request):
    termo = request.GET.get("q", "")
    obras = Obra.objects.raw(f"SELECT * FROM acervo_obra WHERE titulo LIKE '%{termo}%'")
    return render(request, "busca.html", {"obras": obras})

# 2
def perfil(request, user_id):
    usuario = get_object_or_404(Usuario, pk=user_id)
    return render(request, "perfil.html", {"usuario": usuario})

# 3
@csrf_exempt
def excluir_obra(request, pk):
    Obra.objects.filter(pk=pk).delete()
    return redirect("acervo:obra_list")

# 4  (template)
#    <div class="sinopse">{{ obra.sinopse|safe }}</div>

# 5
def download(request):
    nome = request.GET["arquivo"]
    return FileResponse(open(f"/var/media/{nome}", "rb"))

# 6
def login_view(request):
    u = Usuario.objects.filter(username=request.POST["usuario"]).first()
    if not u:
        return render(request, "login.html", {"erro": "Usuário não encontrado"})
    if u.password != request.POST["senha"]:
        return render(request, "login.html", {"erro": "Senha incorreta"})
    request.session["user_id"] = u.id
    return redirect("acervo:home")

# 7
class ObraForm(forms.ModelForm):
    class Meta:
        model = Obra
        fields = "__all__"

# 8
def relatorio(request):
    if request.GET.get("admin") == "1":
        return render(request, "relatorio_completo.html", {...})
```

Para cada item, entregue: **vulnerabilidade** (nome OWASP), **exploração** (payload/URL
concreto que demonstra), **correção** (código) e **por que a correção funciona**.

### Passo 2 — `check --deploy` (20 min)

```bash
DEBUG=False python manage.py check --deploy
```

Resolva **todos** os avisos e documente cada configuração adicionada, explicando o que ela
previne. Guarde a saída limpa como evidência.

### Passo 3 — Cabeçalhos de segurança (20 min)

```bash
curl -I https://sua-aplicacao/ | grep -iE "strict-transport|x-frame|x-content|referrer|content-security"
```

Configure os que faltarem. Para CSP, use `django-csp`:

```python
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "frame-ancestors": ["'none'"],
    }
}
```

Teste com [securityheaders.com](https://securityheaders.com) (após o deploy, no M14). Meta:
nota **A**.

### Passo 4 — Dependências e segredos (20 min)

```bash
pip install pip-audit
pip-audit                       # vulnerabilidades conhecidas nas dependências

pip install detect-secrets
detect-secrets scan             # segredos no repositório

git log -p | grep -iE "SECRET_KEY|password|token|api[_-]key"   # e no histórico
```

Se encontrar segredo no histórico: **considere-o comprometido**, rotacione a credencial, e
só então trate da remoção do histórico.

---

## ⚠️ Erros comuns

| Erro | Consequência |
|---|---|
| `DEBUG=True` em produção | Vazamento de código, configuração e dados |
| `@csrf_exempt` para "resolver" 403 | Abre CSRF |
| `|safe` em dado do usuário | XSS armazenado |
| f-string em SQL | Injeção de SQL |
| `fields = "__all__"` | Mass assignment |
| Validar só no cliente | Nenhuma validação |
| `.env` no Git | Credenciais vazadas |
| `ALLOWED_HOSTS = ["*"]` | Host header poisoning |
| Confiar em `X-Forwarded-For` sem proxy confiável | Falsificação de IP no log e no rate limit |
| Coletar dado "porque pode ser útil" | Violação de minimização (LGPD) |

## ✅ Checklist de saída

- [ ] As 8 vulnerabilidades do Passo 1 identificadas, exploradas e corrigidas
- [ ] `check --deploy` sem avisos
- [ ] Cabeçalhos de segurança configurados
- [ ] `pip-audit` sem vulnerabilidades críticas
- [ ] Nenhum segredo no repositório, nem no histórico
- [ ] Mapa de dados pessoais do projeto preenchido
- [ ] Aviso de privacidade redigido

## 📦 Entrega E5 — Relatório de segurança

Documento com:

1. Tabela das 8 vulnerabilidades: nome, exploração, correção, commit.
2. Saída de `check --deploy` antes e depois.
3. Cabeçalhos de segurança configurados e o porquê de cada um.
4. **Mapa de dados pessoais** do projeto da equipe:

| Dado | Por que coletamos | Base legal | Quem acessa | Por quanto tempo | Como protegemos |
|---|---|---|---|---|---|

5. Aviso de privacidade em linguagem simples (máx. 1 página).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Checklist operacional em
[`../../recursos/checklists/seguranca.md`](../../recursos/checklists/seguranca.md).

## 📚 Para aprofundar

- [OWASP Top 10:2021](https://owasp.org/Top10/pt_BR/)
- [Django — Segurança](https://docs.djangoproject.com/pt-br/5.0/topics/security/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [LGPD — texto da Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — guias orientativos](https://www.gov.br/anpd/pt-br)
