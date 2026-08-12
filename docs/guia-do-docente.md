# Guia do docente

Como conduzir a disciplina com este material.

## 1. Antes do semestre começar

| Prazo | Ação |
|---|---|
| −6 semanas | Mapear organizações parceiras candidatas para a extensão (ver [`../projeto/extensao/README.md`](../projeto/extensao/README.md)) |
| −4 semanas | Formalizar parceria com 2–4 organizações (carta de anuência) |
| −3 semanas | Criar a organização GitHub da turma e o repositório-modelo |
| −2 semanas | Validar o laboratório: Python 3.12, **Node 20**, Git, Docker, portas 8000/5432/5173 |
| −2 semanas | ⚠️ **Confirmar acesso a `registry.npmjs.org` e ao PyPI** — proxy bloqueando `npm install` é a falha logística nº 1 |
| −2 semanas | 🪟 Se o laboratório é Windows: instalar Git (traz o Git Bash), habilitar WSL2 e excluir a pasta de projetos do Windows Defender |
| −2 semanas | Criar contas de PaaS ou solicitar GitHub Student Pack |
| −1 semana | Enviar [`ambiente-setup.md`](ambiente-setup.md) aos estudantes com o script de verificação |

> **A falha nº 1 desta disciplina é logística, não técnica**: proxy do laboratório
> bloqueando `pip` ou `npm`, antivírus bloqueando o `runserver`, ou parceria extensionista
> fechada tarde demais. Resolva isso antes da aula 1.

### 🪟 Turma no Windows

Os roteiros usam comandos Linux/macOS, com equivalências em
[`../recursos/comandos-windows.md`](../recursos/comandos-windows.md). Na **aula 1**,
combine com a turma **um** caminho e mantenha-o:

| Caminho | Recomende quando |
|---|---|
| PowerShell nativo | Turma acostumada ao Windows; use as equivalências |
| **Git Bash** | ⭐ Menor atrito: os comandos do material funcionam colados |
| WSL2 | Turma mais madura; obrigatório se quiser paridade com produção |

**Quatro coisas quebram em silêncio** e valem 10 minutos de aula na semana 1: `curl` é
alias no PowerShell (use `curl.exe`); variáveis inline não existem (`$env:VAR="x";`);
Gunicorn não roda no Windows (Waitress, no M16); e CRLF quebra o deploy (`.gitattributes`,
no M00). Nenhuma delas gera erro que aponte a causa.

### Diagnóstico de JavaScript — semana 1

O pré-requisito de JS **está atendido** por esta turma, e o cronograma padrão assume isso.
Ainda assim, aplique o exercício de 20 minutos de
[`../recursos/js-para-react.md`](../recursos/js-para-react.md) na primeira aula — o
objetivo mudou:

| Antes servia para | Agora serve para |
|---|---|
| Decidir o cronograma | **Identificar quem individualmente chega com lacuna** |
| Escolher entre nivelamento e modo híbrido | Direcionar monitoria antes da semana 8 |

Uma turma "com base" costuma ter 2 ou 3 pessoas que na prática não têm. Encontrá-las na
semana 1 custa uma monitoria; encontrá-las na semana 8 custa o bloco de frontend delas.

**O que fazer com o pré-requisito atendido:** não acelere o M08 achando que sobra tempo.
As 5h já foram dimensionadas para o que é difícil em React mesmo para quem sabe JS —
imutabilidade do estado, array de dependências do `useEffect` e chaves de lista. Gaste-as
ali, não em sintaxe.

| Resultado do diagnóstico | Ação |
|---|---|
| Turma confortável (esperado) | Cronograma padrão; monitoria pontual para casos isolados |
| 20%+ com dificuldade | Monitoria dirigida nas semanas 6–7, sem mexer no cronograma |
| Maioria com dificuldade | Reavalie: 4h de nivelamento (retire de M06 e M15) ou modo híbrido |

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

1. M17 Observabilidade (2h) — complementar
2. M15 Admin (2h) — pode virar leitura assíncrona
3. M14 Testes: 3h → 2h (mantenha regra de negócio e matriz de acesso)
4. M00 Ambiente: transforme em pré-atividade assíncrona
5. M10 Rotas (2h) — pode ser absorvido pelo M11, com perda

**Antes de cortar, considere o modo híbrido** ([ADR-04](decisoes-tecnicas.md#adr-04--modo-híbrido-como-alternativa-documentada)):
ele libera ~8h de uma vez. Com o pré-requisito de JS atendido, porém, a única razão que
resta para adotá-lo é a **leitura estrita da ementa** — não a capacidade da turma.

**Nunca corte:** M01, M02, M04, M05, M06, M07, M08, M09, M12, M13, M16 — são itens
explícitos da ementa (ou pré-requisito direto deles). E não corte as etapas do projeto nem
a extensão: são eliminatórias.

## 6. Erros de condução mais comuns

| Erro | Efeito | Correção |
|---|---|---|
| Ensinar ORM antes de HTTP | Estudante decora comandos, não entende requisição | Mantenha M01 antes de tudo |
| Deixar o deploy para a última semana | Metade da turma não implanta | M16 na semana 16, com o BiblioCom (não com o projeto) |
| Aceitar tema de projeto grande demais | Etapa 3 não fecha | Aplicar o filtro de escopo da Etapa 1 com rigor |
| Extensão virar "apresentar slides na escola" | Não é extensão, é divulgação | Exigir demanda + entrega + devolutiva registrada |
| Corrigir só o resultado final | Não se detecta equipe travada | Usar os marcos E0–E8 semanalmente |
| Turma inteira com o mesmo tema | Cópia entre equipes | Um tema por equipe, aprovado na Etapa 1 |
| Começar o frontend antes da API existir | Trabalha-se contra dados falsos e retrabalha-se | M08 só depois do M07 (semana 8) |
| Deixar a equipe se dividir em "front" e "back" | Metade sai sem saber a outra camada | Portfólio individual cobre as duas; papéis rotativos |
| Pular o contrato de API (M02) | Integração retrabalhada na Etapa 3 | Contrato escrito é entrega da Etapa 2 |
| Gastar as horas de React ensinando JavaScript | Perde-se o modelo mental, que é o difícil | Pré-requisito atendido; monitoria para casos isolados |
| Achar que "a turma sabe JS" dispensa o M08 | React não é JavaScript; o modelo declarativo é novo | As 5h vão para estado, efeitos e imutabilidade |

## 7. Correção eficiente

- Use as rubricas de [`../avaliacao/`](../avaliacao/) — elas transformam correção em
  conferência de evidências.
- Peça sempre **link + commit hash**, não arquivo `.zip`.
- Para o portfólio (E0–E8): correção binária (entregue/não entregue) + amostragem de 30%
  com feedback escrito. Corrigir 100% com detalhe é insustentável e não muda o resultado.
- Automatize o que der: o CI (M14) já reprova PR sem testes passando.

## 8. Acessibilidade e inclusão

- Todos os roteiros funcionam em Windows, macOS e Linux; comandos duplicados quando
  divergem.
- Estudantes sem máquina própria: garanta laboratório com horário estendido ou use
  GitHub Codespaces / Gitpod (o material roda sem alterações).
- Internet instável: os módulos M00–M15 funcionam offline após a primeira instalação;
  baixe os pacotes com `pip download -r requirements.txt -d pacotes/` e distribua.
- Requisitos de acessibilidade das interfaces (WCAG básico) são cobrados no M09 e na
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
