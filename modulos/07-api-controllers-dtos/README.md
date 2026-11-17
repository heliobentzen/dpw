# M07 — API: rotas, controllers e DTOs

> **Pré-requisitos:** M03, M06 · **Duração:** longa · **Semanas:** 8–9
> **Ementa:** *Mapeamento de URLs; criação de classes / métodos / funções para processamento de requisições.*
> **No projeto:** o CRUD da equipe passa a validar a entrada e a controlar a resposta · P2 (critérios 2 e 3) e P3 (critério 2)

## Por que este módulo existe no projeto

O CRUD do M06 funciona e **aceita qualquer coisa**: nome vazio, data impossível, e qualquer
campo da entidade que alguém resolva mandar. E devolve a entidade inteira — quando o M08
criar o usuário com o hash da senha, ele vai sair na resposta.

Este módulo coloca duas fronteiras na API da equipe: **o que pode entrar** (DTO de entrada)
e **o que pode sair** (DTO de saída). Com elas, a API fica pronta para ser usada pela
organização sem ninguém de vocês por perto — e o `/api/docs` passa a ser um contrato de
verdade, que a P2 e a P3 confrontam com o `docs/api.md` do M02.

## 🎯 Ao final do módulo

1. Toda entrada da API é validada, sem nenhum `if` de validação escrito à mão.
2. Nenhuma resposta devolve a entidade: cada recurso tem seu DTO de saída.
3. Rotas, métodos e status seguem o contrato, e o `/api/docs` mostra formatos e erros.

---

## 📖 Conceitos

### 1. Três problemas que o DTO resolve

Pense no **formulário de um balcão**: o atendente só processa os campos impressos; um
bilhete grampeado pedindo "me promova a gerente" vai para o lixo. Na volta, você recebe um
comprovante — não a ficha interna. O **DTO de entrada** é o formulário; o **DTO de saída**, o
comprovante; a **entidade**, a ficha que nunca atravessa o balcão.

| Problema | Exemplo | Resolve |
| --- | --- | --- |
| **Mass assignment** — o cliente escolhe os campos | `{"nome": "X", "papel": "admin"}` grava o papel | DTO de entrada + `whitelist` |
| **Vazamento** — a resposta é a tabela inteira | `senhaHash`, `cpf`, `observacaoInterna` saem na API | DTO de saída |
| **Acoplamento** — renomear coluna quebra quem consome | `nome` → `nomeCompleto` na entidade | DTO de saída absorve a mudança |

```text
Requisição ──▶ [ DTO de entrada ] ──▶ Service ──▶ Entidade ──▶ Banco
Resposta   ◀── [ DTO de saída   ] ◀── Service ◀── Entidade ◀── Banco
```

### 2. Por que precisa ser uma classe

`@Body() dados: Partial<Pessoa>` não valida nada: `Partial<Pessoa>` é um **tipo**, e tipos
desaparecem na compilação. O `ValidationPipe` procura **decorators numa classe** — e só uma
classe sobrevive até a execução. Um DTO é isso: uma classe que descreve o que entra ou sai,
com as regras anexadas.

### 3. DTO de entrada

```ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, Length } from "class-validator";

export class CriarAtendimentoDto {
  @ApiProperty({ example: 7, description: "id da pessoa atendida" })
  @IsInt()
  pessoaId: number;

  @ApiProperty({ example: "Orientação sobre documentos", maxLength: 500 })
  @IsString()
  @Length(1, 500)
  descricao: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  servicoIds?: number[];
}
```

| Detalhe | Por quê |
| --- | --- |
| `@IsOptional()` | Sem ele, `undefined` reprova nas outras regras |
| `servicoIds`, não `servicos` | O cliente manda **ids**; o que se envia e o que se guarda são coisas diferentes — é a razão de o DTO existir |
| `@Length(1, 500)` repete o `length` da coluna | O DTO recusa **antes**, com mensagem legível; a coluna é a última defesa |
| `@ApiProperty` | Alimenta o `/api/docs` |

Para o `PATCH`, uma linha — todos os campos opcionais, com as mesmas regras:

```ts
export class AtualizarAtendimentoDto extends PartialType(CriarAtendimentoDto) {}   // de @nestjs/swagger
```

### 4. A query string também é entrada

```ts
export class ListarDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  tamanho = 20;

  @IsOptional() @IsString() @Length(1, 100)
  busca?: string;
}
```

Query string chega **sempre como texto**: o `@Type(() => Number)` converte. O **`@Max(100)`
é segurança**: sem teto, o cliente decide quanto trabalho o servidor faz. Todo limite que o
cliente controla precisa de um teto imposto pelo servidor.

