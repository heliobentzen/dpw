# Modelos de documentos

Modelos prontos para o projeto. Cada um diz **para que serve** e **onde é usado**; os
marcados ➕ são ferramentas de trabalho que nenhuma rubrica pontua. Dentro de cada modelo,
as seções ➕ também são opcionais.

| Documento | Para quê | Quando | Usado em |
| --- | --- | --- | --- |
| [Contrato de equipe](contrato-de-equipe.md) | Combinar horários, papéis e o que é "pronto" antes do primeiro conflito | Semana 1 | P1 · pré-requisito |
| ➕ [Carta de anuência](carta-de-anuencia.md) | Registrar que a organização aceitou participar | Semanas 2–4 | Só na trilha opcional |
| ➕ [Ata de reunião](ata-de-reuniao.md) | Guardar o que foi dito e decidido | Encontros importantes | Trilha opcional (obrigatória lá) |
| ➕ [Canvas do projeto](canvas-do-projeto.md) | Ver o projeto inteiro numa página | Semana 3 | — |
| [Backlog e histórias](backlog-e-historias.md) | Quebrar o escopo em pedaços que cabem numa sprint | Semana 3 em diante | P1 · critério 4; P3 · critério 6 |
| [Matriz de riscos](matriz-de-riscos.md) | Ter o plano B pronto antes de precisar dele | Semana 4; revisar a cada sprint | P1 · critério 6 |
| [ADR](adr.md) | Registrar por que uma decisão técnica foi tomada | Quando a decisão acontece (M04, M08, M09, M12) | P4 · critério 1 |
| [Plano de teste](plano-de-teste.md) | Decidir o que testar e registrar o teste com usuário | Semanas 12–16 | P3 · critério 4 |
| [Relatório técnico](relatorio-tecnico.md) | Explicar decisões e resultados para quem vai manter | Semana 19 | P4 · critérios 1 a 3 |
| [Termo de transferência](termo-de-transferencia.md) | Deixar escrito como passar contas e acessos a quem vai manter | Semana 20 | P4 · critério 6 |
| [Avaliação por pares](avaliacao-por-pares.md) | Dar ao docente a visão de dentro da equipe (confidencial, sem nota) | Semana 20 | Fator de participação |
| ➕ [Relato de experiência](relato-de-experiencia.md) | Registrar o que a equipe aprendeu com a comunidade | Semana 20 | Só na trilha opcional |

## Onde guardar

Tudo no repositório da equipe, em `docs/`:

```
seu-projeto/
├── backend/
├── docs/
│   ├── contrato-de-equipe.md
│   ├── problema.md          ← P1: problema, personas, escopo e metas
│   ├── backlog.md
│   ├── riscos.md
│   ├── api.md               ← contrato inicial (M02)
│   ├── plano-de-teste.md
│   ├── teste-usuario.md
│   ├── deploy.md            ← M12
│   ├── manutencao.md        ← M13
│   ├── adr/
│   │   ├── 0001-....md
│   │   └── 0002-....md
│   └── atas/
│       └── 2026-08-12-primeira-conversa.md
└── README.md
```

Documentos versionados junto com o código mudam com ele, são revisados em PR, e o histórico
mostra quando cada decisão foi tomada. Documento em pasta de nuvem separada fica
desatualizado em duas semanas.

## Regra de ouro

Todo documento aqui existe para ser **usado**, não para ser entregue. Se a equipe preencheu
a matriz de riscos e nunca mais olhou para ela, o documento falhou.

Revise, em cada retrospectiva de sprint: contrato de equipe, backlog e matriz de riscos.
São 10 minutos.
