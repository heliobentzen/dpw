# M03 — NestJS: módulos, controllers e providers

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 3** · **Pré-requisitos:** M01, M02

Primeiro código do backend. Ao final deste módulo existe uma API que responde, com a
estrutura que os módulos seguintes vão preencher.

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar o que **injeção de dependência** resolve, e por que um framework a impõe.
2. Distinguir **módulo**, **controller** e **provider**, e dizer o que cada um não deve fazer.
3. Criar um endpoint que responde JSON, com rota e método HTTP corretos.
4. Ler configuração por variável de ambiente, sem segredo no código.

---

## 📖 Teoria (2h)

### 1. Por que um framework opinativo

Node não impõe estrutura. Um projeto Express começa assim:

```ts
app.get("/obras", (req, res) => { /* consulta o banco, valida, responde */ });
```

Funciona. E na semana 12, com 40 rotas, vira um arquivo de 800 linhas em que ninguém acha
nada, nada é testável isoladamente e cada pessoa da equipe organizou de um jeito.

O NestJS impõe uma estrutura em três peças. **Essa imposição é o produto** — é o que
permite quatro pessoas trabalharem no mesmo backend sem colidir.

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
declarado como provider naquele módulo, cria uma única instância e entrega. Isso é
**injeção de dependência**: a classe declara *o que precisa*, não *como obter*.

Três consequências práticas:

1. **Testar fica trivial** — o teste passa um dublê no lugar do service (M14).
2. **Uma instância só** (*singleton*), reaproveitada em toda a aplicação.
3. **Trocar a implementação não toca o consumidor** — útil quando o `EmailService` de
   desenvolvimento vira o de produção.

> O `private readonly` no construtor não é enfeite: é atalho do TypeScript que **declara e
> atribui** a propriedade numa linha só. Sem ele, seria `this.obras = obras`.

### 3. Decorators

`@Controller`, `@Get`, `@Injectable` são **decorators**: funções que anexam metadados a uma
classe ou método. O Nest lê esses metadados na inicialização e monta o roteamento e o
grafo de dependências.

```ts
@Get(":id")            // anexa: método GET, caminho "obras/:id"
buscarUm(@Param("id") id: string) { … }
```

Não há mágica — há um registro sendo lido em tempo de inicialização. É o mesmo mecanismo
que o TypeORM usa em `@Entity()` (M04) e o `class-validator` em `@IsString()` (M07). Um
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

### Passo 2 — Criar o backend (25 min)

```bash
cd ~/dev/bibliocom          # 🪟 Windows: Set-Location C:\dev\bibliocom
pnpm dlx @nestjs/cli new backend --package-manager pnpm --skip-git
cd backend
pnpm add @nestjs/config
pnpm start:dev
```

| Linha | O que faz |
|---|---|
| `pnpm dlx @nestjs/cli` | Executa a CLI **sem instalá-la** globalmente. É o `npx` do pnpm |
| `new backend` | Gera o projeto na pasta `backend/` |
| `--skip-git` | **Importante:** sem isto, a CLI cria um segundo repositório dentro do seu |
| `@nestjs/config` | Lê variáveis de ambiente do `.env` |
| `pnpm start:dev` | Sobe em <http://localhost:3000>, recarregando a cada arquivo salvo |

**Deu certo se:** <http://localhost:3000> responde `Hello World!`.

O que a CLI gerou:

```
backend/src/
├── main.ts              ponto de entrada: cria e sobe a aplicação
├── app.module.ts        módulo raiz — a árvore começa aqui
├── app.controller.ts    controller de exemplo
└── app.service.ts       provider de exemplo
```

### Passo 3 — O primeiro módulo de domínio (45 min)

```bash
pnpm dlx @nestjs/cli generate module acervo
pnpm dlx @nestjs/cli generate controller acervo --no-spec
pnpm dlx @nestjs/cli generate service acervo --no-spec
```

A CLI cria os três arquivos **e os registra** no `app.module.ts` e no `acervo.module.ts`.
Esse registro é o passo que mais se esquece quando se cria à mão — e o erro resultante
(`Nest can't resolve dependencies`) não diz que faltou registrar.

> `--no-spec` pula o arquivo de teste. Eles entram no M14, com o conteúdo que os justifica.

`src/acervo/acervo.service.ts`:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";

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

  buscarUm(id: number): Obra {
    const obra = this.obras.find((o) => o.id === id);
    if (!obra) {
      throw new NotFoundException(`Obra ${id} não encontrada`);
    }
    return obra;
  }
}
```

| Trecho | O que faz |
|---|---|
| `@Injectable()` | Marca a classe como provider: o Nest pode criá-la e injetá-la |
| `throw new NotFoundException(...)` | O Nest converte a exceção em **404 com corpo JSON**. Você lança um erro de domínio; o framework traduz para HTTP. O service continua sem saber o que é HTTP |

`src/acervo/acervo.controller.ts`:

```ts
import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { AcervoService } from "./acervo.service";

@Controller("obras")
export class AcervoController {
  constructor(private readonly acervo: AcervoService) {}

  @Get()
  listar() {
    return this.acervo.listar();
  }

