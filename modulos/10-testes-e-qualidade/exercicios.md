# M10 — Exercícios

## E10.1 — Testar a busca de obras (individual)

O `AcervoService.buscar` do M06 (etapa 12) monta a consulta conforme os filtros recebidos.

1. Escreva testes **E2E** para `GET /api/obras` cobrindo: sem filtro, `?busca=` por trecho
   do título, por nome do autor, e uma busca que não acha nada.
2. Inclua um caso com `%` e `'` no termo de busca. O que ele prova?

**Verificação:**

- [ ] A busca sem resultado devolve lista vazia com `200`, não erro
- [ ] O caso com `'` prova que a consulta é parametrizada (M06, etapa 13)

---

## E10.2 — Matriz completa (individual) ⭐

Acrescente à matriz da etapa 14 **todas** as rotas da sua API — inclusive as de exemplares
do exercício E08.2 e o `GET /api/usuarios/:id` do M09.

**Verificação:**

- [ ] Toda rota de escrita tem ao menos um caso `401` e um `403`
- [ ] A autorização por objeto do M09 tem dois casos: o próprio cadastro e o de outra pessoa
- [ ] Você removeu um guard de propósito e viu a linha certa ficar vermelha

---

## E10.3 — Teste de mutação à mão (em duplas)

Uma pessoa faz **uma** mudança pequena no código de produção sem contar qual: troca um `>=`
por `>`, um `404` por `400`, apaga um `@UseGuards`. A outra roda as suítes.

| Mutação | Algum teste pegou? | Qual? |
|---|---|---|
| | | |

Façam ao menos cinco rodadas, trocando de papel. Para cada mutação que **ninguém** pegou,
escrevam o teste que pegaria.

---

## E10.4 — Desafio de fixação, implementado (individual) ⭐

Implemente a regra do desafio de fixação — associado com empréstimo atrasado não pega mais
nada — **começando pelos testes**:

1. Escreva o teste unitário e veja-o falhar.
2. Escreva o mínimo de código para ele passar.
3. Escreva o teste E2E e veja-o passar.
4. Pense: algum teste antigo precisou mudar? Se sim, por quê?

> Esta ordem — teste vermelho, código, teste verde — se chama **TDD** (*desenvolvimento
> guiado por testes*). Não é obrigatória, mas experimente uma vez para sentir a diferença.

---

## E10.5 — O limite de tentativas (individual)

A etapa 13 desligou o *throttler* nos testes. Escreva um arquivo E2E **separado** que:

1. Monta a aplicação **sem** o `overrideGuard`.
2. Faz seis tentativas de login com senha errada.
3. Confere que as cinco primeiras recebem `401` e a sexta, `429`.

Por que este teste precisa estar num arquivo próprio, com uma aplicação própria?

---

## E10.6 — CI que falha pelo motivo certo (individual)

Provoque, em *branches* separadas, uma falha em cada passo do CI e anote o que o GitHub
mostra:

| Passo | Como provocar | Mensagem no GitHub |
|---|---|---|
| lint | | |
| build | | |
| `migration:check` | Campo novo numa entidade, sem migração | |
| unitário | | |
| E2E | | |

---

## Gabarito parcial

**E10.1** — (2) Se a consulta concatenasse o termo, o `'` quebraria o SQL e a resposta
seria `500`; com parâmetro, é só um caractere a mais na busca. O `%` mostra outra coisa:
dentro do `ILIKE` ele é curinga — buscar `%` acha tudo. Se isso é aceitável, é decisão de
produto.

**E10.4** — (4) Sim, provavelmente: os testes do caminho feliz precisam passar a dizer
"sem atraso". O dublê de `emprestimos` ganha mais um método (o que conta atrasados), e o E2E
precisa de um empréstimo com `previstoPara` no passado.

**E10.5** — O *throttler* conta tentativas por IP **na memória da aplicação**. Num arquivo
com outros testes, os logins deles entrariam na conta e o teste dependeria da ordem de
execução.
