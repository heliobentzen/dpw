# M11 — Contrato OpenAPI versionado e tipos gerados

> **Pré-requisitos:** M07, M10 · **Duração:** curta · **Semana:** 13
> **Ementa:** *Criação de interfaces com o usuário* — ver [ADR-02](../../docs/decisoes-tecnicas.md#adr-02--o-item-templates-da-ementa)
> **No projeto:** o `openapi.json` vira verificação no CI, e um cliente prova que o contrato basta · P3 (critério 2)

## Por que este módulo existe no projeto

Na semana 14 a API vai para o ar, e a organização (e quem um dia fizer um aplicativo para
ela) passa a depender do formato das respostas. Daí em diante, renomear um campo "só para
ficar mais bonito" quebra quem já usa — e a API continua respondendo `200`, então ninguém
percebe até alguém reclamar.

Este módulo transforma o contrato em algo que **o CI confere**: toda mudança no formato da
API aparece no PR, para ser revisada como mudança de código. E um pequeno cliente gerado
**só a partir do contrato** revela onde a documentação está incompleta — exatamente o que a
P3 avalia no critério "API e contrato".

## 🎯 Ao final do módulo

1. O `openapi.json` está versionado e o CI falha se ele divergir do código.
2. A equipe sabe dizer se uma mudança de contrato é compatível ou não.
3. Um cliente tipado, gerado do contrato, compila e chama a API do cenário principal.

---

## 📖 Conceitos

### 1. O contrato em duas formas

Pense no **padrão de tomadas**: fabricante de geladeira e fabricante de tomada não se
conhecem, e tudo encaixa porque ambos seguem a norma.

| | `/api/docs` (Swagger UI) | `openapi.json` |
| --- | --- | --- |
| Analogia | A vitrine | A planta do prédio |
| Para quem | Pessoas explorando | Programas: CI, geradores de código |
| Dá para comparar versões? | Não | Sim, com `git diff` |

### 2. Compatível ou incompatível

A pergunta de todo diff de contrato: **um cliente que já existe continua funcionando?**

| Mudança | Compatível? |
| --- | --- |
| Acrescentar campo na resposta, rota nova, campo **opcional** na entrada | ✅ |
| Renomear ou remover campo da resposta | ❌ quem lia passa a receber `undefined` |
| Tornar obrigatório um campo de entrada | ❌ requisições que funcionavam viram `400` |
| Mudar o tipo de um campo (`1899` → `"1899"`) | ❌ |

Para uma mudança incompatível, três caminhos honestos: **expandir e contrair** (devolver o
nome antigo e o novo por um tempo, com `@ApiProperty({ deprecated: true })` no antigo — o
mesmo raciocínio do M05), **nova versão** (`/api/v2/...`), ou **não fazer** (mais vezes do
que parece).

### 3. Validar a entrada ≠ anunciar o contrato

Os decorators do `class-validator` **garantem** a entrada; os do Swagger **anunciam** o
contrato. São duas coisas, e a rota funciona mesmo quando a segunda falta. Dois furos
clássicos, que só um consumidor rigoroso encontra:

| Furo | Sintoma no contrato | Correção |
| --- | --- | --- |
| DTO de query sem `@ApiPropertyOptional` | A rota "não aceita" `?pagina=` | Decorator em todo campo, inclusive da query |
| Campo `number \| null` | O tipo vira `{} \| null` | `@ApiProperty({ type: Number, nullable: true })` |

---

## 🧩 No projeto da equipe

### Passo 1 — Regerar e ler o diff

Com o banco no ar:

```bash
cd backend
npm run gerar:schema
git diff --stat openapi.json
```

O arquivo mudou bastante desde o M07 (login, usuários, segurança). Leiam o diff juntos e
commitem **sozinho**: `docs(api): atualiza o contrato OpenAPI`.

### Passo 2 — O contrato no CI

Em `backend/package.json`:

```json
"contrato:verificar": "npm run gerar:schema && git diff --exit-code openapi.json"
```

No `.github/workflows/ci.yml` do M10, depois das migrações:

```yaml
      - name: Contrato OpenAPI em dia
        run: npm run contrato:verificar -w backend
```

**Deu certo se** mudar a descrição de um `@ApiProperty` sem regerar o schema deixa o CI
vermelho. A partir daqui, **todo PR que muda o formato da API mostra o diff do
`openapi.json`**, e o revisor responde: é compatível?

### Passo 3 — Um pacote de tipos gerado do contrato

Na raiz, o pacote que o M00 deixou declarado no workspace:

```bash
mkdir -p pacotes/tipos/src pacotes/tipos/exemplos     # 🪟 New-Item -ItemType Directory pacotes\tipos\src, pacotes\tipos\exemplos
```

`pacotes/tipos/package.json`:

```json
{
  "name": "@projeto/tipos",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "types": "./src/api.d.ts",
  "scripts": {
    "gerar": "openapi-typescript ../../backend/openapi.json -o src/api.d.ts",
    "verificar": "tsc --noEmit"
  }
}
```

`pacotes/tipos/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023", "module": "nodenext", "moduleResolution": "nodenext",
    "strict": true, "noEmit": true, "allowImportingTsExtensions": true, "skipLibCheck": true
  },
  "include": ["src", "exemplos"]
}
```

```bash
npm install -D openapi-typescript typescript@5 -w @projeto/tipos
npm install openapi-fetch -w @projeto/tipos
npm run gerar -w @projeto/tipos
```

O `src/api.d.ts` é **gerado**: não o editem. Ele vai para o Git para que um cliente compile
sem rodar o backend.

### Passo 4 — Um consumidor que só conhece o contrato

`pacotes/tipos/exemplos/cenario-principal.ts` — o cenário principal da P1, chamado como um
cliente externo chamaria:

```ts
import createClient from "openapi-fetch";
import type { paths } from "../src/api.d.ts";

const api = createClient<paths>({ baseUrl: process.env.API_URL ?? "http://localhost:3000" });

const { data, response } = await api.GET("/api/<recurso>", {
  params: { query: { pagina: 1, tamanho: 5 } },
});
if (!data) {
  console.error(`Falhou com ${response.status}`);
  process.exit(1);
}
for (const item of data.itens) console.log(item);   // escreva um campo errado e veja o editor sublinhar
console.log(`${data.itens.length} de ${data.total}`);
```

```bash
npm run verificar -w @projeto/tipos
```

**É provável que falhe** — e quem está errado é o contrato, não o cliente. Corrijam os furos
da tabela do conceito 3 em **todos** os DTOs e repitam a sequência:

```bash
npm run gerar:schema -w backend
npm run gerar -w @projeto/tipos
npm run verificar -w @projeto/tipos
```

**Deu certo se** o `verificar` passa e o exemplo, com a API no ar, imprime dados reais (o
Node 24 executa TypeScript direto, removendo os tipos):

```bash
node pacotes/tipos/exemplos/cenario-principal.ts
```

Acrescentem `npm run verificar -w @projeto/tipos` ao CI, depois do `contrato:verificar`.

### Passo 5 — Quebrar de propósito

Renomeiem um campo do DTO de saída do recurso principal, regerem tudo e vejam o efeito em
cadeia: o diff do `openapi.json`, o CI vermelho, o erro de compilação no exemplo. **Esse é o
caminho que uma mudança incompatível percorre antes de chegar à organização.** Desfaçam.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
| --- | --- |
| `gerar:schema` falha com erro de conexão | O banco não está no ar (o `AppModule` conecta ao subir) |
| O CI falha em `contrato:verificar` sem mudança aparente | Alguém mudou um decorator e não regerou; rode e commite |
| `Type '{ ... }' is not assignable to type 'undefined'` na query | DTO de query sem `@ApiPropertyOptional` |
| Campo numérico vira `{}` | União com `null` sem `type` explícito |
| `Cannot find module '../src/api.d.ts'` | Faltou rodar o `gerar` do pacote |

## 🤖 IA no fluxo

Cole um diff de `openapi.json` e pergunte *"esta mudança quebra algum cliente existente?"*.
A resposta é boa ponto de partida; a decisão de quebrar, versionar ou desistir depende de
quem usa a API — e isso só a equipe sabe.

## ✅ Marco do módulo

- [ ] `openapi.json` atualizado e versionado; `contrato:verificar` no CI
- [ ] `pacotes/tipos` gerado do contrato; o exemplo do cenário principal compila e roda
- [ ] Furos do contrato corrigidos em todos os DTOs (query e campos anuláveis)
- [ ] A equipe sabe classificar uma mudança como compatível ou incompatível

## 📚 Para aprofundar

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [openapi-typescript](https://openapi-ts.dev/) · [openapi-fetch](https://openapi-ts.dev/openapi-fetch/)
- [NestJS — OpenAPI types and parameters](https://docs.nestjs.com/openapi/types-and-parameters)
