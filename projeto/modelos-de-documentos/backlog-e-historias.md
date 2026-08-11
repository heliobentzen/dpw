# Backlog e Histórias de Usuário

> Etapa 2 · Mantenha o backlog no GitHub Projects (issues) e este arquivo como espelho
> versionado. Se divergirem, vale o quadro.

## Visão geral

| ID | História | Prioridade | Estimativa | Sprint | Situação |
|---|---|---|---|---|---|
| H01 | | Must | | S1 | |
| H02 | | Must | | S1 | |
| H03 | | Must | | S2 | |
| H04 | | Should | | S2 | |
| H05 | | Could | | — | |
| H06 | | Won't | | — | |

**Prioridade (MoSCoW):** *Must* = sem isso o sistema não existe · *Should* = importante,
mas o sistema funciona sem · *Could* = desejável · *Won't* = fora desta versão.

**Estimativa (Fibonacci):** 1 = trivial · 2 = simples · 3 = médio · 5 = grande ·
8 = muito grande, **quebre em histórias menores** · 13 = ninguém sabe, investigue antes.

> Regra: o **MVP é composto só de Must**, e a soma dos pontos dos Must precisa caber com
> folga na capacidade da equipe.

---

## Modelo de história

```markdown
### H07 — <título curto e específico>

**Como** <papel do usuário>
**quero** <ação concreta>
**para** <benefício real>.

**Contexto**
<1-3 linhas: por que isso importa; o que a organização parceira disse a respeito>

**Critérios de aceite**
- [ ] <condição verificável 1>
- [ ] <condição verificável 2>
- [ ] <o que acontece no caminho de erro>
- [ ] <requisito não funcional relevante: tempo, dispositivo, acessibilidade>

**Regras de negócio**
- <regra 1>
- <regra 2>

**Fora desta história**
- <o que explicitamente NÃO entra>

**Prioridade:** Must | **Estimativa:** 5 | **Depende de:** H03
**Responsável:** <nome> | **Sprint:** S2
```

---

## Exemplo preenchido

### H07 — Registrar empréstimo de ferramenta

**Como** secretária da associação
**quero** registrar que uma ferramenta foi emprestada a um morador
**para** saber, a qualquer momento, com quem está cada ferramenta.

**Contexto**
Hoje o registro é feito em caderno. Dona Marli relatou que "toda semana some alguma coisa
e ninguém lembra quem pegou". Este é o fluxo mais usado do sistema — precisa ser o mais
rápido.

**Critérios de aceite**
- [ ] Apenas ferramentas disponíveis aparecem na lista de seleção
- [ ] Apenas moradores ativos e sem pendências podem receber empréstimo
- [ ] O sistema calcula e exibe a data prevista de devolução (7 dias corridos)
- [ ] A mesma ferramenta não pode ser emprestada duas vezes sem devolução, **garantido
      no banco de dados**
- [ ] Após registrar, a tela exibe confirmação com a data de devolução
- [ ] Se o morador estiver com pendência, o sistema explica o motivo da recusa
- [ ] O fluxo completo é executável em menos de 1 minuto, em celular de 360px

**Regras de negócio**
- Prazo padrão: 7 dias corridos
- Limite: 2 ferramentas simultâneas por morador
- Morador com devolução atrasada fica bloqueado até regularizar

**Fora desta história**
- Renovação de empréstimo (H12)
- Notificação por WhatsApp (Won't nesta versão)

**Prioridade:** Must | **Estimativa:** 5 | **Depende de:** H03 (cadastro de ferramentas),
H05 (cadastro de moradores)
**Responsável:** `<nome>` | **Sprint:** S2

---

## Capacidade da equipe

| Sprint | Semanas | Capacidade (pontos) | Comprometido | Entregue |
|---|---|---:|---:|---:|
| S1 | 12–13 | | | |
| S2 | 14–15 | | | |
| S3 | 16–17 | | | |
| S4 | 18 | | | |

Estime a capacidade da S1 pelo palpite; a partir da S2, use o que foi **realmente**
entregue na anterior. Velocidade medida vence velocidade desejada.

## Histórico de mudanças de escopo

| Data | O que mudou | Motivo | Quem aprovou | O que saiu em troca |
|---|---|---|---|---|
| | | | | |

> A última coluna é obrigatória: escopo entra trocando por algo que sai. Sem ela, o
> backlog cresce e a Etapa 3 não fecha.
