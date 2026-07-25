// Benchmark harness: loads each framework implementation in its own isolated <iframe> (keeps one
// framework from interfering with another's DOM/globals), measures operations via
// performance.now() + a double microtask flush (see waitForPaint below) and reports the median of N
// repetitions per metric — the same "median of repeated runs" logic used by benchmark batteries like
// js-framework-benchmark, adapted here to this page's 4 scenarios.

const N_LOOP_ITEMS = 1000;
const N_ROWS = 1000;
const REPETITIONS = 5;

export const FRAMEWORKS = [
    { id: 'ultima', name: 'Ultima', file: 'implementations/ultima.html', color: '--serie-ultima' },
    { id: 'litedom', name: 'Litedom', file: 'implementations/litedom.html', color: '--serie-litedom', note: 'no commits since 2020' },
    { id: 'alpine', name: 'Alpine.js', file: 'implementations/alpine.html', color: '--serie-alpine' },
    { id: 'lit', name: 'Lit', file: 'implementations/lit.html', color: '--serie-lit' },
    { id: 'minze', name: 'Minze', file: 'implementations/minze.html', color: '--serie-minze' },
    { id: 'vanjs', name: 'VanJS', file: 'implementations/vanjs.html', color: '--serie-vanjs' }
];

export const METRICS = [
    {
        id: 'counter', label: `Counter: ${N_LOOP_ITEMS} increments`,
        description: '1000 sequential state updates, each reflected on screen.',
        prepare: (b) => b.counter.reset(),
        run: (b) => b.counter.increment(N_LOOP_ITEMS)
    },
    {
        id: 'conditional', label: `Conditional: ${N_LOOP_ITEMS} toggles`,
        description: '1000 sequential branch switches (visible ↔ hidden).',
        prepare: (b) => b.conditional.reset(),
        run: (b) => b.conditional.toggle(N_LOOP_ITEMS)
    },
    {
        id: 'binding', label: `Binding: ${N_LOOP_ITEMS} input changes`,
        description: '1000 sequential field value changes, propagated back to the model.',
        prepare: (b) => b.binding.reset(),
        run: (b) => b.binding.write(N_LOOP_ITEMS)
    },
    {
        id: 'list_create', label: `List: create ${N_ROWS} rows`,
        description: 'Render 1000 rows starting from an empty list.',
        prepare: (b) => b.list.clear(),
        run: (b) => b.list.create(N_ROWS)
    },
    {
        id: 'list_update', label: 'List: update 1 in every 10 rows',
        description: 'With 1000 rows already on screen, changes the text of 100 of them.',
        prepare: (b) => { b.list.clear(); b.list.create(N_ROWS); },
        run: (b) => b.list.updatePartial()
    },
    {
        id: 'list_swap', label: 'List: swap 2 rows',
        description: 'With 1000 rows, swaps the position of two specific rows (row 2 and row 999).',
        prepare: (b) => { b.list.clear(); b.list.create(N_ROWS); },
        run: (b) => b.list.swap()
    },
    {
        id: 'list_remove', label: 'List: remove 1 row',
        description: 'With 1000 rows, removes the first one.',
        prepare: (b) => { b.list.clear(); b.list.create(N_ROWS); },
        run: (b) => b.list.remove()
    },
    {
        id: 'list_clear', label: `List: clear ${N_ROWS} rows`,
        description: 'With 1000 rows on screen, removes all of them at once.',
        prepare: (b) => { b.list.clear(); b.list.create(N_ROWS); },
        run: (b) => b.list.clear()
    }
];

export const METHODOLOGY = { repetitions: REPETITIONS, loopItems: N_LOOP_ITEMS, rows: N_ROWS };

function createIframe(file) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute; left:-9999px; top:0; width:1px; height:1px; border:0;';
        iframe.src = file;
        iframe.addEventListener('load', () => resolve(iframe));
        iframe.addEventListener('error', () => reject(new Error(`failed to load ${file}`)));
        document.body.appendChild(iframe);
    });
}

//A double requestAnimationFrame would capture the real repaint, but the browser pauses rAF (and
//clamps short setTimeout to ~1s) in tabs that are out of focus — which would hang or skew a
//benchmark run in the background/automated. A double microtask flush isn't subject to that
//throttling and still captures updates frameworks schedule via microtask (e.g. Lit's batching and
//Alpine.nextTick) — the cost is not including the browser's own repaint time.
function waitForPaint() {
    return new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));
}

async function measure(fn) {
    const start = performance.now();
    await fn();
    await waitForPaint();
    return performance.now() - start;
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function runFramework(framework, { onLog, onMetric }) {
    onLog(`Loading ${framework.name}…`);

    let iframe;
    try {
        iframe = await createIframe(framework.file);
    } catch (error) {
        onLog(`${framework.name}: failed to load (${error.message})`, true);
        METRICS.forEach((m) => onMetric(framework.id, m.id, null));
        return null;
    }

    const bench = iframe.contentWindow.bench;
    if (!bench) {
        onLog(`${framework.name}: window.bench was not defined`, true);
        iframe.remove();
        METRICS.forEach((m) => onMetric(framework.id, m.id, null));
        return null;
    }

    try {
        await bench.ready;
    } catch (error) {
        onLog(`${framework.name}: failed while waiting for initialization (${error.message})`, true);
        iframe.remove();
        METRICS.forEach((m) => onMetric(framework.id, m.id, null));
        return null;
    }

    const results = {};

    for (const metric of METRICS) {
        try {
            const times = [];
            for (let rep = 0; rep < REPETITIONS; rep++) {
                if (metric.prepare) {
                    await metric.prepare(bench);
                    await waitForPaint();
                }
                times.push(await measure(() => metric.run(bench)));
            }
            const value = median(times);
            results[metric.id] = value;
            onLog(`  ${framework.name} · ${metric.label}: ${value.toFixed(1)} ms`);
            onMetric(framework.id, metric.id, value);
        } catch (error) {
            onLog(`  ${framework.name} · ${metric.label}: error (${error.message})`, true);
            results[metric.id] = null;
            onMetric(framework.id, metric.id, null);
        }
    }

    iframe.remove();
    return results;
}

export async function runAll({ onLog, onMetric, onFrameworkDone }) {
    const allResults = {};
    for (const framework of FRAMEWORKS) {
        allResults[framework.id] = await runFramework(framework, { onLog, onMetric });
        onFrameworkDone(framework.id, allResults[framework.id]);
    }
    return allResults;
}
