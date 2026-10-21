# Etapa 4 — Relatório e encerramento

> **Entrega:** P4 · **Semanas:** 19–20 · **Peso:** 10% · **Eliminatória** ·
> **Rubrica:** [`rubrica-etapa-4.md`](../../avaliacao/rubrica-etapa-4.md)

## 🎯 O que esta etapa produz

O registro técnico do que foi feito, a apresentação com demonstração ao vivo e a
**transferência** do sistema para a organização parceira.

> Relato de experiência, capacitação e devolutiva são avaliados **uma vez só**, na
> [extensão](../extensao/). Aqui fica o que é técnico.

---

## Pré-requisitos

- [ ] Relatório entregue
- [ ] Apresentação realizada
- [ ] Sistema transferido à organização parceira
- [ ] Avaliação por pares entregue por **todos** ([modelo](../modelos-de-documentos/avaliacao-por-pares.md))

---

## O que entregar, critério por critério

### Relatório técnico

Modelo em [relatório técnico](../modelos-de-documentos/relatorio-tecnico.md). Três critérios
da rubrica saem dele:

**1. Decisões técnicas · peso 2,0** — Explique arquitetura, modelo de dados e contrato com
diagramas. Para cada decisão importante, diga **por que** e **o que foi descartado** (os
ADRs). Listar tecnologias não é justificar.

**2. Resultados e limitações · peso 2,0** — Retome as metas da Etapa 1 e compare com o que
aconteceu, com evidência:

| Objetivo | Meta | Alcançado | Evidência |
| --- | --- | --- | --- |
| Registrar mais rápido | < 1 min | 45 s (média de 5) | Cronometragem, 12/11 |
| Uso efetivo | ≥ 20 registros | 34 registros | Consulta no banco |

**Meta não alcançada não reprova.** Reprova omitir ou maquiar. Declare também os bugs
conhecidos e as dívidas técnicas.

**3. Escrita · peso 1,0** — Clara, objetiva, dentro do limite de páginas, com figuras e
referências citadas.

### Apresentação

**20 minutos + 10 de arguição.** Todos falam.

| Tempo | Conteúdo |
| --- | --- |
| 3 min | O problema, contado pela história de uma pessoa real |
| 2 min | A solução: o que faz e o que não faz |
| **8 min** | **Demonstração ao vivo** |
| 4 min | Decisões técnicas e testes |
| 3 min | Resultados medidos e limitações |

**4. Demonstração · peso 2,0** — Na API **em produção**, percorrendo o cenário principal da
Etapa 1 **e** um caso de erro ou acesso negado (401, 403, 404). Tenha um vídeo de 3 minutos
como plano B.

**5. Domínio técnico · peso 2,0** — Na arguição, cada pessoa explica uma parte que **não**
escreveu. Exemplos de pergunta:

- "Onde está a regra que impede emprestar a mesma ferramenta duas vezes? Por que ali?"
- "Como vocês garantem que um usuário não vê o registro de outro?"
- "Se a organização quiser um campo obrigatório novo amanhã, qual é o procedimento?"

### Transferência

**6. Entrega técnica à organização · peso 1,0** — O sistema passa a ser da organização, não
de um aluno. Use o [termo de transferência](../modelos-de-documentos/termo-de-transferencia.md):

- [ ] Repositório, hospedagem, banco e domínio no nome da organização
- [ ] Senhas trocadas após a transferência
- [ ] Custo mensal e quem paga, documentados
- [ ] Rotina de backup e restauração documentada
- [ ] 2 pessoas da organização com acesso de administrador

---

## 📦 Entrega P4

| Item | Formato | Semana |
| --- | --- | ---: |
| Relatório técnico | PDF | 19 |
| Slides e vídeo de demonstração (3 min) | PDF + link | 20 |
| Apresentação e arguição | Presencial, 20 + 10 min | 20 |
| Termo de transferência assinado | PDF | 20 |
| Avaliação por pares | Formulário individual | 20 |

## ⚠️ Erros comuns

| Erro | Correção |
| --- | --- |
| Relatório que descreve tecnologias | Justifique escolhas e mostre as alternativas |
| Omitir metas não alcançadas | Analise-as: isso vale nota |
| Demonstração em `localhost` | Use a URL de produção |
| Só uma pessoa apresenta | Todos falam; a arguição é individual |
| Conta de hospedagem no nome de um aluno | Transfira tudo para a organização |
