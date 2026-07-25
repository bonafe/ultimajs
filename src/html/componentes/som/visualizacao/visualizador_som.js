import { ComponentBase } from '../../component_base.js';
import { Evento } from '../../espaco/evento.js';



export class VisualizadorSom extends ComponentBase {



    constructor(){
        super({templateUrl:"./visualizador_som.html", shadowDom:true}, import.meta.url);

        this.video = undefined;        

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {                        

            this.fontesDeSom = super.rootNode.querySelector("#fontesDeSom"); 

            this.canvas = super.rootNode.querySelector("#visualizadorSom");

            this.downloadGravacao = super.rootNode.querySelector("#downloadGravacao");
            this.btnGravacao = super.rootNode.querySelector("#btnGravacao");

            this.fontesDeSom.addEventListener("change", ()=>{
                this.iniciarFonteDeSom();
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
            console.log("Dados visualizador som: %o",this.state);

            if (this.state.deviceId && this.fontesDeSom){
                this.fontesDeSom.value = this.state.deviceId;
                this.iniciarFonteDeSom();
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
            
            this.preencherFontesDeSomDisponiveis().then(()=>{
                this.iniciarFonteDeSom();            
            });
        }        
    }



    iniciarVisualizador(){

        this.audioContext = new window.AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.source.connect(this.analyser);          
        
        requestAnimationFrame(this.desenhar.bind(this));
    }



    desenhar(){

        this.analyser.fftSize = 2048;
        let bufferLength = this.analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        let ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = 'rgb(200, 200, 200)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.desenharBarras(ctx, dataArray, bufferLength);
        this.desenharLinhas(ctx, dataArray, bufferLength);
        
        requestAnimationFrame(this.desenhar.bind(this));
    }

    desenharBarras(ctx, dataArray, bufferLength){
        let barWidth = (this.canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i]/2;
    
            ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            ctx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight);
    
            x += barWidth + 1;
        }
    }

    desenharLinhas(ctx, dataArray, bufferLength){
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();

        let sliceWidth = this.canvas.width * 1.0 / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {

            let v = dataArray[i] / 128.0;
            let y = v * this.canvas.height/2;
    
            if(i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
    
            x += sliceWidth;
        }
        ctx.lineTo(this.canvas.width, this.canvas.height/2);
        ctx.stroke();
    }

    iniciarFonteDeSom(){

        (new Promise((resolve, reject) => {                     

            if (this.fontesDeSom.value != '') {
            
                const dispositivo = JSON.parse(this.fontesDeSom.value);

                console.log (`Iniciando dispositivo: %o`, dispositivo);

                const constraints = {
                    audio:{deviceId:dispositivo.deviceId}                               
                };     


                navigator.mediaDevices
                    .getUserMedia(constraints)
                        .then(stream => {                
                            this.stream = stream;                             
                            resolve(true);               
                        })        
                        .catch(error => {
                            console.error(error);
                            reject();
                        });
            }        
        })).then(()=>{
            this.iniciarVisualizador();
        });
    }



    preencherFontesDeSomDisponiveis(){
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices().then( dispositivos => {
        
                this.fontesDeSom.innerHTML = '';
                //this.fontesDeSom.appendChild(document.createElement('option'));
                let count = 1;

                dispositivos.forEach( dispositivo => {

                    //TODO
                    if (['audioinput', 'audiooutput'].indexOf(dispositivo.kind) != -1) {

                        const option = document.createElement('option');
                        option.value = JSON.stringify(dispositivo);
                        const label = dispositivo.label || `Fonte de Som ${count++}`;
                        const textNode = document.createTextNode(label);
                        option.appendChild(textNode);
                        this.fontesDeSom.appendChild(option);
                    }
                });

                if (this.state && this.state.deviceId){
                    this.fontesDeSom.value = this.state.deviceId;
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
        console.log(`Salvando fonte de Som: ${this.fontesDeSom.value}`);
        this.state = {deviceId: this.fontesDeSom.value};
        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
    }
}
customElements.define('visualizador-som', VisualizadorSom);