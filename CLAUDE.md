# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Ultima (UltimaJS) is a Vanilla JavaScript front-end framework core with no build step and no
npm/bundler dependencies — files are native ES modules (`<script type="module">`,
`import.meta.url`, dynamic `import()`) served directly to the browser. The framework implements
reactive Web Components (Custom Elements, Shadow DOM). This repository is intentionally minimal:
it holds only the framework core, its public documentation site, two small DSL demos, and a
cross-framework benchmark suite.

The "Workspace" reference application that used to live in this repository (IndexedDB persistence,
~15 content components, vendored third-party libraries, Docker/HAProxy deploy) has been split out
into a separate `espaco` project. `espaco` vendors a copy of the three core files below the same
way it vendors third-party libraries — there's no package manager to reference them as an external
dependency instead.

**Code, comments, and identifiers are in English.**

## Repository layout

- `src/component_base.js`, `src/controller_base.js`, `src/reactive_component.js` — the entire
  framework. Nothing else is required to use Ultima; copy these three files (or reference them
  directly) into any project.
  `src/mixins.js` is optional and standalone (`mix(Base).with(...)`): copy it only if you compose mixins.
- `index.html`, `about.html`, `getting-started.html`, `guide.html`, `reference.html`,
  `examples.html`, `comparison.html` (+ `comparison.js`/`comparison-data.js`), `assets/` — the
  public documentation/marketing site.
- `examples/` — two small, self-contained DSL demos: `index.html`/`br-test.js`/`br-address.js`
  (every binding type at once, including a keyed list where each item is itself a nested reactive
  component) and `index2.html`/`image/` (a simpler single-component example). Both depend only on
  the two files above.
- `benchmarks/` — the cross-framework benchmark/comparison site (`benchmarks/index.html`,
  `harness.js`, `page.js`, `results/`). `benchmarks/implementations/` holds one implementation per
  framework compared (Alpine, Lit, Litedom, Minze, VanJS, Ultima); Ultima's benchmark components
  live under `benchmarks/implementations/ultima/` (`bench-counter`, `bench-list`,
  `bench-conditional`, `bench-binding`).
- `documentacao-tecnica/` — technical specification of the framework core (in Portuguese):
  `especificacao/01-visao-geral.md`, `especificacao/02-arquitetura-nucleo.md`, plus
  `artigos/clonando_objetos.md` and `especificacao-pagina-comparacao-frameworks.md`.

## Commands

There's no `package.json`, package manager, or linter. Serve the repository root with any static
file server — there's no build step, e.g.:
```
python3 -m http.server
```
Regression tests live in `tests/` (zero-dependency, browser-run): open `/tests/` while serving the
root, or run `tests/run.sh` for headless Chrome with a non-zero exit code on failure (this is what CI
runs). Add a test with every bug fix. User-visible changes go in `CHANGELOG.md`; the version is
`ComponentBase.VERSION`.

## Architecture

### Component hierarchy

- **`ComponentBase`** (`src/component_base.js`): infrastructure shared by every Web Component in the
  framework.
  - Receives `{templateUrl, shadowDom}` plus the subclass's `import.meta.url` in the constructor.
  - `loadTemplate()` fetches the HTML, extracts `<link>` (CSS) and `<script>` tags from the template,
    fixes relative `src`/`href`/`data` paths for tags like `img`, `a`, `iframe`, and injects the
    result into `rootNode` (which is `this` or the shadow root, depending on `shadowDom`).
  - Recursively tracks descendants that are also `ComponentBase` and only fires the
    `ComponentBase.LOADED_EVENT` ("component-loaded") event once **all** children have also
    loaded — this event is the backbone of the framework's chained component initialization.
  - Also manages a `ResizeObserver` on the `.observed` element.

- **`ControllerBase`** (`src/controller_base.js`): minimal base class for event-driven controllers
  — an `EventTarget` subclass, nothing more. Controllers receive and dispatch custom events;
  concrete controller implementations live in applications built on top of Ultima (e.g. the
  `espaco` project).

- **`ReactiveComponent`** (`src/reactive_component.js`): extends `ComponentBase` and adds data binding.
  - Internal state in `#state`, mirrored onto the `data-state` HTML attribute (serialized JSON) via
    the `state` setter and `attributeChangedCallback`.
  - Declarative binding: template elements with `data-bind='{"elementAttribute":"path.in.state"}'`
    are updated automatically when `#state` changes (diffed by path, not a full re-render) and, in
    the other direction, listen for the native `change` event to write back into the model
    (see the `#onContentChange` handler) — this is simple two-way binding, with no virtual DOM.
  - Conditional rendering (`data-if`/`data-else-if`/`data-else`) and lists (`data-for`, with keyed
    reconciliation) are both fully implemented — see the reference site's DSL page
    (`reference.html`) for the complete syntax.

### No build: module conventions

Since there's no bundler, import paths always need to be resolvable by the browser directly:
- Use `import.meta.url` + `ComponentBase.extractUrlPath`/`resolveAddress` to resolve a component's
  paths relative to its own file, never hardcoded paths from the root.
