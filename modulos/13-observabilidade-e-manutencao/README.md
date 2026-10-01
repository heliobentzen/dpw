# M13 — Observabilidade e manutenção

> **Pré-requisito:** M12 · **Duração:** curta
> Responde à pergunta que a organização parceira **vai** fazer no encerramento do projeto:
> *"e depois que vocês entregarem, quem cuida disso?"*

O deploy coloca o sistema no mundo; a observabilidade permite saber o que acontece com ele
depois. Este módulo fecha a trilha com uma ideia simples: **entregar não é abandonar**.

> **A teoria não está num bloco separado.** Ela está nas etapas 1, 6 e 9 — em que a gente
> para de digitar e pensa — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Produzir logs estruturados, pesquisáveis e sem dados sensíveis.
2. Registrar eventos de negócio que permitam reconstruir o que aconteceu.
3. Monitorar a disponibilidade da API com um alerta testado.
4. Fazer backup do banco **e provar que ele restaura**.
5. Escrever o plano de manutenção e transferência do sistema.

---

## 🧭 Por que este módulo encerra a trilha

No começo da disciplina, o foco era fazer algo funcionar. No fim, o foco é tornar o
funcionamento **observável, recuperável e sustentável** — inclusive por quem não o
escreveu.

Pense no **painel de um carro**. Você não abre o capô a cada quilômetro: o painel mostra a
velocidade, acende a luz do óleo e apita quando a porta está aberta. E, quando algo dá
errado, a oficina lê a memória da central eletrônica para saber o que aconteceu. Um sistema
em produção precisa do mesmo: indicadores contínuos, alertas e um registro que conte a
história depois do fato.

| Pergunta | Instrumento | Etapa |
|---|---|---|
| O que aconteceu, e quando? | Logs estruturados | 2 a 5 |
| Está no ar agora? | Monitor externo no `/api/health` | 6 |
| Os dados sobrevivem a um desastre? | Backup e restauração testada | 7 e 8 |
| Quem cuida, e como? | Plano de manutenção | 9 e 10 |

> A evidência final de aprendizagem não é um log bonito: é um **procedimento** que outra
> pessoa consegue executar para identificar um problema, recuperar o serviço e saber quem
> cuida da manutenção.

## 📋 Como este módulo funciona

Mesmo formato dos anteriores.

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

### As dez etapas

