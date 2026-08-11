# Plano de Ensino — Desenvolvimento de Projeto Web

## 1. Identificação

| Campo | Valor |
|---|---|
| Disciplina | Desenvolvimento de Projeto Web |
| Carga horária total | 100 horas |
| Carga horária teórica | 40 horas |
| Carga horária prática | 60 horas |
| Carga horária extensionista | 10 horas (creditadas dentro da CH total) |
| Modalidade sugerida | Presencial ou híbrida, com laboratório de informática |
| Pré-requisitos | Lógica de programação; programação orientada a objetos; banco de dados relacional (modelagem e SQL básico) |
| Stack de referência | Python 3.12+, Django 5.x, PostgreSQL 16, Git/GitHub, Docker, HTML/CSS |

## 2. Ementa (oficial)

> Introdução a aplicações web: Como funcionam; Protocolo HTTP: métodos POST e GET.
> Framework de desenvolvimento Web – Model: Utilização de classes para geração automática
> do banco de dados; Atualização do banco de dados a partir das alterações nas classes
> geradoras; Geração de consultas ao BD e operações CRUD a partir da API do framework.
> Framework de desenvolvimento Web – Views: Mapeamento de URLs; Criação de classes /
> métodos / funções para processamento de requisições. Framework de desenvolvimento Web –
> Templates: Criação de interfaces com o usuário utilizando o framework escolhido. Tópicos
> relevantes: Segurança, Gestão de usuários; Implantação (deploy) do sistema.
> Desenvolvimento de atividades extensionistas.

## 3. Rastreabilidade ementa → módulos

Toda a ementa está coberta; nada foi acrescentado sem função clara.

| Item da ementa | Onde é tratado |
|---|---|
| Introdução a aplicações web: como funcionam | M01 |
| Protocolo HTTP: métodos POST e GET | M01 (+ M06 na prática de views) |
| Model: classes que geram o banco automaticamente | M03 |
| Atualização do banco a partir de alterações nas classes | M04 (migrações) |
| Consultas ao BD e CRUD pela API do framework | M05 (+ M07 via forms) |
| Views: mapeamento de URLs | M06 |
| Views: classes/métodos/funções de processamento de requisições | M06 (FBV e CBV) |
| Templates: interfaces com o usuário | M08 (+ M07 renderização de formulários) |
| Segurança | M11 (transversal em M06, M07, M10, M14) |
| Gestão de usuários | M10 |
| Implantação (deploy) | M14 (+ M15 pós-deploy) |
| Atividades extensionistas | `projeto/extensao/` |

