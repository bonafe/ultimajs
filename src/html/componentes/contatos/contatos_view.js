import { ComponentBase } from '../component_base.js';

export class ContatosView extends ComponentBase {

    constructor(){
        super({templateUrl:"./contatos_view.html", shadowDom:true}, import.meta.url);

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {                               
        });
    }
}
customElements.define('contatos-visualizacao', ContatosView);