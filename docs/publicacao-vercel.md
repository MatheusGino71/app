# Ativação do ATELIER na Vercel

A aplicação está preparada para atualizar o projeto Vercel existente `atelier-comercial`, ligado à branch `main` de `MatheusGino71/app`. O banco remoto já está conectado a Production. O acesso é exclusivo da equipe comercial, por código inicial ou convite; o envio de e-mail é opcional. As chaves nunca devem ser enviadas em conversa nem publicadas no Git.

## Serviços e variáveis

| Variável | Onde configurar | Finalidade |
| --- | --- | --- |
| TURSO_DATABASE_URL | Vercel e secrets de backup no GitHub | Banco remoto libSQL, URL libsql ou HTTPS |
| TURSO_AUTH_TOKEN | Vercel e secrets de backup no GitHub | Acesso ao banco |
| ATELIER_APP_ORIGIN | Vercel | URL HTTPS exata do projeto, sem caminho |
| ATELIER_SETUP_TOKEN | Vercel | Código aleatório para criar o primeiro administrador em /entrar ou /equipe |
| RESEND_API_KEY | Vercel | Recuperação automática opcional |
| MAIL_FROM | Vercel | Remetente verificado no Resend (opcional) |
| ATELIER_BACKUP_KEY | Secret do GitHub e máquina de restauração | Chave AES de 32 bytes em hexadecimal |

Gere cada segredo aleatório localmente, por exemplo com `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`. Guarde os valores em um gerenciador de senhas. Não reutilize a chave de backup como código administrativo.

## Conectar o banco

No projeto da Vercel, abra Storage/Marketplace e conecte um banco Turso compatível com libSQL. Confira se as variáveis disponibilizadas pela integração correspondem a `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`; se não, mapeie os nomes no painel de Environment Variables.

O adaptador usa o cliente oficial `@libsql/client/web` por HTTPS. A inicialização cria as tabelas faltantes sem apagar registros. A aplicação recusa armazenamento local quando está rodando na Vercel.

O banco `atelier-grace-pro` foi criado via integração nativa Turso Cloud, no plano Starter gratuito e região US East (Virginia), iad1. Está conectado somente ao ambiente Production de `atelier-comercial`; Preview e Development não compartilham esse banco. `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` foram adicionadas como secrets pela integração. A origem de produção e um código administrativo aleatório também foram configurados. As credenciais não foram publicadas no Git.

Referência: [Integração oficial Turso e Vercel](https://docs.turso.tech/integrations/vercel).

## E-mails opcionais

Convites, cadastro interno, login e recuperação por código administrativo funcionam sem e-mail. Se desejar recuperação automática, crie ou utilize uma conta Resend, verifique um domínio remetente e configure `RESEND_API_KEY` e `MAIL_FROM` na Vercel. A URL do aplicativo pode ser um subdomínio vercel.app; o domínio remetente de e-mail precisa ser aceito pelo provedor. Não use um endereço @vercel.app como remetente sem domínio verificado.

A aplicação usa a [API oficial de envio do Resend](https://resend.com/docs/api-reference/emails/send-email). O transporte local de arquivos serve somente ao desenvolvimento e aos testes; ele não envia mensagens e não é usado pela aplicação na Vercel.

## Publicar

1. Envie o código revisado para o repositório GitHub já vinculado ao projeto, ou importe o repositório na Vercel.
2. Selecione Next.js e uma versão de Node compatível com o requisito do package.json.
3. Configure as variáveis acima no ambiente Production. Para previews, use banco e remetente apropriados ao ambiente; não misture dados de testes com a operação real.
4. Defina `ATELIER_APP_ORIGIN` com a URL final exata.
5. Execute o deploy pelo projeto da Vercel. O arquivo vercel.json mantém instalação por npm ci e build por npm run build.
6. Verifique `/api/health`, que deve responder HTTP 200 com status ready e database remote. O campo mail pode indicar unconfigured: isso não bloqueia o acesso interno.
7. Acesse `/entrar` ou `/equipe`, selecione criar conta e use o código configurado para o primeiro administrador. Depois gere convites vinculados ao e-mail no workspace. Cadastro público de clientes está bloqueado no servidor.
8. Execute o piloto interno: administrador, convite de comercial, login, cadastro de salão, diagnóstico, classificação, comparação de níveis e recuperação por código administrativo.

O domínio existente é `https://atelier-comercial.vercel.app`. Atualizações enviadas à `main` seguem a integração Git já configurada no projeto. Acompanhe o status na aba Deployments; um push confirmado no GitHub não comprova, sozinho, que o build remoto e os serviços de produção foram ativados.

## Ativar backups

Configure no GitHub os três secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `ATELIER_BACKUP_KEY` e a variável de repositório `ATELIER_BACKUP_ENABLED=true`. Envie o workflow ao repositório e execute primeiro por workflow_dispatch. Verifique o artefato criptografado e faça uma restauração de teste em banco separado e vazio antes de depender do agendamento diário. Sem a variável de ativação, o job é ignorado.

O job não usa banco local como fallback no CI e não imprime chaves. Artefatos ficam retidos por 14 dias. Para retenção maior, preserve as cópias criptografadas em outro armazenamento controlado pelo proprietário.

## Resultado verificado e limites

A rotina de testes confirma localmente isolamento de contas, tokens, classificação, conferência de compras, evidências privadas, backup e restauração. A conexão real com o banco remoto foi validada após o redeploy: `/api/health` informou database remote e `/api/auth` respondeu HTTP 200, sem conta autenticada e com needsSetup true. Ainda é necessário criar o primeiro administrador; nenhum usuário de teste foi inserido no banco de produção.

A interface foi verificada no navegador em desktop e celular: seleção de idioma com busca e bandeiras, inglês como padrão, persistência da escolha explícita, leitura RTL, preservação dos campos, diagnóstico em sete etapas, classificação e comparação de níveis. Os testes HTTP verificam separadamente contas, permissões e persistência.
