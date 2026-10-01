# M10 — Testes e qualidade no backend

> **Pré-requisitos:** M05, M08, M09 · **Duração:** média

Até aqui, toda verificação foi um `curl` digitado e um olho conferindo a resposta. Funciona
uma vez. Neste módulo essas conferências viram **código que roda sozinho** — na sua máquina
em segundos, e no GitHub a cada *pull request*.

> **A teoria não está num bloco separado.** Ela está nas etapas 2, 5, 7 e 11 — em que a
> gente para de digitar e pensa — mais as explicações dentro de cada etapa.

## 🎯 Objetivos

Ao final você será capaz de:

1. Escrever testes unitários com Vitest, no padrão preparar → agir → conferir.
2. Isolar uma regra de negócio do banco com dublês de teste.
3. Testar a API de ponta a ponta com Supertest, contra um banco de teste real.
4. Transformar a matriz de acesso do M08 em testes automatizados.
5. Rodar lint, testes e migrações num pipeline de CI no GitHub Actions.

---

## 🧭 Por que este módulo chega agora

Um **alarme de incêndio** não apaga fogo e não impede ninguém de acender um fósforo. O que
ele faz é avisar **cedo**, sem ninguém precisar ficar de vigia. Teste automatizado é isso:
não escreve o código certo por você, mas avisa no minuto em que alguém quebra o que
funcionava.

O M10 vem depois do M09 de propósito. Agora a API tem regras de negócio (M06), validação
(M07), controle de acesso (M08) e proteções (M09) — muita coisa que pode quebrar em silêncio
quando alguém mexe "só numa linha". E vem antes do M12 porque **nada vai para produção sem
passar por aqui**.

```mermaid
flowchart TB
    E2E["E2E — Supertest + banco de teste<br/>poucos, lentos, provam a API inteira"]
    U["Unitários — Vitest + dublês<br/>muitos, rápidos, provam cada regra"]
    M["Manual — curl e Swagger<br/>exploração, nunca a única rede"]
    U --> E2E --> M
```

| Nível | Pergunta que responde | Custo de rodar |
|---|---|---|
| **Unitário** | "Esta regra calcula certo?" | Milissegundos, sem banco |
| **E2E** (ponta a ponta) | "A API, montada de verdade, responde certo?" | Segundos, com banco |
| **Manual** | "Faz sentido para quem usa?" | Minutos de alguém, toda vez |

## 📋 Como este módulo funciona

Mesmo formato dos anteriores.

| Parte | O que é |
|---|---|
| **Faça** | O comando ou o código, para digitar |
| **Linha a linha** | Uma tabela explicando **cada elemento** |
| **Rode** | Como verificar |
| **Deu certo se** | O resultado exato esperado |

### As dezessete etapas

