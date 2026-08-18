# M04 — Exercícios

## E04.1 — Escolher a coluna certa (individual)

Para cada dado, indique o `@Column` completo e justifique:

| # | Dado | `@Column({...})` + tipo TS | Justificativa |
|---|---|---|---|
| 1 | CPF do associado | | |
| 2 | Valor da multa por atraso | | |
| 3 | Data de nascimento (opcional) | | |
| 4 | Caminho do arquivo da capa | | |
| 5 | Aceita receber avisos por e-mail | | |
| 6 | Observações do bibliotecário (opcional, longo) | | |
| 7 | Número de páginas | | |
| 8 | Identificador público na URL, sem revelar quantos registros existem | | |
| 9 | Situação do empréstimo (ativo/devolvido/atrasado) | | |
| 10 | Momento exato do registro, com fuso | | |

Pegadinhas: **2** — dinheiro **nunca** é `float`; **8** — `@PrimaryGeneratedColumn("uuid")`,
porque id sequencial revela volume; **9** — enum, não texto livre; **1** — guardar CPF exige
base legal na LGPD, discuta antes de modelar.

---

## E04.2 — `onDelete` como decisão de negócio (individual)

| Relação | `onDelete` | Justificativa **de negócio** (não técnica) |
|---|---|---|
| `Obra` → `Autor` | | |
| `Exemplar` → `Obra` | | |
| `Emprestimo` → `Exemplar` | | |
| `Emprestimo` → `Associado` | | |
| `Associado` → `Usuario` | | |

Uma justificativa técnica ("para não dar erro de chave estrangeira") **não vale**. A pergunta
é: o que a biblioteca perde se este registro sumir junto?

---

## E04.3 — Modelar reservas (em duplas) ⭐

Uma associada reserva uma **obra** (não um exemplar) e entra numa fila. Quando um exemplar
volta, a primeira da fila é avisada e tem 48h para retirar.

Modele `Reserva` com: obra, associado, momento da reserva, situação
(aguardando/avisada/atendida/expirada), momento do aviso.

Depois responda:

1. Por que a reserva aponta para `Obra` e não para `Exemplar`?
2. Que índice a fila precisa? Sobre quais colunas, em que ordem?
3. Como impedir a mesma pessoa de reservar duas vezes a mesma obra, **no banco**?

**Verificação:**
- [ ] A entidade gera tabela e o schema foi conferido
- [ ] Existe restrição de unicidade composta, não só validação no código
- [ ] O índice da fila está justificado

---

## E04.4 — Ler o schema gerado (individual)

Rode a aplicação com `logging: true` e responda **olhando o SQL**:

1. Que nome recebeu a coluna da chave estrangeira em `obra`? Por que não `autor`?
2. `obra_categoria` tem chave primária? Composta de quê?
3. `@CreateDateColumn` virou que tipo no seu banco?
4. Quantos índices existem em `exemplar`? De onde vem cada um?
5. `simple-enum` virou o quê no SQLite? E `enum` no PostgreSQL?

---

## E04.5 — O limite do `synchronize` (individual)

Com dados no banco, tente cada mudança e anote o que acontece:

| # | Mudança | O que aconteceu | Perdeu dado? |
|---|---|---|---|
| 1 | Adicionar coluna `nullable` | | |
| 2 | Adicionar coluna `NOT NULL` **sem** `default` | | |
| 3 | Renomear `sinopse` → `resumo` | | |
| 4 | Reduzir `length` de 200 para 10 | | |
| 5 | Trocar `int` por `varchar` | | |

O caso 3 é o mais importante: confira se os dados sobreviveram. **Esta tabela é a
justificativa do M05** — guarde-a.

---

## E04.6 — Índice sob medida (individual)

Estas consultas vão existir no M06:

1. Buscar obras por trecho do título
2. Listar empréstimos em aberto de um associado
3. Listar exemplares de uma obra, por estado
4. Encontrar exemplar pelo número de tombo

Para cada uma: qual índice, sobre quais colunas, em que ordem — e **por que essa ordem**.

> Em índice composto, a ordem das colunas decide quais consultas ele atende. Um índice em
> `(associado, situacao)` serve para filtrar só por associado; o inverso, não.

---

## Gabarito parcial

**E04.1** — 2: `@Column({ type: "decimal", precision: 10, scale: 2 })`. Float perde centavos
por arredondamento binário. 8: `@PrimaryGeneratedColumn("uuid")`. 6: `type: "text",
default: ""` — evita `null` em texto opcional. 10: `timestamptz`, não `timestamp`: sem fuso,
o mesmo instante vira horas diferentes conforme o servidor.

**E04.2** — `Obra → Autor`: `RESTRICT`. Apagar autora não pode sumir com o acervo dela.
`Exemplar → Obra`: `CASCADE` — exemplar não existe sem a obra. `Emprestimo → Exemplar` e
`→ Associado`: `RESTRICT` — histórico de empréstimo é registro contábil da biblioteca.

**E04.3** — (1) A pessoa quer *a obra*; qualquer exemplar serve. Reservar exemplar
específico deixaria a fila parada enquanto outro volume está livre. (3) `@Index(["obra",
"associado"], { unique: true })`, filtrando só as situações ativas se o seu banco suportar
índice parcial.

**E04.4** — (1) `autorId`: o TypeORM cria a coluna escalar a partir do nome da propriedade
mais `Id`; a propriedade `autor` é o objeto, não a coluna. (2) Chave primária composta pelas
duas FKs.

**E04.5** — 2 falha se houver linhas. 3 **apaga a coluna e cria outra vazia**: o
`synchronize` não enxerga renomeação, vê uma coluna que sumiu e outra que apareceu.
