# 3. Sistema Espaço / Visualização / Elemento

A aplicação de referência do Ultima é composta por três camadas de classes que se encaixam:

```
Espaco (espaco-ultima)                          — orquestrador raiz, um por página
  └─ Visualizacao (visualizacao-treemap | visualizacao-janelas)
       └─ Elemento (elemento-treemap | elemento-janela)
            └─ <componente de conteúdo carregado dinamicamente>  (ver seção 6)
```

## 3.1 `Espaco` (`src/html/componentes/espaco/espaco.js`)

Tag: `espaco-ultima`. Estende `ComponenteBase` com Shadow DOM. É o único componente instanciado
diretamente no `index.html` da aplicação (`<espaco-ultima src="./configuracao_ultima.json">`).

### Carregamento inicial

1. O atributo `src` (observado) aponta para um JSON de configuração. No `attributeChangedCallback`,
   `_src` é resolvido para uma **URL absoluta** (`new URL(novoValor, document.baseURI)`) antes de
   fazer o `fetch` — necessário porque, mais adiante, `gerarCaminhoAbsolutoURL()` usa `_src` como base
   para resolver os caminhos dos componentes/controladores declarados no JSON; se `_src` ficasse como
   caminho relativo, `new URL(relativo, relativo)` lança `TypeError: Invalid base URL`.
2. `carregarConfiguracao()` consulta `LeitorEspacoDB.getInstance().visualizacoes()`:
   - Se já existir alguma visualização persistida no IndexedDB, usa o que está lá e ignora o restante
     do JSON (exceto os componentes/controladores, que são sempre reseedados — ver seção 4.1).
   - Se não existir nenhuma (primeira execução), grava no banco os `elementos`, `componentes`,
     `acoes`, `controladores` e a primeira `visualizacao` do JSON.
3. `renderizar()` — guardado por `!this.renderizado` — carrega os controladores (`import()` dinâmico
   de cada um, instanciando a classe declarada), cria as ações do cabeçalho (fullscreen, ajuda,
   configuração, mudar visualização) e chama `criarEIniciarControleNavegador()`.

O construtor registra um listener de `EVENTO_CARREGOU` **com a checagem de `composedPath()[0]`**
(ver seção 2.1) que dispara `carregarConfiguracao()` — este listener é o mecanismo correto e
confiável de iniciar o carregamento; depender apenas do `attributeChangedCallback('src', ...)` é
insuficiente porque ele corre em paralelo com o carregamento do próprio template do `Espaco`, e se o
`fetch` da configuração + leitura do IndexedDB terminarem antes do template, a tentativa de
renderizar não faz nada (guardada por `super.carregado`) e nada tenta de novo depois — resultado:
página em branco com os dados intactos no banco (bug real corrigido durante a auditoria deste
código; ver seção 8.3).

### `criarEIniciarControleNavegador()`

Remove a visualização ativa (se houver), cria uma nova instância de
`Espaco.VISUALIZACOES_DISPONIVEIS[this.indiceVisualizacaoSelecionado]`
(`["visualizacao-janelas", "visualizacao-treemap"]`, índice inicial `1` = treemap — **não
persistido**: toda recarga de página volta para o treemap, independentemente de qual visualização
estava ativa antes) e a alimenta com `this.visualizacoes[0]` (única visualização suportada
atualmente — há um `TODO` no código reconhecendo essa limitação).

Os listeners de eventos que ligam `Espaco` aos controladores e à visualização ativa
(`EVENTO_SELECAO_OBJETO`, `EVENTO_VISUALIZACAO_ATUALIZADA`, `EXECUTAR_ACAO`,
`EVENTO_ATUALIZACAO_VISUALIZACAO`, `EVENTO_ATUALIZACAO_ELEMENTO`, `EVENTO_ELEMENTO_ATUALIZADO`) são
registrados em `this` (o próprio `Espaco`) e nos controladores — e **só uma vez**, controlado por uma
flag (`this.listenersDeNavegacaoRegistrados`), porque `criarEIniciarControleNavegador()` roda a cada
troca de visualização, mas os listeners não devem ser recriados a cada troca (bug real corrigido: sem
a flag, cada troca de visualização empilhava mais um listener idêntico, e uma única ação do menu
passava a executar N vezes).

### Ações (`executarAcao`)

Uma tabela nome→função mapeia cada `Evento.ACAO_*` (ver seção 4.3) para um método de `Espaco` ou da
`Visualizacao` ativa. Para adicionar uma ação nova, é preciso declará-la em `Evento.ACOES` **e**
adicioná-la a essa tabela.

