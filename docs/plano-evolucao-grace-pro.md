# Entrega do ATELIER para a operação Grace Pro

Atualizado em 15 de novembro de 2026.

ATELIER é o sistema; Grace Pro é a operação atendida. Frontend e backend permanecem no Next.js. O fluxo principal é cadastro público → formulário Deep Test → nível estimado → conferência da equipe → nível confirmado, com comparação dos três níveis em qualquer momento.

## Regras de negócio

ORIGIN começa em €400 de compra líquida nos últimos 12 meses; SIGNATURE em €4.000; ICON em €9.000. Os limites inferiores são inclusivos. Abaixo de €400, o salão está em desenvolvimento. Compra e referências utilizam data de corte comum. As seis dimensões são independentes, sem soma ou nota global.

Capacidade usa o menor valor entre profissionais ativos e postos utilizáveis. Essa fórmula foi adotada para resolver o N não definido nas referências. As demais notas dependem de evidências e análise comercial; o cliente não escolhe estrelas qualitativas para se classificar.

Valores autodeclarados são identificados como estimativa. A equipe confere fonte e valor, podendo confirmar, corrigir ou pedir ajuste. Novo diagnóstico não substitui o nível previamente confirmado até a nova conferência. A aprovação exige confirmação do e-mail do cliente.

## Entregas implementadas

| Área | Entrega |
| --- | --- |
| Clientes | Cadastro público sem convite; perfil cliente sem acesso ao painel interno |
| Equipe | Acesso separado em /equipe; primeiro administrador por segredo do servidor; demais por convite |
| Diagnóstico | Ficha em sete etapas, rascunho privado, histórico e transição após cadastro |
| Resultado | Nível calculado no servidor, comparação, próximo marco e identificação de confirmação |
| Conferência | Fila interna com valor conferido, fonte, justificativa, aprovação e recusa |
| E-mails | Confirmação e recuperação por links únicos, expiração e revogação de sessões |
| Evidências | Upload privado de PDF e imagens, validação de formato, limites e autorização de download |
| Gestão | Carteiras, papéis, filtros, ações, importação e exportação CSV |
| Banco | Adaptador assíncrono SQLite local e Turso/libSQL remoto por HTTPS, com transações |
| Vercel | Configuração de build, preflight e bloqueio de fallback para arquivo efêmero |
| Backup | Cópia criptografada consistente, restauração em banco vazio e workflow diário preparado |
| Verificação | Testes de domínio, banco, e-mail local, backup e fluxo HTTP isolado |

O Next.js foi atualizado para uma versão corrigida após a auditoria de dependências. Os segredos de desenvolvimento foram gerados em .env.local, sem exibir valores e sem inclusão no Git. Um backup local criptografado foi criado.

## O que depende de ativação externa

O usuário confirmou que o projeto `atelier-comercial` já existe na Vercel, com o domínio `atelier-comercial.vercel.app` e integração à branch `main` do repositório. As atualizações seguem por esse vínculo. A configuração do banco remoto com URL/token e do provedor de e-mail com remetente verificado precisa ser conferida no ambiente de produção. Não foram contratados serviços ou aceitos termos de provedores em nome do usuário.

O envio externo de mensagens, a validação de uma conexão remota real, a publicação e o backup agendado só podem ser confirmados depois de configurar esses acessos. O código está pronto para receber as variáveis; o guia está em [publicacao-vercel.md](publicacao-vercel.md).

A tentativa de validação visual encontrou o Edge, mas foi interrompida pela ferramenta ao tentar abrir uma aba de teste por não conseguir confirmar a URL com segurança. A inspeção completa de desktop e celular permanece pendente. Os testes HTTP verificam o comportamento do servidor e não comprovam o layout ou as animações.

## Escopo futuro dependente de requisitos

A conferência manual e o CSV estão implementados. Uma conexão direta com ERP exige identificar qual sistema fornece as compras e obter uma API ou exportação autorizada. A interface segue em português; localização completa para outros idiomas exige definir os idiomas de operação e revisar as traduções comerciais. Esses itens não foram apresentados como integrações ou traduções já concluídas.

## Referências

- [Apresentação Grace Pro](../referencias/Grace%20pro%20clasificacion%20clientes%20presentacion.pdf)
- [Ficha Deep Test](../referencias/grece%20pro%20clasificacion%20clientes%20deep%20test.docx)
- [Exemplo visual](../referencias/WhatsApp%20Image%202026-11-15%20at%2013.38.18.jpeg)
- Orientações do usuário sobre níveis por gasto, portal após cadastro e preferência por Next.js e Vercel.
