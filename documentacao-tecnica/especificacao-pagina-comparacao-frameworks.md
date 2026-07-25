# Especificação — Página de comparação do Ultima com outros frameworks

## Objetivo

Criar uma nova página pública no site do **Ultima** comparando sua proposta com projetos próximos do mesmo espaço tecnológico.

A página não deve tentar provar que o Ultima é “o primeiro”, “o único” ou “melhor em tudo”. O objetivo é explicar com precisão:

- quais ideias o Ultima compartilha com outros projetos;
- quais decisões arquiteturais são próprias da sua combinação;
- em quais cenários cada alternativa faz mais sentido;
- quais são as limitações e os trade-offs do Ultima;
- por que o Ultima pode ser interessante para quem procura Web Components reativos, HTML externo, ausência de build e dependência mínima de abstrações.

A comparação deve ser técnica, equilibrada e verificável.

---

## Arquivo a criar

Criar:

```text
comparacao.html
```

A página deve usar a mesma estrutura visual, tipografia, cabeçalho, navegação, rodapé, componentes e estilos já utilizados nas páginas atuais do projeto, especialmente:

```text
index.html
inicio-rapido.html
guia.html
referencia.html
sobre.html
```

Antes de implementar, examine os arquivos existentes e reutilize os padrões do projeto. Não criar uma identidade visual paralela.

---

## Alterações de navegação

Adicionar um link chamado:

```text
Comparação
```

na navegação principal das páginas do site, apontando para:

```text
comparacao.html
```

Atualizar pelo menos:

- `index.html`;
- `inicio-rapido.html`;
- `guia.html`;
- `referencia.html`;
- `exemplos.html`;
- `sobre.html`;
- a nova `comparacao.html`.

Caso o cabeçalho ou o rodapé sejam gerados de forma compartilhada, modificar o ponto central apropriado em vez de repetir alterações manualmente.

---

## Título e metadados

### `<title>`

```text
Comparação com outros frameworks — Ultima
```

### Meta description

```text
Compare o Ultima com Litedom, Alpine.js, Lit, Minze e VanJS. Entenda diferenças de arquitetura, templates, Web Components, reatividade, build e dependências.
```

### Título principal da página

```text
Como o Ultima se compara?
```

### Subtítulo sugerido

```text
O Ultima compartilha ideias com outros frameworks reativos, mas combina Web Components nativos, templates HTML externos, uma DSL declarativa baseada em caminhos de dados e execução sem build ou dependências de runtime.
```

---

## Tom editorial

Usar linguagem:

- técnica, mas acessível;
- objetiva;
- honesta sobre limitações;
- sem ataques a outros frameworks;
- sem afirmações históricas não comprovadas;
- sem frases como “revolucionário”, “único no mercado”, “o melhor framework” ou “substitui React”;
- sem transformar preferências arquiteturais em verdades universais.

Preferir formulações como:

- “o Ultima prioriza...”;
- “a principal diferença está em...”;
- “essa decisão reduz..., mas também limita...”;
- “pode ser adequado quando...”;
- “não é a melhor escolha quando...”.

---

# Estrutura obrigatória da página

## 1. Introdução

Explicar brevemente que o Ultima não surgiu em um vazio. Ele pertence a uma família de soluções que tenta obter reatividade e composição sem depender necessariamente de grandes frameworks de aplicação.

Texto-base:

> A proposta geral do Ultima não é inédita: existem outras bibliotecas reativas, baseadas em Web Components ou executadas diretamente no navegador sem etapa obrigatória de compilação. A diferença está na combinação das decisões arquiteturais: componentes definidos como Custom Elements, templates mantidos em arquivos HTML externos, binding por atributos `data-*`, expressões restritas a caminhos de dados e atualização direta do DOM.

Adicionar uma observação:

> Esta não é uma comparação de popularidade, quantidade de recursos ou tamanho de comunidade. O foco está na arquitetura e na experiência de desenvolvimento.

