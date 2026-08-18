# Checklist de segurança — antes de colocar no ar

Imprima e percorra item a item. Todo item marcado precisa de **evidência**
(configuração, commit ou saída de comando), não de memória.

## Configuração

- [ ] `DEBUG = False` em produção
- [ ] `SESSION_SECRET` vem de variável de ambiente, com ≥ 50 caracteres aleatórios
- [ ] `SESSION_SECRET` de produção **nunca** foi usada em desenvolvimento nem versionada
- [ ] `ALLOWED_HOSTS` com os domínios reais (nada de `["*"]`)
- [ ] `.env` no `.gitignore`; `.env.example` sem valores
- [ ] `helmet` aplicado e cabeçalhos conferidos na resposta
- [ ] Caminho do admin alterado (`/admin/` → algo não óbvio)
- [ ] Acesso ao admin restrito (IP, VPN ou MFA), se possível

## Transporte e cabeçalhos

- [ ] HTTPS obrigatório (`SECURE_SSL_REDIRECT = True`)
- [ ] `SECURE_HSTS_SECONDS = 31536000` (só após confirmar que o HTTPS funciona)
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] `SESSION_COOKIE_HTTPONLY = True`
- [ ] `SESSION_COOKIE_SAMESITE = "Lax"` (ou `Strict`)
- [ ] `SECURE_CONTENT_TYPE_NOSNIFF = True`
- [ ] `X_FRAME_OPTIONS = "DENY"`
- [ ] `SECURE_REFERRER_POLICY = "same-origin"`
- [ ] CSP configurada e testada
- [ ] Nota A em securityheaders.com

## Controle de acesso

- [ ] Toda view não pública exige autenticação
- [ ] Toda view de escrita exige permissão específica
- [ ] Todo acesso a objeto de usuário filtra a consulta (sem IDOR)
- [ ] Recurso privado inexistente para quem não pode vê-lo devolve **404**
- [ ] Todo `ModelForm` tem `fields` explícito
- [ ] Campos sensíveis definidos no servidor, nunca vindos do cliente
- [ ] Matriz de acesso testada (papel × rota) e automatizada em teste

## Específico de arquitetura desacoplada 🟣

- [ ] `CORS_ALLOWED_ORIGINS` com lista explícita (nunca `CORS_ALLOW_ALL_ORIGINS`)
- [ ] **Jamais** `CORS_ALLOW_ALL_ORIGINS = True` junto com `CORS_ALLOW_CREDENTIALS = True`
- [ ] Melhor ainda: SPA e API sob o **mesmo site**, dispensando CORS
- [ ] Nenhum segredo em variável `VITE_*` — comprovado com `grep -r "<segredo>" dist/`
- [ ] `sourcemap: false` no build de produção
- [ ] Nenhum `dangerouslySetInnerHTML` com dado do usuário
- [ ] `href`/`src` vindos do usuário têm o esquema validado (só http/https)
- [ ] `rel="noopener noreferrer"` em todo `target="_blank"`
- [ ] Token de sessão **não** está em `localStorage` nem `sessionStorage`
- [ ] Cookie de sessão `HttpOnly`; cookie CSRF legível (papéis diferentes, ver M12)
- [ ] `X-CSRFToken` enviado em toda escrita
- [ ] Cache do TanStack Query limpo no logout (`queryClient.clear()`)
- [ ] CSP com `connect-src` restrito
- [ ] DTOs de saída minimizados: a API não devolve campo que a tela não usa
- [ ] Controle de acesso **não** depende de `RotaProtegida` — provado com `curl`

## Entrada e saída

