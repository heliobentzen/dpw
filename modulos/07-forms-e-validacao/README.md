# M07 — Forms e validação

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 9** · **Pré-requisitos:** M05, M06
> Complemento direto do item de ementa *"operações CRUD a partir da API do framework"*:
> é o formulário que fecha o ciclo Create/Update com validação.

## 🎯 Objetivos

1. Explicar por que validação **precisa** acontecer no servidor.
2. Criar `Form` e `ModelForm` e escolher entre os dois.
3. Implementar validação de campo, entre campos e reaproveitável.
4. Renderizar formulários com controle sobre o HTML e exibir erros de forma acessível.
5. Tratar upload de arquivos e formsets.

---

## 📖 Teoria (2h)

### 1. As três camadas de validação (20 min)

```
1. NAVEGADOR (HTML5: required, type, min, max, pattern)
   → conveniência e UX. Pode ser desligada em 3 cliques no DevTools.

2. APLICAÇÃO (Form / ModelForm)
   → regra de negócio, mensagens legíveis, reexibição do formulário.
      ESTA É A CAMADA QUE PROTEGE O SISTEMA.

3. BANCO (NOT NULL, UNIQUE, CHECK, FK)
   → última linha de defesa. Vale mesmo para escritas fora do formulário
      (shell, comando agendado, importação, API).
```

As três são necessárias e **nenhuma substitui a outra**. Validar só no navegador é o
equivalente a trancar a porta e deixar a janela aberta.

Prova prática (faça em aula):

```bash
curl -X POST http://localhost:8000/obras/nova/ \
     -d "titulo=" -d "autor=999999" -d "ano_publicacao=abacaxi"
```

Nenhum `required` do HTML participou dessa requisição.

### 2. `Form` × `ModelForm` (20 min)

```python
from django import forms


# Form: campos declarados à mão. Use quando NÃO há model por trás.
class BuscaObraForm(forms.Form):
    q = forms.CharField(label="Buscar", max_length=100, required=False)
    ano_de = forms.IntegerField(label="De", required=False, min_value=1400)
    ano_ate = forms.IntegerField(label="Até", required=False)
    apenas_disponiveis = forms.BooleanField(label="Só disponíveis", required=False)


# ModelForm: campos derivados do model. Use no CRUD.
class ObraForm(forms.ModelForm):
    class Meta:
        model = Obra
        fields = ["titulo", "subtitulo", "autor", "editora", "categorias",
                  "ano_publicacao", "isbn", "sinopse"]
        widgets = {
            "sinopse": forms.Textarea(attrs={"rows": 4}),
            "categorias": forms.CheckboxSelectMultiple(),
        }
        labels = {"isbn": "ISBN"}
        help_texts = {"isbn": "13 dígitos, sem hífens."}
```

> Use `fields = [...]` explicitamente. **Nunca** `fields = "__all__"`: quando alguém
> adicionar um campo `aprovado_por_admin` ao model, ele aparece no formulário público sem
> ninguém perceber. É uma vulnerabilidade de *mass assignment*.

### 3. O ciclo de validação (30 min)

```python
form = ObraForm(request.POST)     # 1. vinculado (bound) aos dados
if form.is_valid():               # 2. dispara toda a validação
    obra = form.save()            # 3. cria/atualiza o objeto
else:
    form.errors                   # dict {campo: [mensagens]}
    form.non_field_errors()       # erros que não pertencem a um campo
```

O que acontece dentro de `is_valid()`, em ordem:

```
para cada campo:
    1. field.clean(valor)              -> conversão de tipo + validators do campo
    2. form.clean_<nome_do_campo>()    -> sua validação daquele campo
3. form.clean()                        -> validação que envolve VÁRIOS campos
4. (ModelForm) instance.full_clean()   -> validação do model
--> resultado em form.cleaned_data
```

`cleaned_data` só contém campos que passaram. Dentro de `clean()`, use
`cleaned_data.get("campo")` — nunca indexação direta, porque a chave pode não existir.

### 4. Validação customizada (40 min)

#### Por campo

```python
class ObraForm(forms.ModelForm):
    def clean_isbn(self):
        isbn = self.cleaned_data["isbn"].replace("-", "").replace(" ", "")
        if isbn and not isbn.isdigit():
            raise forms.ValidationError("O ISBN deve conter apenas dígitos.")
        if isbn and len(isbn) not in (10, 13):
            raise forms.ValidationError("O ISBN deve ter 10 ou 13 dígitos.")
        return isbn        # SEMPRE retorne o valor (limpo)

    def clean_ano_publicacao(self):
        ano = self.cleaned_data.get("ano_publicacao")
        atual = timezone.localdate().year
        if ano and ano > atual:
            raise forms.ValidationError(f"O ano não pode ser maior que {atual}.")
        return ano
```

#### Entre campos

