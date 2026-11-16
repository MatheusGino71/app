# Execução das pendências — 16/11/2026

## Entregue no código

- Identidade visual em bege, creme, café e marrom; títulos serifados, componentes harmonizados e favicon Grace Pro.
- Campanhas descrevem prêmios avaliados em EUR150/EUR100/EUR50, sem oferta de pagamento em dinheiro. O gerador preserva essas expressões durante a tradução.
- Central `/conta` com autenticação em duas etapas, recuperação por códigos de uso único, revogação de sessões e solicitações de titulares.
- Autenticadores com segredo criptografado por usuário, bloqueio de reutilização e exigência do segundo fator mesmo após recuperação de senha. A emissão de sessão confere se senha ou configuração MFA mudaram durante o login.
- Administração de pedidos de acesso, exportação, correção, restrição/oposição e exclusão de salões, com identidade verificada, autorização, controle de versão, nova autenticação e confirmação explícita para exclusão.
- Exportação da própria conta sem senha, hashes de autenticação ou segredos.
- Aviso público configurável, sem inventar responsável legal, contato, fundamento jurídico ou prazo de retenção.
- Revisão de retenção e cron autenticado para remoção de credenciais temporárias expiradas, preservando registros comerciais.
- Backup criptografado com restauração isolada antes da entrega, compatibilidade com backups antigos, preservação de MFA e aplicação do registro de exclusões na restauração.
- Cabeçalhos de segurança e verificação de preparação de produção sem exibição de segredos.

## Validação executada

- `npm test`: 55 testes aprovados, sem falhas.
- `npm run build`: compilação e TypeScript aprovados.
- `npm run test:http`: aprovados acesso interno, permissões, isolamento de carteiras, privacidade, exportação verificada, cabeçalhos, MFA, uso único de códigos e revogação de sessões.
- `npm run backup`: backup local criado e restauração em banco temporário conferida.
- Conferência visual do login e da central em uma base local de teste isolada. A validação automatizada HTTP cobre as mutações; nenhum cadastro real foi excluído.
- Verificação dos arquivos candidatos ao commit sem correspondências com os valores dos segredos locais. Arquivos de ambiente, bancos, backups e caches ficam fora do Git.
- Auditoria de 1.074 fontes em 207 catálogos sem falhas de cobertura ou placeholders. As pendências anteriores foram processadas; resta um único texto em Cherokee (`chr`), mantido em inglês porque o serviço não retornou sua tradução. O trecho está rastreado em `lib/i18n/fallbacks.json`; nenhuma tradução foi inventada para encerrar a fila.

## Adiado pelo usuário e ativação posterior

O usuário orientou deixar domínio e informações legais da empresa para depois e enviar o restante ao Git. Razão social, país/endereço, contato de privacidade, base legal e prazo de retenção não foram presumidos. A aprovação do aviso permanece desativada.

O código preparado não equivale à ativação operacional: ainda é necessário configurar os segredos dos provedores, habilitar os backups agendados, parear os autenticadores de cada administrador e verificar região, contratos e transferências internacionais. `npm run preflight:production` registra essas pendências e retorna falha quando a configuração essencial está incompleta.

As instruções de ativação e as limitações da recuperação com um registro de exclusões desatualizado estão em [operação de privacidade](operacao-privacidade.md).
