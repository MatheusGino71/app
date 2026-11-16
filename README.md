# GRACE PRO — Inteligência Comercial

Consulte [identidade visual, domínio e proteção de dados](docs/identidade-e-protecao-dados.md) para a paleta baseada na referência corporativa, a nova redação dos prêmios e as configurações pendentes para a operação europeia.

A [central de privacidade e segurança](docs/operacao-privacidade.md) está em `/conta`, com MFA, códigos de recuperação, encerramento de sessões, solicitações de titulares, exportação, correção, restrição e exclusão verificada de salões. O aviso `/privacidade` depende dos dados legais aprovados da empresa. Use `npm run preflight:production` para conferir as configurações antes da operação real.

Aplicação Next.js para o time comercial interno da Grace Pro, com painel de carteiras, diagnóstico Deep Test, painel de campanhas e eventos, e classificação comercial dos salões. O acesso exige conta da equipe; o cadastro público de clientes está desativado.

O idioma padrão da interface é inglês. O acesso e o cadastro incluem seleção de idioma com busca e bandeiras; a troca é feita somente pelo seletor e fica salva para acompanhar o diagnóstico e os níveis. Consulte [idiomas da interface](docs/idiomas.md) para os catálogos locais, ajustes de tradução e manutenção.

## Desenvolvimento local

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A entrada animada ATELIER foi preservada.

- `/entrar`: acesso interno e criação de conta da equipe por convite.
- `/diagnostico`: ficha Deep Test autenticada.
- `/meu-nivel`: resultado do diagnóstico, comparação de níveis e evidências.
- `/equipe`: acesso interno por convite ou código de configuração inicial.
- `/workspace`: painel exclusivo da equipe Grace Pro.
- `/diagnostico?demo=1`: experiência fictícia sem criação de conta.
- `/workspace?demo=1`: painel fictício independente.

Uma configuração de desenvolvimento foi criada em `.env.local`, com código administrativo e chave de backup aleatórios. O arquivo é ignorado pelo Git. Se ele não existir em outra máquina, copie `.env.example` e preencha a configuração necessária.

## Cadastro e permissões

A entrada animada, `/entrar` e `/equipe` usam o mesmo acesso interno. Cadastro e login levam ao workspace. O servidor recusa cadastros sem `kind: staff` e logins de clientes; informar um papel administrativo no pedido não concede permissões. O cadastro da equipe funciona sem provedor de e-mail.

A equipe entra por `/equipe`. Para criar o primeiro administrador, use o valor de `ATELIER_SETUP_TOKEN` configurado no servidor. As próximas contas internas exigem convite associado ao e-mail. Os papéis internos são comercial, gestor e administrador.

A compatibilidade com dados antigos de clientes preserva o isolamento desses registros, mas não oferece cadastro público nem entrada no workspace. Comerciais acessam a própria carteira. Gestores e administradores acompanham a operação e podem transferir carteiras. Apenas administradores geram convites e códigos administrativos de recuperação.

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

O diagnóstico simplificado gera uma **estimativa pendente de conferência**. O painel interno mostra a fila em **Gestão da operação**. A equipe registra o valor conferido, fonte, justificativa e decisão. Contas internas não precisam confirmar e-mail para essa operação. A verificação de endereço continua aplicada apenas a registros antigos de clientes.

Uma conferência pode corrigir o valor e, assim, o nível. A recusa pede correção ao cliente. Um novo diagnóstico mantém o nível anteriormente confirmado até ser conferido. Importações oficiais de compras feitas pela gestão registram confirmação com a fonte indicada. Os diagnósticos anteriores não são apagados.

Na comparação, selecionar ORIGIN, SIGNATURE ou ICON muda somente as informações exibidas. Nunca altera o enquadramento da conta.

## Ficha e seis dimensões

A ficha Deep Test tem sete etapas, cobrindo identificação, compra e marcas, fornecedores, serviços, influência, formação, protocolos, revenda, capacidade, acordos e revisão. O formulário simplificado não permite atribuir estrelas qualitativas; essas avaliações pertencem à equipe no workspace.

Sortimento, influência, técnica, revenda, capacidade e compromisso são independentes, sem soma ou nota global. Estrelas não mudam a categoria de compra. Notas qualitativas exigem evidência ou justificativa da equipe.

Capacidade usa `N = mínimo(profissionais ativos, postos utilizáveis)`: N 0–1 = 1 estrela; 2 = 2; 3–4 = 3; 5–7 = 4; 8 ou mais = 5. Dados ausentes permanecem não avaliados. O servidor recalcula essa dimensão.

Cada visita é um diagnóstico preservado, com autor, data e versão dos critérios. Edições concorrentes são recusadas. Rascunhos são privados por usuário. Não há sincronização offline.

## E-mails

O acesso interno usa convites e códigos de recuperação emitidos pelo administrador, sem depender de e-mail. Recuperação automática opcional está implementada pela API do Resend. Configure `RESEND_API_KEY`, `MAIL_FROM` e `ATELIER_APP_ORIGIN`. O remetente deve estar verificado no provedor. A confirmação expira em 24 horas; recuperação em uma hora. Links são de uso único. A recuperação não revela se um endereço está cadastrado.

Em desenvolvimento, `MAIL_TRANSPORT=file` grava as mensagens em `.data/mail/`, sem enviar e-mails reais. Os links ficam no campo `text` dos arquivos privados. Esse transporte não é usado na Vercel. Sem provedor configurado, “Esqueceu a senha?” abre a recuperação por código administrativo. O sistema não simula envio de e-mail.

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

**Na Vercel, o fallback local é recusado**, evitando perda de dados em filesystem efêmero. O banco remoto `atelier-grace-pro` está conectado ao ambiente Production pela integração Turso Cloud da Vercel. A conexão real e o serviço de contas foram verificados após o redeploy. As migrações são aditivas e preservam registros existentes.

O guia com as variáveis e passos de ativação está em [docs/publicacao-vercel.md](docs/publicacao-vercel.md).

```bash
npm run preflight
```

O comando verifica nomes e formatos básicos sem imprimir segredos. O endpoint `/api/health` verifica a conexão e a configuração de envio.

## Backup e restauração

```bash
npm run backup
npm run restore -- caminho/backup.enc caminho/erasure-ledger.enc
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

Os testes cobrem permissões, isolamento de registros, histórico, concorrência, revisão de compras, recuperação, anexos, importação, backup e restauração. O teste HTTP confirma cadastro público bloqueado, convites internos, acesso sem provedor de e-mail, recuperação administrativa e isolamento entre carteiras. O teste HTTP usa servidor de produção isolado na porta 3117, banco temporário e envio de e-mail desativado; não cadastra usuários na operação real.

O workflow `.github/workflows/verify.yml` executa os testes e o build no GitHub após envio do código.

## Estado de ativação

O projeto já está publicado na Vercel por integração com a branch `main`. O banco remoto Turso Cloud `atelier-grace-pro` foi criado no plano Starter gratuito, região iad1, e conectado somente a Production. As variáveis de banco, origem e configuração administrativa estão salvas na Vercel. A leitura do banco e o serviço de contas responderam após o redeploy. O primeiro administrador ainda precisa ser cadastrado com o código de configuração. E-mails automáticos são opcionais e não estão configurados; backups agendados ainda dependem dos secrets e da ativação do workflow. Nenhum plano pago foi selecionado.

A interface foi verificada no navegador em desktop e celular, incluindo inglês como padrão, seleção manual de idioma, busca, bandeiras, persistência, RTL, animação de entrada, preenchimento do diagnóstico e comparação de níveis.
