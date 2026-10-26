/* Avatar composto de peças extraídas de SVGs CC0 da coleção Kids Avatars.
 * Rosto, cabelos e roupas: arquivos originais, compilados em avatar-parts.js.
 * Apenas pernas, shorts, calças e sapatos: geometria local deste módulo.
 * Mantém viewBox 210x340 para compatibilidade com as 47 ilustrações.
 */
(() => {
  'use strict';
  const parts = window.LivrinhoAvatarParts;
  if (!parts?.face || !parts.hair || !parts.outfit) {
    throw Error('O catálogo SVG original deve ser carregado antes do compositor de avatares.');
  }

  const hairStyles = [
    ['puffs', 'Maria-chiquinha'], ['short', 'Curtinho'], ['side', 'De lado'],
    ['long', 'Longo ondulado'], ['curly', 'Cacheado'], ['afro', 'Afro'],
    ['braids', 'Trancinhas'], ['ponytail', 'Rabos de cavalo'], ['cap', 'Boné'],
    ['bob', 'Chanel'], ['straight', 'Chanel loiro'], ['waves', 'Ondulado']
  ];
  const outfitStyles = [
    ['hoodie', 'Moletom'], ['tee', 'Camiseta'], ['dress', 'Regata estampada'],
    ['overalls', 'Regata'], ['jacket', 'Jaqueta'], ['jersey', 'Esportivo'],
    ['blouse', 'Blusa'], ['coat', 'Casaco']
  ];
  const bottomStyles = [['pants', 'Calça'], ['shorts', 'Shorts']];
  const hairColors = [
    ['#493a55', 'Castanho escuro'], ['#7b4c35', 'Castanho'],
    ['#c47b43', 'Ruivo'], ['#f5c35b', 'Loiro'],
    ['#303448', 'Preto'], ['#d38ec4', 'Rosa fantasia'],
    ['#65b8cc', 'Azul fantasia'], ['#8c6bd0', 'Roxo fantasia']
  ];
  const outfitColors = [
    ['#fa7195', 'Rosa'], ['#639de8', 'Azul'], ['#79bc8d', 'Verde'],
    ['#9c80df', 'Lilás'], ['#efb857', 'Amarelo'], ['#ed805d', 'Coral'],
    ['#5abdbb', 'Turquesa'], ['#707c9d', 'Grafite']
  ];
  const bottomColors = [
    ['#5879b9', 'Jeans azul'], ['#34465e', 'Marinho'],
    ['#dfaa7a', 'Caqui'], ['#fa7195', 'Rosa'],
    ['#79bc8d', 'Verde'], ['#8c6bd0', 'Roxo']
  ];
  const shoeColors = [
    ['#625a89', 'Uva'], ['#303448', 'Preto'],
    ['#ffffff', 'Branco'], ['#f3a24e', 'Laranja'],
    ['#639de8', 'Azul'], ['#fa7195', 'Rosa']
  ];

  function safeColor(color, fallback) {
    return /^#[0-9a-f]{6}$/i.test(color || '') ? color.toLowerCase() : fallback;
  }
  function shade(color, amount) {
    const goal = amount < 0 ? 0 : 255;
    const factor = Math.min(Math.abs(amount), 1);
    return '#' + [1, 3, 5].map((pos) =>
      Math.round(parseInt(color.slice(pos, pos + 2), 16) * (1 - factor) + goal * factor)
        .toString(16).padStart(2, '0')).join('');
  }

  function palette(settings) {
    const skin = safeColor(settings.skinColor, '#e9aa83');
    const hair = safeColor(settings.hairColor, '#493a55');
    const outfit = safeColor(settings.outfitColor, '#fa7195');
    return {
      SKIN: skin, SKIN_LIGHT: shade(skin, .15), SKIN_DARK: shade(skin, -.12), SKIN_DEEP: shade(skin, -.25),
      HAIR: hair, HAIR_LIGHT: shade(hair, .25), HAIR_DARK: shade(hair, -.16), HAIR_DEEP: shade(hair, -.3),
      OUTFIT: outfit, OUTFIT_LIGHT: shade(outfit, .25), OUTFIT_DARK: shade(outfit, -.13), OUTFIT_DEEP: shade(outfit, -.25)
    };
  }
  function tint(original, colors) {
    return original.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => colors[key] || '#000000');
  }

  // Apenas a parte inferior é desenhada para o aplicativo. A roupa superior
  // é integralmente formada pelos caminhos vetoriais dos SVGs do SVG Repo.
  function lowerBody(settings, skin) {
    const bottoms = safeColor(settings.bottomColor, '#5879b9');
    const shoes = safeColor(settings.shoeColor, '#625a89');
    const shorts = settings.bottomStyle === 'shorts';
    const legs = shorts
      ? `<path d="M74 260h29l-7 53H72Zm35 0h29l7 53h-25Z" fill="${skin}"/>`
      : '';
    const clothing = shorts
      ? `<path d="M63 230h84l6 47h-42l-7-18-7 18H57Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M65 267h29m24 0h30" stroke="${shade(bottoms, .24)}" stroke-width="4"/>`
      : `<path d="M64 229h82l7 83h-38l-10-52-9 52H58Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M105 261v-17" stroke="${shade(bottoms, -.17)}" stroke-width="3"/>`;
    return `<g data-layer="pernas-originais-do-app">
      <ellipse cx="105" cy="327" rx="74" ry="9" fill="#243f59" opacity=".13"/>
      ${legs}${clothing}
      <path d="M70 303h28v12H67Zm53 0h28l3 12h-31Z" fill="${shorts ? skin : shade(bottoms, -.08)}"/>
      <path d="M65 309h36l2 20H53q-4-15 12-20Zm58 0h36q16 3 14 20h-51Z" fill="${shoes}" stroke="${shade(shoes, -.14)}" stroke-width="2"/>
      <path d="M60 323h43m20 0h49" stroke="${shade(shoes, .38)}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  }

  function avatarBody(settings = {}) {
    const colors = palette(settings);
    const hair = parts.hair[settings.avatarStyle] || parts.hair.puffs;
    const outfit = parts.outfit[settings.outfitStyle] || parts.outfit.hoodie;
    const source = (filename) => filename.replace(/\.svg$/, '');
    return `${lowerBody(settings, colors.SKIN)}
      <g transform="translate(0 34) scale(0.452586)">
        <g data-layer="cabelo-atras" data-source="${source(hair.source)}">${tint(hair.back, colors)}</g>
        <g data-layer="rosto-original" data-source="${source(parts.face.source)}">${tint(parts.face.svg, colors)}</g>
        <g data-layer="roupa-original" data-source="${source(outfit.source)}">${tint(outfit.svg, colors)}</g>
        <g data-layer="cabelo-frente" data-source="${source(hair.source)}">${tint(hair.front, colors)}</g>
      </g>`;
  }

  function avatarSymbol(id, settings) {
    if (!/^[a-z]+$/.test(id)) throw Error('ID de símbolo SVG inválido');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar infantil personalizável">${avatarBody(settings)}</svg>`;
  }
  window.LivrinhoAvatar = { hairStyles, outfitStyles, bottomStyles, hairColors, outfitColors,
    bottomColors, shoeColors, avatarBody, avatarSymbol, avatarSVG };
})();
