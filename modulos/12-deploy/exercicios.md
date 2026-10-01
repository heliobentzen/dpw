# M12 — Exercícios

## E12.1 — Deploy de outra pessoa (em duplas) ⭐

Troquem os `docs/deploy.md`. Cada pessoa faz o deploy do BiblioCom **da outra**, numa conta
própria, seguindo **só** o documento — sem perguntar nada.

**Verificação:**

- [ ] A API ficou no ar e passou na verificação da etapa 12
- [ ] Toda dúvida que surgiu foi anotada e virou correção no documento da outra pessoa
- [ ] Nenhum segredo apareceu no documento

---

## E12.2 — Cinco falhas de propósito (individual)

Provoque cada falha **no ensaio geral da sua máquina** (etapa 8) — não em produção — e
registre o sintoma antes de corrigir:

| # | Falha | Como provocar | Sintoma | Correção |
|---|---|---|---|---|
| 1 | Porta fixa | Trocar `process.env.PORT ?? 3000` por `4000` e subir com `$env:PORT="3000"` | | |
| 2 | Proxy sem confiança | Comentar o `trust proxy` | | |
| 3 | Variável faltando | Remover o `SESSION_SECRET` da sessão **e** renomear o `.env` temporariamente (senão ele fornece o valor) | | |
| 4 | Migração esquecida | Subir com `start:prod` sem o `migration:run:prod`, num banco vazio | | |
| 5 | Banco fora do ar | `docker compose stop db` com a API rodando | | |

O objetivo é reconhecer o **sintoma** antes de precisar procurar a causa. Em produção, essa
associação vale horas.

---

## E12.3 — Mudança incompatível em produção (individual) ⭐⭐

Com dados cadastrados em produção, acrescente `Obra.idioma`, **obrigatório**, pelo caminho
expandir → migrar → contrair:

1. Antes de começar: gere um backup e **confira** que o arquivo tem conteúdo.
2. Deploy 1: coluna opcional.
3. Deploy 2: migração de dados preenchendo as obras existentes.
4. Deploy 3: coluna obrigatória.

Depois de cada deploy, rode a verificação da etapa 12 e confira uma obra antiga.

**Responda:** se o deploy 2 tivesse um bug no código (não na migração), reverter só o código
seria seguro? E se o bug estivesse no deploy 3?

---

## E12.4 — A sessão no banco (individual)

1. Faça login em produção e guarde o cookie.
2. Dispare um novo deploy (um commit qualquer).
3. Use o cookie antigo. Ele ainda vale? Por quê?
4. Agora rode, contra o banco de produção, `SELECT count(*) FROM sessao;`. Quantas sessões
   existem? O que acontece com as vencidas?

---

## E12.5 — Homologação antes da produção (em equipe)

Montem o caminho completo do projeto da equipe:

```
push → CI → merge na main → deploy automático em HOMOLOGAÇÃO
      → verificação manual → promoção para PRODUÇÃO
```

Requisitos: dois serviços, **dois bancos**, variáveis separadas, e nenhum dado real de
pessoa no banco de homologação. Documentem no `docs/deploy.md` como uma versão sai de um
ambiente e chega ao outro.

---

## Gabarito parcial

**E12.2** — 1: o serviço sobe, e nada responde na porta esperada. 2: login `200` sem
`Set-Cookie`; a requisição seguinte, `401`. 3: a API **não sobe** — o esquema de validação
do M03 barra, com mensagem clara (é a vantagem de validar o ambiente). 4: a API sobe, e a
primeira consulta responde `500` com `relation "…" does not exist` no log. 5: `/api/health`
responde `503`; as outras rotas, `500`.

**E12.3** — No deploy 2, sim: o código antigo convive com a coluna opcional. No deploy 3,
não necessariamente: se o código anterior criava obras sem `idioma`, ele passa a falhar
contra a coluna obrigatória — reverter o código exige reverter também a migração.

**E12.4** — (3) Vale: a sessão está no PostgreSQL, que não foi recriado pelo deploy. (4) O
`connect-pg-simple` apaga periodicamente as linhas com `expire` no passado, usando o índice
criado na migração.
