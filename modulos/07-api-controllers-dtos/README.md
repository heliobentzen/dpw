# M07 — API: rotas, controllers e DTOs

> **CH:** 6h (3h teóricas · 3h práticas) · **Semana 7** · **Pré-requisitos:** M03, M06

Fecha o backend. Aqui a ementa é atendida em dois itens: *"mapeamento de URLs"* e *"criação
de classes, métodos e funções para processamento das requisições"*.

O M06 terminou com um CRUD que funciona e aceita qualquer coisa. Este módulo conserta o
"qualquer coisa" — e ao final a API está pronta para o frontend do M08.

## 🎯 Objetivos

Ao final você será capaz de:

1. Desenhar rotas REST coerentes, com o método e o status corretos.
2. Validar entrada com DTOs, sem escrever `if` de validação.
3. Explicar por que a entidade **não** deve ser exposta na resposta.
4. Receber upload de arquivo com validação de tipo, tamanho e nome.
5. Publicar um contrato OpenAPI que o frontend consome sem adivinhar.

---

## 📖 Teoria (3h)

### 1. O recurso é um substantivo

```
❌ POST /api/criarObra           ✅ POST   /api/obras
❌ GET  /api/obras/deletar/42    ✅ DELETE /api/obras/42
❌ GET  /api/buscarObrasPorAutor ✅ GET    /api/obras?autorId=3
```

A URL identifica **o quê**; o método HTTP diz **o que fazer** com ele. Verbo na URL é sinal
de que o método HTTP está sendo ignorado.

| Método | Rota | Faz | Status de sucesso |
|---|---|---|---|
| `GET` | `/obras` | Lista | 200 |
| `GET` | `/obras/42` | Detalha | 200 · **404** se não existe |
| `POST` | `/obras` | Cria | **201** |
| `PATCH` | `/obras/42` | Altera parcialmente | 200 |
| `PUT` | `/obras/42` | Substitui inteiro | 200 |
| `DELETE` | `/obras/42` | Remove | **204** (sem corpo) |

**PATCH ou PUT?** `PUT` exige o recurso inteiro — omitir um campo o apaga. `PATCH` altera só
o que veio. Formulário de edição quase sempre quer `PATCH`. Este material usa `PATCH`.

**Status importa.** Responder `200` para tudo obriga o cliente a abrir o corpo da resposta
para descobrir se deu certo. É por confiar no status que o M08 consegue tratar erro num
lugar só.

### 2. Por que DTO e não a entidade

No M06 o controller recebia `@Body() dados: Partial<Obra>`. Três razões para não fazer isso:

**Entrada: *mass assignment*.** Quem enviar `{"titulo":"X","destaque":true,"criadoEm":"1999-01-01"}`
grava os três — você viu isso funcionar no passo 6 do M06. O DTO define **o que é aceito**;
o resto vai para o lixo.

**Saída: vazamento.** A entidade `Usuario` do M12 tem `senhaHash`. Devolvê-la inteira publica
o hash de todo mundo. O M13 volta a este ponto.

**Contrato: acoplamento.** Se a resposta *é* a entidade, renomear uma coluna quebra o
frontend. Com DTO, existe uma camada onde a mudança é absorvida de propósito.

```
Requisição ──▶ [ DTO de entrada ] ──▶ Service ──▶ Entidade ──▶ Banco
Resposta   ◀── [ DTO de saída   ] ◀── Service ◀── Entidade ◀── Banco
```

### 3. Validação declarativa

```ts
export class CriarObraDto {
  @IsString() @Length(1, 200)
  titulo: string;

  @IsInt() @Min(1400) @Max(2100) @IsOptional()
  anoPublicacao?: number;
}
```

Nenhum `if`. Os decorators são lidos pelo `ValidationPipe`, que roda **antes** do controller:
se a entrada não bate, o Nest responde 400 com a lista de erros, e o seu método nunca é
chamado.

O `ValidationPipe` global, com `whitelist: true`, é a linha que impede *mass assignment*:
propriedade não declarada no DTO é **removida** do objeto.

### 4. Camadas, de novo

