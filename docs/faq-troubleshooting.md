# FAQ e troubleshooting

Erros reais, na ordem em que aparecem no semestre. Antes de pedir ajuda, **leia a última
linha do traceback** — ela quase sempre diz o que fazer.

## Como ler um traceback

```
Traceback (most recent call last):
  File ".../views.py", line 22, in detalhe          <- SEU código: comece por aqui
    obra = Obra.objects.get(pk=pk)
  File ".../django/db/models/query.py", line 649    <- código do framework
    raise self.model.DoesNotExist(...)
acervo.models.Obra.DoesNotExist: Obra matching query does not exist.
```

Ordem de leitura: (1) última linha — tipo e mensagem; (2) a linha mais recente que aponta
para **um arquivo seu**; (3) o resto, só se necessário.

---

## Ambiente

**`ModuleNotFoundError: No module named 'django'`**
Ambiente virtual não ativado, ou pacote instalado em outro interpretador.
```bash
which python      # Linux/macOS — deve apontar para .venv/bin/python
where python      # Windows
pip list | grep -i django
```

**`Activate.ps1 cannot be loaded because running scripts is disabled` (Windows)**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**`pip install` falha com erro de SSL/proxy no laboratório**
```bash
pip install --proxy http://usuario:senha@proxy:porta django
# ou, quando o laboratório usa certificado próprio:
pip install --cert /caminho/do/certificado.pem django
```
Nunca use `--trusted-host` como solução permanente.

---

## `manage.py` e servidor

**`Error: That port is already in use.`**
```bash
python manage.py runserver 8001          # ou libere a porta:
lsof -ti:8000 | xargs kill -9            # Linux/macOS
netstat -ano | findstr :8000             # Windows -> taskkill /PID <pid> /F
```

**`You have N unapplied migration(s)`**
Aviso, não erro. `python manage.py migrate`.

**`django.core.exceptions.ImproperlyConfigured: settings are not configured`**
Você rodou um script Python solto que importa models. Use `python manage.py shell` (ou
`shell_plus`), nunca `python meu_script.py`.

**Alterei o código e nada mudou**
O `runserver` recarrega ao salvar — mas não em três casos: (a) erro de sintaxe impediu o
reload (olhe o terminal); (b) você editou `settings.py` de forma que quebrou o import;
(c) o arquivo salvo não é o que está rodando (duas cópias do projeto abertas). Pare com
`Ctrl+C` e suba de novo.

---

## Models e migrações

**`no such table: acervo_obra`**
Faltou aplicar a migração: `python manage.py makemigrations && python manage.py migrate`.

**`You are trying to add a non-nullable field 'X' to obra without a default`**
O Django pergunta o que colocar nas linhas já existentes. Opções:
1. `null=True, blank=True` no campo;
2. `default=...` no campo;
3. Escolher a opção 1 do prompt e digitar um valor único agora.

**`Conflicting migrations detected; multiple leaf nodes`**
Duas pessoas geraram migrações a partir do mesmo ponto. Correção:
```bash
python manage.py makemigrations --merge
```
Prevenção: quem mexe em `models.py` avisa a equipe e faz `git pull` antes.

**Migração inconsistente no ambiente local (só em desenvolvimento!)**
```bash
python manage.py migrate acervo zero    # desfaz as migrações do app
# ou, último recurso em dev:
rm db.sqlite3 && python manage.py migrate && python manage.py createsuperuser
```
⚠️ Isso apaga dados. **Nunca** em produção.

**`ValueError: Cannot assign "<Autor: X>": "Obra.autor" must be a "Autor" instance.`**
Você atribuiu um id onde se espera o objeto. Use `obra.autor = autor` ou
`obra.autor_id = autor.id`.

---

## Views e URLs

**`Page not found (404)` com "Using the URLconf defined in..."**
O Django lista os padrões que tentou. Compare com a URL digitada — quase sempre é barra
final faltando ou `include()` esquecido em `urls.py` do projeto.

**`NoReverseMatch: Reverse for 'obra_detail' not found`**
Causas: nome errado, namespace faltando (`{% url 'acervo:obra_detail' %}`), ou argumentos
insuficientes (`{% url 'acervo:obra_detail' obra.pk %}`).

**`TypeError: detalhe() got an unexpected keyword argument 'pk'`**
O nome do parâmetro na URL (`<int:pk>`) precisa bater com o da função (`def detalhe(request, pk)`).

**`ImproperlyConfigured: ... didn't return an HttpResponse object. It returned None`**
Faltou `return` na view.

