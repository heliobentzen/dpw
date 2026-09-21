# M05 — Exercícios

## E05.1 — Migração de esquema

Adicione um campo obrigatório a uma entidade existente. Gere a migração, revise o SQL, aplique
ao banco e registre o que aconteceria com linhas já existentes.

## E05.2 — Migração de dados

Crie uma migração que preencha o novo campo para registros antigos antes de torná-lo obrigatório.
Demonstre que a aplicação continua funcionando depois da migração.

## E05.3 — Rollback

Aplique uma migração em um banco descartável, reverta-a e aplique-a novamente. Explique por que
um rollback de esquema não desfaz automaticamente todos os efeitos de uma migração de dados.

## E05.4 — CI reproduzível

Escreva os comandos necessários para criar um banco vazio, aplicar todas as migrações e iniciar
a API. O roteiro deve funcionar para outra pessoa sem depender do seu banco local.
