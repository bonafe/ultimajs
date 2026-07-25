import { ComponenteReativo } from '../../componente_reativo.js';

const ADJETIVOS = ['rápido', 'lento', 'grande', 'pequeno', 'azul', 'verde', 'vermelho', 'claro', 'escuro', 'novo'];
const SUBSTANTIVOS = ['carro', 'mesa', 'nuvem', 'rio', 'monte', 'vento', 'campo', 'porto', 'vale', 'lago'];

//Cenário de benchmark: lista com reconciliação por chave (data-lista="linha in linhas : id").
//Reproduz a bateria clássica do js-framework-benchmark (criar, atualização parcial, troca de duas
//linhas, remoção de uma linha, limpar), pra comparar o custo de cada operação isoladamente.
export class BenchLista extends ComponenteReativo {

    #proximoId = 1;

    constructor() {
        super(
            { templateURL: './bench-lista.html', shadowDOM: true },
            import.meta.url
        );

        this.dados = { linhas: [] };
    }

    #rotuloAleatorio() {
        const a = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)];
        const s = SUBSTANTIVOS[Math.floor(Math.random() * SUBSTANTIVOS.length)];
        return `${a} ${s}`;
    }

    criar(n) {
        const linhas = [];
        for (let i = 0; i < n; i++) {
            linhas.push({ id: this.#proximoId++, rotulo: this.#rotuloAleatorio() });
        }
        this.dados = { linhas };
    }

    atualizarParcial() {
        const linhas = this.dados.linhas.map((linha, indice) =>
            indice % 10 === 0 ? { ...linha, rotulo: linha.rotulo + ' !!!' } : linha
        );
        this.dados = { linhas };
    }

    trocar() {
        const linhas = this.dados.linhas.slice();
        if (linhas.length > 998) {
            [linhas[1], linhas[998]] = [linhas[998], linhas[1]];
        } else if (linhas.length > 1) {
            [linhas[0], linhas[linhas.length - 1]] = [linhas[linhas.length - 1], linhas[0]];
        }
        this.dados = { linhas };
    }

    remover() {
        const linhas = this.dados.linhas;
        if (linhas.length === 0) {
            return;
        }
        this.dados = { linhas: linhas.slice(1) };
    }

    limpar() {
        this.dados = { linhas: [] };
    }

    contarLinhas() {
        return this.dados.linhas.length;
    }
}

window.customElements.define('bench-lista', BenchLista);
