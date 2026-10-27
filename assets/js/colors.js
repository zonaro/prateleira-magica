/* Integração offline com a biblioteca original NameToColor (zonaro/NameToColor).
 * Os dois arquivos originais são carregados antes deste adaptador.
 */
(() => {
  'use strict';
  const moods = [
    ['Vibrant', '🌈 Arco-íris animado'], ['Futuristic', '🚀 Viagem espacial'],
    ['Fun', '🎉 Dia de festa'], ['Soft Pastel', '🧁 Mundo dos docinhos'],
    ['Calm', '🌊 Mar tranquilo'], ['Vintage', '📻 Tempos antigos'],
    ['Organic', '🌿 Jardim encantado'], ['Sophisticated', '✨ Baile elegante'],
    ['Dark', '🌙 Noite estrelada'], ['Corporate', '💼 Dia de trabalho']
  ];
  const ids = new Set(moods.map(([id]) => id));
  const swatches = [
    ['#ff0000', 'Vermelho'], ['#ff7300', 'Laranja'], ['#ffcb00', 'Amarelo'],
    ['#53b949', 'Verde'], ['#078bca', 'Azul'], ['#5338ae', 'Roxo'],
    ['#f44e9a', 'Rosa'], ['#71402b', 'Marrom'], ['#161923', 'Preto'],
    ['#ffffff', 'Branco'], ['#969696', 'Cinza'], ['#41ccba', 'Turquesa'],
    ['#a5c637', 'Verde-limão'], ['#b77ddb', 'Lilás'], ['#f9a66a', 'Coral'],
    ['#9bcff5', 'Azul-claro'], ['#f3dbac', 'Bege'], ['#cf8d3d', 'Ocre']
  ];
  const validHex = (value) => /^#[\da-f]{6}$/i.test(value || '');
  const hex = (value) => {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw || raw.length > 120) return null;
    try {
      const color = window.generateColor(raw);
      const normalized = String(color).slice(0, 7);
      return validHex(normalized) ? normalized.toLowerCase() : null;
    } catch { return null; }
  };
  function rgb(color) { return [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)); }
  function mix(a, b, fraction) {
    const aa = rgb(a), bb = rgb(b);
    return '#' + aa.map((value, index) => Math.round(value * (1 - fraction) + bb[index] * fraction)
      .toString(16).padStart(2, '0')).join('');
  }
  function closestFriendlyName(color) {
    const [r, g, b] = rgb(color);
    // Distância ponderada: aproxima as cores que crianças reconhecem pelo nome.
    return swatches.reduce((best, [sample, name]) => {
      const [sr, sg, sb] = rgb(sample);
      const redMean = (r + sr) / 2;
      const distance = (2 + redMean / 256) * (r - sr) ** 2
        + 4 * (g - sg) ** 2 + (2 + (255 - redMean) / 256) * (b - sb) ** 2;
      return distance < best.distance ? { name, distance } : best;
    }, { name: 'Cor', distance: Infinity }).name;
  }
  function name(color) {
    if (!validHex(color)) return '';
    try {
      const brazilian = window.nameToColorPtBRPack?.colorNames || {};
      const translated = new Set(Object.values(brazilian).flat());
      // O NameToColor sabe o nome exato ou o mais próximo. Quando o resultado
      // não está traduzido, procuramos o tom próximo dentre os 181 tons pt-BR.
      const exact = window.colorName(color, 'pt-BR');
      if (exact && translated.has(exact)) return exact;
      const closest = window.closestName(color, 'pt-BR');
      if (closest && translated.has(closest)) return closest;
      if (Object.keys(brazilian).length) {
        const [r, g, b] = rgb(color);
        const match = Object.entries(brazilian).reduce((best, [value, names]) => {
          const [sr, sg, sb] = rgb('#' + value);
          const redMean = (r + sr) / 2;
          const distance = (2 + redMean / 256) * (r - sr) ** 2 + 4 * (g - sg) ** 2
            + (2 + (255 - redMean) / 256) * (b - sb) ** 2;
          return distance < best.distance ? { name: names[0], distance } : best;
        }, { name: '', distance: Infinity });
        if (match.name) return match.name;
      }
    } catch { /* Nome infantil como fallback. */ }
    return closestFriendlyName(color);
  }
  function palette(mood) {
    if (!ids.has(mood)) return null;
    try {
      const colors = window.generateThemePalette(mood, 5);
      return Array.isArray(colors) && colors.length === 5 && colors.every(validHex)
        ? colors.map((color) => color.toLowerCase()) : null;
    } catch { return null; }
  }
  function harmonies(color, mood = 'Fun') {
    const base = validHex(color) ? color : '#f44e9a';
    return [
      { id: 'monochrome', title: '🎨 Uma família de cores', description: 'A mesma cor vestida de clarinho e escurinho. São irmãs da mesma família!', colors: window.generateMonochrome(base, 5) },
      { id: 'triadic', title: '🔺 Três amigas', description: 'Três amigas espalhadas pela roda das cores. Cada uma brilha sem brigar com a outra!', colors: window.generateTriadic(base) },
      { id: 'complementary', title: '🧲 Uma dupla diferente', description: 'Duas cores de lados opostos da roda. Juntas fazem uma festa de contrastes!', colors: [base, window.generateComplementary(base)] },
      { id: 'mood', title: '💖 Cores com sentimentos', description: 'É como escolher a música da aventura: uma paleta alegre, calma ou misteriosa muda o clima!', colors: palette(mood) || palette('Fun') }
    ];
  }
  function contrastWithWhite(color) {
    const [r, g, b] = rgb(color).map((x) => {
      const v = x / 255;
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    });
    return 1.05 / (.2126 * r + .7152 * g + .0722 * b + .05);
  }
  function readableAccent(color) {
    let result = color;
    for (let i = 0; i < 12 && contrastWithWhite(result) < 4.5; i++) result = mix(result, '#16283c', .17);
    return result;
  }
  function applyTheme(mood) {
    const root = document.documentElement;
    const colors = palette(mood);
    root.toggleAttribute('data-color-theme', Boolean(colors));
    const properties = ['--ink', '--muted', '--pink', '--pink-dark', '--violet', '--cyan', '--outline',
      '--theme-page', '--theme-hero', '--theme-card', '--theme-soft', '--theme-accent', '--theme-text'];
    if (!colors) { for (const property of properties) root.style.removeProperty(property); return; }
    const accent = readableAccent(colors[1]);
    const emphasis = readableAccent(colors[2]);
    const values = {
      '--ink': mix(colors[0], '#1b293a', .65), '--muted': mix(colors[0], '#617181', .62),
      '--pink': accent, '--pink-dark': emphasis, '--violet': readableAccent(colors[3]),
      '--cyan': readableAccent(colors[2]), '--outline': mix(colors[3], '#ffffff', .67),
      '--theme-page': mix(colors[4], '#fff9f1', .76),
      '--theme-hero': `linear-gradient(135deg,${mix(colors[1], '#ffffff', .78)},${mix(colors[3], '#ffffff', .74)},${mix(colors[2], '#ffffff', .81)})`,
      '--theme-card': mix(colors[4], '#ffffff', .9),
      '--theme-soft': mix(colors[3], '#ffffff', .81),
      '--theme-accent': accent, '--theme-text': mix(colors[0], '#223048', .65)
    };
    Object.entries(values).forEach(([key, value]) => root.style.setProperty(key, value));
  }
  const preferences = window.LivrinhoPreferences;
  if (preferences) {
    applyTheme(preferences.load().themeMood);
    document.addEventListener('livrinhos:protagonist-changed', () => applyTheme(preferences.load().themeMood));
  }
  window.LivrinhoColors = { moods, swatches, ids, hex, validHex, mix, name, palette, harmonies, applyTheme };
})();