### 5. DTO de saída: a resposta desenhada para quem consome

```ts
export class AtendimentoResposta {
  @ApiProperty() id: number;
  @ApiProperty() descricao: string;
  @ApiProperty() pessoa: { id: number; nome: string };
  @ApiProperty({ type: [String] }) servicos: string[];
  @ApiProperty({ nullable: true }) concluidoEm: Date | null;

  static de(a: Atendimento): AtendimentoResposta {
    return {
      id: a.id,
      descricao: a.descricao,
      pessoa: { id: a.pessoa.id, nome: a.pessoa.nome },
      servicos: (a.servicos ?? []).map((s) => s.nome),
      concluidoEm: a.concluidoEm,
    };
  }
}
```

Saem os campos internos e o CPF da pessoa; entra só o que quem consome usa. Um campo
sensível acrescentado à entidade meses depois **não aparece sozinho** na API: alguém precisa
decidir incluí-lo aqui.

### 6. Rotas e status

A URL é o substantivo; o método, o verbo (M01, M02). Dois endereços, seis operações:

| Método | Rota | Faz | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/atendimentos` | Lista | 200 |
| `GET` | `/atendimentos/42` | Detalha | 200 · 404 |
| `POST` | `/atendimentos` | Cria | **201** |
| `PATCH` | `/atendimentos/42` | Altera só o que veio | 200 |
| `DELETE` | `/atendimentos/42` | Remove | **204**, sem corpo |

Este material usa `PATCH` para edição: quem corrige a descrição não espera perder os
serviços (o `PUT` substituiria o recurso inteiro).

| Status | Quando | De onde vem |
| --- | --- | --- |
| 400 | Entrada malformada | `ValidationPipe` |
| 404 | Não existe | `NotFoundException` |
| 409 | Conflita com o estado atual (duplicado, horário ocupado, item já emprestado) | `ConflictException` |
| 401 / 403 | Não autenticado / sem permissão | M08 |

**Lance a exceção que descreve o que aconteceu no negócio** — `ConflictException` porque há
conflito — e o status vem junto.

---

## 🧩 No projeto da equipe

### Passo 1 — Ligar a validação global

```bash
cd backend
npm install class-validator class-transformer
```

Em `main.ts`, ao lado do `setGlobalPrefix`:

```ts
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
);
```

| Opção | Para quê |
| --- | --- |
| `whitelist` | Descarta o que o DTO não declara (contra *mass assignment*) |
| `forbidNonWhitelisted` | Em vez de descartar em silêncio, responde 400: o erro de integração aparece cedo |
| `transform` | Converte o corpo numa instância do DTO e faz a coerção de tipos |

> Ligar o pipe **não muda nada** enquanto os controllers receberem `Partial<Entidade>`. A
> proteção começa quando cada `@Body()` passa a ser um DTO.

### Passo 2 — DTOs para cada recurso do MVP

Para **cada** recurso (o mínimo da P2 são 2), em `src/<area>/dto/`:

- [ ] `criar-<recurso>.dto.ts` com as regras da organização (tamanhos, intervalos, obrigatórios)
- [ ] `atualizar-<recurso>.dto.ts` com `PartialType`
- [ ] `listar-<recurso>.dto.ts` com `pagina`, `tamanho` (teto 100) e os filtros do contrato
- [ ] `<recurso>.resposta.ts` com o método `de()`

O **service** passa a receber o DTO e traduzir para a entidade:

```ts
async criar(dto: CriarAtendimentoDto) {
  const { servicoIds, ...campos } = dto;
  const atendimento = this.atendimentos.create(campos);
  if (servicoIds) atendimento.servicos = servicoIds.map((id) => ({ id }) as Servico);
  await this.atendimentos.save(atendimento);
  return this.buscarUm(atendimento.id);   // rebusca com as relações, para o DTO de saída
}
```

> ⚠️ No `atualizar`, **`undefined` significa "não mexa"** e `[]` significa "remova todos".
> Sem o `if (servicoIds)`, editar só a descrição apagaria os serviços.

### Passo 3 — O controller completo

```ts
@ApiTags("atendimentos")
@Controller("atendimentos")
export class AtendimentosController {
  constructor(private readonly atendimentos: AtendimentosService) {}

  @Get()
  @ApiOkResponse({ type: [AtendimentoResposta] })
  async listar(@Query() filtros: ListarDto) {
    const r = await this.atendimentos.listar(filtros);
    return { ...r, itens: r.itens.map(AtendimentoResposta.de) };
  }

