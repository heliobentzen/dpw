# Slides

Apresentações das aulas, em HTML puro: abrem direto no navegador, funcionam offline e não
dependem de nenhuma biblioteca. Ponto de entrada: [`index.html`](index.html).

| Deck | Módulo |
| --- | --- |
| [`m03-nestjs.html`](m03-nestjs.html) | [M03 — NestJS: a primeira API](../modulos/03-nestjs-primeiros-passos/) |
| [`m04-entidades.html`](m04-entidades.html) | [M04 — Entidades](../modulos/04-entidades-typeorm/) |
| [`m06-consultas-crud.html`](m06-consultas-crud.html) | [M06 — Consultas e CRUD](../modulos/06-orm-consultas-crud/) |

Os slides acompanham o módulo, sem substituí-lo: cada seção segue analogia → conceito →
código. O que a equipe aplica no projeto está na seção **🧩 No projeto da equipe** do
`README.md` do módulo.

> **Exemplo dos slides:** o mesmo dos módulos — pessoas, atendimentos, serviços e anexos,
> mais um empréstimo de equipamentos para ilustrar a transação do M06. Ao apresentar, deixe claro que
> é ilustração: a turma aplica cada conceito no domínio da própria equipe.

## Apresentar

| Tecla | Ação |
| --- | --- |
| <kbd>→</kbd> <kbd>espaço</kbd> | revela o próximo item |
| <kbd>←</kbd> | volta |
| <kbd>Shift</kbd> + <kbd>→</kbd> | próximo slide inteiro |
| <kbd>F</kbd> | tela cheia |
| <kbd>N</kbd> | notas do professor |
| <kbd>B</kbd> | tela preta |
| <kbd>?</kbd> | ajuda |

O endereço guarda o slide atual (`m04-entidades.html#12`). Com `?revisao`
(`m04-entidades.html?revisao#12`), cada slide abre já completo, para o estudante revisar
sozinho.

**PDF:** <kbd>Ctrl</kbd>+<kbd>P</kbd> → "Salvar como PDF" → marque "Gráficos de plano de fundo".
A impressão mostra todos os itens revelados.

> As fontes (Inter e JetBrains Mono) vêm do Google Fonts. Sem internet, o navegador usa as
> fontes do sistema e o layout continua funcionando.

## Editar

Cada deck é um arquivo HTML com uma `<section class="slide">` por slide. O visual está em
[`assets/deck.css`](assets/deck.css) e o motor em [`assets/deck.js`](assets/deck.js), que
documenta no topo todos os atributos. Os mais usados:

| Marcação | Efeito |
| --- | --- |
| `class="f"` | o elemento aparece a cada tecla (`zoom`, `left`, `right`, `fade`, `blur` mudam a animação) |
| `data-with` | aparece junto com o anterior |
| `data-hl="3-5"` | ao aparecer, realça as linhas 3 a 5 do código do slide |
| `<div class="captions">` | legendas que se substituem, uma por passo |
| `class="focus-list"` | o item mais recente fica em destaque; os anteriores esmaecem |
| `⟦texto⟧` / `⟪texto⟫` no código | marca o trecho em vermelho / verde |
| `<aside class="notes">` | nota do professor (tecla <kbd>N</kbd>) |

Dentro de `<pre class="code">`, escreva `&lt;` no lugar de `<` (por exemplo,
`Repository&lt;Obra>`).

**Antes de publicar uma alteração,** abra o deck com `?checar`: ao fim da página aparece a
lista de elementos que vazam do slide ou têm o código cortado. "ok" significa que nada vaza.
