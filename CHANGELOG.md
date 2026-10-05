# Changelog

Follows [Semantic Versioning](https://semver.org/); the version lives in `ComponentBase.VERSION`.
Below 1.0.0, minor versions may contain behavior changes (listed under **Changed**).

## 0.4.0

### Added
- `{{ path }}` text interpolation in templates (one-way, text only, paths only; works inside `data-if`/`data-for` bodies, including top-level text).

## 0.3.0

### Added
- `mix(Base).with(...mixins)` (`src/mixins.js`): composes mixins (functions `Base => class extends Base`) left to right. Rejects values that are not subclass factories and two mixins defining the same member (lifecycle hooks such as `onLoad` are exempt and chain through `super`). Optional: nothing in the core uses it, and existing components are unaffected.

## 0.2.0

### Added
- `data-on='{"event":"method"}'`: declarative event handlers calling a component method with `(event, scope)`.
- `ComponentBase.ERROR_EVENT` ("component-error") and the `failed` property; a parent treats a failed child as settled.
- `ComponentBase.VERSION`.
- Regression test suite (`tests/`, run with `tests/run.sh`) and CI workflow.

### Fixed
- `data-if`/`data-else-if`/`data-else` never showed a later branch once an earlier one had rendered.
- `datetime-local` bound to a missing/invalid value threw and left the component (and its ancestors) never loaded.
- Template fetch: non-2xx responses were injected as the template; retries never happened; a failing CSS/script left the component never loaded.
- An exception in `onLoad()` prevented `LOADED_EVENT`.
- Boolean attributes (`disabled="false"` still disabled the element); `undefined` rendered as the string "undefined".
- Editing a primitive list item (`n in nums`) was lost.
- A light-DOM child received its parent's bindings/refs.
- Invalid JSON in `data-state`/`data-bind`/`data-class`/`data-style` threw out of the render.
- Script `integrity` (SRI) was silently ignored.
- `ResizeObserver` was never disconnected.

### Security
- `data-bind` refuses `on*`/`srcdoc` attributes and `javascript:`/`vbscript:`/`data:text/html` URLs.

### Changed
- Templates and CSS are fetched once per URL per page load; template `<script>`s load once per `src`, into `document.head`.
- Content a parent writes inside a light-DOM child's tag is no longer bound by the parent.
- Subclasses overriding `connectedCallback`/`disconnectedCallback` must call `super`.
- Removed the framework's debug `console.log` output.
