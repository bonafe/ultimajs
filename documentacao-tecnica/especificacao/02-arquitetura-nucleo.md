# 2. Arquitetura do núcleo

Todo componente do framework estende, direta ou indiretamente, `ComponenteBase`
(`src/html/componentes/componente_base.js`). Componentes que precisam de data binding declarativo
estendem `ComponenteReativo` (`componente_reativo.js`), que por sua vez estende `ComponenteBase`.

## 2.1 `ComponenteBase`

Infraestrutura comum: carregamento de template HTML externo, isolamento via Shadow DOM opcional,
resolução de caminhos relativos, e um protocolo de "carregamento em cadeia" que sincroniza quando um
componente e todos os seus filhos terminaram de montar.

### Construtor

```js
constructor(propriedades, url_herdeiro)
```

- `propriedades.templateURL` — caminho (relativo ao módulo JS do componente) do arquivo HTML do template.
- `propriedades.shadowDOM` — `true` para anexar um Shadow DOM (`mode:'open'`) e isolar estilos/DOM;
  `false` para renderizar diretamente como filhos do próprio elemento (luz/light DOM).
- `url_herdeiro` — sempre `import.meta.url` da classe filha; usado para resolver `templateURL` e
  demais caminhos relativos ao arquivo `.js` do componente, não ao HTML da página.

### Ciclo de carregamento

1. `carregarTemplate()` faz `fetch()` do HTML, extrai as tags `<link>` (CSS) e `<script>` do
   documento, corrige caminhos relativos de `img`/`a`/`audio`/`video`/`source`/`iframe`/`embed`/
   `object`/`track`/`area`/`meta` para apontar para a URL do componente (não da página), carrega CSS
   e scripts em paralelo, e só então anexa o conteúdo ao DOM (`no_raiz`).
2. `observar()` cria um `ResizeObserver` sobre o primeiro elemento com classe `.observado` dentro do
   componente, chamando `this.processarNovasDimensoes(largura, altura)` (método opcional, definido
   pelas subclasses que precisam reagir a redimensionamento — ex: `Visualizacao`).
3. `verificar_carregamento()` percorre recursivamente os descendentes que também são `ComponenteBase`
   (incluindo Shadow DOM) e só dispara `EVENTO_CARREGOU` quando **todos os filhos** já dispararam o
   deles — é assim que a árvore de componentes sinaliza "terminei de montar, incluindo tudo dentro de
   mim" de baixo para cima.

### `ComponenteBase.EVENTO_CARREGOU` (`"carregou_componente"`)

Este é o evento mais importante do framework e também a fonte do bug mais recorrente encontrado
durante a auditoria deste código (ver seção 8.1). Características:

- Despachado com `{ bubbles: true, composed: true }` — atravessa fronteiras de Shadow DOM e sobe até
  o topo do documento.
- **Qualquer listener que reaja a este evento precisa verificar a origem real antes de agir**, porque
  ele borbulha de *qualquer* descendente (inclusive componentes aninhados dentro de listas, dentro de
  outros Shadow DOMs) e não só do elemento no qual o listener foi registrado.
- A forma ingênua de checar a origem — `if (evento.target !== this) return;` — **não é suficiente**
  quando o descendente que disparou o evento tem seu próprio Shadow Root: o navegador faz
  *retargeting* do evento ao cruzar a fronteira do Shadow DOM, e `evento.target` aparece como se fosse
  o próprio elemento observador, mesmo vindo de um descendente diferente. A forma correta é:

  ```js
  this.addEventListener(ComponenteBase.EVENTO_CARREGOU, (evento) => {
      if (evento.composedPath()[0] !== this) {
          return;
      }
      // ... reagir ao próprio carregamento
  });
  ```

  `composedPath()[0]` sempre revela o alvo real, independente de quantas fronteiras de Shadow DOM o
  evento tenha cruzado. Vários componentes do projeto já foram corrigidos para usar esse padrão;
  outros ainda usam a checagem ingênua e funcionam apenas porque, na topologia atual, não têm
  descendentes com Shadow DOM próprio entre eles e a origem esperada (ver seção 8.1 para o
  levantamento completo).

### Outros métodos relevantes

- `resolverEndereco(endereco)` / `ComponenteBase.resolverEndereco(endereco, url_base)` — resolve uma
  URL relativa ou absoluta contra a base do componente (`import.meta.url` do herdeiro).
- `carregado` (getter) — `true` depois que `verificar_carregamento()` confirma que o componente e
  todos os descendentes terminaram de montar.
