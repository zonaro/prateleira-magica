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
    ['side_sweep', 'Franja longa'], ['ringlets', 'Cachos curtinhos'], ['mullet', 'Mullets'], ['bald', 'Careca'],
    ['rapunzel', 'Tranças de Rapunzel (livro Rapunzel)']
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
    ['cardigan', 'Cardigã'], ['polo', 'Polo'], ['doctor_coat', 'Jaleco de médico (livro das vacinas)'],
    ['carnival_tank', 'Regata de Carnaval com glitter (livro das festas)']
  ];
  const bottomStyles = [['pants', 'Calça'], ['shorts', 'Shorts'], ['skirt', 'Saia'],
    ['long_skirt', 'Saia longa'], ['diaper', 'Fralda']];
  const footwearStyles = [['sneakers', 'Tênis'], ['flipflops', 'Chinelo'],
    ['socks', 'De meias'], ['barefoot', 'Descalço'], ['skates', 'Patins (3 medalhas)']];
  const sockPatterns = [['plain', 'Lisas'], ['stripes', 'Listradas'], ['dots', 'De bolinhas']];
  // A pelúcia de coração é desenhada no mesmo SVG do avatar, com animação de cor.
  const heartPlush = { name: 'Coração das Emoções', source: 'assets/pets/coracao-das-emocoes.svg',
    originalViewBox: '0 0 128 128', viewBox: '0 0 128 128',
    body: `<path d="M64 113C45 95 8 71 8 42 8 10 45 4 64 29 83 4 120 10 120 42c0 29-37 53-56 71Z" stroke="#8c4c85" stroke-width="5" fill="#ff729a"><animate attributeName="fill" values="#ff729a;#ffc45e;#8de0d3;#aa96fa;#ff729a" dur="8s" repeatCount="indefinite"/></path><circle cx="45" cy="49" r="5" fill="#543b67"/><circle cx="82" cy="49" r="5" fill="#543b67"/><path d="M52 66q12 12 24 0" stroke="#543b67" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="30" cy="62" rx="9" ry="5" fill="#fff" opacity=".5"/><ellipse cx="96" cy="62" rx="9" ry="5" fill="#fff" opacity=".5"/>` };
  const sunPlush = { name: 'Sol Sorridente', source: 'assets/pets/sol-sorridente.svg',
    originalViewBox: '0 0 128 128', viewBox: '0 0 128 128',
    body: `<g fill="#f6ae40" stroke="#e28c38" stroke-width="4" stroke-linejoin="round"><path d="M64 4 76 24 96 12 96 36 121 34 107 53 124 66 103 76 113 100 88 97 77 121 62 104 46 121 39 98 14 100 25 76 4 65 24 53 9 34 34 37 32 12 52 25Z"/></g><circle cx="64" cy="65" r="40" fill="#ffdb67" stroke="#ecac37" stroke-width="4"/><ellipse cx="49" cy="60" rx="5" ry="7" fill="#60434a"/><ellipse cx="79" cy="60" rx="5" ry="7" fill="#60434a"/><path d="M49 79q15 15 30 0" fill="none" stroke="#60434a" stroke-width="5" stroke-linecap="round"/><circle cx="37" cy="73" r="7" fill="#f39b89" opacity=".65"/><circle cx="91" cy="73" r="7" fill="#f39b89" opacity=".65"/>` };
  const nightingalePlush = { name: 'Rouxinol Cantor', source: 'assets/pets/rouxinol-cantor.svg',
    originalViewBox: '0 0 128 128', viewBox: '0 0 128 128',
    body: `<path d="M39 92Q3 92 7 65 23 73 41 63" fill="#9a78a5" stroke="#73567d" stroke-width="4"/>
      <ellipse cx="64" cy="79" rx="48" ry="34" fill="#bd95ab" stroke="#755b82" stroke-width="4"/>
      <path d="M42 55Q13 68 39 96q36 9 52-25" fill="#9379a8" stroke="#755b82" stroke-width="4"/>
      <circle cx="90" cy="52" r="29" fill="#c7a0b4" stroke="#755b82" stroke-width="4"/>
      <circle cx="100" cy="45" r="5" fill="#51485c"/><path d="M115 57l12 8-12 7Z" fill="#f3c572"/>
      <path d="M54 106l-4 17m31-16 5 16" stroke="#a37b7b" stroke-width="5" stroke-linecap="round"/>
      <text x="13" y="40" font-family="sans-serif" font-size="28" fill="#a67ec6">♫<animate attributeName="opacity" values=".4;1;.4" dur="3s" repeatCount="indefinite"/></text>` };
  const allPetParts = { ...petParts, heart_plush: heartPlush, sun_plush: sunPlush, nightingale_plush: nightingalePlush };
  const petStyles = Object.entries(allPetParts).map(([id, part]) => [id, part.name, part.source]);
  const rewardBooks = Object.freeze({
    headphones: 'a-orquestra-dos-sons', speaker: 'a-orquestra-dos-sons',
    mini_keyboard: 'a-festa-das-notas', guitar: 'a-festa-das-notas', flute: 'a-festa-das-notas',
    heart_plush: 'o-jardim-dos-sentimentos', medical_kit: 'o-escudo-das-vacinas',
    doctor_coat: 'o-escudo-das-vacinas', dumbbells: 'o-corpo-em-movimento',
    water_bottle: 'o-corpo-em-movimento',
    new_year_crown: 'o-calendario-das-festas', carnival_mask: 'o-calendario-das-festas',
    carnival_tank: 'o-calendario-das-festas', bunny_headband: 'o-calendario-das-festas',
    easter_eggs: 'o-calendario-das-festas', june_hat: 'o-calendario-das-festas',
    brazil_flag: 'o-calendario-das-festas', wooden_top: 'o-calendario-das-festas',
    saci_costume: 'o-calendario-das-festas', witch_hat: 'o-calendario-das-festas',
    halloween_pumpkin: 'o-calendario-das-festas', santa_hat: 'o-calendario-das-festas',
    calendar: 'a-danca-do-tempo', moon_ball: 'a-danca-do-tempo', sun_plush: 'a-danca-do-tempo',
    apple: 'a-turma-dos-alimentos', pear: 'a-turma-dos-alimentos',
    grapes: 'a-turma-dos-alimentos', yogurt: 'a-turma-dos-alimentos',
    salad: 'a-turma-dos-alimentos', bread: 'a-turma-dos-alimentos', egg: 'a-turma-dos-alimentos',
    mercury_ball: 'a-viagem-dos-oito-planetas', venus_ball: 'a-viagem-dos-oito-planetas',
    earth_ball: 'a-viagem-dos-oito-planetas', mars_ball: 'a-viagem-dos-oito-planetas',
    jupiter_ball: 'a-viagem-dos-oito-planetas', saturn_ball: 'a-viagem-dos-oito-planetas',
    uranus_ball: 'a-viagem-dos-oito-planetas', neptune_ball: 'a-viagem-dos-oito-planetas',
    abc_blocks: 'a-aventura-do-abc', dna_helix: 'o-jardim-das-diferencas',
    toothbrush: 'o-clube-dos-dentinhos', rapunzel: 'rapunzel-contos-dos-grimm',
    nightingale_plush: 'o-rouxinol-e-o-imperador', emperor_crown: 'a-roupa-nova-do-imperador',
    wooden_tortoise: 'as-fabulas-de-esopo', garden_carrot: 'a-historia-de-pedro-coelho'
  });
  function rewardUnlocked(settings, id) {
    const bookId = rewardBooks[id];
    if (!bookId) return true;
    const progress = settings?.achievements?.books?.[bookId];
    return Boolean(progress?.finished && (progress.medalEarnedAt || progress.challengeCompletedAt));
  }
  const accessoryStyles = [
    ['glasses_round', 'Óculos redondos', 'face'],
    ['glasses_square', 'Óculos quadrados', 'face'],
    ['glasses_sunglasses', 'Óculos escuros', 'face'],
    ['glasses_disguise', 'Óculos com nariz e bigode', 'face'],
    ['kitsune_mask', 'Máscara de raposa', 'face'],
    ['hero_mask', 'Máscara de super-herói', 'face'],
    ['eye_patch', 'Tapa-olho', 'face'],
    ['earrings_stud', 'Brincos', 'ears'],
    ['headphones', 'Fones de ouvido', 'hat'],
    ['cap', 'Boné', 'hat'],
    ['plumber_beret', 'Boina de encanador (3 medalhas)', 'hat'],
    ['beanie', 'Touca', 'hat'],
    ['sports_helmet', 'Capacete esportivo', 'hat'],
    ['headband', 'Tiara', 'hat'],
    ['cat_headband', 'Tiara de gatinho', 'hat'],
    ['new_year_crown', 'Coroa de Ano-Novo (livro das festas)', 'hat'],
    ['emperor_crown', 'Coroa imperial (livro da roupa nova)', 'hat'],
    ['bunny_headband', 'Orelhas de coelho (livro das festas)', 'hat'],
    ['june_hat', 'Chapéu de Festa Junina (livro das festas)', 'hat'],
    ['witch_hat', 'Chapéu de bruxa (livro das festas)', 'hat'],
    ['santa_hat', 'Gorro de Papai Noel (livro das festas)', 'hat'],
    ['carnival_mask', 'Máscara de Carnaval (livro das festas)', 'face'],
    ['hooded_cape', 'Capa com capuz', 'cape'],
    ['hero_cape', 'Capa de super-herói', 'cape'],
    ['bow_hair', 'Laço', 'hair'],
    ['flower_clip', 'Flor de cabelo', 'hair'],
    ['star_clip', 'Estrela', 'hair']
  ];
  // Brinquedos do mesmo grupo se substituem; os grupos podem conviver.
  const toyStyles = [
    ['skateboard', 'Skate (4 medalhas)', 'floor'],
    ['soccer_ball', 'Bola de futebol', 'hand'],
    ['basketball', 'Bola de basquete', 'hand'],
    ['tennis_ball', 'Bola de tênis', 'hand'],
    ['american_football', 'Bola de futebol americano', 'hand'],
    ['handball', 'Bola de handebol', 'hand'],
    ['pocket_ball', 'Bola de monstrinho de bolso', 'hand'],
    ['shuttlecock', 'Peteca', 'hand'],
    ['chess_pieces', 'Peças de xadrez', 'hand'],
    ['yoyo', 'Ioiô (volte uma página para liberar)', 'hand'],
    ['fairy_wings', 'Asas de fada', 'back'],
    ['bat_wings', 'Asas de morcego', 'back'],
    ['ghost_costume', 'Fantasia de fantasma', 'costume'],
    ['speaker', 'Caixa de som (livro dos sons)', 'hand'],
    ['mini_keyboard', 'Mini teclado (livro de música)', 'hand'],
    ['guitar', 'Violão (livro de música)', 'hand'],
    ['flute', 'Flauta (livro de música)', 'hand'],
    ['medical_kit', 'Kit médico (livro das vacinas)', 'hand'],
    ['dumbbells', 'Halteres (livro do movimento)', 'hand'],
    ['water_bottle', 'Garrafinha de água (livro do movimento)', 'hand'],
    ['easter_eggs', 'Ovos de Páscoa (livro das festas)', 'hand'],
    ['brazil_flag', 'Bandeirinha do Brasil (livro das festas)', 'hand'],
    ['wooden_top', 'Pião de madeira (livro das festas)', 'hand'],
    ['halloween_pumpkin', 'Abóbora com velinha animada (livro das festas)', 'hand'],
    ['saci_costume', 'Fantasia de Saci, com uma perna (livro das festas)', 'costume'],
    ['calendar', 'Calendário (livro do tempo)', 'hand'],
    ['moon_ball', 'Bola com textura da Lua (livro do tempo)', 'hand'],
    ['apple', 'Maçã (livro da alimentação)', 'hand'],
    ['pear', 'Pera (livro da alimentação)', 'hand'],
    ['grapes', 'Uvas (livro da alimentação)', 'hand'],
    ['yogurt', 'Iogurte (livro da alimentação)', 'hand'],
    ['salad', 'Salada (livro da alimentação)', 'hand'],
    ['bread', 'Pão (livro da alimentação)', 'hand'],
    ['egg', 'Ovo (livro da alimentação)', 'hand'],
    ['mercury_ball', 'Bola de Mercúrio (livro do espaço)', 'hand'],
    ['venus_ball', 'Bola de Vênus (livro do espaço)', 'hand'],
    ['earth_ball', 'Bola da Terra (livro do espaço)', 'hand'],
    ['mars_ball', 'Bola de Marte (livro do espaço)', 'hand'],
    ['jupiter_ball', 'Bola de Júpiter (livro do espaço)', 'hand'],
    ['saturn_ball', 'Bola de Saturno (livro do espaço)', 'hand'],
    ['uranus_ball', 'Bola de Urano (livro do espaço)', 'hand'],
    ['neptune_ball', 'Bola de Netuno (livro do espaço)', 'hand'],
    ['abc_blocks', 'Blocos de empilhar ABC (livro do abecedário)', 'hand'],
    ['dna_helix', 'Dupla hélice de DNA (livro da diversidade)', 'hand'],
    ['toothbrush', 'Escova de dentes (livro da escovação)', 'hand'],
    ['wooden_tortoise', 'Tartaruguinha de madeira (fábulas de Esopo)', 'hand'],
    ['garden_carrot', 'Cenoura de Pedro Coelho (conto clássico)', 'hand']
  ];
  const hairColors = [
    ['#493a55', 'Castanho escuro'], ['#7b4c35', 'Castanho'],
    ['#c47b43', 'Ruivo'], ['#f5c35b', 'Loiro'],
    ['#303448', 'Preto'], ['#d38ec4', 'Rosa fantasia'],
    ['#65b8cc', 'Azul fantasia'], ['#8c6bd0', 'Roxo fantasia'],
    ['#e65a76', 'Vermelho fantasia'], ['#53b978', 'Verde fantasia'],
    ['#ed9653', 'Laranja fantasia'], ['#46c5bd', 'Turquesa fantasia']
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
  const toyColors = [
    ['#ed4d56', 'Vermelho'], ['#639de8', 'Azul'], ['#79bc8d', 'Verde'],
    ['#9c80df', 'Lilás'], ['#efb857', 'Amarelo'], ['#ed805d', 'Coral'],
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
    const toy = safeColor(settings.toyColor, '#ed4d56');
    return {
      SKIN: skin, SKIN_LIGHT: shade(skin, .15), SKIN_DARK: shade(skin, -.12), SKIN_DEEP: shade(skin, -.25),
      HAIR: hair, HAIR_LIGHT: shade(hair, .25), HAIR_DARK: shade(hair, -.16), HAIR_DEEP: shade(hair, -.3),
      OUTFIT: outfit, OUTFIT_LIGHT: shade(outfit, .25), OUTFIT_DARK: shade(outfit, -.13), OUTFIT_DEEP: shade(outfit, -.25),
      ACCESSORY: accessory, ACCESSORY_LIGHT: shade(accessory, .25),
      ACCESSORY_DARK: shade(accessory, -.2), ACCESSORY_DEEP: shade(accessory, -.38),
      TOY: toy, TOY_LIGHT: shade(toy, .27), TOY_DARK: shade(toy, -.22), TOY_DEEP: shade(toy, -.45)
    };
  }
  function tint(original, colors) {
    return original.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => colors[key] || '#000000');
  }
  function outfitSVG(style, outfit, colors) {
    if (style === 'doctor_coat') return `<g data-detail="jaleco-medico">
      ${tint(parts.outfit.coat.svg, { ...colors, OUTFIT: '#fffefa', OUTFIT_DARK: '#d1e3ed', OUTFIT_DEEP: '#9ac2d3', OUTFIT_LIGHT: '#ffffff' })}
      <path d="M189 324 232 373 276 324l-14 101h-60Z" fill="#b6e7e5"/>
      <path d="M189 324 232 373l-32 39-30-77Zm87 0-44 49 33 39 29-77Z" fill="#fffefa" stroke="#9ac2d3" stroke-width="5"/>
      <path d="M190 353v48q0 42 37 42m49-90v48q0 42-37 42" fill="none" stroke="#488a9a" stroke-width="7"/>
      <circle cx="233" cy="442" r="16" fill="#d8f0f0" stroke="#488a9a" stroke-width="6"/>
      <path d="M304 390h24m-12-12v24" stroke="#e76d85" stroke-width="8" stroke-linecap="round"/>
    </g>`;
    if (style === 'carnival_tank') {
      const glitter = Array.from({ length: 34 }, (_, i) => {
        const x = 165 + (i * 47 % 136);
        const y = 334 + (i * 31 % 112);
        const sparkle = ['#f9d651', '#69dbe1', '#f18db7', '#d9c2ff', '#ffffff'][i % 5];
        return `<circle cx="${x}" cy="${y}" r="${i % 3 + 2}" fill="${sparkle}"/>`;
      }).join('');
      return `<g data-detail="regata-carnaval-glitter">${tint(outfit.svg, colors)}
        <g data-detail="glitter-colorido">${glitter}</g></g>`;
    }
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
  function accessoriesSVG(settings, colors, placement = 'front') {
    const selected = Array.isArray(settings.accessories) ? settings.accessories : [];
    const ink = colors.ACCESSORY_DARK;
    const decoration = colors.ACCESSORY;
    const firstLetter = String(settings.name || 'A').trim().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR').match(/[A-Z]/)?.[0] || 'A';
    const rearDrawings = {
      hooded_cape: `<path d="M147 270Q73 279 48 360L9 464h446l-42-111Q391 277 318 270Z" fill="${colors.ACCESSORY_DARK}"/>
        <path d="M159 284Q79 343 67 464h332Q392 347 308 284Z" fill="${decoration}"/>
        <path d="M101 172Q70 21 232 6q162 15 131 166l-44-24Q315 62 232 60q-83 2-87 88Z" fill="${decoration}" stroke="${ink}" stroke-width="8"/>`,
      hero_cape: `<path d="M163 287Q94 303 23 462q110 24 209-24 95 44 208 24Q365 299 301 287Z" fill="${decoration}" stroke="${ink}" stroke-width="7"/>
        <path d="M171 303 94 444q69-15 116-29m95-112 71 141q-65-16-116-29" fill="${colors.ACCESSORY_LIGHT}" opacity=".65"/>`
    };
    if (placement === 'back') {
      return selected.filter(key => Object.hasOwn(rearDrawings, key))
        .map(key => `<g data-accessory="${key}" data-placement="back">${rearDrawings[key]}</g>`).join('');
    }
    const drawings = {
      glasses_round: `<g fill="none" stroke="${decoration}" stroke-width="9"><circle cx="176" cy="183" r="31"/><circle cx="288" cy="183" r="31"/><path d="M207 179q25-15 50 0M145 178h-25m199 0h25"/></g>`,
      glasses_square: `<g fill="none" stroke="${decoration}" stroke-width="9" stroke-linejoin="round"><rect x="143" y="150" width="67" height="65" rx="10"/><rect x="254" y="150" width="67" height="65" rx="10"/><path d="M210 178q22-12 44 0M143 178h-23m201 0h23"/></g>`,
      glasses_sunglasses: `<g fill="${colors.ACCESSORY_DEEP}" fill-opacity=".86" stroke="${ink}" stroke-width="8"><rect x="142" y="152" width="68" height="62" rx="15"/><rect x="254" y="152" width="68" height="62" rx="15"/><path d="M210 178q22-12 44 0M142 178h-22m202 0h22" fill="none"/></g>`,
      glasses_disguise: `<g stroke="${ink}" stroke-width="7" fill="none"><circle cx="176" cy="182" r="29"/><circle cx="288" cy="182" r="29"/><path d="M205 177q27-14 54 0m-113 0h-23m196 0h23"/></g>
        <path d="M232 183q-23 32-12 43h27q12-12-15-43Z" fill="${colors.SKIN_DARK}" stroke="${ink}" stroke-width="4"/>
        <path d="M230 230q-36-25-63 8 22 14 64-1 42 15 64 1-28-33-63-8Z" fill="${decoration}" stroke="${ink}" stroke-width="5"/>`,
      kitsune_mask: `<path d="M122 169 121 98l54 43q56-21 113 0l55-43v70q-8 63-110 70-103-7-111-69Z" fill="#fffaf0" stroke="${ink}" stroke-width="8"/>
        <path d="M137 119l31 34-28 18ZM328 119l-31 34 28 18Z" fill="${decoration}"/>
        <path d="M146 180q27-25 61 0l-11 14q-25-8-41 5Zm171 0q-28-25-61 0l11 14q25-8 41 5Z" fill="${colors.ACCESSORY_DARK}"/>
        <path d="M221 204l11-8 11 8-11 9Z" fill="${decoration}"/><path d="M213 213q19 20 38 0" fill="none" stroke="${ink}" stroke-width="5"/>
        <path d="M170 210l-34 10m34 1-34 17m158-28 34 10m-34 1 34 17" stroke="${decoration}" stroke-width="7" stroke-linecap="round"/>`,
      hero_mask: `<path d="M116 161q40-23 116-13 76-10 116 13l-14 63q-44 13-102-7-58 20-102 7Z" fill="${decoration}" stroke="${ink}" stroke-width="7"/>
        <path d="M149 179q32-16 58 10-9 22-44 16Zm166 0q-32-16-58 10 9 22 44 16Z" fill="#fff" stroke="${ink}" stroke-width="5"/>`,
      eye_patch: `<path d="M110 175Q232 143 356 175" fill="none" stroke="${ink}" stroke-width="9"/><path d="M138 155q38-13 76 1l-7 53q-30 25-56-3Z" fill="${decoration}" stroke="${ink}" stroke-width="6"/>`,
      earrings_stud: `<g fill="${decoration}" stroke="${ink}" stroke-width="4"><circle cx="119" cy="226" r="11"/><circle cx="345" cy="226" r="11"/></g>`,
      headphones: `<path d="M78 184V145C78 45 137 6 232 6s154 39 154 139v39" fill="none" stroke="${ink}" stroke-width="19"/><rect x="61" y="149" width="49" height="91" rx="22" fill="${decoration}" stroke="${ink}" stroke-width="7"/><rect x="354" y="149" width="49" height="91" rx="22" fill="${decoration}" stroke="${ink}" stroke-width="7"/>`,
      // Boné ampliado para cobrir penteados volumosos, sem perder a aba SVG original.
      cap: `<g transform="translate(232 150) scale(1.2) translate(-232 -150)">${tint(parts.hair.cap?.front || '',
        { ...colors, HAIR: decoration, HAIR_DARK: colors.ACCESSORY_DARK,
          HAIR_DEEP: colors.ACCESSORY_DEEP, HAIR_LIGHT: colors.ACCESSORY_LIGHT })}</g>`,
      plumber_beret: `<g data-layer="boina-de-encanador"><path d="M84 133C84 58 131 11 228 11c91 0 151 46 151 122v19H84Z" fill="${decoration}" stroke="${ink}" stroke-width="8"/><path d="M87 127q135-30 291 0v38q-144 20-291 0Z" fill="${colors.ACCESSORY_LIGHT}" stroke="${ink}" stroke-width="6"/><path d="M107 152q100 25 261 0l-22 34q-113 23-226-4Z" fill="${colors.ACCESSORY_DARK}"/><circle cx="233" cy="95" r="49" fill="#fffdf7" stroke="${ink}" stroke-width="7"/><text x="233" y="115" font-family="system-ui,sans-serif" font-size="57" font-weight="900" text-anchor="middle" fill="${ink}">${firstLetter}</text></g>`,
      beanie: `<path d="M93 151V123C93 41 145 6 232 6S371 41 371 123v28Z" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="7"/><rect x="87" y="130" width="290" height="39" rx="15" fill="${colors.ACCESSORY_LIGHT}" stroke="${colors.ACCESSORY_DARK}" stroke-width="6"/><circle cx="232" cy="7" r="16" fill="${colors.ACCESSORY_LIGHT}"/>`,
      sports_helmet: `<path d="M92 157Q78 20 232 16q151 3 143 141l-25 24H116Z" fill="${decoration}" stroke="${ink}" stroke-width="9"/>
        <path d="M232 25v131" stroke="${colors.ACCESSORY_LIGHT}" stroke-width="15"/><path d="M117 157h250q-8 29-40 35H138q-22-7-21-35Z" fill="${colors.ACCESSORY_DEEP}"/>
        <path d="M119 180q-31 27-9 57l36-5m198-52q31 27 9 57l-36-5" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>`,
      headband: `<path d="M109 122Q125 25 232 25T355 122" fill="none" stroke="${decoration}" stroke-width="22" stroke-linecap="round"/>`,
      cat_headband: `<path d="M110 132Q126 27 232 27T354 132" fill="none" stroke="${ink}" stroke-width="26" stroke-linecap="round"/>
        <path d="M110 132Q126 27 232 27T354 132" fill="none" stroke="${decoration}" stroke-width="18" stroke-linecap="round"/>
        <path d="M112 78 108 6q57 19 86 73ZM352 78l4-72q-57 19-86 73Z" fill="${decoration}" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/>
        <path d="M128 54 125 26l39 44ZM336 54l3-28-39 44Z" fill="${colors.ACCESSORY_LIGHT}"/>`,
      new_year_crown: `<path d="M96 138 101 42l61 49 70-75 68 75 62-49 6 96Z" fill="${decoration}" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/><path d="M96 137h272v26H96Z" fill="${colors.ACCESSORY_LIGHT}" stroke="${ink}" stroke-width="6"/><circle cx="232" cy="67" r="12" fill="#fff5ae"/>`,
      emperor_crown: `<g data-detail="coroa-imperial"><path d="M112 139 96 37l73 43 63-68 63 68 73-43-16 102Z" fill="#f5cf68" stroke="#997459" stroke-width="8" stroke-linejoin="round"/>
        <path d="M111 129h242v35H111Z" fill="${decoration}" stroke="#997459" stroke-width="7"/>
        <path d="M131 120 117 68l55 29 60-60 60 60 55-29-14 52Z" fill="${colors.ACCESSORY_LIGHT}" opacity=".67"/>
        <g stroke="#fff4d2" stroke-width="3"><ellipse cx="166" cy="144" rx="12" ry="15" fill="#b98ddc"/><ellipse cx="232" cy="143" rx="15" ry="18" fill="#72bbcf"/><ellipse cx="298" cy="144" rx="12" ry="15" fill="#f0879b"/></g></g>`,
      bunny_headband: `<path d="M109 131Q126 26 232 26T355 131" fill="none" stroke="${ink}" stroke-width="25"/><path d="M109 131Q126 26 232 26T355 131" fill="none" stroke="${decoration}" stroke-width="16"/><path d="M151 69Q93-45 131-55q44-7 74 111Zm157 0q58-114 20-124-44-7-74 111Z" fill="#fff9fa" stroke="${ink}" stroke-width="8"/><path d="M165 43Q124-32 139-37q26 3 47 80Zm133 0q41-75 26-80-26 3-47 80Z" fill="#f5aabe"/>`,
      june_hat: `<path d="M98 134 146 23h174l46 111Z" fill="#dfab60" stroke="#8c6239" stroke-width="8"/><path d="M84 126q148-26 296 0l-14 32q-134 19-268 0Z" fill="#edbf6e" stroke="#8c6239" stroke-width="7"/><path d="M143 79q90-17 179 0" fill="none" stroke="${decoration}" stroke-width="18"/><path d="m170 82 13-19 13 19m72 0 13-19 13 19" fill="${decoration}" stroke="${ink}" stroke-width="3"/>`,
      witch_hat: `<path d="M149 137 238-49l90 186Z" fill="${colors.ACCESSORY_DEEP}" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/><path d="M113 106q115 21 246 0l26 42q-147 49-302 0Z" fill="${decoration}" stroke="${ink}" stroke-width="8"/><path d="M153 105q76 20 158 0" fill="none" stroke="#ffd368" stroke-width="18"/><rect x="219" y="95" width="33" height="24" rx="4" fill="#ffe9a0" stroke="${ink}" stroke-width="5"/>`,
      santa_hat: `<path d="M106 136Q109 19 252-25q68-21 109 28-32-4-52 48l16 89Z" fill="#d94353" stroke="#8c324b" stroke-width="9"/><path d="M95 130q137-29 275 0l-9 42q-128-14-256 0Z" fill="#fffbf0" stroke="#bccad5" stroke-width="7"/><circle cx="367" cy="5" r="29" fill="#fffef6" stroke="#bccad5" stroke-width="5"/>`,
      carnival_mask: `<path d="M111 169q54-32 121-5 67-27 121 5l-23 57q-51 8-98-16-47 24-98 16Z" fill="${decoration}" stroke="${ink}" stroke-width="7"/><path d="M148 183q30-17 58 5-16 22-49 17Zm168 0q-30-17-58 5 16 22 49 17Z" fill="#fff" stroke="${ink}" stroke-width="4"/><path d="M111 169q-15-42 10-61m232 61q15-42-10-61" stroke="#f6d36b" stroke-width="10" fill="none"/><circle cx="232" cy="163" r="8" fill="#f6d36b"/>`,
      hooded_cape: `<g data-layer="capuz-sobre-o-cabelo">
          <path d="M79 174Q61 1 232 1q171 0 153 173l-38 94-39-29q22-31 22-85Q326 64 232 57q-94 7-98 97 0 54 22 85l-39 29Z"
            fill="${decoration}" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/>
          <path d="M135 157Q163 66 232 57q69 9 97 100-49-34-97-34t-97 34Z"
            fill="${colors.ACCESSORY_DARK}"/>
          <path d="M105 213q-2 133-61 251h108q-11-132-5-242ZM359 213q2 133 61 251H312q11-132 5-242Z"
            fill="${decoration}" stroke="${ink}" stroke-width="6"/>
          <path d="M93 255q1 126-33 198m311-198q-1 126 33 198" fill="none" stroke="${colors.ACCESSORY_LIGHT}" stroke-width="9" opacity=".75"/>
          <path d="M181 297q51 35 102 0" fill="none" stroke="${colors.ACCESSORY_LIGHT}" stroke-width="12" stroke-linecap="round"/>
        </g>`,
      hero_cape: `<circle cx="173" cy="322" r="12" fill="${colors.ACCESSORY_LIGHT}" stroke="${ink}" stroke-width="5"/>
        <circle cx="292" cy="322" r="12" fill="${colors.ACCESSORY_LIGHT}" stroke="${ink}" stroke-width="5"/>`,
      bow_hair: `<g transform="translate(342 85)" stroke="${colors.ACCESSORY_DARK}" stroke-width="5"><path d="M0 0Q-85-59-62 23L0 10Q75 66 73-25Z" fill="${decoration}"/><circle cx="0" cy="6" r="17" fill="${colors.ACCESSORY_LIGHT}"/></g>`,
      flower_clip: `<g transform="translate(349 105)" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="3"><circle cy="-20" r="16"/><circle cx="19" cy="-7" r="16"/><circle cx="12" cy="16" r="16"/><circle cx="-12" cy="16" r="16"/><circle cx="-19" cy="-7" r="16"/><circle r="12" fill="${colors.ACCESSORY_LIGHT}" stroke="none"/></g>`,
      star_clip: `<path d="M350 68l13 27 30 4-22 21 5 30-26-14-27 14 5-30-22-21 31-4Z" fill="${decoration}" stroke="${colors.ACCESSORY_DARK}" stroke-width="5" stroke-linejoin="round"/>`
    };
    // Desenhamos acessórios de cabelo por último: a flor cobre sempre a tiara,
    // independentemente da ordem dos cliques ou do perfil importado.
    const order = { cape: 0, hat: 1, ears: 2, face: 3, hair: 4 };
    const groupOf = Object.fromEntries(accessoryStyles.map(([id, , group]) => [id, group]));
    return selected.filter((key) => Object.hasOwn(drawings, key))
      .sort((left, right) => (order[groupOf[left]] ?? 0) - (order[groupOf[right]] ?? 0))
      .map((key) => `<g data-accessory="${key}">${drawings[key]}</g>`).join('');
  }

  // Pequenos globos com texturas vetoriais próprias: não dependem de imagens externas.
  function planetBallSVG(id) {
    const planets = {
      mercury_ball: ['#a5a2a0', '#555968', '<g fill="#6e6c70" opacity=".8"><circle cx="-11" cy="-8" r="5"/><circle cx="8" cy="11" r="7"/><circle cx="13" cy="-12" r="3"/></g>'],
      venus_ball: ['#dfbb81', '#b86c42', '<g fill="none" stroke="#f9dfad" stroke-width="5" opacity=".9"><path d="M-21-10q20 9 40-3M-20 3q22-10 41 0M-15 17q14-9 27-5"/></g>'],
      earth_ball: ['#378bd2', '#134c9f', '<g fill="#5ab96a" stroke="#25866b" stroke-width="1.3"><path d="M-13-23 3-17 0-7 11 0 6 10-4 8-8 19-17 12-13 2-23-4Z"/><path d="M12-17 23-11 17-2 11-5 6-10Z"/></g><path d="M-13-18q6-5 12-2" stroke="#fff" stroke-width="3" fill="none"/>'],
      mars_ball: ['#dc805b', '#a5443d', '<g fill="#a64c37" opacity=".8"><ellipse cx="-9" cy="-8" rx="10" ry="5"/><circle cx="11" cy="11" r="6"/><path d="M0-22q10 7 21 4l-3 7-17-5Z"/></g><path d="M-14-19q9-3 19 1" stroke="#f4caaf" stroke-width="3" fill="none"/>'],
      jupiter_ball: ['#e7bf9b', '#ae735e', '<g stroke-linecap="round" fill="none"><path d="M-21-15q22 8 42-2M-23-6q26-5 46 1M-23 5q25 8 46 0M-18 15q18-5 36 1" stroke="#af7363" stroke-width="5"/><path d="M-20-11q20 7 40-1M-19 11q16 3 37-1" stroke="#fff2d0" stroke-width="3"/><ellipse cx="9" cy="7" rx="8" ry="4" stroke="#b95f53" stroke-width="3"/></g>'],
      saturn_ball: ['#e5cd98', '#9b8669', '<path d="M-22-6q23 8 45 0M-20 8q22 4 40-1" fill="none" stroke="#b9a374" stroke-width="4"/>'],
      uranus_ball: ['#8ddbe0', '#3aabbc', '<g fill="none" stroke="#c6eff3" stroke-width="3"><path d="M-21-8q24-7 42 0M-22 3q24 4 44-1M-17 15q15-4 32-1"/></g>'],
      neptune_ball: ['#426cdb', '#263e9e', '<g fill="none" stroke="#7da3ef" stroke-width="4"><path d="M-21-8q21-7 42 0M-21 6q19 9 42 0M-14 17q12-4 25-1"/></g>']
    };
    const details = planets[id];
    if (!details) return '';
    const ball = `<defs><radialGradient id="planet-${id}" cx="30%" cy="26%" r="78%"><stop stop-color="${details[0]}"/><stop offset="1" stop-color="${details[1]}"/></radialGradient><clipPath id="clip-${id}"><circle r="23"/></clipPath></defs>
      <circle r="23" fill="url(#planet-${id})" stroke="#35455e" stroke-width="2.5"/><g clip-path="url(#clip-${id})">${details[2]}</g><ellipse cx="-9" cy="-13" rx="7" ry="4" fill="#fff" opacity=".27"/>`;
    return id === 'saturn_ball'
      ? `<g transform="rotate(-22)"><ellipse rx="33" ry="10" fill="none" stroke="#ae9269" stroke-width="7"/>${ball}<path d="M-31 4q31 17 62-8" fill="none" stroke="#e9d5ab" stroke-width="6"/></g>`
      : ball;
  }

  function toysSVG(settings, colors, placement) {
    const chosen = Array.isArray(settings.toys) ? settings.toys : [];
    const tone = colors.TOY;
    const light = colors.TOY_LIGHT;
    const dark = colors.TOY_DARK;
    const ink = colors.TOY_DEEP;
    if (placement === 'back') {
      const fairy = `<path d="M209 254Q132 85 40 127q-42 68 95 136Q-2 258 31 377q90 47 181-93Z" fill="${light}" fill-opacity=".82" stroke="${dark}" stroke-width="9"/>
        <path d="M190 249Q97 180 51 157m141 115Q103 329 56 347" stroke="#fff" stroke-opacity=".7" stroke-width="9" fill="none"/>`;
      const bat = `<path d="M207 261Q141 166 23 156q46 56-8 102 77-12 71 62 65-32 120-35Z" fill="${tone}" stroke="${ink}" stroke-width="9"/>
        <path d="M202 270 35 187m167 84-105 26" stroke="${dark}" stroke-width="9" fill="none"/>`;
      return chosen.filter(key => key === 'fairy_wings' || key === 'bat_wings')
        .map(key => {
          const oneWing = key === 'fairy_wings' ? fairy : bat;
          return `<g data-toy="${key}" data-placement="back">${oneWing}<g transform="translate(464 0) scale(-1 1)">${oneWing}</g></g>`;
        }).join('');
    }
    if (placement === 'floor') {
      return chosen.includes('skateboard')
        ? `<g data-toy="skateboard" data-placement="floor">
            <ellipse cx="105" cy="338" rx="77" ry="3" fill="#243f59" opacity=".15"/>
            <circle cx="59" cy="330" r="7" fill="${ink}"/><circle cx="151" cy="330" r="7" fill="${ink}"/>
            <circle cx="59" cy="330" r="3" fill="${light}"/><circle cx="151" cy="330" r="3" fill="${light}"/>
            <path d="M28 315q77 11 154 0-5 13-22 13H50q-17 0-22-13Z" fill="${tone}" stroke="${ink}" stroke-width="2"/>
            <path d="M33 317q72 8 144 0" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round"/>
          </g>` : '';
    }
    if (placement === 'costume') {
      if (chosen.includes('saci_costume')) return `<g data-toy="saci_costume" data-placement="costume">
        <path d="M70 177q35-16 70 0l8 94q-45 20-90 0Z" fill="#d9454b" stroke="#94393d" stroke-width="3"/>
        <path d="M57 272q25 10 46 1l-5 37H68Z" fill="#d9454b" stroke="#94393d" stroke-width="2"/>
        <path d="M57 205q4-12 13-13m69 0q10 5 14 14" stroke="#e96861" stroke-width="5" fill="none"/>
        <g transform="translate(0 34) scale(.452586)"><path d="M135 112Q137-15 269-3q71 7 92 85l-48 59q-104-22-178-29Z" fill="#ce2b42" stroke="#823747" stroke-width="9"/><circle cx="335" cy="82" r="20" fill="#fff5e0"/><path d="M136 113q110-17 188 27" fill="none" stroke="#e65559" stroke-width="12"/></g>
      </g>`;
      return chosen.includes('ghost_costume')
        ? `<g data-toy="ghost_costume" data-placement="costume" transform="translate(105 0) scale(1.24 1) translate(-105 0)">
            <path d="M105 19C147 19 168 50 172 95L181 313q5 19-7 26-9 5-20-4-12 12-25 1-13 12-24 1-15 10-28-1-13 10-25-1-12 9-21 4-12-7-7-26L38 95Q43 19 105 19Z
              M69 113a12 15 0 1 0 24 0a12 15 0 1 0-24 0Z
              M117 113a12 15 0 1 0 24 0a12 15 0 1 0-24 0Z"
              fill="#fbfbff" fill-rule="evenodd" stroke="${dark}" stroke-width="2.7" stroke-linejoin="round"/>
            <path d="M49 85Q58 32 105 31q44 1 57 54M47 174l-5 112m124-112 5 112" fill="none" stroke="${light}" stroke-width="4" opacity=".7"/>
            <path d="M98 143q7 11 14 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
            <path d="M83 245q20 7 39 0" fill="none" stroke="${tone}" stroke-width="3" stroke-dasharray="5 8"/>
          </g>` : '';
    }
    if (placement !== 'hand') return '';
    const items = {
      soccer_ball: `<circle r="22" fill="#fffdf5" stroke="${ink}" stroke-width="2.5"/>
        <path d="M0-11 11-4 7 9-7 9-11-4Z" fill="${tone}" stroke="${ink}" stroke-width="2"/>
        <path d="M0-11v-10m11 17 9-8M7 9l8 12M-7 9l-8 12M-11-4l-9-8" stroke="${ink}" stroke-width="2" fill="none"/>`,
      basketball: `<circle r="22" fill="${tone}" stroke="${ink}" stroke-width="3"/>
        <path d="M-22 0h44M0-22v44M-15-16Q4 0-15 16M15-16Q-4 0 15 16" fill="none" stroke="${ink}" stroke-width="2.7"/>`,
      yoyo: `<g data-detail="ioio"><path d="M-1-8Q-9 4 3 17t5 27" fill="none" stroke="${ink}" stroke-width="2.7" stroke-linecap="round"/>
        <circle cx="8" cy="49" r="16" fill="${dark}" stroke="${ink}" stroke-width="2.8"/>
        <circle cx="8" cy="49" r="12" fill="${tone}"/>
        <circle cx="8" cy="49" r="6" fill="${light}" stroke="${ink}" stroke-width="2"/>
        <path d="M-6 39q-5 11 0 20" stroke="${light}" stroke-width="2" fill="none"/></g>`,
      tennis_ball: `<circle r="20" fill="${tone}" stroke="${ink}" stroke-width="2.5"/>
        <path d="M-9-17Q13 0-9 17M9-17Q-13 0 9 17" fill="none" stroke="#fff" stroke-width="4"/>`,
      american_football: `<path d="M-26 0Q0-31 26 0 0 31-26 0Z" fill="${tone}" stroke="${ink}" stroke-width="3"/>
        <path d="M-16-7v14M16-7v14M-11 0h22M-7-6v12M0-7v14M7-6v12" fill="none" stroke="#fff" stroke-width="3"/>`,
      handball: `<circle r="21" fill="${tone}" stroke="${ink}" stroke-width="3"/>
        <path d="M-15-11Q0 0 15-11M-18 7Q0-5 18 7M-4-20Q14 1-4 20" stroke="${light}" stroke-width="3" fill="none"/>`,
      pocket_ball: `<circle r="22" fill="#fff" stroke="#282833" stroke-width="3.5"/>
        <path d="M-21 0a21 21 0 0 1 42 0Z" fill="${tone}"/>
        <path d="M-21 0h42" stroke="#282833" stroke-width="7"/>
        <circle r="8" fill="#fff" stroke="#282833" stroke-width="4"/><circle r="3" fill="#fff"/>`,
      shuttlecock: `<path d="M-9 6-22-21l17 10 5-18 5 18 17-10L9 6Z" fill="${light}" stroke="${dark}" stroke-width="2.8"/>
        <path d="M-16-13 0 7m16-20L0 7M0-25V7" stroke="${dark}" stroke-width="2"/>
        <path d="M-10 6h20l6 13q-16 11-32 0Z" fill="${tone}" stroke="${ink}" stroke-width="3"/>`,
      speaker: `<rect x="-26" y="-33" width="52" height="65" rx="9" fill="${tone}" stroke="${ink}" stroke-width="3"/><circle cy="9" r="17" fill="${dark}" stroke="${ink}" stroke-width="3"/><circle cy="9" r="9" fill="${light}"/><circle cy="-22" r="5" fill="${light}"/>`,
      mini_keyboard: `<rect x="-37" y="-19" width="74" height="39" rx="5" fill="${tone}" stroke="${ink}" stroke-width="3"/><g fill="#fff"><rect x="-31" y="-12" width="9" height="26"/><rect x="-19" y="-12" width="9" height="26"/><rect x="-7" y="-12" width="9" height="26"/><rect x="5" y="-12" width="9" height="26"/><rect x="17" y="-12" width="9" height="26"/></g><g fill="${ink}"><rect x="-25" y="-12" width="6" height="15"/><rect x="-13" y="-12" width="6" height="15"/><rect x="11" y="-12" width="6" height="15"/></g>`,
      guitar: `<g transform="rotate(-30)"><path d="M-13 8q-27-21-8-42 12-11 22-2 10-9 22 2 19 21-8 42Z" fill="${tone}" stroke="${ink}" stroke-width="3"/><circle cy="-14" r="8" fill="${ink}"/><rect x="-5" y="-69" width="10" height="50" rx="3" fill="${dark}"/><path d="M-2-69v66m4-66v66" stroke="${light}" stroke-width="1.5"/><path d="M-11-69h22" stroke="${ink}" stroke-width="5"/></g>`,
      flute: `<g transform="rotate(-35)"><rect x="-7" y="-43" width="14" height="88" rx="6" fill="${tone}" stroke="${ink}" stroke-width="3"/><path d="M-7-30H7M-7 30H7" stroke="${light}" stroke-width="3"/><g fill="${ink}"><circle cy="-15" r="2.5"/><circle cy="-2" r="2.5"/><circle cy="11" r="2.5"/><circle cy="24" r="2.5"/></g></g>`,
      medical_kit: `<rect x="-31" y="-22" width="62" height="48" rx="7" fill="${tone}" stroke="${ink}" stroke-width="3"/><path d="M-14-22v-9h28v9" fill="none" stroke="${ink}" stroke-width="5"/><path d="M-12 2h24M0-10v24" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
      dumbbells: `<g stroke="${ink}" stroke-width="3"><path d="M-29-4h58" stroke-width="6"/><rect x="-32" y="-18" width="11" height="28" rx="4" fill="${dark}"/><rect x="21" y="-18" width="11" height="28" rx="4" fill="${dark}"/><rect x="-39" y="-13" width="7" height="18" rx="3" fill="${tone}"/><rect x="32" y="-13" width="7" height="18" rx="3" fill="${tone}"/></g>`,
      water_bottle: `<g data-detail="agua-colorida"><rect x="-16" y="-28" width="32" height="60" rx="10" fill="#f3fcff" stroke="${ink}" stroke-width="3"/><path d="M-12-2h24v22q0 7-9 8H-3q-9-1-9-8Z" fill="${safeColor(settings.waterColor, '#64c9ed')}" opacity=".83"/><rect x="-10" y="-36" width="20" height="11" rx="3" fill="${tone}"/><path d="M-8-19h16" stroke="#fff" stroke-width="3"/></g>`,
      toothbrush: `<g data-detail="escova-de-dentes" transform="rotate(-25)"><rect x="-6" y="-28" width="12" height="69" rx="6" fill="${tone}" stroke="${ink}" stroke-width="2.5"/><rect x="-4" y="-10" width="8" height="38" rx="3" fill="${light}" opacity=".9"/><rect x="-10" y="-43" width="20" height="20" rx="6" fill="${dark}" stroke="${ink}" stroke-width="2"/><g stroke="#e2f7ff" stroke-width="3" stroke-linecap="round"><path d="M-7-42v-10M-2-42v-12M3-42v-12M8-42v-10"/></g><circle cx="0" cy="19" r="3" fill="${dark}"/></g>`,
      wooden_tortoise: `<g data-detail="tartaruguinha-madeira"><ellipse cx="-19" cy="19" rx="12" ry="7" fill="#a97747"/><ellipse cx="20" cy="19" rx="12" ry="7" fill="#a97747"/>
        <ellipse cx="0" cy="4" rx="28" ry="23" fill="#bd9165" stroke="#815c42" stroke-width="3"/>
        <path d="M-25 1 0-15 24 1 0 25ZM0-15V25M-25 1h49" fill="none" stroke="#8a6549" stroke-width="2"/>
        <circle cx="28" cy="-2" r="15" fill="#d9b58a" stroke="#815c42" stroke-width="3"/><circle cx="33" cy="-6" r="3.5" fill="#554c4b"/><path d="M27 6q5 4 9 0" stroke="#745b50" stroke-width="2" fill="none"/></g>`,
      garden_carrot: `<g data-detail="cenoura-pedro-coelho" transform="rotate(19)"><path d="M0-18q-11-14-24-41 19-6 28 29 13-32 29-29Q23-24 6-13Z" fill="#72b880" stroke="#4f886a" stroke-width="3"/>
        <path d="M-21-14q20-9 42 0L5 54q-4 17-11 0Z" fill="#ed9958" stroke="#b56f47" stroke-width="3"/><path d="M-15 6h12m5 14h12m-17 14h8" stroke="#d27b49" stroke-width="2"/></g>`,
      chess_pieces: `<g fill="${tone}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round">
          <path d="M-20 19h19v-4h-2l-3-21 5-6-7-9-7 9 5 6-3 21h-7Z"/>
          <path d="M1 19h21v-4h-3l-2-22h4v-13H3v13h4l-2 22H1Z"/>
          <path d="M-8-27v11m-6-6h12M9-20v13" fill="none" stroke="${light}" stroke-width="3"/>
        </g>`,
      easter_eggs: `<g stroke="${ink}" stroke-width="2"><ellipse cx="-12" cy="3" rx="13" ry="21" fill="#ef80a6"/><ellipse cx="13" cy="3" rx="13" ry="21" fill="#79c9d7"/><path d="M-24 6q12 8 24 0M1 6q12 8 24 0" stroke="#fff3ab" stroke-width="5" fill="none"/><path d="M-17-10h10M8-10h10" stroke="#fff" stroke-width="3"/></g>`,
      brazil_flag: `<path d="M-2-28v58" stroke="#8d6b4f" stroke-width="4"/><path d="M0-27h39v27H0Z" fill="#399860" stroke="#285946" stroke-width="1.7"/><path d="m19-24 16 10-16 11-16-11Z" fill="#f8d460"/><circle cx="19" cy="-14" r="7" fill="#31549d"/><path d="M13-16q7 1 12 6" stroke="#fff" fill="none" stroke-width="1.5"/>`,
      wooden_top: `<path d="M0-26v9m-19 8 19-10 19 10v10q-3 18-19 23Q-16 19-19 1Z" fill="#c7844c" stroke="#6c4b3f" stroke-width="3"/><path d="M-19-1h38M-15 10h30" stroke="#f1c47d" stroke-width="5"/><path d="M0 24v10" stroke="#6c4b3f" stroke-width="3"/>`,
      halloween_pumpkin: `<g data-detail="abobora-vela-animada"><path d="M-24 5q-1-23 15-23 9 0 9 7 0-7 9-7 16 0 15 23 0 24-24 25Q-24 29-24 5Z" fill="#ea8d32" stroke="#a55333" stroke-width="3"/><path d="M0-14q-4-16 7-20" fill="none" stroke="#4e934f" stroke-width="5"/><path d="M-17 1-8-5l4 9Zm25-6 9 6-13 3Zm-18 18q10 11 20 0Z" fill="#603a3b"/><path d="M-11 13q11 9 22 0" fill="none" stroke="#f8ca55" stroke-width="2"/><rect x="-3" y="1" width="6" height="10" rx="2" fill="#fff0bf"/><path d="M0-1q-8-11 0-19 8 8 0 19Z" fill="#ffc94b"><animate attributeName="opacity" values=".65;1;.55;1;.65" dur="1.4s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="scale" values="1 1;1.2 1;0.8 1.1;1 1" dur="1.4s" repeatCount="indefinite"/></path></g>`,
      calendar: `<rect x="-24" y="-25" width="48" height="52" rx="5" fill="#fffef6" stroke="${ink}" stroke-width="3"/><path d="M-24-13h48" stroke="${tone}" stroke-width="14"/><path d="M-13-30v11m26-11v11" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><g fill="${dark}"><circle cx="-12" cy="-2" r="3"/><circle cy="-2" r="3"/><circle cx="12" cy="-2" r="3"/><circle cx="-12" cy="10" r="3"/><circle cy="10" r="3"/></g><path d="m6 10 5 5 9-12" stroke="#45a789" stroke-width="3" fill="none"/>`,
      moon_ball: `<circle r="23" fill="#c7cbd0" stroke="#7d8598" stroke-width="2.5"/><g fill="#929aa5" opacity=".82"><circle cx="-10" cy="-10" r="7"/><circle cx="11" cy="7" r="9"/><circle cx="9" cy="-13" r="4"/><circle cx="-14" cy="12" r="3"/></g><path d="M-21-7q7-12 17-14" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`,
      apple: `<path d="M0-18q-22-18-25 7-4 25 17 36Q0 29 8 25q21-11 17-36-3-25-25-7Z" fill="#e9555d" stroke="#a74449" stroke-width="3"/><path d="M0-18q-1-11 6-17" stroke="#745442" stroke-width="4" fill="none"/><path d="M1-26q9-12 19-6-1 13-19 12Z" fill="#6aaf6b"/>`,
      pear: `<path d="M-12-10q6-12 3-20h18q-3 8 3 20 17 11 11 28-8 18-23 14-20 3-24-14-5-17 12-28Z" fill="#acd36d" stroke="#6c9652" stroke-width="3"/><path d="M0-29v-9" stroke="#765541" stroke-width="4"/><path d="M0-34q10-7 17-3-4 10-17 9Z" fill="#3d9c6a"/>`,
      grapes: `<path d="M-2-24q-1-9 12-15" fill="none" stroke="#6a8552" stroke-width="4"/><path d="M-4-32q-13-7-20-1 4 11 20 9Z" fill="#5eac69"/><g fill="#8f72c6" stroke="#614e9c" stroke-width="2"><circle cx="-11" cy="-17" r="9"/><circle cx="9" cy="-17" r="9"/><circle cx="-20" cy="-2" r="9"/><circle r="10"/><circle cx="19" cy="-2" r="9"/><circle cx="-10" cy="14" r="9"/><circle cx="10" cy="14" r="9"/><circle cy="27" r="8"/></g>`,
      yogurt: `<path d="M-19-20h38l-5 50h-28Z" fill="#fffdf8" stroke="${ink}" stroke-width="3"/><rect x="-21" y="-25" width="42" height="9" rx="3" fill="${tone}" stroke="${ink}" stroke-width="2"/><circle cy="5" r="10" fill="#e77fa3"/><path d="M-5 4q6-8 12 0" fill="none" stroke="#fff" stroke-width="3"/>`,
      salad: `<path d="M-25 4h50q-2 26-25 27Q-23 30-25 4Z" fill="#eee9dc" stroke="${ink}" stroke-width="3"/><path d="M-20 5q-10-13 0-20 11-7 15 6 0-24 17-20 14 9 2 25Q25-24 29-9q-1 14-12 16Z" fill="#76bd74" stroke="#4e995f" stroke-width="2"/><circle cx="-8" cy="4" r="6" fill="#eb7465"/><circle cx="12" cy="1" r="6" fill="#f3b855"/>`,
      bread: `<path d="M-21 26v-37q-7-19 10-23 11-7 20 3 16-4 16 17v40Z" fill="#db9b57" stroke="#985e41" stroke-width="3"/><path d="M-15 20v-32q-4-12 9-15 12-4 18 5 10 0 7 12v30Z" fill="#f6d397"/><path d="M-8-2h2m12 9h2" stroke="#cd9c60" stroke-width="4" stroke-linecap="round"/>`,
      egg: `<ellipse cy="1" rx="19" ry="27" fill="#fff6df" stroke="#c6bfae" stroke-width="3"/><ellipse cx="-7" cy="-11" rx="7" ry="4" fill="#fff" opacity=".65"/>`,
      abc_blocks: `<g data-detail="blocos-empilhados-abc" font-family="system-ui,sans-serif" font-weight="900" font-size="20" text-anchor="middle" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round">
        <rect x="-15" y="-40" width="31" height="31" rx="5" fill="#f5c961"/><text x=".5" y="-17" stroke="none" fill="#754d69">A</text>
        <rect x="-32" y="-7" width="31" height="31" rx="5" fill="#8cd2b8"/><text x="-16.5" y="16" stroke="none" fill="#426f76">B</text>
        <rect x="2" y="-7" width="31" height="31" rx="5" fill="#f5a2bf"/><text x="17.5" y="16" stroke="none" fill="#8d4d7a">C</text>
      </g>`,
      dna_helix: `<g data-detail="dupla-helice-dna" fill="none" stroke-linecap="round">
        <path d="M-17-41C26-25 26-14-17 0 26 14 26 25-17 41" stroke="${tone}" stroke-width="7"/>
        <path d="M17-41C-26-25-26-14 17 0-26 14-26 25 17 41" stroke="${dark}" stroke-width="7"/>
        <path d="M-13-31h26M-7-19h14M-16-6h32M-16 7h32M-7 19h14M-13 31h26" stroke="#f4cc70" stroke-width="5"/>
      </g>`
    };
    for (const id of ['mercury_ball', 'venus_ball', 'earth_ball', 'mars_ball', 'jupiter_ball', 'saturn_ball', 'uranus_ball', 'neptune_ball']) {
      items[id] = planetBallSVG(id);
    }
    // Instrumentos são mais largos que as bolas: a posição padrão (x=29)
    // recortava as teclas do mini teclado e o corpo/braço do violão na borda
    // esquerda do viewBox 210x340. Mantemos os outros brinquedos intactos.
    const handPositions = { mini_keyboard: 85, guitar: 88, abc_blocks: 75, brazil_flag: 56, saturn_ball: 48 };
    return chosen.filter(key => Object.hasOwn(items, key))
      .map(key => `<g data-toy="${key}" data-placement="hand" transform="translate(${handPositions[key] ?? 29} 237)">${items[key]}</g>`).join('');
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
    const skates = `${sneaker}<path d="M5 29h39" stroke="${shade(shoes, -.3)}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="11" cy="36" r="5.5" fill="${shoes}" stroke="${shade(shoes, -.3)}" stroke-width="2"/>
      <circle cx="37" cy="36" r="5.5" fill="${shoes}" stroke="${shade(shoes, -.3)}" stroke-width="2"/>
      <circle cx="11" cy="36" r="2" fill="${shade(shoes, .65)}"/>
      <circle cx="37" cy="36" r="2" fill="${shade(shoes, .65)}"/>`;
    const sockPattern = settings.sockPattern === 'stripes'
      ? `<path d="M15 13h25M9 20h35" stroke="${shade(shoes, .6)}" stroke-width="3.5"/>`
      : settings.sockPattern === 'dots'
        ? `<g fill="${shade(shoes, .65)}"><circle cx="22" cy="13" r="3"/><circle cx="34" cy="19" r="3"/><circle cx="13" cy="21" r="3"/></g>` : '';
    const footwear = settings.footwearStyle === 'flipflops' ? flipflop
      : settings.footwearStyle === 'barefoot' ? barefoot
        : settings.footwearStyle === 'socks' ? socks + sockPattern
          : settings.footwearStyle === 'skates' ? skates : sneaker;
    const footwearY = settings.footwearStyle === 'skates' ? 297 : 304;
    const groundShadow = Array.isArray(settings.toys) && settings.toys.includes('skateboard') ? ''
      : '<ellipse cx="105" cy="327" rx="74" ry="9" fill="#243f59" opacity=".13"/>';
    const oneLegSaci = Array.isArray(settings.toys) && settings.toys.includes('saci_costume');
    if (oneLegSaci) return `<g data-layer="pernas-originais-do-app" data-saci-one-leg="true">
      ${groundShadow}<path d="M70 229h72l-20 45H77Z" fill="#cc3e49"/>
      <path d="M71 270h29l-5 46H73Z" fill="${skin}"/>
      <path d="M72 303h24v12H72Z" fill="${skin}"/>
      <g data-layer="tenis-esquerdo" data-footwear="${settings.footwearStyle || 'sneakers'}" transform="translate(60 ${footwearY})">${footwear}</g>
    </g>`;
    return `<g data-layer="pernas-originais-do-app">
      ${groundShadow}
      ${legs}${clothing}
      <path d="M72 303h24v12H72Zm41 0h24v12h-24Z" fill="${shorts || skirt || diaper || settings.footwearStyle === 'barefoot' || settings.footwearStyle === 'flipflops' ? skin : shade(bottoms, -.08)}"/>
      <g data-layer="tenis-esquerdo" data-footwear="${settings.footwearStyle || 'sneakers'}" transform="translate(60 ${footwearY})">${footwear}</g>
      <g data-layer="tenis-direito" data-footwear="${settings.footwearStyle || 'sneakers'}" transform="translate(150 ${footwearY}) scale(-1 1)">${footwear}</g>
    </g>`;
  }

  function avatarBody(settings = {}) {
    const colors = palette(settings);
    const hoodCoversHair = Array.isArray(settings.accessories) && settings.accessories.includes('hooded_cape');
    const rapunzel = !hoodCoversHair && settings.avatarStyle === 'rapunzel';
    const rapunzelHair = {
      source: 'rapunzel-conto-ilustracao',
      back: `<path d="M117 181Q88 64 174 37q49-32 104 0 91 28 70 144l-30 267q-28 21-49-4l20-264H169l20 265q-25 22-47-5Z" fill="{{HAIR_DARK}}" stroke="{{HAIR_DEEP}}" stroke-width="9"/>`,
      front: `<path d="M117 159Q95 36 222 35q130-1 128 122-11-31-40-55-30-27-53-20-57 42-139 40Z" fill="{{HAIR}}" stroke="{{HAIR_DARK}}" stroke-width="9"/><path d="M143 98q62-65 130-31M286 73q31 15 44 40" stroke="{{HAIR_LIGHT}}" stroke-width="12" fill="none" stroke-linecap="round"/>`
    };
    const hair = hoodCoversHair
      ? { source: '', back: '', front: '' }
      : rapunzel ? rapunzelHair
      : settings.avatarStyle === 'bald'
      ? { source: '', back: '<path d="M120 161v-28c0-57 46-89 112-89s112 32 112 89v28Z" fill="{{SKIN_LIGHT}}"/>', front: '' }
      : parts.hair[settings.avatarStyle] || parts.hair.puffs;
    const hairGeometry = (markup) => settings.avatarStyle === 'flower_heart'
      ? `<g transform="translate(464 0) scale(-1 1)">${markup}</g>` : markup;
    const outfit = parts.outfit[settings.outfitStyle] || (settings.outfitStyle === 'doctor_coat'
      ? parts.outfit.coat : settings.outfitStyle === 'carnival_tank' ? parts.outfit.tank : parts.outfit.hoodie);
    const source = (filename) => (filename || '').replace(/\.svg$/, '');
    const pet = settings.petId && allPetParts[settings.petId];
    // Fundo e pés compartilham a linha de chão y=331. xMidYMax evita que
    // pelúcias de proporções diferentes flutuem dentro da caixa SVG.
    const plushShadow = pet ? '<ellipse data-layer="pelucia-sombra" cx="166" cy="328" rx="34" ry="5" fill="#243f59" opacity=".12"/>' : '';
    const companion = pet ? `<svg data-layer="pet-original" data-source="${pet.source}" x="117" y="227" width="90" height="104" viewBox="${plushViewBox(pet)}" preserveAspectRatio="xMidYMax meet">${pet.body}</svg>` : '';
    const skating = Array.isArray(settings.toys) && settings.toys.includes('skateboard');
    const preset = Object.hasOwn(presetParts, settings.sourceSvg) ? presetParts[settings.sourceSvg] : null;
    const edits = Array.isArray(settings.presetEdits) ? settings.presetEdits : [];
    // Dois SVGs originais têm silhuetas de base que exigem centralização
    // consistente para trocar a roupa sem deixar ombros e mangas deslocados.
    // Bruno vem com eixo x=256 (24 unidades à direita do padrão x=232).
    // Gabriel já possui eixo x=232, mas passa pelo mesmo compositor de
    // camadas para garantir roupa nova à frente do tronco original.
    const fittedPreset = settings.sourceSvg === '132848-boy.svg' || settings.sourceSvg === '66797-boy.svg';
    const presetShift = settings.sourceSvg === '66797-boy.svg' ? -24 : 0;
    const alignPreset = (markup) => fittedPreset
      ? `<g data-align-preset="${source(settings.sourceSvg)}" transform="translate(${presetShift} 0)">${markup}</g>`
      : markup;
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
        // Centralizar as peças originais (inclusive pele/cabelo) juntas.
        // Roupa modular usa o eixo padrão e deve ficar fora desse deslocamento.
        return fittedPreset ? `${alignPreset(body)}${selectedOutfit}${alignPreset(hairFront)}`
          : `${body}${selectedOutfit}${hairFront}`;
      }
      return alignPreset(preset.segments.map(piece => originalLayer(piece.role, piece.svg)).join(''));
    };
    const upperBody = preset && edits.length === 0 && !hoodCoversHair
      ? `${alignPreset(`<svg data-layer="avatar-pronto" data-source="${source(settings.sourceSvg)}" width="464" height="464" viewBox="${preset.viewBox}" preserveAspectRatio="xMidYMax meet">${preset.body}</svg>`)}`
      : preset && (edits.includes('avatarStyle') || hoodCoversHair)
        ? `<g data-layer="cabelo-atras">${tint(hairGeometry(hair.back), colors)}</g>
          <g data-layer="rosto-original">${tint(parts.face.svg, colors)}</g>
          <g data-layer="roupa-original">${edits.includes('outfitStyle') ? selectedOutfit : alignPreset(originalLayer('outfit', preset.layers.outfit))}</g>
          <g data-layer="cabelo-frente">${tint(hairGeometry(hair.front), colors)}</g>`
      : preset
        ? `<g data-layer="avatar-pronto-em-edicao">${presetPieces()}</g>`
      : `<g data-layer="cabelo-atras" data-source="${source(hair.source)}">${tint(hairGeometry(hair.back), colors)}</g>
        <g data-layer="rosto-original" data-source="${source(parts.face.source)}">${tint(parts.face.svg, colors)}</g>
        <g data-layer="roupa-original" data-source="${source(outfit.source)}">${outfitSVG(settings.outfitStyle, outfit, colors)}</g>
        <g data-layer="cabelo-frente" data-source="${source(hair.source)}">${tint(hairGeometry(hair.front), colors)}</g>`;
    return `${plushShadow}
      <g data-layer="avatar-completo"${skating ? ' transform="translate(0 -14)"' : ''}>
        ${lowerBody(settings, colors.SKIN)}
        ${rapunzel ? `<g data-layer="rapunzel-trancas-compridas">${tint(`<path d="M70 105Q41 158 57 203T56 296q-4 19 13 18 19-4 13-22-8-57-5-91t3-101M141 107q43 52 29 102t5 88q7 19-13 20-17-4-12-22 9-54 4-91t-14-97" fill="none" stroke="{{HAIR_DEEP}}" stroke-width="20" stroke-linecap="round"/><path d="M70 105Q41 158 57 203T56 296q-4 19 13 18 19-4 13-22-8-57-5-91t3-101M141 107q43 52 29 102t5 88q7 19-13 20-17-4-12-22 9-54 4-91t-14-97" fill="none" stroke="{{HAIR}}" stroke-width="14" stroke-linecap="round"/>${Array.from({length:9}, (_,i)=>`<path d="M${i%2?52:63} ${139+i*18}l19 10M${i%2?163:156} ${140+i*18}l17-9" stroke="{{HAIR_LIGHT}}" stroke-width="3.5" opacity=".9"/>`).join('')}`, colors)}</g>` : ''}
        <g data-layer="tronco" transform="translate(0 34) scale(0.452586)">
          ${toysSVG(settings, colors, 'back')}
          ${accessoriesSVG(settings, colors, 'back')}
          ${upperBody}
          ${accessoriesSVG(settings, colors)}
        </g>
        ${toysSVG(settings, colors, 'hand')}
        ${toysSVG(settings, colors, 'costume')}
      </g>
      ${toysSVG(settings, colors, 'floor')}${companion}`;
  }

  function avatarSymbol(id, settings) {
    if (!/^[a-z]+$/.test(id)) throw Error('ID de símbolo SVG inválido');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings = {}) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar infantil personalizável">${avatarBody(settings)}</svg>`;
  }
  window.LivrinhoAvatar = { hairStyles, outfitStyles, bottomStyles, footwearStyles, sockPatterns, petStyles,
    accessoryStyles, toyStyles, rewardBooks, rewardUnlocked, hairColors, outfitColors, bottomColors, shoeColors, accessoryColors, toyColors,
    avatarBody, avatarSymbol, avatarSVG };
})();
