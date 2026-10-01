# M09 — Segurança de APIs

> **Pré-requisitos:** M07, M08 · **Duração:** longa
> **Ementa:** tópicos relevantes de segurança

Segurança não é uma etapa decorativa depois do CRUD. Neste módulo você ataca a sua própria
API, encontra falhas reais no código que escreveu nos módulos anteriores — sim, elas existem
— e corrige cada uma com evidência.

> **A teoria não está num bloco separado.** Ela está nas etapas 1, 2, 9 e 10 — em que a
> gente para de digitar e pensa — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Montar um modelo de ameaça simples e ligá-lo ao OWASP API Security Top 10.
2. Encontrar e corrigir falhas de autorização por objeto e de exposição de dados.
3. Limitar o consumo de recursos: paginação, tamanho de corpo e tentativas de login.
4. Configurar cabeçalhos de segurança, CORS e a defesa contra CSRF de uma API com cookie.
5. Garantir que erros, logs, dependências e o repositório não vazem segredos.

---

## 🧭 Por que este módulo vem depois da autenticação

O M08 ensinou a reconhecer usuários e permissões. O M09 amplia a pergunta: **mesmo sabendo
quem fez a requisição, a API continua segura** contra entradas maliciosas, abuso de recursos
e exposição indevida?

Essa posição na trilha evita dois equívocos comuns:

- tratar segurança como uma lista de configurações copiadas no fim;
- confundir autenticação com proteção completa do sistema.

O M10 vem em seguida para transformar parte destas garantias em testes repetíveis. Assim, a
segurança não fica dependendo da memória de quem escreveu a API.

> A evidência de aprendizagem é uma correção demonstrada: **ameaça identificada, falha
> reproduzida, proteção aplicada e verificada**. Cada etapa deste módulo segue esse ciclo.

## 📋 Como este módulo funciona

Mesmo formato dos anteriores, com uma diferença: várias etapas começam pela **falha**. Você
reproduz o problema primeiro, e só então corrige — correção sem reprodução é palpite.

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

> 🪟 Os comandos usam `curl.exe` no PowerShell 5.1. No macOS, no Linux e no PowerShell 7,
> troque por `curl` e tire as barras de dentro do JSON. Os arquivos `cookies.txt` (coordenação)
> e `caio.txt` (bibliotecário) são os do M08 — se a API reiniciou, faça login de novo.

### As treze etapas

