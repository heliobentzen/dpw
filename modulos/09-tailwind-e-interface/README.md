# M09 — Tailwind e construção de interfaces

> **CH:** 4h (1h teórica · 3h práticas) · **Semanas 9–10** · **Pré-requisito:** M08
> **Ementa:** *Templates: Criação de interfaces com o usuário utilizando o framework
> escolhido.*

Este módulo entrega a camada de apresentação: um pequeno **design system** em Tailwind, com
componentes acessíveis, responsivos e consistentes. É aqui que o BiblioCom deixa de parecer
um exercício.

## 🎯 Objetivos

1. Explicar o modelo utilitário do Tailwind e quando ele ajuda ou atrapalha.
2. Construir um sistema visual coerente com tokens (cores, espaços, tipografia).
3. Criar componentes base reutilizáveis (botão, campo, badge, cartão, alerta).
4. Implementar layout responsivo com Grid e Flex.
5. Atender aos requisitos de acessibilidade cobrados na rubrica.

---

## 📖 Teoria (1h)

### 1. O modelo utilitário (20 min)

CSS tradicional separa por **arquivo**; Tailwind compõe por **classe**, no lugar de uso.

```html
<!-- CSS tradicional -->
<button class="botao botao--primario">Salvar</button>
<style>
  .botao { padding: .5rem 1rem; border-radius: 6px; font-weight: 500; }
  .botao--primario { background: #1d4ed8; color: white; }
  .botao--primario:hover { background: #1e40af; }
</style>

<!-- Tailwind -->
<button class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800">
  Salvar
</button>
```

**O que se ganha:**

| Ganho | Por quê |
|---|---|
| Não se inventa nome de classe | `.card-header-title-wrapper-2` deixa de existir |
| O estilo é local | Alterar aqui não quebra outra tela |
| CSS não cresce | O arquivo final só tem as classes usadas |
| Restrições úteis | `p-4` vem de uma escala; `padding: 17px` não acontece |
| Responsivo no lugar | `md:grid-cols-2` em vez de caçar a media query |

**O que se perde:** o HTML fica verboso. A resposta do Tailwind não é `@apply` — é
**componentizar**. Se você está repetindo 12 classes, extraia um componente React. Isso
combina exatamente com o M08.

> ⚠️ **Não use `@apply` para recriar CSS tradicional.** É a tentação de quem vem de
> Bootstrap, e devolve todos os problemas de nomenclatura e cascata que o Tailwind evita.
> Componente React é a unidade de reuso; classe utilitária é a unidade de estilo.

### 2. A escala (15 min)

Quase tudo no Tailwind é uma escala fechada — é isso que produz consistência sem
combinar nada com ninguém.

```
Espaçamento (padding, margin, gap):
p-0  p-px  p-0.5  p-1  p-1.5  p-2  p-3  p-4  p-6  p-8  p-12  p-16
     1px   2px    4px  6px    8px  12px 16px 24px 32px 48px  64px

Texto:      text-xs  text-sm  text-base  text-lg  text-xl  text-2xl ... text-6xl
Peso:       font-light font-normal font-medium font-semibold font-bold
Raio:       rounded-sm rounded rounded-md rounded-lg rounded-xl rounded-full
Cor:        <propriedade>-<cor>-<intensidade>   →  bg-blue-700, text-slate-600
Intensidade: 50 (mais claro) ... 950 (mais escuro)
```

**Direções:** `p` (tudo), `px`/`py` (eixos), `pt`/`pr`/`pb`/`pl` (lados). Mesmo padrão para
`m` (margem).

### 3. Responsividade *mobile-first* (15 min)

Sem prefixo = todas as telas. Com prefixo = **daquele tamanho para cima**.

| Prefixo | A partir de |
|---|---|
| (nenhum) | 0px |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

```html
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

Lê-se: uma coluna no celular, duas a partir de 640px, três a partir de 1024px. Escreva
sempre do menor para o maior — é o oposto do que a maioria faz intuitivamente, e é o que
garante que o celular receba o CSS mais simples.

Outros prefixos de estado, que se combinam:

```html
hover: focus: focus-visible: active: disabled: first: last: odd:
dark: motion-reduce: group-hover: peer-focus:

