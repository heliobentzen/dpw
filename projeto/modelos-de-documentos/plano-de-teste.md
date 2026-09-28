# Plano de Teste

> Etapa 2 · Salve em `docs/plano-de-teste.md`.

**Projeto:** `<nome>` · **Versão testada:** `<commit/tag>` · **Data:** `<AAAA-MM-DD>`

---

## 1. Estratégia

| Nível | O que cobre | Ferramenta | Quantidade |
|---|---|---|---|
| Unitário | Regras de negócio nos services | Vitest | |
| Integração | Controller + banco | Vitest + Supertest | |
| Permissões | Matriz papel × rota | Vitest com `it.each` | |
| Manual | Fluxos principais | Roteiro humano | |
| Cliente real | Uso da API pelo parceiro (Swagger ou cliente dele) | Observação | |
| Carga simples | Desempenho com volume | `logging: true` do TypeORM + `curl -w` | |

**Ambiente de teste:** `<PostgreSQL 16 no Docker, Node 24, dados gerados por src/semear.ts>`

## 2. Testes automatizados

| # | Arquivo::teste | O que garante | Regra relacionada |
|---|---|---|---|
| 1 | `emprestimos.service.spec.ts` › calcula prazo padrão | Prazo de devolução é 7 dias | RN-01 |
| 2 | | | |

**Cobertura:** `<X>%` geral · `<Y>%` nas regras de negócio
**Comando:** `npm test -- --coverage`

## 3. Matriz de acesso

| Rota | Método | Anônimo | Papel A | Papel B | Papel C | Recurso de outro usuário |
|---|---|:---:|:---:|:---:|:---:|:---:|
| | GET | | | | | |
| | POST | | | | | |

Todas as células cobertas por teste automatizado? `<sim/não>` · Arquivo: `<...>`

## 4. Testes manuais de fluxo

### F01 — `<nome do fluxo>`

**Pré-condição:** `<estado inicial: usuário logado como X, dados existentes>`

| # | Ação | Resultado esperado | Resultado obtido | ✅/❌ |
|---|---|---|---|:---:|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Caminhos de erro testados:**

| # | Ação inválida | Resultado esperado | Obtido | ✅/❌ |
|---|---|---|---|:---:|
| 1 | | | | |

## 5. Teste com usuário real ⭐

| Campo | Conteúdo |
|---|---|
| Participante | `<função na organização — sem nome completo>` |
| Data e local | |
| Tarefa solicitada | `<uma frase, sem dizer COMO fazer>` |
| Tempo até concluir | |
| Concluiu sozinho? | |

**Observações** (o que a pessoa fez, não o que você acha que ela deveria ter feito):

| Momento | O que aconteceu | Gravidade |
|---|---|---|
| | Hesitou por 20s procurando o botão de emprestar | Alta |
| | Clicou em "Cancelar" achando que era "Confirmar" | Crítica |

**Falas literais:**

> "`<...>`"

**Correções feitas em resposta:**

| Problema | Correção | Commit |
|---|---|---|
| | | |

**Segunda rodada** (após as correções): `<repetir a tabela acima com outra pessoa>`

## 6. Desempenho

Com `<N>` registros no banco:

| Rota | Tempo | Nº de consultas | N+1? | Ação |
|---|---:|---:|:---:|---|
| `GET` da listagem principal | | | | |
| `GET` do detalhe | | | | |
| `GET` do relatório | | | | |

Meta: nenhuma rota acima de 2s; nenhuma consulta N+1.

## 7. Segurança

| Verificação | Resultado |
|---|---|
| Checklist de segurança ([`recursos/checklists/seguranca.md`](../../recursos/checklists/seguranca.md)) percorrido | |
| Acesso a recurso de outro usuário (IDOR) | |
| Rota de escrita sem autenticação (espera 401) | |
| Campo extra no corpo, como `"papel":"admin"` (espera 400) | |
| `' OR '1'='1` em cada busca | |
| Rota administrativa como usuário comum | |
| `npm audit --audit-level=high` | |

## 8. Bugs encontrados

| # | Descrição | Gravidade | Como reproduzir | Situação | Teste de regressão |
|---|---|---|---|---|---|
| B01 | | Crítica | | Corrigido | `test_...` |

**Gravidade:** Crítica (perda de dados, falha de segurança, impede o uso) · Alta (impede
uma funcionalidade) · Média (contorna-se) · Baixa (cosmético).

## 9. Conclusão

| Critério | Resultado |
|---|---|
| Todos os testes automatizados passando | |
| Todos os fluxos principais manuais aprovados | |
| Bugs críticos e altos corrigidos | |
| Verificações de segurança aprovadas | |
| Teste com usuário real realizado e incorporado | |

**Bugs conhecidos não corrigidos** (e por quê):

| # | Bug | Por que não foi corrigido | Impacto para o usuário |
|---|---|---|---|
| | | | |

> Declarar bug conhecido é maturidade profissional. Omitir é o oposto.
