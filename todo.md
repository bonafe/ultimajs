# UltimaJS vs. Vue.js: estado atual

Comparação das funcionalidades essenciais do Vue.js com o que o UltimaJS (`ReactiveComponent`) já implementa.

| Funcionalidade | Vue.js | UltimaJS | Status |
|---|---|---|---|
| Template syntax | `{{ }}`, diretivas | `{{ path }}` (só caminhos) + atributos `data-*` | Implementado |
| Reatividade | `ref`, `reactive` | `state`, `data-state`, `attributeChangedCallback` | Implementado |
| Computed | `computed` | `computed()` | Implementado |
| Class/Style bindings | `:class`, `:style` | `data-class`, `data-style` | Implementado |
| Renderização condicional | `v-if`, `v-else-if`, `v-else` | `data-if`, `data-else-if`, `data-else` | Implementado |
| Listas | `v-for` + `key` | `data-for` com reconciliação por chave | Implementado |
| Form bindings | `v-model` | `data-bind` com evento `change` (duas vias) | Implementado |
| Watchers | `watch` | `watchers()` | Implementado |
| Template refs | `ref` | `data-ref` / `this.refs` | Implementado |
| Lifecycle | `mounted`, ... | `onLoad()`, `whenLoaded()`, `LOADED_EVENT`, `ERROR_EVENT` | Implementado |
| Componentes | SFC | `ComponentBase` + `ReactiveComponent` | Implementado |
| Event handling | `v-on` | `data-on` | Implementado |
| Criação de aplicação | `createApp` | n/a | Fora de escopo |

## Pendências conhecidas

- Os testes de regressão (`tests/`) cobrem os bugs corrigidos até agora; ampliar a cobertura (Shadow DOM aninhado com listas, `ResizeObserver` com `processNewDimensions`).
