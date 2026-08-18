# FAQ e troubleshooting

Erros reais, na ordem em que aparecem no semestre. Antes de pedir ajuda, **leia a última
linha do traceback** — ela quase sempre diz o que fazer.

## Como ler um erro

```
[Nest] ERROR [ExceptionsHandler] Cannot read properties of undefined (reading 'nome')
TypeError: Cannot read properties of undefined (reading 'nome')
    at ObraResposta.de (/app/dist/acervo/dto/obra.resposta.js:14:29)   <- SEU código
    at AcervoController.buscarUm (/app/dist/acervo/acervo.controller.js:22:31)
    at /app/node_modules/@nestjs/core/router/router-execution-context.js:38  <- framework
```

Três regras que resolvem a maioria:

1. **Leia de baixo para cima** até achar a primeira linha que aponta para **o seu código** —
   caminho sem `node_modules/`. É quase sempre ali que está o problema.
2. **A última linha diz o quê; a primeira do seu código diz onde.**
3. Se o caminho tem `dist/`, é o código **compilado**. A linha corresponde ao `.ts` graças ao
   *source map* — o VS Code abre o original se você clicar.

> `Cannot read properties of undefined` quase sempre significa que uma relação não foi
> carregada (faltou `relations`, M06) ou que um objeto opcional não foi verificado.

---

## Ambiente

**`Cannot find module 'X'`**
Faltou instalar, ou você está na pasta errada.

```bash
pnpm install                     # na RAIZ do monorepo
pnpm list X                      # confirma se está lá
```

Se o módulo é `@bibliocom/tipos`, o workspace não foi resolvido: confira o
`pnpm-workspace.yaml` e rode `pnpm install` na raiz de novo.

**`ERR_PNPM_OUTDATED_LOCKFILE` no CI**
Alguém mudou o `package.json` sem commitar o `pnpm-lock.yaml` atualizado. Rode `pnpm install`
localmente e commite o lock.

**`pnpm: command not found`**
`corepack enable`. Se falhar no Windows com `EPERM`, `npm install -g pnpm`.

**Proxy do laboratório bloqueando o registro**

```bash
pnpm config set proxy http://usuario:senha@proxy:porta
pnpm config set https-proxy http://usuario:senha@proxy:porta
```

Se for interceptação de TLS, peça o certificado à TI e use `NODE_EXTRA_CA_CERTS`.
**Nunca** desabilite a verificação de certificado — some com a proteção que justifica o HTTPS.

---

## Servidor e módulos

**`Nest can't resolve dependencies of the XController (?)`**
O `?` marca o parâmetro que ele não conseguiu resolver. Duas causas, nesta ordem:
1. O provider não está em `providers` do módulo;
2. Falta `@Injectable()` na classe do provider.

Se o provider vem de outro módulo, ele precisa estar em `exports` lá e o módulo em `imports` aqui.

**`EADDRINUSE: address already in use :::3000`**
Já há um servidor na porta.

```bash
# Linux / macOS / WSL / Git Bash
lsof -ti:3000 | xargs kill -9
PORT=3001 pnpm start:dev
```
```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
$env:PORT="3001"; pnpm start:dev
```

**Alterei o `.env` e nada mudou**
Ele é lido na **inicialização**. Reinicie o `start:dev`.

**A rota responde 404**
Nesta ordem: faltou o prefixo `/api`; o módulo não está em `imports` do `AppModule`; ou a
rota literal foi declarada **depois** da paramétrica (M07).

**Salvei o arquivo e o servidor não recarregou**
Olhe o terminal: um erro de compilação interrompe o *watch*. O servidor continua servindo a
versão antiga, o que faz parecer que a mudança não teve efeito.

---

## Entidades e migrações

**`Entity metadata for Obra#autor was not found`**
A entidade não está no `TypeOrmModule.forFeature([...])` do módulo.

**`Cannot read properties of undefined (reading 'name')` na inicialização**
Importação circular entre entidades. Use sempre `() => Entidade`, nunca a classe direta.

**`QueryFailedError: relation "obra" does not exist`**
As migrações não foram aplicadas: `pnpm migration:run`.

**`No changes in database schema were found`**
As entidades já batem com o banco. Você salvou o arquivo? Está gerando contra o banco certo?

**Migração roda pela CLI mas não na aplicação**
Caminhos diferentes: a CLI lê `src/**/*.ts`, a aplicação lê `dist/**/*.js`. Confira os dois.

**Conflito de migração depois de um merge**
Não há conflito de texto — são arquivos diferentes. O problema é de **ordem**: renomeie o
timestamp da migração mais nova para depois da que já foi mesclada.

**Preciso recomeçar o banco (só em desenvolvimento)**

```bash
docker compose down -v && docker compose up -d    # apaga o volume
pnpm migration:run
pnpm dlx ts-node src/semear.ts
```

⚠️ `down -v` **apaga os dados**. Nunca em produção.

---

## Consultas

**Uma relação vem `undefined`**
Faltou `relations: { autor: true }` ou `leftJoinAndSelect`. Ver M06.

