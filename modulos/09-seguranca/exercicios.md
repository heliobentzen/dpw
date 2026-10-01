# M09 — Exercícios

## E09.1 — Modelo de ameaça de outra funcionalidade (individual) ⭐

A biblioteca quer uma rota pública `GET /api/obras/:id/disponibilidade`, que diz quantos
exemplares estão na estante, para um totem na entrada.

1. Desenhe a fronteira de confiança (pode ser em Mermaid, como na etapa 1).
2. Liste os ativos envolvidos e quem pode querer abusar da rota.
3. Para cada item do OWASP API Top 10 da etapa 1, diga se ele se aplica e por quê.

**Verificação:**

- [ ] Ao menos três ameaças concretas, cada uma com a proteção proposta
- [ ] Uma ameaça de **consumo de recursos** (o totem fica ligado o dia inteiro)

---

## E09.2 — Caçar IDOR (em duplas)

Cada pessoa da dupla cria um usuário bibliotecário. Depois, juntas:

1. Listem **todas** as rotas que recebem um id na URL.
2. Para cada uma, tentem acessar o objeto da outra pessoa com o próprio cookie.
3. Preencham:

| Rota | O recurso tem dono? | Resposta para o dono | Resposta para outra pessoa | Correto? |
|---|---|---|---|---|
| | | | | |

---

## E09.3 — O que a resposta revela (individual)

Para cada situação, anote a resposta da sua API e diga o que um atacante aprende com ela:

| Situação | Status e mensagem | O que vaza |
|---|---|---|
| Login com e-mail inexistente | | |
| `GET /api/usuarios/1` como bibliotecário | | |
| `GET /api/obras/abc` | | |
| `POST /api/obras` com `autorId` inexistente | | |
| Banco fora do ar | | |

O quarto caso é o interessante: confira se a resposta é `500` ou algo mais útil, e se ela
cita o nome de alguma tabela ou restrição.

---

## E09.4 — Limites sob medida (individual)

1. O limite de 5 tentativas por minuto vale por IP. Que problema isso causa num laboratório
   em que toda a turma sai pelo mesmo IP?
2. Proponha um limite que considere também o **e-mail** tentado. O que ele protege que o
   limite por IP não protege?
3. Configure, para o catálogo público (`GET /api/obras`), um limite mais folgado que o do
   login, usando um segundo item na lista do `ThrottlerModule.forRoot`. Comprove com `curl`.

---

## E09.5 — CORS aberto demais (individual) ⚠️

1. Troque a configuração para `app.enableCors({ origin: true, credentials: true })`.
2. Repita os dois `curl` da etapa 9. O que mudou na segunda resposta?
3. Explique, em cinco linhas, o que um site malicioso consegue fazer com o navegador de uma
   coordenadora logada, nessa configuração.
4. Desfaça.

---

## E09.6 — Dependência vulnerável (individual)

1. Rode `npm audit` e escolha um aviso (se não houver, use o histórico de avisos de um
   pacote famoso no GitHub Advisory Database).
2. Responda: a vulnerabilidade está em código que **roda em produção** ou só em ferramenta de
   desenvolvimento? A função vulnerável é usada pelo BiblioCom?
3. Decida: corrigir agora, agendar ou aceitar o risco — e justifique.

---

## Gabarito parcial

**E09.3** — Login: nada (resposta idêntica à de senha errada). Usuário 1: nada (`404`, como
um id inexistente). `abc`: só que o id é numérico — aceitável. `autorId` inexistente: se a
API responde `500`, falta tratar a violação de chave estrangeira como `422` ou `404` com
mensagem de domínio; se a mensagem cita `FK_…`, vaza o esquema do banco.

**E09.4** — (1) A turma inteira divide as 5 tentativas: uma pessoa errando a senha bloqueia
as outras. (2) Um limite por e-mail protege a conta de um ataque distribuído, vindo de muitos
IPs; o custo é que um atacante consegue bloquear a conta de alguém de propósito — por isso
o bloqueio por conta costuma ser curto e progressivo.

**E09.5** — (2) A origem maliciosa passa a receber `Access-Control-Allow-Origin` com o
próprio endereço, e `Allow-Credentials: true`. (3) O site lê as respostas da API com o
cookie da vítima: cadastros, dados pessoais, tudo que ela pode ver.
