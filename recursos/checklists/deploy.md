# Checklist de deploy da API

Percorra antes de cada implantação. O bloco "primeiro deploy" só na primeira vez.

## Antes (local)

- [ ] `npm test` verde
- [ ] `npm run lint` e `npx tsc --noEmit` sem erros
- [ ] `npm run migration:generate src/migracoes/Conferencia` **não** gera arquivo novo
      (esquema em dia com as entidades; se gerar, apague o arquivo e crie a migração de verdade)
- [ ] `package-lock.json` versionado
- [ ] `npm run build` conclui e `node dist/main.js` sobe localmente
      (mesmo comando nas três plataformas)
- [ ] 🪟 `.gitattributes` com `*.sh text eol=lf` (senão um script falha na PaaS com
      `bad interpreter`)
- [ ] `.env.example` reflete todas as variáveis necessárias
- [ ] `openapi.json` regenerado e sem diferença no `git diff`
- [ ] Nenhum segredo no diff (`git diff --staged`)

## Primeiro deploy

- [ ] Banco PostgreSQL gerenciado criado, com a mesma versão principal do Docker local
- [ ] `SESSION_SECRET` **nova**, gerada só para produção
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` configurada (a URL **interna** da plataforma)
- [ ] `CORS_ORIGENS` com as origens reais dos clientes, se houver algum no navegador
- [ ] `PORT` **não** definida à mão: a plataforma decide a porta
- [ ] Build (na raiz do repositório): `npm ci && npm run build -w backend`
- [ ] Start: `npm run migration:run:prod -w backend && npm run start:prod -w backend`
- [ ] `trust proxy` ligado no `configurarApp` (a PaaS termina o HTTPS)
- [ ] Sessões no PostgreSQL (`connect-pg-simple`), com a migração `CriaSessao` aplicada
- [ ] *Health check* da plataforma apontando para `/api/health`
- [ ] Armazenamento de arquivos externo (ou ciência de que uploads somem no próximo deploy)
- [ ] Backup automático do banco ativado
- [ ] Primeiro usuário administrador criado por script (`npm run seed:admin`), não à mão

## Depois de cada deploy

- [ ] `GET /api/health` responde 200
- [ ] `GET /api/obras` responde JSON
- [ ] HTTPS ativo; HTTP redireciona
- [ ] Login funcionando
- [ ] Uma operação de escrita funcionando de ponta a ponta
- [ ] Migrações aplicadas (confira nos logs)
- [ ] Rota inexistente devolve 404 em JSON, não uma página HTML
- [ ] Erro 500 não vaza *stack trace*, caminho de arquivo nem SQL
- [ ] Logs sem exceções novas nos primeiros 10 minutos
- [ ] Tempo de resposta comparável ao anterior

## Comandos de verificação

```powershell
# Windows PowerShell (no Git Bash/Linux, troque curl.exe por curl e NUL por /dev/null)
curl.exe -i https://SEU-DOMINIO/api/health
curl.exe -I https://SEU-DOMINIO/api/obras
curl.exe -s -o NUL -w "%{http_code} %{time_total}s`n" https://SEU-DOMINIO/api/obras
curl.exe -I http://SEU-DOMINIO/api/obras        # deve redirecionar para https
curl.exe -i https://SEU-DOMINIO/api/nao-existe  # 404 em JSON
```

| Comando | O que você está conferindo |
| --- | --- |
| `-i .../health` | A API subiu e alcança o banco |
| `-I .../obras` | Cabeçalhos: `strict-transport-security`, `x-content-type-options`, sem `x-powered-by` |
| `-w "%{http_code} %{time_total}s"` | Status e tempo, sem despejar o corpo na tela |
| `http://` | O redirecionamento para HTTPS existe |
| `nao-existe` | O erro segue o formato do contrato (M02), e não uma página do servidor |

## Se der errado

1. **Não** troque `NODE_ENV` para `development` em produção para "ver o erro". Leia os logs.
2. Reverta o deploy (a plataforma tem "rollback"; ou faça `git revert` + push).
3. Migração já aplicada? Se ela foi compatível para trás (expandir → migrar → contrair, M05),
   o código antigo funciona com o esquema novo — reverter o código é seguro.
4. Se o banco foi alterado de forma incompatível, restaure o backup. Você testou a
   restauração antes, certo?
5. Registre o incidente: o que quebrou, por quê, o que evitaria a repetição.

## Variáveis de ambiente mínimas

```ini
# configuradas no painel da PaaS (ou no .env local)
NODE_ENV=production
SESSION_SECRET=            # >= 32 bytes aleatórios, exclusiva de produção
DATABASE_URL=postgres://usuario:senha@host:5432/banco
CORS_ORIGENS=https://app.seu-dominio.com
# opcionais
SENTRY_DSN=
```

> Toda variável obrigatória precisa estar no schema de validação do `ConfigModule`. Chave
> que não está no schema é **descartada**: a API sobe sem ela e falha só na primeira
> requisição que precisar do valor.

## Rotina periódica

| Frequência | Tarefa |
|---|---|
| Semanal | Revisar logs de erro; conferir se o backup rodou |
| Mensal | `npm audit`; atualizar dependências com correção de segurança |
| Trimestral | **Testar a restauração do backup** em ambiente separado |
| Semestral | Revisar acessos e permissões; remover contas inativas |