**A API está lenta e o log tem dezenas de SELECTs**
Problema N+1. Declare as relações em vez de buscar dentro de um laço.

**`QueryFailedError: syntax error at or near "$1"`**
Parâmetro escrito no formato errado. No TypeORM é `:nome`, com objeto: `{ nome }`.

**`ILIKE` não funciona**
É do PostgreSQL. No SQLite use `LIKE`, que já ignora maiúsculas em ASCII.

**`save()` criou um registro novo em vez de atualizar**
O objeto não tinha `id`. `save` decide entre `INSERT` e `UPDATE` pela presença da chave.

---

## Validação e DTOs

**O DTO não valida nada**
Faltou `app.useGlobalPipes(new ValidationPipe({...}))` no `main.ts`.

**Um número vindo da query string reprova no `@IsInt`**
Query string é sempre texto. Falta `@Type(() => Number)` no DTO e `transform: true` no pipe.

**Campos que eu não declarei estão sendo gravados**
Falta `whitelist: true`. Acrescente `forbidNonWhitelisted: true` para recusar em vez de
ignorar em silêncio.

**A resposta traz `senhaHash`**
Você devolveu a entidade em vez do DTO de saída. Ver M07.

---

## Banco de dados

**`ECONNREFUSED 127.0.0.1:5432`**
O PostgreSQL não está no ar: `docker compose up -d`. Se a porta estiver ocupada por uma
instalação nativa, use `5433:5432` e ajuste a `DATABASE_URL`.

**Funciona no SQLite e falha no PostgreSQL**
Os dialetos divergem em tipos, `ILIKE` e migrações. Gere as migrações contra o mesmo banco
que roda em produção.

---

## Autenticação

**Todo endpoint autenticado responde 401 no frontend**
Faltou `credentials: "include"` no `fetch`. Sem isso o navegador não envia o cookie.

**Login funciona local e falha em produção**
Falta `app.set("trust proxy", 1)`. A PaaS termina o TLS, e sem isso o Express acha que a
conexão é HTTP e recusa enviar o cookie `secure`.

**A sessão some a cada reinício do servidor**
O armazenamento padrão do `express-session` é em memória. Para produção, use um store
externo (Redis) — está previsto no M16.

**Esqueci a senha do usuário de coordenação**
Rode o script de seed com um e-mail novo, ou atualize o hash direto pelo banco em
desenvolvimento.

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
git checkout --theirs backend/src/migracoes/
pnpm migration:generate src/migracoes/MinhaAlteracao
```

**Comitei o `.env` ou o `node_modules/` por engano**
```bash
git rm -r --cached .env node_modules
printf '.env\nnode_modules/\n' >> .gitignore
git commit -m "chore: remove arquivos que nao devem ser versionados"
```
Se **já foi para o remoto**, considere o `SESSION_SECRET` comprometido: gere um novo e troque
todas as credenciais que estavam no arquivo. Remover do histórico exige reescrita
(`git filter-repo`) e coordenação com toda a equipe.

---

## Deploy

**`Application failed to respond` / porta errada**
A plataforma injeta a porta em `PORT`. O código precisa lê-la:

```ts
await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
```

Porta fixa faz o serviço subir e nunca receber tráfego. `"0.0.0.0"` também é necessário:
escutar só em `localhost` o torna inacessível de fora do contêiner.

**A API responde HTML em vez de JSON**
Faltou `exclude: ["/api/{*caminho}"]` no `ServeStaticModule`: os arquivos estáticos estão
capturando `/api/*` antes dos controllers. Como o status é 200, o diagnóstico engana.

**F5 numa rota interna dá 404**
Falta a regra de *fallback* (`/* → /index.html`). O bug nº 1 de deploy de SPA — não aparece
em desenvolvimento porque o Vite já faz o fallback.

**`500 Internal Server Error` sem detalhes**
É o comportamento **correto**. Leia os logs da plataforma (`render logs`, `fly logs`,
`railway logs`). Nunca devolva `erro.stack` ao cliente para "facilitar a depuração".

**Mudei `VITE_API_URL` na plataforma e o site não mudou**
Variável `VITE_*` é embutida em **tempo de build**. É preciso refazer o build, não reiniciar.

**Migração não foi aplicada em produção**
O comando de start precisa incluí-la: `pnpm migration:run:prod && pnpm start:prod`.

**Funciona local, falha no deploy**
Ordem de suspeitas: variável de ambiente faltando → migração não aplicada → dependência em
`devDependencies` que deveria estar em `dependencies` → caminho de arquivo com maiúscula
diferente (Linux diferencia, Windows e macOS não) → diferença SQLite × PostgreSQL.

**`bad interpreter: No such file or directory`**
Um `.sh` foi commitado com CRLF. Configure o `.gitattributes` com `*.sh text eol=lf`.

---

## Quando pedir ajuda

Traga estes cinco itens — na prática, montá-los resolve metade dos casos:

1. O que você **queria** que acontecesse.
2. O que **aconteceu** (mensagem de erro completa, em texto, não em foto da tela).
3. O **comando/URL** exato que disparou o problema.
4. O que você **já tentou**.
5. O **commit** ou trecho de código relevante.
