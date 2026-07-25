import { ComponenteReativo } from '../../componente_reativo.js';

//Cenário de benchmark: estado reativo simples. incrementarVezes(n) simula n cliques em sequência,
//cada um passando pelo caminho real de atualização de dados (atualizar_dados -> renderizar).
export class BenchContador extends ComponenteReativo {

    constructor() {
        super(
            { templateURL: './bench-contador.html', shadowDOM: true },
            import.meta.url
        );

        this.dados = { contador: 0 };
    }

    reset() {
        this.dados = { contador: 0 };
    }

    incrementarVezes(n) {
        for (let i = 0; i < n; i++) {
            this.dados = { contador: this.dados.contador + 1 };
        }
    }

    valorAtual() {
        return this.dados.contador;
    }
}

window.customElements.define('bench-contador', BenchContador);
