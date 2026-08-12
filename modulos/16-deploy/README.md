# M16 — Implantação: dois artefatos em produção

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 16** · **Pré-requisitos:** M13, M14
> **Ementa:** *Tópicos relevantes: Implantação (deploy) do sistema.*

O módulo em que o projeto deixa de ser exercício e vira sistema. Regra do material: ao final
desta semana **todo mundo tem uma URL pública funcionando** — com o BiblioCom, não com o
projeto da equipe. O projeto vem depois, com o caminho já conhecido.

Numa arquitetura desacoplada, "fazer deploy" significa publicar **dois** artefatos e
garantir que eles se encontrem.

## 🎯 Objetivos

1. Explicar a diferença entre servidor de desenvolvimento e arquitetura de produção.
2. Preparar os dois projetos seguindo os 12 fatores.
3. Publicar API e SPA sob o **mesmo site**, com HTTPS e banco gerenciado.
4. Configurar o *fallback* de rotas da SPA e as variáveis de build.
5. Executar migrações em produção com segurança e saber reverter.

---

## 📖 Teoria (2h)

### 1. O que muda com dois artefatos (25 min)

```
                        Internet
                           │ HTTPS
                           ▼
              ┌────────────────────────────┐
              │  Proxy / roteador da PaaS  │   TLS, compressão, cache
              └────────────┬───────────────┘
                  /api/*   │   /*
             ┌─────────────┴─────────────┐
             ▼                           ▼
   ┌───────────────────┐       ┌────────────────────┐
   │ Gunicorn + Django │       │ Arquivos estáticos │
   │ (N workers)       │       │ index.html + JS/CSS│
   └─────────┬─────────┘       └────────────────────┘
             │                     (SPA compilada)
             ▼
   ┌──────────────────┐
   │   PostgreSQL     │  gerenciado, com backup
   └──────────────────┘
```

**A decisão central: mesmo site.** SPA em `/` e API em `/api/`, no mesmo domínio.

| | Mesmo site (adotado) | Domínios separados |
|---|---|---|
| CORS | Não existe | Precisa configurar |
| Cookie de sessão | Funciona naturalmente | `SameSite=None; Secure` + CORS com credenciais |
| CSRF | Simples | Complicado |
| Configuração | Um roteamento | Dois serviços + CORS |

