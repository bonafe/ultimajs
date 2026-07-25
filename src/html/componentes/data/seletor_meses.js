import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';


export class SeletorMeses extends ComponentBase {

    

    constructor(){
        super({templateUrl:"./seletor_meses.html", shadowDom:true}, import.meta.url);
        
        this.addEventListener(ComponentBase.LOADED_EVENT, () => {
        
            this.render();
        });
    }



    selecionouMes(ano, mes, selecionado){
        let registro = this.state.find(r => (r.ano == ano) && (r.mes == mes));        
        registro.selecionado = selecionado;
        this.dispatchEvent(new CustomEvent("change", {detail:this.state}));
        this.dispatchEvent(new Evento(Evento.EVENTO_SELECAO_OBJETO, registro));
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

    criarLinhaMesesDoAno(){

        let linha = document.createElement("tr");                    
        
        let Espaco_vazio = document.createElement("th");                                            
        linha.appendChild (Espaco_vazio);

        for (let iMes = 0; iMes < 12; iMes++){

            let mes = new Date();
            mes.setMonth(iMes);
            //exemplo
            //let opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            let opcoes = { month: 'short'};
            let nome_mes = mes.toLocaleDateString('pt-BR', opcoes);

            let titulo_mes = document.createElement("th");                                
            linha.appendChild (titulo_mes);
            titulo_mes.innerHTML = nome_mes;                
        }

        return linha;
    }



    render (){

        if (super.loaded && this.state){ 
            
            let agrupado_ano = {};

            this.state.forEach (dado => {
                if (!agrupado_ano[dado.ano]){
                    agrupado_ano[dado.ano] = [];
                }
                agrupado_ano[dado.ano].push ({mes:dado.mes, selecionado:dado.selecionado});;
            });


            let container = super.rootNode.querySelector("#containerMeses");
            container.innerHTML = "";

            let tabela = document.createElement("table");            
            container.appendChild(tabela);

            let cabecalho = document.createElement("thead");
            tabela.appendChild(cabecalho);          
            cabecalho.appendChild(this.criarLinhaMesesDoAno());            
          
           
            let corpo_tabela = document.createElement("tbody");
            tabela.appendChild(corpo_tabela);
            
            Object.keys(agrupado_ano).forEach( ano => {
                
                let linha = document.createElement("tr");                                                
                corpo_tabela.appendChild(linha);

                let titulo_ano = document.createElement("th");
                linha.appendChild(titulo_ano);
                titulo_ano.textContent = ano;
                            

                let meses = agrupado_ano[ano].sort((a,b) =>{

                    let an = Number(a.mes)
                    let bn = Number(b.mes)
                    
                    if (isNaN(an) && isNaN(bn)){
                        return a.mes.localeCompare(b.mes);
                    }else if (isNaN(an)){
                        return 1;
                    }else if (isNaN(bn)){
                        return -1;
                    }else{
                        return an - bn;
                    }

                })
                for (let iMes = 1; iMes <= 12; iMes++){

                    let str_mes = ("0" + iMes).slice(-2);

                    let coluna_mes = document.createElement("td");
                    linha.appendChild(coluna_mes);

                    let btn_mes = document.createElement("input");
                    coluna_mes.appendChild(btn_mes);                    
                    btn_mes.type = "checkbox";
                    btn_mes.textContent = str_mes;
                    btn_mes.dataset.ano = ano;
                    btn_mes.dataset.mes = str_mes;               
                    
                    let indice = meses.map (m => m.mes).indexOf(str_mes);

                    if (indice == -1){
                        btn_mes.style.backgroundColor = "red";
                        btn_mes.disabled = true;
                    }else{
                        btn_mes.checked = meses[indice].selecionado;                        
                        btn_mes.addEventListener("click", evento => {                            
                            this.selecionouMes(btn_mes.dataset.ano, btn_mes.dataset.mes, btn_mes.checked);
                        });
                    }                    
                };                                                   
            });


            let rodape = document.createElement("tfoot");
            tabela.appendChild(rodape);          
            rodape.appendChild(this.criarLinhaMesesDoAno());
        }
    }



   
}

window.customElements.define('seletor-meses', SeletorMeses);




