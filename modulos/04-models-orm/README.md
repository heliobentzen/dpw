# M04 — Model: classes que geram o banco de dados

> **CH:** 6h (3h teóricas · 3h práticas) · **Semanas 3–4** · **Pré-requisitos:** M03
> **Ementa:** *Model: Utilização de classes para geração automática do banco de dados.*

## 🎯 Objetivos

1. Explicar o mapeamento objeto-relacional: classe→tabela, atributo→coluna, objeto→linha.
2. Escolher o campo correto para cada tipo de dado e justificar as opções usadas.
3. Modelar relacionamentos 1-1, 1-N e N-N, com a política correta de `on_delete`.
4. Colocar regras de negócio no lugar certo (model, não view).
5. Gerar o esquema do banco a partir das classes e ler o SQL produzido.

---

## 📖 Teoria (3h)

### 1. O mapeamento (30 min)

```
   MUNDO PYTHON                          MUNDO RELACIONAL
┌────────────────────┐                ┌──────────────────────────┐
│ class Obra(Model): │  ──────────▶   │ TABLE acervo_obra        │
│     titulo = Char  │  ──────────▶   │   titulo varchar(200)    │
│     ano = Integer  │  ──────────▶   │   ano integer            │
└────────────────────┘                └──────────────────────────┘
   objeto obra1        ──────────▶       linha id=1
   obra1.titulo        ──────────▶       célula
   Obra.objects.all()  ──────────▶       SELECT * FROM acervo_obra
   obra1.save()        ──────────▶       INSERT / UPDATE
```

O ORM traz três ganhos e um custo.

**Ganhos:** (a) o SQL passa a ser gerado com parâmetros — a injeção de SQL, campeã
histórica de vulnerabilidades, praticamente desaparece; (b) o mesmo código roda em
SQLite, PostgreSQL, MySQL ou Oracle; (c) o esquema é **derivado** do código, e não
mantido em paralelo (é isso que a ementa chama de *geração automática do banco*).

**Custo:** o ORM esconde o SQL. Consulta escrita sem atenção vira 500 consultas (problema
N+1, tratado no M06). Regra: **use o ORM, mas saiba ler o SQL que ele gera.**

💼 **No mercado:** entrevistas de backend perguntam "o que este código faz no banco?".
Quem só sabe a API do ORM trava; quem sabe traduzir para SQL passa.

### 2. Anatomia de um model (30 min)

```python
from django.db import models


class Autor(models.Model):
    nome = models.CharField("nome completo", max_length=150)
    nascimento = models.DateField("data de nascimento", null=True, blank=True)
    biografia = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "autor"
        verbose_name_plural = "autores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome
```

Três partes:

1. **Campos** — viram colunas.
2. **`class Meta`** — metadados: ordenação padrão, nome legível, restrições, índices.
3. **Métodos** — comportamento do objeto. `__str__` é praticamente obrigatório: sem ele,
   o admin e o shell mostram `Autor object (1)`.

Toda classe ganha automaticamente:

```python
id = models.BigAutoField(primary_key=True)   # chave primária implícita
```

### 3. Catálogo de campos (45 min)

#### Texto

| Campo | Uso | Observação |
|---|---|---|
| `CharField(max_length=N)` | Texto curto | `max_length` **obrigatório** |
| `TextField()` | Texto longo | Sem limite prático; não use para nome |
| `SlugField()` | Identificador de URL | `meu-titulo-legal` |
| `EmailField()` | E-mail | Valida formato |
| `URLField()` | URL | Valida formato |

#### Números

| Campo | Uso |
|---|---|
| `IntegerField()` | Inteiro |
| `PositiveIntegerField()` | Inteiro ≥ 0 |
| `BigIntegerField()` | Inteiros grandes |
| `DecimalField(max_digits, decimal_places)` | **Dinheiro** e valores exatos |
| `FloatField()` | Medidas científicas |

> ⚠️ **Nunca use `FloatField` para dinheiro.** `0.1 + 0.2 != 0.3` em ponto flutuante. Multa
> de biblioteca, preço, saldo: sempre `DecimalField(max_digits=8, decimal_places=2)`.

#### Data e hora

| Campo | Uso |
|---|---|
| `DateField()` | Data |
| `DateTimeField()` | Data e hora |
| `DurationField()` | Intervalo |

Opções especiais:

```python
criado_em = models.DateTimeField(auto_now_add=True)   # grava só na criação
atualizado_em = models.DateTimeField(auto_now=True)   # grava a cada save()
```

