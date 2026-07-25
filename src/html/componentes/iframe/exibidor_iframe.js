import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';


export class ExibidorIframe extends ComponentBase {

    constructor(){
        super({templateUrl:"./exibidor_iframe.html", shadowDom:true}, import.meta.url);

        this._dados = undefined;

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {
            this.iFrame = super.rootNode.querySelector("iframe");            
            this.atualizarIFrame();
        });
    }

    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){
            this.state = JSON.parse(novoValor);
            this.atualizarIFrame();
        }
    }



    atualizarIFrame(){
        if (this.iFrame && this.state){
            this.iFrame.setAttribute("src", this.state.src);    
            /*        
            fetch (this.state.src).then (resposta =>
                resposta.text().then( htmlPagina => {                    
                    let html_src = 'data:text/html;charset=utf-8,' + htmlPagina;
                    this.iFrame.setAttribute("src" , html_src);
                })
            );
            */
        }
    }
}
customElements.define('exibidor-iframe', ExibidorIframe);