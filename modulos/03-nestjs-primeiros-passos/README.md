# M03 — NestJS: a primeira API, passo a passo

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 3** · **Pré-requisitos:** M01, M02

Este é o primeiro código do backend, e o primeiro TypeScript da disciplina. Ao final existe
uma API que responde de verdade, e você entende cada linha dela.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 5, 6, 7, 11 e 20 —
> em que a gente para de digitar e lê — mais as explicações dentro de cada etapa. Conceito
> chega quando o código pede, e não antes.

## 🎯 Objetivos

Ao final você será capaz de:

1. Ler um projeto NestJS e dizer o que cada arquivo faz.
2. Explicar o que é um **decorator** e por que o framework depende deles.
3. **Justificar** a separação em module, controller e service — não só descrevê-la.
4. Explicar o que **injeção de dependência** resolve, tendo visto o problema antes da solução.
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

Vinte etapas curtas, em ordem. Nenhum comando tem mais que uma linha. Cada etapa tem sempre
as mesmas quatro partes:

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** do que você acabou de escrever |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

**Não pule para a frente.** Cada etapa assume que a anterior funcionou, e várias delas
existem para você ver um erro de propósito — o erro é o conteúdo.

### 🪟 Sobre o sistema operacional

Os comandos deste módulo são **os mesmos no Windows, no macOS e no Linux**, com uma exceção:

| No PowerShell (Windows) | No macOS / Linux / Git Bash |
|---|---|
| `curl.exe` | `curl` |

No PowerShell, `curl` é apelido de outro programa (`Invoke-WebRequest`) e não aceita os
mesmos parâmetros. **Escrevendo `curl.exe` você chama o programa certo.** Daqui em diante o
material escreve `curl.exe`; no macOS e no Linux, apague o `.exe`.

> Esta é uma das cinco diferenças do Windows que valem a pena conhecer. As outras estão em
> [`recursos/comandos-windows.md`](../../recursos/comandos-windows.md), para consultar quando
> aparecerem.

### As vinte etapas

