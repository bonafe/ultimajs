import { ComponenteReativo } from '../componente_reativo.js';

import { BrEndereco } from './br-endereco.js';

export class BrTeste extends ComponenteReativo {

    constructor() {
        super(
            {
                templateURL: './br-teste.html',
                shadowDOM: true
            },
            import.meta.url
        );
    }

    //Exemplo de propriedade computada: derivada de this.dados, some pros dados de qualquer binding
    computadas() {
        const dados = this.dados || {};
        return {
            total_enderecos: Array.isArray(dados.enderecos) ? dados.enderecos.length : 0,
            cor_status: dados.ativo ? '#2e7d32' : '#b0b0b0'
        };
    }

    //Exemplo de observador: roda só quando o caminho observado muda de valor
    observadores() {
        return {
            nome: (novoValor, valorAntigo) => {
                console.log(`[BrTeste] nome mudou de "${valorAntigo}" para "${novoValor}" (ref: ${this.refs.campoNome?.value})`);
            },
            ativo: (novoValor) => {
                console.log(`[BrTeste] ativo agora é ${novoValor}`);
            }
        };
    }

}

// Define o novo elemento personalizado
window.customElements.define('br-teste', BrTeste);
