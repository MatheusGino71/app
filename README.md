# ATELIER. — Inteligência Comercial

Protótipo responsivo de uma plataforma de inteligência comercial para equipes que visitam salões, registram informações e recebem classificações e recomendações de ações.

## Executar localmente

Requer Node.js 22 ou mais recente.

~~~bash
npm install
npm run dev
~~~

Abra http://localhost:3000.

A home em `/` contém apenas a cena tipográfica ATELIER. A rolagem, inclusive ao arrastar a barra ou deslizar no celular, controla a câmera até preencher a tela e revelar o formulário na mesma cena. O clique na palavra reproduz essa mesma sequência em 2,2 segundos. Não há redirecionamento nem montagem de outra página durante a transição; “Voltar” inverte a animação. A preferência de movimento reduzido é respeitada.

O formulário também pode ser aberto diretamente em `/entrar`. Ele reúne login, cadastro e recuperação de senha, com validação de campos e alternância de visibilidade da senha. O serviço de autenticação, o login com Google e o envio de e-mails ainda não estão conectados: os formulários informam essa condição, não criam contas e não enviam nem persistem senhas. O link “Explorar demonstração” abre o painel existente em `/workspace`.

## Publicar na Vercel

1. Importe este repositório na Vercel.
2. Selecione **Next.js** como framework (a detecção automática normalmente identifica o projeto).
3. Mantenha o comando de build como **npm run build**.
4. Publique sem variáveis de ambiente para esta versão demonstrativa.

## O que funciona

- Dashboard com indicadores, segmentos e recomendações.
- Cadastro de visitas com formulário em três etapas e rascunho local.
- Clientes com busca, filtros e perfil comercial.
- Classificação de um mesmo cliente em várias categorias.
- Ações comerciais que podem ser marcadas como concluídas.
- Layout responsivo para celular e desktop.

## Limitações importantes

**Esta é uma demonstração, não um CRM em produção.** Todos os salões iniciais são fictícios. Novos cadastros, rascunhos e ações ficam salvos apenas no armazenamento local do navegador, sem sincronização entre dispositivos. Não utilize dados reais ou sensíveis de clientes.

As regras de classificação são ilustrativas e deverão ser substituídas após recebermos a ficha e os critérios oficiais. A autenticação do produto, a API .NET e o SQL Server ainda serão implementados.

O nome e a identidade visual ATELIER. também são provisórios.

## Próxima evolução

Implementar o backend em ASP.NET Core com SQL Server, autenticação e papéis, persistência real, regras de classificação versionadas e dashboard administrativo. Se necessário, o frontend poderá ser migrado para Angular.
