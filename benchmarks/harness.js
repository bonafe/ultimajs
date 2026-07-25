// Harness de benchmark: carrega cada implementação de framework num <iframe> isolado (evita que um
// framework interfira no DOM/globals de outro), mede operações via performance.now() + duplo
// requestAnimationFrame (garante que o tempo inclui o repaint, não só o trabalho síncrono) e reporta
// a mediana de N repetições por métrica — mesma lógica de "mediana de execuções repetidas" usada por
// baterias de benchmark como o js-framework-benchmark, adaptada aqui pros 4 cenários da spec.

const N_ITENS_LOOP = 1000;
const N_LINHAS = 1000;
const REPETICOES = 5;

export const FRAMEWORKS = [
    { id: 'ultima', nome: 'Ultima', arquivo: 'implementacoes/ultima.html', cor: '--serie-ultima' },
    { id: 'litedom', nome: 'Litedom', arquivo: 'implementacoes/litedom.html', cor: '--serie-litedom', nota: 'sem commits desde 2020' },
    { id: 'alpine', nome: 'Alpine.js', arquivo: 'implementacoes/alpine.html', cor: '--serie-alpine' },
    { id: 'lit', nome: 'Lit', arquivo: 'implementacoes/lit.html', cor: '--serie-lit' },
    { id: 'minze', nome: 'Minze', arquivo: 'implementacoes/minze.html', cor: '--serie-minze' },
    { id: 'vanjs', nome: 'VanJS', arquivo: 'implementacoes/vanjs.html', cor: '--serie-vanjs' }
];

export const METRICAS = [
    {
        id: 'contador', rotulo: `Contador: ${N_ITENS_LOOP} incrementos`,
        descricao: 'Tempo para 1000 atualizações de estado em sequência, cada uma refletida na tela.',
        preparar: (b) => b.contador.reset(),
        executar: (b) => b.contador.incrementar(N_ITENS_LOOP)
    },
    {
        id: 'condicional', rotulo: `Condicional: ${N_ITENS_LOOP} alternâncias`,
        descricao: 'Tempo para 1000 trocas de ramo (visível ↔ oculto) em sequência.',
        preparar: (b) => b.condicional.reset(),
        executar: (b) => b.condicional.alternar(N_ITENS_LOOP)
    },
    {
        id: 'binding', rotulo: `Binding: ${N_ITENS_LOOP} alterações de input`,
        descricao: 'Tempo para 1000 mudanças de valor de um campo, propagadas de volta ao modelo.',
        preparar: (b) => b.binding.reset(),
        executar: (b) => b.binding.escrever(N_ITENS_LOOP)
    },
    {
        id: 'lista_criar', rotulo: `Lista: criar ${N_LINHAS} linhas`,
        descricao: 'Renderizar 1000 linhas a partir de uma lista vazia.',
        preparar: (b) => b.lista.limpar(),
        executar: (b) => b.lista.criar(N_LINHAS)
    },
    {
        id: 'lista_atualizar', rotulo: 'Lista: atualizar 1 a cada 10 linhas',
        descricao: 'Com 1000 linhas já na tela, altera o texto de 100 delas.',
        preparar: (b) => { b.lista.limpar(); b.lista.criar(N_LINHAS); },
        executar: (b) => b.lista.atualizarParcial()
    },
    {
        id: 'lista_trocar', rotulo: 'Lista: trocar 2 linhas de posição',
        descricao: 'Com 1000 linhas, troca a posição de duas linhas específicas (linha 2 e linha 999).',
        preparar: (b) => { b.lista.limpar(); b.lista.criar(N_LINHAS); },
        executar: (b) => b.lista.trocar()
    },
    {
        id: 'lista_remover', rotulo: 'Lista: remover 1 linha',
        descricao: 'Com 1000 linhas, remove a primeira.',
        preparar: (b) => { b.lista.limpar(); b.lista.criar(N_LINHAS); },
        executar: (b) => b.lista.remover()
    },
    {
        id: 'lista_limpar', rotulo: `Lista: limpar ${N_LINHAS} linhas`,
        descricao: 'Com 1000 linhas na tela, remove todas de uma vez.',
        preparar: (b) => { b.lista.limpar(); b.lista.criar(N_LINHAS); },
        executar: (b) => b.lista.limpar()
    }
];

