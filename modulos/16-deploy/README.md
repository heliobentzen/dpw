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
   │ Node + NestJS     │       │ Arquivos estáticos │
   │ (N instâncias)    │       │ index.html + JS/CSS│
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
| Artefato | Pasta `dist/` com JavaScript compilado | Pasta `dist/` com HTML, JS, CSS |
| Quando é montado | No deploy (`nest build`) | No deploy (`vite build`) |
| Configuração | Lida em **tempo de execução** | Embutida em **tempo de build** |
| Trocar variável | Reiniciar o processo | **Recompilar** |
| Roda o quê | `node dist/main.js` | Nada — são arquivos estáticos |

> Os dois produzem uma pasta chamada `dist/`, e são coisas completamente diferentes. O do
> backend é JavaScript para o Node executar; o do frontend é o site para o navegador baixar.

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
1. /api/*      → NestJS
2. /assets/*   → arquivos da SPA (JS, CSS com hash)
3. qualquer outra coisa → index.html   ← o fallback
```

Repare que a lista encurtou em relação a uma stack com painel administrativo embutido: não
há `/admin/` nem estáticos de framework. **Menos rotas, menos configuração para errar.**

Configuração por plataforma:

```
# Render / Netlify / Vercel — arquivo de redirecionamento
/api/*   https://bibliocom-api.onrender.com/api/:splat   200
/*       /index.html                                     200
```

```nginx
# Nginx (VPS)
location /api/ { proxy_pass http://127.0.0.1:3000; }
location / {
    root /var/www/bibliocom/frontend/dist;
    try_files $uri $uri/ /index.html;     # ← o fallback
}
```

```ts
// NestJS servindo a SPA (opção de artefato único; ver Passo 4)
ServeStaticModule.forRoot({
  rootPath: join(__dirname, "..", "..", "frontend", "dist"),
  exclude: ["/api/{*caminho}"],           // /api/* continua indo para os controllers
});
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
cd ~/dev/bibliocom/backend
pnpm add pg
pnpm build            # nest build → dist/main.js
```

`backend/package.json` — os scripts que a plataforma vai chamar:

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main.js",
    "migration:run:prod": "typeorm-ts-node-commonjs -d dist/data-source.js migration:run"
  }
}
```

| Script | Quando roda | O que faz |
|---|---|---|
| `build` | No deploy | Compila TypeScript para `dist/` |
| `start:prod` | A cada boot | Sobe a aplicação. **Sem `--watch`**, sem recompilar |
| `migration:run:prod` | Antes de subir | Aplica as migrações pendentes (M05) |

> 🎉 **Aqui a stack única economiza um problema inteiro.** Antes, o servidor de produção do
> Python (Gunicorn) **não rodava no Windows**, e a turma precisava de um substituto só para
> a verificação local. Com Node, `node dist/main.js` é exatamente o mesmo comando em
> Windows, macOS, Linux e na PaaS. Não há segundo servidor, nem instrução separada.

Ajuste `main.ts` para produção:

```ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");
app.set("trust proxy", 1);        // a PaaS termina o TLS; sem isto, o cookie secure não vai
app.use(helmet());
await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
```

| Linha | Por quê |
|---|---|
| `trust proxy` | Sem ela, o Express acha que a conexão é HTTP e **recusa** enviar o cookie `secure`. Sintoma: login funciona local e falha em produção, sem erro |
| `"0.0.0.0"` | Escutar em todas as interfaces. Só `localhost` seria inacessível de fora do contêiner |
| `process.env.PORT` | A plataforma **decide** a porta e a informa por variável. Porta fixa não recebe tráfego |

Valide localmente antes de subir — este passo economiza a maior parte do tempo de depuração
remota. É o **mesmo comando nas três plataformas**:

```bash
pnpm build
NODE_ENV=production SESSION_SECRET=teste node dist/main.js
```

```powershell
# Windows PowerShell — variáveis não são inline e FICAM na sessão
$env:NODE_ENV="production"; $env:SESSION_SECRET="teste"
pnpm build
node dist/main.js

# ao terminar, limpe — senão o próximo start:dev sobe em modo produção
Remove-Item Env:\NODE_ENV, Env:\SESSION_SECRET
```

**Deu certo se:** `curl.exe -i http://localhost:3000/api/obras` responde 200 rodando a partir
de `dist/`, não do fonte.

> 🪟 **Finais de linha.** Se o seu deploy usa algum `.sh`, ele roda na PaaS, que é Linux —
> salvo com CRLF, falha com `bad interpreter: No such file or directory`. Garanta o
> `.gitattributes` com `*.sh text eol=lf` (M00). Continua valendo mesmo sem Gunicorn.

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
   - Build: `pnpm install --frozen-lockfile && pnpm build`
   - Start: `pnpm migration:run:prod && pnpm start:prod`
3. Variáveis:

| Chave | Valor |
|---|---|
| `SESSION_SECRET` | gere um **novo**, exclusivo de produção |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | a Internal Database URL |
| `CORS_ORIGENS` | `https://bibliocom.onrender.com` |

⚠️ **Não** existe `PORT` nesta lista: a plataforma a define sozinha. Defini-la à mão é um
jeito comum de o serviço subir e nunca receber tráfego.

4. Deploy. Acompanhe os logs até o fim — as migrações aparecem lá.
5. Crie o primeiro usuário de coordenação. Como não há painel administrativo pronto, use um
   script `pnpm seed:admin` que lê e-mail e senha do ambiente:

```bash
ADMIN_EMAIL=voce@exemplo.org ADMIN_SENHA='...' pnpm seed:admin
```

> Um script versionado é melhor que criar o usuário à mão: é reproduzível, roda igual em
> qualquer ambiente e fica registrado no repositório o que foi feito.

6. Teste: `curl https://sua-api/api/obras`

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

**B) O NestJS serve a SPA** (artefato único, mais simples de operar)

```bash
pnpm --filter backend add @nestjs/serve-static
```

```ts
// backend/src/app.module.ts
ServeStaticModule.forRoot({
  rootPath: join(__dirname, "..", "..", "frontend", "dist"),
  exclude: ["/api/{*caminho}"],
}),
```

⚠️ O `exclude` é obrigatório: sem ele, o módulo de estáticos captura `/api/*` **antes** dos
controllers e toda a API responde `index.html` — com status 200, o que torna o diagnóstico
especialmente confuso.

Comando de build na plataforma, a partir da raiz do monorepo:

```
pnpm install --frozen-lockfile && pnpm --filter frontend build && pnpm --filter backend build
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
| Login funciona local e falha em produção | Cookie `secure` não enviado | `app.set("trust proxy", 1)` |
| Redirecionamento infinito | Loop de HTTPS | Deixe o TLS com o proxy da PaaS |
| Erro de CORS em produção | Console cheio | Sirva os dois sob o mesmo site |
| Uploads somem a cada deploy | Disco efêmero | Armazenamento externo |
| Frontend publicado antes do backend | Cliente novo, API velha | Backend primeiro |
| `500` sem detalhes | Comportamento **correto** | Leia os logs; nunca exponha `erro.stack` |
| API responde HTML | Faltou `exclude` no `ServeStaticModule` | Estratégia B, ver Passo 4 |
| Cookie de sessão não chega | Faltou `trust proxy` | `app.set("trust proxy", 1)` |
| Serviço sobe e não recebe tráfego | Porta fixa no código | Use `process.env.PORT` |

## ✅ Checklist de saída

- [ ] API e SPA no ar, sob o mesmo site, com HTTPS
- [ ] PostgreSQL gerenciado, migrações aplicadas
- [ ] *Fallback* de rotas configurado e testado com F5
- [ ] Cache com hash nos assets e `no-cache` no `index.html`
- [ ] Variáveis de ambiente configuradas; nenhum segredo no bundle
- [ ] Deploy automático a partir da `main`, condicionado ao CI verde
- [ ] Usuário de coordenação criado por script versionado
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

- [NestJS — Serve Static](https://docs.nestjs.com/recipes/serve-static)
- [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy)
- [The Twelve-Factor App (pt-br)](https://12factor.net/pt_br/)
- [TypeORM — migrações em produção](https://typeorm.io/migrations#running-and-reverting-migrations)
- [MDN — Cache-Control](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Cache-Control)
