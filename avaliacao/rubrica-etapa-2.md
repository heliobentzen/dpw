# Rubrica — Etapa 2: Planejamento

> **Peso:** 7,5% · **Entrega:** semana 11
> Escala: 4 Excelente · 3 Adequado · 2 Em desenvolvimento · 0–1 Insuficiente

**Equipe:** `<...>` · **Data:** `<...>`

## Bloco A — Articulação da equipe (peso 2)

| # | Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|---|:---:|
| A1 | **Contrato de equipe** | Respostas específicas e verificáveis, inclusive para conflito e não entrega | Preenchido e assinado, sem generalidades | Genérico ("vamos nos comunicar bem") | Ausente ou não assinado | |
| A2 | **Disponibilidade real** | Declarada por pessoa, com horários e compromissos concorrentes; plano compatível | Declarada e considerada no cronograma | Declarada mas ignorada no plano | Não declarada | |
| A3 | **Papéis e rotação** | Definidos para as 4 etapas, com rotação real | Definidos, com plano de rotação | Definidos sem rotação | Indefinidos | |
| A4 | **Definition of Done** | Critérios objetivos, incluindo teste e revisão | Definida e acordada | Vaga | Ausente | |

## Bloco B — Documentos de planejamento (peso 3)

| # | Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|---|:---:|
| B1 | **Backlog** | Histórias bem escritas, todas com critérios de aceite verificáveis, incluindo caminhos de erro | Histórias no formato correto, *Must* com critérios de aceite | Histórias vagas ou sem critérios | Lista de tarefas técnicas, não de valor | |
| B2 | **Priorização** | MoSCoW aplicado com rigor; MVP só de *Must* e cabe na capacidade | Priorizado, MVP identificado | Quase tudo marcado *Must* | Sem priorização | |
| B3 | **Estimativas e capacidade** | Estimado, com capacidade calculada e folga prevista | Estimado e distribuído em sprints | Estimativas arbitrárias | Ausentes | |
| B4 | **Modelo de dados** | Diagrama completo, `on_delete` justificado, restrições expressando regras | Diagrama com entidades, relações e cardinalidades | Diagrama incompleto | Ausente | |
| B5 | **Arquitetura e ADRs** | 3+ ADRs com alternativas analisadas e consequências | 3 ADRs no formato correto | 1–2 ADRs superficiais | Ausentes | |
| B6 | **Matriz de riscos** | Riscos específicos do projeto, com exposição calculada, mitigação **e** plano B | Riscos relevantes com mitigação | Riscos genéricos | Ausente | |
| B7 | **Cronograma** | Semanal até a semana 20, com marcos, responsáveis e folga | Cronograma com marcos | Cronograma sem detalhe | Ausente | |

## Bloco C — Validação e ferramentas (peso 2)

| # | Critério | 4 | 3 | 2 | 0–1 | Nota |
|---|---|---|---|---|---|:---:|
| C1 | **Protótipo** | Todas as telas principais, com fluxo completo | Telas principais rascunhadas | Uma ou duas telas | Ausente | |
| C2 | **Validação com a organização** | Protótipo testado com usuário real; mudanças documentadas | Apresentado à organização, com ata | Mencionado sem evidência | Não validado | |
| C3 | **Quadro do projeto** | Populado com todas as histórias, sprints e responsáveis | Quadro criado e populado | Quadro vazio | Ausente | |
| C4 | **Repositório** | Estrutura pronta, CI configurado, `main` protegida, `docs/` organizada | Repositório com README e documentos | Repositório desorganizado | Ausente | |

---

## Cálculo

| Bloco | Peso | Média (0–4) | Ponderado |
|---|---:|---:|---:|
| A. Articulação | 2 | | |
| B. Documentos | 3 | | |
| C. Validação | 2 | | |
| **Total** | **7** | | |

**Nota** = (soma ponderada ÷ 28) × 10

---

## Verificação de viabilidade

Antes de aprovar a etapa, o docente confirma:

- [ ] A soma das estimativas dos *Must* cabe na capacidade declarada da equipe, com folga
- [ ] Existe pelo menos uma pessoa da equipe capaz de fazer cada parte técnica planejada
- [ ] O protótipo foi visto por alguém que vai usar o sistema
- [ ] Os riscos de exposição Alta/Crítica têm mitigação com responsável e prazo

Um "não" aqui exige replanejamento antes da semana 12 — o momento em que ainda dá tempo.

## Devolutiva

**Pontos fortes:**

**O que ajustar antes de começar a Etapa 3:**

**Escopo do MVP:** ☐ aprovado ☐ aprovado com redução de `<...>` ☐ replanejar
