(() => {
  'use strict';
  const shelf = document.getElementById('bookshelf') || document.getElementById('bookShelf');
  const searchInput = document.getElementById('bookSearch');
  const sortSelect = document.getElementById('bookSort');
  const sortDirBtn = document.getElementById('sortDir');
  const topicFilter = document.getElementById('bookTopic');
  const ageFilter = document.getElementById('bookAge');
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;
  const preferences = window.LivrinhoPreferences;
  const heroCover = document.getElementById('heroCover');
  let books = [];
  let filtered = [];
  let sortDir = 'asc';
  const label = (text) => preferences ? preferences.personalize(text) : String(text || '');

  function renderHeroCover() {
    if (!heroCover || !preferences) return;
    const coverUrl = asset('assets/illustrations/ellie/cover.svg');
    preferences.personalizeIllustration(heroCover, coverUrl);
  }

  function bookCard(book) {
    const card = document.createElement('a');
    card.className = 'book-spine';
    card.href = `./livro.html?livro=${encodeURIComponent(book.id)}`;
    card.setAttribute('aria-label', `Abrir ${label(book.title)}. ${book.subject || ''}. Idade recomendada: ${book.ageRange?.join(' a ') || 'não informada'} anos.`);

    const stand = document.createElement('div');
    stand.className = 'book-stand';
    stand.style.setProperty('--book-color', book.color || '#f96b91');

    const img = document.createElement('img');
    img.src = asset(book.cover);
    img.alt = `Capa de ${label(book.title)}`;
    img.loading = 'lazy';
    img.className = 'book-cover-img';
    stand.append(img);
    preferences?.personalizeIllustration(img, asset(book.cover));

    if (book.label) {
      const labelBadge = document.createElement('span');
      labelBadge.className = 'book-spine-label';
      labelBadge.textContent = book.label;
      stand.append(labelBadge);
    }

    const bubble = document.createElement('div');
    bubble.className = 'book-bubble';
    const copy = document.createElement('div');
    copy.className = 'book-bubble-copy';
    const title = document.createElement('strong');
    title.className = 'book-bubble-title';
    title.textContent = label(book.title);
    const subtitle = document.createElement('span');
    subtitle.className = 'book-bubble-subtitle';
    subtitle.textContent = label(book.subtitle || '');
    copy.append(title, subtitle);
    if (book.subject && Array.isArray(book.ageRange)) {
      const metadata = document.createElement('small');
      metadata.className = 'book-bubble-meta';
      metadata.textContent = `${book.subject} · ${book.ageRange[0]}–${book.ageRange[1]} anos`;
      copy.append(metadata);
    }
    bubble.append(copy);

    card.append(stand, bubble);
    return card;
  }

  function applyFilters() {
    let result = [...books];
    const query = (searchInput?.value || '').toLowerCase().trim();
    if (query) {
      result = result.filter((book) => {
        const title = label(book.title).toLowerCase();
        const subtitle = label(book.subtitle || '').toLowerCase();
        return title.includes(query) || subtitle.includes(query) || (book.subject || '').toLowerCase().includes(query);
      });
    }
    if (topicFilter?.value) {
      result = result.filter((book) => book.subject?.split(' · ')[0] === topicFilter.value);
    }
    if (ageFilter?.value) {
      const age = Number(ageFilter.value);
      result = result.filter((book) => book.ageRange?.[0] <= age && book.ageRange?.[1] >= age);
    }

    const sort = sortSelect?.value || 'default';
    if (sort !== 'default') {
      result.sort((a, b) => {
        if (sort.startsWith('title')) {
          const ta = label(a.title).toLowerCase();
          const tb = label(b.title).toLowerCase();
          if (ta < tb) return sortDir === 'asc' ? -1 : 1;
          if (ta > tb) return sortDir === 'asc' ? 1 : -1;
          return 0;
        } else if (sort.startsWith('status')) {
          const getStatus = (book) => {
            const p = preferences?.bookProgress(book.id);
            if (p?.medalEarnedAt || p?.challengeCompletedAt) return 3;
            if (p?.finished) return 2;
            if (p?.completedExercises?.length) return 1;
            return 0;
          };
          const sa = getStatus(a), sb = getStatus(b);
          if (sa < sb) return sortDir === 'asc' ? -1 : 1;
          if (sa > sb) return sortDir === 'asc' ? 1 : -1;
          return 0;
        } else if (sort.startsWith('release')) {
          const ia = books.indexOf(a), ib = books.indexOf(b);
          if (ia < ib) return sortDir === 'asc' ? -1 : 1;
          if (ia > ib) return sortDir === 'asc' ? 1 : -1;
          return 0;
        }
        return 0;
      });
    }

    filtered = result;
    renderShelf();
  }

  function renderShelf() {
    if (!shelf) return;
    for (const old of shelf.querySelectorAll('img[data-avatar-blob]')) URL.revokeObjectURL(old.dataset.avatarBlob);
    shelf.replaceChildren();
    if (!filtered.length && books.length) {
      const empty = document.createElement('p');
      empty.className = 'shelf-loading';
      empty.textContent = 'Nenhum livro encontrado com essa busca.';
      shelf.append(empty);
      return;
    }
    filtered.forEach((book) => shelf.append(bookCard(book)));
  }

  async function loadLibrary() {
    try {
      const response = await fetch(asset('books/index.json'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.books)) throw new Error('Catálogo inválido');
      books = manifest.books;
      if (topicFilter) {
        for (const topic of [...new Set(books.map((book) => book.subject?.split(' · ')[0]).filter(Boolean))].sort()) {
          const option = document.createElement('option');
          option.value = topic;
          option.textContent = topic;
          topicFilter.append(option);
        }
      }
      filtered = [...books];
      if (shelf) shelf.replaceChildren();
      if (!manifest.books.length) {
        const empty = document.createElement('p');
        empty.className = 'shelf-loading';
        empty.textContent = 'Novas histórias chegarão em breve!';
        if (shelf) shelf.append(empty);
        return;
      }
      applyFilters();
    } catch (error) {
      console.error('Não foi possível carregar a prateleira:', error);
      if (shelf) {
        shelf.replaceChildren();
        const message = document.createElement('p');
        message.className = 'shelf-loading';
        message.textContent = 'Não foi possível carregar os livrinhos. Conecte-se à internet na primeira visita e tente recarregar.';
        shelf.append(message);
      }
    }
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (topicFilter) topicFilter.addEventListener('change', applyFilters);
  if (ageFilter) ageFilter.addEventListener('change', applyFilters);
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);
  if (sortDirBtn) {
    sortDirBtn.addEventListener('click', () => {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      sortDirBtn.setAttribute('aria-label', sortDir === 'asc' ? 'Ordem crescente' : 'Ordem decrescente');
      sortDirBtn.title = sortDir === 'asc' ? 'Ordem crescente' : 'Ordem decrescente';
      applyFilters();
    });
  }

  document.addEventListener('livrinhos:protagonist-changed', () => {
    if (shelf?.id === 'bookshelf') applyFilters();
    else renderShelf();
    renderHeroCover();
  });
  renderHeroCover();
  loadLibrary();
})();