class="bg-white hover:bg-slate-50 focus-visible:outline-2 disabled:opacity-50 dark:bg-slate-900"
```

### 4. Tokens do projeto (10 min)

No Tailwind 4, a personalização é feita em CSS, com `@theme`:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-marca-50:  oklch(0.97 0.02 250);
  --color-marca-500: oklch(0.62 0.16 250);
  --color-marca-700: oklch(0.48 0.15 250);
  --color-marca-900: oklch(0.32 0.10 250);

  --font-display: "Inter", system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

Isso gera `bg-marca-500`, `text-marca-700`, `font-display`, `rounded-card` — usáveis como
qualquer utilitário.

> **Defina os tokens antes de estilizar a primeira tela.** Trocar a cor da marca em 40
> lugares é retrabalho evitável; trocar em `@theme` é uma linha.

---

## 🛠️ Roteiro prático (3h)

### Passo 1 — Tokens e base (25 min)

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* identidade do BiblioCom */
  --color-marca-50:  oklch(0.97 0.02 250);
  --color-marca-100: oklch(0.93 0.04 250);
  --color-marca-500: oklch(0.62 0.16 250);
  --color-marca-600: oklch(0.55 0.16 250);
  --color-marca-700: oklch(0.48 0.15 250);

  --color-sucesso: oklch(0.55 0.15 150);
  --color-alerta:  oklch(0.68 0.15 70);
  --color-erro:    oklch(0.55 0.20 25);

  --font-display: "Inter", system-ui, sans-serif;
  --radius-card: 0.75rem;
}

/* foco visível: requisito de acessibilidade, não enfeite */
@layer base {
  :focus-visible {
    outline: 2px solid var(--color-marca-600);
    outline-offset: 2px;
  }
  body {
    @apply bg-slate-50 text-slate-900 antialiased;
  }
}
```

> Este é o **único** uso legítimo de `@apply` no material: estilos de elemento base
> (`body`, `:focus-visible`), não componentes.

### Passo 2 — Componentes base (60 min) ⭐

Crie `src/components/ui/` com os componentes que todas as telas usarão.

```tsx
// src/components/ui/Botao.tsx
import type { ComponentProps } from "react";

type BotaoProps = ComponentProps<"button"> & {
  variante?: "primario" | "secundario" | "perigo" | "fantasma";
  tamanho?: "sm" | "md";
};

const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700 disabled:bg-marca-600",
  secundario: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
  perigo: "bg-erro text-white hover:brightness-90",
  fantasma: "text-slate-700 hover:bg-slate-100",
} as const;

const TAMANHOS = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
} as const;

export function Botao({
  variante = "primario",
  tamanho = "md",
  className = "",
  ...props
}: BotaoProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium
                  transition-colors disabled:cursor-not-allowed disabled:opacity-50
                  ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`}
      {...props}
    />
  );
}
```

Repare: `ComponentProps<"button">` faz o componente aceitar `onClick`, `type`, `disabled`,
`aria-*` — tudo que um `<button>` nativo aceita, com verificação de tipos.

```tsx
// src/components/ui/Campo.tsx
import { useId } from "react";
import type { ComponentProps } from "react";

type CampoProps = ComponentProps<"input"> & {
  rotulo: string;
  erro?: string;
  ajuda?: string;
};

export function Campo({ rotulo, erro, ajuda, className = "", ...props }: CampoProps) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {rotulo}
        {props.required && <span className="ml-0.5 text-erro">*</span>}
      </label>

      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[ajuda && idAjuda, erro && idErro].filter(Boolean).join(" ") || undefined}
        className={`rounded-md border px-3 py-2 text-sm
                    ${erro ? "border-erro" : "border-slate-300"} ${className}`}
        {...props}
      />

      {ajuda && <p id={idAjuda} className="text-xs text-slate-500">{ajuda}</p>}
      {erro && <p id={idErro} role="alert" className="text-xs text-erro">{erro}</p>}
    </div>
  );
}
```

Este componente resolve, de uma vez e para sempre, quatro requisitos de acessibilidade:
`label` associado por `htmlFor`/`id`, obrigatoriedade indicada **no texto** (não só por
cor), erro anunciado com `role="alert"` e erro associado ao campo por `aria-describedby`.
`useId` garante ids únicos mesmo com o campo repetido na tela.

```tsx
// src/components/ui/Badge.tsx
type BadgeProps = { children: React.ReactNode; tom?: "neutro" | "ok" | "alerta" | "erro" };

const TONS = {
  neutro: "bg-slate-100 text-slate-700",
  ok: "bg-green-100 text-green-800",
  alerta: "bg-amber-100 text-amber-900",
  erro: "bg-red-100 text-red-800",
} as const;

export function Badge({ children, tom = "neutro" }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONS[tom]}`}>
      {children}
    </span>
  );
}
```

