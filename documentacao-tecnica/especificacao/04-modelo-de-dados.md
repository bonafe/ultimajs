# 4. Modelo de dados

Todo o estado da aplicação Espaço é persistido no **IndexedDB do navegador** — não há backend de
aplicação; o servidor (Python local ou Apache em produção) serve apenas arquivos estáticos.

## 4.1 `DBBase` (`src/html/componentes/db/db_base.js`)

Wrapper genérico sobre IndexedDB, `extends EventTarget`. Abre um banco por nome/versão, roda uma
sequência de funções de upgrade (`funcoesDeUpgradeVersao`, índice `n` da lista = migração para a
versão `n+1`) e dispara `EVENTO_BANCO_CARREGADO` quando pronto. `aguardarBanco()` resolve
imediatamente se o banco já carregou, ou espera o evento caso contrário.

CRUD genérico: `lerTodosRegistros(store)`, `trazerRegistro(chave, store, indice?)`,
`atualizarRegistro(registro, store)` (clona via `structuredClone` antes de gravar com `put`),
`limparObjectStore(store)`. Também expõe `DBBase.estimar_armazenamento()` via
`navigator.storage.estimate()`.

## 4.2 `EspacoDB` / `LeitorEspacoDB` / `EscritorEspacoDB`

`EspacoDB` (`espaco/modelo/espaco_db.js`) estende `DBBase`, banco `"EspacoDB"`, **versão atual: 8**.
`LeitorEspacoDB` e `EscritorEspacoDB` estendem `EspacoDB` e são singletons (`getInstance()`) —
respectivamente o lado de leitura e escrita do mesmo banco.

### Object stores (criados na migração da versão 7, "Apaga tudo e recria")

| Store | `keyPath` | Índices |
|---|---|---|
| `componentes` | `["url", "nome"]` (composta) | `index_nome_componente` (nome), `index_descricao_componente` |
| `elementos` | `uuid` | `index_titulo_elemento`, `index_descricao_elemento` |
| `visualizacoes` | `uuid` | `index_descricao_visualizacoes`, `index_titulo_visualizacoes` |
| `acoes` | `uuid` | `index_nome_acao`, `index_componente_acao` |
| `controladores` | `url` | `index_url_controlador` (única) |

### Reseed automático de componentes/controladores padrão

Toda sessão, ao carregar (`bancoBaseCarregado`), `EspacoDB.atualizarConfiguracoesPadrao()` grava (via
`put`, portanto idempotente) cada entrada de `ConfiguracoesPadrao.base.componentes` e
`.controladores` (definidos em `espaco/configuracao/configuracoes_padrao.js`) no banco — **independente**
do que estiver em `configuracao_ultima.json`. Isso significa que a lista de `componentes` no JSON de
configuração é, na prática, redundante para o funcionamento do app (os padrões já cobrem todos os
componentes de conteúdo do catálogo — seção 6) — mas ainda é o lugar correto para declarar
componentes adicionais que não fazem parte do conjunto padrão.

`ConfiguracoesPadrao.base.componentes` tem um bug conhecido: uma vírgula solta entre as entradas de
`configuracao-espaco` e `grafo-bases` cria um buraco no array (elision válida em JS, produz um slot
`undefined`) — ver seção 8.4.

### `LeitorEspacoDB` — métodos de leitura

```
componentes() / componente(nomeOuChave)
elementos() / elemento(uuid)
acoes() / acao(uuid)
visualizacoes() / visualizacao(uuid)
elemento_visualizacao(uuidVisualizacao, uuidElementoVisualizacao)
controladores()
```

`elemento_visualizacao(uuidVisualizacao, uuidElementoVisualizacao)` não é um lookup direto: busca o
registro inteiro de `visualizacoes` pelo `uuidVisualizacao` e faz `.elementos.find(e => e.uuid ==
uuidElementoVisualizacao)` dentro do array embutido — ou seja, os "elementos de uma visualização" são
armazenados **aninhados dentro do próprio registro da visualização**, não como registros
independentes relacionados por chave estrangeira.

### `EscritorEspacoDB` — métodos de escrita

`atualizarComponente(s)`, `atualizarElemento(s)`, `atualizarAcao(oes)`, `atualizarControlador(es)`,
`atualizarVisualizacao(visualizacao)` — todos wrappers finos sobre `DBBase.atualizarRegistro`.
`reiniciarBase()` limpa as cinco object stores e reseed os padrões — é o que dispara o botão
"Reiniciar" do menu do Espaço.

## 4.3 Modelo de eventos (`espaco/evento.js`)

`Evento extends CustomEvent`, sempre despachado com `{bubbles: true, composed: true}`. Define as
constantes de nome de evento (`EVENTO_SELECAO_OBJETO`, `EVENTO_ATUALIZACAO_ELEMENTO`,
`EVENTO_ELEMENTO_ATUALIZADO`, `EVENTO_ATUALIZACAO_VISUALIZACAO`, `EVENTO_VISUALIZACAO_ATUALIZADA`,
`EVENTO_PLAYER_YOUTUBE_CARREGADO`, `EXECUTAR_ACAO`) e o catálogo de ações
(`Evento.ACOES`, indexado por nome): `ACAO_REINICIAR`, `ACAO_ADICIONAR_ELEMENTO`,
`ACAO_AUMENTAR_ELEMENTO`, `ACAO_DIMINUIR_ELEMENTO`, `ACAO_IR_PARA_TRAS_ELEMENTO`,
`ACAO_IR_PARA_FRENTE_ELEMENTO`, `ACAO_IR_PARA_INICIO_ELEMENTO`, `ACAO_IR_PARA_FIM_ELEMENTO`,
`ACAO_MAXIMIZAR_ELEMENTO`, `ACAO_MINIMIZAR_ELEMENTO`, `ACAO_RESTAURAR_ELEMENTO`,
`ACAO_FECHAR_ELEMENTO`.

`Evento.dispararEventoExecutarAcao(emissor, nomeAcao, parametros)` é o helper usado em toda a
aplicação para disparar uma ação a partir de qualquer elemento — o evento borbulha até `Espaco`, que
tem o único listener de `EXECUTAR_ACAO` e a tabela de despacho (seção 3.1).

## 4.4 `configuracao_ultima.json`

Arquivo de configuração inicial, referenciado pelo atributo `src` de `<espaco-ultima>`. Formato:

```json
{
  "componentes": [{"url": "./caminho/relativo.js", "nome": "tag-do-componente"}],
  "controladores": [{"url": "./caminho/relativo.js", "nome_classe": "NomeDaClasse"}],
  "acoes": [{
    "uuid": "...", "titulo": "Texto do menu", "nome_acao": "ACAO_ADICIONAR_ELEMENTO",
    "dados": {"nome_elemento": "...", "nome_componente": "tag-do-componente", "dados": {"...": "..."}}
  }],
  "elementos": [{"uuid": "...", "descricao": "...", "dados": {"...": "..."}}],
  "visualizacoes": [{
    "uuid": "...", "descricao": "...",
    "acoes": ["uuid-de-uma-acao", "..."],
    "elementos": [{"uuid": "...", "uuid_elemento": "uuid-de-um-elemento", "importancia": 1, "componente": "tag-do-componente"}]
  }]
}
```

Só é consumido **na primeira execução** (quando o IndexedDB ainda não tem nenhuma `visualizacao`
gravada) — ver 3.1. `componentes` e `controladores` aqui declarados são gravados junto com os padrões
descritos em 4.2 (não os substituem).
