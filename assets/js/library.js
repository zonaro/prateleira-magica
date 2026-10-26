(() => {
  'use strict';
  const shelf = document.getElementById('bookShelf');
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;

  function bookCard(book) {
    const card = document.createElement('a');
    card.className = 'book-card';
    card.href = `./livro.html?livro=${encodeURIComponent(book.id)}`;
    card.setAttribute('aria-label', `Abrir ${book.title}`);

    const cover = document.createElement('div');
    cover.className = 'book-card-cover';
    const img = document.createElement('img');
    img.src = asset(book.cover);
    img.alt = `Capa de ${book.title}`;
    img.loading = 'lazy';
    cover.append(img);
    if (book.label) {
      const label = document.createElement('span');
      label.className = 'cover-label';
      label.textContent = book.label;
      cover.append(label);
    }

    const copy = document.createElement('div');
    copy.className = 'book-card-copy';
    const title = document.createElement('h3');
    title.textContent = book.title;
    const subtitle = document.createElement('p');
    subtitle.textContent = book.subtitle || 'Uma aventura de leitura.';
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

  async function loadLibrary() {
    try {
      const response = await fetch(asset('books/index.json'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.books)) throw new Error('Catálogo inválido');
      shelf.replaceChildren();
      if (!manifest.books.length) {
        const empty = document.createElement('p');
        empty.className = 'shelf-loading';
        empty.textContent = 'Novas histórias chegarão em breve!';
        shelf.append(empty);
        return;
      }
      manifest.books.forEach((book) => shelf.append(bookCard(book)));
    } catch (error) {
      console.error('Não foi possível carregar a prateleira:', error);
      shelf.replaceChildren();
      const message = document.createElement('p');
      message.className = 'shelf-loading';
      message.textContent = 'Não foi possível carregar os livrinhos. Conecte-se à internet na primeira visita e tente recarregar.';
      shelf.append(message);
    }
  }

  loadLibrary();
})();
