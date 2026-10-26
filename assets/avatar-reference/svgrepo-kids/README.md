# Kids Avatars — referências SVG Repo

Origem: https://www.svgrepo.com/collection/kids-avatars/

Esta pasta contém cópias dos SVGs originais da coleção enviada como referência
para o editor de personagens. Os arquivos mantêm o identificador público do
SVG Repo no nome, por exemplo `3852-boy.svg`.

- `sources.json` relaciona os 75 itens encontrados, as URLs de origem e o
  resultado de cada download.
- Um item pode estar marcado como indisponível se o servidor do SVG Repo
  retornar erro; o script de download reaproveita os arquivos já existentes.
- Os 74 SVGs completos são mantidos no repositório como fonte original, mas
  **não** são servidos em tempo de execução nem entram no cache offline.
- **14 ícones CC0 verificados** são reutilizados por extração de caminhos
  vetoriais em `assets/js/avatar-parts.js`. Veja `../../avatar-reference/component-map.json`
  e `../../../docs/avatar-components.md` para os índices e URLs exatos.
- Direitos e licenças pertencem aos respectivos autores. Consulte a licença
  exibida na página de cada ícone antes de redistribuí-lo ou reaproveitar seu
  desenho diretamente.

Para atualizar esta coleção:

```bash
node tools/download-kids-avatars.mjs
```

Os avatares combináveis reutilizam **as formas reais da coleção** para rosto,
cabelo e roupa. Apenas a parte inferior (pernas, shorts, calças e sapatos) é
desenhada em `assets/js/avatar.js`.
