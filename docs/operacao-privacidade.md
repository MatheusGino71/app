# Operação de privacidade e segurança

## Recursos implementados

- `/conta`: autenticação TOTP por aplicativo, dez códigos de recuperação de uso único, encerramento de sessões e solicitações sobre dados pessoais.
- `/privacidade`: aviso público com dados aprovados da organização. Sem identificação, contato, base legal, retenção, locais, transferências, autoridade e aprovação, a página informa que o aviso está em preparação; não publica dados fictícios como política definitiva.
- Solicitações: acesso, correção, exclusão, restrição e oposição; prazo inicial de um mês civil, com ajuste para o último dia do mês. A administração registra verificação da identidade, representação e resposta. O aplicativo não envia automaticamente a resposta ao titular.
- Exportação administrativa de salão: JSON com cadastro, diagnósticos, acordos, conferências, campanhas e manifesto de anexos. Cada arquivo é baixado separadamente pelos links autenticados exibidos após a exportação, evitando uma resposta excessiva na hospedagem. Esses links exigem a sessão interna e não são links públicos para o titular. Exige identidade verificada, senha e o segundo fator quando ativo. A administração deve revisar dados de terceiros e entregar o JSON e os arquivos necessários por um canal seguro.
- Correção: atualiza o cadastro com controle de versão; preserva o histórico dos diagnósticos. Textos históricos que também precisem de correção exigem revisão específica da administração.
- Exclusão de salão: exige solicitação verificada, revisão das obrigações de retenção, senha, MFA quando ativo e frase de confirmação com o nome exato. Remove os registros vinculados, anexos e rascunhos; anonimiza o acesso legado de cliente vinculado. O protocolo mantém apenas a evidência processual. Não há exclusão em massa nem exclusão comercial automática.
- Restrição/oposição: suspende alterações e acesso operacional do cadastro e o retira das carteiras não administrativas. A administração pode tratar a solicitação e retirar a restrição mediante nova autenticação e justificativa.
- Solicitações relativas à conta da equipe: permitem exportação dos dados da própria conta e registro para tratamento pela administração. Desligamento/anonimização de pessoal e eventuais obrigações trabalhistas exigem análise e procedimento específico; a exclusão de um salão não apaga contas de funcionários.
- MFA: chaves protegidas com AES-256-GCM e chave separada de backup; TOTP de seis dígitos e 30 segundos, com janela adjacente e bloqueio de repetição. Recuperação usa hashes de códigos aleatórios. A ativação revoga sessões anteriores. Recuperar a senha não remove o segundo fator.
- Respostas HTTP incluem proteção contra enquadramento, detecção incorreta de conteúdo, uso de câmera/microfone/localização e política de conteúdo. A política permite scripts e estilos inline exigidos pelo desenho atual do Next.js; uma política baseada em nonces pode ser uma melhoria futura. Nenhuma auditoria de invasão é presumida.

## Configuração antes da operação real

As variáveis estão em `.env.example`. Os segredos locais de MFA e manutenção foram gerados sem exibição; os provedores de produção ainda precisam receber segredos próprios. Não copie dados pessoais nem segredos para o Git.

1. Definir os dados públicos do controlador e a política com o responsável da empresa: todas as variáveis `ATELIER_PRIVACY_*`. Só marcar `ATELIER_PRIVACY_APPROVED=true` depois da aprovação da versão publicada.
2. Definir `ATELIER_RECORD_RETENTION_DAYS` de acordo com a política aprovada. O valor ativa uma fila de revisão de cadastros inativos; não apaga cadastros.
3. Configurar `ATELIER_MFA_KEY` com 32 bytes aleatórios em hexadecimal. Cada administrador deve acessar `/conta`, cadastrar a chave no autenticador, confirmar o código e guardar os códigos de recuperação. Não é possível concluir esse pareamento sem o dispositivo do usuário. Não alterar a chave de criptografia com MFA ativo; a recuperação do banco exige preservar essa mesma chave.
4. Configurar `CRON_SECRET` com pelo menos 32 caracteres. O cron Vercel chama `/api/maintenance` às 05:15 UTC. A rota aceita apenas o segredo em `Authorization: Bearer …` e remove somente sessões, códigos, convites, tentativas e configurações MFA temporárias expiradas. Conferir execução nos logs de produção.
5. Executar `npm run preflight:production`. O comando não imprime valores de segredos e retorna falha enquanto houver configuração essencial pendente. A consulta ao banco remoto ocorre somente quando suas credenciais estão disponíveis. O comando não certifica conformidade legal nem substitui a verificação dos provedores.

