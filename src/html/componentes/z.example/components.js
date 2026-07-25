class VueWrapper extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.loadVue().then(() => this.initVue());
    }

    async loadVue() {
        if (!window.Vue) {
            await this.loadScript("https://unpkg.com/vue@3/dist/vue.global.js");
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initVue() {
        this.shadowRoot.innerHTML = `
            <div id="vue-root">
                <slot></slot>
            </div>
        `;
        
        this.vueApp = Vue.createApp(this.getVueOptions());
        this.vueApp.mount(this.shadowRoot.querySelector("#vue-root"));
    }

    getVueOptions() {
        return {};
    }
}

customElements.define("vue-wrapper", VueWrapper);

class MyComponentOne extends VueWrapper {
    getVueOptions() {
        return {
            data() {
                return { text: "Vue Component 1" };
            },
            template: `<div>{{ text }}</div>`
        };
    }
}

customElements.define("my-component-one", MyComponentOne);

class MyComponentTwo extends VueWrapper {
    getVueOptions() {
        return {
            components: {
                'my-component-one': {
                    data() {
                        return { text: "Vue Component 1 inside Component 2" };
                    },
                    template: `<div>{{ text }}</div>`
                }
            },
            data() {
                return { text: "Vue Component 2" };
            },
            template: `
                <div>
                    <p>{{ text }}</p>
                    <my-component-one></my-component-one>
                </div>
            `
        };
    }
}

customElements.define("my-component-two", MyComponentTwo);
