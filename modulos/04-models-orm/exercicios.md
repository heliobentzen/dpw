# M04 — Exercícios

## E03.1 — Escolher o campo certo (individual)

Para cada dado, indique o campo, as opções e justifique:

| # | Dado | Campo + opções | Justificativa |
|---|---|---|---|
| 1 | CPF do associado | | |
| 2 | Valor da multa por atraso | | |
| 3 | Data de nascimento (opcional) | | |
| 4 | Foto da capa da obra | | |
| 5 | Aceita receber avisos por e-mail | | |
| 6 | Observações do bibliotecário (opcional, longo) | | |
| 7 | Número de páginas | | |
| 8 | Identificador público na URL, sem revelar quantos registros existem | | |
| 9 | Situação do empréstimo (ativo/devolvido/atrasado) | | |
| 10 | Momento exato do registro no sistema | | |

Pegadinhas: 1 (é número? `unique`? guardar CPF exige base legal na LGPD — discuta),
2 (**nunca** `FloatField`), 8 (`UUIDField`).

---

## E03.2 — `on_delete` como decisão de negócio (individual)

Para cada relação do BiblioCom, escolha a política e justifique em uma frase de negócio
(não técnica):

| Relação | `on_delete` | Justificativa de negócio |
|---|---|---|
| `Obra.autor` → `Autor` | | |
| `Obra.editora` → `Editora` | | |
| `Exemplar.obra` → `Obra` | | |
| `Emprestimo.exemplar` → `Exemplar` | | |
| `Emprestimo.associado` → `Associado` | | |
| `Associado.user` → `User` | | |

Depois responda: **o que aconteceria de errado se todas fossem `CASCADE`?** Dê um exemplo
concreto com nomes e datas.

---

## E03.3 — Modelar um domínio novo (em equipe) ⭐

Escolha **um** domínio abaixo (ou proponha outro, ligado ao tema do projeto da equipe) e
modele-o completamente:

- **Horta comunitária**: canteiros, culturas, plantios, colheitas, voluntários, escalas
- **Ponto de coleta de recicláveis**: materiais, pesagens, cooperados, repasses
- **Reforço escolar**: turmas, estudantes, encontros, frequência, avaliações
- **Feira de agricultura familiar**: produtores, bancas, produtos, preços por semana

Requisitos mínimos:

- 5+ entidades
- ao menos um 1-N, um N-N (com atributos → use `through`) e um 1-1
- ao menos 2 `TextChoices`
- ao menos 1 `CheckConstraint` e 1 `UniqueConstraint` que expressem regras reais
- ao menos 3 `@property` ou métodos com regra de negócio
- todos os `__str__` implementados

**Entrega:** `models.py` + migração aplicada + diagrama Mermaid + saída de `sqlmigrate`.

---

## E03.4 — Ler o SQL (individual)

Rode `python manage.py sqlmigrate acervo 0001` e responda:

1. Quantas tabelas foram criadas? Por que há mais tabelas do que classes?
2. Qual o tipo SQL de `CharField(max_length=200)`? E de `TextField`? Qual a diferença real?
3. Onde está a coluna da FK `Obra.autor`? Qual o nome dela?
4. Que índices foram criados automaticamente? Por que FKs ganham índice?
5. Como a `UniqueConstraint` condicional apareceu no SQL?
6. Compare a mesma migração em SQLite e PostgreSQL (`sqlmigrate` com cada `DATABASES`).
   Cite duas diferenças.

---

## E03.5 — Restrições em ação (individual)

Prove, no shell, que cada restrição funciona. Para cada uma, mostre o código que **falha**
e o erro:

1. Criar dois exemplares com o mesmo tombo.
2. Emprestar duas vezes o mesmo exemplar sem devolver.
3. Criar empréstimo com `previsao_devolucao` anterior a `emprestado_em`.
4. Apagar um autor que tem obras.
5. Apagar uma obra que tem exemplares (o que acontece com os exemplares? por quê?).

---

## E03.6 — Regra de negócio no lugar certo (individual)

Implemente no model `Associado`:

```python
@property
def total_de_atrasos_historicos(self) -> int:
    """Quantos empréstimos deste associado foram devolvidos com atraso."""

@property
def esta_bloqueado(self) -> bool:
    """Bloqueado se tem empréstimo em atraso OU 3+ atrasos históricos."""

def multa_devida(self) -> Decimal:
    """R$ 0,50 por dia de atraso, somando todos os empréstimos em aberto."""
```

Escreva também 3 casos de teste manuais no shell que provem cada uma.

Responda: **por que essas regras devem ficar no model e não na view?** Cite dois lugares
do sistema, além da view, que se beneficiam disso.

---

## E03.7 — Refatorar um model ruim (individual)

Este model tem **pelo menos 12 problemas**. Encontre e corrija todos:

```python
class Livro(models.Model):
    titulo = models.TextField()
    autor = models.CharField(max_length=100, null=True)
    preco = models.FloatField()
    data = models.CharField(max_length=10)
    categoria = models.CharField(max_length=50)
    disponivel = models.CharField(max_length=3)
    dono = models.ForeignKey("Usuario", on_delete=models.CASCADE)
    email_contato = models.CharField(max_length=200, null=True, blank=True)
    quantidade = models.IntegerField()
    obs = models.CharField(max_length=5000)
```

**Entrega:** a versão corrigida + tabela "problema → correção → por quê".

---

## Gabarito parcial

**E03.1 (2)** — `DecimalField(max_digits=6, decimal_places=2)`. `FloatField` acumula erro
binário: somar 100 multas de R$ 0,10 não dá exatamente R$ 10,00.

**E03.2** — `Emprestimo.associado` deve ser `PROTECT`: o histórico de empréstimos é o
registro contábil da biblioteca. Se fosse `CASCADE`, apagar o cadastro de Ana em 2026
apagaria os 40 empréstimos dela desde 2023, e o acervo passaria a "não ter" saída
registrada de exemplares que estão fora.

**E03.7 (amostra)** — `titulo` deveria ser `CharField(max_length=200)` (`TextField` não
tem limite e não indexa bem); `autor` deveria ser FK, não texto livre (duplicação e erro
de digitação); `preco` deve ser `DecimalField`; `data` como `CharField` impede ordenar e
filtrar por período; `disponivel` como `CharField(3)` deveria ser `BooleanField`;
`null=True` em `CharField` cria dois vazios; falta `__str__`, `Meta`, `related_name` e
`verbose_name`.