Elas são convenientes, mas **ignoram** valores que você tente atribuir e não aparecem em
formulários. Quando precisar controlar a data (ex.: registrar empréstimo retroativo), use
`default=timezone.now` em vez de `auto_now_add`.

#### Outros

| Campo | Uso |
|---|---|
| `BooleanField(default=False)` | Sim/não |
| `FileField(upload_to="docs/")` | Arquivo |
| `ImageField(upload_to="capas/")` | Imagem (requer `Pillow`) |
| `UUIDField()` | Identificador não sequencial (não revela volume de dados) |
| `JSONField()` | Dados semiestruturados |

#### Opções comuns a todos

| Opção | Efeito |
|---|---|
| `null=True` | Permite `NULL` **no banco** |
| `blank=True` | Permite vazio **na validação de formulários** |
| `default=` | Valor padrão |
| `unique=True` | Cria restrição de unicidade |
| `db_index=True` | Cria índice |
| `choices=` | Restringe a um conjunto de valores |
| `help_text=` | Texto de ajuda no formulário e no admin |
| `verbose_name=` | Rótulo legível (1º argumento posicional) |

> **`null` × `blank` — a pergunta mais frequente da disciplina.**
> `null` é sobre o **banco**; `blank` é sobre **formulários**.
> Campo de texto opcional: `blank=True` **apenas** (o vazio é `""`, não `NULL` — evita
> dois "vazios" diferentes). Campo de data/número opcional: `null=True, blank=True`.

#### `choices` com `TextChoices`

```python
class Emprestimo(models.Model):
    class Situacao(models.TextChoices):
        ATIVO = "ATIVO", "Ativo"
        DEVOLVIDO = "DEVOLVIDO", "Devolvido"
        ATRASADO = "ATRASADO", "Atrasado"

    situacao = models.CharField(max_length=10, choices=Situacao.choices, default=Situacao.ATIVO)
```

Uso: `emprestimo.situacao == Emprestimo.Situacao.ATIVO` e, para exibir o rótulo,
`emprestimo.get_situacao_display()`.

### 4. Relacionamentos (45 min)

#### 1-N — `ForeignKey`

```python
class Obra(models.Model):
    titulo = models.CharField(max_length=200)
    autor = models.ForeignKey(
        Autor,
        on_delete=models.PROTECT,
        related_name="obras",
    )
```

- **A FK fica no lado "muitos"**: muitas obras para um autor.
- `obra.autor` → o objeto Autor.
- `autor.obras.all()` → todas as obras do autor (por causa de `related_name`).

**`on_delete` — decisão de negócio, não detalhe técnico:**

| Política | Efeito ao apagar o autor | Quando usar |
|---|---|---|
| `CASCADE` | Apaga também as obras | Filho não existe sem o pai (item de pedido) |
| `PROTECT` | **Impede** apagar o autor | Dado histórico que não pode sumir |
| `RESTRICT` | Impede, com regra mais fina | Casos com múltiplos caminhos de exclusão |
| `SET_NULL` | `obra.autor = NULL` (exige `null=True`) | Referência opcional |
| `SET_DEFAULT` | Aponta para um padrão | Ex.: "Autor desconhecido" |
| `DO_NOTHING` | Nada (perigoso) | Só com integridade garantida no banco |

> Escolher `CASCADE` por inércia é a origem de perdas de dados reais: apagar um associado
> não pode apagar o histórico de empréstimos da biblioteca. Use `PROTECT`.

#### N-N — `ManyToManyField`

```python
class Obra(models.Model):
    categorias = models.ManyToManyField("Categoria", related_name="obras", blank=True)
```

O Django cria a tabela intermediária sozinho. Uso:

```python
obra.categorias.add(cat)
obra.categorias.remove(cat)
obra.categorias.set([cat1, cat2])
obra.categorias.all()
cat.obras.all()          # reverso
```

Quando a relação tem **atributos próprios** (data, quantidade, situação), use `through`:

```python
class Emprestimo(models.Model):
    associado = models.ForeignKey("Associado", on_delete=models.PROTECT, related_name="emprestimos")
    exemplar = models.ForeignKey("Exemplar", on_delete=models.PROTECT, related_name="emprestimos")
    emprestado_em = models.DateField(default=timezone.localdate)
    previsao_devolucao = models.DateField()
    devolvido_em = models.DateField(null=True, blank=True)
```

Aqui `Emprestimo` **é** a tabela intermediária — e é um model de primeira classe, porque
carrega regras de negócio.