**Formulário POST retorna `403 Forbidden — CSRF verification failed`**
Faltou `{% csrf_token %}` dentro do `<form method="post">`. Não desative o middleware.

---

## Templates

**`TemplateDoesNotExist: acervo/obra_list.html`**
Verifique: (1) o app está em `INSTALLED_APPS`; (2) o caminho é
`acervo/templates/acervo/obra_list.html` (o nome do app **repetido**); (3) o nome do
arquivo, incluindo maiúsculas — Linux diferencia, Windows não.

**Variável aparece vazia no template**
O DTL **silencia** erros de variável inexistente. Verifique o dicionário de contexto e o
nome. Para depurar: `{{ objeto|pprint }}` ou `python manage.py shell`.

**Meu CSS não carrega**
Checklist: `{% load static %}` no topo; `{% static 'css/estilo.css' %}`; arquivo em
`app/static/app/css/estilo.css`; `STATIC_URL` definido; em produção, `collectstatic`
executado; cache do navegador (`Ctrl+Shift+R`).

**`Invalid block tag ... Did you forget to register or load this tag?`**
Falta `{% load %}` da biblioteca, ou você escreveu `{% endfor %}` faltando/errado acima.

---

## Banco de dados

**`django.db.utils.OperationalError: could not connect to server` (PostgreSQL)**
```bash
docker compose ps           # o container está de pé e healthy?
docker compose logs db
```
Confira host (`localhost` fora do Docker, `db` dentro), porta, usuário e senha.

**`FATAL: database "bibliocom" does not exist`**
O banco não foi criado. Recrie o volume: `docker compose down -v && docker compose up -d`.

**`UNIQUE constraint failed`**
Você tentou gravar valor duplicado num campo `unique=True`. Trate com `try/except
IntegrityError` ou valide antes no form.

---

## Autenticação

**Login "funciona" mas cai de volta na tela de login**
Cookies bloqueados, `SESSION_COOKIE_SECURE=True` em ambiente HTTP, ou relógio do sistema
errado. Em dev, `SESSION_COOKIE_SECURE` deve ser `False`.

**`createsuperuser` reclama de senha fraca**
É validação intencional. Em dev pode-se usar `--noinput` com variáveis de ambiente, mas
prefira uma senha válida.

**Esqueci a senha do superusuário**
```bash
python manage.py changepassword <usuario>
```

---

## Git em equipe

**`error: failed to push some refs`**
```bash
git pull --rebase origin main
# resolva conflitos, então:
git push -u origin minha-branch
```

**Conflito em arquivo de migração**
Não edite o conteúdo do conflito. Descarte sua migração local, refaça a partir do estado
integrado:
```bash
git checkout --theirs acervo/migrations/
python manage.py makemigrations
```

**Comitei o `.env` / `db.sqlite3` por engano**
```bash
git rm --cached .env db.sqlite3
echo -e ".env\ndb.sqlite3" >> .gitignore
git commit -m "chore: remove arquivos que nao devem ser versionados"
```
Se **já foi para o remoto**, considere a `SECRET_KEY` comprometida: gere uma nova e troque
todas as credenciais que estavam no arquivo. Remover do histórico exige reescrita
(`git filter-repo`) e coordenação com toda a equipe.

---

## Deploy

**`DisallowedHost at / — Invalid HTTP_HOST header`**
Adicione o domínio a `ALLOWED_HOSTS`.

**Site no ar, mas sem CSS**
`collectstatic` não rodou, ou falta WhiteNoise no `MIDDLEWARE`, ou `STATIC_ROOT` não está
configurado.

**`500 Internal Server Error` sem detalhes**
É o comportamento correto com `DEBUG=False`. Leia os logs da plataforma
(`render logs`, `fly logs`, `railway logs`). **Não** ligue `DEBUG=True` em produção para
depurar.

**`Application failed to respond` / porta errada**
A PaaS injeta a porta em `$PORT`:
```bash
gunicorn config.wsgi --bind 0.0.0.0:$PORT
```

**Funciona local, falha no deploy**
Ordem de suspeitas: variável de ambiente faltando → migração não aplicada em produção →
dependência ausente no `requirements.txt` → caminho de arquivo com maiúscula diferente →
diferença SQLite × PostgreSQL.

---

## Quando pedir ajuda

Traga estes cinco itens — na prática, montá-los resolve metade dos casos:

1. O que você **queria** que acontecesse.
2. O que **aconteceu** (mensagem de erro completa, em texto, não em foto da tela).
3. O **comando/URL** exato que disparou o problema.
4. O que você **já tentou**.
5. O **commit** ou trecho de código relevante.
