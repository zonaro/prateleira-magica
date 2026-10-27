/* Leitor adaptativo: StPageFlip (MIT) em aparelhos capazes, páginas DOM simples
 * quando há movimentos reduzidos, poucos recursos ou travamento detectado.
 * Mantém a mesma API lógica, desafios, narrador e livro offline.
 */
(() => {
  'use strict';
  const PREFERENCE_KEY = 'prateleira-pageflip-preference-v1';
  const SLOW_KEY = 'prateleira-pageflip-slow-v1';
  const SLOW_TTL = 24 * 60 * 60 * 1000;
  const FALLBACK_MS = 2300;
  let engine = null;
  let folding = false;
  let mobile = false;
  let pageWidth = 0;
  let dragEnabled = true;
  let mode = 'animated';
  let bookRoot = null;
  let pageNodes = [];
  let logicalIndex = 0;
  let onFlip = null;
  let options = {};
  let firstTouch = null;
  let activeFrame = 0;
  let timeoutId = 0;
  let monitoring = false;
  let lastFrame = 0;
  let totalFrames = 0;
  let totalTime = 0;
  let delayedFrames = 0;

  function stored(key) {
    try { return window.localStorage?.getItem(key) || null; } catch { return null; }
  }
  function save(key, value) {
    try {
      if (value === null) window.localStorage?.removeItem(key);
      else window.localStorage?.setItem(key, value);
    } catch { /* bloqueio de armazenamento não impede ler o livro */ }
  }
  function preference() {
    const value = stored(PREFERENCE_KEY);
    return ['auto', 'light', 'animated'].includes(value) ? value : 'auto';
  }
  function setPreference(value) {
    if (!['auto', 'light', 'animated'].includes(value)) return false;
    save(PREFERENCE_KEY, value);
    if (value === 'animated') save(SLOW_KEY, null); // a criança pede para tentar novamente
    return true;
  }
  function slowRecently() {
    try {
      const timestamp = Number(stored(SLOW_KEY));
      return timestamp > 0 && Date.now() - timestamp < SLOW_TTL && Date.now() >= timestamp;
    } catch { return false; }
  }
  function isMobile() { return window.matchMedia('(max-width: 820px)').matches; }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function lowResources() {
    const memory = Number(window.navigator?.deviceMemory || 0);
    const cores = Number(window.navigator?.hardwareConcurrency || 0);
    return (memory > 0 && memory <= 2) || (cores > 0 && cores <= 2);
  }
  function shouldUseLight() {
    const choice = preference();
    return reducedMotion() || choice === 'light'
      || (choice !== 'animated' && (lowResources() || slowRecently()))
      || !window.St?.PageFlip;
  }
  function currentMode() { return mode; }
  function physicalPage(logical) { return logical * (mobile ? 1 : 2); }
  function busy() { return mode === 'animated' && folding; }

  function stopWatch() {
    monitoring = false;
    if (activeFrame && window.cancelAnimationFrame) window.cancelAnimationFrame(activeFrame);
    if (timeoutId && window.clearTimeout) window.clearTimeout(timeoutId);
    activeFrame = timeoutId = 0;
  }
  function leaveEngine() {
    stopWatch();
    if (engine) {
      try { engine.destroy(); } catch (error) { console.warn('Falha ao desmontar o livro:', error); }
      engine = null;
    }
    folding = false;
    dragEnabled = true;
  }
  function removeSimpleListeners() {
    bookRoot?.removeEventListener?.('touchstart', onTouchStart);
    bookRoot?.removeEventListener?.('touchend', onTouchEnd);
    bookRoot?.removeEventListener?.('touchcancel', onTouchCancel);
    firstTouch = null;
  }
  function destroy() {
    removeSimpleListeners();
    leaveEngine();
    bookRoot?.classList?.remove?.('reader-simple');
    bookRoot = null;
    pageNodes = [];
    onFlip = null;
    options = {};
  }

  function showSimple(logical, fireEvent = true) {
    const maximum = Math.floor((pageNodes.length - 1) / (mobile ? 1 : 2));
    if (logical < 0 || logical > maximum || !Number.isInteger(logical)) return false;
    logicalIndex = logical;
    for (let i = 0; i < pageNodes.length; i++) {
      const visible = Math.floor(i / (mobile ? 1 : 2)) === logical;
      pageNodes[i].hidden = !visible;
      pageNodes[i].setAttribute?.('aria-hidden', String(!visible));
      if ('inert' in pageNodes[i]) pageNodes[i].inert = !visible;
    }
    if (fireEvent) onFlip?.(logical);
    return true;
  }
  function onTouchStart(event) {
    if (event.touches?.length !== 1 || options.canDragPage?.(logicalIndex) === false) {
      firstTouch = null;
      return;
    }
    if (event.target?.closest?.('button,input,select,textarea,[data-say],[data-check],[contenteditable]')) {
      firstTouch = null;
      return;
    }
    firstTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function onTouchEnd(event) {
    if (!firstTouch || options.canDragPage?.(logicalIndex) === false) return;
    const point = event.changedTouches?.[0];
    if (!point) { firstTouch = null; return; }
    const dx = point.clientX - firstTouch.x;
    const dy = point.clientY - firstTouch.y;
    firstTouch = null;
    // Só swipe horizontal intencional: scroll vertical do texto fica livre.
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    showSimple(logicalIndex + (dx < 0 ? 1 : -1));
  }
  function onTouchCancel() { firstTouch = null; }
  function installSimple(index, reason = 'simple') {
    leaveEngine();
    if (!bookRoot) return;
    bookRoot.classList.add('reader-simple');
    bookRoot.replaceChildren(...pageNodes);
    mode = 'light';
    bookRoot.addEventListener('touchstart', onTouchStart, { passive: true });
    bookRoot.addEventListener('touchend', onTouchEnd, { passive: true });
    bookRoot.addEventListener('touchcancel', onTouchCancel, { passive: true });
    showSimple(index, false);
    options.onModeChange?.({ mode, reason });
  }
  function degrade(reason = 'slow') {
    if (mode !== 'animated' || !bookRoot) return;
    if (window.document?.hidden) { stopWatch(); return; }
    // O primeiro engasgo de fato desliga a engine pesada pelo restante da sessão
    // (e por até 24h); usar "Tentar animação" permite repetir o teste.
    save(SLOW_KEY, String(Date.now()));
    const parent = bookRoot.parentNode, nextSibling = bookRoot.nextSibling;
    removeSimpleListeners();
    leaveEngine();
    if (parent && !bookRoot.parentNode) parent.insertBefore(bookRoot, nextSibling);
    installSimple(logicalIndex, reason);
  }
  function watchFlip() {
    stopWatch();
    if (typeof window.requestAnimationFrame !== 'function' || mode !== 'animated') return;
    monitoring = true;
    lastFrame = totalFrames = totalTime = delayedFrames = 0;
    const step = (stamp) => {
      if (!monitoring || mode !== 'animated') return;
      if (window.document?.hidden) { stopWatch(); return; }
      if (lastFrame) {
        const gap = Math.max(0, stamp - lastFrame);
        totalTime += gap; totalFrames++;
        if (gap >= 90) delayedFrames++;
        // Um único congelamento forte ou vários quadros lentos são evidência.
        if (gap >= 230 || delayedFrames >= 3 || (totalFrames >= 8 && totalTime / totalFrames >= 48)) {
          degrade('slow');
          return;
        }
      }
      lastFrame = stamp;
      activeFrame = window.requestAnimationFrame(step);
    };
    activeFrame = window.requestAnimationFrame(step);
    if (typeof window.setTimeout === 'function') {
      timeoutId = window.setTimeout(() => {
        if (monitoring && mode === 'animated' && !window.document?.hidden) degrade('timeout');
      }, FALLBACK_MS);
    }
  }
  // No modo animado, o StPageFlip captura os gestos no livro. Em páginas
  // interativas, desligamos os handlers para permitir os controles.
  function setDragEnabled(allow) {
    if (!engine || dragEnabled === allow) return;
    const ui = engine.getUI?.();
    if (!ui?.removeHandlers || !ui?.setHandlers) return;
    if (allow) ui.setHandlers();
    else ui.removeHandlers();
    dragEnabled = allow;
  }
  function mount(book, pages, index, callback, settings = {}) {
    const parent = book.parentNode, nextSibling = book.nextSibling;
    destroy();
    if (parent && !book.parentNode) parent.insertBefore(book, nextSibling);
    bookRoot = book;
    pageNodes = pages;
    logicalIndex = index;
    onFlip = callback;
    options = settings;
    mobile = isMobile();
    const available = Math.max(290, Math.floor(book.getBoundingClientRect().width || book.clientWidth));
    pageWidth = Math.floor(available / (mobile ? 1 : 2));
    const height = mobile ? Math.max(660, Math.min(810, Math.round(window.innerHeight * .9)))
      : Math.max(620, Math.min(890, Math.round(pageWidth * 1.22)));
    book.style.height = height + 'px';
    book.classList.toggle('reader-portrait', mobile);
    book.classList.toggle('reader-landscape', !mobile);
    book.replaceChildren(...pages);
    if (shouldUseLight()) {
      const reason = reducedMotion() ? 'reduced-motion' : preference() === 'light'
        ? 'manual' : lowResources() ? 'low-resources' : slowRecently() ? 'slow-before' : 'unsupported';
      installSimple(index, reason);
    } else {
      mode = 'animated';
      book.classList.remove('reader-simple');
      engine = new window.St.PageFlip(book, {
        width: pageWidth,
        height,
        size: 'fixed',
        usePortrait: mobile,
        autoSize: false,
        showCover: false,
        drawShadow: !mobile, // menos sombras e trabalho em cada quadro no celular
        maxShadowOpacity: mobile ? .18 : .48,
        flippingTime: mobile ? 540 : 760,
        mobileScrollSupport: true,
        clickEventForward: true,
        disableFlipByClick: true,
        swipeDistance: 42,
        useMouseEvents: true
      });
      let ready = false;
      engine.on('changeState', (event) => {
        if (!ready) return;
        folding = event.data !== 'read';
        if (event.data === 'flipping') watchFlip();
        else if (event.data === 'read') stopWatch();
      });
      engine.on('flip', (event) => {
        if (!ready) return;
        stopWatch();
        folding = false;
        logicalIndex = Math.floor(event.data / (mobile ? 1 : 2));
        setDragEnabled(settings.canDragPage?.(logicalIndex) !== false);
        onFlip?.(logicalIndex);
      });
      engine.loadFromHTML(pages);
      engine.turnToPage(Math.min(pages.length - 1, physicalPage(index)));
      ready = true;
      setDragEnabled(settings.canDragPage?.(index) !== false);
      settings.onModeChange?.({ mode, reason: 'animated' });
    }
    return { mobile, pageWidth, height, mode };
  }
  function go(index, animate = true) {
    if (mode === 'light') return showSimple(index);
    if (!engine || busy()) return false;
    if (animate && !reducedMotion()) engine.flip(physicalPage(index), 'bottom');
    else engine.turnToPage(physicalPage(index));
    return true;
  }
  function needsResize(book) {
    if (!bookRoot) return false;
    const width = Math.floor(Math.max(290, book.getBoundingClientRect().width || book.clientWidth) / (isMobile() ? 1 : 2));
    return mobile !== isMobile() || Math.abs(width - pageWidth) > 20;
  }
  window.LivrinhoPageTurn = {
    mount, go, busy, destroy, needsResize, isMobile,
    currentMode, preference, setPreference, lowResources, shouldUseLight
  };
})();
