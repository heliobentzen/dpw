# M11 — Cheatsheet: TanStack Query, React Hook Form e Zod

## Instalação

```bash
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers
npm install -D @tanstack/react-query-devtools openapi-typescript
```

## TanStack Query — configuração

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,             // tempo até considerar os dados velhos
      gcTime: 5 * 60_000,            // tempo até descartar o cache não usado
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Leitura

```tsx
const { data, isPending, isError, error, isFetching, refetch } = useQuery({
  queryKey: ["obras", { termo, pagina }],       // TUDO que muda a consulta
  queryFn: ({ signal }) => api<Paginado<Obra>>(`/obras/?...`, { signal }),
  enabled: Boolean(id),                          // condicional
  placeholderData: keepPreviousData,             // mantém o anterior ao paginar
  staleTime: 60_000,
  select: (d) => d.results,                      // transforma o resultado
});
```

| Flag | Significa |
|---|---|
| `isPending` | Primeira carga, sem dados ainda |
| `isFetching` | Buscando (inclui revalidação com dados na tela) |
| `isError` / `error` | Falhou |
| `isSuccess` / `data` | Tem dados |

> `isPending` → *skeleton*. `isFetching` → indicador discreto, sem tirar o conteúdo.

## Escrita

```tsx
const queryClient = useQueryClient();

const criar = useMutation({
  mutationFn: (dados: ObraEntrada) =>
    api<Obra>("/obras/", { method: "POST", body: JSON.stringify(dados) }),
  onSuccess: (obra) => {
    queryClient.invalidateQueries({ queryKey: ["obras"] });
    queryClient.setQueryData(["obra", obra.id], obra);
  },
  onError: (erro) => { ... },
});

criar.mutate(dados);                    // dispara e segue
const obra = await criar.mutateAsync(dados);   // espera o resultado
criar.isPending / isError / isSuccess / error / reset()
```

### Invalidação

```tsx
queryClient.invalidateQueries({ queryKey: ["obras"] });                  // e derivadas
queryClient.invalidateQueries({ queryKey: ["obras"], exact: true });     // só essa
queryClient.setQueryData(["obra", id], novosDados);                       // atualiza direto
queryClient.removeQueries({ queryKey: ["obra", id] });                    // remove
```

### Atualização otimista

```tsx
useMutation({
  mutationFn: devolver,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["emprestimos"] });
    const anterior = queryClient.getQueryData(["emprestimos"]);
    queryClient.setQueryData(["emprestimos"], (v) => /* estado otimista */);
    return { anterior };
  },
  onError: (_e, _v, ctx) => queryClient.setQueryData(["emprestimos"], ctx.anterior),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["emprestimos"] }),
});
```

## Hook de query (padrão do projeto)

```tsx
// src/hooks/useObras.ts
export function useObras({ termo = "", pagina = 1 }) {
  return useQuery({
    queryKey: ["obras", { termo, pagina }],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ page: String(pagina) });
      if (termo) p.set("search", termo);
      return api<Paginado<Obra>>(`/obras/?${p}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}
```

## Zod

```ts
import { z } from "zod";

const schema = z.object({
  titulo: z.string().min(1, "Obrigatório").max(200).trim(),
  email: z.string().email("E-mail inválido"),
  idade: z.coerce.number().int().min(0).max(120),
  ativo: z.boolean().default(true),
  papel: z.enum(["ASSOCIADO", "BIBLIOTECARIO"]),
  nascimento: z.coerce.date().max(new Date(), "Não pode ser futura"),
  opcional: z.string().optional(),
  anulavel: z.string().nullable(),
  lista: z.array(z.number()).min(1, "Selecione ao menos um"),
});

// transformação e validação customizada
z.string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");

// entre campos
z.object({ inicio: z.coerce.date(), fim: z.coerce.date() })
  .refine((d) => d.fim >= d.inicio, { message: "Fim antes do início", path: ["fim"] });

type Entrada = z.infer<typeof schema>;     // o tipo sai do esquema
schema.parse(dados);                        // lança se inválido
schema.safeParse(dados);                    // { success, data | error }
```

## React Hook Form

```tsx
const {
  register, handleSubmit, setError, reset, watch, control,
  formState: { errors, isSubmitting, isDirty, isValid },
} = useForm<Entrada>({
  resolver: zodResolver(schema),
  defaultValues: { titulo: "", ativo: true },
  mode: "onBlur",
});

<form onSubmit={handleSubmit(aoEnviar)} noValidate>
  <input {...register("titulo")} />
  {errors.titulo && <p role="alert">{errors.titulo.message}</p>}
  <button type="submit" disabled={isSubmitting}>Salvar</button>
</form>

const valor = watch("titulo");         // observa um campo
reset(novosValores);                   // repõe o formulário
```

### Mapear erros do DRF para o formulário ⭐

```tsx
catch (e) {
  if (e instanceof ApiError && e.status === 400) {
    for (const [campo, msgs] of Object.entries(e.dados as Record<string, string[]>)) {
      setError(campo === "non_field_errors" ? "root" : (campo as keyof Entrada), {
        message: msgs.join(" "),
      });
    }
  } else {
    setError("root", { message: "Não foi possível salvar." });
  }
}
```

### Campo controlado (select, date picker)

```tsx
import { Controller } from "react-hook-form";

<Controller
  name="autor"
  control={control}
  render={({ field, fieldState }) => (
    <Select {...field} erro={fieldState.error?.message} opcoes={autores} />
  )}
/>
```

## Tipos do OpenAPI

```bash
npm run gerar:schema      # escreve backend/openapi.json
npx openapi-typescript schema.yml -o src/api/schema.d.ts
```

```ts
import type { components } from "./api/schema";
export type Obra = components["schemas"]["Obra"];
```

```json
{ "scripts": { "tipos": "openapi-typescript schema.yml -o src/api/schema.d.ts" } }
```

## Hook de debounce

```tsx
export function useDebounce<T>(valor: T, ms = 400): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}
```

## Anti-padrões

| ❌ | ✅ |
|---|---|
| `useEffect` + `useState` para buscar | `useQuery` |
| Copiar `data` para `useState` | Usar `data` direto |
| `queryKey: ["obras"]` com filtros variáveis | Incluir os filtros na chave |
| Mutação sem `invalidateQueries` | Invalidar o que mudou |
| Validar só no cliente | Validar também no DTO de saída |
| Ignorar o corpo do 400 | Mapear campo a campo |
| Tipos escritos à mão | Gerar do OpenAPI |
| `mutate` quando precisa do retorno | `mutateAsync` |
| Formulário sem `noValidate` | Evita conflito com a validação nativa |
