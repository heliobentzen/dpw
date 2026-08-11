# M09 — Exercícios

## E09.1 — Traduzir CSS para Tailwind (individual)

Reescreva com utilitários, sem `@apply`:

```css
.cartao {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
}
.cartao:hover { box-shadow: 0 4px 6px rgb(0 0 0 / 0.1); }
.cartao__titulo { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
.cartao__meta { font-size: 14px; color: #64748b; }
@media (min-width: 768px) { .cartao { padding: 24px; display: flex; gap: 16px; } }
```

Depois responda: **quantos nomes de classe você precisou inventar?**

---

## E09.2 — Sistema de componentes (individual) ⭐

Construa `src/components/ui/` completo:

| Componente | Requisitos |
|---|---|
| `Botao` | 4 variantes, 2 tamanhos, estado de carregando, aceita `className` |
| `Campo` | Label, ajuda, erro com `role="alert"`, `aria-describedby`, `useId` |
| `Select` | Mesmos requisitos do `Campo` |
| `Textarea` | Mesmos requisitos, com contador de caracteres |
| `Badge` | 4 tons, sempre com texto (nunca só cor) |
| `Cartao` | Com slots de cabeçalho, corpo e rodapé |
| `Alerta` | 4 tons, ícone, botão de fechar, `role` correto por tom |
| `EstadoVazio` | Ícone, mensagem, ação sugerida |
| `Carregando` | *Skeleton* com a forma do conteúdo real |
| `Modal` | Foco preso dentro, fecha com Esc, devolve o foco ao fechar |

O `Modal` é o mais difícil e o mais instrutivo: implementá-lo mostra por que bibliotecas de
componentes existem. Use `<dialog>` nativo.

**Entrega:** uma página `/ui` demonstrando todos, em todos os estados.

---

## E09.3 — Reconstruir a tela de acervo (individual)

Refaça a `AcervoPage` com os componentes do E09.2. Requisitos:

- grade 1 → 2 → 3 colunas
- busca e filtro na mesma barra, empilhando no celular
- badge de disponibilidade com texto **e** cor
- os quatro estados com componentes próprios
- nenhuma string de classe repetida mais de duas vezes no arquivo

**Entrega:** prints em 360px, 768px e 1280px.

---

## E09.4 — Auditoria de acessibilidade (em duplas) ⭐

Audite a interface com o **axe DevTools** e produza:

| Problema | Página | Gravidade | Critério WCAG | Correção |
|---|---|---|---|---|

Depois, faça três testes manuais:

1. **Teclado:** percorra buscar obra → abrir detalhe → registrar empréstimo → confirmar,
   usando **apenas** Tab, Shift+Tab, Enter e Espaço. Onde travou?
2. **Zoom 200%:** a interface continua utilizável? Algo some ou se sobrepõe?
3. **Sem cor:** ative o filtro de escala de cinza do sistema. Ainda dá para distinguir
   "disponível" de "emprestado"?

Meta: zero problemas *critical* ou *serious*, e os três testes manuais aprovados.

---

## E09.5 — Tema escuro (individual)

Implemente alternância claro/escuro:

1. Tokens para os dois temas em `@theme` + `@media (prefers-color-scheme: dark)`.
2. Botão de alternância no cabeçalho, com três estados: claro, escuro, sistema.
3. A escolha persiste (`localStorage`) e é aplicada **antes** da primeira pintura (sem
   piscar branco).
4. Contraste ≥ 4.5:1 nos **dois** temas — verifique, não presuma.

O item 3 é o que separa a implementação ingênua da correta: pesquise "FOUC" e "flash of
unstyled content".

---

## E09.6 — Tabela responsiva (individual)

A tela de empréstimos tem 6 colunas. Faça funcionar em 360px:

- **Opção A:** rolagem horizontal, com a primeira coluna fixa
- **Opção B:** vira lista de cartões abaixo de `md:`
- **Opção C:** esconde colunas secundárias no celular

Implemente **duas** das três e compare: qual é melhor para o bibliotecário conferindo
devoluções no celular, em pé, no balcão? Justifique pelo cenário de uso, não pela estética.

---

## E09.7 — Refatorar repetição (individual)

Este trecho tem a mesma sequência de classes em 6 lugares:

```tsx
<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md">
```

1. Conte quantas vezes cada sequência longa se repete no seu projeto.
2. Extraia componentes para as que aparecem 3+ vezes.
3. Meça: quantas linhas o projeto perdeu? Quantos componentes ganhou?
4. Responda: **por que extrair um componente é melhor que criar `.cartao` com `@apply`?**

---

## E09.8 — Desafio: densidade de informação

O bibliotecário reclamou: "no computador do balcão só cabem 6 obras na tela, e eu preciso
ver 20".

Implemente um seletor de densidade (confortável / compacta) que muda espaçamento, tamanho
de fonte e altura de linha em toda a aplicação, via tokens — **sem** duplicar componentes.

Dica: variáveis CSS num atributo no `<html>` (`data-densidade="compacta"`).

---

## Gabarito parcial

**E09.1** — Zero nomes inventados. O `<article>` recebe
`rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md md:flex md:gap-4 md:p-6`;
o título, `text-lg font-semibold text-slate-900 mb-1`; a meta, `text-sm text-slate-500`.

**E09.6** — Para conferência de devolução no balcão, a opção B (cartões) costuma vencer:
rolagem horizontal exige duas mãos e precisão, e esconder colunas some justamente com a
data de devolução. A resposta muda com o cenário — e é isso que o exercício avalia.

**E09.7 (4)** — `@apply` recria a classe global: volta a especificidade, o nome inventado e
o acoplamento à cascata, e o Tailwind deixa de conseguir purgar corretamente. O componente
React encapsula estilo **e** comportamento (props, acessibilidade, estados), que a classe
CSS não consegue.
