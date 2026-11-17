# P1 — Definição e planejamento

> **Semanas:** 1–4 · **Entrega:** semana 4 · **Peso:** 15% ·
> **Rubrica:** [`rubrica-etapa-1.md`](../../avaliacao/rubrica-etapa-1.md)

## Por que esta etapa existe

O erro mais caro de um projeto é construir a coisa errada. Ele não aparece no código:
aparece no fim, quando alguém olha o sistema e diz "não era bem isso". Esta etapa obriga a
equipe a **entender o problema antes de programar**.

Ela vem logo no início porque, a partir do **M04 (semana 5)**, cada módulo é aplicado no
sistema de vocês. As entidades que vocês vão modelar, as rotas que vão criar e os papéis
que vão proteger saem deste documento.

## Objetivo

Ao final, a equipe consegue responder, com fundamento:

1. **Qual problema**, de quem, e o que acontece hoje por causa dele?
2. **O que vamos construir** — e o que não vamos?
3. **Como saberemos** que funcionou?
4. **Como vamos construir**, em que ordem e com que riscos?

## Como esta etapa é usada depois

| O que sai daqui | Onde volta |
| --- | --- |
| Cenário principal | É o primeiro recurso implementado no M06–M07, o teste com usuário da P3 e a demonstração da P2 e da P4 |
| Entidades e relações | Viram classes no M04 |
| Contrato inicial (M02) | Vira controllers e DTOs no M07 |
| Quem pode fazer o quê | Vira papéis e guards no M08–M09 |
| Metas | São medidas no teste com usuário (P3) e comparadas na P4 |
| Backlog | Organiza as sprints até a P3 |

---

## Semana a semana

| Semana | O que fazer | Em aula |
| ---: | --- | --- |
| 1 | Formar a equipe, assinar o contrato de equipe, escolher o tipo de comunidade | Apresentação do projeto (2h) |
| 2 | **Pesquisar o problema** (fontes abaixo) | — |
| 3 | Problema, personas, escopo, backlog; contrato inicial da API (M02) | Etapa 1 (3h) |
| 4 | Desenho inicial e plano; revisão final | Etapa 1 (1h) · **entrega** |

## Pré-requisitos

- [ ] **Contrato de equipe** com papéis e *Definition of Done* ([modelo](../modelos-de-documentos/contrato-de-equipe.md))
- [ ] **Tema** voltado a um tipo de organização ou grupo da comunidade, diferente do das outras equipes

## Como fundamentar o problema sem depender de ninguém

O problema precisa ser **plausível e sustentado por alguma fonte**, não inventado na sala.
Fontes válidas, de qualquer combinação:

- Experiência de alguém da equipe (participa de uma associação, igreja, time, cursinho...)
- Uma conversa informal com quem vive o problema (não precisa de compromisso nem documento)
- Notícias, relatórios de ONGs, sites e redes sociais de organizações do tipo escolhido
- Sistemas parecidos que já existem: o que fazem, o que falta

Registrem as fontes em `docs/problema.md`. Se uma conversa virar parceria de verdade, ótimo:
vejam a [trilha opcional](../extensao/).

| Tipo de comunidade | Demanda típica |
| --- | --- |
| Associação de moradores | Associados, reserva de espaço, empréstimo de equipamentos |
| Cursinho popular | Matrícula, frequência |
| Horta comunitária | Canteiros, escala de voluntários |
| ONG de assistência | Atendimentos, doações, estoque |
| Cooperativa de reciclagem | Pesagem, repasses |
| Abrigo de animais | Cadastro, adoção, vacinas |

---

## O que entregar, critério por critério

### 1. Problema e demanda · peso 2,0

**Para quê:** sem um problema claro, não há como decidir o que entra e o que sai do escopo.

Escreva o problema em **uma frase**:

> *"Em \<tipo de organização\>, \<quem\> precisa \<fazer o quê\>, mas hoje \<como é feito\>, o
> que causa \<qual consequência\>."*

| ✅ Funciona | ❌ Não funciona |
| --- | --- |
| *"Em associações de moradores, a secretaria precisa controlar o empréstimo de ferramentas, mas anota num caderno, e as ferramentas somem."* | *"Um app de delivery"* — é solução, não problema |
| *"Em cursinhos populares, a coordenação precisa registrar a frequência de centenas de estudantes, mas usa papel e não percebe a evasão a tempo."* | *"Sistema de gestão empresarial"* — sem comunidade |

Junte as fontes que sustentam a frase.

### 2. Usuários e cenário · peso 1,5

**Para quê:** o cenário principal é o fio condutor do projeto inteiro. É ele que vocês
implementam primeiro, testam com usuário e demonstram no final.

