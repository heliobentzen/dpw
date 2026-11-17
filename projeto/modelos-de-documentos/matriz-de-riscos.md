# Matriz de Riscos

> P1 · Revisar em toda retrospectiva de sprint.
>
> 📌 **Cobrado em:** P1, critério 6 — 3 a 5 riscos específicos, cada um com plano B. Seções marcadas ➕ não são avaliadas.

## Como usar

**Probabilidade:** B (baixa, < 30%) · M (média, 30–70%) · A (alta, > 70%)
**Impacto:** B (atrasa uma tarefa) · M (atrasa uma sprint) · A (compromete a entrega)

| | Impacto B | Impacto M | Impacto A |
| --- | --- | --- | --- |
| **Prob. A** | Média | Alta | **Crítica** |
| **Prob. M** | Baixa | Média | Alta |
| **Prob. B** | Baixa | Baixa | Média |

**Resposta por exposição:**

| Exposição | O que fazer |
| --- | --- |
| Crítica | Ação preventiva **agora**, com responsável e prazo; plano B pronto |
| Alta | Mitigação planejada nesta sprint |
| Média | Monitorar; revisar a cada retrospectiva |
| Baixa | Registrar e seguir |

---

## Matriz do projeto

| # | Risco | Prob. | Imp. | Expos. | Mitigação (reduz a probabilidade) | Plano B (reduz o impacto) | Responsável | Situação |
| --- | --- | :---: | :---: | :---: | --- | --- | --- | --- |
| R01 | | | | | | | | Ativo |
| R02 | | | | | | | | Ativo |
| R03 | | | | | | | | |
| R04 | | | | | | | | |
| R05 | | | | | | | | |

---

## Riscos frequentes em projetos desta disciplina

Use como ponto de partida — adapte ao seu contexto, não copie.

| Risco | Prob. típica | Imp. | Mitigação | Plano B |
| --- | :---: | :---: | --- | --- |
| ➕ (trilha opcional) Organização parceira fica indisponível | M | A | Reuniões agendadas com antecedência; 2ª pessoa de contato | Validar com usuários finais; docente aciona parceiro reserva |
| Integrante com sobrecarga (trabalho, saúde) | A | M | Disponibilidade real declarada; tarefas pequenas | Redistribuir na retrospectiva; renegociar escopo |
| Escopo cresce durante o projeto | A | A | Escopo declarado por escrito; troca 1 por 1 | Cortar Should e Could |
| Equipe começa a programar tarde | M | A | Módulos aplicados no projeto desde a semana 4; marcos semanais | Reduzir MVP a 3 funcionalidades |
| Deploy falha na reta final | M | A | Deploy do projeto na semana 14, junto com o M12 | Plataforma alternativa testada |
| Plano gratuito da PaaS muda de política | B | A | Deploy testado em 2 plataformas | Migrar; docker-compose local para a apresentação |
| Conflitos de Git e migrações | A | B | Uma migração por PR; PR pequeno; `git pull` antes de gerar | Apagar a migração local e gerá-la de novo sobre a `main` atualizada |
| Local de uso sem internet | M | A | **Verificar presencialmente** na semana 14 | Repensar o modo de uso (offline-first ou uso administrativo) |
| Perda de dados / código | B | A | Push diário; backup automático do banco | Restaurar do remoto/backup |
| Usuários não adotam o sistema | M | A | Protótipo validado; teste com usuário; capacitação | Ajustar fluxo; simplificar |
| Vazamento de dados pessoais | B | A | Mapa de dados; minimização; controle de acesso testado | Plano de resposta a incidente (M09) |
| Apresentação sem internet no auditório | M | M | Vídeo de demonstração gravado | Rodar local com dados de exemplo |

---

## Registro de riscos materializados · ➕ opcional

Quando um risco vira problema, registre — isso alimenta o relatório e a retrospectiva.

| # | Data | Risco | O que aconteceu | Resposta aplicada | Funcionou? | Aprendizado |
|---|---|---|---|---|---|---|
| | | | | | | |
