# M06 — Repository e QueryBuilder: consultas e CRUD

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 6** · **Pré-requisitos:** M04, M05

O item da ementa *"realização de consultas e operações de CRUD utilizando a API do
framework"*. Aqui a entidade deixa de ser esquema e passa a ser dado consultado.

## 🎯 Objetivos

Ao final você será capaz de:

1. Fazer CRUD completo pela API do TypeORM.
2. Ler o SQL gerado e relacioná-lo com o código que o produziu.
3. Diagnosticar e corrigir o problema **N+1**, com medição.
4. Escolher entre `Repository`, `QueryBuilder` e SQL puro com critério.

---

## 📖 Teoria (2h)

### 1. As duas APIs do TypeORM

| API | Cara de | Boa para | Limite |
|---|---|---|---|
| `Repository` | Objeto de opções | CRUD e filtros simples | Fica ilegível em consultas compostas |
| `QueryBuilder` | SQL encadeado | Agregação, `JOIN` explícito, condição dinâmica | Mais verboso |

```ts
// Repository
await this.repo.find({ where: { anoPublicacao: LessThan(1900) }, order: { titulo: "ASC" } });

// QueryBuilder — o mesmo, mas com espaço para crescer
await this.repo.createQueryBuilder("obra")
  .where("obra.anoPublicacao < :ano", { ano: 1900 })
  .orderBy("obra.titulo", "ASC")
  .getMany();
```

Comece pelo `Repository`. Migre para `QueryBuilder` quando o objeto de opções virar um
quebra-cabeça — não antes.

### 2. Parâmetros não são concatenação ⚠️

```ts
.where(`obra.titulo = '${entrada}'`)              // ❌ injeção de SQL
.where("obra.titulo = :titulo", { titulo: entrada }) // ✅ parametrizado
```

Na primeira forma, uma entrada como `' OR 1=1 --` reescreve a consulta. Na segunda, o driver
envia o valor **separado** do comando: o banco nunca o interpreta como SQL.

Esta é a **única** proteção contra injeção que importa, e ela é gratuita. O M13 volta ao
assunto; a regra prática é: se você usou crase ou `+` para montar um trecho de consulta com
dado do usuário, está errado.

### 3. Preguiça e o problema N+1

Por padrão o TypeORM **não** traz as relações:

```ts
const obras = await this.repo.find();
obras[0].autor;      // undefined — não foi buscado
```

A tentação é buscar dentro do laço:

```ts
for (const obra of obras) {
  const autor = await this.autores.findOneBy({ id: obra.autorId });  // ❌
  if (autor) obra.autor = autor;
}
```

Com 50 obras, são **51 consultas**: uma para a lista e uma por obra. É o problema N+1, a
causa mais comum de API lenta.

A correção é declarar o que você precisa, e o ORM faz um `JOIN`:

```ts
await this.repo.find({ take: 50, relations: { autor: true } });
```

| Estratégia | Consultas com 50 itens | Com 500 itens |
|---|---|---|
| Sem `relations` | 1 | 1 |
| `relations` + `take` | 2 | 2 |
| Buscar no laço | 51 | 501 |

> **Por que 2 e não 1?** Com `take` **e** relação, o TypeORM faz duas consultas de propósito:
> primeiro seleciona os *ids* da página, depois busca os dados desses ids com `JOIN`. Se
> fizesse tudo de uma vez, o `LIMIT` contaria linhas do `JOIN` em vez de obras, e uma obra
> com três categorias comeria três vagas da página.

O número que importa não é 1 nem 2. É que **2 não cresce** e 51 cresce.

> **Como detectar:** com o log de consultas ligado, abra a tela e conte as linhas de SQL no
> terminal. Se o número cresce com a quantidade de itens da lista, é N+1.

### 4. Paginação não é opcional

```ts
await this.repo.find({ skip: 0, take: 20 });
```

Listagem **sem limite** funciona lindamente com os seus 20 registros de teste e derruba a API
com os 200 mil do cliente. Toda listagem deste material é paginada, e o M07 padroniza o
formato da resposta e põe um teto no `tamanho`.

### 5. Transações

