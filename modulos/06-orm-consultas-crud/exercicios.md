# M06 — Exercícios

Todos os exercícios usam o banco populado pelo comando `popular` do roteiro prático.

## E05.1 — Traduzir SQL para ORM (individual)

Escreva o equivalente em ORM de cada SQL:

```sql
-- 1
SELECT * FROM acervo_obra WHERE ano_publicacao BETWEEN 1900 AND 1950 ORDER BY titulo;

-- 2
SELECT a.nome, COUNT(o.id) AS total
FROM acervo_autor a LEFT JOIN acervo_obra o ON o.autor_id = a.id
GROUP BY a.nome HAVING COUNT(o.id) > 5 ORDER BY total DESC;

-- 3
SELECT * FROM acervo_emprestimo
WHERE devolvido_em IS NULL AND previsao_devolucao < CURRENT_DATE;

-- 4
SELECT DISTINCT o.* FROM acervo_obra o
JOIN acervo_obra_categorias oc ON oc.obra_id = o.id
JOIN acervo_categoria c ON c.id = oc.categoria_id
WHERE c.slug IN ('romance', 'poesia');

-- 5
SELECT AVG(devolvido_em - emprestado_em) FROM acervo_emprestimo
WHERE devolvido_em IS NOT NULL;
```

Confira comparando `print(qs.query)` com o SQL original.

---

## E05.2 — Traduzir ORM para SQL (individual)

Sem rodar o código, escreva o SQL que cada trecho gera. Depois confira com `.query`.

```python
# 1
Obra.objects.filter(autor__nome__icontains="silva").exclude(isbn="").order_by("-ano_publicacao")[:5]

# 2
Autor.objects.annotate(n=Count("obras", distinct=True)).filter(n__gte=3)

# 3
Emprestimo.objects.filter(devolvido_em__gt=F("previsao_devolucao"))

# 4
Obra.objects.filter(Q(titulo__istartswith="a") | Q(sinopse__icontains="brasil")).distinct()

# 5
Associado.objects.filter(emprestimos__isnull=True)
```

Item 3 é o mais instrutivo: compara **duas colunas da mesma linha**, algo impossível com
um filtro por valor.

---

## E05.3 — Relatórios da biblioteca (individual) ⭐

Implemente cada consulta como uma função em `acervo/consultas.py`, com docstring:

```python
def obras_mais_emprestadas(limite=10): ...
def associados_inadimplentes(): ...
def emprestimos_por_mes(meses=12): ...
def taxa_de_ocupacao_do_acervo(): ...
def obras_nunca_emprestadas(): ...
def tempo_medio_de_emprestimo_por_categoria(): ...
def ranking_de_leitores(ano): ...
def acervo_por_decada(): ...
```

Requisitos:
- Cada função devolve QuerySet ou dict, **nunca** faz `print`.
- Nenhuma pode gerar mais de 2 consultas ao banco (prove com `CaptureQueriesContext`).
- Todas devem funcionar com o banco vazio (sem lançar exceção).

---

## E05.4 — Caçada ao N+1 (individual) ⭐

Este código gera muitas consultas. Otimize e meça:

```python
def relatorio_completo():
    linhas = []
    for associado in Associado.objects.all():
        emprestimos = associado.emprestimos.all()
        for emp in emprestimos:
            linhas.append({
                "associado": associado.nome,
                "obra": emp.exemplar.obra.titulo,
                "autor": emp.exemplar.obra.autor.nome,
                "categorias": [c.nome for c in emp.exemplar.obra.categorias.all()],
                "atrasado": emp.esta_atrasado,
            })
    return linhas
```

**Entrega:**

| Versão | Nº de consultas | Tempo |
|---|---|---|
| Original | | |
| Otimizada | | |

Explique **cada** ferramenta que usou e por que aquela e não a outra.

---

## E05.5 — `F()` e condição de corrida (em duplas)

1. Adicione `Exemplar.vezes_emprestado = PositiveIntegerField(default=0)`.
2. Implemente o incremento das duas formas:

```python
# forma A
ex = Exemplar.objects.get(pk=1)
ex.vezes_emprestado += 1
ex.save()

# forma B
Exemplar.objects.filter(pk=1).update(vezes_emprestado=F("vezes_emprestado") + 1)
```

3. Simule concorrência com dois shells abertos ao mesmo tempo: em ambos, leia o objeto
   (forma A), então salve em um e depois no outro.
4. Compare o resultado final com o esperado.
5. Repita com a forma B.

**Entrega:** contagem final em cada caso + explicação do que se perdeu e por quê.

---

## E05.6 — Consulta de busca real (individual)

Implemente `buscar_obras(termo=None, categoria=None, ano_de=None, ano_ate=None,
apenas_disponiveis=False, ordenar_por="titulo")` que:

- monta o QuerySet incrementalmente (aproveitando a preguiça);
- só filtra pelo que foi informado;
- busca `termo` em título, subtítulo, sinopse e nome do autor;
- ordena por um conjunto **permitido** de campos (rejeite qualquer outro — pense em por
  que isso importa para segurança);
- devolve o QuerySet já otimizado para exibição em lista.

Escreva 8 chamadas de teste cobrindo combinações diferentes, incluindo nenhum filtro e
todos os filtros.

---

## E05.7 — Exclusão lógica (individual)

Substitua a exclusão física de `Obra` por exclusão lógica:

1. Adicione `excluida_em = DateTimeField(null=True, blank=True)`.
2. Crie um `Manager` customizado:

```python
class ObraQuerySet(models.QuerySet):
    def ativas(self):
        return self.filter(excluida_em__isnull=True)

class Obra(models.Model):
    objects = ObraQuerySet.as_manager()
```

3. Implemente `obra.excluir()` e `obra.restaurar()`.
4. Responda: **quais riscos a exclusão lógica traz?** (pense em unicidade, LGPD — direito
   à eliminação — e em consultas que esqueceram de filtrar)

---

## E05.8 — Desafio: painel em uma consulta (individual)

Monte o painel da coordenação com o **menor número possível de consultas**:

- total de obras, exemplares e associados ativos
- exemplares emprestados no momento
- empréstimos em atraso
- 5 obras mais emprestadas nos últimos 90 dias
- 5 associados com mais atrasos históricos
- média de empréstimos por associado

Meça e registre o total de consultas. Meta: ≤ 6.

---

## Gabarito parcial

**E05.1 (3)**
```python
Emprestimo.objects.filter(devolvido_em__isnull=True,
                          previsao_devolucao__lt=timezone.localdate())
```

**E05.4** — Original: ~1 + N + (N×M×3) consultas. Otimizada: 1–2.
```python
Emprestimo.objects.select_related(
    "associado", "exemplar__obra__autor"
).prefetch_related("exemplar__obra__categorias")
```
Note a inversão: partir de `Emprestimo`, e não de `Associado`, elimina o laço aninhado.

**E05.5** — Na forma A, ambos leem `10`, ambos gravam `11`: um incremento se perde
(*lost update*). Na forma B, o banco executa `SET n = n + 1` duas vezes: resultado `12`.

**E05.6** — A lista de ordenação permitida importa porque `order_by(entrada_do_usuario)`
permite ordenar por qualquer campo, inclusive de relações — vazando a existência e a ordem
de dados que a pessoa não deveria ver.
