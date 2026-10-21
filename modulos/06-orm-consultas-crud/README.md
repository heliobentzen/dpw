# M06 — Repository e QueryBuilder: consultas e CRUD

> **Pré-requisitos:** M04, M05 · **Duração:** longa

O item da ementa *"realização de consultas e operações de CRUD utilizando a API do
framework"*. A entidade deixa de ser esquema e passa a ser dado consultado.

> A teoria vem quando o código pede: as etapas 3, 8, 10, 11, 13 e 14 são de raciocínio.

## 📌 O que a avaliação cobra

| Onde | O quê |
| --- | --- |
| [Portfólio](../../avaliacao/rubrica-portfolio.md) | entrega **E2** — ver [📦 Entrega E2](#-entrega-e2--caderno-de-consultas) no fim |
| [Projeto](../../avaliacao/) | Etapa 2 · critérios 2 e 3 · Etapa 3 · B4 (filtros, paginação, sem N+1) e D4 (SQL parametrizado). |
| Etapas ➕ opcionais | 14, 15 — nenhuma rubrica as cobra |

## 🎯 Objetivos

Ao final você será capaz de:

1. Fazer CRUD completo pela API do TypeORM.
2. Ler o SQL gerado e relacioná-lo com o código que o produziu.
3. Diagnosticar e corrigir o problema **N+1**, com medição.
4. Escolher entre `Repository`, `QueryBuilder` e SQL puro com critério.

## 🧭 O que você vai construir

O M04 representou o domínio e o M05 versionou o banco. Agora o sistema trabalha com dados
reais: os cinco endpoints do acervo saindo do banco, uma busca com filtros opcionais e uma
operação que grava em duas tabelas sem risco de deixar metade feita.

No caminho, você vai **provocar e medir** o problema de desempenho mais comum de API — com
número na tabela, não por ouvir dizer. O objetivo é passar de "sei criar tabelas" para "sei
buscar e alterar dados sem perder de vista desempenho, segurança e consistência".

## 📋 Como este módulo funciona

Mesmo formato dos anteriores (**Faça → Linha a linha → Rode → Deu certo se**), em quinze
etapas **do mais simples ao mais caro**: leitura, depois volume e medição, por fim escrita,
`QueryBuilder` e transação.

> 🪟 No PowerShell, `curl.exe`; no macOS e Linux, `curl`.

### As quinze etapas

| # | Etapa | Duração | O que entra |
| --- | --- | --- | --- |
| 1 | [Trocar a memória pelo banco](#etapa-1--trocar-a-memória-pelo-banco) | média | `@InjectRepository` |
| 2 | [Listar, paginado desde o começo](#etapa-2--listar-paginado-desde-o-começo) | média | `findAndCount`, `skip`/`take` |
| 3 | [**Por que paginar sempre**](#etapa-3--por-que-paginar-sempre) | média | **paginação não é opcional** |
| 4 | [Buscar uma, com as relações](#etapa-4--buscar-uma-com-as-relações) | média | `relations` |
| 5 | [Popular o banco](#etapa-5--popular-o-banco) | média | volume para medir |
| 6 | [A versão ruim, de propósito](#etapa-6--a-versão-ruim-de-propósito) | média | o laço que mata |
| 7 | [Medir](#etapa-7--medir) | média | contar consultas |
| 8 | [**O que os números dizem**](#etapa-8--o-que-os-números-dizem) | média | **N+1** |
| 9 | [Escrever: criar, atualizar, remover](#etapa-9--escrever-criar-atualizar-remover) | longa | `create`, `save`, `delete` |
| 10 | [**O que está errado de propósito**](#etapa-10--o-que-está-errado-de-propósito) | média | **a ponte para o M07** |
| 11 | [**As duas APIs do TypeORM**](#etapa-11--as-duas-apis-do-typeorm) | média | **Repository × QueryBuilder** |
| 12 | [QueryBuilder e busca](#etapa-12--querybuilder-e-busca) | longa | filtros opcionais |
| 13 | [**Parâmetro não é concatenação**](#etapa-13--parâmetro-não-é-concatenação) | média | **injeção de SQL** |
| 14 | [**Por que transações existem**](#etapa-14--por-que-transações-existem) ➕ | média | **atomicidade** |
| 15 | [Transação na prática](#etapa-15--transação-na-prática) ➕ | longa | por sua conta |

---

## Etapa 1 — Trocar a memória pelo banco

O `AcervoService` ainda é o do M03: array em memória e um endpoint temporário. Os dois saem.

**Faça:** em `src\acervo\acervo.service.ts`, apague o corpo antigo e comece assim:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Obra } from "./entidades/obra.entity.js";
import { Autor } from "./entidades/autor.entity.js";

@Injectable()
export class AcervoService {
  constructor(
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    @InjectRepository(Autor) private readonly autores: Repository<Autor>,
  ) {}
}
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `@InjectRepository(Obra)` | Pede ao Nest o repositório **daquela** entidade. É a injeção do M03, com um decorator a mais para dizer de qual entidade |
| `Repository<Obra>` | O genérico é o que dá tipo ao retorno: `find()` devolve `Obra[]`, não `any[]` |
| por que ele existe | Porque `Obra` está no `forFeature` do `AcervoModule` (M04, etapa 6). Sem aquele registro, este construtor falha com `can't resolve dependencies` |
| dois repositórios | O de `Autor` só será usado na etapa 6, para demonstrar o N+1 |

**Faça:** no `acervo.controller.ts`, **apague o `@Get("nome")`** e o método `nome()`.

Ele já provou que o `ConfigService` funcionava. **Endpoint temporário que sobrevive ao módulo
vira permanente por acidente** — e em três meses ninguém sabe se pode remover.

> O controller fica sem compilar por um minuto; a etapa 2 devolve a listagem.

**Deu certo se:** o `start:dev` reinicia sem `can't resolve dependencies` (se aparecer, a
entidade não está no `forFeature`).

---

## Etapa 2 — Listar, paginado desde o começo

**Faça:** no service:

```ts
async listar(pagina = 1, tamanho = 20) {
  const [itens, total] = await this.obras.findAndCount({
    relations: { autor: true },
    order: { titulo: "ASC" },
    skip: (pagina - 1) * tamanho,
    take: tamanho,
  });
  return { itens, total, pagina, tamanho };
}
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `findAndCount` | Devolve a página **e o total** numa chamada. O total é o que permite a quem consome mostrar "página 3 de 41" |
| `const [itens, total]` | Desestruturação de array: o método devolve um par, e você nomeia os dois de uma vez |
| `relations: { autor: true }` | Traz a autora junto. **Sem isto, `obra.autor` vem `undefined`** — o TypeORM não busca relação que você não pediu |
| `order: { titulo: "ASC" }` | Ordena por título |
| `skip` / `take` | `OFFSET` e `LIMIT` do SQL. A página 1 tem `skip: 0` — daí o `- 1` |
| `pagina = 1, tamanho = 20` | Valores padrão do JavaScript: quem chamar sem argumento recebe a primeira página |

⚠️ **O `order` não é enfeite.** Sem ele, o banco devolve na ordem que lhe convier, e ela
**pode mudar entre consultas**: a página 2 repete itens da página 1.

**Faça:** no controller:

```ts
@Get()
listar(@Query("pagina") pagina?: string, @Query("tamanho") tamanho?: string) {
  return this.acervo.listar(Number(pagina) || 1, Number(tamanho) || 20);
}
```

Acrescente `Query` ao `import` de `@nestjs/common`.

> O `Number(pagina) || 1` é feio de propósito: *query string* chega sempre como texto. O M07
> troca isto por um DTO validado.

**Rode:**

```powershell
curl.exe -s "http://localhost:3000/api/obras?pagina=1&tamanho=5"
```

**Deu certo se:** responde `{"itens":[],"total":0,"pagina":1,"tamanho":5}` — vazio até a
etapa 5 popular o banco.

---

## Etapa 3 — Por que paginar sempre

Você escreveu `take` sem discutir. Ele separa uma API que aguenta o segundo ano de uma que não.

**O que acontece sem `take`:**

```ts
await this.obras.find();     // devolve o banco inteiro
```

| Com… | O que acontece |
| --- | --- |
| 20 registros de teste | Instantâneo. Ninguém percebe nada |
| 800 registros | Uns 200 KB de JSON. Ainda passa |
| 200 mil registros do cliente | O banco monta tudo em memória, o Node serializa tudo em memória, a rede carrega tudo, o navegador tenta desenhar tudo |

O último caso não fica lento: **derruba** — e em produção, porque em desenvolvimento ninguém
tem 200 mil registros. É pedir ao bibliotecário **todos os livros** no balcão para escolher
um: com dez, ele traz; com o acervo inteiro, o balcão desaba.

**Quatro custos, não um:**

```mermaid
flowchart LR
    B["Banco monta o resultado<br/>memória do servidor"] --> N["Node serializa em JSON<br/>memória do servidor"]
    N --> R["Rede transporta<br/>tempo e custo"]
    R --> C["Cliente processa<br/>memória e tempo dele"]
```

Paginação corta os quatro de uma vez.

> **A regra deste material:** toda listagem é paginada, desde a primeira linha. Paginar
> depois é fácil no backend e **caro para quem consome**: trocar um *array* por um envelope
> paginado quebra o contrato (M11).

⚠️ **Falta uma proteção.** Hoje `?tamanho=999999` pede o banco inteiro mesmo assim. **Limite
de paginação é segurança** — o M07 põe o teto, junto com a validação da entrada.

---

## Etapa 4 — Buscar uma, com as relações

**Faça:** no service:

```ts
async buscarUm(id: number): Promise<Obra> {
  const obra = await this.obras.findOne({
    where: { id },
    relations: { autor: true, categorias: true, exemplares: true },
  });
  if (!obra) throw new NotFoundException(`Obra ${id} não encontrada`);
  return obra;
}
```

| Trecho | O que faz |
| --- | --- |
| `where: { id }` | Atalho do JavaScript para `{ id: id }` |
| três `relations` | O detalhe da obra mostra autora, categorias e exemplares. A listagem só precisava da autora — **peça o que a resposta usa, não tudo** |
| `findOne` devolve `Obra \| null` | Por isso o `if`. O TypeScript **obriga** você a tratar o caso |
| `NotFoundException` | O mesmo do M03 |

**Faça:** o controller já tem o `@Get(":id")` do M03; troque o corpo para chamar este método.

**Rode:**

```powershell
curl.exe -i http://localhost:3000/api/obras/999
```

**Deu certo se:** responde **404**, com o mesmo corpo de antes.

### O ponto da etapa

A lógica trocou o array em memória pelo PostgreSQL, e **o contrato HTTP não mudou nada** —
quem consome a API não percebe. É a separação de camadas do M03 (etapa 11, **situação 3**):
era uma promessa, agora é um fato observado.

---

## Etapa 5 — Popular o banco

Precisamos de volume para que os problemas de desempenho apareçam.

**Faça:**

```powershell
npm install -D @faker-js/faker
```

Copie [`../../recursos/codigo/semear.ts`](../../recursos/codigo/semear.ts) para
`backend\src\semear.ts` e rode:

```powershell
npx ts-node --esm src/semear.ts
```

| Trecho | O que faz |
| --- | --- |
| `@faker-js/faker` | Gera nomes, títulos e datas plausíveis. `-D` porque é ferramenta de desenvolvimento |
| `ts-node --esm` | Executa o `.ts` direto. O `--esm` casa com o projeto do M03; o `ts-node` você instalou no M05 |
| semente fixa no script | Todo mundo da turma gera **os mesmos dados**, o que torna os tempos comparáveis |

Gera 60 autores, 800 obras e cerca de 2.000 exemplares.

> Com 20 registros tudo é rápido, **inclusive o errado**.

**Rode:**

```powershell
curl.exe -s "http://localhost:3000/api/obras?tamanho=5"
```

**Deu certo se:** devolve cinco obras e um `total` na casa das centenas.

---

## Etapa 6 — A versão ruim, de propósito

Código ruim de propósito: quem só viu a versão certa não reconhece o padrão quando ele
aparece disfarçado num `map`, em outro arquivo.

**O cenário:** listar obras com o nome da autora. O TypeORM não traz relação sem pedir:

```ts
const obras = await this.obras.find();
obras[0].autor;      // undefined — não foi buscado
```

A tentação é buscar cada uma num laço.

**Faça:** no service:

```ts
async listarRuim() {
  const obras = await this.obras.find({ take: 50 });
  for (const obra of obras) {
    const autor = await this.autores.findOneBy({ id: obra.autorId });
    if (autor) obra.autor = autor;
  }
  return obras;
}
```

**Linha a linha:**

| Trecho | Por quê |
| --- | --- |
| `obra.autorId` | O campo declarado no M04, etapa 11c. **Sem ele seria preciso um `as any`** |
| `if (autor)` | `findOneBy` devolve `Autor \| null`. Sem o `if`, o TypeScript recusa a atribuição — e ele está certo |
| `await` **dentro** do `for` | É a linha do problema. Cada volta espera uma ida ao banco antes de começar a próxima |

**Faça:** e a versão boa, ao lado:

```ts
async listarBom() {
  return this.obras.find({ take: 50, relations: { autor: true } });
}
```

**Faça:** exponha as duas em endpoints temporários, `@Get("ruim")` e `@Get("bom")`, **acima**
do `@Get(":id")` — a regra de ordenação de rotas do M03 continua valendo.

**Deu certo se:** as duas respondem 50 obras com `autor` preenchido — **indistinguíveis** de
fora. A diferença está no terminal.

---

## Etapa 7 — Medir

Com o `logging: true`, cada consulta é uma linha `query:` no terminal.

**Faça:** limpe o terminal do `start:dev`, chame um endpoint e conte as linhas. Depois o outro.

```powershell
curl.exe -s -o NUL -w "%{time_total}s`n" http://localhost:3000/api/obras/ruim
```

```powershell
curl.exe -s -o NUL -w "%{time_total}s`n" http://localhost:3000/api/obras/bom
```

*(No macOS ou Linux: `curl -s -o /dev/null -w "%{time_total}s\n" …`)*

| Trecho | O que faz |
| --- | --- |
| `-o NUL` | Joga o corpo fora — não queremos 50 obras na tela |
| `-w "%{time_total}s"` | Imprime **só** o tempo total da requisição |

**Preencha:**

| Versão | Consultas | Tempo |
| --- | --- | --- |
| Ruim (`take: 50`) | | |
| Boa (`take: 50`) | | |

Como referência, numa máquina de desenvolvimento com o banco local: **51 consultas / ~60 ms**
contra **2 consultas / ~9 ms**. Os seus números vão diferir; a proporção, não.

**Agora o teste que importa.** Troque o `take: 50` por `take: 200` nos dois métodos e meça de
novo:

| Versão | Consultas com 200 | Tempo com 200 |
| --- | --- | --- |
| Ruim | | |
| Boa | | |

Referência: **201 consultas / ~253 ms** contra **2 consultas / ~23 ms**.

---

## Etapa 8 — O que os números dizem

Quatro medições — e o que mostram não é o que parece à primeira vista.

| Estratégia | 50 itens | 200 itens | Cresce? |
| --- | --- | --- | --- |
| Sem `relations` | 1 | 1 | Não |
| `relations` + `take` | 2 | 2 | **Não** |
| Buscar no laço | 51 | 201 | **Sim, linearmente** |

### O problema tem nome: N+1

Uma consulta para a lista, mais **uma por item**. A causa mais comum de API lenta, e a mais
fácil de introduzir sem perceber.

É ir ao mercado **uma vez por item da lista**: o arroz, volta para casa; o feijão, volta.
Cada viagem é curta, e a tarde some. O `relations` é levar a lista e comprar tudo de uma vez.

### Por que 2 e não 1

Com `take` **e** relação, o TypeORM faz duas consultas de propósito:

1. seleciona os *ids* da página;
2. busca os dados desses ids, com `JOIN`.

Numa consulta só, o `LIMIT` contaria linhas do **JOIN**, não obras: uma obra com três
categorias comeria três vagas, e você pediria 20 e receberia 7.

### O que importa é crescer ou não

**2 não cresce; 51 cresce.** Os 60 ms de hoje parecem aceitáveis — o problema é depois:

| Mudança | Versão boa | Versão ruim |
| --- | --- | --- |
| O acervo dobra | igual | dobra |
| A página passa a mostrar 200 | igual | quadruplica |
| O banco vai para outro servidor | +1 ida e volta | **+201 idas e voltas** |

A última linha é a que mata: em desenvolvimento, cada consulta custa microssegundos; em
produção, paga a rede — e 201 delas viram segundos.

### Como detectar

> Com o log ligado, chame a rota e **conte as linhas de SQL**. Se o número cresce com o
> tamanho da lista, é N+1.

**Faça:** apague os dois endpoints temporários (os métodos podem ficar no service). **Rota
temporária que fica é dívida.**

💼 **No mercado:** N+1 e falta de paginação são os achados mais comuns em revisão de API
júnior. Demonstrar com o log na mão vale mais que citar o nome.

---

## Etapa 9 — Escrever: criar, atualizar, remover

As três operações de escrita fecham o CRUD.

**Faça:** no service:

```ts
async criar(dados: Partial<Obra>): Promise<Obra> {
  const obra = this.obras.create(dados);
  return this.obras.save(obra);
}

async atualizar(id: number, dados: Partial<Obra>): Promise<Obra> {
  const obra = await this.buscarUm(id);
  Object.assign(obra, dados);
  return this.obras.save(obra);
}

async remover(id: number): Promise<void> {
  const resultado = await this.obras.delete(id);
  if (resultado.affected === 0) throw new NotFoundException(`Obra ${id} não encontrada`);
}
```

**Linha a linha:**

| Método | Detalhe que importa |
| --- | --- |
| `create()` | Só monta a instância **em memória** — não grava nada. O nome engana; quem grava é o `save` |
| `save()` | Faz `INSERT` se o objeto não tem `id`, `UPDATE` se tem. **Uma função, dois comandos** |
| `Object.assign(obra, dados)` | Copia os campos de `dados` para cima de `obra`, mantendo o `id` — é isso que faz o `save` seguinte virar `UPDATE` |
| `atualizar` via `buscarUm` + `save` | Mais lento que um `update()` direto, porém **valida a existência** (o `buscarUm` lança 404) e dispara os *hooks* da entidade. Para CRUD, prefira este |
| `delete()` | **Não erra** se o id não existe — devolve `affected: 0`. Por isso conferimos |

**Faça:** e as rotas para exercitá-las:

```ts
@Post()
criar(@Body() dados: Partial<Obra>) {
  return this.acervo.criar(dados);
}

@Patch(":id")
atualizar(@Param("id", ParseIntPipe) id: number, @Body() dados: Partial<Obra>) {
  return this.acervo.atualizar(id, dados);
}

@Delete(":id")
remover(@Param("id", ParseIntPipe) id: number) {
  return this.acervo.remover(id);
}
```

Acrescente `Body`, `Post`, `Patch` e `Delete` ao `import` de `@nestjs/common`.

**Rode:**

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d '{\"titulo\":\"Quincas Borba\",\"anoPublicacao\":1891,\"autorId\":1}'
```

*(No macOS, no Linux e no PowerShell 7, tire as barras: `-d '{"titulo":…}'`. No PowerShell 5.1, que vem com o Windows, elas são necessárias.)*

**Deu certo se:** responde a obra criada, com um `id` novo.

---

## Etapa 10 — O que está errado de propósito

O CRUD funciona. Agora mande isto:

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d '{\"titulo\":\"\",\"criadoEm\":\"1999-01-01\",\"autorId\":1}'
```

**Passa.** Título vazio, data de criação forjada pelo cliente, nenhuma reclamação.

### Por que isso acontece

`Partial<Obra>` é "qualquer subconjunto dos campos da entidade" — e **a entidade não é um
formulário**: tem campos internos que o cliente jamais deveria escrever.

| Problema | Consequência |
| --- | --- |
| Nada valida `titulo` | Obra sem título entra no acervo |
| O cliente escolhe **quais campos** gravar | Ele pode escrever `criadoEm`, `destaque`, o que existir na tabela |
| A resposta devolve a **entidade inteira** | Quando `Usuario` existir (M08), a resposta vai levar o hash da senha junto |

O segundo tem nome — ***mass assignment*** — e é uma das falhas mais exploradas em API.

### Isso é o M07 inteiro

O DTO de **entrada** resolve as duas primeiras linhas; o DTO de **saída**, a terceira. Deixe as
rotas como estão e guarde o comando acima: o M07 começa por ele, com um problema seu em vez
de uma boa prática abstrata.

---

## Etapa 11 — As duas APIs do TypeORM

Você usou uma. Existe outra, e o conteúdo desta etapa é saber quando trocar.

| API | Cara de | Boa para | Limite |
| --- | --- | --- | --- |
| `Repository` | Objeto de opções | CRUD e filtros simples | Fica ilegível em consultas compostas |
| `QueryBuilder` | SQL encadeado | Agregação, `JOIN` explícito, condição **dinâmica** | Mais verboso |

**A mesma consulta, nas duas:**

```ts
// Repository — o que você vem usando
await this.obras.find({
  where: { anoPublicacao: LessThan(1900) },
  order: { titulo: "ASC" },
});

// QueryBuilder — o mesmo, mas com espaço para crescer
await this.obras.createQueryBuilder("obra")
  .where("obra.anoPublicacao < :ano", { ano: 1900 })
  .orderBy("obra.titulo", "ASC")
  .getMany();
```

Para este caso o `Repository` é melhor: mais curto e igualmente claro.

### Quando o `Repository` deixa de servir

O ponto de virada é o **filtro opcional**: uma busca por termo, categoria e ano-limite —
qualquer combinação, ou nenhum. Com o `Repository`, o `where` vira um quebra-cabeça de `if`
acrescentando chaves a um objeto. Com o `QueryBuilder`, cada filtro é um `if` que acrescenta
uma linha (etapa 12).

> **A regra prática:** comece pelo `Repository`; migre para `QueryBuilder` quando o objeto de
> opções virar quebra-cabeça — **não antes**.

Há um terceiro nível, `query()` com SQL puro: legítimo para relatórios e agregações
complexas, com o preço de você mesmo garantir a segurança (etapa 13).

---

## Etapa 12 — QueryBuilder e busca

**Faça:** no service:

```ts
async buscar(termo?: string, categoriaId?: number, ate?: number) {
  const qb = this.obras.createQueryBuilder("obra")
    .leftJoinAndSelect("obra.autor", "autor")
    .leftJoin("obra.categorias", "categoria");

  if (termo) {
    qb.andWhere("(obra.titulo ILIKE :termo OR autor.nome ILIKE :termo)", {
      termo: `%${termo}%`,
    });
  }
  if (categoriaId) {
    qb.andWhere("categoria.id = :categoriaId", { categoriaId });
  }
  if (ate) {
    qb.andWhere("obra.anoPublicacao <= :ate", { ate });
  }

  return qb.orderBy("obra.titulo", "ASC").take(20).getMany();
}
```

**Linha a linha:**

| Trecho | O que faz |
| --- | --- |
| `createQueryBuilder("obra")` | O `"obra"` é o **apelido** da tabela, usado no resto da consulta |
| `leftJoinAndSelect` | Faz o `JOIN` **e traz** as colunas. É o equivalente do `relations` |
| `leftJoin` sem `AndSelect` | Faz o `JOIN` **só para filtrar**, sem carregar os dados. A categoria participa do `WHERE` e não volta na resposta — menos tráfego |
| `andWhere` dentro de `if` | **É isto que o `Repository` não faz bem.** O SQL é montado conforme o que veio |
| `:termo` | Um **parâmetro**, não uma interpolação. Etapa 13 |
| `` `%${termo}%` `` | Os `%` são os curingas do `LIKE`. Repare que eles ficam no **valor**, não no comando |
| `ILIKE` | Busca sem diferenciar maiúsculas. É do PostgreSQL — em outro banco seria `LOWER(a) LIKE LOWER(b)` |
| `getMany()` | Executa e devolve um array. Sem esta chamada, nada roda: o `qb` é só uma receita |

**Faça:** exponha em `@Get("buscar")`, **acima** do `@Get(":id")`.

**Rode** as três, e **leia o SQL gerado em cada uma**:

```powershell
curl.exe -s "http://localhost:3000/api/obras/buscar"
```

```powershell
curl.exe -s "http://localhost:3000/api/obras/buscar?termo=maria"
```

```powershell
curl.exe -s "http://localhost:3000/api/obras/buscar?termo=maria&ate=1900"
```

**Deu certo se:** o `WHERE` no terminal **muda** a cada chamada: nenhuma condição, uma, duas.

---

## Etapa 13 — Parâmetro não é concatenação

Olhe de novo a linha do `termo` na etapa 12. Ela poderia ter sido escrita assim:

```ts
.where(`obra.titulo = '${termo}'`)              // ❌
.where("obra.titulo = :titulo", { titulo: termo }) // ✅
```

Parecem equivalentes. **Não são** — a diferença é a vulnerabilidade mais antiga e explorada
da web.

Pense num **formulário de banco**: no campo "valor", escrever "R$ 10 e transfira todo o
saldo" não vira ordem, porque o caixa sabe que ali só cabe um valor. A concatenação apaga
essa fronteira entre campo e instrução.

### O que acontece na primeira forma

O valor é **colado dentro do comando**. O banco recebe uma string só e não sabe onde termina
o comando e começa o dado.

Se alguém buscar por `' OR 1=1 --`:

```sql
SELECT * FROM obra WHERE obra.titulo = '' OR 1=1 --'
```

O `OR 1=1` é sempre verdadeiro, o `--` comenta o resto, e a consulta devolve **a tabela
inteira**. Com um pouco mais de criatividade, devolve a tabela de usuários.

### O que acontece na segunda

O driver envia o comando e os valores **separados**:

```
comando:  SELECT * FROM obra WHERE obra.titulo = $1
valores:  ["' OR 1=1 --"]
```

O banco compila o comando e depois encaixa o valor. **Não há caminho** para o conteúdo de
`$1` virar instrução — é texto, sempre, mesmo que pareça SQL.

### A regra

> A **única** proteção contra injeção de SQL que importa, e **gratuita**: dá o mesmo trabalho
> escrever das duas formas. **Crase ou `+` montando consulta com dado do usuário está
> errado** — sem exceção, sem "mas eu validei antes".

**Faça:** confira o seu código da etapa 12. Todos os valores passam por `:nome`? Nenhum foi
colado na string?

**Rode:** e teste na prática:

```powershell
curl.exe -s "http://localhost:3000/api/obras/buscar?termo=' OR 1=1 --"
```

**Deu certo se:** a busca devolve **nada** (não há obra com aquele título literal) e, no log,
`%' OR 1=1 --%` aparece como **parâmetro**, separado do comando. O M09 volta ao tema com o
restante do OWASP.

---

## Etapa 14 — Por que transações existem

> ➕ **Opcional.** Nenhuma rubrica cobra esta etapa — faça se houver tempo.

Última parada de raciocínio. Emprestar um exemplar é **duas escritas**:

1. criar o registro de empréstimo;
2. marcar o exemplar como indisponível.

**O que acontece se a segunda falhar** — queda de rede, restrição violada, servidor
reiniciado no meio:

```
✅ empréstimo criado
❌ exemplar continua marcado como disponível
```

O sistema mente: o exemplar está na mão de alguém e o catálogo diz que está na estante.

Pense numa **transferência bancária**: débito numa conta, crédito na outra. Se o sistema
caísse entre os dois, o dinheiro sumiria. Por isso as duas operações são **uma só**: ou
acontecem ambas, ou nenhuma. Isso é uma transação.

### A solução

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, exemplar.id, { disponivel: false });
});
```

Se **qualquer** linha lançar, tudo é desfeito. Não há meio-termo.

| Trecho | O que faz |
| --- | --- |
| `dataSource.transaction` | Abre a transação, executa a função e faz `COMMIT` no fim — ou `ROLLBACK` se algo lançar |
| `manager` | Um "repositório da transação". **Tudo que rodar por ele participa** |
| `async (manager) => {...}` | Uma função assíncrona recebida como argumento. O TypeORM a chama e cuida do resto |

### ⚠️ A armadilha silenciosa

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);                    // ✅ dentro
  await this.exemplares.update(id, { ... });         // ❌ FORA
});
```

`this.exemplares` é o repositório normal, não o `manager`: roda **fora** da transação e **não
é desfeito** no `ROLLBACK`. Compila, os testes felizes passam, e o problema só aparece no dia
em que algo falha no meio — justamente quando a transação deveria salvar você. **Dentro da
transação, sempre o `manager`.**

### A regra

> **Escritas que precisam ser verdadeiras juntas vão numa transação.** Se existe um estado
> intermediário que seria mentira, precisa de transação.

É aqui que o `disponivel` (campo **derivado** do M04) cobra a conta: a transação é o preço
da obrigação de sincronia.

---

## Etapa 15 — Transação na prática

> ➕ **Opcional.** Nenhuma rubrica cobra esta etapa — faça se houver tempo.

Agora é com você.

**Faça:** implemente `EmprestimosService.emprestar(exemplarId, associadoId)`:

1. Buscar o exemplar; erro se não existir.
2. Recusar se ele já estiver indisponível.
3. Recusar se o associado já tiver 3 empréstimos em aberto.
4. Criar o empréstimo, com previsão de devolução em 14 dias.
5. Marcar o exemplar como indisponível.

**Os passos 4 e 5 vão na mesma transação.** Os três primeiros só verificam e podem ficar fora.

Injete o `DataSource` no construtor:

```ts
constructor(private readonly dataSource: DataSource) {}
```

**Depois force uma falha** — é o que prova o aprendizado: lance um erro **entre** os passos 4
e 5, chame o endpoint e confira que o empréstimo **não** ficou no banco.

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT count(*) FROM emprestimo;"
```

**Deu certo se:** a contagem não subiu, apesar de o `save` ter rodado.

> Refaça com `this.emprestimos.save(...)` no lugar de `manager.save(...)` e veja o empréstimo
> **ficar** no banco mesmo com o erro — a armadilha da etapa 14, no seu código.

---

## 🤖 IA no fluxo

Uma IA escreve consultas com filtros em segundos. Confira em toda consulta pronta as três
coisas que este módulo mediu:

- [ ] Algum laço com `await` dentro, buscando relação item a item? (N+1, etapa 8)
- [ ] Algum valor do usuário colado no texto da consulta? (etapa 13)
- [ ] Duas escritas que precisam ser verdadeiras juntas, fora de transação — ou com
      `this.repositorio` dentro dela em vez do `manager`? (etapa 14)

E mantenha o `logging: true`: o SQL executado é a única resposta definitiva sobre o que a
consulta faz.

## 💣 Pegadinha de mercado

**Testar desempenho com 20 registros.** Com o banco quase vazio, até a consulta de 201
viagens é rápida. N+1 e listagem sem paginação não aparecem nos testes da equipe — aparecem
no terceiro mês de uso do cliente. Desempenho só se avalia com volume parecido com o real.

## 🧩 Desafio de fixação

A coordenação quer um relatório: **as dez obras mais emprestadas no último mês**, com o nome
do autor e a quantidade de empréstimos. Escreva a consulta com o `QueryBuilder`. Quantas
consultas SQL ela deve gerar? Confira no log. Onde fica o código: controller ou service?

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `Nest can't resolve dependencies of the AcervoService` | A entidade não está no `forFeature` do módulo (M04) |
| `obra.autor` é `undefined` | Faltou `relations` ou `leftJoinAndSelect` |
| API lenta e log com dezenas de SELECTs | N+1 — etapa 8 |
| `Type 'Autor \| null' is not assignable to type 'Autor'` | `findOneBy` pode não achar. Trate o `null`, não use `!` |
| `Cannot read properties of null` | `findOne` devolveu `null` e ninguém tratou. Use o padrão do `buscarUm` |
| `save()` criou registro novo em vez de atualizar | O objeto não tinha `id` |
| `QueryFailedError: syntax error at or near` | Parâmetro escrito como `$termo` ou `?termo`. No TypeORM é `:termo` |
| `/obras/buscar` responde 400 | Rota literal declarada depois de `@Get(":id")` |
| Listagem devolve o banco inteiro | Faltou `take` |
| A página 2 repete itens da 1 | Faltou `order`. Sem ordenação, o banco não garante ordem entre consultas |
| Transação não desfez nada | Você usou `this.repo` em vez do `manager` — etapa 14 |

## ✅ Checklist de saída

- [ ] CRUD completo funcionando pelos cinco endpoints
- [ ] Listagem **paginada e ordenada**, devolvendo `itens` e `total`
- [ ] Banco populado com volume (≥ 800 obras)
- [ ] N+1 reproduzido, medido e corrigido — **com os quatro números anotados**
- [ ] Você mediu com `take: 200` e sabe dizer qual dos dois piorou e por quê
- [ ] Busca com filtros opcionais no `QueryBuilder`, com parâmetros nomeados
- [ ] Nenhuma consulta monta SQL por concatenação — você conferiu
- [ ] Transação implementada e **testada com falha proposital**
- [ ] Você viu a diferença entre usar o `manager` e usar o repositório dentro da transação
- [ ] Endpoints temporários (`nome`, `ruim`, `bom`) apagados
- [ ] Você sabe dizer o que está errado no `@Body() dados: Partial<Obra>` da etapa 10

## 📦 Entrega E2 — Caderno de consultas

**Essencial** — exatamente o que a [rubrica do portfólio](../../avaliacao/rubrica-portfolio.md) verifica:

- [ ] Consultas com `Repository` e `QueryBuilder`, cada uma com o SQL gerado ao lado
- [ ] Um caso de N+1 corrigido, com a medição antes e depois (etapas 5 a 8)

**➕ Para ir além** — conta para o nível Excelente, não é obrigatório:

- A transação do empréstimo testada com falha proposital (etapas 14 e 15)

**Prazo:** ver o [plano de ensino](../../docs/plano-de-ensino.md#9-cronograma-semanal).

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — QueryBuilder](https://typeorm.io/select-query-builder)
- [TypeORM — Transactions](https://typeorm.io/transactions)
- [Use The Index, Luke](https://use-the-index-luke.com/pt)
