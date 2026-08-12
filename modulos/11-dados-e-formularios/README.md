# M11 — Dados e formulários no cliente

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 11** · **Pré-requisitos:** M07, M08, M10
> Complemento do item de ementa *"operações CRUD a partir da API do framework"* — aqui, do
> lado de quem consome.

O módulo que fecha o frontend e transforma a SPA em aplicação de verdade: cache,
revalidação, mutações e formulários validados nas duas camadas.

## 🎯 Objetivos

1. Distinguir **estado de servidor** de **estado de UI** e tratar cada um com a ferramenta
   certa.
2. Buscar dados com cache, revalidação e os quatro estados, sem `useEffect` manual.
3. Escrever dados com mutações e invalidação de cache.
4. Construir formulários com validação no cliente **e** exibir os erros do servidor.
5. Gerar tipos a partir do OpenAPI e manter o contrato garantido pelo compilador.

---

## 📖 Teoria (2h)

### 1. Dois tipos de estado (20 min)

No M08 você guardou dados da API em `useState`. Funciona — e é a origem de metade dos bugs
de uma SPA. O motivo é que esses dados **não são seus**:

| | Estado de UI | Estado de servidor |
|---|---|---|
| Dono | O componente | O banco de dados |
| Exemplos | Modal aberto, aba ativa, texto digitado | Lista de obras, usuário logado |
| Pode ficar velho? | Não | **Sim** — outra pessoa pode ter mudado |
| Precisa de cache? | Não | Sim |
| Precisa revalidar? | Não | Sim |
| Ferramenta | `useState`, `useContext` | **TanStack Query** |

Relembre o que ficou em aberto no M08 (exercício E08.6):

| Problema | Com `useEffect` manual |
|---|---|
| Voltar para uma tela já visitada | Recarrega tudo, com "Carregando…" |
| Duas telas usando a mesma lista | Duas requisições idênticas |
| Cadastrar uma obra | A listagem não fica sabendo |
| Aba em segundo plano por 10 min | Dados velhos, sem aviso |
| Requisições fora de ordem | A resposta lenta sobrescreve a rápida |
| Erro de rede | Sem repetição automática |

Cada linha exigiria dezenas de linhas de código próprio. É isso que a biblioteca resolve.

### 2. TanStack Query — leitura (30 min)

```bash
pnpm add @tanstack/react-query
```

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s sem considerar os dados velhos
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
);
```

```tsx
// src/hooks/useObras.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import type { Obra, Paginado } from "../api/tipos";

type Filtros = { termo?: string; pagina?: number };

export function useObras({ termo = "", pagina = 1 }: Filtros) {
  return useQuery({
    queryKey: ["obras", { termo, pagina }],     // a chave identifica o cache
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ page: String(pagina) });
      if (termo) p.set("search", termo);
      return api<Paginado<Obra>>(`/obras/?${p}`, { signal });
    },
    placeholderData: keepPreviousData,          // mantém a página anterior enquanto carrega
  });
}
```

```tsx
// src/pages/AcervoPage.tsx
export function AcervoPage() {
  const [params] = useSearchParams();
  const termo = params.get("q") ?? "";
  const pagina = Number(params.get("page") ?? 1);

  const { data, isPending, isError, error, isFetching } = useObras({ termo, pagina });

  if (isPending) return <Carregando />;
  if (isError) return <Alerta tom="erro">{mensagemDeErro(error)}</Alerta>;
  if (data.results.length === 0) return <EstadoVazio termo={termo} />;

  return (
    <>
      {isFetching && <BarraDeProgresso />}   {/* revalidando em segundo plano */}
      <ListaObras obras={data.results} />
      <Paginacao total={data.count} pagina={pagina} />
    </>
  );
}
```

**A `queryKey` é o conceito central.** Ela identifica um pedaço de cache:

- chaves diferentes → caches separados (`["obras", {termo: "a"}]` ≠ `["obras", {termo: "b"}]`)
- mesma chave em dois componentes → **uma** requisição, dois consumidores
- mudou a chave → nova busca automática (adeus, array de dependências do `useEffect`)

O que se ganha de graça: cache, deduplicação, revalidação ao focar a janela, repetição em
erro de rede, cancelamento (via `signal`) e `isFetching` separado de `isPending` — este
último é o que permite mostrar dados antigos enquanto os novos chegam, em vez de piscar a
tela.

**Busca com *debounce*** continua sendo responsabilidade sua, porque é decisão de UX:

```tsx
const termoAtrasado = useDebounce(termo, 400);
const { data } = useObras({ termo: termoAtrasado, pagina });
```

### 3. TanStack Query — escrita (30 min)

```tsx
// src/hooks/useCriarObra.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCriarObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: ObraEntrada) =>
      api<Obra>("/obras/", { method: "POST", body: JSON.stringify(dados) }),

    onSuccess: (obra) => {
      // qualquer cache que comece com ["obras"] passa a ser considerado velho
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.setQueryData(["obra", obra.id], obra);   // já popula o detalhe
    },
  });
}
```

```tsx
const criar = useCriarObra();

