# M06 — Repository e QueryBuilder: consultas e CRUD

> **Pré-requisito:** M05 · **Duração:** longa · **Semanas:** 6–7
> **Ementa:** *Geração de consultas ao BD e operações CRUD a partir da API do framework.*
> **No projeto:** o recurso principal passa a ler e gravar no banco · P2 (critérios 2 e 3) e P3 (critério 1)

## Por que este módulo existe no projeto

O recurso que a equipe criou no M03 ainda responde dados de um array em memória. Agora ele
passa a usar o banco — e o **contrato HTTP não muda nada**: quem chama a API não percebe a
troca. É a separação em camadas do M03 deixando de ser promessa.

O módulo também previne os três problemas que mais aparecem quando a API sai da sala de aula
e recebe os dados reais da organização: **listagem sem limite** (derruba a API), **N+1**
(deixa tudo lento) e **SQL montado com texto do usuário** (abre o banco para qualquer um).
Com 20 registros de teste, nenhum dos três aparece. Por isso o módulo trabalha com volume.

## 🎯 Ao final do módulo

1. O recurso do cenário principal tem CRUD completo no banco, com listagem paginada.
2. A equipe sabe detectar e corrigir N+1 **medindo**, não supondo.
3. Toda consulta usa parâmetros, e escritas que precisam acontecer juntas usam transação.

---

## 📖 Conceitos

### 1. O repositório: o banco injetado no service

```ts
@Injectable()
export class PessoasService {
  constructor(@InjectRepository(Pessoa) private readonly pessoas: Repository<Pessoa>) {}
}
```

É a injeção do M03 com um decorator a mais, dizendo **de qual entidade**. Só funciona se a
entidade estiver no `forFeature` do módulo (M04).

### 2. Listar: sempre paginado, sempre ordenado

```ts
async listar(pagina = 1, tamanho = 20) {
  const [itens, total] = await this.pessoas.findAndCount({
    order: { nome: "ASC" },
    skip: (pagina - 1) * tamanho,
    take: tamanho,
  });
  return { itens, total, pagina, tamanho };
}
```

| Trecho | Por quê |
| --- | --- |
| `findAndCount` | A página **e o total**: quem consome mostra "página 3 de 41" |
| `take` | Sem ele, a API devolve o banco inteiro. Com 200 mil registros, não fica lenta: **cai** |
| `order` | Sem ordem, o banco devolve como quiser, e a página 2 pode repetir itens da 1 |

O formato `{ itens, total, pagina, tamanho }` é o que o contrato (M02) fixou. Hoje
`?tamanho=999999` ainda passa; o **teto** entra no M07, junto com a validação.

### 3. Relações não vêm sozinhas

```ts
const atendimento = await this.atendimentos.findOne({
  where: { id },
  relations: { pessoa: true, servicos: true },
});
if (!atendimento) throw new NotFoundException(`Atendimento ${id} não encontrado`);
```

Sem `relations`, `atendimento.pessoa` é `undefined`. **Peça o que a resposta usa**, não tudo.
`findOne` devolve `T | null`, e o TypeScript obriga a tratar o `null`.

### 4. N+1: uma viagem ao banco por item

A tentação, quando a relação não veio:

```ts
const lista = await this.atendimentos.find({ take: 50 });
for (const a of lista) {
  a.pessoa = await this.pessoas.findOneByOrFail({ id: a.pessoaId });   // ❌ uma consulta por item
}
```

É ir ao mercado **uma vez por item da lista**. Uma consulta para a lista + **N** para os
itens: 50 itens = 51 consultas; 200 itens = 201. Com `relations: { pessoa: true }`, são
**2 consultas, qualquer que seja o tamanho**.

| Mudança | Com `relations` | Com laço |
| --- | --- | --- |
| A lista dobra | igual | dobra |
| O banco vai para outro servidor (M12) | +1 ida e volta | **+201 idas e voltas** |

> **Como detectar:** com `logging: true`, chame a rota e **conte as linhas `query:`**. Se o
> número cresce com o tamanho da lista, é N+1.

### 5. Escrever

```ts
async criar(dados: Partial<Pessoa>) {
  return this.pessoas.save(this.pessoas.create(dados));
}

async atualizar(id: number, dados: Partial<Pessoa>) {
  const pessoa = await this.buscarUm(id);   // 404 se não existir
  Object.assign(pessoa, dados);
  return this.pessoas.save(pessoa);          // tem id → UPDATE
}

async remover(id: number) {
  const r = await this.pessoas.delete(id);
  if (r.affected === 0) throw new NotFoundException(`Pessoa ${id} não encontrada`);
}
```

`create()` só monta o objeto em memória; quem grava é o `save()`. `delete()` não erra quando
o id não existe — por isso o `affected`.

> ⚠️ **`Partial<Pessoa>` aceita qualquer campo da entidade**, inclusive `criadoEm` ou um
> futuro `papel: "admin"`. É temporário e errado de propósito: o M07 começa resolvendo isso.

### 6. QueryBuilder: quando os filtros são opcionais

O `Repository` serve para CRUD e filtros fixos. Quando a busca combina filtros opcionais, o
`QueryBuilder` é mais claro — cada filtro é um `if` que acrescenta uma linha:

```ts
async buscar(termo?: string, servicoId?: number) {
  const qb = this.atendimentos.createQueryBuilder("a")
    .leftJoinAndSelect("a.pessoa", "pessoa")     // JOIN e traz os dados
    .leftJoin("a.servicos", "servico");          // JOIN só para filtrar

  if (termo) qb.andWhere("pessoa.nome ILIKE :termo", { termo: `%${termo}%` });
  if (servicoId) qb.andWhere("servico.id = :servicoId", { servicoId });

  return qb.orderBy("a.criadoEm", "DESC").take(20).getMany();
}
```

