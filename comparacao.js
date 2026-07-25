import { EXEMPLOS, FRAMEWORKS_PAINEL } from './comparacao-dados.js';

const abasExemplo = document.getElementById('seletor-exemplo');
const abasFramework = document.getElementById('seletor-framework');
const arquivoUltima = document.getElementById('arquivo-ultima');
const conteudoUltima = document.getElementById('conteudo-ultima');
const arquivoFramework = document.getElementById('arquivo-framework');
const conteudoFramework = document.getElementById('conteudo-framework');
const notaFramework = document.getElementById('nota-framework');

if (abasExemplo) {

    let exemploAtual = EXEMPLOS[0].id;
    let frameworkAtual = FRAMEWORKS_PAINEL[0].id;

    //Realce leve e genérico (comentários, strings, início de tags HTML) — aplicado uma vez ao
    //texto já escapado, sem precisar marcar token por token em cada um dos 30 trechos.
    function realcarCodigo(codigo) {
        const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const regexToken = /(\/\/.*$)|(<!--[\s\S]*?-->)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(<\/?[a-zA-Z][\w-]*)/gm;
        let resultado = '';
        let ultimoIndice = 0;
        let m;
        while ((m = regexToken.exec(codigo))) {
            resultado += escapar(codigo.slice(ultimoIndice, m.index));
            if (m[1] || m[2]) {
                resultado += `<span class="com">${escapar(m[1] || m[2])}</span>`;
            } else if (m[3]) {
                resultado += `<span class="str">${escapar(m[3])}</span>`;
            } else if (m[4]) {
                resultado += `<span class="tag">${escapar(m[4])}</span>`;
            }
            ultimoIndice = regexToken.lastIndex;
        }
        resultado += escapar(codigo.slice(ultimoIndice));
        return resultado;
    }

    function renderizar() {
        const exemplo = EXEMPLOS.find((e) => e.id === exemploAtual);

        arquivoUltima.textContent = exemplo.ultima.arquivo;
        conteudoUltima.innerHTML = realcarCodigo(exemplo.ultima.codigo);

        const doFramework = exemplo.frameworks[frameworkAtual];
        arquivoFramework.textContent = doFramework.arquivo;
        conteudoFramework.innerHTML = realcarCodigo(doFramework.codigo);

        if (doFramework.nota) {
            notaFramework.textContent = doFramework.nota;
            notaFramework.hidden = false;
        } else {
            notaFramework.hidden = true;
        }

        abasExemplo.querySelectorAll('.aba-exemplo').forEach((botao) => {
            botao.classList.toggle('ativo', botao.dataset.exemplo === exemploAtual);
            botao.setAttribute('aria-selected', String(botao.dataset.exemplo === exemploAtual));
        });
        abasFramework.querySelectorAll('.aba-framework').forEach((botao) => {
            botao.classList.toggle('ativo', botao.dataset.framework === frameworkAtual);
            botao.setAttribute('aria-selected', String(botao.dataset.framework === frameworkAtual));
        });
    }

    abasExemplo.querySelectorAll('.aba-exemplo').forEach((botao) => {
        botao.addEventListener('click', () => {
            exemploAtual = botao.dataset.exemplo;
            renderizar();
        });
    });
    abasFramework.querySelectorAll('.aba-framework').forEach((botao) => {
        botao.addEventListener('click', () => {
            frameworkAtual = botao.dataset.framework;
            renderizar();
        });
    });

    renderizar();
}