```python
    def clean(self):
        cleaned = super().clean()
        de, ate = cleaned.get("ano_de"), cleaned.get("ano_ate")
        if de and ate and de > ate:
            raise forms.ValidationError("O ano inicial não pode ser maior que o final.")
        return cleaned
```

Para prender o erro a um campo específico (melhor para a UX):

```python
        self.add_error("ano_ate", "Deve ser maior ou igual ao ano inicial.")
```

#### Validador reutilizável

```python
# acervo/validators.py
from django.core.exceptions import ValidationError


def validar_isbn(valor):
    limpo = valor.replace("-", "").replace(" ", "")
    if limpo and (not limpo.isdigit() or len(limpo) not in (10, 13)):
        raise ValidationError("ISBN inválido: use 10 ou 13 dígitos.", code="isbn_invalido")
```

```python
# no model — vale para form, admin e full_clean()
isbn = models.CharField(max_length=13, blank=True, validators=[validar_isbn])
```

Validador no **model** é melhor que no form quando a regra é do domínio, não da tela.

#### Validação que precisa do usuário logado

```python
class EmprestimoForm(forms.ModelForm):
    def __init__(self, *args, usuario=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.usuario = usuario
        self.fields["exemplar"].queryset = Exemplar.objects.exclude(estado="BAIXADO")

    def clean(self):
        cleaned = super().clean()
        associado = cleaned.get("associado")
        exemplar = cleaned.get("exemplar")
        if associado and not associado.pode_pegar_emprestado:
            raise forms.ValidationError("Associado atingiu o limite de empréstimos.")
        if exemplar and not exemplar.disponivel:
            self.add_error("exemplar", "Este exemplar já está emprestado.")
        return cleaned
```

```python
# na view
form = EmprestimoForm(request.POST, usuario=request.user)
```

> Restringir o `queryset` de um campo no `__init__` **é controle de acesso**, não estética:
> impede que alguém envie o id de um objeto que não deveria enxergar (M11, IDOR).

### 5. Renderização (20 min)

```html
<!-- automática, rápida para protótipo -->
<form method="post">{% csrf_token %}{{ form.as_p }}<button>Salvar</button></form>
```

Opções: `as_p`, `as_ul`, `as_table`, `as_div` (padrão a partir do Django 5).

```html
<!-- controlada, para produção -->
<form method="post" novalidate>
  {% csrf_token %}

  {% if form.non_field_errors %}
    <div class="alerta alerta--erro" role="alert">
      {% for erro in form.non_field_errors %}<p>{{ erro }}</p>{% endfor %}
    </div>
  {% endif %}

  {% for campo in form %}
    <div class="campo {% if campo.errors %}campo--erro{% endif %}">
      <label for="{{ campo.id_for_label }}">
        {{ campo.label }}{% if campo.field.required %} <span aria-hidden="true">*</span>{% endif %}
      </label>
      {{ campo }}
      {% if campo.help_text %}<small>{{ campo.help_text }}</small>{% endif %}
      {% for erro in campo.errors %}
        <p class="erro" role="alert">{{ erro }}</p>
      {% endfor %}
    </div>
  {% endfor %}

  <button type="submit">Salvar</button>
  <a href="{% url 'acervo:obra_list' %}">Cancelar</a>
</form>
```

Requisitos de acessibilidade (cobrados na rubrica do projeto): todo campo com `<label>`
associado, erro com `role="alert"`, e o erro anunciado próximo ao campo.

Para acrescentar classes CSS aos widgets sem sujar o template:

```python
class ObraForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for campo in self.fields.values():
            campo.widget.attrs.setdefault("class", "input")
```

### 6. Upload de arquivos (15 min)

```html
<form method="post" enctype="multipart/form-data">    <!-- sem isto, nada é enviado -->
```

```python
form = ObraForm(request.POST, request.FILES)     # FILES é obrigatório
```

```python
# settings.py
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

```python
class ObraForm(forms.ModelForm):
    def clean_capa(self):
        capa = self.cleaned_data.get("capa")
        if capa:
            if capa.size > 2 * 1024 * 1024:
                raise forms.ValidationError("A imagem deve ter no máximo 2 MB.")
            if capa.content_type not in ("image/jpeg", "image/png", "image/webp"):
                raise forms.ValidationError("Envie JPEG, PNG ou WebP.")
        return capa
```

> ⚠️ Upload é vetor de ataque: valide tipo **e** tamanho, nunca confie na extensão do
> arquivo nem no `content_type` informado pelo cliente, e jamais sirva a pasta de mídia
> como se fosse código executável. Retomado no M11.

### 7. Formsets (15 min)

Vários objetos do mesmo tipo no mesmo formulário — cadastrar a obra e seus exemplares de
uma vez:

```python
from django.forms import inlineformset_factory

