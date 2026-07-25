import { FRAMEWORKS, METRICS, METHODOLOGY, runAll } from './harness.js';

const legend = document.getElementById('legenda-frameworks');
const grid = document.getElementById('grade-resultados');
const tableHeader = document.getElementById('cabecalho-tabela');
const tableBody = document.getElementById('corpo-tabela');
const logEl = document.getElementById('log-execucao');
const statusEl = document.getElementById('status-benchmark');
const runButton = document.getElementById('botao-rodar');
const downloadButton = document.getElementById('botao-baixar');

const resultsByMetric = {};

function buildLegend() {
    legend.innerHTML = FRAMEWORKS.map((fw) => `
        <span class="item-legenda">
            <span class="amostra-cor" style="background: var(${fw.color})"></span>
            ${fw.name}${fw.note ? `<span class="badge-abandonado">${fw.note}</span>` : ''}
        </span>
    `).join('');
}

function buildGridAndResults() {
    grid.innerHTML = METRICS.map((metric) => `
        <div class="cartao-metrica">
            <h3>${metric.label}</h3>
            <p class="descricao-metrica">${metric.description}</p>
            ${FRAMEWORKS.map((fw) => `
                <div class="barra-item sem-dado">
                    <span class="rotulo-framework">${fw.name}</span>
                    <div class="barra-trilho">
                        <div class="barra-preenchimento" id="barra-${metric.id}-${fw.id}" style="width:0%; background: var(${fw.color})"></div>
                    </div>
                    <span class="valor-barra" id="valor-${metric.id}-${fw.id}">—</span>
                </div>
            `).join('')}
        </div>
    `).join('');

    tableHeader.innerHTML = '<th scope="col">Metric</th>' +
        FRAMEWORKS.map((fw) => `<th scope="col">${fw.name}</th>`).join('');

    tableBody.innerHTML = METRICS.map((metric) => `
        <tr>
            <th scope="row">${metric.label}</th>
            ${FRAMEWORKS.map((fw) => `<td id="cel-${metric.id}-${fw.id}">—</td>`).join('')}
        </tr>
    `).join('');
}

function logLine(message, isError) {
    logEl.hidden = false;
    const line = document.createElement('div');
    line.className = isError ? 'linha-erro' : 'linha-ok';
    line.textContent = message;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
}

function updateMetric(frameworkId, metricId, value) {
    resultsByMetric[metricId] = resultsByMetric[metricId] || {};
    resultsByMetric[metricId][frameworkId] = value;

    const cell = document.getElementById(`cel-${metricId}-${frameworkId}`);
    if (cell) {
        cell.textContent = value === null ? 'error' : `${value.toFixed(1)} ms`;
    }

    const knownValues = Object.values(resultsByMetric[metricId]).filter((v) => typeof v === 'number');
    const max = knownValues.length ? Math.max(...knownValues) : 0;

    FRAMEWORKS.forEach((fw) => {
        const v = resultsByMetric[metricId][fw.id];
        if (v === undefined) {
            return;
        }
        const bar = document.getElementById(`barra-${metricId}-${fw.id}`);
        const valueLabel = document.getElementById(`valor-${metricId}-${fw.id}`);
        const item = bar.closest('.barra-item');
        item.classList.remove('sem-dado');
        if (typeof v === 'number') {
            const pct = max > 0 ? Math.max((v / max) * 100, 2) : 2;
            bar.style.width = `${pct}%`;
            valueLabel.textContent = `${v.toFixed(1)} ms`;
        } else {
            bar.style.width = '2%';
            valueLabel.textContent = 'error';
        }
    });
}

function downloadResults() {
    const payload = {
        generatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        methodology: METHODOLOGY,
        results: resultsByMetric
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-ultima-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function run() {
    runButton.disabled = true;
    downloadButton.disabled = true;
    logEl.hidden = true;
    logEl.textContent = '';
    Object.keys(resultsByMetric).forEach((k) => delete resultsByMetric[k]);
    buildGridAndResults();
    statusEl.textContent = 'Running… follow the log below.';

    await runAll({
        onLog: logLine,
        onMetric: updateMetric,
        onFrameworkDone: (frameworkId) => logLine(`${frameworkId}: done.`)
    });

    statusEl.textContent = 'Benchmark complete.';
    runButton.disabled = false;
    downloadButton.disabled = false;
}

buildLegend();
buildGridAndResults();
runButton.addEventListener('click', run);
downloadButton.addEventListener('click', downloadResults);
