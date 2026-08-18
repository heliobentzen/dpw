# M06 — Repository e QueryBuilder: consultas e CRUD

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 6** · **Pré-requisitos:** M04, M05

O item da ementa *"realização de consultas e operações de CRUD utilizando a API do
framework"*. Aqui a entidade deixa de ser esquema e passa a ser dado consultado.

## 🎯 Objetivos

Ao final você será capaz de:

1. Fazer CRUD completo pela API do TypeORM.
2. Ler o SQL gerado e relacioná-lo com o código que o produziu.
3. Diagnosticar e corrigir o problema **N+1**.
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
  obra.autor = await this.autores.findOneBy({ id: obra.autorId });  // ❌
}
```

Com 100 obras, isso são **101 consultas**: uma para a lista, uma por obra. É o problema N+1
— a causa nº 1 de API lenta.

A correção é declarar o que você precisa, e o ORM faz um `JOIN`:

```ts
await this.repo.find({ relations: { autor: true, categorias: true } });   // 1 consulta
```

| Estratégia | Consultas | Quando |
|---|---|---|
| Sem `relations` | 1 | Você só precisa dos campos da própria tabela |
| `relations: { x: true }` | 1, com `JOIN` | Você vai usar a relação |
| Buscar no laço | **N+1** | Nunca |

> **Como detectar:** com `logging: true`, abra a tela e conte as linhas de SQL no terminal.
> Se o número cresce com a quantidade de itens da lista, é N+1.

### 4. Paginação não é opcional

```ts
await this.repo.find({ skip: 0, take: 20 });
```

Endpoint de listagem **sem limite** funciona em desenvolvimento com 20 registros e derruba a
API com 200 mil. Toda listagem deste material é paginada — e o M07 padroniza o formato da
resposta.

### 5. Transações

Empréstimo é duas escritas: criar o registro **e** marcar o exemplar como indisponível. Se a
segunda falhar, a primeira não pode permanecer.

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Exemplar, exemplar.id, { disponivel: false });
});
```

Se qualquer linha lançar, tudo é desfeito. **Regra:** duas ou mais escritas que precisam ser
verdadeiras juntas vão numa transação.

💼 **No mercado:** N+1 e falta de paginação são os dois achados mais comuns em revisão de
API júnior. Saber demonstrar o problema com o log na mão vale mais que citar o nome dele.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Injetar o repositório (20 min)

`src/acervo/acervo.service.ts` — os dados em memória do M03 saem de cena:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Obra } from "./entidades/obra.entity";