**Regra prática:** comece pelo `Repository`; troque quando o objeto de opções virar
quebra-cabeça.

### 7. Parâmetro, nunca concatenação

```ts
.where(`pessoa.nome = '${termo}'`)               // ❌ injeção de SQL
.where("pessoa.nome = :termo", { termo })        // ✅
```

Na primeira forma, buscar por `' OR 1=1 --` vira `WHERE nome = '' OR 1=1 --'` e devolve a
tabela inteira. Na segunda, o driver envia comando e valor **separados**, e o valor é texto,
sempre. **Crase ou `+` montando consulta com dado do usuário está errado — sem exceção.**

### 8. Transação: duas escritas que precisam ser verdadeiras juntas

Registrar um empréstimo é duas escritas: criar o empréstimo **e** marcar o item como
indisponível. Se a segunda falhar, o sistema mente.

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(emprestimo);
  await manager.update(Item, item.id, { disponivel: false });
});
```

Se qualquer linha lançar, **tudo** é desfeito. A armadilha: usar `this.itens.update(...)`
(o repositório normal) **dentro** da transação — ele roda fora dela e não é desfeito.
**Dentro da transação, sempre o `manager`.**

---

## 🧩 No projeto da equipe

### Passo 1 — O recurso principal no banco

Troquem o array do M03 pelo repositório, no **service**. Implementem `listar` (paginado e
ordenado), `buscarUm` (com as relações que o detalhe mostra), `criar`, `atualizar` e
`remover`, e as rotas correspondentes no controller (`@Post`, `@Patch(":id")`,
`@Delete(":id")`, com `@Body()` e `@Query()`).

**Deu certo se** as chamadas do M03 continuam respondendo igual — agora com dados do banco.

### Passo 2 — Dados de exemplo com volume

Escrevam `backend/src/semear.ts` a partir do modelo
[`recursos/codigo/semear.ts`](../../recursos/codigo/semear.ts), com as entidades de vocês:

```bash
npm install -D @faker-js/faker
npx ts-node --esm src/semear.ts
```

Gerem **centenas** de registros na tabela principal: com 20, tudo é rápido, inclusive o
errado. O mesmo script serve para a demonstração da P2 (com dados realistas, nunca dados
pessoais reais da organização).

### Passo 3 — Medir a listagem principal

Com o log ligado, chamem a listagem com `?tamanho=50` e depois `?tamanho=200` e **contem as
consultas**:

```bash
curl -s -o /dev/null -w "%{time_total}s\n" "http://localhost:3000/api/<recurso>?tamanho=200"
```

```powershell
curl.exe -s -o NUL -w "%{time_total}s`n" "http://localhost:3000/api/<recurso>?tamanho=200"
```

Registrem em `docs/consultas.md`: número de consultas e tempo, com 50 e com 200. Se o número
cresce, corrijam e meçam de novo. **O antes e depois medidos são a evidência de "sem N+1" na
P2.**

### Passo 4 — A busca do cenário principal

A busca que a organização mais usa (por nome, por data, por situação...) com `QueryBuilder`
e parâmetros nomeados. Testem com `?termo=' OR 1=1 --`: deve devolver **nada**, e o log deve
mostrar o texto como parâmetro.

### Passo 5 — A transação do cenário principal

Identifiquem, no cenário principal, as escritas que precisam acontecer juntas. Implementem
com `dataSource.transaction` e **provem**: lancem um erro de propósito entre as duas escritas
e confiram no banco que nada ficou gravado.

```bash
docker compose exec db psql -U app -d app -c "SELECT count(*) FROM <tabela>;"
```

Se o cenário de vocês não tem duas escritas dependentes, registrem isso em
`docs/consultas.md` com a explicação — e procurem de novo: quase sempre tem.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `Nest can't resolve dependencies of the XService` | A entidade não está no `forFeature` |
| `x.relacao` é `undefined` | Faltou `relations` ou `leftJoinAndSelect` |
| API lenta, log com dezenas de `SELECT` | N+1 |
| `save()` criou em vez de atualizar | O objeto não tinha `id` |
| `QueryFailedError: syntax error at or near` | Parâmetro como `$termo` ou `?termo`; no TypeORM é `:termo` |
| `/x/buscar` responde 400 | Rota literal declarada depois de `@Get(":id")` |
| A página 2 repete itens da 1 | Faltou `order` |
| A transação não desfez nada | Repositório normal usado no lugar do `manager` |

## 🤖 IA no fluxo

Em toda consulta que a IA escrever, confira: algum `await` dentro de laço (N+1)? Algum valor
do usuário colado na string (injeção)? Duas escritas dependentes fora de transação, ou com o
repositório normal dentro dela? E mantenha o `logging`: o SQL executado é a resposta
definitiva.

## ✅ Marco do módulo

- [ ] CRUD do recurso principal no banco, via PR revisado
- [ ] Listagem paginada e ordenada, no formato do contrato
- [ ] `semear.ts` com volume; `docs/consultas.md` com a medição de N+1 antes e depois
- [ ] Busca com `QueryBuilder` e parâmetros nomeados, testada com entrada hostil
- [ ] Transação do cenário principal, testada com falha proposital

## 📚 Para aprofundar

- [`cheatsheet.md`](cheatsheet.md) — referência rápida de `find`, operadores e `QueryBuilder`
- [TypeORM — Repository API](https://typeorm.io/repository-api) · [QueryBuilder](https://typeorm.io/select-query-builder) · [Transactions](https://typeorm.io/transactions)
- [Use The Index, Luke](https://use-the-index-luke.com/pt)
- [Slides do M06](../../slides/m06-consultas-crud.html)
