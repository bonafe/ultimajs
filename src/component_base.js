

export class ComponentBase extends HTMLElement {



    static LOADED_EVENT = "component-loaded";

    static MAX_LOAD_ATTEMPTS = 3; // Gives up after 3 failed attempts to load a resource



    #rootNode;

    #baseComponentChildren;

    #subclassUrl;
    #baseUrl;

    #loaded;

    #totalChildCount;
    #loadedChildCount;



    /**
     * To build a ComponentBase, pass an object with the component's properties and the URL of the
     * JavaScript class that inherits it.
     *
     * @param {Object} properties - Component properties
     * @param {string} properties.templateUrl - URL of the component's HTML template
     * @param {boolean} properties.shadowDom - true to use Shadow DOM, false to use the light DOM
     * @param {string} subclassUrl - URL of the JavaScript module that inherits ComponentBase (usually import.meta.url)
     */
    constructor(properties, subclassUrl) {
        super();

        // TODO: check that the properties object has the required fields
        this.#subclassUrl = subclassUrl;
        this.#baseUrl = ComponentBase.extractUrlPath(this.#subclassUrl);


        this.#loaded = false;

        this.#totalChildCount = 0;
        this.#loadedChildCount = 0;


        if (properties.shadowDom) {
            this.#rootNode = this.attachShadow({ mode: 'open' });
        } else {
            this.#rootNode = this;
        }

        this.loadTemplate(properties.templateUrl);
    }



    // Getter for rootNode
    get rootNode() {
        return this.#rootNode;
    }



    // Getter for loaded
    get loaded(){
        return this.#loaded;
    }



    /**
     * Override to run initialization once this component (its own template plus every descendant
     * ComponentBase) has finished loading — called directly at the exact point checkLoading()/
     * checkIfAllChildrenLoaded() determine that, so subclasses get it for free without subscribing
     * to LOADED_EVENT themselves and filtering it by composedPath()[0] (see whenLoaded() below for
     * why that filtering is still needed for outside listeners). Subclasses that override this must
     * call super.onLoad().
     */
    onLoad() {}

