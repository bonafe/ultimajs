import { ComponentBase } from '../component_base.js';
import { Evento } from '../espaco/evento.js';


export class VisualizadorToque extends ComponentBase {



    constructor(){
        super({templateUrl:"./visualizador_toque.html", shadowDom:true}, import.meta.url);        

        this.ongoingTouches = new Array();

        this.addEventListener(ComponentBase.LOADED_EVENT, () => {                        
            

            this.canvas = super.rootNode.querySelector("#visualizadorToque");
            
            this.iniciarEventosToque();

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



    iniciarEventosToque(){         

        if ('ontouchstart' in window || navigator.maxTouchPoints) {

            console.log ("touch api disponível");
            
            this.canvas.addEventListener("touchstart", this.handleStart.bind(this), false);        
            this.canvas.addEventListener("touchend", this.handleEnd.bind(this), false);
            this.canvas.addEventListener("touchcancel", this.handleCancel.bind(this), false);
            this.canvas.addEventListener("touchleave", this.handleEnd.bind(this), false);
            this.canvas.addEventListener("touchmove", this.handleMove.bind(this), false);

        } else {

            console.log ("touch api NÃO DISPONÍVEL: usando a POINTER API");
                        
            this.canvas.addEventListener("pointerdown", this.handleStart.bind(this), false);     
            this.canvas.addEventListener("pointerup", this.handleEnd.bind(this), false);
            this.canvas.addEventListener("pointercancel", this.handleCancel.bind(this), false);
            this.canvas.addEventListener("pointerleave", this.handleEnd.bind(this), false);
            this.canvas.addEventListener("pointermove", this.handleMove.bind(this), false);
        }

        
        this.log("initialized.");
    }



    handleStart(evt) {

        evt.preventDefault();

        this.log("touchstart.");

        let ctx = this.canvas.getContext("2d");          

        let touches = evt.changedTouches || [evt]; 
      
        for (let i = 0; i < touches.length; i++) {
            
            this.log("touchstart:" + i + "...");

            this.ongoingTouches.push(this.copyTouch(touches[i]));
            let color = this.colorForTouch(touches[i]);
            ctx.beginPath();
            ctx.arc(touches[i].pageX, touches[i].pageY, 4, 0, 2 * Math.PI, false); // a circle at the start
            ctx.fillStyle = color;
            ctx.fill();  
            
            this.log("touchstart:" + i + ".");
        }
    }


    handleMove(evt) {
        evt.preventDefault();
        
        let ctx = this.canvas.getContext("2d");

        if (evt.changedTouches){

            this.log("evt.changedTouches");
        }

        let touches = evt.changedTouches || [evt]; 
      
        this.log("Tamanho do array de toques: " + touches.length);

        this.log(evt.hasOwnProperty("changedTouches"));

        for (let i = 0; i < touches.length; i++) {

          let color = this.colorForTouch(touches[i]);
          let idx = this.ongoingTouchIndexById(touches[i].identifier);
      
            if (idx >= 0) {
                
                this.log("continuing touch " + idx);

                ctx.beginPath();
                
                this.log(
                    "ctx.moveTo(" +
                      this.ongoingTouches[idx].pageX +
                      ", " +
                      this.ongoingTouches[idx].pageY +
                      ");",
                  );

                ctx.moveTo(this.ongoingTouches[idx].pageX, this.ongoingTouches[idx].pageY);
                this.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");
                ctx.lineTo(touches[i].pageX, touches[i].pageY);
                ctx.lineWidth = 4;
                ctx.strokeStyle = color;
                ctx.stroke();
        
                this.ongoingTouches.splice(idx, 1, this.copyTouch(touches[i])); // swap in the new touch record
                
            } else {
                console.log("can't figure out which touch to continue");
            }
        }
    }



    handleEnd(evt) {

        evt.preventDefault();
                
        let ctx = this.canvas.getContext("2d");
        let touches = evt.changedTouches || [evt]; 
      
        for (let i = 0; i < touches.length; i++) {

            let color = this.colorForTouch(touches[i]);
            let idx = this.ongoingTouchIndexById(touches[i].identifier);
      
            if (idx >= 0) {
                ctx.lineWidth = 4;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(this.ongoingTouches[idx].pageX, this.ongoingTouches[idx].pageY);
                ctx.lineTo(touches[i].pageX, touches[i].pageY);
                ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8); // and a square at the end
                this.ongoingTouches.splice(idx, 1); // remove it; we're done
            } else {
                this.log("can't figure out which touch to end");
            }
        }
    }


    handleCancel(evt) {

        evt.preventDefault();
        
        let touches = evt.changedTouches || [evt]; 
      
        for (let i = 0; i < touches.length; i++) {
          this.ongoingTouches.splice(i, 1); // remove it; we're done
        }
    }



    colorForTouch(touch) {

        let r = touch.identifier % 16;
        let g = Math.floor(touch.identifier / 3) % 16;
        let b = Math.floor(touch.identifier / 7) % 16;
        r = r.toString(16); // make it a hex digit
        g = g.toString(16); // make it a hex digit
        b = b.toString(16); // make it a hex digit
        let color = "#" + r + g + b;        
        return color;
    }


    copyTouch(touch) {
        return {
            identifier: touch.identifier,
            pageX: touch.pageX,
            pageY: touch.pageY,
        };
    }


    ongoingTouchIndexById(idToFind) {
        return this.ongoingTouches.findIndex(touch => touch.identifier === idToFind);
    }



    log(msg) {
        let p = super.rootNode.querySelector("#log");
        p.innerHTML = msg + "\n" + p.innerHTML;
    }
}
customElements.define('visualizador-toque', VisualizadorToque);