export const METODOLOGIA = { repeticoes: REPETICOES, itensLoop: N_ITENS_LOOP, linhas: N_LINHAS };

function criarIframe(arquivo) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute; left:-9999px; top:0; width:1px; height:1px; border:0;';
        iframe.src = arquivo;
        iframe.addEventListener('load', () => resolve(iframe));
        iframe.addEventListener('error', () => reject(new Error(`falha ao carregar ${arquivo}`)));
        document.body.appendChild(iframe);
    });
}

//Um requestAnimationFrame duplo capturaria o repaint real, mas o navegador pausa rAF (e limita
//setTimeout curto a ~1s) em abas fora de foco — o que travaria ou distorceria o benchmark rodando
//em segundo plano/automatizado. Um duplo flush de microtarefas não sofre esse throttling e ainda
//captura atualizações que frameworks agendam via microtask (ex: o agrupamento de Lit e o
//Alpine.nextTick) — o custo é não incluir o tempo de repaint do navegador em si.
function esperarPintura() {
    return new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));
}

async function medir(fn) {
    const inicio = performance.now();
    await fn();
    await esperarPintura();
    return performance.now() - inicio;
}

function mediana(valores) {
    const ordenado = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenado.length / 2);
    return ordenado.length % 2 !== 0 ? ordenado[meio] : (ordenado[meio - 1] + ordenado[meio]) / 2;
}

async function rodarFramework(framework, { onLog, onMetrica }) {
    onLog(`Carregando ${framework.nome}…`);

    let iframe;
    try {
        iframe = await criarIframe(framework.arquivo);
    } catch (erro) {
        onLog(`${framework.nome}: erro ao carregar (${erro.message})`, true);
        METRICAS.forEach((m) => onMetrica(framework.id, m.id, null));
        return null;
    }

    const bench = iframe.contentWindow.bench;
    if (!bench) {
        onLog(`${framework.nome}: window.bench não foi definido`, true);
        iframe.remove();
        METRICAS.forEach((m) => onMetrica(framework.id, m.id, null));
        return null;
    }

    try {
        await bench.pronto;
    } catch (erro) {
        onLog(`${framework.nome}: falha aguardando inicialização (${erro.message})`, true);
        iframe.remove();
        METRICAS.forEach((m) => onMetrica(framework.id, m.id, null));
        return null;
    }

    const resultados = {};

    for (const metrica of METRICAS) {
        try {
            const tempos = [];
            for (let rep = 0; rep < REPETICOES; rep++) {
                if (metrica.preparar) {
                    await metrica.preparar(bench);
                    await esperarPintura();
                }
                tempos.push(await medir(() => metrica.executar(bench)));
            }
            const valor = mediana(tempos);
            resultados[metrica.id] = valor;
            onLog(`  ${framework.nome} · ${metrica.rotulo}: ${valor.toFixed(1)} ms`);
            onMetrica(framework.id, metrica.id, valor);
        } catch (erro) {
            onLog(`  ${framework.nome} · ${metrica.rotulo}: erro (${erro.message})`, true);
            resultados[metrica.id] = null;
            onMetrica(framework.id, metrica.id, null);
        }
    }

    iframe.remove();
    return resultados;
}

export async function rodarTudo({ onLog, onMetrica, onFrameworkConcluido }) {
    const todosResultados = {};
    for (const framework of FRAMEWORKS) {
        todosResultados[framework.id] = await rodarFramework(framework, { onLog, onMetrica });
        onFrameworkConcluido(framework.id, todosResultados[framework.id]);
    }
    return todosResultados;
}
