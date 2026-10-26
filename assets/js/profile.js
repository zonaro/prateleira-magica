(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;
  const $ = (selector) => document.querySelector(selector);
  let books = [];

  function updateIdentity() {
    const child = preferences.load();
    const medals = preferences.medalCount(child);
    $('#profileAvatar').innerHTML = preferences.avatarSVG(child);
    $('#profileTitle').textContent = `As conquistas de ${child.name} 🌟`;
    document.title = `${child.name} · Meu perfil · Prateleira Mágica`;
    const info = [];
    if (child.birthDate) {
      const birthDate = new Date(`${child.birthDate}T12:00:00`);
      const years = preferences.ageOnDate(child.birthDate);
      info.push(`🎂 ${birthDate.toLocaleDateString('pt-BR')}${years === null ? '' : ` · ${years} ano${years === 1 ? '' : 's'}`}`);
    }
    info.push(`📖 Leitura com ${child.gender === 'feminino' ? 'ela/dela' : child.gender === 'masculino' ? 'ele/dele' : 'elu/delu'}`);
    $('#profilePersonalInfo').textContent = info.join('  ·  ');
    $('#profileMedals').textContent = `${medals} 🏅`;
    $('#profileBooksRead').textContent = String(Object.values(child.achievements.books).filter((p) => p.finished).length);
    const pet = window.LivrinhoAvatar.petStyles.find(([id]) => id === child.petId);
    $('#profilePetStatus').textContent = pet ? pet[1] : medals >= 2 ? '✨ Escolher' : '🔒';
    $('#profileUnlockHint').textContent = medals >= 2
      ? pet ? `${pet[1]} acompanha ${child.name}! Você pode trocar o pet em Personalizar.`
        : 'Você já desbloqueou os pets! Entre em Personalizar e escolha um companheiro.'
      : `Conquiste ${2 - medals} medalha${2 - medals === 1 ? '' : 's'} para desbloquear os 20 pets da coleção.`;
  }

  function bookCard(book) {
    const progress = preferences.bookProgress(book.id);
    const hasMedal = Boolean(progress.medalEarnedAt || progress.challengeCompletedAt);
    const total = book.pages.length;
    const visited = progress.visitedPages.filter((index) => index < total).length;
    const percent = progress.finished ? 100 : Math.round(visited / total * 100);
    const last = progress.visitedPages.length ? Math.min(total - 1, Math.max(...progress.visitedPages)) : 0;
    const link = document.createElement('a');
    link.href = `./livro.html?livro=${encodeURIComponent(book.id)}&pagina=${last}`;
    link.className = 'profile-book-card';
    link.setAttribute('aria-label', `${preferences.personalize(book.title)}, ${percent}% lido${hasMedal ? ', medalha conquistada' : ''}`);
    const image = document.createElement('img');
    image.className = 'profile-book-cover';
    image.src = asset(book.cover);
    image.alt = `Capa de ${preferences.personalize(book.title)}`;
    image.loading = 'lazy';
    preferences.personalizeIllustration(image, asset(book.cover));

    const detail = document.createElement('div');
    detail.className = 'profile-book-details';
    const title = document.createElement('h3');
    title.textContent = preferences.personalize(book.title);
    const status = document.createElement('p');
    status.className = 'profile-book-status';
    status.textContent = progress.finished ? '✅ História concluída' : '📖 Em leitura';
    const medal = document.createElement('span');
    medal.className = `profile-medal${hasMedal ? ' earned' : ''}`;
    medal.textContent = hasMedal ? '🏅 Medalha conquistada' : '🔒 Medalha do desafio';
    const progressCopy = document.createElement('div');
    progressCopy.className = 'profile-progress-heading';
    const percentLabel = document.createElement('strong');
    percentLabel.textContent = `${percent}% lido`;
    const pagesLabel = document.createElement('span');
    pagesLabel.textContent = `${progress.finished ? total : visited} de ${total} páginas`;
    progressCopy.append(percentLabel, pagesLabel);
    const track = document.createElement('div');
    track.className = 'profile-progress-track';
    const bar = document.createElement('span');
    bar.style.width = `${percent}%`;
    track.append(bar);
    const action = document.createElement('span');
    action.className = 'profile-continue';
    action.textContent = progress.finished ? 'Reler aventura →' : 'Continuar leitura →';
    detail.append(title, status, medal, progressCopy, track, action);
    link.append(image, detail);
    return link;
  }

  function renderBooks() {
    const container = $('#profileBooks');
    for (const old of container.querySelectorAll('img[data-avatar-blob]')) URL.revokeObjectURL(old.dataset.avatarBlob);
    container.replaceChildren();
    const started = books.filter((book) => {
      const progress = preferences.bookProgress(book.id);
      return progress.finished || progress.medalEarnedAt || progress.challengeCompletedAt
        || progress.visitedPages.length > 0 || progress.completedExercises.length > 0;
    });
    if (!started.length) {
      const empty = document.createElement('div');
      empty.className = 'profile-empty';
      empty.innerHTML = '<strong>📚 Sua primeira aventura está esperando!</strong><p>Escolha um livro na prateleira, leia e ganhe sua primeira medalha.</p><a href="./index.html">Explorar livrinhos →</a>';
      container.append(empty);
      return;
    }
    for (const book of started) container.append(bookCard(book));
  }

  async function loadBooks() {
    try {
      const response = await fetch(asset('books/index.json'));
      if (!response.ok) throw Error('Catálogo indisponível');
      const catalog = await response.json();
      books = (await Promise.all((catalog.books || []).map(async (entry) => {
        try {
          const request = await fetch(asset(entry.data));
          if (!request.ok) return null;
          const full = await request.json();
          return { ...entry, pages: full.pages || [] };
        } catch { return null; }
      }))).filter((entry) => entry?.pages.length);
      renderBooks();
    } catch (error) {
      console.warn('Histórico de leitura indisponível:', error);
      $('#profileBooks').textContent = 'Não foi possível carregar os livros. Abra o aplicativo online uma vez para disponibilizá-los offline.';
    }
  }

  document.addEventListener('livrinhos:protagonist-changed', () => { updateIdentity(); renderBooks(); });
  document.addEventListener('livrinhos:progress-changed', () => { updateIdentity(); renderBooks(); });
  updateIdentity();
  loadBooks();
})();
