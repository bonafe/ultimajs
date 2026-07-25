import { ComponentBase } from '../../component_base.js';

export class BrImage extends ComponentBase {

    constructor() {
        super(
            {
                templateUrl: './br_image.html',
                shadowDom: true
            },
            import.meta.url
        );
    }

}

// Defines the new custom element
window.customElements.define('br-image', BrImage);
