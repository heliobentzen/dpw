# M05 — Migrações: atualizar o banco a partir das classes

> **CH:** 3h (1h teórica · 2h práticas) · **Semanas 4–5** · **Pré-requisito:** M04
> **Ementa:** *Atualização do banco de dados a partir das alterações nas classes geradoras.*

Este módulo trata do que separa um projeto de laboratório de um sistema em produção: como
mudar o esquema do banco **sem perder dados** e **sem quebrar o trabalho da equipe**.

## 🎯 Objetivos

1. Explicar o que é uma migração e por que ela é código versionado.
2. Evoluir o esquema: adicionar, alterar, renomear e remover campos com segurança.
3. Escrever migrações de dados (`RunPython`) com função reversa.
4. Resolver conflitos de migração em equipe.
5. Trocar de SGBD (SQLite → PostgreSQL) sem alterar o código da aplicação.

---

## 📖 Teoria (1h)

### 1. O que é uma migração

Uma migração é um **arquivo Python versionado** que descreve uma mudança de esquema:

```python
# acervo/migrations/0002_obra_isbn.py
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("acervo", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="obra",
            name="isbn",
            field=models.CharField(blank=True, db_index=True, max_length=13, verbose_name="ISBN"),
        ),
    ]
```

Três propriedades que importam:

- **É código** → entra no Git, é revisado em Pull Request, tem histórico e autoria.
- **É ordenada** → `dependencies` forma um grafo; o Django aplica na ordem correta.
- **É registrada** → a tabela `django_migrations` guarda o que já rodou, então `migrate`
  é seguro de repetir.

```
models.py (o que eu quero)  ──makemigrations──▶  0002_....py (a receita)
                                                        │
                                                     migrate
                                                        ▼
                                             banco de dados (o que existe)
```

**`makemigrations` gera; `migrate` aplica.** Confundir os dois é o erro nº 1 do módulo.

### 2. Por que não fazer `ALTER TABLE` na mão

| Sem migrações | Com migrações |
|---|---|
| Cada dev roda SQL diferente | Todos rodam a mesma coisa, na mesma ordem |
| Produção diverge de desenvolvimento | Ambientes convergem |
| Não há como voltar atrás | `migrate app 0003` reverte |
| Deploy é ritual manual | Deploy roda `migrate` automaticamente |
| Ninguém sabe o histórico do esquema | O Git conta a história |

### 3. Operações mais comuns

| Operação | Gerada quando |
|---|---|
| `CreateModel` | Model novo |
| `DeleteModel` | Model removido |
| `AddField` / `RemoveField` | Campo adicionado/removido |
| `AlterField` | Tipo ou opções de campo mudaram |
| `RenameField` / `RenameModel` | Renomeação (o Django pergunta) |
| `AddConstraint` / `RemoveConstraint` | Restrições |
| `AddIndex` / `RemoveIndex` | Índices |
| `RunPython` | Migração de **dados** (escrita por você) |
| `RunSQL` | SQL bruto (último recurso) |

### 4. O caso do campo obrigatório novo

Ao adicionar um campo `NOT NULL` numa tabela com dados, o Django pergunta:

```
You are trying to add a non-nullable field 'isbn' to obra without a default;
we can't do that (the database needs something to populate existing rows).
```

O banco precisa saber **o que colocar nas linhas que já existem**. Três saídas:

| Estratégia | Quando |
|---|---|
| `null=True, blank=True` | O campo é mesmo opcional |
| `default=...` | Existe um valor padrão sensato |
| **Expandir → migrar → contrair** | O campo é obrigatório e precisa de valor real |

O terceiro padrão, em três migrações:

1. **Expandir** — adiciona o campo como `null=True`.
2. **Migrar dados** — `RunPython` preenche as linhas existentes.
3. **Contrair** — `AlterField` para `null=False`.

É a única forma segura em produção com tabela grande — e é também o padrão que permite
deploy **sem downtime**, porque em nenhum momento o banco fica incompatível com a versão
da aplicação que está rodando.

### 5. Migração de dados

