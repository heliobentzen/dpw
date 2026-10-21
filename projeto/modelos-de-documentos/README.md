# Modelos de documentos

Modelos prontos para as entregas do projeto. A coluna **Rubrica** diz onde cada um é avaliado;
os marcados ➕ são **opcionais** (ferramentas de trabalho que nenhuma rubrica pontua). Dentro
de cada modelo, as seções ➕ também são opcionais.

| Documento | Quando | Rubrica |
| --- | --- | --- |
| ➕ [Canvas do projeto](canvas-do-projeto.md) | Etapa 1 | — (ferramenta de trabalho) |
| ➕ [Termo de abertura](termo-de-abertura.md) | Etapa 1 | — |
| [Carta de anuência](carta-de-anuencia.md) | Etapa 1 | Etapa 1 · pré-requisito |
| [Ata de reunião](ata-de-reuniao.md) | Todas | Etapa 1 · pré-requisito; extensão |
| [Contrato de equipe](contrato-de-equipe.md) | Etapa 1 | Etapa 1 · pré-requisito |
| [Backlog e histórias](backlog-e-historias.md) | Etapa 1 | Etapa 1 · critério 4 |
| [Matriz de riscos](matriz-de-riscos.md) | Etapa 1 | Etapa 1 · critério 6 |
| [ADR](adr.md) | Etapas 1 e 3 | Etapa 1 · critério 5; Etapa 4 · critério 1 |
| [Plano de teste](plano-de-teste.md) | Etapa 3 | Etapa 3 · E1, E2, E4 (seções 2, 3 e 5) |
| [Relatório técnico](relatorio-tecnico.md) | Etapa 4 | Etapa 4 · critérios 1 a 3 |
| [Relato de experiência](relato-de-experiencia.md) | Extensão | Extensão · critério 4 |
| [Avaliação por pares](avaliacao-por-pares.md) | Etapa 4 | Etapa 4 · pré-requisito |
| [Termo de transferência](termo-de-transferencia.md) | Etapa 4 | Etapa 4 · critério 6 |

## Onde guardar

```
seu-projeto/
├── docs/
│   ├── canvas.md
│   ├── termo-de-abertura.md
│   ├── contrato-de-equipe.md
│   ├── backlog.md
│   ├── riscos.md
│   ├── plano-de-teste.md
│   ├── deploy.md
│   ├── manutencao.md
│   ├── api.md
│   ├── adr/
│   │   ├── README.md
│   │   ├── 0001-escolha-da-stack.md
│   │   └── 0002-....md
│   └── atas/
│       ├── 2026-09-02-diagnostico.md
│       └── 2026-09-16-validacao-sprint-1.md
└── README.md
```

Documentos versionados junto com o código: mudam com ele, são revisados em PR, e o
histórico mostra quando cada decisão foi tomada. Documento em pasta de nuvem separada fica
desatualizado em duas semanas.

## Regra de ouro

Todo documento aqui existe para ser **usado**, não para ser entregue. Se a equipe preencheu
a matriz de riscos e nunca mais olhou para ela, o documento falhou — e provavelmente algum
daqueles riscos vai se materializar sem resposta preparada.

Revise, em cada retrospectiva de sprint: contrato de equipe, backlog e matriz de riscos.
São 10 minutos.
