import { ComponenteReativo } from '../../componente_reativo.js';

//Cenário de benchmark: binding bidirecional (data-mapa + evento nativo "change" escrevendo de volta
//nos dados). escreverVezes(n) simula n alterações de valor em sequência, disparando o evento que o
//binding do Ultima escuta para propagar DOM -> dados -> renderizar (inclusive o span refletindo de volta).
export class BenchBinding extends ComponenteReativo {

    constructor() {
        super(
            { templateURL: './bench-binding.html', shadowDOM: true },
            import.meta.url
        );

        this.dados = { texto: '' };
    }

    reset() {
        this.dados = { texto: '' };
    }

    escreverVezes(n) {
        const campo = this.refs.campo;
        for (let i = 0; i < n; i++) {
            campo.value = `valor-${i}`;
            campo.dispatchEvent(new Event('change'));
        }
    }

    valorAtual() {
        return this.dados.texto;
    }
}

window.customElements.define('bench-binding', BenchBinding);
