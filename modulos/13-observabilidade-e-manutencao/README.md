# M13 — Observabilidade e manutenção

> **Pré-requisito:** M12 · **Duração:** curta · **Semana:** 14
> **No projeto:** logs, monitor, backup testado e plano de manutenção · P3 (critério 5) e P4 (critério 6, transferência)

## Por que este módulo existe no projeto

Um sistema em uso, um dia, recebe uma mensagem como: *"o registro da
Dona Ana sumiu ontem à tarde"*, ou *"desde segunda ninguém consegue entrar"*. A equipe já
terá se formado. Este módulo prepara o sistema para esse dia: **registrar o que aconteceu**,
**perceber quando cai**, **recuperar os dados** e **deixar escrito quem faz o quê**.

É a resposta técnica à pergunta *o que fica depois que a equipe sai?* O `docs/manutencao.md`
e a restauração de backup testada entram direto no critério "pronto para transferir" da P4.

## 🎯 Ao final do módulo

1. A API escreve logs estruturados, sem dados pessoais nem cookies.
2. Um monitor externo vigia o `/api/health` e o alerta **foi testado**.
3. Um backup de produção foi **restaurado** com sucesso num banco separado.
4. `docs/manutencao.md` responde quem opera, quem corrige, quanto custa e o que fazer quando cai.

---

## 📖 Conceitos

### 1. Log é para depois

Log existe para responder perguntas **depois**, quando ninguém lembra de nada: que
requisições chegaram ontem à tarde? Alguma sobre aquele registro? Quem fez? Deu erro? Para
pesquisar entre milhares de linhas, cada linha precisa ser um objeto JSON com campos — a
diferença entre um caderno e uma planilha.

**Registre identificadores, não nomes.** `pessoaId: 7` responde "quem?" para quem tem acesso
ao banco; "Ana Souza" no log responde para qualquer um com acesso ao painel — e o log é lido
por mais gente que o banco, e guardado por meses.

| Nunca no log | Por quê |
| --- | --- |
| Senha, hash, cookie, token | Quem lê o log assume a sessão |
| CPF, telefone, endereço, nome | Dado pessoal, sob a LGPD |
| Corpo inteiro das requisições | Contém tudo o que está acima |

### 2. Alguém de fora olhando

Se a API cair inteira, não há quem escreva log. Um **monitor externo** pergunta ao
`/api/health` de tempos em tempos e avisa por e-mail. **Monitor que nunca disparou é monitor
não testado** — pode apontar para a URL errada ou mandar para uma caixa que ninguém lê.

### 3. Backup só existe depois da restauração

A história mais repetida da operação de sistemas: o backup rodou todo dia por um ano, e no
dia em que foi preciso o arquivo estava vazio, ou era de outro banco. **Backup nunca
restaurado é um arquivo com um nome promissor.**

### 4. Software parado apodrece

Bibliotecas recebem correções de segurança, a plataforma muda a versão do Node, um plano
gratuito muda de regra. Sem manutenção, o sistema para de funcionar em meses, sem ninguém
mexer nele. O **Dependabot** abre PRs de atualização; o **CI** do M10 diz se eles quebram algo.

---

## 🧩 No projeto da equipe

### Passo 1 — Logs estruturados

```bash
cd backend
npm install nestjs-pino pino-http
npm install -D pino-pretty
```

`app.module.ts`:

```ts
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? "info",
    transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
    redact: ["req.headers.cookie", 'res.headers["set-cookie"]'],
  },
}),
```

`main.ts`:

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));   // Logger de "nestjs-pino"
```

Colorido em desenvolvimento, JSON em produção (para a plataforma indexar). `LOG_LEVEL=debug`
no painel mostra mais durante um incidente, sem mudar código. **Deu certo se** cada
requisição gera uma linha com método, URL, status e tempo, e o cookie aparece como
`[Redacted]`.

### Passo 2 — Eventos de negócio

Requisição não conta história; **evento de negócio** conta. Registrem os do cenário
principal e os de segurança:

```ts
private readonly logger = new Logger(AgendamentosService.name);

// depois da transação — só se registra o que de fato foi gravado
this.logger.log({ evento: "agendamento_criado", agendamentoId: a.id, pessoaId }, "Agendamento criado");
```

```ts
// AuthService.validar — sem o e-mail: no login recusado, ele pode ser de qualquer pessoa
this.logger.warn({ evento: "login_recusado" }, "Login recusado");
this.logger.log({ evento: "login", usuarioId: usuario.id }, "Login aceito");
```

Na plataforma, pesquisem por `"evento":"login_recusado"` e por `"statusCode":5`: é o JSON que
torna isso possível.

### Passo 3 — Monitor externo, com alerta testado

Conta gratuita num monitor (UptimeRobot, BetterStack ou similar):

| Campo | Valor |
| --- | --- |
| URL | `https://<sua-api>/api/health` |
| Intervalo | 5 minutos |
| Alerta | o e-mail da equipe (e o de alguém da organização, na trilha opcional) |

