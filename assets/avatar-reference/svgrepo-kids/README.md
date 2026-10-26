# Kids Avatars — referências SVG Repo

Origem: https://www.svgrepo.com/collection/kids-avatars/

Esta pasta contém cópias dos SVGs originais da coleção enviada como referência
para o editor de personagens. Os arquivos mantêm o identificador público do
SVG Repo no nome, por exemplo `3852-boy.svg`.

- `sources.json` relaciona os 75 itens encontrados, as URLs de origem e o
  resultado de cada download.
- Um item pode estar marcado como indisponível se o servidor do SVG Repo
  retornar erro; o script de download reaproveita os arquivos já existentes.
- Os SVGs são material de referência, **não** fazem parte do app executado nem
  do pacote distribuído no GitHub Pages.
- Direitos e licenças pertencem aos respectivos autores. Consulte a licença
  exibida na página de cada ícone antes de redistribuí-lo ou reaproveitar seu
  desenho diretamente.

Para atualizar esta coleção:

```bash
node tools/download-kids-avatars.mjs
```

Os avatares combináveis da Prateleira Mágica são desenhos SVG próprios,
implementados em `assets/js/avatar.js` e inspirados no estilo visual da coleção.