- `no_raiz` (getter) — o Shadow Root ou o próprio elemento, dependendo de `shadowDOM`.
- `connectedCallback()` / `disconnectedCallback()` / `adoptedCallback()` — vazios por padrão, para
  subclasses sobrescreverem.

## 2.2 `ComponenteReativo`

Adiciona reatividade declarativa via atributos `data-*` no template HTML. Reformulado por completo
(ver seção 8 para o estado anterior, que tinha a maior parte destes recursos desligada ou quebrada).

### Dados

```js
get dados()              // retorna this.#dados
set dados(novosDados)    // serializa em data-dados e chama atualizar_dados()
```

O atributo HTML `data-dados` é observado (`observedAttributes = ['data-dados']`); mudanças nele (via
`setAttribute` externo) ou via o setter `dados` só prosseguem se o conteúdo realmente mudou. A
deduplicação é feita comparando **strings serializadas** contra um cache da última forma serializada
dos dados (`#ultimo_json_dados`): no caminho do atributo, a string recebida é comparada diretamente
(sem nem fazer `JSON.parse` quando idêntica); no caminho do setter, o objeto é serializado uma única
vez e a mesma string é reaproveitada para escrever no atributo. Esse mesmo cache é o que corta o eco
do próprio `setAttribute` (o `attributeChangedCallback` dispara sincronamente dentro dele).

### Pontos de extensão (sobrescritos pelas subclasses)

```js
computadas()     // -> Object    propriedades derivadas de this.dados
observadores()   // -> Object    { "caminho": (novoValor, valorAntigo) => {...} }
```

`computadas()` roda a cada renderização e seu retorno é mesclado com os dados brutos (as chaves de
`computadas()` vencem em caso de conflito), formando os **dados efetivos** usados em absolutamente
todo binding — `data-mapa`, `data-se`, `data-classe`, `data-estilo`, `data-lista`. Uma propriedade
computada, portanto, é lida exatamente como um dado normal em qualquer parte do template.

`observadores()` é consultado depois de cada `renderizar()` bem-sucedido: para cada caminho
declarado, compara o valor novo com o valor da renderização anterior (busca em dados brutos +
computadas) e chama o callback só se o valor mudou. Na primeira renderização, `valorAntigo` é sempre
`undefined`.

### DSL de template

| Atributo | Onde | Sintaxe | Efeito |
|---|---|---|---|
| `data-mapa` | qualquer elemento | `{"atributo":"caminho.no.dado"}` | Binding de atributo/propriedade nos dois sentidos (ver 2.2.1) |
| `data-classe` | qualquer elemento | `{"nome-da-classe":"caminho.booleano"}` | Liga/desliga classes CSS via `classList.toggle` |
| `data-estilo` | qualquer elemento | `{"propriedade-css":"caminho"}` | Define `style.propriedade` a partir de um valor |
| `data-ref` | qualquer elemento | `"nome"` | Expõe o elemento em `this.refs.nome` após renderizar (vira array se houver mais de um com o mesmo nome) |
| `data-se` | `<template>` | `"caminho"` | Início de uma cadeia condicional |
| `data-senao-se` | `<template>` | `"caminho"` | Continuação da cadeia (irmão consecutivo de `data-se`) |
| `data-senao` | `<template>` | (sem valor) | Fallback incondicional, encerra a cadeia |
| `data-lista` | `<template>` | `"item in caminho"`, `"item, indice in caminho"`, sufixo opcional `" : campoChave"` | Repete o conteúdo para cada elemento de um array; com chave, reconcilia reaproveitando nós DOM (ver 2.2.3) |

Qualquer caminho usado em `data-se`, `data-senao-se` ou como chave de `data-classe` aceita um `!` na
frente para negar (ex: `data-se="!carregando"`).

#### 2.2.1 `data-mapa` — binding de atributo/propriedade

No sentido dado → DOM, o valor lido no caminho é aplicado ao elemento seguindo uma ordem de casos
especiais antes de cair no genérico `setAttribute`:

1. `atributo_elemento === "textContent"` → `elemento.textContent = valor`.
2. `atributo_elemento === "checked"` → `elemento.checked = !!valor` (necessário para `<input
   type="checkbox">`; `setAttribute("checked", ...)` só afetaria o estado *inicial* do elemento, não
   o estado atual já renderizado).
3. `<input type="datetime-local">` → conversão de fuso horário e formatação ISO truncada.
4. `atributo_elemento === "value"` → `elemento.value = valor` (idem ao caso `checked`: `value` é uma
   propriedade viva, não um atributo estático).
