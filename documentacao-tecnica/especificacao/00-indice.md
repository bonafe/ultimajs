# Especificação técnica do Ultima / UltimaJS

Esta é uma especificação minuciosa do núcleo do framework, escrita a partir da leitura completa do
código-fonte (não é um documento de intenções — reflete o que o código realmente faz, incluindo
suas inconsistências e dívidas técnicas). Serve como referência para quem for dar manutenção ou
continuar o desenvolvimento do framework.

Esta pasta documenta apenas o núcleo (`ComponentBase`, `ControllerBase`, `ReactiveComponent` e a
DSL reativa). A documentação da aplicação de referência "Espaço" (Workspace) — modelo de dados,
visualizações, catálogo de componentes e infraestrutura de deploy — foi movida para o projeto
`espaco/` quando o repositório foi dividido em dois projetos mínimos.

## Sumário

1. [Visão geral](01-visao-geral.md) — o que é o projeto, filosofia, histórico
2. [Arquitetura do núcleo](02-arquitetura-nucleo.md) — `ComponentBase` e `ReactiveComponent`, a DSL reativa completa

## Como este documento foi gerado

Escrito por leitura direta e teste no navegador de todo o código-fonte em `src/html/`, em julho de
2026. Várias correções de bugs foram feitas no código durante o mesmo período em que esta
especificação foi escrita (ver histórico do git) — o texto reflete o estado do código **depois**
dessas correções.
