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

  /** Valor em HSV; útil para separar tinturas vivas de reflexos e do fundo. */
  function hsv(rgb) {
    const [r, g, b] = rgb.map((channel) => channel / 255);
    const high = Math.max(r, g, b), low = Math.min(r, g, b);
    const diff = high - low;
    let hue = 0;
    if (diff) {
      if (high === r) hue = ((g - b) / diff) % 6;
      else if (high === g) hue = (b - r) / diff + 2;
      else hue = (r - g) / diff + 4;
      hue = ((hue * 60) + 360) % 360;
    }
    return { hue, saturation: high === 0 ? 0 : diff / high, value: high };
  }

  /** Cor mais representativa do cabelo: privilegia tinturas saturadas e
   * clusters de matiz, sem transformar cabelo castanho/preto em cores neon
   * por causa de alguns pixels do fundo ou de reflexos isolados. */
  function dominantHairColor(samples) {
    if (!samples?.length) return null;
    const valid = samples.filter((rgb) => Array.isArray(rgb) && rgb.length === 3
      && rgb.every((value) => Number.isFinite(value) && value >= 0 && value <= 255));
    if (!valid.length) return null;
    const vivid = valid.map((rgb) => ({ rgb, ...hsv(rgb) }))
      .filter(({ saturation, value }) => saturation >= 0.29 && value >= 0.17 && value <= 0.97);
    if (vivid.length < Math.max(12, Math.round(valid.length * 0.16))) {
      return trimmedColor(valid, .10); // cabelo natural ou com pouca saturação
    }
    const bins = Array.from({ length: 18 }, () => ({ score: 0 }));
    for (const item of vivid) {
      bins[Math.floor(item.hue / 20) % 18].score += item.saturation ** 2;
    }
    const scores = bins.map((bin, index) =>
      bin.score + bins[(index + 17) % 18].score * .40 + bins[(index + 1) % 18].score * .40);
    const best = scores.indexOf(Math.max(...scores));
    const targetHue = (best + .5) * 20;
    const dominant = vivid.filter((item) =>
      Math.abs(((item.hue - targetHue + 540) % 360) - 180) <= 27);
    if (dominant.length < Math.max(8, valid.length * .10)) return trimmedColor(valid, .10);
    const sum = [0, 0, 0], weights = dominant.reduce((total, item) => {
      const weight = .4 + item.saturation ** 2 * 2;
      for (let i = 0; i < 3; i++) sum[i] += item.rgb[i] * weight;
      return total + weight;
    }, 0);
    return hexFromRGB(sum.map((channel) => channel / weights));
  }

  window.LivrinhoAvatarPhotoColors = {
    rgbFromHex, hexFromRGB, nearestColor, trimmedColor, hsv, dominantHairColor
  };
})();