Emprestar é duas escritas: criar o registro **e** marcar o exemplar como indisponível. Se a
segunda falhar, a primeira não pode permanecer.

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, exemplar.id, { disponivel: false });
});
```

Se qualquer linha lançar, tudo é desfeito. **Regra:** duas ou mais escritas que precisam ser
verdadeiras juntas vão numa transação.

> É aqui que o `disponivel` do M04 cobra a conta. Ele é um campo derivado — dava para
> descobrir a disponibilidade consultando os empréstimos em aberto. Materializá-lo troca uma
> consulta por uma obrigação: manter os dois em sincronia. Fora da transação, um erro no meio
> deixa um exemplar emprestado marcado como disponível, e ninguém descobre até dois leitores
> aparecerem com o mesmo volume na mão.

💼 **No mercado:** N+1 e falta de paginação são os dois achados mais comuns em revisão de
API júnior. Quem sabe demonstrá-lo com o log na mão se destaca de quem só cita o nome.

---

## 🛠️ Roteiro prático (3h)

O roteiro vai **do mais simples ao mais caro**: ler antes de escrever, uma consulta por vez,
e só então o `QueryBuilder` e a transação. Teste ao final de cada passo.

### Passo 1 — Trocar a memória pelo banco (15 min)

O `AcervoService` ainda é o do M03: um array em memória e um endpoint temporário com o nome
da biblioteca. Os dois saem de cena agora.

`src/acervo/acervo.service.ts` — apague o corpo antigo e comece assim:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Obra } from "./entidades/obra.entity";
import { Autor } from "./entidades/autor.entity";

@Injectable()
export class AcervoService {
  constructor(
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    @InjectRepository(Autor) private readonly autores: Repository<Autor>,
  ) {}
}
```

| Trecho | O que faz |
|---|---|
| `@InjectRepository(Obra)` | Pede ao Nest o repositório **daquela** entidade. Ele existe porque `Obra` está no `forFeature` do módulo (M04) |
| `Repository<Obra>` | O genérico é o que dá tipo ao retorno: `find()` devolve `Obra[]`, não `any[]` |
| dois repositórios | O de `Autor` só será usado no passo 5, para demonstrar o N+1 |

No `acervo.controller.ts`, **apague o `@Get("nome")`** e o método `nome()`. Ele existia para
provar que o `ConfigService` funcionava, e já provou. Endpoint temporário que sobrevive ao
módulo vira endpoint permanente por acidente.

O controller fica sem nada que compile por um minuto — é esperado, o passo 2 devolve a
listagem.

### Passo 2 — Listar, paginado desde o começo (20 min)

No service:

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

| Trecho | Detalhe que importa |
|---|---|
| `findAndCount` | Devolve página **e total** numa chamada. O total é o que permite ao frontend desenhar a paginação |
| `skip` / `take` | `LIMIT` e `OFFSET`. A página 1 tem `skip: 0` — daí o `- 1` |
| `relations: { autor: true }` | Traz a autora junto. Sem isto, `obra.autor` vem `undefined` |
| `order` | Sem ordenação explícita, o banco devolve na ordem que quiser, e a página 2 pode repetir itens da 1 |

No controller:

```ts
@Get()
listar(@Query("pagina") pagina?: string, @Query("tamanho") tamanho?: string) {
  return this.acervo.listar(Number(pagina) || 1, Number(tamanho) || 20);
}
```

Acrescente `Query` ao `import` de `@nestjs/common`.

> O `Number(pagina) || 1` é feio de propósito: query string chega sempre como texto, e
> converter na mão é o que se faz quando não há nada melhor. O M07 troca isto por um DTO
> validado, e aí a feiura sai.

```bash
curl -s "http://localhost:3000/api/obras?pagina=1&tamanho=5"
```

**Deu certo se:** responde `{"itens":[],"total":0,"pagina":1,"tamanho":5}`. Vazio, porque o
banco ainda não tem obras — o passo 4 resolve isso.

### Passo 3 — Buscar uma, com as relações (15 min)

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

O controller já tem o `@Get(":id")` do M03; troque o corpo para chamar este método.

Repare que o `NotFoundException` é o mesmo do M03: a lógica mudou de dados em memória para
banco, e o **contrato HTTP não mudou nada**. Quem consome a API não tem como perceber a
troca. Isso é a separação de camadas pagando dividendo.

**Deu certo se:** `/api/obras/999` continua respondendo 404 com o mesmo corpo de antes.

### Passo 4 — Popular o banco (15 min)

Precisamos de volume para que os problemas de desempenho apareçam. Copie
[`../../recursos/codigo/semear.ts`](../../recursos/codigo/semear.ts) para
`backend/src/semear.ts` e rode:

```bash
pnpm exec ts-node -r tsconfig-paths/register src/semear.ts
```

Gera 60 autores, 800 obras e 2.000 exemplares.

> Com 20 registros tudo é rápido, inclusive o errado. Sem volume, este módulo vira teoria.