Conteúdos **complementares e não obrigatórios pela ementa**, incluídos por demanda de
mercado e claramente sinalizados: M00 (ambiente), M02 (bootstrap do projeto),
M09 (Admin), M12 (testes), M13 (APIs). Podem ser comprimidos se a instituição exigir
aderência estrita — ver [`guia-do-docente.md`](guia-do-docente.md#compressão-do-conteúdo).

## 4. Objetivo geral

Capacitar o estudante a **projetar, construir, testar e implantar** uma aplicação web
completa, orientada a dados, utilizando um framework MVC/MTV, aplicando boas práticas de
segurança e de trabalho em equipe, e a **aplicar essa capacidade em uma demanda real de
uma organização parceira** (dimensão extensionista).

## 5. Objetivos específicos

Ao final da disciplina, o estudante será capaz de:

1. Explicar o ciclo requisição–resposta de uma aplicação web e o papel do HTTP, incluindo
   a diferença semântica e prática entre GET e POST.
2. Modelar um domínio em classes e gerar/evoluir o esquema do banco de dados por meio de
   migrações versionadas.
3. Implementar as quatro operações CRUD usando a API do ORM, com consultas filtradas,
   ordenadas, agregadas e otimizadas.
4. Mapear URLs para views (funções e classes) e processar requisições com tratamento de
   parâmetros, validação e redirecionamentos.
5. Construir interfaces de usuário com sistema de templates, herança de layout, formulários
   e mensagens de feedback.
6. Implementar autenticação, autorização por papéis e fluxo completo de gestão de usuários.
7. Identificar e mitigar as vulnerabilidades web mais comuns (OWASP Top 10 aplicado ao
   framework).
8. Escrever testes automatizados para modelos, views e regras de negócio.
9. Implantar a aplicação em ambiente de produção com configuração segura, banco gerenciado,
   arquivos estáticos e HTTPS.
10. Trabalhar em equipe com fluxo Git, revisão de código e documentação técnica.
11. Interagir com uma comunidade/organização externa, levantar sua necessidade, entregar
    solução e registrar o impacto.

## 6. Competências e alinhamento com o mercado

| Competência | Evidência avaliável | Relação com vagas |
|---|---|---|
| Modelagem de dados com ORM | Modelo do projeto + migrações limpas | "Django/ActiveRecord/Hibernate", "modelagem relacional" |
| CRUD e regras de negócio | Módulos funcionais do projeto | Todo backend júnior |
| HTTP e arquitetura web | Prova teórica + debug de requisições | Entrevistas técnicas |
| Versionamento colaborativo | Histórico de commits/PRs da equipe | "Git", "code review" |
| Segurança aplicada | Checklist OWASP do projeto | "OWASP", "LGPD" |
| Testes automatizados | Suíte de testes verde no CI | "testes unitários", "pytest/JUnit" |
| Deploy e configuração | URL pública funcionando | "CI/CD", "cloud", "12-factor" |
| Comunicação técnica | Relatório + apresentação | Toda vaga |

## 7. Metodologia

- **Aula expositiva dialogada** para os blocos teóricos (40h), sempre ancorada em um
  problema concreto do estudo de caso.
- **Laboratório guiado** (roteiros passo a passo) e **laboratório aberto** (exercícios sem
  passo a passo) para a carga prática (60h).
- **Aprendizagem baseada em projeto (PBL)**: cada módulo entrega uma peça reutilizável no
  projeto da equipe.
- **Pair programming** e **revisão por pares** obrigatórios na Etapa 3.
- **Extensão**: interação dialógica com organização parceira, do diagnóstico à entrega.

Regra de ouro do material: **nenhum módulo termina sem código rodando**.

## 8. Recursos necessários

- Laboratório com Python 3.12+, Git, editor (VS Code / PyCharm) e acesso à internet.
- Conta GitHub por estudante; organização GitHub para as equipes.
- Conta em PaaS gratuita/estudantil para deploy (Render, Railway, Fly.io ou similar).
- Docker Desktop (opcional, mas recomendado para PostgreSQL local).
- Projetor/quadro para as aulas teóricas.

## 9. Avaliação

Detalhamento completo em [`../avaliacao/README.md`](../avaliacao/README.md).

| Instrumento | Peso | Momento |
|---|---:|---|
| Atividades práticas dos módulos (portfólio) | 20% | Contínuo |
| Avaliação teórica (HTTP, ORM, segurança) | 15% | Semana 10 |
| Projeto — Etapa 1 (tema) e Etapa 2 (planejamento) | 15% | Semanas 6 e 8 |
| Projeto — Etapa 3 (sistema desenvolvido e implantado) | 30% | Semana 18 |
| Projeto — Etapa 4 (relatório técnico + apresentação) | 10% | Semana 20 |
| Atividades extensionistas (execução + evidências) | 10% | Semanas 12–20 |

**Aprovação:** média ponderada ≥ 6,0 **e** frequência conforme regimento **e** entrega
obrigatória das Etapas 3 e 4 e das atividades extensionistas (itens eliminatórios).

## 10. Bibliografia

### Básica

1. DJANGO SOFTWARE FOUNDATION. *Django Documentation* (versão 5.x). Disponível em
   <https://docs.djangoproject.com/pt-br/5.0/>.
2. MELÉ, Antonio. **Django 5 By Example**. 5. ed. Birmingham: Packt Publishing, 2024.
3. GRINBERG, Miguel; **Flask Web Development** / equivalente de referência para
   comparação de arquiteturas web. 2. ed. O'Reilly, 2018.

### Complementar

4. VINCENT, William S. **Django for Professionals**. 5. ed. WelcomeToCode, 2024.
5. GREENFELD, Daniel R.; GREENFELD, Audrey R. **Two Scoops of Django 3.x**. Two Scoops
   Press, 2020.
6. MOZILLA. *MDN Web Docs — HTTP*. Disponível em
   <https://developer.mozilla.org/pt-BR/docs/Web/HTTP>.
7. OWASP FOUNDATION. *OWASP Top 10:2021*. Disponível em <https://owasp.org/Top10/>.
8. BRASIL. **Lei nº 13.709/2018 (LGPD)**.
9. FORCIER, Jeff; BISSEX, Paul; CHUN, Wesley. **Python Web Development with Django**.
   Addison-Wesley.
10. WIGGINS, Adam. *The Twelve-Factor App*. Disponível em <https://12factor.net/pt_br/>.

### Sobre extensão

11. BRASIL. **Resolução CNE/CES nº 7/2018** — Diretrizes para a Extensão na Educação
    Superior Brasileira.
12. FORPROEX. **Política Nacional de Extensão Universitária**. 2012.
