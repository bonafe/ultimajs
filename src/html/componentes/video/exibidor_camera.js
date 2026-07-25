import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';



export class ExibidorCamera extends ComponentBase {



    constructor(){
        super({templateUrl:"./exibidor_camera.html", shadowDom:true}, import.meta.url);

        this.video = undefined;        

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {            

            this.cameras = super.rootNode.querySelector("#cameras");         
            this.video = super.rootNode.querySelector("#video");
            this.downloadGravacao = super.rootNode.querySelector("#downloadGravacao");
            this.btnGravacao = super.rootNode.querySelector("#btnGravacao");

            this.cameras.addEventListener("change", ()=>{
                this.iniciarCamera();
                this.mudouEstado();
            });

            this.btnGravacao.addEventListener("click", () =>{                
                if (!this.gravando){                    
                    this.downloadGravacao.classList.add("desabilitado");
                    this.btnGravacao.textContent = "Parar Gravação";                    
                    this.gravar();                
                }else{
                    this.downloadGravacao.classList.remove("desabilitado");
                    this.btnGravacao.textContent = "Gravar";
                    this.pararGravacao();
                }
            });

            this.render();
        });
    }



    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

    
        if (nomeAtributo.localeCompare("dados") == 0){

            this.state = JSON.parse(novoValor);
            console.log("Dados exibidor cãmera: %o",this.state);

            if (this.state.deviceId && this.cameras){
                this.cameras.value = this.state.deviceId;
                this.iniciarCamera();
            }
        }
    }



    gravar(){
        
        const opcoes = {mimeType: 'video/webm'};
        const pedacosGravados = [];

        this.mediaRecorder = new MediaRecorder(this.video.srcObject, opcoes);

        this.mediaRecorder.addEventListener('dataavailable', evento => {
            if (evento.data.size > 0) {
                pedacosGravados.push(evento.data);
            }            
        });

        this.mediaRecorder.addEventListener('stop', () => {
            this.downloadGravacao.href = URL.createObjectURL(new Blob(pedacosGravados));
            this.downloadGravacao.download = 'gravacao.webm';
            this.gravando = false;
        });

        this.mediaRecorder.start();
        this.gravando = true;
    }

    pararGravacao(){
        this.mediaRecorder.stop();
    }


    render(){
        
        if (super.loaded && !this.renderizado){
            
            this.preencherCamerasDisponiveis().then(()=>{
                this.iniciarCamera();            
            });
        }        
    }



    iniciarCamera(){

        return new Promise((resolve, reject) => {
            if (this.video.srcObject) {
                this.stopMediaTracks(this.video.srcObject);
            }

            if (this.cameras.value != '') {
            
                const constraints = {
                    video:{
                        deviceId: {
                            exact: this.cameras.value
                        }
                    },
                    audio:false
                };     

                navigator.mediaDevices
                    .getUserMedia(constraints)
                        .then(stream => {                
                            this.video.srcObject = stream; 
                            this.video.play();
                            resolve(true);               
                        })        
                        .catch(error => {
                            console.error(error);
                            reject();
                        });
            }        
        });
    }



    preencherCamerasDisponiveis(){
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices().then( dispositivos => {
        
                this.cameras.innerHTML = '';

                let count = 1;

                dispositivos.forEach( dispositivo => {

                    if (dispositivo.kind === 'videoinput') {
                        const option = document.createElement('option');
                        option.value = dispositivo.deviceId;
                        const label = dispositivo.label || `Câmera ${count++}`;
                        const textNode = document.createTextNode(label);
                        option.appendChild(textNode);
                        this.cameras.appendChild(option);
                    }
                });

                if (this.state && this.state.deviceId){
                    this.cameras.value = this.state.deviceId;
                }

                this.renderizado = true;
                resolve(true);
            });
        });
    }



    stopMediaTracks(stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }


    mudouEstado(){
        console.log(`Salvando câmera: ${this.cameras.value}`);
        this.state = {deviceId: this.cameras.value};
        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
    }
}
customElements.define('exibidor-camera', ExibidorCamera);