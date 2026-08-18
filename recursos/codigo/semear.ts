/**
 * M06 — Popula o banco com volume, para que os problemas de desempenho apareçam.
 *
 *     pnpm dlx ts-node src/semear.ts
 *
 * Com 20 registros tudo é rápido, inclusive o errado. Sem volume, o módulo de
 * consultas vira teoria: o N+1 não dói e o índice não faz diferença medível.
 */

import { faker } from "@faker-js/faker/locale/pt_BR";
import dataSource from "./data-source";
import { Autor } from "./acervo/entidades/autor.entity";
import { Categoria } from "./acervo/entidades/categoria.entity";
import { Exemplar, EstadoExemplar } from "./acervo/entidades/exemplar.entity";
import { Obra } from "./acervo/entidades/obra.entity";

const QUANTIDADE = { autores: 60, obras: 800, exemplaresPorObra: [1, 4] as const };

async function semear() {
  await dataSource.initialize();
  console.log("Conectado. Populando…");

  // Semente fixa: todo mundo da turma gera os MESMOS dados. Isso torna os
  // tempos comparáveis entre máquinas e os exercícios reproduzíveis.
  faker.seed(42);

  const categorias = await dataSource.getRepository(Categoria).save(
    ["Romance", "Conto", "Poesia", "História", "Infantil", "Técnico", "Biografia"].map(
      (nome) => ({ nome }),
    ),
  );

  const autores = await dataSource.getRepository(Autor).save(
    Array.from({ length: QUANTIDADE.autores }, () => ({
      nome: faker.person.fullName(),
      nascimento: faker.date.birthdate({ min: 1850, max: 1995, mode: "year" })
        .toISOString()
        .slice(0, 10),
      biografia: faker.lorem.paragraph(),
    })),
  );
  console.log(`  ${autores.length} autores`);

  const repoObras = dataSource.getRepository(Obra);
  const repoExemplares = dataSource.getRepository(Exemplar);
  let totalExemplares = 0;

  // Em lotes: um save() com 800 objetos monta um INSERT gigante e alguns
  // bancos recusam. Lotes de 100 também deixam o progresso visível.
  for (let inicio = 0; inicio < QUANTIDADE.obras; inicio += 100) {
    const lote = Array.from({ length: 100 }, () =>
      repoObras.create({
        titulo: faker.book.title(),
        subtitulo: faker.datatype.boolean(0.3) ? faker.lorem.sentence(4) : "",
        anoPublicacao: faker.datatype.boolean(0.9)
          ? faker.number.int({ min: 1880, max: 2025 })
          : null,
        isbn: faker.datatype.boolean(0.7) ? faker.string.numeric(13) : "",
        sinopse: faker.lorem.paragraphs(2),
        autor: faker.helpers.arrayElement(autores),
        categorias: faker.helpers.arrayElements(categorias, { min: 1, max: 3 }),
      }),
    );
    const salvas = await repoObras.save(lote);

    const exemplares = salvas.flatMap((obra) =>
      Array.from(
        { length: faker.number.int({ min: 1, max: QUANTIDADE.exemplaresPorObra[1] }) },
        () => ({
          tombo: faker.string.alphanumeric({ length: 8, casing: "upper" }),
          estado: faker.helpers.enumValue(EstadoExemplar),
          obra,
        }),
      ),
    );
    await repoExemplares.save(exemplares);
    totalExemplares += exemplares.length;
    process.stdout.write(`\r  ${inicio + 100} obras, ${totalExemplares} exemplares`);
  }

  console.log("\nPronto.");
  await dataSource.destroy();
}

semear().catch((erro) => {
  console.error("Falhou:", erro);
  process.exit(1);
});