Crie também: `Cartao`, `Alerta`, `EstadoVazio`, `Carregando` (com *skeleton*).

> **Nunca sinalize informação só por cor.** O badge de "atrasado" precisa dizer
> "Atrasado", não apenas ficar vermelho — 8% dos homens têm alguma deficiência na
> percepção de cores. Item de rubrica.

### Passo 3 — Layout da aplicação (35 min)

```tsx
// src/components/Layout.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4
                   focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="font-display text-lg font-bold text-marca-700">BiblioCom</span>
          <nav aria-label="Principal" className="flex gap-1">
            {/* links entram no M10 */}
          </nav>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>

      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        BiblioCom · Projeto de extensão universitária
      </footer>
    </div>
  );
}
```

O link "pular para o conteúdo" fica invisível até receber foco (`sr-only` +
`focus:not-sr-only`). Para quem navega por teclado ou leitor de tela, ele evita percorrer o
menu inteiro em toda página.

### Passo 4 — Reconstruir a tela de acervo (40 min)

Refaça a `AcervoPage` do M08 usando os componentes base. Requisitos:

- grade responsiva: 1 → 2 → 3 colunas
- cabeçalho com título e ação primária
- barra de busca e filtros
- os quatro estados, agora com componentes próprios (`Carregando` com *skeleton*,
  `EstadoVazio` com ação sugerida, `Alerta` para erro)
- badge de disponibilidade com **texto e cor**

```tsx
{carregando && (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-card bg-slate-200" />
    ))}
  </div>
)}
```

O *skeleton* com a forma do conteúdo real evita o "salto" de layout quando os dados chegam
— e é percebido como mais rápido que um *spinner*, mesmo levando o mesmo tempo.

### Passo 5 — Auditoria de acessibilidade e responsividade (20 min)

Percorra toda a interface:

- [ ] Funciona em 360px de largura, sem rolagem horizontal
- [ ] Navegação completa só com Tab / Shift+Tab / Enter / Espaço
- [ ] Foco visível em **todos** os elementos interativos
- [ ] Contraste ≥ 4.5:1 no texto (verifique com o DevTools)
- [ ] Nenhuma informação transmitida só por cor
- [ ] Toda imagem com `alt` significativo (ou `alt=""` se decorativa)
- [ ] Hierarquia de títulos sem pular níveis (`h1` → `h2` → `h3`)
- [ ] Botão é `<button>`, link é `<a>` — nunca `<div onClick>`
- [ ] Alvos de toque ≥ 44×44px
- [ ] Zero problemas *critical*/*serious* no axe DevTools
- [ ] A interface continua utilizável com zoom de 200%

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| `@apply` para criar componentes | Componentize em React |
| Repetir 15 classes em 8 lugares | Extraia um componente |
| Valores mágicos (`p-[17px]`) | Use a escala |
| `md:` pensando "só no desktop" | É *mobile-first*: `md:` vale de 768px **para cima** |
| Cor da marca escrita em cada lugar | Defina em `@theme` |
| `outline-none` sem substituto | Remove o foco visível — falha de acessibilidade grave |
| Informação só por cor | Acrescente texto ou ícone |
| `<div onClick>` como botão | `<button>` — teclado e leitor de tela dependem disso |
| String de classes montada com `+` | Use template literal, ou `clsx`/`cn` |
| Estilizar antes de definir tokens | Retrabalho garantido |

## ✅ Checklist de saída

- [ ] Tokens definidos em `@theme` e usados em toda a interface
- [ ] Pelo menos 6 componentes base em `components/ui/`
- [ ] `Campo` com label, `aria-describedby` e erro com `role="alert"`
- [ ] Layout com cabeçalho, conteúdo, rodapé e link de pular navegação
- [ ] Grade responsiva funcionando de 360px a desktop
- [ ] Os quatro estados com componentes próprios, incluindo *skeleton*
- [ ] Checklist de acessibilidade do Passo 5 inteiro respondido
- [ ] Zero problemas *critical*/*serious* no axe

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [Tailwind CSS — documentação](https://tailwindcss.com/docs)
- [Tailwind — tema e tokens (v4)](https://tailwindcss.com/docs/theme)
- [WCAG 2.2 em português](https://www.w3.org/Translations/WCAG22-pt-br/)
- [Inclusive Components](https://inclusive-components.design/) — padrões acessíveis, com explicação
- [shadcn/ui](https://ui.shadcn.com/) — referência de implementação (leia, não instale)
- [Refactoring UI](https://www.refactoringui.com/) — decisões visuais para quem não é designer
