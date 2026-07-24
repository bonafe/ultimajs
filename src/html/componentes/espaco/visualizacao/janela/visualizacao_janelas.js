import { Visualizacao } from '../visualizacao.js';

import { ElementoJanela } from './elemento_janela.js';
import { Evento } from '../../evento.js';
import { ComponenteBase } from '../../../componente_base.js';
import { LeitorEspacoDB } from "../../modelo/leitor_espaco_db.js";


export class VisualizacaoJanelas extends Visualizacao{


    constructor(){
        super();        

        this.paineis = [];

        this.visualizacaoJanelaRenderizado = false;

        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, () => {            

            Promise.all([
                super.carregarCSS("../../../../bibliotecas/jspanel/jspanel.css"),
                super.carregarScript({src:"../../../../bibliotecas/jspanel/jspanel.js"})
            ]).then (() => {
                this.container = super.no_raiz.querySelector(".componente_navegacao_visualizacao");

                //Precisa escutar o evento no document
                document.addEventListener("jspaneldragstop", evento => {

                    let indice = this.visualizacao.elementos.map(e => e.uuid).indexOf (evento.panel.uuid);

                    let elemento = this.visualizacao.elementos[indice];

                    elemento["offsetLeft"] = evento.panel.offsetLeft;
                    elemento["offsetTop"] = evento.panel.offsetTop;

                    console.log(`Drag Stop: ${evento.panel.uuid}: ${evento.panel.offsetLeft}-${evento.panel.offsetTop}`);

                    this.dispatchEvent(new Evento(Evento.EVENTO_ATUALIZACAO_VISUALIZACAO,{uuid_visualizacao:this.visualizacao.uuid})); 
                    
                }, false);
                document.addEventListener("jspanelresizestop", evento => {
                    console.log(`Resize Stop: ${evento.panel.uuid}: ${evento.panel.offsetWidth}-${evento.panel.offsetHeight}`);
                }, false);


                this.renderizar();
            });                   
        });        
    }



    remover(){
        //Fecha todos os painéis porque a visualização está sendo trocada/removida, não porque o
        //usuário pediu para remover cada elemento — o onclosed de criarPainel() precisa distinguir
        //os dois casos, senão trocar de visualização apaga todos os elementos da base.
        this.removendoTudo = true;
        this.paineis.forEach(painel => painel.close());
        this.paineis = [];
        super.remover();
    }



    get paineis(){  
        return this._paineis;
    }
    


    set paineis(paineis){
        this._paineis = paineis;
    }



    renderizar() {

        if (this.container && this._visualizacao && !this.visualizacaoJanelaRenderizado){

            //Atualiza o atributo ordem do elemento
            this._visualizacao.elementos.forEach ((elemento, indice) => elemento.ordem = indice);

            this.visualizacao.elementos.forEach (elemento => {
                this.criarPainel(elemento);
            });

            this.visualizacaoJanelaRenderizado = true;
        }
        super.renderizar();
    }
    

    adicionarElemento(elemento){                                          

        let copiaElemento = structuredClone(elemento);

        this._visualizacao.elementos.push(copiaElemento);
                               
        this.criarPainel(copiaElemento);
    }



    atualizarElemento(uuid_elemento){

        let seletor = `elemento-janela[uuid_elemento="${uuid_elemento}"]`;
        
        let elementos = super.no_raiz.querySelectorAll(seletor);
        
        console.log (`ATUALIZANDO ELEMENTOS visualizacao COM O ELEMENTO PROCURADP: quantidade ${elementos.length}`);

        elementos.forEach(elemento_janela => elemento_janela.atualizar());        
    }





    criarPainel(elemento){

        //Busca a descrição do elemento global para compor um título legível
        //(o registro "elemento_visualizacao" recebido aqui só tem uuid/importancia/nome do componente)
        LeitorEspacoDB.getInstance().elemento(elemento.uuid_elemento).then(elementoGlobal => {

            let titulo = `${elementoGlobal?.descricao || 'Elemento'} — ${elemento.componente}`;

            let painel = jsPanel.create({
                id: `visualizacao_do_Espaco_em_janela_painel_${elemento.uuid}`,
                theme: 'dark',
                headerLogo: '<i class="fad fa-home-heart ml-2"></i>',
                headerTitle: titulo,
                panelSize: {
                    width: () => { return Math.min(800, window.innerWidth*0.9);},
                    height: () => { return Math.min(500, window.innerHeight*0.6);}
                },
                animateIn: 'jsPanelFadeIn',
                onwindowresize: true,
                callback: painel => {
                    //Nome diferente de "elemento" de propósito: o parâmetro elemento (dados vindos de
                    //criarPainel) não pode ser sombreado, senão uuid/uuid_elemento somem (viram undefined).
                    let elementoJanela = document.createElement("elemento-janela");
                    elementoJanela.setAttribute("uuid_elemento_visualizacao", elemento.uuid)
                    elementoJanela.setAttribute("uuid_visualizacao", this.visualizacao.uuid)
                    elementoJanela.setAttribute("uuid_elemento", elemento.uuid_elemento)
                    painel.content.appendChild(elementoJanela);
                    painel.uuid = elemento.uuid;
                },
                //Fechar pelo X nativo do jsPanel remove de fato o elemento (o ícone equivalente do
                //próprio Elemento fica escondido na visão em janelas, ver elemento.js)
                onclosed: () => {
                    this.paineis = this.paineis.filter(p => p !== painel);
                    if (this.removendoTudo){
                        return;
                    }
                    Evento.dispararEventoExecutarAcao(this, Evento.ACAO_FECHAR_ELEMENTO.nome, {uuid_elemento_visualizacao: elemento.uuid});
                },
            });

            this.paineis.push(painel);
        });
    }


    encontrarEAplicarMudanca(idElementoProcurado, funcaoDeMudanca){
                
        let indice = this.visualizacao.elementos.map(e => e.uuid).indexOf (idElementoProcurado);

        let elemento = this.visualizacao.elementos[indice];

        //Aqui é um caso interessante pois é usado o operador !== false porque o normal é não ser false        
        //Se der algum erro na funcaoDeMudanca ela vai explicitamente retornar false
        //Normalmente undefined é avaliado como falso em uma comparação normal,
        //nesse caso undefined precisa ser tratado como um retorno verdadeiro
        if (funcaoDeMudanca(elemento, indice) !== false){
        
            this.renderizar();                  
            this.dispatchEvent(new Evento(Evento.EVENTO_ATUALIZACAO_VISUALIZACAO,{uuid_visualizacao:this.visualizacao.uuid})); 
        }
    }



    aumentar(propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, elemento => {
            elemento.importancia *= 1.5;   
        });
    }




    diminuir (propriedades) {        
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, elemento => {
            elemento.importancia *= 0.50;  
        });
    }



    maximizar (propriedades) {

        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, elemento => {

            let somaImportanciaOutros = this.visualizacao.elementos.reduce ((valorAnterior, elementoAtual) => {
                if (elementoAtual.uuid != elemento.uuid){                        
                    return valorAnterior + elementoAtual.importancia;
                }else{
                    return valorAnterior;
                }
            },0);
           
            elemento.importancia = somaImportanciaOutros;
        });
    }



    minimizar (propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, elemento => {

            let menorImportancia = this.visualizacao.elementos.reduce ((valorAnterior, elementoAtual) => {
                if (elementoAtual.importancia < valorAnterior){
                    return elementoAtual.importancia;
                }else{
                    return valorAnterior;
                }
            },Number.MAX_VALUE);
            
            elemento.importancia = menorImportancia;
        });
    }



    restaurar (propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, elemento => {

            let somaImportancia = this.visualizacao.elementos.reduce ((valorAnterior, elementoAtual) => {                    
                return valorAnterior + elementoAtual.importancia;                    
            },0);
            
            const mediaImportancia = somaImportancia / this.visualizacao.elementos.length || 0;

            elemento.importancia = mediaImportancia;
        });
    }



    fechar (propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, (elemento, indice) => {

            if (indice >= 0){

                //Remove o elemento da posição
                let [elemento] = this.visualizacao.elementos.splice(indice,1);                                                        

            }else{

                //Não executa atualização
                return false;
            }
        });
    }



    irParaTras(propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, (elemento, indice) => {

            if (indice > 0){

                //Remove o elemento da posição
                let [elemento] = this.visualizacao.elementos.splice(indice,1);
                //O recoloca em uma posição anterior
                this.visualizacao.elementos.splice(indice-1,0,elemento);                                        
                
            }else{

                //Não executa atualização
                return false;
            }
        });
    }



    irParaFrente(propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, (elemento, indice) => {
        
            if (indice < (this.visualizacao.elementos.length-1)){
                
                //Remove o elemento da posição
                let [elemento] = this.visualizacao.elementos.splice(indice,1);                    
                //O recoloca em uma posição posterior
                this.visualizacao.elementos.splice(indice+1,0,elemento);                                        
                         
            }else{

                //Não executa atualização
                return false;
            }
        });
    }



    irParaFim(propriedades) {
        
        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, (elemento, indice) => {
        
            if (indice < (this.visualizacao.elementos.length-1)){

                //Remove o elemento da posição
                let [elemento] = this.visualizacao.elementos.splice(indice,1);
                //O recoloca no final
                this.visualizacao.elementos.splice(this.visualizacao.elementos.length,0,elemento);
                                                    
            }else{

                //Não executa atualização
                return false;
            }
        });
    }



    irParaInicio(propriedades) {

        this.encontrarEAplicarMudanca(propriedades.uuid_elemento_visualizacao, (elemento, indice) => {
        
        if (indice > 0){

            //Remove o elemento da posição
            let [elemento] = this.visualizacao.elementos.splice(indice,1);
            //O recoloca no inicio
            this.visualizacao.elementos.splice(0,0,elemento);                       

           }else{

                //Não executa atualização
                return false;
            }
        });
    }
}

customElements.define('visualizacao-janelas', VisualizacaoJanelas);