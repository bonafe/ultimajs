import { ComponentBase } from '../../../component_base.js';
import { Evento } from '../../../espaco/evento.js';



export class VisualizadorDiferencasJSON extends ComponentBase {



    constructor(){
        super({templateUrl:"./visualizador_diferencas_json.html", shadowDom:true}, import.meta.url);

        this._dados = undefined;

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {

            //TODO: Não funciona com IMPORT, está tendo que importar no index.html
            //Importa dinamicamente a biblioteca jsondiffpatch
            /*
            import(ComponentBase.resolverEndereco('../../../../bibliotecas/jsondiffpatch/jsondiffpatch.umd.min.js', import.meta.url))
                .then(modulo => {
                    window.jsondiffpatch = modulo;
                    this.modulo = modulo;                   
                })
                .finally(()=> this.render());
            */
            this.render();
        });
    }



    get dados(){
        return this._dados;
    }



    set dados(novosDados){
        this._dados = novosDados;
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



    render(){

        if (this.state && super.loaded){

            if (!(this.state.esquerda && this.state.direita)){

                console.error (`Conteúdo inválido no atributo 'dados'. Deve ser: {esquerda:objetoX, direita:objetoY}`);

            }else{                

                let container = super.rootNode.querySelector("#editorJSON");            
                let delta = jsondiffpatch.diff(this.state.esquerda, this.state.direita);

                // beautiful html diff
                super.rootNode.querySelector('#diferencaEmHTML').innerHTML = jsondiffpatch.formatters.html.format(delta, this.state.esquerda);

                // self-explained json
                //super.rootNode.querySelector('#diferencaEmJSON').innerHTML = jsondiffpatch.formatters.annotated.format(delta, this.state.esquerda);              
            }
        }        
    }
}
customElements.define('visualizador-diferencas-json', VisualizadorDiferencasJSON);