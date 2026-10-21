# Recursos de apoio

Material de consulta. A coluna **Rubrica** diz o que cada item ajuda a cumprir; os marcados
➕ são **opcionais**: nenhuma rubrica os cobra.

## Código

| Arquivo | Módulo | Para quê | Rubrica |
| --- | --- | --- | --- |
| [`servidor-minimo.mjs`](codigo/servidor-minimo.mjs) | M01 | Servidor HTTP sem framework | Portfólio E0 |
| [`semear.ts`](codigo/semear.ts) | M06 | Gera dados de volume no banco | Portfólio E1 (*seed*) e E2 (medição do N+1) |
| [`verifica-ambiente.mjs`](codigo/verifica-ambiente.mjs) | M00, M03, M04 | **Confere** o ambiente, sem instalar nada; `--etapa m00`, `m03` ou `m04` | Apoio |
| ➕ [`vulneravel.ts`](codigo/vulneravel.ts) | M09 | Laboratório extra com 10 vulnerabilidades | — |

> ⚠️ `vulneravel.ts` é **deliberadamente inseguro**. Serve só para estudo; nunca use nada
> dele em produção.

## Checklists

| Arquivo | Quando usar | Rubrica |
| --- | --- | --- |
| [`entrega-de-etapa.md`](checklists/entrega-de-etapa.md) | Na véspera de cada entrega | Todas as etapas e a extensão |
| [`revisao-de-codigo.md`](checklists/revisao-de-codigo.md) | Ao revisar um Pull Request | Etapa 3 · G2 (PRs revisados) |
| [`seguranca.md`](checklists/seguranca.md) | Antes de pôr no ar | Portfólio E5 · Etapa 3, bloco D |
| [`deploy.md`](checklists/deploy.md) | Antes e depois de cada implantação | Portfólio E8 · Etapa 3, bloco F |

## Windows

| Arquivo | Quando usar | Rubrica |
| --- | --- | --- |
| [`comandos-windows.md`](comandos-windows.md) | 🪟 Quando um roteiro trouxer comando de Linux | Apoio. O essencial está no [guia de ambiente](../docs/ambiente-setup.md#passo-10--erros-e-diagnóstico) |

## ➕ Para ir além

**Ferramentas** usadas ou citadas no curso: Vitest e Supertest (testes), oxlint e Prettier
(padrão de código), openapi-typescript (tipos do contrato), `npm audit` e secretlint
(segurança), Mermaid (diagramas C4 e ER), GitHub Projects (backlog), UptimeRobot (monitor),
curl, httpie ou Bruno (requisições).

**Referências rápidas:**
[NestJS](https://docs.nestjs.com/) ·
[TypeORM](https://typeorm.io/) ·
[MDN — HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP) ·
[OWASP API Security Top 10](https://owasp.org/API-Security/) ·
[OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/) ·
[C4 Model](https://c4model.com/) ·
[Mermaid](https://mermaid.js.org/) ·
[httpbin.org](https://httpbin.org) ·
[Learn Git Branching](https://learngitbranching.js.org/?locale=pt_BR)
