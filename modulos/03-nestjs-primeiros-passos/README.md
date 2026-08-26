# M03 — NestJS: módulos, controllers e providers

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 3** · **Pré-requisitos:** M01, M02

Primeiro código do backend. Ao final deste módulo existe uma API que responde, com a
estrutura que os módulos seguintes vão preencher.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que **injeção de dependência** resolve, e por que um framework a impõe.
2. Distinguir **módulo**, **controller** e **provider**, e dizer o que cada um não deve fazer.
3. Criar um endpoint que responde JSON, com rota e método HTTP corretos.
4. Ler configuração por variável de ambiente e **falhar na inicialização** quando faltar.
5. Publicar o contrato da API em OpenAPI, gerado a partir do código.

---

## 📖 Teoria (2h)

### 1. Por que um framework opinativo

Node não impõe estrutura. Um projeto Express começa assim:

```ts
app.get("/obras", (req, res) => { /* consulta o banco, valida, responde */ });
```

Funciona. Na semana 12, com 40 rotas, isso vira um arquivo de 800 linhas onde ninguém acha
nada, nada é testável isoladamente e cada pessoa da equipe organizou do seu jeito.

O NestJS impõe uma estrutura em três peças. **A imposição é o produto:** é o que permite
quatro pessoas mexerem no mesmo backend sem colidir.

| Peça | Responsabilidade | O que **não** deve fazer |
|---|---|---|
| **Module** | Agrupar o que pertence a um domínio e declarar o que ele expõe | Conter lógica |
| **Controller** | Traduzir HTTP ↔ chamada de método. Ler rota, corpo e query; devolver dados | Falar com o banco, conter regra de negócio |
| **Provider** (Service) | A regra de negócio e o acesso a dados | Saber que HTTP existe |

A pergunta que resolve 90% das dúvidas de "onde ponho este código?":

> Se este código precisasse rodar a partir de um comando de terminal, em vez de uma
> requisição HTTP, ele mudaria? **Se não muda, é Service. Se muda, é Controller.**

### 2. Injeção de dependência, sem misticismo

O `ObrasController` precisa do `ObrasService`. A forma ingênua:

```ts
class ObrasController {
  private serv = new ObrasService();   // ❌
}
```

O problema não é estético: o controller ficou **soldado** a essa implementação. Num teste,
não há como trocar o service por um dublê — a linha `new` está dentro dele. E se o service
passar a precisar de uma conexão de banco, o controller tem de saber montá-la também.

A forma do Nest — a dependência **chega pronta**, pelo construtor:

```ts
@Controller("obras")
export class ObrasController {
  constructor(private readonly obras: ObrasService) {}
}
```

Ninguém escreve `new ObrasService()`. O Nest lê o tipo do parâmetro, procura quem foi
declarado como provider naquele módulo, cria uma instância e entrega pronta. Isso é
**injeção de dependência**: a classe declara *o que precisa*, não *como conseguir*.

Três consequências práticas:

1. **Testar fica trivial** — o teste passa um dublê no lugar do service (M14).
2. **Uma instância só** (*singleton*), reaproveitada em toda a aplicação.
3. **Trocar a implementação não toca o consumidor** — útil quando o `EmailService` de
   desenvolvimento vira o de produção.

> O `private readonly` no construtor é atalho do TypeScript: **declara e
> atribui** a propriedade numa linha só. Sem ele, seria `this.obras = obras`.

### 3. Decorators

`@Controller`, `@Get`, `@Injectable` são **decorators**: funções que anexam metadados a uma
classe ou método. O Nest lê esses metadados na inicialização e monta o roteamento e o
grafo de dependências.

```ts
@Get(":id")            // anexa: método GET, caminho "obras/:id"
buscarUm(@Param("id") id: string) { … }
```

Não há mágica nenhuma: há um registro sendo lido na inicialização. É o mesmo mecanismo que
o TypeORM usa em `@Entity()` (M04) e o `class-validator` em `@IsString()` (M07). Um
conceito, três usos.

### 4. O ciclo de uma requisição

