import { ComponentBase } from "../../component_base.js";
import { EditorJSON } from "../../dados/json/editor/editor_json.js";
import { Evento } from "../evento.js";

export class Configuracao extends ComponentBase{

    constructor(){
        super({templateUrl:"./configuracao.html", shadowDom:true}, import.meta.url);        
   
        
        this.addEventListener(ComponentBase.LOADED_EVENT, () => {

            this.tratarDownloadConfiguracao();
            this.tratarEventoMudancaDados();            
        });        
    }



    tratarEventoMudancaDados(){
        window.addEventListener(Evento.EVENTO_ATUALIZACAO_DADOS, evento => {
            console.dir (evento.detail);
        });
    }
    
    tratarDownloadConfiguracao(){

        let estilos = document.createElement("link");
        super.rootNode.appendChild(estilos);
        estilos.setAttribute("rel", "stylesheet");
        estilos.setAttribute("href","componentes/espaco/visualizacao/visualizacao.css")


        let div = document.createElement("div");
        super.rootNode.insertBefore(div, super.rootNode.querySelector("#editorJSON"));
        div.classList.add("navegacao_ultima");
        div.classList.add("cabecalho_principal_ultima");
        

        let a = document.createElement("a");  
        div.appendChild (a);        

        a.href = "#";
        a.textContent = "Download Configuração";
        a.onclick = () => {
            this.downloadObjectAsJson(this.state, "configuracao");
        };        
    }

    downloadObjectAsJson(exportObj, exportName){
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
}
customElements.define('configuracao-espaco', Configuracao);