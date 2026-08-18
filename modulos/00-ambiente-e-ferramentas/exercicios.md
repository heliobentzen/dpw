# M00 — Exercícios

## E00.1 — Ambiente reprodutível (individual)

Crie um repositório `dpw-exercicios` contendo:

- `node_modules/` ignorado
- `package.json` e `pnpm-lock.yaml` versionados (mais suas dependências
  transitivas)
- `README.md` com a seção "Como rodar"
- `.env.example` com as chaves `SECRET_KEY=` e `DEBUG=` (sem valores reais)

**Verificação:** apague a pasta `node_modules/`, recrie-a com `pnpm install` a partir do
lock, e mostre que os scripts continuam funcionando. Compare o `pnpm-lock.yaml` antes e
depois com `git diff`: ele **não** pode ter mudado.

---

## E00.2 — Arqueologia de histórico (individual)

Usando um repositório público qualquer (ex.: `nestjs/nest`), responda com o comando que
usou:

1. Quantos commits o repositório tem? (`git rev-list --count HEAD`)
2. Qual foi o primeiro commit e sua data?
3. Quem mais modificou o arquivo `packages/core/injector/injector.ts`?
4. O que mudou no último commit que tocou esse arquivo?

Objetivo: `git log`, `git show`, `git shortlog -sn --` deixam de ser mistério.

---

## E00.3 — Conflito de merge provocado (em duplas) ⭐

Provoque e resolva um conflito de propósito. Você **vai** viver isso na Etapa 3; melhor
agora, sem nota em jogo.

1. Ambos partem de `main` atualizada.
2. A pessoa A cria `feat/titulo-a`, edita a **linha 1** do `README.md` e faz merge em `main`.
3. A pessoa B cria `feat/titulo-b` (a partir da `main` antiga), edita a **mesma linha 1** e
   tenta fazer merge.
4. Resolva o conflito manualmente, entendendo os marcadores:

```
<<<<<<< HEAD
versão que está na main
=======
versão da sua branch
>>>>>>> feat/titulo-b
```

**Entrega:** print da resolução + link do commit de merge + resposta em 3 linhas: *por que
o Git não conseguiu resolver sozinho?*

---

## E00.4 — Desfazer sem pânico (individual)

Para cada cenário, escreva o comando e teste num repositório de brincadeira:

| # | Cenário | Comando |
|---|---|---|
| 1 | Editei um arquivo e quero descartar a alteração (ainda não fiz `add`) | |
| 2 | Fiz `git add` de um arquivo errado e quero tirá-lo do stage | |
| 3 | A mensagem do último commit está errada (ainda não fiz push) | |
| 4 | Quero desfazer o último commit mas manter as alterações no working directory | |
| 5 | Quero reverter um commit **já enviado** para o remoto | |

> Dica: `git restore`, `git restore --staged`, `git commit --amend`, `git reset --soft
> HEAD~1`, `git revert <hash>`. Entenda por que 5 é diferente de 4.

---

## E00.5 — Diagnóstico (individual)

Uma colega diz: *"Instalei o pacote mas o import fala que não existe."* Escreva o roteiro
de diagnóstico em **até 5 passos**, cada um com o comando e o que a saída indicaria.

Este exercício vale mais que os outros para a vida profissional: ele treina *método*, não
comando.

---

## Critérios de verificação

| Exercício | Evidência esperada |
|---|---|
| E00.1 | Repositório público + saída do comando de verificação |
| E00.2 | 4 comandos + 4 respostas |
| E00.3 | Link do commit de merge + explicação |
| E00.4 | Tabela preenchida + demonstração de 2 casos |
| E00.5 | Roteiro de 5 passos com comandos reais |