---

## 2. Resumo executivo

Criar um bloco visual destacado com o título:

```text
Em poucas palavras
```

Conteúdo:

> O projeto conceitualmente mais próximo do Ultima é o Litedom: ambos oferecem componentes reativos baseados em padrões Web, sem Virtual DOM e sem build obrigatório. Alpine.js é o mais próximo na aparência da DSL declarativa. Lit e Minze são as referências mais diretas para criação de Web Components reativos. VanJS compartilha a busca por uma camada mínima sobre o JavaScript e o DOM nativos.  
>
> O diferencial mais claro do Ultima é usar templates `.html` externos, associados à classe JavaScript do componente, com uma DSL restrita baseada em atributos `data-*` e caminhos de dados.

---

## 3. Projetos comparados

Comparar os seguintes projetos:

1. **Ultima**
2. **Litedom**
3. **Alpine.js**
4. **Lit**
5. **Minze**
6. **VanJS**

Não apresentar React, Vue, Angular ou Svelte como concorrentes diretos. Eles podem ser mencionados em uma nota contextual:

> React, Vue, Angular e Svelte possuem escopo, ecossistema e objetivos mais amplos. Eles servem como referência do mercado de frameworks de interface, mas não são os pares arquiteturais mais próximos do Ultima.

---

## 4. Tabela comparativa principal

Criar uma tabela responsiva.

Em telas pequenas, permitir rolagem horizontal ou transformar as colunas em cartões acessíveis. Não reduzir a fonte a ponto de prejudicar a leitura.

### Colunas

- Critério
- Ultima
- Litedom
- Alpine.js
- Lit
- Minze
- VanJS

### Dados da tabela

| Critério | Ultima | Litedom | Alpine.js | Lit | Minze | VanJS |
|---|---|---|---|---|---|---|
| Foco principal | Web Components reativos e aplicações construídas com APIs nativas | Biblioteca reativa para Web Components | Reatividade declarativa adicionada ao HTML existente | Criação de Web Components reativos | Criação simplificada de Web Components | Interfaces reativas construídas diretamente em JavaScript e DOM |
| Custom Elements nativos | Sim | Sim | Não como unidade principal | Sim | Sim | Não como unidade principal |
| Shadow DOM | Opcional | Suportado | Não é o modelo padrão | Integrado aos componentes | Suportado | Não é o modelo padrão |
| Reatividade | Sim | Sim | Sim | Sim | Sim | Sim |
| Formato do template | Arquivo `.html` externo | Template literal em JavaScript | HTML da própria página com diretivas `x-*` | Tagged template literal em JavaScript | String/template em JavaScript | Funções JavaScript que criam nós DOM |
| DSL declarativa no HTML | Atributos `data-*` | Diretivas no template literal | Diretivas `x-*` | Bindings e diretivas em templates `html` | API e templates da biblioteca | Não; composição por funções JavaScript |
| Expressões no template | Caminhos de dados deliberadamente restritos | Expressões JavaScript em template literal | Expressões JavaScript | Expressões JavaScript | Expressões JavaScript | JavaScript comum |
| Binding bidirecional | Sim, por `data-mapa` e evento nativo `change` | Sim | Sim, por `x-model` | Não como mecanismo genérico padrão | Não destacar como recurso central | Pode ser implementado com estado e eventos, mas não por uma DSL equivalente |
| Condicionais | `<template data-se>`, `data-senao-se` e `data-senao` | Diretivas condicionais | `x-if` e `x-show` | Expressões e diretivas | Renderização condicional no template | JavaScript e bindings |
| Listas | `<template data-lista>` | Diretivas de repetição | `x-for` | `map` e diretiva `repeat` | Renderização no template | JavaScript e bindings |
| Reconciliação por chave | Sim | Confirmar na documentação antes de afirmar | `x-bind:key`/`:key` em `x-for` | Sim, por `repeat` quando utilizado | Não afirmar sem fonte específica | Não apresentar como mecanismo central |
| Virtual DOM | Não | Não | Não é baseado em Virtual DOM | Não | Não afirmar sem fonte específica | Não |
| Build obrigatório | Não | Não | Não | Não estritamente; ferramentas são comuns no ecossistema | Não estritamente, embora o fluxo oficial use frequentemente Node/Vite | Não |
| `npm install` obrigatório | Não | Não | Não | Não estritamente, mas é a instalação mais comum | Não estritamente; npm/CDN são suportados | Não |
| Dependência de runtime | Nenhuma biblioteca de terceiros no núcleo | A própria biblioteca Litedom | A própria biblioteca Alpine | A biblioteca Lit | A biblioteca Minze | A biblioteca VanJS |
| Tamanho do runtime adicional | Núcleo local do projeto; não divulgar número sem medição reproduzível | Aproximadamente 3–3,5 kB gzip, conforme documentação oficial | Medir ou omitir; não estimar | Aproximadamente 5 kB minificado e comprimido, conforme documentação oficial | Aproximadamente 3 kB minificado e comprimido, conforme documentação oficial | Aproximadamente 1 kB, conforme documentação oficial |
| HTML externo por componente | Sim, decisão central | Não | O HTML já está na página | Não como padrão | Não como padrão | Não |
| Caminho do template relativo ao módulo | Sim, por `import.meta.url` | Não aplicável | Não aplicável | Não aplicável | Não aplicável | Não aplicável |
| Composição com HTML comum | Sim | Sim | Sim | Sim | Sim | Sim |
| Comunidade/ecossistema | Projeto pessoal, sem comunidade formal | Projeto pequeno | Comunidade consolidada | Ecossistema consolidado de Web Components | Projeto especializado | Projeto pequeno e ativo |
| Licença | CC0 1.0 | MIT | MIT | BSD-3-Clause | MIT | MIT |

