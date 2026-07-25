
import { ComponentBase } from '../component_base.js';

import { Evento } from '../espaco/evento.js';



export class VisualizadorToque extends ComponentBase {



    constructor(){
        super({templateUrl:"./visualizador_toque.html", shadowDom:true}, import.meta.url);        


        this.toques_ativos = {};


        this.addEventListener(ComponentBase.LOADED_EVENT, () => {                        
            
            this.canvas = super.rootNode.querySelector("#visualizadorToque");
            
            this.iniciar_eventos_toque();

            this.render();
        });
    }



    static get observedAttributes() {
        return [];
    }



    attributeChangedCallback(nomeAtributo, valorAntigo, novoValor) {
    }



    render(){
        
        if (super.loaded && !this.renderizado){
            
            this.renderizado = true;            
        }        
    }



    iniciar_eventos_toque(){         

        if ('ontouchstart' in window || navigator.maxTouchPoints) {
            
            this.canvas.addEventListener("touchstart", this.inicio_toque.bind(this), false);        
            this.canvas.addEventListener("touchend", this.final_toque.bind(this), false);
            this.canvas.addEventListener("touchcancel", this.cancelar_toque.bind(this), false);
            this.canvas.addEventListener("touchleave", this.final_toque.bind(this), false);
            this.canvas.addEventListener("touchmove", this.toque_moveu.bind(this), false);

        } else {            
                        
            this.canvas.addEventListener("pointerdown", this.inicio_toque.bind(this), false);     
            this.canvas.addEventListener("pointerup", this.final_toque.bind(this), false);
            this.canvas.addEventListener("pointercancel", this.cancelar_toque.bind(this), false);
            this.canvas.addEventListener("pointerleave", this.final_toque.bind(this), false);
            this.canvas.addEventListener("pointermove", this.toque_moveu.bind(this), false);
        }
    }



    inicio_toque(evento) {

        this.log (`Toque iniciado: ${evento.type}`);

        evento.preventDefault(); // evita que o navegador trate o evento        

        let ctx = this.canvas.getContext("2d");          
        
        let toques = this.gerar_lista_toques(evento);

        this.log (`!!!!! número de toques: ${toques.length}`);

        let self = this;

        this.log(toques[0].identifier);

        toques.forEach (toque => {                                    

            self.log (`--- toque iniciado: ${toque.identifier} - ${toque.type}`);

            //Desenha toque
            ctx.beginPath();

            ctx.arc(toque.pageX, toque.pageY, 4, 0, 2 * Math.PI, false); // desenha um círculo no começo do toque

            ctx.fillStyle = this.cor_toque(toque); // usa uma cor diferente para cada toque

            ctx.fill();                                   

            //Atualiza o dicionário de toques ativos com os dados do novo toque
            this.toques_ativos[toque.identifier] = this.copiar_toque(toque); // copia apenas alguns atributos do toque            
        });
    }

    

    toque_moveu(evento) {

        evento.preventDefault(); // evita que o navegador trate o evento
        
        let ctx = this.canvas.getContext("2d");

        let toques = this.gerar_lista_toques(evento); 
      
        this.log (`número de toques: ${toques.length}`);

        toques.forEach (toque => {            
                        
            //Se existe um toque ativo com este identificador
            if (this.toques_ativos.hasOwnProperty(toque.identifier)) {  
                
                let toque_ativo = this.toques_ativos[toque.identifier];                

                this.log (`--- toque moveu: ${toque_ativo.identifier} - ${toque.type}`);

                //Desenha
                ctx.beginPath();                

                ctx.moveTo(toque_ativo.pageX, toque_ativo.pageY); // vai para o lugar do toque anterior
                
                ctx.lineTo(toque.pageX, toque.pageY); // e desenha uma linha até o toque atual

                ctx.lineWidth = 4;
                ctx.strokeStyle = this.cor_toque(toque);
                ctx.stroke();
        

                //Atualiza o dicionário de toques ativos com os dados do toque atual
                this.toques_ativos[toque.identifier] = this.copiar_toque(toque);                
            }
        });
    }



    final_toque(evento) {

        this.log (`Toque finalizado: ${evento.type}`);

        evento.preventDefault(); // evita que o navegador trate o evento
        
        
        let ctx = this.canvas.getContext("2d");

        let toques = this.gerar_lista_toques(evento);
      

        toques.forEach (toque => {
            
            let toque_ativo = this.toques_ativos[toque.identifier];
      
            if (toque_ativo) {

                //Desenha
                ctx.lineWidth = 4;
                
                ctx.fillStyle = this.cor_toque(toque);

                ctx.beginPath();

                ctx.moveTo(toque_ativo.pageX, toque_ativo.pageY); // vai para o lugar do toque anterior

                ctx.lineTo(toque.pageX, toque.pageY); // e desenha uma linha até o toque atual

                ctx.fillRect(toque.pageX - 4, toque.pageY - 4, 8, 8); // desenha um quadrado no final


                // remove o toque do dicionário de toques ativos
                delete this.toques_ativos[toque.identifier]; 
            }
        });
    }



    cancelar_toque(evento) {

        evento.preventDefault(); // evita que o navegador trate o evento
        
        toques = this.gerar_lista_toques(evento); 
      
        toques.forEach (toque => {

          // remove o toque do dicionário de toques ativos
          delete this.toques_ativos[toque.identifier]; 

        });
    }



    cor_toque(toque) {

        let r = toque.identifier % 16;
        let g = Math.floor(toque.identifier / 3) % 16;
        let b = Math.floor(toque.identifier / 7) % 16;

        r = r.toString(16); // make it a hex digit
        g = g.toString(16); // make it a hex digit
        b = b.toString(16); // make it a hex digit

        let color = "#" + r + g + b;        

        return color;
    }



    copiar_toque(toque) {
        return {
            identifier: toque.identifier,
            pageX: toque.pageX,
            pageY: toque.pageY,
        };
    }
   


    log(msg) {
        let p = super.rootNode.querySelector("#log");
        p.innerHTML = msg + "\n" + p.innerHTML;
    }



    gerar_lista_toques(evento) {

        if (evento.changedTouches) {

            this.log ("changedTouches: " + evento.changedTouches.length)

            let copia = [];
            for (let i = 0; i < evento.changedTouches.length; i++) {
                copia.push(this.copiar_toque(evento.changedTouches[i]));
            }
            return copia;

        } else {

            this.log ("não tem changedTouches: 1 EVENTO")

            return [evento];
        }        
    }
}
customElements.define('visualizador-toque', VisualizadorToque);