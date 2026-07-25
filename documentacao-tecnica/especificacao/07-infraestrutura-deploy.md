# 7. Infraestrutura e deploy

Não há passo de build (nenhum bundler, transpilador ou minificador) — o que está em `src/html/` é
literalmente o que é servido ao navegador. Isso é consequência direta da filosofia "sem
dependências externas" (seção 1).

## 7.1 Desenvolvimento local

`src/python/servidor_https_local.py` — servidor HTTPS mínimo (`http.server` + `ssl`) com CORS
liberado (`Access-Control-Allow-Origin: *`), servindo a partir da raiz do repositório (`os.chdir
("../../")`) na porta 443, usando o certificado self-signed em
`src/resources/certificadoDigital/ultima.selfsigned.pem`. O IP de bind é hardcoded no script — precisa
ser ajustado manualmente para o IP da máquina de desenvolvimento.

Alternativa mais simples para desenvolvimento sem HTTPS: qualquer servidor estático a partir de
`src/html/` (ex: `python3 -m http.server`), já que não há passo de build.

## 7.2 Produção

`Dockerfile` — imagem baseada em `httpd:2.4` (Apache), copiando o conteúdo de `dist/v1.0b/` para
`/usr/local/apache2/htdocs/`.

`docker-compose.yml` — dois serviços:
- `ultima` — a imagem construída pelo `Dockerfile` acima.
- `haproxy` (imagem `haproxy:2.3`) — proxy reverso na frente do `ultima`, expondo as portas 80/443,
  com TLS terminado usando um certificado montado de fora do repositório
  (`../chaves_ultima/ultima_alfvcp.pem`).

`rotina_de_deploy.sh` — script de deploy manual: `git pull` → limpa `dist/v1.0b/` → copia
`src/html/*` para lá → `docker image build` → `docker-compose down && up -d`. `dist/v1.0b/` é,
portanto, o diretório **versionado por cópia** que efetivamente é servido em produção — mudanças em
`src/html/` só chegam à produção através desse script.

## 7.3 Bibliotecas de terceiros vendorizadas (`src/html/bibliotecas/`)

| Biblioteca | Versão | Usada por |
|---|---|---|
| D3.js | 4.13.0 | `VisualizacaoTreemap` (seção 5.1) |
| vis.js | 4.21.0 | `GrafoBases`, `GrafoIndexedDB`, `GrafoEquipe` (seção 6.3) — via global `window.vis` |
| jsPanel | 4.13.0 | `VisualizacaoJanelas` (seção 5.2) |
| JSONEditor | (não fixada no código lido) | `EditorJSON` (seção 6.3) |
| jsondiffpatch | (não fixada no código lido) | `VisualizadorDiferencasJSON` — via global `window.jsondiffpatch` (seção 6.3) |
| Font Awesome | 6.0.0 (Free) | ícones em toda a aplicação |

Nenhuma dessas é gerenciada por um arquivo de manifesto (`package.json` ou equivalente) — atualizar
uma biblioteca significa baixar os arquivos manualmente e substituir o conteúdo do diretório
correspondente.
