#!/usr/bin/env node
/**
 * M01 — Servidor HTTP sem framework.
 *
 * Mostra, em ~80 linhas, o que o NestJS faz por você: ler o método e o caminho,
 * escolher o que responder, montar cabeçalhos e devolver um corpo.
 *
 *     node servidor-minimo.mjs
 *     curl -i http://localhost:8000/            (Windows: curl.exe)
 *
 * Depois de rodar, compare com o M03: lá, cada uma destas responsabilidades tem
 * um lugar próprio (controller, service, pipe). Aqui está tudo num `if`.
 */

import { createServer } from "node:http";

const PORTA = 8000;

/** Tabela de rotas: método + caminho -> função que devolve [status, corpo]. */
const rotas = {
  "GET /": () => [200, { mensagem: "Olá! Este servidor não usa framework nenhum." }],

  "GET /obras": () => [
    200,
    [
      { id: 1, titulo: "Dom Casmurro", ano: 1899 },
      { id: 2, titulo: "Grande Sertão: Veredas", ano: 1956 },
    ],
  ],

  "GET /cabecalhos": (req) => [200, req.headers],
};

const servidor = createServer((req, res) => {
  // 1. O que o cliente pediu? Método e caminho vêm da primeira linha da
  //    requisição HTTP. Um framework faz isto e chama de "roteamento".
  const url = new URL(req.url, `http://${req.headers.host}`);
  const chave = `${req.method} ${url.pathname}`;

  // 2. POST: o corpo chega em pedaços, e é preciso juntá-los. O `@Body()` do
  //    NestJS esconde exatamente este bloco.
  if (req.method === "POST" && url.pathname === "/eco") {
    const pedacos = [];
    req.on("data", (p) => pedacos.push(p));
    req.on("end", () => {
      const cru = Buffer.concat(pedacos).toString("utf8");
      let corpo;
      try {
        corpo = JSON.parse(cru);
      } catch {
        // Sem validação automática: erro de formato é você quem trata.
        return responder(res, 400, { erro: "corpo não é JSON válido", recebido: cru });
      }
      responder(res, 201, { voce_enviou: corpo });
    });
    return;
  }

  // 3. Achar a rota. Sem tabela, isto vira uma escada de `if` — que é o que
  //    acontece em projetos sem framework depois de algumas semanas.
  const manipulador = rotas[chave];
  if (!manipulador) {
    return responder(res, 404, { erro: "rota não encontrada", caminho: url.pathname });
  }

  const [status, corpo] = manipulador(req);
  responder(res, status, corpo);
});

/** Monta a resposta: status, cabeçalhos e corpo. Tudo à mão. */
function responder(res, status, corpo) {
  const texto = JSON.stringify(corpo, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texto),
    // Nenhum cabeçalho de segurança vem de graça: sem framework, todos são seus.
    "X-Content-Type-Options": "nosniff",
  });
  res.end(texto);
}

servidor.listen(PORTA, () => {
  console.log(`Servidor em http://localhost:${PORTA}`);
  console.log("Rotas:", Object.keys(rotas).join(" | "), "| POST /eco");
  console.log("Ctrl+C para parar.");
});
