# M16 — Implantação (deploy) do sistema

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 16** · **Pré-requisitos:** M13, M14
> **Ementa:** *Tópicos relevantes: Implantação (deploy) do sistema.*

O módulo em que o projeto deixa de ser um exercício e passa a ser um sistema. Regra do
material: ao final desta semana, **todo mundo tem uma URL pública funcionando** — com o
BiblioCom, não com o projeto da equipe. O projeto vem depois, com o caminho já conhecido.

## 🎯 Objetivos

1. Explicar a diferença entre `runserver` e uma arquitetura de produção.
2. Preparar a aplicação seguindo os 12 fatores.
3. Implantar em PaaS com PostgreSQL gerenciado, HTTPS e arquivos estáticos.
4. Automatizar o deploy a partir do Git.
5. Executar migrações em produção com segurança e saber reverter.

---

## 📖 Teoria (2h)

### 1. Por que `runserver` não serve para produção (20 min)

| | `runserver` | Produção |
|---|---|---|
| Concorrência | Um processo, para desenvolvimento | Vários workers |
| Estáticos | Serve com `DEBUG=True` | Servidor web / CDN |
| HTTPS | Não | Obrigatório |
| Recarregamento automático | Sim (custa desempenho) | Não |
| Robustez a falhas | Nenhuma | Reinício automático, healthcheck |
| Segurança | Não auditado para exposição pública | Endurecido |

A própria documentação do Django diz para nunca usá-lo em produção.

### 2. Arquitetura de produção (25 min)

```
Internet
   │  HTTPS
   ▼
[ Proxy reverso / Load balancer ]     TLS, compressão, limites, roteamento
   │  HTTP interno
   ▼
[ Gunicorn — N workers ]              executa o código Python (WSGI)
   │                    ╲
   ▼                     ╲
[ Django ]                [ WhiteNoise ]   serve /static/
   │
   ├──▶ [ PostgreSQL ]    dados (gerenciado, com backup)
   ├──▶ [ Redis ]         cache/sessão/filas (opcional)
   └──▶ [ S3-compatível ] arquivos de mídia (opcional, mas recomendado)
```

**Por que mídia fora do disco da aplicação?** Contêineres são efêmeros: a cada deploy o
disco é recriado, e os uploads dos usuários desaparecem. É a surpresa mais comum do
primeiro deploy real.

### 3. Os 12 fatores que importam aqui (25 min)

| Fator | Aplicação prática |
|---|---|
| **I. Base de código** | Um repositório, vários ambientes |
| **II. Dependências** | Declaradas e travadas no `requirements.txt` |
| **III. Configuração** | Em variáveis de ambiente, nunca no código |
| **IV. Serviços de apoio** | Banco e cache acessados por URL configurável |
| **V. Build, release, run** | Etapas separadas |
| **VI. Processos** | Sem estado: nada guardado em memória local ou disco |
| **VIII. Concorrência** | Escala adicionando processos |
| **XI. Logs** | Fluxo de eventos para stdout — não arquivos |

O fator VI explica o item de mídia acima e por que sessão em memória local quebra assim
que houver mais de uma instância.

### 4. Settings por ambiente (25 min)

Duas abordagens legítimas:

**(a) Um arquivo, tudo por variável de ambiente** — mais simples, recomendado aqui:

```python
# config/settings.py
import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    CSRF_TRUSTED_ORIGINS = [f"https://{h}" for h in ALLOWED_HOSTS]
```

**(b) Módulos separados** — `settings/base.py`, `development.py`, `production.py`, com
`DJANGO_SETTINGS_MODULE` escolhendo. Melhor quando as diferenças entre ambientes passam de
umas poucas flags.

### 5. Arquivos estáticos em produção (20 min)

