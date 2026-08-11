# Etapa 4 — Relatório técnico e encerramento

> **CH:** 4h (2h teóricas · 2h práticas) · **Semana 20** · **Entrega P4** · **Peso:** 10%

## Atividades previstas

- Criação do relato da experiência
- Apresentação do projeto finalizado

## 🎯 O que esta etapa produz

O registro do que foi feito e aprendido, a apresentação pública e a **transferência
responsável** do sistema para a organização parceira.

---

## 1. Relatório técnico (2h)

Documento de 12 a 20 páginas. Estrutura obrigatória:

| Seção | Conteúdo | Páginas |
|---|---|---|
| Capa e identificação | Instituição, disciplina, equipe, organização parceira, data | 1 |
| Resumo | 200 palavras: problema, solução, resultado | 0,5 |
| 1. Introdução | Contexto, problema, objetivos, justificativa | 1–2 |
| 2. A organização parceira | Quem é, o que faz, quem atende, como foi o contato | 1 |
| 3. Diagnóstico | Como o processo funcionava antes; evidências | 1–2 |
| 4. Solução proposta | Escopo, personas, cenários, o que ficou de fora e por quê | 1–2 |
| 5. Tecnologias e arquitetura | Stack, justificativa (ADRs), diagrama, modelo de dados | 2–3 |
| 6. Desenvolvimento | Como o trabalho foi organizado, sprints, principais desafios | 2–3 |
| 7. Testes | Estratégia, cobertura, teste com usuário real e o que mudou | 1–2 |
| 8. Implantação | Onde está no ar, como foi implantado, custo de manutenção | 1 |
| 9. Segurança e dados pessoais | Medidas adotadas, mapa de dados, aviso de privacidade | 1 |
| 10. Resultados | Critérios de sucesso da Etapa 1 × o que foi alcançado | 1–2 |
| 11. Relato de experiência | **A dimensão extensionista** (ver seção 2) | 2–3 |
| 12. Conclusão e trabalhos futuros | O que ficou pronto, o que falta, recomendações | 1 |
| Referências | ABNT | 0,5 |
| Apêndices | Manual do usuário, termo de transferência, evidências | — |

Modelo em [`../modelos-de-documentos/relatorio-tecnico.md`](../modelos-de-documentos/relatorio-tecnico.md).

### Como escrever a seção 10 (Resultados)

Retome a tabela de critérios de sucesso da Etapa 1 e preencha honestamente:

| Objetivo | Meta | Alcançado | Evidência |
|---|---|---|---|
| Reduzir tempo de registro | < 1 min | 45 s (média de 5 registros) | Cronometragem, 12/11 |
| 100% dos empréstimos registrados | 100% | 87% nas 2 primeiras semanas | Relatório do sistema |
| Uso efetivo | ≥ 20 registros | 34 registros | Painel |

**Meta não alcançada não reprova.** O que reprova é omitir, maquiar ou não analisar.
Escreva por que não foi alcançada e o que faria diferente — isso vale mais nota que um
número inflado.

---

## 2. Relato de experiência (dimensão extensionista)

Esta seção é o que distingue um trabalho de extensão de um trabalho de laboratório. Não é
resumo técnico — é **reflexão sobre a interação com a comunidade**.

Estruture respondendo:

1. **Como foi o encontro com a organização?** O que vocês esperavam encontrar e o que
   encontraram de fato?
2. **O que a comunidade ensinou a vocês?** (extensão é mão dupla — se a resposta for
   "nada", a interação foi superficial)
3. **O que mudou no projeto por causa dessa interação?** Cite decisões concretas que
   teriam sido diferentes sem o contato.
4. **Que dificuldades apareceram?** Agenda, linguagem, expectativa, infraestrutura,
   confiança.
5. **Qual o impacto concreto?** Para quem, em que medida, com que evidência.
6. **O que fica depois de vocês?** O sistema continua funcionando? Quem cuida?
7. **O que cada integrante aprendeu**, técnica e humanamente?

> Escreva na primeira pessoa do plural, com nomes e situações concretas. *"Percebemos, na
> terceira visita, que Dona Marli não usava o campo de busca porque o teclado do celular
> cobria o resultado"* vale mais do que um parágrafo sobre "a importância da extensão
> universitária".

Modelo em [`../modelos-de-documentos/relato-de-experiencia.md`](../modelos-de-documentos/relato-de-experiencia.md).

---

## 3. Apresentação (2h)

### Formato

- **20 minutos** de apresentação + **10 minutos** de arguição
- Todos os integrantes falam
- Presença da organização parceira, quando possível (presencial ou remota)

