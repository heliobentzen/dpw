# Cola — Controllers, DTOs e validação

Exemplos com o recurso `pessoas`. Troque pelos recursos do projeto.

## Rotas e métodos

| Método | Rota | Status |
| --- | --- | --- |
| `GET` | `/pessoas` | 200 |
| `GET` | `/pessoas/:id` | 200 · 404 |
| `POST` | `/pessoas` | **201** |
| `PATCH` | `/pessoas/:id` | 200 · 404 |
| `PUT` | `/pessoas/:id` | 200 (substitui inteiro) |
| `DELETE` | `/pessoas/:id` | **204**, sem corpo |

URL é substantivo; o verbo é o método HTTP.

## Controller

```ts
@ApiTags("pessoas")
@Controller("pessoas")
export class PessoasController {
  constructor(private readonly pessoas: PessoasService) {}

  @Get()
  listar(@Query() filtros: ListarPessoasDto) {}

  @Get(":id")
  buscarUm(@Param("id", ParseIntPipe) id: number) {}

  @Post()
  @HttpCode(201)
  criar(@Body() dto: CriarPessoaDto) {}

  @Delete(":id")
  @HttpCode(204)
  remover(@Param("id", ParseIntPipe) id: number) {}
}
```

⚠️ **Rota literal antes de paramétrica.** `@Get("aniversariantes")` depois de `@Get(":id")`
nunca é alcançada.

### Extratores

| Decorator | De onde |
| --- | --- |
| `@Param("id")` | `/pessoas/:id` |
| `@Query()` | `?pagina=1` |
| `@Body()` | corpo JSON |
| `@Headers("authorization")` | cabeçalho |
| `@Req()` / `@Res()` | evite — acopla a camada HTTP |

## ValidationPipe global

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // remove campo não declarado — anti mass assignment
  forbidNonWhitelisted: true,   // e responde 400 em vez de ignorar
  transform: true,              // converte para a classe do DTO
}));
```

## DTO de entrada

```ts
export class CriarPessoaDto {
  @ApiProperty({ example: "Ana Souza" })
  @IsString() @Length(1, 150)
  nome: string;

  @ApiPropertyOptional({ example: "2001-05-20" })
  @IsOptional() @IsDateString()
  nascimento?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional() @IsArray() @IsInt({ each: true })
  servicoIds?: number[];
}

// PATCH: tudo opcional, validações preservadas
export class AtualizarPessoaDto extends PartialType(CriarPessoaDto) {}
```

### Validadores

| Decorator | Valida |
| --- | --- |
| `@IsString()` `@IsInt()` `@IsBoolean()` | tipo |
| `@IsEmail()` `@IsUrl()` `@IsUUID()` `@IsDateString()` | formato |
| `@Length(min, max)` `@Min()` `@Max()` | tamanho / faixa |
| `@IsEnum(Situacao)` | valor de enum |
| `@IsOptional()` | pula as demais se `undefined` |
| `@IsArray()` + `@X({ each: true })` | cada item |
| `@ValidateNested()` + `@Type(() => Dto)` | objeto aninhado |
| `@Type(() => Number)` | **query string** → número |

## DTO de query

```ts
export class ListarPessoasDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })   // sem isto, some do contrato (M11)
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina: number = 1;           // tipo escrito: sem ele o contrato diz "Object"

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  tamanho: number = 20;         // teto é segurança, não capricho
}
```

> Tipo com `|` no DTO de saída precisa do `type` por extenso:
> `@ApiProperty({ type: String, nullable: true }) nascimento: string | null;`

## DTO de saída

```ts
export class PessoaResposta {
  @ApiProperty() id: number;
  @ApiProperty() nome: string;
  @ApiProperty({ type: [String] }) servicos: string[];
  @ApiProperty() atendimentosEmAberto: number;

  static de(p: Pessoa): PessoaResposta { /* … */ }
}
```

Nunca devolva a entidade: vaza campo interno (`senhaHash`, `cpf`) e acopla o cliente ao
esquema.

## Exceções → status

```ts
throw new NotFoundException("Pessoa não encontrada");          // 404
throw new BadRequestException("Data inválida");                // 400
throw new UnauthorizedException();                             // 401
throw new ForbiddenException();                                // 403
throw new ConflictException("CPF já cadastrado");              // 409
throw new UnprocessableEntityException("Limite atingido");     // 422
```

O service lança linguagem de domínio; o framework traduz para HTTP.

## Swagger

```ts
@ApiTags("pessoas")
@ApiOkResponse({ type: PessoaResposta })
@ApiCreatedResponse({ type: PessoaResposta })
@ApiNotFoundResponse({ description: "Pessoa não encontrada" })
```

Documente também os caminhos de erro.

## Testar

```bash
# Linux / macOS / WSL / Git Bash
curl -i -X POST http://localhost:3000/api/pessoas \
  -H "Content-Type: application/json" -d '{"nome":"Ana Souza"}'
```

```powershell
# Windows PowerShell
curl.exe -i -X POST http://localhost:3000/api/pessoas -H "Content-Type: application/json" -d '{\"nome\":\"Ana Souza\"}'
```

## Erros

| Sintoma | Causa |
| --- | --- |
| DTO não valida | Faltou `useGlobalPipes` |
| Query numérica reprova | Faltou `@Type(() => Number)` + `transform: true` |
| `/pessoas/aniversariantes` dá 400 | Rota literal depois da paramétrica |
| `DELETE` responde 200 | Faltou `@HttpCode(204)` |
| Campo extra é gravado | Faltou `whitelist: true` |
| Swagger vazio | Faltaram os `@ApiProperty` |