```
GET /obras/42
    │
    ▼
[ Middleware ]      logging, helmet                        (M13)
    │
    ▼
[ Guard ]           "pode entrar?" — autenticação/papel    (M12)
    │
    ▼
[ Pipe ]            valida e transforma o DTO              (M07)
    │
    ▼
[ Controller ]      obras.buscarUm(42)
    │
    ▼
[ Service ]         regra de negócio
    │
    ▼
[ Repository ]      SELECT ... WHERE id = 42               (M06)
    │
    ▼
[ Interceptor ]     molda a resposta                       (M07)
    │
    ▼
JSON
```

Guarde este diagrama. Cada módulo daqui em diante preenche uma das caixas, e o M13 volta a
ele para mostrar em que camada cada ataque é barrado.

💼 **No mercado:** "explique injeção de dependência" e "onde você colocaria esta regra" são
perguntas de entrevista para vaga júnior de Node. Quem responde com o critério da seção 1 se
destaca de quem responde "no service, porque sim".

---

## 🛠️ Roteiro prático (2h)

> 📦 **Antes desta aula**, instale o Node 20 e o pnpm.
> 🐧 [`ambiente-setup.md`, seção 4](../../docs/ambiente-setup.md#4-nodejs-e-pnpm) ·
> 🪟 [`ambiente-setup-windows.md`, passo 4](../../docs/ambiente-setup-windows.md#passo-4--nodejs-e-pnpm)

### Passo 1 — Conferir o monorepo (5 min)

O `package.json` e o `pnpm-workspace.yaml` foram criados no M00. Confira que estão lá:

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
cat pnpm-workspace.yaml
```

Deve listar `backend`, `frontend` e `pacotes/*`. As pastas ainda não existem — `backend/`
nasce no próximo passo, `frontend/` no M08 e `pacotes/tipos/` no M15.

### Passo 2 — Criar o projeto e ler o que veio (25 min)

#### 2a. Rodar a CLI

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
pnpm dlx @nestjs/cli new backend --package-manager pnpm --skip-git
```

| Trecho | O que faz |
|---|---|
| `pnpm dlx @nestjs/cli` | Executa a CLI **sem instalá-la** globalmente. É o `npx` do pnpm |
| `new backend` | Gera o projeto na pasta `backend/` |
| `--package-manager pnpm` | Responde de antemão a pergunta que a CLI faria |
| `--skip-git` | **Importante.** Sem isto a CLI cria um segundo repositório dentro do seu, e você passa meia hora sem entender por que o `git status` ignora tudo em `backend/` |

A CLI imprime a lista de arquivos que criou e instala as dependências. Leva um ou dois
minutos na primeira vez.

**Deu certo se:** existe a pasta `backend/` com `src/` dentro, e **não** existe
`backend/.git`.

#### 2b. Subir o servidor

```bash
cd backend
pnpm start:dev
```

O `pnpm start:dev` fica **ocupando o terminal** e recarrega a cada arquivo salvo. Deixe-o
rodando numa janela e use outra para os comandos seguintes.

**Deu certo se:** o terminal termina com uma linha parecida com

```
[Nest] LOG [NestApplication] Nest application successfully started
```

e <http://localhost:3000> responde `Hello World!` no navegador.

#### 2c. Abrir os quatro arquivos gerados

Antes de escrever qualquer linha, **leia o que já existe**. São quatro arquivos pequenos, e
o `Hello World!` que você acabou de ver sai deles.

> Em `src/` você vai contar cinco: o quinto é o `app.controller.spec.ts`, um teste que a CLI
> deixa de brinde. Ignore-o por enquanto — ele é assunto do M14.

`src/main.ts` — o ponto de entrada:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`NestFactory.create(AppModule)` monta a aplicação inteira a partir de **um** módulo. Todo o
resto pendura nele.

`src/app.module.ts` — o módulo raiz:

```ts
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Três listas, e é isso que um módulo é:

| Lista | Para quê |
|---|---|
| `imports` | Outros módulos que este usa |
| `controllers` | Quem responde a requisições HTTP |
| `providers` | Quem pode ser **injetado** (os services) |

`src/app.controller.ts` — de onde vem o `Hello World!`:

```ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

Repare: o controller **não** produz o texto. Ele pede ao service. E não usa `new` em lugar
nenhum — o `AppService` chega pronto pelo construtor, porque está em `providers` do módulo.
É a injeção de dependência da teoria, já rodando na sua máquina.

`src/app.service.ts`:

```ts
@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }
}
```

#### 2d. Fazer a menor mudança possível

Troque o texto do `AppService`:

```ts
return "BiblioCom no ar";
```

Salve e olhe o terminal do `start:dev`: ele recompila sozinho. Atualize o navegador.

**Deu certo se:** a página mostra o texto novo sem você ter reiniciado nada.

Isso fecha o ciclo básico — editar, salvar, ver o resultado — antes de acrescentar
conceito novo. Se este passo falhar, pare aqui: nada dos próximos vai funcionar.

### Passo 3 — Um módulo de domínio, por partes (45 min)

Cinco etapas curtas. **Teste ao final de cada uma.** Se algo quebrar, você sabe exatamente
qual linha foi.

#### 3a. Gerar os arquivos e ler o que a CLI escreveu

```bash
pnpm dlx @nestjs/cli generate module acervo
pnpm dlx @nestjs/cli generate controller acervo --no-spec
pnpm dlx @nestjs/cli generate service acervo --no-spec
```

> `--no-spec` pula o arquivo de teste. Eles entram no M14, com o conteúdo que os justifica.

Abra `src/acervo/acervo.module.ts`:

```ts
@Module({
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

**Este arquivo é a peça que faz tudo funcionar.** A CLI registrou o controller e o service
aqui, e registrou o `AcervoModule` no `imports` do `app.module.ts`. Confira lá também.

Esse registro é justamente o que se esquece ao criar arquivos à mão. E o erro que aparece
quando falta (`Nest can't resolve dependencies`) não menciona registro nenhum.

Os outros dois vieram praticamente vazios:

```ts
// acervo.controller.ts
@Controller("acervo")
export class AcervoController {}

// acervo.service.ts
@Injectable()
export class AcervoService {}
```

⚠️ Repare no `@Controller("acervo")`: a CLI usou o **nome que você passou** como prefixo de
rota. Nós queremos `/obras`. Troque agora:

```ts
@Controller("obras")
```

#### 3b. O primeiro endpoint, sem service

Comece pelo mais simples possível. No `acervo.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";

@Controller("obras")
export class AcervoController {
  @Get()
  listar() {
    return [{ id: 1, titulo: "Dom Casmurro" }];
  }
}
```

```bash
curl -i http://localhost:3000/obras       # 🪟 Windows: curl.exe -i ...
```

**Deu certo se:** responde `200` com o array em JSON. Você não escreveu `res.json()` nem
`status(200)`: devolveu um objeto e o Nest cuidou do resto.

> Este endpoint está **errado de propósito** — os dados estão no controller. Vamos consertar
> na próxima etapa, e é aí que a injeção de dependência ganha utilidade concreta.

#### 3c. Mover os dados para o service e injetar

Primeiro o service, em `acervo.service.ts`:

```ts
import { Injectable } from "@nestjs/common";

export type Obra = { id: number; titulo: string; ano: number };

@Injectable()
export class AcervoService {
  // Dados em memória até o M04, quando o banco entra.
  private obras: Obra[] = [
    { id: 1, titulo: "Dom Casmurro", ano: 1899 },
    { id: 2, titulo: "Grande Sertão: Veredas", ano: 1956 },
  ];

  listar(): Obra[] {
    return this.obras;
  }
}
```

Agora o controller pede o service **pelo construtor**:

```ts
import { Controller, Get } from "@nestjs/common";
import { AcervoService } from "./acervo.service";

@Controller("obras")
export class AcervoController {
  constructor(private readonly acervo: AcervoService) {}

  @Get()
  listar() {
    return this.acervo.listar();
  }
}
```

| Trecho | O que faz |
|---|---|
| `@Injectable()` | Marca a classe como provider. Sem isto, o Nest não sabe criá-la |
| `constructor(private readonly acervo: AcervoService)` | Recebe o service pronto. **Não há `new` em lugar nenhum** |
| `private readonly` | Atalho do TypeScript: declara a propriedade e atribui numa linha só |

```bash
curl -i http://localhost:3000/obras
```

**Deu certo se:** responde as duas obras. O comportamento é o mesmo de 3b, mas agora os
dados estão onde deveriam.

**Prove que a injeção é real:** comente a linha `AcervoService` de `providers` no
`acervo.module.ts` e salve. O servidor derruba com:

```
Nest can't resolve dependencies of the AcervoController (?).
Please make sure that the argument AcervoService at index [0] is available
in the AcervoModule module.
```

O `?` marca a posição do parâmetro que ele não conseguiu resolver — aqui o primeiro, e a
segunda linha diz qual é. Guarde este erro: ele é o mais comum do módulo, e a causa é quase
sempre a mesma (esqueceu de registrar em `providers`). Descomente e siga.

#### 3d. Rota com parâmetro

No service:

```ts
buscarUm(id: number): Obra | undefined {
  return this.obras.find((o) => o.id === id);
}
```

No controller:

```ts
@Get(":id")
buscarUm(@Param("id", ParseIntPipe) id: number) {
  return this.acervo.buscarUm(id);
}
```

Acrescente `Param` e `ParseIntPipe` ao `import` de `@nestjs/common`.

| Trecho | O que faz |
|---|---|
| `@Get(":id")` | Casa com `/obras/1`, `/obras/42`… |
| `@Param("id")` | Extrai o pedaço da URL |
| `ParseIntPipe` | Converte para número **antes** de chegar ao seu método |

```bash
curl -i http://localhost:3000/obras/1
curl -i http://localhost:3000/obras/abc
```

**Deu certo se:** a primeira devolve o objeto; a segunda responde **400**, com uma mensagem
sobre validação. Esse 400 veio do `ParseIntPipe`, sem você escrever nada.

> **Experimento:** tire o `ParseIntPipe`, deixando só `@Param("id") id: number`. Chame
> `/obras/1` de novo. O que acontece, e por quê? (Resposta no gabarito dos exercícios.)

#### 3e. Quando não existe: 404

Chame `/obras/999`. Hoje responde `200` com corpo vazio, o que é pior que um erro: o cliente
não tem como saber se a obra não existe ou se a API está quebrada.

No service, troque o `buscarUm`:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";

buscarUm(id: number): Obra {
  const obra = this.obras.find((o) => o.id === id);
  if (!obra) {
    throw new NotFoundException(`Obra ${id} não encontrada`);
  }
  return obra;
}
```

```bash
curl -i http://localhost:3000/obras/999
```

**Deu certo se:** responde **404** com
`{"message":"Obra 999 não encontrada","error":"Not Found","statusCode":404}`.

Você lançou uma exceção de domínio; o framework traduziu para HTTP. **O service continua sem
saber o que é HTTP** — não importou `Response`, não escreveu `404`. É o critério da teoria,
funcionando.

**Repare no que o controller não faz:** não valida, não guarda dados, não decide regra. Ele
traduz HTTP e delega.

### Passo 4 — Configuração por variável de ambiente (25 min)

#### 4a. Os dois arquivos

`backend/.env` — **não** vai para o Git (o `.gitignore` do M00 já cuida disso):

```ini
PORT=3000
NODE_ENV=development
NOME_BIBLIOTECA=Biblioteca Comunitária do Bairro
```

`backend/.env.example` — **este vai**, com as mesmas chaves e sem os valores:

```ini
PORT=
NODE_ENV=
NOME_BIBLIOTECA=
```

> O `.env.example` documenta **quais** variáveis existem. É por ele que uma pessoa nova
> descobre o que precisa configurar. Variável nova no `.env` sem entrada no `.env.example` é
> o bug de integração mais comum de todos, e só aparece quando alguém clona o projeto.

#### 4b. Ligar o ConfigModule

Ler `.env` não vem de fábrica no Nest. Instale o pacote:

```bash
pnpm add @nestjs/config
```

Em `src/app.module.ts`, acrescente ao `imports` (o `AcervoModule` já está lá):

```ts
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AcervoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

| Trecho | O que faz |
|---|---|
| `ConfigModule.forRoot(...)` | Lê o `.env` uma vez, na inicialização |
| `isGlobal: true` | Deixa o `ConfigService` disponível em toda a aplicação, sem reimportar em cada módulo |

Para conferir que leu, injete o `ConfigService` no `AcervoService`. O service ainda não tinha
construtor — este é o primeiro:

```ts
import { ConfigService } from "@nestjs/config";   // ← novo import

@Injectable()
export class AcervoService {
  constructor(private readonly config: ConfigService) {}

  // ...o resto da classe continua igual

  nomeDaBiblioteca(): string {
    return this.config.get<string>("NOME_BIBLIOTECA") ?? "sem nome";
  }
}
```

Repare que você **não** precisou importar o `ConfigModule` dentro do `AcervoModule`: é o
`isGlobal: true` fazendo efeito. Sem ele, faltaria esse registro e você cairia no
`can't resolve dependencies` de novo.

Agora exponha num endpoint temporário. No `acervo.controller.ts`, **acima** do `@Get(":id")`:

```ts
@Get("nome")
nome() {
  return { nome: this.acervo.nomeDaBiblioteca() };
}
```

```bash
curl -i http://localhost:3000/obras/nome
```

⚠️ **A ordem importa, e é por isso que o passo diz "acima".** Se o `@Get("nome")` ficar
**depois** do `@Get(":id")`, o Nest casa a URL com o primeiro que serve — `:id` — e o
`ParseIntPipe` tenta converter `"nome"` em número. Resultado: **400** numa rota que existe.
Rota literal sempre antes de rota com parâmetro. O M07 volta a isso.

**Deu certo se:** responde `{"nome":"Biblioteca Comunitária do Bairro"}`, ou o que estiver no
seu `.env`.

#### 4c. Falhar cedo quando faltar variável

Hoje, se alguém apagar `NOME_BIBLIOTECA` do `.env`, a aplicação sobe e o erro só aparece
quando alguém abrir a tela que usa aquele valor. Melhor não subir.

```bash
pnpm add zod
```

Crie `src/config/esquema-env.ts`. Comece só pelo esquema:

```ts
import { z } from "zod";

export const esquemaEnv = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NOME_BIBLIOTECA: z
    .string("NOME_BIBLIOTECA é obrigatória")
    .min(1, "NOME_BIBLIOTECA não pode ficar vazia"),
});
```

| Trecho | O que faz |
|---|---|
| `z.coerce.number()` | Variável de ambiente é **sempre texto**. O `coerce` converte antes de validar |
| `z.enum([...])` | Só aceita os três valores. `NODE_ENV=prod` (errado) é recusado |
| `.default(...)` | Se a chave não vier, usa este valor em vez de reclamar |
| `z.string("...")` | Mensagem para quando a chave **não existe** |
| `.min(1, "...")` | Mensagem para quando ela existe mas está **vazia** |

> São duas mensagens porque são dois problemas diferentes: `NOME_BIBLIOTECA` ausente e
> `NOME_BIBLIOTECA=` vazia falham por motivos distintos. Quem está com a mão no `.env` às
> duas da manhã agradece a distinção.

Agora a função que o Nest vai chamar. **No mesmo arquivo**, abaixo do esquema:

```ts
export function validarEnv(bruto: Record<string, unknown>) {
  const resultado = esquemaEnv.safeParse(bruto);

  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `  - ${i.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n${problemas.join("\n")}`);
  }

  return resultado.data;
}
```

| Trecho | O que faz |
|---|---|
| `safeParse` | Devolve `{ success, data }` ou `{ success, error }` em vez de lançar. Você decide o que fazer com a falha |
| `error.issues` | Lista com **todos** os problemas, não só o primeiro |
| `throw new Error(...)` | Uma mensagem legível. Sem isto o terminal cospe o objeto de erro cru do Zod, que ninguém lê às pressas |
| `return resultado.data` | O que volta daqui é o que o `ConfigService` passa a servir — já convertido, `PORT` como número |

Ligue no `app.module.ts`:

```ts
import { validarEnv } from "./config/esquema-env";

ConfigModule.forRoot({
  isGlobal: true,
  validate: validarEnv,
}),
```

**Teste a falha, que é o ponto do passo:** comente `NOME_BIBLIOTECA` no `.env` e salve.

**Deu certo se:** a aplicação **não sobe**, e no meio do erro aparecem estas duas linhas:

```
Error: Variáveis de ambiente inválidas:
  - NOME_BIBLIOTECA é obrigatória
```

Descomente e ela volta. Depois tente `NOME_BIBLIOTECA=` (chave presente, valor vazio): a
mensagem muda para `não pode ficar vazia`. E tente `NODE_ENV=prod`: o `z.enum` recusa e diz
quais valores aceita.

> Você vai ver um *stack trace* embaixo da mensagem. É normal — o Nest imprime a pilha de
> qualquer erro de inicialização. A linha que interessa é a primeira.

> Um serviço que não sobe é um problema óbvio, que você resolve em dois minutos. Um serviço
> que sobe pela metade é um problema caro, que aparece na frente do usuário.

#### 4d. O prefixo `/api`

Em `src/main.ts`, acrescente uma linha entre o `create` e o `listen`:

```ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");                    // ← nova
await app.listen(process.env.PORT ?? 3000);
```

| Linha | O que faz |
|---|---|
| `setGlobalPrefix("api")` | Toda rota passa a começar em `/api`. As obras vão para `/api/obras` |
| `process.env.PORT ?? 3000` | Usa a variável, com 3000 de reserva. O `??` só cai no padrão com `null`/`undefined`, diferente do `\|\|`, que também cairia com `0` ou `""` |

**Por que agora:** no M16 os dois artefatos vão para o mesmo domínio, com `/api/*` indo para
o backend e o resto para a SPA. Definir o prefixo hoje evita reescrever todas as URLs do
frontend no M08.

```bash
curl -i http://localhost:3000/api/obras
curl -i http://localhost:3000/obras
```

**Deu certo se:** a primeira responde 200 e a segunda passa a responder **404**.

### Passo 5 — Documentação automática (20 min)

#### 5a. Instalar e extrair a configuração

```bash
pnpm add @nestjs/swagger
```

A configuração do Swagger vai ser usada em **dois lugares** — na página interativa e no
arquivo do schema. Escreva uma vez só, em `src/swagger.ts`:

```ts
import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function montarDocumento(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("BiblioCom API")
    .setDescription("Acervo de biblioteca comunitária")
    .setVersion("1.0")
    .build();

  return SwaggerModule.createDocument(app, config);
}
```

| Trecho | O que faz |
|---|---|
| `DocumentBuilder` | Monta os metadados: título, descrição, versão |
| `createDocument(app, config)` | **Varre a aplicação** e monta o schema OpenAPI a partir dos controllers |

#### 5b. Publicar a página interativa

Em `src/main.ts`, entre o prefixo e o `listen`:

```ts
import { SwaggerModule } from "@nestjs/swagger";
import { montarDocumento } from "./swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  SwaggerModule.setup("api/docs", app, montarDocumento(app));   // ← nova

  await app.listen(process.env.PORT ?? 3000);
}
```

**Deu certo se:** <http://localhost:3000/api/docs> lista `GET /api/obras` e
`GET /api/obras/{id}`, com um botão *Try it out* que funciona de verdade.

#### 5c. Gravar o schema em arquivo

A página serve para pessoas. O **M15** precisa do schema como arquivo, para gerar os tipos
do frontend a partir dele. Crie `src/gerar-schema.ts`:

```ts
import { writeFileSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { montarDocumento } from "./swagger";

async function gerar() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");

  writeFileSync("./openapi.json", JSON.stringify(montarDocumento(app), null, 2));

  await app.close();
  console.log("openapi.json gerado");
}

gerar();
```

| Trecho | O que faz |
|---|---|
| `{ logger: false }` | Silencia os logs de inicialização. O script só deve imprimir uma linha |
| `setGlobalPrefix("api")` | Precisa repetir aqui, senão as rotas saem sem `/api` no schema |
| `app.close()` | Encerra a aplicação. **Sem isto o script não termina** e fica pendurado |

E o atalho, em `backend/package.json`, ao lado dos scripts que já estão lá:

```json
"scripts": {
  "gerar:schema": "nest build && node dist/gerar-schema.js"
}
```

| Trecho | O que faz |
|---|---|
| `nest build` | Compila o TypeScript para `dist/`. É o mesmo comando do `pnpm build` |
| `&&` | Só roda o segundo se o primeiro der certo. Erro de compilação para aqui |
| `node dist/gerar-schema.js` | Executa o arquivo compilado — repare no `.js` |

> Por que compilar antes em vez de rodar o `.ts` direto: o TypeScript sozinho não executa
> nada. Dá para contornar com `ts-node`, mas seria mais uma ferramenta para instalar e
> explicar, e o `nest build` já está aí desde o passo 2.

```bash
pnpm gerar:schema
```

**Deu certo se:** apareceu `openapi.json gerado`, e o arquivo `backend/openapi.json` contém
`"/api/obras"`.

Repare que a aplicação **não subiu servidor nenhum**: o `NestFactory.create` monta a árvore
de módulos em memória, o Swagger a percorre, e pronto. É por isso que o comando roda em
segundos e serve para o CI.

Esse arquivo é o **contrato** de que o M02 falou. No M07 ele ganha os tipos de entrada e
saída; no M15, vira os tipos do frontend. Como nasce do código, não tem como divergir dele.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Nest can't resolve dependencies of the AcervoController (?)` | O `AcervoService` não está em `providers` do `AcervoModule`. O `?` marca a posição do parâmetro que ele não resolveu |
| A rota responde `/acervo` e não `/obras` | A CLI usou o nome do módulo como prefixo. Troque no `@Controller(...)` |
| `/obras/nome` responde 400 | Rota literal declarada depois de `@Get(":id")`. O `ParseIntPipe` tentou converter `"nome"` |
| `pnpm gerar:schema` não termina | Faltou `await app.close()` no fim do script |
| `openapi.json` sai com rotas sem `/api` | Faltou `setGlobalPrefix("api")` dentro do `gerar-schema.ts` |
| A aplicação sobe mesmo faltando variável no `.env` | O `validate` não foi ligado no `ConfigModule` |
| `Cannot find module './acervo.service'` | Import com caminho errado, ou o arquivo não foi salvo |
| A rota responde 404 | Faltou o prefixo `/api`, ou o módulo não está em `imports` do `AppModule` |
| `/api/obras/1` responde 404 numa obra que existe | Faltou o `ParseIntPipe`. O `id` chegou como `"1"`, e `"1" === 1` é `false`. A anotação `: number` não vale em tempo de execução |
| Alterou o `.env` e nada mudou | O `.env` é lido na **inicialização**. Reinicie o `start:dev` |
| Um segundo `.git` apareceu dentro de `backend/` | Faltou `--skip-git` no `nest new`. Apague `backend/.git` |
| `EADDRINUSE: address already in use :::3000` | Já há um servidor na porta. Encerre-o ou use outra porta |

## ✅ Checklist de saída

- [ ] `pnpm-workspace.yaml` e `package.json` na raiz, com os workspaces declarados
- [ ] `GET /api/obras` responde 200 com a lista
- [ ] `GET /api/obras/999` responde **404**, sem código de status escrito à mão
- [ ] O controller **não** contém regra de negócio nem acesso a dados
- [ ] `GET /api/obras/abc` responde **400**, vindo do `ParseIntPipe`
- [ ] `.env` fora do Git; `.env.example` dentro, com as mesmas chaves
- [ ] A aplicação **não sobe** se faltar variável obrigatória no `.env` — você testou
- [ ] `/api/docs` abre e lista os endpoints
- [ ] `pnpm gerar:schema` grava o `openapi.json`
- [ ] Você viu o erro `Nest can't resolve dependencies` de propósito, tirando o service de `providers`
- [ ] Você sabe explicar, em uma frase, o que a injeção de dependência resolve

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — documentação oficial](https://docs.nestjs.com/)
- [NestJS — Providers e injeção de dependência](https://docs.nestjs.com/providers)
- [TypeScript — decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [pnpm workspaces](https://pnpm.io/workspaces)