```bash
pip install whitenoise
```

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",     # logo após o SecurityMiddleware
    ...
]
```

```bash
python manage.py collectstatic --noinput
```

`CompressedManifestStaticFilesStorage` comprime e adiciona um hash ao nome do arquivo
(`estilo.a3f9c2.css`), o que permite cache eterno no navegador e invalidação automática a
cada deploy. É o padrão que resolve, de uma vez, "o usuário está vendo o CSS antigo".

WhiteNoise dá conta do volume de um projeto como este. Para tráfego alto, use CDN.

### 6. Migrações em produção (25 min) ⭐

```
1. Backup do banco                         ← antes de qualquer coisa
2. Deploy do código novo
3. python manage.py migrate --noinput
4. Verificação (healthcheck, fluxo crítico)
5. Se falhar: reverter o código; e o banco?
```

O passo 5 é o difícil, e é por isso que o M05 insistiu em **expandir → migrar → contrair**:
com migrações compatíveis para trás, o código antigo continua funcionando com o esquema
novo, e reverter o deploy é seguro.

| Tipo de migração | Risco | Cuidado |
|---|---|---|
| Adicionar campo com `null=True` | Baixo | — |
| Adicionar campo obrigatório | Alto | Padrão expandir/contrair |
| Remover campo | Alto | Primeiro pare de usar, depois remova (dois deploys) |
| Renomear | Alto | Adicionar novo → copiar → remover antigo |
| Adicionar índice em tabela grande | Médio | `CONCURRENTLY` no PostgreSQL |
| Migração de dados demorada | Médio | Em lotes, fora do deploy |

### 7. Onde implantar (20 min)

| Opção | Custo | Esforço | Quando |
|---|---|---|---|
| **PaaS** (Render, Railway, Fly.io) | Grátis a baixo | Baixo | ✅ Recomendado para o projeto |
| **VPS** (DigitalOcean, Hetzner, Contabo) | Baixo/médio | Alto | Requisito de contrato ou custo em escala |
| **Nuvem gerenciada** (AWS, GCP, Azure) | Variável | Muito alto | Empresa com equipe de infraestrutura |
| **PythonAnywhere** | Grátis a baixo | Muito baixo | Alternativa didática simples |

> Camadas gratuitas mudam de política com frequência. Verifique antes do semestre e tenha
> um plano B. Se a instituição tiver servidor próprio, o caminho VPS da seção 9 se aplica.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Preparar a aplicação (40 min)

```bash
pip install gunicorn whitenoise dj-database-url "psycopg[binary]"
pip freeze > requirements.txt
```

`Procfile` (ou o equivalente da plataforma):

```
web: gunicorn config.wsgi --bind 0.0.0.0:$PORT --workers 3 --timeout 60 --access-logfile -
release: python manage.py migrate --noinput
```

`build.sh`:

```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
```

`runtime.txt`:

```
python-3.12.6
```

Verifique **localmente** que a configuração de produção funciona:

```bash
DEBUG=False SECRET_KEY=teste ALLOWED_HOSTS=localhost \
  python manage.py check --deploy

DEBUG=False python manage.py collectstatic --noinput
DEBUG=False SECRET_KEY=teste ALLOWED_HOSTS=localhost \
  gunicorn config.wsgi --bind 0.0.0.0:8000
```

Se não funcionar aqui, não vai funcionar lá. **Este passo economiza a maior parte do tempo
de depuração remota.**

### Passo 2 — Deploy no Render (60 min)

1. Envie o código para o GitHub.
2. Em render.com: **New → PostgreSQL** (plano gratuito). Copie a *Internal Database URL*.
3. **New → Web Service** → conecte o repositório.
   - Build Command: `./build.sh`
   - Start Command: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
4. Variáveis de ambiente:

| Chave | Valor |
|---|---|
| `SECRET_KEY` | gere uma **nova**, diferente da de desenvolvimento |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `seu-app.onrender.com` |
| `DATABASE_URL` | a Internal Database URL |
| `PYTHON_VERSION` | `3.12.6` |

5. Deploy. Acompanhe os logs até o fim.
6. Crie o superusuário pelo Shell da plataforma:

```bash
python manage.py createsuperuser
python manage.py criar_grupos
```

7. Acesse a URL pública. Confira: página inicial, CSS carregado, login, criação de registro,
   e `/admin/`.

**Alternativas equivalentes** (mesma sequência conceitual): Railway (`railway up`),
Fly.io (`fly launch` + `fly deploy`), PythonAnywhere (interface web).

### Passo 3 — Verificação pós-deploy (40 min)

```bash
curl -I https://seu-app.onrender.com/
# esperado: 200, HTTPS, HSTS, X-Frame-Options, X-Content-Type-Options
```

Checklist obrigatório:

- [ ] HTTPS funcionando e HTTP redirecionando para HTTPS
- [ ] Nota A em [securityheaders.com](https://securityheaders.com)
- [ ] CSS e JS carregando (aba Network, sem 404)
- [ ] Login e uma operação de escrita funcionando
- [ ] `/admin/` acessível apenas para staff
- [ ] Página 404 personalizada aparecendo (e **não** o traceback do Django)
- [ ] Provocar um erro 500 e confirmar que **nada** de código ou configuração vaza
- [ ] Logs da plataforma mostrando as requisições

### Passo 4 — Deploy contínuo (25 min)

Ative *Auto-Deploy* a partir da branch `main`. Combinado com o CI do M14 e a branch
protegida:

```
PR aberto → CI roda testes → revisão → merge em main → deploy automático → produção
```

Teste o ciclo inteiro: mude o rodapé, abra PR, veja o CI, faça merge, confirme em produção.

### Passo 5 — Migração em produção (15 min)

1. Adicione um campo ao model (`null=True`).
2. Gere a migração localmente, teste, commite.
3. Merge → deploy → confirme que a migração rodou (logs do `release`).
4. Verifique que os dados anteriores continuam íntegros.

---

## 8. Deploy com Docker (referência)

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

RUN useradd --create-home app && chown -R app /app
USER app                                   # não rode como root

EXPOSE 8000
CMD ["gunicorn", "config.wsgi", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

## 9. Deploy em VPS (referência)

```bash
# no servidor
sudo apt update && sudo apt install -y python3.12-venv nginx postgresql certbot python3-certbot-nginx

