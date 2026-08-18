# M17 — Observabilidade e manutenção

> **CH:** 2h (1h teórica · 1h prática) · **Semana 17** · **Pré-requisito:** M16
> Módulo complementar. Responde à pergunta que a organização parceira **vai** fazer na
> Etapa 4: *"e depois que vocês entregarem, quem cuida disso?"*

## 🎯 Objetivos

1. Configurar logs úteis e estruturados.
2. Monitorar disponibilidade, erros e desempenho.
3. Garantir backup **e restauração testada**.
4. Escrever o plano de manutenção e transferência do sistema.

---

## 📖 Teoria (1h)

### 1. Logs (20 min)

Log existe para responder perguntas depois que o problema aconteceu. Um log que ninguém
consegue pesquisar não é log — é ruído.

```bash
pnpm --filter backend add nestjs-pino pino-http
pnpm --filter backend add -D pino-pretty
```

```ts
// backend/src/app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? "info",
    // legível no terminal em desenvolvimento; JSON puro em produção
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
    redact: ["req.headers.cookie", "req.headers.authorization", "req.body.senha"],
  },
}),
```

| Opção | O que faz |
|---|---|
| `level` por variável | Subir para `debug` em produção sem alterar código, durante um incidente |
| `transport: pino-pretty` só fora de produção | Colorido para você ler; JSON para a plataforma indexar |
| **`redact`** | Apaga campos sensíveis **antes** de escrever. Sem isto, o cookie de sessão de cada requisição vai para o log — e quem lê o log assume a sessão |

> ⚠️ `redact` é a linha mais importante do bloco. Log é lido por mais gente do que o banco:
> equipe de suporte, plataforma de agregação, e quem tiver acesso ao painel.

Para **stdout**, não arquivo (fator XI do 12-factor): a plataforma coleta, agrega e permite
buscar.

```ts
private readonly logger = new Logger(EmprestimosService.name);

this.logger.debug("detalhe de desenvolvimento");
this.logger.log({ emprestimoId: e.id, exemplarId: ex.id }, "emprestimo registrado");
this.logger.warn({ usuarioId, rota }, "tentativa de acesso negada");
this.logger.error({ isbn, err }, "falha ao consultar ISBN");
```

**Regras:** registre **objeto**, não string concatenada — assim a plataforma indexa cada
campo e você consegue filtrar por `emprestimoId`. Nunca registre senha,
token, cookie ou dado pessoal desnecessário; registre **identificadores**, não nomes;
inclua contexto suficiente para reconstruir o caso.

### 2. Monitoramento (20 min)

Quatro perguntas, quatro instrumentos:

| Pergunta | Instrumento |
|---|---|
| O site está no ar? | Monitor externo (UptimeRobot, BetterStack) batendo num healthcheck |
| Está dando erro? | Rastreador de exceções (Sentry, GlitchTip) |
| Está lento? | Métricas de tempo de resposta / APM |
| Alguém está atacando? | Log de segurança + alerta de picos de 4xx |
| **A SPA quebrou no navegador?** | **Rastreador de erros no cliente** |

> **A pergunta extra desta arquitetura.** Um erro de JavaScript não aparece em nenhum log
> do servidor: a API responde 200, e a tela fica branca. Sem um rastreador no cliente,
> você só descobre quando alguém reclama. Configure o Sentry **nas duas camadas** — e
> lembre de `send_default_pii=False` também no frontend, onde a URL pode carregar dados
> pessoais em parâmetros de busca.

Healthcheck:

```bash
pnpm --filter backend add @nestjs/terminus
```

```ts
@Controller("saude")
export class SaudeController {
  constructor(
    private saude: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  verificar() {
    return this.saude.check([() => this.db.pingCheck("banco", { timeout: 1500 })]);
  }
}
```

Um healthcheck que só devolve `200 OK` sem tocar no banco não detecta a falha mais comum
(banco indisponível) — que é justamente o que precisa ser detectado.

Sentry em 5 linhas:

```bash
pnpm --filter backend add @sentry/node
```

```ts
// backend/src/main.ts — antes de criar a aplicação
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,        // NÃO envie dados pessoais para fora
  });
}
```

`sendDefaultPii: false` não é detalhe: enviar dados pessoais para um serviço externo é
tratamento de dados sob a LGPD, com todas as obrigações que isso implica.

### 3. Backup (10 min)

```bash
# Linux / macOS / WSL / Git Bash
pg_dump "$DATABASE_URL" | gzip > backup-$(date +%F).sql.gz

# restauração (teste em ambiente SEPARADO)
gunzip -c backup-2026-08-11.sql.gz | psql "$DATABASE_URL_TESTE"
```

```powershell
# Windows PowerShell — o formato customizado (-Fc) ja e comprimido,
# o que evita depender de gzip/gunzip
$data = Get-Date -Format "yyyy-MM-dd"
pg_dump --dbname=$env:DATABASE_URL -Fc --file="backup-$data.dump"

# restauração (ambiente SEPARADO)
pg_restore --dbname=$env:DATABASE_URL_TESTE --clean "backup-2026-08-11.dump"
```

