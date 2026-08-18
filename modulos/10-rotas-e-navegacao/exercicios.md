# M10 — Exercícios

## E10.1 — Mapa de rotas do cliente (individual)

Projete o mapa completo do BiblioCom no cliente e confronte com o mapa do servidor (M07):

| Rota do cliente | Página | Chama qual rota da API | Quem pode |
|---|---|---|---|
| `/` | | | |
| `/obras` | | | |
| `/obras/nova` | | | |
| `/obras/:id` | | | |
| `/obras/:id/editar` | | | |
| `/emprestimos` | | | |
| `/emprestimos/novo` | | | |
| `/meus-emprestimos` | | | |
| `/relatorios` | | | |
| `/login` | | | |
| `*` | | | |

Responda: **por que `/obras/nova` precisa vir antes de `/obras/:id` na definição?** O que
aconteceria com `/obras/nova` se a ordem fosse invertida?

---

## E10.2 — Estado na URL (individual) ⭐

Faça a `AcervoPage` guardar **todo** o estado da tela na URL: termo, categoria, faixa de
anos, disponibilidade, ordenação e página.

Verifique as 8 propriedades:

| # | Propriedade | ✅/❌ |
|---|---|---|
| 1 | Filtrar altera a URL | |
| 2 | A URL copiada reproduz a tela em outra aba | |
| 3 | "Voltar" desfaz o último filtro | |
| 4 | F5 preserva tudo | |
| 5 | Mudar filtro volta para a página 1 | |
| 6 | Limpar filtros remove os parâmetros da URL | |
| 7 | `?page=abc` não quebra | |
| 8 | `?ordering=;DROP TABLE` não quebra e não é enviado à API | |

Os itens 7 e 8 são validação de entrada. Escreva como você tratou cada um.

---

## E10.3 — 404 em três sabores (individual)

Implemente e diferencie visualmente:

| Situação | O que o usuário vê |
|---|---|
| Rota inexistente (`/pagina-que-nao-existe`) | 404 de navegação, com link para o início |
| Recurso inexistente (`/obras/99999`) | "Obra não encontrada", com link para o acervo |
| Recurso existente mas sem permissão | Depende — **e é uma decisão de segurança** |

Para o terceiro caso, responda: mostrar "sem permissão" ou "não encontrado"? Retome a
discussão de IDOR do M13 e justifique.

---

## E10.4 — Layouts aninhados (individual)

Implemente dois níveis de layout:

```
Layout (cabeçalho + rodapé)
├── AcervoPage
├── ObraDetalhePage
└── LayoutAdmin (menu lateral)
    ├── RelatoriosPage
    ├── AssociadosPage
    └── ConfiguracoesPage
```

Requisito: o menu lateral aparece **apenas** nas rotas administrativas, e não é
remontado ao navegar entre elas (prove: coloque um `useState` com contador no menu e
verifique que ele não zera).

---

## E10.5 — Link × âncora (individual)

1. Coloque na mesma página um `<Link to="/obras">` e um `<a href="/obras">`.
2. Adicione um contador em `useState` no componente pai.
3. Incremente o contador e clique em cada um dos dois.
4. Observe: na aba Network, o que cada clique dispara? O contador sobrevive?

**Entrega:** tabela comparativa + explicação em 5 linhas de por que a diferença existe.

---

## E10.6 — Navegação após ação (individual)

Implemente o fluxo completo de cadastro:

1. `/obras/nova` com formulário
2. Ao salvar com sucesso: navegar para `/obras/:id` da obra criada
3. A tela de detalhe mostra uma mensagem de sucesso
4. O botão "voltar" **não** retorna ao formulário preenchido

O item 4 exige `{ replace: true }`. Responda: por que isso é o equivalente, no cliente, do
padrão **PRG** que você viu no M01?

---

## E10.7 — Desafio: rota protegida (preparação para o M12)

Implemente um componente `<RotaProtegida>` que:

- redireciona para `/login` se não houver usuário autenticado;
- guarda a rota pretendida e volta para ela após o login;
- mostra um estado de carregando enquanto verifica a sessão (e **não** pisca a tela de
  login para quem está autenticado);
- aceita uma lista de papéis permitidos.

```tsx
<Route element={<RotaProtegida papeis={["BIBLIOTECARIO", "COORDENACAO"]} />}>
  <Route path="obras/nova" element={<ObraFormPage />} />
</Route>
```

⚠️ Antes de entregar, responda: **isso é segurança?** Se um associado digitar
`/obras/nova` na barra de endereço, o que impede de fato o cadastro? (a resposta correta
está no M07 e no M13, não aqui)

---

## Gabarito parcial

**E10.1** — `/obras/:id` casaria com `/obras/nova`, tratando `"nova"` como id. A API
receberia `GET /api/obras/nova/` e devolveria 404 — sintoma confuso, causa banal. Rotas
literais antes de paramétricas, exatamente como nos controllers do backend (M07).

**E10.5** — `<Link>` intercepta o clique, chama `history.pushState` e troca o componente:
nenhuma requisição de documento, contador preservado. `<a href>` faz o navegador pedir o
documento de novo: baixa `index.html` e o *bundle*, o React reinicia do zero e o contador
volta a zero.

**E10.7** — Não é segurança, é **experiência do usuário**. `<RotaProtegida>` só esconde a
tela; o código está no *bundle* que qualquer pessoa baixa, e a API pode ser chamada
diretamente por `curl`. A segurança real está nos `Guards` e no filtro da consulta
do DRF (M07/M13). Esconder o que a pessoa não pode usar é cortesia; recusar no servidor é
proteção.
