# ATELIER — Operação Grace Pro

Aplicação Next.js com portal de clientes, painel interno, diagnóstico Deep Test e classificação comercial. Cliente e equipe têm cadastros e permissões separados.

## Desenvolvimento local

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A entrada animada ATELIER foi preservada.

- `/entrar`: cadastro público e acesso dos clientes.
- `/diagnostico`: ficha Deep Test do próprio salão.
- `/meu-nivel`: resultado, comparação de níveis, confirmação de e-mail e evidências.
- `/equipe`: acesso interno por convite ou código de configuração inicial.
- `/workspace`: painel exclusivo da equipe Grace Pro.
- `/diagnostico?demo=1`: experiência fictícia sem criação de conta.
- `/workspace?demo=1`: painel fictício independente.

Uma configuração de desenvolvimento foi criada em `.env.local`, com código administrativo e chave de backup aleatórios. O arquivo é ignorado pelo Git. Se ele não existir em outra máquina, copie `.env.example` e preencha a configuração necessária.

## Cadastro e permissões

O cadastro público cria sempre um **cliente**, inclusive se for a primeira conta. Informar um papel administrativo no pedido não concede acesso interno. Depois do cadastro, a transição abre a ficha do salão; o envio leva automaticamente ao nível estimado.

A equipe entra por `/equipe`. Para criar o primeiro administrador, use o valor de `ATELIER_SETUP_TOKEN` configurado no servidor. As próximas contas internas exigem convite associado ao e-mail. Os papéis internos são comercial, gestor e administrador.

Clientes acessam somente o próprio salão, rascunho, resultado e anexos. Não consultam o painel, carteiras, equipe, convites, conferências ou ações internas. Comerciais acessam a própria carteira. Gestores e administradores acompanham a operação e podem transferir carteiras. Apenas administradores geram convites e códigos administrativos de recuperação.

As senhas usam scrypt com salt aleatório. Sessões e códigos são armazenados como hash. Cookies são HttpOnly, SameSite e Secure em produção. Mutações exigem mesma origem e autorização no servidor; há limite de tentativas. Trocas de senha revogam as sessões anteriores.

## Níveis e conferência de compras

| Compra líquida nos últimos 12 meses | Categoria |
| --- | --- |
| Desconhecida | Sem dados |
| €0 a menos de €400 | Em desenvolvimento |
| €400 a menos de €4.000 | ORIGIN |
| €4.000 a menos de €9.000 | SIGNATURE |
| €9.000 ou mais | ICON |

Os limites inferiores são inclusivos. O cálculo é feito pelo servidor.

O valor informado pelo cliente gera uma **estimativa pendente de conferência**. O painel interno mostra a fila em **Gestão da operação**. A equipe registra o valor conferido, fonte, justificativa e decisão. O endereço de e-mail do cliente deve estar confirmado antes da aprovação.

Uma conferência pode corrigir o valor e, assim, o nível. A recusa pede correção ao cliente. Um novo diagnóstico mantém o nível anteriormente confirmado até ser conferido. Importações oficiais de compras feitas pela gestão registram confirmação com a fonte indicada. Os diagnósticos anteriores não são apagados.

Na comparação, selecionar ORIGIN, SIGNATURE ou ICON muda somente as informações exibidas. Nunca altera o enquadramento da conta.

## Ficha e seis dimensões

A ficha Deep Test tem sete etapas, cobrindo identificação, compra e marcas, fornecedores, serviços, influência, formação, protocolos, revenda, capacidade, acordos e revisão. O cliente não escolhe estrelas qualitativas para classificar a si mesmo.

Sortimento, influência, técnica, revenda, capacidade e compromisso são independentes, sem soma ou nota global. Estrelas não mudam a categoria de compra. Notas qualitativas exigem evidência ou justificativa da equipe.

Capacidade usa `N = mínimo(profissionais ativos, postos utilizáveis)`: N 0–1 = 1 estrela; 2 = 2; 3–4 = 3; 5–7 = 4; 8 ou mais = 5. Dados ausentes permanecem não avaliados. O servidor recalcula essa dimensão.

Cada visita é um diagnóstico preservado, com autor, data e versão dos critérios. Edições concorrentes são recusadas. Rascunhos são privados por usuário. Não há sincronização offline.

## E-mails

Confirmação de endereço e recuperação automática estão implementadas pela API do Resend. Configure `RESEND_API_KEY`, `MAIL_FROM` e `ATELIER_APP_ORIGIN`. O remetente deve estar verificado no provedor. A confirmação expira em 24 horas; recuperação em uma hora. Links são de uso único. A recuperação não revela se um endereço está cadastrado.