| # | Etapa | Min | O que entra |
|---|---|---|---|
| 1 | [Conferir as ferramentas](#etapa-1--conferir-as-ferramentas-5-min) | 5 | — |
| 2 | [Instalar a CLI do Nest](#etapa-2--instalar-a-cli-do-nest-5-min) | 5 | o que é uma CLI |
| 3 | [Criar o projeto](#etapa-3--criar-o-projeto-10-min) | 10 | `nest new` |
| 4 | [Subir o servidor](#etapa-4--subir-o-servidor-10-min) | 10 | scripts, recarga automática |
| 5 | [Ler o `main.ts`](#etapa-5--ler-o-maints-15-min) | 15 | `import`/`export`, `await`, **a regra do `.js`** |
| 6 | [Ler o controller e o service](#etapa-6--ler-o-controller-e-o-service-15-min) | 15 | **decorators** |
| 7 | [Ler o módulo](#etapa-7--ler-o-módulo-10-min) | 10 | `@Module` e suas três listas |
| 8 | [A primeira mudança sua](#etapa-8--a-primeira-mudança-sua-5-min) | 5 | editar → salvar → ver |
| 9 | [Criar o seu módulo](#etapa-9--criar-o-seu-módulo-15-min) | 15 | `nest generate` |
| 10 | [O primeiro endpoint seu](#etapa-10--o-primeiro-endpoint-seu-15-min) | 15 | rota própria, JSON |
| 11 | [**Por que separar em camadas**](#etapa-11--por-que-separar-em-camadas-20-min) | 20 | **o porquê das camadas** |
| 12 | [Mover os dados para o service](#etapa-12--mover-os-dados-para-o-service-15-min) | 15 | service |
| 13 | [Como o controller recebe o service](#etapa-13--como-o-controller-recebe-o-service-20-min) | 20 | **injeção de dependência** |
| 14 | [Parâmetro na URL](#etapa-14--parâmetro-na-url-20-min) | 20 | `@Param`, **pipes** |
| 15 | [Responder 404](#etapa-15--responder-404-15-min) | 15 | exceções de domínio |
| 16 | [Configuração fora do código](#etapa-16--configuração-fora-do-código-15-min) | 15 | `.env`, `ConfigModule` |
| 17 | [Não subir quebrado](#etapa-17--não-subir-quebrado-10-min) | 10 | validação na inicialização |
| 18 | [O prefixo `/api`](#etapa-18--o-prefixo-api-5-min) | 5 | `setGlobalPrefix` |
| 19 | [Documentação automática](#etapa-19--documentação-automática-10-min) | 10 | Swagger / OpenAPI |
| 20 | [O mapa que você percorreu](#etapa-20--o-mapa-que-você-percorreu-5-min) | 5 | — |

---

## Etapa 1 — Conferir as ferramentas (5 min)

Antes de criar qualquer coisa, confirme que o Node está instalado e que você está na pasta
certa.

**Faça:**

```powershell
node --version
```

```powershell
npm --version
```

**Deu certo se:** o primeiro responde `v20.` ou superior, e o segundo `10.` ou superior.

**Linha a linha:**

| Comando | O que é |
|---|---|
| `node` | O programa que **executa** JavaScript fora do navegador. É ele que vai rodar a sua API |
| `npm` | O gerenciador de pacotes. Instala bibliotecas e roda os atalhos do projeto. **Vem junto com o Node** — você não instalou separado |

> Se algum dos dois responder "não é reconhecido como um comando", o Node não está instalado
> ou o terminal foi aberto antes da instalação. Feche e reabra o terminal primeiro; se
> continuar, volte ao [guia de setup](../../docs/ambiente-setup-windows.md#passo-4--nodejs-e-npm).

Agora vá para a pasta do projeto, criada no M00:

```powershell
cd C:\dev\bibliocom
```

*(No macOS ou Linux: `cd ~/dev/bibliocom`.)*

**Deu certo se:** existe um `package.json` nessa pasta. Confira abrindo-o no VS Code — ele
deve ter um campo `workspaces` listando `backend`, `frontend` e `pacotes/*`.

Essas pastas ainda não existem, e é normal: `backend/` nasce daqui a duas etapas,
`frontend/` no M08 e `pacotes/tipos/` no M15. O campo `workspaces` é uma **declaração de
intenção** — ele diz ao npm onde procurar projetos quando eles existirem.

---

## Etapa 2 — Instalar a CLI do Nest (5 min)

**Faça:**

```powershell
npm install -g @nestjs/cli@12
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `npm install` | Instala um pacote |
| `-g` | *global*: instala **na sua máquina**, não dentro de um projeto. Assim o comando `nest` fica disponível em qualquer pasta |
| `@nestjs/cli` | O pacote. O `@nestjs/` é um *escopo*: um prefixo que agrupa os pacotes oficiais do projeto Nest |
| `@12` | **A versão.** Sem isto você receberia a mais recente, que hoje é a 12 mesmo — mas amanhã pode ser a 13 |

**Deu certo se:**

```powershell
nest --version
```

responde `12.` seguido de outros números.

### Por que uma CLI, e por que fixar a versão

Uma **CLI** (*Command Line Interface*) é um programa que você usa pelo terminal. Esta faz
duas coisas para você: cria a estrutura inicial do projeto e gera arquivos novos já
registrados nos lugares certos. Nada que ela faz é obrigatório — dá para escrever todos os
arquivos à mão, e o exercício E03.3 pede exatamente isso. Ela apenas evita a digitação
repetitiva e, principalmente, evita esquecimentos de registro.

O `@11` merece uma frase própria. **Uma turma inteira precisa produzir o mesmo projeto.** Sem
fixar a versão, quem instalar hoje e quem instalar em novembro receberiam versões diferentes,
com arquivos gerados diferentes — e o material deixaria de bater com a tela de metade da
sala. Fixar versão em material didático é o mesmo cuidado que se toma em produção, e pelo
mesmo motivo: previsibilidade vale mais que novidade.

> 📌 **Nota para quem for atualizar este material.** Quando o Nest 13 sair, troque o `@12`
> aqui e confira três pontos: se a CLI continua gerando os `import` com `.js` (etapa 5), se
> os pacotes `@nestjs/*` acompanham a mesma versão principal, e se o executor de testes do
> M14 continua sendo o Vitest.

---

## Etapa 3 — Criar o projeto (10 min)

**Faça:**

```powershell
nest new backend --skip-git
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `nest new` | Cria um projeto novo, com a estrutura padrão |
| `backend` | O nome da pasta que vai nascer |
| `--skip-git` | **Importante.** Sem isto a CLI cria um repositório Git **dentro** do seu, e você passa meia hora sem entender por que o `git status` da raiz ignora tudo que está em `backend/` |

A CLI vai **perguntar** qual gerenciador de pacotes usar:

```
? Which package manager would you ❤️ to use?
> npm
  yarn
  pnpm
```

**`npm` já vem selecionado. Aperte Enter.**

Ela então lista os arquivos criados e instala as dependências. Na primeira vez leva um ou
dois minutos — está baixando o Nest inteiro.

**Deu certo se:** apareceu `🚀 Successfully created project backend`, e agora existe uma
pasta `backend` com uma pasta `src` dentro dela.

⚠️ **Confira que não existe `backend\.git`.** No VS Code, com "mostrar arquivos ocultos"
ligado, ela não deve aparecer. Se apareceu, apague essa pasta e siga — nada mais quebra por
causa disso.

---

## Etapa 4 — Subir o servidor (10 min)

**Faça:**

```powershell
cd backend
```

```powershell
npm run start:dev
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `npm run` | Executa um *script* declarado no `package.json` |
| `start:dev` | O nome do script. Abra o `package.json` e procure `"scripts"`: você vai ver que `start:dev` é um apelido para `nest start --watch` |
| `--watch` (dentro do script) | Fica observando os arquivos. A cada `Ctrl+S`, recompila e reinicia sozinho |

Este comando **ocupa o terminal** e não devolve o cursor — ele fica rodando. Deixe-o numa
janela e abra **outra** para os comandos das próximas etapas. No VS Code, o `+` no painel de
terminal abre a segunda.

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

## Etapa 5 — Ler o `main.ts` (15 min)

Pare de digitar. As etapas 5, 6 e 7 são de leitura: são **quatro arquivos pequenos**, e o
`Hello World!` que você acabou de ver sai deles.

> Em `src` você vai contar cinco arquivos. O quinto é o `app.controller.spec.ts`, um teste
> que a CLI deixa de brinde. Ignore-o por enquanto — ele é assunto do M14.

Abra `src\main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `import { X } from "y"` | Traz a coisa chamada `X` de dentro do módulo `y`. As chaves indicam **exportação nomeada** — `y` exporta várias coisas e você quer só essa |
| `from "@nestjs/core"` | Sem `./` na frente: é um **pacote** de `node_modules`, baixado pelo npm |
| `from "./app.module.js"` | Com `./`: é um arquivo **seu**. E termina em `.js` — leia o quadro abaixo, é a pergunta que todo mundo faz |
| `async function` | Marca a função como assíncrona. Só dentro de uma função `async` é possível usar `await`… |
| `await bootstrap()` | …**ou no topo do arquivo**, como aqui. Um módulo ESM pode usar `await` fora de qualquer função |
| `NestFactory.create(AppModule)` | **A linha central do arquivo.** Monta a aplicação inteira a partir de **um único módulo** |
| `app.listen(...)` | Começa a escutar requisições HTTP. Antes desta linha, a aplicação existe mas não atende ninguém |
| `process.env.PORT` | Lê a variável de ambiente `PORT`. O `process` é um objeto global do Node |
| `?? 3000` | "Se o valor da esquerda for `null` ou `undefined`, use 3000." Diferente de `\|\|`, que também trocaria `0` e `""` |

### 5a. Por que o import termina em `.js` se o arquivo é `.ts`

Esta é a pergunta que o arquivo provoca, e ela tem uma resposta curta e uma regra.

**A resposta curta:** o TypeScript **não reescreve caminhos de import**. Ele só apaga os
tipos e entrega o arquivo ao Node. Quando você roda `npm run build`, o `src/app.module.ts`
vira `dist/app.module.js` — e é esse nome que vai existir na hora em que o programa rodar.
O import precisa apontar para o arquivo que **vai existir**, não para o que você está
editando.

```
você escreve      src/app.module.ts
compila para      dist/app.module.js      ← é este que o Node carrega
logo, o import    "./app.module.js"
```

**A regra, que vale para o curso inteiro:**

| Importando… | Como escrever | Exemplo |
|---|---|---|
| um arquivo **seu** | com `.js` no fim | `from "./acervo.service.js"` |
| um **pacote** instalado | sem extensão | `from "@nestjs/common"` |

Duas coisas que ajudam a não sofrer com isso:

1. **A CLI escreve sozinha.** Todo arquivo gerado por `nest generate` já vem com os imports
   certos. Você só escreve à mão quando acrescenta um import novo.
2. **O erro é sempre o mesmo, e ele te dá a resposta.** Se esquecer, o TypeScript avisa:

   ```
   error TS2835: Relative import paths need explicit file extensions in ECMAScript
   imports when '--moduleResolution' is 'node16' or 'nodenext'.
   Did you mean './acervo.service.js'?
   ```

   A última linha é literalmente o que você deve escrever. É um dos erros mais gentis que
   você vai encontrar no curso — aproveite, porque nem todos são assim.

> Isso se chama **ESM** (*ECMAScript Modules*), o sistema de módulos oficial do JavaScript.
> O frontend que você vai escrever a partir do M08 já usa ESM também — então backend e
> frontend passam a falar a mesma língua, em vez de duas.

**O que reter da etapa:** toda a aplicação sai de **um** módulo, o `AppModule`. Tudo o que
você criar daqui em diante vai, direta ou indiretamente, pendurar nele.

---

## Etapa 6 — Ler o controller e o service (15 min)

Estes dois arquivos são de onde o texto `Hello World!` realmente vem.

### 6a. `src\app.controller.ts`

```ts
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service.js";

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
| `constructor(private readonly appService: AppService)` | Recebe um `AppService` já pronto. **Volte a esta linha na etapa 13** — ela é o assunto do módulo inteiro |
| `private readonly` | Atalho do TypeScript: declara a propriedade `this.appService` **e** atribui o valor, numa linha só |
| `@Get()` | Marca o método como resposta a requisições `GET` |
| `getHello(): string` | O `: string` depois dos parênteses é o **tipo de retorno**. Devolver um número aqui seria erro apontado antes de rodar |
| `return this.appService.getHello()` | O controller **não produz o texto**: pede a quem sabe |

### 6b. `src\app.service.ts`

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
novo, e a etapa 13 explica o que ele faz.

### 6c. O conceito: o que é um decorator

Você viu três coisas começando com `@`. Elas têm nome: **decorators**.

Um decorator é **uma função que anexa informação a uma classe ou a um método**. Ele não
executa o método, não muda o que ele faz e não é mágica — ele **registra** algo.

```ts
@Get()                 // registra: "este método responde a GET"
getHello(): string {}
```

Quando a aplicação sobe, o Nest **lê esses registros** e monta a tabela de rotas a partir
deles. É exatamente por isso que o terminal, ao iniciar, imprime:

```
[RouterExplorer] Mapped {/, GET} route
```

Ele está lendo o que os decorators anexaram e anunciando o que encontrou.

| Pergunta comum | Resposta |
|---|---|
| O `@` é do TypeScript ou do Nest? | Da linguagem. O Nest só define **quais** decorators existem e o que fazer com eles |
| Por que os parênteses em `@Get()`? | Porque é uma chamada de função. `@Get()` chama sem argumento; `@Get(":id")` passa o caminho |
| Onde mais vou ver isso? | Em `@Entity()` no M04 e em `@IsString()` no M07. **Um mecanismo, três usos** |

**Não decore os decorators.** Cada um vai aparecer no momento em que resolve um problema
seu, e é aí que ele gruda.

---

## Etapa 7 — Ler o módulo (10 min)

Falta o arquivo que amarra os outros três. Abra `src\app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

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
main.ts        cria a app a partir do AppModule
AppModule      declara AppController (rotas) e AppService (provider)
AppController  @Get() na raiz, pede o texto ao AppService
AppService     devolve "Hello World!"
```

**Esse é o projeto inteiro.** Quatro arquivos, cada um com uma responsabilidade. Tudo que
vem depois é mais do mesmo, em maior quantidade.

---

## Etapa 8 — A primeira mudança sua (5 min)

Antes de acrescentar conceito, feche o ciclo básico: editar, salvar, ver o resultado.

**Faça:** em `src\app.service.ts`, troque o texto:

```ts
return "BiblioCom no ar";
```

**Rode:** salve o arquivo e olhe o terminal do `start:dev`. Ele imprime

```
File change detected. Starting incremental compilation...
```

e reinicia sozinho. Atualize o navegador.

**Deu certo se:** a página mostra `BiblioCom no ar`, sem você ter reiniciado nada à mão.

> **Se este passo falhar, pare aqui.** Nada das próximas etapas vai funcionar, e o problema
> é de ambiente, não de código. Confira se o `start:dev` ainda está rodando naquela outra
> janela — é comum tê-lo fechado sem perceber.

---

## Etapa 9 — Criar o seu módulo (15 min)

O `AppModule` é a raiz. Coisas de verdade ficam em módulos próprios, um por área do domínio.
O nosso se chama **acervo**.

**Faça** — três comandos curtos, um de cada vez:

```powershell
nest generate module acervo
```

```powershell
nest generate controller acervo --no-spec
```

```powershell
nest generate service acervo --no-spec
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `generate module acervo` | Cria `src\acervo\acervo.module.ts` **e** o registra no `imports` do `app.module.ts` |
| `generate controller acervo` | Cria o controller **e** o registra em `controllers` do `AcervoModule` |
| `generate service acervo` | Cria o service **e** o registra em `providers` |
| `--no-spec` | Pula o arquivo de teste. Eles entram no M14, com o conteúdo que os justifica |

**Rode:** abra `src\acervo\acervo.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { AcervoController } from "./acervo.controller.js";
import { AcervoService } from "./acervo.service.js";

@Module({
  controllers: [AcervoController],
  providers: [AcervoService],
})
export class AcervoModule {}
```

**Este arquivo é a peça que faz tudo funcionar.** Confira também o `app.module.ts`: o
`AcervoModule` apareceu no `imports` sozinho.

Repare no que a CLI fez de mais valioso: **os registros**. Ela não só criou três arquivos —
ela os anunciou nos lugares certos, em dois módulos diferentes. É justamente isso que se
esquece ao criar arquivo à mão, e o erro que aparece quando falta **não menciona registro
nenhum**. Você vai provocar esse erro de propósito na etapa 13.

Os outros dois arquivos vieram quase vazios:

```ts
// acervo.controller.ts
@Controller("acervo")
export class AcervoController {}
```

```ts
// acervo.service.ts
@Injectable()
export class AcervoService {}
```

⚠️ **Um ajuste antes de seguir.** A CLI usou o nome que você passou (`acervo`) como prefixo
de rota. Nós queremos `/obras`. Troque:

```ts
@Controller("obras")
```

> Módulo e rota não precisam ter o mesmo nome, e frequentemente não têm. O módulo organiza o
> **código**; a rota nomeia o **recurso** que o cliente enxerga. Aqui o módulo cuida do
> acervo, e o recurso que ele publica é a obra.

---

## Etapa 10 — O primeiro endpoint seu (15 min)

Agora você escreve. Comece pelo mais simples que existe: uma rota que devolve uma lista fixa.

**Faça:** em `src\acervo\acervo.controller.ts`:

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

**Rode:** abra <http://localhost:3000/obras> no navegador.

**Deu certo se:** aparece o array em JSON.

**Repare no que você não escreveu:**

| Você não escreveu | Quem fez |
|---|---|
| `res.json(...)` | O Nest converteu o array em JSON sozinho |
| `Content-Type: application/json` | O Nest pôs o cabeçalho ao ver que você devolveu um objeto |
| `status(200)` | 200 é o padrão para `GET` |

Você devolveu um valor e o framework cuidou do HTTP. Essa é a diferença prática entre o Nest
e o Express da conversa do M02.

---

## Etapa 11 — Por que separar em camadas (20 min)

Pare o teclado. Esta etapa é a mais importante do módulo, e ela é de raciocínio.

O endpoint da etapa 10 **funciona**. Devolve o que deveria, com o status certo. Então por que
todo material de NestJS insiste que os dados não podem ficar ali?

A resposta honesta não é "porque é a boa prática". É que existem quatro situações concretas
em que essa escolha cobra a conta — e todas as quatro vão acontecer nesta disciplina.

### Situação 1 — o mesmo dado é preciso em outro lugar

No M12 vai existir um relatório de acervo para a coordenação. Ele precisa da lista de obras,
mas **não é uma requisição HTTP** — é uma tela diferente, com outro formato de saída.

Com a lista dentro do `listar()` do controller, só há duas saídas: chamar um método de
controller a partir de outro controller (que arrasta consigo o `@Get`, a rota, o status) ou
**copiar a lista**. Todo mundo copia. Aí existem duas cópias, alguém corrige uma, e a outra
fica errada em silêncio.

### Situação 2 — testar a regra exige subir um servidor

No M14 você vai testar a regra "um associado não pode ter mais de três empréstimos em
aberto". Se essa regra morar no controller, testá-la exige:

```
subir a aplicação → montar uma requisição HTTP → mandar → ler a resposta → interpretar o status
```

Cinco passos, um servidor de pé, e um teste lento que quebra por motivos que nada têm a ver
com a regra: porta ocupada, JSON malformado, rota renomeada.

Se a regra mora no service, o teste é:

```ts
expect(() => servico.emprestar(exemplar, associadoComTres)).toThrow();
```

Uma linha, sem rede, sem servidor. **A separação em camadas é, na prática, o que torna o
teste barato** — e teste caro é teste que ninguém escreve.

### Situação 3 — a fonte dos dados vai mudar

No M04 a lista sai de um array e passa a vir do PostgreSQL. Essa é uma mudança **grande**:
entra uma conexão, entram consultas, entra tratamento de erro de banco.

Se o dado estiver no controller, tudo isso desemboca no arquivo que também cuida de rota,
status e parâmetro de URL — que era de 10 linhas e vira de 60. Com o service no meio, a troca
acontece **só dentro dele**, e o controller não muda **uma vírgula**.

Isso não é promessa: no M06 você vai fazer exatamente essa troca e conferir que o controller
continua igual. Guarde para comparar.

### Situação 4 — duas pessoas mexendo na mesma semana

Numa equipe de quatro, alguém está criando rotas e alguém está escrevendo regra de negócio.
Em arquivos separados, os dois trabalham em paralelo e o Git mescla sem conflito. No mesmo
arquivo, os dois editam as mesmas linhas — e o M00 já mostrou como termina.

### A regra, e como decidir

Dessas quatro situações sai a divisão que o Nest impõe:

| Peça | Responsabilidade | O que **não** deve fazer |
|---|---|---|
| **Module** | Agrupar o que pertence a um domínio e declarar o que ele expõe | Conter lógica |
| **Controller** | Traduzir HTTP ↔ chamada de método: ler rota, corpo e query; devolver dados | Falar com o banco, conter regra de negócio |
| **Service** (provider) | A regra de negócio e o acesso a dados | Saber que HTTP existe |

E a pergunta que resolve 90% das dúvidas de "onde eu ponho este código?":

> Se este código precisasse rodar a partir de um **comando de terminal**, em vez de uma
> requisição HTTP, ele mudaria?
>
> **Se não muda, é Service. Se muda, é Controller.**

Aplique aos casos que você já viu:

| Código | Muda sem HTTP? | Camada |
|---|---|---|
| A lista de obras | Não. É a mesma lista de qualquer origem | **Service** |
| Converter `:id` da URL em número | Sim. Sem URL não há `:id` | **Controller** |
| Decidir que obra sem exemplar não empresta | Não. É regra da biblioteca | **Service** |
| Escolher que a resposta do POST é 201 | Sim. Status é conceito de HTTP | **Controller** |

### O que acontece quando não se separa

Este é o ponto do M02 com nome e endereço. Um projeto Express típico começa assim:

```ts
app.get("/obras", (req, res) => { /* consulta o banco, valida, responde */ });
```

Funciona lindamente na semana 3. Na semana 12, com 40 rotas, isso é um arquivo de 800 linhas
onde ninguém acha nada, nada é testável isoladamente e cada pessoa da equipe organizou do seu
jeito.

**O NestJS impõe a estrutura, e a imposição é o produto.** Não é que ele saiba organizar
melhor que você; é que ele organiza **igual para todo mundo**, e é isso que permite quatro
pessoas mexerem no mesmo backend sem colidir — e você voltar ao seu próprio código seis meses
depois e ainda entendê-lo.

As próximas duas etapas aplicam essa decisão ao endpoint que você acabou de escrever.

---

## Etapa 12 — Mover os dados para o service (15 min)

**Faça:** em `src\acervo\acervo.service.ts`:

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
| `private obras: Obra[]` | Propriedade da classe. `Obra[]` é "array de Obra"; `private` impede acesso de fora |
| `listar(): Obra[]` | Se você errar e devolver outra coisa, o TypeScript acusa antes de rodar |
| o comentário | Vale a pena escrever: ele diz ao leitor que o array é **provisório**, e até quando |

**Deu certo se:** o arquivo salva sem erro. A rota ainda responde a lista antiga — o
controller ainda não sabe que o service existe. É a próxima etapa.

---

## Etapa 13 — Como o controller recebe o service (20 min)

### 13a. A forma que não usamos

O controller precisa do service. O jeito direto seria:

```ts
export class AcervoController {
  private acervo = new AcervoService();   // ❌
}
```

Funciona. E é ruim por dois motivos concretos:

1. **O controller fica soldado a essa implementação.** Num teste (M14), não há como trocar o
   service por um dublê — a linha `new` está dentro dele, e o teste não alcança.
2. **Quando o service passar a precisar de coisas**, como a conexão de banco do M04, o
   controller passa a ter de saber montá-las. E quem cria o controller, também. A ignorância
   se espalha para cima.

### 13b. A forma do Nest

A dependência **chega pronta**, pelo construtor.

**Faça:** em `src\acervo\acervo.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import { AcervoService } from "./acervo.service.js";

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
| `private readonly acervo` | Atalho do TypeScript: declara e atribui `this.acervo` numa linha |
| `: AcervoService` | **É por este tipo que o Nest identifica o que entregar.** Ele lê o tipo do parâmetro, procura quem está declarado em `providers` e entrega uma instância pronta |
| `@Injectable()` no service | Sem ele, o Nest não guarda os metadados necessários e não consegue criar a classe |
| ausência de `new` | Em nenhum lugar do seu código existe `new AcervoService()` |

Isso é **injeção de dependência**: a classe declara *o que precisa*, não *como conseguir*.

**Rode:** atualize <http://localhost:3000/obras> no navegador.

**Deu certo se:** responde as duas obras, exatamente como antes. O comportamento visível é o
mesmo da etapa 10 — o que mudou foi **onde o dado mora**, que é tudo o que a etapa 11
argumentou.

### 13c. A prova de que a injeção é real

Até aqui, "o Nest entrega o service" é uma afirmação. Vamos verificá-la quebrando.

**Faça:** em `src\acervo\acervo.module.ts`, comente o `AcervoService` da lista `providers`:

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
| `(?)` | A posição do parâmetro que não resolveu. Com dois parâmetros e o segundo faltando, seria `(AcervoService, ?)` |
| `at index [0]` | O primeiro parâmetro do construtor |
| `is available in the AcervoModule module` | **Onde procurar:** a lista `providers` daquele módulo |

Descomente e o servidor volta.

Guarde este erro: é o mais comum deste módulo e do M04, e a causa é quase sempre a mesma —
alguém criou uma classe e esqueceu de registrá-la em `providers`.

**Três consequências práticas**, agora que você viu como funciona:

1. **Testar fica barato** — o teste passa um dublê no lugar do service (M14). É a situação 2
   da etapa 11, resolvida.
2. **Uma instância só** (*singleton*), reaproveitada em toda a aplicação.
3. **Trocar a implementação não toca quem usa** — é a situação 3 da etapa 11, e você vai
   comprová-la no M06.

---

## Etapa 14 — Parâmetro na URL (20 min)

Listar todas é fácil. Buscar uma exige ler um pedaço da URL.

### 14a. O método no service

**Faça:**

```ts
buscarUm(id: number): Obra | undefined {
  return this.obras.find((o) => o.id === id);
}
```

`Obra | undefined` é um **tipo de união**: "ou uma Obra, ou nada". O `find` do JavaScript
devolve `undefined` quando não encontra, e o tipo diz isso em voz alta.

### 14b. A rota no controller

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

### 14c. O conceito: o que é um pipe

Um **pipe** é uma peça que roda **entre a requisição e o seu método**. Ele recebe o valor que
chegou e devolve o valor que o método vai receber — convertendo, validando, ou as duas coisas.

O `ParseIntPipe` pega a string vinda da URL e tenta convertê-la em número. Se conseguir,
entrega o número; se não conseguir, **responde 400 sozinho** e o seu método nunca é chamado.

### 14d. Ver os dois casos

Aqui o navegador não basta: precisamos ver o **código de status**, e o navegador mostra só o
corpo. É a hora do `curl`.

**Faça** — na segunda janela do terminal:

```powershell
curl.exe -i http://localhost:3000/obras/1
```

```powershell
curl.exe -i http://localhost:3000/obras/abc
```

*(No macOS ou Linux: `curl` sem o `.exe`.)*

| Trecho | O que faz |
|---|---|
| `curl.exe` | Faz uma requisição HTTP pelo terminal e imprime a resposta |
| `-i` | *include*: mostra também os **cabeçalhos**, e é na primeira linha deles que está o status |

**Deu certo se:** a primeira devolve `HTTP/1.1 200 OK` e o objeto; a segunda devolve
`HTTP/1.1 400 Bad Request` com

```json
{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}
```

Esse 400 veio do pipe. Você não escreveu nenhum `if`, nenhum `isNaN`, nenhum `try`.

### 14e. Experimento: tire o pipe

**Faça:** troque por `@Param("id") id: number`, deixando o tipo `number` no lugar. Salve e
chame `/obras/1` de novo.

Anote o que acontece e por quê. (A resposta está no gabarito de
[`exercicios.md`](exercicios.md) — tente explicar antes de olhar.)

> A dica: o `: number` é uma anotação do **TypeScript**, e o TypeScript some quando o código
> vira JavaScript. Ninguém está conferindo tipos em tempo de execução, exceto quem você
> mandar conferir.

Recoloque o `ParseIntPipe` antes de seguir.

---

## Etapa 15 — Responder 404 (15 min)

**Rode:** chame `/obras/999`.

Hoje responde `200` com corpo vazio — que é pior do que um erro. O cliente não tem como saber
se a obra não existe, se a API quebrou ou se ele digitou a URL errada. Um `200` é uma promessa
de que deu certo.

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

```powershell
curl.exe -i http://localhost:3000/obras/999
```

**Deu certo se:** responde `HTTP/1.1 404 Not Found` com

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
traduziu para HTTP. O service continua sem saber que HTTP existe — é o critério da etapa 11,
funcionando na sua máquina.

O Nest tem uma exceção para cada situação comum: `BadRequestException` (400),
`ConflictException` (409), `ForbiddenException` (403). O M07 e o M12 usam as outras.

---

## Etapa 16 — Configuração fora do código (15 min)

O nome da biblioteca não pode estar escrito no meio do código: ele muda por instalação, e
alguém sem acesso ao repositório precisa poder trocá-lo.

### 16a. Os dois arquivos

**Faça:** crie `backend\.env` — que **não** vai para o Git (o `.gitignore` do M00 já cuida):

```ini
PORT=3000
NOME_BIBLIOTECA=Biblioteca Comunitária do Bairro
```

E `backend\.env.example` — **este vai**, com as mesmas chaves e sem os valores:

```ini
PORT=
NOME_BIBLIOTECA=
```

> Por que dois arquivos: o `.env` tem os **seus** valores e é secreto; o `.env.example`
> documenta **quais** variáveis existem e é público. É por ele que uma pessoa nova descobre o
> que precisa configurar. Variável nova no `.env` sem entrada no `.env.example` é o bug de
> integração mais comum que existe, e só aparece quando alguém clona o projeto.

### 16b. Ligar o ConfigModule

Ler `.env` não vem de fábrica no Nest.

**Faça:**

```powershell
npm install @nestjs/config
```

> Repare que aqui **não** vai versão. Os pacotes `@nestjs/*` acompanham a versão principal do
> framework, e o seu projeto é o 12 — então o npm já traz o `@nestjs/config` 12, que combina.
> A única versão que este curso fixa é a da CLI, na etapa 2, e por um motivo diferente:
> reprodutibilidade da turma.

Em `src\app.module.ts`, acrescente ao `imports` (o `AcervoModule` já está lá):

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
| `ConfigModule.forRoot(...)` | Lê o `.env` uma vez, na inicialização. O sufixo `forRoot` é convenção do Nest para "configure este módulo aqui, uma vez só" |
| `isGlobal: true` | Deixa o `ConfigService` disponível em **toda** a aplicação. Sem isto, cada módulo precisaria importar o `ConfigModule` de novo |

### 16c. Usar o valor

**Faça:** no `AcervoService` — que ainda não tinha construtor, este é o primeiro:

```ts
import { ConfigService } from "@nestjs/config";

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
| `constructor(private readonly config: ConfigService)` | Mesma injeção da etapa 13, agora com uma classe do próprio framework |
| `.get<string>("...")` | O `<string>` entre os sinais de menor/maior diz ao TypeScript o tipo esperado. Chama-se *genérico* |
| `?? "sem nome"` | Se a variável não existir, usa esse valor. Na etapa 17 essa rede de proteção sai |

Repare que você **não** precisou importar o `ConfigModule` dentro do `AcervoModule`: é o
`isGlobal: true` fazendo efeito. Sem ele, faltaria esse registro e você cairia no
`can't resolve dependencies` da etapa 13c de novo.

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

**Deu certo se:** <http://localhost:3000/obras/nome> responde
`{"nome":"Biblioteca Comunitária do Bairro"}`.

---

## Etapa 17 — Não subir quebrado (10 min)

Hoje, se alguém apagar `NOME_BIBLIOTECA` do `.env`, a aplicação sobe normalmente e o erro só
aparece quando alguém abre a tela que usa aquele valor — possivelmente em produção,
possivelmente na frente de um usuário. Melhor não subir.

**Faça:**

```powershell
npm install zod
```

Crie `src\config\esquema-env.ts`:

```ts
import { z } from "zod";

export const esquemaEnv = z.object({
  PORT: z.coerce.number().default(3000),
  NOME_BIBLIOTECA: z
    .string("NOME_BIBLIOTECA é obrigatória")
    .min(1, "NOME_BIBLIOTECA não pode ficar vazia"),
});

export function validarEnv(bruto: Record<string, unknown>) {
  const resultado = esquemaEnv.safeParse(bruto);

  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `  - ${i.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n${problemas.join("\n")}`);
  }

  return resultado.data;
}
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `z.object({...})` | Descreve o formato esperado de um objeto |
| `z.coerce.number()` | Variável de ambiente é **sempre texto**. O `coerce` converte antes de validar |
| `z.string("...")` | A mensagem para quando a chave **não existe** |
| `.min(1, "...")` | A mensagem para quando ela existe mas está **vazia**. São dois problemas diferentes, e quem está mexendo no `.env` agradece a distinção |
| `safeParse` | Devolve `{ success, data }` ou `{ success, error }` em vez de lançar. **Você** decide o que fazer com a falha |
| `error.issues` | A lista com **todos** os problemas, não só o primeiro |
| `throw new Error(...)` | Uma mensagem legível. Sem isto o terminal cospe o objeto de erro cru do Zod, que ninguém lê às pressas |

**Faça:** ligue no `app.module.ts`:

```ts
import { validarEnv } from "./config/esquema-env.js";

ConfigModule.forRoot({
  isGlobal: true,
  validate: validarEnv,
}),
```

**Rode:** comente a linha `NOME_BIBLIOTECA` no `.env` e salve.

**Deu certo se:** a aplicação **não sobe**, e no meio do erro aparecem estas duas linhas:

```
Error: Variáveis de ambiente inválidas:
  - NOME_BIBLIOTECA é obrigatória
```

Descomente e ela volta. Depois experimente `NOME_BIBLIOTECA=` (vazia): a mensagem muda para
`não pode ficar vazia`.

> Você vai ver um *stack trace* embaixo da mensagem. É normal — o Nest imprime a pilha de
> qualquer erro de inicialização. A linha que interessa é a primeira.
>
> **Por que isto vale uma etapa:** um serviço que não sobe é um problema óbvio, que alguém
> resolve em dois minutos lendo a mensagem. Um serviço que sobe pela metade é um problema
> caro, que aparece na frente do usuário e leva horas para ser rastreado até uma variável
> faltando.

---

## Etapa 18 — O prefixo `/api` (5 min)

**Faça:** em `src\main.ts`, uma linha entre o `create` e o `listen`:

```ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");                    // ← nova
await app.listen(process.env.PORT ?? 3000);
```

| Linha | O que faz |
|---|---|
| `setGlobalPrefix("api")` | Toda rota passa a começar em `/api`. As obras vão de `/obras` para `/api/obras` |

**Deu certo se:** <http://localhost:3000/api/obras> responde a lista, e
<http://localhost:3000/obras> — que funcionava até agora — passa a dar erro 404.

**Por que fazer isso hoje, e não depois:** no M16 o backend e o frontend vão para o mesmo
domínio, com `/api/*` indo para a API e todo o resto para a aplicação React. Sem um prefixo
que separe os dois, não há como rotear. Definir agora custa uma linha; definir no M16
custaria reescrever todas as URLs que o frontend do M08 já tiver escrito.

---

## Etapa 19 — Documentação automática (10 min)

O M02 falou em **contrato de API**. Aqui ele deixa de ser conversa.

**Faça:**

```powershell
npm install @nestjs/swagger
```

Crie `src\swagger.ts`:

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
| `createDocument(app, config)` | **Varre a aplicação inteira** e monta o schema OpenAPI a partir dos decorators dos controllers |

**Faça:** em `src\main.ts`, entre o prefixo e o `listen`:

```ts
SwaggerModule.setup("api/docs", app, montarDocumento(app));
```

com os imports correspondentes no topo.

**Deu certo se:** <http://localhost:3000/api/docs> lista `GET /api/obras` e
`GET /api/obras/{id}`, com um botão *Try it out* que funciona de verdade.

Ninguém escreveu essa documentação. Ela saiu dos `@Controller` e `@Get` que você escreveu nas
etapas 10 e 14 — os mesmos decorators, lidos por outra ferramenta. É o terceiro uso do mesmo
mecanismo, e o M04 e o M07 trazem mais dois.

### Gravar o schema em arquivo

A página serve para pessoas. O **M15** precisa do schema como arquivo, para gerar os tipos do
frontend a partir dele.

**Faça:** crie `src\gerar-schema.ts`:

```ts
import { writeFileSync } from "node:fs";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { montarDocumento } from "./swagger.js";

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
| `setGlobalPrefix("api")` | Precisa repetir aqui: este script monta a aplicação por conta própria |
| `JSON.stringify(x, null, 2)` | Converte para texto. O `2` é a indentação — sem ele o arquivo sai numa linha só e o `git diff` fica inútil |
| `app.close()` | Encerra a aplicação. **Sem isto o script não termina** e fica pendurado |

**Faça:** o atalho, em `backend\package.json`, ao lado dos scripts que já estão lá:

```json
"gerar:schema": "nest build && node dist/gerar-schema.js"
```

**Rode:**

```powershell
npm run gerar:schema
```

**Deu certo se:** aparece `openapi.json gerado`, e o arquivo `backend\openapi.json` contém
`"/api/obras"`.

Repare que **nenhum servidor subiu**: o `NestFactory.create` monta a árvore de módulos em
memória, o Swagger a percorre, e pronto. É por isso que o comando roda em segundos e serve
para rodar no CI a cada *pull request*.

Esse arquivo é o **contrato** de que o M02 falou. No M07 ele ganha os formatos de entrada e
saída; no M15, vira os tipos do frontend. Como nasce do código, não tem como divergir dele.

---

## Etapa 20 — O mapa que você percorreu (5 min)

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
[ Pipe ]            ParseIntPipe                           ● etapa 14
    │
    ▼
[ Controller ]      acervo.buscarUm(42)                    ● etapa 14
    │
    ▼
[ Service ]         regra de negócio, lança 404            ● etapa 15
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
É esse o retorno da separação que a etapa 11 justificou: quatro pessoas podem preencher
caixas diferentes na mesma semana sem colidir.

Guarde o diagrama. Cada módulo daqui em diante preenche uma caixa, e o M13 volta a ele para
mostrar em que camada cada tipo de ataque é barrado.

💼 **No mercado:** "explique injeção de dependência" e "onde você colocaria esta regra" são
perguntas de entrevista para vaga júnior de Node. Quem responde com o critério da etapa 11 —
*"se o código não mudaria vindo de um comando de terminal, é service"* — e consegue dar um
exemplo concreto se destaca de quem responde "no service, porque sim".

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `nest` não é reconhecido como comando | A CLI não foi instalada, ou o terminal foi aberto antes da instalação. Feche e reabra |
| `curl : Não é possível localizar um parâmetro` | No PowerShell, `curl` é outro programa. Escreva `curl.exe` |
| `Nest can't resolve dependencies of the AcervoController (?)` | O `AcervoService` não está em `providers` do `AcervoModule` |
| A rota responde em `/acervo` e não em `/obras` | A CLI usou o nome do módulo como prefixo. Troque no `@Controller(...)` — etapa 9 |
| `/obras/nome` responde 400 | Rota literal declarada depois de `@Get(":id")` |
| `/obras/1` responde 404 numa obra que existe | Faltou o `ParseIntPipe`. O `id` chegou como `"1"`, e `"1" === 1` é `false` |
| A rota responde 404 depois da etapa 18 | Faltou o prefixo `/api` na URL que você chamou |
| `Cannot find module './acervo.service'` | Import com caminho errado, ou o arquivo não foi salvo |
| Alterou o `.env` e nada mudou | O `.env` é lido na **inicialização**. Reinicie o `start:dev` |
| A aplicação sobe mesmo faltando variável no `.env` | O `validate` não foi ligado no `ConfigModule` — etapa 17 |
| `npm run gerar:schema` não termina | Faltou `await app.close()` no fim do script |
| Um segundo `.git` apareceu dentro de `backend` | Faltou `--skip-git` no `nest new`. Apague a pasta |
| `EADDRINUSE: address already in use :::3000` | Já há um servidor na porta. Encerre-o ou use outra porta |
| `npm error ERESOLVE unable to resolve dependency tree` | Um pacote `@nestjs/*` veio de uma versão principal diferente da do projeto. Leia a linha `peer @nestjs/common@…`: ela diz qual versão ele queria. Reinstale fixando a mesma do seu projeto |
| `error TS2835: Relative import paths need explicit file extensions…` | Faltou o `.js` no fim de um import de arquivo seu. A própria mensagem termina com `Did you mean './x.js'?` — é essa a correção. Ver etapa 5a |

## ✅ Checklist de saída

- [ ] `GET /api/obras` responde 200 com a lista
- [ ] `GET /api/obras/1` responde 200 com um objeto
- [ ] `GET /api/obras/abc` responde **400**, vindo do `ParseIntPipe`
- [ ] `GET /api/obras/999` responde **404**, sem você ter escrito o número 404
- [ ] O controller **não** contém dados nem regra de negócio
- [ ] `.env` fora do Git; `.env.example` dentro, com as mesmas chaves
- [ ] A aplicação **não sobe** se faltar variável obrigatória — você testou
- [ ] `/api/docs` abre e lista os endpoints
- [ ] `npm run gerar:schema` grava o `openapi.json`
- [ ] Você viu o erro `Nest can't resolve dependencies` de propósito (etapa 13c)
- [ ] Você fez o experimento do `ParseIntPipe` (etapa 14e) e sabe explicar o resultado
- [ ] Você sabe dar **um exemplo concreto** de problema que a separação em camadas evita

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — documentação oficial](https://docs.nestjs.com/)
- [NestJS — Providers e injeção de dependência](https://docs.nestjs.com/providers)
- [TypeScript — decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [npm — workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
