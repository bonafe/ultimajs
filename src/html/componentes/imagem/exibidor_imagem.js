import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';


export class ExibidorImagem extends ComponentBase {

    constructor(){
        super({templateUrl:"./exibidor_imagem.html", shadowDom:true}, import.meta.url);

        this._dados = undefined;

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {
            this.img = super.rootNode.querySelector("img");            
            this.atualizarImg();
        });
    }

    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){
            this.state = JSON.parse(novoValor);
            this.atualizarImg();
        }
    }



    atualizarImg(){
        if (this.img && this.state){
            this.img.setAttribute("src", this.state.src);    
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
customElements.define('exibidor-imagem', ExibidorImagem);