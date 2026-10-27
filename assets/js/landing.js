(() => {
  'use strict';
  const container = document.getElementById('storiesPreview');
  const preferences = window.LivrinhoPreferences;
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;

  const personalize = (text) => {
    const value = String(text || '');
    if (preferences) return preferences.personalize(value);
    // Sem módulo de preferências: remove o token {{nome}} em vez de mostrar chaves.
    return value.replace(/\{\{nome\}\}\s*/u, '').replace(/^\s+/, '');
  };

  // Quatro títulos conhecidos, sem o prefixo {{nome}}. Só usado quando a rede falha.
  const FALLBACKS = [
    { title: 'O Trem Travesso', subtitle: 'Uma aventura com TRA, TRE, TRI, TRO e TRU', color: '#f96b91' },
    { title: 'O Drone Desaparecido', subtitle: 'Uma aventura com DRA, DRE, DRI, DRO e DRU', color: '#8b79dd' },
    { title: 'O Trem dos Dragões', subtitle: 'Uma aventura misturando TR e DR', color: '#4c9fbe' },
    { title: 'O Reino das Cores', subtitle: 'Descubra cores, misturas e harmonias', color: '#ed79a0' }
  ];

  // Sorteio feito uma única vez por carregamento. Mudar o protagonista
  // re-personaliza os textos sem reembaralhar.
  let sampled = [];

  function shuffle(books) {
    const copy = books.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function revokeOldBlobs() {
    for (const old of container.querySelectorAll('img[data-avatar-blob]')) {
      if (old.dataset.avatarBlob) URL.revokeObjectURL(old.dataset.avatarBlob);
      delete old.dataset.avatarBlob;
    }
  }

  function coverElement(entry) {
    const cover = document.createElement('div');
    cover.className = 'story-preview-cover';
    cover.style.setProperty('--story-color', entry.color || '#f96b91');

    if (entry.cover) {
      const img = document.createElement('img');
      img.src = asset(entry.cover);
      img.alt = `Capa de ${personalize(entry.title)}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      cover.append(img);
      if (entry.protagonistMode !== 'fixed') preferences?.personalizeIllustration(img, asset(entry.cover));
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'story-preview-cover-placeholder';
      placeholder.style.background = entry.color || '#f96b91';
      cover.append(placeholder);
    }
    return cover;
  }

  function storyCard(entry) {
    const card = document.createElement('div');
    card.className = 'story-preview-card';
    card.style.setProperty('--story-color', entry.color || '#f96b91');

    const title = document.createElement('h3');
    title.className = 'landing-personalize';
    title.textContent = personalize(entry.title);

    const subtitle = document.createElement('p');
    subtitle.textContent = personalize(entry.subtitle || '');

    card.append(coverElement(entry), title, subtitle);
    return card;
  }

  function render(books) {
    revokeOldBlobs();
    container.replaceChildren();
    for (const entry of books) container.append(storyCard(entry));
  }

  function renderFallback() {
    render(FALLBACKS);
  }

  async function load() {
    try {
      const response = await fetch(asset('books/index.json'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const books = manifest && manifest.schemaVersion === 1 && Array.isArray(manifest.books)
        ? manifest.books
        : [];
      sampled = shuffle(books).slice(0, Math.min(4, books.length));
      render(sampled);
    } catch (error) {
      console.warn('Não foi possível carregar as histórias da landing:', error);
      renderFallback();
    }
  }

  document.addEventListener('livrinhos:protagonist-changed', () => render(sampled));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
