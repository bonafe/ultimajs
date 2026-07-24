import { GrafoBases } from "./grafo_bases.js";
import { Evento } from "../../espaco/evento.js";
import { ComponenteBase } from "../../componente_base.js";

export class GrafoIndexedDB extends GrafoBases{

    constructor(){
        super();      
        
        this.addEventListener(ComponenteBase.EVENTO_CARREGOU, () => {
            
            this.carregarIndexedDB().then(() => {
                this.renderizar();
            });
        });        
    }

    renderizar(){        
        if (this.dados){
            if (Object.entries(this.dados).length > 0){
                super.renderizar();
            }
        }
    }

    async carregarIndexedDB(){                    
        
        this.bases = [];

        return new Promise ((resolve_carregado) => {
            this.carregando = true;

            window.indexedDB.databases().then(databases => {                

                Promise.all(databases.map(database => {
                
                    return new Promise ((resolve_databases, reject_databases) => {

                        let nome_sistema = `${database.name}_${database.version}`;

                        let request = window.indexedDB.open(database.name, database.version);

                        request.onsuccess = evento => {
                            let banco = request.result;

                            //console.log (`Banco: ${database.name}`);

                            Promise.all(
                                Array.from(banco.objectStoreNames).map (objectStore => {
                                    return new Promise((resolve, reject) => {
                                        let base = {
                                            "nome": objectStore,
                                            "titulo": objectStore,
                                            "sistema": nome_sistema,
                                            "campos": []
                                        };

                                        //console.log (`---- ObjectStore: ${objectStore}`);
                                        this.lerTodosRegistros(banco, objectStore).then(registros => {
                                            let dicionario_registros = {};
                                            registros.forEach(registro => {
                                                this.mapearCampos(dicionario_registros, registro);
                                            });
                                            base.campos = Object.values(dicionario_registros);
                                            this.bases.push(base);
                                            resolve(true);
                                        });
                                    });
                                })
                            ).then(retornos => {
                                resolve_databases(true);
                            });
                        };
                    });                    
                })).then( retornos => {
                    this.setAttribute("dados",JSON.stringify({bases:this.bases}));                    
                    this.carregando = false;
                    resolve_carregado(true);
                });                              
            });
        });        
    }

    mapearCampos(objetoMetadados, objetoRegistro){
        Object.entries(objetoRegistro).forEach(entrada => {
            const [chave, valor] = entrada;
            if (!objetoMetadados[chave]){
                objetoMetadados[chave] = {
                    nome:chave,
                    titulo:chave,
                    numero_registros:1};
            }else{
                objetoMetadados[chave].numero_registros++;
            }
            if (Object.is(valor)){
                //this.mapearCampos(objetoMetadados[chave], valor);
            }else if (Array.isArray(valor)){
                valor.forEach(valor_lista => {
                    //TODO: estranho
                //    this.mapearCampos (objetoMetadados[chave], valor_lista);
                });                
            }
        });
    }

    async lerTodosRegistros (banco, objectStore){        
            
        return new Promise((resolve, reject) => {

            let object_store = banco.transaction (objectStore, "readonly").objectStore (objectStore);

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
}
customElements.define('grafo-indexeddb', GrafoIndexedDB);