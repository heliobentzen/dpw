# Rubrica — P2: Sistema preliminar

> **Peso:** 25% · **Entrega:** semana 10 · **Tem recuperação** · Orientações em
> [`projeto/etapa-2-sistema-preliminar/`](../projeto/etapa-2-sistema-preliminar/)
> Escala por critério: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Avaliador:** `<...>` · **Data:** `<...>`

**O que esta rubrica verifica:** se o núcleo da API — o banco e o CRUD do cenário principal —
funciona de verdade. É o ponto de controle do meio do semestre: o que estiver errado aqui
ainda dá tempo de corrigir antes da segurança, dos testes e do deploy.

## Pré-requisitos (sim/não)

Sem eles, a entrega volta para a equipe antes de ser pontuada.

| Verificação | Sim | Não |
| --- | :---: | :---: |
| Repositório da equipe acessível ao docente | ☐ | ☐ |
| Migrações aplicam sem erro num banco vazio | ☐ | ☐ |
| O cenário principal da P1 funciona de ponta a ponta (requisição → banco → resposta) | ☐ | ☐ |

## Critérios

| Critério | Peso | Módulo | 4 — Excelente | 3 — Adequado | 2 — Em desenvolvimento | 0–1 — Insuficiente | Nível |
| --- | ---: | --- | --- | --- | --- | --- | :---: |
| **1. Modelo de dados** | 3,0 | M04, M05 | 5+ entidades com 1-N e N-N; `onDelete` e restrições justificados por regra de negócio | 5+ entidades corretas, com relações e restrições básicas | 3–4 entidades ou relações confusas | Modelo não sustenta o cenário principal | |
| **2. API e CRUD** | 3,0 | M06, M07 | CRUD completo em 3+ recursos; DTOs de entrada e saída separados; status corretos | CRUD completo em 2 recursos, com status corretos | CRUD parcial | Não funciona | |
| **3. Validação e consultas** | 2,0 | M06, M07 | Validação cobrindo as regras; filtros e paginação com teto; sem N+1 | Validação das regras principais e paginação | Validação incompleta | Sem validação no servidor | |
| **4. Organização e trabalho em equipe** | 2,0 | M00, M03 | Regra no *service*; lint limpo; todos commitaram via PR revisado | Código organizado; todos commitaram | Concentração em 1–2 pessoas | Uma pessoa fez tudo | |
| **Total** | **10** | | | | | | |

**Nota da etapa** = Σ (nível × peso) ÷ 4
**Nota individual** = nota da etapa × fator de participação (0,7–1,1)

---

## Devolutiva

**Pontos fortes:**

**O que corrigir antes da P3:**

**Situação:** ☐ Segue ☐ Segue com ajustes ☐ Recuperação — reapresentar em até 2 semanas
