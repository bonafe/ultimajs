


import { ComponenteBase } from '../../componente_base.js';
import { Evento } from '../evento.js';
import { LeitorEspacoDB } from "../modelo/leitor_espaco_db.js";



export class Elemento extends ComponenteBase {

    constructor(){
        super({templateURL:"./elemento.html", shadowDOM:false}, import.meta.url);

        this.dados = null;

        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, (evento) => {

            //O evento também borbulha (bubbles+composed) a partir de qualquer componente carregado
            //dentro de #containerComponente (ex: visualizador-toque). Sem essa checagem, cada carregamento
            //do componente filho reentra aqui e chama carregarComponente() de novo, que anexa outra
            //instância do componente, que dispara outro evento, num loop sem fim.
            if (evento.target !== this){
                return;
            }

            this.containerComponente = super.no_raiz.querySelector("#containerComponente");
            this.containerConfiguracao = super.no_raiz.querySelector("#containerConfiguracao");
            
            //Estilos da configuração
            super.no_raiz.querySelector("#voltar").style.display = "none";
            this.containerComponente.style.display = "flex";
            this.containerConfiguracao.style.display = "none";

            //Comportamento navegação
            this.adicionarComportamentoBotoesElementoTreemap();

            //Na visualização em janelas o jsPanel já tem chrome nativo de minimizar/maximizar/fechar/arrastar,
            //então os ícones equivalentes daqui (que só fazem sentido no treemap, sem chrome de janela) ficam redundantes
            if (this.tagName.toLowerCase() === 'elemento-janela'){
                ['minimizar', 'restaurar', 'maximizar', 'fechar'].forEach(id => {
                    const icone = super.no_raiz.querySelector(`#${id}`);
                    if (icone) icone.parentElement.style.display = 'none';
                });
            }

            if (this.componente && !this.carregandoComponente){

                this.carregarComponente();

            }else{

                this.renderizar(); 
            }                    
        });
    }



    configuracao(abrir){

        //Altera visibilidade do compomente principal e da tela de configuração
        this.containerComponente.style.display = (abrir ? "none" : "flex");
        this.containerConfiguracao.style.display = (abrir ? "flex" : "none");
        super.no_raiz.querySelector("#voltar").style.display = (abrir ? "block" : "none");
        super.no_raiz.querySelector("#configuracao").style.display = (abrir ? "none" : "block"); 

        if (abrir){            

            if (this.carregouComponentesConfiguracao){

                this.renderizar();

            }else{

                //TODO: REMOVER
                //Antes do componenteBase carregar scripts
                //let url_editor_json = super.prefixoEndereco + "/componentes/dados/json/editor/editor_json.js";                
                //import(url_editor_json).then(modulo => {
                    
                this.editorDados = super.no_raiz.querySelector("#editorDados");

                this.editorDados.addEventListener("change", evento => {

                    //Intercepta o evento change do editor de dados
                    evento.stopPropagation();

                    this.dados = evento.detail;
                    this.enviarEventoAtualizacaoElemento();    
                });

                this.montarSelectComponente();
                this.carregouComponentesConfiguracao = true;
                this.renderizar();                   



                //Antes do componenteBase carregar scripts
                //});                
            }            

        //FECHAR / ENCERRAR
        }else{

                                   
        }
    }

    montarSelectComponente(){
        LeitorEspacoDB.getInstance().componentes().then(componentes => {
            
            this.componentes = componentes;

            let select = super.no_raiz.querySelector("#selectComponente");
            select.innerHTML = "";

            this.componentes.forEach(componente => {
                let o = document.createElement("option");
                select.appendChild(o);
                
                o.textContent = componente.nome;
                o.value = componente.nome;

                //Seleciona se for igual ao componente atual
                if (this.componente.nome == componente.nome){
                    select.value = componente.nome;
                }
            });


            try{
                select.removeEventListenter("change", eventoSelecionouComponente.bind(this));
            }catch(e){};

            select.addEventListener("change", eventoSelecionouComponente.bind(this));

            function eventoSelecionouComponente(evento){           
                evento.stopPropagation();
                this.componente = this.componentes.find(c => c.nome == this.no_raiz.querySelector("#selectComponente").value);
                
                this.elemento_visualizacao.componente = this.componente.nome;

                //Cria um novo evento indicando dados do componente
                let eventoCompleto = new Evento(Evento.EVENTO_ATUALIZACAO_VISUALIZACAO, this.elemento_visualizacao);                    
                this.dispatchEvent(eventoCompleto);     
                                        
            };
        });
    }



    enviarEventoAtualizacaoElemento(){
                
        let eventoCompleto = new Evento(Evento.EVENTO_ATUALIZACAO_ELEMENTO, {                                    
            uuid_elemento:this.elemento.uuid,
            uuid_visualizacao:this._uuid_visualizacao,
            uuid_elemento_visualizacao:this._uuid,
            dados:structuredClone(this.dados)
        });    

        this.dispatchEvent(eventoCompleto);  
    }

    enviarEventoSelecaoObjeto(evento){
                
        let eventoCompleto = new Evento(Evento.EVENTO_SELECAO_OBJETO, {                                    
            id_elemento_origem:this.elemento.id,
            id_visualizacao_origem:this._uuid_visualizacao,
            id_elemento_visualizacao_origem:this._uuid,
            dados:structuredClone(evento.detail)
        });    

        this.dispatchEvent(eventoCompleto);  
    }



    static get observedAttributes() {
        return ['uuid_elemento_visualizacao','uuid_visualizacao'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {


        if (nomeAtributo.localeCompare("uuid_elemento_visualizacao") == 0){

            this._uuid = novoValor;
            this.renderizar();


        }else if (nomeAtributo.localeCompare("uuid_visualizacao") == 0){

            this._uuid_visualizacao = novoValor;
            this.renderizar();
        }
    }

    atualizar(){
        this.renderizar();
    }

    renderizar(){

        //Se possui o id do elemento e da visualizacao
        if (this._uuid && this._uuid_visualizacao){
            
            //Recupera detalhes do elemento na visualizacao
            LeitorEspacoDB.getInstance().elemento_visualizacao (this._uuid_visualizacao, this._uuid).then (elemento_visualizacao => {

                this.elemento_visualizacao = elemento_visualizacao;

                //Recupera o elemento global
                LeitorEspacoDB.getInstance().elemento(this.elemento_visualizacao.uuid_elemento).then (elemento => {

                    this.elemento = elemento;
            
                    //Recupera detalhes do componente HTML a ser renderizado
                    LeitorEspacoDB.getInstance().componente (this.elemento_visualizacao.componente).then(componente => {

                        let deveCarregar = true;

                        if (this.componente){
                            if (this.componente.nome == componente.nome){
                                deveCarregar = false;
                            }
                        }
                        if (deveCarregar && !this.carregandoComponente){
                            this.componente = componente;
                            this.carregarComponente();
                        }else{
                            this.atualizarComponenteEEditor();
                        }
                    });                
                });
            });
        }
        
        
    }



    atualizarComponenteEEditor(){
        if (this.instanciaComponente &&  this.elemento){  
            if (this.elemento.dados){  
                if (this.instanciaComponente.getAttribute("dados") != JSON.stringify(this.elemento.dados)){                    
                    this.instanciaComponente.setAttribute("dados", JSON.stringify(this.elemento.dados));            
                }
            }
        }

        if (this.editorDados && this.elemento){
            if (this.elemento.dados){                     
                if (this.editorDados.getAttribute("dados") != JSON.stringify(this.elemento.dados)){                         
                    this.editorDados.setAttribute("dados", JSON.stringify(this.elemento.dados));
                }
            }
        }
    }



    carregarComponente(){

        if (super.carregado){

            this.carregandoComponente = true;
      
            //Componentes com URL Relativa são carregados a partir do diretório raiz do Ultima
            //O diretório raiz é calculado partindo-se de está esta classe Elemento
            //Este arquivo deve estar em componentes/espaco/visualizacao/elemento.js
            //Está a quatro níveis da raiz de onde está hospedado
            let url_raiz_ultima =  new URL("../../../",ComponenteBase.extrairCaminhoURL(import.meta.url));

            //Carrega dinamicamente o componente
            import(ComponenteBase.resolverEndereco(this.componente.url, url_raiz_ultima.href)).then(modulo => {
                
                //modulo não é usado mas está carregado em memória pelo último import
                //podemos pegar informações do módulo do componente que que foi carregado
                //podemos agora referencia-lo pelo nome e cria uma instância
                this.instanciaComponente = document.createElement(this.componente.nome);

                //Nossa classe Elemento exibe esse componente que foi carregado dinamicamente
                super.no_raiz.querySelector("#containerComponente").appendChild(this.instanciaComponente);


                this.instanciaComponente.classList.add('componente');            


                //Passa para frente a mudança de valor do elemento colocando os ids da visualizacao e do elemento visualizacao
                this.instanciaComponente.addEventListener("change", evento => {

                    //Para a propagaçaõ do evento do componente
                    evento.stopPropagation();
                
                    this.dados = evento.detail;

                    this.enviarEventoAtualizacaoElemento();               
                });

                //Passa para frente o evento de seleção de objeto colocando os ids da visualizacao e do elemento visualizacao
                this.instanciaComponente.addEventListener(Evento.EVENTO_SELECAO_OBJETO, evento => {

                    //Para a propagaçaõ do evento do componente
                    evento.stopPropagation();
                
                    this.enviarEventoSelecaoObjeto(evento);
                });
                
                this.carregandoComponente = false;
                this.renderizar();
            });
        }
    }



    adicionarComportamentoBotoesElementoTreemap(){

        //Ir para a configuração do Elemento diz respeito somente a ele
        super.no_raiz.querySelector("#configuracao").addEventListener("click", ()=>{
            this.configuracao(true);
        });
        super.no_raiz.querySelector("#voltar").addEventListener("click", ()=>{
            this.configuracao(false);
        });



        //Já as funções que modificam o elemento no espaço de elementos onde ele está inserido são enviadas para frente como um Evento
        super.no_raiz.querySelector("#aumentar").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_AUMENTAR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});            
        });

        super.no_raiz.querySelector("#diminuir").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_DIMINUIR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});            
        });

        super.no_raiz.querySelector("#irParaTras").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_IR_PARA_TRAS_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});             
        });

        super.no_raiz.querySelector("#irParaFrente").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_IR_PARA_FRENTE_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});            
        });

        super.no_raiz.querySelector("#irParaInicio").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_IR_PARA_INICIO_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});            
        });

        super.no_raiz.querySelector("#irParaFim").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_IR_PARA_FIM_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});              
        });

        super.no_raiz.querySelector("#maximizar").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_MAXIMIZAR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid}); 
        });

        super.no_raiz.querySelector("#restaurar").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_RESTAURAR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});
        });

        super.no_raiz.querySelector("#minimizar").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_MINIMIZAR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});
        });

        super.no_raiz.querySelector("#fechar").addEventListener("click", ()=>{
            Evento.dispararEventoExecutarAcao(this, 
                Evento.ACAO_FECHAR_ELEMENTO.nome, {"uuid_elemento_visualizacao":this._uuid});
        });                    
    }
}