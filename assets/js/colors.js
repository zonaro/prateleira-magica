/* Integração offline com a biblioteca original NameToColor (zonaro/NameToColor). */
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
    ['#ff0000', 'Vermelho'], ['#00ff00', 'Verde'], ['#0000ff', 'Azul'],
    ['#ffff00', 'Amarelo'], ['#ff00ff', 'Magenta'], ['#00ffff', 'Ciano'],
    ['#000000', 'Preto'], ['#ffffff', 'Branco'],
    ['#ff7300', 'Laranja'], ['#ffcb00', 'Amarelo-laranja'], ['#53b949', 'Verde'],
    ['#078bca', 'Azul'], ['#5338ae', 'Roxo'], ['#f44e9a', 'Rosa'],
    ['#71402b', 'Marrom'], ['#161923', 'Preto'], ['#969696', 'Cinza'],
    ['#41ccba', 'Turquesa'], ['#a5c637', 'Verde-limão'], ['#b77ddb', 'Lilás'],
    ['#f9a66a', 'Coral'], ['#9bcff5', 'Azul-claro'], ['#f3dbac', 'Bege'],
    ['#cf8d3d', 'Ocre']
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
      { id: 'monochrome', title: '🎨 Uma família de cores', description: 'A mesma cor vestida de clarinho e escurinho.', colors: window.generateMonochrome(base, 5) },
      { id: 'triadic', title: '🔺 Três amigas', description: 'Três cores em harmonia.', colors: window.generateTriadic(base) },
      { id: 'complementary', title: '🧲 Uma dupla diferente', description: 'Cores contrastantes.', colors: [base, window.generateComplementary(base)] },
      { id: 'mood', title: '💖 Cores com sentimentos', description: 'Paleta com o clima escolhido.', colors: palette(mood) || palette('Fun') }
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
  function temperature(color) {
    if (!validHex(color)) return '';
    try {
      if (typeof window.temperature === 'function') {
        const result = window.temperature(color);
        return result ? String(result) : '';
      }
      if (window.NameToColor && typeof window.NameToColor.temperature === 'function') {
        const result = window.NameToColor.temperature(color);
        return result ? String(result) : '';
      }
    } catch { }
    return '';
  }
  function applyTheme(mood) {
    const root = document.documentElement;
    const colors = palette(mood);
    root.toggleAttribute('data-color-theme', Boolean(colors));
    const properties = ['--ink', '--muted', '--pink', '--pink-dark', '--violet', '--cyan', '--outline',
      '--theme-page', '--theme-hero', '--theme-card', '--theme-soft', '--theme-accent', '--theme-text',
      '--theme-bg', '--theme-surface', '--theme-border', '--theme-highlight', '--theme-gradient-start', '--theme-gradient-mid', '--theme-gradient-end'];
    if (!colors) { 
      for (const property of properties) root.style.removeProperty(property); 
      // Remove aggressive classes
      document.body.classList.remove('theme-enhanced');
      return; 
    }
    const accent = readableAccent(colors[1]);
    const emphasis = readableAccent(colors[2]);
    const values = {
      '--ink': mix(colors[0], '#1b293a', .65), 
      '--muted': mix(colors[0], '#617181', .62),
      '--pink': accent, 
      '--pink-dark': emphasis, 
      '--violet': readableAccent(colors[3]),
      '--cyan': readableAccent(colors[2]), 
      '--outline': mix(colors[3], '#ffffff', .67),
      '--theme-page': mix(colors[4], '#fff9f1', .76),
      '--theme-hero': `linear-gradient(135deg,${mix(colors[1], '#ffffff', .72)},${mix(colors[3], '#ffffff', .68)},${mix(colors[2], '#ffffff', .75)})`,
      '--theme-card': mix(colors[4], '#ffffff', .88),
      '--theme-soft': mix(colors[3], '#ffffff', .78),
      '--theme-accent': accent, 
      '--theme-text': mix(colors[0], '#223048', .65),
      '--theme-bg': mix(colors[4], '#fdf7f0', .82),
      '--theme-surface': mix(colors[4], '#ffffff', .92),
      '--theme-border': mix(colors[3], '#e8dcd0', .60),
      '--theme-highlight': mix(colors[2], '#ffffff', .70),
      '--theme-gradient-start': mix(colors[1], '#ffffff', .65),
      '--theme-gradient-mid': mix(colors[3], '#ffffff', .62),
      '--theme-gradient-end': mix(colors[2], '#ffffff', .68)
    };
    Object.entries(values).forEach(([key, value]) => root.style.setProperty(key, value));
    document.body.classList.add('theme-enhanced');
  }
  const preferences = window.LivrinhoPreferences;
  if (preferences) {
    applyTheme(preferences.load().themeMood);
    document.addEventListener('livrinhos:protagonist-changed', () => applyTheme(preferences.load().themeMood));
  }
  function randomNamedColor() {
    try {
      const database = window.colorDatabase;
      if (database && typeof database === 'object') {
        const keys = Object.keys(database);
        if (keys.length) {
          const key = keys[Math.floor(Math.random() * keys.length)];
          const hexValue = '#' + key;
          if (validHex(hexValue)) {
            return { hex: hexValue.toLowerCase(), key };
          }
        }
      }
    } catch {}
    if (swatches.length) {
      const [hexValue] = swatches[Math.floor(Math.random() * swatches.length)];
      return { hex: hexValue.toLowerCase() };
    }
    return { hex: '#f44e9a' };
  }
  window.LivrinhoColors = { moods, swatches, ids, hex, validHex, mix, name, palette, harmonies, temperature, randomNamedColor, applyTheme };
})();