ExemplarFormSet = inlineformset_factory(
    Obra, Exemplar, fields=["tombo", "estado"], extra=3, can_delete=True
)
```

```python
def obra_create(request):
    if request.method == "POST":
        form = ObraForm(request.POST)
        formset = ExemplarFormSet(request.POST)
        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                obra = form.save()
                formset.instance = obra
                formset.save()
            return redirect(obra)
    else:
        form, formset = ObraForm(), ExemplarFormSet()
    return render(request, "acervo/obra_form.html", {"form": form, "formset": formset})
```

```html
{{ formset.management_form }}     <!-- obrigatório! sem isso o formset não valida -->
{% for f in formset %}{{ f.as_p }}{% endfor %}
```

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — `ObraForm` completo (35 min)

Crie `acervo/forms.py` com o `ObraForm` da teoria, incluindo `clean_isbn`,
`clean_ano_publicacao` e widgets. Ligue-o às views de criação e edição do M06.

Teste:
- salvar uma obra válida;
- enviar título vazio;
- enviar ISBN `abc123`;
- enviar ano `2999`;
- enviar `curl` sem nenhum campo e observar que o servidor recusa.

### Passo 2 — Formulário de busca (25 min)

Substitua a leitura crua de `request.GET` do M06 por um `BuscaObraForm`:

```python
def obra_list(request):
    form = BuscaObraForm(request.GET or None)
    obras = Obra.objects.select_related("autor")
    if form.is_valid():
        d = form.cleaned_data
        if d["q"]:
            obras = obras.filter(Q(titulo__icontains=d["q"]) | Q(autor__nome__icontains=d["q"]))
        if d["ano_de"]:
            obras = obras.filter(ano_publicacao__gte=d["ano_de"])
        if d["ano_ate"]:
            obras = obras.filter(ano_publicacao__lte=d["ano_ate"])
        if d["apenas_disponiveis"]:
            obras = obras.filter(exemplares__emprestimos__devolvido_em__isnull=True).distinct()
    ...
```

Note: o formulário de busca usa **GET**, e por isso não leva `{% csrf_token %}`. Explique
por quê (volte ao M01).

### Passo 3 — Formulário com regra de negócio (35 min) ⭐

Implemente `EmprestimoForm` com todas as validações:

- exemplar precisa estar disponível;
- associado precisa estar ativo e abaixo do limite;
- associado não pode ter empréstimo em atraso;
- data de empréstimo não pode ser futura;
- previsão de devolução calculada automaticamente (campo não editável).

Escreva os casos de teste manuais (um por regra) e registre a mensagem de erro exibida.

### Passo 4 — Template de formulário acessível (25 min)

Crie o *partial* `acervo/templates/acervo/_form.html` com a renderização controlada da
teoria e use-o em **todos** os formulários com `{% include %}`. Verifique com o navegador:

- clicar no label foca o campo;
- os erros são lidos por leitor de tela (atributo `role="alert"`);
- o formulário é usável só com teclado (Tab / Enter).

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Faltou `{% csrf_token %}` | 403 em todo POST |
| `fields = "__all__"` | Exponha apenas o necessário |
| `clean_campo()` sem `return` | O valor vira `None` silenciosamente |
| `cleaned_data["x"]` dentro de `clean()` | Use `.get("x")` — a chave pode não existir |
| Esquecer `request.FILES` | Upload nunca chega |
| Esquecer `enctype` no `<form>` | Idem |
| Validar só no HTML | Não é validação |
| `{{ formset }}` sem `management_form` | `ValidationError` obscuro |
| Redirecionar com formulário inválido | Perde erros e dados digitados |
| `queryset` do campo não restrito | Permite escolher objeto de outra pessoa (IDOR) |

## ✅ Checklist de saída

- [ ] `ModelForm` para todos os models editáveis, com `fields` explícito
- [ ] Ao menos 3 `clean_<campo>()` e 1 `clean()` entre campos
- [ ] Um validador reutilizável em `validators.py`, usado no model
- [ ] Formulário de busca como `Form`, via GET
- [ ] Template de formulário acessível, reaproveitado com `{% include %}`
- [ ] Mensagens de sucesso/erro com o framework de mensagens
- [ ] Provei com `curl` que a validação do servidor funciona sem o navegador

## 📦 Entrega E3 — CRUD completo

CRUD de **Obra** funcionando de ponta a ponta: listar (com busca e paginação), detalhar,
criar, editar e excluir (com confirmação), tudo com validação de servidor, mensagens de
feedback e PRG. Commits no repositório + roteiro de teste manual com prints.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Formulários](https://docs.djangoproject.com/pt-br/5.0/topics/forms/)
- [Django — Validação de forms e campos](https://docs.djangoproject.com/en/5.0/ref/forms/validation/)
- [Django — Formsets](https://docs.djangoproject.com/en/5.0/topics/forms/formsets/)
- [WCAG — Formulários acessíveis](https://www.w3.org/WAI/tutorials/forms/)
