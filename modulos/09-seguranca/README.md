# M09 — Segurança de APIs

> **Pré-requisito:** M08 · **Duração:** longa · **Semana:** 11
> **Ementa:** *Segurança.*
> **No projeto:** a equipe ataca a própria API e corrige o que encontrar · P3 (critério 3, eliminatório)

## Por que este módulo existe no projeto

O M08 respondeu "você pode chamar esta rota?". Falta a pergunta mais traiçoeira: **"você pode
mexer neste registro específico?"** — e uma lista de portas que ninguém trancou porque o
código "funciona": respostas com campos demais, corpo sem limite, login sem limite de
tentativas, cabeçalhos que anunciam a tecnologia.

A API da equipe vai guardar **dados pessoais de pessoas reais** — muitas vezes em situação de
vulnerabilidade, no caso de organizações comunitárias. Uma vulnerabilidade crítica não
corrigida é eliminatória na P3. Este módulo é a **vistoria** antes do deploy da semana 14.

## 🎯 Ao final do módulo

1. A equipe tem um modelo de ameaça do próprio sistema e um mapa dos dados pessoais.
2. Cada recurso com dono confere o dono **dentro da consulta**.
3. A API tem limites (corpo, login, paginação), cabeçalhos de segurança e CORS explícito.
4. `docs/seguranca.md` registra cada falha encontrada, como foi reproduzida e corrigida.

---

## 📖 Conceitos

### 1. Pensar como quem ataca

Antes de trancar a casa, faz-se uma **vistoria**: o que tem valor, quem pode querer entrar,
e por onde. Tudo que cruza a fronteira entre a internet e o servidor é suspeito.

A lista de referência é o **OWASP API Security Top 10 (2023)**. Os itens que mais aparecem em
projetos como os da disciplina:

| OWASP | Em português | Onde se trata |
| --- | --- | --- |
| **API1** | Ver ou mexer no registro de outra pessoa (IDOR) | Conceito 2 |
| API2 | Login fraco, força bruta | M08 + conceito 4 |
| **API3** | Devolver ou aceitar campo demais | M07 + conceito 3 |
| API4 | Pedir tanto que o servidor cai | M07 (`@Max`) + conceito 4 |
| API5 | Chamar a rota de outro papel | M08 |
| API8 | Configuração insegura (cabeçalhos, CORS, erros verbosos) | Conceito 5 |

### 2. Autorização por objeto (API1 — o mais comum)

Uma pessoa logada, com papel permitido, troca o número na URL:

```bash
curl -b voluntario.txt http://localhost:3000/api/atendimentos/41   # o dela: 200
curl -b voluntario.txt http://localhost:3000/api/atendimentos/42   # o de outra pessoa: 200 ❌
```

É o ataque mais simples que existe, e o que causa os maiores vazamentos. A correção é
conferir o dono **dentro da consulta**, para que esquecer seja impossível:

```ts
async buscarDoUsuario(id: number, usuarioId: number, papel: Papel) {
  const where = papel === Papel.COORDENACAO ? { id } : { id, responsavelId: usuarioId };
  const a = await this.atendimentos.findOne({ where, relations: { pessoa: true } });
  if (!a) throw new NotFoundException(`Atendimento ${id} não encontrado`);
  return a;
}
```

**404, não 403**: um 403 confirmaria que o registro existe. Para quem não pode ver, "não
existe" e "não é seu" respondem igual. O mesmo vale para listagens: o filtro pelo dono vai
no `where`, não num `.filter()` depois.

### 3. Exposição de dados (API3)

DTO de saída no detalhe e entidade crua na **listagem** é o esquecimento clássico. E a
pergunta não é só "este campo é interno?", mas **"quem consome precisa disto?"**. CPF,
telefone, endereço e dados de saúde só saem para quem precisa, e só onde precisa.

> **LGPD na prática:** dado que não é coletado não vaza. Para cada dado pessoal, a equipe
> precisa saber dizer **para que** a organização o usa. Se ninguém sabe, ele sai do modelo.

### 4. Limites: o cliente não decide quanto trabalho o servidor faz

| Limite | Sem ele | Como |
| --- | --- | --- |
| Tamanho da página | `?tamanho=999999` devolve o banco | `@Max(100)` (M07) |
| Tamanho do corpo | JSON de 50 MB ocupa a memória | `app.useBodyParser("json", { limit: "20kb" })` → **413** |
| Tentativas de login | Um robô testa milhares de senhas | `@nestjs/throttler` no login → **429** |
| Tamanho de arquivo | 4 GB derrubam a API | `limits.fileSize` (M07) |

### 5. Configuração

- **`helmet`** acrescenta cabeçalhos que pedem ao navegador para se proteger, e remove o
  `X-Powered-By: Express` (um cartão de visita para quem procura falhas conhecidas).
- **CORS** é a lista de convidados que o **navegador** confere: quais sites podem ler as
  respostas da API usando o cookie de quem está logado. Não protege contra `curl`. O erro
  clássico é **abrir demais** (`origin: true` com `credentials: true`).
- **CSRF**: o cookie vai sozinho em requisições disparadas por outro site. A API já tem duas
  defesas — `sameSite: "lax"` (M08) e só aceitar JSON das origens da lista. Se um dia aceitar
  formulário HTML, precisa de token anti-CSRF.
- **Erros e logs**: o `500` responde só `Internal server error`; o detalhe vai para o log de
  quem opera. E o log de SQL em produção não pode imprimir e-mails e hashes.

---

## 🧩 No projeto da equipe

### Passo 1 — Modelo de ameaça e mapa de dados (a equipe toda, 30 min)

Em `docs/seguranca.md`:

1. **O que tem valor** no sistema de vocês (quais dados pessoais, de quem).
2. **Quem pode querer atacar** (alguém de fora; um usuário legítimo tentando ver o que não é
   dele; um robô).