> 🪟 Se o `pg_dump` não estiver no PATH, ele fica em
> `C:\Program Files\PostgreSQL\16\bin`. Usando o PostgreSQL via Docker, o caminho mais
> simples é `docker compose exec db pg_dump ...`, idêntico nas três plataformas.

Regra 3-2-1: **3** cópias, em **2** mídias diferentes, com **1** fora do local.

> **Backup nunca restaurado não é backup.** Coloque a restauração no calendário
> trimestral, com registro do teste. É a diferença entre ter um plano e ter um arquivo.

### 4. Manutenção e transferência (10 min)

Um sistema entregue e abandonado deixa de funcionar em meses — dependência que quebra,
certificado que expira, disco que enche. Para um projeto extensionista, isso é
particularmente grave: a organização parceira fica com um sistema morto e uma frustração
concreta.

O plano de manutenção precisa responder:

| Pergunta | Registrado em |
|---|---|
| Quem opera o sistema no dia a dia? | Manual do usuário |
| Quem corrige um erro? | Plano de manutenção |
| Como pedir ajuda? | Canal e prazo acordados |
| Quem tem as credenciais? | Documento de transferência |
| Quanto custa manter no ar? | Documento de transferência |
| Quem paga? | Acordado com a organização |
| Como continuar o desenvolvimento? | Documentação técnica + repositório |

---

## 🛠️ Roteiro prático (1h)

### Passo 1 — Logs (15 min)

Configure o `LOGGING`, registre eventos relevantes (login, empréstimo, devolução, acesso
negado, erro de integração) e verifique que aparecem no painel de logs da plataforma.

Faça uma busca real: *"todos os acessos negados das últimas 24h"*. Se não conseguir, o log
está mal estruturado — ajuste.

### Passo 2 — Healthcheck e monitor (15 min)

1. Implemente `/healthz/` conforme a teoria.
2. Cadastre no UptimeRobot (gratuito) com verificação a cada 5 minutos e alerta por e-mail.
3. **Teste o alerta:** derrube a aplicação de propósito e confirme que o e-mail chega.

Monitor que nunca disparou é monitor não testado.

### Passo 3 — Sentry (15 min)

Configure, provoque um erro 500 de propósito e confirme que a exceção aparece com
traceback, URL e contexto — **sem** dados pessoais.

### Passo 4 — Backup e restauração (15 min)

1. Faça o backup do banco de produção.
2. Restaure num banco **local**.
3. Confirme a contagem de registros nas tabelas principais.
4. Documente o procedimento em `docs/manutencao.md`, com os comandos exatos.

---

## ⚠️ Erros comuns

| Erro | Consequência |
|---|---|
| `print()` em vez de `logging` | Sem nível, sem contexto, sem filtro |
| Log com dado pessoal ou senha | Incidente de segurança e violação da LGPD |
| Healthcheck que não checa o banco | Não detecta a falha mais provável |
| Backup sem teste de restauração | Descoberta ruim no pior momento |
| Sem monitor de disponibilidade | O usuário avisa antes de você saber |
| Sistema entregue sem plano de manutenção | Fora do ar em três meses |
| `send_default_pii=True` | Dados pessoais enviados a terceiro |

## ✅ Checklist de saída

- [ ] `LOGGING` configurado, saída para stdout
- [ ] Eventos relevantes sendo registrados, sem dados sensíveis
- [ ] `/healthz/` verificando o banco
- [ ] Monitor externo configurado **e alerta testado**
- [ ] Rastreador de erros funcionando, sem PII
- [ ] Backup automático ativo
- [ ] Restauração testada e documentada
- [ ] `docs/manutencao.md` escrito

## 🧪 Exercícios rápidos

1. Escreva 5 consultas que você faria nos logs para investigar "o empréstimo do usuário X
   sumiu". Seus logs respondem a todas?
2. Implemente um script `pnpm relatorio:saude` que verifique: banco acessível,
   migrações aplicadas, espaço em disco, tamanho do banco, e nº de erros nas últimas 24h.
3. Calcule o custo mensal real de manter o sistema no ar por 3 anos (hospedagem, domínio,
   backup, horas de manutenção). Apresente à organização parceira.
4. Escreva o runbook de "o site está fora do ar": 6 passos de diagnóstico, em ordem, do
   mais provável ao menos provável.

## 📚 Para aprofundar

- [NestJS — Logger](https://docs.nestjs.com/techniques/logger)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [NestJS — Healthchecks (Terminus)](https://docs.nestjs.com/recipes/terminus)
- [Sentry para Node](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Google SRE Book — capítulo de monitoramento](https://sre.google/sre-book/monitoring-distributed-systems/)
- [12-Factor — Logs](https://12factor.net/pt_br/logs)
