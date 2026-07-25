import { Visualizacao } from '../visualizacao.js';

import { Evento } from '../../evento.js';

import { ComponentBase } from '../../../component_base.js';

import { ElementoTreemap } from './elemento_treemap.js';




export class VisualizacaoTreemap extends Visualizacao{




    constructor(){
        super();        

        this.cssCarregado = false;

        this.addEventListener(ComponentBase.LOADED_EVENT, (evento) => {

            //Idem visualizacao.js: ignora eventos borbulhados de descendentes que carregam depois.
            if (evento.target !== this){
                return;
            }

            this.container = super.rootNode.querySelector(".componente_navegacao_visualizacao");

            this.carregarCSS("./visualizacao_treemap.css", import.meta.url)
                .then(()=>{
                    this.cssCarregado = true;
                    this.render();
                });
        });
    }



    render() {

        if (this.container && super.visualizacao && this.cssCarregado){

            //Atualiza o atributo ordem do elemento
            super.visualizacao.elementos.forEach ((elemento, indice) => elemento.ordem = indice);

            if (!this.node){
                this.criarTreeMap();
            }else{
                this.atualizarTreeMap();
            }
        }
        super.render();
    }
    


    adicionarElemento(elemento){                                          

        super.visualizacao.elementos.push({...elemento});
                               
        this.render();    
    }



    atualizarElemento(uuid_elemento){
        let seletor = `elemento-treemap[uuid_elemento="${uuid_elemento}"]`;
        let elementos = super.rootNode.querySelectorAll(seletor);
        console.log (`ATUALIZANDO ELEMENTOS visualizacao COM O ELEMENTO PROCURADP: quantidade ${elementos.length}`);
        elementos.forEach(ultimaTreemapElemento => ultimaTreemapElemento.atualizar());        
    }



    criarTreeMap(){

        d3.select(this.container).selectAll("div").remove();
    

        let width = (super.widthVisualizacao + super.margemVisualizacao.left + super.margemVisualizacao.right) + "px";
        let height = (super.heightVisualizacao + super.margemVisualizacao.top + super.margemVisualizacao.bottom) + "px";
        let left = super.margemVisualizacao.left + "px";
        let top = super.margemVisualizacao.top + "px";
        
        console.log (`width: ${width} height: ${height} left: ${left} top: ${top}`);

        this.divD3 = d3.select(this.container).append("div")
            .style("position", "relative")
            .style("width", width)
            .style("height", height)
            .style("left", left)
            .style("top", top);
        
        this.enterUpdateExit();  
    }



    enterUpdateExit(){

        this.treemap = d3.treemap().size([super.widthVisualizacao, super.heightVisualizacao]);
        
        //TODO: tive que criar o campo id pois não sei setar um campo com nome diferente no D3 e estava
        //Redesenhando a tela toda hora pois mudou de campo id para uuid o nome
        this.visualizacao.elementos.forEach (e => e.id = e.uuid);

        const root = d3.hierarchy(this.visualizacao, (d) => d.elementos)
            
            //Valor do elemento para cálculo da área do TreeMap
            .sum( d => d.importancia)

            

            //Ordem dos elementos no Treemap
            .sort((a, b) => (a.data.ordem - b.data.ordem));         
        
        this.node = this.divD3.selectAll(".node_treemap_d3js").data(this.treemap(root).leaves(), d => d.data.id);                                      

        //EXIT
        this.node.exit().remove();

        let novosNos = this.node
            //ENTER
            .enter()
                .append("elemento-treemap")                    
                    .attr("class", "node_treemap_d3js container_treemap_d3js")
                    .attr("uuid_elemento_visualizacao",(d) => d.data.uuid)
                    .attr("uuid_visualizacao", (d) => this._visualizacao.uuid)                    
                    .attr("uuid_elemento", (d) => d.data.uuid_elemento)
                    .style("left", (d) => {
                        console.dir(d);
                        return d.x0 + "px";
                    })
                    .style("top", (d) => d.y0 + "px")
                    .style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
                    .style("height", (d) => Math.max(0, d.y1 - d.y0  - 1) + "px");
   
        this.node
            //UPDATE
            .transition().duration(500)
                .style("left", d => {
                    console.log (`left: ${d.x0}px`);
                    return `${d.x0}px`;
                })
                .style("top", d => {
                    console.log (`top: ${d.y0}px`);
                    return `${d.y0}px`;
                })
                .style('width', d => {
                    console.log (`width: ${Math.max(0, d.x1 - d.x0 -1)}px`);   
                    return `${Math.max(0, d.x1 - d.x0 -1)}px`;
                })
                .style('height', d => {
                    console.log (`height: ${Math.max(0, d.y1 - d.y0 -1)}px`);
                    return `${Math.max(0, d.y1 - d.y0 -1)}px`;
                });                                    
    }



    atualizarTreeMap(){

        this.enterUpdateExit();
    }


    encontrarEAplicarMudanca(idElementoProcurado, funcaoDeMudanca){
                
        let indice = this.visualizacao.elementos.map(e => e.uuid).indexOf (idElementoProcurado);

        let elemento = this.visualizacao.elementos[indice];

        //Aqui é um caso interessante pois é usado o operador !== false porque o normal é não ser false        
        //Se der algum erro na funcaoDeMudanca ela vai explicitamente retornar false
        //Normalmente undefined é avaliado como falso em uma comparação normal,
        //nesse caso undefined precisa ser tratado como um retorno verdadeiro
        if (funcaoDeMudanca(elemento, indice) !== false){
        
            this.render();                  
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

customElements.define('visualizacao-treemap', VisualizacaoTreemap);