(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const root = new URL('./', document.baseURI);
  const asset = (path) => new URL(path, root).href;
  const preferences = window.LivrinhoPreferences;
  const pageTurn = window.LivrinhoPageTurn;
  const narrator = window.LivrinhoSpeech;
  const label = (value) => preferences ? preferences.personalize(value) : String(value || '');
  const params = new URLSearchParams(location.search);
  const bookId = params.get('livro');
  let completed = new Set();
  let book = null;
  let page = 0;
  let toastTimer;
  let activeMode = null;
  let mountedCount = 0;
  let resizeTimer;

  function challengeComplete() {
    return !book?.exercises?.length || (completed.size === book.exercises.length
      && book.exercises.every((_, index) => completed.has(index)));
  }
  function challengePageIndex() { return book.pages.findIndex((item) => item.type === 'challenge'); }
  function canVisit(target) {
    const challenge = challengePageIndex();
    return challenge < 0 || target <= challenge || challengeComplete();
  }
  function rememberPage() {
    const previous = preferences?.bookProgress(book.id).visitedPages || [];
    if (!previous.includes(page)) preferences?.recordBookProgress(book.id, { visitedPages: [...previous, page] }, book.exercises?.length || 0);
  }

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

  function updateListenButton() {
    const playing = narrator.state() === 'playing';
    const paused = narrator.state() === 'paused';
    $('#listen').setAttribute('aria-pressed', String(playing));
    $('#listen').setAttribute('aria-label', playing ? 'Pausar leitura' : paused ? 'Retomar leitura' : 'Ouvir página');
    $('.listen-icon').textContent = playing ? '⏸' : '▶';
    $('.listen-text').textContent = playing ? 'Pausar' : paused ? 'Continuar' : 'Ouvir';
  }
  function stopSpeech() {
    narrator.stop();
  }
  function speak(text) {
    if (!narrator.play(speechText(text), { lang: book?.language || 'pt-BR', rate: .78, pitch: 1.08 })) {
      notify('A leitura em voz alta não está disponível neste navegador.');
    }
  }

  function plainText(text) { return String(text).replace(/\[\[([^\]]+)\]\]/g, '$1'); }
  function hearCurrentPage() {
    const current = book.pages[page];
    const words = current.blocks.map((block) => plainText(label(block.text))).join(' ');
    if (narrator.state() === 'playing') {
      narrator.pause();
    } else if (narrator.state() === 'paused') {
      narrator.resume();
    } else {
      speak(label(current.speech || `${current.title}. ${words}`));
    }
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
      if (/^#[\da-f]{6}$/i.test(exercise.color || '')) {
        const colorDot = document.createElement('span');
        colorDot.className = 'challenge-color-dot';
        colorDot.style.backgroundColor = exercise.color;
        colorDot.title = window.LivrinhoColors?.name(exercise.color) || exercise.color;
        colorDot.setAttribute('aria-label', `Cor: ${colorDot.title}`);
        row.append(colorDot);
      }
      const phrase = document.createElement('button');
      phrase.type = 'button';
      phrase.className = 'challenge-say';
      phrase.dataset.say = label(exercise.text);
      phrase.textContent = label(exercise.text);
      phrase.setAttribute('aria-label', `Ouvir frase: ${label(exercise.text)}`);
      row.append(check, phrase);
      container.append(row);
    }
    if (challengeComplete()) {
      const message = document.createElement('div');
      message.className = 'medal';
      message.textContent = `${book.medal || '🏅 Medalha'} conquistada! Você já pode avançar!`;
      container.append(message);
    }
  }

  function createArt(current, pendingImages) {
    const panel = document.createElement('section');
    panel.className = 'art-panel';
    panel.setAttribute('aria-label', `Ilustração: ${label(current.title)}`);
    const img = document.createElement('img');
    img.src = asset(current.illustration);
    img.alt = `Ilustração: ${label(current.title)}`;
    img.draggable = false;
    if (preferences?.personalizeIllustration) pendingImages.push(preferences.personalizeIllustration(img, asset(current.illustration)));
    const sticker = document.createElement('div');
    sticker.className = 'art-sticker';
    sticker.textContent = label(current.sticker || '');
    panel.append(img, sticker);
    return panel;
  }

  function createRead(current) {
    const panel = document.createElement('section');
    panel.className = `read-panel${current.type === 'cover' ? ' cover' : ''}`;
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
    if (current.interactive === 'color-explorer' && window.LivrinhoColorExplorer) {
      story.append(window.LivrinhoColorExplorer.create());
    }
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
    panel.append(hint, pageNumber);
    return panel;
  }

  function updateVisiblePageNumbers() {
    for (const number of $('#book').querySelectorAll('[data-logical-page] .page-number')) {
      const logical = Number(number.closest('[data-logical-page]').dataset.logicalPage);
      number.textContent = `${String(logical + 1).padStart(2, '0')} / ${String(book.pages.length).padStart(2, '0')}`;
    }
  }

  function createPages(mobile) {
    const pages = [];
    const pendingImages = [];
    const challenge = challengePageIndex();
    const count = challenge >= 0 && !challengeComplete() ? challenge + 1 : book.pages.length;
    for (let index = 0; index < count; index++) {
      const current = book.pages[index];
      const art = createArt(current, pendingImages);
      const text = createRead(current);
      if (mobile) {
        const leaf = document.createElement('div');
        leaf.className = 'flip-page flip-combined';
        leaf.dataset.logicalPage = String(index);
        leaf.append(art, text);
        pages.push(leaf);
      } else {
        const artLeaf = document.createElement('div');
        artLeaf.className = 'flip-page flip-illustration';
        artLeaf.dataset.logicalPage = String(index);
        artLeaf.append(art);
        const textLeaf = document.createElement('div');
        textLeaf.className = 'flip-page flip-story';
        textLeaf.dataset.logicalPage = String(index);
        textLeaf.append(text);
        pages.push(artLeaf, textLeaf);
      }
    }
    return { pages, pendingImages };
  }

  async function mountPages() {
    const request = ++mountedCount;
    const { pages, pendingImages } = createPages(pageTurn.isMobile());
    await Promise.allSettled(pendingImages);
    if (request !== mountedCount) return;
    const staleBlobs = [...$('#book').querySelectorAll('img[data-avatar-blob]')].map((img) => img.dataset.avatarBlob);
    pageTurn.mount($('#book'), pages, page, onPageFlip, {
      canDragPage: (index) => !book.pages[index]?.interactive,
      onModeChange: ({ mode, reason }) => {
        // Informar a troca automática sem atrapalhar a leitura ou o progresso.
        if (book) updateControls();
        if (reason === 'slow' || reason === 'timeout') {
          notify('📖 Ativamos a leitura leve: este aparelho estava travando com a animação.');
        }
      }
    });
    for (const old of staleBlobs) URL.revokeObjectURL(old);
    updateVisiblePageNumbers();
    $('#readerApp').hidden = false;
    updateControls();
  }

  function updateControls() {
    $('#progressBar').style.width = `${(page + 1) / book.pages.length * 100}%`;
    $('#progressLabel').textContent = `Página ${page + 1} de ${book.pages.length}`;
    const exploring = Boolean(book.pages[page].interactive);
    const light = pageTurn.currentMode() === 'light';
    const guidance = light
      ? 'Deslize para os lados ou use Voltar/Próxima. Teclado: ← anterior · → próxima · Espaço para ouvir ou pausar.'
      : 'Arraste os cantos das páginas para virá-las. Teclado: ← anterior · → próxima · Espaço para ouvir ou pausar.';
    $('#book').setAttribute('aria-label', exploring
      ? 'Páginas do livrinho. Nesta atividade, use os botões ou o teclado para virar a página.'
      : (light ? 'Páginas do livrinho em modo leve. Deslize horizontalmente ou use os botões.' :
        'Páginas do livrinho. Arraste um canto para virar a página.'));
    $('.bottom-note').textContent = exploring
      ? 'Brinque à vontade com as cores! Para virar a página, use os botões Voltar ou Próxima. Teclado: ← anterior · → próxima · Espaço para ouvir ou pausar.'
      : 'Toque nas palavras coloridas para ouvi-las. ' + guidance;
    $('#pageAnimationMode').value = pageTurn.preference();
    $('#pageAnimationStatus').textContent = light ? '📖 Leitura leve ativa' : '✨ Virada animada';
    $('#prev').disabled = page === 0;
    const challengeLocked = book.pages[page].type === 'challenge' && !challengeComplete();
    $('#next').disabled = challengeLocked;
    $('.next-text').textContent = challengeLocked ? 'Desafio 🔒'
      : page === 0 ? 'Começar' : page === book.pages.length - 1 ? 'Reler' : 'Próxima';
    $('#next').setAttribute('aria-label', challengeLocked ? 'Marque todas as frases para continuar'
      : page === 0 ? 'Começar leitura' : page === book.pages.length - 1 ? 'Ler o livro novamente' : 'Próxima página');
    const dots = $('#dots');
    dots.replaceChildren();
    book.pages.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.dataset.page = String(index);
      dot.setAttribute('aria-label', `Ir para página ${index + 1}: ${label(item.title)}`);
      if (index === page) dot.setAttribute('aria-current', 'page');
      if (!canVisit(index)) {
        dot.disabled = true;
        dot.title = 'Complete todas as frases do desafio primeiro';
      }
      dots.append(dot);
    });
  }

  function onPageFlip(index) {
    if (!canVisit(index)) {
      pageTurn.go(page, false);
      notify('🔒 Complete todas as frases do desafio para avançar.');
      return;
    }
    if (index === page) return;
    stopSpeech();
    const returned = index < page;
    page = index;
    if (returned && preferences?.unlockYoYo?.()) {
      notify('🪀 Um ioiô mágico foi desbloqueado! Veja nos brinquedos do personagem.');
    }
    rememberPage();
    if (book.pages[page]?.type === 'finish') {
      preferences?.recordBookProgress(book.id, { finished: true }, book.exercises?.length || 0);
    }
    updateControls();
  }

  function go(target) {
    if (pageTurn?.busy()) return;
    const destination = Math.min(book.pages.length - 1, Math.max(0, target));
    if (!canVisit(destination)) {
      notify('🔒 Leia e marque todas as frases do desafio para receber a medalha!');
      return;
    }
    if (destination === page) return;
    pageTurn.go(destination);
  }

  function showError(message) {
    const error = $('#readerError');
    error.replaceChildren();
    error.append(document.createTextNode(`${message} `));
    const link = document.createElement('a');
    link.href = './prateleira.html';
    link.textContent = 'Voltar à prateleira';
    error.append(link);
    error.hidden = false;
  }

  $('#pageAnimationMode').addEventListener('change', (event) => {
    if (!pageTurn.setPreference(event.target.value)) return;
    if (!book) return;
    mountPages().catch((error) => {
      console.error('Falha ao trocar modo de virada:', error);
      showError('Não foi possível trocar o modo de leitura.');
    });
  });

  narrator.subscribe(updateListenButton);
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
      else { completed.add(index); notify(challengeComplete() ? `${book.medal || '🏅 Medalha'} conquistada!` : 'Muito bem! ⭐'); }
      preferences?.recordBookProgress(book.id, { completedExercises: [...completed] }, book.exercises.length);
      if (challengeComplete()) {
        // Acrescenta a folha de conclusão apenas depois que todas as frases forem marcadas.
        mountPages();
      } else {
        for (const button of $('#book').querySelectorAll('[data-check]')) {
          const rowIndex = Number(button.dataset.check);
          button.setAttribute('aria-pressed', String(completed.has(rowIndex)));
          button.textContent = completed.has(rowIndex) ? '✓' : book.exercises[rowIndex].syllable;
        }
        updateControls();
      }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!book || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
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
    if (book && (event.code === 'Space' || event.key === ' ')) event.preventDefault();
  });
  window.addEventListener('resize', () => {
    if (!book || !pageTurn.needsResize($('#book'))) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(mountPages, 230);
  });

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
      completed = new Set((preferences?.bookProgress(book.id).completedExercises || [])
        .filter((index) => index < (book.exercises?.length || 0)));
      const requested = Number(params.get('pagina'));
      if (Number.isInteger(requested) && requested >= 0 && requested < book.pages.length && canVisit(requested)) {
        page = requested;
      }
      document.title = `${label(book.title)} · Prateleira Mágica`;
      document.documentElement.lang = book.language || 'pt-BR';
      $('#readerApp').hidden = false;
      rememberPage();
      await mountPages();
    } catch (error) {
      console.error('Erro ao abrir livro:', error);
      showError('Não foi possível abrir o livro. Se for o primeiro acesso, conecte-se à internet e tente novamente.');
    }
  }

  document.addEventListener('livrinhos:protagonist-changed', () => {
    if (!book) return;
    completed = new Set((preferences?.bookProgress(book.id).completedExercises || [])
      .filter((index) => index < (book.exercises?.length || 0)));
    document.title = `${label(book.title)} · Prateleira Mágica`;
    mountPages();
  });
  loadBook();
})();
