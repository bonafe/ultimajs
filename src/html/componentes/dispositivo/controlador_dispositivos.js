



import { ControllerBase } from "../controller_base.js";
import { LeitorEspacoDB } from "../espaco/modelo/leitor_espaco_db.js";
import { Evento } from "../espaco/evento.js";




export class ControladorDispositivos extends ControllerBase{



    constructor(){
        super();
    }


    
    processarEvento (evento){
        //console.log (`ControladorDispositivos: processarEvento: %o`, Evento);

        //REGRA: EVENTO SELEÇÃO DE OBJETO
        if (evento.type == Evento.EVENTO_SELECAO_OBJETO){

            LeitorEspacoDB.getInstance().elemento_visualizacao(evento.detail.id_visualizacao_origem, evento.detail.id_elemento_visualizacao_origem)

                .then(elemento_visualizacao => {
                    
                    //REGRA: Vinda de um componente do tipo exibidor-dispositivos
                    if (elemento_visualizacao.componente == "exibidor-dispositivos"){
                        
                        let componente = undefined;

                        if (evento.detail.state.kind == "videoinput"){
                            componente = "exibidor-camera";

                        }else if (['audioinput', 'audiooutput'].indexOf(evento.detail.state.kind) != -1) {
                            componente = "visualizador-som";
                        }

                        if (componente){
                            Evento.dispararEventoExecutarAcao(this, 
                                Evento.ACAO_ADICIONAR_ELEMENTO.nome, 
                                {
                                    "nome_elemento": "Nova exibição dispositivo",
                                    "nome_componente": componente,
                                    "dados": evento.detail.state
                                }
                            );
                        } 
                        
                    }                    
                });
        }
    }
}