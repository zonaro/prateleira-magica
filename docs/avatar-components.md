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
| Lateral esquerdo (sem flor) | [Girl #31122](https://www.svgrepo.com/svg/31122/girl) | `31122-girl.svg` |
| Moicano | [Boy #38239](https://www.svgrepo.com/svg/38239/boy) | `38239-boy.svg` |
| Topete lateral | [Boy #38252](https://www.svgrepo.com/svg/38252/boy) | `38252-boy.svg` |
| Laços laterais | [Girl #38256](https://www.svgrepo.com/svg/38256/girl) | `38256-girl.svg` |
| Topete alto | [Boy #38261](https://www.svgrepo.com/svg/38261/boy) | `38261-boy.svg` |
| Chanel arredondado (sem flor) | [Girl #42225](https://www.svgrepo.com/svg/42225/girl) | `42225-girl.svg` |
| Longo liso (sem flor) | [Girl #66793](https://www.svgrepo.com/svg/66793/girl) | `66793-girl.svg` |
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
3. `assets/js/avatar.js` compõe **25 opções de cabelo (incluindo Careca), 24 roupas, 19 acessórios e 12 brinquedos** numa proporção compatível com os símbolos dos livros (`viewBox="0 0 210 340"`), substituindo apenas os tokens de cor. O boné é um acessório ampliado; a boina especial exibe a inicial do nome; tapa-olho, kitsune, máscara de herói e óculos compartilham o espaço do rosto. A ordem fixa das camadas desenha tiara/chapéu antes de flor/laço, independentemente da ordem de seleção. Os quatro penteados antes chamados “com flor” mantêm apenas os caminhos capilares do SVG original; a flor pode ser colocada novamente como acessório de qualquer cor. Duas variações laterais são espelhadas para não oferecer dois penteados iguais. As listras nos moletons e camisas são camadas próprias e os deslocamentos de 24px (camiseta de time) e 18px (cardigã) compensam o centro da arte vetorial original.
4. `assets/js/preferences.js` salva/restaura `bottomStyle`, `bottomColor`, `footwearStyle`, `sockPattern`, `shoeColor`, `accessories`, `accessoryColor`, `toys` e `toyColor` no JSON incorporado ao SVG de backup. O compositor oferece cinco partes inferiores (incluindo saia longa e fralda) e cinco calçados (incluindo patins, meias de três estampas e pés descalços). A boina de encanador e os patins somente são mantidos em perfis com três medalhas; o skate requer quatro, inclusive ao importar um backup. O editor fica em **Perfil → Personalizar** (`perfil.html#personalizar`), com prévia fixa durante a rolagem também em telas pequenas. Itens bloqueados usam `.avatar-style.locked` com opacidade reduzida e escala de cinza, como as pelúcias; a miniatura continua mostrando o item sem habilitar sua seleção.
5. Os brinquedos estão agrupados em `floor` (skate), `hand` (bolas, peteca, peças de xadrez), `back` (asas) e `costume` (fantasia de fantasma). No máximo um de cada grupo pode ser selecionado. A composição monta asas e capas antes do corpo, flores após tiaras, itens na mão após o tronco, fantasia de fantasma por cima do avatar inteiro e skate por último, embaixo dos pés. O lençol branco tem dois recortes vetoriais transparentes para os olhos e recebe detalhes na cor escolhida para o brinquedo. Quando há skate, o avatar completo é elevado 14 unidades e a sombra se desloca para as rodas. Os itens utilizam `TOY`, `TOY_LIGHT`, `TOY_DARK`, `TOY_DEEP`, independentemente de `ACCESSORY`/`OUTFIT`, e não mudam as camadas originais dos personagens prontos.
6. `assets/avatar-reference/preset-layer-map.json` identifica rosto, cabelo de trás, cabelo da frente e roupa de cada personagem pronto, sem alterar a arte SVG de origem. `tools/build-avatar-presets.mjs` gera camadas e trechos na ordem original para permitir a substituição **apenas da peça escolhida**. `tools/analyze-avatar-layers.mjs` pode produzir um mapa inicial para novas fontes (requer `sharp` no ambiente de desenvolvimento), que deve passar por revisão visual.

## Compatibilidade

- As IDs antigas de `avatarStyle` e `outfitStyle` continuam válidas, mas agora representam as peças originais. Um backup antigo importa normalmente e ganha cor das calças e dos sapatos padrão.
- Os novos penteados e roupas são adicionados sem remover as opções históricas.
- Os IDs dos quatro cabelos antes adornados, das roupas renomeadas e da pelúcia `cute-animals` continuam idênticos para manter a compatibilidade; a pelúcia aparece como **Zebra** na interface.
- Perfis antigos que tinham `avatarStyle: "cap"` são migrados automaticamente para cabelo curto com o acessório `cap`, preservando o boné. A opção `bald` não produz nenhum caminho de cabelo.
- Os **73 personagens prontos** continuam usando a arte integral original, com pernas e sapatos compostos abaixo do tronco. `node tools/build-avatar-presets.mjs` extrai o conteúdo dos arquivos de referência para `assets/js/avatar-presets.js`, que é carregado antes do compositor, inclusive offline. O SVG completo pode ser exportado, importado e incorporado nas ilustrações dos livros sem depender de URLs de imagens externas.
- Ao escolher um personagem pronto, o perfil armazena `sourceSvg` e `presetEdits: []`. Cada mudança adiciona **somente o campo editado** a `presetEdits`: trocar o cabelo mantém a roupa original; trocar a roupa mantém o cabelo original; mudar calça, sapato ou acessórios também preserva o tronco original. Trocar o penteado requer compor uma nova base de rosto para eliminar completamente o cabelo antigo. O desenho completo permanece intacto enquanto não houver edições da parte superior.
- O perfil, o histórico de desfazer e o backup SVG preservam `sourceSvg` e `presetEdits`, inclusive após sucessivas mudanças ou importação de backups antigos.
- Os SVGs completos são preservados para reconstrução auditável. `avatar-parts.js` e `avatar-presets.js` são pré-carregados no app/PWA offline; a geração do segundo mantém as curvas e cores originais.
- Alterações no mapa requerem regenerar o JS; alterações nas fontes dos personagens prontos exigem reconstruir `avatar-presets.js`. Em ambos os casos, aumentar a versão de cache do Service Worker, rodar os testes e conferir as prévias produzidas por `node tools/preview-avatar-combinations.mjs`.

## Pelúcias da coleção Cute Animal Vectors

As pelúcias são um catálogo separado de **20 SVGs originais CC0** da coleção [Cute Animal Vectors](https://www.svgrepo.com/collection/cute-animal-vectors/). Os arquivos completos, sem alteração de geometria ou cor, ficam em `assets/pets/`; `catalog.json` contém o link individual de cada animal.

O script `tools/build-pet-parts.mjs` copia literalmente o interior de cada SVG para `assets/js/pet-parts.js`. O compositor adiciona a pelúcia escolhida como um `<svg>` secundário com posição e tamanho ajustados ao lado da criança, sem modificar os caminhos do desenho. O contêiner usa `preserveAspectRatio="xMidYMax meet"` e reduz, somente na hora de renderizar, a margem inferior do `viewBox` de 22px para 3px (medidas relativas ao SVG de origem com base 512px). Assim, a base de todas as pelúcias fica na mesma linha dos tênis (y=331), com sombra de contato, sem alterar os vetores gerados ou os arquivos originais. Isso mantém a pelúcia dentro das ilustrações dos livros, da prévia do editor e dos SVGs de backup mesmo offline. A seleção é liberada após duas medalhas persistidas no perfil. A chave interna `petId` continua igual para preservar os backups e perfis anteriores.
