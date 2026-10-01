# M11 — Exercícios

## E11.1 — Revisão de contrato (individual) ⭐

Faça as quatro mudanças abaixo, **uma de cada vez**, regerando o contrato e lendo o *diff*
depois de cada uma. Desfaça antes da próxima.

| # | Mudança | O *diff* mostrou | Compatível? | O que você faria |
|---|---|---|---|---|
| 1 | Acrescentar `subtitulo` ao `ObraResumo` | | | |
| 2 | Tornar `anoPublicacao` obrigatório no `CriarObraDto` | | | |
| 3 | Trocar o `@Max(100)` do `tamanho` por `@Max(50)` | | | |
| 4 | Mudar o `POST /api/sessao` de `200` para `201` | | | |

O caso 3 é o traiçoeiro: o formato não mudou, mas um cliente que pedia `tamanho=100` passa a
receber `400`. Mudança de **regra** também é mudança de contrato.

---

## E11.2 — Consumidor só pelo contrato (individual)

Escolha uma rota de escrita (por exemplo, `POST /api/obras`). Usando **só** o Swagger UI ou o
`openapi.json`, sem abrir o código do backend:

1. Escreva os `curl.exe` do caminho feliz e de dois erros diferentes.
2. Confira se o status e o formato de cada resposta batem com o que o contrato promete.
3. Se algum erro **não** estiver no contrato, acrescente o `@ApiXxxResponse` que falta.

---

## E11.3 — Um segundo cliente tipado (individual)

Em `pacotes\tipos\exemplos\`, escreva `criar-obra.ts`, que faz login e cria uma obra com o
`openapi-fetch`.

**Verificação:**

- [ ] O corpo do `POST` é conferido pelo compilador (tente enviar `autorID` com maiúscula)
- [ ] O cookie do login é enviado na segunda requisição (dica: o `fetch` do Node não guarda
      cookies sozinho — leia o `set-cookie` da primeira resposta)
- [ ] O `npm run verificar` passa

---

## E11.4 — Obsoleto com prazo (em duplas)

Implementem a troca de `autor` por `nomeAutor` no `ObraResumo` pelo caminho
**expandir → contrair**:

1. Versão A do contrato: os dois campos, `autor` com `deprecated: true`.
2. Atualizem o cliente de exemplo para `nomeAutor`.
3. Versão B: só `nomeAutor`.

Respondam: entre a versão A e a B, quanto tempo vocês dariam a um consumidor que não
conhecem? Como ele ficaria sabendo da mudança?

---

## Gabarito parcial

**E11.1** — 1: compatível (campo novo na resposta). 2: incompatível (requisições sem o ano
passam a falhar). 3: incompatível para quem usava valores entre 51 e 100. 4: em tese
incompatível — clientes que conferem `=== 200` passam a tratar o login como erro —, e sem
ganho real: não vale a mudança.

**E11.3** — O `openapi-fetch` aceita cabeçalhos por requisição: pegue o
`response.headers.get("set-cookie")` do login e envie o par `nome=valor` no cabeçalho
`Cookie` das seguintes.
