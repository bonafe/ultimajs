import { ComponentBase } from '../../component_base.js';
import { Evento } from '../../espaco/evento.js';



export class GeradorUUID extends ComponentBase {



    constructor(){
        super({templateUrl:"./gerador_uuid.html", shadowDom:true}, import.meta.url);

        this._dados = undefined;


        this.addEventListener(ComponentBase.LOADED_EVENT, () => {          

            this.uuids = super.rootNode.querySelector("#uuids");

            super.rootNode.querySelector("#btnGerar").addEventListener("click", ()=> {
                this.gerarUUID();
            });

            super.rootNode.querySelector("#btnLimpar").addEventListener("click", ()=> {
                this.limpar();
            });

            this.render();
        });
    }



    render(){
        if (this.uuids && super.loaded && this.state){     
                        
            this.uuids.textContent = this.state;
        }
    }



    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){

            this.state = JSON.parse(novoValor);
            this.render();
        }
    }



    gerarUUID(){
        
        let uuid_gerado = window.crypto.randomUUID();        
        this.uuids.textContent = `${this.uuids.textContent}\n${uuid_gerado}`;
        this.state = this.uuids.textContent;
        this.salvar();
    }



    limpar(){
        this.uuids.textContent = "";
        this.state = this.uuids.textContent;
        this.salvar();
    }



    salvar(){
        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
    }
}
customElements.define('gerador-uuid', GeradorUUID);