


export class ComponenteBase extends HTMLElement {



    static EVENTO_CARREGOU = "carregou_componente";

    static LIMITE_TENTATIVAS_CARREGAR_RECURSO = 3; // Tenta no máximo 3 vezes carregar um recurso antes de desistir



    #no_raiz;

    #filhos_componente_base;

    #url_herdeiro;
    #url_base;

    #carregado;

    #numero_total_filhos;
    #numero_filhos_carregados;
    


    /**
     * Ao construir um ComponenteBase, é necessário passar um objeto com as propriedades do componente e a URL da classe javascript que o herda
     * 
     * @param {Object} propriedades - Propriedades do componente
     * @param {string} propriedades.templateURL - URL do template HTML do componente
     * @param {boolean} propriedades.shadowDOM - true para usar shadowDOM, false para usar DOM padrão
     * @param {string} url_herdeiro - URL do componente JavaScript que herda ComponenteBase (normalmente possui o valor de import.meta.url)
     */
    constructor(propriedades, url_herdeiro) {
        super();

        // TODO: Verificar se o objeto propriedades possui as propriedades necessárias
        this.#url_herdeiro = url_herdeiro;
        this.#url_base = ComponenteBase.extrairCaminhoURL(this.#url_herdeiro);


        this.#carregado = false;

        this.#numero_total_filhos = 0;
        this.#numero_filhos_carregados = 0;
        

        if (propriedades.shadowDOM) {
            this.#no_raiz = this.attachShadow({ mode: 'open' });
        } else {
            this.#no_raiz = this;
        }

        this.carregarTemplate(propriedades.templateURL);
    }



    // Getter para no_raiz
    get no_raiz() {
        return this.#no_raiz;
    }



    // Getter para carregado
    get carregado(){
        return this.#carregado;
    }



    /**
     * Extrai o caminho base de uma URL
     * @param {string} url - URL completa
     * @returns {string} Caminho base da URL
     */
    static extrairCaminhoURL(url) {
        return url.slice(0, url.lastIndexOf("/") + 1);
    }



    /**
     * Resolve um endereço relativo ou absoluto
     * @param {string} endereco - Endereço a ser resolvido
     * @param {string} url_base - URL base para resolver endereços relativos
     * @returns {URL} URL resolvida
     */
    static resolverEndereco(endereco, url_base) {
        try {
            return new URL(endereco);
        } catch (e) {
            return new URL(endereco, url_base);
        }
    }



