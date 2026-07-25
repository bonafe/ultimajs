// Data for the "How it's done in practice" panel in comparison.html. The Ultima, Litedom,
// Alpine.js, Lit, Minze and VanJS snippets were adapted (simplified for readability) from the real
// implementations tested in benchmarks/implementacoes/*.html and benchmarks/implementations/ultima/ —
// this isn't pseudocode, it's the same API used and validated in the browser to produce the
// benchmark numbers.

export const FRAMEWORKS_PAINEL = [
    { id: 'litedom', nome: 'Litedom' },
    { id: 'alpine', nome: 'Alpine.js' },
    { id: 'lit', nome: 'Lit' },
    { id: 'minze', nome: 'Minze' },
    { id: 'vanjs', nome: 'VanJS' }
];

export const EXEMPLOS = [
    {
        id: 'counter',
        rotulo: 'Reactive counter',
        ultima: {
            arquivo: 'counter.js + counter.html',
            codigo:
`// counter.js
import { ReactiveComponent } from '../reactive_component.js';

export class Counter extends ReactiveComponent {
  constructor() {
    super({ templateUrl: './counter.html', shadowDom: true }, import.meta.url);
    this.state = { total: 0 };
  }
  increment() {
    this.state = { total: this.state.total + 1 };
  }
}
customElements.define('my-counter', Counter);

<!-- counter.html -->
<span data-bind='{"textContent":"total"}'></span>
<button onclick="this.getRootNode().host.increment()">+1</button>`
        },
        frameworks: {
            litedom: {
                arquivo: 'counter.js',
                codigo:
`import Litedom from '//unpkg.com/litedom';

Litedom({
  tagName: 'my-counter',
  template: \`
    <span>{this.count}</span>
    <button @click="increment">+1</button>
  \`,
  data: { count: 0 },
  increment() { this.data.count++; }
});`
            },
            alpine: {
                arquivo: 'counter.html',
                codigo:
`<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button @click="count++">+1</button>
</div>`
            },
            lit: {
                arquivo: 'counter.js',
                codigo:
`import { LitElement, html } from 'lit';

class MyCounter extends LitElement {
  static properties = { count: {} };
  constructor() { super(); this.count = 0; }
  render() {
    return html\`
      <span>\${this.count}</span>
      <button @click=\${() => this.count++}>+1</button>
    \`;
  }
}
customElements.define('my-counter', MyCounter);`
            },
            minze: {
                arquivo: 'counter.js',
                codigo:
`import { MinzeElement } from 'minze';

class MyCounter extends MinzeElement {
  reactive = [['count', 0]]
  increment = () => this.count++
  html = () => \`
    <span>\${this.count}</span>
    <button on:click="increment">+1</button>
  \`
}
MyCounter.define();`
            },
            vanjs: {
                arquivo: 'counter.js',
                codigo:
`import van from 'vanjs-core';
const { span, button, div } = van.tags;

const count = van.state(0);
van.add(document.body,
  div(
    span(count),
    button({ onclick: () => count.val++ }, '+1')
  )
);`
            }
        }
    },
    {
        id: 'list',
        rotulo: 'Keyed list',
        ultima: {
            arquivo: 'list.html',
            codigo:
`<template data-for="task in tasks : id">
  <li data-bind='{"textContent":"task.title"}'></li>
</template>`
        },
        frameworks: {
            litedom: {
                arquivo: 'list.html',
                codigo:
`<ul>
  <li :for="task in this.tasks" :key="task-{task.id}">
    {task.title}
  </li>
</ul>`
            },
            alpine: {
                arquivo: 'list.html',
                codigo:
`<ul>
  <template x-for="task in tasks" :key="task.id">
    <li x-text="task.title"></li>
  </template>
</ul>`
            },
            lit: {
                arquivo: 'list.js',
                codigo:
`import { repeat } from 'lit/directives/repeat.js';

render() {
  return html\`
    <ul>
      \${repeat(this.tasks, (t) => t.id, (t) => html\`<li>\${t.title}</li>\`)}
    </ul>
  \`;
}`,
                nota: 'repeat() is the official directive for keyed lists — it reorders real DOM nodes instead of recreating them.'
            },
            minze: {
                arquivo: 'list.js',
                codigo:
`html = () => \`
  <ul>\${this.tasks.map((t) => \`<li>\${t.title}</li>\`).join('')}</ul>
\``,
                nota: "Minze's documentation doesn't describe keyed reconciliation — the whole template is a regenerated string compared by structural diff, not by item identity."
            },
            vanjs: {
                arquivo: 'list.js',
                codigo:
`const { li, ul } = van.tags;

ul(...tasks.map((t) => li(t.title)))`,
                nota: 'VanJS has no concept of a "key" — the nodes returned by van.tags are already the real DOM elements, so identity is just the reference you keep, not something the framework reconciles.'
            }
        }
    },
    {
        id: 'conditional',
        rotulo: 'Conditional',
        ultima: {
            arquivo: 'conditional.html',
            codigo:
`<template data-if="tasks.length">
  <p>You have tasks.</p>
</template>
<template data-else>
  <p>No tasks yet.</p>
</template>`
        },
        frameworks: {
            litedom: {
                arquivo: 'conditional.html',
                codigo:
`<p :if="this.tasks.length">You have tasks.</p>
<p :else>No tasks yet.</p>`
            },
            alpine: {
                arquivo: 'conditional.html',
                codigo:
`<template x-if="tasks.length">
  <p>You have tasks.</p>
</template>
<template x-if="!tasks.length">
  <p>No tasks yet.</p>
</template>`
            },
            lit: {
                arquivo: 'conditional.js',
                codigo:
`render() {
  return this.tasks.length
    ? html\`<p>You have tasks.</p>\`
    : html\`<p>No tasks yet.</p>\`;
}`
            },
            minze: {
                arquivo: 'conditional.js',
                codigo:
`html = () => this.tasks.length
  ? '<p>You have tasks.</p>'
  : '<p>No tasks yet.</p>'`
            },
            vanjs: {
                arquivo: 'conditional.js',
                codigo:
`() => tasks.val.length
  ? p('You have tasks.')
  : p('No tasks yet.')`
            }
        }
    },
    {
        id: 'binding',
        rotulo: 'Two-way binding',
        ultima: {
            arquivo: 'binding.html',
            codigo:
`<input data-bind='{"value":"name"}'>
<span data-bind='{"textContent":"name"}'></span>`
        },
        frameworks: {
            litedom: {
                arquivo: 'binding.html',
                codigo:
`<input @bind="name">
<span>{this.name}</span>`
            },
            alpine: {
                arquivo: 'binding.html',
                codigo:
`<div x-data="{ name: '' }">
  <input x-model="name">
  <span x-text="name"></span>
</div>`
            },
            lit: {
                arquivo: 'binding.js',
                codigo:
`render() {
  return html\`
    <input .value=\${this.name} @input=\${(e) => this.name = e.target.value}>
    <span>\${this.name}</span>
  \`;
}`,
                nota: "Lit has no built-in two-way binding directive — the documented pattern is property binding (.value) one way, plus a manual event listener for the other."
            },
            minze: {
                arquivo: 'binding.js',
                codigo:
`reactive = [['name', '']]
update = (e) => this.name = e.target.value
html = () => \`
  <input value="\${this.name}" on:input="update">
  <span>\${this.name}</span>
\``,
                nota: 'Minze has no documented two-way binding — this is a manual pattern (event + assignment), not a native feature equivalent to x-model.'
            },
            vanjs: {
                arquivo: 'binding.js',
                codigo:
`const name = van.state('');

input({ value: name, oninput: (e) => name.val = e.target.value }),
span(name)`,
                nota: 'VanJS\'s own documentation calls this "State Binding" — it\'s the recommended idiom, even though it isn\'t a single magic attribute like x-model.'
            }
        }
    },
    {
        id: 'template',
        rotulo: 'Separate HTML template',
        ultima: {
            arquivo: 'my-card.js + my-card.html',
            codigo:
`// my-card.js
import { ComponentBase } from '../component_base.js';

export class MyCard extends ComponentBase {
  constructor() {
    super(
      { templateUrl: './my-card.html', shadowDom: true },
      import.meta.url   // path resolved relative to THIS file, not the page using the component
    );
  }
}
customElements.define('my-card', MyCard);

<!-- my-card.html: its own file, with its own HTML and CSS <link> -->
<link rel="stylesheet" href="./my-card.css">
<div class="card">
  <slot></slot>
</div>`
        },
        frameworks: {
            litedom: {
                arquivo: 'my-card.js',
                codigo:
`Litedom({
  tagName: 'my-card',
  template: \`<div class="card"><slot></slot></div>\`
});`,
                nota: "the template is a string inside the .js file itself — there's no separate .html file loaded by the component."
            },
            alpine: {
                arquivo: 'my-card.html',
                codigo:
`<div x-data="{}">
  <div class="card">...</div>
</div>`,
                nota: "Alpine doesn't define components with their own template — it activates the HTML that's already on the page wherever x-data appears."
            },
            lit: {
                arquivo: 'my-card.js',
                codigo:
`class MyCard extends LitElement {
  render() {
    return html\`<div class="card"><slot></slot></div>\`;
  }
}`,
                nota: "the template is a tagged template literal inside the component's own JS module, not a separate file."
            },
            minze: {
                arquivo: 'my-card.js',
                codigo:
`class MyCard extends MinzeElement {
  html = () => \`<div class="card"><slot></slot></div>\`
}`,
                nota: 'the template is a string returned from a method, in the same file — same idea as Lit, different syntax.'
            },
            vanjs: {
                arquivo: 'my-card.js',
                codigo:
`const MyCard = (...children) => div({ class: 'card' }, ...children);`,
                nota: 'there\'s no concept of a "template" — the tree is built by calling JavaScript functions that return real DOM nodes.'
            }
        }
    }
];
