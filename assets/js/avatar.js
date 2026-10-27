/* Avatar composto de peças extraídas de SVGs CC0 da coleção Kids Avatars.
 * Rosto, cabelos e roupas: arquivos originais, compilados em avatar-parts.js.
 * Apenas pernas, shorts, calças, saias e sapatos: geometria local deste módulo.
 * Mantém viewBox 210x340 para compatibilidade com as 47 ilustrações.
 */
(() => {
  'use strict';
  const parts = window.LivrinhoAvatarParts;
  const presetParts = window.LivrinhoAvatarPresetParts || {};
  const petParts = window.LivrinhoPetParts || {};
  if (!parts?.face || !parts.hair || !parts.outfit) {
    throw Error('O catálogo SVG original deve ser carregado antes do compositor de avatares.');
  }

  const hairStyles = [
    ['puffs', 'Maria-chiquinha'], ['short', 'Curtinho'], ['side', 'De lado'],
    ['long', 'Longo ondulado'], ['curly', 'Cacheado'], ['afro', 'Afro'],
    ['braids', 'Trancinhas'], ['ponytail', 'Rabos de cavalo'], ['ponytail_bow', 'Rabos com laços'],
    ['bob', 'Chanel'], ['straight', 'Chanel loiro'], ['waves', 'Ondulado'],
    ['flower_braids', 'Lateral esquerdo'], ['mohawk', 'Moicano'], ['undercut', 'Topete lateral'],
    ['bow', 'Laços laterais'], ['quiff', 'Topete alto'], ['flower_bob', 'Chanel arredondado'],
    ['flower_heart', 'Lateral direito'], ['flower_long', 'Longo liso'], ['medium_waves', 'Ondas médias'],
    ['side_sweep', 'Franja longa'], ['ringlets', 'Cachos curtinhos'], ['mullet', 'Mullets'], ['bald', 'Careca']
  ];
  const outfitStyles = [
    ['hoodie', 'Moletom com capuz'], ['hoodie_zip', 'Moletom'], ['hoodie_patch', 'Moletom com zíper'], ['hoodie_stripes', 'Moletom listrado'],
    ['tee', 'Camiseta'], ['tee_round', 'Camiseta redonda'], ['dress', 'Vestido'],
    ['overalls', 'Macacão'], ['jacket', 'Jaqueta'], ['jersey', 'Esportivo'], ['varsity', 'Camiseta universitária'],
    ['blouse', 'Blusa'], ['coat', 'Casaco'],
    ['tank', 'Regata básica'], ['sports_tee', 'Camiseta de treino'],
    ['collared', 'Camisa social'], ['shirt_stripes', 'Camisa listrada'], ['bib', 'Regata com lantejoula'],
    ['sleeveless', 'Blusa sem mangas'], ['patterned', 'Estampada de bolinhas'],
    ['necklace', 'Blusa com broche'], ['team_tee', 'Camiseta de time'],
    ['cardigan', 'Cardigã'], ['polo', 'Polo']
  ];
  const bottomStyles = [['pants', 'Calça'], ['shorts', 'Shorts'], ['skirt', 'Saia'],
    ['long_skirt', 'Saia longa'], ['diaper', 'Fralda']];
  const footwearStyles = [['sneakers', 'Tênis'], ['flipflops', 'Chinelo'],
    ['socks', 'De meias'], ['barefoot', 'Descalço']];
  const sockPatterns = [['plain', 'Lisas'], ['stripes', 'Listradas'], ['dots', 'De bolinhas']];
  const petStyles = Object.entries(petParts).map(([id, part]) => [id, part.name, part.source]);
  const accessoryStyles = [
    ['glasses_round', 'Óculos redondos', 'face'],
    ['glasses_square', 'Óculos quadrados', 'face'],
    ['glasses_sunglasses', 'Óculos escuros', 'face'],
    ['eye_patch', 'Tapa-olho', 'face'],
    ['earrings_stud', 'Brincos', 'ears'],
    ['headphones', 'Fones de ouvido', 'hat'],
    ['cap', 'Boné', 'hat'],
    ['plumber_beret', 'Boina de encanador (3 medalhas)', 'hat'],
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
  const accessoryColors = [
    ['#fa7195', 'Rosa'], ['#639de8', 'Azul'], ['#79bc8d', 'Verde'],
    ['#9c80df', 'Lilás'], ['#efb857', 'Amarelo'], ['#ed805d', 'Vermelho coral'],
    ['#303448', 'Preto'], ['#ffffff', 'Branco']
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
    const accessory = safeColor(settings.accessoryColor, '#fa7195');
    return {
      SKIN: skin, SKIN_LIGHT: shade(skin, .15), SKIN_DARK: shade(skin, -.12), SKIN_DEEP: shade(skin, -.25),
      HAIR: hair, HAIR_LIGHT: shade(hair, .25), HAIR_DARK: shade(hair, -.16), HAIR_DEEP: shade(hair, -.3),
      OUTFIT: outfit, OUTFIT_LIGHT: shade(outfit, .25), OUTFIT_DARK: shade(outfit, -.13), OUTFIT_DEEP: shade(outfit, -.25),
      ACCESSORY: accessory, ACCESSORY_LIGHT: shade(accessory, .25),
      ACCESSORY_DARK: shade(accessory, -.2), ACCESSORY_DEEP: shade(accessory, -.38)
    };
  }
  function tint(original, colors) {
    return original.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => colors[key] || '#000000');
  }
  function outfitSVG(style, outfit, colors) {
    const offset = style === 'team_tee' ? -24 : style === 'cardigan' ? 18 : 0;
    const stripes = style === 'shirt_stripes'
      ? `<g data-detail="listras-da-camisa" stroke="${colors.OUTFIT_DARK}" stroke-width="9" stroke-linecap="round" opacity=".75">
          <path d="M170 377h126M165 401h136M161 425h144M157 449h150"/></g>`
      : style === 'hoodie_stripes'
        ? `<g data-detail="listras-do-moletom" stroke="${colors.OUTFIT_LIGHT}" stroke-width="10" stroke-linecap="round">
            <path d="M159 377h146M155 405h151M150 433h159"/></g>`
        : '';
    const drawing = `${tint(outfit.svg, colors)}${stripes}`;
    return offset ? `<g data-align="${style}" transform="translate(${offset} 0)">${drawing}</g>` : drawing;
  }
  function recolorOriginal(svg, targetColor, referenceColor, skinOnly = false) {
    const reference = safeColor(referenceColor, '#e9aa83');
    const target = safeColor(targetColor, reference);
    const channels = (value) => [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));
    const sourceChannels = channels(reference);
    const sourceLight = sourceChannels.reduce((sum, value) => sum + value, 0) / 3;
    return svg.replace(/(fill:\s*)#([0-9a-f]{6})/gi, (match, prefix, original) => {
      const values = channels(`#${original}`);
      const distance = Math.sqrt(values.reduce((sum, value, i) => sum + (value - sourceChannels[i]) ** 2, 0));
      if (skinOnly && distance > 96) return match; // olhos, boca e detalhes permanecem
      const lightness = values.reduce((sum, value) => sum + value, 0) / 3;
      const shift = Math.max(-.35, Math.min(.35, (lightness - sourceLight) / 255));
      return `${prefix}${shade(target, shift)}`;
    });
  }

  // Acessórios independentes do penteado, no mesmo plano de coordenadas
  // 464x464 dos componentes originais (olhos em x=176/288, y=184).
  function accessoriesSVG(settings, colors) {
    const selected = Array.isArray(settings.accessories) ? settings.accessories : [];
    const ink = colors.ACCESSORY_DARK;
    const decoration = colors.ACCESSORY;
    const firstLetter = String(settings.name || 'A').trim().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR').match(/[A-Z]/)?.[0] || 'A';
    const drawings = {
      glasses_round: `<g fill="none" stroke="${ink}" stroke-width="9"><circle cx="176" cy="183" r="31"/><circle cx="288" cy="183" r="31"/><path d="M207 179q25-15 50 0M145 178h-25m199 0h25"/></g>`,
      glasses_square: `<g fill="none" stroke="${ink}" stroke-width="9" stroke-linejoin="round"><rect x="143" y="150" width="67" height="65" rx="10"/><rect x="254" y="150" width="67" height="65" rx="10"/><path d="M210 178q22-12 44 0M143 178h-23m201 0h23"/></g>`,
      glasses_sunglasses: `<g fill="${colors.ACCESSORY_DEEP}" fill-opacity=".86" stroke="${ink}" stroke-width="8"><rect x="142" y="152" width="68" height="62" rx="15"/><rect x="254" y="152" width="68" height="62" rx="15"/><path d="M210 178q22-12 44 0M142 178h-22m202 0h22" fill="none"/></g>`,
      eye_patch: `<path d="M110 175Q232 143 356 175" fill="none" stroke="${ink}" stroke-width="9"/><path d="M138 155q38-13 76 1l-7 53q-30 25-56-3Z" fill="${decoration}" stroke="${ink}" stroke-width="6"/>`,
      earrings_stud: `<g fill="${decoration}" stroke="${ink}" stroke-width="4"><circle cx="119" cy="226" r="11"/><circle cx="345" cy="226" r="11"/></g>`,
      headphones: `<path d="M78 184V145C78 45 137 6 232 6s154 39 154 139v39" fill="none" stroke="${ink}" stroke-width="19"/><rect x="61" y="149" width="49" height="91" rx="22" fill="${decoration}" stroke="${ink}" stroke-width="7"/><rect x="354" y="149" width="49" height="91" rx="22" fill="${decoration}" stroke="${ink}" stroke-width="7"/>`,
      // Boné ampliado para cobrir penteados volumosos, sem perder a aba SVG original.
      cap: `<g transform="translate(232 150) scale(1.2) translate(-232 -150)">${tint(parts.hair.cap?.front || '',
        { ...colors, HAIR: decoration, HAIR_DARK: colors.ACCESSORY_DARK,
          HAIR_DEEP: colors.ACCESSORY_DEEP, HAIR_LIGHT: colors.ACCESSORY_LIGHT })}</g>`,
      plumber_beret: `<g data-layer="boina-de-encanador"><path d="M84 133C84 58 131 11 228 11c91 0 151 46 151 122v19H84Z" fill="${decoration}" stroke="${ink}" stroke-width="8"/><path d="M87 127q135-30 291 0v38q-144 20-291 0Z" fill="${colors.ACCESSORY_LIGHT}" stroke="${ink}" stroke-width="6"/><path d="M107 152q100 25 261 0l-22 34q-113 23-226-4Z" fill="${colors.ACCESSORY_DARK}"/><circle cx="233" cy="95" r="49" fill="#fffdf7" stroke="${ink}" stroke-width="7"/><text x="233" y="115" font-family="system-ui,sans-serif" font-size="57" font-weight="900" text-anchor="middle" fill="${ink}">${firstLetter}</text></g>`,
      beanie: `<path d="M93 151V123C93 41 145 6 232 6S371 41 371 123v28Z" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="7"/><rect x="87" y="130" width="290" height="39" rx="15" fill="${colors.ACCESSORY_LIGHT}" stroke="${colors.ACCESSORY_DARK}" stroke-width="6"/><circle cx="232" cy="7" r="16" fill="${colors.ACCESSORY_LIGHT}"/>`,
      headband: `<path d="M109 122Q125 25 232 25T355 122" fill="none" stroke="${decoration}" stroke-width="22" stroke-linecap="round"/>`,
      bow_hair: `<g transform="translate(342 85)" stroke="${colors.ACCESSORY_DARK}" stroke-width="5"><path d="M0 0Q-85-59-62 23L0 10Q75 66 73-25Z" fill="${decoration}"/><circle cx="0" cy="6" r="17" fill="${colors.ACCESSORY_LIGHT}"/></g>`,
      flower_clip: `<g transform="translate(349 105)" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="3"><circle cy="-20" r="16"/><circle cx="19" cy="-7" r="16"/><circle cx="12" cy="16" r="16"/><circle cx="-12" cy="16" r="16"/><circle cx="-19" cy="-7" r="16"/><circle r="12" fill="${colors.ACCESSORY_LIGHT}" stroke="none"/></g>`,
      star_clip: `<path d="M350 68l13 27 30 4-22 21 5 30-26-14-27 14 5-30-22-21 31-4Z" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="5" stroke-linejoin="round"/>`
    };
    return selected.filter((key) => Object.hasOwn(drawings, key))
      .map((key) => `<g data-accessory="${key}">${drawings[key]}</g>`).join('');
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
    const longSkirt = settings.bottomStyle === 'long_skirt';
    const diaper = settings.bottomStyle === 'diaper';
    const legs = shorts || skirt || diaper
      ? `<path d="M71 256h31l-6 57H72Zm39 0h31l-4 57h-25Z" fill="${skin}"/>`
      : '';
    const clothing = diaper
      ? `<path d="M62 232h86l-6 42q-15 10-35-6-20 16-39 6Z" fill="${bottoms}" stroke="${shade(bottoms, -.18)}" stroke-width="2"/>
         <path d="M65 236h80l-4 17H69Z" fill="${shade(bottoms, .45)}"/>
         <path d="M70 263l14 4m51-4-14 4" stroke="${shade(bottoms, .65)}" stroke-width="6" stroke-linecap="round"/>`
      : longSkirt
        ? `<path d="M72 227h68l24 85q-58 15-118 0Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/>
           <path d="M59 306q47 12 92 0M81 237l-15 60m60-60 17 60" stroke="${shade(bottoms, .22)}" stroke-width="3" fill="none"/>`
      : skirt
      ? `<path d="M68 228h74l16 53q-53 15-106 0Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M61 276q44 15 88 0" fill="none" stroke="${shade(bottoms, .23)}" stroke-width="3" stroke-linecap="round"/><path d="M72 236h66" stroke="${shade(bottoms, -.12)}" stroke-width="3"/>`
      : shorts
        ? `<path d="M63 230h84l6 47h-42l-7-18-7 18H57Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M65 267h29m24 0h30" stroke="${shade(bottoms, .24)}" stroke-width="4"/>`
        : `<path d="M64 229h82l7 83h-38l-10-52-9 52H58Z" fill="${bottoms}" stroke="${shade(bottoms, -.14)}" stroke-width="2"/><path d="M105 261v-17" stroke="${shade(bottoms, -.17)}" stroke-width="3"/>`;
    // O MESMO tênis, espelhado em torno do eixo central x=105. Assim ambos
    // tocam a mesma linha de chão (y=331) e não ficam com pés desalinhados.
    const sneaker = `<path d="M22 4h17l4 9 5 8v6H0v-6C0 11 8 4 22 4Z" fill="${shoes}" stroke="${shade(shoes, -.17)}" stroke-width="2"/>
      <path d="M1 24h46" stroke="${shade(shoes, .55)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M17 15h18m-16 5h16" stroke="${shade(shoes, .32)}" stroke-width="2" stroke-linecap="round"/>`;
    const barefoot = `<path d="M17 6h20q3 8 8 12 5 5 2 11H0v-6q1-8 17-17Z" fill="${skin}" stroke="${shade(skin, -.2)}" stroke-width="2"/>
      <path d="M11 23v4m7-5v5m7-5v5m7-5v5" stroke="${shade(skin, -.22)}" stroke-width="1.5" stroke-linecap="round"/>`;
    const flipflop = `${barefoot}<path d="M1 28h46" stroke="${shoes}" stroke-width="6" stroke-linecap="round"/>
      <path d="M24 18 13 24m11-6 11 6" fill="none" stroke="${shade(shoes, -.15)}" stroke-width="5" stroke-linecap="round"/>`;
    const socks = `<path d="M21 4h17l4 12 5 6v6H0v-6Q3 10 21 4Z" fill="${shoes}" stroke="${shade(shoes, -.2)}" stroke-width="2"/>
      <path d="M1 25h45" stroke="${shade(shoes, .4)}" stroke-width="4"/>`;
    const sockPattern = settings.sockPattern === 'stripes'
      ? `<path d="M15 13h25M9 20h35" stroke="${shade(shoes, .6)}" stroke-width="3.5"/>`
      : settings.sockPattern === 'dots'
        ? `<g fill="${shade(shoes, .65)}"><circle cx="22" cy="13" r="3"/><circle cx="34" cy="19" r="3"/><circle cx="13" cy="21" r="3"/></g>` : '';
    const footwear = settings.footwearStyle === 'flipflops' ? flipflop
      : settings.footwearStyle === 'barefoot' ? barefoot
        : settings.footwearStyle === 'socks' ? socks + sockPattern : sneaker;
    return `<g data-layer="pernas-originais-do-app">
      <ellipse cx="105" cy="327" rx="74" ry="9" fill="#243f59" opacity=".13"/>
      ${legs}${clothing}
      <path d="M72 303h24v12H72Zm41 0h24v12h-24Z" fill="${shorts || skirt || diaper || settings.footwearStyle === 'barefoot' || settings.footwearStyle === 'flipflops' ? skin : shade(bottoms, -.08)}"/>
      <g data-layer="tenis-esquerdo" data-footwear="${settings.footwearStyle || 'sneakers'}" transform="translate(60 304)">${footwear}</g>
      <g data-layer="tenis-direito" data-footwear="${settings.footwearStyle || 'sneakers'}" transform="translate(150 304) scale(-1 1)">${footwear}</g>
    </g>`;
  }

  function avatarBody(settings = {}) {
    const colors = palette(settings);
    const hair = settings.avatarStyle === 'bald'
      ? { source: '', back: '<path d="M120 161v-28c0-57 46-89 112-89s112 32 112 89v28Z" fill="{{SKIN_LIGHT}}"/>', front: '' }
      : parts.hair[settings.avatarStyle] || parts.hair.puffs;
    const hairGeometry = (markup) => settings.avatarStyle === 'flower_heart'
      ? `<g transform="translate(464 0) scale(-1 1)">${markup}</g>` : markup;
    const outfit = parts.outfit[settings.outfitStyle] || parts.outfit.hoodie;
    const source = (filename) => (filename || '').replace(/\.svg$/, '');
    const pet = settings.petId && petParts[settings.petId];
    // Fundo e pés compartilham a linha de chão y=331. xMidYMax evita que
    // pelúcias de proporções diferentes flutuem dentro da caixa SVG.
    const plushShadow = pet ? '<ellipse data-layer="pelucia-sombra" cx="166" cy="328" rx="34" ry="5" fill="#243f59" opacity=".12"/>' : '';
    const companion = pet ? `<svg data-layer="pet-original" data-source="${pet.source}" x="117" y="227" width="90" height="104" viewBox="${plushViewBox(pet)}" preserveAspectRatio="xMidYMax meet">${pet.body}</svg>` : '';
    const preset = Object.hasOwn(presetParts, settings.sourceSvg) ? presetParts[settings.sourceSvg] : null;
    const edits = Array.isArray(settings.presetEdits) ? settings.presetEdits : [];
    const originalLayer = (role, raw) => {
      const colorKey = role === 'face' ? 'skinColor'
        : role === 'outfit' ? 'outfitColor' : 'hairColor';
      const art = edits.includes(colorKey)
        ? recolorOriginal(raw, settings[colorKey], preset.colors[colorKey], role === 'face')
        : raw;
      return `<svg data-layer="original-${role}" width="464" height="464" viewBox="${preset.viewBox}" preserveAspectRatio="xMidYMax meet">${art}</svg>`;
    };
    const selectedOutfit = `<g data-layer="roupa-alterada">${outfitSVG(settings.outfitStyle, outfit, colors)}</g>`;
    const presetPieces = () => {
      if (edits.includes('outfitStyle')) {
        // A pele/roupa-base de alguns prontos é desenhada depois da camiseta.
        // A nova roupa precisa ficar sobre todo o tronco, mas sob cabelos longos.
        const body = preset.segments.filter(piece => piece.role !== 'outfit' && piece.role !== 'hairFront')
          .map(piece => originalLayer(piece.role, piece.svg)).join('');
        const hairFront = preset.segments.filter(piece => piece.role === 'hairFront')
          .map(piece => originalLayer(piece.role, piece.svg)).join('');
        return `${body}${selectedOutfit}${hairFront}`;
      }
      return preset.segments.map(piece => originalLayer(piece.role, piece.svg)).join('');
    };
    const upperBody = preset && edits.length === 0
      ? `<svg data-layer="avatar-pronto" data-source="${source(settings.sourceSvg)}" width="464" height="464" viewBox="${preset.viewBox}" preserveAspectRatio="xMidYMax meet">${preset.body}</svg>`
      : preset && edits.includes('avatarStyle')
        ? `<g data-layer="cabelo-atras">${tint(hairGeometry(hair.back), colors)}</g>
          <g data-layer="rosto-original">${tint(parts.face.svg, colors)}</g>
          <g data-layer="roupa-original">${edits.includes('outfitStyle') ? selectedOutfit : originalLayer('outfit', preset.layers.outfit)}</g>
          <g data-layer="cabelo-frente">${tint(hairGeometry(hair.front), colors)}</g>`
      : preset
        ? `<g data-layer="avatar-pronto-em-edicao">${presetPieces()}</g>`
      : `<g data-layer="cabelo-atras" data-source="${source(hair.source)}">${tint(hairGeometry(hair.back), colors)}</g>
        <g data-layer="rosto-original" data-source="${source(parts.face.source)}">${tint(parts.face.svg, colors)}</g>
        <g data-layer="roupa-original" data-source="${source(outfit.source)}">${outfitSVG(settings.outfitStyle, outfit, colors)}</g>
        <g data-layer="cabelo-frente" data-source="${source(hair.source)}">${tint(hairGeometry(hair.front), colors)}</g>`;
    return `${plushShadow}${lowerBody(settings, colors.SKIN)}
      <g data-layer="tronco" transform="translate(0 34) scale(0.452586)">
        ${upperBody}
        ${accessoriesSVG(settings, colors)}
      </g>${companion}`;
  }

  function avatarSymbol(id, settings) {
    if (!/^[a-z]+$/.test(id)) throw Error('ID de símbolo SVG inválido');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings = {}) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar infantil personalizável">${avatarBody(settings)}</svg>`;
  }
  window.LivrinhoAvatar = { hairStyles, outfitStyles, bottomStyles, footwearStyles, sockPatterns, petStyles,
    accessoryStyles, hairColors, outfitColors, bottomColors, shoeColors, accessoryColors,
    avatarBody, avatarSymbol, avatarSVG };
})();