3. **Mapa de dados pessoais**, uma linha por campo:

   | Entidade.campo | Para que a organização usa | Quem pode ver | Sai em quais respostas |
   | --- | --- | --- | --- |
   | `Pessoa.cpf` | Identificar no balcão | coordenação | só no detalhe, para coordenação |
   | `Pessoa.nascimento` | ??? | | |

   Campo sem resposta na segunda coluna é candidato a **sair do modelo** (migração no M05).

### Passo 2 — Ataque cruzado

Dividam a equipe em dois pares. **Cada par ataca as rotas que o outro escreveu**, com o
`curl` e dois usuários de papéis diferentes. Para cada rota, tentem:

- [ ] **IDOR:** trocar o id na URL por um registro de outra pessoa (e na listagem: vem tudo?)
- [ ] **Papel:** chamar como o papel com menos poder
- [ ] **Campos extras:** mandar `"papel": "coordenacao"`, `"criadoEm"`, `"id"` no corpo
- [ ] **Resposta:** algum campo da coluna "quem pode ver" do mapa vazou?
- [ ] **Limites:** `?tamanho=999999`, corpo de 30 KB, 10 logins errados seguidos
- [ ] **Injeção:** `' OR 1=1 --` em todo filtro de texto

Cada falha vira uma linha em `docs/seguranca.md` e **um commit de correção**:

| Ameaça | OWASP | Rota | Como reproduzir | Correção | Commit |
| --- | --- | --- | --- | --- | --- |
| Voluntário lê atendimento de outro | API1 | `GET /api/atendimentos/:id` | `curl -b vol.txt .../42` → 200 | Dono no `where`, 404 | `a1b2c3d` |

> Uma IA ajuda a gerar a lista de ataques (*"liste 20 requisições maliciosas contra esta rota"*).
> O que ela não sabe é a regra da organização: só vocês sabem que voluntário não pode ver o
> atendimento de outro.

### Passo 3 — Limites

```bash
npm install @nestjs/throttler helmet
```

`main.ts`:

```ts
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.use(helmet());
app.useBodyParser("json", { limit: "20kb" });
```

`app.module.ts` → `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])`, e no login:

```ts
@Post()
@UseGuards(ThrottlerGuard)
@HttpCode(200)
async entrar(/* ... */)
```

**Deu certo se** 10 logins errados seguidos mostram `401 401 401 401 401 429 429 ...`, e um
corpo de 30 KB recebe `413`.

### Passo 4 — CORS explícito

No esquema do `validate`: `CORS_ORIGENS: z.string().default("")`. No `main.ts`:

```ts
app.enableCors({
  origin: (process.env.CORS_ORIGENS ?? "").split(",").filter(Boolean),
  credentials: true,
});
```

Com a variável vazia, nenhuma origem externa é aceita — o certo enquanto não houver cliente
web. Confiram com `curl -I -H "Origin: https://malicioso.example" ...`: a resposta **não**
pode trazer `Access-Control-Allow-Origin`.

### Passo 5 — Erros, logs, dependências e segredos

```ts
// app.module.ts — em produção, só consultas que falharam vão para o log
logging: process.env.NODE_ENV === "production" ? ["error"] : true,
```

```bash
docker compose stop db && curl -i http://localhost:3000/api/<recurso>   # 500 genérico, detalhe só no terminal
docker compose start db
npm audit --audit-level=high                       # sem vulnerabilidade alta
npx @secretlint/quick-start "**/*"                  # sem segredo no código
git log --all --oneline -- backend/.env             # vazio: o .env nunca entrou no Git
```

Se o `.env` aparecer no histórico, o segredo **está vazado**: gerem outro `SESSION_SECRET` e
troquem as senhas antes de qualquer outra coisa.

### Passo 6 — Checklist

Percorram o [checklist de segurança](../../recursos/checklists/seguranca.md) e marquem cada
item com **evidência** (comando e saída, ou "não se aplica" com o motivo). É o que o docente
usa na P3.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| CORS bloqueia o cliente legítimo | Origem fora da lista, ou com barra no final |
| `CORS_ORIGENS` ignorada | Fora do esquema do `validate` (a mesma armadilha do M04) |
| Login sempre `429` em produção | Falta `trust proxy`: todos chegam com o IP do proxy (M12) |
| `Property 'useBodyParser' does not exist` | Faltou `<NestExpressApplication>` |
| `npm audit fix --force` quebrou o projeto | Subiu versão principal; reverta pelo Git e atualize com cuidado |

## 🤖 IA no fluxo

Bons atacantes de primeira viagem e bons explicadores de CVE. Péssimos em decidir o que é
falha no **seu** domínio — e código gerado costuma vir com `app.enableCors()` sem argumento,
porque "funciona". Confiram toda configuração de segurança que vocês não escreveram.

## ✅ Marco do módulo

- [ ] `docs/seguranca.md` com modelo de ameaça, mapa de dados pessoais e tabela de falhas corrigidas
- [ ] Todo recurso com dono confere o dono no `where`; outra pessoa recebe 404
- [ ] Nenhuma resposta (detalhe **ou** listagem) devolve entidade crua
- [ ] `413`, `429` e teto de paginação funcionando; `helmet` e CORS explícito
- [ ] `npm audit`, `secretlint` e histórico do `.env` limpos
- [ ] Checklist de segurança preenchido com evidências

## 📚 Para aprofundar

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP — REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [MDN — CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
- [ANPD — Guia de agentes de tratamento (LGPD)](https://www.gov.br/anpd/pt-br)
- ➕ [`recursos/codigo/vulneravel.ts`](../../recursos/codigo/vulneravel.ts) — laboratório com 10 falhas para treinar o olhar