### Regras para essa tabela

1. Não apresentar “Sim” como automaticamente melhor que “Não”.
2. Adicionar explicações em `title`, tooltip acessível ou nota quando um valor exigir contexto.
3. Onde a documentação oficial não sustentar uma afirmação, usar:
   - “Não é o foco”;
   - “Não documentado como recurso central”;
   - “Confirmar antes da publicação”.
4. Não inventar métricas de desempenho.
5. Não usar estrelas do GitHub como medida de qualidade.
6. Não fazer benchmark sem metodologia reproduzível.
7. Conferir as licenças nos repositórios oficiais antes da publicação.

---

## 5. Comparações detalhadas

Criar uma seção para cada projeto.

---

### 5.1. Ultima e Litedom

#### Título

```text
Ultima × Litedom
```

#### Texto sugerido

> Litedom é provavelmente o projeto conceitualmente mais próximo do Ultima. Ambos usam padrões de Web Components, oferecem reatividade, binding de dados e dispensam Virtual DOM, JSX e etapa obrigatória de build.
>
> A diferença principal está na organização dos componentes. Litedom mantém o template em JavaScript, usando template literals e expressões da linguagem. O Ultima separa o template em um arquivo `.html` externo e restringe a DSL principalmente a caminhos de dados declarados em atributos `data-*`.
>
> Essa restrição torna o template do Ultima menos expressivo que JavaScript arbitrário, mas também mais previsível: a lógica tende a permanecer na classe do componente, enquanto o HTML descreve bindings, condicionais e listas.

#### Quadro “Escolha Litedom quando”

- desejar uma biblioteca pequena já estruturada para Web Components;
- preferir templates escritos junto ao JavaScript;
- precisar de expressões JavaScript diretamente no template;
- quiser uma solução anterior e mais próxima de uma biblioteca tradicional distribuível.

#### Quadro “Escolha Ultima quando”

- quiser manter o template em um arquivo HTML separado;
- preferir uma DSL deliberadamente restrita;
- quiser resolver URLs do componente relativamente ao próprio módulo;
- desejar inspecionar o estado por meio do contrato `data-dados`;
- estiver estudando ou construindo uma arquitetura centrada nas APIs nativas do navegador.