  @Get(":id")
  @ApiOkResponse({ type: AtendimentoResposta })
  @ApiNotFoundResponse({ description: "Atendimento não encontrado" })
  async buscarUm(@Param("id", ParseIntPipe) id: number) {
    return AtendimentoResposta.de(await this.atendimentos.buscarUm(id));
  }

  @Post()
  @ApiCreatedResponse({ type: AtendimentoResposta })
  async criar(@Body() dto: CriarAtendimentoDto) {
    return AtendimentoResposta.de(await this.atendimentos.criar(dto));
  }

  @Patch(":id")
  @ApiOkResponse({ type: AtendimentoResposta })
  async atualizar(@Param("id", ParseIntPipe) id: number, @Body() dto: AtualizarAtendimentoDto) {
    return AtendimentoResposta.de(await this.atendimentos.atualizar(id, dto));
  }

  @Delete(":id")
  @HttpCode(204)
  async remover(@Param("id", ParseIntPipe) id: number) {
    await this.atendimentos.remover(id);
  }
}
```

### Passo 4 — Ver a validação agir

Para o recurso principal, testem três casos e anotem o status:

| Requisição | Esperado |
| --- | --- |
| Válida | 201, com o DTO de saída |
| Campo obrigatório vazio + valor fora do intervalo | 400, com **as duas** mensagens |
| Campo que o DTO não declara (`"papel": "admin"`) | 400, `property papel should not exist` |
| `?tamanho=999999` na listagem | 400 |

Depois, procurem a **regra de negócio do cenário principal** que gera conflito (horário
ocupado, item já emprestado, inscrição repetida) e implementem no service com
`ConflictException`.

### Passo 5 — Confrontar o contrato

```bash
npm run gerar:schema
git diff backend/openapi.json
```

Abram o `/api/docs` ao lado do `docs/api.md` do M02 e anotem as diferenças. Para cada uma,
decidam: o código está certo e o rascunho estava errado, ou o contrário? Corrijam e
**versionem o `openapi.json`**. A partir de agora, ele é o contrato vivo.

### Se o projeto recebe arquivos (fotos, documentos)

Upload é opcional no projeto, mas, se existir, a P3 cobra as três decisões:

1. **Teto de tamanho** (`limits.fileSize` no `FileInterceptor`) — sem ele, 4 GB derrubam a API.
2. **Validar o conteúdo, não a extensão**: o `mimetype` vem do cliente. Confira os primeiros
   bytes (JPEG começa com `ff d8 ff`; PNG com `89 50 4e 47`). Um PDF renomeado para `.jpg`
   precisa ser recusado.
3. **Nunca usar o nome enviado**: gere `randomUUID()` + a extensão validada (contra `../../`
   e sobrescrita). E em produção o disco do contêiner é apagado a cada deploy: guarde em
   armazenamento de objetos (M12).

Referência completa: [NestJS — File upload](https://docs.nestjs.com/techniques/file-upload).

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| DTO não valida nada | Falta `useGlobalPipes`, ou o `@Body()` ainda é `Partial<Entidade>` |
| Número da query reprova | Faltou `@Type(() => Number)` ou `transform: true` |
| `/x/algo` responde 400 | Rota literal declarada depois de `@Get(":id")` |
| Resposta traz campos internos | A entidade saiu no lugar do DTO de saída |
| `Cannot read properties of undefined (reading 'nome')` no `de()` | O service não carregou `relations` |
| `PATCH` apagou uma relação | Faltou o `if`: `undefined` não é `[]` |
| `DELETE` responde 200 | Faltou `@HttpCode(204)` |
| Swagger sem formatos | Faltaram os `@ApiProperty` |

## 🤖 IA no fluxo

A IA escreve DTOs com fluência e costuma pular justamente o que importa: `whitelist`, teto do
`tamanho`, `@Type` na query e o DTO de saída ("é só devolver a entidade"). Antes de aceitar,
pergunte: *e se o cliente mandar um campo a mais? E se alguém acrescentar uma coluna sensível
amanhã?*

## ✅ Marco do módulo

- [ ] `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`
- [ ] 2+ recursos com DTOs de entrada, atualização, listagem (com teto) e saída
- [ ] Nenhum controller devolve entidade; nenhum `if` de validação à mão
- [ ] Status corretos (201, 204, 400, 404, 409) e a regra de conflito do cenário principal
- [ ] `openapi.json` versionado, conferido contra o `docs/api.md`

## 📚 Para aprofundar

- [`cheatsheet.md`](cheatsheet.md) — decorators de validação, de rota e do Swagger
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation) · [OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [OWASP — Mass Assignment](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
