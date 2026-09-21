# M07 — API: rotas, controllers e DTOs

> **CH:** 6h (3h teóricas · 3h práticas) · **Semana 7** · **Pré-requisitos:** M03, M06

Fecha o backend. Aqui a ementa é atendida em dois itens: *"mapeamento de URLs"* e *"criação
de classes, métodos e funções para processamento das requisições"*.

O M06 terminou com um CRUD que funciona e **aceita qualquer coisa**. Este módulo conserta o
"qualquer coisa" — e ao final a API está pronta para consumo externo e integração segura.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 2, 5, 10, 12, 13,
> 15 e 17 — em que a gente para de digitar e pensa — mais as explicações dentro de cada
> etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Desenhar rotas REST coerentes, com o método e o status corretos.
2. Validar entrada com DTOs, sem escrever `if` de validação.
3. Explicar por que a entidade **não** deve ser exposta na resposta.
4. Receber upload de arquivo com validação de tipo, tamanho e nome.
5. Publicar e revisar a documentação Swagger em `/api/docs`, com contrato OpenAPI, exemplos e erros.

---

## 🧭 O que você vai construir

A mesma API do M06, mas que agora **recusa** o que não deveria aceitar e **não entrega** o
que não deveria mostrar:

```
POST /api/obras  {"titulo":"","anoPublicacao":3000}   → 400, com as duas falhas listadas
POST /api/obras  {"titulo":"X","destaque":true}       → 400: campo não declarado
GET  /api/obras?tamanho=999999                        → 400: teto de paginação
GET  /api/obras/1                                     → só os campos que a tela usa
POST /api/obras/1/capa                                → upload validado
GET  /api/docs                                        → contrato completo, com formatos
```

E um `openapi.json` versionado, usado por clientes externos e pelo CI para verificar o contrato.

## 📋 Como este módulo funciona

Dezoito etapas. As três primeiras partem de um problema seu — o `POST` que passou no M06 e
não deveria — e o resto constrói a solução por partes.

| Parte | O que é |
| --- | --- |
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

> 🪟 No PowerShell, escreva `curl.exe`; no macOS e Linux, `curl`. Para o corpo JSON no
> PowerShell, use aspas duplas escapadas (`-d "{\"titulo\":\"X\"}"`); no macOS e Linux, aspas
> simples em volta (`-d '{"titulo":"X"}'`).

### As dezoito etapas

