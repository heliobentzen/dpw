# M08 — React: fundamentos

> **CH:** 5h (2h teóricas · 3h práticas) · **Semanas 8–9** · **Pré-requisitos:** M03, M07
> **Ementa:** *Templates: Criação de interfaces com o usuário utilizando o framework
> escolhido* — aqui, componentes React no lugar de templates. Ver a
> [ressalva no plano de ensino](../../docs/plano-de-ensino.md#3-rastreabilidade-ementa--módulos).

A semana de maior mudança do curso: trocam-se a linguagem, o paradigma e a ferramenta. Três
amortecedores: o **pré-requisito de JavaScript está atendido**, a **API já existe** (M07) e
o **domínio é o mesmo** (BiblioCom).

> **O que isso significa para o ritmo.** Como a turma já programa em JavaScript, este módulo
> **não gasta tempo com sintaxe**. As 5h vão para o que é genuinamente novo e é onde os bugs
> nascem: o modelo declarativo, imutabilidade do estado, o array de dependências do
> `useEffect` e as chaves de lista. Quem precisar de uma ponte Python→JS para consulta tem
> [`../../recursos/js-para-react.md`](../../recursos/js-para-react.md).

## 🎯 Objetivos

1. Explicar o modelo declarativo: a UI como função do estado.
2. Criar componentes com props tipadas e compô-los.
3. Gerenciar estado com `useState` e efeitos com `useEffect`.
4. Renderizar listas e condicionais, tratando os quatro estados de tela.
5. Consumir a API do M07 e exibir dados reais.

---

## 📖 Teoria (2h)

### 1. Declarativo × imperativo (20 min)

**Imperativo** (o que você faria com DOM puro): você descreve os **passos**.

```js
const lista = document.querySelector("#obras");
lista.innerHTML = "";
for (const obra of obras) {
  const li = document.createElement("li");
  li.textContent = obra.titulo;
  if (obra.disponivel) li.classList.add("ok");
  lista.appendChild(li);
}
```

**Declarativo** (React): você descreve o **resultado** para um dado estado.

```tsx
<ul>
  {obras.map((obra) => (
    <li key={obra.id} className={obra.disponivel ? "ok" : ""}>
      {obra.titulo}
    </li>
  ))}
</ul>
```

A ideia central, que vale a pena memorizar:

```
UI = f(estado)
```

Você nunca manda o React "atualizar aquele `<li>`". Você muda o **estado**, e o React
calcula a diferença e atualiza o DOM. Toda a dificuldade inicial vem de tentar fazer o
primeiro estilo dentro do segundo.

💼 **No mercado:** essa distinção é a primeira pergunta de qualquer entrevista de React, e
é o que separa quem usa a biblioteca de quem luta contra ela.

### 2. Componentes e props (25 min)

Um componente é uma **função** que recebe `props` e devolve JSX.

```tsx
// src/components/ObraCard.tsx
type ObraCardProps = {
  titulo: string;
  autor: string;
  ano: number | null;
  disponiveis: number;
};

export function ObraCard({ titulo, autor, ano, disponiveis }: ObraCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">{titulo}</h3>
      <p className="text-sm text-slate-600">
        {autor}
        {ano && ` · ${ano}`}
      </p>
      <p className="mt-2 text-sm">
        {disponiveis > 0 ? `${disponiveis} disponível(is)` : "Todos emprestados"}
      </p>
    </article>
  );
}
```

```tsx
<ObraCard titulo="Dom Casmurro" autor="Machado de Assis" ano={1899} disponiveis={2} />
```

**Regras:**

- Nome sempre em `PascalCase` — é assim que o React distingue componente de tag HTML.
- Props são **somente-leitura**. Nunca faça `props.titulo = "outro"`.
- Um componente devolve **um** elemento raiz (use `<>...</>` se precisar de vários).
- Componente é função pura da entrada: mesmas props, mesmo resultado.

#### JSX: as diferenças que pegam todo mundo

| HTML | JSX | Por quê |
|---|---|---|
| `class="x"` | `className="x"` | `class` é palavra reservada em JS |
| `for="id"` | `htmlFor="id"` | idem `for` |
| `onclick="f()"` | `onClick={f}` | camelCase; passa a **função**, não a chamada |
| `<br>` | `<br />` | toda tag precisa fechar |
| `style="color: red"` | `style={{ color: "red" }}` | objeto JS |
| `<!-- comentário -->` | `{/* comentário */}` | |

`{}` insere JavaScript. `{f}` passa a função; `{f()}` passa o **resultado** de chamá-la
agora — erro comum em `onClick`.

#### Composição e `children`

```tsx
type CardProps = { titulo: string; children: React.ReactNode };

export function Card({ titulo, children }: CardProps) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-2 font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

// uso
<Card titulo="Acervo">
  <p>Conteúdo aqui.</p>
</Card>
```

### 3. Estado com `useState` (30 min)

Props vêm de fora e não mudam. **Estado** é o que o componente controla e que, ao mudar,
dispara nova renderização.

```tsx
import { useState } from "react";

export function Contador() {
  const [valor, setValor] = useState(0);
  //     ^leitura  ^escrita          ^inicial

  return (
    <button onClick={() => setValor(valor + 1)}>
      Cliquei {valor} vez(es)
    </button>
  );
}
```

**Quatro regras que evitam a maior parte dos bugs:**

1. **Nunca atribua direto.** `valor = 5` não re-renderiza; use `setValor(5)`.
2. **A atualização é assíncrona.** Depois de `setValor(1)`, `valor` ainda é o antigo
   naquela execução.
3. **Ao depender do valor anterior, use a forma de função:**
   ```tsx
   setValor((v) => v + 1);   // ✅ correto mesmo em atualizações seguidas
   setValor(valor + 1);      // ❌ perde atualizações se chamado 2× no mesmo evento
   ```
4. **Nunca mute objetos e arrays.** Crie novos:
   ```tsx
   setObras([...obras, nova]);                                   // ✅ adicionar
   setObras(obras.filter((o) => o.id !== id));                   // ✅ remover
   setObras(obras.map((o) => (o.id === id ? { ...o, lida: true } : o)));  // ✅ alterar
   setFiltro({ ...filtro, pagina: 2 });                          // ✅ objeto
   obras.push(nova); setObras(obras);                            // ❌ não re-renderiza
   ```

A regra 4 é a causa nº 1 de "mudei o estado e a tela não atualizou": o React compara
referências, e o array continua sendo o mesmo objeto.

#### Onde colocar o estado

Estado vive no **ancestral comum mais próximo** dos componentes que precisam dele. Quando
dois irmãos precisam do mesmo dado, ele **sobe** para o pai — e desce como props.

```tsx
function Acervo() {
  const [termo, setTermo] = useState("");        // pai controla

  return (
    <>
      <CampoBusca valor={termo} onChange={setTermo} />
      <ListaObras termo={termo} />
    </>
  );
}
```

> **Não duplique estado.** Se um valor pode ser **calculado** a partir de outro, calcule —
> não guarde. `const totalDisponiveis = obras.filter(o => o.disponiveis > 0).length;`
> não precisa de `useState`. Estado duplicado dessincroniza.

### 4. `useEffect` (25 min)

Efeito é o que precisa acontecer **fora** da renderização: buscar dados, assinar eventos,
mexer em `document.title`.

```tsx
import { useEffect, useState } from "react";

export function ListaObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/obras/")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((dados) => {
        if (!cancelado) setObras(dados.results);
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {                 // limpeza: roda ao desmontar ou antes do próximo efeito
      cancelado = true;
    };
  }, []);                          // [] = roda uma vez, ao montar

  if (carregando) return <p>Carregando…</p>;
  if (erro) return <p role="alert">Erro: {erro}</p>;
  if (obras.length === 0) return <p>Nenhuma obra cadastrada.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {obras.map((obra) => (
        <ObraCard key={obra.id} {...obra} />
      ))}
    </div>
  );
}
```

**O array de dependências:**

| Forma | Quando roda |
|---|---|
| `useEffect(fn)` | Depois de **toda** renderização — quase sempre um bug |
| `useEffect(fn, [])` | Uma vez, ao montar |
| `useEffect(fn, [termo])` | Ao montar e sempre que `termo` mudar |

**A função de limpeza** evita o aviso "não é possível atualizar estado em componente
desmontado" — que acontece quando o usuário sai da tela antes de a resposta chegar.

> 🔮 **Este código é didático, não é o que você usará no projeto.** Buscar dados com
> `useEffect` exige tratar manualmente: cancelamento, cache, revalidação, requisições
> concorrentes fora de ordem e estado de recarga. O M11 substitui tudo isso por **TanStack
> Query**. Você precisa escrever a versão manual **uma vez** para entender o que a
> biblioteca resolve.

### 5. Listas, chaves e condicionais (20 min)

```tsx
{obras.map((obra) => <ObraCard key={obra.id} {...obra} />)}
```

**A `key`** identifica cada item entre renderizações. Precisa ser **estável e única**.

```tsx
{obras.map((obra, i) => <ObraCard key={i} ... />)}      // ❌ índice
{obras.map((obra) => <ObraCard key={obra.id} ... />)}    // ✅ id do banco
```

Com `key={i}`, ao remover o primeiro item o React acha que os itens "mudaram de conteúdo"
em vez de "um sumiu" — e o estado interno de cada item (um campo digitado, por exemplo)
vaza para o vizinho.

**Condicionais:**

```tsx
{carregando && <Spinner />}                        {/* renderiza se verdadeiro */}
{erro ? <Erro msg={erro} /> : <Lista dados={d} />} {/* if/else */}
{obras.length === 0 && <p>Nada encontrado.</p>}

{obras.length && <Lista />}    {/* ⚠️ ARMADILHA: se for 0, renderiza "0" na tela */}
{obras.length > 0 && <Lista />} {/* ✅ compare explicitamente */}
```

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Estrutura do frontend (25 min)

```
frontend/src/
├── api/
│   ├── client.ts          fetch com base, erros e CSRF
│   └── tipos.ts           tipos do domínio (depois: schema.d.ts do M07)
├── components/
│   ├── ObraCard.tsx
│   ├── EstadoVazio.tsx
│   └── ui/                componentes base (M09)
├── pages/
│   └── AcervoPage.tsx
├── App.tsx
├── main.tsx
└── index.css
```

```ts
// src/api/client.ts
const BASE = "/api";

export class ApiError extends Error {
  constructor(public status: number, public dados: unknown) {
    super(`HTTP ${status}`);
  }
}

export async function api<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);
    throw new ApiError(resposta.status, dados);
  }
  return resposta.status === 204 ? (null as T) : resposta.json();
}
```

Um único ponto de entrada para a API centraliza: URL base, cabeçalhos, tratamento de erro
e, mais tarde, o token CSRF (M12). Sem isso, `fetch` espalhado por 20 componentes vira 20
tratamentos de erro diferentes.

```ts
// src/api/tipos.ts
export type Autor = { id: number; nome: string };

export type Obra = {
  id: number;
  titulo: string;
  subtitulo: string;
  autor: Autor;
  ano_publicacao: number | null;
  isbn: string;
  exemplares_total: number;
  exemplares_disponiveis: number;
};

export type Paginado<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

> Note que `Paginado<T>` espelha exatamente o formato do DRF definido no contrato (M02).
> No M11 estes tipos serão **gerados** do `schema.yml`, e escrevê-los à mão agora torna
> visível o que a geração automatiza.

### Passo 2 — Primeiro componente (30 min)

Implemente `ObraCard` conforme a teoria, com props tipadas. Renderize três cards com
dados fixos em `App.tsx`. Verifique no navegador.

Depois, quebre de propósito: passe `ano` como string. O que o TypeScript diz? Onde — no
editor, no terminal, no navegador?

### Passo 3 — Estado e interação (40 min)

```tsx
// src/pages/AcervoPage.tsx
import { useState } from "react";

import { ObraCard } from "../components/ObraCard";
import type { Obra } from "../api/tipos";

const OBRAS_EXEMPLO: Obra[] = [ /* 5 obras fixas */ ];

export function AcervoPage() {
  const [termo, setTermo] = useState("");
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(false);

  // derivado do estado — NÃO é um useState
  const obrasFiltradas = OBRAS_EXEMPLO.filter((obra) => {
    const casaTermo =
      obra.titulo.toLowerCase().includes(termo.toLowerCase()) ||
      obra.autor.nome.toLowerCase().includes(termo.toLowerCase());
    const casaDisponibilidade = !somenteDisponiveis || obra.exemplares_disponiveis > 0;
    return casaTermo && casaDisponibilidade;
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Acervo</h1>

      <div className="my-4 flex flex-wrap items-center gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Buscar</span>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="título ou autor"
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={somenteDisponiveis}
            onChange={(e) => setSomenteDisponiveis(e.target.checked)}
          />
          <span className="text-sm">Só disponíveis</span>
        </label>
      </div>

      <p className="mb-4 text-sm text-slate-600">
        {obrasFiltradas.length} de {OBRAS_EXEMPLO.length} obra(s)
      </p>

      {obrasFiltradas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <ObraCard key={obra.id} {...obra} />
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed p-8 text-center text-slate-500">
          Nenhuma obra encontrada para "{termo}".
        </p>
      )}
    </main>
  );
}
```

**Repare no que *não* tem aqui:** nenhum `useState` para `obrasFiltradas`. Ele é
**derivado** — recalculado a cada renderização. Guardá-lo em estado criaria a possibilidade
de ficar dessincronizado do filtro.

### Passo 4 — Consumir a API de verdade (50 min) ⭐

Substitua `OBRAS_EXEMPLO` pela API do M07:

```tsx
const [obras, setObras] = useState<Obra[]>([]);
const [carregando, setCarregando] = useState(true);
const [erro, setErro] = useState<string | null>(null);

useEffect(() => {
  let cancelado = false;
  setCarregando(true);

  api<Paginado<Obra>>("/obras/")
    .then((dados) => !cancelado && setObras(dados.results))
    .catch((e: Error) => !cancelado && setErro(e.message))
    .finally(() => !cancelado && setCarregando(false));

  return () => { cancelado = true; };
}, []);
```

Trate os **quatro estados** com componentes próprios. Depois, force cada um:

| Estado | Como forçar |
|---|---|
| Carregando | DevTools → Network → *Slow 3G* |
| Vazio | `python manage.py shell` → `Obra.objects.all().delete()` |
| Erro de rede | Pare o `runserver` |
| Erro 401 | Remova `AllowAny` do ViewSet |
| Erro 500 | Provoque uma exceção na view |

**Cada um precisa mostrar mensagem diferente e ação diferente ao usuário.** Este é o
requisito da rubrica da Etapa 3.

### Passo 5 — Busca no servidor (35 min)

Mova o filtro para a API, aproveitando o `search_fields` do M07:

```tsx
useEffect(() => {
  let cancelado = false;
  const controlador = new AbortController();

  const timer = setTimeout(() => {          // debounce: espera parar de digitar
    setCarregando(true);
    api<Paginado<Obra>>(`/obras/?search=${encodeURIComponent(termo)}`, {
      signal: controlador.signal,
    })
      .then((d) => !cancelado && setObras(d.results))
      .catch((e: Error) => e.name !== "AbortError" && !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));
  }, 400);

  return () => {
    cancelado = true;
    controlador.abort();
    clearTimeout(timer);
  };
}, [termo]);
```

Observe na aba Network: **uma** requisição por pausa na digitação, não uma por tecla.

Responda: por que precisamos de `debounce`, `AbortController` **e** a flag `cancelado`? O
que cada um resolve? (Esta pergunta prepara o M11: o TanStack Query resolve os três.)

---

## ⚠️ Erros comuns

| Erro | Sintoma | Correção |
|---|---|---|
| Mutar estado (`push`, `obj.x = 1`) | Tela não atualiza | Crie novo array/objeto |
| `setX(x + 1)` em sequência | Perde incrementos | `setX(v => v + 1)` |
| `useEffect` sem dependências | Laço infinito de requisições | Declare `[]` ou `[dep]` |
| `key={index}` | Estado vaza entre itens | `key={item.id}` |
| `onClick={f()}` | Executa na renderização | `onClick={f}` ou `onClick={() => f(x)}` |
| `{lista.length && <X/>}` | Aparece "0" na tela | `{lista.length > 0 && <X/>}` |
| `class=` no JSX | Atributo ignorado | `className=` |
| Estado derivado em `useState` | Dessincroniza | Calcule na renderização |
| Sem função de limpeza | Aviso de atualização após desmontar | `return () => {...}` |
| `fetch` direto em cada componente | Erros tratados de 10 jeitos | Centralize em `api/client.ts` |

## ✅ Checklist de saída

- [ ] Sei explicar `UI = f(estado)` e o que é declarativo
- [ ] Componentes com props tipadas, compostos entre si
- [ ] `useState` usado corretamente (imutabilidade, forma de função)
- [ ] Nenhum estado derivado guardado em `useState`
- [ ] `useEffect` com dependências corretas e função de limpeza
- [ ] Listas com `key` estável
- [ ] Os quatro estados de tela tratados e **testados** um a um
- [ ] `api/client.ts` centralizando as chamadas
- [ ] Busca no servidor com *debounce* e cancelamento
- [ ] Sei explicar o que o `useEffect` manual **não** resolve (preparação para o M11)

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [React — Aprenda React (documentação oficial, excelente)](https://react.dev/learn)
- [React — Pensando em React](https://react.dev/learn/thinking-in-react)
- [React — Você talvez não precise de um efeito](https://react.dev/learn/you-might-not-need-an-effect) ⭐
- [TypeScript com React](https://react.dev/learn/typescript)
- [MDN — JavaScript moderno](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
