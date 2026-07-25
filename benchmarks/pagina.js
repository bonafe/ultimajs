import { FRAMEWORKS, METRICAS, METODOLOGIA, rodarTudo } from './harness.js';

const legenda = document.getElementById('legenda-frameworks');
const grade = document.getElementById('grade-resultados');
const cabecalhoTabela = document.getElementById('cabecalho-tabela');
const corpoTabela = document.getElementById('corpo-tabela');
const logEl = document.getElementById('log-execucao');
const statusEl = document.getElementById('status-benchmark');
const botaoRodar = document.getElementById('botao-rodar');
const botaoBaixar = document.getElementById('botao-baixar');

const resultadosPorMetrica = {};

function montarLegenda() {
    legenda.innerHTML = FRAMEWORKS.map((fw) => `
        <span class="item-legenda">
            <span class="amostra-cor" style="background: var(${fw.cor})"></span>
            ${fw.nome}${fw.nota ? `<span class="badge-abandonado">${fw.nota}</span>` : ''}
        </span>
    `).join('');
}

function montarGradeEResultados() {
    grade.innerHTML = METRICAS.map((metrica) => `
        <div class="cartao-metrica">
            <h3>${metrica.rotulo}</h3>
            <p class="descricao-metrica">${metrica.descricao}</p>
            ${FRAMEWORKS.map((fw) => `
                <div class="barra-item sem-dado">
                    <span class="rotulo-framework">${fw.nome}</span>
                    <div class="barra-trilho">
                        <div class="barra-preenchimento" id="barra-${metrica.id}-${fw.id}" style="width:0%; background: var(${fw.cor})"></div>
                    </div>
                    <span class="valor-barra" id="valor-${metrica.id}-${fw.id}">—</span>
                </div>
            `).join('')}
        </div>
    `).join('');

    cabecalhoTabela.innerHTML = '<th scope="col">Métrica</th>' +
        FRAMEWORKS.map((fw) => `<th scope="col">${fw.nome}</th>`).join('');

    corpoTabela.innerHTML = METRICAS.map((metrica) => `
        <tr>
            <th scope="row">${metrica.rotulo}</th>
            ${FRAMEWORKS.map((fw) => `<td id="cel-${metrica.id}-${fw.id}">—</td>`).join('')}
        </tr>
    `).join('');
}

function registrarLog(mensagem, ehErro) {
    logEl.hidden = false;
    const linha = document.createElement('div');
    linha.className = ehErro ? 'linha-erro' : 'linha-ok';
    linha.textContent = mensagem;
    logEl.appendChild(linha);
    logEl.scrollTop = logEl.scrollHeight;
}

function atualizarMetrica(frameworkId, metricaId, valor) {
    resultadosPorMetrica[metricaId] = resultadosPorMetrica[metricaId] || {};
    resultadosPorMetrica[metricaId][frameworkId] = valor;

    const celula = document.getElementById(`cel-${metricaId}-${frameworkId}`);
    if (celula) {
        celula.textContent = valor === null ? 'erro' : `${valor.toFixed(1)} ms`;
    }

    const valoresConhecidos = Object.values(resultadosPorMetrica[metricaId]).filter((v) => typeof v === 'number');
    const maximo = valoresConhecidos.length ? Math.max(...valoresConhecidos) : 0;

    FRAMEWORKS.forEach((fw) => {
        const v = resultadosPorMetrica[metricaId][fw.id];
        if (v === undefined) {
            return;
        }
        const barra = document.getElementById(`barra-${metricaId}-${fw.id}`);
        const rotuloValor = document.getElementById(`valor-${metricaId}-${fw.id}`);
        const item = barra.closest('.barra-item');
        item.classList.remove('sem-dado');
        if (typeof v === 'number') {
            const pct = maximo > 0 ? Math.max((v / maximo) * 100, 2) : 2;
            barra.style.width = `${pct}%`;
            rotuloValor.textContent = `${v.toFixed(1)} ms`;
        } else {
            barra.style.width = '2%';
            rotuloValor.textContent = 'erro';
        }
    });
}

function baixarResultados() {
    const payload = {
        geradoEm: new Date().toISOString(),
        userAgent: navigator.userAgent,
        metodologia: METODOLOGIA,
        resultados: resultadosPorMetrica
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-ultima-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function rodar() {
    botaoRodar.disabled = true;
    botaoBaixar.disabled = true;
    logEl.hidden = true;
    logEl.textContent = '';
    Object.keys(resultadosPorMetrica).forEach((k) => delete resultadosPorMetrica[k]);
    montarGradeEResultados();
    statusEl.textContent = 'Rodando… acompanhe o log abaixo.';

    await rodarTudo({
        onLog: registrarLog,
        onMetrica: atualizarMetrica,
        onFrameworkConcluido: (frameworkId) => registrarLog(`${frameworkId}: concluído.`)
    });

    statusEl.textContent = 'Benchmark concluído.';
    botaoRodar.disabled = false;
    botaoBaixar.disabled = false;
}

montarLegenda();
montarGradeEResultados();
botaoRodar.addEventListener('click', rodar);
botaoBaixar.addEventListener('click', baixarResultados);
