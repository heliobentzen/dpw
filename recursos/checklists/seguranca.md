# Checklist de segurança — antes de colocar a API no ar

Imprima e percorra item a item. Todo item marcado precisa de **evidência**
(configuração, commit, teste ou saída de comando), não de memória.

> Pense no checklist de decolagem de um avião: o piloto sabe voar, e mesmo assim lê a lista
> em voz alta. A lista não existe porque a pessoa é incompetente, e sim porque a memória
> falha justamente nos dias de pressa.

## Configuração

- [ ] `NODE_ENV=production` no ambiente de produção
- [ ] Variáveis de ambiente validadas na subida (schema Zod no `ConfigModule`); a API
      **não sobe** se faltar uma obrigatória
- [ ] `SESSION_SECRET` (ou `JWT_SECRET`) vem do ambiente, com ≥ 32 bytes aleatórios
- [ ] O segredo de produção **nunca** foi usado em desenvolvimento nem versionado
- [ ] `.env` no `.gitignore`; `.env.example` só com nomes, sem valores reais
- [ ] `synchronize: false` fora do desenvolvimento local (o esquema muda só por migração)
- [ ] `helmet` aplicado e cabeçalhos conferidos na resposta
- [ ] Swagger (`/api/docs`) em produção por **decisão registrada**: público (API aberta, como no projeto da disciplina) ou desligado/protegido (API interna) — ele é um mapa da API

## Transporte e cabeçalhos

- [ ] HTTPS obrigatório; requisição HTTP redireciona
- [ ] `Strict-Transport-Security` só depois de confirmar que o HTTPS funciona
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `app.set("trust proxy", 1)` quando a API roda atrás do proxy da PaaS (senão o
      IP do cliente e o `Secure` do cookie ficam errados)
- [ ] CORS com lista explícita de origens — **nunca** `origin: true` junto com
      `credentials: true`

## Controle de acesso

- [ ] Toda rota não pública tem guard de autenticação
- [ ] Toda rota de escrita tem guard de papel
- [ ] Toda consulta a recurso de usuário filtra pelo usuário autenticado (sem IDOR)
- [ ] Recurso privado de outra pessoa devolve **404**, não 403 (não confirma que existe)
- [ ] Campos sensíveis (`papel`, `ativo`, `usuarioId`) definidos no servidor, nunca vindos
      do corpo da requisição
- [ ] Matriz papel × rota automatizada em teste (M10)

## Entrada e saída

- [ ] `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`
- [ ] Todo `@Body()` tipado com uma **classe** DTO (interface ou `Partial<Entidade>` não
      valida nada)
- [ ] Toda resposta passa por DTO de saída: nenhuma entidade devolvida crua
- [ ] Nenhum SQL montado com template string ou concatenação — só parâmetros
      (`:busca` no QueryBuilder)
- [ ] Paginação com teto (`@Max(100)` no `tamanho`)
- [ ] Limite de tamanho do corpo e do upload
- [ ] Upload valida tipo pelo **conteúdo**, não pela extensão
- [ ] Mensagem de erro 500 genérica: *stack trace* vai para o log, nunca para a resposta
- [ ] Exportação CSV escapa fórmulas (`=`, `+`, `-`, `@` no início do campo)

## Autenticação

- [ ] Senhas com Argon2 (ou bcrypt): nunca texto puro, nunca criptografia reversível
- [ ] Mínimo de 12 caracteres na política de senha
- [ ] Mensagem de login genérica ("e-mail ou senha inválidos") — sem enumeração de usuários
- [ ] Limite de tentativas por usuário e por IP (`@nestjs/throttler`)
- [ ] **Se sessão por cookie:** `HttpOnly`, `Secure`, `SameSite=Lax` e expiração definida
- [ ] **Se token no cabeçalho:** expiração curta, token nunca gravado em log
- [ ] Logout invalida a sessão no servidor (não só apaga o cookie do lado do cliente)
- [ ] Token de recuperação de senha: uso único, expiração curta, guardado como hash

## Dados pessoais (LGPD)

- [ ] Mapa de dados pessoais preenchido (dado, finalidade, base legal, retenção)
- [ ] Nenhum dado coletado "por precaução"
- [ ] Titular consegue acessar, corrigir e solicitar eliminação dos próprios dados
- [ ] Logs não contêm senha, token, CPF completo nem cookie de sessão
- [ ] Prazo de retenção dos logs definido

## Dependências e operação

- [ ] `npm audit --audit-level=high` sem vulnerabilidades altas ou críticas
- [ ] `package-lock.json` versionado
- [ ] `npx @secretlint/quick-start "**/*"` limpo, e o `.env` nunca apareceu no histórico do Git
- [ ] Backup automatizado do banco **e restauração testada**
- [ ] Logs de segurança (login, falha, acesso negado, erro 5xx) sendo gravados
- [ ] Alguém recebe alerta quando a API cai ou erra em série
- [ ] Plano de resposta a incidente escrito (quem faz o quê, em que ordem)

## Verificação final

```powershell
# Windows PowerShell (no Git Bash/Linux, troque curl.exe por curl)
cd backend
npm audit --audit-level=high
npx @secretlint/quick-start "**/*"
curl.exe -I https://SEU-DOMINIO/api/obras
```

Na saída do último comando, procure `strict-transport-security`, `x-content-type-options`
e a **ausência** de `x-powered-by`.

Depois, tente, **na sua própria API**:

1. Ler um recurso de outro usuário trocando o id na URL.
2. Chamar uma rota de escrita sem estar autenticado (espere 401).
3. Chamar uma rota administrativa autenticado como usuário comum (espere 403).
4. Enviar um campo extra no corpo, como `"papel": "admin"` (espere 400).
5. Enviar `' OR '1'='1` em cada parâmetro de busca.
6. Pedir `?tamanho=100000` numa listagem.
7. Enviar um arquivo `.exe` renomeado para `.jpg`.
8. Provocar um erro 500 e ler o corpo da resposta: aparece caminho de arquivo ou SQL?

Se algum funcionou, você acabou de encontrar um bug de segurança antes que outra pessoa o
encontrasse. Corrija, escreva um teste de regressão e siga.

> 🤖 **IA no fluxo.** Peça a um assistente de IA para atacar a sua API com base neste
> checklist — ele é bom em gerar variações de entrada maliciosa. Mas quem decide se o
> resultado é uma falha, e quem escreve o teste que impede a volta dela, é você.
