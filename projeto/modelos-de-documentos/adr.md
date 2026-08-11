# ADR — Architecture Decision Record

> Etapas 2 e 3 · Um arquivo por decisão, em `docs/adr/NNNN-titulo-curto.md`.
> ADR registra **por que** algo foi decidido — a informação que se perde primeiro e faz
> mais falta seis meses depois.

## Quando escrever um ADR

Escreva quando a decisão: é difícil de reverter, afeta várias partes do sistema, gerou
discussão na equipe, ou vai ser questionada por alguém no futuro ("por que vocês não
usaram X?").

**Não** escreva para: nome de variável, escolha de cor, decisão trivial e reversível.

---

## Modelo

```markdown
# ADR-0003 — Usar sessão do Django em vez de JWT para autenticação

- **Status:** aceito
- **Data:** 2026-09-14
- **Decisores:** Ana, Bruno, Carla
- **Substitui:** —
- **Substituído por:** —

## Contexto

O sistema tem dois tipos de cliente previstos: o navegador (uso principal, pela secretaria)
e, possivelmente, um totem de consulta no futuro. Precisamos escolher o mecanismo de
autenticação.

Restrições relevantes:
- A equipe tem 5 meses e nenhuma experiência prévia com JWT.
- Todo o uso previsto é no mesmo domínio.
- Precisamos poder revogar acesso imediatamente (rotatividade de voluntários).

## Decisão

Vamos usar autenticação por **sessão** (`django.contrib.auth`), com cookies
`HttpOnly`/`Secure`/`SameSite=Lax`.

## Alternativas consideradas

| Opção | Prós | Contras | Por que não |
|---|---|---|---|
| Sessão (escolhida) | Nativo, seguro por padrão, revogação imediata, CSRF já tratado | Não serve bem para cliente fora do domínio | — |
| JWT | Bom para APIs e mobile; sem estado no servidor | Revogação difícil; mais superfície de erro; equipe sem experiência | Não temos cliente que justifique; revogação é requisito |
| OAuth com provedor externo | Sem gestão de senhas | Depende de conta Google/etc.; parte dos usuários não tem | Público-alvo inclui pessoas sem e-mail ativo |

## Consequências

**Fica mais fácil:** login e permissões saem prontos; proteção CSRF é automática; revogar
acesso é apagar a sessão.

**Fica mais difícil:** se houver app mobile no futuro, será preciso adicionar
autenticação por token (o DRF suporta as duas simultaneamente — custo estimado: 1 sprint).

**Precisa acontecer:** configurar `SESSION_COOKIE_SECURE` e `CSRF_COOKIE_SECURE` no deploy.
```

---

## Índice de ADRs do projeto

Mantenha em `docs/adr/README.md`:

| # | Título | Status | Data |
|---|---|---|---|
| 0001 | | aceito | |
| 0002 | | aceito | |
| 0003 | | substituído por 0007 | |

**Status possíveis:** proposto · aceito · rejeitado · obsoleto · substituído por ADR-NNNN.

> **Nunca apague um ADR.** Se a decisão mudou, escreva um novo e marque o antigo como
> substituído. O valor do registro está justamente na trilha de raciocínio ao longo do
> tempo.

## ADRs mínimos exigidos na Etapa 2

1. Escolha da stack (linguagem, framework, banco) e justificativa
2. Estratégia de autenticação e modelo de papéis
3. Uma decisão de escopo técnico relevante (o que **não** será feito e por quê)

Na Etapa 3, acrescente ao menos mais um ADR sobre uma decisão tomada durante o
desenvolvimento.
