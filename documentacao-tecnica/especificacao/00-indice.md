# Especificação técnica do Ultima / UltimaJS

Esta é uma especificação minuciosa de todo o código-fonte do projeto, escrita a partir da leitura
completa do repositório (não é um documento de intenções — reflete o que o código realmente faz,
incluindo suas inconsistências e dívidas técnicas). Serve como referência para quem for dar
manutenção ou continuar o desenvolvimento do framework.

## Sumário

1. [Visão geral](01-visao-geral.md) — o que é o projeto, filosofia, histórico
2. [Arquitetura do núcleo](02-arquitetura-nucleo.md) — `ComponenteBase` e `ComponenteReativo`, a DSL reativa completa
3. [Sistema Espaço / Visualização / Elemento](03-espaco-visualizacao-elemento.md) — como a aplicação principal é composta e orquestrada
4. [Modelo de dados](04-modelo-de-dados.md) — esquema do IndexedDB, formato do arquivo de configuração
5. [Visualizações](05-visualizacoes.md) — treemap (D3.js) e janelas (jsPanel) em detalhe
6. [Catálogo de componentes](06-catalogo-componentes.md) — todo componente de conteúdo carregável dinamicamente
7. [Infraestrutura e deploy](07-infraestrutura-deploy.md) — Docker, HAProxy, servidor de desenvolvimento
8. [Débito técnico conhecido](08-debito-tecnico-conhecido.md) — inconsistências e problemas identificados na leitura do código

## Como este documento foi gerado

Escrito por leitura direta e teste no navegador de todo o código-fonte em `src/html/`, em julho de
2026. Várias correções de bugs foram feitas no código durante o mesmo período em que esta
especificação foi escrita (ver histórico do git) — o texto reflete o estado do código **depois**
dessas correções, exceto na seção 8, que documenta o que ainda está pendente.
