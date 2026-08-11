# Checklist de revisão de código (Pull Request)

Para usar na Etapa 3. Revisão leva 15–30 minutos; PR que exige mais que isso está grande
demais e deveria ser dividido.

## Antes de tudo

- [ ] O PR tem descrição: o que muda, como testar, quais critérios de aceite cobre
- [ ] Está vinculado a uma issue/história
- [ ] O CI está verde
- [ ] O diff tem menos de ~400 linhas (fora migrações e arquivos gerados)

## Funcionalidade

- [ ] Faz o que a história pede?
- [ ] Os critérios de aceite estão todos cobertos?
- [ ] Os caminhos de erro foram tratados (entrada inválida, objeto inexistente, sem permissão)?
- [ ] O estado vazio foi tratado?

## Testes

- [ ] Há teste para a regra de negócio nova?
- [ ] O teste falharia se a regra fosse quebrada? (pergunte-se: qual mutação ele pega?)
- [ ] Há teste do caminho de erro, não só do caminho feliz?
- [ ] Nenhum teste depende da data real, de rede ou da ordem de execução?

## Modelo e dados

- [ ] Regra de negócio está no model/service, não espalhada na view?
- [ ] `on_delete` adequado ao significado da relação?
- [ ] Migração gerada, nomeada e revisada? (leia o conteúdo, não só o nome)
- [ ] Migração de dados usa `apps.get_model` e tem `reverse_code`?
- [ ] Campo novo obrigatório em tabela com dados usa expandir/contrair?

## Consultas

- [ ] Alguma iteração acessando FK sem `select_related`? (N+1)
- [ ] Algum `.count()` ou `.exists()` dentro de laço?
- [ ] Filtro por relação N-N sem `distinct()`?
- [ ] Incremento numérico feito em Python em vez de `F()`?
- [ ] Listagem sem paginação?

## Views e URLs

- [ ] Toda ação que altera dados é POST?
- [ ] Há `{% csrf_token %}` em todo formulário POST?
- [ ] POST bem-sucedido redireciona (PRG)?
- [ ] Nenhuma URL escrita literalmente (use `{% url %}` / `reverse`)?
- [ ] `get_object_or_404` em vez de `get()` solto?

## Segurança

- [ ] A view exige autenticação onde deveria?
- [ ] A view exige permissão onde deveria?
- [ ] O queryset é filtrado pelo usuário (sem IDOR)?
- [ ] `fields` explícito no ModelForm (nada de `"__all__"`)?
- [ ] Campos sensíveis definidos no servidor, não vindos do cliente?
- [ ] Nenhum `|safe` / `mark_safe` sobre dado do usuário?
- [ ] Nenhum SQL montado com f-string?
- [ ] Nenhuma credencial, token ou dado real de pessoa no diff?

## Interface

- [ ] Funciona em 360px?
- [ ] Campos têm `<label>` associado?
- [ ] Ação bem-sucedida dá feedback (mensagem)?
- [ ] Ação destrutiva pede confirmação?
- [ ] Textos em português, sem *lorem ipsum* nem placeholder esquecido?

## Legibilidade

- [ ] Os nomes dizem o que a coisa é? (`obras_disponiveis` > `lista2`)
- [ ] Alguma função com mais de ~40 linhas ou 3 níveis de indentação?
- [ ] Alguma duplicação óbvia que pediria extração?
- [ ] Comentários explicam **por quê**, não **o quê**?
- [ ] Nenhum `print()`, código comentado ou `TODO` sem issue?

---

## Como comentar

| ❌ | ✅ |
|---|---|
| "Isso está errado." | "Aqui pode dar N+1 na listagem — que tal `select_related('autor')`?" |
| "Código ruim." | "Essa função faz três coisas; extrair a validação para o form deixaria mais fácil de testar." |
| "Você não sabe fazer isso?" | "Não conhecia essa abordagem — pode me explicar por que escolheu assim?" |

Classifique cada comentário:

- **Bloqueante** — precisa mudar antes do merge (bug, falha de segurança, teste ausente)
- **Sugestão** — melhoraria, mas não bloqueia
- **Dúvida** — quero entender
- **Elogio** — sim, use; revisão só com críticas desgasta a equipe

Revisão é sobre o código, nunca sobre a pessoa. Quem escreveu está lendo, e vai revisar o
seu PR amanhã.
