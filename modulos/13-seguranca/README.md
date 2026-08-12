# M13 — Segurança de aplicações web

> **CH:** 5h (3h teóricas · 2h práticas) · **Semana 13** · **Pré-requisitos:** M07, M11, M12
> **Ementa:** *Tópicos relevantes: Segurança.*

Organizado sobre o **OWASP Top 10:2021**, com uma pergunta a mais que a versão monolítica
tinha: **quais riscos a arquitetura desacoplada acrescenta?**

## 🎯 Objetivos

1. Explicar as principais classes de vulnerabilidade e como se manifestam nas duas camadas.
2. Identificar código vulnerável e corrigi-lo, no Django e no React.
3. Configurar CORS, CSP e cabeçalhos de segurança corretamente.
4. Reconhecer os riscos específicos de SPA: segredo no *bundle*, XSS em React, CORS
   permissivo, roubo de token.
5. Aplicar minimização de dados e LGPD ao projeto.

---

## 📖 Teoria (3h)

### 0. Três princípios e uma constatação (10 min)

1. **Nunca confie na entrada.** Formulário, URL, cabeçalho, cookie, arquivo, JSON.
2. **Defesa em profundidade.** Nenhuma camada basta sozinha.
3. **Menor privilégio.** O mínimo necessário, pelo menor tempo.

E a constatação que organiza o módulo:

> **Todo o código do frontend é público.** O *bundle* está no navegador de qualquer pessoa,
> pode ser lido, modificado e ignorado. Segurança acontece **exclusivamente** no servidor.
> O React contribui com higiene (não vazar segredo, não injetar HTML), nunca com proteção.

### 1. A01 — Quebra de controle de acesso (30 min)

Campeã do Top 10. Já implementada no M12; aqui, os padrões de ataque.

#### IDOR

```python
# ❌ qualquer pessoa autenticada vê o empréstimo de qualquer outra
class EmprestimoViewSet(viewsets.ModelViewSet):
    queryset = Emprestimo.objects.all()

# ✅ o filtro faz parte da consulta
    def get_queryset(self):
        qs = Emprestimo.objects.select_related("exemplar__obra")
        return qs if self.request.user.eh_equipe else qs.filter(associado__user=self.request.user)
```

#### Mass assignment

```python
class Meta:
    fields = "__all__"                     # ❌ expõe qualquer campo futuro
    fields = ["titulo", "autor", "isbn"]   # ✅
```

#### Autorização decidida pelo cliente

```python
# ❌ o cliente escolhe o próprio papel
usuario.papel = request.data["papel"]

# ✅ o servidor decide
def perform_create(self, serializer):
    serializer.save(cadastrada_por=self.request.user)
```

#### O erro específico de SPA

```tsx
// ❌ "protegido" só no cliente
{usuario.eh_equipe && <BotaoExcluir />}
```

Esconder o botão é UX. Sem `permission_classes` no ViewSet, um `curl` faz a exclusão. A
regra: **cada tela escondida no cliente precisa de uma permissão correspondente no
servidor**, e a matriz do M12 é o instrumento que verifica isso.

### 2. A03 — Injeção (35 min)

#### SQL

```python
Obra.objects.raw(f"SELECT * FROM acervo_obra WHERE titulo = '{nome}'")   # ❌
Obra.objects.filter(titulo=nome)                                          # ✅ ORM
Obra.objects.raw("SELECT * FROM acervo_obra WHERE titulo = %s", [nome])   # ✅ parametrizado
```

Dados nunca são concatenados em comandos — vale para SQL, shell e caminhos de arquivo.

#### XSS em React ⭐

React **escapa por padrão**: `{textoDoUsuario}` nunca vira HTML. Você desliga a proteção em
três lugares, e só três:

```tsx
// ❌ o nome do método é literalmente um aviso
<div dangerouslySetInnerHTML={{ __html: obra.sinopse }} />

// ❌ href com valor do usuário: aceita javascript:alert(1)
<a href={obra.link_externo}>Saiba mais</a>

// ❌ injeção via style ou atributos montados dinamicamente
<div style={{ background: `url(${entradaDoUsuario})` }} />
```

