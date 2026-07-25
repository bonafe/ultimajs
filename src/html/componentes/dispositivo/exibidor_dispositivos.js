import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';
import { ExibidorDispositivo } from './exibidor_dispositivo.js';


export class ExibidorDispositivos extends ComponentBase {



    constructor(){
        super({templateUrl:"./exibidor_dispositivos.html", shadowDom:true}, import.meta.url);

        this.video = undefined;        

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {            

            this.render();
        });
    }



    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){

            this.state = JSON.parse(novoValor);
        }
    }



    


    render(){
        
        if (super.loaded && !this.renderizado){
            
            this.preencherDispositivos().then(()=>{
                
            });
        }        
    }




    preencherDispositivos(){
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices().then( dispositivosMediaAPI => {                

                this.atualizarDispositivos(dispositivosMediaAPI);

                let listaDispositivos = super.rootNode.querySelector("#dispositivos");   

                //TODO: não apagar tudo, atualizar com o que mudou
                listaDispositivos.innerHTML = "";

                Object.entries(this.state).forEach (entrada => {

                    const [chave, dispositivo] = entrada;

                    const elementoListaDispositivos = document.createElement('li');
                    listaDispositivos.appendChild (elementoListaDispositivos);

                    const exibidorDispositivo = document.createElement('exibidor-dispositivo');
                    elementoListaDispositivos.appendChild (exibidorDispositivo);

                    exibidorDispositivo.setAttribute("dados",JSON.stringify(dispositivo)); 

                    exibidorDispositivo.addEventListener("change", evento => {
                        evento.stopPropagation();
                        this.state[exibidorDispositivo.state.idDispositivo] = exibidorDispositivo.state;
                        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
                    });

                });
                
                this.renderizado = true;
                resolve(true);
            });
        });
    }



    atualizarDispositivos(dispositivosMediaAPI){

        
        //TODO: Não dá para saber que é o mesmo dispositivo entre sessões do navegador :(
        //Define todos os dispositivos conhecidos como indisponíveis
        //Object.entries(this.state).forEach (dispositivo => {
        //    dispositivo.disponivel = false;
        //});
        //Zera os dados todas as vezes
        this.state = {};


        dispositivosMediaAPI.forEach( dispositivoMediaAPI => {                                        

            let idDispositivo = `${dispositivoMediaAPI.kind}-${dispositivoMediaAPI.groupId}-${dispositivoMediaAPI.deviceId}`;

            let dispositivoAtual = this.state[idDispositivo];

            //TODO: Não vai existir pois não está conseguindo saber que é o mesmo dispositivo
            //Caso o dispositivo já exista no dicionário
            if (dispositivoAtual){


                //Define o dispositivo como disponível
                dispositivoAtual.disponivel = true;

            }else{

                //Cria um novo dispositivo gerado ID, descrição padrão e colocando como disponível
                //Inicializa os dadosMediaAPI
                //TODO: algum dos dados vindos da Media API poderiam mudar com o tempo?
                //TODO: o deviceId é único por dispositivo no mundo?
                let dadosDispositivo = {
                    "idDispositivo": idDispositivo,
                    "descricao": dispositivoMediaAPI.label,
                    "dadosMediaAPI": dispositivoMediaAPI,
                    "disponivel": true
                };

                //Adiciona o novo dispositivo encontrado ao dicionário de dispositivos
                this.state[dadosDispositivo.idDispositivo] = dadosDispositivo;
            }
        });            
    }


    stopMediaTracks(stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }


    salvarEstado(){
        console.log(`Salvando câmera: ${this.cameras.value}`);
        this.state = {deviceId: this.cameras.value};
        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
    }
}
customElements.define('exibidor-dispositivos', ExibidorDispositivos);