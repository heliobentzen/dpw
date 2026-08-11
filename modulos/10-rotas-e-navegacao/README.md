# M10 — Rotas e navegação

> **CH:** 2h (1h teórica · 1h prática) · **Semana 10** · **Pré-requisitos:** M08, M09
> **Ementa:** *Views: Mapeamento de URLs* — o **segundo** mapa de rotas do sistema, agora
> no cliente.

Módulo curto e com uma ideia central: numa SPA existem **dois** mapeamentos de URL — o do
servidor (M07) e o do navegador. Confundi-los produz os bugs mais frustrantes da
arquitetura desacoplada.

## 🎯 Objetivos

1. Explicar o roteamento no cliente e sua relação com o do servidor.
2. Definir rotas, rotas aninhadas, layouts e página 404.
3. Navegar por link e programaticamente, com parâmetros de rota e de busca.
4. Manter o estado da tela **na URL**, tornando o link compartilhável.

---

## 📖 Teoria (1h)

### 1. Dois mapas de rotas (20 min)

```
Usuário digita  https://bibliocom.org/obras/42
        │
        ▼
   servidor recebe  GET /obras/42
        │
        ├─ É /api/*, /admin/* ou /static/*?  ──▶ Django responde
        │
        └─ Qualquer outra coisa  ──▶ devolve index.html (sempre o mesmo)
                                          │
                                          ▼
                              o React inicia e lê a URL atual
                                          │
                                          ▼
                              React Router casa /obras/:id
                                          │
                                          ▼
                              renderiza <ObraDetalhePage id={42} />
                                          │
                                          ▼
                              TanStack Query busca /api/obras/42/  (M11)
```

**A regra do servidor numa SPA:** qualquer rota desconhecida devolve o `index.html`, e o
roteamento acontece no cliente. Isso é chamado de *fallback* para o `index.html`.

> ⚠️ **O bug mais comum do deploy de SPA:** a aplicação funciona ao navegar pela interface,
> mas dá **404 ao recarregar (F5) numa rota interna**. Causa: o servidor não sabe o que é
> `/obras/42` e não configurou o *fallback*. Tratado no M16 — mas o conceito nasce aqui.

Depois do primeiro carregamento, navegar **não** volta ao servidor: o React Router usa a
History API para trocar a URL e o componente, sem recarregar a página. O que volta ao
servidor são apenas as chamadas de **dados** (`/api/...`).

### 2. Definindo rotas (20 min)

```bash
pnpm add react-router
```

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

```tsx
// src/App.tsx
import { Route, Routes } from "react-router";

import { Layout } from "./components/Layout";
import { AcervoPage } from "./pages/AcervoPage";
import { ObraDetalhePage } from "./pages/ObraDetalhePage";
import { EmprestimosPage } from "./pages/EmprestimosPage";
import { NaoEncontradaPage } from "./pages/NaoEncontradaPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AcervoPage />} />
        <Route path="obras" element={<AcervoPage />} />
        <Route path="obras/:id" element={<ObraDetalhePage />} />
        <Route path="emprestimos" element={<EmprestimosPage />} />
        <Route path="*" element={<NaoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
```

O `<Route element={<Layout />}>` sem `path` é uma **rota de layout**: o cabeçalho e o
rodapé são renderizados uma vez, e as páginas filhas aparecem no `<Outlet />`:

```tsx
// src/components/Layout.tsx
import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Cabecalho />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />        {/* aqui entra a página da rota atual */}
      </main>
      <Rodape />
    </div>
  );
}
```

O `path="*"` no fim captura tudo que não casou — a página 404 **do cliente**.

### 3. Navegação (10 min)

```tsx
import { Link, NavLink, useNavigate } from "react-router";

// link comum
<Link to="/obras/42">Dom Casmurro</Link>
<Link to={`/obras/${obra.id}`}>{obra.titulo}</Link>

// link que sabe se está ativo (menu)
<NavLink
  to="/obras"
  className={({ isActive }) =>
    isActive ? "font-semibold text-marca-700" : "text-slate-600 hover:text-slate-900"
  }
>
  Acervo
</NavLink>

// navegação programática (após salvar, por exemplo)
const navegar = useNavigate();
navegar(`/obras/${novaObra.id}`);
navegar(-1);                              // voltar
navegar("/login", { replace: true });     // sem criar entrada no histórico
```

> ⚠️ **Nunca use `<a href="/obras">` para rotas internas.** O `<a>` recarrega a página
> inteira, refazendo o download do *bundle* e perdendo todo o estado — anulando a razão de
> existir da SPA. `<a>` fica para links **externos**.

### 4. Parâmetros de rota e de busca (10 min)

```tsx
import { useParams, useSearchParams } from "react-router";

// parâmetro de rota: /obras/:id
const { id } = useParams();               // sempre string | undefined

// parâmetros de busca: /obras?q=casmurro&page=2
const [params, setParams] = useSearchParams();
const termo = params.get("q") ?? "";
const pagina = Number(params.get("page") ?? 1);

setParams({ q: "machado", page: "1" });                        // substitui tudo
setParams((p) => { p.set("page", "3"); return p; });           // altera um
```

**Estado da tela na URL** — esta é a ideia mais importante do módulo:

| Guardar em `useState` | Guardar na URL (`useSearchParams`) |
|---|---|
| Modal aberto/fechado | Termo de busca |
| Item expandido num acordeão | Filtros aplicados |
| Texto sendo digitado agora | Página atual |
| Aba do formulário | Ordenação |

