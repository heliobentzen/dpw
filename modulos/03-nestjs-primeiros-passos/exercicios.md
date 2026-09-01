# M03 — Exercícios

## E03.1 — Onde mora cada código (individual)

Para cada trecho, diga se pertence ao **Controller**, ao **Service** ou a **nenhum dos dois**,
e justifique com o critério da etapa 10a (*"mudaria se rodasse por linha de comando?"*).

| # | Código | Camada | Justificativa |
|---|---|---|---|
| 1 | Converter `:id` da URL em número | | |
| 2 | Recusar empréstimo a quem já tem 3 em aberto | | |
| 3 | Responder 404 quando a obra não existe | | |
| 4 | Calcular a data de devolução (14 dias) | | |
| 5 | Ler o cabeçalho `Authorization` | | |
| 6 | Enviar e-mail de aviso de atraso | | |
| 7 | Definir que a resposta do POST é 201 | | |
| 8 | Decidir que obra sem exemplar não pode ser emprestada | | |

**Verificação:** 3 é pegadinha — o *service* **lança** `NotFoundException`, o framework
traduz para 404. Ninguém escreve o número.

---

## E03.2 — Injeção de dependência na marra (individual)

Escreva `NotificacaoService` com um método `avisar(mensagem: string)` que só faz
`console.log`. Injete-o no `AcervoService` e chame-o dentro de `listar()`.

Depois responda por escrito:

1. Quantas instâncias de `NotificacaoService` existem na aplicação? Como você provaria isso?
2. O que aconteceria se você removesse o `@Injectable()` da classe?
3. O que aconteceria se você a removesse de `providers` do módulo?

**Verificação:** para (1), coloque um `console.log` no construtor e conte as linhas ao subir.
Para (2) e (3), a mensagem de erro é diferente em cada caso — anote as duas.

---

## E03.3 — Um módulo do zero, sem CLI (individual) ⭐

Crie o módulo `associados` **à mão**, sem `nest generate`: os três arquivos e os registros.
Endpoints: `GET /api/associados` e `GET /api/associados/:id`, com dados em memória.

**Verificação:**
- [ ] `GET /api/associados` responde 200 com a lista
- [ ] `GET /api/associados/999` responde 404
- [ ] O `AssociadosModule` está em `imports` do `AppModule`
- [ ] O service está em `providers` do `AssociadosModule`

> Fazer à mão uma vez é o que ensina a ler o erro `Nest can't resolve dependencies` — que é
> quase sempre um destes dois registros faltando.

---

## E03.4 — Quebrar de propósito (individual)

Provoque cada erro, anote a **mensagem exata** e o que a causou:

| # | Provoque | Mensagem | O que ela indica |
|---|---|---|---|
| 1 | Remova o service de `providers` | | |
| 2 | Remova o `@Injectable()` | | |
| 3 | Declare `@Get(":id")` antes de `@Get("destaques")` e chame `/obras/destaques` | | |
| 4 | Retorne `undefined` de um handler | | |
| 5 | Suba dois servidores na mesma porta | | |

O caso 3 volta no M07 como erro comum de ordenação de rotas. Guarde a anotação.

---

## E03.5 — Variável de ambiente (individual)

Acrescente `NOME_BIBLIOTECA` ao `.env` e exponha `GET /api/info` devolvendo
`{ nome, ambiente }`, lendo do `ConfigService`.

**Verificação:**
- [ ] A chave está no `.env` **e** no `.env.example`
- [ ] O `.env` não aparece em `git status`
- [ ] Mudar o valor e **reiniciar** muda a resposta
- [ ] Mudar sem reiniciar **não** muda — e você sabe dizer por quê

---

## E03.6 — Ler o contrato (individual)

Abra `/api/docs` e responda:

1. Qual o tipo declarado da resposta de `GET /obras/:id`?
2. O 404 aparece documentado? Se não, por quê?
3. Que parte do seu código gerou cada informação da página?

---

## Gabarito parcial

**Experimento do `ParseIntPipe` (roteiro, etapa 11d)** — sem o pipe, o TypeScript continua
dizendo que `id` é `number`, mas em tempo de execução chega a **string** `"1"`. O
`find((o) => o.id === id)` compara `1 === "1"`, que é `false`, e a obra existente vira
**404**. Nenhum erro, nenhum aviso: o tipo declarado mentiu. É o caso clássico de por que
validar a entrada na fronteira, e não confiar na anotação de tipo.

**E03.1** — 1: Controller (`ParseIntPipe`). 2: Service. 3: Service lança, framework traduz.
4: Service. 5: Controller. 6: Service (ou um provider próprio). 7: Controller. 8: Service.

**E03.2** — (1) Uma só: o Nest cria *singletons* por módulo. (2) Sem `@Injectable()` a classe
não tem metadados de injeção; o erro aparece ao resolver as dependências **dela**. (3) Sem
estar em `providers`, o Nest não a conhece: `Nest can't resolve dependencies of the
AcervoService (?)` — o `?` marca a posição do parâmetro não resolvido.

**E03.4** — 3: `/obras/destaques` casa com `:id`, e o `ParseIntPipe` responde **400**, não 404.
Erro de ordenação se manifesta como erro de validação, o que confunde. 4: o Nest responde
200 com corpo vazio — não é erro, e é pior por isso.

**E03.6** — 2: só aparece se houver `@ApiNotFoundResponse`. Swagger documenta o que o código
**declara**, não o que ele faz.
