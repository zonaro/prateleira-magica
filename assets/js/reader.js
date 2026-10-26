(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;
  const preferences = window.LivrinhoPreferences;
  const label = (value) => preferences ? preferences.personalize(value) : String(value || '');
  const params = new URLSearchParams(location.search);
  const bookId = params.get('livro');
  const completed = new Set();
  let book = null;
  let page = 0;
  let toastTimer;
  let startX = null;
  let startY = null;

  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function speechText(message) {
    let result = label(message);
    const pronunciation = book?.pronunciation || {};
    const syllables = pronunciation.syllables || {};
    // A syllable button must win over names like "Dru" (which can otherwise
    // cause DRU to be treated as a character's name, losing its example).
    const isolated = result.trim();
    if (Object.hasOwn(syllables, isolated)) {
      const { sound, example } = syllables[isolated];
      return `${sound}!${example ? ` Como em ${example}.` : ''}`;
    }
    const child = preferences?.load();
    if (child?.name && child.pronunciation) {
      result = result.replace(new RegExp(`(?<!\\p{L})${escapeRegExp(child.name)}(?!\\p{L})`, 'giu'), child.pronunciation);
    }
    for (const [name, spoken] of Object.entries(pronunciation.names || {})) {
      if (name.toLocaleLowerCase('pt-BR') === child?.name.toLocaleLowerCase('pt-BR')) continue;
      result = result.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi'), spoken);
    }
    for (const [syllable, value] of Object.entries(syllables)) {
      result = result.replace(new RegExp(`\\b${escapeRegExp(syllable)}\\b`, 'gi'), value.sound);
    }
    return result;
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      notify('A leitura em voz alta não está disponível neste navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.lang = book?.language || 'pt-BR';
    utterance.rate = .78;
    utterance.pitch = 1.08;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  function plainText(text) { return String(text).replace(/\[\[([^\]]+)\]\]/g, '$1'); }
  function hearCurrentPage() {
    const current = book.pages[page];
    const words = current.blocks.map((block) => plainText(label(block.text))).join(' ');
    speak(label(current.speech || `${current.title}. ${words}`));
  }

  function renderText(container, text) {
    const pattern = /\[\[([^\]]+)\]\]/g;
    let previous = 0;
    for (const match of text.matchAll(pattern)) {
      container.append(document.createTextNode(text.slice(previous, match.index)));
      const word = document.createElement('button');
      word.type = 'button';
      word.className = 'word';
      word.dataset.say = match[1];
      word.setAttribute('aria-label', `Ouvir ${match[1]}`);
      word.textContent = match[1];
      container.append(word);
      previous = match.index + match[0].length;
    }
    container.append(document.createTextNode(text.slice(previous)));
  }

  function renderChallenge(container) {
    for (const [index, exercise] of (book.exercises || []).entries()) {
      const row = document.createElement('div');
      row.className = 'challenge-row';
      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'challenge-check';
      check.dataset.check = String(index);
      check.setAttribute('aria-label', `Marcar frase ${index + 1}`);
      check.setAttribute('aria-pressed', String(completed.has(index)));
      check.textContent = completed.has(index) ? '✓' : exercise.syllable;
      const phrase = document.createElement('button');
      phrase.type = 'button';
      phrase.className = 'challenge-say';
      phrase.dataset.say = label(exercise.text);
      phrase.textContent = label(exercise.text);
      phrase.setAttribute('aria-label', `Ouvir frase: ${label(exercise.text)}`);
      row.append(check, phrase);
      container.append(row);
    }
    if (book.exercises?.length && completed.size === book.exercises.length) {
      const message = document.createElement('div');
      message.className = 'medal';
      message.textContent = '⭐ Todas as frases concluídas! ⭐';
      container.append(message);
    }
  }

  function render() {
    window.speechSynthesis?.cancel();
    const current = book.pages[page];
    const art = $('#scene');
    art.src = asset(current.illustration);
    preferences?.personalizeIllustration(art, asset(current.illustration));
    art.alt = `Ilustração: ${label(current.title)}`;
    $('#artSticker').textContent = label(current.sticker || '');
    const panel = $('#readPanel');
    panel.className = `read-panel${current.type === 'cover' ? ' cover' : ''}`;
    panel.replaceChildren();
    const chapter = document.createElement('div');
    chapter.className = 'chapter';
    chapter.textContent = label(current.chapter || '');
    const title = document.createElement('h1');
    title.className = 'page-title';
    title.textContent = label(current.title);
    const story = document.createElement('div');
    story.className = 'story';
    for (const block of current.blocks || []) {
      const paragraph = document.createElement('p');
      if (block.kind === 'dialogue') paragraph.className = 'dialogue';
      renderText(paragraph, label(block.text));
      story.append(paragraph);
    }
    if (current.callout) {
      const callout = document.createElement('span');
      callout.className = 'cover-sub';
      callout.textContent = label(current.callout);
      story.append(callout);
    }
    if (current.type === 'challenge') renderChallenge(story);
    if (current.medal) {
      const medal = document.createElement('div');
      medal.className = 'medal';
      medal.textContent = label(current.medal);
      story.append(medal);
    }
    panel.append(chapter, title, story);
    if (current.syllables?.length) {
      const sounds = document.createElement('div');
      sounds.className = 'sound-row';
      sounds.setAttribute('aria-label', 'Treinar sílabas');
      for (const label of current.syllables) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'syllable';
        button.dataset.say = label;
        button.textContent = label;
        sounds.append(button);
      }
      panel.append(sounds);
    }
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = label(current.tip || 'Toque nas palavras coloridas e leia no seu ritmo.');
    const pageNumber = document.createElement('span');
    pageNumber.className = 'page-number';
    pageNumber.textContent = `${String(page + 1).padStart(2, '0')} / ${String(book.pages.length).padStart(2, '0')}`;
    panel.append(hint, pageNumber);

    $('#progressBar').style.width = `${(page + 1) / book.pages.length * 100}%`;
    $('#progressLabel').textContent = `Página ${page + 1} de ${book.pages.length}`;
    $('#prev').disabled = page === 0;
    $('#next').textContent = page === 0 ? 'Começar →' : page === book.pages.length - 1 ? '↻ Ler de novo' : 'Próxima →';
    const dots = $('#dots');
    dots.replaceChildren();
    book.pages.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.dataset.page = String(index);
      dot.setAttribute('aria-label', `Ir para página ${index + 1}: ${label(item.title)}`);
      if (index === page) dot.setAttribute('aria-current', 'page');
      dots.append(dot);
    });
    $('#book').classList.remove('flip-in');
    void $('#book').offsetWidth;
    $('#book').classList.add('flip-in');
  }

  function go(target) {
    page = Math.min(book.pages.length - 1, Math.max(0, target));
    render();
    if (window.innerWidth < 821) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showError(message) {
    const error = $('#readerError');
    error.replaceChildren();
    error.append(document.createTextNode(`${message} `));
    const link = document.createElement('a');
    link.href = './index.html';
    link.textContent = 'Voltar à prateleira';
    error.append(link);
    error.hidden = false;
  }

  $('#prev').addEventListener('click', () => go(page - 1));
  $('#next').addEventListener('click', () => go(page === book.pages.length - 1 ? 0 : page + 1));
  $('#listen').addEventListener('click', hearCurrentPage);
  document.addEventListener('click', (event) => {
    const say = event.target.closest?.('[data-say]');
    if (say && book) { speak(say.dataset.say); return; }
    const dot = event.target.closest?.('[data-page]');
    if (dot && book) { go(Number(dot.dataset.page)); return; }
    const check = event.target.closest?.('[data-check]');
    if (check && book) {
      const index = Number(check.dataset.check);
      if (completed.has(index)) completed.delete(index);
      else { completed.add(index); notify(completed.size === book.exercises.length ? 'Você completou o desafio! ⭐' : 'Muito bem! ⭐'); }
      render();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!book || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.getElementById('protagonistDialog')?.open) return;
    if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable],[role="textbox"]')) return;
    const isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && !isSpace) return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'ArrowRight') go(page + 1);
    else if (event.key === 'ArrowLeft') go(page - 1);
    else hearCurrentPage();
  });
  document.addEventListener('keyup', (event) => {
    if (document.getElementById('protagonistDialog')?.open) return;
    if (book && (event.code === 'Space' || event.key === ' ')) event.preventDefault();
  });
  $('#book').addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });
  $('#book').addEventListener('touchend', (event) => {
    if (startX === null || !book) return;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) go(page + (dx < 0 ? 1 : -1));
    startX = null;
    startY = null;
  }, { passive: true });

  async function loadBook() {
    if (!bookId) { showError('Escolha um livrinho na prateleira para começar.'); return; }
    try {
      const manifestResponse = await fetch(asset('books/index.json'));
      if (!manifestResponse.ok) throw new Error('Catálogo indisponível');
      const manifest = await manifestResponse.json();
      const entry = manifest.books?.find((item) => item.id === bookId);
      if (!entry) { showError('Este livrinho não foi encontrado.'); return; }
      const response = await fetch(asset(entry.data));
      if (!response.ok) throw new Error('Não foi possível baixar o livro');
      const data = await response.json();
      if (data.schemaVersion !== 1 || data.id !== entry.id || !Array.isArray(data.pages) || !data.pages.length) throw new Error('Livro inválido');
      book = data;
      document.title = `${label(book.title)} · Prateleira Mágica`;
      document.documentElement.lang = book.language || 'pt-BR';
      $('#bookBrand').textContent = label(book.title);
      $('#readerApp').hidden = false;
      render();
    } catch (error) {
      console.error('Erro ao abrir livro:', error);
      showError('Não foi possível abrir o livro. Se for o primeiro acesso, conecte-se à internet e tente novamente.');
    }
  }

  document.addEventListener('livrinhos:protagonist-changed', () => {
    if (!book) return;
    document.title = `${label(book.title)} · Prateleira Mágica`;
    $('#bookBrand').textContent = label(book.title);
    render();
  });
  loadBook();
})();