**Deu certo se:** `curl -s "http://localhost:3000/api/obras?tamanho=5"` devolve cinco obras e
um `total` na casa das centenas.

### Passo 5 — Caçar o N+1 (35 min)

#### 5a. Escrever a versão ruim, de propósito

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

| Trecho | Por quê |
|---|---|
| `obra.autorId` | O campo que você declarou explicitamente no M04. Sem ele seria preciso um `as any` |
| `if (autor)` | `findOneBy` devolve `Obra \| null`. Sem o `if`, o TypeScript recusa a atribuição — e ele está certo |

E a versão boa, ao lado:

```ts
async listarBom() {
  return this.obras.find({ take: 50, relations: { autor: true } });
}
```

Exponha as duas em endpoints temporários, `@Get("ruim")` e `@Get("bom")`, **acima** do
`@Get(":id")` — a regra de ordenação de rotas do M03 continua valendo.

#### 5b. Contar

Com o `logging: true` do M04 ligado, cada consulta vira uma linha `query:` no terminal.
Limpe a tela, chame um endpoint, conte as linhas. Depois o outro.

```bash
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3000/api/obras/ruim
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3000/api/obras/bom
```

```powershell
# 🪟 Windows PowerShell
curl.exe -s -o NUL -w "%{time_total}s`n" http://localhost:3000/api/obras/ruim
curl.exe -s -o NUL -w "%{time_total}s`n" http://localhost:3000/api/obras/bom
```

Preencha:

| Versão | Consultas | Tempo |
|---|---|---|
| Ruim | | |
| Boa | | |

Como referência, numa máquina de desenvolvimento com o banco local: **51 consultas / ~60 ms**
contra **2 consultas / ~9 ms**. Os seus números vão diferir; a proporção, não.

#### 5c. O que realmente importa

Troque o `take: 50` por `take: 200` nos dois métodos e conte de novo.

A versão boa continua em 2. A ruim vai a 201. **É essa a diferença** — não os milissegundos
de hoje, mas o fato de que uma das duas piora quando o acervo cresce, e a outra não. Num
banco local com 800 registros, 60 ms parece aceitável; com o banco em outro servidor, cada
uma daquelas 51 consultas paga a ida e volta pela rede.

> Escrever a versão ruim é parte do exercício. Quem só viu a correta não reconhece o padrão
> quando ele aparece disfarçado, dentro de um `map` em outro arquivo, escrito por outra
> pessoa.

Apague os dois endpoints temporários antes de seguir. Guarde os métodos no service se quiser
consultá-los; rota temporária que fica é dívida.

### Passo 6 — Escrever: criar, atualizar, remover (30 min)

Até aqui só lemos. As três operações de escrita fecham o CRUD.

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

| Método | Detalhe que importa |
|---|---|
| `create()` | Só monta a instância em memória — **não grava**. Quem grava é o `save` |
| `save()` | Faz `INSERT` se não há `id`, `UPDATE` se há. Uma função, dois comandos |
| `atualizar` via `buscarUm` + `save` | Mais lento que `update()`, porém dispara os *hooks* da entidade e valida a existência. Para CRUD, prefira este |
| `delete()` | Não erra se o id não existe — por isso conferimos `affected` |

E as rotas para exercitá-las:

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

```bash
curl -s -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Memórias Póstumas","anoPublicacao":1881,"autorId":1}'
```

**Deu certo se:** responde a obra criada, com um `id` novo.

#### O que está errado aqui, de propósito

Agora mande isto:

```bash
curl -s -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"","criadoEm":"1999-01-01","autorId":1}'
```

Passa. Título vazio, data de criação forjada pelo cliente, e nenhuma reclamação. O
`Partial<Obra>` aceita qualquer subconjunto da entidade, e **a entidade não é um formulário**:
ela tem campos que o cliente jamais deveria escrever.

| Problema | Consequência |
|---|---|
| Nada valida `titulo` | Obra sem título no acervo |
| O cliente escolhe quais campos gravar | Ele pode escrever `criadoEm`, `destaque`, o que existir |
| A resposta devolve a entidade inteira | Quando `Usuario` existir (M12), a resposta vai levar o hash da senha junto |

Isso é o **M07 inteiro**, e é por isso que ele vem logo depois: DTO de entrada resolve as
duas primeiras linhas, DTO de saída resolve a terceira. Deixe as rotas como estão; o M07
troca as assinaturas.

### Passo 7 — QueryBuilder e busca (30 min)

Busca por texto, com filtros opcionais — o caso em que o `Repository` fica pior que o
`QueryBuilder`:

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

| Trecho | O que faz |
|---|---|
| `leftJoinAndSelect` | Faz o `JOIN` **e traz** as colunas. É o equivalente de `relations` |
| `leftJoin` (sem `AndSelect`) | Faz o `JOIN` só para **filtrar**, sem carregar os dados. Menos tráfego |
| `andWhere` dentro de `if` | Filtro opcional: o SQL é montado conforme o que veio. É isto que o `Repository` não faz bem |
| `:termo` | Parâmetro. **Nunca** interpole a variável na string |
| `ILIKE` | Busca sem diferenciar maiúsculas. É do PostgreSQL — em outro banco seria `LOWER(...) LIKE LOWER(...)` |

Exponha em `@Get("buscar")` (acima do `@Get(":id")`) e chame com e sem cada filtro:

```bash
curl -s "http://localhost:3000/api/obras/buscar"
curl -s "http://localhost:3000/api/obras/buscar?termo=machado"
curl -s "http://localhost:3000/api/obras/buscar?termo=machado&ate=1900"
```

**Leia o SQL gerado nas três chamadas.** O `WHERE` muda a cada uma, e o `%termo%` aparece
como parâmetro separado, nunca colado na consulta. Confirme isso no log: é a diferença entre
uma busca e uma porta aberta.

### Passo 8 — Transação (20 min)

Implemente `EmprestimosService.emprestar(exemplarId, associadoId)`:

1. Buscar o exemplar; erro se não existir.
2. Recusar se ele já estiver indisponível.
3. Recusar se o associado já tiver 3 empréstimos em aberto.
4. Criar o empréstimo com previsão de devolução em 14 dias.
5. Marcar o exemplar como indisponível.

Os passos 4 e 5 vão **na mesma transação**:

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, exemplarId, { disponivel: false });
});
```