Isso realiza o [ADR-07](../../docs/decisoes-tecnicas.md#adr-07--autenticação-por-sessão-com-cookie-não-jwt-em-localstorage):
a escolha de autenticação por sessão **depende** desta topologia.

### 2. Dois processos de build (20 min)

| | Backend | Frontend |
|---|---|---|
| Artefato | Código Python + dependências | Pasta `dist/` com HTML, JS, CSS |
| Quando é montado | No deploy | **No build** |
| Configuração | Lida em **tempo de execução** | Embutida em **tempo de build** |
| Trocar variável | Reiniciar o processo | **Recompilar** |
| Roda o quê | Gunicorn | Nada — são arquivos estáticos |

> ⚠️ A terceira linha é a que pega todo mundo. `VITE_API_URL` é substituída pelo valor
> literal durante `pnpm build`. Mudar a variável na plataforma **não** muda o site: é
> preciso rodar o build de novo. E, pelo mesmo motivo, ela é pública (M13).

### 3. O *fallback* da SPA (20 min) ⭐

O usuário acessa `https://bibliocom.org/obras/42` diretamente, ou dá F5 nessa rota. O
servidor recebe `GET /obras/42` — e não existe arquivo com esse nome.

**Sem configuração: 404.** É o bug nº 1 do deploy de SPA, e ele não aparece em
desenvolvimento porque o Vite já faz o *fallback*.

A regra de roteamento, em ordem:

```
1. /api/*      → Django
2. /admin/*    → Django
3. /static/*   → arquivos do Django (admin, DRF)
4. /assets/*   → arquivos da SPA (JS, CSS com hash)
5. qualquer outra coisa → index.html   ← o fallback
```

Configuração por plataforma:

```
# Render / Netlify / Vercel — arquivo de redirecionamento
/api/*   https://bibliocom-api.onrender.com/api/:splat   200
/*       /index.html                                     200
```

```nginx
# Nginx (VPS)
location /api/ { proxy_pass http://unix:/run/bibliocom.sock; }
location /admin/ { proxy_pass http://unix:/run/bibliocom.sock; }
location / {
    root /var/www/bibliocom/dist;
    try_files $uri $uri/ /index.html;     # ← o fallback
}
```

```python
# Django servindo a SPA (opção de artefato único; ver Passo 4)
urlpatterns = [
    path("api/", include("acervo.urls")),
    path("admin/", admin.site.urls),
    re_path(r"^(?!api/|admin/|static/).*$", TemplateView.as_view(template_name="index.html")),
]
```

### 4. Cache e nomes com hash (15 min)

O Vite gera `index-B7fK2a.js`. O hash muda quando o conteúdo muda, o que permite:

```
index.html         → Cache-Control: no-cache        (sempre revalida)
/assets/*.js|css   → Cache-Control: max-age=31536000, immutable
```

O `index.html` é pequeno e aponta para os arquivos com hash; os arquivos com hash nunca
mudam de conteúdo. Resultado: cache eterno **e** deploy que chega ao usuário
imediatamente. É a solução definitiva para "o usuário está vendo a versão antiga".

### 5. Migrações em produção (20 min)

```
1. Backup do banco                    ← antes de qualquer coisa
2. Deploy do backend + migrate
3. Deploy do frontend (build com a API já atualizada)
4. Verificação (healthcheck + fluxo crítico)
5. Se falhar: reverter
```

**A ordem importa nesta arquitetura.** Backend primeiro, frontend depois: o backend novo
precisa continuar servindo o frontend antigo durante a janela de deploy. Isso só é possível
se as mudanças de API forem **compatíveis para trás** — que é o mesmo princípio de
expandir → migrar → contrair do M05, aplicado ao contrato.

| Mudança na API | Compatível para trás? | Como fazer |
|---|---|---|
| Adicionar campo na resposta | ✅ Sim | Direto |
| Adicionar campo opcional na entrada | ✅ Sim | Direto |
| Renomear campo | ❌ Não | Adicionar o novo → migrar o cliente → remover o antigo |
| Tornar campo obrigatório | ❌ Não | Dois deploys |
| Remover endpoint | ❌ Não | Depreciar → migrar → remover |

### 6. Onde implantar (20 min)

| Opção | Custo | Esforço | Quando |
|---|---|---|---|
| **PaaS** (Render, Railway, Fly.io) | Grátis a baixo | Baixo | ✅ Recomendado |
| VPS + Nginx | Baixo/médio | Alto | Requisito de contrato ou custo em escala |
| Nuvem gerenciada | Variável | Muito alto | Empresa com equipe de infra |

> Camadas gratuitas mudam de política. Verifique antes do semestre e tenha plano B.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Preparar o backend (25 min)

```bash
cd backend
pip install gunicorn whitenoise dj-database-url "psycopg[binary]"
pip freeze > requirements.txt
```

`Procfile`:

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

> 🪟 **Windows: finais de linha.** Você não precisa executar o `build.sh` localmente — ele
> roda na PaaS, que é Linux. Mas se o arquivo for salvo com CRLF, o deploy falha com
> `bad interpreter: No such file or directory`. Garanta o `.gitattributes` com
> `*.sh text eol=lf` no repositório (ver
> [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md#4-finais-de-linha-crlf--lf))
> — é a causa mais comum de deploy quebrado em equipe que desenvolve no Windows.

Valide **localmente** antes de subir — este passo economiza a maior parte do tempo de
depuração remota.

**Linux / macOS / WSL2:**

```bash
DEBUG=False SECRET_KEY=teste ALLOWED_HOSTS=localhost python manage.py check --deploy
DEBUG=False python manage.py collectstatic --noinput
DEBUG=False SECRET_KEY=teste ALLOWED_HOSTS=localhost gunicorn config.wsgi --bind 0.0.0.0:8000
```

**Windows (PowerShell):**

```powershell
# 1. no PowerShell as variaveis NAO sao inline: elas ficam na sessao
$env:DEBUG="False"; $env:SECRET_KEY="teste"; $env:ALLOWED_HOSTS="localhost"

python manage.py check --deploy
python manage.py collectstatic --noinput

# 2. Gunicorn NAO roda no Windows (depende de fcntl, que e POSIX).
#    Waitress e servidor WSGI de producao e roda no Windows:
pip install waitress
waitress-serve --port=8000 config.wsgi:application

# 3. ao terminar, LIMPE as variaveis — senao o runserver sobe com DEBUG=False
Remove-Item Env:\DEBUG, Env:\SECRET_KEY, Env:\ALLOWED_HOSTS
```

> 🪟 **O `Procfile` continua com Gunicorn** — produção é Linux, e é lá que ele roda. O
> Waitress serve **apenas** para esta verificação local no Windows; não o adicione ao
> `requirements.txt` de produção (use um `requirements-dev.txt`, se quiser mantê-lo).
> No WSL2, use Gunicorn normalmente.
>
> Demais equivalências em
> [`../../recursos/comandos-windows.md`](../../recursos/comandos-windows.md).

### Passo 2 — Preparar o frontend (20 min)

```bash
cd frontend
pnpm build           # gera dist/
pnpm preview         # serve dist/ localmente, como em produção
```

Abra o `preview` e **teste o F5 numa rota interna** (`/obras/42`). Funciona? O `preview` do
Vite faz o *fallback*; a plataforma precisa ser configurada para fazer o mesmo.

Inspecione `dist/`:

```bash
# Linux / macOS / WSL / Git Bash
ls -la dist/assets/                              # nomes com hash
du -sh dist/                                     # tamanho total
grep -r "VITE_" dist/ | head                     # as variáveis embutidas
```

```powershell
# Windows PowerShell
Get-ChildItem dist\assets\                                      # nomes com hash
"{0:N2} MB" -f ((Get-ChildItem dist -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Select-String -Recurse "VITE_" dist\* | Select-Object -First 10   # variaveis embutidas
```

### Passo 3 — PostgreSQL e serviço da API (30 min)

1. Na PaaS: **New → PostgreSQL**. Copie a *Internal Database URL*.
2. **New → Web Service**, apontando para `backend/`:
   - Build: `./build.sh`
   - Start: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
3. Variáveis:

| Chave | Valor |
|---|---|
| `SECRET_KEY` | gere uma **nova**, exclusiva de produção |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `bibliocom.onrender.com` |
| `DATABASE_URL` | a Internal Database URL |
| `CSRF_TRUSTED_ORIGINS` | `https://bibliocom.onrender.com` |

4. Deploy. Acompanhe os logs até o fim.
5. Crie o superusuário e os grupos pelo shell da plataforma:

```bash
python manage.py createsuperuser
python manage.py criar_grupos
```

6. Teste: `curl https://sua-api/api/obras/`

### Passo 4 — Publicar a SPA sob o mesmo site (30 min) ⭐

Duas estratégias; escolha **uma** e documente a escolha.

**A) Serviço estático + regra de proxy** (mais comum)

- **New → Static Site**, apontando para `frontend/`
  - Build: `pnpm install && pnpm build`
  - Publish directory: `dist`
- Variável de build: `VITE_API_URL=/api`
- Regras de redirecionamento:

```
/api/*  https://bibliocom-api.onrender.com/api/:splat  200
/*      /index.html                                    200
```

O status `200` (e não 301/302) é o que faz o proxy servir o conteúdo mantendo a URL — é
isso que preserva o *same-site* e evita CORS.

**B) Django serve a SPA** (artefato único, mais simples de operar)

```python
# config/settings.py
TEMPLATES[0]["DIRS"] = [BASE_DIR / "frontend_dist"]
STATICFILES_DIRS = [BASE_DIR / "frontend_dist" / "assets"]
```

```bash
# build.sh — executado pela PaaS, que roda LINUX.
# Nao precisa rodar no seu Windows; garanta apenas o final de linha LF (.gitattributes).
cd ../frontend && pnpm install && pnpm build
cp -r dist ../backend/frontend_dist
cd ../backend && python manage.py collectstatic --noinput
```

Um serviço, um deploy, zero CORS. Em troca, o build fica mais lento e as camadas ficam
acopladas na publicação.

### Passo 5 — Verificação pós-deploy (15 min)

- [ ] `https://.../` carrega a SPA
- [ ] `https://.../api/obras/` responde JSON
- [ ] **F5 em `/obras/42` funciona** (o *fallback* está configurado)
- [ ] HTTPS ativo; HTTP redireciona
- [ ] Login funciona (cookie de sessão + CSRF)
- [ ] Uma operação de escrita funciona ponta a ponta
- [ ] `/admin/` acessível só para staff
- [ ] Erro 500 **não** vaza código nem configuração
- [ ] Nenhum erro de CORS no console
- [ ] Nota A em [securityheaders.com](https://securityheaders.com)
- [ ] `grep` no `dist/` publicado não revela segredo

```bash
# Linux/macOS/WSL/Git Bash
curl -I https://sua-app/
curl -I https://sua-app/api/obras/
curl -s -o /dev/null -w "%{http_code}\n" https://sua-app/obras/42     # deve ser 200
```

```powershell
# Windows PowerShell — note o .exe (curl sozinho e alias de Invoke-WebRequest)
curl.exe -I https://sua-app/
curl.exe -I https://sua-app/api/obras/
curl.exe -s -o NUL -w "%{http_code}`n" https://sua-app/obras/42
```

---

## ⚠️ Erros comuns

| Erro | Sintoma | Correção |
|---|---|---|
| Sem *fallback* da SPA | F5 em rota interna dá 404 | Regra `/* → /index.html` |
| `VITE_API_URL` mudada sem rebuild | O site continua chamando a URL antiga | Rebuild |
| Segredo em `VITE_*` | Publicado no bundle | Nunca; use o backend |
| `DisallowedHost` | 400 em tudo | Domínio em `ALLOWED_HOSTS` |
| CSRF falha em produção | 403 em todo POST | `CSRF_TRUSTED_ORIGINS` com `https://` |
| Redirecionamento infinito | Loop de HTTPS | `SECURE_PROXY_SSL_HEADER` |
| Erro de CORS em produção | Console cheio | Sirva os dois sob o mesmo site |
| Uploads somem a cada deploy | Disco efêmero | Armazenamento externo |
| Frontend publicado antes do backend | Cliente novo, API velha | Backend primeiro |
| `500` sem detalhes | Comportamento **correto** | Leia os logs; não ligue `DEBUG` |
| `collectstatic` esquecido | Admin e DRF sem CSS | Comando de build |

## ✅ Checklist de saída

- [ ] API e SPA no ar, sob o mesmo site, com HTTPS
- [ ] PostgreSQL gerenciado, migrações aplicadas
- [ ] *Fallback* de rotas configurado e testado com F5
- [ ] Cache com hash nos assets e `no-cache` no `index.html`
- [ ] Variáveis de ambiente configuradas; nenhum segredo no bundle
- [ ] Deploy automático a partir da `main`, condicionado ao CI verde
- [ ] Superusuário e grupos criados em produção
- [ ] Backup do banco ativado
- [ ] Ciclo completo testado: commit → PR → CI → merge → produção
- [ ] `docs/deploy.md` reproduzível por outra pessoa

## 📦 Entrega E8 — Os dois artefatos no ar

URL pública funcionando + `docs/deploy.md` com: estratégia escolhida (A ou B) e por quê,
passo a passo reproduzível, variáveis necessárias em cada camada, como rodar migrações,
como reverter e como acessar os logs.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Checklist em
[`../../recursos/checklists/deploy.md`](../../recursos/checklists/deploy.md).

## 📚 Para aprofundar

- [Django — Checklist de implantação](https://docs.djangoproject.com/pt-br/5.0/howto/deployment/checklist/)
- [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy)
- [The Twelve-Factor App (pt-br)](https://12factor.net/pt_br/)
- [WhiteNoise](https://whitenoise.readthedocs.io/)
- [MDN — Cache-Control](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Cache-Control)
