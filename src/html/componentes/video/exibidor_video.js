import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';


export class ExibidorVideo extends ComponentBase {

    constructor(){
        super({templateUrl:"./exibidor_video.html", shadowDom:false}, import.meta.url);

        this._dados = undefined;
        this.ultimoTempo = 0;

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {
            
            window.addEventListener(Evento.EVENTO_PLAYER_YOUTUBE_CARREGADO, ()=> this.render());
            this.render();
        });
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

        //TODO: lidar com mudanças nos valores dos dados
        //Se todos os elementos estão prontos e nenhum componente de vídeo foi criado
        if (super.loaded && YT && this.state && !this.componenteVideo){
            
            this.carregarComponenteVideo();                 
        }

        this.processarAcoes();
    }

    carregarComponenteVideo(){

        this.inicializarAcoes();

        this.componenteVideo = 
            new YT.Player(
                super.rootNode.querySelector("#video"), 
                {                  
                    videoId: this.state.src,
                    events: {
                        'onReady': evento =>{
                            //TODO: deve mesmo começar sempre o vídeo? #ficadica
                            evento.target.playVideo();
                            this.render();
                        },
                        'onStateChange': evento =>{

                            this.estadoAtualPlayerVideo = evento.data;
                            this.render();


                            switch (this.estadoAtualPlayerVideo){

                                case YT.PlayerState.BUFFERING:
                                    console.log("BUFFERING");
                                break;

                                case YT.PlayerState.CUED:
                                    console.log("CUED");
                                break;

                                case YT.PlayerState.ENDED:
                                    console.log("ENDED");
                                break;

                                case YT.PlayerState.PAUSED:
                                    console.log("PAUSED");
                                break;

                                case YT.PlayerState.PLAYING:
                                    console.log("PLAYING");
                                break;

                                case YT.PlayerState.UNSTARTED:
                                    console.log("UNSTARTED");
                                break;
                            }                            
                        }
                    }
                }
            );  
    }


    inicializarAcoes(){
        if (this.state.acoes){        
            this.state.acoes.forEach(acao => {
                acao.executada = false;
            });
        }
    }



    processarAcoes(){
        if (this.state && this.componenteVideo){

            //TODO: esse IF pode ir para a condição de cima? dá para garantir a ordem que vai acontecer em javascript?            
            if (this.state.acoes){ 

                if (this.estadoAtualPlayerVideo == YT.PlayerState.PLAYING){

                    this.tempoAtualVideo = this.componenteVideo.getCurrentTime();

                    //Se o tempo atual é menor que o último tempo registrado
                    if (this.tempoAtualVideo < this.ultimoTempo){
                        //Significa que voltou o video
                        //Zera a execução das ações do vídeo do ponto atual para frente
                        this.state.acoes.filter (acao => acao.tempo >= this.tempoAtualVideo)
                            .forEach(acao => {
                                acao.executada = false;
                            });
                    }
                    this.ultimoTempo = this.tempoAtualVideo;
                                        
                    //Executa as ações que aconteceram desde a última vez que rodou
                    this.state.acoes.filter (acao => !acao.executada && (acao.tempo < this.tempoAtualVideo))
                        .forEach(acao => {                            
                            acao.executada = true;
                            this.dispatchEvent (new Evento(Evento.EVENTO_EXECUTAR_ACAO, acao));
                        });      
                    
                    //Verifica ações 10 vezes por segundo
                    setTimeout(this.processarAcoes.bind(this), 300);
                }          
            }
        }
    }
}
customElements.define('exibidor-video', ExibidorVideo);