sudo -u postgres createuser bibliocom -P
sudo -u postgres createdb bibliocom -O bibliocom

git clone <repo> /opt/bibliocom && cd /opt/bibliocom
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate && .venv/bin/python manage.py collectstatic --noinput
```

```ini
# /etc/systemd/system/bibliocom.service
[Unit]
Description=BiblioCom
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/bibliocom
EnvironmentFile=/opt/bibliocom/.env
ExecStart=/opt/bibliocom/.venv/bin/gunicorn config.wsgi --bind unix:/run/bibliocom.sock --workers 3
Restart=always

[Install]
WantedBy=multi-user.target
```

```nginx
server {
    server_name bibliocom.exemplo.org;

    location /static/ { alias /opt/bibliocom/staticfiles/; expires 30d; }
    location /media/  { alias /opt/bibliocom/media/; }
    location / {
        proxy_pass http://unix:/run/bibliocom.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo certbot --nginx -d bibliocom.exemplo.org     # HTTPS gratuito, com renovação automática
```

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `DisallowedHost` | Domínio em `ALLOWED_HOSTS` |
| Site sem CSS | `collectstatic` + WhiteNoise + `STATIC_ROOT` |
| `Application failed to respond` | Use `$PORT` no bind do Gunicorn |
| `500` sem detalhes | Comportamento correto: leia os **logs**, não ligue o `DEBUG` |
| Uploads somem a cada deploy | Disco efêmero: use armazenamento externo |
| `SECRET_KEY` igual à de desenvolvimento | Gere outra, só para produção |
| Migração não aplicada | Comando de release |
| CSRF falha em produção | `CSRF_TRUSTED_ORIGINS` com o domínio https |
| Redirecionamento infinito | `SECURE_PROXY_SSL_HEADER` atrás de proxy |
| `.env` comitado | Rotacione tudo que estava nele |

## ✅ Checklist de saída

- [ ] BiblioCom no ar com URL pública
- [ ] HTTPS com nota A em securityheaders.com
- [ ] PostgreSQL gerenciado, migrações aplicadas
- [ ] Estáticos servidos com hash e cache
- [ ] Variáveis de ambiente configuradas; nenhum segredo no código
- [ ] Deploy automático a partir da `main`, condicionado ao CI verde
- [ ] Superusuário e grupos criados em produção
- [ ] Página de erro personalizada, sem vazamento de informação
- [ ] Ciclo completo testado: commit → PR → CI → merge → produção

## 📦 Entrega E7 — Sistema no ar

URL pública funcionando + `docs/deploy.md` com: plataforma escolhida e por quê, passo a
passo reproduzível, variáveis necessárias, como rodar migrações, como reverter e como
acessar os logs.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Checklist em
[`../../recursos/checklists/deploy.md`](../../recursos/checklists/deploy.md).

## 📚 Para aprofundar

- [Django — Checklist de implantação](https://docs.djangoproject.com/pt-br/5.0/howto/deployment/checklist/)
- [The Twelve-Factor App (pt-br)](https://12factor.net/pt_br/)
- [WhiteNoise](https://whitenoise.readthedocs.io/)
- [Gunicorn — configuração](https://docs.gunicorn.org/en/stable/settings.html)
