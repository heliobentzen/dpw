# Checklist de deploy

Percorra antes de cada implantação. O bloco "primeiro deploy" só na primeira vez.

## Antes (local)

- [ ] `pytest` verde
- [ ] `ruff check .` sem erros
- [ ] `python manage.py makemigrations --check --dry-run` sem pendências
- [ ] `DEBUG=False python manage.py check --deploy` sem avisos
- [ ] `requirements.txt` atualizado, com versões fixadas
- [ ] `DEBUG=False ... gunicorn config.wsgi` roda localmente
- [ ] `collectstatic` roda sem erro
- [ ] `.env.example` reflete todas as variáveis necessárias
- [ ] Nenhum segredo no diff (`git diff --staged`)

## Primeiro deploy

- [ ] Banco PostgreSQL criado (gerenciado, não SQLite)
- [ ] `SECRET_KEY` **nova**, gerada só para produção
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` com o domínio real
- [ ] `DATABASE_URL` configurada
- [ ] `CSRF_TRUSTED_ORIGINS` com `https://<domínio>`
- [ ] Comando de build/release definido (inclui `migrate` e `collectstatic`)
- [ ] Armazenamento de mídia externo (ou ciência de que uploads somem no deploy)
- [ ] Backup automático do banco ativado
- [ ] Superusuário e grupos de permissão criados

## Depois de cada deploy

- [ ] Aplicação responde 200 na página inicial
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

```bash
curl -I https://SEU-DOMINIO/
curl -I https://SEU-DOMINIO/ | grep -iE "strict-transport|x-frame|x-content|referrer"
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://SEU-DOMINIO/
curl -I http://SEU-DOMINIO/            # deve redirecionar para https
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

```bash
SECRET_KEY=            # >= 50 caracteres aleatórios, exclusiva de produção
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com
DATABASE_URL=postgres://usuario:senha@host:5432/banco
# opcionais
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
SENTRY_DSN=
```

## Rotina periódica

| Frequência | Tarefa |
|---|---|
| Semanal | Revisar logs de erro; conferir se o backup rodou |
| Mensal | `pip-audit`; atualizar dependências com correção de segurança |
| Trimestral | **Testar a restauração do backup** em ambiente separado |
| Semestral | Revisar acessos e permissões; remover contas inativas |