#### 1-1 — `OneToOneField`

```python
class PerfilAssociado(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    telefone = models.CharField(max_length=20, blank=True)
```

Padrão clássico para estender o usuário sem trocar o model de autenticação (M12).

#### Referência por string e `self`

```python
autor = models.ForeignKey("Autor", ...)                    # evita problema de ordem
indicada_por = models.ForeignKey("self", null=True, ...)   # auto-relacionamento
livro = models.ForeignKey("acervo.Obra", ...)              # outro app
```

### 5. Regras de negócio no model (30 min)

O erro mais comum de quem está aprendendo é espalhar regra de negócio pelas views. Se a
regra vive no model, ela vale para a view, para o admin, para o shell, para o comando
agendado e para a API.

```python
class Emprestimo(models.Model):
    PRAZO_DIAS = 14
    LIMITE_POR_ASSOCIADO = 3

    # ... campos ...

    @property
    def esta_atrasado(self) -> bool:
        return self.devolvido_em is None and self.previsao_devolucao < timezone.localdate()

    @property
    def dias_de_atraso(self) -> int:
        if not self.esta_atrasado:
            return 0
        return (timezone.localdate() - self.previsao_devolucao).days

    def devolver(self):
        """Registra a devolução e libera o exemplar."""
        self.devolvido_em = timezone.localdate()
        self.situacao = self.Situacao.DEVOLVIDO
        self.save(update_fields=["devolvido_em", "situacao"])

    def __str__(self):
        return f"{self.exemplar} → {self.associado} ({self.emprestado_em:%d/%m/%Y})"
```

**Integridade no banco, com `Meta.constraints`** — validação de formulário pode ser
contornada; restrição no banco, não:

```python
class Meta:
    constraints = [
        models.CheckConstraint(
            condition=models.Q(previsao_devolucao__gte=models.F("emprestado_em")),
            name="previsao_apos_emprestimo",
        ),
        models.UniqueConstraint(
            fields=["exemplar"],
            condition=models.Q(devolvido_em__isnull=True),
            name="exemplar_com_um_emprestimo_ativo",
        ),
    ]
```

A segunda restrição é elegante: garante que **um exemplar não pode estar emprestado duas
vezes ao mesmo tempo**, no nível do banco. Nenhuma corrida entre duas requisições
simultâneas consegue burlar isso.

> Em Django < 5.1 o parâmetro de `CheckConstraint` chama-se `check=` em vez de
> `condition=`. Confira a versão do seu projeto.

### 6. Do model ao banco (30 min)

```bash
python manage.py makemigrations     # gera o arquivo de migração (Python)
python manage.py migrate            # aplica no banco (executa o SQL)
python manage.py sqlmigrate acervo 0001   # MOSTRA o SQL, sem executar
```

Saída típica de `sqlmigrate`:

```sql
CREATE TABLE "acervo_autor" (
    "id" bigint NOT NULL PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    "nome" varchar(150) NOT NULL,
    "nascimento" date NULL,
    "biografia" text NOT NULL,
    "criado_em" timestamp with time zone NOT NULL
);
```

**Rode `sqlmigrate` sempre.** É a ponte entre o que você escreveu em Python e o que existe
no banco — e é o que separa quem entende do que decora.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Modelar o BiblioCom no papel (30 min)

Antes de escrever código, responda em grupo:

1. Quais **entidades** existem? (substantivos do domínio)
2. Quais **atributos** cada uma tem?
3. Quais **relações** e de que cardinalidade?
4. O que acontece ao apagar cada entidade?

Modelo de referência:

```
Autor ──1:N── Obra ──N:N── Categoria
                │
             1:N│
                ▼
            Exemplar ──1:N── Emprestimo ──N:1── Associado
                                                    │
                                                 1:1│
                                                    ▼
                                                  User
Editora ──1:N── Obra
```

**Decisão importante:** por que separar `Obra` de `Exemplar`? Porque a biblioteca pode ter
3 cópias de *Dom Casmurro*. A **obra** é a informação bibliográfica (título, autor, ISBN);
o **exemplar** é o objeto físico que se empresta (número de tombo, estado de conservação).
Confundir os dois impede controlar empréstimos corretamente — é o erro de modelagem nº 1
neste domínio.

### Passo 2 — Escrever os models (60 min)

