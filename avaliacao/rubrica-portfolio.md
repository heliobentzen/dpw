# Rubrica — Portfólio de atividades práticas (E0–E8)

> **Peso:** 20% da nota final · **Individual** · Entrega contínua, semanas 2 a 16

Todas as entregas ficam no repositório pessoal do BiblioCom criado no M00. Cada estudante
percorre sozinho o caminho completo de uma API — do HTTP ao deploy —, independentemente da
divisão de tarefas na equipe.

## Entregas

| Código | Entrega | Módulo |
| --- | --- | --- |
| **E0** | Relatório de inspeção HTTP | M01 |
| **E1** | Modelo de dados do BiblioCom | M04 |
| **E2** | Caderno de consultas + otimização N+1 | M06 |
| **E3** | API CRUD documentada (DTOs, validação, paginação, Swagger) | M07 |
| **E4** | Login, papéis e rotas protegidas | M08 |
| **E5** | Checklist OWASP aplicado à API | M09 |
| **E6** | Suíte de testes verde no CI | M10 |
| **E7** | Schema OpenAPI versionado e consumidor externo | M11 |
| **E8** | API em produção | M12 |

## Nota

| Nível | Pontos | Critério |
| --- | ---: | --- |
| **Excelente** | 4 | Tudo do "Essencial" + algo a mais relevante (desafio ⭐, reflexão própria) |
| **Adequado** | 3 | Todo o "Essencial" funcionando |
| **Em desenvolvimento** | 2 | Parte do "Essencial" falta ou está errada |
| **Insuficiente** | 1 | Muito incompleto |
| **Não entregue** | 0 | — |

**Nota do portfólio** = (soma das 9 entregas ÷ 36) × 10

## Essencial por entrega

Três a quatro itens verificáveis. O restante dos exercícios do módulo é prática, não requisito.

| Entrega | Essencial |
| --- | --- |
| **E0** | 5+ `curl` com saída comentada (métodos, status, cabeçalhos) · servidor mínimo no repositório · parágrafo sobre o que no HTTP mais influencia o design de APIs |
| **E1** | Entidades TypeORM migradas, com 1-N e N-N · diagrama ER · `onDelete` de cada FK justificado · *seed* com dados de exemplo |
| **E2** | Consultas com `Repository`/`QueryBuilder` e o SQL gerado · um caso de N+1 corrigido, com medição antes/depois |
| **E3** | CRUD de 2+ recursos · DTOs de entrada (`whitelist`) e de saída separados · status corretos (201, 204, 400, 404, 409/422) · paginação com teto · `/api/docs` com erros documentados |
| **E4** | Senha com hash · login emitindo token/sessão com expiração · 2 papéis · `curl` mostrando 401 e 403 · ADR da escolha token × sessão |
| **E5** | Casos de IDOR, entrada hostil e segredos testados e corrigidos · Helmet, CORS e *rate limit* configurados · antes/depois registrado |
| **E6** | Testes e2e (Jest + Supertest) de regra, validação e acesso · CI rodando lint + testes · badge no README |
| **E7** | `openapi.json` no repositório · CI falha se o schema divergir · um cliente consumindo a API só pelo contrato |
| **E8** | URL pública com HTTPS · `/health` verificando o banco · migrações aplicadas em produção · `docs/deploy.md` que outra pessoa consegue seguir |

## Correção

1. **Todas:** conferência rápida do "Essencial" (a maioria verificável por URL, CI ou `curl`).
2. **Por amostragem:** 30% das entregas recebem correção detalhada com feedback escrito; quem
   foi sorteado numa rodada não é sorteado na seguinte.
3. **Integral:** E5 (segurança) e E8 (deploy) — onde o erro é silencioso.

## Reentrega

Entregas com nota 0, 1 ou 2 podem ser refeitas até a **semana 19**, valendo no máximo 3 (Adequado). O
objetivo é que todos percorram o caminho técnico completo, não penalizar quem levou mais tempo.
