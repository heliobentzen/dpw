# M08 — Autenticação e autorização na API

> **CH:** 5h (2h teóricas · 3h práticas) · **Semana 8** · **Pré-requisito:** M07
> **Ementa:** gestão de usuários

A API agora precisa distinguir quem está fazendo uma requisição e o que essa pessoa pode
fazer. O módulo implementa o fluxo no backend, sem confiar em qualquer cliente.

## Objetivos

1. Diferenciar autenticação, autorização e auditoria.
2. Modelar usuário, senha armazenada com hash e papéis.
3. Implementar login e emissão de sessão ou token com expiração.
4. Proteger rotas com guards e autorizar operações por papel.
5. Testar acesso permitido, negado e recurso inexistente.

## 🧭 Por que este módulo chega agora

O M08 não é uma aula de "login no final do curso". Ele aparece neste ponto porque o sistema
já tem estrutura, dados e endpoints suficientes para precisar de identidade real.

Até aqui, a turma construiu a API e modelou o domínio. Agora o problema deixa de ser apenas
"como a aplicação funciona" e passa a ser "quem pode fazer o quê". A partir desse momento,
o backend precisa distinguir usuário, ação e permissão — e não pode mais confiar em uma ideia
genérica de "quem acessou o site".

Esse módulo também funciona como ponte entre a construção técnica e a responsabilidade ética do
software: a API precisa decidir com rigor o que pode ser executado por cada identidade, e não
apenas por convenção de interface.

> Quando o aluno chega ao M08, ele já tem uma aplicação funcional. O que muda agora é o nível
> de maturidade: a aplicação deixa de ser acessível a qualquer ator e passa a ser governada por
> regra de acesso e auditoria.

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