O critério: **se recarregar a página deveria preservar, vai para a URL.** O resultado é que
o link é compartilhável, o botão "voltar" funciona e o F5 não perde nada — exatamente as
propriedades de GET discutidas no M01.

---

## 🛠️ Roteiro prático (1h)

### Passo 1 — Estrutura de rotas (20 min)

Instale o React Router e implemente o mapa da teoria, com as páginas:

| Rota | Página | Conteúdo |
|---|---|---|
| `/` | `AcervoPage` | Redireciona ou mostra o acervo |
| `/obras` | `AcervoPage` | Lista, busca e filtros |
| `/obras/:id` | `ObraDetalhePage` | Dados da obra e exemplares |
| `/emprestimos` | `EmprestimosPage` | Lista de empréstimos |
| `*` | `NaoEncontradaPage` | 404 com link para o início |

Teste: navegue pelo menu, use o botão "voltar" do navegador, e recarregue (F5) numa rota
interna. **O F5 funciona?** Se sim, é porque o Vite já faz o *fallback* em
desenvolvimento — anote isso, porque em produção é preciso configurar (M16).

### Passo 2 — Detalhe com parâmetro (20 min)

```tsx
// src/pages/ObraDetalhePage.tsx
import { Link, useParams } from "react-router";

export function ObraDetalhePage() {
  const { id } = useParams();
  const [obra, setObra] = useState<Obra | null>(null);
  const [erro, setErro] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    api<Obra>(`/obras/${id}/`)
      .then((d) => !cancelado && setObra(d))
      .catch((e: ApiError) => !cancelado && setErro(e.status))
      .finally(() => !cancelado && setCarregando(false));
    return () => { cancelado = true; };
  }, [id]);                                  // reexecuta se o id mudar

  if (carregando) return <Carregando />;
  if (erro === 404) return <NaoEncontrada recurso="Obra" />;
  if (erro) return <Alerta tom="erro">Não foi possível carregar a obra.</Alerta>;
  if (!obra) return null;

  return (
    <article>
      <Link to="/obras" className="text-sm text-marca-700 hover:underline">
        ← Voltar ao acervo
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{obra.titulo}</h1>
      {/* ... */}
    </article>
  );
}
```

Note `[id]` nas dependências: sem isso, navegar de `/obras/1` para `/obras/2` mantém os
dados antigos na tela — o componente não desmonta, só a prop muda.

Teste também `/obras/99999`: precisa mostrar a página de "não encontrada" **do cliente**,
distinta do 404 de rota inexistente.

### Passo 3 — Estado da busca na URL (20 min) ⭐

Refatore a `AcervoPage` para tirar o termo de busca do `useState` e colocá-lo na URL:

```tsx
export function AcervoPage() {
  const [params, setParams] = useSearchParams();
  const termo = params.get("q") ?? "";
  const pagina = Number(params.get("page") ?? 1);

  function buscar(novoTermo: string) {
    setParams((p) => {
      if (novoTermo) p.set("q", novoTermo);
      else p.delete("q");
      p.set("page", "1");        // trocar o filtro volta para a página 1
      return p;
    });
  }

  // ... busca na API usando termo e pagina
}
```

Verifique **todas** estas propriedades:

- [ ] Buscar altera a URL
- [ ] Copiar a URL e abrir em outra aba reproduz a mesma tela
- [ ] O botão "voltar" desfaz a busca
- [ ] F5 preserva a busca
- [ ] Mudar o filtro volta para a página 1
- [ ] `?page=abc` não quebra a tela

O último item é validação de entrada — e vale para a URL tanto quanto vale para um
formulário (M01: nunca confie na entrada).

---

## ⚠️ Erros comuns

| Erro | Sintoma | Correção |
|---|---|---|
| `<a href="/obras">` interno | Recarrega tudo, perde o estado | `<Link to="/obras">` |
| Falta `[id]` nas dependências | Detalhe não atualiza ao trocar de item | Declare a dependência |
| Estado de busca em `useState` | Link não é compartilhável; F5 perde | `useSearchParams` |
| Sem rota `*` | Rota errada mostra tela em branco | Página 404 |
| `useParams` tratado como número | `id` é sempre string | `Number(id)` e valide |
| Não trocar a página ao filtrar | Filtro novo, página 7 vazia | `p.set("page", "1")` |
| Sem *fallback* no servidor | F5 em `/obras/42` dá 404 em produção | Configure no deploy (M16) |
| Ordem de rotas errada | Rota específica nunca alcançada | Específico antes de curinga |

## ✅ Checklist de saída

- [ ] Sei explicar os dois mapas de rotas e onde cada um age
- [ ] Rotas, layout com `<Outlet />` e página 404 funcionando
- [ ] Navegação por `<Link>`/`<NavLink>`, com indicação de rota ativa
- [ ] Navegação programática após ação
- [ ] Detalhe com parâmetro, reagindo à troca de id
- [ ] 404 de recurso distinto de 404 de rota
- [ ] Busca, filtros e página **na URL**, com as 6 propriedades verificadas
- [ ] Sei por que o F5 numa rota interna quebra em produção sem configuração

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [React Router — documentação](https://reactrouter.com/)
- [MDN — History API](https://developer.mozilla.org/pt-BR/docs/Web/API/History_API)
- [MDN — URLSearchParams](https://developer.mozilla.org/pt-BR/docs/Web/API/URLSearchParams)
