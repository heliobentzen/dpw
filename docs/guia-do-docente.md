# Guia do docente

Como conduzir a disciplina com este material.

## 1. Antes do semestre começar

| Prazo | Ação |
|---|---|
| −6 semanas | Mapear organizações parceiras candidatas para a extensão (ver [`../projeto/extensao/README.md`](../projeto/extensao/README.md)) |
| −4 semanas | Formalizar parceria com 2–4 organizações (carta de anuência) |
| −3 semanas | Criar a organização GitHub da turma e o repositório-modelo |
| −2 semanas | Validar o laboratório: Python 3.12, Git, Docker, portas 8000/5432 liberadas |
| −2 semanas | Criar contas de PaaS ou solicitar GitHub Student Pack |
| −1 semana | Enviar [`ambiente-setup.md`](ambiente-setup.md) aos estudantes com o script de verificação |

> **A falha nº 1 desta disciplina é logística, não técnica**: proxy do laboratório
> bloqueando `pip`, antivírus bloqueando o `runserver`, ou parceria extensionista fechada
> tarde demais. Resolva isso antes da aula 1.

## 2. Ritmo sugerido de uma aula de 5h

| Tempo | Atividade |
|---|---|
| 0:00–0:15 | Retomada: 3 perguntas sobre a aula anterior (sem nota, oral) |
| 0:15–1:15 | Bloco teórico: conceito + demonstração ao vivo |
| 1:15–1:30 | Intervalo |
| 1:30–3:00 | Laboratório guiado (roteiro do módulo), docente circulando |
| 3:00–3:15 | Intervalo |
| 3:15–4:30 | Laboratório aberto: exercícios sem passo a passo, em duplas |
| 4:30–5:00 | Fechamento: checklist de saída + commit + dúvidas |

**Regra:** o estudante sai da aula com um commit. Sem exceção. Isso resolve a maior parte
dos problemas de acompanhamento e de "eu perdi meu código".

## 3. Demonstração ao vivo: como não travar

- Tenha **dois repositórios**: o `inicio-mXX` (estado antes da aula) e o `fim-mXX`
  (estado final). Se a demo travar, faça checkout do final e siga em frente.
- Digite o código, não cole. A turma acompanha o ritmo dos dedos, não o do clipboard.
- **Erre de propósito** pelo menos uma vez por aula: esqueça o `{% csrf_token %}`, esqueça
  o `makemigrations`. Mostrar a mensagem de erro e o caminho até a correção vale mais que
  o código correto de primeira.
- Fonte ≥ 16pt, tema claro, terminal e editor lado a lado.

## 4. Formação e gestão das equipes

- **Tamanho:** 3 a 4 pessoas. Com 2, a carga por pessoa inviabiliza o escopo; com 5+,
  aparece o carona.
- **Formação:** na semana 5, por afinidade de tema (não de amizade). Peça a cada
  estudante 3 problemas que gostaria de resolver e agrupe por proximidade.
- **Papéis rotativos** (trocam a cada etapa): *Product Owner* (fala com o parceiro),
  *Tech Lead* (arquitetura e code review), *Scribe* (documentação e atas), *Ops* (deploy,
  CI, ambientes).
- **Contrato de equipe** obrigatório na Etapa 2 — inclui o que acontece se alguém não
  entregar.

**Caronas.** Instrumentos objetivos, nesta ordem: (1) histórico de commits por autor,
(2) autoavaliação e avaliação por pares na Etapa 4, (3) arguição individual na
apresentação — cada integrante responde sobre uma parte do código que **não** escreveu.
A nota do projeto é individualizável por fator de participação (0,7–1,1).

## 5. Compressão do conteúdo

Se precisar reduzir a carga sem ferir a ementa, corte nesta ordem:

1. M13 APIs e integrações (2h) — complementar
2. M15 Observabilidade (2h) — complementar
3. M09 Admin (2h) — pode virar leitura assíncrona
4. M12 Testes: 4h → 2h (mantenha ao menos testes de model e de view)
5. M00 Ambiente: transforme em pré-atividade assíncrona

**Nunca corte:** M01, M03, M04, M05, M06, M08, M10, M11, M14 — são itens explícitos da
ementa. E não corte as etapas do projeto nem a extensão: são eliminatórias.

## 6. Erros de condução mais comuns

| Erro | Efeito | Correção |
|---|---|---|
| Ensinar ORM antes de HTTP | Estudante decora comandos, não entende requisição | Mantenha M01 antes de tudo |
| Deixar o deploy para a última semana | Metade da turma não implanta | M14 na semana 16, com o BiblioCom (não com o projeto) |
| Aceitar tema de projeto grande demais | Etapa 3 não fecha | Aplicar o filtro de escopo da Etapa 1 com rigor |
| Extensão virar "apresentar slides na escola" | Não é extensão, é divulgação | Exigir demanda + entrega + devolutiva registrada |
| Corrigir só o resultado final | Não se detecta equipe travada | Usar os marcos E0–E7 semanalmente |
| Turma inteira com o mesmo tema | Cópia entre equipes | Um tema por equipe, aprovado na Etapa 1 |

## 7. Correção eficiente

- Use as rubricas de [`../avaliacao/`](../avaliacao/) — elas transformam correção em
  conferência de evidências.
- Peça sempre **link + commit hash**, não arquivo `.zip`.
- Para o portfólio (E0–E7): correção binária (entregue/não entregue) + amostragem de 30%
  com feedback escrito. Corrigir 100% com detalhe é insustentável e não muda o resultado.
- Automatize o que der: o CI (M12) já reprova PR sem testes passando.

## 8. Acessibilidade e inclusão

- Todos os roteiros funcionam em Windows, macOS e Linux; comandos duplicados quando
  divergem.
- Estudantes sem máquina própria: garanta laboratório com horário estendido ou use
  GitHub Codespaces / Gitpod (o material roda sem alterações).
- Internet instável: os módulos M00–M09 funcionam offline após a primeira instalação;
  baixe os pacotes com `pip download -r requirements.txt -d pacotes/` e distribua.
- Requisitos de acessibilidade das interfaces (WCAG básico) são cobrados no M08 e na
  rubrica da Etapa 3.

## 9. Integridade acadêmica e uso de IA

Posição sugerida (ajuste ao regimento da instituição):

- **Permitido e incentivado:** usar assistentes de IA como par de programação, para
  explicar erros, gerar rascunhos e revisar código.
- **Obrigatório:** declarar o uso no relatório técnico (seção "Ferramentas de apoio"), e
  **saber explicar cada linha entregue**. A arguição individual da Etapa 4 verifica isso.
- **Proibido:** entregar código que a equipe não sabe explicar; submeter texto de relatório
  gerado sem revisão e sem dados reais do projeto.

O critério prático é este: *a IA acelera quem entende; a arguição separa os dois casos*.
