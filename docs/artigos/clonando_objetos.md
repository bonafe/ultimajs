const dados_atualizados = JSON.parse(JSON.stringify(this.#dados));

Cria uma cópia dos dados atuais

TODO: JSON.parse(JSON.stringify(this.#dados)) é uma forma de clonar o objeto, mas não é a melhor forma
      pois não é eficiente e pode não funcionar com todos os tipos de dados
      Verificar uma forma mais eficiente de clonar o objeto
      https:stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
      https:developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 Exemplo alternativo:
 const dados_atualizados = Object.assign({}, this.#dados);
 Benefícios desse metodo: 
 1. Não é necessário converter para string e depois para objeto            
 const dados_atualizados = {...this.#dados};
 Benefícios desse metodo:
 1. Não é necessário converter para string e depois para objeto            
 2. Não é necessário criar um novo objeto, basta copiar as propriedades do objeto original para o novo objeto
 3. Não é necessário usar o JSON.parse para converter o objeto de volta para um objeto
 Problemas das abordagns:
 1. Não são capazes de clonar objetos complexos, como objetos com funções
 2. Não são capazes de clonar objetos com referências circulares
 3. Não são capazes de clonar objetos com propriedades não enumeráveis
 4. Não são capazes de clonar objetos com protótipos
 5. Não são capazes de clonar objetos com propriedades de símbolos
 6. Não são capazes de clonar objetos com propriedades herdadas
 7. Não são capazes de clonar objetos com propriedades que não são objetos
 8. Não são capazes de clonar objetos com propriedades que são objetos que não são clonáveis

 