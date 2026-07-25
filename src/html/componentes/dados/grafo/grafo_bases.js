import { ComponentBase } from '../../component_base.js';
import { Evento } from '../../espaco/evento.js';


export class GrafoBases extends ComponentBase {
    

    constructor(){
        super({templateUrl:"./grafo_bases.html", shadowDom:true}, import.meta.url);
        
        this.addEventListener(ComponentBase.LOADED_EVENT, () => {
        
            //TODO: carregar dinamicamente o vis.js
            //Importa dinamicamente a biblioteca JSONEditor
            //import(`${super.prefixoEndereco}/bibliotecas/vis.js/vis.js`).then(modulo => {

                this.vis = true;
                this.render();                               
            //});           
        });
    }

    render(){
        if (this.vis && this.state && !this.grafo && !this.gerandoGrafo){
            this.gerarGrafo();
        }
    }



    static get observedAttributes() {
        return ['dados'];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {

        if (nomeAtributo.localeCompare("dados") == 0){
            let dados = JSON.parse(novoValor);

            if (dados.src){ 
                this.src = dados.src;

                fetch(this.src)
                    .then(retorno => retorno.json())
                    .then(json => {
                        this.state = json;
                        this.render();
                    })
                    .catch (e => alert (e));

            }else{
                this.state = dados;
                this.render();
            }
        }
    } 


   gerarGrafo (){

        this.gerandoGrafo = true;

        if (this.vis && this.state){


            this.idGrafo = 0;
            let elementosGrafo = this.transformarDadosEmGrafo();

            /*
            let options = {
                physics: {
                    stabilization: false,                    
                  }
            };
            */
            const options = {
                "edges": {
                  "smooth": {
                    "forceDirection": "none"
                  }
                },
                "physics": {
                  "forceAtlas2Based": {
                    "springLength": 100
                  },
                  "minVelocity": 0.75,
                  "solver": "forceAtlas2Based",
                  "timestep": 0.51                  
                }
              }

            this.elementosGrafo = elementosGrafo;
            this.grafo = new vis.Network (super.rootNode.querySelector("#divGrafo"), this.elementosGrafo, options);            

            this.grafo.on ("click", parametros => {
                console.dir(parametros);
                this.dispatchEvent(new Evento(Evento.EVENTO_SELECAO_OBJETO, parametros));
            });

            this.gerandoGrafo = false;

            //window.requestAnimationFrame(this.animarGrafo.bind(this));
        }
    }

    animarGrafo(timestamp){
        if (!this.inicio) this.inicio = timestamp;
        this.elementosGrafo.nodes.update(
            this.elementosGrafo.nodes.get().map(no => {        
                no.color = ((Math.random() < 0.5) ?"red" :"blue");
                return no;
            })
        );
        
        window.requestAnimationFrame(this.animarGrafo.bind(this));
    }



    transformarDadosEmGrafo (){

        let sistemas_renderizados = {};
        let campos_renderizados = {};

        let elementosGrafo = {nodes:new vis.DataSet(), edges:new vis.DataSet()};

        Object.entries(this.state.bases).forEach(entrada => {                    

            let [nome_base, base] = entrada;            

            let id_sistema = `sistema_${base.sistema}`;

            if (!sistemas_renderizados[id_sistema]){
                let no_sistema = {
                    label: base.sistema,
                    id: id_sistema,                
                    size:45,
                    font:{
                        size: 32,
                        color:"black"
                    },             
                    color: "yellow",   
                    shape: "circle"
                };
                elementosGrafo.nodes.add(no_sistema);
                sistemas_renderizados[id_sistema] = true;
            }


            let no_base = {
                label: base.titulo,
                id: `${id_sistema}_base_${base.nome}`,                
                size:20,
                font:{
                    size: 32,
                    color:"#ffffff"
                },
                group: base.nome,
                shape: "dot",                
            };
            elementosGrafo.nodes.add(no_base);

            let ligacao_sistema = {
                to: no_base.id,
                from: id_sistema               
            }
            elementosGrafo.edges.add(ligacao_sistema);

            base.campos.forEach (campo => {

                if (!campos_renderizados[campo.nome]){
                    let no_campo = {
                        label: campo.nome,
                        id: campo.nome,
                        size: 15,//*Math.log10(campo.numero_registros),
                        font:{
                            size: 16,
                            color: "#ffffff"
                        },
                        group:base.nome,
                        shape: "dot",                        
                    };
                    elementosGrafo.nodes.add(no_campo);
                    campos_renderizados[campo.nome] = true;
                }

                if (campo.arquivo){

                    let no_nuvem_palavras = {                        
                        id:`${no_base.id}-${campo.nome}-nuvem_palavras`,
                        shape:"circularImage",
                        image: `dados/imagens/${campo.arquivo}`,                    
                        size: 30,
                        group: base.nome                    
                    }
                    elementosGrafo.nodes.add(no_nuvem_palavras);

                    elementosGrafo.edges.add({
                        from: no_base.id,
                        to: no_nuvem_palavras.id, 
                        width: Math.log10(campo.numero_registros)*1.5                       
                    });

                    elementosGrafo.edges.add({
                        to: campo.nome,
                        from: no_nuvem_palavras.id,   
                        width: Math.log10(campo.numero_registros)*1.5                     
                    });


                }else{

                    let ligacao = {
                        from: no_base.id,
                        to: campo.nome,
                        width: Math.log10(campo.numero_registros)*1.5
                    }                 
                    elementosGrafo.edges.add(ligacao);
                }
            });                           
        });

        return elementosGrafo;
    }
}

window.customElements.define('grafo-bases', GrafoBases);




