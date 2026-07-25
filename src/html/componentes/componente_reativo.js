import { ComponenteBase } from './componente_base.js';

/**
 * ComponenteReativo adiciona reatividade declarativa a um ComponenteBase, lida via atributos
 * data-* no template HTML:
 *
 *   data-mapa='{"atributoDoElemento":"caminho.no.dado"}'   binding de atributo/propriedade, nos dois sentidos
 *              (se o elemento disparar "change", o valor lido volta pros dados)
 *   data-classe='{"nomeDaClasse":"caminho.booleano"}'      liga/desliga classes CSS
 *   data-estilo='{"propriedade-css":"caminho"}'            define propriedades de estilo inline
 *   data-ref="nome"                                        expõe o elemento em this.refs.nome após renderizar
 *   <template data-se="caminho">...</template>
 *   <template data-senao-se="caminho">...</template>       cadeia condicional (o primeiro verdadeiro vence;
 *   <template data-senao>...</template>                    data-senao é o fallback incondicional)
 *   <template data-lista="item in caminho">...</template>   repete o conteúdo para cada item; aceita também
 *                                                           "item, indice in caminho" pra expor o índice, e um
 *                                                           sufixo " : campo" declarando a chave de identidade
 *                                                           dos itens (ex: "e in enderecos : uuid") — com chave
 *                                                           (explícita, ou inferida por uuid/id), os nós DOM de
 *                                                           um item são reaproveitados e movidos entre
 *                                                           renderizações em vez de destruídos e recriados
 *
 * Qualquer caminho usado em data-se/data-senao-se/data-classe aceita um "!" na frente pra negar
 * (ex: data-se="!carregando").
 *
 * Subclasses podem sobrescrever:
 *   computadas()    -> Object       propriedades derivadas de this.dados, somadas aos dados pra todo binding
 *   observadores()  -> Object       {"caminho": (novoValor, valorAntigo) => {...}} chamado após cada render
 *                                   em que o caminho observado mudou (busca em dados brutos + computadas)
 */
export class ComponenteReativo extends ComponenteBase {

    #dados;

    //Última forma serializada de #dados (o que está — ou acabou de chegar — no atributo data-dados).
    //Toda deduplicação passa por comparação dessa string: mata o eco do próprio setAttribute
    //(attributeChangedCallback dispara sincronamente dentro dele) e escritas externas repetidas do
    //mesmo conteúdo, sem nunca serializar/desserializar duas vezes o objeto inteiro só pra comparar.
    #ultimo_json_dados;

    //Instantâneo serializado por caminho observado, da última renderização. Não dá pra guardar uma
    //referência aos dados anteriores: valores aninhados são mutados in-place pelo binding
    //bidirecional, então a "cópia antiga" apontaria pro mesmo objeto já mutado e o observador de um
    //caminho aninhado nunca dispararia.
    #instantaneos_observados;

    //Nós gerados por cada <template> âncora (condicional ou lista), chaveados pelo próprio elemento
    //template — WeakMap: quando o template sai do DOM (ex: o ramo condicional que o continha foi
    //removido), a entrada morre junto, sem precisar de ids sintéticos nem de limpeza manual.
    #gerados_por_ancora;

    //Qual <template> venceu a cadeia condicional da última renderização, por template data-se
    //(âncora do grupo). Se o vencedor não mudou, o ramo NÃO é destruído/recriado — só reprocessado
    //no lugar. Sem isso, todo <template data-lista> (ou qualquer outro estado de identidade) que
    //vive dentro de um ramo condicional seria substituído por um elemento novo a cada render, mesmo
    //quando a condição não mudou, e perderia toda memória de reconciliação por chave.
    #vencedor_por_ancora;

    //Para listas com chave: template -> Map<chave do item, nós desse item>, permitindo reaproveitar
    //os nós DOM de um item cuja chave continua presente na próxima renderização.
    #itens_por_chave;

    //Binding bidirecional: um único listener estável por elemento (criado uma vez, nunca removido —
    //morre com o elemento). O que varia entre renderizações (mapa e escopo vigentes) fica nesta
    //tabela e é consultado na hora do evento, então re-renderizar custa um WeakMap.set por elemento
    //em vez de um par removeEventListener/addEventListener.
    #binding_atual;
    #elementos_com_listener;