---

### 5.2. Ultima e Alpine.js

#### Título

```text
Ultima × Alpine.js
```

#### Texto sugerido

> Alpine.js é o projeto mais próximo do Ultima na aparência do HTML. Ambos usam atributos declarativos para conectar dados e elementos, criar condicionais, repetir listas e tratar formulários.
>
> A diferença está na unidade arquitetural. Alpine transforma trechos do HTML existente em regiões reativas por meio de `x-data` e outras diretivas. O Ultima define cada unidade como um Custom Element real, opcionalmente encapsulado por Shadow DOM, com classe e ciclo de vida próprios.
>
> Alpine permite expressões JavaScript diretamente nas diretivas. O Ultima usa principalmente caminhos de dados, reduzindo o poder da expressão no template e incentivando que a lógica permaneça no JavaScript do componente.

#### Quadro “Escolha Alpine.js quando”

- quiser adicionar interatividade progressiva a páginas renderizadas no servidor;
- não precisar que cada região seja um Web Component;
- quiser escrever expressões JavaScript diretamente nos atributos;
- desejar um ecossistema mais estabelecido e mais documentação comunitária.

#### Quadro “Escolha Ultima quando”

- a identidade nativa do componente for importante;
- precisar de Shadow DOM por componente;
- preferir template HTML externo;
- quiser evitar uma biblioteca de runtime além dos arquivos do próprio núcleo;
- desejar uma DSL com menor liberdade de execução dentro do HTML.

---

### 5.3. Ultima e Lit

#### Título

```text
Ultima × Lit
```

#### Texto sugerido

> Lit é a principal referência contemporânea para criação de Web Components reativos. Seus componentes são Custom Elements reais, interoperáveis com HTML e outros frameworks. A biblioteca fornece propriedades reativas, estilos encapsulados e templates declarativos eficientes.
>
> Lit escreve os templates em JavaScript por meio de tagged template literals. O Ultima mantém o HTML em um arquivo separado e descreve bindings em atributos `data-*`.
>
> Lit possui maior maturidade, ecossistema, documentação, integração com TypeScript e ferramentas de desenvolvimento. O Ultima oferece uma experiência mais experimental e minimalista, orientada a quem deseja trabalhar diretamente com uma arquitetura própria e com menos infraestrutura externa.

#### Quadro “Escolha Lit quando”

- precisar de uma solução madura para componentes reutilizáveis;
- quiser integração sólida com TypeScript;
- necessitar de ecossistema, ferramentas e documentação ampla;
- estiver construindo um design system ou biblioteca distribuída;
- aceitar a biblioteca Lit como dependência.

#### Quadro “Escolha Ultima quando”

- templates HTML externos forem uma exigência;
- quiser estudar ou controlar o mecanismo reativo;
- quiser um núcleo pequeno copiado diretamente para o projeto;
- não precisar de pacote npm, tipagem completa ou ecossistema formal;
- aceitar que o projeto ainda possui partes experimentais.

---

### 5.4. Ultima e Minze

#### Título

```text
Ultima × Minze
```

#### Texto sugerido

> Minze simplifica a criação de Web Components e oferece uma classe-base, reatividade, ciclo de vida e ferramentas para produzir componentes reutilizáveis. Assim como o Ultima, procura reduzir o boilerplate das APIs nativas.
>
> O fluxo de trabalho do Minze é mais próximo de uma biblioteca pronta para criação e distribuição de componentes, incluindo integração com npm, TypeScript, Vite e Storybook. O Ultima é mais independente desse ecossistema e organiza o componente por meio de um arquivo HTML externo e uma classe JavaScript.

#### Quadro “Escolha Minze quando”

- quiser produzir bibliotecas de componentes publicáveis;
- precisar de TypeScript e Storybook;
- preferir uma ferramenta especializada com fluxo de projeto estabelecido;
- aceitar npm, CDN ou uma dependência de biblioteca.

