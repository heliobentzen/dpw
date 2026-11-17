# Recursos de apoio

Material de consulta. A coluna **Rubrica** diz o que cada item ajuda a cumprir; os marcados
➕ são **opcionais**: nenhuma rubrica os cobra.

## Código

| Arquivo | Módulo | Para quê | Rubrica |
| --- | --- | --- | --- |
| [`servidor-minimo.mjs`](codigo/servidor-minimo.mjs) | M01 | Servidor HTTP sem framework, para ver o que o NestJS esconde | Prática em aula |
| [`semear.ts`](codigo/semear.ts) | M06 | **Modelo** de script de dados fictícios com volume, para a equipe adaptar | P2 · critério 3 (medição do N+1) e demonstração |
| [`verifica-ambiente.mjs`](codigo/verifica-ambiente.mjs) | M00, M03, M04 | **Confere** o ambiente, sem instalar nada; `--etapa m00`, `m03` ou `m04` | Apoio |
| ➕ [`vulneravel.ts`](codigo/vulneravel.ts) | M09 | Laboratório extra com 10 vulnerabilidades | — |

> ⚠️ `vulneravel.ts` é **deliberadamente inseguro**. Serve só para estudo; nunca use nada
> dele em produção.

## Checklists

| Arquivo | Quando usar | Rubrica |
| --- | --- | --- |
| [`entrega-de-etapa.md`](checklists/entrega-de-etapa.md) | Na véspera de cada entrega | P1 a P4 e trilha opcional |
| [`revisao-de-codigo.md`](checklists/revisao-de-codigo.md) | Ao revisar um Pull Request | P3 · critério 6 (PRs revisados) |
| [`seguranca.md`](checklists/seguranca.md) | M09, antes de pôr no ar | P3 · critério 3 |
| [`deploy.md`](checklists/deploy.md) | M12, antes e depois de cada implantação | P3 · critério 5 |

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
