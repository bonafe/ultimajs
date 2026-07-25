# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Ultima (UltimaJS) is a Vanilla JavaScript front-end framework with no build step and no npm/bundler
dependencies — files are native ES modules (`<script type="module">`, `import.meta.url`, dynamic
`import()`) served directly to the browser. The framework implements reactive Web Components (Custom
Elements, Shadow DOM), and the reference application is a "Workspace" that renders configurable
elements (images, videos, iframes, graphs, etc.) in switchable views (treemap, windows).

**Code, comments, and identifiers are in English.** The framework core (`component_base.js`,
`reactive_component.js`), its DSL (`data-bind`, `data-if`, `data-for`, etc.), and the public
documentation site are fully in English. The "Workspace" reference application under
`src/html/componentes/espaco/` and its supporting element components (`grafo/`, `dispositivo/`,
`contatos/`, `video/`, `imagem/`, `som/`, `toque/`, `iframe/`, `dados/`, `data/`) are mid-migration:
some files still use their original Portuguese folder/file names and identifiers. When touching any
of those files, prefer translating identifiers/comments to English as you go rather than adding new
Portuguese code; don't do a mechanical bulk rename without also fixing every import path and DOM
attribute value that depends on the old names — the DSL rename already went through this once (see
git history around the point `data-mapa`/`data-lista`/`.dados` etc. became
`data-bind`/`data-for`/`.state`) and missing a single reference silently breaks rendering.

## Commands

There's no `package.json`, package manager, linter, or test suite configured in this project.

- **Run locally (HTTPS, with a self-signed certificate):**
  ```
  cd src/python && python3 servidor_https_local.py
  ```
  Serves the repository root at `https://192.168.1.155:443` (IP hardcoded in the script) using the
  certificate in `src/resources/certificadoDigital/`. Adjust `endereco_ip` in the script if the
  machine has a different IP.
- **Run locally (plain HTTP, no certificate):** any static server works, e.g.
  `python3 -m http.server` from the repository root — there's no build step.
- **Deploy:** `./rotina_de_deploy.sh` — runs `git pull`, syncs `src/html/*` into `dist/v1.0b/`, builds
  the Docker image (`sudo docker image build -t ultima .`) and brings it up via
  `sudo docker-compose down && up -d`. `dist/v1.0b/` is the versioned directory the Apache container
  actually serves (via `Dockerfile`) — never hand-edit files under `dist/`, they're regenerated from
  `src/html/` on every deploy.
- **Docker Compose** (`docker-compose.yml`): the `ultima` service (Apache httpd 2.4 serving `dist/`)
  sits behind `haproxy` as a reverse proxy/TLS terminator. HAProxy expects a certificate at
  `../chaves_ultima/ultima_alfvcp.pem` (outside the repo).

## Architecture

### Component hierarchy

All UI logic starts from two classes in `src/html/componentes/`:

- **`ComponentBase`** (`component_base.js`): infrastructure shared by every Web Component in the
  framework.
  - Receives `{templateUrl, shadowDom}` plus the subclass's `import.meta.url` in the constructor.
  - `loadTemplate()` fetches the HTML, extracts `<link>` (CSS) and `<script>` tags from the template,
    fixes relative `src`/`href`/`data` paths for tags like `img`, `a`, `iframe`, and injects the
    result into `rootNode` (which is `this` or the shadow root, depending on `shadowDom`).
  - Recursively tracks descendants that are also `ComponentBase` and only fires the
    `ComponentBase.LOADED_EVENT` ("component-loaded") event once **all** children have also
    loaded — this event is the backbone of the framework's chained component initialization.
  - Also manages a `ResizeObserver` on the `.observed` element.

- **`ReactiveComponent`** (`reactive_component.js`): extends `ComponentBase` and adds data binding.
  - Internal state in `#state`, mirrored onto the `data-state` HTML attribute (serialized JSON) via
    the `state` setter and `attributeChangedCallback`.
  - Declarative binding: template elements with `data-bind='{"elementAttribute":"path.in.state"}'`
    are updated automatically when `#state` changes (diffed by path, not a full re-render) and, in
    the other direction, listen for the native `change` event to write back into the model
    (see the `#onContentChange` handler) — this is simple two-way binding, with no virtual DOM.
  - Conditional rendering (`data-if`/`data-else-if`/`data-else`) and lists (`data-for`, with keyed
    reconciliation) are both fully implemented — see the reference site's DSL page
    (`reference.html`) for the complete syntax.

Concrete components live in `src/html/componentes/<name>/`, each one typically with:
`<name>.js` (the class + `customElements.define('tag-name', Class)`), `<name>.html` (the template),
`<name>.css`, and optionally `controller.js`/`controlador.js`, `evento.js`/`event.js` (custom event
constants), `modelo/`/`model/` (data access), and `visualizacao/`/`view/` (display variants).

### Persistence: IndexedDB

Each data domain has its own IndexedDB database via `DBBase` (`componentes/db/db_base.js`), which
exposes `aguardarBanco()`/loading events. Components like the Workspace (`Espaco`) follow the
**Reader/Writer** pattern: `LeitorEspacoDB`/`EscritorEspacoDB` (singletons via `getInstance()`)
encapsulate, respectively, reading and writing the `componentes`, `controladores`, `acoes`, and
`elementos`/`visualizacoes` entities. The same pattern repeats for graphs (`grafo_db.js`,
`leitor_grafo_db.js`, `escritor_grafo_db.js`).

### The "Workspace" flow (main application)

`Espaco` (tag `espaco-ultima`, `componentes/espaco/espaco.js`) is the root component of an Ultima
Workspace instance:

1. On load (`src` as the URL of a `configuracao_ultima.json`), it fetches the config JSON and, if the
   local IndexedDB is still empty, seeds it with `componentes`, `controladores`, `acoes` and
   `elementos`/`visualizacoes` from that file (first run); on subsequent runs it uses whatever is
   already persisted locally.
2. Dynamically imports (`import()`) and instantiates each configured controller — controllers extend
   `ControllerBase` (which extends `EventTarget`) and receive/dispatch events.
3. Creates the active view element (`visualizacao-treemap` or `visualizacao-janelas`, see
   `Espaco.VISUALIZACOES_DISPONIVEIS`) inside `.secao_principal_ultima` and wires up the set of events
   defined in `Evento` (`componentes/espaco/evento.js`) between view → controllers → `Espaco`.
4. Actions (`Evento.ACAO_*`, e.g. `ACAO_ADICIONAR_ELEMENTO`, `ACAO_MAXIMIZAR_ELEMENTO`) arrive as
   custom events and are dispatched in `executarAcao()` via a name→function table — adding a new
   action requires adding it both to `Evento` and to that table.

All UI state (element position/size, which view is active, etc.) is persisted locally in the
browser's IndexedDB — there's no application backend; `src/python/servidor_https_local.py` is just a
static file server for development.

### No build: module conventions

Since there's no bundler, import paths always need to be resolvable by the browser directly:
- Use `import.meta.url` + `ComponentBase.extractUrlPath`/`resolveAddress` to resolve a component's
  paths relative to its own file, never hardcoded paths from the root.
- Third-party libraries are vendored under `src/html/bibliotecas/` (d3, vis.js, jsoneditor,
  jsondiffpatch, jspanel, Font Awesome) instead of installed via npm.
