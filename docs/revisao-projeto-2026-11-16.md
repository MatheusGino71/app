# Revisão do projeto — 16/11/2026

## Escopo

Revisão da estrutura Next.js/React, fluxo de acesso interno, workspace, diagnóstico, regras comerciais, persistência, APIs, internacionalização e testes existentes. A implementação visual se concentrou em eventos, campanhas e seu formulário de inscrição. O ambiente de desenvolvimento permanece em http://localhost:3000; a demonstração está em `/workspace?demo=1`.

## Correções e mudanças

- As campanhas usavam um dicionário separado, restrito a português, espanhol e inglês. Parte do português herdava textos ingleses. Títulos, mecânicas, cronogramas, condições e campos agora usam o mesmo provedor e os mesmos catálogos do aplicativo.
- A visão geral continha textos de campanhas diretamente no JSX. Ela agora compartilha o conteúdo localizado do painel.
- A auditoria identificou 13 fontes literais ausentes do catálogo inglês, incluindo textos do diagnóstico e do workspace. A base foi completada e foi adicionado `npm run audit:i18n`.
- O gerador preserva nomes comerciais e inclui a regra de proteção na versão do cache, evitando reaproveitar índices de segmentos de uma configuração diferente.
- Valores monetários e percentuais das campanhas acompanham o idioma selecionado.
- A edição anterior compartilhava os objetos de profissionais com os dados da tela. O formulário agora trabalha com cópias e atualizações imutáveis, preservando o registro original ao cancelar.
- O modo demonstração não tratava a operação de salvar campanhas. Agora valida, controla a versão e persiste as inscrições no armazenamento local da demonstração.
- A criação seleciona um salão ainda não inscrito. Inscrições existentes têm seu salão bloqueado para edição, mantendo a identidade e a versão do registro.
- Novos profissionais começam com nome vazio. O sistema não grava nomes artificiais traduzidos como se fossem nomes de pessoas.
- A interface prioriza inscrições e indicadores reais. O plano detalhado fica em uma seção expansível, separado do simulador de cenários.
- O formulário foi dividido em participação, equipe/pedido e acompanhamento, com resumo, progresso e ranking. Empates aparecem explicitamente, sem prometer um prêmio automaticamente.
- Os estilos de campanhas foram isolados em `app/workspace/campaigns.css`. A estrutura contempla telas estreitas, controles por teclado, rótulos, foco visível e preferência por movimento reduzido.
- O teste de e-mail esperava a marca antiga ATELIER, enquanto o código já enviava GRACE PRO. A expectativa foi atualizada.

## Validação

Os testes de domínio e persistência cobrem limites de categorias, capacidade, importação, anexos, histórico, isolamento de carteiras, sessões, recuperação de acesso e backup. Foram acrescentados casos de campanhas para projeções, composição do bundle, quantidades inválidas, referência de pedido, empate, isolamento de acesso e conflito de versão.

O teste HTTP usa um servidor de produção isolado com banco temporário. Não cria usuários na operação real. A conferência HTTP da interface também verifica a entrega da demonstração, dos cartões localizados, da nova folha de estilos e de catálogos representativos.

Resultados finais:

- `npm test`: 44 testes aprovados, sem falhas.
- `npm run build`: compilação de produção e verificação TypeScript aprovadas.
- `npm run test:http`: acesso interno, permissões, carteiras, diagnóstico, anexos e recuperação aprovados em ambiente isolado.
- Verificação HTTP local da interface: demonstração, cartões de campanhas, nova folha de estilos e sete catálogos representativos entregues corretamente.
- `npm run audit:i18n`: 953 fontes em 207 catálogos; nenhuma fonte literal ausente, chave vazia ou placeholder divergente. As pendências de tradução dos sete idiomas são informadas separadamente.
- `git diff --check`: sem erros de espaços em branco.

A auditoria de idiomas confere cobertura e placeholders; ela não certifica a qualidade linguística de cada frase.

## Limitações observadas

- O serviço de controle do navegador e o acesso nativo ao computador estavam indisponíveis nesta sessão. Não foi possível conferir capturas reais da tela nem executar interações visuais em desktop e celular. Responsividade e acessibilidade foram revisadas no código; a verificação visual continua pendente.
- As traduções extensas são automáticas. Mesmo com marcas, placeholders e cobertura verificados, a terminologia e a fluência dos idiomas precisam de revisão por falantes nativos.
- A indisponibilidade da API deixou 188 novos textos em inglês em cada um de sete idiomas: cs, sat, ta, te, ur, vi e war. As traduções anteriores foram preservadas, os idiomas continuam disponíveis e as pendências estão explicitadas em `lib/i18n/fallbacks.json`. O gerador permite retomar somente esses textos; consulte `docs/idiomas.md`.
- O preflight local informa ausência das variáveis do Turso e de uma origem HTTPS de produção. O ambiente local usa SQLite e HTTP. Esse resultado descreve esta máquina e não verifica a configuração da publicação na Vercel.
- Não houve publicação, alteração de credenciais ou mudança de configuração de produção.
