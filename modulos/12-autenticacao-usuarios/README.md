# M12 — Autenticação e autorização na API

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 12** · **Pré-requisito:** M07
> **Ementa:** gestão de usuários

A API agora precisa distinguir quem está fazendo uma requisição e o que essa pessoa pode
fazer. O módulo implementa o fluxo no backend, sem confiar em qualquer cliente.

## Objetivos

1. Diferenciar autenticação, autorização e auditoria.
2. Modelar usuário, senha armazenada com hash e papéis.
3. Implementar login e emissão de sessão ou token com expiração.
4. Proteger rotas com guards e autorizar operações por papel.
5. Testar acesso permitido, negado e recurso inexistente.

## Sequência prática

1. Criar a entidade `Usuario` e a migração correspondente.
2. Implementar cadastro administrativo e hash de senha com Argon2 ou bcrypt.
3. Implementar login com resposta que não expõe segredo.
4. Criar guard de autenticação e decorator para usuário atual.
5. Criar guard de papéis e proteger um endpoint de escrita.
6. Diferenciar `401 Unauthorized` de `403 Forbidden`.
7. Registrar os casos no Swagger e nos testes de API.

## Decisão de projeto

Escolha cookie `HttpOnly` ou token no cabeçalho com base no modelo de ameaça e no tipo de
cliente. A escolha, a expiração, a revogação e a política de senha devem ser registradas em
um ADR. O servidor continua responsável por toda autorização.

## Checklist de saída

- [ ] Senhas nunca são armazenadas em texto puro
- [ ] Login inválido responde sem revelar qual dado falhou
- [ ] Rotas protegidas recusam requisições sem autenticação
- [ ] Papéis são verificados no backend
- [ ] `401` e `403` são usados corretamente
- [ ] Casos de acesso estão documentados no Swagger
- [ ] Testes cobrem pelo menos dois papéis e uma rota protegida

## Entrega E5

Entregue login, dois papéis, uma rota protegida, migração do usuário, testes e ADR da escolha
de sessão ou token.
