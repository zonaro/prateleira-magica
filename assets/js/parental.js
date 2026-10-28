/* Controles parentais locais; nenhum nome, PIN ou histórico sai do aparelho. */
(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  if (!preferences) return;
  const POLICY_KEY = 'prateleira-magica:responsaveis:v1';
  const USAGE_KEY = 'prateleira-magica:tempo:v1';
  const LEASE_KEY = 'prateleira-magica:tempo-ativo:v1';
  const tabId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let memoryPolicy = null;
  let memoryUsage = {};
  let lastTick = Date.now();
  let failed = 0;
  let cooldownUntil = 0;

  function read(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento privado */ }
  }
  function cleanMinutes(value) {
    return Number.isInteger(Number(value)) && Number(value) >= 5 && Number(value) <= 480 ? Number(value) : 60;
  }
  function policy() {
    const raw = read(POLICY_KEY, memoryPolicy || {});
    const limits = {};
    for (const [id, value] of Object.entries(raw?.limits || {}).slice(0, 30)) {
      if (/^[a-z0-9-]{1,64}$/.test(id)) limits[id] = cleanMinutes(value);
    }
    return memoryPolicy = { limits,
      pin: typeof raw?.pin?.salt === 'string' && /^[a-f0-9]{32}$/.test(raw.pin.salt)
        && typeof raw.pin.hash === 'string' && /^[a-f0-9]{64}$/.test(raw.pin.hash)
        ? raw.pin : null };
  }
  function limitMinutes(id = preferences.family().activeId) {
    return policy().limits[id] || 60;
  }
  // O tempo pertence à leitura e à criação do personagem, não às telas de
  // apresentação, conquistas ou administração dos responsáveis.
  function shouldCount(pathname, hash = '') {
    const page = String(pathname || '').split('/').pop();
    if (page === 'livro.html' || page === 'prateleira.html') return true;
    return page === 'perfil.html' && ['#personalizar', '#predefinidos', '#foto'].includes(hash);
  }
  function setLimit(id, minutes) {
    if (!preferences.family().profiles.some((entry) => entry.id === id)) throw Error('Perfil inválido.');
    if (Number(minutes) < 5 || Number(minutes) > 480 || !Number.isInteger(Number(minutes))) {
      throw Error('Escolha um limite de 5 a 480 minutos.');
    }
    const state = policy();
    state.limits[id] = Number(minutes);
    write(POLICY_KEY, state);
    document.dispatchEvent(new CustomEvent('livrinhos:parental-changed'));
  }
  const hasPin = () => Boolean(policy().pin);

  async function digest(password, salt) {
    if (!globalThis.crypto?.subtle) throw Error('É necessário abrir o aplicativo por HTTPS para configurar a senha.');
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  async function setPin(password) {
    if (typeof password !== 'string' || password.length < 4 || password.length > 64) {
      throw Error('A senha precisa de 4 a 64 caracteres.');
    }
    if (!globalThis.crypto?.getRandomValues) throw Error('A criação da senha exige uma conexão segura (HTTPS).');
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const state = policy();
    state.pin = { salt, hash: await digest(password, salt) };
    write(POLICY_KEY, state);
    document.dispatchEvent(new CustomEvent('livrinhos:parental-changed'));
  }
  async function verifyPin(password) {
    if (Date.now() < cooldownUntil) throw Error('Espere 30 segundos antes de tentar novamente.');
    const current = policy().pin;
    if (!current) return false;
    const correct = await digest(password, current.salt) === current.hash;
    if (correct) failed = 0;
    else if (++failed >= 5) { failed = 0; cooldownUntil = Date.now() + 30_000; }
    return correct;
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function usage() {
    const items = read(USAGE_KEY, memoryUsage);
    return items && typeof items === 'object' && !Array.isArray(items) ? items : {};
  }
  function usedMs(id = preferences.family().activeId, date = new Date()) {
    const entry = usage()[id];
    return entry?.day === dateKey(date) && Number.isFinite(entry.usedMs)
      ? Math.max(0, entry.usedMs) : 0;
  }
  function remainingMs(id = preferences.family().activeId) {
    return Math.max(0, limitMinutes(id) * 60_000 - usedMs(id));
  }
  function locked(id = preferences.family().activeId) { return remainingMs(id) <= 0; }

  function resetTime(id = preferences.family().activeId) {
    const items = usage();
    items[id] = { day: dateKey(), usedMs: 0 };
    memoryUsage = items;
    write(USAGE_KEY, items);
    lastTick = Date.now();
    document.dispatchEvent(new CustomEvent('livrinhos:parental-changed'));
  }
  function forgetProfile(id) {
    const settings = policy();
    delete settings.limits[id];
    write(POLICY_KEY, settings);
    const items = usage();
    delete items[id];
    memoryUsage = items;
    write(USAGE_KEY, items);
  }

  // Apenas a aba visível dona da concessão conta o tempo, evitando duplicar
  // minutos quando o app está aberto em duas janelas no mesmo dispositivo.
  function tick(now = Date.now(), isVisible = true) {
    const elapsed = Math.max(0, Math.min(60_000, now - lastTick));
    lastTick = now;
    const id = preferences.family().activeId;
    if (!isVisible || locked(id)) return remainingMs(id);
    const lease = read(LEASE_KEY, null);
    if (lease && lease.owner !== tabId && lease.until > now) return remainingMs(id);
    write(LEASE_KEY, { owner: tabId, until: now + 5000 });
    if (elapsed < 1) return remainingMs(id);
    const items = usage();
    items[id] = { day: dateKey(new Date(now)), usedMs: Math.min(limitMinutes(id) * 60_000,
      usedMs(id, new Date(now)) + elapsed) };
    memoryUsage = items;
    write(USAGE_KEY, items);
    return remainingMs(id);
  }
  function pause() {
    lastTick = Date.now();
    const lease = read(LEASE_KEY, null);
    if (lease?.owner === tabId) write(LEASE_KEY, { owner: tabId, until: 0 });
  }
  window.LivrinhoParental = { policy, setLimit, limitMinutes, shouldCount, hasPin, setPin, verifyPin,
    usedMs, remainingMs, locked, resetTime, forgetProfile, tick, pause, dateKey };
})();
