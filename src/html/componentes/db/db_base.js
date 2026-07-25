


export class DBBase extends EventTarget{

    
    static EVENTO_BANCO_CARREGADO = "EVENTO_BANCO_CARREGADO";        

    constructor(nomeBanco, versao, funcoesDeUpgradeVersao){

        super();

        if (!window.indexedDB) {
            window.alert("Seu navegador não suporta uma versão estável do IndexedDB. Alguns recursos não estarão disponíveis.");
        }

        this.nomeBanco = nomeBanco;
        this.versao = versao;
        this.funcoesDeUpgradeVersao = funcoesDeUpgradeVersao;

        this.banco = undefined;
        this.loaded = false;
        this.atualizandoBanco = false;
        this.abrirBanco();
    }



    aguardarBanco(){
        return new Promise ((resolve, reject) => {
            if (this.loaded){
                resolve (true);
            }else{
                this.addEventListener(DBBase.EVENTO_BANCO_CARREGADO, ()=>{                    
                    resolve(true);
                });
            }
        });
    }



    async abrirBanco(){

        let request = window.indexedDB.open(this.nomeBanco, this.versao);


        request.onerror = evento => {
            console.error(`Erro ao abrir banco: ${this.nomeBanco} (versão: ${this.versao}): ${evento.target.errorCode}`);
            return;
        };


        request.onsuccess = evento => {

            console.info(`Banco aberto: ${this.nomeBanco} (versão: ${this.versao})`);
            this.banco = request.result;

            this.banco.onerror = evento => {                
                console.error(`Erro no banco: ${this.nomeBanco} (versão: ${this.versao}): ${evento.target.errorCode}`);
            };

            if (!this.atualizandoBanco){

                this.bancoCarregado();

            }else{
                
                this.atualizandoBanco = false;
                this.bancoCarregado();
            }
            return;
        };


        request.onupgradeneeded = evento => {

            this.atualizandoBanco = true;

            console.info (`Função de upgrade do banco: ${this.nomeBanco} (versão: ${this.versao})`);
            this.banco = request.result;                        

            this.atualizacaoVersao(evento.oldVersion);                        
        };
    }



    atualizacaoVersao(versaoAnterior){      

        this.funcoesDeUpgradeVersao.forEach((funcaoDeUpgradeVersao, versao) => {

            versao++;

            if (versao > versaoAnterior){

                funcaoDeUpgradeVersao(this);
            }
        });
    }



    bancoCarregado(){
        this.loaded = true;
        this.dispatchEvent (new Event(DBBase.EVENTO_BANCO_CARREGADO));
    }



    async lerTodosRegistros (objectStore){        
            
        await this.aguardarBanco();

        return new Promise((resolve, reject) => {

            let object_store = this.banco.transaction (objectStore, "readonly").objectStore (objectStore);

            let registros = [];
                
            object_store.openCursor().onsuccess = evento => {
                let cursor = evento.target.result;
                if (cursor){
                    registros.push (cursor.value);
                    cursor.continue();
                }else{
                    resolve(registros);
                }
            };    
        });
    }


    
    async trazerRegistro (chave, objectStore, indice){
              
        await this.aguardarBanco();

        //console.log (`${chave} - ${objectStore} - ${indice}`);

        let object_store = this.banco.transaction (objectStore, "readonly").objectStore (objectStore);

        let elemento_requisicao = object_store;

        if (indice){
            elemento_requisicao = object_store.index(indice);
        }

        return new Promise((resolve, reject) => { 
            
            let request = elemento_requisicao.get(chave);
            request.onsuccess = evento => {                
                resolve(request.result);
            };    
            request.onerror = evento => {
                reject("");
            };
        });    
     }



    async atualizarRegistro (registro, objectStore){
              
        //Garante que o que será persistido é uma cópia
        let copia_registro = structuredClone(registro);        

        await this.aguardarBanco();

        //console.info (`Object Store: ${objectStore} --- %o`, registro);

        let object_store = this.banco.transaction (objectStore, "readwrite").objectStore (objectStore);
                
        return new Promise((resolve, reject) => {            

            //Comando para salvar  registro na object store
            let request = object_store.put(copia_registro);

            request.onsuccess = evento => {                
                resolve(true);
            };    
            request.onerror = evento => {
                reject("");
            };
        });    
     }



     async limparObjectStore(objectStore){
         
        await this.aguardarBanco();

        let object_store = this.banco.transaction (objectStore, "readwrite").objectStore (objectStore);
                
        return new Promise((resolve, reject) => {    

            //Comando para limpar a object store
            let request = object_store.clear();

            request.onsuccess = evento => {                
                resolve(true);
            };    
            request.onerror = evento => {
                reject("");
            };
        });
     }


     static async estimar_armazenamento (){
        return await navigator.storage.estimate();
     }
}