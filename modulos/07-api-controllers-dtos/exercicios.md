# M07 — Exercícios

## E07.1 — Corrigir o desenho da API (individual)

| # | Rota errada | Correta | Por quê |
|---|---|---|---|
| 1 | `POST /api/criarObra` | | |
| 2 | `GET /api/obras/deletar/42` | | |
| 3 | `GET /api/buscarObrasPorAutor?id=3` | | |
| 4 | `POST /api/obras/42/atualizar` | | |
| 5 | `GET /api/obras/todas` | | |
| 6 | `DELETE /api/obras?id=42` | | |
| 7 | `POST /api/login` devolvendo 200 com `{"erro":"senha inválida"}` | | |

O caso 2 é o mais grave: `GET` não pode ter efeito colateral. Explique o que acontece quando
um *crawler* ou o *prefetch* do navegador percorre essa URL.

---

## E07.2 — Status corretos (individual)

| Situação | Status |
|---|---|
| `POST /obras` com sucesso | |
| `POST /obras` com título vazio | |
| `GET /obras/9999` inexistente | |
| `DELETE /obras/42` com sucesso | |
| `POST /exemplares` com tombo repetido | |
| `PATCH /obras/42` sem estar autenticado | |
| `PATCH /obras/42` autenticado, mas sem permissão | |
| Empréstimo recusado por limite de 3 em aberto | |
| Erro inesperado no servidor | |

Os dois últimos merecem discussão: 422 ou 400? 500 vaza informação?

---

## E07.3 — DTOs completos (individual) ⭐

Escreva `CriarExemplarDto`, `AtualizarExemplarDto` e `ExemplarResposta`:

- `tombo`: obrigatório, 3 a 20 caracteres, só maiúsculas, números e hífen
- `estado`: um dos valores do enum
- `obraId`: inteiro obrigatório
- `adquiridoEm`: data ISO, opcional, **não pode ser futura**

**Verificação:**
- [ ] `tombo` inválido responde 400 com mensagem útil
- [ ] Data futura é recusada (exige validador customizado ou `@MaxDate`)
- [ ] `AtualizarExemplarDto` usa `PartialType`
- [ ] A resposta traz o título da obra, não o `obraId` cru
- [ ] Todos aparecem no `/api/docs`

---

## E07.4 — Mass assignment (individual) ⚠️

1. Desligue `whitelist` do `ValidationPipe`.
2. Envie `{"titulo":"X","autorId":1,"criadoEm":"1999-01-01","destaque":true}`.
3. Confira o banco: o que foi gravado?
4. Religue `whitelist: true` e repita.
5. Ligue `forbidNonWhitelisted: true` e repita.

| Configuração | O que aconteceu com `destaque` | Status |
|---|---|---|
| Sem `whitelist` | | |
| `whitelist` | | |
| `whitelist` + `forbidNonWhitelisted` | | |

Responda: por que **recusar** é melhor que **ignorar em silêncio**?

---

## E07.5 — Vazamento na resposta (individual) ⚠️

1. Faça um endpoint que devolva a entidade `Associado` **direto**, sem DTO.
2. Liste os campos que apareceram e que **não** deveriam ser públicos.
3. Corrija com DTO de saída.
4. Responda: se `Associado` ganhar um campo `documento` no M12, o que acontece em cada
   versão?

O item 4 é o argumento central: sem DTO, **toda coluna nova vira campo público
automaticamente**, sem ninguém decidir.

---

## E07.6 — Ordem de rotas (individual)

1. Acrescente `@Get("destaques")` **depois** de `@Get(":id")`.
2. Chame `/api/obras/destaques`. Anote o status e a mensagem.
3. Explique por que o erro é 400 e não 404.
4. Corrija e confirme.

---

## E07.7 — Paginação sem teto (em duplas)

1. Remova o `@Max(100)` do `tamanho`.
2. Chame `?tamanho=100000`. Meça o tempo e a memória.
3. Recoloque o teto.
4. Respondam: por que isto é um problema de **segurança**, e não só de desempenho? Que
   nome tem esse tipo de ataque?

---

## E07.8 — O contrato como verificação (individual) ⭐

1. Gere e commite o `openapi.json`.
2. Mude o tipo de um campo num DTO.
3. Gere de novo. O `git diff` mostra a mudança?
4. Escreva o passo de CI que **falha** quando o arquivo commitado diverge do gerado.

> Este exercício é a ponte para o M15: quando o contrato é verificável, mudar a API sem
> avisar o frontend deixa de ser possível.

---

## Gabarito parcial

**E07.1** — 2: `DELETE /api/obras/42`. `GET` precisa ser *seguro* (sem efeito colateral):
navegadores fazem *prefetch*, *crawlers* seguem links e proxies cacheiam. Uma URL de exclusão
acessível por `GET` é apagada por quem só passou por perto. 7: erro de autenticação é **401**;
200 com `{"erro":...}` obriga o cliente a inspecionar o corpo para saber se deu certo.

**E07.2** — Limite de empréstimos: **422** (sintaxe correta, regra de negócio violada) é mais
preciso que 400, embora 400 seja aceito. Erro inesperado: **500**, com corpo genérico — o
traceback vai para o log, nunca para a resposta (M13).

**E07.4** — Sem `whitelist`, `destaque` e `criadoEm` são gravados: quem chama a API decide o
valor de campos que você nunca expôs. Recusar é melhor que ignorar porque o cliente descobre
o erro **na integração**, não seis meses depois quando notar que o campo nunca chegou.

**E07.7** — É negação de serviço: uma requisição barata para o atacante custa muito ao
servidor. Todo parâmetro que o cliente controla e que multiplica trabalho no servidor precisa
de teto.
