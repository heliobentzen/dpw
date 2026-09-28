# Guia do docente

Como conduzir a disciplina com este material.

## 1. Antes do semestre começar

| Prazo | Ação |
| --- | --- |
| −6 semanas | Mapear organizações parceiras candidatas para a extensão (ver [`../projeto/extensao/README.md`](../projeto/extensao/README.md)) |
| −4 semanas | Formalizar parceria com 2–4 organizações (carta de anuência) |
| −3 semanas | Criar a organização GitHub da turma e o repositório-modelo |
| −2 semanas | Validar o laboratório: **Node 24** (npm 11), Git, Docker, portas 3000/5432 |
| −2 semanas | ⚠️ **Confirmar acesso a `registry.npmjs.org`** — proxy bloqueando `npm install` é a falha logística nº 1 |
| −2 semanas | 🪟 Se o laboratório é Windows: instalar Git (traz o Git Bash), habilitar WSL2 e excluir a pasta de projetos do Windows Defender |
| −2 semanas | Criar contas de PaaS ou solicitar GitHub Student Pack |
| −1 semana | Enviar [`ambiente-setup.md`](ambiente-setup.md) aos estudantes com o script de verificação |

> **A falha nº 1 desta disciplina é logística, não técnica**: proxy do laboratório
> bloqueando o registro do npm, antivírus tornando o `npm install` lentíssimo, ou parceria extensionista
> fechada tarde demais. Resolva isso antes da aula 1.

### 🪟 Turma no Windows

Os roteiros usam comandos Linux/macOS, com equivalências em
[`../recursos/comandos-windows.md`](../recursos/comandos-windows.md). Na **aula 1**,
combine com a turma **um** caminho e mantenha-o:

| Caminho | Recomende quando |
| --- | --- |
| PowerShell nativo | Turma acostumada ao Windows; use as equivalências |
| **Git Bash** | ⭐ Menor atrito: os comandos do material funcionam colados |
| WSL2 | Turma mais madura; obrigatório se quiser paridade com produção |

**A turma digita todos os comandos.** Não há script de montagem, e isso é deliberado:
configurar projeto, instalar dependência e versionar código são objetivos de aprendizagem do
M00 e caem na avaliação teórica. Um script que fizesse isso entregaria o ambiente e levaria
o conteúdo junto.

O que reduz o atrito da semana 1 não é automatizar — é **não pedir o que ainda não é
necessário**:

| Momento | O que entra | Avise na aula anterior |
| --- | --- | --- |
| **Semana 1** (M00) | Node 24, Git, VS Code, monorepo, 1º commit | — |
| **Antes do M03** | Dependências do backend (NestJS CLI, TypeORM) | sim |
| **Antes do M04** | Docker + PostgreSQL | **sim, com folga** — no Windows exige WSL2 e, às vezes, virtualização na BIOS |

A semana 1 instala **um runtime só**: o Node, que já traz o npm. O banco chega no M04, pelo
Docker, quando passa a servir para alguma coisa.

Para conferir, `verifica-ambiente.mjs` aceita `--etapa m00|m03|m04` e cobra só o que já
deveria existir. Ele **diagnostica e não instala**: para cada falha, imprime o comando exato
que corrige, e quem executa é o aluno.

Guias por sistema: [`ambiente-setup-windows.md`](ambiente-setup-windows.md) ou
[`ambiente-setup.md`](ambiente-setup.md). Não peça para a turma do Windows "adaptar" o guia
Linux: é a origem da maior parte do atrito da primeira semana.

**Cinco coisas quebram em silêncio** e valem 10 minutos de aula na semana 1: `curl` é alias
no PowerShell (use `curl.exe`); variáveis inline não existem (`$env:VAR="x";`); `&&` não
existe no PowerShell 5.1; `>` grava arquivos em UTF-16, corrompendo qualquer arquivo de
texto gerado; e um espaço depois
da crase de continuação corta o comando pela metade. Nenhuma delas gera erro que aponte a
causa.