  @Get(":id")
  buscarUm(@Param("id", ParseIntPipe) id: number) {
    return this.acervo.buscarUm(id);
  }
}
```

| Trecho | O que faz |
|---|---|
| `@Controller("obras")` | Prefixo de rota: tudo nesta classe começa em `/obras` |
| `constructor(private readonly acervo: AcervoService)` | Recebe o service pronto. **Não há `new`** |
| `@Get()` / `@Get(":id")` | `GET /obras` e `GET /obras/42` |
| `@Param("id", ParseIntPipe)` | Extrai `:id` da URL **e converte para número**. Sem o pipe, `id` seria a string `"42"` e o `===` do service falharia silenciosamente |
| retorno | Basta devolver o objeto: o Nest serializa para JSON e responde 200 |

**Repare no que o controller não faz:** não valida, não consulta banco, não decide regra.
Ele traduz HTTP e delega. É o critério da teoria, aplicado.

Teste:

```bash
# Linux / macOS / WSL / Git Bash
curl -i http://localhost:3000/obras
curl -i http://localhost:3000/obras/1
curl -i http://localhost:3000/obras/999
```

```powershell
# Windows PowerShell
curl.exe -i http://localhost:3000/obras
curl.exe -i http://localhost:3000/obras/1
curl.exe -i http://localhost:3000/obras/999
```

**Deu certo se:** a primeira devolve `200` com um array, a segunda `200` com um objeto, e a
terceira **`404`** com `{"message":"Obra 999 não encontrada", ...}` — sem você ter escrito
nenhum código de status.

### Passo 4 — Configuração por variável de ambiente (25 min)

`src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AcervoModule } from "./acervo/acervo.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AcervoModule,
  ],
})
export class AppModule {}
```

| Trecho | O que faz |
|---|---|
| `ConfigModule.forRoot(...)` | Lê o `.env` na inicialização |
| `isGlobal: true` | Disponibiliza o `ConfigService` em toda a aplicação sem reimportar em cada módulo |

`backend/.env` — **já ignorado** pelo `.gitignore` do M00:

```ini
PORT=3000
NODE_ENV=development
```

`backend/.env.example` — **este vai** para o Git:

```ini
PORT=3000
NODE_ENV=development
```

> O `.env.example` documenta **quais** variáveis existem, sem os valores. É por ele que uma
> pessoa nova sabe o que precisa configurar. Mantenha os dois em sincronia: variável nova
> no `.env` sem entrada no `.env.example` é o bug de integração mais comum de todos.

**Falhe cedo se faltar variável.** Sem isto, uma variável ausente vira `undefined` e o erro
aparece só quando alguém usa a funcionalidade — em produção, na sexta-feira:

```ts
ConfigModule.forRoot({
  isGlobal: true,
  validate: (config) => esquemaEnv.parse(config),   // Zod: mesma biblioteca do M11
}),
```

O `parse` lança na **inicialização** se algo faltar ou estiver com tipo errado. Um serviço
que não sobe é um problema óbvio; um que sobe quebrado é um problema caro.

`src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

| Linha | O que faz |
|---|---|
| `setGlobalPrefix("api")` | Toda rota passa a começar em `/api`. As obras agora estão em `/api/obras` |
| `process.env.PORT ?? 3000` | Usa a variável, com 3000 de reserva. O `??` só cai no padrão se o valor for `null`/`undefined` — diferente do `\|\|`, que também cairia com `0` ou `""` |

**Por que o prefixo `/api`:** no M16 os dois artefatos são publicados no mesmo domínio, com
`/api/*` roteado para o backend e o resto para a SPA. Definir o prefixo agora evita
reescrever todas as URLs do frontend depois.

**Deu certo se:** `curl.exe -i http://localhost:3000/api/obras` responde 200 e
`http://localhost:3000/obras` agora responde 404.

### Passo 5 — Documentação automática (20 min)

```bash
pnpm add @nestjs/swagger
```

Em `main.ts`, antes do `listen`:

```ts
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const config = new DocumentBuilder()
  .setTitle("BiblioCom API")
  .setDescription("Acervo de biblioteca comunitária")
  .setVersion("1.0")
  .build();
SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
```

**Deu certo se:** <http://localhost:3000/api/docs> mostra os dois endpoints, com botão de
testar.

Esse schema OpenAPI não é enfeite: é o **contrato** de que o M02 falou, e é dele que o M15
gera os tipos do frontend. A documentação existe porque o código existe — ela não pode
divergir.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Nest can't resolve dependencies of the AcervoController` | O `AcervoService` não está em `providers` do `AcervoModule`. A mensagem diz o índice do parâmetro que faltou |
| `Cannot find module './acervo.service'` | Import com caminho errado, ou o arquivo não foi salvo |
| A rota responde 404 | Faltou o prefixo `/api`, ou o módulo não está em `imports` do `AppModule` |
| `id` chega como string e a busca falha | Faltou o `ParseIntPipe` no `@Param` |
| Alterou o `.env` e nada mudou | O `.env` é lido na **inicialização**. Reinicie o `start:dev` |
| Um segundo `.git` apareceu dentro de `backend/` | Faltou `--skip-git` no `nest new`. Apague `backend/.git` |
| `EADDRINUSE: address already in use :::3000` | Já há um servidor na porta. Encerre-o ou use outra porta |

## ✅ Checklist de saída

- [ ] `pnpm-workspace.yaml` e `package.json` na raiz, com os workspaces declarados
- [ ] `GET /api/obras` responde 200 com a lista
- [ ] `GET /api/obras/999` responde **404**, sem código de status escrito à mão
- [ ] O controller **não** contém regra de negócio nem acesso a dados
- [ ] `.env` fora do Git; `.env.example` dentro, com as mesmas chaves
- [ ] `/api/docs` abre e lista os endpoints
- [ ] Você sabe explicar, em uma frase, o que a injeção de dependência resolve

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — documentação oficial](https://docs.nestjs.com/)
- [NestJS — Providers e injeção de dependência](https://docs.nestjs.com/providers)
- [TypeScript — decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [pnpm workspaces](https://pnpm.io/workspaces)
