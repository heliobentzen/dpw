# M08 — Cheatsheet: React + TypeScript

## Componente

```tsx
type Props = {
  titulo: string;
  ano?: number;                       // opcional
  itens: string[];
  aoClicar: (id: number) => void;     // função como prop
  children?: React.ReactNode;
};

export function MeuComponente({ titulo, ano = 2026, itens, aoClicar }: Props) {
  return <h1>{titulo}</h1>;
}
```

## JSX

```tsx
{variavel}                          {/* interpolação */}
{a + b}                             {/* expressão */}
{condicao && <X />}                 {/* renderiza se verdadeiro */}
{condicao ? <A /> : <B />}          {/* if/else */}
{lista.map((i) => <X key={i.id} />)}
<>...</>                            {/* fragmento */}
{/* comentário */}

className="x"          // não class
htmlFor="id"           // não for
onClick={f}            // não onclick, e sem ()
style={{ color: "red" }}
<input value={v} onChange={(e) => setV(e.target.value)} />
<img src={url} alt="descrição" />
<Componente {...props} />           {/* spread de props */}
```

### Eventos

```tsx
onClick onDoubleClick onMouseEnter onMouseLeave
onChange onInput onSubmit onFocus onBlur
onKeyDown onKeyUp
onSubmit={(e) => { e.preventDefault(); ... }}
```

## Hooks

### `useState`

```tsx
const [valor, setValor] = useState(0);
const [obras, setObras] = useState<Obra[]>([]);
const [obra, setObra] = useState<Obra | null>(null);

setValor(5);
setValor((v) => v + 1);                                   // depende do anterior

setObras([...obras, nova]);                               // adicionar
setObras(obras.filter((o) => o.id !== id));               // remover
setObras(obras.map((o) => o.id === id ? { ...o, x: 1 } : o));  // alterar
setFiltro({ ...filtro, pagina: 1 });                      // objeto
```

### `useEffect`

```tsx
useEffect(() => { ... });              // toda renderização (quase sempre bug)
useEffect(() => { ... }, []);          // uma vez, ao montar
useEffect(() => { ... }, [dep]);       // quando dep mudar

useEffect(() => {
  const t = setInterval(tick, 1000);
  return () => clearInterval(t);       // limpeza
}, []);
```

### Outros

```tsx
const ref = useRef<HTMLInputElement>(null);       // acesso ao DOM
ref.current?.focus();

const caro = useMemo(() => calcular(a, b), [a, b]);   // memoiza valor
const cb = useCallback(() => f(id), [id]);            // memoiza função

const { usuario } = useContext(AuthContext);          // contexto
```

> `useMemo`/`useCallback` são otimização. Não use por padrão — meça antes.

## Hook customizado

```tsx
// src/hooks/useDebounce.ts
import { useEffect, useState } from "react";

export function useDebounce<T>(valor: T, ms = 400): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}
```

Regras: nome começa com `use`; só chame hooks no topo do componente (nunca dentro de
`if`, laço ou função aninhada).

## Formulário controlado

```tsx
const [form, setForm] = useState({ titulo: "", ano: "" });

function alterar(e: React.ChangeEvent<HTMLInputElement>) {
  const { name, value } = e.target;
  setForm((f) => ({ ...f, [name]: value }));
}

<form onSubmit={(e) => { e.preventDefault(); enviar(form); }}>
  <input name="titulo" value={form.titulo} onChange={alterar} />
  <button type="submit">Salvar</button>
</form>
```

## Tipos úteis

```tsx
React.ReactNode                                  // qualquer coisa renderizável
React.ChangeEvent<HTMLInputElement>
React.FormEvent<HTMLFormElement>
React.MouseEvent<HTMLButtonElement>
React.ComponentProps<"button">                   // props nativas de <button>

type Props = React.ComponentProps<"button"> & { variante: "primario" | "secundario" };
```

## Consumo de API

```ts
// src/api/client.ts
export class ApiError extends Error {
  constructor(public status: number, public dados: unknown) { super(`HTTP ${status}`); }
}

export async function api<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${caminho}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!r.ok) throw new ApiError(r.status, await r.json().catch(() => null));
  return r.status === 204 ? (null as T) : r.json();
}
```

```tsx
useEffect(() => {
  let cancelado = false;
  const ctrl = new AbortController();

  api<Paginado<Obra>>("/obras/", { signal: ctrl.signal })
    .then((d) => !cancelado && setObras(d.results))
    .catch((e) => e.name !== "AbortError" && !cancelado && setErro(e.message))
    .finally(() => !cancelado && setCarregando(false));

  return () => { cancelado = true; ctrl.abort(); };
}, []);
```

## Os quatro estados

```tsx
if (carregando) return <Carregando />;
if (erro) return <Erro mensagem={erro} aoTentarNovamente={recarregar} />;
if (dados.length === 0) return <EstadoVazio acao={<Link to="/novo">Cadastrar</Link>} />;
return <Lista dados={dados} />;
```

## Anti-padrões

| ❌ | ✅ |
|---|---|
| `lista.push(x); setLista(lista)` | `setLista([...lista, x])` |
| `setN(n + 1)` duas vezes seguidas | `setN(v => v + 1)` |
| `key={index}` | `key={item.id}` |
| `onClick={f()}` | `onClick={f}` |
| `{lista.length && <X/>}` | `{lista.length > 0 && <X/>}` |
| `useState` para valor derivado | calcule na renderização |
| `useEffect` sem array de dependências | declare as dependências |
| `fetch` espalhado nos componentes | `api/client.ts` |
| `any` no TypeScript | tipe, ou use `unknown` |
| Componente de 300 linhas | extraia componentes |

## Estrutura de pastas

```
src/
├── api/           client.ts, tipos.ts, schema.d.ts
├── components/    componentes reutilizáveis
│   └── ui/        botão, campo, badge (M09)
├── pages/         uma por rota (M10)
├── hooks/         hooks customizados
├── lib/           utilitários (formatação, datas)
├── App.tsx
├── main.tsx
└── index.css
```