**Duas verificações valem mais que qualquer aviso**, porque previnem dias de problema:

1. **A pasta do projeto está fora do OneDrive?** O `Documents` é sincronizado por padrão em
   máquina nova e em conta institucional. Com `node_modules` dentro dele, o Git
   acusa mudanças fantasma, arquivos ficam bloqueados e o `npm install` trava. Peça
   `C:\dev` — sem espaço e sem acento no caminho.
2. **`git config --get core.longpaths` responde `true`?** Um monorepo tem duas árvores de
   `node_modules`, e o limite de 260 caracteres do Windows é atingido com facilidade — o
   sintoma é `Filename too long` no meio de um `npm install`.

### Diagnóstico de JavaScript — semana 1

O pré-requisito de JS **está atendido** por esta turma, e o cronograma padrão assume isso.
Ainda assim, aplique este exercício de 20 minutos, sem consulta, na primeira aula. Ele não
decide o cronograma: serve para **identificar quem individualmente chega com lacuna** e
direcionar monitoria antes do M03, que é o primeiro código TypeScript da disciplina.

```js
// 1. O que imprime?
const nums = [1, 2, 3, 4, 5];
console.log(nums.filter(n => n % 2 === 0).map(n => n * 10));

// 2. Reescreva com desestruturação
const obra = { titulo: "Dom Casmurro", autor: { nome: "Machado" }, ano: 1899 };
const titulo = obra.titulo;
const nomeAutor = obra.autor.nome;

// 3. Separe `categoriaIds` do resto do objeto numa linha só
const dto = { titulo: "X", ano: 1900, categoriaIds: [1, 2] };

// 4. Complete, tratando o caso de resposta com erro
async function buscar() {
  const r = await fetch("http://localhost:3000/api/obras");
  // devolva o JSON
}

// 5. O que imprime cada linha, e por quê?
console.log(0 || 3000);
console.log(0 ?? 3000);
```

| Questão | Onde o curso cobra |
| --- | --- |
| 1 — `filter`/`map` | M06 (transformar resultado de consulta), M07 (`ObraResposta.de`) |
| 2 e 3 — desestruturação e *rest* | M07, etapa 8: `const { categoriaIds, ...campos } = dto` |
| 4 — `async`/`await` | Todo service a partir do M06 |
| 5 — `\|\|` × `??` | M03, etapa 5: `process.env.PORT ?? 3000` |

Uma turma "com base" costuma ter 2 ou 3 pessoas que na prática não têm. Encontrá-las na
semana 1 custa uma monitoria; encontrá-las no M06, quando o código fica assíncrono e as
consultas encadeadas, custa o bloco de backend delas.

| Acertos | Ação |
| --- | --- |
| 4–5 | Segue normalmente |
| 2–3 | Indicar revisão pontual dos tópicos errados; monitoria nas semanas 3–4 |
| 0–1 | Monitoria dirigida **antes** do M03; acompanhar de perto até o M06 |

Se mais de 20% da turma ficar em 0–1, reavalie o cronograma: o M03 é o primeiro módulo em
que a sintaxe deixa de ser o que se estuda e passa a ser a ferramenta com que se estuda.

## 2. Ritmo sugerido de uma aula de 5h

| Tempo | Atividade |
| --- | --- |
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
- **Erre de propósito** pelo menos uma vez por aula: esqueça de registrar o provider no
  módulo, esqueça o `migration:run`. Mostrar a mensagem de erro e o caminho até a correção vale mais que
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
- **Contrato de equipe** obrigatório na Etapa 1 — inclui o que acontece se alguém não
  entregar.

**Caronas.** Instrumentos objetivos, nesta ordem: (1) histórico de commits por autor,
(2) autoavaliação e avaliação por pares na Etapa 3, (3) arguição individual na
apresentação — cada integrante responde sobre uma parte do código que **não** escreveu.
A nota do projeto é individualizável por fator de participação (0,7–1,1).

## 5. Compressão do conteúdo

