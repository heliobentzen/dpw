# M11 — Exercícios

## E11.1 — Responder ao E08.6 (individual) ⭐

Retome as cinco perguntas que ficaram em aberto no M08 e responda agora, **demonstrando** no
seu projeto:

| # | Pergunta | Com `useEffect` | Com TanStack Query | Evidência |
|---|---|---|---|---|
| 1 | Voltar para uma tela já visitada | | | |
| 2 | Duas telas com a mesma lista | | | |
| 3 | Criar uma obra e ver a lista atualizar | | | |
| 4 | Aba em segundo plano por 10 min | | | |
| 5 | Respostas chegando fora de ordem | | | |

Evidência = print da aba Network ou do React Query Devtools mostrando o número de
requisições.

---

## E11.2 — `queryKey` errada (individual)

1. Implemente `useObras` com `queryKey: ["obras"]` (sem os filtros).
2. Busque por "casmurro", depois por "sertão", depois volte para "casmurro".
3. O que aparece na tela? Quantas requisições saíram?
4. Corrija incluindo os filtros na chave e repita.

**Entrega:** as duas gravações + explicação em 5 linhas de qual é o papel da `queryKey`.

Quase todo mundo tropeça nisso ao começar com Query, e o sintoma (dados de outra busca aparecendo)
é difícil de diagnosticar sem entender o cache.

---

## E11.3 — CRUD completo com mutações (individual)

Implemente, para Obra:

| Hook | Método | Após sucesso |
|---|---|---|
| `useCriarObra` | POST | invalida `["obras"]`, popula `["obra", id]`, navega ao detalhe |
| `useAtualizarObra` | PATCH | invalida `["obras"]` e `["obra", id]` |
| `useExcluirObra` | DELETE | invalida `["obras"]`, remove `["obra", id]`, navega à lista |

Requisitos: botão desabilitado durante `isPending`; erro exibido sem perder os dados
digitados; exclusão com modal de confirmação.

---

## E11.4 — Validação nas duas camadas (individual) ⭐

Para cada regra, implemente no Zod **e** no DTO de saída, e demonstre os dois caminhos:

| # | Regra | Zod pega? | DTO pega? | Como testar o servidor |
|---|---|---|---|---|
| 1 | Título obrigatório | ✅ | ✅ | `curl` sem título |
| 2 | ISBN com 10 ou 13 dígitos | ✅ | ✅ | `curl` com `isbn=abc` |
| 3 | Ano não futuro | ✅ | ✅ | `curl` com ano 2999 |
| 4 | **ISBN não duplicado** | ❌ | ✅ | cadastrar dois iguais |
| 5 | **Autor precisa existir** | ❌ | ✅ | `curl` com `autor=99999` |
| 6 | **Exemplar precisa estar disponível** | ❌ | ✅ | emprestar duas vezes |

Responda: **por que as regras 4, 5 e 6 são impossíveis de validar só no cliente?** O que
elas têm em comum?

---

## E11.5 — Erros do servidor no formulário (individual)

Implemente o mapeamento completo dos erros do DRF e teste:

| Resposta do servidor | Onde o erro aparece |
|---|---|
| `{"titulo": ["Obrigatório."]}` | no campo título |
| `{"isbn": ["Já existe."], "ano_publicacao": ["Inválido."]}` | nos dois campos |
| `{"non_field_errors": ["..."]}` | no topo do formulário |
| `{"detail": "Não autorizado"}` (401) | redireciona para o login |
| `{"detail": "..."}` (403) | mensagem "sem permissão" |
| 500 | mensagem genérica, dados preservados |
| Rede fora | mensagem "sem conexão", com botão de tentar de novo |

**Entrega:** 7 prints + o código do tratamento.

---

## E11.6 — Tipos gerados protegem (individual) ⭐

1. Troque os tipos manuais por `schema.d.ts` gerado.
2. No backend, renomeie `titulo` para `nome` no `ObraResposta`.
3. Regenere o schema e os tipos.
4. Rode `pnpm build`. Copie a mensagem de erro.
5. Agora repita **sem** regenerar os tipos. O build passa? O que o usuário vê em produção?
6. Reverta.

Responda: por que o passo 5 é o cenário perigoso, e o que no processo de CI (M14) impede
que ele chegue a produção?

---

## E11.7 — Busca completa (individual)

Junte tudo do bloco de frontend numa tela só:

- termo, categoria, faixa de anos, disponibilidade, ordenação e página **na URL** (M10)
- *debounce* de 400ms no termo
- `keepPreviousData` na paginação
- indicador discreto de revalidação (`isFetching`), sem tirar o conteúdo da tela
- os quatro estados
- botão "limpar filtros" que remove os parâmetros da URL
- acessível por teclado, com o foco preservado ao paginar

**Entrega:** vídeo de 60s percorrendo todos os comportamentos.

---

## E11.8 — Desafio: atualização otimista

Implemente "devolver empréstimo" com atualização otimista:

1. Ao clicar, a linha muda para "Devolvido" **imediatamente**.
2. Se a API confirmar, nada mais acontece.
3. Se a API falhar, a linha volta ao estado anterior e aparece um alerta.
4. O botão não pode ser clicado duas vezes.

Depois responda: **quando a atualização otimista vale a pena e quando é perigosa?** Dê um
exemplo do BiblioCom em que ela seria uma má ideia.

---

## Gabarito parcial

**E11.2** — Sem os filtros na chave, todas as buscas compartilham o mesmo cache: a busca por
"sertão" sobrescreve a de "casmurro", e voltar para "casmurro" mostra o resultado de
"sertão" até a revalidação chegar. A `queryKey` **é** a identidade do dado; tudo que muda o
resultado precisa estar nela.

**E11.4** — As regras 4, 5 e 6 dependem do **estado do banco**, que o cliente não conhece e
que pode mudar entre a validação e o envio. Mesmo que o cliente consultasse a API para
verificar, haveria uma janela de corrida — e é por isso que a garantia final está nas
`constraints` do banco (M04) e no DTO de saída (M07).

**E11.8** — Vale a pena em ações de alta probabilidade de sucesso e baixo custo de erro
(marcar como lido, curtir, devolver). É perigosa quando o erro é provável ou o custo é
alto: registrar um empréstimo pode falhar por corrida (outro balcão emprestou o mesmo
exemplar), e mostrar "emprestado" para depois voltar atrás confunde o usuário na frente do
associado.
