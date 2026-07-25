import { ReactiveComponent } from '../src/reactive_component.js';

export class BrAddress extends ReactiveComponent {

    constructor() {
        super(
            {
                templateUrl: './br-address.html',
                shadowDom: true
            },
            import.meta.url
        );
    }

}

// Defines the new custom element
window.customElements.define('br-address', BrAddress);