Correções:

```tsx
// 1. não injete HTML; se precisar, sanitize na ESCRITA (backend, com nh3/bleach)
<p className="whitespace-pre-line">{obra.sinopse}</p>

// 2. valide o esquema da URL
function urlSegura(url: string): string | undefined {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}
<a href={urlSegura(obra.link_externo)} rel="noopener noreferrer" target="_blank">
```

> `rel="noopener"` impede que a página aberta acesse `window.opener` e redirecione a sua —
> o ataque de *tabnabbing*.

#### Injeção de comando e path traversal

```python
os.system(f"convert {nome} saida.png")                    # ❌
subprocess.run(["convert", nome, "saida.png"], check=True) # ✅ lista, sem shell

os.path.join(MEDIA_ROOT, request.GET["arquivo"])          # ❌ ../../etc/passwd
safe_join(MEDIA_ROOT, nome_validado)                       # ✅
```

### 3. CORS e CSRF numa SPA (30 min) ⭐

Duas coisas diferentes que a turma sempre confunde.

| | CORS | CSRF |
|---|---|---|
| O que é | Política do **navegador** sobre ler respostas de outra origem | Ataque em que outro site dispara ação autenticada no seu |
| Quem aplica | O navegador | Você, com um token |
| Protege quem | O **usuário do outro site** | O **seu** usuário |
| Erro típico | "blocked by CORS policy" no console | 403 em todo POST |

**CORS não é segurança da sua API.** Ele impede que o JavaScript de `site-malicioso.com`
**leia** a resposta da sua API. Ele não impede `curl`, nem Postman, nem um servidor. Se sua
API precisa de proteção, ela precisa de **autenticação e autorização** — CORS é irrelevante
para isso.

```python
# ✅ lista explícita
CORS_ALLOWED_ORIGINS = ["https://bibliocom.org"]
CORS_ALLOW_CREDENTIALS = True

# ❌ nunca
CORS_ALLOW_ALL_ORIGINS = True         # com credenciais, expõe sessões
CORS_ALLOWED_ORIGINS = ["*"]
```

> A combinação `CORS_ALLOW_ALL_ORIGINS = True` **com** `CORS_ALLOW_CREDENTIALS = True` é a
> falha de configuração mais comum em API de projeto acadêmico: qualquer site passa a poder
> fazer requisições autenticadas em nome do seu usuário logado e **ler** as respostas.
>
> Melhor ainda: **evite CORS**. Servindo SPA e API no mesmo site (ADR-07, M16), a
> requisição é *same-origin* e o problema não existe.

CSRF continua necessário com autenticação por sessão — implementado no M12.

### 4. A02 — Segredos, e o risco específico de SPA (25 min) ⭐

| Item | Regra |
|---|---|
| `SECRET_KEY` | Variável de ambiente; nunca no Git |
| Senhas | Hash Argon2/PBKDF2 |
| Trânsito | HTTPS + HSTS |
| Tokens | `secrets.token_urlsafe()`; guarde o hash |
| Logs | Nunca senha, token, CPF completo, cookie |

**E o risco que só existe aqui:**

```ini
# frontend/.env  — conteudo do arquivo, nao comandos do terminal
VITE_API_URL=https://bibliocom.org/api          # ✅ público, tudo bem
VITE_SENTRY_DSN=https://...                     # ✅ desenhado para ser público
VITE_AWS_SECRET_KEY=AKIA...                     # ❌❌❌ CATÁSTROFE
```

Toda variável `VITE_*` é **substituída pelo valor literal em tempo de build** e vai para o
arquivo JavaScript que qualquer pessoa baixa. Prove:

```bash
pnpm build
grep -r "AKIA" dist/                          # Linux/macOS/WSL/Git Bash
```
```powershell
pnpm build
Select-String -Recurse "AKIA" dist/*          # Windows PowerShell
```

O segredo está lá, em texto puro.

