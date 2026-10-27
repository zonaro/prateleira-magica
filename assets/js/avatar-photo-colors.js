/* Utilitários de cor puros para o criador de avatares por foto (sem dependências). */
(() => {
  'use strict';

  function rgbFromHex(hex) {
    if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
      throw new TypeError('Cor HEX inválida.');
    }
    return [1, 3, 5].map((p) => parseInt(hex.slice(p, p + 2), 16));
  }

  function hexFromRGB(rgb) {
    if (!Array.isArray(rgb) || rgb.length !== 3 || !rgb.every(Number.isFinite)) {
      throw new TypeError('Cor RGB inválida.');
    }
    return '#' + rgb.map((n) => Math.max(0, Math.min(255, Math.round(n)))
      .toString(16).padStart(2, '0')).join('');
  }

  /** Menor distância euclidiana em RGB. A paleta contém HEX ou [HEX, legenda]. */
  function nearestColor(rgbOrHex, palette) {
    const rgb = typeof rgbOrHex === 'string' ? rgbFromHex(rgbOrHex) : rgbOrHex;
    if (!Array.isArray(rgb) || rgb.length !== 3 || !rgb.every(Number.isFinite)
      || !Array.isArray(palette) || !palette.length) {
      throw new TypeError('Cor ou paleta inválida.');
    }
    let winner = null;
    let best = Infinity;
    for (const entry of palette) {
      const hex = Array.isArray(entry) ? entry[0] : entry;
      const target = rgbFromHex(hex);
      const distance = rgb.reduce((sum, value, i) => sum + (value - target[i]) ** 2, 0);
      if (distance < best) {
        best = distance;
        winner = hex.toLowerCase();
      }
    }
    return winner;
  }

  /** Média aparada por canal, diminuindo a influência de reflexos e sombras. */
  function trimmedColor(samples, trim = 0.15) {
    if (!samples.length) return null;
    return hexFromRGB([0, 1, 2].map((channel) => {
      const values = samples.map((rgb) => rgb[channel]).sort((a, b) => a - b);
      const cut = Math.min(Math.floor(values.length * trim), Math.floor((values.length - 1) / 2));
      const selected = values.slice(cut, values.length - cut);
      return selected.reduce((sum, value) => sum + value, 0) / selected.length;
    }));
  }

  window.LivrinhoAvatarPhotoColors = { rgbFromHex, hexFromRGB, nearestColor, trimmedColor };
})();
