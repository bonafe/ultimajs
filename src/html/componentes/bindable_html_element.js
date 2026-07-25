

export class BindableHTMLElement extends HTMLElement{



    constructor(template){
        super();

		this.loaded = false;

		//Keeping track of masks so we can clean them up
		this.masks = [];
		this.listeners = [];

        this._state = undefined;
        this._shadowRoot = this.attachShadow({mode: 'open'});

		this.template = template;
		if (this.template){
			this.loadTemplate();
		}

        let script = document.createElement("script");
        script.src = "/bibliotecas/imask/imask.js";

        this._shadowRoot.appendChild(script);
    }


    get shadowRoot(){
        return this._shadowRoot;
    }


	async loadTemplate(){

		//TODO: test
		//If a template element was passed to the constructor
		if (this.template instanceof HTMLElement){

			this.shadowRoot.appendChild(template.content.cloneNode(true));
			this.componentLoaded();



		//If the element is a String
		}else if (((typeof this.template).localeCompare("string") ==0) || (this.template instanceof String)) {

			//Loads the content via Fetch
			let response = await fetch(this.template);
			let pageText = await response.text();

			let template = document.createElement('template');
			template.innerHTML = pageText;
			this.shadowRoot.appendChild(template.content.cloneNode(true));

			this.componentLoaded();
		}
	}



	componentLoaded(){
		this.initializeElements();
        this.initialUpdate();
		this.loaded = true;
		this.dispatchEvent(new Event(ComponentBase.LOADED_EVENT));
	}



    set state(newState){
        //The setTimeout call ensures state is only assigned once every component has been created
        setTimeout(() => {
            this.updateState(this._state, newState);
            this._state = newState;
        });
    }



    get state (){
        return this._state;
    }



    initialUpdate(){
        this.updateState(null, this._state)
    }


    updateState(currentState, newState){

        let elements = this._shadowRoot.querySelectorAll("[data-bind]");
        elements.forEach (element =>{


            let bindJson = JSON.parse(element.dataset.bind);

            Object.entries(bindJson).forEach (bindInfo => {

                const [elementProperty, statePath] = bindInfo;

                let currentValue = (currentState == null? null: this.getValue(currentState, statePath.split(".")));
                let newValue = this.getValue(newState, statePath.split("."));

                if (currentValue != newValue){

                    //textContent needs to be accessed directly
                    if (elementProperty.localeCompare("textContent") == 0){

                        element.textContent = newValue;

                    //Other properties can be used as the key
                    }else{


						if((element.tagName.toLowerCase() === 'input') &&
						   (element.type.toLowerCase() === 'datetime-local')){

							console.debug(`[BindableHTMLElement] Date/time element INPUT: ${newValue}`);

							let dateTime = new Date(newValue);
							//Moves the date/time into the user's timezone to display it in the input
							dateTime.setMinutes(dateTime.getMinutes() - dateTime.getTimezoneOffset());
							//The datetime-local input type needs to receive 16 characters
							newValue = dateTime.toISOString().slice(0, 16);

							console.debug(`[BindableHTMLElement] Date/time element OUTPUT: ${newValue}`);
						}

                        element[elementProperty] = newValue;
                    }
                }
            });
        });
    }



    getValue (object, path){
        if (object === undefined){
            return undefined;
        }else{
            let currentStep = path.shift();
            if (path.length > 0){
                return this.getValue (object[currentStep], path);
            }else{
                if (object !== null){
                    return object[currentStep];
                }else{
                    return null
                }
            }
        }
    }



    setValue (object, path, value){
        let currentStep = path.shift();
        if (path.length > 0){
            this.setValue (object[currentStep], path, value);
        }else{
            object[currentStep] = value;
        }
    }



    connectedCallback(){

        this.initializeElements();
    }

	initializeElements(){

		//Clears the masks
		while (this.masks.length){
			this.masks.pop().destroy();
		}

		//Processes the mask
        this._shadowRoot.querySelectorAll("[data-mask]").forEach (element =>{

            //The mask comes as JSON but IMask needs Number values (TODO: check other cases) to be
            //converted to the native type
            let mask = JSON.parse(element.dataset.mask);
            this.transformMask(mask);
            this.masks.push(IMask (element, mask));
        });


		//Clears existing listeners, if any
		while (this.listeners.length){
			let listener = this.listeners.pop();
			listener.element.removeEventListener(listener.event, listener.callback);
		}

        //Processes the data bind
        this._shadowRoot.querySelectorAll("[data-bind]").forEach (element =>{

			//TODO: only listening to change
			let listener = {
				element: element,
				event: "change",
				callback: this.createContentChangedHandler(JSON.parse(element.dataset.bind))
			};
			this.listeners.push(listener)

            element.addEventListener(listener.event, listener.callback);
        });
	}

	createContentChangedHandler (bindJson){
		return event => {

		    Object.entries(bindJson).forEach (bindInfo => {

		        const [elementProperty, statePath] = bindInfo;

		        //Clones the current state
		        let newState = JSON.parse(JSON.stringify(this._state));

		        this.setValue(newState, statePath.split("."), event.target[elementProperty]);

		        //One element's change can ripple into others
		        this.updateState(this._state, newState);

		        this._state = newState;
		    });
		};
	}

    transformMask(mask){
        Object.keys(mask).forEach (key => {

            if (typeof mask[key] == "object"){

                this.transformMask(mask[key]);

            }else if (typeof mask[key] == "string"){

                if (mask[key].localeCompare("Number") == 0){
                    mask[key] = Number;
                }
            }
        });
    }


    disconnectedCallback(){
    }
}

window.customElements.define('bindable-html-element', BindableHTMLElement);