<Botao onClick={() => criar.mutate(dados)} disabled={criar.isPending}>
  {criar.isPending ? "Salvando…" : "Salvar"}
</Botao>
```

**`invalidateQueries` responde à pergunta 3 do M08:** ao criar uma obra, a listagem se
atualiza sozinha, em qualquer tela que esteja montada. É a diferença entre uma SPA que
parece viva e uma que exige F5.

Estados da mutação: `isPending`, `isError`, `isSuccess`, `error`, `reset()`.

### 4. Formulários com React Hook Form + Zod (35 min) ⭐

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

**Zod** descreve o formato esperado e **valida**; o TypeScript infere o tipo do próprio
esquema, então não há duplicação entre tipo e validação.

```ts
// src/schemas/obra.ts
import { z } from "zod";

export const obraSchema = z.object({
  titulo: z.string().min(1, "Informe o título").max(200, "Máximo de 200 caracteres").trim(),
  subtitulo: z.string().max(200).optional(),
  autor: z.coerce.number().int().positive("Selecione o autor"),
  ano_publicacao: z.coerce
    .number()
    .int()
    .min(1400, "Ano muito antigo")
    .max(new Date().getFullYear(), "O ano não pode ser futuro")
    .nullable()
    .optional(),
  isbn: z
    .string()
    .transform((v) => v.replace(/[-\s]/g, ""))
    .refine((v) => v === "" || /^\d{10}$|^\d{13}$/.test(v), "O ISBN deve ter 10 ou 13 dígitos")
    .optional(),
});

