/* Avatar composto de peças extraídas de SVGs CC0 da coleção Kids Avatars.
 * Rosto, cabelos e roupas: arquivos originais, compilados em avatar-parts.js.
 * Apenas pernas, shorts, calças, saias e sapatos: geometria local deste módulo.
 * Mantém viewBox 210x340 para compatibilidade com as 47 ilustrações.
 */
(() => {
  'use strict';
  const parts = window.LivrinhoAvatarParts;
  const petParts = window.LivrinhoPetParts || {};
  if (!parts?.face || !parts.hair || !parts.outfit) {
    throw Error('O catálogo SVG original deve ser carregado antes do compositor de avatares.');
  }

  const hairStyles = [
    ['puffs', 'Maria-chiquinha'], ['short', 'Curtinho'], ['side', 'De lado'],
    ['long', 'Longo ondulado'], ['curly', 'Cacheado'], ['afro', 'Afro'],
    ['braids', 'Trancinhas'], ['ponytail', 'Rabos de cavalo'], ['ponytail_bow', 'Rabos com laços'],
    ['bob', 'Chanel'], ['straight', 'Chanel loiro'], ['waves', 'Ondulado'],
    ['flower_braids', 'Flor lateral'], ['mohawk', 'Moicano'], ['undercut', 'Topete lateral'],
    ['bow', 'Laços laterais'], ['quiff', 'Topete alto'], ['flower_bob', 'Chanel com flor'],
    ['flower_heart', 'Coração floral'], ['flower_long', 'Longo com flor'], ['medium_waves', 'Ondas médias'],
    ['side_sweep', 'Franja longa'], ['ringlets', 'Cachos curtinhos'], ['mullet', 'Mullets'], ['bald', 'Careca']
  ];
  const outfitStyles = [
    ['hoodie', 'Moletom'], ['hoodie_zip', 'Moletom zíper'], ['hoodie_patch', 'Moletom com patch'], ['hoodie_stripes', 'Moletom listrado'],
    ['tee', 'Camiseta'], ['tee_round', 'Camiseta redonda'], ['dress', 'Vestido'],
    ['overalls', 'Macacão'], ['jacket', 'Jaqueta'], ['jersey', 'Esportivo'], ['varsity', 'Camiseta universitária'],
    ['blouse', 'Blusa'], ['coat', 'Casaco'],
    ['tank', 'Regata básica'], ['sports_tee', 'Camiseta de treino'],
    ['collared', 'Camisa social'], ['shirt_stripes', 'Camisa listrada'], ['bib', 'Jardineira divertida'],
    ['sleeveless', 'Blusa sem mangas'], ['patterned', 'Estampada de bolinhas'],
    ['necklace', 'Blusa com colar'], ['team_tee', 'Camiseta de time'],
    ['cardigan', 'Cardigã'], ['polo', 'Polo']
  ];
  const bottomStyles = [['pants', 'Calça'], ['shorts', 'Shorts'], ['skirt', 'Saia']];
  const petStyles = Object.entries(petParts).map(([id, part]) => [id, part.name, part.source]);
  const accessoryStyles = [
    ['glasses_round', 'Óculos redondos', 'face'],
    ['glasses_square', 'Óculos quadrados', 'face'],
    ['glasses_sunglasses', 'Óculos escuros', 'face'],
    ['earrings_stud', 'Brincos', 'ears'],
    ['headphones', 'Fones de ouvido', 'hat'],
    ['cap', 'Boné', 'hat'],
    ['beanie', 'Touca', 'hat'],
    ['headband', 'Tiara', 'hat'],
    ['bow_hair', 'Laço', 'hair'],
    ['flower_clip', 'Flor de cabelo', 'hair'],
    ['star_clip', 'Estrela', 'hair']
  ];
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

  function plushViewBox(part) {
    // Os dados gerados têm 22px de margem em todos os lados (base 512px).
    // Remova somente 19px da margem inferior do contêiner, deixando 3px de
    // segurança antialias. Isso não altera os caminhos dos SVGs originais.
    const frame = part.viewBox.split(/\s+/).map(Number);
    const originalHeight = Number(part.originalViewBox.split(/\s+/)[3]);
    frame[3] = Math.round((frame[3] - 19 / 512 * originalHeight) * 100) / 100;
    return frame.join(' ');
  }

  // Apenas a parte inferior é desenhada para o aplicativo. A roupa superior
  // é integralmente formada pelos caminhos vetoriais dos SVGs do SVG Repo.
  function lowerBody(settings, skin) {
    const bottoms = safeColor(settings.bottomColor, '#5879b9');
    const shoes = safeColor(settings.shoeColor, '#625a89');
    const shorts = settings.bottomStyle === 'shorts';
    const skirt = settings.bottomStyle === 'skirt';
    const legs = shorts || skirt
      ? `<path d="M71 256h31l-6 57H72Zm39 0h31l-4 57h-25Z" fill="${skin}"/>`
      : '';
    const clothing = skirt
      ? `<path d="M68 228h74l16 53q-53 15-106 0Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M61 276q44 15 88 0" fill="none" stroke="${shade(bottoms, .23)}" stroke-width="3" stroke-linecap="round"/><path d="M72 236h66" stroke="${shade(bottoms, -.12)}" stroke-width="3"/>`
      : shorts
        ? `<path d="M63 230h84l6 47h-42l-7-18-7 18H57Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M65 267h29m24 0h30" stroke="${shade(bottoms, .24)}" stroke-width="4"/>`
        : `<path d="M64 229h82l7 83h-38l-10-52-9 52H58Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M105 261v-17" stroke="${shade(bottoms, -.17)}" stroke-width="3"/>`;
    // O MESMO tênis, espelhado em torno do eixo central x=105. Assim ambos
    // tocam a mesma linha de chão (y=331) e não ficam com pés desalinhados.
    const sneaker = `<path d="M22 4h17l4 9 5 8v6H0v-6C0 11 8 4 22 4Z" fill="${shoes}" stroke="${shade(shoes, -.17)}" stroke-width="2"/>
      <path d="M1 24h46" stroke="${shade(shoes, .55)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M17 15h18m-16 5h16" stroke="${shade(shoes, .32)}" stroke-width="2" stroke-linecap="round"/>`;
    return `<g data-layer="pernas-originais-do-app">
      <ellipse cx="105" cy="327" rx="74" ry="9" fill="#243f59" opacity=".13"/>
      ${legs}${clothing}
      <path d="M72 303h24v12H72Zm41 0h24v12h-24Z" fill="${shorts || skirt ? skin : shade(bottoms, -.08)}"/>
      <g data-layer="tenis-esquerdo" transform="translate(60 304)">${sneaker}</g>
      <g data-layer="tenis-direito" transform="translate(150 304) scale(-1 1)">${sneaker}</g>
    </g>`;
  }

  function avatarBody(settings = {}) {
    const colors = palette(settings);
    const hair = parts.hair[settings.avatarStyle] || parts.hair.puffs;
    const outfit = parts.outfit[settings.outfitStyle] || parts.outfit.hoodie;
    const source = (filename) => filename.replace(/\.svg$/, '');
    const pet = settings.petId && petParts[settings.petId];
    // Fundo e pés compartilham a linha de chão y=331. xMidYMax evita que
    // pelúcias de proporções diferentes flutuem dentro da caixa SVG.
    const plushShadow = pet ? '<ellipse data-layer="pelucia-sombra" cx="166" cy="328" rx="34" ry="5" fill="#243f59" opacity=".12"/>' : '';
    const companion = pet ? `<svg data-layer="pet-original" data-source="${pet.source}" x="117" y="227" width="90" height="104" viewBox="${plushViewBox(pet)}" preserveAspectRatio="xMidYMax meet">${pet.body}</svg>` : '';
    return `${plushShadow}${lowerBody(settings, colors.SKIN)}
      <g transform="translate(0 34) scale(0.452586)">
        <g data-layer="cabelo-atras" data-source="${source(hair.source)}">${tint(hair.back, colors)}</g>
        <g data-layer="rosto-original" data-source="${source(parts.face.source)}">${tint(parts.face.svg, colors)}</g>
        <g data-layer="roupa-original" data-source="${source(outfit.source)}">${tint(outfit.svg, colors)}</g>
        <g data-layer="cabelo-frente" data-source="${source(hair.source)}">${tint(hair.front, colors)}</g>
      </g>${companion}`;
  }

  function avatarSymbol(id, settings) {
    if (!/^[a-z]+$/.test(id)) throw Error('ID de símbolo SVG inválido');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings = {}) {
    if (settings.sourceSvg) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 464 464" role="img" aria-label="Avatar infantil">${avatarBody({ ...settings, avatarStyle: 'puffs', outfitStyle: 'tee', bottomStyle: 'pants', petId: null, accessories: [] }).replace(/<g[^>]*data-layer="pernas-originais-do-app"[\s\S]*?<\/g>/, '')}</svg>`.replace('viewBox="0 0 210 340"', 'viewBox="0 0 464 464"');
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar infantil personalizável">${avatarBody(settings)}</svg>`;
  }
  window.LivrinhoAvatar = { hairStyles, outfitStyles, bottomStyles, petStyles, accessoryStyles, hairColors, outfitColors,
    bottomColors, shoeColors, avatarBody, avatarSymbol, avatarSVG };
})();
