# M03 — Exercícios

## E03.1 — Mapear o ciclo nos seus dois projetos (individual)

Desenhe o ciclo de uma requisição a `/api/ping/?q=teste`, indicando **arquivo e linha** do
seu repositório para cada etapa:

1. Onde o React dispara a requisição
2. Onde o proxy do Vite a reescreve
3. Onde o Django reconhece a URL
4. Onde a função da view é chamada
5. Onde os parâmetros da query string são lidos
6. Onde o dicionário vira JSON
7. Onde o React recebe e guarda o resultado
8. Onde a tela é montada

**Entrega:** diagrama + lista `arquivo:linha`.

---

## E03.2 — Três endpoints (individual)

Implemente no backend, todos com `AllowAny`:

| Rota | Devolve |
|---|---|
| `GET /api/sobre/` | Nome do sistema, descrição e integrantes da equipe |
| `GET /api/saudacao/<str:nome>/` | `{"mensagem": "Olá, <nome>!"}`, com 400 se o nome tiver menos de 2 letras |
| `GET /api/calcular/?a=<n>&b=<n>` | Soma, subtração, produto e divisão; **400** com mensagem clara se `b=0` ou se `a`/`b` não forem números |

Requisitos: status HTTP correto em cada caso; formato de erro **igual** nos três; todos
testados com `curl` e visíveis em `/api/docs/`.

---

## E03.3 — Consumir os três no React (individual)

Crie um componente para cada endpoint do E03.2, tratando os **quatro estados** (carregando,
vazio, erro, conteúdo). No caso de `/api/calcular/`, o erro 400 precisa exibir a mensagem
vinda do servidor, não uma mensagem genérica.

Responda: **por que o tratamento de erro precisa distinguir "a rede falhou" de "o servidor
respondeu 400"?** O que o usuário deveria fazer em cada caso?

---

## E03.4 — Provar que o proxy importa (individual) ⭐

1. Troque `fetch("/api/ping/")` por `fetch("http://localhost:8000/api/ping/")`.
2. Recarregue e abra o Console. Capture a mensagem de erro **completa**.
3. Vá à aba Network: a requisição saiu? Qual o status? Houve uma requisição `OPTIONS` antes?
4. Agora adicione `http://localhost:5173` ao `CORS_ALLOWED_ORIGINS` e teste de novo.
5. Volte para `/api/ping/` (com proxy).

**Entrega:** as evidências dos passos 2, 3 e 4 + respostas:

- Quem bloqueou a requisição: o navegador ou o servidor?
- O que é a requisição `OPTIONS` de *preflight* e quando ela acontece?
- Por que o `curl` funciona sem nenhuma configuração de CORS?
- Por que o material prefere o proxy a configurar CORS no desenvolvimento?

Este exercício antecipa o M13. CORS é a fonte nº 1 de frustração em arquitetura
desacoplada, e quase sempre por não se entender **quem** está bloqueando.

---

## E03.5 — Negar por padrão (individual)

1. Remova `@permission_classes([AllowAny])` do `ping`.
2. Chame com `curl`. Qual status? Qual o corpo da resposta?
3. Chame pelo navegador estando logado no `/admin/`. Mudou? Por quê?
4. Explique em 3 linhas por que `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]` é uma
   escolha de segurança melhor que `AllowAny`, mesmo dando mais trabalho.

---

## E03.6 — Quebre de propósito (individual)

Provoque cada erro, capture a mensagem e explique a causa em uma linha:

| # | Como provocar | Erro esperado |
|---|---|---|
| 1 | Remover `rest_framework` do `INSTALLED_APPS` | |
| 2 | Remover `acervo` do `INSTALLED_APPS` | |
| 3 | Apagar `SECRET_KEY` do `.env` | |
| 4 | Esquecer o `return` na view | |
| 5 | Parar o `runserver` e recarregar o React | |
| 6 | Remover o bloco `proxy` do `vite.config.ts` | |
| 7 | Remover `@import "tailwindcss"` do `index.css` | |
| 8 | Devolver `Response(objeto_python_nao_serializavel)` | |

Ler mensagens de erro com calma é a habilidade de maior retorno da disciplina — e agora são
**dois** lugares para procurar: o terminal do Django e o Console do navegador.

---

## E03.7 — Comparar com o servidor mínimo (individual, discursivo)

Compare o `servidor_minimo.py` do M01 com o que você montou aqui. Para cada
responsabilidade, diga **quem** a assume agora e **quantas linhas** você escreveu:

| Responsabilidade | No servidor mínimo | No Django+DRF | Linhas que escrevi |
|---|---|---|---|
| Roteamento | `if self.path == ...` | | |
| Ler query string | `parse_qs` | | |
| Gerar JSON | `json.dumps` + headers | | |
| Definir status | `send_response(200)` | | |
| Documentar a API | não existia | | |
| Validar entrada | não existia | | |

Responda: **o que você ganhou e o que você perdeu** ao adotar o framework? (a segunda parte
tem resposta real: controle explícito e transparência sobre o que acontece)

---

## Gabarito parcial

**E03.4** — Quem bloqueia é o **navegador**, não o servidor: a resposta chega, e o navegador
se recusa a entregá-la ao JavaScript porque falta o cabeçalho
`Access-Control-Allow-Origin`. Por isso o `curl` funciona — ele não implementa a política de
mesma origem. O *preflight* `OPTIONS` acontece quando a requisição não é "simples" (método
diferente de GET/POST/HEAD, ou cabeçalho customizado como `Content-Type: application/json`).

**E03.5 (2)** — `401 Unauthorized` com `{"detail": "As credenciais de autenticação não foram
fornecidas."}`. No passo 3 funciona porque o cookie de sessão criado no login do admin é
enviado junto — o mesmo mecanismo que o M12 vai usar.
