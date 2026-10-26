/* Personalização local: nenhum dado da criança é enviado a servidores. */
(() => {
  'use strict';
  const avatar = window.LivrinhoAvatar;
  if (!avatar) throw Error('O módulo de avatares precisa ser carregado antes das preferências.');
  const STORAGE_KEY = 'prateleira-de-livrinhos:protagonista:v1';
  const DEFAULTS = Object.freeze({
    name: 'Ellie',
    pronunciation: 'Éli',
    gender: 'feminino',
    avatarStyle: 'puffs',
    skinColor: '#e9aa83',
    hairColor: '#493a55',
    outfitStyle: 'hoodie',
    outfitColor: '#fa7195'
  });
  const styles = avatar.hairStyles.map(([key]) => key);
  const outfits = avatar.outfitStyles.map(([key]) => key);
  const genders = {
    masculino: { pronome: 'ele', possessivo: 'dele' },
    feminino: { pronome: 'ela', possessivo: 'dela' },
    neutro: { pronome: 'elu', possessivo: 'delu' }
  };
  let memory = { ...DEFAULTS };
  const svgSources = new Map();

  function clean(value) {
    const input = value && typeof value === 'object' ? value : {};
    const name = String(input.name ?? DEFAULTS.name).trim().slice(0, 32) || DEFAULTS.name;
    const pronunciation = String(input.pronunciation ?? DEFAULTS.pronunciation).trim().slice(0, 64) || name;
    const legacyShirtColor = input.gender === 'masculino' ? '#6e9beb' : input.gender === 'neutro' ? '#9b8ae5' : DEFAULTS.outfitColor;
    return {
      name,
      pronunciation,
      gender: Object.hasOwn(genders, input.gender) ? input.gender : DEFAULTS.gender,
      avatarStyle: styles.includes(input.avatarStyle) ? input.avatarStyle : DEFAULTS.avatarStyle,
      outfitStyle: outfits.includes(input.outfitStyle) ? input.outfitStyle : DEFAULTS.outfitStyle,
      skinColor: /^#[0-9a-f]{6}$/i.test(input.skinColor || '') ? input.skinColor.toLowerCase() : DEFAULTS.skinColor,
      hairColor: /^#[0-9a-f]{6}$/i.test(input.hairColor || '') ? input.hairColor.toLowerCase() : DEFAULTS.hairColor,
      outfitColor: /^#[0-9a-f]{6}$/i.test(input.outfitColor || '') ? input.outfitColor.toLowerCase() : legacyShirtColor
    };
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) memory = clean(JSON.parse(saved));
    } catch { /* private browsing can disable storage */ }
    return { ...memory };
  }

  function save(values) {
    memory = clean(values);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch { /* keep an in-memory copy */ }
    document.dispatchEvent(new CustomEvent('livrinhos:protagonist-changed', { detail: { ...memory } }));
    return { ...memory };
  }

  function xmlEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function personalize(value, settings = load(), asXml = false) {
    if (value == null) return '';
    const grammar = genders[settings.gender] || genders.feminino;
    const name = asXml ? xmlEscape(settings.name) : settings.name;
    const tokens = {
      nome: name,
      pronome: grammar.pronome,
      Pronome: grammar.pronome[0].toUpperCase() + grammar.pronome.slice(1),
      possessivo: grammar.possessivo,
      Possessivo: grammar.possessivo[0].toUpperCase() + grammar.possessivo.slice(1)
    };
    return String(value)
      .replace(/\{\{(nome|pronome|Pronome|possessivo|Possessivo)\}\}/g, (_, key) => tokens[key])
      .replace(/\bEllie\b/g, () => name)
      .replace(/\bELLIE\b/g, () => asXml ? xmlEscape(settings.name.toLocaleUpperCase('pt-BR')) : settings.name.toLocaleUpperCase('pt-BR'));
  }

  const avatarSymbol = (id = 'ellie', settings = load()) => avatar.avatarSymbol(id, clean(settings));
  const avatarSVG = (settings = load()) => avatar.avatarSVG(clean(settings));
  async function personalizeIllustration(img, sourceUrl, settings = load()) {
    img.dataset.originalSource = sourceUrl;
    const requestId = String((Number(img.dataset.avatarRequest) || 0) + 1);
    img.dataset.avatarRequest = requestId;
    try {
      if (!svgSources.has(sourceUrl)) {
        svgSources.set(sourceUrl, fetch(sourceUrl).then((response) => {
          if (!response.ok) throw Error(`SVG HTTP ${response.status}`);
          return response.text();
        }).catch((error) => { svgSources.delete(sourceUrl); throw error; }));
      }
      const source = await svgSources.get(sourceUrl);
      if (img.dataset.avatarRequest !== requestId) return;
      const customized = personalize(source, settings, true).replace(/<symbol id="(ellie|kid|protagonist)"[^>]*>[\s\S]*?<\/symbol>/g,
        (_, id) => avatarSymbol(id, settings));
      const blobUrl = URL.createObjectURL(new Blob([customized], { type: 'image/svg+xml' }));
      const oldUrl = img.dataset.avatarBlob;
      img.dataset.avatarBlob = blobUrl;
      img.src = blobUrl;
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    } catch (error) {
      console.warn('Avatar na ilustração indisponível:', error);
      if (img.dataset.avatarRequest === requestId) img.src = sourceUrl;
    }
  }

  window.LivrinhoPreferences = { DEFAULTS, styles, outfits, genders, load, save, clean, personalize, avatarSymbol, avatarSVG, personalizeIllustration };
})();
