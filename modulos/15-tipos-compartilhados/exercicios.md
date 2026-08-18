# M15 — Exercícios

## E15.1 — Encontrar as duplicatas (individual)

Antes de compartilhar, mapeie o que já está duplicado no seu projeto:

| Definição | Onde está no backend | Onde está no frontend | Divergiram? |
|---|---|---|---|
| Papéis de usuário | | | |
| Estados do exemplar | | | |
| Situações do empréstimo | | | |
| Limite de empréstimos em aberto | | | |
| Dias de prazo | | | |
| Tamanho máximo de página | | | |

Para cada linha que **já** divergiu, escreva o que aconteceria na tela.

> A tabela costuma surpreender. Duplicata que ninguém percebeu é justamente a que vai
> divergir na próxima alteração.

---

## E15.2 — A regra que só existe uma vez (individual) ⭐

1. Mova `LIMITE_EMPRESTIMOS_ABERTOS` para `@bibliocom/tipos`.
2. Faça o **service** do backend usá-lo na regra de recusa.
3. Faça o **frontend** usá-lo na mensagem exibida ao usuário.
4. Mude o valor para 5 e rode os dois. Ambos mudaram?
5. Volte para 3.

**Verificação:**
- [ ] Nenhum dos dois tem o número escrito à mão
- [ ] Um único `git grep 3` não encontra o limite em lugar nenhum
- [ ] Mudar o pacote muda o comportamento das duas camadas

---

## E15.3 — Ver o compilador salvar (individual) ⭐

Reproduza o cenário da teoria e **documente com evidência**:

1. Anote o estado inicial: `tsc --noEmit` limpo nas duas camadas.
2. Renomeie um campo no `ObraResposta` do backend.
3. **Sem** regerar os tipos, rode `tsc --noEmit` no frontend. Passa?
4. Regenere. Rode de novo. Quantos erros, em quantos arquivos?
5. Corrija os usos e confirme.

Responda: o passo 3 explica por que a **geração** precisa estar no CI, e não só no seu
hábito. Escreva em uma frase.

---

## E15.4 — O que não atravessa (individual)

Tente **de propósito** exportar a entidade `Obra` do TypeORM pelo pacote compartilhado e
importá-la no frontend.

1. O que aconteceu no build do frontend?
2. Que dependências foram arrastadas junto?
3. Qual o tamanho do bundle antes e depois?
4. Reverta e explique, em duas frases, por que tipos de resposta atravessam a fronteira e
   entidades não.

---

## E15.5 — Quebrar o CI de propósito (em duplas) ⭐

1. Uma pessoa muda um DTO do backend e commita **sem** regerar os tipos.
2. Abre PR.
3. A outra observa o CI.

Respondam:
- Qual passo falhou, e qual foi a mensagem?
- Quanto tempo levou entre o commit e o sinal vermelho?
- Sem essa verificação, quando o erro apareceria? Para quem?

---

## E15.6 — Contrato versionado (individual)

O `openapi.json` está no Git. Use isso:

1. `git log -p backend/openapi.json` — o histórico do contrato.
2. Encontre um commit em que a API mudou de forma **incompatível** (campo removido ou tipo
   alterado).
3. Escreva o que um cliente que não acompanhou teria visto quebrar.
4. Proponha como aquela mudança poderia ter sido feita de forma compatível — a mesma ideia
   de expandir/contrair do M05.

---

## E15.7 — Estender ao projeto da equipe (em equipe)

Aplique tudo ao projeto da Etapa 3:

**Verificação:**
- [ ] Pacote de tipos criado e ligado às duas camadas
- [ ] Ao menos 3 enums de domínio compartilhados
- [ ] Ao menos 2 constantes de negócio compartilhadas
- [ ] Tipos da API gerados, não escritos
- [ ] Verificação de contrato no CI, **vista falhar** ao menos uma vez
- [ ] O `README` do projeto explica como regerar os tipos

---

## Gabarito parcial

**E15.1** — A duplicata mais comum é o teto de paginação: `@Max(100)` no DTO e um
`tamanho: 20` fixo no cliente. Quando alguém sobe o teto no backend, o frontend continua
pedindo 20 e ninguém entende por que a listagem "não melhorou".

**E15.3 (3)** — Passa. É exatamente o problema: o tipo local do frontend continua descrevendo
a API antiga, então o compilador não tem como saber que ela mudou. A geração é o que traz a
verdade do backend para dentro do sistema de tipos do frontend — sem ela, o `tsc` só verifica
o frontend consigo mesmo.

**E15.4** — A entidade importa `typeorm`, que importa drivers de banco e APIs de Node
(`fs`, `net`). O bundler ou falha, ou inclui dezenas de KB inúteis. O tipo de resposta é
apenas a **forma dos dados**; a entidade é o **modelo de domínio do servidor**, e ele não
tem por que existir no navegador.

**E15.6 (4)** — Adicionar o campo novo mantendo o antigo, migrar os consumidores, e só então
remover — o mesmo expandir/contrair do M05, agora aplicado ao contrato de API em vez do
esquema do banco.