**Testem o alerta:** suspendam o serviço no painel (ou ponham uma `DATABASE_URL` inválida
para provar o `503`). **Deu certo se** o e-mail de queda **chega**, e depois o de "voltou".

### Passo 4 — Backup manual e restauração

Com o `pg_dump` do contêiner (mesma versão, nada a instalar), contra a URL **externa**:

```bash
docker compose exec db pg_dump --dbname="<URL externa>" -Fc -f /tmp/backup.dump
docker compose cp db:/tmp/backup.dump ./backup.dump
```

> 🪟 Não usem `> backup.dump` no PowerShell 5.1: o `>` grava em UTF-16 e corrompe o arquivo.
> Gravar dentro do contêiner e copiar evita o problema.

Restaurem num banco **separado**:

```bash
docker compose exec db createdb -U app app_restaurado
docker compose cp ./backup.dump db:/tmp/backup.dump
docker compose exec db pg_restore -U app -d app_restaurado --no-owner /tmp/backup.dump
```

**Deu certo se** as contagens das tabelas principais batem com produção, a tabela
`migrations` está completa, e um `start:dev` apontado para o banco restaurado aceita login.

> O `backup.dump` contém os dados pessoais de todo mundo: **nunca** no Git nem em drive
> compartilhado sem controle de acesso. Apaguem a cópia local quando terminarem.

### Passo 5 — Dependabot

`.github/dependabot.yml`, na raiz:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    groups:
      dependencias:
        patterns: ["*"]
        update-types: ["minor", "patch"]
```

PR do Dependabot com CI verde pode entrar; vermelho, a atualização quebrou algo — e vocês
souberam antes da produção.

### Passo 6 — `docs/manutencao.md`

Escrito como se o sistema fosse ser entregue amanhã (na trilha opcional, **com a
organização**). É a base do termo de transferência da P4:

| Pergunta | Exemplo |
| --- | --- |
| Quem opera no dia a dia? | A secretária, pelo `/api/docs` |
| Quem corrige um erro, e até quando? | Fulano da equipe até dez/2026; depois, … |
| Como pedir ajuda, e em quanto tempo há resposta? | Canal e prazo combinados |
| Onde estão as credenciais? | O **lugar** (gerenciador, conta de quem), nunca o valor |
| Quanto custa por mês? Quem paga quando deixar de ser gratuito? | Combinado por escrito |
| Como fazer backup e restaurar? | O passo 4, com a data do último teste |
| Como continuar o desenvolvimento? | README, `docs/deploy.md`, repositório |

E um **runbook** para "a API está fora do ar": seis passos de diagnóstico, do mais provável
ao menos provável, cada um com o comando ou o lugar onde olhar. Comecem por:

1. O `/api/health` responde? Com que status?
2. O painel mostra o serviço no ar? O último deploy terminou?
3. …

**Deu certo se** alguém que nunca trabalhou no projeto descobre, só com esses documentos, por
que a API caiu e quem avisar.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `console.log` espalhado pelo código | Sem nível, contexto nem filtro; use o `Logger` |
| As primeiras linhas saem fora do formato | Faltou `bufferLogs: true` |
| `unable to determine transport target for "pino-pretty"` | `pino-pretty` não instalado, ou `NODE_ENV` não é `production` na plataforma |
| Cookie no log | Faltou o `redact` |
| Monitor diz "no ar" e a organização diz que não | O monitor aponta para uma rota que não toca no banco |
| `pg_restore: error: role "…" does not exist` | Faltou `--no-owner` |
| `pg_dump: error: server version mismatch` | Banco gerenciado de outra versão principal; use a imagem correspondente |

## 🤖 IA no fluxo

A IA reconstrói bem uma sequência a partir de um bloco de log em JSON — confiram antes que
nada escapou do `redact`. O que não dá para delegar é decidir **o que** registrar: só quem
conhece a organização sabe que "agendamento criado" importa e "listagem consultada" não.

## ✅ Marco do módulo

- [ ] Logs JSON em produção, com `[Redacted]` no cookie e eventos de negócio por identificador
- [ ] Monitor externo no `/api/health`, com o alerta **recebido** pela equipe
- [ ] Backup de produção restaurado num banco separado, com contagens conferidas e registradas
- [ ] Dependabot ativo
- [ ] `docs/manutencao.md` com plano, custos, lugar das credenciais e runbook

## 📚 Para aprofundar

- [NestJS — Logger](https://docs.nestjs.com/techniques/logger) · [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [PostgreSQL — pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) · [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html)
- [GitHub — Dependabot](https://docs.github.com/code-security/dependabot/dependabot-version-updates)
- [Google SRE Book — Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