`adicionarElemento(configuracoes)` cria um novo par `elemento`/`elemento_visualizacao`, calcula a
`importancia` inicial do novo elemento como a **média das importâncias dos elementos já existentes na
visualização** (`mediaImportancia`) — com um caso especial: se não houver nenhum elemento ainda, a
importância é `1`, não `0` (bug real corrigido: `0/0` produz `NaN`, e o código original tratava
`NaN` como `0` via `|| 0`; um elemento com importância `0` recebe área zero no layout do treemap D3 e
fica invisível, mesmo persistido corretamente no banco).

### Sincronização entre `this.visualizacoes[0]` e a visualização ativa

`atualizarVisualizacao(detalhes)` persiste a visualização ativa no IndexedDB sempre que ela muda
(fechar elemento, reordenar, aumentar/diminuir). É essencial que, depois de persistir, `this.
visualizacoes[0]` (a cópia em memória do `Espaco`, usada por `criarEIniciarControleNavegador()` para
montar a **próxima** visualização ao trocar) seja resincronizada com o que acabou de ser persistido —
`this.visualizacoes[0] = structuredClone(this.visualizacao.visualizacao)`. Sem essa sincronização
(bug real corrigido), qualquer mudança feita na visualização ativa ficava só no clone interno dela e
"voltava" — reaparecia um elemento já fechado, por exemplo — na troca de visualização seguinte,
porque a nova visualização era montada a partir da cópia desatualizada de `Espaco`.

## 3.2 `Visualizacao` / `VisualizacaoTreemap` / `VisualizacaoJanelas`

Classe base abstrata (`espaco/visualizacao/visualizacao.js`) + duas implementações concretas
(`treemap/visualizacao_treemap.js`, `janela/visualizacao_janelas.js`), ambas com Shadow DOM. Provê o
cabeçalho/rodapé com o menu de ações (construído a partir de `LeitorEspacoDB`), a integração com
`ResizeObserver` (`processarNovasDimensoes` → `renderizar()`) e a API comum de ações
(`aumentar`/`diminuir`/`maximizar`/`minimizar`/`restaurar`/`fechar`/`irParaTras`/`irParaFrente`/
`irParaInicio`/`irParaFim`), implementada via `encontrarEAplicarMudanca()` sobre o array
`this.visualizacao.elementos` (um clone local, independente de `Espaco.visualizacoes[0]` — ver 3.1
sobre a necessidade de resincronizar).

A guarda de `processarNovasDimensoes` compara a nova largura/altura com a última observada e ignora
chamadas repetidas com o mesmo valor, evitando trabalho redundante quando o `ResizeObserver` reporta a
mesma dimensão mais de uma vez.

Detalhes de cada implementação estão na seção 5 (Visualizações).

## 3.3 `Elemento` / `ElementoTreemap` / `ElementoJanela`

Classe base (`espaco/visualizacao/elemento.js`, **sem** Shadow DOM — `shadowDOM:false`) + duas
implementações finas (`treemap/elemento_treemap.js`, `janela/elemento_janela.js`, cada uma só
registrando a tag customizada). Representa um elemento individual dentro de uma visualização:
resolve, via `LeitorEspacoDB`, o registro `elemento_visualizacao` → `elemento` → `componente`
correspondentes aos atributos `uuid_elemento_visualizacao`/`uuid_visualizacao` que a visualização lhe
atribui, importa dinamicamente o módulo do componente declarado e o instancia dentro de
`#containerComponente`.

Também provê a tela de configuração inline (troca de componente, editor JSON dos dados) e a barra de
controles (`.controles_janela` em `elemento.html`) com os ícones de configuração,
aumentar/diminuir/reordenar e — historicamente — minimizar/restaurar/maximizar/fechar. Esses últimos
quatro ícones são escondidos especificamente quando o elemento está dentro de uma
`ElementoJanela` (`this.tagName.toLowerCase() === 'elemento-janela'`), porque o jsPanel já fornece
esse chrome nativamente (ver seção 5.2) — mantê-los visíveis ali seria um controle duplicado.

O listener de `EVENTO_CARREGOU` no construtor de `Elemento` também precisa da checagem de
`composedPath()[0] !== this` (não apenas `evento.target !== this`): sem ela, o carregamento de
**qualquer** componente de conteúdo aninhado dentro de `#containerComponente` (que quase sempre tem
seu próprio Shadow Root) reentra no listener, que reexecuta `carregarComponente()` sem nenhuma trava —
anexando outra instância do componente a cada disparo, que por sua vez dispara outro
`EVENTO_CARREGOU`, num loop sem fim que chegou a empilhar milhares de instâncias do mesmo componente
por segundo antes de ser corrigido.
