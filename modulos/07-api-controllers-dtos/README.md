# M07 — API: rotas, controllers e DTOs

> **CH:** 6h (3h teóricas · 3h práticas) · **Semana 7** · **Pré-requisitos:** M03, M06

Fecha o backend. Aqui a ementa é atendida em dois itens: *"mapeamento de URLs"* e *"criação
de classes, métodos e funções para processamento das requisições"*.

Ao final deste módulo a API está pronta — e o frontend do M08 tem contra o que trabalhar.

## 🎯 Objetivos

Ao final você será capaz de:

1. Desenhar rotas REST coerentes, com o método e o status corretos.
2. Validar entrada com DTOs, sem escrever `if` de validação.
3. Explicar por que a entidade **não** deve ser exposta na resposta.
4. Publicar um contrato OpenAPI que o frontend consome sem adivinhar.

---

## 📖 Teoria (3h)

### 1. O recurso é um substantivo

```
❌ POST /api/criarObra           ✅ POST   /api/obras
❌ GET  /api/obras/deletar/42    ✅ DELETE /api/obras/42
❌ GET  /api/buscarObrasPorAutor ✅ GET    /api/obras?autorId=3
```

A URL identifica **o quê**; o método HTTP diz **o que fazer** com ele. Verbo na URL é
sintoma de que o método está sendo ignorado.

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

**Status importa.** `200` para tudo obriga o cliente a inspecionar o corpo para saber se deu
certo. É por isso que o M08 consegue tratar erro em um lugar só: o status é confiável.

### 2. Por que DTO e não a entidade

A tentação é receber e devolver a entidade direto. Três razões para não:

**Entrada — *mass assignment*.** Se o controller faz `save(req.body)`, quem enviar
`{"titulo":"X","destaque":true,"criadoEm":"1999-01-01"}` grava tudo. O DTO define **o que é
aceito**; o resto é descartado.

**Saída — vazamento.** A entidade `Usuario` tem `senhaHash`. Devolvê-la inteira publica o
hash de todo mundo. O M13 volta a este ponto.

**Contrato — acoplamento.** Se a resposta *é* a entidade, renomear uma coluna quebra o
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

Regra que resolve as dúvidas: **o service não sabe que HTTP existe**. Se você precisou
importar `Request` ou `Response` dentro dele, a lógica está na camada errada.

### 5. Erros no formato do domínio

```ts
throw new NotFoundException("Obra não encontrada");
throw new ConflictException("Já existe exemplar com este tombo");
throw new ForbiddenException("Você não pode editar obra de outro usuário");
```

Cada uma vira o status certo com corpo JSON padronizado. O service lança linguagem de
domínio; o framework traduz para HTTP. É o mesmo princípio da separação de camadas.

💼 **No mercado:** desenhar rota, escolher status e validar entrada é o trabalho diário de
quem faz backend. Em entrevista, "quando você usaria PATCH em vez de PUT?" e "como você
evita mass assignment?" separam quem copiou tutorial de quem entendeu.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Validação global (20 min)

```bash
cd ~/dev/bibliocom/backend
pnpm add class-validator class-transformer
```

Em `src/main.ts`:

```ts
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

### Passo 2 — DTOs de entrada (35 min)

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

`src/acervo/dto/atualizar-obra.dto.ts` — um `PATCH` aceita qualquer subconjunto:

```ts
import { PartialType } from "@nestjs/swagger";
import { CriarObraDto } from "./criar-obra.dto";

export class AtualizarObraDto extends PartialType(CriarObraDto) {}
```

`PartialType` torna **todos** os campos opcionais, preservando as validações de quem vier.
Uma linha em vez de um arquivo duplicado que sai de sincronia.

E o DTO da query, que também é entrada e também merece validação:

```ts
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
| `@Max(100)` no `tamanho` | Impede `?tamanho=999999` derrubar a API. **Limite de paginação é segurança**, não capricho |

### Passo 3 — DTO de saída (30 min)

`src/acervo/dto/obra.resposta.ts`:

```ts
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

Repare no que a resposta **não** tem: `criadoEm`, `atualizadoEm`, o `autorId` cru, a
biografia inteira da autora. E no que ela **tem** e a entidade não: `exemplaresDisponiveis`,
um número calculado que o frontend usaria três requisições para descobrir.

> **É este o argumento do DTO de saída.** Não é cerimônia: é desenhar a resposta para quem
> vai consumi-la, em vez de despejar a tabela.

### Passo 4 — O controller completo (45 min)

```ts
@ApiTags("obras")
@Controller("obras")
export class AcervoController {
  constructor(private readonly acervo: AcervoService) {}