| Camada | Responsabilidade |
|---|---|
| **DTO** | O formato aceito e devolvido |
| **Controller** | Rota, status, extração de parâmetros |
| **Service** | Regra de negócio |
| **Repository** | Acesso a dados |

Regra que resolve a dúvida: **o service não sabe que HTTP existe**. Se você precisou
importar `Request` ou `Response` dentro dele, a lógica está na camada errada.

### 5. Erros no formato do domínio

```ts
throw new NotFoundException("Obra não encontrada");
throw new ConflictException("Já existe exemplar com este tombo");
throw new ForbiddenException("Você não pode editar obra de outro usuário");
```

Cada uma vira o status certo com corpo JSON padronizado. O service lança linguagem de
domínio; o framework traduz para HTTP. É o mesmo princípio da separação de camadas, e é o
que você já usa desde o M03 com o `NotFoundException`.

💼 **No mercado:** desenhar rota, escolher status e validar entrada é o trabalho diário de
quem faz backend. Em entrevista, "quando você usaria PATCH em vez de PUT?" e "como você
evita mass assignment?" separam quem copiou tutorial de quem entendeu.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Ligar a validação global (15 min)

```bash
cd ~/dev/bibliocom/backend      # 🪟 Windows: Set-Location C:\dev\bibliocom\backend
pnpm add class-validator class-transformer
```

Em `src/main.ts`, ao lado do `setGlobalPrefix` do M03:

```ts
import { ValidationPipe } from "@nestjs/common";

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

| Opção | O que faz | Por que importa |
|---|---|---|
| `whitelist: true` | Remove propriedades não declaradas no DTO | **A proteção contra mass assignment** |
| `forbidNonWhitelisted: true` | Em vez de remover em silêncio, responde 400 | Erro de integração aparece cedo, não em produção |
| `transform: true` | Converte o corpo em instância do DTO e faz coerção de tipo | Sem isto, `"42"` da query continua string |

Reinicie e repita o `POST` do M06 com o campo `destaque`:

```bash
curl -s -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"X","autorId":1,"destaque":true}'
```

**Continua passando** — e é isso mesmo. O `ValidationPipe` só age onde há um DTO com
decorators para ler; hoje o `@Body()` está tipado como `Partial<Obra>`, que não é uma classe
com regras. O pipe está ligado e não tem o que fazer. O próximo passo lhe dá o que fazer.

### Passo 2 — O primeiro DTO de entrada (30 min)

#### 2a. Escrever

`src/acervo/dto/criar-obra.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CriarObraDto {
  @ApiProperty({ example: "Dom Casmurro", maxLength: 200 })
  @IsString()
  @Length(1, 200)
  titulo: string;

  @ApiPropertyOptional({ example: 1899 })
  @IsOptional()
  @IsInt()
  @Min(1400)
  @Max(2100)
  anoPublicacao?: number;

  @ApiProperty({ example: 3, description: "id do autor" })
  @IsInt()
  autorId: number;

  @ApiPropertyOptional({ type: [Number], example: [1, 4] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoriaIds?: number[];
}
```

| Trecho | O que faz |
|---|---|
| `@ApiProperty` | Alimenta o Swagger. É o que faz a documentação nascer do código |
| `@IsOptional()` | Sem ele, `undefined` reprova nas outras regras |
| `@IsInt({ each: true })` | Valida **cada item** do array |
| `Length(1, 200)` | Mínimo 1 impede título vazio; 200 casa com o `@Column` da entidade |
| `categoriaIds`, não `categorias` | O cliente manda **ids**, não objetos. O que ele envia e o que existe no banco são coisas diferentes — essa é a razão de o DTO existir |

#### 2b. Usar no controller

Troque só a assinatura do `POST`:

```ts
@Post()
criar(@Body() dto: CriarObraDto) {
  return this.acervo.criar(dto);
}
```

O TypeScript vai reclamar: `CriarObraDto` não é `Partial<Obra>`, porque `categoriaIds` não
é um campo da entidade. **Deixe o erro aí por enquanto** — o passo 4 conserta o service. Se
quiser rodar antes disso, use `pnpm start:dev`, que roda mesmo com erro de tipo.

#### 2c. Ver a validação agir

Os três casos que justificam o módulo:

```bash
# 1) válido
curl -s -i -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" \
  -d '{"titulo":"Memórias Póstumas","anoPublicacao":1881,"autorId":1}' | head -1

# 2) título vazio e ano impossível
curl -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" \
  -d '{"titulo":"","anoPublicacao":3000,"autorId":1}'

# 3) campo que o DTO não declara
curl -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" \
  -d '{"titulo":"X","autorId":1,"destaque":true}'
```

```powershell
# 🪟 Windows PowerShell — -SkipHttpErrorCheck mostra o corpo em vez de lançar
$h = @{ "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post -Headers $h `
  -Body '{"titulo":"","anoPublicacao":3000,"autorId":1}' -SkipHttpErrorCheck
```

**Deu certo se** o segundo responde 400 com **as duas** mensagens:

```json
{"message":["titulo must be longer than or equal to 1 characters",
            "anoPublicacao must not be greater than 2100"],
 "error":"Bad Request","statusCode":400}
```

e o terceiro responde 400 com:

```json
{"message":["property destaque should not exist"],"error":"Bad Request","statusCode":400}
```

Preencha:

| Requisição | Status | O corpo explica o erro? |
|---|---|---|
| Válida | | |
| Título vazio, ano 3000 | | |
| Campo `destaque` não declarado | | |

Repare que a segunda resposta traz **as duas** falhas, não a primeira que apareceu. Um
formulário do M11 consegue marcar os dois campos de uma vez por causa disso.

O terceiro caso é o `forbidNonWhitelisted` em ação: o campo que passou no M06 agora é
**recusado**. É a diferença entre uma API que avisa e uma que grava lixo.

### Passo 3 — PATCH e query também são entrada (25 min)

#### 3a. O DTO de atualização, em uma linha

```ts
import { PartialType } from "@nestjs/swagger";
import { CriarObraDto } from "./criar-obra.dto";

export class AtualizarObraDto extends PartialType(CriarObraDto) {}
```

`PartialType` torna **todos** os campos opcionais, preservando as validações de quem vier.
Uma linha em vez de um arquivo duplicado que sai de sincronia — e é exatamente a semântica
do `PATCH`: mande só o que mudou, mas o que você mandar tem de ser válido.

#### 3b. A query, que quase sempre esquecem

```ts
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class ListarObrasDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  tamanho = 20;

  @IsOptional() @IsString() @Length(1, 100)
  busca?: string;
}
```

| Trecho | Por quê |
|---|---|
| `@Type(() => Number)` | Query string chega como texto sempre. Sem isto, `@IsInt` reprova `"2"` |
| `= 1` e `= 20` | Valor padrão na própria classe. Some o `Number(pagina) \|\| 1` feio do M06 |
| `@Max(100)` no `tamanho` | Impede `?tamanho=999999` derrubar a API. **Limite de paginação é segurança**, não capricho |

No controller:

```ts
@Get()
listar(@Query() filtros: ListarObrasDto) {
  return this.acervo.listar(filtros.pagina, filtros.tamanho);
}
```

```bash
curl -s -i "http://localhost:3000/api/obras?tamanho=999999" | head -1
```

**Deu certo se:** responde **400** com `tamanho must not be greater than 100`. Antes deste
passo, essa mesma URL mandava o banco inteiro pela rede.

### Passo 4 — O service passa a falar em DTO (25 min)

Agora o erro de tipo do passo 2b. O service precisa lidar com `categoriaIds`, que é um campo
do **pedido** e não da tabela:

```ts
async criar(dto: CriarObraDto): Promise<Obra> {
  const { categoriaIds, ...campos } = dto;
  const obra = this.obras.create(campos);
  if (categoriaIds) {
    obra.categorias = categoriaIds.map((id) => ({ id }) as Categoria);
  }
  await this.obras.save(obra);
  return this.buscarUm(obra.id);
}

async atualizar(id: number, dto: AtualizarObraDto): Promise<Obra> {
  const obra = await this.buscarUm(id);
  const { categoriaIds, ...campos } = dto;
  Object.assign(obra, campos);
  if (categoriaIds) {
    obra.categorias = categoriaIds.map((cid) => ({ id: cid }) as Categoria);
  }
  await this.obras.save(obra);
  return this.buscarUm(id);
}
```

| Trecho | O que faz |
|---|---|
| `const { categoriaIds, ...campos }` | Separa o que é campo da tabela do que é instrução de relação. É a tradução DTO → entidade, e ela mora no service |
| `({ id }) as Categoria` | Para ligar a relação basta o id. O TypeORM grava as linhas em `obra_categoria` a partir disso, sem carregar as categorias inteiras |
| `if (categoriaIds)` | No `PATCH`, `undefined` significa "não mexa nas categorias"; `[]` significa "tire todas". Coisas diferentes |
| `return this.buscarUm(...)` | Rebusca com as relações carregadas, para o DTO de saída do passo 5 ter o que ler |

O erro de tipo some. **Deu certo se:** o `POST` do passo 2c continua respondendo 201, e um
`POST` com `"categoriaIds":[1,2]` devolve a obra ligada às duas categorias.

### Passo 5 — DTO de saída (30 min)

Falta o lado da resposta. Hoje o controller devolve a entidade inteira.

`src/acervo/dto/obra.resposta.ts`:

```ts
import { ApiProperty } from "@nestjs/swagger";
import { Obra } from "../entidades/obra.entity";

export class ObraResposta {
  @ApiProperty() id: number;
  @ApiProperty() titulo: string;
  @ApiProperty({ nullable: true }) anoPublicacao: number | null;
  @ApiProperty() autor: { id: number; nome: string };
  @ApiProperty({ type: [String] }) categorias: string[];
  @ApiProperty() exemplaresDisponiveis: number;

  static de(obra: Obra): ObraResposta {
    return {
      id: obra.id,
      titulo: obra.titulo,
      anoPublicacao: obra.anoPublicacao,
      autor: { id: obra.autor.id, nome: obra.autor.nome },
      categorias: (obra.categorias ?? []).map((c) => c.nome),
      exemplaresDisponiveis: (obra.exemplares ?? []).filter((e) => e.disponivel).length,
    };
  }
}
```

Use no `@Get(":id")`:

```ts
@Get(":id")
async buscarUm(@Param("id", ParseIntPipe) id: number) {
  return ObraResposta.de(await this.acervo.buscarUm(id));
}
```

Chame `/api/obras/1` antes e depois e compare as duas respostas lado a lado.

**O que sumiu:** `criadoEm`, `atualizadoEm`, o `autorId` cru, a biografia inteira da autora,
o `isbn` vazio, a lista completa de exemplares com tombo e estado de cada um.

**O que apareceu:** `exemplaresDisponiveis` — um número que a entidade não tem, e que o
frontend descobriria com três requisições ou uma contagem no cliente.

| Detalhe | Por quê |
|---|---|
| `?? []` nas duas relações | Se alguém chamar o `de()` com uma obra buscada sem `relations`, o `map` receberia `undefined` e quebraria. O `?? []` devolve zero em vez de derrubar |
| `autor: { id, nome }` | Só os dois campos que a tela usa. A autora inteira é um objeto de dez campos |
| `static de(...)` | A tradução mora **no DTO**, não espalhada pelos controllers |

> Esse é o argumento do DTO de saída. Não é cerimônia; é desenhar a resposta para quem vai
> consumi-la, em vez de despejar a tabela e desejar boa sorte.
>
> ⚠️ O `de()` **exige** que a obra venha com `autor` carregado. Se aparecer
> `Cannot read properties of undefined (reading 'nome')`, o service buscou sem `relations` —
> é o M06 cobrando.

### Passo 6 — O controller completo (25 min)

Agora junte tudo, com os status certos e a documentação:

```ts
@ApiTags("obras")
@Controller("obras")
export class AcervoController {
  constructor(private readonly acervo: AcervoService) {}

  @Get()
  @ApiOkResponse({ type: [ObraResposta] })
  async listar(@Query() filtros: ListarObrasDto) {
    return this.acervo.listar(filtros.pagina, filtros.tamanho);
  }

  @Get(":id")
  @ApiOkResponse({ type: ObraResposta })
  @ApiNotFoundResponse({ description: "Obra não encontrada" })
  async buscarUm(@Param("id", ParseIntPipe) id: number) {
    return ObraResposta.de(await this.acervo.buscarUm(id));
  }

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({ type: ObraResposta })
  async criar(@Body() dto: CriarObraDto) {
    return ObraResposta.de(await this.acervo.criar(dto));
  }

  @Patch(":id")
  @ApiOkResponse({ type: ObraResposta })
  async atualizar(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AtualizarObraDto,
  ) {
    return ObraResposta.de(await this.acervo.atualizar(id, dto));
  }

  @Delete(":id")
  @HttpCode(204)
  async remover(@Param("id", ParseIntPipe) id: number) {
    await this.acervo.remover(id);
  }
}
```

| Trecho | O que faz |
|---|---|
| `@HttpCode(201)` / `@HttpCode(204)` | O padrão do Nest é 201 no POST e 200 nos demais. Explicitar deixa o contrato legível |
| `@ApiNotFoundResponse` | Documenta o caminho de erro. Contrato que só descreve o sucesso é contrato pela metade |
| retorno vazio no `DELETE` | 204 significa "sem conteúdo". Devolver corpo aqui contradiz o status |

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3000/api/obras/1
```

**Deu certo se:** responde **204** e não devolve corpo nenhum.

⚠️ **Ordem de rotas importa.** Se você criar `@Get("destaques")` **depois** de `@Get(":id")`,
a requisição a `/obras/destaques` casa com `:id`, e o `ParseIntPipe` responde 400. Rotas
literais vêm **antes** das paramétricas — a mesma regra do M03 e do M06.

### Passo 7 — Upload de arquivo (25 min) ⭐

Toda obra tem capa. É o requisito mais comum de qualquer CRUD e um dos que mais aparecem mal
feitos, porque envolve três decisões que ninguém toma no seu lugar.

```bash
pnpm add -D @types/multer
```

```ts
@Post(":id/capa")
@UseInterceptors(
  FileInterceptor("arquivo", {
    limits: { fileSize: 2 * 1024 * 1024 },        // 2 MB
    fileFilter: (_req, file, cb) => {
      const permitidos = ["image/jpeg", "image/png", "image/webp"];
      cb(null, permitidos.includes(file.mimetype));
    },
  }),
)
async enviarCapa(
  @Param("id", ParseIntPipe) id: number,
  @UploadedFile() arquivo: Express.Multer.File,
) {
  if (!arquivo) throw new BadRequestException("Envie um arquivo em 'arquivo'");
  return this.acervo.salvarCapa(id, arquivo);
}
```

| Trecho | O que faz |
|---|---|
| `FileInterceptor("arquivo")` | Lê o campo `arquivo` de um corpo `multipart/form-data` (M01). JSON não transporta binário |
| `limits.fileSize` | **Teto obrigatório.** Sem ele, uma requisição de 4 GB derruba o servidor — é a mesma classe de problema do `@Max` na paginação |
| `fileFilter` | Recusa tipos fora da lista **antes** de gravar |

> 🔒 **Este endpoint está aberto, e não deveria.** Upload é escrita: qualquer pessoa na
> internet pode encher o seu disco. O M12 traz autenticação e volta aqui para pôr um
> `@UseGuards` nesta rota — está no checklist de saída daquele módulo. Anote a dívida em um
> comentário `// TODO(M12): exigir autenticação` no código, para ela não sumir de vista.

#### As três decisões

**1. Confie no conteúdo, não na extensão nem no `Content-Type`.**

O `mimetype` do `fileFilter` vem do **cliente** — quem envia escolhe o que declarar. Um
`.php` renomeado para `.jpg` passa. Confira os *magic bytes*:

```ts
const ASSINATURAS: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};

function pareceImagem(buffer: Buffer, mimetype: string): boolean {
  const esperado = ASSINATURAS[mimetype];
  return !!esperado && esperado.every((b, i) => buffer[i] === b);
}
```

**2. Nunca use o nome de arquivo enviado pelo cliente.**

```ts
const nome = arquivo.originalname;                 // ❌ "../../etc/cron.d/x"
const nome = `${randomUUID()}${extname(arquivo.originalname)}`;  // ✅
```

O nome original é entrada do usuário como qualquer outra. Além do *path traversal*, ele
permite sobrescrever o arquivo de outra pessoa e vaza informação (`orçamento-final-v3.jpg`).

**3. Disco de contêiner é efêmero.**

Na PaaS do M16, o disco é recriado a cada deploy: **os uploads somem**. Em desenvolvimento
grave em `backend/uploads/` (e ponha no `.gitignore`); em produção, use armazenamento de
objetos (S3, R2, Blob). O código muda em um lugar só se você isolar a gravação num service.

**Deu certo se:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:3000/api/obras/1/capa -F "arquivo=@capa.jpg"
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:3000/api/obras/1/capa -F "arquivo=@doc.pdf"
```

```powershell
# 🪟 Windows PowerShell
curl.exe -s -o NUL -w "%{http_code}`n" -X POST `
  http://localhost:3000/api/obras/1/capa -F "arquivo=@capa.jpg"
```

O primeiro responde 201; o segundo, 400. Depois renomeie o PDF para `.jpg` e reenvie: se
passar, falta a checagem de conteúdo do item 1.

### Passo 8 — Regerar o contrato (5 min)

O `gerar:schema` já existe desde o M03. Agora que há DTOs de entrada e saída, ele tem muito
mais o que descrever:

```bash
pnpm gerar:schema
```

Abra `/api/docs` e confira: cada rota, cada campo, cada status — **derivado do código**. O
`titulo` aparece com `maxLength: 200` porque você escreveu `@Length(1, 200)`; o 404 do
detalhe aparece porque você escreveu `@ApiNotFoundResponse`.

Compare o `openapi.json` de agora com o do M03 (`git diff`). Aquele tinha rotas e nada mais;
este tem os formatos.

Commite o arquivo. No M15 ele vira os tipos do frontend, e o CI passa a falhar quando o
arquivo commitado não bate com o gerado. É assim que o contrato deixa de ser promessa e vira
verificação.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| DTO não valida nada | Faltou `useGlobalPipes(new ValidationPipe(...))`, ou o `@Body()` ainda está tipado como `Partial<Obra>` |
| `anoPublicacao` da query reprova sendo número | Faltou `@Type(() => Number)` e `transform: true` |
| `Type 'CriarObraDto' is not assignable to 'Partial<Obra>'` | O service ainda espera a entidade. É o passo 4 |
| `/obras/destaques` responde 400 | Rota literal declarada depois da paramétrica |
| Resposta traz `senhaHash` ou campos internos | Você devolveu a entidade em vez do DTO de saída |
| `POST` responde 200 | Faltou `@HttpCode(201)` |
| Campos extras são gravados no banco | Faltou `whitelist: true` |
| `Cannot read properties of undefined (reading 'nome')` no DTO de saída | O service não carregou `relations` (M06) |
| `PATCH` com `categoriaIds` ausente apagou as categorias | Faltou o `if (categoriaIds)`: `undefined` não é `[]` |
| Swagger vazio | Faltaram os `@ApiProperty` nos DTOs |
| Upload responde 400 sempre | O nome do campo no `FileInterceptor` não bate com o do formulário |
| Arquivo grande derruba o servidor | Faltou `limits.fileSize` |
| Upload some depois do deploy | Disco efêmero — use armazenamento de objetos (M16) |

## ✅ Checklist de saída

- [ ] Cinco rotas REST, com método e status corretos
- [ ] `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`
- [ ] DTOs de entrada com validação declarativa — **nenhum `if` de validação**
- [ ] DTO da **query**, com teto de `tamanho`
- [ ] DTO de saída que **não** expõe a entidade
- [ ] Rotas literais declaradas antes das paramétricas
- [ ] Os três casos do passo 2c testados e a tabela preenchida
- [ ] Upload com teto de tamanho, filtro de tipo, nome gerado no servidor e conferência de conteúdo
- [ ] `// TODO(M12)` anotado na rota de upload
- [ ] `/api/docs` completo, com os caminhos de erro documentados
- [ ] `openapi.json` regerado e versionado

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Controllers](https://docs.nestjs.com/controllers)
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation)
- [NestJS — OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [MDN — Códigos de status HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status)