## Backups e recuperação

`npm run backup` cria um backup AES-256-GCM, restaura-o em banco temporário isolado e confere as contagens das tabelas antes de publicar o artefato. Sessões e configurações MFA ainda não confirmadas ficam fora do backup; MFA já ativo e solicitações de privacidade são preservados. Backups antigos v1 continuam legíveis.

O workflow GitHub exige os secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `ATELIER_BACKUP_KEY`, e a variável `ATELIER_BACKUP_ENABLED=true`. A rotina diária é às 06:00 UTC, com retenção de artefatos de 14 dias. Confirmar a necessidade desses 14 dias na política e testar uma execução real após ativar os secrets. A chave de backup deve ter cópia segura separada dos artefatos. A chave MFA também deve ser preservada separadamente.

Para restaurar:

```text
npm run restore -- backup.enc erasure-ledger.enc
```

Use um banco vazio e o registro de exclusões mais recente. A restauração reaplica esse registro sobre o backup para retirar salões excluídos após a captura. Um registro anterior ao backup é recusado. A ferramenta não consegue provar que o operador forneceu o registro mais recente: preserve o registro após exclusões e antes de qualquer recuperação. Sua cópia externa e atualização após cada exclusão precisam fazer parte da operação do provedor. Um desastre entre uma exclusão e a próxima captura pode exigir reconstituir protocolos e excluir novamente antes da reabertura do serviço. Não reabra o sistema com um registro desatualizado.

Backups antigos, mensagens de e-mail e logs de provedores seguem suas próprias políticas de retenção. Devem ser incluídos na resposta ao titular e na avaliação de descarte; excluir do banco operacional não os remove automaticamente.

## Infraestrutura e contratos

A documentação anterior registra Vercel e Turso, com banco em `iad1` (EUA). Nesta implementação não houve comprovação atual por acesso ao painel, alteração de região ou assinatura de contratos. Antes do uso europeu, verificar região primária e réplicas, logs, backups, suporte, subprocessadores, criptografia em repouso, perfis de acesso e contratos de tratamento. Avaliar o mecanismo de transferência aplicável; escolher uma região europeia não resolve por si só os acessos internacionais dos prestadores. A migração requer origem e destino verificados, backup restaurável, janela de corte e teste antes de trocar as credenciais de produção.

O domínio ficou para a última etapa, por orientação do usuário.

## Resposta a incidentes

1. Registrar quando a organização tomou conhecimento, os sistemas afetados e os responsáveis pela resposta. Preservar evidências com acesso restrito, sem copiar indiscriminadamente dados de titulares.
2. Conter o incidente: revogar sessões/credenciais comprometidas, suspender integrações afetadas e solicitar suporte aos provedores. Não apagar evidências necessárias à investigação.
3. Avaliar confidencialidade, integridade, disponibilidade, categorias de dados, pessoas afetadas, consequências e medidas de mitigação.
4. O controlador decide e registra a necessidade de comunicar a autoridade em até 72 horas após tomar conhecimento, salvo quando o incidente for improvável de resultar em risco. Em caso de alto risco, avaliar comunicação aos titulares sem demora injustificada. Se atuar como operador, informar o controlador sem demora injustificada. O aplicativo não faz essas comunicações em nome da organização.
5. Registrar a decisão inclusive quando não houver notificação, as medidas corretivas, a restauração verificada e a revisão dos acessos.

Designar pela empresa: coordenador do incidente, suplente, contato de privacidade, assessoria jurídica e autoridade competente. Esses nomes e contatos não foram inventados pelo aplicativo.

## Referências oficiais

- [EDPB: direitos dos titulares e prazos](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).
- [EDPB: medidas de segurança](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en).
- [EDPB: avaliação e comunicação de violações](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en).
- [RFC 6238: TOTP](https://www.rfc-editor.org/rfc/rfc6238).
