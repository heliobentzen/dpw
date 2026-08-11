# Avaliação teórica

> **Peso:** 15% · **Semana 10** · **Duração:** 1h · **Individual**
> Consulta permitida: documentação oficial e anotações pessoais. Não permitida: comunicação
> entre estudantes.

## Conteúdo cobrado

| Bloco | Módulos | Peso |
|---|---|---:|
| Fundamentos da web e HTTP | M01 | 30% |
| Model, ORM e migrações | M03, M04, M05 | 35% |
| Views, URLs e formulários | M06, M07 | 25% |
| Arquitetura do framework | M02 | 10% |

## Formato

| Tipo | Questões | Pontos |
|---|---:|---:|
| Objetivas com justificativa | 8 | 40 |
| Análise de código (encontrar e corrigir problemas) | 3 | 30 |
| Discursivas | 2 | 30 |

Consulta é permitida porque o que se avalia é **raciocínio**, não memória. Nenhuma questão
pode ser respondida copiando a documentação.

---

## Questões-modelo

### Objetiva com justificativa (5 pontos)

> Uma aplicação implementa a exclusão de um registro como
> `<a href="/produto/42/excluir/">Excluir</a>`. Após colocar no ar, produtos passaram a
> desaparecer sem que ninguém tivesse clicado no link.
>
> **(a)** Qual é a causa provável? **(b)** Qual propriedade do método HTTP foi violada?
> **(c)** Como corrigir?

*Espera-se:* pré-carregador de links, crawler ou antivírus corporativo seguindo o link;
GET deve ser *safe* (não alterar estado); corrigir com formulário POST, `@require_POST`,
token CSRF e confirmação.

---

### Objetiva com justificativa (5 pontos)

> Explique a diferença entre `null=True` e `blank=True` e indique, com justificativa, qual
> (ou quais) usar para: (a) telefone opcional; (b) data de nascimento opcional;
> (c) categoria opcional (FK).

---

### Análise de código (10 pontos)

> Este código está em produção e a página leva 8 segundos para carregar com 200 obras.
> Aponte **todos** os problemas e reescreva.

```python
def relatorio(request):
    obras = Obra.objects.all()
    dados = []
    for obra in obras:
        dados.append({
            "titulo": obra.titulo,
            "autor": obra.autor.nome,
            "categorias": ", ".join([c.nome for c in obra.categorias.all()]),
            "exemplares": obra.exemplares.count(),
            "emprestados": obra.exemplares.filter(emprestimos__devolvido_em=None).count(),
        })
    return render(request, "relatorio.html", {"dados": dados})
```

*Espera-se:* identificar N+1 em quatro lugares (`autor`, `categorias`, `count()` duas
vezes); reescrever com `select_related("autor")`, `prefetch_related("categorias")` e
`annotate(Count(...))` com `filter=Q(...)`; e estimar a redução de ~801 consultas para 2.

---

### Análise de código (10 pontos)

> Encontre as **cinco** falhas de segurança e corrija:

```python
@csrf_exempt
def perfil(request, user_id):
    usuario = Usuario.objects.get(pk=user_id)
    if request.method == "POST":
        usuario.email = request.POST["email"]
        usuario.papel = request.POST.get("papel", usuario.papel)
        usuario.save()
    return render(request, "perfil.html", {"usuario": usuario})
```

---

### Discursiva (15 pontos)

> Uma equipe adicionou o campo obrigatório `cpf` ao model `Associado`, rodou
> `makemigrations`, respondeu ao prompt com o valor padrão `"000.000.000-00"` e fez o
> deploy. Duas semanas depois, descobriu-se que 300 associados estão com o mesmo CPF e o
> campo tem `unique=True` — o que impede novos cadastros.
>
> **(a)** Explique por que o problema ocorreu.
> **(b)** Descreva o procedimento correto que evitaria isso, passo a passo.
> **(c)** Como corrigir a situação **agora**, sem perder dados e sem derrubar o sistema?
> **(d)** Comente a decisão de coletar CPF neste sistema, considerando a LGPD.

---

### Discursiva (15 pontos)

> Descreva o ciclo completo de uma requisição `POST /obras/nova/` numa aplicação Django,
> desde o clique no botão até a página de confirmação aparecer. Cite: as camadas
> atravessadas, onde a validação acontece, o papel do token CSRF, o que é gravado no banco
> e por que a resposta é um redirecionamento e não um HTML.

---

## Critérios de correção

| Aspecto | O que se avalia |
|---|---|
| Correção técnica | A resposta está certa |
| Justificativa | Explica **por quê**, não só **o quê** |
| Uso do vocabulário | Emprega os termos corretos (idempotência, N+1, IDOR, PRG…) |
| Aplicação | Conecta o conceito a uma consequência prática |

Resposta correta sem justificativa vale metade dos pontos. Justificativa correta com
conclusão errada vale mais que zero — o raciocínio conta.

## Prova substitutiva

Quem obtiver nota < 6,0 pode fazer prova substitutiva na semana 19, com o mesmo formato e
conteúdo. A nota da substitutiva substitui a original (não é média).
