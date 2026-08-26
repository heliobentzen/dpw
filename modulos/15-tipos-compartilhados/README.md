# M15 — Tipos compartilhados entre as camadas

> **CH:** 2h (1h teórica · 1h prática) · **Semana 15** · **Pré-requisitos:** M07, M11, M14

O módulo que **só existe nesta stack**. Backend e frontend falam a mesma linguagem — então
podem compartilhar as definições, e o compilador passa a vigiar a fronteira entre eles.

> Por que este módulo existe no lugar de um back-office pronto:
> [ADR-12](../../docs/decisoes-tecnicas.md#adr-12--back-office-construído-não-herdado).

## 🎯 Objetivos

Ao final você será capaz de:

1. Explicar por que a fronteira entre camadas é onde bugs se escondem.
2. Publicar um pacote interno consumido pelas duas camadas.
3. Gerar tipos do frontend a partir do contrato OpenAPI do backend.
4. Fazer o CI falhar quando as camadas saem de sincronia.

---

## 📖 Teoria (1h)

### 1. O bug que nenhum teste pega

Na quinta-feira, alguém renomeia um campo no backend:

```ts
// antes                          // depois
@Column() anoPublicacao: number;  @Column() ano: number;
```

O que acontece:

| Camada | Resultado |
|---|---|
| Testes do backend | ✅ verdes — foram atualizados junto |
| Testes do frontend | ✅ verdes — o MSW devolve o *mock* antigo |
| `tsc --noEmit` do frontend | ✅ passa — o tipo local ainda diz `anoPublicacao` |
| CI | ✅ **tudo verde** |
| Produção | ❌ a tela mostra `undefined` |

**Cada camada está certa isoladamente, e o sistema está quebrado.** É o modo de falha
característico de arquitetura desacoplada, e nenhum teste unitário o encontra — porque o
erro não está *dentro* de nenhuma camada, está *entre* elas.

### 2. Três formas de tratar a fronteira

| Estratégia | Como funciona | Problema |
|---|---|---|
| **Confiança** | O frontend declara suas interfaces à mão | Divergem em silêncio. É o caso acima |
| **Documentação** | Uma planilha ou wiki descreve o contrato | Desatualiza na primeira sexta-feira |
| **Verificação** ⭐ | O tipo do frontend é **derivado** do backend, e o CI confere | É o que faremos |

A diferença é categórica: nas duas primeiras a sincronia depende de disciplina humana; na
terceira, de compilador.

### 3. O que compartilhar — e o que não

```
pacotes/tipos/
├── src/
│   ├── api.d.ts        gerado do OpenAPI — NÃO editar à mão
│   ├── enums.ts        escrito à mão: Papel, EstadoExemplar, SituacaoEmprestimo
│   └── regras.ts       escrito à mão: constantes e validações puras
└── package.json
```

| Compartilhar | Não compartilhar |
|---|---|
| Tipos de requisição e resposta | Entidades do TypeORM (arrastam o ORM para o navegador) |
| Enums de domínio | Services, controllers, repositórios |
| Constantes de negócio (`LIMITE_EMPRESTIMOS = 3`) | Qualquer coisa que toque banco, arquivo ou rede |
| Funções puras de validação | Segredo, configuração, chave |

> ⚠️ **A tentação é compartilhar a entidade.** Não faça: ela traz decorators do TypeORM,
> referências circulares e código que só faz sentido no servidor. O que atravessa a
> fronteira é o **formato dos dados**, não o modelo de domínio.

### 4. Duas fontes, dois mecanismos

| O que | De onde vem | Como se mantém correto |
|---|---|---|
| `api.d.ts` | **Gerado** do `openapi.json` (M07) | Regerar; o CI compara com o commitado |
| `enums.ts`, `regras.ts` | **Escritos** à mão, uma vez | O backend os importa — divergir não compila |

O segundo caso é o mais elegante: se o backend **importa** `Papel` do pacote compartilhado,
não existe "o enum do backend" e "o enum do frontend". Existe um, e os dois usam.

```ts
// pacotes/tipos/src/enums.ts
export enum Papel { ASSOCIADO = "associado", BIBLIOTECARIO = "bibliotecario", COORDENACAO = "coordenacao" }

// backend/src/contas/entidades/usuario.entity.ts
import { Papel } from "@bibliocom/tipos";
@Column({ type: "enum", enum: Papel }) papel: Papel;

// frontend/src/components/MenuAdmin.tsx
import { Papel } from "@bibliocom/tipos";
if (usuario.papel === Papel.COORDENACAO) { … }
```

Um valor digitado errado no frontend — `"coordenaçao"` — deixa de compilar. Antes, viraria
um menu que nunca aparece e ninguém entende por quê.

💼 **No mercado:** isto é o argumento central de stacks TypeScript ponta a ponta, e o motivo
de ferramentas como tRPC existirem. Em entrevista, "como vocês garantiam que front e back
não divergiam?" é uma pergunta que a maioria responde com "a gente conversava".

---

## 🛠️ Roteiro prático (1h)

### Passo 1 — Criar o pacote (15 min)

```bash
cd ~/dev/bibliocom
mkdir -p pacotes/tipos/src
```

`pacotes/tipos/package.json`:

```json
{
  "name": "@bibliocom/tipos",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "gerar": "openapi-typescript ../../backend/openapi.json -o src/api.d.ts"
  }
}
```

| Campo | O que faz |
|---|---|
| `@bibliocom/tipos` | O `@escopo/` marca que é um pacote interno, não do npm |
| `"private": true` | Impede publicação acidental |
| `main`/`types` apontando para `.ts` | Sem passo de build: os consumidores compilam o fonte. Simples e suficiente para o monorepo |

O `pnpm-workspace.yaml` do M03 já inclui `pacotes/*`. Ligue as camadas:

```bash
pnpm --filter backend  add @bibliocom/tipos --workspace
pnpm --filter frontend add @bibliocom/tipos --workspace
```

`--workspace` faz o pnpm resolver o pacote **localmente**, por link, em vez de procurar no
registro público.

### Passo 2 — Enums compartilhados (15 min)

`pacotes/tipos/src/enums.ts`:

```ts
export enum Papel {
  ASSOCIADO = "associado",
  BIBLIOTECARIO = "bibliotecario",
  COORDENACAO = "coordenacao",
}

export enum EstadoExemplar {
  NOVO = "novo", BOM = "bom", DESGASTADO = "desgastado", DESCARTADO = "descartado",
}

export const LIMITE_EMPRESTIMOS_ABERTOS = 3;
export const DIAS_DE_EMPRESTIMO = 14;
```

`pacotes/tipos/src/index.ts`:

```ts
export * from "./enums";
export * from "./api";
```

Agora **apague** as definições duplicadas do backend e do frontend, e importe daqui.

**Deu certo se:** `pnpm --filter backend tsc --noEmit` continua limpo depois de você trocar
o enum local pelo importado — e quebra se você digitar `Papel.COORDENACAOO`.

⚠️ Repare que `LIMITE_EMPRESTIMOS_ABERTOS` agora é **um só número** para as duas camadas. A
regra do M06 (recusar o quarto empréstimo) e a mensagem que o frontend mostra ("você já tem
3 empréstimos") não podem mais discordar.

### Passo 3 — Gerar os tipos da API (20 min)

```bash
pnpm --filter @bibliocom/tipos add -D openapi-typescript
cd backend && pnpm gerar:schema        # escreve openapi.json (M07)
cd .. && pnpm --filter @bibliocom/tipos gerar
```

Abra `pacotes/tipos/src/api.d.ts`: cada rota, cada DTO, cada campo — derivados do backend.

Use no frontend:

```ts
import type { components } from "@bibliocom/tipos";

type Obra = components["schemas"]["ObraResposta"];

export async function buscarObra(id: number): Promise<Obra> {
  return api.get<Obra>(`/obras/${id}`);
}
```

> Acrescente `api.d.ts` a uma linha de exclusão do ESLint e **nunca o edite à mão**. Arquivo
> gerado que alguém editou é a pior categoria de bug: a próxima geração apaga a correção.

### Passo 4 — Provar que funciona (10 min) ⭐

Este é o passo que justifica o módulo. Faça o experimento:

1. No backend, renomeie `anoPublicacao` para `ano` no `ObraResposta`.
2. Rode `pnpm gerar:schema` e regenere os tipos.
3. Rode `pnpm --filter frontend tsc --noEmit`.

**Deu certo se:** o TypeScript aponta o erro, com nome de arquivo e linha, em cada lugar do
frontend que usava o campo antigo.

Compare com o que teria acontecido antes deste módulo: nada. Tudo verde, e a tela quebrada
em produção.

Reverta a mudança ao final.

### Passo 5 — O CI como guardião (10 min)

O experimento acima só protege quem lembrar de rodar os comandos. Torne isso obrigatório —
acrescente ao job do frontend no `ci.yml` (M14):

```yaml
      - name: Tipos sincronizados com a API
        run: |
          pnpm --filter @bibliocom/tipos gerar
          git diff --exit-code pacotes/tipos/src/api.d.ts
```

`git diff --exit-code` sai com erro se houver qualquer diferença. Traduzindo: **se você
mudou a API e não regerou os tipos, o CI falha e o PR não passa.**

**Deu certo se:** você mudar um DTO, commitar sem regerar, e o CI ficar vermelho.

---

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `Cannot find module '@bibliocom/tipos'` | Faltou `--workspace` no `add`, ou um `pnpm install` na raiz |
| Mudanças no pacote não aparecem | O editor está com cache; reinicie o servidor de TypeScript do VS Code |
| `api.d.ts` gerado vazio | O `openapi.json` está desatualizado ou os DTOs não têm `@ApiProperty` (M07) |
| CI falha em `git diff` sem ninguém ter mexido | O `openapi.json` não foi commitado junto com a mudança do DTO |
| Import do pacote arrasta o TypeORM para o frontend | Você exportou uma **entidade** em vez de um tipo. Ver seção 3 |
| Enum duplicado voltou a divergir | Alguém redeclarou localmente em vez de importar |

## ✅ Checklist de saída

- [ ] `@bibliocom/tipos` criado e ligado às duas camadas por workspace
- [ ] Enums e constantes de negócio **importados** pelas duas, sem duplicata
- [ ] `api.d.ts` gerado do `openapi.json`, nunca editado à mão
- [ ] O frontend usa os tipos gerados no cliente de API
- [ ] Nenhuma entidade do TypeORM atravessa a fronteira
- [ ] Experimento do Passo 4 executado — você **viu** o compilador acusar
- [ ] Verificação de contrato no CI, e você a viu falhar de propósito

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [pnpm workspaces](https://pnpm.io/workspaces)
- [openapi-typescript](https://openapi-ts.dev/)
- [NestJS — OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [TypeScript — declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