```python
# acervo/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone


class Autor(models.Model):
    nome = models.CharField("nome", max_length=150)
    nascimento = models.DateField("nascimento", null=True, blank=True)
    biografia = models.TextField("biografia", blank=True)

    class Meta:
        verbose_name = "autor"
        verbose_name_plural = "autores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Editora(models.Model):
    nome = models.CharField(max_length=150, unique=True)
    cidade = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Categoria(models.Model):
    nome = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True)

    class Meta:
        verbose_name_plural = "categorias"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Obra(models.Model):
    titulo = models.CharField("título", max_length=200)
    subtitulo = models.CharField("subtítulo", max_length=200, blank=True)
    autor = models.ForeignKey(Autor, on_delete=models.PROTECT, related_name="obras")
    editora = models.ForeignKey(
        Editora, on_delete=models.SET_NULL, null=True, blank=True, related_name="obras"
    )
    categorias = models.ManyToManyField(Categoria, related_name="obras", blank=True)
    ano_publicacao = models.PositiveIntegerField("ano de publicação", null=True, blank=True)
    isbn = models.CharField("ISBN", max_length=13, blank=True, db_index=True)
    sinopse = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["titulo"]
        indexes = [models.Index(fields=["titulo"])]

    def __str__(self):
        return self.titulo

    @property
    def exemplares_disponiveis(self):
        return self.exemplares.filter(emprestimos__devolvido_em__isnull=True).count()


class Exemplar(models.Model):
    class Estado(models.TextChoices):
        NOVO = "NOVO", "Novo"
        BOM = "BOM", "Bom"
        DESGASTADO = "DESGASTADO", "Desgastado"
        BAIXADO = "BAIXADO", "Baixado"

    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name="exemplares")
    tombo = models.CharField("nº de tombo", max_length=20, unique=True)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.BOM)
    adquirido_em = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ["obra__titulo", "tombo"]

    def __str__(self):
        return f"{self.obra.titulo} [{self.tombo}]"

    @property
    def disponivel(self) -> bool:
        if self.estado == self.Estado.BAIXADO:
            return False
        return not self.emprestimos.filter(devolvido_em__isnull=True).exists()


class Associado(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="associado",
        null=True, blank=True,
    )
    nome = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    ativo = models.BooleanField(default=True)
    inscrito_em = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome

    @property
    def emprestimos_ativos(self):
        return self.emprestimos.filter(devolvido_em__isnull=True)

    @property
    def pode_pegar_emprestado(self) -> bool:
        return self.ativo and self.emprestimos_ativos.count() < Emprestimo.LIMITE_POR_ASSOCIADO


class Emprestimo(models.Model):
    PRAZO_DIAS = 14
    LIMITE_POR_ASSOCIADO = 3

    exemplar = models.ForeignKey(Exemplar, on_delete=models.PROTECT, related_name="emprestimos")
    associado = models.ForeignKey(Associado, on_delete=models.PROTECT, related_name="emprestimos")
    emprestado_em = models.DateField(default=timezone.localdate)
    previsao_devolucao = models.DateField()
    devolvido_em = models.DateField(null=True, blank=True)
    observacao = models.TextField(blank=True)

    class Meta:
        ordering = ["-emprestado_em"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(previsao_devolucao__gte=models.F("emprestado_em")),
                name="previsao_apos_emprestimo",
            ),
            models.UniqueConstraint(
                fields=["exemplar"],
                condition=models.Q(devolvido_em__isnull=True),
                name="exemplar_com_um_emprestimo_ativo",
            ),
        ]

    def __str__(self):
        return f"{self.exemplar} → {self.associado}"

    def save(self, *args, **kwargs):
        if not self.previsao_devolucao:
            self.previsao_devolucao = self.emprestado_em + timezone.timedelta(days=self.PRAZO_DIAS)
        super().save(*args, **kwargs)

    @property
    def esta_atrasado(self) -> bool:
        return self.devolvido_em is None and self.previsao_devolucao < timezone.localdate()

    @property
    def dias_de_atraso(self) -> int:
        if not self.esta_atrasado:
            return 0
        return (timezone.localdate() - self.previsao_devolucao).days

    def devolver(self):
        self.devolvido_em = timezone.localdate()
        self.save(update_fields=["devolvido_em"])
```

> `timezone.timedelta` é reexportado por `django.utils.timezone`; se preferir explicitar,
> use `from datetime import timedelta`.

### Passo 3 — Gerar o banco e ler o SQL (30 min)

```bash
python manage.py makemigrations acervo
python manage.py sqlmigrate acervo 0001     # LEIA a saída inteira
python manage.py migrate
```

