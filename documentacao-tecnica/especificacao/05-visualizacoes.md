# 5. Visualizações

## 5.1 Treemap (`espaco/visualizacao/treemap/`, D3.js v4.13.0)

`VisualizacaoTreemap` mantém uma hierarquia D3 (`d3.hierarchy` → `.sum(d => d.importancia)` →
`d3.treemap().size([largura, altura])`) construída a partir de `this.visualizacao.elementos` — o
tamanho de cada retângulo é proporcional à `importancia` do elemento correspondente. As ações
`aumentar`/`diminuir`/`maximizar`/`minimizar`/`restaurar` (herdadas de `Visualizacao`) simplesmente
multiplicam/recalculam esse valor e chamam `renderizar()`, que refaz o layout.

Cada folha da hierarquia vira um elemento customizado `<elemento-treemap>` (join por chave —
`d.data.id`, que é o `uuid` do `elemento_visualizacao` — via `.data(dados, chave)`, então nós
existentes são reaproveitados em vez de recriados a cada atualização de layout). Os atributos
`uuid_elemento_visualizacao`, `uuid_visualizacao` e `uuid_elemento` são atribuídos via `.attr()` do
D3 na fase de *enter* (criação); a fase de *update* anima posição/tamanho via `.transition()`.

A borda de cada nó e o fundo de área sem conteúdo (`visualizacao_treemap.css`) usam a paleta neutra
descrita na seção do design visual (fora do escopo desta especificação técnica).

## 5.2 Janelas (`espaco/visualizacao/janela/`, jsPanel v4.13.0)

`VisualizacaoJanelas` cria um `jsPanel` (janela flutuante arrastável/redimensionável, com chrome
nativo de minimizar/maximizar/fechar) por elemento da visualização (`criarPainel(elemento)`), com um
`<elemento-janela>` no conteúdo do painel.

### Título dinâmico

Antes de criar o painel, busca a `descricao` do elemento global (`LeitorEspacoDB.getInstance().
elemento(elemento.uuid_elemento)`) e compõe o `headerTitle` como `"{descrição} — {nome do
componente}"`.

### Fechar = remover de verdade

O botão de fechar **nativo** do jsPanel (`onclosed`) dispara `Evento.ACAO_FECHAR_ELEMENTO` — ou seja,
fechar a janela remove o elemento da visualização de fato (persistindo a remoção), não apenas oculta o
painel visualmente. Como consequência, `VisualizacaoJanelas.remover()` (chamado quando a visualização
inteira é substituída, por exemplo ao trocar para o treemap) precisa **distinguir** "estou trocando de
visualização" de "o usuário fechou esta janela": ela fecha todos os painéis programaticamente, o que
também dispararia `onclosed` para cada um — sem uma flag (`this.removendoTudo`, setada antes de
iniciar o fechamento em lote e checada dentro de `onclosed` antes de disparar a ação), trocar de
visualização apagaria todos os elementos da base.

### Ícones duplicados

Como o jsPanel já fornece chrome nativo de janela, os ícones equivalentes de `Elemento`
(minimizar/restaurar/maximizar/fechar — pensados originalmente só para o treemap, que não tem chrome
de janela nenhum) são escondidos quando o elemento está dentro de uma `ElementoJanela` (ver 3.3).

## 5.3 Comparação com o padrão do treemap

A troca de visualização (`Espaco.mudarVisualizacao()`) alterna entre os dois índices de
`Espaco.VISUALIZACOES_DISPONIVEIS`, recriando a visualização do zero a cada troca — nenhum estado de
layout específico de uma visualização (posição de janela, por exemplo) sobrevive à troca para a
outra, só os dados de `importancia`/ordem dos elementos, que são compartilhados.
