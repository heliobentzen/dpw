# M04 — Exercícios

## E04.1 — Diário de migrações (individual)

Execute a sequência abaixo, registrando para **cada passo**: o comando, o nome do arquivo
gerado, as operações contidas e o SQL correspondente.

1. Adicionar `Obra.numero_paginas` (opcional).
2. Adicionar `Obra.destaque` (booleano, padrão `False`).
3. Tornar `Obra.isbn` único.
4. Criar índice composto em `(autor, ano_publicacao)`.
5. Remover `Obra.subtitulo`.
6. Reverter o passo 5.

**Entrega:** tabela `passo | arquivo | operações | SQL resumido`.

> No passo 3 você provavelmente vai tomar um erro de valores duplicados. Isso é parte do
> exercício: descreva como resolveu.

---

## E04.2 — Migração de dados com reversão (individual) ⭐

O campo `Associado.nome` guarda o nome completo. A biblioteca agora quer separar em
`primeiro_nome` e `sobrenome`.

1. **Expandir:** adicione os dois campos como `blank=True`.
2. **Migrar:** `RunPython` que divide `nome` no **primeiro espaço** (cuidado com nomes
   compostos e com nomes de uma palavra só).
3. **Contrair:** torne `primeiro_nome` obrigatório.
4. Escreva o `reverse_code` que reconstrói `nome` a partir dos dois campos.
5. Prove que funciona nos dois sentidos: `migrate` → confira → `migrate <anterior>` →
   confira → `migrate` de novo.

**Casos de borda a tratar:** `"Ana"`, `"Ana Maria de Souza"`, `""`, `"  Ana  "`.

---

## E04.3 — Conflito de migração provocado (em duplas) ⭐

1. Ambos partem da mesma `main`.
2. A pessoa A adiciona `Obra.idioma` e envia para `main`.
3. A pessoa B, **sem dar pull**, adiciona `Obra.edicao_revisada` e tenta enviar.
4. B faz `git pull` e roda `migrate` — capture a mensagem de conflito.
5. Resolva com `makemigrations --merge`.
6. Verifique com `showmigrations` que o grafo ficou consistente e que os **dois** campos
   existem.

**Entrega:** log dos comandos + explicação em 5 linhas de por que o conflito ocorreu e
como preveni-lo no projeto da equipe.

---

## E04.4 — Cenário de produção (individual, sem código)

A biblioteca tem 80.000 empréstimos registrados. Você precisa adicionar
`Emprestimo.canal` (obrigatório, valores `BALCAO` / `ONLINE`), sabendo que:

- os registros anteriores a 2025 são todos de balcão;
- o sistema não pode ficar fora do ar;
- há duas instâncias da aplicação rodando ao mesmo tempo durante o deploy.

Escreva o **plano de migração** com: número de migrações, ordem, o que cada uma faz, em
que momento cada versão do código é publicada e como reverter se algo falhar no meio.

Dica: pense no que acontece se a migração rodar **antes** do código novo subir — e depois
no caso inverso.

---

## E04.5 — Migração destrutiva e recuperação (individual)

Em um branch descartável:

1. Crie uma obra com `sinopse` preenchida.
2. Renomeie `sinopse` → `resumo` respondendo **N** ao prompt.
3. Aplique e verifique: o dado sobreviveu?
4. Reverta a migração. O dado voltou?
5. Repita respondendo **y**. Compare.

**Entrega:** comparação das duas migrações geradas (operações) + conclusão em 3 linhas.

---

## E04.6 — SQLite × PostgreSQL (individual)

Rode `sqlmigrate acervo 0001` com cada banco configurado e preencha:

| Aspecto | SQLite | PostgreSQL |
|---|---|---|
| Tipo gerado para `CharField(200)` | | |
| Tipo gerado para `BooleanField` | | |
| Tipo da chave primária | | |
| Como declara a FK | | |
| Como declara a `CheckConstraint` | | |
| Suporte a `ALTER COLUMN` | | |

Responda: **qual erro só apareceria em PostgreSQL, nunca em SQLite?** (dica: pense em
tipagem e em transações em DDL)

---

## E04.7 — Comando de verificação (individual)

Escreva um script/comando que a equipe rodará antes de todo deploy, verificando:

1. Existe migração pendente não gerada? (`makemigrations --check --dry-run`)
2. Existe migração gerada e não aplicada? (`showmigrations --plan`)
3. Todas as migrações têm `reverse_code` quando usam `RunPython`?

Integre ao CI no M12.

```bash
# esqueleto
python manage.py makemigrations --check --dry-run || {
  echo "ERRO: ha alteracoes de model sem migracao gerada"; exit 1;
}
```

---

## Critérios de verificação

| Exercício | Evidência |
|---|---|
| E04.1 | Tabela dos 6 passos |
| E04.2 | 3 migrações + prova de ida e volta |
| E04.3 | Log + migração de merge no repositório |
| E04.4 | Plano escrito (1 página) |
| E04.5 | Comparação + conclusão |
| E04.6 | Tabela + resposta |
| E04.7 | Script funcionando |