    constructor(propriedades, url_herdeiro) {
        super(propriedades, url_herdeiro);

        this.#dados = undefined;
        this.#ultimo_json_dados = undefined;
        this.#instantaneos_observados = new Map();
        this.#gerados_por_ancora = new WeakMap();
        this.#vencedor_por_ancora = new WeakMap();
        this.#itens_por_chave = new WeakMap();
        this.#binding_atual = new WeakMap();
        this.#elementos_com_listener = new WeakSet();

        this.refs = {};

        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, (evento) => {

            //O evento também borbulha de qualquer descendente que carregar depois (ex: um componente
            //reativo aninhado dentro de uma lista). Sem essa checagem, cada carregamento de um
            //descendente reentraria aqui e re-renderizaria à toa.
            //Usa composedPath()[0] em vez de evento.target: quando o descendente tem seu próprio
            //shadow root (ex: outro ComponenteReativo aninhado), o navegador faz "retargeting" e
            //evento.target aparece como este próprio elemento mesmo vindo de dentro do descendente —
            //composedPath()[0] revela a origem real, sem esse efeito.
            if (evento.composedPath()[0] !== this) {
                return;
            }

            this.renderizar();
        });
    }



    get dados() {
        return this.#dados;
    }

    set dados(novos_dados) {
        this.atualizar_dados(novos_dados);
    }



    static get observedAttributes() {
        return ['data-dados'];
    }

    attributeChangedCallback(nome_atributo, valor_antigo, valor_novo) {
        if (nome_atributo !== 'data-dados') {
            return;
        }

        //Barra o eco do nosso próprio setAttribute e escritas externas idênticas — por comparação de
        //string, antes de qualquer JSON.parse.
        if (valor_novo === this.#ultimo_json_dados) {
            return;
        }

        this.#ultimo_json_dados = valor_novo;
        this.#dados = JSON.parse(valor_novo);

        this.dispatchEvent(new Event('change'));
        this.renderizar();
    }



    /**
     * Sobrescreva para declarar propriedades derivadas de this.dados. O retorno é somado aos dados
     * brutos (as chaves daqui vencem em caso de conflito) e fica disponível pra qualquer binding
     * (data-mapa, data-se, data-classe, data-estilo, data-lista) como se fosse um dado normal.
     * @returns {Object}
     */
    computadas() {
        return {};
    }

    /**
     * Sobrescreva para reagir a mudanças de caminhos específicos (busca em dados brutos + computadas).
     * Roda depois de cada renderização em que o caminho observado mudou de valor.
     * @returns {Object<string, function(novoValor, valorAntigo)>}
     */
    observadores() {
        return {};
    }



    atualizar_dados(novos_dados) {
        //Serializa uma única vez: a mesma string serve pra deduplicar e pra escrever no atributo.
        const json = JSON.stringify(novos_dados);
        if (json === this.#ultimo_json_dados) {
            return;
        }

        this.#dados = novos_dados;
        this.#notificar(json);
    }

    /**
     * this.#dados já reflete o estado novo; espelha no atributo, avisa quem escuta e re-renderiza.
     * #ultimo_json_dados é atualizado ANTES do setAttribute porque o attributeChangedCallback
     * dispara sincronamente dentro dele — a comparação de string é o que corta o eco.
     */
    #notificar(json) {
        this.#ultimo_json_dados = json;
        this.setAttribute('data-dados', json);
        this.dispatchEvent(new Event('change'));
        this.renderizar();
    }

    obter_valor(objeto, caminhos) {
        return caminhos.reduce((acc, caminho) => (acc && acc[caminho] !== undefined) ? acc[caminho] : undefined, objeto);
    }

    atualizar_valor(objeto, caminhos, valor) {
        const ultimoCaminho = caminhos.pop();
        const alvo = caminhos.reduce((acc, caminho) => acc[caminho], objeto);
        if (!alvo) {
            return;
        }

        const valorAtual = alvo[ultimoCaminho];

        //Se os dois lados são objeto (ex: um componente aninhado devolvendo o item inteiro via
        //data-mapa='{"data-dados":"item"}'), mescla nas propriedades do objeto já existente em vez
        //de trocar a referência. Importante pra item de lista: o valor atual costuma ser a própria
        //referência viva guardada dentro de this.#dados, e substituí-la por um objeto novo faz a
        //mutação se perder no próximo render (o array continua apontando pro objeto antigo).
        if (valorAtual && typeof valorAtual === 'object' && !Array.isArray(valorAtual) && valor && typeof valor === 'object' && !Array.isArray(valor)) {
            Object.keys(valorAtual).forEach(chave => delete valorAtual[chave]);
            Object.assign(valorAtual, valor);
        } else {
            alvo[ultimoCaminho] = valor;
        }
    }



    renderizar() {

        //O template ainda pode não ter carregado (ex: data-dados setado antes do fetch do template
        //terminar). Nesse caso não há nada pra renderizar ainda; quando o carregamento terminar,
        //o listener de EVENTO_CARREGOU no construtor chama renderizar() de novo com o this.#dados
        //que já está guardado.
        if (!this.carregado) {
            return;
        }

        const dados_efetivos = this.#calcularDadosEfetivos();

        this.refs = {};

        this.#processarEscopo(this.no_raiz, { dados: dados_efetivos, bruto: this.#dados || {} });

        this.#coletarRefs(this.no_raiz);
        this.#executarObservadores(dados_efetivos);
    }

    #calcularDadosEfetivos() {
        return { ...(this.#dados || {}), ...(this.computadas() || {}) };
    }

    #executarObservadores(dados_efetivos) {
        const observadores = this.observadores() || {};

        Object.entries(observadores).forEach(([caminho, callback]) => {
            const valor_novo = this.obter_valor(dados_efetivos, caminho.split('.'));
            const json_novo = JSON.stringify(valor_novo);
            const json_antigo = this.#instantaneos_observados.get(caminho);

            if (json_novo !== json_antigo) {
                this.#instantaneos_observados.set(caminho, json_novo);
                //O valor antigo é reconstruído do instantâneo (cópia), não uma referência viva
                const valor_antigo = json_antigo === undefined ? undefined : JSON.parse(json_antigo);
                callback.call(this, valor_novo, valor_antigo);
            }
        });
    }



    /**
     * Aplica todos os tipos de binding (condicionais, listas, mapa, classe, estilo) aos elementos
     * que pertencem diretamente a este escopo — ou seja, que não estão dentro de uma lista/
     * condicional aninhada (essas são processadas recursivamente com seu próprio escopo quando são
     * criadas/reaproveitadas, ver #aplicarCondicionais/#aplicarListas).
     */
    #processarEscopo(raiz, escopo) {
        const bindings = this.#coletarBindings(raiz);

        this.#aplicarCondicionais(bindings.condicionais, escopo);
        this.#aplicarListas(bindings.listas, escopo);

        bindings.mapas.forEach(elemento => this.#aplicarMapa(elemento, escopo));
        bindings.classes.forEach(elemento => this.#aplicarClasses(elemento, escopo));
        bindings.estilos.forEach(elemento => this.#aplicarEstilos(elemento, escopo));
    }

    /**
     * Uma única travessia da subárvore do escopo, classificando todos os bindings de uma vez —
     * em vez de um querySelectorAll + caminhada de ancestrais por tipo de binding. Ao encontrar a
     * raiz de um escopo aninhado (nó gerado por lista/condicional, marcado com data-ultima-escopo),
     * poda a subárvore inteira: aquele conteúdo é responsabilidade da recursão daquele escopo.
     * O conteúdo interno de <template> não aparece em .children, então fica naturalmente de fora.
     */
    #coletarBindings(raiz) {
        const bindings = { condicionais: [], listas: [], mapas: [], classes: [], estilos: [] };

        const visitar = (elemento, ehRaiz) => {
            if (!ehRaiz && elemento.dataset.ultimaEscopo !== undefined) {
                return;
            }

            const dataset = elemento.dataset;

            if (elemento.tagName === 'TEMPLATE') {
                if (dataset.se !== undefined) {
                    bindings.condicionais.push(elemento);
                } else if (dataset.lista !== undefined) {
                    bindings.listas.push(elemento);
                }
                //data-senao-se/data-senao entram pela cadeia do data-se correspondente
            } else {
                if (dataset.mapa !== undefined) bindings.mapas.push(elemento);
                if (dataset.classe !== undefined) bindings.classes.push(elemento);
                if (dataset.estilo !== undefined) bindings.estilos.push(elemento);
            }

            for (const filho of elemento.children) {
                visitar(filho, false);
            }
        };

        if (raiz.nodeType === Node.ELEMENT_NODE) {
            visitar(raiz, true);
        } else {
            //Shadow root: começa pelos filhos (nós gerados no topo do shadow root pertencem aos seus
            //templates âncora e são podados aqui — quem os reprocessa são os handlers de lista/condicional)
            for (const filho of raiz.children) {
                visitar(filho, false);
            }
        }

        return bindings;
    }

    #removerGerados(ancora) {
        (this.#gerados_por_ancora.get(ancora) || []).forEach(no => no.remove());
    }

    /**
     * Clona o conteúdo de um template para instanciar. Nós de topo que são só indentação (texto em
     * branco) ou comentários são descartados: não participam de nenhum binding e, soltos entre os
     * itens gerados, acumulariam a cada re-render e quebrariam a detecção de "já está no lugar" do
     * reordenamento por nextSibling das listas com chave.
     */
    #clonarConteudo(template) {
        const clone = template.content.cloneNode(true);

        Array.from(clone.childNodes).forEach(no => {
            if (no.nodeType === Node.COMMENT_NODE ||
                (no.nodeType === Node.TEXT_NODE && no.textContent.trim() === '')) {
                no.remove();
            }
        });

        const nos = Array.from(clone.childNodes);
        nos.forEach(no => {
            if (no.nodeType === Node.ELEMENT_NODE) {
                no.dataset.ultimaEscopo = '';
            }
        });

        return { clone, nos };
    }

    /**
     * Resolve um caminho de dados no escopo de leitura, com suporte a negação (prefixo "!").
     */
    #avaliarCaminho(expressao, escopo) {
        const expressaoLimpa = expressao.trim();
        const negar = expressaoLimpa.startsWith('!');
        const caminho = negar ? expressaoLimpa.slice(1).trim() : expressaoLimpa;
        const valor = this.obter_valor(escopo.dados, caminho.split('.'));
        return negar ? !valor : valor;
    }



    // --- Condicionais: data-se / data-senao-se / data-senao ---

    #aplicarCondicionais(templatesSe, escopo) {
        templatesSe.forEach(templateSe => {

            //Monta a cadeia: o próprio data-se seguido dos irmãos data-senao-se/data-senao consecutivos
            const cadeia = [templateSe];
            let proximo = templateSe.nextElementSibling;
            while (proximo && proximo.tagName === 'TEMPLATE' && (proximo.dataset.senaoSe !== undefined || proximo.dataset.senao !== undefined)) {
                cadeia.push(proximo);
                if (proximo.dataset.senao !== undefined) {
                    break;
                }
                proximo = proximo.nextElementSibling;
            }

            let vencedor = null;
            for (const template of cadeia) {
                if (template.dataset.senao !== undefined) {
                    vencedor = template;
                    break;
                }
                const expressao = template.dataset.se !== undefined ? template.dataset.se : template.dataset.senaoSe;
                if (this.#avaliarCaminho(expressao, escopo)) {
                    vencedor = template;
                    break;
                }
            }

            //O ramo escolhido não mudou desde a última renderização (inclusive o caso de nenhum
            //template bater dos dois lados: vencedor e vencedorAnterior ambos null): os nós já
            //existem, só precisam ser reprocessados com o escopo atual — sem destruir/recriar.
            //Isso preserva estado de DOM e, principalmente, a memória de reconciliação por chave de
            //qualquer data-lista que viva dentro do ramo (ela é indexada pelo elemento <template>, que
            //deixaria de ser o mesmo objeto se o ramo fosse reclonado a cada render).
            if (vencedor === this.#vencedor_por_ancora.get(templateSe)) {
                const nosExistentes = this.#gerados_por_ancora.get(templateSe) || [];
                nosExistentes.forEach(no => {
                    if (no.nodeType === Node.ELEMENT_NODE) {
                        this.#processarEscopo(no, escopo);
                    }
                });
                return;
            }

            this.#removerGerados(templateSe);
            this.#vencedor_por_ancora.set(templateSe, vencedor);

            if (!vencedor) {
                this.#gerados_por_ancora.set(templateSe, []);
                return;
            }

            const { clone, nos } = this.#clonarConteudo(vencedor);
            vencedor.after(clone);
            this.#gerados_por_ancora.set(templateSe, nos);

            //Mesmo escopo do pai: data-se não introduz variável nova, só decide o que aparece
            nos.forEach(no => {
                if (no.nodeType === Node.ELEMENT_NODE) {
                    this.#processarEscopo(no, escopo);
                }
            });
        });
    }



    // --- Listas: data-lista="item in caminho [: campoChave]" ---

    #aplicarListas(templates, escopo) {
        templates.forEach(template => {

            const expressao = template.dataset.lista || '';

            //Sintaxe: "item in caminho", "item, indice in caminho", sufixo opcional " : campoChave"
            const [expressaoLaco, campoChaveExplicito] = expressao.split(':').map(parte => parte.trim());
            const partes = expressaoLaco.split(' in ').map(parte => parte.trim());

            if (partes.length !== 2) {
                console.error(`[${this.constructor.name}] data-lista mal formado: "${expressao}". Use "item in caminho", "item, indice in caminho" e opcionalmente " : campoChave".`);
                this.#removerGerados(template);
                this.#gerados_por_ancora.set(template, []);
                return;
            }

            const [variaveis, caminhoLista] = partes;
            const [variavelItem, variavelIndice] = variaveis.split(',').map(parte => parte.trim());

            const lista = this.obter_valor(escopo.dados, caminhoLista.split('.'));

            if (!Array.isArray(lista)) {
                if (lista !== undefined) {
                    console.warn(`[${this.constructor.name}] data-lista: "${caminhoLista}" não é um array.`);
                }
                this.#removerGerados(template);
                this.#gerados_por_ancora.set(template, []);
                this.#itens_por_chave.delete(template);
                return;
            }

            const campoChave = campoChaveExplicito || this.#inferirCampoChave(lista);
            const chaves = campoChave ? this.#extrairChaves(lista, campoChave) : null;

            if (chaves) {
                this.#renderizarListaComChave(template, lista, chaves, variavelItem, variavelIndice, escopo);
            } else {
                this.#renderizarListaSemChave(template, lista, variavelItem, variavelIndice, escopo);
            }
        });
    }

    //Sem chave explícita, uuid/id são as convenções de identidade já usadas no projeto (EspacoDB)
    #inferirCampoChave(lista) {
        if (lista.length === 0) {
            return null;
        }
        for (const campo of ['uuid', 'id']) {
            if (lista.every(item => item && typeof item === 'object' && item[campo] !== undefined)) {
                return campo;
            }
        }
        return null;
    }

    //Chaves só são utilizáveis se todas existirem e forem únicas nesta passada; senão, recua pro
    //modo sem chave (destruir e reconstruir) em vez de reaproveitar nós do item errado.
    #extrairChaves(lista, campoChave) {
        const chaves = lista.map(item => (item && typeof item === 'object') ? item[campoChave] : undefined);
        if (chaves.some(chave => chave === undefined) || new Set(chaves).size !== chaves.length) {
            return null;
        }
        return chaves;
    }

    //Escopos de item encadeiam por protótipo em vez de espalhar (copiar) todos os dados do pai a
    //cada item — obter_valor/atualizar_valor leem através da cadeia normalmente.
    #criarEscopoItem(item, indice, variavelItem, variavelIndice, escopo) {
        const dados = Object.create(escopo.dados);
        dados[variavelItem] = item;
        if (variavelIndice) {
            dados[variavelIndice] = indice;
        }

        const bruto = Object.create(escopo.bruto);
        bruto[variavelItem] = item;

        return { dados, bruto };
    }

    #renderizarListaSemChave(template, lista, variavelItem, variavelIndice, escopo) {
        this.#removerGerados(template);
        this.#itens_por_chave.delete(template);

        const gerados = [];

        lista.forEach((item, indice) => {
            const escopoItem = this.#criarEscopoItem(item, indice, variavelItem, variavelIndice, escopo);
            const { clone, nos } = this.#clonarConteudo(template);

            template.before(clone);
            gerados.push(...nos);

            nos.forEach(no => {
                if (no.nodeType === Node.ELEMENT_NODE) {
                    this.#processarEscopo(no, escopoItem);
                }
            });
        });

        this.#gerados_por_ancora.set(template, gerados);
    }

    #renderizarListaComChave(template, lista, chaves, variavelItem, variavelIndice, escopo) {
        const geracaoAnterior = this.#itens_por_chave.get(template) || new Map();
        const proximaGeracao = new Map();
        const sequencia = [];
        const paraProcessar = [];

        lista.forEach((item, indice) => {
            const chave = chaves[indice];
            const escopoItem = this.#criarEscopoItem(item, indice, variavelItem, variavelIndice, escopo);

            let nos = geracaoAnterior.get(chave);
            if (nos) {
                //Chave sobreviveu: reaproveita os nós DOM como estão (estado de foco/scroll/seleção
                //preservado); os bindings são reaplicados abaixo com o escopo novo, então o conteúdo
                //fica correto mesmo que o objeto do item tenha sido substituído por outro equivalente
                geracaoAnterior.delete(chave);
            } else {
                const { clone, nos: novos } = this.#clonarConteudo(template);
                nos = novos;
                //Posição provisória: o passo de ordenação abaixo coloca tudo no lugar certo
                template.before(clone);
            }

            proximaGeracao.set(chave, nos);
            sequencia.push(...nos);
            paraProcessar.push([nos, escopoItem]);
        });

        //Itens cujas chaves saíram da lista
        geracaoAnterior.forEach(nos => nos.forEach(no => no.remove()));

        //Ordenação com movimento mínimo: percorre a sequência desejada de trás pra frente, ancorada
        //no template (os itens sempre vivem imediatamente antes dele), movendo só o que está fora do
        //lugar — numa lista sem reordenação, nenhum nó é tocado.
        let referencia = template;
        for (let i = sequencia.length - 1; i >= 0; i--) {
            const no = sequencia[i];
            if (no.nextSibling !== referencia) {
                referencia.parentNode.insertBefore(no, referencia);
            }
            referencia = no;
        }

        paraProcessar.forEach(([nos, escopoItem]) => {
            nos.forEach(no => {
                if (no.nodeType === Node.ELEMENT_NODE) {
                    this.#processarEscopo(no, escopoItem);
                }
            });
        });

        this.#itens_por_chave.set(template, proximaGeracao);
        this.#gerados_por_ancora.set(template, sequencia);
    }



    // --- data-mapa: binding de atributo/propriedade (e o lado DOM -> dados via listener estável) ---

    #aplicarMapa(elemento, escopo) {
        const mapa_dados = JSON.parse(elemento.dataset.mapa);

        Object.entries(mapa_dados).forEach(([atributo_elemento, caminho_dados]) => {
            const novo_valor = this.obter_valor(escopo.dados, caminho_dados.split('.'));
            this.#aplicarValorAtributo(elemento, atributo_elemento, novo_valor);
        });

        this.#binding_atual.set(elemento, { mapa_dados, escopo });

        if (!this.#elementos_com_listener.has(elemento)) {
            this.#elementos_com_listener.add(elemento);
            elemento.addEventListener('change', this.#aoMudarConteudo);
        }
    }

    #aoMudarConteudo = (evento) => {
        const elemento = evento.currentTarget;
        const binding = this.#binding_atual.get(elemento);
        if (!binding) {
            return;
        }

        Object.entries(binding.mapa_dados).forEach(([atributo_elemento, caminho_dados]) => {
            //Escreve no objeto "bruto" do escopo: pra dados de topo é this.#dados de verdade, e
            //pra item de lista é o próprio objeto do array (mesma referência), então a mudança
            //se propaga sem precisar traduzir o caminho pra relativo à raiz.
            this.atualizar_valor(binding.escopo.bruto, caminho_dados.split('.'), this.#lerValorAtributo(elemento, atributo_elemento));
        });

        //Não passa por atualizar_dados(): como escopo.bruto é a própria referência de this.#dados
        //(ou um objeto vivo aninhado dentro dele), a mutação acima já aconteceu ANTES deste ponto —
        //comparar objeto "antes" com "depois" nunca veria diferença. A serialização nova, porém,
        //ainda é comparável com a última serialização conhecida: se forem iguais, o "change" foi um
        //eco sem mudança de conteúdo (ex: o próprio render do pai aplicando data-dados num filho
        //reativo, que redispara change sincronamente) e não há nada a fazer.
        const json = JSON.stringify(this.#dados);
        if (json === this.#ultimo_json_dados) {
            return;
        }
        this.#notificar(json);
    };

    #aplicarValorAtributo(elemento, atributo_elemento, novo_valor) {

        if (atributo_elemento === "textContent") {

            if (elemento.textContent !== (novo_valor ?? '').toString()) {
                elemento.textContent = novo_valor;
            }

        } else if (atributo_elemento === "checked") {

            if (elemento.checked !== !!novo_valor) {
                elemento.checked = !!novo_valor;
            }

        } else if (elemento.tagName.toLowerCase() === 'input' && elemento.type.toLowerCase() === 'datetime-local') {

            let data_hora = new Date(novo_valor);
            data_hora.setMinutes(data_hora.getMinutes() - data_hora.getTimezoneOffset());
            let novo_valor_formatado = data_hora.toISOString().slice(0, 16);

            if (elemento.value !== novo_valor_formatado) {
                elemento[atributo_elemento] = novo_valor_formatado;
            }

        } else if (atributo_elemento === "value" && elemento.value !== novo_valor) {

            elemento.value = novo_valor;

        } else if (elemento.getAttribute(atributo_elemento) !== String(novo_valor)) {

            let valor_em_string = (typeof novo_valor === 'object' && novo_valor !== null) ? JSON.stringify(novo_valor) : novo_valor;
            elemento.setAttribute(atributo_elemento, valor_em_string);
        }
    }

    #lerValorAtributo(elemento, atributo_elemento) {

        if (atributo_elemento === "checked") {
            return elemento.checked;
        }

        //O elemento filho é, ele mesmo, um ComponenteReativo (ex: data-mapa='{"data-dados":"item"}'
        //num componente aninhado): lê pela API dele (this.dados), não pelo atributo HTML literal.
        if (atributo_elemento === "data-dados" && elemento.dados !== undefined) {
            return elemento.dados;
        }

        return elemento[atributo_elemento];
    }



    // --- data-classe: liga/desliga classes CSS ---

    #aplicarClasses(elemento, escopo) {
        const mapa_classes = JSON.parse(elemento.dataset.classe);

        Object.entries(mapa_classes).forEach(([nome_classe, expressao]) => {
            elemento.classList.toggle(nome_classe, !!this.#avaliarCaminho(expressao, escopo));
        });
    }



    // --- data-estilo: propriedades de estilo inline ---

    #aplicarEstilos(elemento, escopo) {
        const mapa_estilo = JSON.parse(elemento.dataset.estilo);

        Object.entries(mapa_estilo).forEach(([propriedade_css, caminho]) => {
            const valor = this.obter_valor(escopo.dados, caminho.split('.'));

            if (valor === undefined || valor === null) {
                elemento.style.removeProperty(propriedade_css);
            } else {
                elemento.style.setProperty(propriedade_css, String(valor));
            }
        });
    }



    // --- data-ref: expõe elementos em this.refs ---

    #coletarRefs(raiz) {
        raiz.querySelectorAll('[data-ref]').forEach(elemento => {
            const nome = elemento.dataset.ref;

            if (this.refs[nome] === undefined) {
                this.refs[nome] = elemento;
            } else if (Array.isArray(this.refs[nome])) {
                this.refs[nome].push(elemento);
            } else {
                this.refs[nome] = [this.refs[nome], elemento];
            }
        });
    }
}

window.customElements.define('componente-reativo', ComponenteReativo);
