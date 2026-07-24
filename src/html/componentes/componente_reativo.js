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
 *   <template data-lista="item in caminho.para.lista">      repete o conteúdo para cada item; aceita também
 *       ...bindings usando "item.campo"...                  "item, indice in caminho" pra expor o índice
 *   </template>
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

    #listeners;
    #dados;
    #dados_efetivos_anteriores;
    #elementos_gerados;
    #proximo_id_ancora;

    constructor(propriedades, url_herdeiro) {
        super(propriedades, url_herdeiro);

        this.#listeners = [];
        this.#dados = undefined;
        this.#dados_efetivos_anteriores = undefined;
        this.#elementos_gerados = new Map();
        this.#proximo_id_ancora = 0;

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
        this.dataset.dados = JSON.stringify(novos_dados);
        this.atualizar_dados(novos_dados);
    }



    static get observedAttributes() {
        return ['data-dados'];
    }

    attributeChangedCallback(nome_atributo, valor_antigo, valor_novo) {
        if (nome_atributo === 'data-dados') {
            this.atualizar_dados(JSON.parse(valor_novo));
        }
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



    deve_atualizar(novos_dados) {
        let deve_atualizar = false;

        if (this.#dados !== novos_dados) {
            if (!this.#dados && novos_dados) {
                deve_atualizar = true;
            } else if (JSON.stringify(this.#dados).localeCompare(JSON.stringify(novos_dados)) != 0) {
                deve_atualizar = true;
            }
        }

        return deve_atualizar;
    }

    atualizar_dados(novos_dados) {
        if (!this.deve_atualizar(novos_dados)) {
            return;
        }

        this.#dados = novos_dados;

        this.dispatchEvent(new Event("change"));
        this.setAttribute('data-dados', JSON.stringify(this.#dados));

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

    connectedCallback() {}

    disconnectedCallback() {
        this.#desligarEventosDeMudanca();
    }



    renderizar() {

        //O template ainda pode não ter carregado (ex: data-dados setado antes do fetch do template
        //terminar). Nesse caso não há nada pra renderizar ainda; quando o carregamento terminar,
        //o listener de EVENTO_CARREGOU no construtor chama renderizar() de novo com o this.#dados
        //que já está guardado.
        if (!this.carregado) {
            return;
        }

        this.#desligarEventosDeMudanca();

        const dados_efetivos = this.#calcularDadosEfetivos();

        this.refs = {};

        this.#processarEscopo(this.no_raiz, { dados: dados_efetivos, bruto: this.#dados || {} });

        this.#coletarRefs(this.no_raiz);
        this.#executarObservadores(dados_efetivos);

        this.#dados_efetivos_anteriores = dados_efetivos;
    }

    #calcularDadosEfetivos() {
        return { ...(this.#dados || {}), ...(this.computadas() || {}) };
    }

    #executarObservadores(dados_efetivos) {
        const observadores = this.observadores() || {};
        const anteriores = this.#dados_efetivos_anteriores;

        Object.entries(observadores).forEach(([caminho, callback]) => {
            const valor_novo = this.obter_valor(dados_efetivos, caminho.split('.'));
            const valor_antigo = anteriores ? this.obter_valor(anteriores, caminho.split('.')) : undefined;

            if (JSON.stringify(valor_novo) !== JSON.stringify(valor_antigo)) {
                callback.call(this, valor_novo, valor_antigo);
            }
        });
    }



    /**
     * Aplica todos os tipos de binding (condicionais, listas, mapa, classe, estilo) e liga os
     * eventos de mudança dos elementos que pertencem diretamente a este escopo — ou seja, que não
     * estão dentro de uma lista/condicional aninhada (essas são processadas recursivamente com seu
     * próprio escopo quando são criadas, ver #aplicarCondicionais/#aplicarListas).
     */
    #processarEscopo(raiz, escopo) {
        this.#aplicarCondicionais(raiz, escopo);
        this.#aplicarListas(raiz, escopo);
        this.#aplicarMapa(raiz, escopo);
        this.#aplicarClasses(raiz, escopo);
        this.#aplicarEstilos(raiz, escopo);
        this.#ligarEventosDeMudanca(raiz, escopo);
    }

    /**
     * Retorna os elementos que casam com o seletor dentro de "raiz" (incluindo a própria raiz),
     * excluindo os que pertencem a um escopo aninhado mais próximo (uma lista/condicional gerada
     * dentro de raiz) — esses já foram/serão processados pela chamada recursiva daquele escopo.
     */
    #elementosNoEscopo(raiz, seletor) {
        const candidatos = Array.from(raiz.querySelectorAll(seletor));

        if (raiz.nodeType === Node.ELEMENT_NODE && raiz.matches(seletor)) {
            candidatos.unshift(raiz);
        }

        return candidatos.filter(elemento => {
            if (elemento === raiz) {
                return true;
            }
            //O próprio elemento pode ser a raiz de um escopo aninhado (ex: o item de uma lista sem
            //nenhum elemento entre ele e "raiz") — nesse caso já foi/será processado pela recursão
            //daquele escopo, não por este.
            if (elemento.dataset.ultimaEscopo !== undefined) {
                return false;
            }
            let ancestral = elemento.parentElement;
            while (ancestral && ancestral !== raiz) {
                if (ancestral.dataset.ultimaEscopo !== undefined) {
                    return false;
                }
                ancestral = ancestral.parentElement;
            }
            return true;
        });
    }

    #idDoAncora(elemento) {
        if (!elemento.dataset.ultimaAncoraId) {
            elemento.dataset.ultimaAncoraId = `ancora-${this.#proximo_id_ancora++}`;
        }
        return elemento.dataset.ultimaAncoraId;
    }

    #removerGeradosAnteriores(ancoraId) {
        (this.#elementos_gerados.get(ancoraId) || []).forEach(no => no.remove());
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

    #aplicarCondicionais(raiz, escopo) {
        this.#elementosNoEscopo(raiz, 'template[data-se]').forEach(templateSe => {

            const ancoraId = this.#idDoAncora(templateSe);

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

            this.#removerGeradosAnteriores(ancoraId);

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

            if (!vencedor) {
                this.#elementos_gerados.set(ancoraId, []);
                return;
            }

            const clone = vencedor.content.cloneNode(true);
            const gerados = Array.from(clone.children).filter(no => no.nodeType === Node.ELEMENT_NODE);

            gerados.forEach(no => { no.dataset.ultimaEscopo = ''; });
            vencedor.after(clone);
            this.#elementos_gerados.set(ancoraId, gerados);

            //Mesmo escopo do pai: data-se não introduz variável nova, só decide o que aparece
            gerados.forEach(no => this.#processarEscopo(no, escopo));
        });
    }



    // --- Listas: data-lista="item in caminho" ou "item, indice in caminho" ---

    #aplicarListas(raiz, escopo) {
        this.#elementosNoEscopo(raiz, 'template[data-lista]').forEach(template => {

            const ancoraId = this.#idDoAncora(template);
            this.#removerGeradosAnteriores(ancoraId);

            const expressao = template.dataset.lista || '';
            const partes = expressao.split(' in ').map(parte => parte.trim());

            if (partes.length !== 2) {
                console.error(`[${this.constructor.name}] data-lista mal formado: "${expressao}". Use "item in caminho" ou "item, indice in caminho".`);
                this.#elementos_gerados.set(ancoraId, []);
                return;
            }

            const [variaveis, caminhoLista] = partes;
            const [variavelItem, variavelIndice] = variaveis.split(',').map(parte => parte.trim());

            const lista = this.obter_valor(escopo.dados, caminhoLista.split('.'));
            const gerados = [];

            if (Array.isArray(lista)) {
                lista.forEach((item, indice) => {
                    const clone = template.content.cloneNode(true);
                    const raizesItem = Array.from(clone.children).filter(no => no.nodeType === Node.ELEMENT_NODE);

                    const escopoItem = {
                        dados: {
                            ...escopo.dados,
                            [variavelItem]: item,
                            ...(variavelIndice ? { [variavelIndice]: indice } : {})
                        },
                        bruto: {
                            ...escopo.bruto,
                            [variavelItem]: item
                        }
                    };

                    raizesItem.forEach(no => { no.dataset.ultimaEscopo = ''; });
                    template.before(clone);
                    gerados.push(...raizesItem);

                    raizesItem.forEach(no => this.#processarEscopo(no, escopoItem));
                });
            } else if (lista !== undefined) {
                console.warn(`[${this.constructor.name}] data-lista: "${caminhoLista}" não é um array.`);
            }

            this.#elementos_gerados.set(ancoraId, gerados);
        });
    }



    // --- data-mapa: binding de atributo/propriedade ---

    #aplicarMapa(raiz, escopo) {
        this.#elementosNoEscopo(raiz, '[data-mapa]').forEach(elemento => {
            const mapa_dados = JSON.parse(elemento.dataset.mapa);

            Object.entries(mapa_dados).forEach(([atributo_elemento, caminho_dados]) => {
                const novo_valor = this.obter_valor(escopo.dados, caminho_dados.split('.'));
                this.#aplicarValorAtributo(elemento, atributo_elemento, novo_valor);
            });
        });
    }

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

    #aplicarClasses(raiz, escopo) {
        this.#elementosNoEscopo(raiz, '[data-classe]').forEach(elemento => {
            const mapa_classes = JSON.parse(elemento.dataset.classe);

            Object.entries(mapa_classes).forEach(([nome_classe, expressao]) => {
                elemento.classList.toggle(nome_classe, !!this.#avaliarCaminho(expressao, escopo));
            });
        });
    }



    // --- data-estilo: propriedades de estilo inline ---

    #aplicarEstilos(raiz, escopo) {
        this.#elementosNoEscopo(raiz, '[data-estilo]').forEach(elemento => {
            const mapa_estilo = JSON.parse(elemento.dataset.estilo);

            Object.entries(mapa_estilo).forEach(([propriedade_css, caminho]) => {
                const valor = this.obter_valor(escopo.dados, caminho.split('.'));

                if (valor === undefined || valor === null) {
                    elemento.style.removeProperty(propriedade_css);
                } else {
                    elemento.style.setProperty(propriedade_css, String(valor));
                }
            });
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



    // --- Binding bidirecional: escuta "change" nos elementos com data-mapa do escopo ---

    #ligarEventosDeMudanca(raiz, escopo) {
        this.#elementosNoEscopo(raiz, '[data-mapa]').forEach(elemento => {

            //Garante que esse data-mapa não está dentro de um <template> ainda não resolvido
            if (elemento.closest('template') !== null) {
                return;
            }

            const mapa_dados = JSON.parse(elemento.dataset.mapa);
            const funcao_mudanca = this.#gerarFuncaoMudancaConteudo(mapa_dados, escopo);

            this.#listeners.push({ elemento, funcao_mudanca });
            elemento.addEventListener("change", funcao_mudanca);
        });
    }

    #desligarEventosDeMudanca() {
        this.#listeners.forEach(({ elemento, funcao_mudanca }) => {
            elemento.removeEventListener("change", funcao_mudanca);
        });
        this.#listeners = [];
    }

    #gerarFuncaoMudancaConteudo(mapa_dados, escopo) {
        return evento => {
            const elemento = evento.target;

            Object.entries(mapa_dados).forEach(([atributo_elemento, caminho_dados]) => {
                //Escreve no objeto "bruto" do escopo: pra dados de topo é this.#dados de verdade, e
                //pra item de lista é o próprio objeto do array (mesma referência), então a mudança
                //se propaga sem precisar traduzir o caminho pra relativo à raiz.
                this.atualizar_valor(escopo.bruto, caminho_dados.split('.'), this.#lerValorAtributo(elemento, atributo_elemento));
            });

            //Não dá pra passar pelo gate de deve_atualizar() de atualizar_dados(): como escopo.bruto
            //é a própria referência de this.#dados (ou um objeto vivo aninhado dentro dele), a
            //mutação acima já aconteceu direto em this.#dados ANTES desse ponto — então "antes" e
            //"depois" já são idênticos e a comparação por JSON nunca veria diferença. Já sabemos que
            //algo mudou (estamos dentro do handler de "change"), então notifica direto.
            this.dispatchEvent(new Event("change"));
            this.setAttribute('data-dados', JSON.stringify(this.#dados));
            this.renderizar();
        };
    }
}

window.customElements.define('componente-reativo', ComponenteReativo);
