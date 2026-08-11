# Avaliação teórica

> **Peso:** 15% · **Semana 10** · **Duração:** 1h · **Individual**
> Consulta permitida: documentação oficial e anotações pessoais. Não permitida: comunicação
> entre estudantes.

## Conteúdo cobrado

| Bloco | Módulos | Peso |
|---|---|---:|
| Fundamentos da web e HTTP | M01 | 25% |
| Arquitetura desacoplada e contrato de API | M02 | 15% |
| Model, ORM e migrações | M04, M05, M06 | 35% |
| API: URLs, views e serializers | M07 | 25% |

> A prova acontece na semana 10, quando o frontend mal começou. React e Tailwind **não**
> são cobrados aqui — são avaliados no portfólio (E4) e na Etapa 3.

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

> Descreva o ciclo completo de um `POST /api/obras/` numa arquitetura desacoplada, desde o
> clique no botão da SPA até a tela mostrar a obra criada. Cite: as camadas atravessadas,
> onde cada validação acontece e para que serve, o papel do token CSRF, o que é gravado no
> banco, qual o status de sucesso e como o cliente sabe que precisa atualizar a listagem.

---

### Objetiva com justificativa (5 pontos)

> Uma equipe colocou a chave da API de um serviço de pagamento em
> `VITE_PAGAMENTO_SECRET` e afirma que "está segura porque fica no `.env`, que não vai para
> o Git".
>
> **(a)** A afirmação está correta? **(b)** Como você provaria o contrário em 30 segundos?
> **(c)** Qual o desenho correto?

---

### Objetiva com justificativa (5 pontos)

> Um sistema esconde o botão "Excluir" para usuários comuns, com
> `{usuario.eh_admin && <BotaoExcluir />}`, e não declara `permission_classes` no ViewSet.
>
> **(a)** O sistema está protegido? **(b)** Descreva o passo a passo de um ataque.
> **(c)** Onde a proteção deveria estar?

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
