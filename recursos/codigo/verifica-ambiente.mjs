#!/usr/bin/env node
/**
 * Verificação do ambiente da disciplina DPW.
 *
 * Este script CONFERE o ambiente; ele não instala nem configura nada. Montar o
 * ambiente é conteúdo da disciplina e os comandos são digitados por você — aqui
 * só entra o diagnóstico, com a dica de correção de cada falha.
 *
 * A instalação acontece em três momentos, e o script confere só o que já deveria
 * existir naquele ponto do curso:
 *
 *     node verifica-ambiente.mjs                 semana 1  (M00)
 *     node verifica-ambiente.mjs --etapa m03     antes do M03: + backend
 *     node verifica-ambiente.mjs --etapa m05     antes do M05: + Docker
 *
 * Código de saída 0 se tudo passar, 1 caso contrário (útil em CI).
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { platform, release } from "node:os";

const WINDOWS = platform() === "win32";
const ETAPAS = ["m00", "m03", "m05"];

const i = process.argv.indexOf("--etapa");
const etapa = i !== -1 && process.argv[i + 1] ? process.argv[i + 1].toLowerCase() : "m00";
if (!ETAPAS.includes(etapa)) {
  console.error(`Etapa desconhecida: ${etapa}. Use uma de ${ETAPAS.join(", ")}.`);
  process.exit(2);
}
const EXIGE_BACKEND = ETAPAS.indexOf(etapa) >= ETAPAS.indexOf("m03");
const EXIGE_DOCKER = ETAPAS.indexOf(etapa) >= ETAPAS.indexOf("m05");

let falhas = 0;

const check = (nome, condicao, dica) => {
  console.log(`[${condicao ? "OK   " : "FALHA"}] ${nome}`);
  if (!condicao) {
    console.log(`          -> ${dica}`);
    falhas += 1;
  }
};
const info = (texto) => console.log(`[INFO ] ${texto}`);

/** Roda um comando e devolve a saída, ou null se o comando não existir/falhar. */
const rodar = (cmd) => {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

/** Extrai o "major" de uma string tipo "v20.11.0" ou "9.12.3". */
const maior = (versao) => Number.parseInt(String(versao).replace(/^v/, "").split(".")[0], 10);

console.log("=".repeat(62));
console.log("  Verificação do ambiente — Desenvolvimento de Projeto Web");
console.log("=".repeat(62));
info(`Sistema: ${platform()} ${release()}`);
info(`Etapa verificada: ${etapa.toUpperCase()}`);
if (!EXIGE_BACKEND) {
  info("Backend e Docker ainda nao sao exigidos — use --etapa m03 / m05 depois");
}
if (WINDOWS) {
  info("Guia de setup do Windows: docs/ambiente-setup-windows.md");
  info("Tabela de equivalencias:  recursos/comandos-windows.md");
}

// --- Node -----------------------------------------------------------------
const versaoNode = process.versions.node;
check(
  "Node >= 20",
  maior(versaoNode) >= 20,
  "Instale o Node 20 LTS (https://nodejs.org) e reabra o terminal",
);
info(`Node v${versaoNode}`);

// --- pnpm -----------------------------------------------------------------
const versaoPnpm = rodar("pnpm --version");
check(
  "pnpm instalado",
  versaoPnpm !== null,
  "corepack enable && corepack prepare pnpm@latest --activate",
);
if (versaoPnpm) {
  info(`pnpm ${versaoPnpm}`);
  check("pnpm >= 9", maior(versaoPnpm) >= 9, "corepack prepare pnpm@latest --activate");
}

// --- Git ------------------------------------------------------------------
const versaoGit = rodar("git --version");
check("Git instalado", versaoGit !== null, "Instale o Git: https://git-scm.com/downloads");

if (versaoGit) {
  const nome = rodar("git config --global user.name");
  const email = rodar("git config --global user.email");
  check(
    "Git configurado (user.name e user.email)",
    Boolean(nome && email),
    'git config --global user.name "Seu Nome" e ' +
      'git config --global user.email "voce@exemplo.com"',
  );
}

// --- Repositório ----------------------------------------------------------
let raiz = null;
for (const pasta of [".", "..", "../.."]) {
  if (existsSync(join(pasta, ".git"))) {
    raiz = pasta;
    break;
  }
}

if (raiz) {
  check(
    ".gitattributes presente",
    existsSync(join(raiz, ".gitattributes")),
    "Crie o .gitattributes com '*.sh text eol=lf' — sem ele o deploy do M16 falha " +
      "com 'bad interpreter' (ver ambiente-setup.md, secao 10)",
  );
} else {
  info("Fora de um repositorio Git — verificacoes do repositorio puladas");
}

// --- Backend (a partir do M03) -------------------------------------------
if (EXIGE_BACKEND) {
  let achou = false;
  for (const pasta of ["backend", "../backend", "."]) {
    const pkg = join(pasta, "package.json");
    if (existsSync(pkg)) {
      const deps = JSON.parse(readFileSync(pkg, "utf8")).dependencies ?? {};
      check(
        "NestJS instalado",
        "@nestjs/core" in deps,
        "Rode 'pnpm install' na raiz do monorepo",
      );
      check(
        "TypeORM instalado",
        "typeorm" in deps,
        "pnpm --filter backend add @nestjs/typeorm typeorm",
      );
      achou = true;
      break;
    }
  }
  if (!achou) {
    check(
      "package.json do backend encontrado",
      false,
      "Rode este script de dentro do monorepo (o M03 cria a pasta backend/)",
    );
  }
}

// --- Docker (a partir do M05) --------------------------------------------
if (EXIGE_DOCKER) {
  if (rodar("docker --version")) {
    check(
      "Docker em execucao",
      rodar("docker info") !== null,
      WINDOWS
        ? "Abra o Docker Desktop pelo menu Iniciar e espere a baleia estabilizar"
        : "sudo systemctl start docker (Linux) ou abra o Docker Desktop (macOS)",
    );
  } else {
    check(
      "Docker instalado",
      false,
      WINDOWS
        ? "No Windows exige o WSL2 antes — ver ambiente-setup-windows.md, passo 7"
        : "https://docs.docker.com/engine/install/",
    );
  }
}

// --- Específico do Windows ------------------------------------------------
if (WINDOWS) {
  console.log("-".repeat(62));
  console.log("  Verificacoes especificas do Windows");
  console.log("-".repeat(62));

  // 1. curl.exe: no PowerShell, `curl` e alias de Invoke-WebRequest
  check(
    "curl.exe disponivel",
    rodar("curl.exe --version") !== null,
    "Use sempre 'curl.exe' no PowerShell — 'curl' e alias de Invoke-WebRequest",
  );

  // 2. Pasta do projeto: OneDrive, espaco e acento sao a causa n1 de problema
  const cwd = process.cwd();
  check(
    "Projeto fora do OneDrive",
    !cwd.toLowerCase().includes("onedrive"),
    "Mova o projeto para C:\\dev — o OneDrive sincroniza node_modules, travando o " +
      "pnpm install e produzindo mudancas fantasma no Git",
  );
  check(
    "Caminho sem espaco nem acento",
    !cwd.includes(" ") && /^[\x20-\x7E]*$/.test(cwd.replace(/ /g, "")),
    `Caminho atual: ${cwd} — mova para C:\\dev. Espacos e acentos quebram ` +
      "ferramentas que nao poem aspas nos caminhos",
  );

  // 3. Finais de linha
  if (raiz) {
    check(
      "git core.autocrlf = input",
      rodar("git config --get core.autocrlf") === "input",
      "git config --global core.autocrlf input",
    );
  }

  // 4. Caminhos longos: um monorepo tem duas arvores de node_modules
  check(
    "core.longpaths habilitado",
    rodar("git config --get core.longpaths") === "true",
    "Num PowerShell como administrador: git config --system core.longpaths true",
  );

  info('Variaveis inline nao existem: use $env:VAR="x"; comando (e limpe depois)');
  info("Ao gerar arquivo de texto, use Out-File -Encoding utf8 — nunca '>'");
}

// --- Resultado ------------------------------------------------------------
console.log("-".repeat(62));
if (falhas === 0) {
  console.log(`Ambiente da etapa ${etapa.toUpperCase()} pronto. Bom curso!`);
  if (etapa === "m00") console.log("Antes do M03, rode de novo com: --etapa m03");
  else if (etapa === "m03") console.log("Antes do M05, rode de novo com: --etapa m05");
  if (WINDOWS) {
    console.log("Leia as cinco armadilhas do Windows: recursos/comandos-windows.md (secao 2)");
  }
} else {
  console.log(`${falhas} item(ns) precisam de correcao antes da aula.`);
}
console.log("-".repeat(62));

process.exit(falhas === 0 ? 0 : 1);