    resolverEndereco(endereco) {
        return ComponenteBase.resolverEndereco(endereco, this.#url_base);
    }



    /**
     * Carrega o template HTML do componente
     * @param {string} url_template - URL do template HTML
     * @param {number} [tentativas=1] - Número de tentativas de carregamento
     */
    async carregarTemplate(url_template, tentativas = 1) {
        if (tentativas == undefined) {
            tentativas = 0;
        }

        tentativas++;
        if (tentativas > ComponenteBase.LIMITE_TENTATIVAS_CARREGAR_RECURSO) {
            console.error(`Erro ao carregar template: ${url_template} NÚMERO DE TENTATIVAS EXCEDIDO (${tentativas})`);
            return false;
        }

        let resposta = await fetch(this.resolverEndereco(url_template));
        let textoPagina = await resposta.text();

        let template = document.createElement("template");
        template.innerHTML = textoPagina;

        let elemento = template.content.cloneNode(true);

        let hrefLinks = this.removerTagsLinkETrazerHRef(elemento);
        let scripts = this.removerERecuperarElementosScript(elemento);

        // Corrige os caminhos relativos para tags <img>, <a> e outras
        this.corrigirCaminhosRelativos(elemento);

        Promise.all([
            ...hrefLinks.map(url_css => this.carregarCSS(url_css)),
            ...scripts.map(script => this.carregarScript(script))
        ]).then(resultados => {
            // Depois de carregar todos os CSS;
            this.#no_raiz.appendChild(elemento);
            this.observar();     
            
            setTimeout(() => {
                this.verificar_carregamento();
            });
        });
    }

    corrigirCaminhosRelativos(elemento) {
        const tagsParaCorrigir = {
            'img': 'src',
            'a': 'href',
            'audio': 'src',
            'video': 'src',
            'source': 'src',
            'iframe': 'src',
            'embed': 'src',
            'object': 'data',
            'track': 'src',
            'area': 'href',
            'meta': 'content',
            'link': 'href'
        };
    
        for (let tag in tagsParaCorrigir) {

            let atributo = tagsParaCorrigir[tag];
            
            elemento.querySelectorAll(tag).forEach(elementoTag => {
                if (tag === 'link' && elementoTag.getAttribute('rel') === 'stylesheet') {
                    return; // Ignorar links CSS
                }
                let valorAtributo = elementoTag.getAttribute(atributo);
                if (valorAtributo) {
                    let urlCorrigida = this.resolverEndereco(valorAtributo);
                    elementoTag.setAttribute(atributo, urlCorrigida);
                }
            });
        }
    }



    /**
     * Remove as tags <link> do template e retorna seus hrefs
     * @param {DocumentFragment} elemento - Template carregado
     * @returns {string[]} Lista de URLs dos arquivos CSS
     */
    removerTagsLinkETrazerHRef(elemento) {
        return Array.from(elemento.querySelectorAll("link")).map(elementoLink => {
            let url_css = elementoLink.getAttribute("href");
            elementoLink.remove();
            return url_css;
        });
    }



    /**
     * Remove as tags <script> do template e retorna seus atributos
     * @param {DocumentFragment} elemento - Template carregado
     * @returns {Object[]} Lista de atributos dos elementos script
     */
    removerERecuperarElementosScript(elemento) {
        return Array.from(elemento.querySelectorAll("script")).map(elementoScript => {
            let atributos_script = {
                src: elementoScript.getAttribute("src"),
                type: elementoScript.getAttribute("type"),
                integrity: elementoScript.getAttribute("integrity"),
            };
            elementoScript.remove();
            return atributos_script;
        });
    }



    observar() {
        this.resizeObserver = new ResizeObserver(elementos => {
            elementos.forEach(elemento => {
                if (this.processarNovasDimensoes) {
                    this.processarNovasDimensoes(elemento.target.clientWidth, elemento.target.clientHeight);
                }
            });
        });

        // Irá observar o primeiro elemento da classe observado
        let elemento_observado = this.#no_raiz.querySelector(".observado");
        if (elemento_observado) {
            this.resizeObserver.observe(elemento_observado);
        }
    }



    verificar_carregamento(){

        console.log(`--------------------------------------------------------------`);
        console.log(`Verificando carregamento de ${this.constructor.name}`);

        const allDescendants = this.#no_raiz.querySelectorAll('*');
        
        this.#filhos_componente_base = Array.from(allDescendants).filter(child => child instanceof ComponenteBase);

        console.log(`Número de filhos: ${this.#filhos_componente_base.length}`);


        this.#numero_total_filhos = this.#filhos_componente_base.length; 

        if (this.#numero_total_filhos === 0) {

            console.log(`Componente ${this.constructor.name} não possui filhos`);
            this.#carregado = true;
            this.dispatchEvent(new CustomEvent(ComponenteBase.EVENTO_CARREGOU, { bubbles: true, composed: true }));

        }else{
            this.#filhos_componente_base.forEach(filho => {
                
                console.log(`*****************>>>>>>>      Verificando carregamento de ${filho.constructor.name}`);

                if (filho.carregado) {

                    console.log(`Componente ${filho.constructor.name} já carregado`);

                    this.#numero_filhos_carregados++;

                    this.verifica_se_todos_filhos_carregados();

                }else{

                    console.log(`Componente ${filho.constructor.name} ainda não carregado. adicionando listener`);

                    filho.addEventListener(ComponenteBase.EVENTO_CARREGOU, evento => {

                        console.log(`!-!_!-!-!_!_!__!---   Evento ${ComponenteBase.EVENTO_CARREGOU} disparado por ${filho.constructor.name}`);

                        //O evento do filho não é propagado
                        evento.stopPropagation();

                        this.#numero_filhos_carregados++;

                        this.verifica_se_todos_filhos_carregados();
                    });
                }
            });
        }
    }
    
    verifica_se_todos_filhos_carregados(){
        console.log(`Número de filhos carregados: ${this.#numero_filhos_carregados} de ${this.#numero_total_filhos}`);
        //Se todos os filhos estiverem carregados
        if (this.#numero_filhos_carregados === this.#numero_total_filhos) {
            this.#carregado = true;
            console.log(`------------------------------>>>>>>>>>>>>>>>             Componente ${this.constructor.name} carregado`);
            this.dispatchEvent(new CustomEvent(ComponenteBase.EVENTO_CARREGOU, { bubbles: true, composed: true }));                    
        }
    }

    connectedCallback() {} 

    disconnectedCallback() {}

    adoptedCallback() {}

    carregarCSS(endereco, url_filho, tentativas = 1) {
        let url_css = (url_filho ? ComponenteBase.resolverEndereco(endereco, url_filho) : this.resolverEndereco(endereco));

        if (tentativas == undefined) {
            tentativas = 0;
        }
        tentativas++;

        return new Promise((resolve, reject) => {
            if (tentativas > ComponenteBase.LIMITE_TENTATIVAS_CARREGAR_RECURSO) {
                console.log(`Erro ao carregar CSS: ${url_css} NÚMERO DE TENTATIVAS EXCEDIDO (${tentativas})`);
                return reject();
            }

            fetch(url_css)
                .then(response => response.text())
                .then(texto => {
                    let style = document.createElement('style');
                    style.innerHTML = texto;

                    style.addEventListener("load", () => {
                        resolve(true);
                    });

                    style.addEventListener("error", (e) => {
                        reject();
                    });
                    this.#no_raiz.appendChild(style);
                })
                .catch(function (error) {
                    console.log(`Não foi possível fazer download do CSS ${url_css}`);
                    reject();
                });
        });
    }

    carregarScript(atributos_script, url_filho) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.setAttribute("async", "");
            script.src = (url_filho ? ComponenteBase.resolverEndereco(atributos_script.src, url_filho) : this.resolverEndereco(atributos_script.src));

            if (atributos_script.type) {
                script.setAttribute("type", atributos_script.type);
            }

            if (atributos_script.hash_integridade) {
                script.integrity = atributos_script.hash_integridade;
                script.crossorigin = "anonymous";
            }

            script.addEventListener("load", () => {
                resolve(true);
            });

            script.addEventListener("error", (e) => {
                console.log(`Erro ao carregar script: ${script.src}`);
                console.dir(e);
                reject();
            });

            this.#no_raiz.appendChild(script);
        });
    }
}
