# M07 — Exercícios

## E07.1 — Burlar o HTML (individual)

1. Crie um formulário com `required`, `type="number"` e `maxlength`.
2. Burle **cada uma** das validações de três maneiras diferentes:
   - removendo o atributo pelo DevTools;
   - desabilitando o JavaScript;
   - enviando com `curl`.
3. Documente o que o servidor respondeu em cada caso, **antes** e **depois** de você
   implementar a validação no `Form`.

**Entrega:** 6 evidências (3 sem validação de servidor, 3 com) + conclusão em 3 linhas.

Este exercício é pré-requisito conceitual do M11. Ninguém escreve validação de servidor com
convicção antes de ter burlado a do navegador com as próprias mãos.

---

## E07.2 — Validações do BiblioCom (individual)

Implemente e teste:

| # | Regra | Onde |
|---|---|---|
| 1 | ISBN com 10 ou 13 dígitos, aceitando hífens na entrada | validator no model |
| 2 | Ano de publicação entre 1400 e o ano atual | `clean_ano_publicacao` |
| 3 | Título não pode ser só espaços | `clean_titulo` |
| 4 | Tombo do exemplar no formato `NNNNN-N` | validator com regex |
| 5 | E-mail do associado único entre associados ativos | `clean_email` |
| 6 | Telefone aceita `(NN) NNNNN-NNNN` e normaliza para dígitos | `clean_telefone` |
| 7 | Data de nascimento do autor não pode ser futura nem anterior a 1200 | `clean` |
| 8 | Ao editar, o ISBN não pode colidir com outra obra | `clean_isbn` com `exclude(pk=self.instance.pk)` |

O item 8 é a pegadinha clássica: ao editar, o próprio objeto aparece na busca por duplicata.

---

## E07.3 — Formulário de empréstimo (individual) ⭐

Implemente `EmprestimoForm` com todas as regras do roteiro prático **e**:

- o campo `exemplar` só lista exemplares disponíveis;
- o campo `associado` só lista associados ativos e não bloqueados;
- se o associado tem multa em aberto, exibe aviso mas permite (regra da biblioteca);
- a previsão de devolução aparece como texto informativo, não como campo editável.

**Entrega:** código + tabela `regra → como testar → mensagem exibida`.

---

## E07.4 — Formset de exemplares (individual)

Na tela de cadastro de obra, permita informar de 1 a 10 exemplares de uma vez:

- `inlineformset_factory` com `extra=3`, `can_delete=True`, `max_num=10`;
- validação: nenhum tombo repetido **dentro do próprio formset** (dica: sobrescreva
  `clean()` do formset);
- salvar tudo em uma transação;
- se qualquer exemplar for inválido, **nada** é salvo (nem a obra).

Prove que a transação funciona: envie uma obra válida com um exemplar inválido e confirme
que a obra não foi criada.

---

## E07.5 — Upload seguro (individual)

Adicione `Obra.capa = ImageField(upload_to="capas/%Y/%m/", blank=True)` e valide:

- tamanho máximo de 2 MB;
- apenas JPEG, PNG e WebP;
- dimensão máxima de 2000×2000;
- nome de arquivo sanitizado (nada de `../../etc/passwd`).

Depois, **tente subverter**: renomeie um `.php` (ou `.html` com `<script>`) para `.jpg` e
envie. Ele passou? Por quê? Que verificação adicional resolveria? Que configuração do
servidor impede que um arquivo enviado seja executado?

---

## E07.6 — Formulário sem model (individual)

Crie `/relatorios/` com um `Form` (não `ModelForm`) que gera relatório sob demanda:

```python
class RelatorioForm(forms.Form):
    TIPOS = [("emprestimos", "Empréstimos"), ("acervo", "Acervo"), ("atrasos", "Atrasos")]
    tipo = forms.ChoiceField(choices=TIPOS)
    data_inicio = forms.DateField(widget=forms.DateInput(attrs={"type": "date"}))
    data_fim = forms.DateField(widget=forms.DateInput(attrs={"type": "date"}))
    formato = forms.ChoiceField(choices=[("html", "Tela"), ("csv", "CSV")])
```

Validações: `data_fim >= data_inicio`; período máximo de 1 ano; nenhuma data no futuro.
A saída em CSV deve ser um download real (`Content-Disposition`).

---

## E07.7 — Auditoria de acessibilidade (em duplas)

Audite os formulários do seu BiblioCom:

| Critério | ✅/❌ | Correção aplicada |
|---|---|---|
| Todo campo tem `<label>` associado (`for`/`id`) | | |
| Campos obrigatórios são indicados no texto, não só por cor | | |
| Erros são anunciados (`role="alert"` / `aria-live`) | | |
| Erro é associado ao campo (`aria-describedby`) | | |
| Navegação só por teclado funciona, na ordem lógica | | |
| Foco visível em todos os elementos interativos | | |
| Contraste de texto ≥ 4.5:1 | | |
| O formulário funciona com zoom de 200% | | |

Ferramentas: extensão axe DevTools, navegação só com Tab, e o modo de alto contraste do SO.

---

## Gabarito parcial

**E07.2 (8)**
```python
def clean_isbn(self):
    isbn = self.cleaned_data["isbn"]
    if isbn:
        qs = Obra.objects.filter(isbn=isbn)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)     # a linha que todo mundo esquece
        if qs.exists():
            raise forms.ValidationError("Já existe outra obra com este ISBN.")
    return isbn
```

**E07.5** — Renomear a extensão passa porque `content_type` vem do cliente e é forjável.
Verificações que resolvem: abrir o arquivo com Pillow (`Image.open().verify()`), checar os
*magic bytes*, e — o mais importante — servir a pasta de mídia de um domínio/rota que
**nunca** executa código, com `Content-Disposition: attachment` e
`X-Content-Type-Options: nosniff`.
