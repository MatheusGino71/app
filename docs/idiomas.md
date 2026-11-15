# Idiomas da interface

O seletor está disponível no acesso/cadastro, no diagnóstico, na confirmação de e-mail, no resultado e no workspace. Oferece busca pelo nome em português, inglês, no próprio idioma e pelo país representativo. As bandeiras são SVGs locais do projeto [flag-icons](https://github.com/lipis/flag-icons), com licença MIT incluída em `public/flags/LICENSE.txt`. Uma bandeira identifica um país representativo; o idioma pode ser falado em muitos países.

A lista em `lib/i18n/languages.json` reúne os idiomas candidatos, e `lib/i18n/available.json` restringe o seletor aos catálogos publicados. O padrão é **inglês**, inclusive na primeira renderização do servidor. O idioma do navegador não altera esse padrão. A troca ocorre somente pelo seletor; a escolha explícita fica em `localStorage` (`atelier-language-v1`), permanece entre telas e é sincronizada entre abas. O idioma é uma preferência deste navegador; não modifica país, nacionalidade ou respostas do salão.

Os modelos experimentais não são publicados automaticamente. Seus testes apresentaram textos truncados e tempo de geração excessivo. Um idioma experimental pode ser solicitado explicitamente ao gerador, mas só deve entrar no catálogo publicado depois da conferência editorial.

O catálogo inglês já está incluído na aplicação para que a primeira tela seja exibida em inglês. Os demais arquivos em `public/locales/` são carregados sob demanda para o idioma escolhido. Não há tradutor externo em execução na aplicação, chave de API, custo por tradução durante o uso ou envio de formulários a serviços de tradução. Trocar o idioma mantém os campos preenchidos. `lang`, direção de escrita, datas e valores monetários acompanham a seleção. A moeda continua sendo EUR e os valores usados para o enquadramento permanecem os mesmos.

`useI18n().t()` traduz a interface; os valores dos campos e as opções salvas continuam no formato canônico do domínio. Nomes de pessoas, nomes de salões, textos livres e documentos permanecem como foram informados. ORIGIN, SIGNATURE, ICON, ATELIER e Grace Pro são preservados.

## Atualização dos textos

1. Adicione o texto em português ao componente com `t("Texto")` e sua tradução inglesa em `public/locales/en.json`. As substituições usam `{name}` e o segundo argumento de `t`; nunca concatene dados pessoais ao texto enviado para gerar traduções.
2. A base de cadastro e do fluxo do cliente tem ajustes editoriais em `lib/i18n/english-overrides.json`. Ajustes específicos de um idioma ficam em `lib/i18n/overrides/<codigo>.json`.
3. Execute `node scripts/translate-interface.cjs` para gerar os textos que faltam ou passe códigos, por exemplo `node scripts/translate-interface.cjs pl es`. Para retraduzir um idioma inteiro após revisar a base inglesa, use `node scripts/translate-interface.cjs --force pl`. O script usa a [API pública MinT da Wikimedia](https://translate.wmcloud.org/docs) apenas durante o desenvolvimento. Os lotes concluídos ficam em `.data/translation-<idioma>-<versao>.json`, fora do Git. Respeita lotes de até 9.000 caracteres e preserva os nomes comerciais e as substituições.
4. Aumente `CATALOG_VERSION` em `lib/i18n/core.ts` e execute os testes, o build e a verificação no navegador. Publique os JSONs gerados junto com o código.

As traduções amplas foram geradas automaticamente. A existência de um catálogo não equivale a revisão humana por falante nativo; é possível corrigir termos específicos nos arquivos de ajustes e regenerar o idioma. Os e-mails transacionais usam os modelos padrão em inglês do servidor.

Se um catálogo não carregar, a aplicação mantém o idioma atual e oferece nova tentativa. Nenhum cadastro é enviado ao trocar o idioma. O idioma não depende do banco de dados ou da configuração de e-mail.