| # | Etapa | Duração | O que entra |
|---|---|---|---|
| 1 | [**Pensar como quem ataca**](#etapa-1--pensar-como-quem-ataca) | média | **modelo de ameaça** |
| 2 | [**Toda entrada é suspeita**](#etapa-2--toda-entrada-é-suspeita) | curta | **inventário de entradas** |
| 3 | [Autorização por objeto](#etapa-3--autorização-por-objeto) | média | IDOR, 404 em vez de 403 |
| 4 | [Exposição excessiva de dados](#etapa-4--exposição-excessiva-de-dados) | média | a falha da listagem do M07 |
| 5 | [Corpo grande demais](#etapa-5--corpo-grande-demais) | curta | `413` |
| 6 | [Força bruta no login](#etapa-6--força-bruta-no-login) | média | `@nestjs/throttler`, `429` |
| 7 | [Injeção](#etapa-7--injeção) | curta | auditoria de SQL |
| 8 | [Cabeçalhos de segurança](#etapa-8--cabeçalhos-de-segurança) | curta | `helmet` |
| 9 | [**CORS**](#etapa-9--cors) | média | **quem o navegador deixa ler** |
| 10 | [**CSRF**](#etapa-10--csrf) | média | **cookie que viaja sozinho** |
| 11 | [Erros e logs que não vazam](#etapa-11--erros-e-logs-que-não-vazam) | média | `500` genérico, log do TypeORM |
| 12 | [Dependências e segredos](#etapa-12--dependências-e-segredos) | curta | `npm audit`, `secretlint` |
| 13 | [O relatório](#etapa-13--o-relatório) | média | checklist OWASP e matriz de ameaças |

---

## Etapa 1 — Pensar como quem ataca

Antes de trancar a casa, faz-se uma **vistoria**: por onde dá para entrar (portas, janelas,
a garagem), o que há de valor lá dentro, e quem tem chave. Segurança de software começa
igual, e o nome técnico é **modelo de ameaça**.

```mermaid
flowchart LR
    subgraph Internet["Internet — ninguém é confiável"]
        A(["Anônimo"])
        B(["Bibliotecário"])
        C(["Coordenação"])
        X(["Sistema externo"])
    end
    subgraph Servidor["Servidor — fronteira de confiança"]
        API["API BiblioCom<br/>NestJS"]
        DB[("PostgreSQL<br/>acervo, usuários,<br/>empréstimos")]
    end
    A -- HTTPS --> API
    B -- HTTPS + cookie --> API
    C -- HTTPS + cookie --> API
    X -- HTTPS --> API
    API -- SQL --> DB
```

Tudo que cruza a linha entre **Internet** e **Servidor** é suspeito. As três perguntas da
vistoria, aplicadas ao BiblioCom:

| Pergunta | Resposta |
|---|---|
| **O que tem valor?** | Dados pessoais de associados e usuários (LGPD), hashes de senha, o histórico de empréstimos, a disponibilidade da API |
| **Quem pode querer atacar?** | Alguém de fora atrás de dados; um usuário legítimo tentando passar do próprio papel; um robô testando senhas |
| **Por onde?** | Cada rota, cada parâmetro, cada cabeçalho — e as dependências que você instalou |

A lista de referência para APIs é o **OWASP API Security Top 10**. Este módulo percorre os
itens que mais aparecem num sistema como o seu:

| OWASP API (2023) | Em português | Etapa |
|---|---|---|
| API1 — *Broken Object Level Authorization* | Ver ou mexer no objeto de outra pessoa | 3 |
| API2 — *Broken Authentication* | Login fraco, força bruta | M08 e 6 |
| API3 — *Broken Object Property Level Authorization* | Devolver campo demais, ou aceitar campo demais | 4 e M07 |
| API4 — *Unrestricted Resource Consumption* | Pedir tanto que o servidor cai | 5, 6 e M07 |
| API5 — *Broken Function Level Authorization* | Chamar a rota de outro papel | M08 |
| API8 — *Security Misconfiguration* | Cabeçalhos, CORS, erros verbosos | 8 a 11 |

💼 **No mercado:** *pentest* e revisão de segurança usam exatamente esta tabela. Saber dizer
"isto é um API1" numa revisão de código encurta a conversa.

---

## Etapa 2 — Toda entrada é suspeita

**Faça:** liste, para o BiblioCom, cada tipo de entrada e quem a valida hoje:

| Entrada | Exemplo | Quem valida | Desde |
|---|---|---|---|
| Parâmetro de rota | `/api/obras/:id` | `ParseIntPipe` | M03 |
| Query string | `?tamanho=20` | `ListarObrasDto` + `ValidationPipe` | M07 |
| Corpo JSON | `{"titulo":…}` | DTOs + `whitelist` + `forbidNonWhitelisted` | M07 |
| Arquivo | capa da obra | tamanho, tipo e *magic bytes* | M07 |
| Cookie | `bibliocom.sid` | assinatura do `express-session` | M08 |
| Cabeçalhos | `Origin`, `Content-Type` | **ninguém, ainda** | etapas 9 e 10 |
| Tamanho da requisição | um JSON de 50 MB | **ninguém, ainda** | etapa 5 |
| Frequência | mil logins por minuto | **ninguém, ainda** | etapa 6 |

**Rode** — confira que o M07 ainda segura a primeira linha de defesa. Tente promover-se no
login, mandando um campo que não existe no DTO:

```powershell
curl.exe -s -X POST http://localhost:3000/api/sessao -H "Content-Type: application/json" -d '{\"email\":\"caio@bibliocom.org\",\"senha\":\"outra-senha-bem-longa\",\"papel\":\"coordenacao\"}'
```

**Deu certo se:** `400` com `"property papel should not exist"`. Sem o `forbidNonWhitelisted`
o campo seria ignorado em silêncio; sem o `whitelist`, poderia chegar onde não devia.

> As três linhas com **ninguém, ainda** são o trabalho das próximas etapas. Repare que
> nenhuma delas é "bug" no sentido comum: o código faz o que foi escrito. É o que **não** foi
> escrito que vira falha.

---

## Etapa 3 — Autorização por objeto

O M08 respondeu "você pode chamar esta rota?". Falta a pergunta mais traiçoeira: **"você pode
mexer neste objeto específico?"**

**Faça** — a versão ingênua. No `UsuariosController`, uma rota para cada pessoa consultar
o próprio cadastro:

```ts
import { Get, Param, ParseIntPipe } from "@nestjs/common";

  @Get(":id")
  @Papeis(Papel.BIBLIOTECARIO, Papel.COORDENACAO)
  async buscar(@Param("id", ParseIntPipe) id: number) {
    const usuario = await this.auth.buscar(id);
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
  }
```

| Trecho | O que faz |
|---|---|
| `@Papeis(...)` **no método** | Substitui o `@Papeis(Papel.COORDENACAO)` da classe só nesta rota — o `getAllAndOverride` do M08 olha o método primeiro |

**Rode** — o Caio (id 3) consulta a si mesmo e, em seguida, troca o número:

```powershell
curl.exe -s -b caio.txt http://localhost:3000/api/usuarios/3
```

```powershell
curl.exe -s -b caio.txt http://localhost:3000/api/usuarios/1
```

**A falha:** o segundo comando devolve o cadastro da **coordenação**. O Caio está
autenticado, tem papel permitido na rota, e mesmo assim leu o que não devia. Trocar o número
na URL é o ataque mais simples que existe, e tem nome: **IDOR** (*Insecure Direct Object
Reference*), o API1 da tabela.

**Faça** — a correção:

```ts
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { UsuarioAtual } from "./usuario-atual.decorator.js";

  @Get(":id")
  @Papeis(Papel.BIBLIOTECARIO, Papel.COORDENACAO)
  async buscar(
    @Param("id", ParseIntPipe) id: number,
    @UsuarioAtual() usuarioId: number,
    @Req() req: Request,
  ) {
    const podeVer = id === usuarioId || req.session.papel === Papel.COORDENACAO;
    const usuario = podeVer ? await this.auth.buscar(id) : null;
    if (!usuario) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
  }
```

**Linha a linha:**

| Trecho | Por quê |
|---|---|
| `id === usuarioId` | A regra do objeto: é o **seu** cadastro? |
| `\|\| … COORDENACAO` | Ou você tem um papel que pode ver qualquer um |
| `podeVer ? … : null` | Quem não pode ver nem chega a consultar o banco |
| **404**, e não 403 | Um 403 confirmaria que o usuário 1 **existe**. Para quem não pode ver, "não existe" e "não é seu" respondem igual |

**Deu certo se:** o Caio recebe `404` para o id 1 **e** para o id 999 — respostas
idênticas —, continua vendo o próprio cadastro, e a coordenação vê o dele.

> **Regra geral:** todo `findOne` por id que vem da URL, em recurso que tem dono, precisa de
> um "e é dele?" — de preferência **dentro da consulta** (`where: { id, donoId: usuarioId }`),
> para que esquecer a checagem seja impossível em vez de só improvável.

---

## Etapa 4 — Exposição excessiva de dados

**Rode** — a listagem pública de obras, do jeito que o M07 a deixou:

```powershell
curl.exe -s "http://localhost:3000/api/obras?tamanho=1"
```

**A falha:** a resposta é a **entidade inteira**:

```json
{"itens":[{"id":1,"titulo":"Dom Casmurro","subtitulo":"","anoPublicacao":1899,"isbn":"",
"sinopse":"","destaque":false,"criadoEm":"2026-…","atualizadoEm":"2026-…",
"autor":{"id":1,"nome":"Machado de Assis","nascimento":null,"biografia":"","nacionalidade":""},
"autorId":1}],"total":1,"pagina":1,"tamanho":1}
```

O M07 criou o `ObraResposta` e o usou no `GET /:id` — mas a listagem passou batida, e ninguém
percebeu porque **funciona**. Hoje vazam datas internas e a biografia do autor. Amanhã, quando
alguém acrescentar uma coluna `observacaoInterna` à `Obra`, ela sai na rota pública **sem
ninguém decidir isso** (API3 da tabela).

**Faça:** um DTO enxuto para listas. Crie `src\acervo\dto\obra-resumo.ts`:

```ts
import { ApiProperty } from "@nestjs/swagger";
import { Obra } from "../entidades/obra.entity.js";

export class ObraResumo {
  @ApiProperty() id: number;
  @ApiProperty() titulo: string;
  @ApiProperty({ nullable: true }) anoPublicacao: number | null;
  @ApiProperty() autor: string;

  static de(obra: Obra): ObraResumo {
    return {
      id: obra.id,
      titulo: obra.titulo,
      anoPublicacao: obra.anoPublicacao,
      autor: obra.autor.nome,
    };
  }
}

export class PaginaDeObras {
  @ApiProperty({ type: [ObraResumo] }) itens: ObraResumo[];
  @ApiProperty() total: number;
  @ApiProperty() pagina: number;
  @ApiProperty() tamanho: number;
}
```

**Faça:** use na listagem do `AcervoController`:

```ts
import { ObraResumo, PaginaDeObras } from "./dto/obra-resumo.js";

  @Get()
  @ApiOkResponse({ type: PaginaDeObras })
  async listar(@Query() filtros: ListarObrasDto): Promise<PaginaDeObras> {
    const pagina = await this.acervo.listar(filtros.pagina, filtros.tamanho);
    return { ...pagina, itens: pagina.itens.map((obra) => ObraResumo.de(obra)) };
  }
```

| Trecho | Por quê |
|---|---|
| Um DTO de **resumo**, e não o `ObraResposta` | O `ObraResposta` conta exemplares disponíveis, e a listagem não carrega exemplares: daria zero para todas. Lista e detalhe têm necessidades diferentes |
| `autor: string` | A lista precisa do **nome**. O objeto inteiro do autor era excesso |
| `PaginaDeObras` | Corrige também o Swagger: o M07 anunciava um *array* de obras, e a rota devolve um envelope paginado |
| `: Promise<PaginaDeObras>` | O compilador passa a conferir que a resposta tem exatamente esse formato |

**Deu certo se:** cada item tem só `id`, `titulo`, `anoPublicacao` e `autor`, e o Swagger
mostra o envelope com `itens`, `total`, `pagina` e `tamanho`.

**Faça:** procure o mesmo problema no resto da API. Todo `return` de controller que devolve
algo vindo direto do repositório é suspeito:

```powershell
Get-ChildItem src -Recurse -Filter *.controller.ts | Select-String -Pattern "return this\."
```

---

## Etapa 5 — Corpo grande demais

Um JSON de 50 MB numa rota que espera um título é um jeito barato de ocupar memória do
servidor (API4).

**Faça:** em `src\main.ts`, troque a criação da aplicação e acrescente o limite:

```ts
import type { NestExpressApplication } from "@nestjs/platform-express";

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useBodyParser("json", { limit: "20kb" });
```

| Trecho | O que faz |
|---|---|
| `<NestExpressApplication>` | Diz ao TypeScript que a aplicação roda sobre o Express — e libera métodos específicos dele, como o `useBodyParser` |
| `limit: "20kb"` | O maior JSON que a API aceita. Uma obra cabe com folga em 2 KB |

> Upload de arquivo não passa por aqui: ele tem o limite próprio do `FileInterceptor` (M07).

**Rode** — gere um JSON de uns 30 KB e envie:

```powershell
'{"titulo":"' + ('x' * 30000) + '","autorId":1}' | Out-File -Encoding ascii grande.json
```

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" --data-binary "@grande.json"
```

**Deu certo se:** `{"statusCode":413,"message":"request entity too large"}` — recusado antes
de qualquer validação ou guard gastar trabalho com ele.

---

## Etapa 6 — Força bruta no login

**Rode** — dez tentativas de senha, uma atrás da outra:

```powershell
1..10 | ForEach-Object { curl.exe -s -o NUL -w "%{http_code} " -X POST http://localhost:3000/api/sessao -H "Content-Type: application/json" -d '{\"email\":\"caio@bibliocom.org\",\"senha\":\"chute\"}' }
```

**A falha:** dez `401`. Um robô faria dez mil, e a API responderia a todas.

**Faça:**

```powershell
npm install @nestjs/throttler
```

Em `src\app.module.ts`:

```ts
import { ThrottlerModule } from "@nestjs/throttler";

  imports: [
    // …
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
```

E no `AuthController`, só no login:

```ts
import { ThrottlerGuard } from "@nestjs/throttler";

  @Post()
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  async entrar(…)
```

| Trecho | O que faz |
|---|---|
| `ttl: 60_000` | A janela, em milissegundos: um minuto. O `_` é só separador visual de milhar |
| `limit: 5` | Cinco requisições por janela, **por IP** |
| `ThrottlerGuard` só no login | É onde a força bruta mora. O catálogo público pode ter limite próprio, mais folgado |

**Deu certo se:** a mesma linha de dez tentativas mostra `401 401 401 401 401 429 429 429 429
429`. Depois de um minuto, volta a aceitar.

> ⚠️ Atrás do *proxy* de uma plataforma de hospedagem, todo mundo chega com o IP do proxy — e
> o limite passa a valer para a cidade inteira. O `trust proxy` do M12 resolve isso também.

---

## Etapa 7 — Injeção

O M06 (etapa 13) mostrou a regra: valor do usuário entra na consulta como **parâmetro**,
nunca colado no texto. Aqui você confere se ela foi seguida em todo o projeto.

**Faça:** procure SQL montado com *template string*:

```powershell
Get-ChildItem src -Recurse -Filter *.ts | Select-String -Pattern 'query\(`.*\$\{', 'where\(`.*\$\{'
```

| Padrão | O que caça |
|---|---|
| `` query(`…${ `` | SQL cru com valor colado |
| `` where(`…${ `` | QueryBuilder com valor colado — pega também o `andWhere` e o `orWhere` |

**Deu certo se:** a busca não encontra nada. Se encontrar, troque por `:nome` e o objeto de
parâmetros, como no M06.

> As migrações usam *template string* com SQL fixo, sem `${`. Isso é seguro: o perigo é o
> **valor que vem de fora**, não a crase.

---

## Etapa 8 — Cabeçalhos de segurança

**Rode** — o que a API anuncia hoje:

```powershell
curl.exe -s -I http://localhost:3000/api/obras
```

Repare no `X-Powered-By: Express`: um cartão de visita para quem procura vulnerabilidades
conhecidas daquela tecnologia.

**Faça:**

```powershell
npm install helmet
```

Em `src\main.ts`, logo depois de criar a aplicação:

```ts
import helmet from "helmet";

app.use(helmet());
```

**Rode** de novo. **Deu certo se:** o `X-Powered-By` sumiu e apareceram, entre outros:

| Cabeçalho | O que pede ao navegador |
|---|---|
| `Content-Security-Policy` | Só executar scripts vindos da própria origem |
| `Strict-Transport-Security` | Só falar com este domínio por HTTPS daqui em diante (vale em produção) |
| `X-Content-Type-Options: nosniff` | Não "adivinhar" o tipo de um arquivo — impede um `.jpg` de ser executado como script |
| `X-Frame-Options: SAMEORIGIN` | Não deixar outro site embutir esta página num *iframe* |

E abra <http://localhost:3000/api/docs>: o Swagger continua funcionando com as regras novas.

---

## Etapa 9 — CORS

Pense numa **festa com lista de convidados**: o segurança da porta (o **navegador**) só
deixa entrar quem está na lista que o dono da casa (a **API**) entregou. Quem não está na
lista até chega na porta, mas não leva nada de volta.

CORS é essa lista. Quando um site em `https://outro.com` tenta, pelo navegador da vítima,
ler uma resposta da sua API, o navegador pergunta à API: *"esta origem está na lista?"*.

| Importante | Por quê |
|---|---|
| Quem aplica é o **navegador** | `curl`, Postman e outro servidor ignoram CORS. Ele não é autenticação |
| O padrão já é **fechado** | Sem configuração, nenhuma outra origem lê as respostas |
| O erro clássico é **abrir demais** | `origin: true` com `credentials: true` deixa qualquer site agir com o cookie de quem está logado |

**Faça:** a lista vem do ambiente. Em `src\config\esquema-env.ts`:

```ts
CORS_ORIGENS: z.string().default(""),
```

No `.env`, as origens permitidas separadas por vírgula (hoje, um cliente hipotético):

```ini
CORS_ORIGENS=https://app.bibliocom.org
```

E em `src\main.ts`:

```ts
app.enableCors({
  origin: (process.env.CORS_ORIGENS ?? "").split(",").filter(Boolean),
  credentials: true,
});
```

| Trecho | O que faz |
|---|---|
| `.split(",").filter(Boolean)` | Transforma `"a,b"` em `["a","b"]` e descarta vazios. Com a variável vazia, a lista é vazia — ninguém de fora |
| `credentials: true` | Permite que as origens **da lista** enviem o cookie. Só é seguro porque a lista é explícita |

**Rode** — finja ser cada origem com o cabeçalho `Origin`:

```powershell
curl.exe -s -I -H "Origin: https://app.bibliocom.org" http://localhost:3000/api/obras
```

```powershell
curl.exe -s -I -H "Origin: https://malicioso.example" http://localhost:3000/api/obras
```

**Deu certo se:** só a primeira resposta traz `Access-Control-Allow-Origin:
https://app.bibliocom.org`. A segunda não traz esse cabeçalho — e, sem ele, o navegador
esconde a resposta do site malicioso.

> Repare que o `curl` recebeu as duas respostas inteiras. É a prova de que CORS não protege
> a API de quem chama por fora do navegador; protege **o usuário logado** de sites que
> tentam usar o navegador dele.

---

## Etapa 10 — CSRF

O cookie de sessão tem uma propriedade perigosa: o navegador o envia **sozinho**, para
qualquer requisição ao seu domínio — inclusive as disparadas por outro site. Um formulário
escondido em `https://malicioso.example` que faz `POST` para a sua API chegaria com o cookie
da vítima. Isso é **CSRF** (*Cross-Site Request Forgery*): o site do atacante não lê nada, mas
**age** em nome de quem está logado.

O BiblioCom já tem duas defesas, e esta etapa é para você saber **quais** e **por quê**:

| Defesa | Onde | O que bloqueia |
|---|---|---|
| `sameSite: "lax"` no cookie | M08, etapa 7 | O navegador não envia o cookie em `POST`, `PATCH` e `DELETE` vindos de outro site |
| A API só entende JSON | `ValidationPipe` + DTOs | Formulário HTML não consegue enviar `Content-Type: application/json` sem passar pelo CORS — e o CORS (etapa 9) recusa |

**Rode** — simule o que um formulário HTML conseguiria mandar, com o cookie da coordenação:

```powershell
curl.exe -s -b cookies.txt -X POST http://localhost:3000/api/obras -H "Content-Type: text/plain" -d '{\"titulo\":\"X\",\"autorId\":1}'
```

**Deu certo se:** `400`. Com `text/plain`, o Express não interpreta o corpo, o DTO chega
vazio e a validação recusa — mesmo com sessão válida.

> **Por que não um token anti-CSRF, como em sistemas com formulários?** Ele é a defesa certa
> quando a aplicação aceita formulário HTML. Esta API não aceita: só JSON, só das origens da
> lista, com cookie `SameSite`. Registre esse raciocínio no relatório da etapa 13 — se um dia
> a API passar a aceitar formulário, a decisão precisa ser revista.

---

## Etapa 11 — Erros e logs que não vazam

**Rode** — derrube o banco e chame a API:

```powershell
docker compose stop db
```

```powershell
curl.exe -s -i http://localhost:3000/api/obras
```

**Deu certo se:** a resposta é só `{"statusCode":500,"message":"Internal server error"}`, e o
**terminal da API** mostra o erro completo (`ECONNREFUSED`, endereço, porta). É o
comportamento certo: o detalhe vai para quem opera, nunca para quem chamou.

```powershell
docker compose start db
```

> A tentação, ao depurar, é devolver `erro.message` ou `erro.stack` na resposta "só por
> enquanto". Esse "por enquanto" costuma chegar a produção, e entrega caminho de arquivo,
> versão de biblioteca e às vezes SQL.

**Agora o log.** Crie um usuário pela API (M08, etapa 12) com o `logging: true` do M05 ligado
e leia o terminal:

```
query: INSERT INTO "usuario"(…) VALUES ($1, $2, $3, $4, DEFAULT, DEFAULT) RETURNING …
-- PARAMETERS: ["Caio Lima","caio@bibliocom.org","$argon2id$v=19$m=65536…","bibliotecario"]
```

**A falha:** e-mail e hash de senha **no log**. Em desenvolvimento é aceitável — é o seu
banco, com dados de teste. Em produção, o log vai para uma plataforma que mais gente acessa,
e fica guardado por meses.

**Faça:** em `src\app.module.ts`, o log de SQL só fora de produção:

```ts
logging: process.env.NODE_ENV === "production" ? ["error"] : true,
```

| Trecho | O que faz |
|---|---|
| `["error"]` | Em produção, só consultas que **falharam** vão para o log |
| `true` | Em desenvolvimento, tudo, como no M05 |

**Deu certo se:** subindo com `$env:NODE_ENV="production"` (e removendo a variável depois,
como no M12), criar usuário não imprime mais o `INSERT`.

---

## Etapa 12 — Dependências e segredos

**Faça** — vulnerabilidades conhecidas nas dependências:

```powershell
npm audit --audit-level=high
```

| Resultado | O que fazer |
|---|---|
| `found 0 vulnerabilities` | Nada |
| Vulnerabilidade **alta** ou **crítica** | `npm audit fix`, rode os testes, commite. Se exigir `--force` (versão nova incompatível), avalie com calma — não aplique às cegas |
| Só em `devDependencies` | Não vai para produção; registre e trate sem pânico |

**Faça** — segredos esquecidos no código:

```powershell
npx @secretlint/quick-start "**/*"
```

**Deu certo se:** nenhum erro. Para ver o que ele caça, crie um arquivo temporário com uma
linha `const banco = "postgres://admin:Senha123@db.exemplo.com:5432/prod";`, rode de novo e
veja o erro `found PostgreSQL connection string`. **Apague o arquivo.**

**Faça** — o `.env` nunca entrou no Git? Da raiz do repositório:

```powershell
git log --all --oneline -- backend/.env
```

**Deu certo se:** a saída é vazia. Se aparecer algum commit, o segredo que estava lá está
**vazado**, mesmo que o arquivo tenha sido apagado depois: gere outro `SESSION_SECRET`, troque
as senhas, e só então limpe o histórico.

> Nenhuma ferramenta pega tudo: o `secretlint` conhece formatos de chave famosos, não o seu
> segredo inventado. A defesa principal continua sendo o hábito — segredo mora no `.env` e no
> painel da plataforma, e o `.gitignore` foi feito no primeiro commit (M00).

---

## Etapa 13 — O relatório

**Faça:** percorra o [checklist de segurança](../../recursos/checklists/seguranca.md) e
marque cada item com **evidência** — o comando e a saída, o trecho de código, ou "não se
aplica" com o motivo.

**Faça:** a matriz de ameaças do BiblioCom, uma linha por ameaça:

| Ameaça | OWASP | Onde | Como foi reproduzida | Proteção | Evidência |
|---|---|---|---|---|---|
| Ler cadastro de outro usuário | API1 | `GET /api/usuarios/:id` | Caio leu o id 1 | Checagem de dono + 404 | `curl` da etapa 3, antes e depois |
| Listagem com campos internos | API3 | `GET /api/obras` | Resposta com `biografia` e datas | `ObraResumo` | `curl` da etapa 4 |
| … | | | | | |

**Deu certo se:** a matriz tem ao menos uma linha por etapa deste módulo, e quem ler
consegue repetir cada reprodução sem perguntar nada.

---

## 🤖 IA no fluxo

Assistentes de IA são bons atacantes de primeira viagem: peça *"liste 20 requisições
maliciosas contra esta rota, com o `curl` de cada uma"* e use a lista na etapa 13. São bons
também em explicar uma CVE que o `npm audit` apontou.

E são péssimos em decidir o que é falha no **seu** domínio. O IDOR da etapa 3 só é falha
porque a regra de negócio diz que bibliotecário não lê o cadastro da coordenação — nenhum
modelo sabe disso sem você dizer. E código gerado costuma trazer `app.enableCors()` sem
argumento ou `origin: "*"`, porque "funciona": confira cada configuração de segurança que
você não escreveu.

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| CORS bloqueia o cliente legítimo | A origem não está em `CORS_ORIGENS`, ou está com barra no final (`https://app.org/` ≠ `https://app.org`) |
| `CORS_ORIGENS` configurada e ignorada | Faltou no esquema do `ConfigModule` — a mesma armadilha do M04 e do M08 |
| Login sempre `429` em produção | A plataforma mostra um IP só: falta `trust proxy` (M12) |
| `413` numa requisição legítima | O limite do `useBodyParser` ficou pequeno demais para aquela rota |
| `Property 'useBodyParser' does not exist` | Faltou o `<NestExpressApplication>` no `NestFactory.create` |
| Swagger em branco depois do `helmet` | Alguma configuração da CSP foi alterada à mão. Volte ao `helmet()` sem opções e teste |
| `npm audit fix --force` quebrou o projeto | Ele subiu uma versão principal. Reverta pelo Git e atualize aquela dependência com cuidado |

## 💣 Pegadinha de mercado

**"Ninguém vai adivinhar o id."** Ids sequenciais são adivinháveis por definição — e mesmo
um UUID aleatório vaza em log, em link compartilhado, em print de tela. Esconder o
identificador não é controle de acesso; checar o dono **em toda consulta** é. Os maiores
vazamentos de dados de APIs nos últimos anos foram, quase sempre, um API1: alguém trocou um
número na URL.

## ✅ Checklist de saída

- [ ] Modelo de ameaça com ativos, atores e fronteira de confiança
- [ ] DTOs rejeitam entrada inválida e campos inesperados
- [ ] Autorização por objeto testada: outra pessoa recebe `404`
- [ ] Listagem e detalhe passam por DTO de saída; nenhuma entidade sai crua
- [ ] Paginação, corpo e login têm limites explícitos (`@Max`, `413`, `429`)
- [ ] Nenhum SQL com valor colado (`Select-String` limpo)
- [ ] `helmet` aplicado e `X-Powered-By` ausente
- [ ] CORS com lista explícita vinda do ambiente
- [ ] Você sabe explicar quais defesas contra CSRF a API tem, e por que bastam hoje
- [ ] Erro `500` genérico na resposta; log de SQL restrito em produção
- [ ] `npm audit` sem vulnerabilidade alta; `secretlint` limpo; `.env` fora do histórico

## 📦 Entrega E5

O checklist OWASP aplicado à API, com evidência item a item; a matriz de ameaças da etapa 13;
e o histórico de commits mostrando cada correção separada da anterior.

## 🧩 Desafio de fixação

O BiblioCom vai ganhar `GET /api/emprestimos/:id`. Escreva, antes de qualquer código, as
três respostas possíveis para um bibliotecário que pede um empréstimo — o dele, o de outro
bibliotecário, um id inexistente — e diga qual status cada uma recebe. Depois, escreva a
consulta do TypeORM de modo que **esquecer** a checagem de dono seja impossível.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP Cheat Sheet — REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP Cheat Sheet — CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [NestJS — Security](https://docs.nestjs.com/security/helmet)
- [MDN — CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