@Injectable()
export class AcervoService {
  constructor(
    @InjectRepository(Obra)
    private readonly obras: Repository<Obra>,
  ) {}
}
```

| Trecho | O que faz |
|---|---|
| `@InjectRepository(Obra)` | Pede ao Nest o repositório **daquela** entidade. Ele existe porque `Obra` está no `forFeature` do módulo (M04) |
| `Repository<Obra>` | O genérico é o que dá tipo ao retorno: `find()` devolve `Obra[]`, não `any[]` |

### Passo 2 — CRUD completo (45 min)

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

async buscarUm(id: number): Promise<Obra> {
  const obra = await this.obras.findOne({
    where: { id },
    relations: { autor: true, categorias: true, exemplares: true },
  });
  if (!obra) throw new NotFoundException(`Obra ${id} não encontrada`);
  return obra;
}

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
| `findAndCount` | Devolve página **e total** numa chamada. O total é o que permite ao frontend desenhar a paginação |
| `create()` | Só monta a instância em memória — **não grava**. Quem grava é o `save` |
| `save()` | Faz `INSERT` se não há `id`, `UPDATE` se há. Uma função, dois comandos |
| `atualizar` via `buscarUm` + `save` | Mais lento que `update()`, porém dispara os *hooks* da entidade e valida a existência. Para CRUD, prefira este |
| `delete()` | Não erra se o id não existe — por isso conferimos `affected` |

**Teste cada um:**

```bash
# Linux / macOS / WSL / Git Bash
curl -s "http://localhost:3000/api/obras?pagina=1&tamanho=5" | head -c 300
curl -i http://localhost:3000/api/obras/1
```

```powershell
# Windows PowerShell
(Invoke-WebRequest "http://localhost:3000/api/obras?pagina=1&tamanho=5").Content.Substring(0,300)
curl.exe -i http://localhost:3000/api/obras/1
```

### Passo 3 — Popular o banco (20 min)

Precisamos de volume para que os problemas de desempenho apareçam. Copie
[`../../recursos/codigo/semear.ts`](../../recursos/codigo/semear.ts) para
`backend/src/semear.ts` e rode:

```bash
pnpm dlx ts-node src/semear.ts
```

Gera 60 autores, 800 obras e 2.000 exemplares.

> Com 20 registros tudo é rápido, inclusive o errado. Sem volume, este módulo vira teoria.

### Passo 4 — Caçar o N+1 (35 min)

Escreva **de propósito** a versão ruim:

```ts
async listarRuim() {
  const obras = await this.obras.find({ take: 50 });
  for (const obra of obras) {
    obra.autor = await this.autores.findOneBy({ id: (obra as any).autorId });
  }
  return obras;
}
```

Chame o endpoint e **conte as linhas de SQL** no terminal. Depois troque por:

```ts
async listarBom() {
  return this.obras.find({ take: 50, relations: { autor: true } });
}
```

Conte de novo. Preencha:

| Versão | Consultas | Tempo |
|---|---|---|
| Ruim | | |
| Boa | | |

Meça o tempo com:

```bash
# Linux / macOS / WSL / Git Bash
curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:3000/api/obras
```

```powershell
# Windows PowerShell
curl.exe -s -o NUL -w "%{time_total}s`n" http://localhost:3000/api/obras
```

> Escrever a versão ruim é parte do exercício. Quem só vê a correta não reconhece o padrão
> quando ele aparecer disfarçado, dentro de um `map` em outro arquivo.

### Passo 5 — QueryBuilder e busca (35 min)

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
| `ILIKE` | Busca sem diferenciar maiúsculas — PostgreSQL. No SQLite use `LIKE` |

Rode e **leia o SQL gerado** com e sem cada filtro. Confirme que o `WHERE` muda.

### Passo 6 — Transação (25 min, em duplas)

Implemente `EmprestimosService.emprestar(exemplarId, associadoId)`:

1. Buscar o exemplar; erro se não existir.
2. Recusar se já houver empréstimo em aberto para ele.
3. Recusar se o associado já tiver 3 empréstimos em aberto.
4. Criar o empréstimo com previsão de devolução em 14 dias.
5. Marcar o exemplar como indisponível.

Os passos 4 e 5 vão **na mesma transação**. Depois, force uma falha no passo 5 (lance um
erro de propósito) e confirme que o empréstimo do passo 4 **não** ficou no banco.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `obra.autor` é `undefined` | Faltou `relations` ou `leftJoinAndSelect` |
| API lenta e log com dezenas de SELECTs | N+1 |
| `Cannot read properties of null` | `findOne` devolveu `null` e ninguém tratou. Use o padrão do `buscarUm` |
| `save()` criou registro novo em vez de atualizar | O objeto não tinha `id` |
| `QueryFailedError: syntax error at or near` | Parâmetro escrito como `$termo` ou `?termo`. No TypeORM é `:termo` |
| `ILIKE` falha | É do PostgreSQL. No SQLite, `LIKE` já ignora maiúsculas em ASCII |
| Listagem devolve o banco inteiro | Faltou `take` |
| Transação não desfez nada | Você usou `this.obras` em vez do `manager` de dentro da transação |

## ✅ Checklist de saída

- [ ] CRUD completo funcionando pelos cinco endpoints
- [ ] Listagem **paginada**, devolvendo `itens` e `total`
- [ ] Banco populado com volume (≥ 800 obras)
- [ ] N+1 reproduzido, medido e corrigido — com os números anotados
- [ ] Busca com filtros opcionais no `QueryBuilder`, com parâmetros nomeados
- [ ] Nenhuma consulta monta SQL por concatenação
- [ ] Transação implementada e **testada com falha proposital**
- [ ] Você leu o SQL gerado de cada consulta que escreveu

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — QueryBuilder](https://typeorm.io/select-query-builder)
- [TypeORM — Transactions](https://typeorm.io/transactions)
- [Use The Index, Luke](https://use-the-index-luke.com/pt)
