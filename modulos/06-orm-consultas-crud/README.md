# M06 — Repository e QueryBuilder: consultas e CRUD

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 6** · **Pré-requisitos:** M04, M05

O item da ementa *"realização de consultas e operações de CRUD utilizando a API do
framework"*. Aqui a entidade deixa de ser esquema e passa a ser dado consultado.

> **As horas teóricas não estão num bloco separado.** Elas são as etapas 3, 8, 10, 11, 13 e
> 14 — em que a gente para de digitar e pensa — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Fazer CRUD completo pela API do TypeORM.
2. Ler o SQL gerado e relacioná-lo com o código que o produziu.
3. Diagnosticar e corrigir o problema **N+1**, com medição.
4. Escolher entre `Repository`, `QueryBuilder` e SQL puro com critério.

## 🧭 Por que este módulo vem agora

M04 ensinou a representar o domínio e M05 ensinou a versionar a estrutura do banco. Agora o
aluno precisa fazer o sistema trabalhar com dados reais: ler, filtrar, criar, atualizar e
remover.

A progressão é deliberada:

- primeiro uma leitura simples, para separar acesso a dados de lógica de apresentação;
- depois volume e medição, para perceber que código correto também pode ser caro;
- por fim escrita, consultas complexas e transações, para preservar consistência.

O N+1 aparece de propósito porque esta é uma oportunidade de aprendizagem baseada em evidência:
o aluno vê o problema nos logs, mede seu custo e só então escolhe uma solução. No M07, essa
base vira uma API pública com entrada validada e respostas desenhadas para consumidores reais.

> O ganho de competência do M06 é passar de “sei criar tabelas” para “sei buscar e alterar dados
sem perder de vista desempenho, segurança e consistência”.

---

## 🧭 O que você vai construir

Os cinco endpoints do acervo, agora saindo do banco de verdade — mais uma busca com filtros
opcionais e uma operação que grava em duas tabelas de uma vez sem risco de deixar metade
feita.

E, no meio do caminho, você vai **provocar e medir** o problema de desempenho mais comum de
API. Não ler sobre ele: medir, com número na tabela.

## 📋 Como este módulo funciona

Quinze etapas, indo **do mais simples ao mais caro**: ler antes de escrever, uma consulta por
vez, e só então o `QueryBuilder` e a transação.

| Parte | O que é |
| --- | --- |
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

> 🪟 No PowerShell, escreva `curl.exe`; no macOS e Linux, `curl`. O material escreve
> `curl.exe`.

### As quinze etapas

