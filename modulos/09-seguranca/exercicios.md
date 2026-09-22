# M09 — Exercícios

## E13.1 — IDOR

Crie dois usuários com papéis diferentes e tente acessar um recurso pertencente ao outro.
Corrija a autorização e registre o status esperado.

## E13.2 — Entrada hostil

Envie campos extras, paginação extrema, strings longas e um arquivo com extensão enganosa.
Documente qual camada rejeita cada caso.

## E13.3 — Auditoria de segredos

Procure segredos no código, `.env`, logs e respostas. Remova os vazamentos e adicione uma
verificação automatizada ao CI.
