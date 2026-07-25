# Instruções para sessão com Fable 5

Este arquivo é para você (Fable 5) ler no início da sessão, antes de fazer qualquer outra coisa.
Fable 5 é um modelo caro — esta sessão tem um escopo único e deliberadamente estreito. Não se
distraia com outras partes do projeto, por mais que pareçam interessantes ou fáceis de "só ajeitar
de passagem".

## Antes de começar: contexto (leia, não re-explore)

Não faça uma varredura própria do repositório. O contexto já está escrito:

1. `CLAUDE.md` (raiz do repo) — comandos, arquitetura geral.
2. `documentacao-tecnica/especificacao/02-arquitetura-nucleo.md` — a peça que te interessa: `ComponenteReativo`, o
   pipeline de renderização reativa completo (escopo, condicionais, listas, binding bidirecional).
3. `documentacao-tecnica/especificacao/08-debito-tecnico-conhecido.md`, seção 8.8 — limitações arquiteturais já
   identificadas, incluindo a ausência de *keyed diffing* em listas.
4. O código-fonte em si: `src/html/componentes/componente_reativo.js` (arquivo único, ~550 linhas).

Leia esses quatro primeiro. Só abra outros arquivos do projeto se um deles apontar diretamente para
lá.

## Escopo desta sessão: performance do pipeline reativo de `ComponenteReativo`

Só isso. Não é sessão de: correção de bugs gerais (tem uma lista em 8.4/8.5/8.6/8.7 da
especificação — não são seus), novas features de template, design visual, outros componentes do
catálogo (seção 6), infraestrutura de deploy. Se notar algo fora do escopo, **anote num comentário
ou na sua mensagem final, não corrija**.

### Por que essa área especificamente

`ComponenteReativo` (reformulado recentemente) hoje prioriza corretude sobre performance — foi
escrito e testado peça por peça, sem otimização deliberada. Ele já funciona corretamente (condicionais,
listas, computed, refs, watchers, binding bidirecional, escopo aninhado — tudo testado manualmente no
navegador). O que falta é uma passada de alguém que consiga pensar em algoritmos/estruturas de dados
melhores para o mesmo comportamento observável, sem quebrar nada do que já funciona.

## Prioridades, em ordem (pare quando o tempo/orçamento acabar — não precisa fazer tudo)

### 1. Renderização de lista sem *keyed diffing* (`#aplicarListas`)

Hoje, toda vez que uma lista muda, **todo** o conteúdo gerado anteriormente é removido e recriado do
zero (`#removerGeradosAnteriores` + reconstrução completa). Isso descarta estado de DOM (foco, scroll,
seleção de texto, estado de componentes aninhados que não vem de `dados`) e é O(n) em manipulação de
DOM mesmo quando só um item mudou.

Implemente uma reconciliação por chave: assumir que cada item tem uma chave estável (hoje não existe
esse conceito explícito — proponha uma sintaxe, ex: `data-lista="item in caminho :chave"` ou inferir
via `item.uuid`/`item.id` se existir, com fallback pro comportamento atual se não houver chave
disponível). Objetivo: reordenar/mover nós DOM existentes em vez de destruir e recriar quando a
identidade do item é a mesma.

### 2. `deve_atualizar()` — comparação por `JSON.stringify` a cada mutação

`atualizar_dados()` decide se re-renderiza serializando o objeto de dados inteiro duas vezes
(`JSON.stringify` do antigo e do novo) a cada chamada — custo proporcional ao tamanho total dos
dados, não ao tamanho da mudança. Para dados grandes/aninhados isso é o gargalo mais óbvio.

Pense numa alternativa mais barata. Não precisa ser um sistema de proxies reativos completo (isso
seria uma reescrita estrutural grande demais pro escopo desta sessão) — mas considere: comparação
rasa (`shallow equal`) combinada com convenção de "sempre criar objeto novo ao mutar" (que já é o
padrão usado no binding bidirecional, ver `#gerarFuncaoMudancaConteudo`), ou um contador de versão
incrementado manualmente em pontos de mutação conhecidos.

### 3. Re-varredura completa do DOM a cada `renderizar()`

`#processarEscopo` chama `#elementosNoEscopo` uma vez **por tipo de binding**
(`data-mapa`, `data-classe`, `data-estilo`, mais os `<template>` de condicional/lista) — cada uma
faz seu próprio `querySelectorAll` + caminhada de ancestrais pra filtrar escopo aninhado. Isso é
várias passadas pela mesma árvore DOM a cada render.

Considere unificar numa única passada que coleta todos os bindings relevantes de uma vez
(`data-mapa`, `data-classe`, `data-estilo` simultaneamente via um seletor combinado ou uma única
`TreeWalker`), preservando exatamente o comportamento de escopo atual (a fronteira marcada por
`data-ultima-escopo` continua valendo).

### 4. Religamento de listeners a cada render (`#ligarEventosDeMudanca`/`#desligarEventosDeMudanca`)

Hoje remove **todos** os listeners de `change` e recria **todos** a cada `renderizar()`, mesmo para
elementos que não mudaram de escopo entre um render e outro. Se sobrar orçamento depois dos itens
1–3, veja se dá para só tocar nos listeners de elementos que de fato entraram/saíram/mudaram de
escopo.

## Regra de disciplina: não teste no Chrome com este modelo

Você tem ferramentas de automação de navegador (`mcp__claude-in-chrome__*`). **Não as use.** Testar
interativamente no navegador (recarregar, clicar, tirar screenshot, ler console, repetir) é um
processo iterativo de tentativa-e-erro que não precisa de raciocínio caro — é trabalho mecânico que o
Sonnet faz igualmente bem por uma fração do custo.

Quando terminar uma mudança (ou um item da lista de prioridades):

1. Pare de escrever código.
2. Deixe uma nota curta e objetiva pro usuário: o que mudou, por que, e **um roteiro específico de
   teste manual** (quais páginas abrir — `z.exemplo/index.html` já é o cenário de teste existente
   pra `ComponenteReativo`, com condicional, lista e componente aninhado prontos —, quais interações
   fazer, o que observar como sinal de sucesso ou de regressão).
3. Diga explicitamente: "pausar aqui, trocar para Sonnet pra validar no navegador".

O usuário vai trocar de modelo, rodar o teste, e só volta a te chamar (ou reabre uma sessão sua) se o
resultado do teste indicar que precisa de mais raciocínio de otimização — não para o ciclo de
testar-e-ajustar em si.

## Regras gerais (as mesmas do resto do projeto)

- Não crie abstração nova além do que o item da lista pede. Sem sistema de proxies reativos completo,
  sem reescrita do modelo de escopo — são mudanças cirúrgicas dentro da estrutura que já existe.
- Comente só o não óbvio (por que, não o quê) — mesmo padrão do resto do código.
- Não corrija os bugs listados na seção 8 da especificação a menos que estejam literalmente no seu
  caminho (ex: colidem com o código que você está mudando).
- Ao final, se o item 1 (keyed diffing) exigir uma sintaxe nova (`:chave` ou equivalente), documente
  essa sintaxe nova na seção 2.2.3 de `documentacao-tecnica/especificacao/02-arquitetura-nucleo.md` — é a fonte da
  verdade da DSL de template.
