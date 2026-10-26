/* Personalização local: nenhum dado da criança é enviado a servidores. */
(() => {
  'use strict';
  const STORAGE_KEY = 'prateleira-de-livrinhos:protagonista:v1';
  const DEFAULTS = Object.freeze({
    name: 'Ellie',
    pronunciation: 'Éli',
    gender: 'feminino',
    avatarStyle: 'puffs',
    skinColor: '#e9aa83'
  });
  const styles = ['puffs', 'short', 'long', 'curly', 'cap'];
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
    return {
      name,
      pronunciation,
      gender: Object.hasOwn(genders, input.gender) ? input.gender : DEFAULTS.gender,
      avatarStyle: styles.includes(input.avatarStyle) ? input.avatarStyle : DEFAULTS.avatarStyle,
      skinColor: /^#[0-9a-f]{6}$/i.test(input.skinColor || '') ? input.skinColor.toLowerCase() : DEFAULTS.skinColor
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

  function color(hex, fallback) { return /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback; }
  function hairPath(style) {
    switch (style) {
      case 'short': return '<path d="M47 92Q35 25 101 21q69-6 67 75-18-29-29-37-24 29-92 33" fill="#493a55"/>';
      case 'long': return '<path d="M47 86Q31 32 104 18q69-4 66 78l10 103h-26l-9-78H66l-8 79H31z" fill="#493a55"/><path d="M49 87Q57 27 109 34q40 5 56 51-31-13-42-30-28 29-74 32" fill="#493a55"/>';
      case 'curly': return '<g fill="#493a55"><circle cx="57" cy="65" r="27"/><circle cx="83" cy="37" r="28"/><circle cx="119" cy="36" r="27"/><circle cx="148" cy="59" r="26"/><circle cx="47" cy="99" r="22"/><circle cx="166" cy="99" r="22"/></g>';
      case 'cap': return '<path d="M47 85q1-65 59-65 60 0 61 65z" fill="#5e80da"/><path d="M39 83h145q-8 22-37 18H42z" fill="#4167bc"/>';
      default: return '<path d="M46 88Q32 23 105 18q69-3 65 74l-16 57H57z" fill="#493a55"/><circle cx="31" cy="54" r="29" fill="#493a55"/><circle cx="178" cy="54" r="29" fill="#493a55"/><path d="M48 86q12-44 50-47 34-2 58 47-24-9-35-28-30 29-73 28" fill="#493a55"/>';
    }
  }

  function avatarBody(input = load()) {
    const settings = clean(input);
    const skin = color(settings.skinColor, '#e9aa83');
    const shirt = settings.gender === 'masculino' ? '#6e9beb' : settings.gender === 'neutro' ? '#9b8ae5' : '#fa7195';
    return `<ellipse cx="103" cy="319" rx="77" ry="13" fill="#274b69" opacity=".12"/>
      <path d="M66 237h30l-7 78H63zm50 0h28l11 78h-29z" fill="#5775bd"/>
      <path d="M59 305h39v17H53q-7-12 6-17m70 0h35q14 8 7 17h-46z" fill="#6055a2"/>
      <path d="M50 147q55-30 112 0l10 111H41z" fill="${shirt}"/>
      <path d="M51 154q-18 18-24 69m134-69q17 13 24 70" fill="none" stroke="${skin}" stroke-width="21" stroke-linecap="round"/>
      ${settings.avatarStyle === 'long' ? '<path d="M43 93q-21 41-13 100h30l9-92zm119 0q22 43 17 101h-31l-6-94z" fill="#493a55"/>' : ''}
      <ellipse cx="106" cy="100" rx="60" ry="65" fill="${skin}"/>
      ${hairPath(settings.avatarStyle)}
      <circle cx="84" cy="106" r="5" fill="#2e3048"/><circle cx="129" cy="106" r="5" fill="#2e3048"/>
      <path d="M93 131q14 14 27-1" fill="none" stroke="#894960" stroke-width="5" stroke-linecap="round"/>
      <circle cx="62" cy="119" r="11" fill="#f68d9b" opacity=".36"/><circle cx="150" cy="119" r="11" fill="#f68d9b" opacity=".36"/>
      <path d="M91 162l15 15 15-15" fill="none" stroke="#fff7fb" stroke-width="7" stroke-linecap="round"/>`;
  }

  function avatarSymbol(id = 'ellie', settings = load()) {
    if (!/^[a-z]+$/.test(id)) throw Error('Invalid SVG symbol id');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings = load()) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar personalizável">${avatarBody(settings)}</svg>`;
  }

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

  window.LivrinhoPreferences = { DEFAULTS, styles, genders, load, save, clean, personalize, avatarSymbol, avatarSVG, personalizeIllustration };
})();
