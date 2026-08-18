# Relatório Técnico — estrutura e orientações

> Etapa 4 · 12 a 20 páginas + apêndices · ABNT (ou norma da instituição) · PDF

---

## Capa

`<INSTITUIÇÃO>` · `<CURSO>` · `<DISCIPLINA>`
**`<TÍTULO DO PROJETO>`**
`<Subtítulo: sistema web para <organização parceira>>`
`<Nomes dos integrantes, em ordem alfabética>`
`<Orientação: docente>`
`<Cidade, mês/ano>`

## Resumo (200 palavras) + palavras-chave

Estrutura: problema → contexto → o que foi feito → resultado medido → conclusão.
Escreva por último.

---

## 1. Introdução (1–2 páginas)

- Contexto: onde, com quem, por quê
- Problema, na formulação da Etapa 1
- Objetivo geral e objetivos específicos
- Justificativa: relevância social e técnica
- Como o documento está organizado

## 2. A organização parceira (1 página)

Quem é, quando surgiu, o que faz, quantas pessoas atende, como se sustenta. Como se deu o
primeiro contato e como a relação evoluiu ao longo do semestre.

## 3. Diagnóstico (1–2 páginas)

**Como o processo funcionava antes.** Descreva o fluxo real, com evidências: falas
registradas em ata, fotos do processo em papel, números levantados.

Inclua um diagrama do processo "como é" (as-is) e aponte onde estão os gargalos.

> Esta seção é a que mais distingue um bom relatório. Sem diagnóstico, não há como avaliar
> se a solução resolveu alguma coisa.

## 4. Solução proposta (1–2 páginas)

- Visão geral em linguagem simples
- Personas e cenário principal
- Funcionalidades do MVP
- **O que ficou de fora e por quê**
- Processo "como ficou" (to-be)

## 5. Tecnologias e arquitetura (2–3 páginas)

- Stack, com justificativa (resuma os ADRs; não repita a documentação do framework)
- Diagrama de arquitetura
- Modelo de dados (diagrama ER + explicação das entidades e relações principais)
- Decisões técnicas relevantes e alternativas descartadas

> ❌ Não escreva "NestJS é um framework Node.js que usa TypeScript…".
> ✅ Escreva "Escolhemos manter as duas camadas em TypeScript porque, com 5 meses e uma
> equipe pequena, compartilhar os tipos entre backend e frontend evitou a classe de erro que
> mais nos custou tempo na primeira sprint: campo renomeado de um lado e não do outro."

## 6. Desenvolvimento (2–3 páginas)

- Organização do trabalho: sprints, papéis, rituais
- Fluxo técnico: branches, PRs, revisão, CI
- Cronograma planejado × realizado, com análise dos desvios
- Três desafios técnicos concretos e como foram resolvidos
- Métricas: nº de commits, PRs, issues fechadas, linhas de código, distribuição por autor

## 7. Testes (1–2 páginas)

- Estratégia e níveis
- Cobertura e o que ela cobre de fato
- Matriz de acesso
- **Teste com usuário real:** o que foi observado e o que mudou no sistema por causa disso
- Bugs conhecidos remanescentes

## 8. Implantação (1 página)

- Onde está no ar, com a URL
- Arquitetura de produção
- Procedimento de deploy e de rollback
- Backup e monitoramento
- **Custo mensal de manutenção** e quem arca

## 9. Segurança e proteção de dados (1 página)

- Medidas adotadas (autenticação, autorização, cabeçalhos, validação)
- Resultado do `check --deploy` e das verificações do M13
- **Mapa de dados pessoais** (dado, finalidade, base legal, retenção)
- Aviso de privacidade
- Como o sistema atende aos direitos do titular

## 10. Resultados (1–2 páginas)

Retome os critérios de sucesso da Etapa 1:

| Objetivo | Meta | Alcançado | Evidência | Análise |
|---|---|---|---|---|
| | | | | |

Inclua: evidências de uso real (nº de registros, período), depoimentos da organização,
comparação antes × depois.

**Meta não alcançada não reprova — omiti-la, sim.** Analise honestamente por quê.

## 11. Relato de experiência (2–3 páginas) ⭐

A dimensão extensionista. Ver
[`relato-de-experiencia.md`](relato-de-experiencia.md) para a estrutura detalhada.

## 12. Conclusão e trabalhos futuros (1 página)

- O que foi entregue, em uma frase
- O que se aprendeu (técnico e humano)
- Limitações reconhecidas
- Recomendações para quem continuar: o que fazer primeiro, o que evitar

## Referências

ABNT NBR 6023. Inclua documentação oficial, livros, artigos e a legislação citada.

## Apêndices

| Apêndice | Conteúdo |
|---|---|
| A | Manual do usuário |
| B | Modelo de dados completo |
| C | Backlog final com situação de cada história |
| D | Atas das reuniões |
| E | Termo de transferência assinado |
| F | Carta de anuência |
| G | Evidências da ação extensionista |
| H | Ferramentas de apoio utilizadas (inclusive assistentes de IA, se usados) |

---

## Checklist antes de entregar

- [ ] Todas as seções presentes, na ordem
- [ ] Nenhum dado pessoal de terceiros identificável (prints anonimizados)
- [ ] Todas as figuras numeradas, legendadas e **citadas no texto**
- [ ] Todas as tabelas numeradas e citadas
- [ ] Referências completas e citadas ao longo do texto
- [ ] URL do sistema funcionando **no dia da entrega** (verifique!)
- [ ] Link do repositório acessível ao docente
- [ ] Revisão ortográfica e de coesão feita por alguém que não escreveu
- [ ] Nenhum texto genérico do tipo "a tecnologia é muito importante nos dias de hoje"
- [ ] Números conferem entre as seções
- [ ] Uso de ferramentas de IA declarado no Apêndice H
