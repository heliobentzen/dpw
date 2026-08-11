# Glossário

Termos usados no material, na ordem em que costumam aparecer.

## Web e HTTP

**Cliente / Servidor** — Cliente é quem pede (navegador, app, `curl`); servidor é quem
responde. Toda a web é essa conversa.

**HTTP** — *HyperText Transfer Protocol*. Protocolo de texto, sem estado, que define o
formato da requisição e da resposta.

**HTTPS** — HTTP dentro de um túnel TLS. Garante confidencialidade e integridade em
trânsito; não garante que a aplicação seja segura.

**Requisição (request)** — Mensagem do cliente: método + caminho + cabeçalhos + corpo.

**Resposta (response)** — Mensagem do servidor: código de status + cabeçalhos + corpo.

**Método HTTP** — Verbo da requisição: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`,
`OPTIONS`.

**Idempotência** — Repetir a operação produz o mesmo estado final. `GET`, `PUT` e `DELETE`
são idempotentes; `POST` não é (daí o "não reenviar formulário" do navegador).

**Método seguro (*safe*)** — Não altera estado no servidor. `GET` e `HEAD` são seguros.

**Query string** — Parte da URL após `?`: `/busca?q=django&pagina=2`. Visível, logada,
compartilhável — nunca coloque senha ali.

**Status code** — `2xx` sucesso, `3xx` redirecionamento, `4xx` erro do cliente, `5xx` erro
do servidor.

**Cabeçalho (header)** — Metadado da mensagem: `Content-Type`, `Cookie`, `Authorization`.

**Cookie** — Par chave-valor que o servidor pede ao navegador para guardar e reenviar.

**Sessão** — Estado do usuário mantido no servidor, identificado por um cookie
(`sessionid`).

**Statelessness** — HTTP não lembra requisições anteriores; sessão e token são as formas
de simular memória.

**DNS** — Traduz nome (`exemplo.com.br`) em endereço IP.

**Porta** — Número que identifica o serviço na máquina: 80 (HTTP), 443 (HTTPS), 8000
(`runserver`), 5432 (PostgreSQL).

**Servidor de aplicação (WSGI/ASGI)** — Processo que executa o código Python e conversa
com o servidor web. Ex.: Gunicorn, Uvicorn.

**Proxy reverso** — Servidor à frente da aplicação (Nginx, load balancer da PaaS) que
termina TLS, serve estáticos e distribui carga.

## Framework e arquitetura

**Framework** — Conjunto de código que **chama o seu código** (inversão de controle),
oferecendo estrutura pronta. Diferente de biblioteca, que você chama.

**MVC** — *Model–View–Controller*.

**MTV** — *Model–Template–View*, nomenclatura do Django. O "View" do Django é o
*controller* do MVC; o "Template" do Django é a *view* do MVC.

**Projeto vs. app (Django)** — Projeto é a configuração global; app é um módulo funcional
reutilizável dentro do projeto.

**`settings.py`** — Configuração central do projeto Django.

**`manage.py`** — Utilitário de linha de comando do projeto.

**Middleware** — Camada que processa toda requisição/resposta, antes/depois da view.

## Dados e ORM

**ORM** — *Object-Relational Mapper*. Traduz classes ↔ tabelas, objetos ↔ linhas,
atributos ↔ colunas.

**Model** — Classe que descreve uma entidade e gera a tabela correspondente.

**Campo (field)** — Atributo do model que vira coluna: `CharField`, `IntegerField`,
`ForeignKey`…

**Migração (migration)** — Arquivo versionado que descreve uma mudança de esquema do
banco. É código, entra no Git e roda em ordem.

**`makemigrations`** — Compara models com as migrações existentes e **gera** o arquivo de
migração.

**`migrate`** — **Aplica** as migrações pendentes ao banco.

**Chave primária (PK)** — Identificador único da linha. O Django cria `id` automaticamente.

**Chave estrangeira (FK)** — Referência a outra tabela; no Django, `ForeignKey` (relação
1-N).

**Relação N-N** — `ManyToManyField`; o Django cria a tabela intermediária.

**Relação 1-1** — `OneToOneField`; típico para estender o usuário com um perfil.

**`related_name`** — Nome do acesso reverso: de `Emprestimo.associado` para
`associado.emprestimos`.

**QuerySet** — Objeto que representa uma consulta. É **preguiçoso** (*lazy*): só vai ao
banco quando os dados são realmente usados.

**Manager** — Interface de consulta do model, acessível por `Model.objects`.

**Lookup** — Sufixo de filtro: `__gte`, `__icontains`, `__in`, `__isnull`, `__date`.

**`select_related` / `prefetch_related`** — Otimizações que evitam o problema **N+1**
(uma consulta extra por objeto do loop).

**Agregação** — `Count`, `Sum`, `Avg`, `Max`, `Min` calculados pelo banco.

**Anotação (`annotate`)** — Adiciona um valor calculado a cada objeto do QuerySet.

**Transação** — Bloco atômico: ou tudo é gravado, ou nada. `transaction.atomic()`.

**`fixtures`** — Dados iniciais em JSON/YAML carregados com `loaddata`.

## Views, URLs e templates

**View** — Função ou classe que recebe uma `HttpRequest` e devolve uma `HttpResponse`.

**FBV / CBV** — *Function-Based View* / *Class-Based View*.

**View genérica** — CBV pronta para um caso comum: `ListView`, `DetailView`, `CreateView`,
`UpdateView`, `DeleteView`.

**URLconf** — Arquivo `urls.py` que mapeia padrões de URL para views.

**Path converter** — Tipagem no padrão da URL: `<int:pk>`, `<slug:slug>`, `<uuid:id>`.

**Namespace de URL** — Prefixo que evita colisão de nomes entre apps: `acervo:obra_detail`.

**`reverse()` / `{% url %}`** — Constroem a URL a partir do **nome** da rota. Nunca escreva
URL na mão.

**Slug** — Identificador textual amigável para URL: `guia-de-django-para-iniciantes`.

**Template** — Arquivo de texto (geralmente HTML) com marcações que o framework preenche.

**Contexto** — Dicionário de dados que a view envia ao template.

**Herança de template** — `{% extends %}` + `{% block %}`: um layout base, várias páginas.

**Filtro de template** — Transformação de valor na exibição: `{{ nome|title }}`,
`{{ data|date:"d/m/Y" }}`.

**Arquivo estático** — CSS, JS, imagens da aplicação (`STATIC_URL`).

**Arquivo de mídia** — Arquivo enviado pelo usuário (`MEDIA_URL`). Não confunda os dois.

**Padrão PRG** — *Post/Redirect/Get*: após um POST bem-sucedido, redirecione, para que o
F5 não reenvie o formulário.

## Formulários e validação

**`Form` / `ModelForm`** — Classes que declaram campos, validam entrada e renderizam HTML.
`ModelForm` deriva os campos de um model.

**`cleaned_data`** — Dados já validados e convertidos para tipos Python.

**`clean_<campo>()` / `clean()`** — Validações customizadas de um campo / entre campos.

**Framework de mensagens** — `messages.success(...)`: feedback de uma requisição para a
próxima.

## Autenticação e autorização

**Autenticação** — Quem é você. **Autorização** — o que você pode fazer.

**`AUTH_USER_MODEL`** — Configuração que aponta o model de usuário. Defina **antes** da
primeira migração.

**Permissão** — Direito granular (`acervo.add_obra`), criado automaticamente por model.

**Grupo** — Conjunto de permissões atribuível a usuários (papéis).

**`login_required` / `LoginRequiredMixin`** — Exigem usuário autenticado.

**Hash de senha** — Senha nunca é armazenada; guarda-se um hash (PBKDF2/Argon2) com *salt*.

## Segurança

**OWASP Top 10** — Lista de referência das dez classes de risco mais críticas em
aplicações web.

**Injeção de SQL** — Entrada do usuário interpretada como SQL. O ORM protege; `raw()` e
f-strings em SQL, não.

**XSS** — *Cross-Site Scripting*: script do atacante executado no navegador da vítima. O
Django escapa por padrão; `|safe` e `mark_safe` desligam a proteção.

**CSRF** — *Cross-Site Request Forgery*: site malicioso dispara ação autenticada no seu
site. Mitigado pelo token `{% csrf_token %}`.

**IDOR** — *Insecure Direct Object Reference*: acessar `/pedido/42/` de outra pessoa
trocando o número. Autorização por objeto resolve.

**Enumeração de usuários** — Mensagens que revelam se um e-mail existe.

**Rate limiting** — Limitar tentativas por IP/usuário (defesa contra força bruta).

**HSTS** — Cabeçalho que força HTTPS nas visitas seguintes.

**CSP** — *Content Security Policy*: define de onde scripts e estilos podem vir.

**LGPD** — Lei Geral de Proteção de Dados (Lei 13.709/2018): base legal, minimização,
finalidade, direitos do titular.

## Testes, deploy e operação

**Teste unitário / de integração / e2e** — Testam uma unidade isolada / a combinação de
peças / o fluxo pelo navegador.

**Fixture (pytest)** — Preparação reutilizável para testes.

**Cobertura** — Percentual de linhas executadas pelos testes. Métrica de apoio, não meta.

**CI / CD** — Integração contínua (testes automáticos a cada push) / entrega contínua
(deploy automático).

**Variável de ambiente** — Configuração vinda do sistema, fora do código.

**`DEBUG`** — Modo de desenvolvimento. `DEBUG=True` em produção expõe código, configuração
e trechos de banco. É a falha de configuração mais comum.

**`ALLOWED_HOSTS`** — Lista de domínios que a aplicação aceita servir.

**`collectstatic`** — Reúne os estáticos de todos os apps num diretório para o servidor
web.

**Gunicorn / WhiteNoise** — Servidor WSGI de produção / servidor de estáticos embutido na
aplicação.

**PaaS** — *Platform as a Service*: você entrega código, a plataforma cuida de servidor,
TLS e banco.

**Migração zero-downtime** — Estratégia de alterar o esquema sem derrubar a aplicação
(expandir → migrar dados → contrair).

**Log estruturado** — Log em formato de dados (JSON), pesquisável por campo.

**Backup / restore** — Cópia dos dados / **teste de restauração**. Backup nunca testado
não é backup.

## Projeto e extensão

**Extensão universitária** — Processo interdisciplinar que promove interação
transformadora entre instituição e sociedade; exige demanda real, dialogicidade e impacto
verificável. Não é estágio, não é visita técnica e não é palestra.

**Organização parceira** — Entidade externa (ONG, escola, associação, órgão público) que
apresenta a demanda e recebe a entrega.

**Carta de anuência** — Documento em que a organização concorda em participar.

**Relato de experiência** — Registro reflexivo da ação extensionista: contexto, ação,
resultados, aprendizados.

**MVP** — *Minimum Viable Product*: menor recorte que já resolve o problema central.

**Backlog** — Lista priorizada do que fazer, escrita em linguagem do usuário.

**História de usuário** — "Como \<papel\>, quero \<ação\> para \<benefício\>".

**Critério de aceite** — Condição objetiva que define quando a história está pronta.

**Definition of Done (DoD)** — Padrão de qualidade que toda entrega deve cumprir.
