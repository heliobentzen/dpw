# M02 — Exercícios

## E02.1 — Escolher a arquitetura (individual)

Para cada sistema, escolha **MPA**, **SPA + API** ou **SSR híbrido** e justifique em 3
linhas, citando os requisitos que pesaram:

| # | Sistema | Escolha | Justificativa |
|---|---|---|---|
| 1 | Portal de notícias de um jornal local | | |
| 2 | Painel de monitoramento de sensores, atualizando a cada 2s | | |
| 3 | Site institucional de uma ONG (10 páginas, muda 2×/ano) | | |
| 4 | Sistema de gestão de biblioteca, com futuro app para o celular do bibliotecário | | |
| 5 | Loja virtual que depende de aparecer no Google | | |
| 6 | Ferramenta interna de RH, atrás de login, usada por 30 pessoas | | |
| 7 | Editor de texto colaborativo | | |
| 8 | Formulário de inscrição em evento (uma tela, 12 campos) | | |

Armadilhas: 3 e 8 são os casos em que a SPA é claramente pior e a turma tende a escolhê-la
por hábito; 5 exige distinguir SPA pura de SSR.

---

## E02.2 — Corrigir um contrato ruim (individual)

Este contrato tem **pelo menos 10 problemas**. Aponte cada um e reescreva:

```
GET  /api/getAllObras
POST /api/obra/nova
GET  /api/obra?id=42
POST /api/obra/update
GET  /api/obra/delete/42
GET  /api/buscarObrasPorAutorEAno?autor=Machado&ano=1899
POST /api/emprestimo/criar
GET  /api/emprestimos/todos
```

Exemplos de resposta atuais:

```json
// GET /api/getAllObras
[ {"Id": 42, "Titulo": "Dom Casmurro", "dataCadastro": "11/08/2026",
   "preco": 39.9, "autor": "Machado de Assis"} ]

// erro de validação
{"erro": true, "mensagem": "deu ruim no titulo"}

// não autenticado
{"status": 200, "erro": "faça login"}
```

Considere: verbo na URL, plural, barra final, método errado, ausência de paginação,
`PascalCase`, data ambígua, dinheiro como float, relação como string livre, formato de erro
não estruturado e status mentiroso.

---

## E02.3 — Contrato do projeto da equipe (em equipe) ⭐

Escreva o contrato de API do **projeto da sua equipe** (tema definido na Etapa 1), em
`docs/contrato-api.md`:

1. Tabela de recursos: rota, método, o que faz, quem pode, status de sucesso e de erro.
2. JSON de exemplo para listagem e detalhe de **cada** recurso principal.
3. As 9 decisões do checklist do M02.
4. Formato padronizado de erro: validação, não autenticado (401), sem permissão (403), não
   encontrado (404).
5. Quais campos são somente-leitura e quais o cliente pode escrever.
6. Como se filtra, ordena, busca e pagina.

**Critério de aceite:** outra equipe consegue construir um frontend contra esse contrato
sem fazer nenhuma pergunta a vocês. Testem isso de verdade — troquem os documentos.

---

## E02.4 — Os quatro estados (individual)

Escolha três telas do BiblioCom e descreva, para cada uma, o que o usuário vê em cada
estado:

| Tela | Carregando | Vazio | Com conteúdo | Erro |
|---|---|---|---|---|
| Lista de obras | | | | |
| Detalhe da obra | | | | |
| Meus empréstimos | | | | |

Para "erro", distinga: rede indisponível, 401 (sessão expirou), 403 (sem permissão), 404
(não existe) e 500 (falha do servidor). O usuário precisa ver mensagens **diferentes** — e
saber o que fazer em cada caso.

---

## E02.5 — O contrato quebrado (em duplas)

Simule o problema que a arquitetura desacoplada cria:

1. Pessoa A escreve, em papel, um JSON de resposta de `/api/obras/42/`.
2. Pessoa B escreve, sem ver o de A, o código do cliente que consome esse JSON.
3. Comparem. Quantas divergências? Nome de campo, tipo, formato de data, aninhamento?
4. Repitam com o contrato escrito e visível para os dois.
5. Agora: A renomeia um campo sem avisar. Quanto tempo B levaria para descobrir, se o
   código compilasse normalmente?

**Entrega:** as divergências encontradas + resposta em 5 linhas: *quais mecanismos deste
curso previnem cada tipo de divergência?* (dica: contrato escrito, OpenAPI, tipos gerados,
teste de contrato)

---

## E02.6 — Custo da arquitetura (individual, discursivo)

Leia o [ADR-09](../../docs/decisoes-tecnicas.md#adr-09--o-custo-em-carga-horária) e
responda:

1. Quais conteúdos foram removidos para caber React e Tailwind?
2. Cite **duas** competências que um estudante da versão anterior (Django + templates)
   teria e você não terá.
3. Cite **duas** que você terá e essa pessoa não teria.
4. Se você fosse coordenar a disciplina, faria a mesma escolha? Justifique em 5 linhas,
   considerando o perfil de emprego da sua região.

Não há resposta certa. Há resposta fundamentada e resposta vazia.

---

## Gabarito parcial

**E02.1 (3)** — MPA, ou até site estático. Dez páginas que mudam duas vezes por ano em SPA
significa baixar um *bundle* de JavaScript para exibir texto que poderia vir pronto,
perdendo SEO e acessibilidade em troca de nada.

**E02.1 (4)** — SPA + API. O requisito decisivo é o app futuro: a mesma API serve os dois
clientes. Sem esse requisito, MPA seria defensável.

**E02.2** — `GET /api/getAllObras` → `GET /api/obras/` (verbo no método, recurso no plural,
barra final) e precisa de paginação: uma lista sem `count`/`next` quebra quando o acervo
crescer. `GET /api/obra/delete/42` é o pior caso: exclusão por GET, que qualquer
pré-carregador do navegador dispara (M01). `{"status": 200, "erro": "faça login"}` mente no
status — deveria ser **401**, e o cliente decide pelo status, não pelo corpo.