- [ ] Nenhum SQL montado com f-string/concatenação
- [ ] Nenhum `|safe` / `mark_safe` sobre dado do usuário
- [ ] Nenhum `dangerouslySetInnerHTML` sem sanitização (DOMPurify)
- [ ] URLs informadas pelo usuário têm o esquema validado (só http/https)
- [ ] Upload valida tipo (conteúdo, não extensão) e tamanho
- [ ] Diretório de mídia não executa código; `X-Content-Type-Options: nosniff`
- [ ] Nenhum `subprocess` com `shell=True` e entrada do usuário
- [ ] Caminhos de arquivo construídos com `safe_join`
- [ ] Exportação CSV escapa fórmulas (`=`, `+`, `-`, `@` no início do campo)

## Autenticação

- [ ] Senhas com Argon2 ou PBKDF2 (nunca texto puro, nunca criptografia reversível)
- [ ] Todos os `AUTH_PASSWORD_VALIDATORS` ativos, mínimo 12 caracteres
- [ ] Mensagem de erro de login genérica (sem enumeração de usuários)
- [ ] Bloqueio após tentativas repetidas (usuário + IP)
- [ ] Token de recuperação de senha: uso único, expiração curta, guardado como hash
- [ ] Logout por POST
- [ ] Sessão com expiração definida
- [ ] MFA nas contas administrativas (ao menos recomendado)

## Dados pessoais (LGPD)

- [ ] Mapa de dados pessoais preenchido (dado, finalidade, base legal, retenção)
- [ ] Nenhum dado coletado "por precaução"
- [ ] Aviso de privacidade acessível e em linguagem simples
- [ ] Titular consegue acessar, corrigir e solicitar eliminação dos próprios dados
- [ ] Dados sensíveis: evitados; se inevitáveis, justificados e protegidos
- [ ] Logs não contêm senha, token, CPF completo nem cookie de sessão
- [ ] Prazo de retenção dos logs definido

## Dependências e operação

- [ ] `pip-audit` sem vulnerabilidades críticas ou altas
- [ ] `pnpm audit` sem vulnerabilidades críticas ou altas
- [ ] Dependências fixadas nos dois projetos (`pnpm-lock.yaml` das duas camadas)
- [ ] `detect-secrets scan` limpo, inclusive no histórico do Git
- [ ] Backup automatizado do banco **e restauração testada**
- [ ] Logs de segurança (login, falha, acesso negado, erro 5xx) sendo gravados
- [ ] Alguém recebe alerta quando a aplicação cai ou erra em série
- [ ] Plano de resposta a incidente escrito (quem faz o quê, em que ordem)

## Verificação final

```bash
# ---- Linux / macOS / WSL / Git Bash ----
cd backend
pnpm audit --audit-level=high
pip-audit

cd ../frontend
pnpm audit
pnpm build && grep -rEi "secret|password|api[_-]?key|AKIA" dist/ || echo "nenhum segredo no bundle"

detect-secrets scan
curl -I https://seu-dominio/ | grep -iE "strict-transport|x-frame|x-content|referrer|content-security"
```

```powershell
# ---- Windows PowerShell ----
cd backend
pnpm audit --audit-level=high
pip-audit

cd ..\frontend
pnpm audit
pnpm build
Select-String -Recurse -Pattern "secret|password|api[_-]?key|AKIA" dist/*

detect-secrets scan
curl.exe -I https://seu-dominio/ | Select-String "strict-transport|x-frame|x-content|referrer|content-security"
```

Depois, tente, **no seu próprio sistema**:

1. Acessar recurso de outro usuário trocando o id na URL.
2. Enviar um POST sem token CSRF.
3. Enviar `<script>alert(1)</script>` em cada campo de texto.
4. Enviar `' OR '1'='1` em cada campo de busca.
5. Acessar cada rota administrativa como usuário comum.
6. Enviar um arquivo `.php` renomeado para `.jpg`.
7. Chamar um endpoint administrativo com `curl`, logado como usuário comum.
8. Procurar segredos no `dist/` publicado.

Se algum funcionou, você acabou de encontrar um bug de segurança antes que outra pessoa o
encontrasse. Corrija, escreva um teste de regressão e siga.