Injete o `DataSource` no construtor do service (`constructor(private readonly dataSource: DataSource)`).

**Depois force uma falha:** lance um erro de propósito entre as duas linhas, chame o
endpoint e confira no banco que o empréstimo do passo 4 **não** ficou lá.

⚠️ Dentro da transação, use **sempre** o `manager` que ela entrega. Se você chamar
`this.emprestimos.save(...)` lá dentro, aquela escrita roda fora da transação e **não** é
desfeita — o erro mais silencioso deste módulo, porque tudo parece certo até o dia em que
algo falha no meio.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `obra.autor` é `undefined` | Faltou `relations` ou `leftJoinAndSelect` |
| API lenta e log com dezenas de SELECTs | N+1 |
| `Type 'Autor \| null' is not assignable to type 'Autor'` | `findOneBy` pode não achar. Trate o `null`, não use `!` |
| `Cannot read properties of null` | `findOne` devolveu `null` e ninguém tratou. Use o padrão do `buscarUm` |
| `save()` criou registro novo em vez de atualizar | O objeto não tinha `id` |
| `QueryFailedError: syntax error at or near` | Parâmetro escrito como `$termo` ou `?termo`. No TypeORM é `:termo` |
| `/obras/buscar` responde 400 | Rota literal declarada depois de `@Get(":id")` |
| Listagem devolve o banco inteiro | Faltou `take` |
| Transação não desfez nada | Você usou `this.repo` em vez do `manager` de dentro da transação |
| A página 2 repete itens da 1 | Faltou `order`. Sem ordenação, o banco não garante ordem entre consultas |

## ✅ Checklist de saída

- [ ] CRUD completo funcionando pelos cinco endpoints
- [ ] Listagem **paginada e ordenada**, devolvendo `itens` e `total`
- [ ] Banco populado com volume (≥ 800 obras)
- [ ] N+1 reproduzido, medido e corrigido — com os números anotados
- [ ] Você mediu de novo com `take: 200` e viu qual dos dois piorou
- [ ] Busca com filtros opcionais no `QueryBuilder`, com parâmetros nomeados
- [ ] Nenhuma consulta monta SQL por concatenação
- [ ] Transação implementada e **testada com falha proposital**
- [ ] Endpoints temporários (`nome`, `ruim`, `bom`) apagados
- [ ] Você sabe dizer o que está errado no `@Body() dados: Partial<Obra>` do passo 6

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — QueryBuilder](https://typeorm.io/select-query-builder)
- [TypeORM — Transactions](https://typeorm.io/transactions)
- [Use The Index, Luke](https://use-the-index-luke.com/pt)
