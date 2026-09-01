# M03 — NestJS: a primeira API, passo a passo

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 3** · **Pré-requisitos:** M01, M02

Este é o primeiro código do backend, e o primeiro TypeScript da disciplina. Ao final existe
uma API que responde de verdade, e você entende cada linha dela.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 4, 5, 6 e 10 — em
> que a gente para de digitar e lê — mais as explicações dentro de cada etapa. Conceito
> chega quando o código pede, e não antes.

## 🎯 Objetivos

Ao final você será capaz de:

1. Ler um projeto NestJS e dizer o que cada arquivo faz.
2. Explicar o que é um **decorator** e por que o framework depende deles.
3. Distinguir **module**, **controller** e **provider**, e dizer o que cada um não deve fazer.
4. Explicar o que **injeção de dependência** resolve — tendo visto o problema antes da solução.
5. Criar endpoints que respondem JSON, com rota, parâmetro e status HTTP corretos.
6. Ler configuração de fora do código e **impedir a aplicação de subir** quando faltar.
7. Publicar o contrato da API em OpenAPI, gerado a partir do código.

---

## 🧭 O que você vai construir

Uma API de acervo com três rotas. No fim da aula, isto funciona na sua máquina:

```
GET /api/obras          → 200  [{"id":1,"titulo":"Dom Casmurro","ano":1899}, …]
GET /api/obras/1        → 200  {"id":1,"titulo":"Dom Casmurro","ano":1899}
GET /api/obras/abc      → 400  {"message":"Validation failed (numeric string is expected)"…}
GET /api/obras/999      → 404  {"message":"Obra 999 não encontrada"…}
GET /api/docs           → a documentação, gerada sozinha
```

Três rotas parecem pouco. O que importa não são elas: é a **estrutura** que o M04 (banco), o
M06 (consultas) e o M07 (validação) vão preencher sem precisar mover nada de lugar.

## 📋 Como este módulo funciona

Dezessete etapas curtas, em ordem. Cada uma tem sempre as mesmas quatro partes:

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** do que você acabou de escrever |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

**Não pule para a frente.** Cada etapa assume que a anterior funcionou, e várias delas
existem para você ver um erro de propósito — o erro é o conteúdo.

