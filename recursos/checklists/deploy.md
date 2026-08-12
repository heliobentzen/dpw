# Checklist de deploy

Percorra antes de cada implantação. O bloco "primeiro deploy" só na primeira vez.

## Antes (local) — 🔵 backend

- [ ] `pytest` verde
- [ ] `ruff check .` sem erros
- [ ] `python manage.py makemigrations --check --dry-run` sem pendências
- [ ] `DEBUG=False python manage.py check --deploy` sem avisos
      (🪟 PowerShell: `$env:DEBUG="False"; python manage.py check --deploy`)
- [ ] `requirements.txt` atualizado, com versões fixadas
- [ ] `DEBUG=False ... gunicorn config.wsgi` roda localmente
      (🪟 Windows: `waitress-serve --port=8000 config.wsgi:application` — Gunicorn não roda no Windows)
- [ ] 🪟 `.gitattributes` com `*.sh text eol=lf` (senão o deploy falha com `bad interpreter`)
- [ ] `collectstatic` roda sem erro
- [ ] `.env.example` reflete todas as variáveis necessárias
- [ ] Nenhum segredo no diff (`git diff --staged`)

## Antes (local) — 🟣 frontend

- [ ] `pnpm lint` e `pnpm tsc --noEmit` sem erros
- [ ] `pnpm vitest run` verde
- [ ] `pnpm build` conclui sem aviso
- [ ] `pnpm preview` funciona, **e o F5 numa rota interna também**
- [ ] Tipos regenerados do schema mais recente (`pnpm tipos` + `git diff` limpo)
- [ ] `grep` no `dist/` não revela segredo
- [ ] `VITE_API_URL` apontando para o caminho correto do ambiente alvo

## Primeiro deploy

- [ ] Banco PostgreSQL criado (gerenciado, não SQLite)
- [ ] `SECRET_KEY` **nova**, gerada só para produção
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` com o domínio real
- [ ] `DATABASE_URL` configurada
- [ ] `CSRF_TRUSTED_ORIGINS` com `https://<domínio>`
- [ ] Comando de build/release do backend definido (inclui `migrate` e `collectstatic`)
- [ ] Build do frontend definido (`pnpm install && pnpm build`, publicando `dist/`)
- [ ] **Regra de fallback configurada** (`/* → /index.html`)
- [ ] Roteamento `/api/*` para o backend, no mesmo site
- [ ] `CSRF_TRUSTED_ORIGINS` com o domínio `https://`
- [ ] Armazenamento de mídia externo (ou ciência de que uploads somem no deploy)
- [ ] Backup automático do banco ativado
- [ ] Superusuário e grupos de permissão criados

## Depois de cada deploy

- [ ] SPA carrega na raiz
- [ ] `/api/obras/` responde JSON
- [ ] **F5 numa rota interna (`/obras/42`) devolve 200**, não 404
- [ ] Nenhum erro de CORS no console
- [ ] HTTPS ativo; HTTP redireciona
- [ ] CSS/JS carregando (Network sem 404)
- [ ] Login funcionando
- [ ] Uma operação de escrita funcionando de ponta a ponta
- [ ] Migrações aplicadas (confira nos logs)
- [ ] Página 404 personalizada (não o traceback)
- [ ] Erro 500 não vaza código, settings nem SQL
- [ ] Logs sem exceções novas nos primeiros 10 minutos
- [ ] Tempo de resposta comparável ao anterior

## Comandos de verificação

> 🪟 **No PowerShell, use `curl.exe`** em todos os comandos abaixo.

```bash
curl -I https://SEU-DOMINIO/
curl -I https://SEU-DOMINIO/ | grep -iE "strict-transport|x-frame|x-content|referrer"
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://SEU-DOMINIO/
curl -I http://SEU-DOMINIO/            # deve redirecionar para https
curl -s -o /dev/null -w "%{http_code}\n" https://SEU-DOMINIO/obras/42   # fallback: 200
curl -s https://SEU-DOMINIO/api/obras/ | head -c 200                     # API respondendo
```

## Se der errado

1. **Não** ligue `DEBUG=True` em produção para depurar. Leia os logs.
2. Reverta o deploy (a plataforma tem "rollback"; ou faça `git revert` + push).
3. Migração já aplicada? Se foi compatível para trás (expandir/contrair), o código antigo
   funciona com o esquema novo — reverter é seguro.
4. Se o banco foi alterado de forma incompatível, restaure o backup. Você testou a
   restauração antes, certo?
5. Registre o incidente: o que quebrou, por quê, o que evitaria a repetição.

## Variáveis de ambiente mínimas

### 🔵 Backend (tempo de execução — secretas)

```bash
SECRET_KEY=            # >= 50 caracteres aleatórios, exclusiva de produção
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com
CSRF_TRUSTED_ORIGINS=https://seu-dominio.com
DATABASE_URL=postgres://usuario:senha@host:5432/banco
# opcionais
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
SENTRY_DSN=
```

### 🟣 Frontend (tempo de **build** — públicas)

```bash
VITE_API_URL=/api      # caminho relativo: mesmo site, sem CORS
VITE_SENTRY_DSN=       # desenhado para ser público
```

> ⚠️ Toda `VITE_*` é embutida no bundle e legível por qualquer pessoa. **Nunca** coloque
> segredo aqui. E mudar o valor na plataforma exige **rebuild** — não basta reiniciar.

## Rotina periódica

| Frequência | Tarefa |
|---|---|
| Semanal | Revisar logs de erro; conferir se o backup rodou |
| Mensal | `pip-audit`; atualizar dependências com correção de segurança |
| Trimestral | **Testar a restauração do backup** em ambiente separado |
| Semestral | Revisar acessos e permissões; remover contas inativas |