Regra sem exceção: **chave que precisa ser secreta não passa pelo frontend.** Se o
navegador precisa de um serviço que exige chave secreta, o backend faz a chamada e o
frontend chama o backend.

### 5. A05 — Configuração insegura (20 min)

```python
DEBUG = True            # ❌ em produção: expõe código, settings, SQL e variáveis
ALLOWED_HOSTS = ["*"]   # ❌ envenenamento de cache e de links
```

```bash
python manage.py check --deploy      # antes de todo deploy
```

**No frontend:**

```ts
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false,      // não publique o código-fonte original em produção
  },
});
```

E o *source map* é apenas conveniência do atacante — o *bundle* já é legível. Não confunda
com proteção: **ofuscação não é segurança**.

### 6. A07 — Falhas de autenticação (20 min)

| Falha | Mitigação |
|---|---|
| Senha fraca | `AUTH_PASSWORD_VALIDATORS`, mínimo 12 |
| Força bruta | Bloqueio por usuário+IP (M12) |
| Enumeração de usuários | Mensagem única |
| Session fixation | `login()` rotaciona a sessão |
| Token em `localStorage` | Cookie `HttpOnly` (ADR-07) |
| Cache não limpo no logout | `queryClient.clear()` |
| Sessão eterna | `SESSION_COOKIE_AGE` |

### 7. Cabeçalhos e CSP (20 min)

```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_HSTS_SECONDS = 31_536_000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "same-origin"
```

