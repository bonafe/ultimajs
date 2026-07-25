# 8. Débito técnico conhecido

Esta seção documenta o que ainda está pendente ou é uma armadilha conhecida no código, levantado por
leitura completa do repositório e testes manuais no navegador. Bugs que já foram corrigidos durante o
mesmo trabalho de auditoria estão narrados em contexto nas seções anteriores (marcados como "bug real
corrigido") — aqui só o que **continua** sem solução.

## 8.1 Retargeting de eventos em Shadow DOM — checklist de risco

A armadilha descrita na seção 2.1 (`evento.target` mente quando o descendente que disparou
`EVENTO_CARREGOU` tem seu próprio Shadow Root; é preciso usar `evento.composedPath()[0]`) foi
corrigida nos pontos onde causava sintomas visíveis (loops infinitos, re-render excessivo) durante
esta auditoria: `Espaco`, `Visualizacao`, `VisualizacaoTreemap`, `Elemento`, `ComponenteReativo`, e o
listener de exemplo em `z.exemplo/index.html`. **Não houve uma auditoria exaustiva de todo listener de
`EVENTO_CARREGOU` do projeto** — qualquer componente novo (ou ainda não revisado) que registre um
listener desse evento e tenha descendentes com Shadow Root próprio está sujeito ao mesmo bug até ser
verificado.

## 8.2 `componente_vue.js` — experimento morto

`src/html/componentes/componente_vue.js` carrega o Vue.js 2 real via CDN
(`cdn.jsdelivr.net/npm/vue@2.6.14`) — o único ponto do projeto que contraria a filosofia declarada de
não depender de bibliotecas externas em runtime (seção 1). Nenhum componente ativo o utiliza mais
(`br-endereco.js`, o único consumidor, foi migrado para `ComponenteReativo` durante este trabalho).
Candidato a remoção, mas mantido no repositório como estava — nenhuma exclusão foi feita sem
confirmação explícita.

## 8.3 Dependências de globais não carregados via `import()`

Vários componentes têm o `import()` dinâmico de sua biblioteca comentado com um `TODO`, e dependem de
um objeto global que precisa ser carregado por **outro** script na página (tipicamente uma tag
`<script>` no `index.html` de quem os usa):

- `GrafoBases` / `GrafoEquipe` → dependem de `window.vis` (vis.js).
- `VisualizadorDiferencasJSON` → depende de `window.jsondiffpatch`, com uma nota explícita no código
  de que a importação ESM não funciona para essa biblioteca especificamente.

Nenhum desses componentes verifica a presença do global antes de usá-lo — se a página que os
hospeda não carregar a biblioteca correspondente via `<script>`, eles falham silenciosamente com
`ReferenceError`.

## 8.4 Bug de digitação: `configuracoes_padrao.js`

`espaco/configuracao/configuracoes_padrao.js`, dentro de `ConfiguracoesPadrao.base.componentes`: uma
vírgula solta entre as entradas de `configuracao-espaco` e `grafo-bases` cria um buraco no array
(elision válida em JavaScript — produz um slot `undefined` em vez de erro de sintaxe). Como esse
array é reseedado no IndexedDB toda sessão (seção 4.2) via `forEach`, o slot vazio é silenciosamente
ignorado por `forEach` (que pula buracos), então o sintoma prático é discreto — mas qualquer código
que itere esse array de forma diferente (`.map()`, `for...of`, espalhamento) pode se comportar de
modo inesperado.

## 8.5 Bug de digitação: `controlador_visualizador_diferencas_json.js`

Linha ~46: `visualizacao.elementos.lenght` (typo — deveria ser `.length`). Isso quebra a detecção do
elemento vizinho à direita para o **último** elemento de uma visualização — o
`visualizador-diferencas-json` correspondente nunca recebe o dado `direita` corretamente quando é o
último elemento da lista.

## 8.6 Componente não implementado: `ContatosView`

`contatos-visualizacao` / `contato-visualizacao` (seção 6.5) são cascas vazias com *mockups* estáticos
de dados fictícios, sem nenhum binding real. Funcionalidade iniciada e nunca terminada.

## 8.7 Código morto

- `ExibidorImagem` e `ExibidorIframe` (seção 6.1) contêm, cada um, um bloco idêntico de fetch/data-URI
  totalmente comentado, nunca executado.
- `ExibidorDispositivos` (seção 6.2) reconstrói seu dicionário de dispositivos do zero a cada
  renderização, apesar de ter lógica de mesclagem de estado "disponível" escrita — um `TODO` no
  próprio código reconhece que dispositivos não podem ser rastreados de forma estável entre sessões,
  tornando essa lógica de mesclagem efetivamente inatingível.

## 8.8 Limitações arquiteturais conhecidas

- **Uma única visualização suportada por vez.** Há um `TODO` explícito em `Espaco` reconhecendo que só
  `this.visualizacoes[0]` é usado — o modelo de dados suporta múltiplas visualizações (array
  `visualizacoes` inteiro), mas nada na UI permite alternar entre elas além do índice fixo `[0]`.
- **`indiceVisualizacaoSelecionado` não é persistido.** Toda recarga de página volta para o treemap
  (índice `1`), independente de qual visualização (treemap ou janelas) estava ativa antes de recarregar.
- **Renderização de lista sem chave ainda reconstrói tudo.** `data-lista` do `ComponenteReativo` faz
  reconciliação por chave quando há uma chave utilizável (sufixo `" : campo"`, ou `uuid`/`id`
  inferidos — ver seção 2.2.3); listas **sem** chave continuam removendo e reconstruindo todos os
  itens a cada renderização.
- **`dist/v1.0b/` é uma cópia manual.** O deploy de produção (seção 7.2) depende de rodar
  `rotina_de_deploy.sh`; não há CI/CD nem verificação automática de que `dist/v1.0b/` reflete o
  `src/html/` atual — é possível (e fácil) esquecer de rodar o script e servir uma versão desatualizada.
- **Sem testes automatizados.** Não há suíte de testes (unitários, de integração ou end-to-end) em
  nenhuma parte do repositório. Toda verificação de comportamento até o momento desta especificação foi
  feita manualmente no navegador.
- **Sem camada de modelo dedicada para dados de grafo.** `GrafoBases`/`GrafoIndexedDB` acessam o
  IndexedDB diretamente, sem seguir o padrão Leitor/Escritor usado por `EspacoDB` (seção 4.2).

## 8.9 Onde este documento pode ficar desatualizado

Esta especificação reflete uma leitura pontual do código. Mudanças estruturais futuras (novos
componentes, novas versões de biblioteca, mudanças no esquema do IndexedDB — que exigiriam incrementar
`EspacoDB.VERSAO` e adicionar uma nova função de upgrade) não são refletidas automaticamente aqui;
requer revisão manual quando o código evoluir de forma significativa.
