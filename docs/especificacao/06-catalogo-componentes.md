# 6. Catálogo de componentes de conteúdo

Estes são os componentes carregáveis dinamicamente dentro de um `Elemento` (seção 3.3), listados em
`ConfiguracoesPadrao.base.componentes` (seção 4.2). Todos estendem `ComponenteBase` diretamente
(nenhum usa `ComponenteReativo`/a DSL de template da seção 2.2 — cada um implementa seu próprio
binding de dados manualmente via `dados`/`attributeChangedCallback`).

## 6.1 Visualizadores de mídia

| Componente | Tag | Formato de `dados` | Observações |
|---|---|---|---|
| `ExibidorImagem` | `exibidor-imagem` | `{src}` | Trivial: define `<img src>`. Tem um bloco morto de fetch/data-URI comentado, nunca executado. |
| `ExibidorIframe` | `exibidor-iframe` | `{src}` | Trivial: define `<iframe src>`. Mesmo bloco morto comentado que `ExibidorImagem`. |
| `ExibidorVideo` | `exibidor-video` | `{src: videoId, acoes: [{tempo, ...}]}` | Envolve a YouTube IFrame API (`YT.Player`). Depende de um objeto global `YT` (script da API do YouTube) carregado fora do componente; escuta `Evento.EVENTO_PLAYER_YOUTUBE_CARREGADO`. Faz *polling* do tempo de reprodução a cada 300ms e dispara `EVENTO_EXECUTAR_ACAO` para cada ação cujo timestamp já foi ultrapassado. |
| `ExibidorCamera` | `exibidor-camera` | `{deviceId}` | Lista câmeras (`enumerateDevices`), `getUserMedia({video})`, exibe e grava (MediaRecorder → download em webm). |
| `VisualizadorSom` | `visualizador-som` | `{deviceId}` | Mesmo padrão do `ExibidorCamera`, mas para áudio: onda/barras via `AnalyserNode` + canvas, gravação MediaRecorder. |

## 6.2 Dispositivos

`ExibidorDispositivos` (`exibidor-dispositivos`) lista todos os dispositivos de mídia
(`navigator.mediaDevices.enumerateDevices()`) e cria um `ExibidorDispositivo`
(`exibidor-dispositivo`) filho por entrada; `dados` é um dicionário `idDispositivo →
{descricao, dadosMediaAPI, disponivel}`, **reconstruído do zero a cada renderização** — há um `TODO`
no código reconhecendo que dispositivos não podem ser rastreados de forma estável entre sessões, o
que torna a lógica de mesclagem de "disponível" praticamente código morto.

`ControladorDispositivos` (`controlador_dispositivos.js`) é o "roteador": escuta
`EVENTO_SELECAO_OBJETO` vindo de um `exibidor-dispositivos` e despacha `ACAO_ADICIONAR_ELEMENTO` para
criar um `exibidor-camera` (se `kind === 'videoinput'`) ou `visualizador-som` (áudio) correspondente.

## 6.3 Dados e grafos

| Componente | Tag | Formato de `dados` | Observações |
|---|---|---|---|
| `EditorJSON` | `editor-json` | qualquer JSON, ou `{src:"...json"}` | Envolve a biblioteca `jsoneditor` (modo árvore), importada dinamicamente com sucesso. Emite `change` nativo e `EVENTO_SELECAO_OBJETO` ao clicar num nó. |
| `VisualizadorDiferencasJSON` | `visualizador-diferencas-json` | `{esquerda, direita}` | Usa `jsondiffpatch.formatters.html`. **Depende de um global** `window.jsondiffpatch` — o import dinâmico está comentado com a nota explícita de que a importação ESM não funciona para essa biblioteca; precisa ser carregada via `<script>` na página. |
| `GeradorUUID` | `gerador-uuid` | string (UUIDs separados por linha) | `crypto.randomUUID()`, sem dependências externas. |
| `SeletorMeses` | `seletor-meses` | array de `{ano, mes, selecionado}`, ou `{src:"url"}` | Grade de checkboxes ano×mês. Dispara `change` e `EVENTO_SELECAO_OBJETO`. |
| `GrafoBases` / `GrafoIndexedDB` | `grafo-bases` / `grafo-indexeddb` | `{bases:{...}}` ou `{src}` (o primeiro); nenhum atributo de entrada no segundo, que varre **todos os bancos IndexedDB do navegador** | Renderiza um grafo vis.js (sistema→base→campo). `GrafoIndexedDB` inspeciona `indexedDB.databases()` e infere o esquema a partir dos registros encontrados — não usa a camada `EspacoDB`/`LeitorEspacoDB`. |
| `GrafoEquipe` | `grafo-equipe` | `{mes, ano, nome, escala, equipes}` (árvore auto-referente) | Organograma vis.js de escala de equipe; forma/cor do nó codifica o cargo. |

`GrafoBases` e `GrafoEquipe` **dependem de um global `window.vis`** (vis.js) — o `import()` dinâmico
da biblioteca está comentado (`TODO`) em ambos; se nada mais na página carregar `vis.js` globalmente,
esses dois componentes falham silenciosamente (`vis is not defined`).

Não existe uma camada `leitor`/`escritor` para dados de grafo equivalente à de `EspacoDB` — `GrafoBases`
e `GrafoIndexedDB` acessam o IndexedDB diretamente.

## 6.4 Interface do Espaço

`Configuracao` (`configuracao-espaco`, em `espaco/configuracao/configuracao.js`) é o componente que
implementa a tela de configuração inline de um `Elemento` (troca de componente, edição de dados via
`editor-json`, exportação da configuração como JSON para download). `ConfiguracoesPadrao.base` (no
mesmo diretório) é o manifesto de componentes/controladores padrão descrito na seção 4.2.

## 6.5 Stub não funcional

`ContatosView` / `ContatoView` (`contatos-visualizacao` / `contato-visualizacao`) são cascas vazias:
o construtor registra `EVENTO_CARREGOU` com corpo de callback vazio, os templates HTML contêm
*mockups* estáticos com dados fictícios ("Fernando, Regina, Mesquita...") sem nenhum binding real, e
os arquivos CSS estão vazios. Não há tratamento de `dados`/atributos — é uma funcionalidade iniciada
e nunca terminada.

## 6.6 Controladores auxiliares

Além de `ControladorDispositivos` (6.2), há `ControladorVisualizadorDiferencasJSON`
(`dados/json/diferencas/controlador_visualizador_diferencas_json.js`): escuta
`EVENTO_VISUALIZACAO_ATUALIZADA`, localiza elementos `visualizador-diferencas-json` numa
visualização e alimenta automaticamente `esquerda`/`direita` com os dados dos elementos vizinhos.
Contém um bug de digitação (`visualizacao.elementos.lenght` em vez de `.length`) que quebra a
detecção do vizinho da direita para o último elemento de uma visualização (ver seção 8.5).