| # | Etapa | Duração | O que entra |
|---|---|---|---|
| 1 | [**Log é para depois**](#etapa-1--log-é-para-depois) | curta | **o que um log precisa responder** |
| 2 | [Logs estruturados](#etapa-2--logs-estruturados) | média | `nestjs-pino`, JSON |
| 3 | [O que não vai para o log](#etapa-3--o-que-não-vai-para-o-log) | curta | `redact` |
| 4 | [Eventos de negócio](#etapa-4--eventos-de-negócio) | curta | `Logger` com contexto |
| 5 | [Pesquisar o log](#etapa-5--pesquisar-o-log) | curta | filtrar por campo |
| 6 | [**Alguém de fora olhando**](#etapa-6--alguém-de-fora-olhando) | média | **monitor e alerta testado** |
| 7 | [Backup](#etapa-7--backup) | curta | `pg_dump` |
| 8 | [A restauração que prova o backup](#etapa-8--a-restauração-que-prova-o-backup) | média | `pg_restore` |
| 9 | [**Dependências envelhecem**](#etapa-9--dependências-envelhecem) | curta | **Dependabot** |
| 10 | [O plano de manutenção](#etapa-10--o-plano-de-manutenção) | média | `docs/manutencao.md`, *runbook* |

---

## Etapa 1 — Log é para depois

Log existe para responder perguntas **depois** que o problema aconteceu, quando ninguém mais
lembra de nada. Imagine a mensagem da organização parceira: *"o empréstimo da Dona Ana sumiu
ontem à tarde"*. Para responder, o log precisa permitir:

| Pergunta | O que o log precisa ter |
|---|---|
| Que requisições chegaram ontem à tarde? | Data e hora em cada linha |
| Alguma delas foi sobre aquele empréstimo? | O **identificador** do empréstimo, num campo próprio |
| Quem fez? | O `usuarioId` de quem estava logado |
| Deu erro? | O status da resposta, e o erro completo quando houver |
| Quanto demorou? | O tempo de resposta |

O log padrão do Nest é feito para **ler** no terminal. Para **pesquisar** entre milhares de
linhas, ele precisa ser **estruturado**: cada linha um objeto JSON, cada informação num
campo com nome. É a diferença entre um caderno de anotações e uma planilha.

---

## Etapa 2 — Logs estruturados

**Faça:**

```powershell
npm install nestjs-pino pino-http
```

```powershell
npm install -D pino-pretty
```

| Pacote | Para quê |
|---|---|
| `nestjs-pino` | Liga o **Pino**, um logger rápido que escreve JSON, ao sistema de logs do Nest |
| `pino-http` | Registra automaticamente cada requisição: método, URL, status, tempo |
| `pino-pretty` | Só em desenvolvimento: transforma o JSON em texto colorido, para você ler |

**Faça:** em `src\app.module.ts`:

```ts
import { LoggerModule } from "nestjs-pino";

  imports: [
    // …
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
        redact: ["req.headers.cookie", 'res.headers["set-cookie"]'],
      },
    }),
  ],
```

**Faça:** em `src\main.ts`, entregue ao Nest o logger novo:

```ts
import { Logger } from "nestjs-pino";

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `level` por variável | `info` no dia a dia. Durante um incidente, `LOG_LEVEL=debug` no painel mostra mais — sem mudar código |
| `transport: pino-pretty` fora de produção | Colorido para você ler; JSON cru em produção, para a plataforma indexar |
| `redact` | A etapa 3 inteira |
| `bufferLogs: true` | Guarda os logs da inicialização até o Pino estar pronto. Sem isso, as primeiras linhas saem no formato antigo |
| `app.useLogger(…)` | Todo `Logger` do Nest — o seu e o dele — passa a escrever pelo Pino |

> Logue sempre no **terminal** (*stdout*), nunca em arquivo: é o fator "logs como fluxo" do
> M12. A plataforma coleta, guarda e oferece busca.

**Rode** `npm run start:dev` e faça uma requisição qualquer.

**Deu certo se:** cada requisição gera uma linha colorida `request completed`, com método,
URL, status e `responseTime` em milissegundos.

---

## Etapa 3 — O que não vai para o log

Log é lido por muito mais gente que o banco: quem dá suporte, a plataforma de hospedagem,
qualquer pessoa com acesso ao painel. E fica guardado por meses.

**Rode** — veja o que um log em produção conteria. Suba em modo produção, gravando a saída
num arquivo:

```powershell
$env:NODE_ENV="production"
```

```powershell
npm run build
```

```powershell
$api = Start-Process node -ArgumentList "dist/main.js" -RedirectStandardOutput log.json -NoNewWindow -PassThru
```

| Trecho | O que faz |
|---|---|
| `Start-Process node …` | Sobe a API como um processo à parte, devolvendo o terminal |
| `-RedirectStandardOutput log.json` | Tudo que a API escrever vai direto para o arquivo, sem conversão de codificação |
| `-PassThru` e `$api =` | Guarda o processo numa variável, para encerrar **só ele** depois |

No mesmo terminal, faça login com `curl.exe -c cookies.txt` (com o cabeçalho
`X-Forwarded-Proto: https` do M12) e depois um `GET /api/sessao` com `-b cookies.txt`. Então
encerre a API e abra o `log.json`:

```powershell
Stop-Process -Id $api.Id
```

> No macOS e no Linux: `node dist/main.js > log.json &` e, para encerrar, `kill %1`.

**Deu certo se:** nas linhas `request completed`, o cabeçalho `cookie` da requisição e o
`set-cookie` da resposta aparecem como `"[Redacted]"`.

Sem o `redact`, o cookie de sessão de cada requisição estaria no log — e **quem lê o log
assume a sessão** da coordenação. Remova `Env:\NODE_ENV` ao terminar.

| Nunca no log | Por quê |
|---|---|
| Senha, hash, cookie, token | Credencial em texto, lida por gente que não deveria ter acesso |
| CPF, endereço, telefone | Dado pessoal: tratamento sob a LGPD, com prazo e finalidade |
| Corpo inteiro das requisições | Ele **contém** os itens acima. O `pino-http` não o registra por padrão — não ligue |

> ⚠️ E o log de SQL do TypeORM? O M09 (etapa 11) já o restringiu a erros em produção, pelo
> mesmo motivo.

---

## Etapa 4 — Eventos de negócio

O `pino-http` registra **requisições**. Mas "login aceito", "empréstimo registrado" e
"acesso negado" são **eventos de negócio** — e é por eles que se reconstrói uma história.

**Faça:** no `AuthService` (M08), um logger com o nome da classe:

```ts
import { Logger } from "@nestjs/common";

export class AuthService {
  private readonly logger = new Logger(AuthService.name);
```

E dentro do `validar`, nos dois desfechos:

```ts
    if (!usuario || !senhaConfere) {
      this.logger.warn({ evento: "login_recusado" }, "Login recusado");
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }
    this.logger.log({ evento: "login", usuarioId: usuario.id }, "Login aceito");
    return usuario;
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `new Logger(AuthService.name)` | O campo `context` de cada linha diz de onde ela veio |
| `{ evento: …, usuarioId: … }` | Um **objeto** primeiro, a mensagem depois. Cada chave vira um campo pesquisável |
| `warn` para o recusado | Nível mais alto que `log`: um alerta pode ser ligado a ele (muitos `warn` em pouco tempo = alguém tentando senhas) |
| Sem o e-mail no recusado | E-mail é dado pessoal, e no login recusado ele pode ser de qualquer pessoa — inclusive de quem nem é usuária |

**Faça:** o mesmo no `EmprestimosService` (M10). O final do `emprestar` passa a guardar o
resultado da transação antes de devolvê-lo:

```ts
    const emprestimo = await this.dataSource.transaction(async (manager) => {
      // …igual ao M10
    });
    this.logger.log(
      { evento: "emprestimo", emprestimoId: emprestimo.id, exemplarId, associadoId },
      "Empréstimo registrado",
    );
    return emprestimo;
```

O log vem **depois** da transação de propósito: só se registra o que de fato foi gravado.

> **Regra:** registre **identificadores**, não nomes. `associadoId: 7` responde "quem?" para
> quem tem acesso ao banco; "Ana Souza" no log responde para qualquer um.

---

## Etapa 5 — Pesquisar o log

**Rode** — repita o ensaio da etapa 3, agora com um login certo e um errado, encerre a API
e procure:

```powershell
Select-String -Path log.json -Pattern '"evento":"login_recusado"'
```

```powershell
Select-String -Path log.json -Pattern '"statusCode":5'
```

| Busca | Pergunta que responde |
|---|---|
| `"evento":"login_recusado"` | Quantas tentativas recusadas, e quando? |
| `"statusCode":5` | Houve erro de servidor? |
| `"usuarioId":1` | O que a usuária 1 fez? |

**Deu certo se:** cada busca acha exatamente as linhas esperadas. Na plataforma, a mesma
busca se faz pelo campo de pesquisa do painel de logs — e é o JSON que torna isso possível.

> Apague o `log.json` e o `cookies.txt` ao terminar. O arquivo de log é, ele próprio, um dado
> a proteger.

---

## Etapa 6 — Alguém de fora olhando

O log conta o que aconteceu **dentro**. Mas se a API inteira cair, não há quem escreva log.
É preciso alguém **de fora**, perguntando de tempos em tempos: *"você está aí?"*

O `/api/health` do M12 já responde essa pergunta — inclusive dizendo `503` quando o banco
está fora. Falta quem pergunte.

**Faça:** crie uma conta num monitor externo gratuito (UptimeRobot, BetterStack e similares)
e cadastre:

| Campo | Valor |
|---|---|
| Tipo | HTTP(S) |
| URL | `https://SUA-API/api/health` |
| Intervalo | 5 minutos |
| Alerta | o e-mail da equipe **e** o de alguém da organização parceira |

**Faça — a parte que quase ninguém faz:** **teste o alerta.** No painel da plataforma,
suspenda o serviço da API (ou troque a `DATABASE_URL` por uma inválida, para provar o `503`).

**Deu certo se:** o e-mail de alerta **chega**. Depois, reative o serviço e confira que chega
também o aviso de "voltou".

> **Monitor que nunca disparou é monitor não testado.** Pode estar apontando para a URL
> errada, mandando e-mail para uma caixa que ninguém lê, ou caindo no spam. A hora de
> descobrir não é durante a queda de verdade.

> Em plataformas cujo plano gratuito "adormece" o serviço sem uso, o próprio monitor o
> mantém acordado — um efeito colateral útil, mas confira se isso respeita os termos da
> plataforma.

---

## Etapa 7 — Backup

Toda plataforma de banco gerenciado oferece backup automático (você o ligou no M12). Ainda
assim, a equipe precisa saber fazer um **à mão** — antes de uma migração arriscada, ou para
entregar uma cópia à organização parceira.

**Faça** — use o `pg_dump` que já vem no contêiner do Docker, apontando para o banco de
produção pela URL **externa**:

```powershell
docker compose exec db pg_dump --dbname="<URL externa>" -Fc -f /tmp/backup.dump
```

```powershell
docker compose cp db:/tmp/backup.dump ./backup.dump
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `docker compose exec db pg_dump` | Usa o `pg_dump` **de dentro** do contêiner: mesma versão do banco, nada a instalar no Windows |
| `--dbname="<URL externa>"` | O contêiner sai pela internet até o banco de produção |
| `-Fc` | Formato próprio do PostgreSQL: comprimido e restaurável tabela a tabela |
| `-f /tmp/backup.dump` | Grava **dentro** do contêiner |
| `docker compose cp` | Copia o arquivo do contêiner para a sua pasta |

> ⚠️ **Não** use `> backup.dump` no PowerShell 5.1 para gravar a saída: o `>` converte para
> UTF-16 e corrompe arquivos binários (veja o [guia do Windows](../../recursos/comandos-windows.md)).
> Gravar dentro do contêiner e copiar evita o problema.

**Deu certo se:** o arquivo `backup.dump` existe e tem alguns kilobytes — não zero.

> O arquivo contém os dados pessoais de todo mundo. Ele **não** vai para o Git, nem para um
> drive compartilhado sem controle de acesso. Regra 3-2-1: **3** cópias, em **2** mídias
> diferentes, com **1** fora do local.

---

## Etapa 8 — A restauração que prova o backup

**Backup nunca restaurado não é backup.** É um arquivo com um nome promissor.

**Faça** — restaure num banco **separado**, na sua máquina:

```powershell
docker compose exec db createdb -U bibliocom bibliocom_restaurado
```

```powershell
docker compose cp ./backup.dump db:/tmp/backup.dump
```

```powershell
docker compose exec db pg_restore -U bibliocom -d bibliocom_restaurado --no-owner /tmp/backup.dump
```

| Trecho | O que faz |
|---|---|
| Banco **separado** | Restaurar por cima do banco em uso apagaria o que mudou desde o backup |
| `--no-owner` | O dono das tabelas em produção é outro usuário, que não existe aqui. Sem isto, a restauração para com erro de permissão |

**Rode** — compare as contagens nos dois bancos:

```powershell
docker compose exec db psql -U bibliocom -d bibliocom_restaurado -c "SELECT (SELECT count(*) FROM obra) AS obras, (SELECT count(*) FROM usuario) AS usuarios, (SELECT count(*) FROM migrations) AS migracoes;"
```

**Deu certo se:** as contagens batem com as de produção (consulte-as pela URL externa) e a
tabela `migrations` tem todas as migrações. Aponte um `start:dev` para o banco restaurado e
faça login: o sistema funciona a partir da cópia.

**Faça:** registre no `docs\manutencao.md`: data do teste, tamanho do arquivo, contagens
conferidas, tempo total. E ponha a próxima restauração **no calendário** — a cada três meses.

---

## Etapa 9 — Dependências envelhecem

Um sistema parado não fica estável: ele **apodrece**. As bibliotecas recebem correções de
segurança, a plataforma muda a versão do Node, um certificado expira. Software sem manutenção
para de funcionar em meses, mesmo sem ninguém mexer nele.

**Faça:** peça ao GitHub para avisar. Crie `.github\dependabot.yml`, na raiz:

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

| Trecho | O que faz |
|---|---|
| `package-ecosystem: npm` | Vigia o `package-lock.json` |
| `directory: "/"` | A raiz do *workspace*, onde o lock está |
| `interval: weekly` | Uma rodada por semana |
| `groups` com `minor` e `patch` | Junta as atualizações pequenas num **único** *pull request*. As grandes (*major*) vêm separadas, porque podem quebrar |

**Deu certo se:** depois do push, a aba **Insights → Dependency graph → Dependabot** do
repositório mostra o arquivo reconhecido. Os *pull requests* começam a chegar.

E aqui o M10 paga a conta: cada *pull request* do Dependabot passa pelo CI. **Verde, pode
fazer *merge*. Vermelho, a atualização quebrou algo** — e você soube antes de produção.

---

## Etapa 10 — O plano de manutenção

Um projeto extensionista entregue sem plano deixa a organização parceira com um sistema que
vai morrer, e uma frustração concreta. O plano é a parte da entrega que garante o "depois".

**Faça:** escreva `docs\manutencao.md` respondendo:

| Pergunta | Exemplo de resposta |
|---|---|
| Quem opera o sistema no dia a dia? | A bibliotecária da organização, pelo Swagger ou pelo cliente que existir |
| Quem corrige um erro? | Uma pessoa da equipe, até a data X; depois, … |
| Como pedir ajuda, e em quanto tempo há resposta? | Canal e prazo acordados com a organização |
| Onde estão as credenciais? | O **lugar** (gerenciador de senhas, conta de quem), nunca o valor |
| Quanto custa manter no ar, por mês? | Hospedagem, banco, domínio — mesmo que hoje seja zero |
| Quem paga quando deixar de ser gratuito? | Acordado por escrito |
| Como fazer backup e restaurar? | O procedimento das etapas 7 e 8, com a data do último teste |
| Como continuar o desenvolvimento? | O README, o `docs/deploy.md` e o repositório |

**Faça:** e um *runbook* — um roteiro para a hora do susto — para **"a API está fora do
ar"**: seis passos de diagnóstico, do mais provável ao menos provável, cada um com o
comando ou o lugar onde olhar. Comece por:

1. O `/api/health` responde? Com que status?
2. O painel da plataforma mostra o serviço no ar? O último deploy terminou?
3. …

**Deu certo se:** alguém que nunca trabalhou no projeto consegue, só com esses dois
documentos, descobrir por que a API caiu e quem avisar.

---

## 🤖 IA no fluxo

Um assistente de IA lê bem um bloco de log em JSON: cole as linhas ao redor de um erro e
pergunte o que aconteceu — ele reconstrói a sequência rápido. Antes de colar, confira que
não há nada que o `redact` deveria ter pegado e não pegou.

O que não dá para delegar: decidir **o que** registrar. Só quem conhece o negócio sabe que
"empréstimo registrado" importa e "listagem consultada" não, e que o `associadoId` vai no log
mas o nome não.

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `console.log` espalhado pelo código | Sem nível, sem contexto, sem filtro. Use o `Logger` do Nest |
| As primeiras linhas do log saem fora do formato | Faltou o `bufferLogs: true` — etapa 2 |
| `unable to determine transport target for "pino-pretty"` | O `pino-pretty` não está instalado, ou foi instalado só como dependência de produção numa plataforma que não instala as de desenvolvimento. Confira se o `transport` só é usado fora de produção |
| Cookie aparecendo no log | Faltou o `redact` — etapa 3 |
| O monitor diz que está tudo no ar, e os usuários dizem que não | O monitor aponta para uma rota que não toca no banco. Use o `/api/health` |
| `pg_restore: error: role "…" does not exist` | Faltou o `--no-owner` — etapa 8 |
| `pg_dump: error: server version mismatch` | O banco gerenciado é de outra versão principal. Use a imagem do Docker com a mesma versão |
| Backup corrompido no Windows | Foi gravado com `>` no PowerShell 5.1 — etapa 7 |

## 💣 Pegadinha de mercado

**Configurar o backup e nunca restaurar.** É a história mais repetida da operação de
sistemas: o backup rodou todo dia por um ano, e no dia em que foi preciso, o arquivo estava
vazio, ou de outro banco, ou exigia uma senha que ninguém lembrava. O backup só existe no
dia em que a restauração funcionou — por isso a etapa 8 vale mais que a 7.

## ✅ Checklist de saída

- [ ] Logs em JSON em produção, legíveis em desenvolvimento
- [ ] Cookie e `set-cookie` aparecem como `[Redacted]`
- [ ] Login e empréstimo registrados como eventos, com identificadores e sem dados pessoais
- [ ] Você encontrou um evento pesquisando por campo
- [ ] Monitor externo no `/api/health`, com **alerta testado**
- [ ] Backup feito e **restaurado** num banco separado, com contagens conferidas
- [ ] Dependabot configurado, com o CI como rede de proteção
- [ ] `docs/manutencao.md` com plano, custos, credenciais (o lugar) e *runbook*

## 📦 Entrega do módulo

O `docs/manutencao.md` completo, a evidência do alerta testado (o e-mail recebido) e o
registro da restauração do backup.

## 🧩 Desafio de fixação

Daqui a um ano, a organização parceira escreve: *"desde segunda, ninguém consegue fazer
empréstimo"*. A equipe original se formou. Liste, em ordem, o que a pessoa que herdou o
sistema deveria olhar — e, para cada item, diga se o seu projeto de hoje deixa isso
possível. O que falta?

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Logger](https://docs.nestjs.com/techniques/logger)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [PostgreSQL — pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) e [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html)
- [GitHub — Dependabot version updates](https://docs.github.com/code-security/dependabot/dependabot-version-updates)
- [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [12-Factor — Logs (pt-br)](https://12factor.net/pt_br/logs)
