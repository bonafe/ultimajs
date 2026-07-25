import { ControllerBase } from "../../../controller_base.js";
import { LeitorEspacoDB } from "../../../espaco/modelo/leitor_espaco_db.js";
import { Evento } from "../../../espaco/evento.js";



export class ControladorVisualizadorDiferencasJSON extends ControllerBase{



    constructor(){
        super();
    }



    processarEvento (Evento){
        //console.log (`ControladorVisualizadorDiferencasJSON: processarEvento: %o`, Evento);
        
        //Caso a visualizacao tenha sido atualizada        
        if (Evento.type == Evento.EVENTO_VISUALIZACAO_ATUALIZADA){

            let uuid_visualizacao = Evento.detail.uuid_visualizacao;

            LeitorEspacoDB.getInstance().visualizacao(uuid_visualizacao)
                .then(visualizacao => {             
                    
                    //Verifica se existe algum elemento visualizador-diferencas-json
                    for (let indice = 0; indice < visualizacao.elementos.length; indice++){
                        let elementoVisualizacao = visualizacao.elementos[indice];                                             
                        if (elementoVisualizacao.componente == "visualizador-diferencas-json"){

                            //Caso exista, atualiza os dados do visualizador-diferencas-json com os elementos em suas laterais
                            this.atualizarDadosVisualizadorDiferencasJSON(visualizacao, elementoVisualizacao, indice);                            
                        }
                    }                 
                });               
        }        
    }



    atualizarDadosVisualizadorDiferencasJSON(visualizacao, elementoVisualizacao, indice){

        let elementoVisualizacaoEsquerda = ((indice == 0) ? undefined : visualizacao.elementos[indice-1]);
        let elementoVisualizacaoDireita = ((indice == (visualizacao.elementos.lenght-1)) ? undefined : visualizacao.elementos[indice+1]);

        if (!elementoVisualizacaoEsquerda){
            elementoVisualizacaoEsquerda = elementoVisualizacaoDireita;
        }
        if (!elementoVisualizacaoDireita){
            elementoVisualizacaoDireita = elementoVisualizacaoEsquerda;
        }

        if (elementoVisualizacaoEsquerda && elementoVisualizacaoDireita){

            Promise.all([
                LeitorEspacoDB.getInstance().elemento(elementoVisualizacaoEsquerda.uuid_elemento),
                LeitorEspacoDB.getInstance().elemento(elementoVisualizacaoDireita.uuid_elemento)
            ]).then (retornos => {
                const [elementoEsquerda, elementoDireita] = retornos;
                               

                    let dados = {
                        esquerda: elementoEsquerda.state,
                        direita: elementoDireita.state
                    };

                    let eventoCompleto = new Evento(Evento.EVENTO_ATUALIZACAO_ELEMENTO, {                                    
                        uuid_elemento:elementoVisualizacao.uuid_elemento,
                        uuid_visualizacao:visualizacao.uuid,
                        uuid_elemento_visualizacao:elementoVisualizacao.uuid,
                        dados:structuredClone(dados)
                    });                                

                    this.dispatchEvent(eventoCompleto);                     
            });
        }
    }
}