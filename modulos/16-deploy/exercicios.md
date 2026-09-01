# M16 — Exercícios

## E14.1 — Deploy do zero (individual) ⭐

Implante o **seu** BiblioCom numa PaaS e documente cada passo em `docs/deploy.md`, de forma
que outra pessoa consiga reproduzir sem perguntar nada.

**Entrega:** URL pública + `docs/deploy.md` + prints da página inicial e do painel de logs.

**Critério de aceite:** um colega segue o seu documento e chega ao mesmo resultado. Troque
o documento com alguém e testem mutuamente — este é o teste real da qualidade da
documentação.

---

## E14.2 — Auditoria pós-deploy (individual)

Percorra o [checklist de deploy](../../recursos/checklists/deploy.md) e registre o
resultado de cada item, com evidência:

| Item | Resultado | Evidência |
|---|---|---|

Depois, rode e cole a saída:

```bash
curl -I https://SEU-DOMINIO/          # Linux/macOS/WSL/Git Bash
```
```powershell
curl.exe -I https://SEU-DOMINIO/      # Windows PowerShell
```

E o relatório do securityheaders.com. Meta: **nota A**.

---

## E14.3 — Simular e corrigir 5 falhas (individual)

Provoque cada falha em produção, capture a evidência e corrija:

| # | Falha | Como provocar | Sintoma | Correção |
|---|---|---|---|---|
| 1 | `ALLOWED_HOSTS` errado | Remover o domínio | | |
| 2 | SPA não construída | Remover `npm run -w frontend build` do comando de build | | |
| 3 | Migração não aplicada | Remover `migrate` do release | | |
| 4 | Variável de ambiente faltando | Remover `SESSION_SECRET` | | |
| 5 | Porta fixa no código | Trocar `process.env.PORT` por `3000` | | |

Objetivo: reconhecer o sintoma antes de precisar procurar a causa. Em produção, essa
associação vale horas.

---

## E14.4 — Migração com dados reais (individual)

Em produção, com dados já cadastrados:

1. Faça backup do banco (e **verifique** que o arquivo tem conteúdo).
2. Adicione um campo obrigatório usando expandir → migrar → contrair (3 deploys).
3. Confirme, após cada deploy, que os dados anteriores estão íntegros e o site funciona.
4. Simule a necessidade de reverter o segundo deploy. O código antigo funciona com o
   esquema novo? Prove.

**Entrega:** log dos 3 deploys + evidência de integridade + resposta ao item 4.

---

## E14.5 — Deploy automatizado com aprovação (em equipe)

Configure o pipeline completo do projeto:

```
push → CI (lint, migrações, check --deploy, testes) → merge só com CI verde
     → deploy automático em STAGING
     → aprovação manual
     → deploy em PRODUÇÃO
```

Requisitos: dois ambientes com bancos separados; variáveis distintas; nada de dado real de
pessoas em staging (por quê?); rollback documentado e **testado**.

---

## E14.6 — Comparar plataformas (em duplas)

Implante a mesma aplicação em duas plataformas diferentes e compare:

| Critério | Plataforma A | Plataforma B |
|---|---|---|
| Tempo até o primeiro deploy | | |
| Passos manuais necessários | | |
| Custo mensal estimado (fora do free tier) | | |
| Facilidade de configurar variáveis | | |
| Qualidade dos logs | | |
| Banco gerenciado incluso | | |
| HTTPS automático | | |
| Deploy contínuo a partir do Git | | |
| Facilidade de rollback | | |
| Limitações do plano gratuito | | |

Recomende uma para o projeto da equipe, com justificativa de 5 linhas.

---

## E14.7 — Dockerizar (individual)

Crie `Dockerfile` e `docker-compose.yml` que subam aplicação + PostgreSQL com um comando.

Requisitos: imagem final < 200 MB; não roda como root; usa cache de camadas
eficientemente (dependências antes do código); `healthcheck` configurado; funciona com
`docker compose up` sem passo manual.

Responda: **por que copiar o `package.json` e o `package-lock.json` antes do resto do código?**

---

## E14.8 — Desafio: plano de continuidade

Escreva o plano de continuidade do sistema em produção, respondendo com procedimentos
concretos (não intenções):

1. O banco foi apagado por engano. Qual o procedimento? Quanto se perde?
2. A conta da PaaS foi suspensa. Como sobe em outro lugar? Quanto tempo leva?
3. A pessoa que fez o deploy saiu da equipe. Quem tem acesso? Onde estão as credenciais?
4. Vazou a `SESSION_SECRET`. O que fazer, em que ordem, nas primeiras 2 horas?
5. O site está fora do ar há 30 minutos e ninguém percebeu. Como isso deixa de acontecer?
6. Um usuário reporta que perdeu dados. Como você investiga?

Este exercício antecipa exatamente as perguntas que a organização parceira vai fazer na
Etapa 4 — e cuja resposta "não pensamos nisso" custa caro.

---

## Gabarito parcial

**E14.3 (5)** — Fixar a porta faz o processo escutar em 8000 enquanto o roteador da
plataforma envia tráfego para a porta de `$PORT`. Sintoma: build e start com sucesso nos
logs, mas toda requisição devolve "Application failed to respond" ou 502.

**E14.7** — As camadas do Docker são cacheadas em ordem. Copiando os manifestos de dependência
primeiro e instalando as dependências antes de copiar o código, uma alteração em
`obras.service.ts` invalida apenas a última camada — o `npm install` é reaproveitado do cache.
Copiando tudo de uma vez, cada alteração de código reinstala todas as dependências.
