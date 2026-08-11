# JavaScript moderno para React — nivelamento (4h)

> Material de nivelamento para turmas sem base de JavaScript. Aplicar **antes da semana 8**,
> compensando a carga com 2h de M06 e 2h de M15 (ver
> [`../docs/cronograma.md`](../docs/cronograma.md#6-variações-de-calendário)).
>
> Escopo deliberadamente estreito: **só o JavaScript que os módulos M08–M11 usam.** Não é
> um curso de JS — é uma ponte. Cada seção mostra o equivalente em Python, porque a turma
> já sabe Python.

## Diagnóstico (20 min, semana 1)

Aplique antes de decidir se o nivelamento é necessário. Sem consulta, 20 minutos.

```js
// 1. O que imprime?
const nums = [1, 2, 3, 4, 5];
console.log(nums.filter(n => n % 2 === 0).map(n => n * 10));

// 2. Reescreva com destructuring
const obra = { titulo: "Dom Casmurro", autor: { nome: "Machado" }, ano: 1899 };
const titulo = obra.titulo;
const nomeAutor = obra.autor.nome;

// 3. O que há de errado?
const lista = [1, 2, 3];
lista.push(4);
const nova = lista;

// 4. Complete
async function buscar() {
  const r = await fetch("/api/obras/");
  // devolva o JSON, tratando o caso de resposta com erro
}

// 5. O que imprime, e por quê?
console.log([1, 2, 3].length && "tem itens");
console.log([].length && "tem itens");
```

**Correção:** 4–5 acertos → cronograma padrão. 2–3 → nivelamento de 4h. 0–1 na turma toda →
modo híbrido ([ADR-04](../docs/decisoes-tecnicas.md#adr-04--modo-híbrido-como-alternativa-documentada)).

---

## 1. Variáveis e tipos (30 min)

```js
const x = 10;        // não pode ser reatribuída (use por padrão)
let y = 20;          // pode ser reatribuída
var z = 30;          // ❌ legado; nunca use
```

> `const` num objeto ou array impede **reatribuir a variável**, não modificar o conteúdo.
> `const a = [1]; a.push(2)` funciona — e é exatamente o que o React **não** quer (seção 5).

```js
// tipos
"texto"  'texto'  `template ${variavel}`
42  3.14  true  false
null          // ausência intencional de valor
undefined     // não foi definido
[1, 2, 3]     // array  (≈ list do Python)
{ a: 1 }      // objeto (≈ dict do Python)
```

**Comparação — a pegadinha mais famosa:**

```js
"5" == 5     // true   ❌ converte tipos
"5" === 5    // false  ✅ compara tipo e valor — use SEMPRE
```

**Valores falsos** (*falsy*): `false`, `0`, `""`, `null`, `undefined`, `NaN`. Todo o resto
é verdadeiro — inclusive `[]` e `{}`, que em Python seriam falsos.

```python
# Python
if []: print("nunca entra")
```
```js
// JavaScript
if ([]) console.log("SEMPRE entra");     // ⚠️
if ([].length > 0) console.log("correto");
```

Isso explica a armadilha `{lista.length && <X/>}` do M08: com `0`, o React renderiza o
próprio `0` na tela.

## 2. Funções (30 min)

```js
function soma(a, b) { return a + b; }          // declaração
const soma = (a, b) => a + b;                   // arrow, retorno implícito
const dobro = n => n * 2;                       // um parâmetro: parênteses opcionais
const nada = () => { console.log("oi"); };      // corpo com chaves: precisa de return

const criarObra = (titulo, ano = 2026) => ({ titulo, ano });   // ⚠️ objeto entre parênteses
```

| Python | JavaScript |
|---|---|
| `def f(a, b): return a + b` | `const f = (a, b) => a + b` |
| `lambda x: x * 2` | `x => x * 2` |
| `def f(a, b=10)` | `const f = (a, b = 10) =>` |
| `def f(*args)` | `const f = (...args) =>` |

## 3. Arrays: os três métodos que importam (45 min) ⭐

São a base de **toda** renderização de lista em React.

```js
const obras = [
  { id: 1, titulo: "Dom Casmurro", ano: 1899, disponiveis: 2 },
  { id: 2, titulo: "O Cortiço",    ano: 1890, disponiveis: 0 },
  { id: 3, titulo: "Sertão",       ano: 1956, disponiveis: 1 },
];

// map — transforma cada item (≈ list comprehension)
obras.map(o => o.titulo);                    // ["Dom Casmurro", "O Cortiço", "Sertão"]

// filter — seleciona itens
obras.filter(o => o.disponiveis > 0);        // dois objetos

// find — o primeiro que casa, ou undefined
obras.find(o => o.id === 2);

// encadeamento — o padrão mais comum em React
obras.filter(o => o.ano > 1895).map(o => o.titulo);
```

| Python | JavaScript |
|---|---|
| `[o.titulo for o in obras]` | `obras.map(o => o.titulo)` |
| `[o for o in obras if o.ano > 1895]` | `obras.filter(o => o.ano > 1895)` |
| `next((o for o in obras if o.id == 2), None)` | `obras.find(o => o.id === 2)` |
| `len(obras)` | `obras.length` |
| `sum(o.ano for o in obras)` | `obras.reduce((s, o) => s + o.ano, 0)` |
| `sorted(obras, key=...)` | `[...obras].sort((a, b) => ...)` |
| `any(...)` / `all(...)` | `obras.some(...)` / `obras.every(...)` |

> `sort()` ordena **no lugar** e devolve o mesmo array. Em React, sempre
> `[...obras].sort(...)` — copie antes (seção 5).

## 4. Destructuring e spread (45 min) ⭐

```js
// objeto
const obra = { id: 1, titulo: "Dom Casmurro", autor: { nome: "Machado" } };

const { titulo, ano } = obra;                       // ano é undefined
const { titulo: t, ano = 1900 } = obra;             // renomeia e dá padrão
const { autor: { nome } } = obra;                   // aninhado

// array
const [primeiro, segundo] = [10, 20];
const [, terceiro] = [1, 2, 3];                     // pula posições

// em parâmetros — é como as props do React chegam
function ObraCard({ titulo, autor, ano }) { ... }
```

```js
// spread — copiar e combinar
const copia = { ...obra };
const alterada = { ...obra, ano: 1900 };            // copia e sobrescreve
const juntos = [...listaA, ...listaB];
const comNovo = [...obras, novaObra];

// rest — o que sobrou
const { id, ...semId } = obra;
const [primeiro, ...resto] = [1, 2, 3, 4];
```

| Python | JavaScript |
|---|---|
| `a, b = tupla` | `const [a, b] = arr` |
| `{**d, "x": 1}` | `{ ...d, x: 1 }` |
| `[*a, *b]` | `[...a, ...b]` |
| `d.get("x", padrao)` | `d.x ?? padrao` |

## 5. Imutabilidade (30 min) ⭐

O conceito que mais causa bug em React iniciante. O React compara **referências**: se o
array é o mesmo objeto, ele não re-renderiza.

```js
const obras = [{ id: 1, lida: false }];

// ❌ MUTA — o React não percebe
obras.push(nova);
obras[0].lida = true;
obras.splice(0, 1);
obras.sort();

// ✅ CRIA NOVO
const comNova   = [...obras, nova];
const marcada   = obras.map(o => o.id === 1 ? { ...o, lida: true } : o);
const semItem   = obras.filter(o => o.id !== 1);
const ordenada  = [...obras].sort((a, b) => a.ano - b.ano);
const atualizada = { ...filtro, pagina: 2 };
```

Cole esta tabela na parede. Ela resolve sozinha metade dos "mudei o estado e a tela não
atualizou".

## 6. Assincronia (45 min)

```js
// Promise com then
fetch("/api/obras/")
  .then(r => r.json())
  .then(dados => console.log(dados))
  .catch(erro => console.error(erro));

// async/await — mais legível, preferível
async function buscarObras() {
  try {
    const resposta = await fetch("/api/obras/");
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const dados = await resposta.json();
    return dados.results;
  } catch (erro) {
    console.error("Falhou:", erro);
    return [];
  }
}
```

⚠️ **`fetch` não lança erro em 404 ou 500.** Ele só rejeita se a rede falhar. Verificar
`resposta.ok` é obrigatório — é o erro nº 1 de quem vem de `requests` do Python.

```python
# Python
r = requests.get(url)
r.raise_for_status()      # lança em 4xx/5xx
```
```js
// JavaScript
const r = await fetch(url);
if (!r.ok) throw new Error(`HTTP ${r.status}`);    // você precisa fazer isso
```

## 7. Módulos ES (20 min)

```js
// exportação nomeada (preferida)
export function ObraCard() {}
export const CORES = {};

// importação
import { ObraCard, CORES } from "./ObraCard";
import { ObraCard as Card } from "./ObraCard";

// exportação padrão (uma por arquivo)
export default function App() {}
import App from "./App";

// tipos (TypeScript)
import type { Obra } from "./tipos";
```

## 8. Encadeamento opcional e coalescência (20 min)

```js
obra?.autor?.nome                 // undefined se algo no caminho for null/undefined
obras?.[0]?.titulo
callback?.()

const nome = obra.autor?.nome ?? "Autor desconhecido";   // ?? só cai em null/undefined
const n = valor || 10;      // ⚠️ cai também em 0 e ""
const m = valor ?? 10;      // ✅ só em null/undefined
```

A diferença entre `||` e `??` importa: `paginas || 10` transforma `0` em `10`;
`paginas ?? 10` não.

## 9. TypeScript de superfície (25 min)

Só o necessário para os módulos:

```ts
let nome: string;
let idade: number;
let ativo: boolean;
let lista: string[];
let obra: Obra | null;
let opcional?: string;

type Obra = {
  id: number;
  titulo: string;
  ano: number | null;
  autor: { id: number; nome: string };
};

type Props = { titulo: string; ano?: number; aoClicar: (id: number) => void };

function f(a: string, b = 0): boolean { return true; }

type Paginado<T> = { count: number; results: T[] };    // genérico
```

Regra prática: tipe **props**, **retorno de API** e **estado**. Deixe o resto ser inferido.
E evite `any` — se não souber o tipo, use `unknown` e estreite depois.

---

## Exercícios do nivelamento

### N1 — Traduzir de Python (individual)

```python
obras = [{"titulo": "A", "ano": 1899, "disp": 2}, {"titulo": "B", "ano": 1890, "disp": 0}]

titulos = [o["titulo"] for o in obras]
disponiveis = [o for o in obras if o["disp"] > 0]
total = sum(o["disp"] for o in obras)
mais_antiga = min(obras, key=lambda o: o["ano"])
por_ano = sorted(obras, key=lambda o: o["ano"], reverse=True)
tem_disponivel = any(o["disp"] > 0 for o in obras)
```

### N2 — Imutabilidade (individual)

Para cada operação, escreva a versão que **não** muta:

1. Adicionar um item ao fim
2. Remover o item de `id === 3`
3. Marcar o item de `id === 2` como lido
4. Ordenar por ano
5. Adicionar `pagina: 2` a um objeto de filtros
6. Remover a chave `senha` de um objeto

### N3 — Buscar dados (individual)

Escreva `buscarObra(id)` que: chama `/api/obras/{id}/`, lança erro com o status se não for
`ok`, devolve o JSON, e trata separadamente o 404 (devolvendo `null`) e os demais erros
(propagando).

### N4 — Encontre os 6 erros

```js
var obras = [];
async function carregar() {
  const r = fetch("/api/obras/");
  const dados = r.json();
  obras.push(...dados.results);
  if (obras.length) console.log("carregou " + obras.length);
  const titulos = obras.map(o => { o.titulo });
  return titulos;
}
```

<details>
<summary>Gabarito do N4</summary>

1. `var` → use `const`/`let`
2. Falta `await` no `fetch`
3. Falta `await` no `r.json()`
4. Falta verificar `r.ok`
5. `obras.push(...)` muta (e `obras` deveria ser devolvido, não mutado)
6. `o => { o.titulo }` tem corpo com chaves sem `return` → devolve `undefined`.
   Correto: `o => o.titulo`

</details>

---

## Referências

- [MDN — Guia de JavaScript (pt-BR)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide)
- [javascript.info (em português)](https://javascript.info/) — o melhor tutorial gratuito
- [React — JavaScript que você precisa saber](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
- [TypeScript em 5 minutos](https://www.typescriptlang.org/pt/docs/handbook/typescript-in-5-minutes.html)