    /**
     * Promise-based equivalent of onLoad() for code outside the component's own class (e.g. the page
     * that uses it), where overriding onLoad() isn't an option. Resolves immediately if already
     * loaded; otherwise waits for this element's own LOADED_EVENT — filtering out the ones that
     * bubble up from descendants via composedPath()[0], since event.target gets retargeted to this
     * element when the descendant has its own Shadow Root.
     * @returns {Promise<void>}
     */
    whenLoaded() {
        if (this.#loaded) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const listener = (event) => {
                if (event.composedPath()[0] !== this) {
                    return;
                }
                this.removeEventListener(ComponentBase.LOADED_EVENT, listener);
                resolve();
            };
            this.addEventListener(ComponentBase.LOADED_EVENT, listener);
        });
    }



    /**
     * Extracts the base path from a URL
     * @param {string} url - Full URL
     * @returns {string} Base path of the URL
     */
    static extractUrlPath(url) {
        return url.slice(0, url.lastIndexOf("/") + 1);
    }



    /**
     * Resolves a relative or absolute address
     * @param {string} address - Address to resolve
     * @param {string} baseUrl - Base URL used to resolve relative addresses
     * @returns {URL} Resolved URL
     */
    static resolveAddress(address, baseUrl) {
        try {
            return new URL(address);
        } catch (e) {
            return new URL(address, baseUrl);
        }
    }



    resolveAddress(address) {
        return ComponentBase.resolveAddress(address, this.#baseUrl);
    }



    /**
     * Loads the component's HTML template
     * @param {string} templateUrl - URL of the HTML template
     * @param {number} [attempts=1] - Number of load attempts made so far
     */
    async loadTemplate(templateUrl, attempts = 1) {
        if (attempts == undefined) {
            attempts = 0;
        }

        attempts++;
        if (attempts > ComponentBase.MAX_LOAD_ATTEMPTS) {
            console.error(`Error loading template: ${templateUrl} MAX ATTEMPTS EXCEEDED (${attempts})`);
            return false;
        }

        let response = await fetch(this.resolveAddress(templateUrl));
        let pageText = await response.text();

        let template = document.createElement("template");
        template.innerHTML = pageText;

        let element = template.content.cloneNode(true);

        let hrefLinks = this.removeLinkTagsAndGetHrefs(element);
        let scripts = this.removeAndRetrieveScriptElements(element);

        // Fixes relative paths on tags like <img>, <a> and others
        this.fixRelativePaths(element);

        Promise.all([
            ...hrefLinks.map(cssUrl => this.loadCSS(cssUrl)),
            ...scripts.map(script => this.loadScript(script))
        ]).then(results => {
            // After loading all the CSS;
            this.#rootNode.appendChild(element);
            this.observe();

            setTimeout(() => {
                this.checkLoading();
            });
        });
    }

    fixRelativePaths(element) {
        const tagsToFix = {
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

        for (let tag in tagsToFix) {

            let attribute = tagsToFix[tag];

            element.querySelectorAll(tag).forEach(tagElement => {
                if (tag === 'link' && tagElement.getAttribute('rel') === 'stylesheet') {
                    return; // Skip CSS links
                }
                let attributeValue = tagElement.getAttribute(attribute);
                if (attributeValue) {
                    let fixedUrl = this.resolveAddress(attributeValue);
                    tagElement.setAttribute(attribute, fixedUrl);
                }
            });
        }
    }



    /**
     * Removes <link> tags from the template and returns their hrefs
     * @param {DocumentFragment} element - Loaded template
     * @returns {string[]} List of CSS file URLs
     */
    removeLinkTagsAndGetHrefs(element) {
        return Array.from(element.querySelectorAll("link")).map(linkElement => {
            let cssUrl = linkElement.getAttribute("href");
            linkElement.remove();
            return cssUrl;
        });
    }



    /**
     * Removes <script> tags from the template and returns their attributes
     * @param {DocumentFragment} element - Loaded template
     * @returns {Object[]} List of script element attributes
     */
    removeAndRetrieveScriptElements(element) {
        return Array.from(element.querySelectorAll("script")).map(scriptElement => {
            let scriptAttributes = {
                src: scriptElement.getAttribute("src"),
                type: scriptElement.getAttribute("type"),
                integrity: scriptElement.getAttribute("integrity"),
            };
            scriptElement.remove();
            return scriptAttributes;
        });
    }



    observe() {
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (this.processNewDimensions) {
                    this.processNewDimensions(entry.target.clientWidth, entry.target.clientHeight);
                }
            });
        });

        // Observes the first element with the "observed" class
        let observedElement = this.#rootNode.querySelector(".observed");
        if (observedElement) {
            this.resizeObserver.observe(observedElement);
        }
    }



    checkLoading(){

        console.log(`--------------------------------------------------------------`);
        console.log(`Checking loading of ${this.constructor.name}`);

        const allDescendants = this.#rootNode.querySelectorAll('*');

        this.#baseComponentChildren = Array.from(allDescendants).filter(child => child instanceof ComponentBase);

        console.log(`Number of children: ${this.#baseComponentChildren.length}`);


        this.#totalChildCount = this.#baseComponentChildren.length;

        if (this.#totalChildCount === 0) {

            console.log(`Component ${this.constructor.name} has no children`);
            this.#loaded = true;
            this.onLoad();
            this.dispatchEvent(new CustomEvent(ComponentBase.LOADED_EVENT, { bubbles: true, composed: true }));

        }else{
            this.#baseComponentChildren.forEach(child => {

                console.log(`*****************>>>>>>>      Checking loading of ${child.constructor.name}`);

                if (child.loaded) {

                    console.log(`Component ${child.constructor.name} already loaded`);

                    this.#loadedChildCount++;

                    this.checkIfAllChildrenLoaded();

                }else{

                    console.log(`Component ${child.constructor.name} not loaded yet. Adding listener`);

                    child.addEventListener(ComponentBase.LOADED_EVENT, event => {

                        console.log(`!-!_!-!-!_!_!__!---   Event ${ComponentBase.LOADED_EVENT} fired by ${child.constructor.name}`);

                        // The child's event does not propagate further
                        event.stopPropagation();

                        this.#loadedChildCount++;

                        this.checkIfAllChildrenLoaded();
                    });
                }
            });
        }
    }

    checkIfAllChildrenLoaded(){
        console.log(`Loaded children: ${this.#loadedChildCount} of ${this.#totalChildCount}`);
        // If all children are loaded
        if (this.#loadedChildCount === this.#totalChildCount) {
            this.#loaded = true;
            console.log(`------------------------------>>>>>>>>>>>>>>>             Component ${this.constructor.name} loaded`);
            this.onLoad();
            this.dispatchEvent(new CustomEvent(ComponentBase.LOADED_EVENT, { bubbles: true, composed: true }));
        }
    }

    connectedCallback() {}

    disconnectedCallback() {}

    adoptedCallback() {}

    loadCSS(address, childUrl, attempts = 1) {
        let cssUrl = (childUrl ? ComponentBase.resolveAddress(address, childUrl) : this.resolveAddress(address));

        if (attempts == undefined) {
            attempts = 0;
        }
        attempts++;

        return new Promise((resolve, reject) => {
            if (attempts > ComponentBase.MAX_LOAD_ATTEMPTS) {
                console.log(`Error loading CSS: ${cssUrl} MAX ATTEMPTS EXCEEDED (${attempts})`);
                return reject();
            }

            fetch(cssUrl)
                .then(response => response.text())
                .then(text => {
                    let style = document.createElement('style');
                    style.innerHTML = text;

                    style.addEventListener("load", () => {
                        resolve(true);
                    });

                    style.addEventListener("error", (e) => {
                        reject();
                    });
                    this.#rootNode.appendChild(style);
                })
                .catch(function (error) {
                    console.log(`Could not download CSS ${cssUrl}`);
                    reject();
                });
        });
    }

    loadScript(scriptAttributes, childUrl) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.setAttribute("async", "");
            script.src = (childUrl ? ComponentBase.resolveAddress(scriptAttributes.src, childUrl) : this.resolveAddress(scriptAttributes.src));

            if (scriptAttributes.type) {
                script.setAttribute("type", scriptAttributes.type);
            }

            if (scriptAttributes.integrityHash) {
                script.integrity = scriptAttributes.integrityHash;
                script.crossorigin = "anonymous";
            }

            script.addEventListener("load", () => {
                resolve(true);
            });

            script.addEventListener("error", (e) => {
                console.log(`Error loading script: ${script.src}`);
                console.dir(e);
                reject();
            });

            this.#rootNode.appendChild(script);
        });
    }
}
