/**
 * M06 — MODELO de script que popula o banco com volume.
 *
 * Copie para backend/src/semear.ts e troque as partes marcadas com ADAPTE
 * pelas entidades do projeto da equipe. Depois:
 *
 *     npm install -D @faker-js/faker
 *     npx ts-node --esm src/semear.ts
 *
 * Por que volume: com 20 registros tudo é rápido, inclusive o errado. O N+1 e a
 * listagem sem limite só aparecem com centenas de linhas.
 *
 * ⚠️ Gere sempre dados FICTÍCIOS. Nunca copie dados pessoais reais da
 * organização parceira para o banco de desenvolvimento ou para a demonstração.
 */

import { faker } from "@faker-js/faker/locale/pt_BR";
import dataSource from "./data-source.js";
// ADAPTE: importe as entidades do projeto.
import { Pessoa } from "./pessoas/entidades/pessoa.entity.js";
import { Atendimento } from "./atendimentos/entidades/atendimento.entity.js";

// ADAPTE: quantidades parecidas com o que a organização terá em um ano de uso.
const QUANTIDADE = { pessoas: 300, atendimentosPorPessoa: [0, 6] as const };

async function semear() {
  await dataSource.initialize();
  console.log("Conectado. Populando…");

  // Semente fixa: toda a equipe gera os MESMOS dados, o que torna as medições
  // comparáveis entre máquinas.
  faker.seed(42);

  // 1. Primeiro as entidades que não dependem de ninguém.
  // ADAPTE: campos da sua entidade.
  const pessoas = await dataSource.getRepository(Pessoa).save(
    Array.from({ length: QUANTIDADE.pessoas }, () => ({
      nome: faker.person.fullName(),
      cpf: faker.string.numeric(11),
      nascimento: faker.datatype.boolean(0.8)
        ? faker.date.birthdate({ min: 1940, max: 2010, mode: "year" }).toISOString().slice(0, 10)
        : null,
      observacoes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : "",
    })),
  );
  console.log(`  ${pessoas.length} pessoas`);

  // 2. Depois as que apontam para elas, em lotes: um save() com milhares de
  //    objetos monta um INSERT gigante, e lotes deixam o progresso visível.
  const repoAtendimentos = dataSource.getRepository(Atendimento);
  let total = 0;
  for (let inicio = 0; inicio < pessoas.length; inicio += 50) {
    const lote = pessoas.slice(inicio, inicio + 50).flatMap((pessoa) =>
      Array.from(
        { length: faker.number.int({ min: QUANTIDADE.atendimentosPorPessoa[0], max: QUANTIDADE.atendimentosPorPessoa[1] }) },
        // ADAPTE: campos da entidade dependente.
        () => repoAtendimentos.create({
          pessoa,
          descricao: faker.lorem.sentence(),
          concluidoEm: faker.datatype.boolean(0.7) ? faker.date.recent({ days: 180 }) : null,
        }),
      ),
    );
    await repoAtendimentos.save(lote);
    total += lote.length;
    process.stdout.write(`\r  ${total} atendimentos`);
  }

  console.log("\nPronto.");
  await dataSource.destroy();
}

await semear();