  @Get()
  @ApiOkResponse({ type: [ObraResposta] })
  async listar(@Query() filtros: ListarObrasDto) {
    return this.acervo.listar(filtros);
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
| `@Query() filtros: ListarObrasDto` | A query inteira validada e convertida numa classe |
| `@Body() dto: CriarObraDto` | O corpo já validado. Se chegar aqui, é válido |
| `@HttpCode(201)` / `@HttpCode(204)` | O padrão do Nest é 201 no POST e 200 nos demais. Explicitar deixa o contrato legível |
| `@ApiNotFoundResponse` | Documenta o caminho de erro. Contrato que só descreve o sucesso é contrato pela metade |
| retorno vazio no `DELETE` | 204 significa "sem conteúdo". Devolver corpo aqui contradiz o status |

⚠️ **Ordem de rotas importa.** Se você criar `@Get("destaques")` **depois** de `@Get(":id")`,
a requisição a `/obras/destaques` casa com `:id`, e o `ParseIntPipe` responde 400. Rotas
literais vêm **antes** das paramétricas.

### Passo 5 — Testar o contrato inteiro (30 min)

```bash
# Linux / macOS / WSL / Git Bash
curl -i -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Memórias Póstumas","anoPublicacao":1881,"autorId":1}'

curl -i -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"","anoPublicacao":3000,"autorId":1}'

curl -i -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"X","autorId":1,"destaque":true}'
```

```powershell
# Windows PowerShell
$h = @{ "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post -Headers $h `
  -Body '{"titulo":"Memórias Póstumas","anoPublicacao":1881,"autorId":1}'

# os dois casos de erro: -SkipHttpErrorCheck mostra o corpo em vez de lançar
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post -Headers $h `
  -Body '{"titulo":"","anoPublicacao":3000,"autorId":1}' -SkipHttpErrorCheck
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post -Headers $h `
  -Body '{"titulo":"X","autorId":1,"destaque":true}' -SkipHttpErrorCheck
```

Preencha a tabela com o que observou:

| Requisição | Status esperado | Status obtido | O corpo explica o erro? |
|---|---|---|---|
| Válida | 201 | | |
| Título vazio, ano 3000 | 400 | | |
| Campo `destaque` não declarado | 400 | | |

O terceiro caso é o `forbidNonWhitelisted` em ação: um campo que o DTO não declara é
**recusado**, não ignorado. É a diferença entre uma API que avisa e uma que grava lixo.

### Passo 6 — Congelar o contrato (20 min)

Em `main.ts`, exponha o schema como arquivo:

```ts
const documento = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, documento);
writeFileSync("./openapi.json", JSON.stringify(documento, null, 2));
```

Abra `/api/docs` e confira: cada rota, cada campo, cada status — **derivado do código**.
Documentação que não pode divergir da implementação, porque nasce dela.

Commite o `openapi.json`. No M15 ele vira os tipos do frontend, e o CI passa a falhar
quando o arquivo commitado não bate com o gerado. É assim que o contrato deixa de ser
promessa e vira verificação.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| DTO não valida nada | Faltou `useGlobalPipes(new ValidationPipe(...))` |
| `anoPublicacao` da query reprova sendo número | Faltou `@Type(() => Number)` e `transform: true` |
| `/obras/destaques` responde 400 | Rota literal declarada depois da paramétrica |
| Resposta traz `senhaHash` ou campos internos | Você devolveu a entidade em vez do DTO de saída |
| `POST` responde 200 | Faltou `@HttpCode(201)` |
| Campos extras são gravados no banco | Faltou `whitelist: true` |
| `Cannot read properties of undefined (reading 'nome')` no DTO de saída | O service não carregou `relations` (M06) |
| Swagger vazio | Faltaram os `@ApiProperty` nos DTOs |

## ✅ Checklist de saída

- [ ] Cinco rotas REST, com método e status corretos
- [ ] `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`
- [ ] DTOs de entrada com validação declarativa — **nenhum `if` de validação**
- [ ] DTO de saída que **não** expõe a entidade
- [ ] Listagem paginada, com teto de `tamanho`
- [ ] Rotas literais declaradas antes das paramétricas
- [ ] `/api/docs` completo, com os caminhos de erro documentados
- [ ] `openapi.json` versionado
- [ ] Os três casos do Passo 5 testados e a tabela preenchida

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Controllers](https://docs.nestjs.com/controllers)
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation)
- [NestJS — OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [MDN — Códigos de status HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status)
