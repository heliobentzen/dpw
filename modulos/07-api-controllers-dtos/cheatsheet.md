# Cola — Controllers, DTOs e validação

## Rotas e métodos

| Método | Rota | Status |
|---|---|---|
| `GET` | `/obras` | 200 |
| `GET` | `/obras/:id` | 200 · 404 |
| `POST` | `/obras` | **201** |
| `PATCH` | `/obras/:id` | 200 · 404 |
| `PUT` | `/obras/:id` | 200 (substitui inteiro) |
| `DELETE` | `/obras/:id` | **204**, sem corpo |

URL é substantivo; o verbo é o método HTTP.

## Controller

```ts
@ApiTags("obras")
@Controller("obras")
export class AcervoController {
  constructor(private readonly acervo: AcervoService) {}

  @Get()
  listar(@Query() filtros: ListarObrasDto) {}

  @Get(":id")
  buscarUm(@Param("id", ParseIntPipe) id: number) {}

  @Post()
  @HttpCode(201)
  criar(@Body() dto: CriarObraDto) {}

  @Delete(":id")
  @HttpCode(204)
  remover(@Param("id", ParseIntPipe) id: number) {}
}
```

⚠️ **Rota literal antes de paramétrica.** `@Get("destaques")` depois de `@Get(":id")` nunca
é alcançada.

### Extratores

| Decorator | De onde |
|---|---|
| `@Param("id")` | `/obras/:id` |
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
export class CriarObraDto {
  @ApiProperty({ example: "Dom Casmurro" })
  @IsString() @Length(1, 200)
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1400) @Max(2100)
  anoPublicacao?: number;

  @IsOptional() @IsArray() @IsInt({ each: true })
  categoriaIds?: number[];
}

// PATCH: tudo opcional, validações preservadas
export class AtualizarObraDto extends PartialType(CriarObraDto) {}
```

### Validadores

| Decorator | Valida |
|---|---|
| `@IsString()` `@IsInt()` `@IsBoolean()` | tipo |
| `@IsEmail()` `@IsUrl()` `@IsUUID()` | formato |
| `@Length(min, max)` `@Min()` `@Max()` | tamanho / faixa |
| `@IsEnum(Estado)` | valor de enum |
| `@IsOptional()` | pula as demais se `undefined` |
| `@IsArray()` + `@X({ each: true })` | cada item |
| `@ValidateNested()` + `@Type(() => Dto)` | objeto aninhado |
| `@Type(() => Number)` | **query string** → número |

## DTO de query

```ts
export class ListarObrasDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  tamanho = 20;                 // teto é segurança, não capricho
}
```

## DTO de saída

```ts
export class ObraResposta {
  @ApiProperty() id: number;
  @ApiProperty() titulo: string;
  @ApiProperty() autor: { id: number; nome: string };
  @ApiProperty() exemplaresDisponiveis: number;

  static de(obra: Obra): ObraResposta { /* … */ }
}
```

Nunca devolva a entidade: vaza campo interno (`senhaHash`) e acopla o cliente ao esquema.

## Exceções → status

```ts
throw new NotFoundException("Obra não encontrada");        // 404
throw new BadRequestException("Data inválida");            // 400
throw new UnauthorizedException();                         // 401
throw new ForbiddenException();                            // 403
throw new ConflictException("Tombo já existe");            // 409
throw new UnprocessableEntityException("Sem exemplar");    // 422
```

O service lança linguagem de domínio; o framework traduz para HTTP.

## Swagger

```ts
@ApiTags("obras")
@ApiOkResponse({ type: ObraResposta })
@ApiCreatedResponse({ type: ObraResposta })
@ApiNotFoundResponse({ description: "Obra não encontrada" })
```

Documente também os caminhos de erro.

## Testar

```bash
# Linux / macOS / WSL / Git Bash
curl -i -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" -d '{"titulo":"X","autorId":1}'
```

```powershell
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/obras" -Method Post `
  -ContentType "application/json" -Body '{"titulo":"X","autorId":1}' -SkipHttpErrorCheck
```

## Erros

| Sintoma | Causa |
|---|---|
| DTO não valida | Faltou `useGlobalPipes` |
| Query numérica reprova | Faltou `@Type(() => Number)` + `transform: true` |
| `/obras/destaques` dá 400 | Rota literal depois da paramétrica |
| `POST` responde 200 | Faltou `@HttpCode(201)` |
| Campo extra é gravado | Faltou `whitelist: true` |
| Swagger vazio | Faltaram os `@ApiProperty` |
