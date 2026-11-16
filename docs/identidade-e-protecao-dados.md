# Identidade visual, domínio e proteção de dados

**Atualização após a solicitação de executar as pendências:** a central `/conta`, os fluxos administrativos de direitos, MFA, limpeza de credenciais expiradas, aviso configurável e backup com restauração verificada foram implementados. Consulte [operação de privacidade](operacao-privacidade.md) para ativação e limites. A definição dos dados legais da empresa, a ativação nos provedores e o pareamento dos autenticadores continuam dependentes das informações e acessos correspondentes. O domínio ficou por último, conforme solicitado. O restante deste documento registra a revisão visual anterior.

Revisão de 16/11/2026 baseada na imagem fornecida, no código e na documentação do repositório. A configuração atual das contas de produção não foi auditada nesta revisão.

## Identidade visual aplicada

| Papel | Cor |
| --- | --- |
| Fundo em bege claro | `#F8F1E9` |
| Superfícies em creme | `#FFFCF8` |
| Fundos de destaque | `#F2E6D9` |
| Texto principal em café | `#34251B` |
| Texto secundário | `#756355` |
| Botões e destaques em marrom | `#85532F` |
| Contornos | `#E0CDBC` |
| Detalhes em rosa | `#C7768E` |

A tipografia usa Arial/Helvetica nos controles e Bodoni MT/Didot/Times New Roman nos títulos, conforme a disponibilidade no dispositivo. São aproximações da referência, sem carregamento de fontes por terceiros. Os papéis de marca estão em `app/globals.css` e sua aplicação compartilhada em `app/brand.css`.

As campanhas passam a apresentar “Prêmio avaliado em EUR150”, “Prêmio avaliado em EUR100” e a avaliação em EUR50 do prêmio em produtos. A descrição esclarece que os prêmios não são pagos em dinheiro. Projeções e orçamentos mantêm os valores anteriores. Os novos termos foram revisados em português brasileiro, português europeu, inglês, espanhol, francês, polonês e alemão. Nos outros catálogos, apenas os dois novos textos usam inglês provisoriamente; as pendências estão registradas em `lib/i18n/fallbacks.json`.

## Onde ficam os dados

O servidor usa Turso/libSQL remoto quando `TURSO_DATABASE_URL` está configurado. A documentação da publicação registra o banco `atelier-grace-pro`, integrado à Vercel em Production, na região `iad1` (Virgínia, EUA). É necessário confirmar região, réplicas, backups, retenção, logs e acessos administrativos nos painéis dos provedores. O repositório não prova o estado atual dessas configurações.

Cadastros, diagnósticos, participações em campanhas e anexos privados ficam no banco. Em desenvolvimento sem banco remoto, o padrão é `.data/atelier.sqlite` nesta máquina. A Vercel recusa esse fallback local. A demonstração utiliza dados fictícios e persiste alterações no navegador.

## Domínio próprio

A Vercel aceita um domínio existente ou um subdomínio, por exemplo `app.dominio-da-empresa.com`. Se a empresa já possui o domínio principal e controla o DNS, não precisa comprar outro para criar esse subdomínio. Se deseja um endereço que ainda não possui, precisa registrá-lo e renová-lo. A conexão exige configuração no projeto, DNS, certificado HTTPS e atualização de `ATELIER_APP_ORIGIN`. Nenhum domínio foi comprado ou conectado nesta revisão. [Documentação da Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Segurança e RGPD/GDPR europeu

Na Europa, a referência é o RGPD/GDPR; LGPD é a legislação brasileira. O código contém senhas protegidas com scrypt e salt, hashes de sessões e códigos, cookies HttpOnly/SameSite/Secure em produção, permissões verificadas no servidor, isolamento das carteiras, limitação de tentativas, auditoria de operações e downloads autenticados. A conexão remota ao banco usa HTTPS. Isso não equivale a uma auditoria de produção nem a uma certificação de conformidade.

O backup implementado usa AES-256-GCM. O agendamento depende de secrets e de uma variável de ativação no GitHub; não há comprovação nesta revisão de que esteja ativo ou de que a restauração operacional tenha sido exercitada. A criptografia em repouso do banco e as configurações dos provedores também precisam ser verificadas.

Para a operação europeia, é necessário definir a base legal, limitar a coleta, publicar um aviso de privacidade, estabelecer retenção e descarte, atender pedidos de acesso/correção/exclusão, revisar permissões e formalizar contratos com os operadores. Avaliar MFA para acessos administrativos, monitoramento, backups restauráveis e resposta a incidentes conforme os riscos. [Segurança — EDPB](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en), [direitos dos titulares — EDPB](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).

A indicação de armazenamento nos EUA exige avaliar as transferências internacionais e o mecanismo aplicável, como adequação para destinatários elegíveis ou cláusulas contratuais com as avaliações necessárias. Hospedar na UE pode simplificar a arquitetura, mas também é preciso avaliar logs, backups, suporte e subprocessadores; mudar a região não garante conformidade por si só. A escolha deve ser validada com o responsável por privacidade e assessoria jurídica da empresa. [Transferências internacionais — EDPB](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en).

Um plano de incidentes deve prever avaliação de risco e os avisos exigidos: quando aplicável, notificação à autoridade em até 72 horas após tomar conhecimento da violação, e comunicação aos titulares em caso de alto risco. [Violações de dados — EDPB](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en).

As pendências acima são recomendações para preparação da operação, não configurações realizadas nesta alteração visual.

## Verificação desta alteração

- 45 testes automatizados aprovados, incluindo a terminologia dos prêmios em todos os catálogos publicados.
- TypeScript e build de produção aprovados.
- Auditoria de 207 catálogos sem fontes ausentes ou placeholders divergentes; as traduções pendentes são rastreadas separadamente.
- Conferência visual da entrada, do login, do painel e das campanhas, incluindo os cartões de prêmios em viewport de 375 px.
- Contraste de 6,27:1 para botão marrom com texto creme, 5,11:1 para texto secundário sobre bege e 13,14:1 para texto principal sobre bege.
- Alterações locais; nenhuma publicação ou configuração dos provedores realizada nesta revisão.
