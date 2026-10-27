/* Páginas flexíveis de verdade, com dobra, curvatura e arraste por mouse/toque.
 * Motor StPageFlip 2.0.7 (MIT), distribuído localmente em assets/vendor para uso offline.
 * Este adaptador apenas converte páginas físicas em páginas lógicas do livrinho.
 */
(() => {
  'use strict';
  let engine = null;
  let folding = false;
  let mobile = false;
  let pageWidth = 0;

  function isMobile() { return window.matchMedia('(max-width: 820px)').matches; }
  function physicalPage(logical) { return logical * (mobile ? 1 : 2); }
  function busy() { return folding; }

  function destroy() {
    if (engine) {
      try { engine.destroy(); } catch (error) { console.warn('Falha ao desmontar o livro:', error); }
      engine = null;
    }
    folding = false;
  }

  function mount(book, pages, logicalIndex, onFlip) {
    if (!window.St?.PageFlip) throw Error('O mecanismo de páginas não foi carregado.');
    const parent = book.parentNode;
    const nextSibling = book.nextSibling;
    destroy();
    // O destrutor do StPageFlip remove o elemento-raiz; recoloque-o antes de montar.
    if (parent && !book.parentNode) parent.insertBefore(book, nextSibling);
    mobile = isMobile();
    book.replaceChildren(...pages);
    const available = Math.max(290, Math.floor(book.getBoundingClientRect().width || book.clientWidth));
    pageWidth = Math.floor(available / (mobile ? 1 : 2));
    // No celular a ilustração e o texto compõem uma única folha, mais alta.
    // No desktop cada lado do livro corresponde a uma folha física.
    const height = mobile ? Math.max(660, Math.min(810, Math.round(window.innerHeight * .9)))
      : Math.max(620, Math.min(890, Math.round(pageWidth * 1.22)));
    book.style.height = `${height}px`;
    book.classList.toggle('reader-portrait', mobile);
    book.classList.toggle('reader-landscape', !mobile);
    engine = new window.St.PageFlip(book, {
      width: pageWidth,
      height,
      size: 'fixed',
      usePortrait: mobile,
      autoSize: false,
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: .48,
      flippingTime: 760,
      mobileScrollSupport: true,
      clickEventForward: true,
      disableFlipByClick: true,
      swipeDistance: 42,
      useMouseEvents: true
    });
    let ready = false;
    engine.on('changeState', (event) => { if (ready) folding = event.data !== 'read'; });
    engine.on('flip', (event) => {
      if (!ready) return;
      folding = false;
      onFlip(Math.floor(event.data / (mobile ? 1 : 2)));
    });
    engine.loadFromHTML(pages);
    engine.turnToPage(Math.min(pages.length - 1, physicalPage(logicalIndex)));
    ready = true;
    return { mobile, pageWidth, height };
  }

  function go(logicalIndex, animate = true) {
    if (!engine || busy()) return false;
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      engine.flip(physicalPage(logicalIndex), 'bottom');
    } else {
      engine.turnToPage(physicalPage(logicalIndex));
    }
    return true;
  }

  function needsResize(book) {
    if (!engine) return false;
    const width = Math.floor(Math.max(290, book.getBoundingClientRect().width || book.clientWidth) / (isMobile() ? 1 : 2));
    return mobile !== isMobile() || Math.abs(width - pageWidth) > 20;
  }

  window.LivrinhoPageTurn = { mount, go, busy, destroy, needsResize, isMobile };
})();
