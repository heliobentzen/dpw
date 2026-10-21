# Etapa 1 — Definição e planejamento

> **Entrega:** P1 · **Semana:** 10 · **Peso:** 15% ·
> **Rubrica:** [`rubrica-etapa-1.md`](../../avaliacao/rubrica-etapa-1.md)

## 🎯 O que esta etapa produz

Um documento que responde: **qual problema, de quem, o que vamos construir e como vamos
construir.** Tudo com base em conversa real com a organização parceira.

---

## Antes de tudo: os pré-requisitos

Sem estes três itens, o documento volta sem nota.

- [ ] **Organização parceira** externa, com aceite por escrito ([carta de anuência](../modelos-de-documentos/carta-de-anuencia.md) ou e-mail)
- [ ] **Uma conversa** com a organização sobre o problema, registrada em [ata](../modelos-de-documentos/ata-de-reuniao.md)
- [ ] **Contrato de equipe** com papéis e *Definition of Done* ([modelo](../modelos-de-documentos/contrato-de-equipe.md))

### Roteiro da conversa (20 minutos)

1. Como o processo funciona hoje, do começo ao fim?
2. Quem participa? Quantas pessoas? Com que frequência?
3. O que dá errado com mais frequência?
4. O que já tentaram?
5. Se pudessem resolver **uma** coisa, qual seria?
6. Quem usaria o sistema? Têm celular, internet, computador?
7. Quem cuidaria do sistema depois da entrega?

> A pergunta 6 elimina muito projeto bonito: sistema web para quem não tem internet no local
> não é solução.

---

## O que entregar, critério por critério

### 1. Problema e demanda · peso 2,0

Escreva o problema em **uma frase**, nesta estrutura:

> *"Na \<organização\>, \<quem\> precisa \<fazer o quê\>, mas hoje \<como é feito\>, o que
> causa \<qual consequência\>."*

| ✅ Funciona | ❌ Não funciona |
| --- | --- |
| *"Na Associação do Jardim União, a secretária precisa controlar o empréstimo de ferramentas, mas hoje anota num caderno, e as ferramentas somem."* | *"Um app de delivery"* — é solução, não problema |
| *"No cursinho popular, a coordenação precisa registrar a frequência de 200 estudantes, mas usa papel e não percebe a evasão a tempo."* | *"Sistema de gestão empresarial"* — sem cliente |

Junte as evidências da conversa: o que a organização disse, com as palavras dela.

### 2. Usuários e cenário · peso 1,5

**2 a 3 personas** baseadas em pessoas reais com quem vocês falaram:

> **Dona Marli, 58 anos** — secretária voluntária. Usa WhatsApp, nunca usou planilha.
> Controla as ferramentas num caderno. O celular dela é antigo.

E o **cenário principal**, passo a passo:

> Um morador pede a furadeira. Dona Marli busca "furadeira", vê que está disponível,
> escolhe o morador e confirma. O sistema mostra a data de devolução. Tempo: 40 segundos.

### 3. Escopo e sucesso · peso 2,0

| Faremos (MVP, até 6 funcionalidades) | Se sobrar tempo | **Não** faremos |
| --- | --- | --- |
| | | |

A terceira coluna é a mais importante: evita expectativa errada na entrega.

Metas **numéricas**, com forma de medir:

| Objetivo | Como medir | Meta |
| --- | --- | --- |
| Registrar empréstimo mais rápido | Cronômetro, 5 registros | de ~3 min para < 1 min |
| A organização usa de fato | Registros após 2 semanas | ≥ 20 registros reais |

**Teste do escopo.** Um "não" em qualquer item significa reduzir:

- [ ] O MVP cabe em **até 6 funcionalidades**?
- [ ] A funcionalidade mais difícil cabe em **2 semanas**?
- [ ] Cortando metade, o sistema **ainda resolve** o problema central?

### 4. Backlog · peso 1,5

Histórias no formato *"Como \<papel\>, quero \<ação\>, para \<benefício\>"*, cada uma com
**critérios de aceite**, estimativa e prioridade **MoSCoW**. O MVP contém só histórias
*Must*. Modelo em [backlog e histórias](../modelos-de-documentos/backlog-e-historias.md).

### 5. Desenho técnico da API · peso 2,0

| Item | O que mostrar |
| --- | --- |
| **Modelo de dados** | Entidades, relações, restrições e `onDelete` de cada chave (M04) |
| **Rascunho do contrato** | Recursos, rotas, status e erros principais (M02, M07) |
| **Papéis × rotas** | Quem pode chamar o quê (M08) |
| **ADRs** | 1 obrigatório, 2+ para nota máxima, com alternativas comparadas ([modelo](../modelos-de-documentos/adr.md)) |

### 6. Plano de execução · peso 1,0

- **Cronograma das semanas 11 a 18**, com entregas e responsáveis. Marque a Etapa 2
  (semana 12) e a Etapa 3 (semana 18).
- **3 a 5 riscos específicos**, cada um com plano B ([matriz de riscos](../modelos-de-documentos/matriz-de-riscos.md)).

---

## Ferramentas de trabalho (não pontuadas)

Ajudam a chegar ao resultado, mas a rubrica não as pontua separadamente.

- **Painel de problemas:** cada pessoa traz 3 problemas que conhece de perto; a equipe agrupa.
- **Matriz de decisão:** pontue os candidatos por parceiro acessível, impacto, viabilidade e
  interesse da equipe.
- **[Canvas do projeto](../modelos-de-documentos/canvas-do-projeto.md):** uma página com o
  projeto inteiro.

## 📦 Entrega P1

**Semana 10 · PDF + arquivos no repositório**, na ordem da rubrica: pré-requisitos, problema,
usuários, escopo e metas, backlog, desenho técnico e plano.

## ⚠️ Sinais de alerta

| Sinal | Por que preocupa |
| --- | --- |
| A solução veio antes do problema | Ninguém vai usar |
| Ninguém da equipe falou com a organização | O projeto é suposição |
| Tema igual ao de outra equipe | Não é aprovado |
| Local sem internet ou equipamento, e a equipe não percebeu | O sistema não roda lá |
