import { ComponenteBase } from "../componente_base.js";
import { Evento } from "./evento.js";
import { EscritorEspacoDB } from "./modelo/escritor_espaco_db.js";
import { LeitorEspacoDB } from "./modelo/leitor_espaco_db.js";
import { VisualizacaoTreemap } from "./visualizacao/treemap/visualizacao_treemap.js";
import { VisualizacaoJanelas } from "./visualizacao/janela/visualizacao_janelas.js";



/**
 * Representa um espaço de trabalho do Ultima 
 */
export class Espaco extends ComponenteBase{    


    static VISUALIZACOES_DISPONIVEIS = ["visualizacao-janelas", "visualizacao-treemap"];

    /**
     * Carrega o template HTML que irá conter uma visualizacao de elementos.
     * Aguarda o evento 'carregou' para iniciar o carregamento das configurações
     *@constructor
     *@see carregarConfiguracao     
     */
    constructor(){
        
        super({templateURL:"./espaco.html", shadowDOM:true}, import.meta.url);        

        this.renderizado = false;

        this.configuracoesCarregadas = false;

        //TODO: deve selecionar a visualização baseado no dispositivo
        this.indiceVisualizacaoSelecionado = 1; // VIZUALIZADORES_DISPONIVEIS[1] = visualizacao-treemap

        this.visualizacao = undefined;

        //BUG: o nome do evento era a string 'carregou', mas o evento real disparado por
        //ComponenteBase é EVENTO_CARREGOU ("carregou_componente") — esse listener nunca disparava.
        //Sem ele, carregarConfiguracao() só era chamado por attributeChangedCallback('src', ...), que
        //corre em paralelo com o carregamento do próprio template do Espaco: se o fetch da config +
        //leitura do IndexedDB terminarem antes do template (super.carregado ainda false),
        //this.renderizar() silenciosamente não faz nada e nada mais tenta de novo depois — a página
        //fica em branco (mas com os dados intactos no banco). Corrigido para o nome certo do evento,
        //com checagem de target porque o evento também borbulha de qualquer descendente.
        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, (evento) => {

            if (evento.target !== this){
                return;
            }

            //this.iniciarServiceWorkers();
            this.carregarConfiguracao();
        });
    }


    /**
     * 
     * @param {Object} configuracao - Objeto com as configurações do Ultima
     * @param {Array} configuracao.visualizacoes - Array de visualizações
     * @param {Array} configuracao.elementos - Array de elementos
     * @param {Array} configuracao.componentes - Array de componentes
     * @param {Array} configuracao.acoes - Array de ações
     * @param {Array} configuracao.controladores - Array de controladores
     * @param {Array} configuracao.visualizacao - Array de visualizações
     *      
     **/
    carregarConfiguracao(){

        //LeitorEspacoDB extende EspacoDB que é uma base de dados que ao iniciar 
        //carrega configurações padrão de componentes e controladores
        LeitorEspacoDB.getInstance().visualizacoes().then (visualizacoes => {

            //Se existirem visualizacoes na base não recarrega
            //TODO: precisa tratar mudança de versão, colocar versão no 
            //arquivo de configuração e fazer merge das configurações se for atualizado        
            if (visualizacoes.length > 0){

                //Uma das condições para renderização é que as configurações estejam carregadas
                this.configuracoesCarregadas = true;        
                this.renderizar();


            //Caso não existam visualizacoes na base [1ª Vez]
            }else{

                //Caso um arquivo de configuração tenha sido carregado via attributeChangedCallback,
                //deve utilizar as configurações desse arquivo
                if (this.configuracao){

                    //Carrega as visualizacoes a partir do arquivo de configuração
                    this.visualizacoes = this.configuracao.visualizacoes;

                    console.log ("Carregando configuracao do arquivo");

                    //Escreve todas as configurações do novo arquivo de configurações na base de dados
                    Promise.all([
                        EscritorEspacoDB.getInstance().atualizarElementos(this.configuracao.elementos),
                        EscritorEspacoDB.getInstance().atualizarComponentes(this.gerarCaminhoAbsolutoURL(this.configuracao.componentes)),
                        EscritorEspacoDB.getInstance().atualizarAcoes(this.configuracao.acoes),
                        EscritorEspacoDB.getInstance().atualizarControladores(this.gerarCaminhoAbsolutoURL(this.configuracao.controladores)),

                        //TODO: está selecionado automaticamente a primeira visualização 
                        //TODO: A visualização escolhida deveria ser a do último estado da aplicação
                        //TODO: Dessa forma a aplicação sempre continua de onde parou
                        EscritorEspacoDB.getInstance().atualizarVisualizacao(this.visualizacoes[0])


                    ]).then (respostas => {

                        this.configuracoesCarregadas = true;

                        this.renderizar();
                    });

                
                //Caso nenhum arquivo de configuração tenha sido passado
                }else{
                    
                    //Cria uma visualizacao vazia e entra no modo de configuração
                    let nova_visualizacao = {
                        "uuid": window.crypto.randomUUID(),
                        "descricao": "Nova visualizacao",
                        "acoes": [],
                        "elementos": []
                    };

                    //Persiste na base local a visualização que acabamos de criar
                    EscritorEspacoDB.getInstance().atualizarVisualizacao(nova_visualizacao).then(resposta =>{


                        this.visualizacoes = [nova_visualizacao];

                        this.configuracoesCarregadas = true;                 

                        //Entra automaticamente na configuração
                        this.configuracao();
                    });                                      
                }
            }
        });        
    }



    mudarVisualizacao(){
        this.indiceVisualizacaoSelecionado = (this.indiceVisualizacaoSelecionado + 1) % Espaco.VISUALIZACOES_DISPONIVEIS.length;
        this.criarEIniciarControleNavegador();
    }



    renderizar(){

        //TODO: Deve alterar a exibição caso um novo arquivo seja carregado
        if (super.carregado && this.configuracoesCarregadas && !this.renderizado){

            //Marca ANTES do trabalho assíncrono: carregarConfiguracao() agora pode ser chamado duas
            //vezes de forma legítima (attributeChangedCallback + EVENTO_CARREGOU), e se this.renderizado
            //só virasse true no final, as duas chamadas concorrentes passavam pela guarda acima antes de
            //qualquer uma terminar, duplicando os listeners de clique do cabeçalho (fullscreen,
            //configuração, ajuda, mudar visualização) — um clique real disparava a ação duas vezes.
            this.renderizado = true;

            this.carregarControladores().then(()=>{

                LeitorEspacoDB.getInstance().visualizacoes().then (visualizacoes => {

                    this.visualizacoes  = visualizacoes;

                    this.criarAcoes();

                    this.criarEIniciarControleNavegador();
                });
            });
        }
    }



    criarAcoes(){
        super.no_raiz.querySelector("#fullscreen").addEventListener("click", () => {
            window.openFullscreen();
        });
    
        super.no_raiz.querySelector("#configuracao").addEventListener("click", () => {
          this.configuracao();
        });
    
        super.no_raiz.querySelector("#ajuda").addEventListener("click", () => {
          alert (`Última Versão: ${EspacoDB.VERSAO}`);
        });
    
        super.no_raiz.querySelector("#mudarVisualizacao").addEventListener("click", () => {
          this.mudarVisualizacao();
        });
    }

    

    // Importa e instancia classes de controladores a partir das informações que 
    // estão armazenadas localmente no IndexDB, retorna um array de promises que resolve
    // quando todas forem carregadas
    carregarControladores(){

        return new Promise ((resolve, reject) => {
            
            LeitorEspacoDB.getInstance().controladores().then (controladores => {
                    
                this.controladores  = controladores;

                //Cria um array de Promises com cada carregamento de Controlador
                Promise.all(

                    //Para cada controlador
                    this.controladores.map (controlador => 

                        //Cria um promise
                        new Promise((resolveC, rejectC) => {

                            //Componentes com URL Relativa são carregados a partir do diretório raiz do Ultima
                            //O diretório raiz é calculado partindo-se de está esta classe UltimaElemento
                            let url_raiz_ultima =  new URL("../../",ComponenteBase.extrairCaminhoURL(import.meta.url));

                            //Carrega dinamicamente o modulo do componente do controlador
                            import(ComponenteBase.resolverEndereco(controlador.url, url_raiz_ultima.href)).then(modulo => {

                                //Cria uma nova instância desse componente
                                controlador.instanciaControlador = new modulo[controlador.nome_classe]();                                                    
                                
                                //Sinaliza que a promise foi resolvida
                                resolveC(true);
                            });
                        })
                    )

                //Quando todos os controladores forem carregados, resolve a promise
                ).then(()=>resolve(true));
            });
        });
    }



    criarEIniciarControleNavegador(){

        if (this.visualizacao){
            this.visualizacao.remover();            
        }

        let containerVisualizacao = super.no_raiz.querySelector(".secao_principal_ultima");

        //Cria um novo HTMLElement baseado no indice da visualizacao selecionada
        this.visualizacao = document.createElement(
            Espaco.VISUALIZACOES_DISPONIVEIS[this.indiceVisualizacaoSelecionado]
        );
        
        containerVisualizacao.appendChild(this.visualizacao);
            


        //TODO: só está pegando a primeira visualizacao
        this.visualizacao.visualizacao = {...this.visualizacoes[0]};

        //Os listeners abaixo ficam em "this" (Espaco) e nos controladores, que não são recriados a
        //cada troca de visualização — só a "visualizacao" (this.visualizacao) muda. Sem essa guarda,
        //cada chamada de mudarVisualizacao() empilhava mais um listener para os mesmos eventos, e uma
        //única ação (ex: clicar num item do menu) passava a executar N vezes, duplicando elementos.
        if (this.listenersDeNavegacaoRegistrados){
            return;
        }
        this.listenersDeNavegacaoRegistrados = true;

        //Percorre alguns eventos pré-definidos criando monitoramento para eles
        [
            {evento:Evento.EVENTO_SELECAO_OBJETO},

            {evento:Evento.EVENTO_VISUALIZACAO_ATUALIZADA},

            {evento:Evento.EXECUTAR_ACAO, funcao:this.executarAcao.bind(this)},

            //Eventos direcionados para o controle navegador
            //TODO: poder ter vários controladores de containeres de navegação            
            {evento:Evento.EVENTO_ATUALIZACAO_VISUALIZACAO, funcao:this.atualizarVisualizacao.bind(this)},            

            //Eventos tratados diretamente pelo ultima-visualizacao                                    
            {evento:Evento.EVENTO_ATUALIZACAO_ELEMENTO, funcao:this.atualizacaoElemento.bind(this)},

            {evento:Evento.EVENTO_ELEMENTO_ATUALIZADO, funcao:this.elementoAtualizado.bind(this)}

        ].forEach (objetoEventoMonitorado => {                        

            this.addEventListener (objetoEventoMonitorado.evento, evento => {

                this.processarEvento (evento, objetoEventoMonitorado);
            });

            //Monitora eventos dos controladores
            this.controladores.forEach(controlador => {
                controlador.instanciaControlador.addEventListener (objetoEventoMonitorado.evento, evento => {
                    if (objetoEventoMonitorado.evento == Evento.EXECUTAR_ACAO){
                        console.log ("************************************** CHEGOU EVENTO controlador");                
                    }
                    this.processarEvento (evento, objetoEventoMonitorado);
                });
            })
        });                                   
    }




    



    //Quando chega um evento ele será propagado para todos os controladores
    enviarEventoParaControladores(evento){
        this.controladores.forEach (controlador => {
            controlador.instanciaControlador.processarEvento (evento);
        });
    }



  

    

    static get observedAttributes() {
        return ['src'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {
        
        //URL do arquivo de configuração
        if (nomeAtributo.localeCompare("src") == 0){

            //Resolve para uma URL absoluta: gerarCaminhoAbsolutoURL usa extrairCaminhoURL(this._src)
            //como base para resolver os caminhos de componentes/controladores, o que falha
            //(TypeError: Invalid base URL) se _src permanecer um caminho relativo como "./configuracao_ultima.json"
            this._src = new URL(novoValor, document.baseURI).href;
            fetch(this._src)
                .then (response => response.json())
                .then(configuracao => {
                    this.configuracao = configuracao;
                    this.carregarConfiguracao();
                });                     


        }
    }



    

    gerarCaminhoAbsolutoURL(lista){
        return lista.map(elemento => {
            if (elemento.url){
                elemento.url = ComponenteBase.resolverEndereco(elemento.url, ComponenteBase.extrairCaminhoURL(this._src)).href;
            }
            return elemento;
        })
    }



    
    
    
    processarEvento (evento, objetoEventoMonitorado){
        this.enviarEventoParaControladores (evento);
        if (objetoEventoMonitorado.funcao){
            return objetoEventoMonitorado.funcao(evento.detail);
        }
    }

    executarAcao(acao){

        //Cria um dicionário com as ações disponíveis e as respectivas funções que as executam
        let relacao_acao_funcao = {        
            
            [Evento.ACAO_REINICIAR.nome]:this.reiniciar.bind(this),
            [Evento.ACAO_ADICIONAR_ELEMENTO.nome]:this.adicionarElemento.bind(this),

            [Evento.ACAO_AUMENTAR_ELEMENTO.nome]:this.visualizacao.aumentar.bind(this.visualizacao),
            [Evento.ACAO_DIMINUIR_ELEMENTO.nome]:this.visualizacao.diminuir.bind(this.visualizacao),
            [Evento.ACAO_MAXIMIZAR_ELEMENTO.nome]:this.visualizacao.maximizar.bind(this.visualizacao),
            [Evento.ACAO_MINIMIZAR_ELEMENTO.nome]:this.visualizacao.minimizar.bind(this.visualizacao),
            [Evento.ACAO_RESTAURAR_ELEMENTO.nome]:this.visualizacao.restaurar.bind(this.visualizacao),
            [Evento.ACAO_FECHAR_ELEMENTO.nome]:this.visualizacao.fechar.bind(this.visualizacao),
            [Evento.ACAO_IR_PARA_TRAS_ELEMENTO.nome]:this.visualizacao.irParaTras.bind(this.visualizacao),
            [Evento.ACAO_IR_PARA_FRENTE_ELEMENTO.nome]:this.visualizacao.irParaFrente.bind(this.visualizacao),
            [Evento.ACAO_IR_PARA_INICIO_ELEMENTO.nome]:this.visualizacao.irParaInicio.bind(this.visualizacao),
            [Evento.ACAO_IR_PARA_FIM_ELEMENTO.nome]:this.visualizacao.irParaFim.bind(this.visualizacao)
        };

        //Chava a função correspondente a ação passando os parâmetros dela
        relacao_acao_funcao[acao.nome](acao.parametros);        
    }


    
    //Zera a base de dados local IndexDB e recarrega a página
    reiniciar(){
        EscritorEspacoDB.getInstance().reiniciarBase().then(() => {
            //TODO: está recarregando tudo
            document.location.reload(true);
        });                
    }



    //Atualiza a visualizacao no banco de dados local IndexDB
    atualizarVisualizacao(detalhes){        

        let uuid_visualizacao= detalhes.uuid_visualizacao;

        //TODO: considerando apenas um container
        EscritorEspacoDB.getInstance().atualizarVisualizacao(this.visualizacao.visualizacao).then(()=>{

            //Mantém this.visualizacoes[0] sincronizado com o que acabou de ser persistido.
            //criarEIniciarControleNavegador() usa this.visualizacoes[0] (não o estado da Visualizacao
            //ativa) para montar a próxima visualização ao trocar — sem isso, qualquer mudança (fechar
            //elemento, reordenar, etc) ficava só no clone local e "voltava" na próxima troca.
            this.visualizacoes[0] = structuredClone(this.visualizacao.visualizacao);

            //Persistiu a atualização na base
            this.dispatchEvent(new Evento(Evento.EVENTO_VISUALIZACAO_ATUALIZADA,{"uuid_visualizacao":uuid_visualizacao}));
        });
    }                                                               



    //Atualiza o elemento no banco de dados local IndexDB
    atualizacaoElemento(elementoVisualizacaoAtualizado){

        LeitorEspacoDB.getInstance().elemento_visualizacao(
            elementoVisualizacaoAtualizado.uuid_visualizacao, 
            elementoVisualizacaoAtualizado.uuid_elemento_visualizacao).then (

                elementoVisualizacaoBanco => {

            //Para o componente configuracao-ultima, existe um tratamento especial pois ele atualiza a visualizacao
            if (elementoVisualizacaoBanco.componente == "configuracao-espaco"){

                this.atualizarConfiguracao(elementoVisualizacaoAtualizado);

            }else{

                //Lê o elemento que está base
                LeitorEspacoDB.getInstance().elemento(elementoVisualizacaoAtualizado.uuid_elemento).then (elementoBanco => {

                    //Atualizar o elemento significa atualizar seus dados
                    elementoBanco.dados = elementoVisualizacaoAtualizado.dados;
                    
                    EscritorEspacoDB.getInstance().atualizarElemento(elementoBanco).then(()=>{

                        //Dispara evento indicado que o elemento foi atualizado na base
                        let eventoElementoAtualizado = new Evento(Evento.EVENTO_ELEMENTO_ATUALIZADO, {     

                            uuid_elemento: elementoVisualizacaoAtualizado.uuid_elemento, //O elemento que foi atualizado
                            uuid_visualizacao: elementoVisualizacaoAtualizado.uuid_visualizacao, //A visualizacao que disparou a atualizado do elemento
                            uuid_elemento_visualizacao: elementoVisualizacaoAtualizado.uuid_elemento_visualizacao, //O id desse elemento na visualizacao (a visualizacao pode exibir vários vezes o mesmo elemento)
                            dados:{...elementoBanco.dados} //Clona os dados para não serem alterados
                        });    
                                        
                        this.dispatchEvent(eventoElementoAtualizado);
                    });
                });                                                        
            }
        });
    }



    elementoAtualizado(detalhe){
        
        this.visualizacao.atualizarElemento (detalhe.uuid_elemento);                                                     
    }



    adicionarElemento(configuracoes_elemento){

        //Cria um novo elemento
        let novo_elemento = {                        
            "uuid": window.crypto.randomUUID(),
            "nome": configuracoes_elemento.nome_elemento,            
            "dados": configuracoes_elemento.dados
        };        


        let novo_elemento_visualizacao = {
            "uuid": window.crypto.randomUUID(),
            "uuid_elemento": novo_elemento.uuid,                     
            "importancia": this.mediaImportancia(this.visualizacoes[0].elementos),
            "componente": configuracoes_elemento.nome_componente
        };

        //Cria um novo elemento na visualizacao
        this.visualizacoes[0].elementos.push(novo_elemento_visualizacao);

        //Cria o novo elemento na base
        EscritorEspacoDB.getInstance().atualizarElemento(novo_elemento).then( elemento_criado => {

            //Atualiza visualizacao na base
            EscritorEspacoDB.getInstance().atualizarVisualizacao(this.visualizacoes[0]).then( visualizacao_atualizada => {
                
                //Se existe um controle de navegação instanciado
                if (this.visualizacao){

                    //Adiciona o novo elemento ao nosso controle de navegação
                    this.visualizacao.adicionarElemento(novo_elemento_visualizacao);
                }
            });
        })             
    }

    mediaImportancia(elementos){
        //Sem elementos não há média para tirar: importância 0 faz o D3 treemap desenhar o
        //retângulo com área zero (altura 0px), deixando o elemento recém-criado invisível.
        if (elementos.length === 0){
            return 1;
        }
        const soma = elementos.reduce((valorAnterior, elementoAtual) => valorAnterior + elementoAtual.importancia, 0);
        return soma / elementos.length;
    }



    /********************************** */
    /***/ /* Configurações */ /******* */
    /********************************** */
    configuracao(){

        let configuracaoEspaco = this.visualizacoes[0].elementos.find (e => e.componente.nome == "configuracao-espaco");

        if (configuracaoEspaco){
            alert ("Já está aberta a configuração!");
        }else{  

            Promise.all([
                LeitorEspacoDB.getInstance().componentes(),
                LeitorEspacoDB.getInstance().acoes(),    
                LeitorEspacoDB.getInstance().elementos(),
                LeitorEspacoDB.getInstance().visualizacoes()])
            .then(retornos => {

                const [componentes, acoes, elementos, visualizacoes] = retornos;

                this.adicionarElemento ({
                    nome_elemento:"Configuração Espaço",
                    nome_componente:"configuracao-espaco",
                    dados:{                    
                        componentes: [...componentes],                  
                        acoes: [...acoes],                    
                        elementos: [...elementos],                    
                        visualizacoes: [...visualizacoes]                    
                    }
                });
            });                                  
        }
    }



    atualizarConfiguracao(elementoConfiguracao){
        
        elementoConfiguracao.dados.visualizacao.elementos.forEach(elemento_configuracao => {

            let elemento_atualizado = {...elemento_configuracao};

            //Encontra o índice do elemento da configuração aqui no array de elementos da visualizacao
            let indice = this.visualizacao.elementos.map(e => e.uuid).indexOf (elemento_atualizado.uuid);                                    

            //Remove o elemento atual da visualizacao da posição
            let [elemento_visualizacao] = this.visualizacao.elementos.splice(indice,1);

            //Coloca uma cópia atualizada em seu lugar
            
            this.visualizacao.elementos.splice(indice,0,elemento_atualizado);

            this.visualizacao.atualizarElemento(elemento_atualizado);
        });

        //Persiste a visualizacao atualizada
        EscritorEspacoDB.getInstance().atualizarVisualizacao(this.visualizacao);
    }



    /********************************** */
    /***/ /* Service Worker */ /******* */
    /********************************** */
    iniciarServiceWorkers(){
        navigator.serviceWorker.register(super.resolverEndereco('./service_worker.js'))
            .then(function(registration) {
                console.log('Service Worker registrado! Escopo:', registration.scope);
            })
            .catch(function(error) {
                console.log('Falha no registro do Service Worker! Erro:', error);
            });
    }



}


//Registra a classe Espaco como o elemento HTML espaco-ultima
customElements.define('espaco-ultima', Espaco);