5. Caso genérico → `elemento.setAttribute(atributo, valor)` (serializando para JSON se `valor` for
   objeto) — é este o caminho usado para compor componentes reativos aninhados via
   `data-mapa='{"data-dados":"caminho"}'`, já que `setAttribute("data-dados", ...)` no filho dispara
   o `attributeChangedCallback` dele.

No sentido DOM → dados (dois sentidos / two-way binding), qualquer elemento com `data-mapa` recebe um
listener de `change`. Ao disparar, para cada par `{atributo: caminho}` do mapa:

1. Lê o valor atual do elemento (`#lerValorAtributo`) — com casos especiais simétricos aos da tabela
   acima: `checked` lê `elemento.checked`; `data-dados` lê `elemento.dados` (a própria API do
   componente reativo filho, não o atributo HTML — ler `elemento["data-dados"]` como propriedade JS
   não funcionaria, já que não é um nome de propriedade válido); qualquer outro caso lê
   `elemento[atributo]` diretamente (cobre `value` e casos customizados).
2. Escreve o valor no objeto de dados correto do escopo (ver 2.2.4) via `atualizar_valor`.
3. Notifica e re-renderiza diretamente — **sem** passar pelo `atualizar_dados()` público, porque a
   escrita do passo 2 já mutou `this.#dados` (ou um objeto vivo referenciado por ele) *antes* deste
   ponto, e `atualizar_dados()` compara "antes" com "depois" — nesse momento os dois já seriam
   idênticos, e a comparação nunca veria diferença (ver seção 8.2 para o histórico deste bug).

`atualizar_valor(objeto, caminhos, valor)` tem um comportamento não óbvio: se o valor já existente no
caminho e o novo valor são ambos objetos (não array), faz `Object.assign` nas propriedades do objeto
**existente** em vez de substituir a referência. Isso é essencial para o caso de um componente
aninhado devolver o item inteiro de volta (`data-mapa='{"data-dados":"item"}'`): sem esse cuidado, a
escrita trocaria a referência guardada apenas no objeto de escopo temporário do render atual, e a
mutação se perderia no próximo ciclo — o array real dentro de `this.#dados` continuaria apontando
para o objeto antigo.

#### 2.2.2 Condicionais — `data-se` / `data-senao-se` / `data-senao`

Um grupo condicional é uma sequência de `<template>` irmãos consecutivos, começando por `data-se`, com
zero ou mais `data-senao-se`, terminando opcionalmente em um único `data-senao`:

```html
<template data-se="exibir_observacoes">...</template>
<template data-senao-se="exibir_endereco">...</template>
<template data-senao>...</template>
```

A cada renderização, o grupo inteiro é reavaliado — os caminhos são avaliados em ordem e o vencedor é
o primeiro `<template>` verdadeiro (ou o `data-senao`, se nenhum dos anteriores for verdadeiro). Se o
vencedor for **o mesmo** `<template>` da renderização anterior (inclusive o caso de nenhum ramo bater
nas duas vezes), o conteúdo gerado **não é destruído/recriado** — só reprocessado no lugar com o
escopo atual. Só quando o vencedor muda é que o conteúdo anterior é removido e o `.content` do novo
vencedor é clonado e inserido logo após o último `<template>` do grupo.

Essa preservação de identidade entre renderizações com o mesmo ramo é o que permite que um
`data-lista` com chave (seção 2.2.3) viva dentro de um `data-se` sem perder a reconciliação a cada
render: a memória de reconciliação é indexada pelo próprio elemento `<template data-lista>`, que
deixaria de ser o mesmo objeto (e a reconciliação recomeçaria do zero a cada vez) se o ramo condicional
fosse reclonado toda renderização, mesmo sem o resultado da condição ter mudado.

#### 2.2.3 Listas — `data-lista`

```html
<template data-lista="endereco in enderecos : uuid">
    <br-endereco data-mapa='{"data-dados":"endereco"}'></br-endereco>
</template>
```

Sintaxe: `"item in caminho"`; opcionalmente `"item, indice in caminho"` (expõe também o índice) e um
sufixo `" : campo"` que declara a **chave de identidade** dos itens.

Com chave utilizável, a renderização faz **reconciliação por chave**: os nós DOM de um item cuja
chave continua presente na lista são reaproveitados e apenas movidos para a nova posição (e somente
os que estão fora do lugar — numa lista sem reordenação nenhum nó é tocado), em vez de destruídos e
recriados. Isso preserva estado de DOM que não vem dos dados (foco, scroll, seleção, estado interno
de componentes aninhados) e reduz o custo de mudanças pequenas em listas grandes. Os bindings dos nós
reaproveitados são reaplicados com o escopo novo a cada renderização, então o conteúdo permanece
correto mesmo que o objeto do item tenha sido substituído por outro equivalente.