#### Quadro “Escolha Ultima quando”

- quiser evitar o fluxo usual de empacotamento;
- preferir copiar e versionar diretamente o núcleo;
- quiser templates HTML externos;
- o objetivo for uma aplicação ou experimento arquitetural próprio, e não necessariamente uma biblioteca pública de componentes.

---

### 5.5. Ultima e VanJS

#### Título

```text
Ultima × VanJS
```

#### Texto sugerido

> VanJS e Ultima compartilham o interesse por uma camada pequena, sem transpilar a aplicação e sem Virtual DOM. As duas propostas procuram permanecer próximas do navegador.
>
> A diferença é a direção adotada. VanJS constrói a interface por funções JavaScript que criam e conectam nós DOM. O Ultima preserva o HTML como linguagem principal do template e usa atributos declarativos para associá-lo ao estado.
>
> Portanto, VanJS tende a agradar quem prefere compor toda a interface em JavaScript. O Ultima tende a agradar quem deseja que a estrutura visual permaneça legível como HTML independente.

#### Quadro “Escolha VanJS quando”

- preferir construir a árvore DOM em JavaScript;
- quiser uma biblioteca extremamente pequena;
- não precisar que a unidade de composição seja um Custom Element;
- desejar usar JavaScript comum em toda a composição da interface.

#### Quadro “Escolha Ultima quando”

- quiser que o template continue sendo HTML;
- quiser Custom Elements como unidade arquitetural;
- precisar de Shadow DOM opcional;
- preferir binding declarativo por atributos e caminhos de dados.

---

## 6. Diferenciais do Ultima

Criar uma seção com o título:

```text
O que distingue o Ultima
```

Não chamar necessariamente de “vantagens”. Apresentar como decisões arquiteturais.

### 6.1. Templates HTML externos

Texto sugerido:

> Cada componente pode manter sua estrutura em um arquivo `.html`, separado da classe JavaScript. O caminho do template é resolvido relativamente ao módulo do componente com `import.meta.url`, e não relativamente à página que o utiliza.

Exibir um pequeno exemplo:

```js
super(
    { templateURL: './meu-contador.html', shadowDOM: true },
    import.meta.url
);
```

---

### 6.2. DSL baseada em atributos `data-*`

Listar:

- `data-mapa`;
- `data-classe`;
- `data-estilo`;
- `data-ref`;
- `data-se`;
- `data-senao-se`;
- `data-senao`;
- `data-lista`.

Explicar que a DSL trabalha principalmente com caminhos de dados, e não com execução irrestrita de JavaScript no template.

---

### 6.3. Binding bidirecional entre dados e DOM

Explicar:

> `data-mapa` atualiza propriedades e atributos a partir dos dados. Em elementos editáveis, o evento nativo `change` escreve o valor de volta no caminho correspondente.

Incluir exemplo:

```html
<input data-mapa='{"value":"nome"}'>
<input type="checkbox" data-mapa='{"checked":"ativo"}'>
<span data-mapa='{"textContent":"nome"}'></span>
```

---

### 6.4. Composição entre componentes

Explicar o uso de:

```html
<componente-filho
    data-mapa='{"data-dados":"perfil"}'>
</componente-filho>
```

Deixar claro que o transporte de objetos pelo atributo `data-dados` envolve serialização em JSON e possui limitações.

---

### 6.5. Reconciliação direta no DOM

Explicar:

> Em listas com chave válida, nós DOM correspondentes ao mesmo item são reutilizados e reposicionados, preservando identidade, foco e estado interno quando possível. Não existe uma árvore de Virtual DOM mantida em paralelo.

Exemplo:

```html
<template data-lista="tarefa in tarefas : id">
    <li data-mapa='{"textContent":"tarefa.titulo"}'></li>
</template>
```

---

### 6.6. Condicionais que preservam o ramo ativo

