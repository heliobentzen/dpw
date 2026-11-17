# P4 — Relatório e encerramento

> **Semanas:** 19–20 · **Peso:** 20% · **Eliminatória** ·
> **Rubrica:** [`rubrica-etapa-4.md`](../../avaliacao/rubrica-etapa-4.md)

## Por que esta etapa existe

Um sistema que só os autores entendem morre quando eles saem. E um resultado que ninguém
mediu não pode ser afirmado. Esta etapa fecha o projeto com três coisas que o mercado também
cobra: **explicar decisões**, **medir resultados com honestidade** e **entregar o sistema
para quem vai mantê-lo**.

## Objetivo

Ao final:

1. O **relatório técnico** registra por que o sistema é como é e o que ele alcançou.
2. A **apresentação** mostra o sistema funcionando em produção, e cada integrante demonstra
   que entende o todo.
3. O sistema está **pronto para ser entregue**: qualquer pessoa ou organização conseguiria
   assumir contas, deploy, backup e custos só com a documentação.

> A transferência **real** a uma organização, a capacitação e a devolutiva são avaliadas só
> na [trilha opcional](../extensao/), como bônus. Aqui fica o que é técnico.

## Como esta etapa usa as anteriores

| Vem de | Usado em |
| --- | --- |
| Metas (P1) e teste com usuário (P3) | Critério 2 — comparar com o resultado |
| ADRs escritos ao longo dos módulos | Critério 1 — decisões técnicas |
| Cenário principal (P1) e API no ar (P3) | Critério 4 — demonstração |
| Commits e PRs de cada pessoa | Critério 5 — arguição sobre o que não escreveu |

---

## Pré-requisitos

- [ ] Relatório entregue
- [ ] Apresentação realizada, com todos falando
- [ ] Avaliação por pares preenchida por **todos** ([modelo](../modelos-de-documentos/avaliacao-por-pares.md)) — formulário confidencial, não pontuado; alimenta o fator de participação

---

## O que entregar, critério por critério

### Relatório técnico

Modelo em [relatório técnico](../modelos-de-documentos/relatorio-tecnico.md).

**1. Decisões técnicas · peso 2,0** — *Para quê: quem assumir o sistema precisa saber por que
ele é assim antes de mudar.* Explique arquitetura, modelo de dados e contrato com diagramas.
Para cada decisão importante, diga **por que** e **o que foi descartado** (os ADRs). Listar
tecnologias não é justificar.

**2. Resultados e limitações · peso 2,0** — *Para quê: provar que o sistema fez diferença, ou
entender por que não fez.* Retome as metas da P1 e compare com o que aconteceu:

| Objetivo | Hoje (P1) | Meta | Alcançado | Evidência |
| --- | --- | --- | --- | --- |
| Registrar mais rápido | ~3 min | < 1 min | 45 s (média de 5) | Cronometragem, 12/11 |
| Uso efetivo | 0 | ≥ 20 registros | 34 registros | Consulta no banco |

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

**4. Demonstração · peso 2,0** — *Para quê: só a produção prova que funciona.* Na API **em
produção**, percorra o cenário principal da P1 **e** um caso de erro ou acesso negado (401,
403, 404). Tenha um vídeo de 3 minutos como plano B.

**5. Domínio técnico · peso 2,0** — *Para quê: garantir que o conhecimento não ficou com uma
pessoa só.* Na arguição, cada integrante explica uma parte que **não** escreveu. Exemplos:

- "Onde está a regra que impede emprestar a mesma ferramenta duas vezes? Por que ali?"
- "Como vocês garantem que um usuário não vê o registro de outro?"
- "Se quem usa pedir um campo obrigatório novo amanhã, qual é o procedimento?"

### Pronto para transferir

**6. Pronto para transferir · peso 1,0** — *Para quê: um sistema só serve a alguém se puder
sair das mãos de quem o fez.* Preencham o
[termo de transferência](../modelos-de-documentos/termo-de-transferencia.md) como se fossem
entregar o sistema amanhã (sem assinatura, se não houver organização real):

- [ ] Lista de contas (repositório, hospedagem, banco) e como mudar a titularidade
- [ ] Como trocar todas as senhas e segredos
- [ ] Custo mensal hoje e quando deixa de ser gratuito
- [ ] Rotina de backup e restauração documentada (M13)
- [ ] `docs/deploy.md` e `docs/manutencao.md` que outra pessoa segue sozinha

---

## 📦 Entrega P4

| Item | Formato | Semana |
| --- | --- | ---: |
| Relatório técnico | PDF | 19 |
| Slides e vídeo de demonstração (3 min) | PDF + link | 20 |
| Apresentação e arguição | Presencial, 20 + 10 min | 20 |
| Termo de transferência preenchido | PDF | 20 |
| Avaliação por pares | Formulário confidencial | 20 |

## ⚠️ Erros comuns

| Erro | Correção |
| --- | --- |
| Relatório que descreve tecnologias | Justifique escolhas e mostre as alternativas |
| Omitir metas não alcançadas | Analise-as: isso vale nota |
| Demonstração em `localhost` | Use a URL de produção |
| Só uma pessoa apresenta | Todos falam; a arguição é de cada um |
| Ninguém além da equipe sabe operar o sistema | Termo de transferência e manutenção completos |