| # | Etapa | Duração | O que entra |
|---|---|---|---|
| 1 | [O teste que já estava vermelho](#etapa-1--o-teste-que-já-estava-vermelho) | curta | `npm test`, Vitest |
| 2 | [**Para que serve um teste**](#etapa-2--para-que-serve-um-teste) | curta | **o que um teste prova** |
| 3 | [Separar a regra](#etapa-3--separar-a-regra) | curta | função pura |
| 4 | [O primeiro teste seu](#etapa-4--o-primeiro-teste-seu) | média | `describe`, `it`, `expect` |
| 5 | [**Ver o teste falhar**](#etapa-5--ver-o-teste-falhar) | curta | **teste que nunca falhou** |
| 6 | [O service sob teste](#etapa-6--o-service-sob-teste) | curta | a versão de referência |
| 7 | [**Dublês de teste**](#etapa-7--dublês-de-teste) | média | **por que não usar o banco** |
| 8 | [Testar o service](#etapa-8--testar-o-service) | longa | `vi.fn`, `getRepositoryToken` |
| 9 | [Uma tabela de casos](#etapa-9--uma-tabela-de-casos) | curta | `it.each` |
| 10 | [O relógio](#etapa-10--o-relógio) | curta | `vi.setSystemTime` |
| 11 | [**Da regra à API**](#etapa-11--da-regra-à-api) | média | **a mesma montagem do `main.ts`** |
| 12 | [Um banco só para testes](#etapa-12--um-banco-só-para-testes) | média | `globalSetup`, migrações |
| 13 | [As peças de apoio](#etapa-13--as-peças-de-apoio) | média | `overrideGuard`, `TRUNCATE` |
| 14 | [A matriz de acesso, automatizada](#etapa-14--a-matriz-de-acesso-automatizada) | média | `request.agent` |
| 15 | [Empréstimo de ponta a ponta](#etapa-15--empréstimo-de-ponta-a-ponta) | média | banco conferido no teste |
| 16 | [Cobertura e lint](#etapa-16--cobertura-e-lint) | curta | `test:cov`, oxlint |
| 17 | [O CI](#etapa-17--o-ci) | média | GitHub Actions |

---

## Etapa 1 — O teste que já estava vermelho

O `nest new` do M03 criou um teste junto com o projeto. Ninguém o rodou desde então.

**Faça**, de dentro de `backend\`:

```powershell
npm test
```

**Deu certo se** — e aqui "certo" é **falhar**:

```
 FAIL  src/app.controller.spec.ts > AppController > root > should return "Hello World!"
AssertionError: expected 'BiblioCom no ar' to be 'Hello World!'
Expected: "Hello World!"
Received: "BiblioCom no ar"
```

Na etapa 8 do M03 você trocou o texto do `AppService`. O teste continuou esperando o
texto antigo — e ficou vermelho desde aquele dia, sem ninguém saber, porque ninguém rodava.

| Linha | O que ela conta |
|---|---|
| `FAIL src/app.controller.spec.ts` | O arquivo. Todo arquivo terminado em `.spec.ts` é um teste |
| `> AppController > root > should…` | O caminho: blocos `describe` aninhados e, por fim, o `it` que falhou |
| `Expected` e `Received` | O que o teste esperava e o que o código entregou |

> Pode aparecer também um aviso sobre o `vite-tsconfig-paths`. É sobre a configuração que o
> `nest new` gerou e não afeta nada. Ignore.

**Faça:** abra `src\app.controller.spec.ts` e atualize a expectativa — o comportamento novo é
o correto:

```ts
  it("responde que o BiblioCom está no ar", () => {
    expect(appController.getHello()).toBe("BiblioCom no ar");
  });
```

**Rode** `npm test` de novo. **Deu certo se:** `Tests 1 passed`.

> **A lição desta etapa inteira:** teste que não roda é pior que teste nenhum, porque dá a
> sensação de segurança sem dar a segurança. A etapa 17 faz o GitHub rodá-los por você.

---

## Etapa 2 — Para que serve um teste

Um teste automatizado tem sempre a mesma forma, chamada **AAA**:

| Parte | Em português | No BiblioCom |
|---|---|---|
| **Arrange** | Preparar a situação | "Um empréstimo que sai em 2 de março" |
| **Act** | Executar a ação | "Calcular a previsão de devolução" |
| **Assert** | Conferir o resultado | "Tem de ser 16 de março" |

O que um teste prova é **estreito e precioso**: *para esta entrada, o código faz isto*. Ele
não prova que o código está certo para todas as entradas — prova que **continua** fazendo o
que fazia. Por isso o valor de um teste aparece no futuro, quando alguém muda o código.

| Teste bom | Teste ruim |
|---|---|
| Falha quando a **regra** quebra | Falha quando alguém renomeia uma variável |
| Diz no nome o que está garantindo | Chama-se `teste1` |
| Roda igual hoje, amanhã e no CI | Depende da data, da rede ou de outro teste rodar antes |

💼 **No mercado:** *pull request* sem teste para regra nova é devolvido em revisão na maioria
das equipes. E "como você testaria isto?" é pergunta de entrevista tanto quanto "como você
faria isto?".

---

## Etapa 3 — Separar a regra

No M06 você escreveu o `EmprestimosService.emprestar`, com o cálculo da devolução lá dentro.
Cálculo misturado com banco é difícil de testar. O primeiro passo é separar a **regra** — o
que não depende de banco nenhum.

**Faça:** crie `src\emprestimos\regras.ts`:

```ts
export const LIMITE_EM_ABERTO = 3;
export const PRAZO_EM_DIAS = 14;

export function calcularPrevisao(saida: Date, dias = PRAZO_EM_DIAS): string {
  const previsao = new Date(saida);
  previsao.setUTCDate(previsao.getUTCDate() + dias);
  return previsao.toISOString().slice(0, 10);
}
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `export const LIMITE_EM_ABERTO = 3` | O número mágico do M06 ganha nome e endereço. Mudar a regra passa a ser mudar uma linha |
| `dias = PRAZO_EM_DIAS` | Parâmetro com valor padrão: quem não informa recebe 14 |
| `new Date(saida)` | Uma **cópia**. Alterar a data recebida mudaria o objeto de quem chamou |
| `setUTCDate(… + dias)` | Soma dias em UTC. O JavaScript ajusta a virada de mês e de ano sozinho |
| `.toISOString().slice(0, 10)` | `2026-03-16T10:00:00.000Z` vira `2026-03-16` — o formato da coluna `date` |

Esta é uma **função pura**: mesma entrada, mesma saída, nenhum efeito fora dela. É o tipo de
código mais fácil de testar que existe.

---

## Etapa 4 — O primeiro teste seu

**Faça:** crie `src\emprestimos\regras.spec.ts`, ao lado do arquivo que ele testa:

```ts
import { calcularPrevisao, PRAZO_EM_DIAS } from "./regras.js";

describe("calcularPrevisao", () => {
  it("soma o prazo padrão de 14 dias", () => {
    // Arrange: a situação
    const saida = new Date("2026-03-02T10:00:00Z");
    // Act: a ação
    const previsao = calcularPrevisao(saida);
    // Assert: o resultado esperado
    expect(previsao).toBe("2026-03-16");
  });

  it("atravessa a virada do mês", () => {
    expect(calcularPrevisao(new Date("2026-01-25T10:00:00Z"))).toBe("2026-02-08");
  });

  it("aceita um prazo diferente do padrão", () => {
    expect(calcularPrevisao(new Date("2026-03-02T10:00:00Z"), 7)).toBe("2026-03-09");
  });

  it("usa 14 dias como padrão", () => {
    expect(PRAZO_EM_DIAS).toBe(14);
  });
});
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `describe("…", () => {…})` | Agrupa os testes de uma mesma coisa. O nome aparece no relatório |
| `it("…", () => {…})` | Um caso. O nome é uma **frase** sobre o comportamento — leia em voz alta: *"calcularPrevisao soma o prazo padrão de 14 dias"* |
| `expect(x).toBe(y)` | A conferência. Se `x` não for `y`, o teste falha e mostra os dois |
| Sem `import` de `describe`, `it`, `expect` | O `vitest.config.ts` que o Nest gerou liga `globals: true`: eles já existem em todo arquivo de teste |
| `"2026-03-02T10:00:00Z"` | Data **fixa**, com fuso explícito (`Z` = UTC). Teste que usa a data de hoje dá resultado diferente a cada dia |

**Rode:**

```powershell
npm test
```

**Deu certo se:** `Test Files 2 passed` e `Tests 5 passed`.

> Para deixar os testes rodando enquanto você edita, use `npm run test:watch`: cada arquivo
> salvo reexecuta os testes afetados. `q` sai.

---

## Etapa 5 — Ver o teste falhar

Um teste que você nunca viu falhar pode estar testando nada — um `expect` esquecido, uma
comparação que sempre passa. **Antes de confiar num teste, quebre o código de propósito.**

**Faça:** em `regras.ts`, troque `PRAZO_EM_DIAS = 14` por `PRAZO_EM_DIAS = 15` e rode
`npm test`.

**Deu certo se:** **três** testes falham — e o de prazo customizado (7 dias) continua passando.
Leia cada `Expected`/`Received`.

| O que aconteceu | O que isso diz sobre os testes |
|---|---|
| Os testes do prazo padrão falharam | Eles realmente dependem do prazo — pegariam essa mudança num *pull request* |
| O de 7 dias passou | Ele testa a soma, não o padrão. É o certo: cada teste guarda uma coisa |

Desfaça a mudança. Essa técnica — mudar o código para ver se algum teste reclama — tem nome:
**teste de mutação**. Existem ferramentas que fazem isso automaticamente; à mão, ela já
ensina a desconfiar de suíte que nunca fica vermelha.

---

## Etapa 6 — O service sob teste

O `emprestar` do M06 foi escrito por cada pessoa à sua maneira. Para que todo mundo teste a
mesma coisa, esta é a **versão de referência** — confira a sua contra ela e, se o seu modelo
do M04 usa nomes de campo diferentes, adapte os nomes, não a lógica.

**Faça:** `src\emprestimos\emprestimos.service.ts`:

```ts
import {
  ConflictException, Injectable, NotFoundException, UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { Exemplar } from "../acervo/entidades/exemplar.entity.js";
import { Associado } from "./associado.entity.js";
import { Emprestimo } from "./emprestimo.entity.js";
import { LIMITE_EM_ABERTO, calcularPrevisao } from "./regras.js";

@Injectable()
export class EmprestimosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Exemplar) private readonly exemplares: Repository<Exemplar>,
    @InjectRepository(Associado) private readonly associados: Repository<Associado>,
    @InjectRepository(Emprestimo) private readonly emprestimos: Repository<Emprestimo>,
  ) {}

  async emprestar(exemplarId: number, associadoId: number): Promise<Emprestimo> {
    const exemplar = await this.exemplares.findOneBy({ id: exemplarId });
    if (!exemplar) throw new NotFoundException(`Exemplar ${exemplarId} não encontrado`);
    if (!exemplar.disponivel) throw new ConflictException("Exemplar já está emprestado");

    const associado = await this.associados.findOneBy({ id: associadoId });
    if (!associado) throw new NotFoundException(`Associado ${associadoId} não encontrado`);

    const emAberto = await this.emprestimos.countBy({ associadoId, devolvidoEm: IsNull() });
    if (emAberto >= LIMITE_EM_ABERTO) {
      throw new UnprocessableEntityException(
        `Limite de ${LIMITE_EM_ABERTO} empréstimos em aberto atingido`,
      );
    }

    const saidaEm = new Date();
    return this.dataSource.transaction(async (manager) => {
      const emprestimo = manager.create(Emprestimo, {
        exemplarId,
        associadoId,
        saidaEm,
        previstoPara: calcularPrevisao(saidaEm),
        devolvidoEm: null,
      });
      await manager.save(emprestimo);
      await manager.update(Exemplar, exemplarId, { disponivel: false });
      return emprestimo;
    });
  }
}
```

| Trecho | Por quê |
|---|---|
| `IsNull()` | `devolvidoEm: null` no `where` não funciona como se espera no TypeORM. `IsNull()` vira `IS NULL` no SQL |
| `404`, `409`, `422` | Os status do M07: não existe, conflito de estado, regra de negócio violada |
| Verificações **fora** da transação | Elas só leem. A transação guarda as duas escritas que precisam acontecer juntas (M06, etapa 15) |
| `calcularPrevisao(saidaEm)` | A regra da etapa 3, agora usada pelo service |

O controller (`POST /api/emprestimos`, com `@UseGuards(AutenticadoGuard)` do M08) só recebe
um DTO com `exemplarId` e `associadoId` e chama este método.

**Rode** `npm test`. **Deu certo se:** tudo continua verde — você reorganizou o código sem
mudar o comportamento. Isso tem nome: **refatorar**.

---

## Etapa 7 — Dublês de teste

Para testar o `emprestar`, o caminho óbvio seria um banco de verdade, com exemplares e
associados. Funciona, e é o que a etapa 15 vai fazer. Mas para testar **a regra** isso é
caro: cada teste precisaria montar dados, e o banco teria de estar de pé.

No cinema, a cena do carro capotando não usa o ator principal: usa um **dublê**, que só
precisa parecer o ator naquela cena. Em teste é igual. O service pede repositórios; você
entrega objetos que **fingem** ser repositórios e respondem o que a cena precisa.

| Termo | O que é | No Vitest |
|---|---|---|
| **Dublê** (*test double*) | Qualquer objeto que substitui uma dependência real | — |
| **Stub** | Dublê que só devolve respostas prontas | `vi.fn().mockResolvedValue(…)` |
| **Mock** / **Spy** | Dublê que também **registra** como foi chamado | `expect(fn).toHaveBeenCalledWith(…)` |

O que a injeção de dependência do M03 comprou está aqui: como o service **recebe** os
repositórios pelo construtor, em vez de criá-los, dá para entregar outra coisa no lugar.

> ⚠️ Dublê testa **a sua lógica**, não a integração. Um teste com dublê nunca vai pegar um
> erro de SQL, de migração ou de nome de coluna. É por isso que existem os dois níveis da
> pirâmide.

---

## Etapa 8 — Testar o service

**Faça:** crie `src\emprestimos\emprestimos.service.spec.ts`:

```ts
import {
  ConflictException, NotFoundException, UnprocessableEntityException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Exemplar } from "../acervo/entidades/exemplar.entity.js";
import { Associado } from "./associado.entity.js";
import { Emprestimo } from "./emprestimo.entity.js";
import { EmprestimosService } from "./emprestimos.service.js";

describe("EmprestimosService.emprestar", () => {
  // Dublês: objetos que fingem ser os repositórios e o DataSource
  const exemplares = { findOneBy: vi.fn() };
  const associados = { findOneBy: vi.fn() };
  const emprestimos = { countBy: vi.fn() };
  const manager = { create: vi.fn((_e, dados) => dados), save: vi.fn(), update: vi.fn() };
  const dataSource = { transaction: vi.fn((trabalho) => trabalho(manager)) };

  let servico: EmprestimosService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // O caminho feliz: exemplar disponível, associado existe, nenhum empréstimo em aberto
    exemplares.findOneBy.mockResolvedValue({ id: 10, disponivel: true });
    associados.findOneBy.mockResolvedValue({ id: 7 });
    emprestimos.countBy.mockResolvedValue(0);

    const modulo = await Test.createTestingModule({
      providers: [
        EmprestimosService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Exemplar), useValue: exemplares },
        { provide: getRepositoryToken(Associado), useValue: associados },
        { provide: getRepositoryToken(Emprestimo), useValue: emprestimos },
      ],
    }).compile();
    servico = modulo.get(EmprestimosService);
  });

  it("cria o empréstimo e marca o exemplar como indisponível", async () => {
    const emprestimo = await servico.emprestar(10, 7);

    expect(emprestimo.exemplarId).toBe(10);
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(Exemplar, 10, { disponivel: false });
  });

  it("recusa exemplar inexistente com 404", async () => {
    exemplares.findOneBy.mockResolvedValue(null);
    await expect(servico.emprestar(99, 7)).rejects.toThrow(NotFoundException);
  });

  it("recusa exemplar já emprestado com 409", async () => {
    exemplares.findOneBy.mockResolvedValue({ id: 10, disponivel: false });
    await expect(servico.emprestar(10, 7)).rejects.toThrow(ConflictException);
  });

  it("não grava nada quando a regra recusa", async () => {
    emprestimos.countBy.mockResolvedValue(3);
    await expect(servico.emprestar(10, 7)).rejects.toThrow(UnprocessableEntityException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `{ findOneBy: vi.fn() }` | Um "repositório" com **só** o método que o service usa. `vi.fn()` cria uma função falsa que registra as chamadas |
| `transaction: vi.fn((trabalho) => trabalho(manager))` | O `DataSource` falso executa o bloco da transação na hora, entregando o `manager` falso |
| `vi.clearAllMocks()` | Zera o histórico de chamadas antes de cada teste. Sem isso, um teste enxerga as chamadas do anterior |
| `mockResolvedValue(…)` | "Quando chamado, devolva uma `Promise` resolvida com isto" — o que um `await` de repositório espera |
| `Test.createTestingModule` | Um módulo do Nest montado só para o teste, com a injeção de dependência funcionando de verdade |
| `{ provide: X, useValue: dublê }` | "Quando alguém pedir `X`, entregue o dublê." É a troca do ator pelo dublê |
| `getRepositoryToken(Exemplar)` | O "nome" interno que o `@InjectRepository(Exemplar)` procura. Sem ele, o Nest não sabe que aquele dublê é o repositório de `Exemplar` |
| `await expect(promessa).rejects.toThrow(Classe)` | Confere que a `Promise` **falhou**, com aquela exceção. O `await` é obrigatório: sem ele o teste termina antes |
| `.not.toHaveBeenCalled()` | Confere uma **ausência**: a regra recusou, então nada foi gravado |

**Rode** `npm test`. **Deu certo se:** os quatro passam. Agora repita a etapa 5: troque o
`>=` do limite por `>` no service e veja qual teste reclama. Desfaça.

---

## Etapa 9 — Uma tabela de casos

Os limites são onde as regras quebram: 2 empréstimos pode, 3 não pode. Em vez de um `it` por
número, uma **tabela**.

**Faça:** acrescente ao `describe` do service:

```ts
  it.each([
    [0, "aceita"],
    [2, "aceita"],
    [3, "recusa"],
    [5, "recusa"],
  ])("com %i empréstimos em aberto, %s", async (emAberto, esperado) => {
    emprestimos.countBy.mockResolvedValue(emAberto);
    const tentativa = servico.emprestar(10, 7);
    if (esperado === "aceita") {
      await expect(tentativa).resolves.toBeDefined();
    } else {
      await expect(tentativa).rejects.toThrow(UnprocessableEntityException);
    }
  });
```

| Trecho | O que faz |
|---|---|
| `it.each([...])` | Roda o mesmo teste uma vez por linha da tabela |
| `"com %i … %s"` | `%i` e `%s` são trocados pelos valores da linha: o relatório mostra `com 3 empréstimos em aberto, recusa` |
| `2` e `3` | Os dois lados da fronteira. O `0` e o `5` são casos "fáceis"; os que pegam erro de `>` contra `>=` são estes |

**Deu certo se:** o relatório lista quatro linhas novas, uma por caso.

---

## Etapa 10 — O relógio

O `emprestar` usa `new Date()`. O primeiro teste da etapa 8 não confere a previsão de
devolução porque ela muda a cada dia — e teste que muda a cada dia é teste que um dia falha
sem ninguém ter mexido em nada.

**Faça:** troque o primeiro teste do service por:

```ts
  it("cria o empréstimo e marca o exemplar como indisponível", async () => {
    vi.setSystemTime(new Date("2026-03-02T10:00:00Z"));

    const emprestimo = await servico.emprestar(10, 7);

    expect(emprestimo.previstoPara).toBe("2026-03-16");
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(Exemplar, 10, { disponivel: false });
    vi.useRealTimers();
  });
```

| Trecho | O que faz |
|---|---|
| `vi.setSystemTime(…)` | A partir daqui, `new Date()` devolve esta data, dentro do teste |
| `vi.useRealTimers()` | Devolve o relógio de verdade, para não contaminar os testes seguintes |

**Deu certo se:** o teste passa hoje, e passaria igual em qualquer dia do ano.

---

## Etapa 11 — Da regra à API

Os testes até aqui provam a regra. Eles **não** provam que:

- o guard do M08 está na rota;
- o `ValidationPipe` recusa o corpo inválido;
- a migração criou a coluna que o service usa;
- o JSON que sai tem o formato do contrato.

Para isso existe o teste **E2E** (*end-to-end*, de ponta a ponta): a API montada de verdade,
recebendo requisições HTTP de verdade, gravando num banco de verdade. É a diferença entre
testar uma peça na bancada e fazer o **test drive** do carro montado.

Só que há um problema. Grande parte da montagem da API está no `main.ts`: o prefixo `/api`,
o `ValidationPipe`, o `helmet`, a sessão. O teste E2E não roda o `main.ts` — ele monta a
aplicação sozinho. Se cada um montar do seu jeito, o teste prova uma API **diferente** da
que vai para produção.

**Faça:** mova a montagem para uma função. Crie `src\configurar-app.ts`:

```ts
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import session from "express-session";
import helmet from "helmet";

// Tudo que a aplicação precisa além dos módulos. Fica num lugar só
// para que o main.ts e os testes montem exatamente a mesma API.
export function configurarApp(app: NestExpressApplication): void {
  app.use(helmet());
  app.useBodyParser("json", { limit: "20kb" });
  app.enableCors({
    origin: (process.env.CORS_ORIGENS ?? "").split(",").filter(Boolean),
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.use(
    session({
      name: "bibliocom.sid",
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
}
```

**Faça:** e o `main.ts` fica enxuto:

```ts
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { configurarApp } from "./configurar-app.js";
import { montarDocumento } from "./swagger.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  SwaggerModule.setup("api/docs", app, montarDocumento(app));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

**Rode** `npm run start:dev` e repita um `curl` do M08. **Deu certo se:** a API se comporta
exatamente como antes — mais uma refatoração.

---

## Etapa 12 — Um banco só para testes

Os testes E2E vão **apagar tudo** antes de cada caso, para começar sempre do mesmo estado.
Por isso eles nunca, jamais, rodam no banco em que você trabalha.

**Faça:** crie o banco de teste, no mesmo contêiner:

```powershell
docker compose exec db createdb -U bibliocom bibliocom_teste
```

**Faça:** apague o teste E2E que o `nest new` gerou — ele espera o "Hello World" em `/`, que
não existe mais:

```powershell
Remove-Item test\app.e2e-spec.ts
```

**Faça:** substitua o conteúdo de `backend\vitest.config.e2e.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Banco SEPARADO para os testes: eles apagam tudo a cada caso.
const BANCO_DE_TESTE =
  process.env.DATABASE_URL_TESTE ??
  "postgres://bibliocom:devpassword@localhost:5432/bibliocom_teste";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: "./",
    include: ["**/*.e2e-spec.ts"],
    globalSetup: ["./test/preparar-banco.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: BANCO_DE_TESTE,
      SESSION_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
      NOME_BIBLIOTECA: "Biblioteca de Teste",
      CORS_ORIGENS: "",
    },
  },
});
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `DATABASE_URL_TESTE ?? "…"` | Usa a variável se existir (o CI vai definir), senão o banco local de teste |
| `include: ["**/*.e2e-spec.ts"]` | Só os arquivos E2E. Os `.spec.ts` unitários ficam com o `npm test` |
| `globalSetup` | Um arquivo que roda **uma vez**, antes de todos os testes |
| `fileParallelism: false` | Um arquivo de teste por vez. Os dois arquivos apagam o mesmo banco: em paralelo, um apagaria os dados do outro no meio |
| `env: {…}` | Variáveis para os testes. Elas **vencem** as do `.env`, então o `DATABASE_URL` de teste prevalece |

**Faça:** crie `test\preparar-banco.ts`:

```ts
import { execSync } from "node:child_process";

// Roda uma vez, antes de todos os arquivos de teste:
// apaga o esquema do banco de teste e o recria pelas migrações.
export default function prepararBanco() {
  const env = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL_TESTE ??
      "postgres://bibliocom:devpassword@localhost:5432/bibliocom_teste",
  };
  execSync("npm run typeorm schema:drop", { env, stdio: "inherit" });
  execSync("npm run migration:run", { env, stdio: "inherit" });
}
```

| Trecho | O que faz |
|---|---|
| `execSync("…")` | Roda um comando do terminal e espera terminar — os mesmos atalhos do M05 |
| `schema:drop` | Apaga **todas** as tabelas do banco apontado. Por isso o `DATABASE_URL` de teste é passado explicitamente aqui |
| `migration:run` | Recria tudo pelas migrações. A cada execução da suíte, o M05 é provado de novo: o esquema nasce do zero |
| `stdio: "inherit"` | Mostra a saída dos comandos no seu terminal |

**Deu certo se:** os arquivos salvam sem erro de tipo. Ainda não há teste E2E para rodar.

---

## Etapa 13 — As peças de apoio

Todo arquivo E2E vai precisar das mesmas três coisas: montar a API, limpar o banco e criar
usuários. Escritas uma vez, num arquivo de apoio.

**Faça:** crie `test\apoio.ts`:

```ts
import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { DataSource } from "typeorm";
import { AppModule } from "../src/app.module.js";
import { AuthService } from "../src/auth/auth.service.js";
import { Papel } from "../src/auth/usuario.entity.js";
import { configurarApp } from "../src/configurar-app.js";

export const SENHA = "senha-de-teste-bem-longa";

export async function criarApp(): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();
  return app;
}

export async function limparBanco(app: INestApplication): Promise<void> {
  const fonte = app.get(DataSource);
  const tabelas = fonte.entityMetadatas.map((e) => `"${e.tableName}"`).join(", ");
  await fonte.query(`TRUNCATE ${tabelas} RESTART IDENTITY CASCADE`);
}

export async function criarUsuarios(app: INestApplication): Promise<void> {
  const auth = app.get(AuthService);
  await auth.criar("Coordenação", "coord@teste.org", SENHA, Papel.COORDENACAO);
  await auth.criar("Caio", "caio@teste.org", SENHA, Papel.BIBLIOTECARIO);
}
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `imports: [AppModule]` | A aplicação **inteira**, com banco, guards e tudo — o oposto do teste unitário |
| `.overrideGuard(ThrottlerGuard)` | Desliga o limite de tentativas de login do M09. Os testes fazem vários logins seguidos, e o sexto receberia `429` |
| `configurarApp(app)` | A mesma montagem do `main.ts` — o motivo da etapa 11 |
| `app.init()` | Inicializa sem abrir porta. O Supertest conversa com o servidor direto, sem rede |
| `entityMetadatas` | A lista de entidades que o TypeORM conhece. Daí saem os nomes das tabelas, sem lista escrita à mão |
| `TRUNCATE … RESTART IDENTITY CASCADE` | Esvazia as tabelas, volta os ids para 1 e resolve as chaves estrangeiras. A tabela `migrations` fica intacta: ela não é entidade |
| `app.get(AuthService)` | Pega o service de dentro da aplicação e usa o próprio `criar` do M08 — com hash de verdade |

> Desligar o *throttler* nos testes é uma escolha consciente: estes testes são sobre acesso
> e regra de negócio. O exercício E10.5 testa o `429` separadamente.

---

## Etapa 14 — A matriz de acesso, automatizada

A tabela que você preencheu à mão na etapa 13 do M08 vira teste.

**Faça:** crie `test\acesso.e2e-spec.ts`:

```ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { criarApp, criarUsuarios, limparBanco, SENHA } from "./apoio.js";

describe("Matriz de acesso", () => {
  let app: INestApplication;
  const agentes: Record<string, ReturnType<typeof request.agent>> = {};

  beforeAll(async () => {
    app = await criarApp();
    await limparBanco(app);
    await criarUsuarios(app);
    await app.get(DataSource).query(
      `INSERT INTO autor (nome) VALUES ('Machado de Assis');
       INSERT INTO obra (titulo, "autorId") VALUES ('Dom Casmurro', 1), ('Helena', 1);`,
    );

    agentes.anonimo = request.agent(app.getHttpServer());
    for (const [nome, email] of [["bibliotecario", "caio@teste.org"], ["coordenacao", "coord@teste.org"]]) {
      agentes[nome] = request.agent(app.getHttpServer());
      await agentes[nome].post("/api/sessao").send({ email, senha: SENHA }).expect(200);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ["anonimo", "get", "/api/obras", 200],
    ["anonimo", "post", "/api/obras", 401],
    ["anonimo", "delete", "/api/obras/2", 401],
    ["bibliotecario", "post", "/api/obras", 201],
    ["bibliotecario", "delete", "/api/obras/2", 403],
    ["bibliotecario", "post", "/api/usuarios", 403],
    ["coordenacao", "delete", "/api/obras/2", 204],
  ] as const)("%s: %s %s → %i", async (quem, metodo, rota, status) => {
    const corpo = metodo === "post" && rota === "/api/obras" ? { titulo: "Nova", autorId: 1 } : {};
    await agentes[quem][metodo](rota).send(corpo).expect(status);
  });
});
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `request.agent(servidor)` | Um "navegador" do Supertest: **guarda o cookie** entre requisições, como o `-c`/`-b` do `curl` |
| `beforeAll` | Roda uma vez antes dos testes do arquivo: limpa, cria usuários, faz os logins |
| `.post(…).send({…}).expect(200)` | Monta a requisição, envia o corpo em JSON e confere o status — tudo encadeado |
| `as const` | Diz ao TypeScript que `"get"` é exatamente `"get"`, e não uma `string` qualquer. É o que permite `agentes[quem][metodo]` |
| `"%s: %s %s → %i"` | O relatório mostra `bibliotecario: delete /api/obras/2 → 403` — a própria matriz, legível |
| A ordem das linhas | A coordenação apaga a obra 2 **por último**. As linhas rodam em ordem e compartilham o banco |
| `afterAll(… app.close())` | Fecha a conexão com o banco. Sem isso, o Vitest pode ficar esperando ao final |

**Rode:**

```powershell
npm run test:e2e
```

**Deu certo se:** primeiro aparecem o `schema:drop` e as migrações executando; depois,
`Tests 7 passed`, com o nome de cada célula da matriz.

Agora prove que o teste vigia: tire o `PapeisGuard` do `@Delete` do `AcervoController` e
rode de novo. A linha `bibliotecario: delete /api/obras/2 → 403` fica vermelha — e a da
coordenação também. Por quê? (Dica: o que aconteceu com a obra 2 na linha anterior?) Desfaça.

---

## Etapa 15 — Empréstimo de ponta a ponta

**Faça:** crie `test\emprestimos.e2e-spec.ts`:

```ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { criarApp, criarUsuarios, limparBanco, SENHA } from "./apoio.js";

describe("POST /api/emprestimos", () => {
  let app: INestApplication;
  let bibliotecario: ReturnType<typeof request.agent>;
  let banco: DataSource;

  beforeAll(async () => {
    app = await criarApp();
    banco = app.get(DataSource);
  });

  beforeEach(async () => {
    await limparBanco(app);
    await criarUsuarios(app);
    await banco.query(
      `INSERT INTO autor (nome) VALUES ('Machado de Assis');
       INSERT INTO obra (titulo, "autorId") VALUES ('Dom Casmurro', 1);
       INSERT INTO exemplar (tombo, "obraId") VALUES ('T-1',1),('T-2',1),('T-3',1),('T-4',1);
       INSERT INTO associado (nome, email) VALUES ('Ana', 'ana@teste.org');`,
    );
    bibliotecario = request.agent(app.getHttpServer());
    await bibliotecario.post("/api/sessao").send({ email: "caio@teste.org", senha: SENHA }).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it("empresta e marca o exemplar como indisponível no banco", async () => {
    const resposta = await bibliotecario
      .post("/api/emprestimos")
      .send({ exemplarId: 1, associadoId: 1 })
      .expect(201);

    expect(resposta.body.previstoPara).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [exemplar] = await banco.query(`SELECT disponivel FROM exemplar WHERE id = 1`);
    expect(exemplar.disponivel).toBe(false);
  });

  it("recusa o quarto empréstimo em aberto com 422", async () => {
    for (const exemplarId of [1, 2, 3]) {
      await bibliotecario.post("/api/emprestimos").send({ exemplarId, associadoId: 1 }).expect(201);
    }
    await bibliotecario.post("/api/emprestimos").send({ exemplarId: 4, associadoId: 1 }).expect(422);
  });

  it("recusa corpo inválido com 400, antes de chegar ao service", async () => {
    await bibliotecario.post("/api/emprestimos").send({ exemplarId: "um" }).expect(400);
  });
});
```

| Trecho | Por quê |
|---|---|
| `beforeEach`, e não `beforeAll` | Aqui cada teste **muda** o banco. Começar cada um do zero impede que um dependa do outro |
| `resposta.body` | O JSON da resposta, já convertido em objeto |
| `toMatch(/^\d{4}-…$/)` | Confere o **formato** da data, não o valor — o valor depende do dia em que o teste roda. A data exata já está garantida no unitário da etapa 10 |
| `banco.query(SELECT …)` | O teste olha **o banco**, não só a resposta. É a prova de que a transação gravou as duas coisas |
| O terceiro teste | Prova que o `ValidationPipe` está montado — exatamente o tipo de coisa que o teste unitário não vê |

**Rode** `npm run test:e2e`. **Deu certo se:** `Test Files 2 passed`, `Tests 10 passed`.

---

## Etapa 16 — Cobertura e lint

**Faça:**

```powershell
npm run test:cov
```

**Deu certo se:** aparece uma tabela com quatro porcentagens por arquivo — linhas, funções,
ramos (`if`/`else`) e instruções que algum teste executou.

| A cobertura diz | A cobertura **não** diz |
|---|---|
| "Esta linha nunca rodou em teste nenhum" | "Esta linha está certa" |
| Onde **faltam** testes | Se os testes que existem conferem alguma coisa |

Uma linha executada por um teste sem `expect` conta como coberta. Por isso cobertura é
bússola, não meta: use-a para achar o `if` que nenhum teste percorreu.

**Faça:**

```powershell
npm run lint
```

O **oxlint**, que veio com o `nest new`, lê o código procurando erros prováveis — sem
executá-lo. **Deu certo se:** nenhum aviso. Se aparecer
`typescript(unbound-method)` numa linha como `itens.map(ObraResumo.de)`, troque por
`itens.map((obra) => ObraResumo.de(obra))` — o aviso é sobre o `this` de um método passado
solto, e a versão com seta não tem essa ambiguidade.

---

## Etapa 17 — O CI

**CI** (*integração contínua*) é um computador que roda os seus testes **a cada push**, sem
ninguém lembrar. A etapa 1 mostrou o que acontece quando depende de lembrar.

**Faça:** na **raiz do repositório** (não dentro de `backend\`), crie
`.github\workflows\ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: bibliocom
          POSTGRES_PASSWORD: devpassword
          POSTGRES_DB: bibliocom
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s
          --health-timeout 5s --health-retries 10

    env:
      DATABASE_URL: postgres://bibliocom:devpassword@localhost:5432/bibliocom
      DATABASE_URL_TESTE: postgres://bibliocom:devpassword@localhost:5432/bibliocom_teste
      SESSION_SECRET: segredo-do-ci-que-nao-protege-nada-real
      NOME_BIBLIOTECA: CI

    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint -w backend
      - run: npm run build -w backend
      - name: Esquema nasce do zero e bate com as entidades
        run: |
          npm run migration:run -w backend
          npm run migration:check -w backend
      - run: npm test -w backend
      - name: Testes E2E
        run: |
          PGPASSWORD=devpassword psql -h localhost -U bibliocom -c "CREATE DATABASE bibliocom_teste"
          npm run test:e2e -w backend
```

**Linha a linha:**

| Trecho | O que faz |
|---|---|
| `on: push` em `main` e `pull_request` | Roda a cada push na principal e em todo *pull request* |
| `runs-on: ubuntu-latest` | Uma máquina Linux nova a cada execução. Nada do seu computador está lá — é a prova de que o projeto roda "em outra máquina" |
| `services: postgres` | Um PostgreSQL 16 em contêiner, o mesmo do `docker-compose.yml` |
| `--health-cmd pg_isready` | Os passos só começam quando o banco estiver aceitando conexões |
| `env:` do *job* | As variáveis que o `.env` daria. O `.env` não está no Git — e não deve estar |
| `SESSION_SECRET` escrito no arquivo | Aceitável **só** porque não protege nada real: é o segredo de uma API de teste que vive alguns minutos. Segredo de produção nunca vai aqui (M12) |
| `node-version: 24` | A mesma versão do curso |
| `cache: npm` | Guarda os pacotes baixados entre execuções. O CI fica bem mais rápido do segundo push em diante |
| `npm ci` na raiz | Instala exatamente o que o `package-lock.json` diz. O lock fica na raiz do *workspace* (M00) |
| `-w backend` | Roda o script dentro de `backend/`, a partir da raiz |
| `migration:run` + `migration:check` | O que o M05 prometeu: banco vazio, todas as migrações, e nenhuma entidade sem migração |
| `psql … CREATE DATABASE` | O banco de teste. No seu computador, foi o `createdb` da etapa 12 |

**Faça:** commite e envie.

```powershell
git add .github backend
```

```powershell
git commit -m "test: suíte unitária e E2E, e CI no GitHub Actions"
```

```powershell
git push
```

**Rode:** no GitHub, aba **Actions**. Clique na execução e abra cada passo.

**Deu certo se:** todos os passos ficam verdes. Abra um *pull request* qualquer: a execução
aparece nele, e o botão de *merge* mostra o resultado.

> Ligue a proteção da branch principal (M00, passo 6) exigindo que o CI passe antes do
> *merge*. A partir daí, quebrar o `main` deixa de ser possível — não só proibido.

---

## 🤖 IA no fluxo

Gerar teste é das coisas que assistentes de IA fazem melhor: cole o service e peça "testes
Vitest para os caminhos de erro". O que conferir no que voltar:

- [ ] Cada teste tem um `expect` que **falharia** se a regra quebrasse? (Faça a etapa 5 neles)
- [ ] O nome do teste diz o comportamento, e não `should work`?
- [ ] Os dublês fingem o que o código **realmente** chama, ou métodos que não existem?
- [ ] Algum teste depende da data, da ordem ou de rede?

Um padrão comum de teste gerado é conferir que o dublê devolveu o que você mandou ele
devolver — o teste passa sempre e não prova nada. Quem decide **o que** vale a pena provar é
você, a partir da regra de negócio.

## ⚠️ Erros comuns

| Sintoma | Diagnóstico |
|---|---|
| `describe is not defined` | O arquivo não está no `include` da configuração, ou o `globals: true` sumiu |
| `Nest can't resolve dependencies of the EmprestimosService (?, …)` | Falta um `provide` no módulo de teste. O `?` mostra a posição do parâmetro que faltou |
| O teste passa, mas o `expect` nunca rodou | Faltou `await` antes do `expect(…).rejects`. O teste terminou antes da `Promise` |
| E2E: `password authentication failed` | O `DATABASE_URL_TESTE` não bate com o `docker-compose.yml` |
| E2E: `database "bibliocom_teste" does not exist` | Faltou o `createdb` da etapa 12 |
| E2E: tudo `404` | O teste não chamou o `configurarApp`, e o prefixo `/api` não existe — etapa 11 |
| E2E: o login responde `429` | Faltou o `overrideGuard(ThrottlerGuard)` — etapa 13 |
| E2E: um teste passa sozinho e falha junto com os outros | Dependência entre testes: um usa o que o outro deixou no banco. Limpe no `beforeEach` |
| O Vitest não termina depois dos testes E2E | Faltou o `app.close()` no `afterAll` |
| CI: `npm ci` reclama do lock | O `package-lock.json` não foi commitado, ou está fora de sincronia. Rode `npm install` na raiz e commite |
| CI: `migration:check` falha e local passa | Alguém mudou entidade sem gerar migração — exatamente o que ele existe para pegar |

## 💣 Pegadinha de mercado

**Perseguir 100% de cobertura.** A meta numérica vira o objetivo, e aparecem testes que
executam tudo e não conferem nada — ou testes que conferem detalhes de implementação e
quebram a cada refatoração, até a equipe parar de confiar neles. Uma suíte com 70% de
cobertura que testa cada regra de negócio e cada célula da matriz de acesso vale mais que
uma de 100% que testa *getters*.

## ✅ Checklist de saída

- [ ] `npm test` verde, com o teste gerado no M03 atualizado
- [ ] A regra do empréstimo separada em função pura, com testes que você viu falhar
- [ ] O `EmprestimosService` testado com dublês, incluindo os caminhos de erro e o limite
- [ ] Nenhum teste depende da data de hoje
- [ ] `configurarApp` usado pelo `main.ts` e pelos testes
- [ ] Banco de teste separado, recriado pelas migrações a cada execução
- [ ] A matriz de acesso do M08 automatizada, com nomes legíveis no relatório
- [ ] Um fluxo E2E que confere o banco, não só a resposta
- [ ] `npm run lint` sem avisos
- [ ] CI verde no GitHub, rodando lint, build, migrações, unitários e E2E

## 📦 Entrega E6

A suíte de testes no repositório, com o CI verde no GitHub. No README, um *badge* do CI e uma
seção **Testes** dizendo como rodar cada nível. Para o *badge*, use o endereço
`https://github.com/<usuario>/<repositorio>/actions/workflows/ci.yml/badge.svg`.

## 🧩 Desafio de fixação

A biblioteca decide que associados com empréstimo **atrasado** não podem pegar mais nada,
mesmo abaixo do limite de três. Antes de mexer no service: escreva os nomes dos testes que
você acrescentaria — no unitário e no E2E — e diga qual deles deveria falhar **primeiro**,
antes de qualquer código novo existir. Por que começar pelo teste que falha?

## 🧪 Exercícios

Ver [`exercicios.md`](exercicios.md).

## 📚 Para aprofundar

- [Vitest — Guia](https://vitest.dev/guide/)
- [NestJS — Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/forwardemail/supertest)
- [GitHub Actions — Service containers (PostgreSQL)](https://docs.github.com/actions/use-cases-and-examples/using-containerized-services/creating-postgresql-service-containers)
- [Martin Fowler — Test Double](https://martinfowler.com/bliki/TestDouble.html)
