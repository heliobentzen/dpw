# Etapa 1 — Definição do tema do projeto

> **CH:** 4h (2h teóricas · 2h práticas) · **Semanas 6 e 8** · **Entrega P1** (semana 8) · **Peso:** 7,5%

## Atividades previstas

- Levantamento de problemas relevantes para a equipe
- Seleção do problema a ser abordado
- Proposta de solução a ser desenvolvida

## 🎯 O que esta etapa produz

Um documento curto que responde, com evidências: **qual problema, de quem, por que vale a
pena, e o que exatamente vamos construir**.

---

## 1. Levantamento de problemas (1h30)

### 1.1 Divergir antes de convergir

Cada integrante traz, **individualmente e antes da aula**, 3 problemas que conhece de
perto. Critério: problemas de gente real, em lugares que a pessoa frequenta — o bairro, a
escola onde estudou, a igreja, a associação, o trabalho, o coletivo cultural.

Formato de cada problema, em uma frase:

> *"Na \<organização\>, \<quem\> precisa \<fazer o quê\>, mas hoje \<como é feito\>, o que
> causa \<qual consequência\>."*

Exemplos que funcionam:

- *"Na Associação de Moradores do Jardim União, a secretária precisa controlar o
  empréstimo de ferramentas do galpão comunitário, mas hoje anota em um caderno, o que faz
  com que ferramentas sumam e ninguém saiba com quem estão."*
- *"No cursinho popular do bairro, a coordenação precisa registrar frequência de 200
  estudantes, mas hoje usa listas em papel, o que impede identificar quem está evadindo
  antes de ser tarde."*
- *"Na horta comunitária, os voluntários precisam saber o que plantar e quando colher em
  cada canteiro, mas hoje a informação está na cabeça de duas pessoas."*

Exemplos que **não** funcionam (e por quê):

- ❌ *"Um app de delivery"* — não é problema, é solução; e não há demanda real.
- ❌ *"Sistema de gestão empresarial"* — genérico demais, sem cliente.
- ❌ *"Uma rede social para estudantes"* — sem problema definido, escopo infinito.
- ❌ *"Um sistema para o meu TCC"* — não há organização parceira nem dimensão extensionista.

### 1.2 Painel de problemas

Cada pessoa apresenta seus 3 problemas em 2 minutos. Nada de discussão nesta fase — só
escuta e perguntas de esclarecimento. A equipe termina com 9 a 12 problemas no quadro.

### 1.3 Agrupar

Agrupe problemas semelhantes. Quase sempre 12 problemas viram 4 ou 5 temas.

---

## 2. Seleção do problema (1h)

### 2.1 Matriz de decisão

Pontue cada problema candidato de 1 a 5 em cada critério. Multiplique pelo peso.

| Critério | Peso | O que significa |
|---|---:|---|
| **Existe organização parceira acessível** | 3 | Há uma pessoa real, com nome e contato, disposta a conversar |
| **Impacto social** | 3 | Resolver isso melhora concretamente a vida de alguém |
| **Viabilidade em 20 semanas** | 3 | Cabe no MVP, com a stack da disciplina |
| **Cobre a ementa** | 2 | Exige models, CRUD, autenticação, relatórios |
| **Interesse da equipe** | 2 | Vocês querem trabalhar nisso por 5 meses |
| **Dados disponíveis** | 1 | É possível obter dados reais ou realistas |

> **O primeiro critério é eliminatório.** Sem organização parceira, não há extensão — e a
> extensão é item obrigatório da ementa. Se a equipe não tem parceiro até a semana 8,
> escolha entre os parceiros pré-mapeados pelo docente.

### 2.2 Validar com a organização

Antes de fechar, **converse com a organização parceira**. Roteiro de 20 minutos:

1. Como esse processo funciona hoje, do começo ao fim?
2. Quem participa? Quantas pessoas? Com que frequência?
3. O que dá errado com mais frequência?
4. O que já tentaram? Por que não funcionou?
5. Se pudessem resolver **uma** coisa, qual seria?
6. Quem usaria o sistema? Essas pessoas têm celular? Internet? Computador?
7. Quem manteria o sistema depois que a gente entregar?

A pergunta 6 já eliminou muito projeto bonito: sistema web para quem não tem internet no
local não é solução, é exercício.

Registre a conversa em uma [ata](../modelos-de-documentos/ata-de-reuniao.md).

