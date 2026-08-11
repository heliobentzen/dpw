# M09 — Cheatsheet: Tailwind CSS

## Instalação (Vite)

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-marca-500: oklch(0.62 0.16 250);
  --font-display: "Inter", system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

## Escalas

```
Espaço:  0  px  0.5  1  1.5  2  2.5  3  4  5  6  8  10  12  16  20  24
         0  1px 2px  4px 6px 8px 10px 12px 16px 20px 24px 32px 40px 48px 64px

Texto:   text-xs text-sm text-base text-lg text-xl text-2xl text-3xl ... text-6xl
Peso:    font-thin font-light font-normal font-medium font-semibold font-bold
Raio:    rounded-none rounded-sm rounded rounded-md rounded-lg rounded-xl rounded-full
Sombra:  shadow-sm shadow shadow-md shadow-lg shadow-xl
Cor:     bg-slate-100 text-slate-900 border-slate-300   (50…950)
```

## Layout

```html
<!-- flex -->
flex flex-col flex-row flex-wrap
items-start items-center items-end items-stretch
justify-start justify-center justify-between justify-around justify-end
gap-4 gap-x-2 gap-y-6
flex-1 flex-none shrink-0 grow

<!-- grid -->
grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-12
col-span-2 row-span-3
grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]
place-items-center

<!-- posicionamento -->
relative absolute fixed sticky top-0 right-4 inset-0 z-10

<!-- tamanho -->
w-full w-1/2 w-64 max-w-6xl min-w-0
h-screen h-full min-h-screen
mx-auto

<!-- espaçamento -->
p-4 px-4 py-2 pt-1 pb-8
m-4 mx-auto my-2 mt-6
space-y-4 space-x-2       (entre filhos)

<!-- overflow -->
overflow-hidden overflow-x-auto truncate line-clamp-3
```

## Responsividade (mobile-first)

| Prefixo | A partir de |
|---|---|
| — | 0 |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

```html
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
<nav class="hidden md:flex">              <!-- some no celular -->
<button class="md:hidden">Menu</button>   <!-- só no celular -->
```

## Estados

```html
hover: focus: focus-visible: focus-within: active: visited:
disabled: checked: required: invalid: placeholder:
first: last: odd: even: only:
group-hover: peer-focus: peer-checked:
dark: motion-reduce: print:

<button class="bg-blue-600 hover:bg-blue-700 focus-visible:outline-2 disabled:opacity-50">
```

```html
<!-- group: o filho reage ao hover no pai -->
<div class="group">
  <span class="opacity-0 group-hover:opacity-100">aparece</span>
</div>

<!-- peer: o irmão reage ao estado do anterior -->
<input class="peer" required />
<p class="hidden peer-invalid:block text-red-600">Campo obrigatório</p>
```

## Acessibilidade

```html
sr-only                        <!-- visível só para leitor de tela -->
focus:not-sr-only              <!-- aparece ao receber foco (skip link) -->
focus-visible:outline-2 focus-visible:outline-offset-2
motion-reduce:transition-none  <!-- respeita prefers-reduced-motion -->
aria-[invalid=true]:border-red-600
```

```html
<a href="#conteudo" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
  Pular para o conteúdo
</a>
```

## Padrões prontos

```html
<!-- container -->
<div class="mx-auto max-w-6xl px-4">

<!-- cartão -->
<article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">

<!-- grade responsiva -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

<!-- barra: título à esquerda, ação à direita -->
<div class="flex flex-wrap items-center justify-between gap-4">

<!-- skeleton -->
<div class="h-32 animate-pulse rounded-lg bg-slate-200"></div>

<!-- tabela que vira lista no celular -->
<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead class="border-b text-left"><tr><th class="p-2">Título</th></tr></thead>
    <tbody class="divide-y"><tr><td class="p-2">…</td></tr></tbody>
  </table>
</div>

<!-- centralizar -->
<div class="flex min-h-screen items-center justify-center">
```

## Composição de classes em React

```tsx
// simples
className={`rounded px-4 py-2 ${ativo ? "bg-marca-600 text-white" : "bg-white"}`}

// com clsx + tailwind-merge (resolve conflitos de classe)
// pnpm add clsx tailwind-merge
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

className={cn("px-4 py-2", ativo && "bg-marca-600", className)}
```

`twMerge` garante que `cn("p-2", "p-4")` resulte em `p-4`, e não nas duas — essencial
quando o componente aceita `className` de fora.

## Componente base (modelo)

```tsx
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type Props = ComponentProps<"button"> & { variante?: "primario" | "secundario" };

const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700",
  secundario: "border border-slate-300 bg-white hover:bg-slate-50",
} as const;

export function Botao({ variante = "primario", className, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        className,
      )}
      {...props}
    />
  );
}
```

## Anti-padrões

| ❌ | ✅ |
|---|---|
| `@apply` para criar componentes | Componente React |
| `p-[17px]` | Escala (`p-4`) |
| `outline-none` sem substituir | `focus-visible:outline-2` |
| `<div onClick>` | `<button>` |
| Informação só por cor | Texto + cor |
| `text-red-500` espalhado | `--color-erro` em `@theme` |
| `className={"a " + (x ? "b" : "")}` | `cn("a", x && "b")` |
| `!important` (`!p-4`) | Corrija a ordem/especificidade |
