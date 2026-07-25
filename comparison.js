import { EXEMPLOS, FRAMEWORKS_PAINEL } from './comparison-data.js';

const exampleTabs = document.getElementById('seletor-exemplo');
const frameworkTabs = document.getElementById('seletor-framework');
const ultimaFile = document.getElementById('arquivo-ultima');
const ultimaContent = document.getElementById('conteudo-ultima');
const frameworkFile = document.getElementById('arquivo-framework');
const frameworkContent = document.getElementById('conteudo-framework');
const frameworkNote = document.getElementById('nota-framework');

if (exampleTabs) {

    let currentExample = EXEMPLOS[0].id;
    let currentFramework = FRAMEWORKS_PAINEL[0].id;

    //Light, generic highlighting (comments, strings, opening HTML tags) — applied once to the
    //already-escaped text, instead of hand-marking every token in each of the 30 snippets.
    function highlightCode(code) {
        const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const tokenRegex = /(\/\/.*$)|(<!--[\s\S]*?-->)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(<\/?[a-zA-Z][\w-]*)/gm;
        let result = '';
        let lastIndex = 0;
        let m;
        while ((m = tokenRegex.exec(code))) {
            result += escape(code.slice(lastIndex, m.index));
            if (m[1] || m[2]) {
                result += `<span class="com">${escape(m[1] || m[2])}</span>`;
            } else if (m[3]) {
                result += `<span class="str">${escape(m[3])}</span>`;
            } else if (m[4]) {
                result += `<span class="tag">${escape(m[4])}</span>`;
            }
            lastIndex = tokenRegex.lastIndex;
        }
        result += escape(code.slice(lastIndex));
        return result;
    }

    function render() {
        const example = EXEMPLOS.find((e) => e.id === currentExample);

        ultimaFile.textContent = example.ultima.arquivo;
        ultimaContent.innerHTML = highlightCode(example.ultima.codigo);

        const framework = example.frameworks[currentFramework];
        frameworkFile.textContent = framework.arquivo;
        frameworkContent.innerHTML = highlightCode(framework.codigo);

        if (framework.nota) {
            frameworkNote.textContent = framework.nota;
            frameworkNote.hidden = false;
        } else {
            frameworkNote.hidden = true;
        }

        exampleTabs.querySelectorAll('.aba-exemplo').forEach((button) => {
            button.classList.toggle('ativo', button.dataset.exemplo === currentExample);
            button.setAttribute('aria-selected', String(button.dataset.exemplo === currentExample));
        });
        frameworkTabs.querySelectorAll('.aba-framework').forEach((button) => {
            button.classList.toggle('ativo', button.dataset.framework === currentFramework);
            button.setAttribute('aria-selected', String(button.dataset.framework === currentFramework));
        });
    }

    exampleTabs.querySelectorAll('.aba-exemplo').forEach((button) => {
        button.addEventListener('click', () => {
            currentExample = button.dataset.exemplo;
            render();
        });
    });
    frameworkTabs.querySelectorAll('.aba-framework').forEach((button) => {
        button.addEventListener('click', () => {
            currentFramework = button.dataset.framework;
            render();
        });
    });

    render();
}