Explicar:

> Quando o ramo vencedor de uma cadeia condicional continua sendo o mesmo, o Ultima não precisa destruir e recriar todo o conteúdo desse ramo. Isso ajuda a preservar a identidade dos elementos internos.

---

## 7. Trade-offs e limitações

Criar uma seção obrigatória:

```text
Onde o Ultima ainda perde
```

O título pode ser ajustado para:

```text
Trade-offs atuais
```

mas o conteúdo não deve ser omitido.

### Pontos a apresentar

#### Ecossistema

> O Ultima não possui comunidade formal, pacote oficial no npm, coleção de plugins, integração ampla com IDEs ou mercado consolidado de profissionais.

#### Maturidade

> O projeto possui partes bem testadas e outras experimentais ou incompletas. O código-fonte ainda é a fonte principal de verdade.

#### Tooling

> Não há atualmente uma experiência equivalente à oferecida por ferramentas maduras de TypeScript, linting especializado, devtools, SSR, hidratação ou geração estática.

#### Estado serializado em atributo

> O contrato `data-dados` facilita a comunicação declarativa, mas utiliza serialização JSON. Isso não representa naturalmente valores como funções, referências circulares, `Map`, `Set`, `Date` com semântica preservada ou `undefined`.

#### Atualizações grandes

> Estados volumosos ou atualizados em alta frequência podem tornar a serialização e a sincronização por atributos menos adequadas. A página não deve prometer desempenho superior sem benchmarks.

#### Expressividade da DSL

> Caminhos restritos deixam o template previsível, mas exigem mover transformações e lógica para propriedades computadas ou métodos JavaScript.

#### Templates carregados em runtime

> Arquivos HTML externos preservam separação de responsabilidades, mas introduzem carregamento e tratamento de recursos em runtime. É necessário servir o projeto por HTTP; abrir diretamente por `file://` pode não funcionar devido às políticas do navegador.

---

## 8. Guia de decisão

Criar uma seção:

```text
Qual escolher?
```

Usar cartões ou uma lista bem organizada.

### Recomendações

#### Use Ultima quando

- o objetivo for trabalhar diretamente com Custom Elements e APIs nativas;
- HTML externo por componente for desejável;
- não houver necessidade de ecossistema ou tooling avançado;
- uma DSL pequena e restrita for preferível;
- o projeto aceitar uma tecnologia pessoal e experimental;
- houver interesse em estudar, modificar ou incorporar o próprio núcleo reativo.

#### Use Litedom quando

- desejar uma alternativa pequena e muito próxima conceitualmente;
- preferir templates JavaScript;
- quiser uma biblioteca pronta com recursos reativos semelhantes.

#### Use Alpine.js quando

- precisar acrescentar interatividade progressiva a HTML existente;
- trabalhar com páginas renderizadas no servidor;
- não precisar transformar cada parte em um Web Component.

#### Use Lit quando

- precisar de uma base madura e amplamente adotada para Web Components;
- estiver criando design systems;
- precisar de TypeScript, tooling, documentação e interoperabilidade testada.

#### Use Minze quando

- desejar uma experiência simplificada para desenvolver e distribuir Web Components;
- quiser integração com npm, Vite, TypeScript e Storybook.

#### Use VanJS quando

- preferir construir interfaces diretamente em JavaScript;
- quiser uma abstração mínima e muito pequena;
- não precisar de templates HTML externos ou Custom Elements como modelo central.

---

## 9. Pergunta “O Ultima é uma proposta nova?”

Criar uma seção específica com esse título.

Texto sugerido:

> Não no sentido de inaugurar uma categoria. Antes e depois do início do Ultima, outros projetos já combinaram reatividade, Web Components, ausência de Virtual DOM e execução sem build obrigatório.
>
> A proposta própria do Ultima está na combinação: templates HTML externos, Custom Elements reais, Shadow DOM opcional, DSL em atributos `data-*`, expressões baseadas principalmente em caminhos de dados, composição pelo contrato `data-dados` e reconciliação direta no DOM.
>
> Portanto, a descrição mais precisa é: **uma implementação independente, com uma combinação arquitetural própria de ideias existentes**.

