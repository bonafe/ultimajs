# 1. Visão geral

## O que é

**Ultima** (também chamado de **UltimaJS**) é um framework front-end em JavaScript Vanilla — sem
bundler, sem npm, sem dependências externas carregadas via CDN em runtime — construído inteiramente
sobre APIs nativas do navegador: `Custom Elements`, `Shadow DOM`, `<template>`, `ResizeObserver`,
`IndexedDB` e módulos ES nativos (`<script type="module">`, `import()` dinâmico).

O projeto tem duas camadas conceituais que convivem no mesmo código-base:

1. **Um framework de componentes reativos** (`ComponenteBase` + `ComponenteReativo`), reutilizável
   para construir qualquer Web Component com template HTML externo, CSS isolado e data binding
   declarativo — comparável em proposta (não em maturidade) ao Vue.js, mas sem nenhuma dependência.
2. **Uma aplicação de referência** construída sobre esse framework: o "Espaço" (`espaco-ultima`), um
   ambiente de trabalho tipo SPA onde o usuário adiciona, remove e organiza "elementos" (vídeos,
   imagens, iframes, grafos, painéis de dados) numa de duas visualizações alternáveis — um treemap
   (D3.js) ou janelas flutuantes arrastáveis (jsPanel) — com todo o estado persistido localmente no
   navegador via IndexedDB.

## Por que Vanilla JS

O `README.md` do projeto declara explicitamente a filosofia: escrever código que funcione nativamente
nos navegadores, sem dependências externas, para dar autonomia total aos desenvolvedores. Essa
filosofia foi testada e (majoritariamente) mantida: bibliotecas de terceiros usadas para
funcionalidades específicas (D3, vis.js, jsPanel, JSONEditor, jsondiffpatch, Font Awesome) são
**vendorizadas** em `src/html/bibliotecas/` — baixadas uma vez e versionadas no repositório — em vez
de instaladas via gerenciador de pacotes ou carregadas de CDN.

A única exceção encontrada é `componente_vue.js`, um experimento abandonado que carrega o Vue.js 2
real via CDN (`cdn.jsdelivr.net`) — contraria diretamente a filosofia declarada do projeto e não é
mais usado por nenhum componente ativo (ver seção 8).

## Histórico

Segundo `src/readme.md`, o projeto começou em 2020 como um protótipo de visualização em treemap
(inspirado em exemplos clássicos de D3.js: *Thinking with Joins*, *General Update Pattern*, *Les
Misérables Co-occurrence* de Mike Bostock) para exibir elementos numa arquitetura tipo
Model-Visualização-Controller, com persistência em IndexedDB. Evoluiu depois para incluir uma segunda
visualização (janelas), um sistema de componentes reativos próprio, e experimentos paralelos
(comparação com Vue.js, tentativa de integração com Vue real) que hoje coexistem no código com graus
variados de conclusão.

## Estrutura de diretórios (visão macro)

```
src/
  html/                     — todo o código-fonte servido ao navegador (é a raiz pública)
    componentes/            — todas as classes de componentes, uma pasta por domínio
      componente_base.js    — classe-base de todo Web Component do framework
      componente_reativo.js — camada de reatividade declarativa sobre ComponenteBase
      componente_vue.js     — experimento abandonado (Vue.js real via CDN)
      espaco/                — a aplicação "Espaço": orquestração, visualizações, modelo de dados
      dados/, dispositivo/, video/, imagem/, iframe/, som/, contatos/, equipe/, data/
                             — componentes de conteúdo carregáveis dinamicamente dentro do Espaço
      db/db_base.js         — wrapper genérico sobre IndexedDB
      z.exemplo/             — exemplos standalone do ComponenteReativo, fora da aplicação Espaço
    bibliotecas/             — bibliotecas de terceiros vendorizadas
    index.html, index.js, index.css
                             — ponto de entrada da aplicação Espaço
    configuracao_ultima.json — configuração inicial (componentes/controladores/ações/elementos/visualizações)
  python/servidor_https_local.py
                             — servidor de desenvolvimento HTTPS local (self-signed)
docs/                        — esta especificação e outros artigos
Dockerfile, docker-compose.yml, rotina_de_deploy.sh
                             — build e deploy de produção (Apache httpd + HAProxy)
```

## Licença

O repositório inclui um arquivo `LICENSE` na raiz (não analisado em detalhe nesta especificação —
consulte o arquivo diretamente para os termos exatos).
