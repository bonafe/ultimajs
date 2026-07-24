import { ComponenteBase } from '../../componente_base.js';
import { Evento } from '../evento.js';
import { LeitorEspacoDB } from "../modelo/leitor_espaco_db.js";



export class Visualizacao extends ComponenteBase{

    

    constructor(){
        super({templateURL:"./visualizacao.html", shadowDOM:true}, import.meta.url);        

        this._visualizacao = undefined;

        this.margemVisualizacao = {top: 0, right: 0, bottom: 0, left: 0};  

        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, (evento) => {

            //O evento borbulha (bubbles+composed) a partir de qualquer descendente que carregar depois
            //(ex: componentes carregados dinamicamente dentro de um elemento do treemap). Sem essa
            //checagem, cada carregamento de um descendente reentra aqui e re-renderiza à toa.
            if (evento.target !== this){
                return;
            }

            this.container = super.no_raiz.querySelector(".componente_navegacao_visualizacao");

            this.renderizar();
        });
    }



    get margemVisualizacao(){
        return this._margemVisualizacao;
    }



    set margemVisualizacao(margemVisualizacao){
        this._margemVisualizacao = margemVisualizacao;
    }



    get widthVisualizacao(){
        return (this.container && this.margemVisualizacao ? this.container.clientWidth - this.margemVisualizacao .left - this.margemVisualizacao.right : 0);
    }



    get heightVisualizacao(){
        return (this.container && this.margemVisualizacao ? this.container.clientHeight - this.margemVisualizacao.top - this.margemVisualizacao.bottom : 0);
    }



    renderizar() {      

        if (super.carregado && !this.renderizado && this.visualizacao){
            this.criarEIniciarMenuDeAcoes();
            this.renderizado = true;
        }
    }    


    
    criarEIniciarMenuDeAcoes(){

        let menuAcoes = super.no_raiz.querySelector("#menuAcoes");
        menuAcoes.innerHTML = "";

        super.no_raiz.querySelector("#reiniciar").addEventListener("click", () => {
            Evento.dispararEventoExecutarAcao(this, Evento.ACAO_REINICIAR.nome);               
        });

        //Busca o detalhe das ações relacionadas a esta Visualizacao
        Promise.all(this._visualizacao.acoes.map(idAcao => LeitorEspacoDB.getInstance().acao(idAcao)))
            .then (acoes => {
                acoes.forEach (acao => {
                    let a = document.createElement("a");
                    a.href = "#";
                    a.textContent = acao.titulo;
                    menuAcoes.appendChild(a);

                    a.addEventListener("click", e => {
                        Evento.dispararEventoExecutarAcao(this, 
                            acao.nome_acao, 
                            {
                                nome_elemento:acao.dados.nome_elemento,
                                nome_componente:acao.dados.nome_componente,
                                dados:acao.dados.dados
                            });                         
                    });
                });
            });        
    }



    adicionarElemento(elemento){                                          

        this._visualizacao.elementos.push(structuredClone(elemento));
                               
        this.renderizar();    
    }



    set visualizacao(nova_visualizacao){        
        this._visualizacao = structuredClone(nova_visualizacao);
        this.renderizar();
    }



    get visualizacao(){
        return this._visualizacao;
    }



    static get observedAttributes() {
        return ['visualizacao'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

        //Atributo componente é usado pelo ElementoTreeMap para definir qual componente renderizar
        if (nomeAtributo.localeCompare("visualizacao") == 0){

            this._visualizacao = JSON.parse(novoValor);
            this.renderizar();
        }       
    }



    processarNovasDimensoes(largura, altura){

        //Evita loop de renderização: o ResizeObserver às vezes reporta a mesma dimensão
        //repetidamente (ex: quando o próprio re-render altera scrollbars/layout), e
        //re-renderizar sem essa checagem faz o D3 recalcular estilos indefinidamente.
        if (largura === this.ultimaLarguraObservada && altura === this.ultimaAlturaObservada){
            return;
        }

        this.ultimaLarguraObservada = largura;
        this.ultimaAlturaObservada = altura;

        this.renderizar();
    }



    substituirElementoContainer(elementoContainer) {
        
        let evento = d3.event;

        //Para a propagaçaõ do evento do componente
        evento.stopPropagation();

        let elemento_visualizacao_atualizado = evento.detail;

        let indice = this.visualizacao.elementos.map(e => e.uuid).indexOf (elemento_visualizacao_atualizado.uuid);

        //Remove o elemento da posição
        let [elemento] = this.visualizacao.elementos.splice(indice,1);

        //Coloca o elemento atualizado no lugar
        this.visualizacao.elementos.splice(indice,0,elemento_visualizacao_atualizado);  

        this.salvar();                           
    }

    
    remover(){
        this.remove();
    }
}