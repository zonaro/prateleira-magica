(() => {
  'use strict';
  const shelf = document.getElementById('bookShelf');
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;
  const preferences = window.LivrinhoPreferences;
  const heroCover = document.getElementById('heroCover');
  let books = [];
  const label = (text) => preferences ? preferences.personalize(text) : String(text || '');

  function renderHeroCover() {
    if (!heroCover || !preferences) return;
    const coverUrl = asset('assets/illustrations/ellie/cover.svg');
    preferences.personalizeIllustration(heroCover, coverUrl);
  }

  function bookCard(book) {
    const card = document.createElement('a');
    card.className = 'book-card';
    card.href = `./livro.html?livro=${encodeURIComponent(book.id)}`;
    card.setAttribute('aria-label', `Abrir ${label(book.title)}`);

    const cover = document.createElement('div');
    cover.className = 'book-card-cover';
    const img = document.createElement('img');
    img.src = asset(book.cover);
    img.alt = `Capa de ${label(book.title)}`;
    img.loading = 'lazy';
    cover.append(img);
    preferences?.personalizeIllustration(img, asset(book.cover));
    if (book.label) {
      const label = document.createElement('span');
      label.className = 'cover-label';
      label.textContent = book.label;
      cover.append(label);
    }

    const copy = document.createElement('div');
    copy.className = 'book-card-copy';
    const title = document.createElement('h3');
    title.textContent = label(book.title);
    const subtitle = document.createElement('p');
    subtitle.textContent = label(book.subtitle || 'Uma aventura de leitura.');
    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const sounds = document.createElement('div');
    sounds.className = 'card-sounds';
    for (const syllable of book.syllables || []) {
      const chip = document.createElement('span');
      chip.textContent = syllable;
      sounds.append(chip);
    }
    const open = document.createElement('span');
    open.className = 'card-open';
    open.textContent = 'Ler agora →';
    foot.append(sounds, open);
    copy.append(title, subtitle, foot);
    card.append(cover, copy);
    return card;
  }

  function renderShelf() {
    for (const old of shelf.querySelectorAll('img[data-avatar-blob]')) URL.revokeObjectURL(old.dataset.avatarBlob);
    shelf.replaceChildren();
    books.forEach((book) => shelf.append(bookCard(book)));
  }

  async function loadLibrary() {
    try {
      const response = await fetch(asset('books/index.json'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.books)) throw new Error('Catálogo inválido');
      books = manifest.books;
      shelf.replaceChildren();
      if (!manifest.books.length) {
        const empty = document.createElement('p');
        empty.className = 'shelf-loading';
        empty.textContent = 'Novas histórias chegarão em breve!';
        shelf.append(empty);
        return;
      }
      renderShelf();
    } catch (error) {
      console.error('Não foi possível carregar a prateleira:', error);
      shelf.replaceChildren();
      const message = document.createElement('p');
      message.className = 'shelf-loading';
      message.textContent = 'Não foi possível carregar os livrinhos. Conecte-se à internet na primeira visita e tente recarregar.';
      shelf.append(message);
    }
  }

  document.addEventListener('livrinhos:protagonist-changed', () => {
    renderShelf();
    renderHeroCover();
  });
  renderHeroCover();
  loadLibrary();
})();