| # | Etapa | Min | O que entra |
| --- | --- | --- | --- |
| 1 | [Ligar a validação global](#etapa-1--ligar-a-validação-global-15-min) | 15 | `ValidationPipe` |
| 2 | [**Por que nada mudou**](#etapa-2--por-que-nada-mudou-15-min) | 15 | **o pipe precisa de um DTO** |
| 3 | [O primeiro DTO de entrada](#etapa-3--o-primeiro-dto-de-entrada-25-min) | 25 | `class-validator` |
| 4 | [Ver a validação agir](#etapa-4--ver-a-validação-agir-20-min) | 20 | três casos |
| 5 | [**Por que DTO e não a entidade**](#etapa-5--por-que-dto-e-não-a-entidade-25-min) | 25 | ***mass assignment*** |
| 6 | [O DTO de atualização](#etapa-6--o-dto-de-atualização-15-min) | 15 | `PartialType` |
| 7 | [A query também é entrada](#etapa-7--a-query-também-é-entrada-20-min) | 20 | teto de paginação |
| 8 | [O service passa a falar em DTO](#etapa-8--o-service-passa-a-falar-em-dto-25-min) | 25 | tradução DTO → entidade |
| 9 | [DTO de saída](#etapa-9--dto-de-saída-30-min) | 30 | desenhar a resposta |
| 10 | [**O recurso é um substantivo**](#etapa-10--o-recurso-é-um-substantivo-25-min) | 25 | **REST na prática** |
| 11 | [O controller completo](#etapa-11--o-controller-completo-25-min) | 25 | as cinco rotas |
| 12 | [**Escolher o status certo**](#etapa-12--escolher-o-status-certo-20-min) | 20 | **201, 204, 400, 404** |
| 13 | [**Erros no formato do domínio**](#etapa-13--erros-no-formato-do-domínio-10-min) | 10 | exceções do Nest |
| 14 | [Upload: receber o arquivo](#etapa-14--upload-receber-o-arquivo-25-min) | 25 | `multipart`, `FileInterceptor` |
| 15 | [**Upload: as três decisões**](#etapa-15--upload-as-três-decisões-30-min) | 30 | **segurança de arquivo** |
| 16 | [Regerar o contrato](#etapa-16--regerar-o-contrato-15-min) | 15 | OpenAPI com formatos |
| 17 | [**As quatro camadas**](#etapa-17--as-quatro-camadas-15-min) | 15 | **fecho do backend** |
| 18 | [O que vai para o M08](#etapa-18--o-que-vai-para-o-m08-5-min) | 5 | — |

---

## Etapa 1 — Ligar a validação global (15 min)

**Faça:**

```powershell
cd C:\dev\bibliocom\backend
```

```powershell
npm install class-validator class-transformer
```

| Pacote | Para quê |
| --- | --- |
| `class-validator` | Os decorators de regra: `@IsString`, `@Min`, `@IsOptional`… |
| `class-transformer` | Converte o JSON cru numa **instância** da sua classe. Sem isto, os decorators não teriam onde agir |

**Faça:** em `src\main.ts`, ao lado do `setGlobalPrefix` do M03:

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

**Linha a linha:**

| Opção | O que faz | Por que importa |
| --- | --- | --- |
| `useGlobalPipes` | Aplica o pipe a **todas** as rotas. Um `ParseIntPipe` vale para um parâmetro; este vale para a aplicação inteira |
| `whitelist: true` | **Remove** propriedades não declaradas no DTO | É a proteção contra *mass assignment* — etapa 5 |
| `forbidNonWhitelisted: true` | Em vez de remover em silêncio, responde **400** | Erro de integração aparece cedo, não em produção |
| `transform: true` | Converte o corpo numa instância do DTO e faz coerção de tipo | Sem isto, `"42"` da *query string* continua sendo texto |

> **Pipe de novo.** É o mesmo conceito do `ParseIntPipe` do M03, etapa 14c: uma peça que roda
> **entre a requisição e o seu método**, e que pode recusar sozinha. Terceiro uso do mesmo
> mecanismo.

**Rode:** reinicie e repita o `POST` que passou no M06:

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"X\",\"autorId\":1,\"destaque\":true}"
```

**Deu certo se:** ele **continua passando**. Sim, continua — e a próxima etapa explica por
quê.

---

## Etapa 2 — Por que nada mudou (15 min)

Você ligou uma proteção global e o ataque continuou funcionando. Isso não é bug: é como o
mecanismo funciona, e entender por quê evita duas horas de confusão.

### O pipe precisa de algo para ler

O `ValidationPipe` olha para o **tipo declarado** no `@Body()` e procura decorators de
validação nele. Hoje o seu controller tem:

```ts
@Post()
criar(@Body() dados: Partial<Obra>) { … }
```

`Partial<Obra>` é um **tipo do TypeScript**, não uma classe. E tipos do TypeScript
**desaparecem** quando o código vira JavaScript — é a mesma lição do experimento do
`ParseIntPipe` no M03, etapa 14e.

```
o que você escreveu     Partial<Obra>
o que existe ao rodar   Object
o que o pipe encontra   nenhuma regra
o que ele faz           nada
```

### O que precisa existir

| Precisa | Por quê |
| --- | --- |
| Uma **classe**, não um tipo | Classe sobrevive à compilação; tipo não |
| Com **decorators** de validação | São eles que o pipe lê, como o `@Get` é lido pelo roteador |

É exatamente isso que um **DTO** é: uma classe que descreve o formato aceito, com as regras
anexadas por decorator.

> DTO significa *Data Transfer Object* — objeto de transferência de dados. O nome é pomposo
> para uma ideia simples: **uma classe que existe só para descrever o que entra e o que sai**,
> separada da entidade que descreve o que é guardado.

O pipe está ligado e funcionando. Falta dar a ele o que ler — é a etapa 3.

---

## Etapa 3 — O primeiro DTO de entrada (25 min)

**Faça:** crie `src\acervo\dto\criar-obra.dto.ts`:

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

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@IsString()`, `@IsInt()` | Conferem o tipo **em tempo de execução** — que é onde o TypeScript não alcança |
| `@Length(1, 200)` | Mínimo 1 impede título vazio; 200 casa com o `@Column({ length: 200 })` da entidade |
| `@Min(1400) @Max(2100)` | Ano de publicação plausível. Uma regra de negócio, escrita onde ela pode ser aplicada |
| `@IsOptional()` | **Sem ele, `undefined` reprova nas outras regras.** Campo opcional precisa dizer isso explicitamente |
| `@IsInt({ each: true })` | Valida **cada item** do array, não o array |
| `@ApiProperty` / `@ApiPropertyOptional` | Alimentam o Swagger. É o que faz a documentação nascer do código — etapa 16 |
| `?` em `anoPublicacao?` | O lado TypeScript do `@IsOptional`. Os dois precisam concordar |

### Duas decisões que parecem detalhe e não são

**`categoriaIds`, não `categorias`.** O cliente manda **ids**, não objetos de categoria. O que
ele envia e o que existe no banco são coisas diferentes — e essa diferença **é a razão de o
DTO existir**. Se fossem sempre iguais, bastaria a entidade.

**Os limites repetem a entidade de propósito.** `Length(1, 200)` aqui e `length: 200` no
`@Column` do M04 dizem a mesma coisa em dois lugares. Parece duplicação, e é — mas cada uma
protege num ponto diferente: o DTO recusa **antes** de tocar o banco, com mensagem legível;
a coluna é a última linha de defesa, inclusive contra código que não passa pela API.

**Faça:** use no controller. Troque **só** a assinatura do `POST`:

```ts
@Post()
criar(@Body() dto: CriarObraDto) {
  return this.acervo.criar(dto);
}
```

⚠️ **O TypeScript vai reclamar:** `CriarObraDto` não é `Partial<Obra>`, porque `categoriaIds`
não é um campo da entidade. **Deixe o erro aí** — a etapa 8 conserta o service. O
`npm run start:dev` roda mesmo com erro de tipo, então dá para testar antes.

---

## Etapa 4 — Ver a validação agir (20 min)

Os três casos que justificam o módulo.

**Faça — 1. o caso válido:**

```powershell
curl.exe -s -i -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"Memórias Póstumas\",\"anoPublicacao\":1881,\"autorId\":1}"
```

**Faça — 2. título vazio e ano impossível:**

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"\",\"anoPublicacao\":3000,\"autorId\":1}"
```

**Faça — 3. campo que o DTO não declara:**

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"X\",\"autorId\":1,\"destaque\":true}"
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

**Preencha:**

| Requisição | Status | O corpo explica o erro? |
| --- | --- | --- |
| Válida | | |
| Título vazio, ano 3000 | | |
| Campo `destaque` não declarado | | |

### Duas coisas para reparar

**A segunda resposta traz as duas falhas, não a primeira que apareceu.** O `class-validator`
avalia tudo e devolve a lista completa. É por isso que um formulário no M11 consegue marcar
dois campos errados de uma vez, em vez de fazer o usuário descobrir um por vez.

**O terceiro caso é o `forbidNonWhitelisted` em ação.** O mesmo `destaque` que passou na
etapa 1 agora é **recusado**. É a diferença entre uma API que avisa e uma que grava lixo em
silêncio.

**E repare no que você não escreveu:** nenhum `if`, nenhum `try`, nenhuma montagem de
mensagem de erro. Você declarou o formato; o framework fez o resto.

---

## Etapa 5 — Por que DTO e não a entidade (25 min)

Você acabou de ver a proteção funcionar. Agora o raciocínio completo — porque são **três**
problemas distintos, e o DTO de entrada resolve só o primeiro.

### Problema 1 — *mass assignment* (entrada)

É o que você testou no caso 3. Com `@Body() dados: Partial<Obra>`, o cliente escolhe **quais
campos** gravar. Ele manda:

```json
{"titulo":"X", "destaque":true, "criadoEm":"1999-01-01"}
```

e os três são gravados, porque o service só faz `save(dados)`.

O nome vem daí: uma **atribuição em massa** de tudo que veio no corpo. O atacante não precisa
de nada sofisticado — basta descobrir um campo que você não esperava.

| Campo | O que ele consegue |
| --- | --- |
| `destaque` | Pôr a própria obra na vitrine |
| `criadoEm` | Forjar a data de cadastro |
| `papel` (numa entidade `Usuario`) | **Virar administrador** |

A última linha é a que aparece nos relatórios de incidente. E ela vai existir no M12.

> **A regra:** o DTO define **o que é aceito**; o resto vai para o lixo. `whitelist: true` é a
> linha que executa isso.

### Problema 2 — vazamento (saída)

O inverso, e o DTO de entrada não resolve. Hoje o controller devolve a **entidade inteira**:

```ts
return this.acervo.buscarUm(id);   // devolve tudo que a tabela tem
```

Enquanto a entidade é `Obra`, o prejuízo é excesso de dados. Quando existir `Usuario` (M12),
com um campo `senhaHash`, devolvê-la inteira **publica o hash de todo mundo**.

E não adianta lembrar de tirar: alguém acrescenta um campo sensível à entidade seis meses
depois, e ele **aparece na resposta sozinho**, sem ninguém decidir isso.

### Problema 3 — acoplamento (contrato)

Se a resposta **é** a entidade, então renomear uma coluna quebra clientes externos. A decisão de
banco vaza para o contrato público da API.

Com DTO de saída existe uma camada onde a mudança é **absorvida de propósito**: renomeia-se a
coluna, ajusta-se uma linha no DTO, e quem consome não percebe.

### O desenho completo

```
Requisição ──▶ [ DTO de entrada ] ──▶ Service ──▶ Entidade ──▶ Banco
Resposta   ◀── [ DTO de saída   ] ◀── Service ◀── Entidade ◀── Banco
```

Duas fronteiras, duas classes, dois problemas diferentes. A etapa 9 constrói a de saída.

💼 **No mercado:** *"como você evita mass assignment?"* é pergunta de entrevista para vaga
júnior de backend. A resposta completa tem duas partes — DTO **e** `whitelist` —, e quem cita
só uma normalmente decorou.

---

## Etapa 6 — O DTO de atualização (15 min)

O `PATCH` aceita qualquer subconjunto dos campos. Escrever outra classe com tudo opcional
seria duplicação — e duplicação sai de sincronia.

**Faça:** crie `src\acervo\dto\atualizar-obra.dto.ts`:

```ts
import { PartialType } from "@nestjs/swagger";
import { CriarObraDto } from "./criar-obra.dto.js";

export class AtualizarObraDto extends PartialType(CriarObraDto) {}
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `PartialType(...)` | Uma função que **devolve uma classe nova**, com todos os campos do original marcados como opcionais |
| `extends` | A classe resultante é a base da sua |
| as validações | **São preservadas.** `titulo` continua limitado a 200 caracteres — só deixa de ser obrigatório |
| de `@nestjs/swagger` | Existe uma versão em `@nestjs/mapped-types` também; a do Swagger preserva os `@ApiProperty` junto |

Uma linha em vez de um arquivo duplicado. E é exatamente a semântica do `PATCH`: **mande só o
que mudou, mas o que você mandar tem de ser válido**.

**Faça:** no controller:

```ts
@Patch(":id")
atualizar(@Param("id", ParseIntPipe) id: number, @Body() dto: AtualizarObraDto) {
  return this.acervo.atualizar(id, dto);
}
```

**Deu certo se:** um `PATCH` com `{"anoPublicacao": 3000}` responde 400, e com
`{"anoPublicacao": 1900}` responde 200 — a regra vale, mas o campo não é mais obrigatório.

---

## Etapa 7 — A query também é entrada (20 min)

Quase todo mundo valida o corpo e esquece a *query string*. Ela vem do mesmo lugar — do
cliente — e merece o mesmo tratamento.

**Faça:** crie `src\acervo\dto\listar-obras.dto.ts`:

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

**Linha a linha:**

| Trecho | Por quê |
| --- | --- |
| `@Type(() => Number)` | *Query string* chega **sempre** como texto. Sem esta conversão, `@IsInt` reprovaria `"2"` |
| `= 1` e `= 20` | Valor padrão na própria classe. **Some o `Number(pagina) \|\| 1` feio do M06** |
| `@Min(1)` na página | Página 0 ou negativa geraria `OFFSET` inválido |
| **`@Max(100)` no `tamanho`** | O teto que faltava. Ver abaixo |

### O `@Max(100)` é segurança, não capricho

A etapa 3 do M06 terminou com uma dívida: *"hoje `?tamanho=999999` funciona"*. É esta linha
que paga.

Sem teto, o cliente decide quanto trabalho o seu servidor vai fazer. Uma requisição pedindo
o acervo inteiro custa memória no banco, memória no Node, e banda — e repetir essa requisição
algumas vezes derruba a aplicação sem precisar de nenhuma técnica de ataque.

> É a mesma classe de problema do `limits.fileSize` que aparece na etapa 14: **todo limite
> que o cliente controla precisa de um teto que o servidor imponha.**

**Faça:** no controller:

```ts
@Get()
listar(@Query() filtros: ListarObrasDto) {
  return this.acervo.listar(filtros.pagina, filtros.tamanho);
}
```

Repare que `@Query()` agora vem **sem nome**: ele captura a query inteira e a valida como um
objeto, em vez de pescar um campo por vez.

**Rode:**

```powershell
curl.exe -s -i "http://localhost:3000/api/obras?tamanho=999999"
```

**Deu certo se:** responde **400** com `tamanho must not be greater than 100`. Antes desta
etapa, essa mesma URL mandava o banco inteiro pela rede.

---

## Etapa 8 — O service passa a falar em DTO (25 min)

Agora o erro de tipo que a etapa 3 deixou pendente. O service precisa lidar com
`categoriaIds`, que é um campo do **pedido** e não da tabela.

**Faça:**

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

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `const { categoriaIds, ...campos }` | Desestruturação com *rest*: separa `categoriaIds` e junta **todo o resto** em `campos`. É a tradução DTO → entidade, e ela mora no service |
| `({ id }) as Categoria` | Para ligar uma relação basta o id. O TypeORM grava as linhas em `obra_categoria` a partir disso, sem carregar as categorias inteiras |
| `if (categoriaIds)` | **No `PATCH`, `undefined` significa "não mexa nas categorias" e `[]` significa "tire todas".** São coisas diferentes, e sem o `if` você apagaria as categorias em toda atualização que não as mencionasse |
| `return this.buscarUm(...)` | Rebusca **com as relações carregadas**, para o DTO de saída da etapa 9 ter o que ler |

> A linha do `if (categoriaIds)` é sutil e vale reler. É o tipo de bug que passa em todo teste
> e aparece quando um usuário edita só o título de uma obra e perde as categorias dela.

**Deu certo se:** o erro de tipo some, o `POST` da etapa 4 continua respondendo 201, e um
`POST` com `"categoriaIds":[1,2]` devolve a obra ligada às duas categorias.

---

## Etapa 9 — DTO de saída (30 min)

Falta o lado da resposta — o problema 2 da etapa 5.

**Faça:** crie `src\acervo\dto\obra.resposta.ts`:

```ts
import { ApiProperty } from "@nestjs/swagger";
import { Obra } from "../entidades/obra.entity.js";

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

**Faça:** use no `@Get(":id")`:

```ts
@Get(":id")
async buscarUm(@Param("id", ParseIntPipe) id: number) {
  return ObraResposta.de(await this.acervo.buscarUm(id));
}
```

**Rode:** chame `/api/obras/1` antes e depois, e **compare as duas respostas lado a lado**.

### O que sumiu, e o que apareceu

| Sumiu | Por quê |
| --- | --- |
| `criadoEm`, `atualizadoEm` | Auditoria interna. O cliente não usa |
| `autorId` cru | Redundante: a autora já vem como objeto |
| A biografia inteira da autora | A tela mostra o nome. Trazer o resto é banda desperdiçada |
| `isbn` vazio, `subtitulo` vazio | Campos que só o formulário de cadastro usa |
| A lista completa de exemplares | Dez objetos com tombo e estado, para a tela mostrar um número |

| Apareceu | Por quê |
|---|---|
| `exemplaresDisponiveis` | Um número **calculado** que a entidade não tem. Sem ele, cada cliente faria a contagem — ou três requisições |

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `static de(obra)` | Um método de classe, chamado sem instanciar: `ObraResposta.de(x)`. A tradução mora **no DTO**, não espalhada pelos controllers |
| `?? []` nas duas relações | Se alguém chamar o `de()` com uma obra buscada **sem** `relations`, o `map` receberia `undefined` e quebraria. O `?? []` devolve zero em vez de derrubar |
| `autor: { id, nome }` | Só os dois campos necessários ao consumidor |
| `@ApiProperty({ nullable: true })` | Documenta que o campo pode vir nulo no contrato OpenAPI |

> **Esse é o argumento do DTO de saída.** Não é cerimônia: é **desenhar a resposta para quem
> vai consumi-la**, em vez de despejar a tabela e desejar boa sorte.
>
> ⚠️ O `de()` **exige** que a obra venha com `autor` carregado. Se aparecer
> `Cannot read properties of undefined (reading 'nome')`, o service buscou sem `relations` —
> é o M06 cobrando.

---

## Etapa 10 — O recurso é um substantivo (25 min)

Você tem entrada e saída resolvidas. Falta desenhar **as rotas** — e há uma convenção que
economiza discussão em toda equipe.

### O erro comum

```
❌ POST /api/criarObra              ✅ POST   /api/obras
❌ GET  /api/obras/deletar/42       ✅ DELETE /api/obras/42
❌ GET  /api/buscarObrasPorAutor    ✅ GET    /api/obras?autorId=3
```

A URL identifica **o quê**; o método HTTP diz **o que fazer** com ele. **Verbo na URL é sinal
de que o método HTTP está sendo ignorado** — e de que a API vai crescer inventando um nome
novo para cada operação.

### O mapa completo

| Método | Rota | Faz | Status de sucesso |
| --- | --- | --- | --- |
| `GET` | `/obras` | Lista | 200 |
| `GET` | `/obras/42` | Detalha | 200 · **404** se não existe |
| `POST` | `/obras` | Cria | **201** |
| `PATCH` | `/obras/42` | Altera parcialmente | 200 |
| `PUT` | `/obras/42` | Substitui inteiro | 200 |
| `DELETE` | `/obras/42` | Remove | **204** (sem corpo) |

Repare que **`/obras` aparece duas vezes** e `/obras/42` aparece quatro. Não são seis
endereços: são dois, com métodos diferentes. É isso que a convenção compra — o cliente que
souber o padrão consegue adivinhar a API inteira.

### `PATCH` ou `PUT`?

| | `PUT` | `PATCH` |
| --- | --- | --- |
| Semântica | Substitui o recurso **inteiro** | Altera **só o que veio** |
| Campo omitido | É **apagado** | Fica como estava |
| Serve para | Substituição completa | Formulário de edição |

Formulário de edição quase sempre quer `PATCH` — quem edita o título de uma obra não espera
perder o ISBN. **Este material usa `PATCH`**, e é por isso que a etapa 6 usou `PartialType`.

### Por que o status importa

Responder `200` para tudo obriga o cliente a **abrir o corpo** da resposta para descobrir se
deu certo. Com status correto, ele decide olhando um número:

```
if (resposta.status >= 400) → mostrar erro
```

É por confiar no status que o M08 consegue tratar erro **num lugar só**, em vez de espalhar
verificação por cada tela.

---

## Etapa 11 — O controller completo (25 min)

**Faça:** junte tudo:

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

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@ApiTags("obras")` | Agrupa as rotas numa seção do Swagger. Sem ele, tudo cai em "default" |
| `@HttpCode(201)` | O padrão do Nest **já é** 201 no `POST`; explicitar deixa o contrato legível para quem lê o código |
| `@HttpCode(204)` | Este **é** necessário: o padrão do `DELETE` seria 200 |
| retorno vazio no `DELETE` | 204 significa "sem conteúdo". Devolver corpo aqui contradiz o status |
| `@ApiNotFoundResponse` | Documenta o **caminho de erro**. Contrato que só descreve o sucesso é contrato pela metade |
| `@ApiOkResponse({ type: [ObraResposta] })` | Os colchetes dizem "array de". É o que faz o M15 gerar o tipo certo |

**Rode:**

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X DELETE http://localhost:3000/api/obras/1
```

**Deu certo se:** responde **204** e não devolve corpo nenhum.

⚠️ **Ordem de rotas, pela terceira vez.** Se você criar `@Get("destaques")` **depois** de
`@Get(":id")`, a requisição a `/obras/destaques` casa com `:id` e o `ParseIntPipe` responde
400. Rotas literais vêm **antes** das paramétricas — mesma regra do M03 e do M06.

---

## Etapa 12 — Escolher o status certo (20 min)

Você usou cinco status. Vale saber escolher, porque é decisão de projeto e cai em entrevista.

### A família dos 2xx — deu certo

| Status | Quando |
| --- | --- |
| **200** OK | Sucesso com corpo. O caso comum |
| **201** Created | Criou um recurso novo. Idealmente com o recurso no corpo |
| **204** No Content | Sucesso **sem** corpo. Típico do `DELETE` |

### A família dos 4xx — o cliente errou

| Status | Quando | No seu código |
| --- | --- | --- |
| **400** Bad Request | A entrada não faz sentido | O `ValidationPipe` (etapa 4) |
| **401** Unauthorized | Não sabemos quem você é | M12 |
| **403** Forbidden | Sabemos quem você é, e você não pode | M12 |
| **404** Not Found | O recurso não existe | `NotFoundException` (M03) |
| **409** Conflict | Conflito com o estado atual | Tombo duplicado, por exemplo |
| **422** Unprocessable | Sintaxe certa, semântica errada | Ver abaixo |

**400 ou 422?** Há discussão genuína. A leitura mais útil: **400** para entrada malformada
(campo faltando, tipo errado) e **422** para entrada bem formada que viola regra de negócio
("data de devolução anterior à de saída"). O Nest usa 400 por padrão no `ValidationPipe`, e
este material fica com isso — o importante é a equipe escolher **uma** convenção.

### A família dos 5xx — você errou

| Status | Quando |
|---|---|
| **500** Internal Server Error | Exceção não tratada |

⚠️ **500 nunca deve vazar detalhe.** Se a resposta traz o *stack trace* ou a mensagem do banco,
você está dando ao atacante o mapa da aplicação — nome de tabela, versão da biblioteca,
caminho de arquivo. O Nest já protege por padrão em produção; o M13 confere isso.

**Exercite:** que status para cada situação?

| Situação | Status |
| --- | --- |
| `POST /obras` com sucesso | |
| `POST /exemplares` com tombo repetido | |
| `GET /obras/9999` inexistente | |
| Empréstimo recusado por limite de 3 em aberto | |
| `PATCH /obras/42` sem estar autenticado | |

> As duas últimas merecem discussão em sala. E a de autenticação é para **responder no
> papel**: a API do M07 ainda é aberta, e os guards chegam no M12.

---

## Etapa 13 — Erros no formato do domínio (10 min)

Você já usa isso desde o M03, sem ter visto o conjunto.

```ts
throw new NotFoundException("Obra não encontrada");
throw new ConflictException("Já existe exemplar com este tombo");
throw new ForbiddenException("Você não pode editar obra de outro usuário");
throw new BadRequestException("Envie um arquivo em 'arquivo'");
```

Cada uma vira o status certo, com corpo JSON padronizado, sem você escrever número nenhum.

| O service faz | O framework faz |
| --- | --- |
| Lança linguagem de **domínio** ("não encontrada") | Traduz para HTTP (404) |
| Descreve o problema em português | Monta `{message, error, statusCode}` |
| Não importa `Response` | Escreve a resposta |

**É o mesmo princípio da separação de camadas do M03, etapa 11:** o service não sabe que HTTP
existe. Se você precisou importar `Request` ou `Response` dentro dele, a lógica está na camada
errada.

> **A regra que resolve a dúvida na hora de escrever:** lance a exceção que descreve **o que
> aconteceu no negócio**, não o status que você quer. `ConflictException` porque *há
> conflito*, e o 409 vem junto — não `HttpException(409)` porque você quer um 409.

---

## Etapa 14 — Upload: receber o arquivo (25 min)

Toda obra tem capa. É o requisito mais comum de qualquer CRUD e um dos que mais aparecem mal
feitos.

**Faça:**

```powershell
npm install -D @types/multer
```

**Faça:** no controller:

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

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `POST :id/capa` | Uma **sub-rota** do recurso. A capa pertence à obra, e a URL diz isso |
| `FileInterceptor("arquivo")` | Lê o campo `arquivo` de um corpo `multipart/form-data` |
| `multipart/form-data` | O formato do M01 para enviar binário. **JSON não transporta binário** — teria de virar base64, crescendo 33% |
| `limits.fileSize` | **Teto obrigatório.** Sem ele, uma requisição de 4 GB derruba o servidor — mesma classe de problema do `@Max` da etapa 7 |
| `fileFilter` | Recusa tipos fora da lista **antes** de gravar |
| `cb(null, booleano)` | O padrão de *callback* do Node: primeiro argumento é erro, segundo é o resultado |
| `@UploadedFile()` | Entrega o arquivo já lido, com `buffer`, `mimetype` e `originalname` |
| `if (!arquivo)` | O interceptor não obriga o envio. Sem este `if`, o método receberia `undefined` |

**Rode:**

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:3000/api/obras/1/capa -F "arquivo=@capa.jpg"
```

**Deu certo se:** responde 201 com um `.jpg` e 400 com um `.pdf`.

> 🔒 **Este endpoint está aberto, e não deveria.** Upload é escrita: qualquer pessoa na
> internet pode encher o seu disco. O M12 traz autenticação e volta aqui para pôr um
> `@UseGuards` nesta rota. **Anote a dívida no código**, com um comentário
> `// TODO(M12): exigir autenticação`, para ela não sumir de vista.

---

## Etapa 15 — Upload: as três decisões (30 min)

O código da etapa 14 funciona e ainda está inseguro. Três decisões que ninguém toma no seu
lugar.

### 1. Confie no conteúdo, não na extensão nem no `Content-Type`

O `mimetype` que o `fileFilter` recebe vem **do cliente** — quem envia escolhe o que declarar.
Um arquivo `.php` renomeado para `.jpg`, com `Content-Type: image/jpeg`, passa pelo filtro
sem esforço.

**Faça:** confira os *magic bytes* — os primeiros bytes que identificam o formato de verdade:

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

| Trecho | O que faz |
| --- | --- |
| `0xff, 0xd8, 0xff` | Todo JPEG começa com esses três bytes. É parte do formato, não convenção |
| `0x89, 0x50, 0x4e, 0x47` | O PNG começa com `\x89PNG` |
| `every((b, i) => buffer[i] === b)` | Compara byte a byte, na posição |

### 2. Nunca use o nome de arquivo enviado pelo cliente

```ts
const nome = arquivo.originalname;                                // ❌
const nome = `${randomUUID()}${extname(arquivo.originalname)}`;   // ✅
```

O nome original é **entrada do usuário como qualquer outra**, e serve para três ataques:

| Nome enviado | O que consegue |
| --- | --- |
| `../../etc/cron.d/tarefa` | *Path traversal*: escrever fora da pasta de uploads |
| `capa.jpg` (o mesmo de outra pessoa) | Sobrescrever o arquivo de outro usuário |
| `orçamento-final-v3.jpg` | Vazar informação pelo próprio nome |

`randomUUID()` resolve os três: nome imprevisível, único, e sem informação. A extensão você
deriva do que **validou**, não do que veio.

### 3. Disco de contêiner é efêmero

Na PaaS do M16, o disco é recriado a cada deploy: **os uploads somem**. Não é falha, é como
contêiner funciona.

| Ambiente | Onde gravar |
| --- | --- |
| Desenvolvimento | `backend/uploads/` — e ponha no `.gitignore` |
| Produção | Armazenamento de objetos: S3, R2, Blob |

> O código muda **em um lugar só** se você isolar a gravação num service — `salvarCapa`
> decide onde, e o controller nem sabe que existe S3. É a separação de camadas do M03 pagando
> mais uma vez.

**Rode — o teste que fecha a etapa:**

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:3000/api/obras/1/capa -F "arquivo=@doc.pdf"
```

Depois **renomeie o PDF para `.jpg`** e reenvie.

**Deu certo se:** os dois respondem 400. Se o segundo passar, falta a checagem de conteúdo do
item 1 — e é exatamente assim que se hospeda malware sem querer.

---

## Etapa 16 — Regerar o contrato (15 min)

O `gerar:schema` já existe desde o M03. Agora que há DTOs de entrada e saída, ele tem muito
mais o que descrever.

**Faça:**

```powershell
npm run gerar:schema
```

**Rode:** abra <http://localhost:3000/api/docs> e confira.

**Deu certo se:** cada rota mostra o **formato** do que aceita e do que devolve — e não só o
caminho.

| O que aparece | Veio de |
| --- | --- |
| `titulo` com `maxLength: 200` | `@Length(1, 200)` no DTO |
| `anoPublicacao` como opcional | `@ApiPropertyOptional` |
| A resposta 404 no `GET /obras/{id}` | `@ApiNotFoundResponse` |
| `categorias` como array de string | `@ApiProperty({ type: [String] })` |

**Faça:** compare com o schema do M03:

```powershell
git diff backend/openapi.json
```

Aquele tinha rotas e nada mais. Este tem os formatos — e é a diferença entre um índice e um
contrato.

**Faça:** commite o arquivo.

O CI passa a **falhar** quando o arquivo commitado não bate com o schema gerado. É assim que
o contrato deixa de ser promessa e vira verificação.

> **Repare no que não aconteceu:** ninguém escreveu documentação. Ela saiu dos mesmos
> decorators que já estavam lá fazendo outra coisa — validar entrada e mapear rota. Quarto
> uso do mecanismo do M03.

---

## Etapa 17 — As quatro camadas (15 min)

O backend está pronto. Vale ver o conjunto, porque agora todas as peças existem.

| Camada | Responsabilidade | Onde você a construiu |
| --- | --- | --- |
| **DTO** | O formato aceito e devolvido | Etapas 3, 6, 7, 9 |
| **Controller** | Rota, status, extração de parâmetros | Etapa 11 |
| **Service** | Regra de negócio | M06, etapa 8 |
| **Repository** | Acesso a dados | M06, etapa 1 |

**A regra que resolve a dúvida de "onde ponho isto?"**, e que agora tem quatro respostas
possíveis em vez de duas:

> O service **não sabe que HTTP existe**. Se você precisou importar `Request` ou `Response`
> dentro dele, a lógica está na camada errada.

E o critério original do M03 continua valendo, agora afiado:

| Este código… | Camada |
| --- | --- |
| muda se a origem não for HTTP | **Controller** |
| descreve o que o cliente pode mandar | **DTO** |
| não muda vindo de um comando de terminal | **Service** |
| fala com o banco | **Repository** |

### O caminho completo de uma requisição

```
POST /api/obras {"titulo":"X","autorId":1}
        │
        ▼
[ ValidationPipe ]   lê o CriarObraDto, recusa o que não bate     ● etapa 1
        │
        ▼
[ Controller ]       extrai o corpo, chama o service              ● etapa 11
        │
        ▼
[ Service ]          separa categoriaIds, monta a entidade        ● etapa 8
        │
        ▼
[ Repository ]       INSERT INTO obra …                           ● M06
        │
        ▼
[ ObraResposta.de ]  monta só o que a tela usa                    ● etapa 9
        │
        ▼
201 + JSON
```

Compare com o diagrama do M03, etapa 20: as caixas que estavam vazias foram preenchidas.
Faltam duas — `Guard` (M12) e `Middleware` (M13) —, e nenhuma delas exige mexer no que você
construiu. **Elas se encaixam em volta**, que era exatamente a promessa da etapa 11 do M03.

---

## Etapa 18 — O que vai para o projeto (5 min)

O backend está pronto para integração. O que a equipe entrega aos consumidores da API:

| Entrega | Onde |
| --- | --- |
| Cinco rotas REST, com métodos e status corretos | `/api/obras` |
| Entrada validada, com mensagens em lista | `ValidationPipe` + DTOs |
| Respostas desenhadas para a tela, sem campo interno | `ObraResposta` |
| Erros padronizados, distinguíveis pelo status | 400, 404, 409 |
| **Um contrato legível por máquina** | `openapi.json` |

A última linha é a que protege a integração: nenhum consumidor precisa adivinhar nomes de campo
ou descobrir formatos por tentativa. O CI compara o schema gerado com o arquivo versionado,
de modo que uma mudança de contrato seja percebida **antes** do deploy.

💼 **No mercado:** desenhar rota, escolher status e validar entrada é o trabalho diário de
quem faz backend. Em entrevista, *"quando você usaria PATCH em vez de PUT?"* e *"como você
evita mass assignment?"* separam quem copiou tutorial de quem entendeu — e você acabou de
implementar as duas respostas.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| DTO não valida nada | Faltou `useGlobalPipes`, ou o `@Body()` ainda está tipado como `Partial<Obra>` — etapa 2 |
| `anoPublicacao` da query reprova sendo número | Faltou `@Type(() => Number)` e `transform: true` |
| `Type 'CriarObraDto' is not assignable to 'Partial<Obra>'` | O service ainda espera a entidade. É a etapa 8 |
| `/obras/destaques` responde 400 | Rota literal declarada depois da paramétrica |
| Resposta traz `senhaHash` ou campos internos | Você devolveu a entidade em vez do DTO de saída |
| `POST` responde 200 | Faltou `@HttpCode(201)` |
| Campos extras são gravados no banco | Faltou `whitelist: true` |
| `Cannot read properties of undefined (reading 'nome')` no DTO de saída | O service não carregou `relations` (M06) |
| `PATCH` sem `categoriaIds` apagou as categorias | Faltou o `if (categoriaIds)`: `undefined` não é `[]` — etapa 8 |
| Swagger vazio | Faltaram os `@ApiProperty` nos DTOs |
| Upload responde 400 sempre | O nome do campo no `FileInterceptor` não bate com o do formulário |
| Arquivo grande derruba o servidor | Faltou `limits.fileSize` |
| PDF renomeado para `.jpg` passa | Falta a checagem de *magic bytes* — etapa 15 |
| Upload some depois do deploy | Disco efêmero — use armazenamento de objetos (M16) |

## ✅ Checklist de saída

- [ ] `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`
- [ ] Cinco rotas REST, com método e status corretos
- [ ] DTOs de entrada com validação declarativa — **nenhum `if` de validação**
- [ ] DTO da **query**, com teto de `tamanho`
- [ ] DTO de saída que **não** expõe a entidade
- [ ] Rotas literais declaradas antes das paramétricas
- [ ] Os três casos da etapa 4 testados e a tabela preenchida
- [ ] Upload com teto de tamanho, filtro de tipo, nome gerado no servidor e conferência de conteúdo
- [ ] O PDF renomeado para `.jpg` foi **recusado**
- [ ] `// TODO(M12)` anotado na rota de upload
- [ ] `/api/docs` completo, com os caminhos de erro documentados
- [ ] `openapi.json` regerado e versionado
- [ ] Você sabe explicar *mass assignment* e as duas coisas que o impedem

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [NestJS — Controllers](https://docs.nestjs.com/controllers)
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation)
- [NestJS — OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [MDN — Códigos de status HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status)
