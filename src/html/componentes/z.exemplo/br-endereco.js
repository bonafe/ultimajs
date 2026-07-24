import { ComponenteReativo } from '../componente_reativo.js';

export class BrEndereco extends ComponenteReativo {

    constructor() {
        super(
            {
                templateURL: './br-endereco.html', 
                shadowDOM: true
            }, 
            import.meta.url
        );
    }

}

// Define o novo elemento personalizado
window.customElements.define('br-endereco', BrEndereco);
