# Ativação do ATELIER na Vercel

A aplicação está preparada para atualizar o projeto Vercel existente `atelier-comercial`, ligado à branch `main` de `MatheusGino71/app`. A ativação do banco remoto e do envio de e-mail depende da configuração na conta do proprietário. As chaves nunca devem ser enviadas em conversa nem publicadas no Git.

## Serviços e variáveis

| Variável | Onde configurar | Finalidade |
| --- | --- | --- |
| TURSO_DATABASE_URL | Vercel e secrets de backup no GitHub | Banco remoto libSQL, URL libsql ou HTTPS |
| TURSO_AUTH_TOKEN | Vercel e secrets de backup no GitHub | Acesso ao banco |
| ATELIER_APP_ORIGIN | Vercel | URL HTTPS exata do projeto, sem caminho |
| ATELIER_SETUP_TOKEN | Vercel | Código aleatório para criar o primeiro administrador em /equipe |
| RESEND_API_KEY | Vercel | Envio de confirmação e recuperação |
| MAIL_FROM | Vercel | Endereço do remetente verificado no Resend |
| ATELIER_BACKUP_KEY | Secret do GitHub e máquina de restauração | Chave AES de 32 bytes em hexadecimal |

Gere cada segredo aleatório localmente, por exemplo com `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`. Guarde os valores em um gerenciador de senhas. Não reutilize a chave de backup como código administrativo.

## Conectar o banco

No projeto da Vercel, abra Storage/Marketplace e conecte um banco Turso compatível com libSQL. Confira se as variáveis disponibilizadas pela integração correspondem a `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`; se não, mapeie os nomes no painel de Environment Variables.

O adaptador usa o cliente oficial `@libsql/client/web` por HTTPS. A inicialização cria as tabelas faltantes sem apagar registros. A aplicação recusa armazenamento local quando está rodando na Vercel.

O serviço Turso e seu plano ainda não foram contratados ou configurados nesta sessão. A configuração e a aceitação das condições do provedor pertencem ao proprietário da conta.

Referência: [Integração oficial Turso e Vercel](https://docs.turso.tech/integrations/vercel).

## Configurar os e-mails

Crie ou utilize uma conta Resend, verifique um domínio remetente e configure `RESEND_API_KEY` e `MAIL_FROM` na Vercel. A URL do aplicativo pode ser um subdomínio vercel.app; o domínio remetente de e-mail precisa ser aceito pelo provedor. Não use um endereço @vercel.app como remetente sem domínio verificado.

A aplicação usa a [API oficial de envio do Resend](https://resend.com/docs/api-reference/emails/send-email). O transporte local de arquivos serve somente ao desenvolvimento e aos testes; ele não envia mensagens e não é usado pela aplicação na Vercel.

## Publicar

1. Envie o código revisado para o repositório GitHub já vinculado ao projeto, ou importe o repositório na Vercel.
2. Selecione Next.js e uma versão de Node compatível com o requisito do package.json.
3. Configure as variáveis acima no ambiente Production. Para previews, use banco e remetente apropriados ao ambiente; não misture dados de testes com a operação real.
4. Defina `ATELIER_APP_ORIGIN` com a URL final exata.
5. Execute o deploy pelo projeto da Vercel. O arquivo vercel.json mantém instalação por npm ci e build por npm run build.
6. Verifique `/api/health`, que deve responder com status ready.
7. Acesse `/equipe`, crie o primeiro administrador com o código configurado e gere convites internos. O cadastro público em `/entrar` sempre cria clientes.
8. Execute o piloto: cadastro de cliente, confirmação de e-mail, diagnóstico, estimativa, conferência pela equipe e comparação do nível confirmado.

O domínio existente é `https://atelier-comercial.vercel.app`. Atualizações enviadas à `main` seguem a integração Git já configurada no projeto. Acompanhe o status na aba Deployments; um push confirmado no GitHub não comprova, sozinho, que o build remoto e os serviços de produção foram ativados.

## Ativar backups

Configure no GitHub os três secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `ATELIER_BACKUP_KEY` e a variável de repositório `ATELIER_BACKUP_ENABLED=true`. Envie o workflow ao repositório e execute primeiro por workflow_dispatch. Verifique o artefato criptografado e faça uma restauração de teste em banco separado e vazio antes de depender do agendamento diário. Sem a variável de ativação, o job é ignorado.

O job não usa banco local como fallback no CI e não imprime chaves. Artefatos ficam retidos por 14 dias. Para retenção maior, preserve as cópias criptografadas em outro armazenamento controlado pelo proprietário.

## Resultado verificado e limites

A rotina de testes confirma localmente isolamento de contas, tokens, classificação, conferência de compras, evidências privadas, backup e restauração. O adaptador remoto foi implementado pela interface oficial, mas falta validar uma conexão real com credenciais do serviço.

A validação visual no navegador permanece pendente porque o controle do navegador foi interrompido pela ferramenta ao não conseguir confirmar a URL. Não se deve considerar os testes HTTP como uma inspeção de responsividade ou de animações.
