# M14 — Exercícios

## E12.1 — Escrever o teste que falta (individual)

Para cada regra do BiblioCom, escreva o teste **e** verifique que ele falha se você
quebrar a regra de propósito (mutação):

| # | Regra | Teste | Mutação para verificar |
|---|---|---|---|
| 1 | Prazo padrão de 14 dias | | trocar para 15 |
| 2 | Limite de 3 empréstimos ativos | | trocar para 4 |
| 3 | Exemplar baixado nunca fica disponível | | remover a checagem |
| 4 | Associado inativo não pega emprestado | | remover a checagem |
| 5 | Devolução libera o exemplar | | não gravar `devolvido_em` |
| 6 | Dois empréstimos ativos do mesmo exemplar falham | | remover a constraint |

**Um teste que continua passando depois da mutação não está testando nada.** Este
exercício ensina a diferença entre ter testes e ter testes úteis.

---

## E12.2 — Parametrização (individual)

Reescreva estes 6 testes quase idênticos em **um** teste parametrizado:

```python
def test_isbn_13_digitos_valido(): ...
def test_isbn_10_digitos_valido(): ...
def test_isbn_com_hifens_valido(): ...
def test_isbn_curto_invalido(): ...
def test_isbn_com_letras_invalido(): ...
def test_isbn_vazio_valido(): ...
```

Depois acrescente 4 casos de borda que você não tinha pensado.

---

## E12.3 — Teste de controle de acesso (individual) ⭐

Transforme a matriz de acesso do M12 em teste parametrizado que cubra **todas** as
combinações papel × rota × método.

Requisitos:

- os papéis vêm de fixtures;
- inclui o caso "usuário autenticado acessando recurso de outro usuário";
- inclui GET e POST onde ambos existem;
- a mensagem de falha diz claramente qual combinação quebrou.

Prove que funciona: remova um `permission_required` e veja o teste falhar apontando a
rota certa.

---

## E12.4 — Bug → teste de regressão (individual)

1. Escolha um bug real que você encontrou no seu projeto (ou plante um).
2. Escreva **primeiro** o teste que o reproduz. Ele deve falhar.
3. Corrija o bug. O teste deve passar.
4. Commite os dois juntos: `fix(emprestimo): corrige X` com o teste no mesmo commit.

Este é o fluxo que impede que o mesmo bug volte na semana seguinte. Faça três vezes.

---

## E12.5 — Testar o que não é determinístico (individual)

Escreva testes para código que depende de tempo, sem depender do relógio real:

```ts
// Jest e Vitest têm relógio falso embutido — nenhuma dependência extra
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("empréstimo de 15/03 vence em 29/03", async () => {
  jest.setSystemTime(new Date("2026-03-15"));
  const e = await service.emprestar(exemplar.id, associado.id);
  expect(e.previsaoDevolucao).toEqual(new Date("2026-03-29"));
});

it("empréstimo de 15/03 está atrasado em 01/04", async () => {
  jest.setSystemTime(new Date("2026-03-15"));
  const e = await service.emprestar(exemplar.id, associado.id);

  jest.setSystemTime(new Date("2026-04-01"));
  expect(service.estaAtrasado(e)).toBe(true);
});
```

Cubra: empréstimo feito hoje, vencendo hoje, vencido ontem, vencido há 30 dias, e a
virada de mês/ano.

Responda: **por que um teste que usa `date.today()` real é uma bomba-relógio?**

---

## E12.6 — Cobertura honesta (individual)

1. Rode `pnpm test --coverage` e abra `coverage/lcov-report/index.html`.
2. Liste os 5 arquivos com menor cobertura.
3. Para cada um, decida: *precisa de teste ou não?* Justifique.
4. Escreva os testes que faltam nos que precisam.
5. Adicione o piso ao CI: `--coverageThreshold='{"global":{"lines":60}}'`.

Depois responda: **encontre um arquivo com 100% de cobertura e um bug.** (Se não achar,
crie um: escreva um teste que executa a linha mas não verifica o resultado.) O que isso
prova sobre a métrica?

---

## E12.7 — CI completo (em equipe)

Configure o pipeline do projeto da equipe com **todos** os estágios:

```
lint (eslint) → tsc --noEmit → migrações sem pendências → testes → cobertura →
contrato (tipos sincronizados) → build
```

Requisitos:

- roda em todo Pull Request;
- falha bloqueia o merge (branch protegida);
- badge de status no README;
- tempo total < 3 minutos (use cache de dependências);
- os testes rodam contra PostgreSQL, não SQLite (por quê?).

---

## E12.8 — Desafio: teste de ponta a ponta

Com Playwright, teste o fluxo completo pelo navegador:

```python
def test_fluxo_de_emprestimo(page, live_server, bibliotecario):
    page.goto(f"{live_server.url}/contas/login/")
    page.fill("#id_username", "bib")
    page.fill("#id_password", "senha-de-teste-123")
    page.click("button[type=submit]")

    page.goto(f"{live_server.url}/obras/")
    page.fill("input[name=q]", "Casmurro")
    page.click("button[type=submit]")
    page.click("text=Dom Casmurro")
    page.click("text=Emprestar")
    ...
    assert page.locator(".mensagem--success").is_visible()
```

Responda: **por que ter poucos testes e2e?** Cite três custos concretos.

---

## Gabarito parcial

**E12.5** — `date.today()` acopla o teste ao dia da execução. Um teste que passa hoje pode
falhar no dia 1º do mês, em 29 de fevereiro, na virada de ano ou quando o CI roda às
23h59 num fuso diferente. Congelar o tempo torna o teste determinístico e permite testar
datas que ainda não chegaram.

**E12.7** — Rodar contra PostgreSQL no CI porque SQLite tem tipagem dinâmica e semântica
diferente em restrições, transações e concorrência. Teste verde em SQLite e produção
quebrada em PostgreSQL é um clássico — e o CI existe justamente para pegar isso.
