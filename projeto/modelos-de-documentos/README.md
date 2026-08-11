# Modelos de documentos

Modelos prontos para as entregas do projeto. Cada um reflete exatamente o que a rubrica
correspondente avalia — use-os como lista de verificação, não só como formatação.

| Documento | Quando | Entrega |
|---|---|---|
| [Canvas do projeto](canvas-do-projeto.md) | Etapa 1 | P1 |
| [Termo de abertura](termo-de-abertura.md) | Etapa 1 | P1 |
| [Carta de anuência](carta-de-anuencia.md) | Etapa 1 | P1 |
| [Ata de reunião](ata-de-reuniao.md) | Todas | P1–P4, X1–X3 |
| [Contrato de equipe](contrato-de-equipe.md) | Etapa 2 | P2 |
| [Backlog e histórias](backlog-e-historias.md) | Etapa 2 | P2 |
| [Matriz de riscos](matriz-de-riscos.md) | Etapa 2 | P2 |
| [ADR](adr.md) | Etapas 2–3 | P2, P3 |
| [Plano de teste](plano-de-teste.md) | Etapa 3 | P3 |
| [Relatório técnico](relatorio-tecnico.md) | Etapa 4 | P4 |
| [Relato de experiência](relato-de-experiencia.md) | Etapa 4 / Extensão | P4, X3 |
| [Avaliação por pares](avaliacao-por-pares.md) | Etapa 4 | P4 |
| [Termo de transferência](termo-de-transferencia.md) | Etapa 4 | P4 |

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
