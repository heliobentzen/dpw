# Checklist de segurança — antes de colocar no ar

Imprima e percorra item a item. Todo item marcado precisa de **evidência**
(configuração, commit ou saída de comando), não de memória.

## Configuração

- [ ] `DEBUG = False` em produção
- [ ] `SECRET_KEY` vem de variável de ambiente, com ≥ 50 caracteres aleatórios
- [ ] `SECRET_KEY` de produção **nunca** foi usada em desenvolvimento nem versionada
- [ ] `ALLOWED_HOSTS` com os domínios reais (nada de `["*"]`)
- [ ] `.env` no `.gitignore`; `.env.example` sem valores
- [ ] `python manage.py check --deploy` sem avisos
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
- [ ] Todo acesso a objeto de usuário filtra o queryset (sem IDOR)
- [ ] Recurso privado inexistente para quem não pode vê-lo devolve **404**
- [ ] Todo `ModelForm` tem `fields` explícito
- [ ] Campos sensíveis definidos no servidor, nunca vindos do cliente
- [ ] Matriz de acesso testada (papel × rota) e automatizada em teste

## Entrada e saída

- [ ] Nenhum SQL montado com f-string/concatenação
- [ ] Nenhum `|safe` / `mark_safe` sobre dado do usuário
- [ ] `format_html` em vez de concatenação ao gerar HTML em Python
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
- [ ] Dependências com versão fixada (`requirements.txt` ou lock)
- [ ] `detect-secrets scan` limpo, inclusive no histórico do Git
- [ ] Backup automatizado do banco **e restauração testada**
- [ ] Logs de segurança (login, falha, acesso negado, erro 5xx) sendo gravados
- [ ] Alguém recebe alerta quando a aplicação cai ou erra em série
- [ ] Plano de resposta a incidente escrito (quem faz o quê, em que ordem)

## Verificação final

```bash
DEBUG=False python manage.py check --deploy
pip-audit
detect-secrets scan
curl -I https://seu-dominio/ | grep -iE "strict-transport|x-frame|x-content|referrer|content-security"
```

Depois, tente, **no seu próprio sistema**:

1. Acessar recurso de outro usuário trocando o id na URL.
2. Enviar um POST sem token CSRF.
3. Enviar `<script>alert(1)</script>` em cada campo de texto.
4. Enviar `' OR '1'='1` em cada campo de busca.
5. Acessar cada rota administrativa como usuário comum.
6. Enviar um arquivo `.php` renomeado para `.jpg`.

Se algum funcionou, você acabou de encontrar um bug de segurança antes que outra pessoa o
encontrasse. Corrija, escreva um teste de regressão e siga.