```python
# acervo/migrations/0004_preenche_slug_categoria.py
from django.db import migrations
from django.utils.text import slugify


def preencher_slugs(apps, schema_editor):
    # Use apps.get_model, NUNCA o import direto do model!
    Categoria = apps.get_model("acervo", "Categoria")
    for categoria in Categoria.objects.filter(slug=""):
        categoria.slug = slugify(categoria.nome)
        categoria.save(update_fields=["slug"])


def limpar_slugs(apps, schema_editor):
    Categoria = apps.get_model("acervo", "Categoria")
    Categoria.objects.update(slug="")


class Migration(migrations.Migration):
    dependencies = [("acervo", "0003_categoria_slug")]

    operations = [
        migrations.RunPython(preencher_slugs, reverse_code=limpar_slugs),
    ]
```

> ⚠️ **Por que `apps.get_model` e não `from acervo.models import Categoria`?**
> A migração precisa da versão **histórica** do model, como ele era naquele ponto do
> tempo. Importar do `models.py` traz o model **atual** — e a migração quebra assim que
> alguém alterar a classe. É a armadilha mais sutil deste módulo.

Sempre forneça `reverse_code`. Migração sem reversão é uma porta que só abre.

### 6. Migrações em equipe

O conflito clássico:

```
main:      0002_obra_isbn
             ├── Ana:   0003_obra_sinopse
             └── Bruno: 0003_obra_edicao        ← dois "0003": conflito
```

Ao rodar `migrate`, o Django avisa: *Conflicting migrations detected; multiple leaf nodes*.

```bash
python manage.py makemigrations --merge     # cria 0004_merge_... unindo os ramos
```

**Prevenção**, que custa menos que a cura:

1. `git pull` **antes** de mexer em `models.py`.
2. Uma pessoa por vez altera models no mesmo app, por sprint.
3. Nomeie as migrações: `makemigrations acervo --name adiciona_isbn`.
4. Revise migrações no Pull Request como revisa código.
5. **Nunca** edite uma migração já aplicada por outra pessoa ou em produção — crie uma nova.

---

## 🛠️ Roteiro prático (2h)