**2 a 3 personas** coerentes com a pesquisa:

> **Marli, 58 anos** — secretária voluntária. Usa WhatsApp, nunca usou planilha. Controla as
> ferramentas num caderno. O celular dela é antigo.

E o **cenário principal**, passo a passo:

> Um morador pede a furadeira. Marli busca "furadeira", vê que está disponível, escolhe o
> morador e confirma. O sistema mostra a data de devolução. Tempo esperado: 40 segundos.

> A persona diz também **com o que** ela usa o sistema (celular antigo, internet instável).
> Um sistema que exige o que a persona não tem não resolve o problema.

### 3. Escopo e metas · peso 2,0

**Para quê:** o semestre tem 14 semanas de construção. O escopo protege a equipe de prometer
mais do que cabe, e as metas permitem provar, na P4, que o sistema faz o que prometeu.

| Faremos (MVP, até 6 funcionalidades) | Se sobrar tempo | **Não** faremos |
| --- | --- | --- |
| | | |

A terceira coluna é a mais importante: evita expectativa errada.

Metas **numéricas**, com a forma de medir no **teste com usuário** da P3 (alguém de fora da
equipe fazendo o cenário principal):

| Objetivo | Como medir | Referência de hoje | Meta |
| --- | --- | --- | --- |
| Registrar empréstimo rápido | Cronômetro no teste com usuário | ~3 min no caderno (estimado pela pesquisa) | < 1 min |
| Usar sem ajuda | Teste com usuário | — | Concluir o cenário sem perguntar nada |

**Teste do escopo.** Um "não" em qualquer item significa reduzir:

- [ ] O MVP cabe em **até 6 funcionalidades**?
- [ ] A funcionalidade mais difícil cabe em **2 semanas**?
- [ ] Cortando metade, o sistema **ainda resolve** o problema central?

### 4. Backlog · peso 1,5

**Para quê:** transformar o escopo em pedaços que cabem numa sprint e que dá para conferir.

Histórias no formato *"Como \<papel\>, quero \<ação\>, para \<benefício\>"*, cada uma com
**critérios de aceite**, estimativa e prioridade **MoSCoW**. O MVP contém só histórias
*Must*. Modelo em [backlog e histórias](../modelos-de-documentos/backlog-e-historias.md).

### 5. Desenho inicial da API · peso 2,0

**Para quê:** é o ponto de partida dos módulos técnicos. Não precisa estar perfeito — vai
ser refinado no M04 e no M07 —, mas precisa ser coerente com o cenário principal.

| Item | O que mostrar | Base |
| --- | --- | --- |
| **Entidades e relações** | As "coisas" do domínio e como se ligam (diagrama simples basta) | Disciplina de banco de dados |
| **Contrato inicial** | Recursos, rotas, status e erros principais, em `docs/api.md` | M01, M02 |
| **Quem pode fazer o quê** | Tipos de usuário e o que cada um pode fazer, em linguagem simples | Personas |

### 6. Plano de execução · peso 1,0

**Para quê:** tornar visível, desde já, o que tem de estar pronto em cada marco.

- **Sprints até a semana 18**, com responsáveis. Marque P2 (semana 10), o deploy (semana
  14) e P3 (semana 18).
- **3 a 5 riscos específicos**, cada um com plano B ([matriz de riscos](../modelos-de-documentos/matriz-de-riscos.md)).

---

## Ferramentas de trabalho (não pontuadas)

- **Painel de problemas:** cada pessoa traz 3 problemas que conhece de perto; a equipe agrupa.
- **Matriz de decisão:** pontue os temas candidatos por impacto, viabilidade e interesse da
  equipe.
- **[Canvas do projeto](../modelos-de-documentos/canvas-do-projeto.md):** uma página com o
  projeto inteiro.

## 📦 Entrega P1

**Semana 4 · PDF + arquivos em `docs/` no repositório da equipe**, na ordem da rubrica:
pré-requisitos, problema (com fontes), usuários, escopo e metas, backlog, desenho inicial e
plano. Digam também se a equipe vai seguir a [trilha opcional de parceria](../extensao/).

A devolutiva sai em até uma semana e diz se o escopo está aprovado, aprovado com redução ou
precisa ser refeito. Aprovado o escopo, o M04 começa no domínio de vocês.

## ⚠️ Sinais de alerta

| Sinal | Por que preocupa |
| --- | --- |
| A solução veio antes do problema | O sistema não resolve nada |
| Nenhuma fonte sustenta o problema | O projeto é suposição |
| Tema igual ao de outra equipe | Não é aprovado |
| As personas não teriam como usar o sistema | O sistema não serviria a ninguém |