| # | Etapa | Min | O que entra |
| --- | --- | --- | --- |
| 1 | [Trocar a memória pelo banco](#etapa-1--trocar-a-memória-pelo-banco-15-min) | 15 | `@InjectRepository` |
| 2 | [Listar, paginado desde o começo](#etapa-2--listar-paginado-desde-o-começo-20-min) | 20 | `findAndCount`, `skip`/`take` |
| 3 | [**Por que paginar sempre**](#etapa-3--por-que-paginar-sempre-15-min) | 15 | **paginação não é opcional** |
| 4 | [Buscar uma, com as relações](#etapa-4--buscar-uma-com-as-relações-15-min) | 15 | `relations` |
| 5 | [Popular o banco](#etapa-5--popular-o-banco-15-min) | 15 | volume para medir |
| 6 | [A versão ruim, de propósito](#etapa-6--a-versão-ruim-de-propósito-20-min) | 20 | o laço que mata |
| 7 | [Medir](#etapa-7--medir-20-min) | 20 | contar consultas |
| 8 | [**O que os números dizem**](#etapa-8--o-que-os-números-dizem-15-min) | 15 | **N+1** |
| 9 | [Escrever: criar, atualizar, remover](#etapa-9--escrever-criar-atualizar-remover-30-min) | 30 | `create`, `save`, `delete` |
| 10 | [**O que está errado de propósito**](#etapa-10--o-que-está-errado-de-propósito-15-min) | 15 | **a ponte para o M07** |
| 11 | [**As duas APIs do TypeORM**](#etapa-11--as-duas-apis-do-typeorm-20-min) | 20 | **Repository × QueryBuilder** |
| 12 | [QueryBuilder e busca](#etapa-12--querybuilder-e-busca-30-min) | 30 | filtros opcionais |
| 13 | [**Parâmetro não é concatenação**](#etapa-13--parâmetro-não-é-concatenação-20-min) | 20 | **injeção de SQL** |
| 14 | [**Por que transações existem**](#etapa-14--por-que-transações-existem-20-min) | 20 | **atomicidade** |
| 15 | [Transação na prática](#etapa-15--transação-na-prática-30-min) | 30 | por sua conta |

---

## Etapa 1 — Trocar a memória pelo banco (15 min)

O `AcervoService` ainda é o do M03: um array em memória e um endpoint temporário com o nome
da biblioteca. Os dois saem de cena agora.

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

Ele existia para provar que o `ConfigService` funcionava, e já provou. **Endpoint temporário
que sobrevive ao módulo vira endpoint permanente por acidente** — e daqui a três meses
ninguém sabe se pode remover.

> O controller fica sem nada que compile por um minuto — é esperado. A etapa 2 devolve a
> listagem.

**Deu certo se:** o `start:dev` reinicia sem `can't resolve dependencies`. Se aparecer esse
erro, a entidade não está no `forFeature`.

---

## Etapa 2 — Listar, paginado desde o começo (20 min)

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
| `findAndCount` | Devolve a página **e o total** numa chamada. O total é o que permite ao frontend desenhar "página 3 de 41" |
| `const [itens, total]` | Desestruturação de array: o método devolve um par, e você nomeia os dois de uma vez |
| `relations: { autor: true }` | Traz a autora junto. **Sem isto, `obra.autor` vem `undefined`** — o TypeORM não busca relação que você não pediu |
| `order: { titulo: "ASC" }` | Ordena por título |
| `skip` / `take` | `OFFSET` e `LIMIT` do SQL. A página 1 tem `skip: 0` — daí o `- 1` |
| `pagina = 1, tamanho = 20` | Valores padrão do JavaScript: quem chamar sem argumento recebe a primeira página |

⚠️ **O `order` não é enfeite.** Sem ordenação explícita, o banco devolve as linhas na ordem
que for mais conveniente para ele — e essa ordem **pode mudar entre duas consultas**. O
sintoma é a página 2 repetindo itens da página 1, e é um bug difícil de acreditar quando
aparece.

**Faça:** no controller:

```ts
@Get()
listar(@Query("pagina") pagina?: string, @Query("tamanho") tamanho?: string) {
  return this.acervo.listar(Number(pagina) || 1, Number(tamanho) || 20);
}
```

Acrescente `Query` ao `import` de `@nestjs/common`.

> O `Number(pagina) || 1` é feio de propósito: *query string* chega sempre como texto, e
> converter na mão é o que se faz quando não há nada melhor. O M07 troca isto por um DTO
> validado, e aí a feiura sai.

**Rode:**

```powershell
curl.exe -s "http://localhost:3000/api/obras?pagina=1&tamanho=5"
```

**Deu certo se:** responde `{"itens":[],"total":0,"pagina":1,"tamanho":5}`. Vazio, porque o
banco ainda não tem obras — a etapa 5 resolve isso.

---

## Etapa 3 — Por que paginar sempre (15 min)

Você acabou de escrever `take` sem discutir. Vale discutir, porque essa é a diferença entre
uma API que aguenta o segundo ano e uma que não.

**O que acontece sem `take`:**

```ts
await this.obras.find();     // devolve o banco inteiro
```

| Com… | O que acontece |
| --- | --- |
| 20 registros de teste | Instantâneo. Ninguém percebe nada |
| 800 registros | Uns 200 KB de JSON. Ainda passa |
| 200 mil registros do cliente | O banco monta tudo em memória, o Node serializa tudo em memória, a rede carrega tudo, o navegador tenta desenhar tudo |

O último caso não fica lento: ele **derruba**. E derruba em produção, porque em
desenvolvimento ninguém tem 200 mil registros.

**Três custos, não um:**

```
banco monta o resultado  →  Node serializa em JSON  →  rede transporta  →  cliente processa
     memória do servidor      memória do servidor       tempo e custo       trava a tela
```

Paginação corta os quatro de uma vez.

> **A regra deste material:** toda listagem é paginada, sem exceção e desde a primeira linha.
> Acrescentar paginação depois é fácil no backend e **caro no frontend** — a tela foi
> desenhada supondo que a lista vem inteira.

⚠️ **Falta uma proteção.** Hoje `?tamanho=999999` funciona: o cliente escolhe o tamanho da
página e pode pedir o banco inteiro de qualquer forma. **Limite de paginação é segurança**,
não capricho — e é o M07 que põe o teto, junto com a validação da entrada.

---

## Etapa 4 — Buscar uma, com as relações (15 min)

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
| três `relations` | O detalhe da obra mostra autora, categorias e exemplares. A listagem só precisava da autora — **peça o que a tela usa, não tudo** |
| `findOne` devolve `Obra \| null` | Por isso o `if`. O TypeScript **obriga** você a tratar o caso |
| `NotFoundException` | O mesmo do M03 |

**Faça:** o controller já tem o `@Get(":id")` do M03; troque o corpo para chamar este método.

**Rode:**

```powershell
curl.exe -i http://localhost:3000/api/obras/999
```

**Deu certo se:** responde **404**, com o mesmo corpo de antes.

### O que acabou de acontecer, e é o ponto da etapa

A lógica mudou de "array em memória" para "consulta em PostgreSQL". O `NotFoundException`
continua idêntico. **O contrato HTTP não mudou nada** — quem consome a API não tem como
perceber a troca.

Isso é a separação de camadas do M03, etapa 11, pagando dividendo **exatamente como
prometido na situação 3**. Guarde: era uma promessa, agora é um fato observado.

---

## Etapa 5 — Popular o banco (15 min)

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

> Com 20 registros tudo é rápido, **inclusive o errado**. Sem volume, as próximas três etapas
> viram teoria.

**Rode:**

```powershell
curl.exe -s "http://localhost:3000/api/obras?tamanho=5"
```

**Deu certo se:** devolve cinco obras e um `total` na casa das centenas.

---

## Etapa 6 — A versão ruim, de propósito (20 min)

Você vai escrever código ruim de propósito. É parte do exercício: quem só viu a versão certa
não reconhece o padrão quando ele aparece disfarçado, dentro de um `map`, em outro arquivo,
escrito por outra pessoa.

**O cenário:** listar obras com o nome da autora. Você já sabe que o TypeORM não traz
relação sem pedir:

```ts
const obras = await this.obras.find();
obras[0].autor;      // undefined — não foi buscado
```

A tentação, então, é buscar cada uma dentro de um laço.

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
| `obra.autorId` | O campo que você declarou explicitamente no M04, etapa 11c. **Sem ele seria preciso um `as any`** — e aqui está o dividendo daquela decisão |
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

**Deu certo se:** as duas rotas respondem 50 obras cada, com o campo `autor` preenchido. Do
lado de fora, elas são **indistinguíveis**. A diferença está no terminal.

---

## Etapa 7 — Medir (20 min)

Agora conte. Com o `logging: true` do M04 ligado, cada consulta vira uma linha `query:` no
terminal.

**Faça:** limpe a tela do terminal do `start:dev`, chame um endpoint, conte as linhas.
Depois o outro.

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

## Etapa 8 — O que os números dizem (15 min)

Você tem quatro medições. O que elas mostram não é o que parece à primeira vista.

| Estratégia | 50 itens | 200 itens | Cresce? |
| --- | --- | --- | --- |
| Sem `relations` | 1 | 1 | Não |
| `relations` + `take` | 2 | 2 | **Não** |
| Buscar no laço | 51 | 201 | **Sim, linearmente** |

### O problema tem nome: N+1

Uma consulta para a lista, mais **uma por item**. Com N itens, N+1 consultas. É a causa mais
comum de API lenta, e a mais fácil de introduzir sem perceber.

### Por que 2 e não 1

A versão boa faz **duas** consultas, não uma, e isso é de propósito. Com `take` **e** relação,
o TypeORM:

1. seleciona os *ids* da página;
2. busca os dados desses ids, com `JOIN`.

Se fizesse tudo de uma vez, o `LIMIT` contaria linhas do **JOIN** em vez de obras — e uma
obra com três categorias comeria três vagas da página. Você pediria 20 obras e receberia 7.

### O número que importa não é 1 nem 2

**É que 2 não cresce e 51 cresce.** Os 60 ms de hoje parecem aceitáveis; o problema é o que
acontece depois:

| Mudança | Versão boa | Versão ruim |
| --- | --- | --- |
| O acervo dobra | igual | dobra |
| A página passa a mostrar 200 | igual | quadruplica |
| O banco vai para outro servidor | +1 ida e volta | **+201 idas e voltas** |

A última linha é a que mata. Em desenvolvimento o banco está na mesma máquina e cada consulta
custa microssegundos. Em produção, cada uma paga a rede — e 201 delas viram segundos.

### Como detectar no seu código

> Com o log de consultas ligado, abra a tela e **conte as linhas de SQL**. Se o número cresce
> com a quantidade de itens da lista, é N+1. Não precisa de ferramenta nenhuma.

**Faça:** apague os dois endpoints temporários antes de seguir. Guarde os métodos no service
se quiser consultá-los; **rota temporária que fica é dívida**.

💼 **No mercado:** N+1 e falta de paginação são os dois achados mais comuns em revisão de API
júnior. Quem sabe demonstrá-lo com o log na mão se destaca de quem só cita o nome.

---

## Etapa 9 — Escrever: criar, atualizar, remover (30 min)

Até aqui só lemos. As três operações de escrita fecham o CRUD.

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
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"Memórias Póstumas\",\"anoPublicacao\":1881,\"autorId\":1}"
```

*(No macOS ou Linux, use aspas simples em volta do JSON: `-d '{"titulo":…}'`.)*

**Deu certo se:** responde a obra criada, com um `id` novo.

---

## Etapa 10 — O que está errado de propósito (15 min)

O CRUD funciona. Agora mande isto:

```powershell
curl.exe -s -X POST http://localhost:3000/api/obras -H "Content-Type: application/json" -d "{\"titulo\":\"\",\"criadoEm\":\"1999-01-01\",\"autorId\":1}"
```

**Passa.** Título vazio, data de criação forjada pelo cliente, e nenhuma reclamação.

### Por que isso acontece

`Partial<Obra>` significa "qualquer subconjunto dos campos da entidade". E **a entidade não é
um formulário**: ela tem campos que existem por razões internas e que o cliente jamais
deveria escrever.

| Problema | Consequência |
| --- | --- |
| Nada valida `titulo` | Obra sem título entra no acervo |
| O cliente escolhe **quais campos** gravar | Ele pode escrever `criadoEm`, `destaque`, o que existir na tabela |
| A resposta devolve a **entidade inteira** | Quando `Usuario` existir (M12), a resposta vai levar o hash da senha junto |

O segundo tem nome — ***mass assignment*** — e é uma das falhas mais exploradas em API. O
cliente descobre um campo que você não esperava e o escreve.

### Isso é o M07 inteiro

| O que resolve | Qual problema |
| --- | --- |
| DTO de **entrada** | As duas primeiras linhas da tabela |
| DTO de **saída** | A terceira |

Deixe as rotas como estão. O M07 troca as assinaturas, e você vai ver os três `curl` acima
mudarem de resposta.

> Esta etapa existe para o M07 começar com um problema seu, e não com uma boa prática
> abstrata. Guarde o comando acima: você vai repeti-lo lá.

---

## Etapa 11 — As duas APIs do TypeORM (20 min)

Até aqui você usou uma só. Existe outra, e saber quando trocar é o conteúdo desta etapa.

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

O ponto de virada é o **filtro opcional**. Imagine uma busca em que o usuário pode informar
um termo, uma categoria e um ano-limite — ou nenhum dos três, ou só o do meio.

Com o `Repository`, você precisaria montar o objeto `where` condicionalmente, com `if` que
acrescentam chaves a um objeto, e o resultado é um quebra-cabeça difícil de ler e mais
difícil de alterar.

Com o `QueryBuilder`, cada filtro é um `if` que acrescenta uma linha. É o que a etapa 12 faz.

> **A regra prática:** comece pelo `Repository`. Migre para `QueryBuilder` quando o objeto de
> opções virar um quebra-cabeça — **não antes**. Verbosidade sem necessidade também é custo.

E existe um terceiro nível, para quando nem o `QueryBuilder` alcança: `query()` com SQL puro.
Ele existe, é legítimo para relatórios e agregações complexas, e cobra o preço de você mesmo
garantir a segurança — que é o assunto da etapa 13.

---

## Etapa 12 — QueryBuilder e busca (30 min)

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

**Deu certo se:** o `WHERE` no terminal **muda** a cada chamada — some quando não há filtro,
tem uma condição na segunda, duas na terceira. É a consulta sendo montada conforme a entrada.

---

## Etapa 13 — Parâmetro não é concatenação (20 min)

Olhe de novo a linha do `termo` na etapa 12. Ela poderia ter sido escrita assim:

```ts
.where(`obra.titulo = '${termo}'`)              // ❌
.where("obra.titulo = :titulo", { titulo: termo }) // ✅
```

As duas parecem equivalentes. **Não são**, e a diferença é a vulnerabilidade mais antiga e
mais explorada da web.

### O que acontece na primeira forma

O valor é **colado dentro do comando** antes de sair da aplicação. O banco recebe uma string
só e não tem como saber onde termina o comando e começa o dado.

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

O banco compila o comando primeiro e depois encaixa o valor. **Não existe caminho** pelo qual
o conteúdo de `$1` vire instrução — ele é tratado como texto, sempre, mesmo que pareça SQL.

### A regra

> Esta é a **única** proteção contra injeção de SQL que importa, e ela é **gratuita**: dá o
> mesmo trabalho escrever das duas formas.
>
> **Se você usou crase ou `+` para montar um trecho de consulta com dado do usuário, está
> errado.** Não há exceção, não há "mas eu validei antes".

**Faça:** confira o seu código da etapa 12. Todos os valores passam por `:nome`? Nenhum foi
colado na string?

**Rode:** e teste na prática:

```powershell
curl.exe -s "http://localhost:3000/api/obras/buscar?termo=' OR 1=1 --"
```

**Deu certo se:** a busca devolve **nada** — porque não existe obra com aquele título
literal. No log, o `%' OR 1=1 --%` aparece como **parâmetro**, separado do comando.

O M09 volta ao assunto com o restante do OWASP. Aqui fica a regra e a demonstração.

---

## Etapa 14 — Por que transações existem (20 min)

Última parada de raciocínio. Emprestar um exemplar é **duas escritas**:

1. criar o registro de empréstimo;
2. marcar o exemplar como indisponível.

**O que acontece se a segunda falhar** — queda de rede, restrição violada, servidor
reiniciado no meio:

```
✅ empréstimo criado
❌ exemplar continua marcado como disponível
```

O sistema agora mente. O exemplar está na mão de alguém e o catálogo diz que está na
estante. O segundo leitor que o pedir vai até a prateleira e não encontra.

### A solução

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, exemplar.id, { disponivel: false });
});
```

Se **qualquer** linha lançar, tudo é desfeito. Ou as duas escritas acontecem, ou nenhuma
acontece. Não existe meio-termo.

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

A segunda linha usa `this.exemplares` — o repositório normal, não o `manager`. Ela roda
**fora** da transação e **não é desfeita** no `ROLLBACK`.

Tudo parece certo. O código compila, os testes felizes passam, e o problema só aparece no dia
em que algo falha no meio — que é justamente o dia em que a transação deveria ter salvado
você. **Dentro da transação, use sempre o `manager`.**

### A regra

> **Duas ou mais escritas que precisam ser verdadeiras juntas vão numa transação.** Se você
> consegue descrever um estado intermediário que seria mentira, precisa de transação.

E é aqui que o `disponivel` do M04 cobra a conta. Ele é um campo **derivado** — materializá-lo
trocou uma consulta por uma **obrigação de sincronia**. A transação é o preço dessa escolha.

---

## Etapa 15 — Transação na prática (30 min)

Agora é com você.

**Faça:** implemente `EmprestimosService.emprestar(exemplarId, associadoId)`:

1. Buscar o exemplar; erro se não existir.
2. Recusar se ele já estiver indisponível.
3. Recusar se o associado já tiver 3 empréstimos em aberto.
4. Criar o empréstimo, com previsão de devolução em 14 dias.
5. Marcar o exemplar como indisponível.

**Os passos 4 e 5 vão na mesma transação.** Os três primeiros são verificações e podem ficar
fora — eles não escrevem nada.

Injete o `DataSource` no construtor:

```ts
constructor(private readonly dataSource: DataSource) {}
```

**E depois force uma falha**, que é a parte que prova o aprendizado: lance um erro de
propósito **entre** as linhas 4 e 5, chame o endpoint, e confira no banco que o empréstimo
do passo 4 **não** ficou lá.

```powershell
docker compose exec db psql -U bibliocom -d bibliocom -c "SELECT count(*) FROM emprestimo;"
```

**Deu certo se:** a contagem não subiu, apesar de o `save` ter rodado.

> Depois, refaça o teste com `this.emprestimos.save(...)` no lugar do `manager.save(...)` e
> veja o empréstimo **ficar** no banco mesmo com o erro. É a armadilha da etapa 14, na sua
> máquina, com o seu código.

---

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

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — QueryBuilder](https://typeorm.io/select-query-builder)
- [TypeORM — Transactions](https://typeorm.io/transactions)
- [Use The Index, Luke](https://use-the-index-luke.com/pt)