### Roteiro sugerido

| Tempo | Conteúdo |
|---|---|
| 2 min | O problema — conte a história de uma pessoa real |
| 2 min | A organização parceira e o diagnóstico |
| 2 min | A solução: o que faz e o que não faz |
| **7 min** | **Demonstração ao vivo, no sistema em produção** |
| 3 min | Decisões técnicas, arquitetura e testes |
| 2 min | Resultados medidos |
| 2 min | Relato da experiência e o que fica para a comunidade |

**A demonstração é o coração da apresentação.** Regras:

- No sistema **em produção**, com dados realistas.
- Percorra o cenário principal da Etapa 1, de ponta a ponta.
- Tenha um **plano B gravado** (vídeo de 3 min): rede de auditório falha.
- Nada de slide com print de código. Se precisar mostrar código, mostre no editor, uma
  tela só, ampliada.

### Arguição individual

Cada integrante responde a uma pergunta sobre uma parte do sistema que **não** escreveu.
Exemplos:

- "Mostre onde está a regra que impede emprestar a mesma ferramenta duas vezes e explique
  por que ela está aí e não na view."
- "O que acontece se dois usuários registrarem o empréstimo da mesma ferramenta no mesmo
  segundo?"
- "Como vocês garantem que um morador não vê o histórico de outro?"
- "Se a organização quiser adicionar um campo obrigatório amanhã, qual é o procedimento?"

É assim que a nota individual se separa da nota da equipe — e é assim que se verifica se a
equipe entende o que entregou.

---

## 4. Encerramento responsável ⭐

Projeto de extensão que termina com "obrigado, tchau" deixa a organização com um sistema
que morre em três meses. O encerramento tem quatro peças:

### 4.1 Manual do usuário

Máximo 8 páginas, com prints, escrito para quem **não** é da área. Sem jargão. Cobrindo os
fluxos que a organização realmente usa, na ordem em que usa.

### 4.2 Capacitação

Sessão presencial com quem vai operar o sistema. Não é apresentação — é a pessoa usando,
com vocês ao lado. Registre presença e fotos (com autorização de imagem).

### 4.3 Termo de transferência

Documento assinado, contendo:

- credenciais e acessos (repositório, hospedagem, banco, domínio, e-mail)
- custo mensal de manutenção e quem paga
- como pedir suporte e por quanto tempo a equipe se compromete
- licença do código (recomendação: aberta, para que outra turma possa continuar)
- procedimento de backup e de restauração
- contatos da equipe

Modelo em
[`../modelos-de-documentos/termo-de-transferencia.md`](../modelos-de-documentos/termo-de-transferencia.md).

### 4.4 Devolutiva à organização

Reunião final apresentando os resultados **para a organização**, em linguagem dela.
Pergunte: o que funcionou, o que atrapalhou, o que fariam diferente. Registre em ata — essa
avaliação entra no relatório.

---

## 5. Avaliação por pares

Cada integrante avalia os demais e a si mesmo em
[`../modelos-de-documentos/avaliacao-por-pares.md`](../modelos-de-documentos/avaliacao-por-pares.md).

Critérios: entrega do combinado, qualidade técnica, colaboração, comunicação, presença.
As respostas são confidenciais e compõem o fator de participação individual (0,7–1,1).

---

## 📦 Entrega P4

**Prazo:** semana 20

| Item | Formato |
|---|---|
| Relatório técnico completo | PDF |
| Relato de experiência (seção 11) | Dentro do relatório |
| Slides | PDF |
| Vídeo de demonstração (plano B, 3 min) | Link |
| Manual do usuário | PDF |
| Termo de transferência assinado | PDF |
| Ata da devolutiva à organização | PDF |
| Avaliação por pares | Formulário individual |
| Apresentação oral | Presencial, 20 + 10 min |

Rubrica em [`../../avaliacao/rubrica-etapa-4.md`](../../avaliacao/rubrica-etapa-4.md).

## ⚠️ Erros comuns

| Erro | Correção |
|---|---|
| Relatório que descreve tecnologia e não o problema | Comece pela pessoa, termine na tecnologia |
| Relato de experiência genérico sobre extensão | Nomes, cenas e decisões concretas |
| Omitir metas não alcançadas | Analise-as; isso vale nota |
| Demonstração em `localhost` | Use a URL de produção |
| Só uma pessoa apresenta | Todos falam; a arguição é individual |
| Entregar sem manual e sem transferência | O sistema morre; o encerramento é parte da entrega |
| Não fazer a devolutiva | Extensão sem retorno à comunidade é só coleta de dados |