Em desenvolvimento, `MAIL_TRANSPORT=file` grava as mensagens em `.data/mail/`, sem enviar e-mails reais. Os links ficam no campo `text` dos arquivos privados. Esse transporte não é usado na Vercel. Sem provedor configurado em produção, o cadastro público informa indisponibilidade; não simula envio.

## Anexos privados

Clientes e equipe podem anexar evidências depois do cadastro do salão. São aceitos PDF, PNG, JPEG e WebP, até 1 MB por arquivo, com validação do formato real. Há limite por salão de 30 arquivos e aproximadamente 10 MB.

Os arquivos são guardados no banco e acessados por endpoints autenticados. Downloads não são públicos, respeitam a mesma autorização do salão e são entregues como anexos. O backup inclui essas evidências.

## Importação e exportação

A gestão pode importar CSV UTF-8 com as colunas nesta ordem:

```csv
salao_id;compra_eur;pedidos;data_corte;fonte
id-do-salao;4000,25;12;2026-11-15;Relatorio Grace Pro
```

A importação aceita até 500 linhas, oferece prévia e é atômica. IDs estão na ficha completa e na exportação. Datas anteriores ao último diagnóstico são recusadas. O novo registro confirma as compras pela fonte da gestão; notas e referências por marca exigem reavaliação no novo período.

A exportação respeita os filtros de salões e neutraliza fórmulas de planilhas. A conferência manual e o CSV atendem à entrada de dados comerciais sem depender de um ERP específico.

## Vercel e banco externo

A aplicação está preparada para Vercel com banco remoto Turso/libSQL. Configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. O cliente oficial usa HTTPS e transações remotas. Sem URL remota, apenas o desenvolvimento usa `.data/atelier.sqlite`.

**Na Vercel, o fallback local é recusado**, evitando perda de dados em filesystem efêmero. O código adapta as operações ao banco remoto; a conexão real não foi testada por falta de URL e token. As migrações são aditivas e preservam registros existentes.

O guia com as variáveis e passos de ativação está em [docs/publicacao-vercel.md](docs/publicacao-vercel.md).

```bash
npm run preflight
```

O comando verifica nomes e formatos básicos sem imprimir segredos. O endpoint `/api/health` verifica a conexão e a configuração de envio.

## Backup e restauração

```bash
npm run backup
npm run restore -- caminho/backup.enc
```

Os backups usam AES-256-GCM, com a chave `ATELIER_BACKUP_KEY` (32 bytes em hexadecimal). A chave deve ficar fora do Git e também ser guardada em local seguro separado do backup. Perder essa chave impede a restauração.

A captura usa uma transação consistente. São preservados usuários, salões, diagnósticos, rascunhos, acordos, evidências e auditoria. Sessões e códigos temporários não são restaurados. A restauração funciona somente em **banco vazio** e recusa sobrescrever uma operação existente.

O workflow `.github/workflows/backup.yml` está preparado para um backup diário às 06:00 UTC (03:00 em São Paulo), com artefatos criptografados retidos por 14 dias. Ele precisa de `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `ATELIER_BACKUP_KEY` nos secrets do repositório, da variável de repositório `ATELIER_BACKUP_ENABLED=true` e do código enviado ao GitHub para ser ativado. Até essa configuração, o job é ignorado.

## Verificação

```bash
npm run typecheck
npm test
npm run build
npm run test:http
```

Os testes cobrem cadastro público e interno, isolamento de clientes, histórico, concorrência, revisão de compras, confirmação de e-mail, recuperação, anexos, importação, backup e restauração. O teste HTTP usa servidor de produção isolado na porta 3117, banco temporário e caixa de saída local; não cadastra usuários na operação real.

O workflow `.github/workflows/verify.yml` executa os testes e o build no GitHub após envio do código.

## Estado de ativação

As funcionalidades estão implementadas e testadas localmente. A publicação real, o envio externo de mensagens e os backups agendados exigem conectar a Vercel e configurar o banco e o provedor de e-mail. Nenhum serviço pago foi contratado e nenhuma publicação foi anunciada como concluída.

A tentativa de inspeção visual pelo navegador foi interrompida pela ferramenta por não conseguir confirmar a URL com segurança. A conferência de layout e interações em desktop e celular ainda precisa ser concluída. Os testes HTTP não substituem essa validação.
