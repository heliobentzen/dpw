# M05 — Exercícios

## E05.1 — Ler antes de aplicar (individual)

Gere uma migração para cada mudança, **abra o arquivo** e responda sem aplicar:

| # | Mudança na entidade | O SQL gerado é reversível? | Perde dado? |
|---|---|---|---|
| 1 | Adicionar `Obra.destaque` (boolean, default false) | | |
| 2 | Adicionar `Obra.codigoInterno` (`unique`) | | |
| 3 | Remover `Obra.isbn` | | |
| 4 | Trocar `Exemplar.estado` de texto para enum | | |
| 5 | Adicionar índice em `Obra.anoPublicacao` | | |

O caso 2 é o interessante: `unique` numa tabela com linhas existentes. O que o SQL faz com
os valores repetidos — ou com os vazios?

---

## E05.2 — Migração de dados (individual) ⭐

Crie uma migração **vazia** (`migration:create`) que:

1. Preencha `Obra.destaque = true` para obras anteriores a 1900;
2. Normalize `Exemplar.tombo` para maiúsculas;
3. Tenha um `down` **honesto** — e, se não for perfeitamente reversível, um comentário
   dizendo exatamente o que se perde.

**Verificação:**
- [ ] Usou `migration:create`, não `migration:generate` — e sabe dizer por quê
- [ ] `migration:run` aplica; `migration:revert` desfaz sem erro
- [ ] O `down` está comentado quando não é fiel

---

## E05.3 — Expandir e contrair (em duplas) ⭐⭐

Renomeie `Associado.telefone` para `Associado.celular` sem perder dados, em quatro
migrações separadas. Ao final, revertam todas e confiram os dados.

Respondam por escrito:

1. Depois do passo 1 (expandir), o **código antigo** ainda funciona com o banco novo?
2. E depois do passo 4 (contrair)?
3. Entre quais passos o deploy pode ser revertido com segurança?
4. Se o passo 3 (trocar a leitura) falhar em produção, qual é o plano?

---

## E05.4 — Conflito de migração (em duplas)

Simulem o que acontece toda semana num time real:

1. Cada pessoa cria uma branch a partir de `main`.
2. A pessoa A adiciona `Obra.editora`; a B adiciona `Obra.idioma`.
3. Ambas geram migração e commitam.
4. A mescla a dela. B tenta mesclar a sua.

Respondam:

- O Git acusou conflito? Nos arquivos de migração, ou em outro lugar?
- Rodar `migration:run` depois do merge funciona? Por quê?
- Qual é o procedimento correto de resolução?

> Não há conflito de texto: são arquivos diferentes. O problema é de **ordem** — e o timestamp
> é que decide. Esta é a armadilha que só aparece em equipe.

---

## E05.5 — Recuperar um banco quebrado (individual)

Provoque e resolva:

1. Rode `migration:run`, depois **apague à mão** uma coluna criada por ela.
2. Rode `migration:run` de novo. O que acontece?
3. Rode `migration:revert`. E agora?
4. Recupere o banco para um estado consistente e descreva os passos.

---

## E05.6 — O que o ORM não abstrai (individual)

Abra a migração `Inicial` e cace, no SQL, tudo que é **específico do PostgreSQL**. Comece
por estes e procure outros:

| Trecho no SQL | Por que é específico |
|---|---|
| `SERIAL` | |
| `CREATE TYPE ... AS ENUM` | |
| `character varying` | |
| `"public"."..."` | |

Agora responda:

1. Onde ficou o `CREATE TYPE` do enum em relação ao `CREATE TABLE` que o usa? Por quê?
2. Se a instituição decidisse migrar para MySQL amanhã, o que precisaria ser reescrito: as
   **entidades**, as **migrações**, ou os dois?
3. Você escreveu alguma dessas linhas de SQL? Quem escreveu?
4. O que isso ensina sobre o que o ORM abstrai e o que ele não abstrai?

---

## Gabarito parcial

**E05.1** — 2: adicionar `unique` numa coluna com valores repetidos **falha na aplicação**,
não na geração. A migração é gerada sem erro e quebra no `run` — motivo pelo qual se testa
migração contra uma cópia dos dados reais, nunca contra banco vazio. 3: remover coluna é
reversível no esquema (o `down` a recria) mas **não nos dados**: eles não voltam.

**E05.3** — (1) Sim: a coluna antiga continua lá. (2) Não: o código antigo procura
`telefone`, que não existe mais. (3) Entre 1 e 3 com segurança total; depois do 4, reverter o
código exige reverter a migração. (4) Como o passo 1 manteve as duas colunas, basta reverter
o deploy do código — o banco não precisa mudar.

**E05.6** — (1) Antes, e obrigatoriamente: no PostgreSQL o tipo enumerado é um objeto do
banco, que precisa existir para a coluna poder referenciá-lo. (2) Só as migrações. As
entidades não mudam uma linha — é a promessa do ORM se cumprindo. (3) Ninguém da turma: o
`migration:generate` escreveu tudo. (4) O ORM abstrai o **código de aplicação**, não o **SQL
gerado**. É por isso que migração se gera contra o mesmo banco que roda em produção, e que
usar um banco diferente em desenvolvimento cria uma dívida que vence no deploy.
