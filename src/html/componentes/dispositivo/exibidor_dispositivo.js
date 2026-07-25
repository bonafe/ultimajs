import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';



export class ExibidorDispositivo extends ComponentBase {



    constructor(){
        super({templateUrl:"./exibidor_dispositivo.html", shadowDom:true}, import.meta.url);

        this.video = undefined;        

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {            
        
            this.descricao = super.rootNode.querySelector("#descricao");

            this.descricao.addEventListener("change", ()=>{
                this.mudouEstado();                
            });


            super.rootNode.querySelector("#exibir").addEventListener("click", ()=>{
                this.dispatchEvent(new Evento(Evento.EVENTO_SELECAO_OBJETO, 
                    {
                        deviceId:this.state.dadosMediaAPI.deviceId, 
                        kind:this.state.dadosMediaAPI.kind
                    })
                );
            });

            this.render();
        });
    }


    get dados(){
        return this._dados;
    }

    set dados (novoValor){
        this._dados = novoValor;
        this.render();
    }

    mudouEstado(){
        this._dados.descricao = this.descricao.value;             
        this.dispatchEvent(new CustomEvent("change", {detail:this._dados, 'bubbles': true, 'composed':true}));
    }


    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){

            this._dados = JSON.parse(novoValor);         
            this.render();
        }
    }



    render(){
        
        if (super.loaded){
            this.atualizarCampos();
        }        
    }

    atualizarCampos(){

        super.rootNode.querySelector("#descricao").value = this._dados.descricao;
        super.rootNode.querySelector("#kind").textContent = this._dados.dadosMediaAPI.kind;
        super.rootNode.querySelector("#deviceId").textContent = this._dados.dadosMediaAPI.deviceId;
        super.rootNode.querySelector("#groupId").textContent =  this._dados.dadosMediaAPI.groupId;
        super.rootNode.querySelector("#label").textContent =  this._dados.dadosMediaAPI.label;

    }
}
customElements.define('exibidor-dispositivo', ExibidorDispositivo);