Destacar a última frase visualmente.

---

## 10. Posicionamento recomendado

Criar um bloco final com o título:

```text
Definição recomendada
```

Texto:

> **Ultima é um microframework HTML-first para Web Components reativos, sem build obrigatório e sem dependências de terceiros no núcleo, com templates HTML externos e uma DSL declarativa baseada em caminhos de dados.**

Não utilizar “zero runtime” de forma ambígua, pois o próprio núcleo do Ultima executa em runtime. O correto é dizer:

- “sem dependências de terceiros no núcleo”;
- “sem biblioteca externa carregada em runtime”;
- “sem etapa obrigatória de build”.

---

## 11. Fontes

Adicionar uma seção ao final da página:

```text
Fontes e metodologia
```

Explicar:

> A comparação considera a documentação oficial disponível de cada projeto. Recursos, licenças, tamanhos e formas de instalação podem mudar. Quando uma característica não está claramente documentada, ela não deve ser apresentada como fato.

Usar apenas fontes oficiais ou repositórios oficiais.

### Ultima

- Site: `https://bonafe.github.io/ultima/`
- Início rápido: `https://bonafe.github.io/ultima/inicio-rapido.html`
- Guia: `https://bonafe.github.io/ultima/guia.html`
- DSL: `https://bonafe.github.io/ultima/referencia.html`
- Sobre: `https://bonafe.github.io/ultima/sobre.html`
- Repositório: `https://github.com/bonafe/ultima`

### Litedom

- Site: `https://litedom.js.org/`
- Guia: `https://litedom.js.org/guide/`
- Repositório oficial: localizar pelo link existente no site oficial antes da publicação.

### Alpine.js

- Site e documentação: `https://alpinejs.dev/`
- `x-data`: `https://alpinejs.dev/directives/data`
- `x-model`: `https://alpinejs.dev/directives/model`
- `x-if`: `https://alpinejs.dev/directives/if`
- `x-for`: `https://alpinejs.dev/directives/for`

### Lit

- Site e documentação: `https://lit.dev/`
- Visão geral: `https://lit.dev/docs/`
- Templates: `https://lit.dev/docs/templates/overview/`
- Componentes: `https://lit.dev/docs/components/overview/`

### Minze

- Site: `https://minze.dev/`
- Introdução: `https://minze.dev/guide/introduction`
- Instalação: `https://minze.dev/guide/installation`

### VanJS

- Site: `https://vanjs.org/`
- Primeiros passos: `https://vanjs.org/start`
- Tutorial: `https://vanjs.org/tutorial`
- Sobre: `https://vanjs.org/about/`

---

# Requisitos visuais

## Integração com o site

- Manter a identidade visual atual.
- Reutilizar variáveis CSS já existentes.
- Reutilizar largura máxima, espaçamento e estilo de títulos.
- Manter cabeçalho e rodapé consistentes.
- Marcar “Comparação” como item ativo na navegação.
- Não adicionar framework CSS ou biblioteca JavaScript.
- Não importar fontes externas novas sem necessidade.

## Tabela

- Cabeçalho fixo durante a rolagem, caso isso seja simples e não prejudique telas móveis.
- Primeira coluna visualmente destacada.
- Usar contraste suficiente.
- Não depender apenas de cores para indicar diferenças.
- Evitar símbolos vagos sem legenda.
- Preferir texto curto: “Sim”, “Não”, “Opcional”, “Não é o foco”, “Com biblioteca”.
- Permitir navegação por teclado.

## Cartões comparativos

Cada comparação detalhada pode ser apresentada em um cartão com:

- nome do projeto;
- resumo em uma frase;
- “Em comum”;
- “Principal diferença”;
- “Quando escolher”;
- link para documentação oficial.