**CSP numa SPA** exige atenção: o Vite injeta estilos e o React não precisa de
`unsafe-inline` para scripts, mas bibliotecas de CSS-in-JS precisam. Comece restritivo:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
```

> `connect-src 'self'` é a diretiva que mais importa numa SPA: ela limita para onde o
> JavaScript pode fazer requisições. Com ela, um script injetado não consegue enviar os
> dados roubados para o servidor do atacante.

### 8. LGPD aplicada (20 min)

| Princípio | Em código |
|---|---|
| **Finalidade** | Cada campo tem um motivo declarado |
| **Minimização** | Precisa mesmo do CPF para emprestar um livro? |
| **Transparência** | Aviso de privacidade em linguagem simples |
| **Segurança** | Controle de acesso, HTTPS, log de acesso |
| **Qualidade** | O titular corrige seus dados |

Direitos a implementar (ou documentar como atender): acesso, correção, eliminação,
portabilidade, informação.

**Riscos específicos da arquitetura desacoplada:**

- A API devolve **todos** os campos do serializer, inclusive os que a tela não mostra.
  Alguém abre a aba Network e lê. **Minimize no serializer, não na tela.**
- Serviços de monitoramento no frontend (Sentry, analytics) capturam URLs, o que pode
  incluir dados pessoais em parâmetros. Configure `send_default_pii=False` (M17).
- Cache do TanStack Query guarda dados na memória do navegador — daí a limpeza no logout.

Regra prática: **se não é essencial, não colete.** O dado que você não tem não vaza.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Laboratório de vulnerabilidades (60 min) ⭐

O laboratório tem **duas partes**, uma por camada:

- Backend: [`vulneravel.py`](../../recursos/codigo/vulneravel.py) — 10 casos
- Frontend: [`vulneravel.tsx`](../../recursos/codigo/vulneravel.tsx) — 8 casos

Trabalhe em duplas: uma pessoa ataca, a outra corrige; depois trocam. Para **cada** caso,
entregue: vulnerabilidade (nome OWASP), impacto de negócio, exploração concreta
(payload/URL/comando), correção e por que a correção funciona.

Os gabaritos estão comentados no fim de cada arquivo. Não leia antes de tentar.

### Passo 2 — `check --deploy` e cabeçalhos (25 min)

```bash
# Linux/macOS/WSL
cd backend && DEBUG=False python manage.py check --deploy
```
```powershell
# Windows PowerShell
cd backend
$env:DEBUG="False"; python manage.py check --deploy
Remove-Item Env:\DEBUG        # limpe depois: no PowerShell a variavel fica na sessao
```

Resolva **todos** os avisos e documente o que cada configuração previne. Depois:

```bash
# Linux / macOS / WSL / Git Bash
curl -I http://localhost:8000/api/obras/ | grep -iE "x-frame|x-content|referrer|strict-transport"
```
```powershell
# Windows PowerShell
curl.exe -I http://localhost:8000/api/obras/ | Select-String "x-frame|x-content|referrer|strict-transport"
```

### Passo 3 — CORS: entender antes de configurar (20 min)

1. Com `CORS_ALLOWED_ORIGINS` vazio, chame a API de `localhost:5173` **sem** o proxy.
   Capture o erro.
2. Na aba Network, encontre a requisição `OPTIONS` de *preflight*.
3. Confirme que o `curl` funciona sem nenhuma configuração. **Quem estava bloqueando?**
4. Configure `CORS_ALLOW_ALL_ORIGINS = True` com `CORS_ALLOW_CREDENTIALS = True`.
5. Escreva o cenário de ataque que isso viabiliza.
6. Corrija para a lista explícita.

### Passo 4 — Segredo no bundle (15 min)

1. Adicione `VITE_CHAVE_SECRETA=super-secreta-123` ao `frontend/.env`.
2. Use em algum componente.
3. `pnpm build && grep -r "super-secreta-123" dist/`
4. Capture a saída. Onde o segredo apareceu?
5. Remova e escreva a regra em uma frase.

---

## ⚠️ Erros comuns

| Erro | Consequência |
|---|---|
| `DEBUG=True` em produção | Vazamento de código e configuração |
| `CORS_ALLOW_ALL_ORIGINS` com credenciais | Qualquer site age em nome do seu usuário |
| Achar que CORS protege a API | `curl` ignora CORS por completo |
| Segredo em `VITE_*` | Publicado no bundle |
| `dangerouslySetInnerHTML` com dado do usuário | XSS armazenado |
| `href` do usuário sem validar esquema | `javascript:` executa |
| Token em `localStorage` | Qualquer XSS rouba a sessão |
| `fields = "__all__"` | Mass assignment |
| f-string em SQL | Injeção |
| Proteção só no `RotaProtegida` | A API fica aberta |
| Serializer devolvendo campo que a tela não mostra | Vazamento pela aba Network |
| Coletar dado "porque pode ser útil" | Violação de minimização (LGPD) |

## ✅ Checklist de saída

- [ ] Os 18 casos do laboratório identificados, explorados e corrigidos
- [ ] `check --deploy` sem avisos
- [ ] CORS com lista explícita (ou dispensado por *same-site*)
- [ ] Sei explicar por que CORS não protege a API
- [ ] Cabeçalhos de segurança e CSP configurados
- [ ] Nenhum segredo no repositório, no histórico ou no bundle
- [ ] `pip-audit` e `pnpm audit` sem alertas críticos
- [ ] Mapa de dados pessoais preenchido
- [ ] Aviso de privacidade redigido
- [ ] Serializers minimizados (não devolvem o que a tela não usa)

## 📦 Entrega E6 — Relatório de segurança

1. Tabela dos 18 casos: nome, exploração, correção, commit.
2. `check --deploy` antes e depois.
3. Cabeçalhos e CSP configurados, com justificativa.
4. Evidência do experimento do segredo no bundle.
5. **Mapa de dados pessoais** do projeto da equipe:

| Dado | Por que coletamos | Base legal | Quem acessa | Retenção | Como protegemos | É necessário? |
|---|---|---|---|---|---|---|

6. Aviso de privacidade (máx. 1 página).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Checklist em
[`../../recursos/checklists/seguranca.md`](../../recursos/checklists/seguranca.md).

## 📚 Para aprofundar

- [OWASP Top 10:2021 (pt-BR)](https://owasp.org/Top10/pt_BR/)
- [Django — Segurança](https://docs.djangoproject.com/pt-br/5.0/topics/security/)
- [OWASP — Cross-Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN — CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
- [React — dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