Se precisar reduzir o tempo de aula sem ferir a ementa, comprima nesta ordem:

1. **M13 Observabilidade** — vira leitura com roteiro assíncrono; mantenha o healthcheck
   e o teste de restauração do backup em aula.
2. **M11 Tipos compartilhados** — pode virar leitura assíncrona.
3. **M10 Testes** — reduza à regra de negócio e à matriz de acesso; o resto vira exercício.
4. **M00 Ambiente** — transforme em pré-atividade assíncrona, com o `verifica-ambiente.mjs`
   como comprovante.

**Nunca corte:** M01, M02 e M04 a M09, e o M12 — são itens explícitos da ementa (ou
pré-requisito direto deles). E não corte as etapas do projeto nem a extensão: são
eliminatórias.

## 6. Erros de condução mais comuns

| Erro | Efeito | Correção |
| --- | --- | --- |
| Ensinar ORM antes de HTTP | Estudante decora comandos, não entende requisição | Mantenha M01 antes de tudo |
| Deixar o deploy para a última semana | Metade da turma não implanta | M12 antes da reta final, com o BiblioCom (não com o projeto) |
| Aceitar tema de projeto grande demais | Etapa 2 não fecha | Aplicar o filtro de escopo da Etapa 1 com rigor |
| Extensão virar "apresentar slides na escola" | Não é extensão, é divulgação | Exigir demanda + entrega + devolutiva registrada |
| Corrigir só o resultado final | Não se detecta equipe travada | Usar os marcos E0–E8 semanalmente |
| Turma inteira com o mesmo tema | Cópia entre equipes | Um tema por equipe, aprovado na Etapa 1 |
| Começar a autenticação antes de a API existir | Protege-se rota que ainda vai mudar | M08 só depois do M07 |
| Deixar a equipe se dividir em "quem modela" e "quem faz rota" | Metade sai sem saber a outra parte | Portfólio individual cobre todas; papéis rotativos |
| Pular o contrato de API (M02) | Integração retrabalhada na Etapa 2 | Contrato escrito é entrega da Etapa 1 |
| Gastar as aulas de NestJS ensinando JavaScript | Perde-se o modelo mental do framework, que é o difícil | Diagnóstico da semana 1; monitoria para casos isolados |
| Deixar os testes para o fim | Ninguém escreve teste para código que já "funciona" | Cada módulo a partir do M10 entrega com teste |

## 7. Correção eficiente

- Use as rubricas de [`../avaliacao/`](../avaliacao/) — elas transformam correção em
  conferência de evidências.
- Peça sempre **link + commit hash**, não arquivo `.zip`.
- Para o portfólio (E0–E8): correção binária (entregue/não entregue) + amostragem de 30%
  com feedback escrito. Corrigir 100% com detalhe é insustentável e não muda o resultado.
- Automatize o que der: o CI (M10) já reprova PR sem testes passando.

## 8. Acessibilidade e inclusão

- Todos os roteiros funcionam em Windows, macOS e Linux; comandos duplicados quando
  divergem.
- Estudantes sem máquina própria: garanta laboratório com horário estendido ou use
  GitHub Codespaces / Gitpod (o material roda sem alterações).
- Internet instável: os módulos M00–M11 funcionam offline após a primeira instalação;
  use um espelho local (`npm config set registry`), ou distribua um `node_modules` já
  populado por pen drive.

## 9. Integridade acadêmica e uso de IA

Posição sugerida (ajuste ao regimento da instituição):

- **Permitido e incentivado:** usar assistentes de IA como par de programação, para
  explicar erros, gerar rascunhos e revisar código.
- **Obrigatório:** declarar o uso no relatório técnico (seção "Ferramentas de apoio"), e
  **saber explicar cada linha entregue**. A arguição individual da Etapa 3 verifica isso.
- **Proibido:** entregar código que a equipe não sabe explicar; submeter texto de relatório
  gerado sem revisão e sem dados reais do projeto.

O critério prático é este: *a IA acelera quem entende; a arguição separa os dois casos*.
