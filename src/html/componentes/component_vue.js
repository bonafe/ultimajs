import { ComponentBase } from './component_base.js';

export class ComponentVue extends ComponentBase {
    #vue;
    #state;

    constructor(properties, subclassUrl) {
        super(properties, subclassUrl);

        this.#state = undefined;

        this.addEventListener(ComponentBase.LOADED_EVENT, async () => {
            await this.loadVueIfNeeded();
            this.render();
        });
    }

    render(){

    }

    get state() {
        return this.#state;
    }

    set state(newState) {
        this.dataset.state = JSON.stringify(newState);
        this.updateState(newState);
    }

    static get observedAttributes() {
        return ['data-state'];
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (attributeName === 'data-state') {
            this.updateState(JSON.parse(newValue));
        }
    }

    shouldUpdate(newState) {
        let shouldUpdate = false;

        if (this.#state !== newState) {
            if (!this.#state && newState) {
                shouldUpdate = true;
            } else if (JSON.stringify(this.#state).localeCompare(JSON.stringify(newState)) != 0) {
                shouldUpdate = true;
            }
        }

        return shouldUpdate;
    }

    async updateState(newState) {
        if (!this.shouldUpdate(newState)) {
            return;
        }

        await this.loadVueIfNeeded();

        let state = JSON.parse(this.dataset.state);

        console.dir(state);

        this.#vue = new Vue({
            el: super.rootNode.querySelector("#vueapp"),
            data() {
                return state;
            }
        });
    }

    async loadVueIfNeeded() {
        if (window.Vue) {
            return; // Vue is already loaded, no need to load it again.
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js';
            script.async = true;
            script.onload = () => {
                console.log('Vue.js loaded from CDN');
                resolve();
            };
            script.onerror = () => reject(new Error('Error loading Vue.js from CDN'));
            document.head.appendChild(script);
        });
    }
}

window.customElements.define('component-vue', ComponentVue);
