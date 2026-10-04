
# UltimaJS

## O que é?

UltimaJS é um framework em JavaScript Vanilla projetado para criar componentes Web reutilizáveis e reativos, utilizando recursos nativos do navegador e conformidade total com Web Components. Ele oferece uma base sólida para o desenvolvimento de Single Page Applications (SPAs) e outros tipos de aplicações web, simplificando o gerenciamento de estado e a vinculação dinâmica de dados.

## Por que usar JavaScript Vanilla?

Como desenvolvedores JavaScript, acreditamos que escrever código que funcione nativamente nos navegadores é uma boa prática. O UltimaJS foi desenvolvido com essa filosofia em mente, utilizando APIs nativas do navegador, como `Custom Elements`, `Shadow DOM`, `ResizeObserver`, IndexedDB, Service Workers, entre outras. Isso garante maior autonomia para os desenvolvedores, eliminando a necessidade de dependências externas e proporcionando uma integração perfeita com a Web.

## Reatividade Nativa e Conformidade com Web Components

O UltimaJS implementa a reatividade de forma simples e elegante, permitindo que as interfaces se atualizem automaticamente em resposta a mudanças de dados. Diferente de frameworks como Vue.js, que utilizam uma sintaxe proprietária, o UltimaJS utiliza `Custom Elements` e outras APIs nativas, garantindo conformidade total com os padrões Web Components. Isso torna o framework leve, performático e altamente compatível com outras tecnologias web.

## Estrutura Modular e Flexível

O framework é construído em torno de duas classes principais:
- **ComponentBase:** Fornece a infraestrutura para carregar e gerenciar templates HTML, scripts e estilos de forma modular, além de oferecer suporte à observação de mudanças no DOM.
- **ReactiveComponent:** Estende `ComponentBase` para adicionar reatividade, permitindo a atualização automática de elementos em resposta a mudanças nos dados.

Ambas as classes são projetadas para serem extensíveis, permitindo que os desenvolvedores criem seus próprios componentes personalizados com facilidade.

## História

O projeto Ultima começou em 2020 como uma implementação de um framework MVC utilizando JavaScript Vanilla. Desde então, ele evoluiu para um framework mais completo e robusto, com foco em reatividade e conformidade com Web Components. O objetivo sempre foi manter a simplicidade e a eficiência, fornecendo uma ferramenta poderosa para o desenvolvimento de aplicações web modernas.

## Comece a Usar

Para começar a usar o UltimaJS, basta incluir os arquivos JavaScript do framework em seu projeto e começar a criar componentes personalizados que se integram perfeitamente ao DOM do navegador.

## Testes

Não há build nem dependências. Sirva a raiz do repositório (`python3 -m http.server`) e abra `/tests/` no navegador; o resultado aparece na página e em `document.title`.

## Referências e Inspirações

O UltimaJS foi inspirado por várias abordagens e práticas modernas em desenvolvimento web, incluindo:

- Thinking with Joins: https://bost.ocks.org/mike/join/
- General Update Pattern, I: https://bl.ocks.org/mbostock/3808218
- Les Misérables Co-occurrence: https://bost.ocks.org/mike/miserables/
- Path Transitions: https://bost.ocks.org/mike/path/
- Scatterplot Matrix Brushing: https://bl.ocks.org/mbostock/4063663

Contribuições e feedbacks são bem-vindos!