Perguntas para responder olhando o SQL:

1. Quantas tabelas foram criadas? Por que há uma a mais do que models?
2. Onde está a coluna que implementa o `ForeignKey` de `Obra` para `Autor`?
3. Como a restrição `exemplar_com_um_emprestimo_ativo` apareceu no SQL?
4. Quais índices foram criados sem você pedir? Por quê?

### Passo 4 — Popular e explorar no shell (40 min)

```bash
python manage.py shell
```

```python
from datetime import date
from acervo.models import Autor, Editora, Categoria, Obra, Exemplar, Associado, Emprestimo

machado = Autor.objects.create(nome="Machado de Assis", nascimento=date(1839, 6, 21))
cia = Editora.objects.create(nome="Companhia das Letras", cidade="São Paulo")
romance = Categoria.objects.create(nome="Romance", slug="romance")

dom = Obra.objects.create(titulo="Dom Casmurro", autor=machado, editora=cia, ano_publicacao=1899)
dom.categorias.add(romance)

Exemplar.objects.create(obra=dom, tombo="0001")
Exemplar.objects.create(obra=dom, tombo="0002")

ana = Associado.objects.create(nome="Ana Souza", email="ana@exemplo.org")

# navegação pelas relações
dom.autor.nome
machado.obras.all()
dom.exemplares.count()
dom.categorias.all()
romance.obras.all()

# regras de negócio
ex1 = dom.exemplares.first()
ex1.disponivel                       # True
emp = Emprestimo.objects.create(exemplar=ex1, associado=ana)
emp.previsao_devolucao               # calculada no save()
ex1.disponivel                       # False
ana.pode_pegar_emprestado            # True (1 de 3)

# a restrição do banco em ação
Emprestimo.objects.create(exemplar=ex1, associado=ana)   # -> IntegrityError
```

O último comando **deve** falhar. Se não falhar, a restrição não foi aplicada — refaça o
`migrate`. Ver a integridade sendo defendida pelo banco é o momento mais importante deste
módulo.

### Passo 5 — Fixtures para dados de exemplo (20 min)

```bash
python manage.py dumpdata acervo --indent 2 > acervo/fixtures/exemplo.json
# recarregar em outra máquina / após recriar o banco:
python manage.py loaddata exemplo
```

Versione a fixture: toda a equipe passa a partir do mesmo estado.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `CharField` sem `max_length` | Obrigatório |
| `null=True` em `CharField` | Use só `blank=True`; dois vazios distintos criam bugs |
| `FloatField` para dinheiro | `DecimalField(max_digits=8, decimal_places=2)` |
| `on_delete=CASCADE` por padrão | Decida pelo negócio; histórico usa `PROTECT` |
| Regra de negócio na view | Coloque no model — vale para admin, shell e API também |
| Sem `__str__` | Admin e shell viram `Objeto (1)` |
| `related_name` ausente | Acesso reverso vira `obra_set`, ilegível |
| Um único model gigante | Separe entidades; `Obra` ≠ `Exemplar` |
| Esquecer `makemigrations` | Model muda, banco não; erro só aparece na próxima consulta |

## ✅ Checklist de saída

- [ ] 7 models criados, com `__str__`, `Meta` e `related_name`
- [ ] Ao menos um 1-N, um N-N e um 1-1 no modelo
- [ ] Cada `on_delete` justificado por escrito
- [ ] `sqlmigrate` executado e as 4 perguntas do Passo 3 respondidas
- [ ] Ao menos uma `CheckConstraint` e uma `UniqueConstraint` funcionando
- [ ] Dados de exemplo criados no shell e exportados como fixture
- [ ] `IntegrityError` reproduzido de propósito

## 📦 Entrega E1 — Modelo de dados

1. Diagrama entidade-relacionamento (Mermaid, dbdiagram.io ou desenho) do BiblioCom.
2. `models.py` completo e migrado.
3. Tabela justificando cada `on_delete` escolhido.
4. Saída de `sqlmigrate` com as respostas do Passo 3.
5. Fixture com pelo menos 5 obras, 10 exemplares e 5 associados.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [Django — Models](https://docs.djangoproject.com/pt-br/5.0/topics/db/models/)
- [Django — Referência de campos](https://docs.djangoproject.com/en/5.0/ref/models/fields/)
- [Django — Constraints](https://docs.djangoproject.com/en/5.0/ref/models/constraints/)
- [Django — Relacionamentos](https://docs.djangoproject.com/en/5.0/topics/db/examples/)
