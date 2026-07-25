import { ReactiveComponent } from '../src/reactive_component.js';

import { BrAddress } from './br-address.js';

export class BrTest extends ReactiveComponent {

    constructor() {
        super(
            {
                templateUrl: './br-test.html',
                shadowDom: true
            },
            import.meta.url
        );
    }

    //Example computed property: derived from this.state, added to state for every binding
    computed() {
        const state = this.state || {};
        return {
            total_addresses: Array.isArray(state.addresses) ? state.addresses.length : 0,
            status_color: state.active ? '#2e7d32' : '#b0b0b0'
        };
    }

    //Example watcher: runs only when the watched path's value changes
    watchers() {
        return {
            name: (newValue, oldValue) => {
                console.log(`[BrTest] name changed from "${oldValue}" to "${newValue}" (ref: ${this.refs.nameField?.value})`);
            },
            active: (newValue) => {
                console.log(`[BrTest] active is now ${newValue}`);
            }
        };
    }

}

// Defines the new custom element
window.customElements.define('br-test', BrTest);