export type ObraEntrada = z.infer<typeof obraSchema>;   // o tipo sai do esquema
```

```tsx
// src/pages/ObraFormPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function ObraFormPage() {
  const navegar = useNavigate();
  const criar = useCriarObra();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ObraEntrada>({ resolver: zodResolver(obraSchema) });

  async function aoEnviar(dados: ObraEntrada) {
    try {
      const obra = await criar.mutateAsync(dados);
      navegar(`/obras/${obra.id}`, { replace: true });      // PRG do cliente (M10)
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        // ⭐ mapeia os erros do DRF para os campos do formulário
        for (const [campo, mensagens] of Object.entries(e.dados as Record<string, string[]>)) {
          setError(campo === "non_field_errors" ? "root" : (campo as keyof ObraEntrada), {
            message: mensagens.join(" "),
          });
        }
      } else {
        setError("root", { message: "Não foi possível salvar. Tente novamente." });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="max-w-xl space-y-4">
      {errors.root && <Alerta tom="erro">{errors.root.message}</Alerta>}

      <Campo rotulo="Título" required {...register("titulo")} erro={errors.titulo?.message} />
      <Campo rotulo="Subtítulo" {...register("subtitulo")} erro={errors.subtitulo?.message} />
      <Campo
        rotulo="Ano de publicação"
        type="number"
        {...register("ano_publicacao")}
        erro={errors.ano_publicacao?.message}
      />
      <Campo
        rotulo="ISBN"
        ajuda="10 ou 13 dígitos; hífens são ignorados"
        {...register("isbn")}
        erro={errors.isbn?.message}
      />

      <div className="flex gap-2">
        <Botao type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Botao>
        <Botao type="button" variante="secundario" onClick={() => navegar(-1)}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
```

O bloco do `catch` é o mais importante do módulo. Ele fecha o ciclo do contrato: o
serializer do M07 devolve `{"isbn": ["..."]}`, e essa estrutura é mapeada campo a campo no
formulário. **Só funciona porque o formato do erro foi padronizado no contrato (M02).**

#### As duas validações, de novo

| Camada | Serve para | O que acontece se faltar |
|---|---|---|
| **Cliente** (Zod) | Resposta imediata, sem ida ao servidor | UX ruim; o sistema continua íntegro |
| **Servidor** (serializer) | **Integridade e segurança** | Dado inválido no banco |

O `curl` do M01 continua ignorando seu React. Zod é conveniência; o serializer é a defesa.

### 5. Tipos a partir do contrato (15 min)

```bash
# funciona nas tres plataformas — uma linha por comando evita o && (PowerShell 5.1)
cd backend
python manage.py spectacular --file ../frontend/schema.yml
cd ../frontend
pnpm dlx openapi-typescript schema.yml -o src/api/schema.d.ts
```

```ts
import type { components } from "./api/schema";

export type Obra = components["schemas"]["Obra"];
export type ObraEntrada = components["schemas"]["ObraCreate"];
```

Coloque num script:

```json
{ "scripts": { "tipos": "openapi-typescript schema.yml -o src/api/schema.d.ts" } }
```

Agora, se o backend renomear `titulo`, o `pnpm build` **falha** — em vez de a tela mostrar
`undefined` em produção. É a defesa contra o contrato quebrado em silêncio (M02),
finalmente completa. No M14 isso entra no CI.

---

## 🛠️ Roteiro prático (2h)

### Passo 1 — Migrar a listagem para Query (35 min)

Substitua o `useEffect` da `AcervoPage` por `useObras`. Depois **prove** os ganhos:

| Teste | Antes (`useEffect`) | Depois (Query) |
|---|---|---|
| Ir ao detalhe e voltar | | |
| Duas telas com a mesma lista | | |
| Trocar de aba e voltar após 1 min | | |
| Digitar rápido na busca | | |
| Parar o backend e tentar de novo | | |

Meça na aba Network: **quantas requisições** em cada caso? Instale o
`@tanstack/react-query-devtools` para ver o cache ao vivo.

### Passo 2 — Detalhe e paginação (25 min)

```tsx
export function useObra(id: string | undefined) {
  return useQuery({
    queryKey: ["obra", id],
    queryFn: ({ signal }) => api<Obra>(`/obras/${id}/`, { signal }),
    enabled: Boolean(id),          // não busca se o id não existe
  });
}
```

Implemente a paginação com `keepPreviousData` e observe: ao mudar de página, a lista
anterior permanece visível (esmaecida) em vez de a tela piscar em branco.

### Passo 3 — Formulário completo (40 min) ⭐

Implemente `ObraFormPage` conforme a teoria e teste **todos** os caminhos:

| Teste | Esperado |
|---|---|
| Enviar vazio | Erros do Zod, sem requisição na Network |
| ISBN `abc` | Erro do Zod, sem requisição |
| ISBN `978-85-359-1484-9` | Aceito; enviado sem hífens |
| Ano 2999 | Erro do Zod |
| ISBN duplicado (válido no formato) | Passa pelo Zod, **400 do servidor**, erro no campo |
| Backend fora do ar | Erro geral, formulário preservado |
| Sucesso | Navega para o detalhe; "voltar" não retorna ao formulário |

A quinta linha é a mais importante: é o caso que **só** o servidor consegue validar, e ele
precisa aparecer no campo certo.

### Passo 4 — Edição e exclusão (20 min)

- `useAtualizarObra` com `PATCH`, pré-preenchendo o formulário (`defaultValues`)
- `useExcluirObra` com `DELETE`, confirmação em modal e invalidação da lista
- Após excluir, navegar para `/obras`

### Passo 5 — Tipos gerados (20 min)

Gere `schema.d.ts`, troque os tipos escritos à mão por ele e **prove a proteção**:

1. No backend, renomeie `titulo` para `nome` no `ObraSerializer`.
2. Regenere o schema e os tipos.
3. Rode `pnpm build`. O que acontece?
4. Reverta.

---

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Copiar dados do Query para `useState` | Duplica estado; use `data` direto |
| `queryKey` sem os filtros | Cache errado: a busca de "a" mostra o resultado de "b" |
| Esquecer `invalidateQueries` na mutação | A lista não atualiza após criar |
| `useEffect` para buscar dados | É o que o Query substitui |
| Validar só no Zod | `curl` ignora seu React |
| Ignorar o 400 do servidor | O usuário vê "erro" sem saber qual campo |
| `isPending` e `isFetching` confundidos | Tela piscando a cada revalidação |
| Tipos escritos à mão | Divergem do backend em silêncio |
| `mutate` esperando retorno | Use `mutateAsync` com `await` |
| Formulário sem `noValidate` | Validação do navegador conflita com a do Zod |

## ✅ Checklist de saída

- [ ] Sei distinguir estado de servidor de estado de UI
- [ ] Listagem, detalhe e paginação com `useQuery`
- [ ] `queryKey` incluindo todos os filtros
- [ ] Criação, edição e exclusão com `useMutation` + `invalidateQueries`
- [ ] Formulário com React Hook Form + Zod
- [ ] Erros 400 do DRF mapeados campo a campo
- [ ] Os quatro estados tratados em todas as telas
- [ ] Tipos gerados do OpenAPI, com a proteção demonstrada
- [ ] Nenhum `useEffect` buscando dados
- [ ] Sei responder às 5 perguntas do E08.6

## 📦 Entrega E4 — SPA consumindo a API

Frontend completo do BiblioCom: listagem com busca e paginação (estado na URL), detalhe,
formulários de criação e edição validados nas duas camadas, exclusão com confirmação, os
quatro estados em todas as telas e tipos gerados do contrato.

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md) · Referência rápida em [`cheatsheet.md`](cheatsheet.md).

## 📚 Para aprofundar

- [TanStack Query — documentação](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query — pensando em queries](https://tkdodo.eu/blog/practical-react-query) ⭐
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [openapi-typescript](https://openapi-ts.dev/)
