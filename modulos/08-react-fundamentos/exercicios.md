# M08 — Exercícios

## E08.1 — Traduzir imperativo para declarativo (individual)

Reescreva em React. Não traduza linha a linha: pergunte-se **qual é o estado**.

```js
// (a)
const btn = document.querySelector("#alternar");
const painel = document.querySelector("#painel");
btn.addEventListener("click", () => {
  painel.style.display = painel.style.display === "none" ? "block" : "none";
  btn.textContent = painel.style.display === "none" ? "Mostrar" : "Ocultar";
});

// (b)
let itens = [];
function adicionar(texto) {
  itens.push(texto);
  const ul = document.querySelector("#lista");
  ul.innerHTML = itens.map((i) => `<li>${i}</li>`).join("");
  document.querySelector("#total").textContent = `${itens.length} item(ns)`;
}

// (c)
document.querySelector("#busca").addEventListener("input", (e) => {
  const termo = e.target.value.toLowerCase();
  document.querySelectorAll(".card").forEach((card) => {
    const casa = card.dataset.titulo.toLowerCase().includes(termo);
    card.style.display = casa ? "block" : "none";
  });
});
```

Para cada um, responda: **quantas variáveis de estado** você precisou? Em (b), `total` é
estado ou derivado?

---

## E08.2 — Componentizar (individual)

Este componente tem 90 linhas e faz cinco coisas. Quebre em componentes menores, com props
tipadas:

```tsx
export function Pagina() {
  // cabeçalho com logo e navegação
  // campo de busca
  // filtros por categoria
  // grade de cards de obra
  // rodapé
}
```

Requisitos: nenhum componente com mais de 40 linhas; cada um com um nome que diz o que ele
é; props tipadas; nenhum componente sabendo de mais contexto do que precisa.

**Entrega:** antes e depois + a árvore de componentes desenhada.

---

## E08.3 — Estado no lugar certo (individual) ⭐

Para cada caso, diga **onde** o estado deve morar e por quê:

| # | Situação | Onde mora o estado |
|---|---|---|
| 1 | Um acordeão que abre e fecha, isolado | |
| 2 | Campo de busca que filtra uma lista irmã | |
| 3 | Usuário logado, usado no cabeçalho e em 5 telas | |
| 4 | Total de itens filtrados, exibido no topo | |
| 5 | Tema claro/escuro | |
| 6 | Página atual da paginação, refletida na URL | |
| 7 | Se o formulário foi enviado com sucesso | |

Cuidado com 4: é pegadinha. E 6 aponta para o M10.

---

## E08.4 — Provar a imutabilidade (individual)

Implemente uma lista de tarefas com quatro botões e, para **cada** operação, escreva a
versão errada (mutando) e a certa (imutável). Demonstre no navegador que a errada não
re-renderiza:

| Operação | Errada | Certa |
|---|---|---|
| Adicionar | `itens.push(x)` | |
| Remover | `itens.splice(i, 1)` | |
| Marcar como feita | `itens[i].feita = true` | |
| Ordenar | `itens.sort()` | |

O último é o mais sutil: `sort()` ordena **no lugar** e devolve o mesmo array.

---

## E08.5 — Os quatro estados, forçados (individual) ⭐

Implemente `AcervoPage` consumindo `/api/obras/` e **force cada estado**, capturando a
tela:

| Estado | Como forçar | Print |
|---|---|---|
| Carregando | Network → Slow 3G | |
| Vazio | Apagar as obras no shell | |
| Com conteúdo | Popular com `npx ts-node src/semear.ts` | |
| Erro de rede | Parar o `runserver` | |
| Erro 401 | Remover `AllowAny` | |
| Erro 500 | `raise Exception()` na view | |

Cada um precisa exibir **mensagem diferente** e oferecer **ação diferente** ao usuário
(tentar de novo? fazer login? cadastrar o primeiro?). Uma tela que mostra "Erro" para os
seis casos não passa.

---

## E08.6 — O que o `useEffect` manual não resolve (individual, discursivo)

Sua busca do Passo 5 usa `debounce`, `AbortController` e uma flag `cancelado`. Responda:

1. O que cada um dos três resolve? Dê o cenário concreto em que falta cada um.
2. O usuário navega para o detalhe e volta. O que acontece com os dados? Por quê isso é
   ruim?
3. Duas telas diferentes precisam da mesma lista de obras. Quantas requisições acontecem?
4. O usuário cadastra uma obra. Como a listagem fica sabendo?
5. A aba fica 10 minutos em segundo plano. Os dados na tela ainda são verdadeiros?

Guarde suas respostas. No M11 você vai comparar com o que o TanStack Query faz — e a
comparação só tem valor se você tiver tentado antes.

---

## E08.7 — Hook customizado (individual)

Extraia dois hooks reutilizáveis:

```tsx
// 1. debounce de um valor
const termoAtrasado = useDebounce(termo, 400);

// 2. busca de dados com os quatro estados
const { dados, carregando, erro, recarregar } = useApi<Paginado<Obra>>("/obras/");
```

Use os dois em `AcervoPage` e meça: quantas linhas o componente perdeu?

Responda: **quais das cinco perguntas do E08.6 o seu `useApi` resolve?** E quais continuam
em aberto?

---

## E08.8 — Desafio: lista com seleção múltipla

Implemente uma lista de exemplares com:

- caixa de seleção por item;
- "selecionar todos" (com estado indeterminado quando a seleção é parcial);
- contador de selecionados;
- ação em massa ("marcar como desgastados") que chama a API;
- desfazer a última ação em massa.

Requisitos: nenhum estado duplicado; a seleção sobrevive à filtragem da lista; acessível
por teclado.

---

## Gabarito parcial

**E08.1 (b)** — Uma variável de estado: `itens`. O total é **derivado**
(`itens.length`) e não deve ir para `useState` — guardá-lo cria a possibilidade de a lista
ter 3 itens e o contador dizer 2.

**E08.3 (4)** — Não é estado. É `obrasFiltradas.length`, calculado na renderização.

**E08.3 (6)** — Nem no componente nem em contexto: na **URL** (`?page=3`), o que torna o
link compartilhável e o botão "voltar" funcional. É o M10, e é a aplicação direta do
princípio de GET do M01.

**E08.6 (2)** — Ao voltar, o `useEffect` roda de novo e a tela mostra "Carregando…"
para dados que o usuário acabou de ver. Sem cache, toda navegação é um recarregamento
completo — e é exatamente isso que o TanStack Query elimina (M11).
