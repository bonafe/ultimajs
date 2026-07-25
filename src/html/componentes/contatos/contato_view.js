import { ComponentBase } from '../component_base.js';

export class ContatoView extends ComponentBase {

    constructor(){
        super({templateUrl:"./contato_view.html", shadowDom:true}, import.meta.url);

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {                               
        });
    }
}
customElements.define('contato-visualizacao', ContatoView);