A chave vem, nesta ordem: (1) do sufixo explícito `" : campo"`; (2) de inferência automática — se
todos os itens forem objetos com `uuid`, usa `uuid`; senão, idem para `id` (as duas convenções de
identidade já usadas pelo `EspacoDB`). Chaves só são consideradas utilizáveis se todas existirem e
forem únicas naquela passada; qualquer chave ausente ou duplicada faz a lista recuar, naquela
renderização, para o **modo sem chave** — o comportamento clássico de remover tudo e reconstruir —
em vez de arriscar reaproveitar os nós do item errado. Listas sem chave nenhuma usam sempre esse modo.

Nós de topo do conteúdo do template que sejam apenas indentação (texto em branco) ou comentários são
descartados na clonagem: não participam de nenhum binding e, soltos entre os itens gerados,
acumulariam a cada re-render e impediriam a detecção de "já está no lugar" do reordenamento (que se
baseia na adjacência via `nextSibling`, ancorada no próprio `<template>`, antes do qual os itens
sempre vivem).

#### 2.2.4 Modelo de escopo

Cada nível de aninhamento (raiz do componente, cada ramo condicional resolvido, cada item de lista)
tem um objeto de escopo com dois campos:

- `dados` — os dados *de leitura*, sempre um objeto achatado (`{...escopoPai.dados, [variavel]:
  item}`), incluindo dados brutos + computadas na raiz. Usado por `data-mapa`, `data-se`,
  `data-classe`, `data-estilo` e para resolver o array de `data-lista`.
- `bruto` — os dados *de escrita*, usado exclusivamente pelo binding bidirecional. Na raiz é a própria
  referência de `this.#dados`; em um item de lista é `{...escopoPai.bruto, [variavel]: item}`, onde
  `item` é a referência viva ao objeto dentro do array real — por isso escrever em
  `"variavel.campo"` propaga corretamente para dentro de `this.#dados`, mesmo vários níveis de lista
  abaixo.

A renderização é recursiva: `#processarEscopo(raiz, escopo)` faz **uma única travessia** da
subárvore (`#coletarBindings`), classificando todos os bindings de uma vez — condicionais, listas,
`data-mapa`, `data-classe` e `data-estilo` — em vez de uma varredura (`querySelectorAll` + filtro de
ancestrais) por tipo de binding. Para que um nível não reprocesse elementos que pertencem a um escopo
mais aninhado (já tratado pela recursão), cada raiz de conteúdo gerado (ramo condicional ou item de
lista) é marcada com um atributo interno de fronteira (`data-ultima-escopo`), e a travessia **poda a
subárvore inteira** ao encontrá-la (exceto quando a própria raiz da chamada é uma dessas — o caso da
recursão entrando num item de lista). Depois da coleta: condicionais, listas (cada uma recursando em
`#processarEscopo` no conteúdo gerado/reaproveitado, com o escopo apropriado) e então os bindings de
elemento.

O lado DOM → dados usa **um listener de `change` estável por elemento**, criado uma única vez (na
primeira renderização em que o elemento aparece com `data-mapa`) e nunca removido — ele morre com o
próprio elemento. O que varia entre renderizações (o mapa e o escopo vigentes) fica numa tabela
(`WeakMap` elemento → binding) atualizada a cada render e consultada na hora do evento — assim,
re-renderizar não paga mais um par `removeEventListener`/`addEventListener` por elemento, e um nó de
lista reaproveitado por chave passa a escrever automaticamente no objeto do item **novo**, mesmo que
a identidade do item tenha sido substituída entre renders. Os objetos de escopo de item, por sua vez,
encadeiam no escopo pai por protótipo (`Object.create`) em vez de copiar todos os dados do pai a cada
item.

### Ciclo de vida

O construtor registra um listener de `EVENTO_CARREGOU` (com a checagem de `composedPath()[0]`
descrita em 2.1) que chama `renderizar()` assim que o próprio componente termina de montar.
`renderizar()` também é chamado toda vez que `atualizar_dados()` processa uma mudança real, e é
seguro chamá-lo antes do componente estar `carregado` (ele simplesmente não faz nada nesse caso — os
dados já ficam guardados em `this.#dados` e a próxima chamada, disparada pelo evento de carregamento,
os aplica).
