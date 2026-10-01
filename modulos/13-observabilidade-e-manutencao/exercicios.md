# M13 — Exercícios

## E13.1 — O empréstimo que sumiu (individual) ⭐

A organização escreve: *"o empréstimo da associada 7 sumiu ontem à tarde"*.

1. Escreva as cinco buscas que você faria no log para investigar, cada uma com o campo e o
   valor procurados.
2. Rode-as no log do seu ensaio local (etapa 3), depois de provocar a situação.
3. Alguma pergunta ficou sem resposta? Que evento ou campo faltou registrar? Acrescente-o.

---

## E13.2 — O que está no log (individual)

Leia 50 linhas do log de produção (ou do ensaio) e preencha:

| Campo encontrado | Precisa estar lá? | É dado pessoal? | Ação |
|---|---|---|---|
| | | | |

Os cabeçalhos de resposta ocupam boa parte de cada linha. Pesquise a opção `serializers` do
`pino-http` e reduza o log de resposta ao `statusCode`. Quanto o arquivo diminuiu?

---

## E13.3 — Alerta de força bruta (em duplas)

O `warn` de `login_recusado` existe para isso. Configurem, na plataforma de logs ou no
monitor, um alerta para **mais de 20 logins recusados em 10 minutos**. Provoquem-no com um
laço de `curl.exe` e confirmem que o alerta chegou.

Respondam: o limite de tentativas do M09 já não resolve? O que este alerta acrescenta?

---

## E13.4 — Restauração cronometrada (individual)

Repita o ciclo das etapas 7 e 8 cronometrando cada passo:

| Passo | Tempo |
|---|---|
| Backup | |
| Cópia para a máquina | |
| Restauração | |
| Conferência | |
| **Total** | |

Esse total é quanto tempo o sistema ficaria fora num desastre. Escreva-o no
`docs/manutencao.md` e discuta: é aceitável para a organização parceira?

---

## E13.5 — Custo de três anos (em equipe)

Calculem o custo mensal **real** de manter o projeto da equipe no ar por três anos:
hospedagem quando a camada gratuita acabar, banco, domínio, e as horas de manutenção (uma
estimativa honesta). Apresentem à organização parceira junto do plano de manutenção.

---

## E13.6 — Runbook testado por outra pessoa (em duplas)

Troquem os *runbooks* de "a API está fora do ar". Uma pessoa derruba algo no ensaio local da
outra **sem contar o quê** (banco parado, variável errada, migração pendente). A outra segue
só o *runbook* até achar a causa.

**Verificação:**

- [ ] A causa foi achada sem perguntar nada
- [ ] Todo passo que faltou virou uma linha nova no *runbook*

---

## Gabarito parcial

**E13.1** — As buscas típicas: por `"associadoId":7`; por `"evento":"emprestimo"` no
intervalo de tempo; por `"statusCode":5` no mesmo intervalo; por `"method":"DELETE"` em rotas
de empréstimo; por `"evento":"login"` para saber quem estava logado. Se a devolução não gera
evento, ninguém consegue dizer se o empréstimo "sumiu" ou foi devolvido — é o campo que
costuma faltar.

**E13.3** — O limite do M09 freia **um** IP. O alerta avisa uma **pessoa** de que algo está
acontecendo — inclusive um ataque distribuído, que o limite por IP não percebe.
