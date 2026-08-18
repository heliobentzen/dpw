# M06 — Exercícios

> Todos exigem o banco populado (`semear.ts`) e `logging: true`. **Leia o SQL de cada
> consulta que escrever** — é isso que separa usar o ORM de confiar nele.

## E06.1 — Traduzir para o Repository (individual)

Escreva cada consulta com a API do `Repository` e cole o SQL gerado:

| # | Consulta |
|---|---|
| 1 | Obras publicadas antes de 1900, por título |
| 2 | Obras cujo título contém "sertão", sem diferenciar maiúsculas |
| 3 | Obras de um autor específico, com o autor carregado |
| 4 | Exemplares em estado `DESGASTADO` ou `DESCARTADO` |
| 5 | Obras **sem** ISBN cadastrado |
| 6 | As 10 obras mais recentes |
| 7 | Obras de qualquer autor cujo nome comece com "Machado" |
| 8 | Total de obras cadastradas (só a contagem, sem trazer as linhas) |

Pegadinhas: **5** — vazio (`""`) e `NULL` são coisas diferentes; qual é o seu caso?
**8** — `count()`, não `find().length`; a diferença é trazer 800 linhas ou uma.

---

## E06.2 — Caçar o N+1 (individual) ⭐

1. Escreva um endpoint que lista 50 obras e, **para cada uma**, busca o autor num laço.
2. Chame-o e conte as linhas de SQL no terminal.
3. Meça o tempo.
4. Corrija com `relations`.
5. Meça de novo.

| Versão | Consultas | Tempo | Linhas de código |
|---|---|---|---|
| Ruim | | | |
| Boa | | | |

Depois responda: a versão ruim tem **mais** ou **menos** linhas de código? O que isso diz
sobre encontrar N+1 em revisão de código?

---

## E06.3 — Relatórios com QueryBuilder (em duplas) ⭐

| # | Relatório |
|---|---|
| 1 | Quantas obras por autor, só quem tem mais de 3, do maior para o menor |
| 2 | Quantos exemplares por estado |
| 3 | Autores **sem** nenhuma obra cadastrada |
| 4 | Obras com pelo menos um exemplar disponível |
| 5 | Os 5 associados com mais empréstimos no último ano |
| 6 | Média de dias entre empréstimo e devolução |

O item 3 é o mais instrutivo: exige `LEFT JOIN` com `IS NULL`, e a versão ingênua com
`NOT IN` fica muito mais lenta. Escrevam as duas e comparem o tempo.

---

## E06.4 — Busca com filtros opcionais (individual)

`GET /api/obras/buscar` aceitando `?q=`, `?autorId=`, `?categoriaId=`, `?de=`, `?ate=` —
todos opcionais e combináveis.

**Verificação:**
- [ ] Sem nenhum filtro, devolve a primeira página de tudo
- [ ] Cada filtro isolado funciona
- [ ] Combinados funcionam (`?q=casa&de=1900`)
- [ ] O SQL gerado **muda** conforme os filtros — confira nos logs
- [ ] Nenhum valor é concatenado na string da consulta
- [ ] Há `take` sempre

---

## E06.5 — Injeção de SQL na prática (individual) ⚠️

Escreva **de propósito** a versão vulnerável:

```ts
.where(`obra.titulo = '${termo}'`)
```

Chame com `?q=' OR 1=1 --` e observe. Depois com `?q=' UNION SELECT ...`.

1. Cole a consulta que o banco recebeu.
2. Explique por que o `--` no final é necessário.
3. Corrija com parâmetro nomeado e mostre o SQL agora.
4. Onde exatamente o valor viaja, na versão correta?

Apague a versão vulnerável ao terminar. O M13 retoma o assunto.

---

## E06.6 — Transação com falha (em duplas) ⭐

Implemente `emprestar(exemplarId, associadoId)` com as cinco regras do roteiro. Depois:

1. Force um erro **depois** de salvar o empréstimo e antes de marcar o exemplar.
2. Confirme no banco que **nenhum** dos dois foi gravado.
3. Remova a transação e repita: agora há empréstimo sem exemplar reservado?
4. Descreva o estado inconsistente que o passo 3 produziu, na linguagem da biblioteca.

---

## E06.7 — Exclusão lógica (individual)

Obra retirada do acervo não deve sumir do histórico de empréstimos.

1. Acrescente `@DeleteDateColumn()` a `Obra`.
2. Troque `delete` por `softDelete` no service.
3. Confirme que a listagem deixa de trazê-la automaticamente.
4. Escreva uma consulta que a traga de volta (`withDeleted: true`).
5. Responda: o que acontece com os empréstimos que apontam para ela?

---

## E06.8 — Índice medido (individual)

1. Consulte `Exemplar` por `tombo` e meça o tempo.
2. Rode `EXPLAIN` (ou `EXPLAIN ANALYZE`) e anote se houve varredura sequencial.
3. Crie o índice, gere a migração, aplique.
4. Meça e rode `EXPLAIN` de novo.

| | Tempo | Plano de execução |
|---|---|---|
| Sem índice | | |
| Com índice | | |

---

## Gabarito parcial

**E06.1** — 5: se o campo tem `default: ""`, o filtro é `isbn: ""`, não `IsNull()`. Foi
decisão do M04 e ela reaparece aqui: `default: ""` simplifica a leitura e complica a consulta
de ausência. Registre o trade-off. 7: filtro por relação — `where: { autor: { nome:
ILike("Machado%") } }`; sem `%` no início, o índice pode ser usado.

**E06.2** — A versão ruim costuma ter **mais** linhas. Ninguém a escreve de propósito: ela
aparece quando alguém "só precisa do nome do autor" dentro de um `map` em outro arquivo. Por
isso N+1 se encontra pelo **log**, não pela leitura do código.

**E06.3** — 3: `LEFT JOIN obra ON ... WHERE obra.id IS NULL`. A versão com `NOT IN
(SELECT ...)` materializa a subconsulta inteira e degrada rápido com volume.

**E06.5** — O `--` comenta o resto da consulta, descartando a aspa que fecharia a string
original. Na versão correta, o valor **não** vai na consulta: o driver envia comando e
parâmetros separados, e o banco nunca interpreta o dado como SQL.

**E06.7** — Depende do `onDelete`. Com `RESTRICT`, exclusão lógica é justamente a saída:
preserva o histórico sem violar a chave estrangeira.