Não usar logos ou imagens externas se não forem necessárias. Caso sejam usadas, verificar licença e origem.

---

# Acessibilidade

A página deve:

- usar HTML semântico;
- possuir apenas um `<h1>`;
- seguir hierarquia correta de títulos;
- associar cabeçalhos da tabela com `scope`;
- permitir rolagem da tabela sem esconder conteúdo;
- manter foco visível;
- ter contraste adequado;
- não depender de hover;
- usar links com textos descritivos;
- respeitar `prefers-reduced-motion`;
- não inserir animações indispensáveis para compreensão.

---

# Responsividade

Testar ao menos nos seguintes intervalos:

- 320 px;
- 375 px;
- 768 px;
- 1024 px;
- 1440 px.

Em telas pequenas:

- a tabela pode ter rolagem horizontal;
- mostrar indicação discreta de que há mais colunas;
- evitar quebra desordenada de nomes;
- preservar células legíveis;
- não cortar blocos de código.

---

# Requisitos técnicos

- Usar somente HTML, CSS e JavaScript nativos já compatíveis com o projeto.
- Não adicionar npm, bundler ou etapa de build.
- Não adicionar dependências externas.
- Não alterar o funcionamento das páginas existentes.
- Não duplicar CSS se houver arquivo compartilhado adequado.
- Manter os caminhos relativos compatíveis com GitHub Pages.
- Não usar URLs absolutas internas quando caminhos relativos forem suficientes.
- Validar o HTML.
- Evitar JavaScript quando CSS e HTML forem suficientes.
- Links externos devem usar:

```html
target="_blank" rel="noopener noreferrer"
```

quando abrirem nova aba.

---

# Requisitos de conteúdo e precisão

Antes de concluir:

1. Conferir cada dado na documentação oficial.
2. Verificar as licenças atuais.
3. Verificar os tamanhos divulgados oficialmente.
4. Não afirmar que o Ultima é anterior ou posterior a um projeto sem fonte.
5. Não usar benchmarks encontrados em blogs.
6. Não comparar desempenho sem teste reproduzível.
7. Não afirmar que ausência de Virtual DOM implica automaticamente maior desempenho.
8. Não afirmar que Web Components são sempre melhores que componentes de frameworks.
9. Não esconder as limitações do Ultima.
10. Não alterar o significado dos recursos existentes na documentação do Ultima.

---

# Critérios de aceite

A tarefa estará concluída quando:

- [ ] `comparacao.html` existir e abrir corretamente no GitHub Pages;
- [ ] a página utilizar o mesmo layout das demais páginas;
- [ ] o menu “Comparação” estiver presente nas páginas principais;
- [ ] a tabela incluir os seis projetos definidos;
- [ ] a tabela funcionar em celular;
- [ ] cada projeto possuir uma comparação textual;
- [ ] a página explicar claramente o diferencial do Ultima;
- [ ] a página declarar explicitamente que a categoria não é inédita;
- [ ] os trade-offs atuais do Ultima estiverem visíveis;
- [ ] todas as fontes forem oficiais;
- [ ] não houver dependências novas;
- [ ] não houver alegações de desempenho sem evidência;
- [ ] os links internos e externos estiverem funcionando;
- [ ] a página estiver semanticamente acessível;
- [ ] o estilo estiver consistente com o restante do site.

---

# Entrega esperada do agente de codificação

Ao finalizar, apresentar:

1. resumo das alterações;
2. lista de arquivos criados;
3. lista de arquivos modificados;
4. decisões de layout tomadas;
5. fatos que precisaram ser corrigidos ou suavizados após consulta às fontes;
6. limitações ou dados que permaneceram como “não documentado”;
7. instruções curtas para testar localmente;
8. confirmação de que nenhum framework, pacote ou dependência foi adicionado.

Comando de teste local sugerido:

```bash
python3 -m http.server 8000
```

Depois acessar:

```text
http://localhost:8000/comparacao.html
```
