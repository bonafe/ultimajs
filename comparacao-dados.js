// Dados do painel "Como se faz na prática" em comparacao.html. Os trechos de Ultima, Litedom,
// Alpine.js, Lit, Minze e VanJS foram adaptados (simplificados pra leitura) das implementações reais
// e testadas em benchmarks/implementacoes/*.html e src/html/componentes/benchmark/ — não são
// pseudocódigo, são a mesma API usada e validada no navegador pra gerar os números do benchmark.

export const FRAMEWORKS_PAINEL = [
    { id: 'litedom', nome: 'Litedom' },
    { id: 'alpine', nome: 'Alpine.js' },
    { id: 'lit', nome: 'Lit' },
    { id: 'minze', nome: 'Minze' },
    { id: 'vanjs', nome: 'VanJS' }
];

export const EXEMPLOS = [
    {
        id: 'contador',
        rotulo: 'Contador reativo',
        ultima: {
            arquivo: 'contador.js + contador.html',
            codigo:
`// contador.js
import { ComponenteReativo } from '../componente_reativo.js';

export class Contador extends ComponenteReativo {
  constructor() {
    super({ templateURL: './contador.html', shadowDOM: true }, import.meta.url);
    this.dados = { total: 0 };
  }
  incrementar() {
    this.dados = { total: this.dados.total + 1 };
  }
}
customElements.define('meu-contador', Contador);

<!-- contador.html -->
<span data-mapa='{"textContent":"total"}'></span>
<button onclick="this.getRootNode().host.incrementar()">+1</button>`
        },
        frameworks: {
            litedom: {
                arquivo: 'contador.js',
                codigo:
`import Litedom from '//unpkg.com/litedom';

Litedom({
  tagName: 'meu-contador',
  template: \`
    <span>{this.count}</span>
    <button @click="increment">+1</button>
  \`,
  data: { count: 0 },
  increment() { this.data.count++; }
});`
            },
            alpine: {
                arquivo: 'contador.html',
                codigo:
`<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button @click="count++">+1</button>
</div>`
            },
            lit: {
                arquivo: 'contador.js',
                codigo:
`import { LitElement, html } from 'lit';

class MeuContador extends LitElement {
  static properties = { count: {} };
  constructor() { super(); this.count = 0; }
  render() {
    return html\`
      <span>\${this.count}</span>
      <button @click=\${() => this.count++}>+1</button>
    \`;
  }
}
customElements.define('meu-contador', MeuContador);`
            },
            minze: {
                arquivo: 'contador.js',
                codigo:
`import { MinzeElement } from 'minze';

class MeuContador extends MinzeElement {
  reactive = [['count', 0]]
  incrementar = () => this.count++
  html = () => \`
    <span>\${this.count}</span>
    <button on:click="incrementar">+1</button>
  \`
}
MeuContador.define();`
            },
            vanjs: {
                arquivo: 'contador.js',
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
        id: 'lista',
        rotulo: 'Lista com chave',
        ultima: {
            arquivo: 'lista.html',
            codigo:
`<template data-lista="tarefa in tarefas : id">
  <li data-mapa='{"textContent":"tarefa.titulo"}'></li>
</template>`
        },
        frameworks: {
            litedom: {
                arquivo: 'lista.html',
                codigo:
`<ul>
  <li :for="tarefa in this.tarefas" :key="tarefa-{tarefa.id}">
    {tarefa.titulo}
  </li>
</ul>`
            },
            alpine: {
                arquivo: 'lista.html',
                codigo:
`<ul>
  <template x-for="tarefa in tarefas" :key="tarefa.id">
    <li x-text="tarefa.titulo"></li>
  </template>
</ul>`
            },
            lit: {
                arquivo: 'lista.js',
                codigo:
`import { repeat } from 'lit/directives/repeat.js';

render() {
  return html\`
    <ul>
      \${repeat(this.tarefas, (t) => t.id, (t) => html\`<li>\${t.titulo}</li>\`)}
    </ul>
  \`;
}`,
                nota: 'repeat() é a diretiva oficial pra listas com chave — reordena nós DOM reais em vez de recriar.'
            },
            minze: {
                arquivo: 'lista.js',
                codigo:
`html = () => \`
  <ul>\${this.tarefas.map((t) => \`<li>\${t.titulo}</li>\`).join('')}</ul>
\``,
                nota: 'a documentação do Minze não descreve reconciliação por chave — o template inteiro é uma string re-gerada e comparada por diff estrutural, não por identidade de item.'
            },
            vanjs: {
                arquivo: 'lista.js',
                codigo:
`const { li, ul } = van.tags;

ul(...tarefas.map((t) => li(t.titulo)))`,
                nota: 'o VanJS não tem o conceito de "chave" — os nós retornados por van.tags já são os elementos DOM reais, então a identidade é a própria referência que você guarda, não algo que o framework reconcilia.'
            }
        }
    },
    {
        id: 'condicional',
        rotulo: 'Condicional',
        ultima: {
            arquivo: 'condicional.html',
            codigo:
`<template data-se="tarefas.length">
  <p>Você tem tarefas.</p>
</template>
<template data-senao>
  <p>Nenhuma tarefa ainda.</p>
</template>`
        },
        frameworks: {
            litedom: {
                arquivo: 'condicional.html',
                codigo:
`<p :if="this.tarefas.length">Você tem tarefas.</p>
<p :else>Nenhuma tarefa ainda.</p>`
            },
            alpine: {
                arquivo: 'condicional.html',
                codigo:
`<template x-if="tarefas.length">
  <p>Você tem tarefas.</p>
</template>
<template x-if="!tarefas.length">
  <p>Nenhuma tarefa ainda.</p>
</template>`
            },
            lit: {
                arquivo: 'condicional.js',
                codigo:
`render() {
  return this.tarefas.length
    ? html\`<p>Você tem tarefas.</p>\`
    : html\`<p>Nenhuma tarefa ainda.</p>\`;
}`
            },
            minze: {
                arquivo: 'condicional.js',
                codigo:
`html = () => this.tarefas.length
  ? '<p>Você tem tarefas.</p>'
  : '<p>Nenhuma tarefa ainda.</p>'`
            },
            vanjs: {
                arquivo: 'condicional.js',
                codigo:
`() => tarefas.val.length
  ? p('Você tem tarefas.')
  : p('Nenhuma tarefa ainda.')`
            }
        }
    },
    {
        id: 'binding',
        rotulo: 'Binding bidirecional',
        ultima: {
            arquivo: 'binding.html',
            codigo:
`<input data-mapa='{"value":"nome"}'>
<span data-mapa='{"textContent":"nome"}'></span>`
        },
        frameworks: {
            litedom: {
                arquivo: 'binding.html',
                codigo:
`<input @bind="nome">
<span>{this.nome}</span>`
            },
            alpine: {
                arquivo: 'binding.html',
                codigo:
`<div x-data="{ nome: '' }">
  <input x-model="nome">
  <span x-text="nome"></span>
</div>`
            },
            lit: {
                arquivo: 'binding.js',
                codigo:
`render() {
  return html\`
    <input .value=\${this.nome} @input=\${(e) => this.nome = e.target.value}>
    <span>\${this.nome}</span>
  \`;
}`,
                nota: 'o Lit não tem uma diretiva de binding bidirecional pronta — o padrão documentado é property binding (.value) de ida, mais um listener de evento pra volta.'
            },
            minze: {
                arquivo: 'binding.js',
                codigo:
`reactive = [['nome', '']]
atualizar = (e) => this.nome = e.target.value
html = () => \`
  <input value="\${this.nome}" on:input="atualizar">
  <span>\${this.nome}</span>
\``,
                nota: 'não há binding bidirecional documentado no Minze — este é um padrão manual (evento + atribuição), não um recurso nativo equivalente a x-model.'
            },
            vanjs: {
                arquivo: 'binding.js',
                codigo:
`const nome = van.state('');

input({ value: nome, oninput: (e) => nome.val = e.target.value }),
span(nome)`,
                nota: 'a própria documentação do VanJS chama isso de "State Binding" — é o idioma recomendado, mesmo não sendo um único atributo mágico como x-model.'
            }
        }
    },
    {
        id: 'template',
        rotulo: 'Template HTML separado',
        ultima: {
            arquivo: 'meu-cartao.js + meu-cartao.html',
            codigo:
`// meu-cartao.js
import { ComponenteBase } from '../componente_base.js';

export class MeuCartao extends ComponenteBase {
  constructor() {
    super(
      { templateURL: './meu-cartao.html', shadowDOM: true },
      import.meta.url   // caminho resolvido relativo a ESTE arquivo, não à página que usa o componente
    );
  }
}
customElements.define('meu-cartao', MeuCartao);

<!-- meu-cartao.html: arquivo próprio, com seu HTML e <link> de CSS -->
<link rel="stylesheet" href="./meu-cartao.css">
<div class="cartao">
  <slot></slot>
</div>`
        },
        frameworks: {
            litedom: {
                arquivo: 'meu-cartao.js',
                codigo:
`Litedom({
  tagName: 'meu-cartao',
  template: \`<div class="cartao"><slot></slot></div>\`
});`,
                nota: 'o template é uma string dentro do próprio arquivo .js — não existe um arquivo .html separado carregado pelo componente.'
            },
            alpine: {
                arquivo: 'meu-cartao.html',
                codigo:
`<div x-data="{}">
  <div class="cartao">...</div>
</div>`,
                nota: 'o Alpine não define componentes com template próprio — ele reativa o HTML que já está na página onde x-data aparece.'
            },
            lit: {
                arquivo: 'meu-cartao.js',
                codigo:
`class MeuCartao extends LitElement {
  render() {
    return html\`<div class="cartao"><slot></slot></div>\`;
  }
}`,
                nota: 'o template é um tagged template literal dentro do mesmo módulo JS do componente, não um arquivo à parte.'
            },
            minze: {
                arquivo: 'meu-cartao.js',
                codigo:
`class MeuCartao extends MinzeElement {
  html = () => \`<div class="cartao"><slot></slot></div>\`
}`,
                nota: 'o template é uma string retornada por um método, no mesmo arquivo — mesma ideia do Lit, sintaxe diferente.'
            },
            vanjs: {
                arquivo: 'meu-cartao.js',
                codigo:
`const MeuCartao = (...filhos) => div({ class: 'cartao' }, ...filhos);`,
                nota: 'não existe conceito de "template" — a árvore é construída chamando funções JavaScript que retornam nós DOM reais.'
            }
        }
    }
];
