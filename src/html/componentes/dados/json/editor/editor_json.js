import { ComponentBase } from '../../../component_base.js';
import { Evento } from '../../../espaco/evento.js';


export class EditorJSON extends ComponentBase {

    constructor(){
        super({templateUrl:"./editor_json.html", shadowDom:false}, import.meta.url);

        this._dados = undefined;

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {

            //Importa dinamicamente a biblioteca JSONEditor
            import(ComponentBase.resolverEndereco('../../../../bibliotecas/jsoneditor/jsoneditor.js', import.meta.url))
                .then(modulo => {
                    this.modulo = modulo;
                    this.criarEditor();                               
                });
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

            //Se possui o atributo "src" e é um arquivo json
            let efetuouDownload = false;
            if (this.state.src){ 
                this.src = this.state.src;
                if (this.src.toLowerCase().endsWith("json")){                    

                    //Carrega o arquivo json da url em "src"
                    fetch(this.src)
                        .then(retorno => retorno.json())
                        .then(json => {
                            this.state = json;
                            this.atualizarDadosEditor();
                        })
                        .catch (e => alert (e));
                    
                        efetuouDownload = true;
                }
            }

            //Caso contrário exibe os dados recebidos para edição
            if (!efetuouDownload){
                this.atualizarDadosEditor();
            }
        }
    }  



    dispararEventoSelecaoObjeto(no){        

        if (no.path.length > 0){
            let dados = EditorJSON.trazerDado(no.path, this.state);

            if (typeof dados === 'object'){
                
                this.dispatchEvent(new Evento(Evento.EVENTO_SELECAO_OBJETO,dados));
            }
        }
    }


    static trazerDado(caminho, dados){

        let dado = dados[caminho[0]];

        //Se é umd dado simples
        if (caminho.length == 1){
            return dado;

        //Se é um dado complexo, continua o caminho a partir daqui
        }else{

            return EditorJSON.trazerDado(caminho.slice(1), dado);
        }
    }



    criarEditor(){

        if (!this.editor){

            let container = super.rootNode.querySelector("#editorJSON");
            let opcoes = {
                target: container,
                props:{
                    mode: 'tree',
                    onChange: (updatedContent, previousContent, patchResult) => {                        
                        this.state = updatedContent.json;
                        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));                      
                    }            
                }
            };
            this.editor = new this.modulo.JSONEditor(opcoes);                   
        }

        this.atualizarDadosEditor();
    }



    atualizarDadosEditor(){
        if (this.editor && this.state){
            this.editor.set({json:this.state});
            setTimeout(()=>this.editor.expand(caminho => caminho.length < 2));                        
        }
    }
}
customElements.define('editor-json', EditorJSON);