# Cute Animal Vectors — pets originais

Origem: [SVG Repo — Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/).

Esta pasta guarda os **20 arquivos SVG originais e sem alterações**, conforme baixados do SVG Repo. O arquivo `catalog.json` relaciona os nomes, arquivos e as URLs oficiais. As 20 páginas individuais consultadas pelo downloader indicam licença **CC0**.

- Para atualizar: `node tools/download-cute-animal-pets.mjs` (requer internet).
- Para regenerar a cópia de formas vetoriais usada no compositor: `node tools/build-pet-parts.mjs`.
- Para validar que a cópia gerada corresponde fielmente aos SVGs: `node tools/build-pet-parts.mjs --check`.

O código do app **não recolore nem redesenha** esses pets. O compositor apenas posiciona as formas SVG originais ao lado do avatar. O catálogo inteiro também é salvo offline pelo Service Worker.
