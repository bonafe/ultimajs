export function salvar(network) {
    const posicao_nos = network.getPositions();
    const dadosSalvos = {
        nos: network.body.data.nodes, // Puxa os nós diretamente do network
        posicao_nos: posicao_nos,
        ligacoes: network.body.data.edges, // Puxa as arestas diretamente do network
        configuracoes_grafo: network.getOptionsFromConfigurator(),
        manipulacao: {
            enabled: network.isManipulationEnabled(), // Verifica se a manipulação está ativa
            addNode: network.isAddNodeMode(), // Verifica se o modo de adicionar nós está ativo
            addEdge: network.isAddEdgeMode(), // Verifica se o modo de adicionar arestas está ativo
            editNode: true, // Não há um método direto para verificar o modo de edição de nós
            editEdge: true, // Não há um método direto para verificar o modo de edição de arestas
            deleteNode: network.isDeleteMode(), // Verifica se o modo de exclusão está ativo
            deleteEdge: network.isDeleteMode() // Verifica se o modo de exclusão está ativo
        },
        fisica: network.getPhysicsOptions() // Salva as configurações de física
    };
    localStorage.setItem("grafo", JSON.stringify(dadosSalvos));
    alert("Grafo salvo com sucesso!");
}

export function carregar(network) {
    const dadosSalvos = localStorage.getItem("grafo");
    if (!dadosSalvos) {
        alert("Nenhum grafo salvo encontrado.");
        return;
    }
    
    const { nos, posicao_nos, ligacoes, configuracoes_grafo, manipulacao, fisica } = JSON.parse(dadosSalvos);
    
    // Limpa os dados atuais do network
    network.body.data.nodes.clear();
    network.body.data.edges.clear();

    // Adiciona os nós e arestas carregados
    network.body.data.nodes.add(nos);
    network.body.data.edges.add(ligacoes);

    // Aplica as configurações de física
    network.setOptions({ physics: fisica });

    // Aplica as configurações de manipulação
    if (manipulacao) {
        if (manipulacao.enabled) {
            network.enableEditMode();
        } else {
            network.disableEditMode();
        }

        if (manipulacao.addNode) {
            network.addNodeMode();
        }
        if (manipulacao.addEdge) {
            network.addEdgeMode();
        }
        if (manipulacao.deleteNode || manipulacao.deleteEdge) {
            network.deleteSelected();
        }
    }

    // Aplica as posições dos nós
    setTimeout(() => {
        Object.keys(posicao_nos).forEach(id => {
            network.moveNode(id, posicao_nos[id].x, posicao_nos[id].y);
        });
    }, 100);

    alert("Grafo loaded com sucesso!");
}