| # | Etapa | Min | Recurso técnico que entra |
|---|---|---|---|
| 1 | [Conferir o terreno](#etapa-1--conferir-o-terreno-5-min) | 5 | — |
| 2 | [Criar o projeto](#etapa-2--criar-o-projeto-15-min) | 15 | CLI do Nest |
| 3 | [Subir o servidor](#etapa-3--subir-o-servidor-10-min) | 10 | scripts do `package.json`, recarga automática |
| 4 | [Ler o `main.ts`](#etapa-4--ler-o-maints-10-min) | 10 | `import`/`export`, `async`/`await` |
| 5 | [Ler o controller e o service](#etapa-5--ler-o-controller-e-o-service-20-min) | 20 | **decorators**, `@Controller`, `@Get`, `@Injectable` |
| 6 | [Ler o módulo](#etapa-6--ler-o-módulo-10-min) | 10 | `@Module` e suas três listas |
| 7 | [A primeira mudança sua](#etapa-7--a-primeira-mudança-sua-10-min) | 10 | ciclo editar → salvar → ver |
| 8 | [Criar o seu módulo](#etapa-8--criar-o-seu-módulo-15-min) | 15 | `nest generate` |
| 9 | [O primeiro endpoint seu](#etapa-9--o-primeiro-endpoint-seu-20-min) | 20 | rota própria, resposta JSON |
| 10 | [Tirar o dado do controller](#etapa-10--tirar-o-dado-do-controller-25-min) | 25 | **injeção de dependência** |
| 11 | [Receber um parâmetro na URL](#etapa-11--receber-um-parâmetro-na-url-20-min) | 20 | `@Param`, **pipes** |
| 12 | [Responder 404](#etapa-12--responder-404-15-min) | 15 | exceções de domínio |
| 13 | [Configuração fora do código](#etapa-13--configuração-fora-do-código-20-min) | 20 | `.env`, `ConfigModule` |
| 14 | [Não subir quebrado](#etapa-14--não-subir-quebrado-15-min) | 15 | validação na inicialização |
| 15 | [O prefixo `/api`](#etapa-15--o-prefixo-api-10-min) | 10 | `setGlobalPrefix` |
| 16 | [Documentação automática](#etapa-16--documentação-automática-15-min) | 15 | Swagger / OpenAPI |
| 17 | [O mapa que você percorreu](#etapa-17--o-mapa-que-você-percorreu-5-min) | 5 | — |

> 📦 **Antes desta aula**, instale o Node 20 e o pnpm.
> 🐧 [`ambiente-setup.md`, seção 4](../../docs/ambiente-setup.md#4-nodejs-e-pnpm) ·
> 🪟 [`ambiente-setup-windows.md`, passo 4](../../docs/ambiente-setup-windows.md#passo-4--nodejs-e-pnpm)

---

## Etapa 1 — Conferir o terreno (5 min)

O `package.json` e o `pnpm-workspace.yaml` foram criados no M00. Antes de criar coisa nova,
confirme que a base está lá.

**Faça:**

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
cat pnpm-workspace.yaml     # 🪟 Windows: Get-Content pnpm-workspace.yaml
```

**Deu certo se:** o arquivo lista `backend`, `frontend` e `pacotes/*`.

As pastas ainda não existem, e isso é normal: `backend/` nasce na etapa 2, `frontend/` no
M08 e `pacotes/tipos/` no M15. O `pnpm-workspace.yaml` é uma **declaração de intenção** —
ele diz ao pnpm onde procurar projetos quando eles existirem.

---

## Etapa 2 — Criar o projeto (15 min)

**Faça:**

```bash
pnpm dlx @nestjs/cli new backend --package-manager pnpm --skip-git
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `pnpm dlx` | Baixa e executa um pacote **sem instalá-lo** no projeto. É o `npx` do pnpm. Você usa a CLI hoje e não fica com ela pendurada como dependência |
| `@nestjs/cli` | A ferramenta de linha de comando do Nest. O `@nestjs/` é um *escopo*: um prefixo que agrupa os pacotes oficiais do projeto |
| `new backend` | Cria um projeto novo na pasta `backend/` |
| `--package-manager pnpm` | Responde de antemão a pergunta que a CLI faria (npm? yarn? pnpm?) |
| `--skip-git` | **Importante.** Sem isto a CLI cria um repositório Git **dentro** do seu, e você passa meia hora sem entender por que o `git status` da raiz ignora tudo que está em `backend/` |

A CLI lista os arquivos que criou e instala as dependências. Na primeira vez leva um ou dois
minutos — ela está baixando o Nest inteiro.

**Deu certo se:**

```bash
ls backend                  # 🪟 Windows: Get-ChildItem backend
ls backend/.git             # deve dar "não encontrado"
```

Existe `backend/` com `src/` dentro, e **não** existe `backend/.git`.

> Se o `backend/.git` existir, apague essa pasta (`rm -rf backend/.git`) e siga. Nada mais
> quebra por causa disso.

---

## Etapa 3 — Subir o servidor (10 min)

**Faça:**

```bash
cd backend
pnpm start:dev
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `pnpm start:dev` | Executa o *script* chamado `start:dev`, que está no `package.json`. Abra o arquivo e procure a seção `"scripts"`: você vai ver que `start:dev` é um apelido para `nest start --watch` |
| `--watch` (dentro do script) | Fica observando os arquivos. A cada `Ctrl+S`, ele recompila e reinicia sozinho |

Este comando **ocupa o terminal** e não devolve o cursor — ele fica rodando. Deixe-o numa
janela e abra **outra** para os comandos das próximas etapas.

**Rode:** abra <http://localhost:3000> no navegador.

**Deu certo se:** a página mostra `Hello World!`, e o terminal termina com

```
[Nest] LOG [NestApplication] Nest application successfully started
```

> ⚠️ **`EADDRINUSE: address already in use :::3000`** significa que já existe um servidor
> nessa porta — provavelmente um que você esqueceu aberto. Feche-o com `Ctrl+C` na janela
> dele. Este erro vai reaparecer no curso; guarde a causa.

Você não escreveu uma linha ainda e já tem um servidor HTTP no ar. As próximas três etapas
são para entender de onde ele veio.

---

## Etapa 4 — Ler o `main.ts` (10 min)

Pare de digitar. As etapas 4, 5 e 6 são de leitura: são **quatro arquivos pequenos**, e o
`Hello World!` que você acabou de ver sai deles.

> Em `src/` você vai contar cinco arquivos. O quinto é o `app.controller.spec.ts`, um teste
> que a CLI deixa de brinde. Ignore-o por enquanto — ele é assunto do M14.

Abra `src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `import { X } from "y"` | Traz a coisa chamada `X` de dentro do módulo `y`. As chaves indicam **exportação nomeada** — `y` exporta várias coisas e você quer só essa |
| `from "@nestjs/core"` | Sem `./` na frente: é um pacote de `node_modules` |
| `from "./app.module"` | Com `./`: é um arquivo **seu**, na mesma pasta. Repare que não se escreve `.ts` no fim |
| `async function` | Marca a função como assíncrona. Só dentro de uma função `async` é possível usar `await` |
| `await` | "Espere esta operação terminar antes de seguir para a próxima linha." Sem ele, o código seguiria adiante com a aplicação ainda pela metade |
| `NestFactory.create(AppModule)` | **A linha central do arquivo.** Monta a aplicação inteira a partir de **um único módulo** |
| `app.listen(...)` | Começa a escutar requisições HTTP. Antes desta linha, a aplicação existe mas não atende ninguém |
| `process.env.PORT` | Lê a variável de ambiente `PORT`. O `process` é global do Node |
| `?? 3000` | Operador de coalescência nula: "se o valor da esquerda for `null` ou `undefined`, use 3000". Diferente de `\|\|`, que também trocaria `0` e `""` — e porta `0` é um valor legítimo |
| `bootstrap();` | Chama a função. Sem esta linha, a função existe e nunca roda |

**O que reter desta etapa:** toda a aplicação sai de **um** módulo, o `AppModule`. Tudo o
que você criar daqui em diante vai, direta ou indiretamente, pendurar nele.

---

## Etapa 5 — Ler o controller e o service (20 min)

Estes dois arquivos são de onde o texto `Hello World!` realmente vem.

### 5a. `src/app.controller.ts`

```ts
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `@Controller()` | Marca a classe como controller e define o **prefixo de rota**. Vazio aqui, então as rotas começam na raiz |
| `export class` | `class` é do JavaScript; `export` disponibiliza a classe para outros arquivos importarem |
| `constructor(private readonly appService: AppService)` | Recebe um `AppService` já pronto. **Volte a esta linha na etapa 10** — ela é o assunto do módulo inteiro |
| `private readonly` | Atalho do TypeScript: declara a propriedade `this.appService` **e** atribui o valor, numa linha só. Sem ele seriam três linhas |
| `@Get()` | Marca o método como resposta a requisições `GET`. Sem caminho, atende o prefixo do `@Controller` |
| `getHello(): string` | O `: string` depois dos parênteses é o **tipo de retorno**. Se você devolvesse um número aqui, o TypeScript acusaria antes de rodar |
| `return this.appService.getHello()` | O controller **não produz o texto**: pede a quem sabe |

### 5b. `src/app.service.ts`

```ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }
}
```

Uma classe comum, com um método que devolve um texto. O `@Injectable()` é o único elemento
novo, e a etapa 10 explica o que ele faz.

### 5c. O conceito: o que é um decorator

Você viu três coisas começando com `@`. Elas têm nome: **decorators**.

Um decorator é **uma função que anexa informação a uma classe ou a um método**. Ele não
executa o método, não muda o que ele faz e não é mágica — ele **registra** algo.

```ts
@Get()                 // registra: "este método responde a GET"
getHello(): string {}
```

Quando a aplicação sobe, o Nest **lê esses registros** e monta a tabela de rotas a partir
deles. É exatamente por isso que o terminal, ao iniciar, imprime linhas como:

```
[RouterExplorer] Mapped {/, GET} route
```

Ele está lendo o que os decorators anexaram e anunciando o que encontrou.

| Pergunta comum | Resposta |
|---|---|
| O `@` é do TypeScript ou do Nest? | Da linguagem. O Nest só define **quais** decorators existem e o que fazer com eles |
| Por que os parênteses em `@Get()`? | Porque é uma chamada de função. `@Get()` chama `Get` sem argumento; `@Get(":id")` passa o caminho |
| Onde mais vou ver isso? | Em `@Entity()` no M04 e em `@IsString()` no M07. **Um mecanismo, três usos** — quando chegar lá, você já sabe o que está acontecendo |

**Não decore os decorators.** Cada um vai aparecer no momento em que resolve um problema
seu, e é aí que ele gruda.

---

## Etapa 6 — Ler o módulo (10 min)

Falta o arquivo que amarra os outros três. Abra `src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Repare que o corpo da classe está **vazio** — `{}`. Todo o conteúdo do arquivo está no
decorator. O módulo não *faz* nada: ele **declara** o que existe.

**As três listas, que é tudo o que um módulo é:**

| Lista | O que vai nela | Pergunta que ela responde |
|---|---|---|
| `imports` | Outros módulos | "De que outros pedaços do sistema eu preciso?" |
| `controllers` | Quem responde a requisições HTTP | "Quais rotas nascem aqui?" |
| `providers` | Quem pode ser **injetado** — os services | "Quem o Nest tem permissão de criar e entregar?" |

Agora dá para ler a aplicação inteira de trás para frente:

```
main.ts  →  cria a app a partir do AppModule
AppModule  →  declara AppController (rotas) e AppService (provider)
AppController  →  @Get() na raiz, pede o texto ao AppService
AppService  →  devolve "Hello World!"
```

**Esse é o projeto inteiro.** Quatro arquivos, cada um com uma responsabilidade. Tudo que
vem depois é mais do mesmo, em maior quantidade.

---

## Etapa 7 — A primeira mudança sua (10 min)

Antes de acrescentar conceito, feche o ciclo básico: editar, salvar, ver o resultado.

**Faça:** em `src/app.service.ts`, troque o texto:

```ts
return "BiblioCom no ar";
```

**Rode:** salve o arquivo e olhe o terminal do `start:dev`. Ele imprime algo como
`File change detected. Starting incremental compilation...` e reinicia sozinho. Atualize o
navegador.

**Deu certo se:** a página mostra `BiblioCom no ar`, sem você ter reiniciado nada à mão.

> **Se este passo falhar, pare aqui.** Nada das próximas etapas vai funcionar, e o problema
> é de ambiente, não de código. Confira se o `start:dev` ainda está rodando naquela outra
> janela — é comum tê-lo fechado sem perceber.

Parece pouca coisa. É o ciclo que você vai repetir algumas centenas de vezes até o M17, e
vale ter certeza de que ele funciona antes de complicar.

---

## Etapa 8 — Criar o seu módulo (15 min)

O `AppModule` é a raiz. Coisas de verdade ficam em módulos próprios, um por área do domínio.
O nosso se chama **acervo**.

**Faça:**

```bash
pnpm dlx @nestjs/cli generate module acervo
pnpm dlx @nestjs/cli generate controller acervo --no-spec
pnpm dlx @nestjs/cli generate service acervo --no-spec
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `generate module acervo` | Cria `src/acervo/acervo.module.ts` **e** o registra no `imports` do `app.module.ts` |
| `generate controller acervo` | Cria o controller **e** o registra em `controllers` do `AcervoModule` |
| `generate service acervo` | Cria o service **e** o registra em `providers` |
| `--no-spec` | Pula o arquivo de teste. Eles entram no M14, com o conteúdo que os justifica |

**Rode:** abra `src/acervo/acervo.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { AcervoController } from "./acervo.controller";
import { AcervoService } from "./acervo.service";

@Module({
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

**Este arquivo é a peça que faz tudo funcionar.** Confira também o `app.module.ts`: o
`AcervoModule` apareceu no `imports` sozinho.

Esse registro automático é justamente o que se esquece de fazer quando se cria arquivo à
mão — e o erro que aparece quando falta **não menciona registro nenhum**. Você vai provocar
esse erro de propósito na etapa 10.

Os outros dois arquivos vieram quase vazios:

```ts
// acervo.controller.ts
@Controller("acervo")
export class AcervoController {}

// acervo.service.ts
@Injectable()
export class AcervoService {}
```

⚠️ **Um ajuste antes de seguir.** A CLI usou o nome que você passou (`acervo`) como prefixo
de rota. Nós queremos `/obras` — o módulo se chama acervo, mas o recurso que ele expõe é
obra. Troque:

```ts
@Controller("obras")
```

> Módulo e rota não precisam ter o mesmo nome, e frequentemente não têm. O módulo organiza o
> **código**; a rota nomeia o **recurso** que o cliente enxerga. O M07 volta a isso.

---

## Etapa 9 — O primeiro endpoint seu (20 min)

Agora você escreve. Comece pelo mais simples que existe: uma rota que devolve uma lista fixa.

**Faça:** em `src/acervo/acervo.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";

@Controller("obras")
export class AcervoController {
  @Get()
  listar() {
    return [
      { id: 1, titulo: "Dom Casmurro", ano: 1899 },
      { id: 2, titulo: "Grande Sertão: Veredas", ano: 1956 },
    ];
  }
}
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `@Controller("obras")` | Todas as rotas desta classe começam em `/obras` |
| `@Get()` | Sem caminho: atende exatamente `/obras` |
| `listar()` | O nome do método é **seu**. Ele não vira parte da URL — quem define a URL são os decorators |
| `return [ … ]` | Devolve um array de objetos JavaScript comuns |

**Rode:**

```bash
curl -i http://localhost:3000/obras       # 🪟 Windows: curl.exe -i http://localhost:3000/obras
```

**Deu certo se:** a primeira linha é `HTTP/1.1 200 OK`, e o corpo é o array em JSON.

**Repare no que você não escreveu:**

| Você não escreveu | Quem fez |
|---|---|
| `res.json(...)` | O Nest converteu o array em JSON sozinho |
| `Content-Type: application/json` | O Nest pôs o cabeçalho ao ver que você devolveu um objeto |
| `status(200)` | 200 é o padrão para `GET` |

Você devolveu um valor e o framework cuidou do HTTP. Essa é a diferença entre o Nest e o
Express da conversa do M02.

> ⚠️ **Este endpoint está errado de propósito.** Os dados estão dentro do controller, e a
> próxima etapa existe para consertar isso. Deixe como está.

---

## Etapa 10 — Tirar o dado do controller (25 min)

Esta é a etapa mais importante do módulo. Ela tem três partes: o problema, a solução e a
prova.

### 10a. Por que os dados não podem ficar no controller

Volte à tabela de responsabilidades — ela agora tem código concreto por trás:

| Peça | Responsabilidade | O que **não** deve fazer |
|---|---|---|
| **Module** | Agrupar o que pertence a um domínio e declarar o que ele expõe | Conter lógica |
| **Controller** | Traduzir HTTP ↔ chamada de método: ler rota, corpo e query; devolver dados | Falar com o banco, conter regra de negócio |
| **Provider** (Service) | A regra de negócio e o acesso a dados | Saber que HTTP existe |

A pergunta que resolve 90% das dúvidas de "onde eu ponho este código?":

> Se este código precisasse rodar a partir de um comando de terminal, em vez de uma
> requisição HTTP, ele mudaria? **Se não muda, é Service. Se muda, é Controller.**

A lista de obras não muda: ela é a mesma vindo de uma requisição HTTP, de um comando de
terminal ou de um teste. Logo, é service.

### 10b. Mover o dado

**Faça:** em `src/acervo/acervo.service.ts`:

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `export type Obra = { … }` | Declara um **tipo**: a forma que um objeto obra tem. Não gera código nenhum ao rodar — serve só para o TypeScript conferir |
| `private obras: Obra[]` | Propriedade da classe. `Obra[]` é "array de Obra". `private` impede acesso de fora da classe |
| `listar(): Obra[]` | Se você errar e devolver outra coisa, o TypeScript acusa antes de rodar |

### 10c. Pedir o service, sem criá-lo

E agora o controller. **A forma ingênua seria esta:**

```ts
export class AcervoController {
  private acervo = new AcervoService();   // ❌
}
```

Funciona, e é ruim por dois motivos concretos:

1. **O controller ficou soldado a essa implementação.** Num teste (M14), não há como trocar
   o service por um dublê — a linha `new` está dentro dele.
2. **Se o service passar a precisar de coisas**, como a conexão de banco do M04, o controller
   passa a ter de saber montá-las. E quem usa o controller, também. A ignorância se espalha
   para cima.

**A forma do Nest — a dependência chega pronta, pelo construtor. Faça:**

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `constructor(...)` | Método chamado quando a classe é instanciada. **Quem a instancia é o Nest**, não você |
| `private readonly acervo` | Atalho do TypeScript, o mesmo do `AppController`: declara e atribui `this.acervo` numa linha |
| `: AcervoService` | **É por este tipo que o Nest identifica o que entregar.** Ele lê o tipo do parâmetro, procura quem está declarado em `providers` e entrega uma instância pronta |
| `@Injectable()` no service | Sem ele, o Nest não guarda os metadados necessários e não consegue criar a classe |
| ausência de `new` | Em nenhum lugar do seu código existe `new AcervoService()` |

Isso é **injeção de dependência**: a classe declara *o que precisa*, não *como conseguir*.

**Rode:**

```bash
curl -i http://localhost:3000/obras
```

**Deu certo se:** responde as duas obras, exatamente como antes. O comportamento visível é o
mesmo da etapa 9 — o que mudou foi **onde o dado mora**.

### 10d. A prova de que a injeção é real

Até aqui, "o Nest entrega o service" é uma afirmação. Vamos verificá-la quebrando.

**Faça:** em `src/acervo/acervo.module.ts`, comente o `AcervoService` da lista `providers`:

```ts
@Module({
  controllers: [AcervoController],
  providers: [/* AcervoService */],
})
```

Salve e olhe o terminal. O servidor **derruba**:

```
Nest can't resolve dependencies of the AcervoController (?).
Please make sure that the argument AcervoService at index [0] is available
in the AcervoModule module.
```

**Leia a mensagem inteira:**

| Parte | Significado |
|---|---|
| `can't resolve dependencies of the AcervoController` | Ele tentou criar o controller e não conseguiu |
| `(?)` | A posição do parâmetro que ele não resolveu. Com dois parâmetros e o segundo faltando, seria `(AcervoService, ?)` |
| `at index [0]` | O primeiro parâmetro do construtor |
| `is available in the AcervoModule module` | **Onde procurar:** a lista `providers` daquele módulo |

Descomente e o servidor volta.

Guarde este erro: é o mais comum do módulo e do M04, e a causa é quase sempre a mesma —
alguém criou uma classe e esqueceu de registrá-la em `providers`.

**Três consequências práticas da injeção**, agora que você viu como funciona:

1. **Testar fica trivial** — o teste passa um dublê no lugar do service (M14).
2. **Uma instância só** (*singleton*), reaproveitada em toda a aplicação.
3. **Trocar a implementação não toca quem usa** — útil quando o `EmailService` de
   desenvolvimento vira o de produção.

---

## Etapa 11 — Receber um parâmetro na URL (20 min)

Listar todas é fácil. Buscar uma exige ler um pedaço da URL.

### 11a. O método no service

**Faça:**

```ts
buscarUm(id: number): Obra | undefined {
  return this.obras.find((o) => o.id === id);
}
```

`Obra | undefined` é um **tipo de união**: "ou uma Obra, ou nada". O `find` do JavaScript
devolve `undefined` quando não encontra, e o tipo diz isso em voz alta.

### 11b. A rota no controller

**Faça:**

```ts
@Get(":id")
buscarUm(@Param("id", ParseIntPipe) id: number) {
  return this.acervo.buscarUm(id);
}
```

Acrescente `Param` e `ParseIntPipe` ao `import` de `@nestjs/common`.

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `@Get(":id")` | Os dois-pontos marcam um **trecho variável**. Casa com `/obras/1`, `/obras/42`, `/obras/qualquercoisa` |
| `@Param("id")` | Decorator **de parâmetro**: extrai da URL o pedaço chamado `id` e entrega ao seu método. O nome tem de bater com o do `@Get(":id")` |
| `ParseIntPipe` | Converte o texto em número **antes** de o método ser chamado |

### 11c. O conceito: o que é um pipe

Um **pipe** é uma peça que roda **entre a requisição e o seu método**. Ele recebe o valor
que chegou e devolve o valor que o método vai receber — convertendo, validando, ou as duas
coisas.

O `ParseIntPipe` faz o seguinte: pega a string vinda da URL, tenta convertê-la em número; se
conseguir, entrega o número; se não conseguir, **responde 400 sozinho** e o seu método nunca
é chamado.

**Rode:**

```bash
curl -i http://localhost:3000/obras/1
curl -i http://localhost:3000/obras/abc
```

**Deu certo se:** a primeira devolve o objeto; a segunda responde **400**, com

```json
{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}
```

Esse 400 veio do pipe. Você não escreveu nenhum `if`, nenhum `isNaN`, nenhum `try`.

### 11d. Experimento: tire o pipe

**Faça:** troque por `@Param("id") id: number`, deixando o tipo `number` no lugar. Salve e
chame `/obras/1` de novo.

Anote o que acontece e por quê. (A resposta está no gabarito de
[`exercicios.md`](exercicios.md) — tente explicar antes de olhar.)

> A dica: o `: number` é uma anotação do **TypeScript**, e o TypeScript some quando o código
> vira JavaScript. Ninguém está conferindo tipos em tempo de execução, exceto quem você
> mandar conferir.

---

## Etapa 12 — Responder 404 (15 min)

**Rode:** chame `/obras/999`.

Hoje responde `200` com corpo vazio — que é pior do que um erro. O cliente não tem como
saber se a obra não existe, se a API quebrou ou se ele digitou a URL errada. Um `200` é uma
promessa de que deu certo.

**Faça:** no service, troque o `buscarUm`:

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `throw new NotFoundException(...)` | Lança uma exceção que o Nest reconhece e traduz para HTTP 404 |
| `` `Obra ${id} não encontrada` `` | *Template string*: as crases permitem interpolar variáveis com `${...}` |
| `: Obra` (sem `\| undefined`) | O tipo de retorno mudou: agora ou devolve uma obra, ou lança. Nunca devolve nada |

**Rode:**

```bash
curl -i http://localhost:3000/obras/999
```

**Deu certo se:** responde **404** com

```json
{"message":"Obra 999 não encontrada","error":"Not Found","statusCode":404}
```

**O ponto da etapa está no que o service não fez:**

| O service não… | E ainda assim… |
|---|---|
| importou `Response` | a resposta saiu certa |
| escreveu o número `404` | o status é 404 |
| montou o JSON de erro | o corpo veio padronizado |

Você lançou uma exceção em **linguagem de domínio** ("não encontrada") e o framework a
traduziu para HTTP. O service continua sem saber que HTTP existe — é o critério da etapa
10a, funcionando.

O Nest tem uma exceção para cada situação comum: `BadRequestException` (400),
`ConflictException` (409), `ForbiddenException` (403). O M07 e o M12 usam as outras.

**Repare também no que o controller não faz:** não valida, não guarda dados, não decide
regra. Ele traduz HTTP e delega. É um arquivo de dez linhas, e vai continuar sendo pequeno
até o M07.

---

## Etapa 13 — Configuração fora do código (20 min)

O nome da biblioteca não pode estar escrito no meio do código: ele muda por instalação, e
alguém sem acesso ao repositório precisa poder trocá-lo.

### 13a. Os dois arquivos

**Faça:** crie `backend/.env` — que **não** vai para o Git (o `.gitignore` do M00 já cuida):

```ini
PORT=3000
NODE_ENV=development
NOME_BIBLIOTECA=Biblioteca Comunitária do Bairro
```

E `backend/.env.example` — **este vai**, com as mesmas chaves e sem os valores:

```ini
PORT=
NODE_ENV=
NOME_BIBLIOTECA=
```

> Por que dois arquivos: o `.env` tem os **seus** valores e é secreto; o `.env.example`
> documenta **quais** variáveis existem e é público. É por ele que uma pessoa nova descobre
> o que precisa configurar. Variável nova no `.env` sem entrada no `.env.example` é o bug de
> integração mais comum que existe, e só aparece quando alguém clona o projeto.

### 13b. Ligar o ConfigModule

Ler `.env` não vem de fábrica no Nest.

**Faça:**

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `ConfigModule.forRoot(...)` | Lê o `.env` uma vez, na inicialização. O sufixo `forRoot` é convenção do Nest para "configure este módulo aqui, uma vez só" |
| `isGlobal: true` | Deixa o `ConfigService` disponível em **toda** a aplicação. Sem isto, cada módulo precisaria importar o `ConfigModule` de novo |

### 13c. Usar o valor

**Faça:** no `AcervoService` — que ainda não tinha construtor, este é o primeiro:

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

| Trecho | O que faz |
|---|---|
| `constructor(private readonly config: ConfigService)` | Mesma injeção da etapa 10, agora com uma classe do próprio framework |
| `.get<string>("...")` | O `<string>` entre os sinais de menor/maior diz ao TypeScript o tipo esperado. Chama-se *genérico* |
| `?? "sem nome"` | Se a variável não existir, usa esse valor. Na etapa 14 essa rede de proteção sai |

Repare que você **não** precisou importar o `ConfigModule` dentro do `AcervoModule`: é o
`isGlobal: true` fazendo efeito. Sem ele, faltaria esse registro e você cairia no
`can't resolve dependencies` da etapa 10d de novo.

**Faça:** exponha num endpoint temporário. No `acervo.controller.ts`, **acima** do
`@Get(":id")`:

```ts
@Get("nome")
nome() {
  return { nome: this.acervo.nomeDaBiblioteca() };
}
```

⚠️ **A ordem importa, e é por isso que a instrução diz "acima".** Se o `@Get("nome")` ficar
**depois** do `@Get(":id")`, o Nest casa a URL com o primeiro que serve — que é `:id` — e o
`ParseIntPipe` tenta converter `"nome"` em número. Resultado: **400 numa rota que existe**.
Rota literal sempre vem antes de rota com parâmetro. O M07 volta a isso.

**Rode:**

```bash
curl -i http://localhost:3000/obras/nome
```

**Deu certo se:** responde `{"nome":"Biblioteca Comunitária do Bairro"}`, ou o que estiver
no seu `.env`.

---

## Etapa 14 — Não subir quebrado (15 min)

Hoje, se alguém apagar `NOME_BIBLIOTECA` do `.env`, a aplicação sobe normalmente e o erro só
aparece quando alguém abre a tela que usa aquele valor — possivelmente em produção,
possivelmente na frente de um usuário. Melhor não subir.

### 14a. O esquema

**Faça:**

```bash
pnpm add zod
```

Crie `src/config/esquema-env.ts`:

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

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `z.object({...})` | Descreve o formato esperado de um objeto |
| `z.coerce.number()` | Variável de ambiente é **sempre texto**. O `coerce` converte antes de validar |
| `.default(3000)` | Se a chave não vier, usa este valor em vez de reclamar |
| `z.enum([...])` | Só aceita os três valores listados. `NODE_ENV=prod` (errado) é recusado |
| `z.string("...")` | A mensagem para quando a chave **não existe** |
| `.min(1, "...")` | A mensagem para quando ela existe mas está **vazia** |

> São duas mensagens porque são dois problemas diferentes: `NOME_BIBLIOTECA` ausente e
> `NOME_BIBLIOTECA=` vazia falham por motivos distintos. Quem está com a mão no `.env` às
> duas da manhã agradece a distinção.

### 14b. A função de validação

**Faça:** no mesmo arquivo, abaixo do esquema:

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
| `Record<string, unknown>` | "Um objeto com chaves de texto e valores de tipo desconhecido". É o que o Nest entrega aqui |
| `safeParse` | Devolve `{ success, data }` ou `{ success, error }` em vez de lançar. **Você** decide o que fazer com a falha |
| `error.issues` | A lista com **todos** os problemas, não só o primeiro |
| `throw new Error(...)` | Uma mensagem legível. Sem isto o terminal cospe o objeto de erro cru do Zod, que ninguém lê às pressas |
| `return resultado.data` | O que sai daqui é o que o `ConfigService` passa a servir — já convertido, com `PORT` como número |

**Faça:** ligue no `app.module.ts`:

```ts
import { validarEnv } from "./config/esquema-env";

ConfigModule.forRoot({
  isGlobal: true,
  validate: validarEnv,
}),
```

### 14c. Testar a falha, que é o ponto da etapa

**Faça:** comente a linha `NOME_BIBLIOTECA` no `.env` e salve.

**Deu certo se:** a aplicação **não sobe**, e no meio do erro aparecem estas duas linhas:

```
Error: Variáveis de ambiente inválidas:
  - NOME_BIBLIOTECA é obrigatória
```

Descomente e ela volta. Depois experimente mais duas:

| No `.env` | Mensagem esperada |
|---|---|
| `NOME_BIBLIOTECA=` (vazia) | `não pode ficar vazia` |
| `NODE_ENV=prod` | o `z.enum` recusa e lista os valores aceitos |

> Você vai ver um *stack trace* embaixo da mensagem. É normal — o Nest imprime a pilha de
> qualquer erro de inicialização. A linha que interessa é a primeira.

> **Por que isto vale 15 minutos de aula:** um serviço que não sobe é um problema óbvio, que
> alguém resolve em dois minutos lendo a mensagem. Um serviço que sobe pela metade é um
> problema caro, que aparece na frente do usuário e leva horas para ser rastreado até uma
> variável faltando.

---

## Etapa 15 — O prefixo `/api` (10 min)

**Faça:** em `src/main.ts`, uma linha entre o `create` e o `listen`:

```ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");                    // ← nova
await app.listen(process.env.PORT ?? 3000);
```

| Linha | O que faz |
|---|---|
| `setGlobalPrefix("api")` | Toda rota passa a começar em `/api`. As obras vão de `/obras` para `/api/obras` |

**Rode:**

```bash
curl -i http://localhost:3000/api/obras
curl -i http://localhost:3000/obras
```

**Deu certo se:** a primeira responde **200** e a segunda, que funcionava até agora,
responde **404**.

**Por que fazer isso hoje, e não depois:** no M16 o backend e o frontend vão para o mesmo
domínio, com `/api/*` indo para a API e todo o resto para a aplicação React. Sem um prefixo
que separe os dois, não há como rotear. Definir agora custa uma linha; definir no M16
custaria reescrever todas as URLs que o frontend do M08 já tiver escrito.

---

## Etapa 16 — Documentação automática (15 min)

O M02 falou em **contrato de API**. Aqui ele deixa de ser conversa.

### 16a. Instalar e isolar a configuração

**Faça:**

```bash
pnpm add @nestjs/swagger
```

A configuração vai ser usada em **dois lugares** — a página interativa e o arquivo do
schema. Escreva uma vez só, em `src/swagger.ts`:

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
| `DocumentBuilder` | Monta os metadados: título, descrição, versão. Os pontos encadeados são *method chaining* — cada método devolve o próprio objeto |
| `.build()` | Fecha a construção e devolve o objeto de configuração |
| `createDocument(app, config)` | **Varre a aplicação inteira** e monta o schema OpenAPI a partir dos decorators dos controllers |

### 16b. A página interativa

**Faça:** em `src/main.ts`, entre o prefixo e o `listen`:

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

Ninguém escreveu essa documentação. Ela saiu dos `@Controller` e `@Get` que você escreveu
nas etapas 9 e 11 — os mesmos decorators, lidos por outra ferramenta.

### 16c. Gravar o schema em arquivo

A página serve para pessoas. O **M15** precisa do schema como arquivo, para gerar os tipos
do frontend a partir dele.

**Faça:** crie `src/gerar-schema.ts`:

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
| `setGlobalPrefix("api")` | Precisa repetir aqui: este script monta a aplicação por conta própria, e sem esta linha as rotas sairiam sem `/api` no schema |
| `JSON.stringify(x, null, 2)` | Converte para texto. O `2` é a indentação — sem ele, o arquivo sai numa linha só e o `git diff` fica inútil |
| `app.close()` | Encerra a aplicação. **Sem isto o script não termina** e fica pendurado no terminal |

**Faça:** o atalho, em `backend/package.json`, ao lado dos scripts que já estão lá:

```json
"scripts": {
  "gerar:schema": "nest build && node dist/gerar-schema.js"
}
```

| Trecho | O que faz |
|---|---|
| `nest build` | Compila o TypeScript para `dist/`. É o mesmo comando do `pnpm build` |
| `&&` | Só roda o segundo se o primeiro der certo. Erro de compilação para aqui |
| `node dist/gerar-schema.js` | Executa o arquivo **compilado** — repare no `.js` |

> Por que compilar antes em vez de rodar o `.ts` direto: o Node não executa TypeScript. Dá
> para contornar com o `ts-node`, que até já vem instalado no projeto, mas aí seriam duas
> formas de rodar o mesmo código no repositório. O `nest build` já está aí desde a etapa 2, e
> é o que o CI vai usar no M14.

**Rode:**

```bash
pnpm gerar:schema
```

**Deu certo se:** aparece `openapi.json gerado`, e o arquivo `backend/openapi.json` contém
`"/api/obras"`.

Repare que **nenhum servidor subiu**: o `NestFactory.create` monta a árvore de módulos em
memória, o Swagger a percorre, e pronto. É por isso que o comando roda em segundos e serve
para rodar no CI a cada *pull request*.

Esse arquivo é o **contrato** de que o M02 falou. No M07 ele ganha os formatos de entrada e
saída; no M15, vira os tipos do frontend. Como nasce do código, não tem como divergir dele.

---

## Etapa 17 — O mapa que você percorreu (5 min)

Agora o diagrama faz sentido, porque você construiu três das caixas:

```
GET /api/obras/42
    │
    ▼
[ Middleware ]      logging, helmet                        ○ M13
    │
    ▼
[ Guard ]           "pode entrar?" — autenticação/papel    ○ M12
    │
    ▼
[ Pipe ]            ParseIntPipe                           ● etapa 11
    │
    ▼
[ Controller ]      acervo.buscarUm(42)                    ● etapa 11
    │
    ▼
[ Service ]         regra de negócio, lança 404            ● etapa 12
    │
    ▼
[ Repository ]      SELECT ... WHERE id = 42               ○ M06
    │
    ▼
[ Interceptor ]     molda a resposta                       ○ M07
    │
    ▼
JSON
```

**● o que você já tem · ○ o que os próximos módulos acrescentam.**

Nenhuma das caixas vazias exige mexer nas que você construiu — elas se **encaixam** em volta.
É isso que a estrutura imposta pelo framework comprou: quatro pessoas podem preencher caixas
diferentes na mesma semana sem colidir.

Guarde o diagrama. Cada módulo daqui em diante preenche uma caixa, e o M13 volta a ele para
mostrar em que camada cada tipo de ataque é barrado.

💼 **No mercado:** "explique injeção de dependência" e "onde você colocaria esta regra" são
perguntas de entrevista para vaga júnior de Node. Quem responde com o critério da etapa 10a
— *"se o código não mudaria vindo de um comando de terminal, é service"* — se destaca de
quem responde "no service, porque sim".

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Nest can't resolve dependencies of the AcervoController (?)` | O `AcervoService` não está em `providers` do `AcervoModule`. O `?` marca a posição do parâmetro que ele não resolveu |
| A rota responde em `/acervo` e não em `/obras` | A CLI usou o nome do módulo como prefixo. Troque no `@Controller(...)` — etapa 8 |
| `/obras/nome` responde 400 | Rota literal declarada depois de `@Get(":id")`. O `ParseIntPipe` tentou converter `"nome"` |
| `/obras/1` responde 404 numa obra que existe | Faltou o `ParseIntPipe`. O `id` chegou como `"1"`, e `"1" === 1` é `false` |
| A rota responde 404 depois da etapa 15 | Faltou o prefixo `/api` na URL que você chamou |
| `Cannot find module './acervo.service'` | Import com caminho errado, ou o arquivo não foi salvo |
| Alterou o `.env` e nada mudou | O `.env` é lido na **inicialização**. Reinicie o `start:dev` |
| A aplicação sobe mesmo faltando variável no `.env` | O `validate` não foi ligado no `ConfigModule` — etapa 14b |
| `pnpm gerar:schema` não termina | Faltou `await app.close()` no fim do script |
| `openapi.json` sai com rotas sem `/api` | Faltou `setGlobalPrefix("api")` dentro do `gerar-schema.ts` |
| Um segundo `.git` apareceu dentro de `backend/` | Faltou `--skip-git` no `nest new`. Apague `backend/.git` |
| `EADDRINUSE: address already in use :::3000` | Já há um servidor na porta. Encerre-o ou use outra porta |

## ✅ Checklist de saída

- [ ] `GET /api/obras` responde 200 com a lista
- [ ] `GET /api/obras/1` responde 200 com um objeto
- [ ] `GET /api/obras/abc` responde **400**, vindo do `ParseIntPipe`
- [ ] `GET /api/obras/999` responde **404**, sem você ter escrito o número 404
- [ ] O controller **não** contém dados nem regra de negócio
- [ ] `.env` fora do Git; `.env.example` dentro, com as mesmas chaves
- [ ] A aplicação **não sobe** se faltar variável obrigatória — você testou
- [ ] `/api/docs` abre e lista os endpoints
- [ ] `pnpm gerar:schema` grava o `openapi.json`
- [ ] Você viu o erro `Nest can't resolve dependencies` de propósito (etapa 10d)
- [ ] Você fez o experimento do `ParseIntPipe` (etapa 11d) e sabe explicar o resultado
- [ ] Você sabe explicar, em uma frase, o que a injeção de dependência resolve

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — documentação oficial](https://docs.nestjs.com/)
- [NestJS — Providers e injeção de dependência](https://docs.nestjs.com/providers)
- [TypeScript — decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [pnpm workspaces](https://pnpm.io/workspaces)
