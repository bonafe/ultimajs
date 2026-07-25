import { Elemento } from '../elemento.js';
import { ComponentBase } from '../../../component_base.js';


export class ElementoTreemap extends Elemento {



    constructor(){
        super();

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {  
        });
    }

   
    
    render(){
        super.render();
    }
}
customElements.define('elemento-treemap', ElementoTreemap);