### 2.3 Filtro de escopo — o teste da equipe

Antes de aprovar, responda honestamente:

- [ ] Conseguimos descrever o MVP em **5 funcionalidades**?
- [ ] A funcionalidade mais complexa cabe em **2 semanas** de trabalho da equipe?
- [ ] Sabemos, hoje, como construir **cada** funcionalidade — ou pelo menos onde procurar?
- [ ] Se cortarmos metade do escopo, o sistema **ainda resolve** o problema central?
- [ ] Existe alguém que **vai usar** isso depois de entregue?

Um "não" em qualquer item significa: reduza o escopo. Projeto de disciplina fracassa por
excesso de ambição em 9 de cada 10 casos.

---

## 3. Proposta de solução (1h30)

### 3.1 Canvas do projeto

Preencha o [canvas](../modelos-de-documentos/canvas-do-projeto.md). Ele obriga a
explicitar o que costuma ficar implícito: quem são os usuários, o que **não** será feito, e
como saberemos que deu certo.

### 3.2 Personas e cenários

Descreva 2 ou 3 personas com base em pessoas **reais** que você conversou:

> **Dona Marli, 58 anos** — secretária voluntária da associação há 12 anos. Usa WhatsApp
> no celular, nunca usou planilha. Faz o controle das ferramentas em um caderno. Precisa
> que o sistema seja simples o bastante para usar sem treinamento e funcione no celular
> dela, que é antigo.

E o cenário de uso principal, passo a passo:

> Um morador chega ao galpão às 8h de sábado pedindo a furadeira. Dona Marli abre o
> sistema no celular, busca "furadeira", vê que está disponível, seleciona o morador na
> lista, confirma. O sistema mostra a data prevista de devolução. Tempo total: 40 segundos.

O cenário é o critério de aceite mais honesto que existe: se o sistema não permite fazer
isso em 40 segundos, ele não resolve o problema.

### 3.3 Escopo declarado

| Faremos (MVP) | Faremos se sobrar tempo | **Não** faremos |
|---|---|---|
| | | |

A terceira coluna é a mais importante. Escrevê-la evita a expectativa mal calibrada da
organização parceira — e a discussão desagradável na entrega.

### 3.4 Critérios de sucesso

Métricas verificáveis, não intenções:

| Objetivo | Como mediremos | Meta |
|---|---|---|
| Reduzir tempo de registro de empréstimo | Cronômetro, 5 registros | de ~3 min para < 1 min |
| Eliminar ferramentas sem rastreio | Relatório do sistema | 100% dos empréstimos registrados |
| A organização usa de fato | Registros no sistema após 2 semanas | ≥ 20 registros reais |

---

## 📦 Entrega P1 — Documento de definição do tema

**Prazo:** semana 8 · **Formato:** PDF (máx. 6 páginas) + arquivos no repositório

Conteúdo obrigatório:

1. **Identificação** — equipe, integrantes, papéis desta etapa
2. **Levantamento** — os problemas considerados e a matriz de decisão preenchida
3. **Problema escolhido** — na estrutura "quem / precisa de / mas hoje / o que causa"
4. **Organização parceira** — quem é, contato, o que faz, quantas pessoas atende
5. **Registro da conversa** — ata da reunião de diagnóstico, com as 7 perguntas
6. **Personas** — 2 a 3, baseadas em pessoas reais
7. **Cenário de uso principal** — passo a passo
8. **Canvas do projeto** — preenchido
9. **Escopo** — as três colunas
10. **Critérios de sucesso** — tabela com metas verificáveis
11. **Carta de anuência** — assinada pela organização

Rubrica em [`../../avaliacao/rubrica-etapa-1.md`](../../avaliacao/rubrica-etapa-1.md).

## ⚠️ Erros que reprovam esta etapa

| Erro | Consequência |
|---|---|
| Não conversar com a organização | O projeto inteiro é construído sobre suposição |
| Escolher a solução antes do problema | Solução em busca de problema; ninguém usa |
| Escopo de 15 funcionalidades | A Etapa 3 não fecha |
| "Organização parceira" que é a própria faculdade sem demanda real | Não caracteriza extensão |
| Não escrever o que **não** será feito | Expectativa frustrada na entrega |
| Critérios de sucesso vagos ("melhorar o processo") | Impossível avaliar se deu certo |
