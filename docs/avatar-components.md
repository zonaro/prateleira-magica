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
| Boné | [Boy #66804](https://www.svgrepo.com/svg/66804/boy) | `66804-boy.svg` |
| Chanel | [Girl #38251](https://www.svgrepo.com/svg/38251/girl) | `38251-girl.svg` |
| Chanel loiro | [Girl #3914](https://www.svgrepo.com/svg/3914/girl) | `3914-girl.svg` |
| Ondulado | [Girl #65066](https://www.svgrepo.com/svg/65066/girl) | `65066-girl.svg` |
| Moletom | [Boy #3852](https://www.svgrepo.com/svg/3852/boy) | `3852-boy.svg` |
| Camiseta | [Boy #12676](https://www.svgrepo.com/svg/12676/boy) | `12676-boy.svg` |
| Regata estampada | [Girl #3896](https://www.svgrepo.com/svg/3896/girl) | `3896-girl.svg` |
| Regata | [Girl #65066](https://www.svgrepo.com/svg/65066/girl) | `65066-girl.svg` |
| Jaqueta | [Boy #82178](https://www.svgrepo.com/svg/82178/boy) | `82178-boy.svg` |
| Esportivo | [Boy #66804](https://www.svgrepo.com/svg/66804/boy) | `66804-boy.svg` |
| Blusa | [Girl #38251](https://www.svgrepo.com/svg/38251/girl) | `38251-girl.svg` |
| Casaco | [Boy #38284](https://www.svgrepo.com/svg/38284/boy) | `38284-boy.svg` |

## Como a extração funciona

1. `assets/avatar-reference/component-map.json` associa os nomes usados na interface a cada arquivo SVG original, aos índices das formas e às cores que devem ser personalizáveis. Os índices referenciam a ordem de `ElementTree.iter()` no arquivo original **congelado no repositório**.
2. `python3 tools/extract-avatar-components.py` lê esses SVGs e copia as primitivas (curvas, polígonos etc.) para `assets/js/avatar-parts.js`. O arquivo gerado contém o caminho e o identificador de origem de cada componente. Não interpola nem recalcula nenhuma geometria dos cabelos ou das roupas.
3. `assets/js/avatar.js` compõe as peças numa proporção compatível com os símbolos das 47 ilustrações do projeto (`viewBox="0 0 210 340"`), substituindo apenas os tokens de cor. Só a parte das pernas para baixo é desenho próprio.
4. `assets/js/preferences.js` salva/restaura todos os campos, incluindo `bottomStyle`, `bottomColor` e `shoeColor` no JSON incorporado ao SVG de backup.

## Compatibilidade

- As IDs antigas de `avatarStyle` e `outfitStyle` continuam válidas, mas agora representam as peças originais. Um backup antigo importa normalmente e ganha cor das calças e dos sapatos padrão.
- Os novos penteados e roupas são adicionados sem remover as opções históricas.
- Os 74 SVGs completos são preservados para reconstrução auditável, mas somente o pacote pequeno `avatar-parts.js` precisa ser carregado no app ou no PWA offline.
- Alterações no mapa requerem regenerar o JS, aumentar a versão de cache do Service Worker, rodar os testes e conferir as prévias produzidas por `node tools/preview-avatar-combinations.mjs`.
