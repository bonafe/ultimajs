import { ComponenteReativo } from '../../componente_reativo.js';

//Cenário de benchmark: cadeia condicional (data-se/data-senao). alternarVezes(n) simula n toggles
//em sequência, cada um passando pelo caminho real de renderização condicional.
export class BenchCondicional extends ComponenteReativo {

    constructor() {
        super(
            { templateURL: './bench-condicional.html', shadowDOM: true },
            import.meta.url
        );

        this.dados = { aberto: false };
    }

    reset() {
        this.dados = { aberto: false };
    }

    alternarVezes(n) {
        for (let i = 0; i < n; i++) {
            this.dados = { aberto: !this.dados.aberto };
        }
    }

    estadoAtual() {
        return this.dados.aberto;
    }
}

window.customElements.define('bench-condicional', BenchCondicional);