> 📦 **Instale o Docker antes desta aula** — ele entra no Passo 5, quando trocamos o SQLite
> pelo PostgreSQL. Até aqui não era necessário.
> 🐧 [`ambiente-setup.md`, seção 7](../../docs/ambiente-setup.md#7-postgresql-via-docker-a-partir-do-m05) ·
> 🪟 [`ambiente-setup-windows.md`, passo 8](../../docs/ambiente-setup-windows.md#passo-8--docker-e-postgresql)
> — no Windows, o Docker exige o WSL2, então **não deixe para a hora da aula**.

### Passo 1 — Ciclo básico (20 min)

Adicione ao model `Obra`:

```python
edicao = models.PositiveSmallIntegerField("edição", null=True, blank=True)
```

```bash
python manage.py makemigrations acervo --name adiciona_edicao_obra
python manage.py showmigrations acervo
python manage.py sqlmigrate acervo 0002
python manage.py migrate
python manage.py showmigrations acervo      # agora com [X]
```

### Passo 2 — O prompt do campo obrigatório (20 min)

Adicione, **de propósito sem default**:

```python
codigo_interno = models.CharField(max_length=20)
```

```bash
python manage.py makemigrations acervo
```

Leia o prompt com atenção. Escolha a opção 1 e informe `"SEM-CODIGO"`. Depois:

```bash
python manage.py sqlmigrate acervo 0003     # veja o DEFAULT temporário no SQL
python manage.py migrate
```

No shell, confira que as obras existentes ficaram com `SEM-CODIGO`. Responda: **por que o
default aparece no SQL mas não fica no model?**

### Passo 3 — Expandir → migrar → contrair (40 min) ⭐

Objetivo: dar a cada `Categoria` um `slug` obrigatório e único, **sem perder dados**.

**3.1 — Expandir.** Em `models.py`:

```python
class Categoria(models.Model):
    nome = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, null=True, blank=True)   # temporariamente opcional
```

```bash
python manage.py makemigrations acervo --name expande_slug_categoria
python manage.py migrate
```

**3.2 — Migrar dados.** Crie a migração vazia e escreva o `RunPython`:

```bash
python manage.py makemigrations acervo --empty --name preenche_slug_categoria
```

```python
from django.db import migrations
from django.utils.text import slugify


def preencher(apps, schema_editor):
    Categoria = apps.get_model("acervo", "Categoria")
    usados = set()
    for c in Categoria.objects.all():
        base = slugify(c.nome) or f"categoria-{c.pk}"
        slug, n = base, 1
        while slug in usados:
            n += 1
            slug = f"{base}-{n}"
        usados.add(slug)
        c.slug = slug
        c.save(update_fields=["slug"])


def reverter(apps, schema_editor):
    apps.get_model("acervo", "Categoria").objects.update(slug=None)


class Migration(migrations.Migration):
    dependencies = [("acervo", "0004_expande_slug_categoria")]
    operations = [migrations.RunPython(preencher, reverse_code=reverter)]
```

```bash
python manage.py migrate
```

**3.3 — Contrair.** Agora sim, torne obrigatório e único:

```python
slug = models.SlugField(max_length=90, unique=True)
```

```bash
python manage.py makemigrations acervo --name contrai_slug_categoria
python manage.py migrate
```

**3.4 — Reverter tudo e refazer**, para provar que o caminho de volta existe:

```bash
python manage.py migrate acervo 0003
python manage.py migrate acervo
```

### Passo 4 — Renomear sem perder dados (15 min)

Renomeie `Obra.sinopse` para `Obra.resumo`:

```bash
python manage.py makemigrations acervo
# Did you rename obra.sinopse to obra.resumo (a TextField)? [y/N] -> y
```

Responda **y**. Se responder **N**, o Django gera `RemoveField` + `AddField` — e **todos
os dados da coluna são perdidos**. Prove: crie uma obra com sinopse, faça o caminho
errado num branch de teste e observe.

### Passo 5 — Trocar SQLite por PostgreSQL (25 min)

Este passo demonstra a promessa central do ORM: **o código da aplicação não muda**.

```bash
# Linux / macOS / WSL / Git Bash
docker compose up -d          # docker-compose.yml em docs/ambiente-setup.md, seção 7
pip install "psycopg[binary]" dj-database-url
pip freeze > requirements.txt
```

```powershell
# Windows PowerShell
docker compose up -d          # docker-compose.yml em docs/ambiente-setup-windows.md, passo 8.3
pip install "psycopg[binary]" dj-database-url
pip freeze | Out-File -FilePath requirements.txt -Encoding ascii
```

> 🪟 `Out-File -Encoding ascii` em vez de `>`: no PowerShell 5.1 o `>` grava o arquivo em
> UTF-16 e o `pip install -r` falha depois, na máquina de quem clonar.

```bash
# .env
DATABASE_URL=postgres://bibliocom:devpassword@localhost:5432/bibliocom
```

```python
# config/settings.py
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}
```

```bash
python manage.py migrate                       # cria tudo do zero no PostgreSQL
python manage.py loaddata exemplo              # recarrega a fixture do M04
python manage.py runserver
```

Compare o SQL nos dois bancos:

```bash
python manage.py sqlmigrate acervo 0001
```

**Nenhuma linha de `models.py`, `views.py` ou template mudou.** Escreva 3 diferenças que
você notou entre os SQLs gerados.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Editar migração já aplicada em produção | Crie uma nova migração |
| `from acervo.models import X` dentro de `RunPython` | Use `apps.get_model` |
| Apagar `migrations/` para "resolver" | Destrói o histórico; use `migrate app zero` em dev |
| Responder "N" ao prompt de rename | Perde os dados da coluna |
| Não versionar migrações | O banco de cada pessoa fica diferente |
| `migrate` sem `makemigrations` | Nada acontece — você não gerou a receita |
| `makemigrations` sem `migrate` | O banco continua velho; erro só aparece na consulta |
| `RunPython` sem `reverse_code` | Impede reverter o deploy |
| Deploy sem `migrate` | `ProgrammingError: column does not exist` em produção |

## ✅ Checklist de saída

- [ ] Sei explicar a diferença entre `makemigrations` e `migrate` sem hesitar
- [ ] Executei o padrão expandir → migrar → contrair completo
- [ ] Escrevi um `RunPython` com `apps.get_model` e `reverse_code`
- [ ] Revertei e reapliquei migrações
- [ ] Renomeei um campo preservando os dados
- [ ] Projeto rodando em PostgreSQL, com a fixture recarregada
- [ ] Todas as migrações versionadas no Git
- [ ] Simulei e resolvi um conflito de migração com `--merge`

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Django — Migrations](https://docs.djangoproject.com/pt-br/5.0/topics/migrations/)
- [Django — Writing database migrations](https://docs.djangoproject.com/en/5.0/howto/writing-migrations/)
- [Zero-downtime migrations (padrão expand/contract)](https://martinfowler.com/bliki/ParallelChange.html)
