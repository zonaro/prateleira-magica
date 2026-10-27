# Componentes de avatar — provenientes dos SVGs reais

O aplicativo **não redesenha** os cabelos, roupas ou rosto da coleção de referência. A peça vetorial é copiada de um arquivo `.svg` original previamente baixado, incluindo seu `d` de `<path>`, e apenas as cores principais são convertidas em marcadores (`{{HAIR}}`, `{{OUTFIT}}`, `{{SKIN}}` e variações de luz/sombra).

Origem: [SVG Repo — Kids Avatars](https://www.svgrepo.com/collection/kids-avatars/).

## Fontes reais dos componentes

As páginas individuais relacionadas abaixo foram consultadas e indicam **licença CC0**. Todos os SVGs citados são mantidos em `assets/avatar-reference/svgrepo-kids/`.

| Componente | Origem | Arquivo |
| --- | --- | --- |
| Rosto-base | [Girl #3914](https://www.svgrepo.com/svg/3914/girl) | `3914-girl.svg` |
| Maria-chiquinha | [Girl #31423](https://www.svgrepo.com/svg/31423/girl) | `31423-girl.svg` |
| Curto | [Boy #12676](https://www.svgrepo.com/svg/12676/boy) | `12676-boy.svg` |
| De lado | [Boy #31150](https://www.svgrepo.com/svg/31150/boy) | `31150-boy.svg` |
| Longo | [Girl #31132](https://www.svgrepo.com/svg/31132/girl) | `31132-girl.svg` |
| Cacheado | [Boy #38284](https://www.svgrepo.com/svg/38284/boy) | `38284-boy.svg` |
| Afro | [Girl #38246](https://www.svgrepo.com/svg/38246/girl) | `38246-girl.svg` |
| Trancinhas | [Girl #166241](https://www.svgrepo.com/svg/166241/girl) | `166241-girl.svg` |
| Rabos de cavalo | [Girl #3896](https://www.svgrepo.com/svg/3896/girl) | `3896-girl.svg` |
| Boné (acessório sobre o penteado) | [Boy #66804](https://www.svgrepo.com/svg/66804/boy) | `66804-boy.svg` |
| Chanel | [Girl #38251](https://www.svgrepo.com/svg/38251/girl) | `38251-girl.svg` |
| Chanel loiro | [Girl #3914](https://www.svgrepo.com/svg/3914/girl) | `3914-girl.svg` |
| Ondulado | [Girl #65066](https://www.svgrepo.com/svg/65066/girl) | `65066-girl.svg` |
| Flor lateral | [Girl #31122](https://www.svgrepo.com/svg/31122/girl) | `31122-girl.svg` |
| Moicano | [Boy #38239](https://www.svgrepo.com/svg/38239/boy) | `38239-boy.svg` |
| Topete lateral | [Boy #38252](https://www.svgrepo.com/svg/38252/boy) | `38252-boy.svg` |
| Laços laterais | [Girl #38256](https://www.svgrepo.com/svg/38256/girl) | `38256-girl.svg` |
| Topete alto | [Boy #38261](https://www.svgrepo.com/svg/38261/boy) | `38261-boy.svg` |
| Chanel com flor | [Girl #42225](https://www.svgrepo.com/svg/42225/girl) | `42225-girl.svg` |
| Longo com flor | [Girl #66793](https://www.svgrepo.com/svg/66793/girl) | `66793-girl.svg` |
| Ondas médias | [Girl #66815](https://www.svgrepo.com/svg/66815/girl) | `66815-girl.svg` |
| Franja longa | [Girl #41010](https://www.svgrepo.com/svg/41010/girl) | `41010-girl.svg` |
| Cachos curtinhos | [Boy #3869](https://www.svgrepo.com/svg/3869/boy) | `3869-boy.svg` |
| Moletom | [Boy #3852](https://www.svgrepo.com/svg/3852/boy) | `3852-boy.svg` |
| Camiseta | [Boy #12676](https://www.svgrepo.com/svg/12676/boy) | `12676-boy.svg` |
| Regata estampada | [Girl #3896](https://www.svgrepo.com/svg/3896/girl) | `3896-girl.svg` |
| Regata | [Girl #65066](https://www.svgrepo.com/svg/65066/girl) | `65066-girl.svg` |
| Jaqueta | [Boy #82178](https://www.svgrepo.com/svg/82178/boy) | `82178-boy.svg` |
| Esportivo | [Boy #66804](https://www.svgrepo.com/svg/66804/boy) | `66804-boy.svg` |
| Blusa | [Girl #38251](https://www.svgrepo.com/svg/38251/girl) | `38251-girl.svg` |
| Casaco | [Boy #38284](https://www.svgrepo.com/svg/38284/boy) | `38284-boy.svg` |
| Regata básica | [Boy #132866](https://www.svgrepo.com/svg/132866/boy) | `132866-boy.svg` |
| Camiseta de treino | [Boy #132848](https://www.svgrepo.com/svg/132848/boy) | `132848-boy.svg` |
| Camisa social | [Boy #31130](https://www.svgrepo.com/svg/31130/boy) | `31130-boy.svg` |
| Jardineira divertida | [Boy #38239](https://www.svgrepo.com/svg/38239/boy) | `38239-boy.svg` |
| Blusa sem mangas | [Girl #38256](https://www.svgrepo.com/svg/38256/girl) | `38256-girl.svg` |
| Estampada de bolinhas | [Boy #38261](https://www.svgrepo.com/svg/38261/boy) | `38261-boy.svg` |
| Blusa com colar | [Girl #45972](https://www.svgrepo.com/svg/45972/girl) | `45972-girl.svg` |
| Camiseta de time | [Boy #66797](https://www.svgrepo.com/svg/66797/boy) | `66797-boy.svg` |
| Cardigã | [Girl #66829](https://www.svgrepo.com/svg/66829/girl) | `66829-girl.svg` |
| Polo | [Boy #83069](https://www.svgrepo.com/svg/83069/boy) | `83069-boy.svg` |

## Como a extração funciona

1. `assets/avatar-reference/component-map.json` associa os nomes usados na interface a cada arquivo SVG original, aos índices das formas e às cores que devem ser personalizáveis. Os índices referenciam a ordem de `ElementTree.iter()` no arquivo original **congelado no repositório**.
2. `python3 tools/extract-avatar-components.py` lê esses SVGs e copia as primitivas (curvas, polígonos etc.) para `assets/js/avatar-parts.js`. O arquivo gerado contém o caminho e o identificador de origem de cada componente. Não interpola nem recalcula nenhuma geometria dos cabelos ou das roupas.
3. `assets/js/avatar.js` compõe **25 opções de cabelo (incluindo Careca), 24 roupas e 11 acessórios** numa proporção compatível com os símbolos dos livros (`viewBox="0 0 210 340"`), substituindo apenas os tokens de cor. O boné não é mais um penteado: pode ser colocado sobre o cabelo. Só a parte das pernas para baixo e os acessórios adicionais têm desenho próprio, oferecendo calça, shorts ou saia e dois tênis espelhados.
4. `assets/js/preferences.js` salva/restaura todos os campos, incluindo `bottomStyle`, `bottomColor` e `shoeColor` no JSON incorporado ao SVG de backup. O editor fica em página dedicada (`personagem.html`), com prévia fixa durante a rolagem também em telas pequenas.

## Compatibilidade

- As IDs antigas de `avatarStyle` e `outfitStyle` continuam válidas, mas agora representam as peças originais. Um backup antigo importa normalmente e ganha cor das calças e dos sapatos padrão.
- Os novos penteados e roupas são adicionados sem remover as opções históricas.
- Perfis antigos que tinham `avatarStyle: "cap"` são migrados automaticamente para cabelo curto com o acessório `cap`, preservando o boné. A opção `bald` não produz nenhum caminho de cabelo.
- Os **73 personagens prontos** continuam usando a arte integral original, com pernas e sapatos compostos abaixo do tronco. `node tools/build-avatar-presets.mjs` extrai o conteúdo dos arquivos de referência para `assets/js/avatar-presets.js`, que é carregado antes do compositor, inclusive offline. O SVG completo pode ser exportado, importado e incorporado nas ilustrações dos livros sem depender de URLs de imagens externas.
- Ao mudar cabelo, roupa ou as cores da parte superior de um personagem pronto, o editor passa para a versão montável; ajustes na parte inferior e acessórios preservam sua arte original.
- Os 74 SVGs completos são preservados para reconstrução auditável, mas somente o pacote pequeno `avatar-parts.js` precisa ser carregado no app ou no PWA offline.
- Alterações no mapa requerem regenerar o JS; alterações nas fontes dos personagens prontos exigem reconstruir `avatar-presets.js`. Em ambos os casos, aumentar a versão de cache do Service Worker, rodar os testes e conferir as prévias produzidas por `node tools/preview-avatar-combinations.mjs`.

## Pelúcias da coleção Cute Animal Vectors

As pelúcias são um catálogo separado de **20 SVGs originais CC0** da coleção [Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/). Os arquivos completos, sem alteração de geometria ou cor, ficam em `assets/pets/`; `catalog.json` contém o link individual de cada animal.

O script `tools/build-pet-parts.mjs` copia literalmente o interior de cada SVG para `assets/js/pet-parts.js`. O compositor adiciona a pelúcia escolhida como um `<svg>` secundário com posição e tamanho ajustados ao lado da criança, sem modificar os caminhos do desenho. O contêiner usa `preserveAspectRatio="xMidYMax meet"` e reduz, somente na hora de renderizar, a margem inferior do `viewBox` de 22px para 3px (medidas relativas ao SVG de origem com base 512px). Assim, a base de todas as pelúcias fica na mesma linha dos tênis (y=331), com sombra de contato, sem alterar os vetores gerados ou os arquivos originais. Isso mantém a pelúcia dentro das ilustrações dos livros, da prévia do editor e dos SVGs de backup mesmo offline. A seleção é liberada após duas medalhas persistidas no perfil. A chave interna `petId` continua igual para preservar os backups e perfis anteriores.
