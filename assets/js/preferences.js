/* Personalização local: nenhum dado da criança é enviado a servidores. */
(() => {
  'use strict';
  const avatar = window.LivrinhoAvatar;
  if (!avatar) throw Error('O módulo de avatares precisa ser carregado antes das preferências.');
  const STORAGE_KEY = 'prateleira-de-livrinhos:protagonista:v1';
  const DEFAULTS = Object.freeze({
    name: 'Ellie',
    pronunciation: 'Éli',
    birthDate: '',
    gender: 'feminino',
    petId: null,
    avatarStyle: 'puffs',
    skinColor: '#e9aa83',
    hairColor: '#493a55',
    outfitStyle: 'hoodie',
    outfitColor: '#fa7195',
    bottomStyle: 'pants',
    bottomColor: '#5879b9',
    shoeColor: '#625a89',
    footwearStyle: 'sneakers',
    sockPattern: 'plain',
    accessoryColor: '#fa7195',
    themeMood: '',
    accessories: [],
    achievements: { books: {} }
  });
  const styles = avatar.hairStyles.map(([key]) => key);
  const outfits = avatar.outfitStyles.map(([key]) => key);
  const bottoms = avatar.bottomStyles.map(([key]) => key);
  const footwear = avatar.footwearStyles.map(([key]) => key);
  const sockPatterns = avatar.sockPatterns.map(([key]) => key);
  const pets = avatar.petStyles.map(([key]) => key);
  const accessoryGroups = Object.fromEntries(avatar.accessoryStyles.map(([id, , group]) => [id, group]));
  const genders = {
    masculino: { pronome: 'ele', possessivo: 'dele' },
    feminino: { pronome: 'ela', possessivo: 'dela' },
    neutro: { pronome: 'elu', possessivo: 'delu' }
  };
  let memory = { ...DEFAULTS };
  const svgSources = new Map();

  function validBirthDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    if (year < 1900 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day || date.getTime() > Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) return '';
    return value;
  }

  function ageOnDate(birthDate, today = new Date()) {
    if (!validBirthDate(birthDate)) return null;
    const [year, month, day] = birthDate.split('-').map(Number);
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age;
  }

  function medalCount(profile) {
    return Object.values(profile?.achievements?.books || {}).filter((progress) =>
      progress?.medalEarnedAt || progress?.challengeCompletedAt).length;
  }

  function cleanAchievements(value) {
    const raw = value && typeof value === 'object' ? value.books : null;
    const books = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { books };
    for (const [id, entry] of Object.entries(raw).slice(0, 200)) {
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id) || !entry || typeof entry !== 'object') continue;
      const completedExercises = [...new Set((Array.isArray(entry.completedExercises) ? entry.completedExercises : [])
        .filter((number) => Number.isInteger(number) && number >= 0 && number <= 500))].sort((a, b) => a - b);
      const visitedPages = [...new Set((Array.isArray(entry.visitedPages) ? entry.visitedPages : [])
        .filter((number) => Number.isInteger(number) && number >= 0 && number <= 500))].sort((a, b) => a - b);
      const date = (value) => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value) ? value.slice(0, 35) : null;
      books[id] = {
        completedExercises,
        visitedPages,
        finished: entry.finished === true,
        finishedAt: date(entry.finishedAt),
        challengeCompletedAt: date(entry.challengeCompletedAt),
        medalEarnedAt: date(entry.medalEarnedAt) || date(entry.challengeCompletedAt)
      };
    }
    return { books };
  }

  function clean(value) {
    const input = value && typeof value === 'object' ? value : {};
    const name = String(input.name ?? DEFAULTS.name).trim().slice(0, 32) || DEFAULTS.name;
    const pronunciation = String(input.pronunciation ?? DEFAULTS.pronunciation).trim().slice(0, 64) || name;
    const legacyShirtColor = input.gender === 'masculino' ? '#6e9beb' : input.gender === 'neutro' ? '#9b8ae5' : DEFAULTS.outfitColor;
    const achievements = cleanAchievements(input.achievements);
    const medals = medalCount({ achievements });
    const accessories = [];
    for (const id of Array.isArray(input.accessories) ? input.accessories : []) {
      const group = accessoryGroups[id];
      if (group && (id !== 'plumber_beret' || medals >= 3)
          && !accessories.some((chosen) => accessoryGroups[chosen] === group)) accessories.push(id);
    }
    // Perfis antigos podiam guardar o boné como penteado. Agora ele é um
    // acessório combinável com cabelos, inclusive depois de importar backups.
    if (input.avatarStyle === 'cap') {
      accessories.splice(0, accessories.length, ...accessories.filter((id) => accessoryGroups[id] !== 'hat'));
      accessories.push('cap');
    }
    const result = {
      name,
      pronunciation,
      birthDate: validBirthDate(input.birthDate),
      gender: Object.hasOwn(genders, input.gender) ? input.gender : DEFAULTS.gender,
      petId: medals >= 2 && pets.includes(input.petId) ? input.petId : null,
      avatarStyle: input.avatarStyle === 'cap' ? 'short' : styles.includes(input.avatarStyle) ? input.avatarStyle : DEFAULTS.avatarStyle,
      outfitStyle: outfits.includes(input.outfitStyle) ? input.outfitStyle : DEFAULTS.outfitStyle,
      bottomStyle: bottoms.includes(input.bottomStyle) ? input.bottomStyle : DEFAULTS.bottomStyle,
      footwearStyle: footwear.includes(input.footwearStyle) ? input.footwearStyle : DEFAULTS.footwearStyle,
      sockPattern: sockPatterns.includes(input.sockPattern) ? input.sockPattern : DEFAULTS.sockPattern,
      skinColor: /^#[0-9a-f]{6}$/i.test(input.skinColor || '') ? input.skinColor.toLowerCase() : DEFAULTS.skinColor,
      hairColor: /^#[0-9a-f]{6}$/i.test(input.hairColor || '') ? input.hairColor.toLowerCase() : DEFAULTS.hairColor,
      outfitColor: /^#[0-9a-f]{6}$/i.test(input.outfitColor || '') ? input.outfitColor.toLowerCase() : legacyShirtColor,
      bottomColor: /^#[0-9a-f]{6}$/i.test(input.bottomColor || '') ? input.bottomColor.toLowerCase() : DEFAULTS.bottomColor,
      shoeColor: /^#[0-9a-f]{6}$/i.test(input.shoeColor || '') ? input.shoeColor.toLowerCase() : DEFAULTS.shoeColor,
      accessoryColor: /^#[0-9a-f]{6}$/i.test(input.accessoryColor || '') ? input.accessoryColor.toLowerCase() : DEFAULTS.accessoryColor,
      themeMood: ['', 'Vibrant', 'Futuristic', 'Fun', 'Soft Pastel', 'Calm', 'Vintage',
        'Organic', 'Sophisticated', 'Dark', 'Corporate'].includes(input.themeMood) ? input.themeMood : '',
      accessories,
      achievements
    };
    if (typeof input.sourceSvg === 'string' && Object.hasOwn(window.LivrinhoAvatarPresetParts || {}, input.sourceSvg)) {
      result.sourceSvg = input.sourceSvg;
      const editableParts = ['avatarStyle', 'outfitStyle', 'skinColor', 'hairColor', 'outfitColor'];
      const changes = Array.isArray(input.presetEdits) ? input.presetEdits : [];
      result.presetEdits = [...new Set(changes.filter((part) => editableParts.includes(part)))];
    }
    return result;
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) memory = clean(JSON.parse(saved));
    } catch { /* private browsing can disable storage */ }
    return clean(memory);
  }

  function save(values) {
    memory = clean(values);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch { /* keep an in-memory copy */ }
    document.dispatchEvent(new CustomEvent('livrinhos:protagonist-changed', { detail: clean(memory) }));
    return clean(memory);
  }

  function bookProgress(id) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw Error('ID de livro inválido');
    return load().achievements.books[id] || { completedExercises: [], visitedPages: [], finished: false,
      finishedAt: null, challengeCompletedAt: null, medalEarnedAt: null };
  }

  function recordBookProgress(id, changes, totalExercises = 0) {
    const previous = bookProgress(id);
    const now = new Date().toISOString();
    const next = cleanAchievements({ books: { [id]: { ...previous, ...changes } } }).books[id];
    if (changes.finished && totalExercises > 0 && next.completedExercises.length !== totalExercises) {
      next.finished = previous.finished;
    }
    if (next.finished && !next.finishedAt) next.finishedAt = now;
    if (totalExercises > 0 && next.completedExercises.length === totalExercises) {
      if (!next.challengeCompletedAt) next.challengeCompletedAt = now;
      if (!next.medalEarnedAt) next.medalEarnedAt = next.challengeCompletedAt;
    }
    const state = load();
    state.achievements.books[id] = next;
    memory = clean(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch { /* segue em memória */ }
    document.dispatchEvent(new CustomEvent('livrinhos:progress-changed', { detail: { id, progress: next } }));
    return next;
  }

  function xmlEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function xmlUnescape(value) {
    return String(value).replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  function personalize(value, settings = load(), asXml = false) {
    if (value == null) return '';
    const grammar = genders[settings.gender] || genders.feminino;
    const name = asXml ? xmlEscape(settings.name) : settings.name;
    const tokens = {
      nome: name,
      idade: String(ageOnDate(settings.birthDate) ?? '?'),
      pronome: grammar.pronome,
      Pronome: grammar.pronome[0].toUpperCase() + grammar.pronome.slice(1),
      possessivo: grammar.possessivo,
      Possessivo: grammar.possessivo[0].toUpperCase() + grammar.possessivo.slice(1)
    };
    return String(value)
      .replace(/\{\{(nome|idade|pronome|Pronome|possessivo|Possessivo)\}\}/g, (_, key) => tokens[key])
      .replace(/\bEllie\b/g, () => name)
      .replace(/\bELLIE\b/g, () => asXml ? xmlEscape(settings.name.toLocaleUpperCase('pt-BR')) : settings.name.toLocaleUpperCase('pt-BR'));
  }

  const avatarSymbol = (id = 'ellie', settings = load()) => avatar.avatarSymbol(id, clean(settings));
  const avatarSVG = (settings = load()) => avatar.avatarSVG(clean(settings));

  function exportProfileSVG(settings = load()) {
    const state = clean(settings);
    const { achievements, ...profile } = state;
    const payload = { app: 'prateleira-magica', schemaVersion: 1, exportedAt: new Date().toISOString(), profile, achievements };
    const metadata = `<metadata id="prateleira-magica-profile" data-format="application/json">${xmlEscape(JSON.stringify(payload))}</metadata>`;
    return avatarSVG(state).replace(/(<svg\b[^>]*>)/, `$1${metadata}<title>Avatar de ${xmlEscape(state.name)}</title>`);
  }

  function parseProfileSVG(svgText) {
    if (typeof svgText !== 'string' || svgText.length > 1_000_000 || !/^\s*(?:<\?xml[^>]*>\s*)?<svg\s/.test(svgText)) {
      throw Error('Escolha um perfil exportado pela Prateleira Mágica.');
    }
    const match = svgText.match(/<metadata id="prateleira-magica-profile" data-format="application\/json">([\s\S]*?)<\/metadata>/);
    if (!match) throw Error('Este arquivo não é um perfil da Prateleira Mágica.');
    let payload;
    try { payload = JSON.parse(xmlUnescape(match[1])); }
    catch { throw Error('Não conseguimos ler esse perfil. Tente outra cópia.'); }
    if (payload?.app !== 'prateleira-magica' || payload.schemaVersion !== 1
        || !payload.profile || typeof payload.profile.name !== 'string' || !payload.profile.name.trim()
        || typeof payload.profile.pronunciation !== 'string'
        || !Object.hasOwn(genders, payload.profile.gender)
        || !payload.achievements || typeof payload.achievements.books !== 'object') {
      throw Error('Este perfil está incompleto ou foi criado por outro aplicativo.');
    }
    return clean({ ...payload.profile, achievements: payload.achievements });
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
      // A folha anterior ainda usa a imagem até terminar a virada 3D (~780ms).
      if (oldUrl) {
        if (window.setTimeout) window.setTimeout(() => URL.revokeObjectURL(oldUrl), 950);
        else URL.revokeObjectURL(oldUrl);
      }
    } catch (error) {
      console.warn('Avatar na ilustração indisponível:', error);
      if (img.dataset.avatarRequest === requestId) img.src = sourceUrl;
    }
  }

  window.LivrinhoPreferences = { DEFAULTS, styles, outfits, bottoms, pets, genders, load, save, clean,
    ageOnDate, medalCount, validBirthDate,
    bookProgress, recordBookProgress, exportProfileSVG, parseProfileSVG,
    personalize, avatarSymbol, avatarSVG, personalizeIllustration };
})();
