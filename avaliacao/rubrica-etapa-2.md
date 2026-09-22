# Rubrica — Etapa 2: Sistema preliminar

> **Peso:** 10% da nota final · **Entrega:** semana 12
> Escala por critério: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Avaliador:** `<...>` · **Data:** `<...>`

Checkpoint técnico: valida que o núcleo do backend (modelo de dados e API) funciona antes de
integrar frontend, segurança, implantação e o restante do que será cobrado por inteiro na
[Etapa 3 — sistema final](rubrica-etapa-3.md). Por isso a nota é mais branda e admite
recuperação — o objetivo é corrigir o rumo cedo, não eliminar quem está atrasado.

## Pré-requisitos (sim/não)

Sem eles, a entrega volta para a equipe antes de ser pontuada.

| Verificação | Sim | Não |
| --- | :---: | :---: |
| Repositório acessível, com o código do backend | ☐ | ☐ |
| Modelo de dados versionado (migrações aplicadas, sem erro) | ☐ | ☐ |
| Ao menos um endpoint de API funcionando fim a fim (banco → resposta) | ☐ | ☐ |

## Critérios

| Critério | Peso | 4 — Excelente | 3 — Adequado | 2 — Em desenvolvimento | 0–1 — Insuficiente | Nível |
| --- | ---: | --- | --- | --- | --- | :---: |
| **1. Modelo de dados** | 3,0 | 5+ models corretos, com relações, `on_delete` justificado e restrições de integridade testadas | 5+ models corretos, com relações e restrições básicas | 3–4 models ou relações confusas | Menos de 3 models ou modelagem que não sustenta as regras | |
| **2. API e CRUD** | 4,0 | CRUD completo em 3+ recursos, com DTOs de entrada e saída separados | CRUD completo em 2 recursos | CRUD parcial | Não funciona | |
| **3. Validação e consultas** | 2,0 | Validação de servidor cobrindo as regras, mais filtros ou paginação | Validação de servidor cobrindo as regras principais | Validação incompleta | Sem validação de servidor | |
| **4. Organização do código** | 1,0 | Código legível, lint limpo, regra de negócio fora da view/controller | Lint limpo, código compreensível | Alguns problemas de organização | Código ilegível ou duplicado | |
| **Total** | **10** | | | | | |

**Nota da etapa** = Σ (nível × peso) ÷ 4
**Nota individual** = nota da etapa × fator de participação (0,7–1,1)

---

## Devolutiva

**Pontos fortes:**

**O que ajustar antes da Etapa 3 (sistema final):**

**Aprovado para seguir?** ☐ Sim ☐ Sim, com ajustes ☐ Não — corrigir e reenviar (recuperação)
