/* Virada de página em CSS3, inspirada no efeito visual do Turn.js.
 * Implementação independente: não depende de jQuery nem modifica texto, som,
 * navegação, progresso ou comportamento dos controles do leitor.
 */
(() => {
  'use strict';
  let turning = false;

  function cleanedClone(node) {
    const clone = node.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    return clone;
  }

  function snapshot(book) {
    if (!book || turning) return null;
    return {
      art: cleanedClone(book.querySelector('.art-panel')),
      text: cleanedClone(book.querySelector('.read-panel'))
    };
  }

  function animate(book, previous, direction) {
    if (!previous || !book || turning || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    turning = true;
    const backwards = direction === 'backward';
    const mobile = window.matchMedia?.('(max-width: 820px)').matches;
    const layer = document.createElement('div');
    layer.className = `page-turn-layer ${backwards ? 'backward' : 'forward'}${mobile ? ' mobile-leaf' : ''}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;

    const still = document.createElement('div');
    still.className = 'page-turn-still';
    if (!mobile) still.append(backwards ? previous.text : previous.art);
    const leaf = document.createElement('div');
    leaf.className = 'page-turn-leaf';
    const front = document.createElement('div');
    front.className = 'page-turn-face page-turn-front';
    if (mobile) {
      const spread = document.createElement('div');
      spread.className = 'page-turn-mobile-spread';
      spread.append(previous.art, previous.text);
      front.append(spread);
    } else front.append(backwards ? previous.art : previous.text);
    const back = document.createElement('div');
    back.className = 'page-turn-face page-turn-back';
    const paperMark = document.createElement('span');
    paperMark.className = 'page-turn-watermark';
    paperMark.textContent = '✦';
    back.append(paperMark);
    leaf.append(front, back);
    layer.append(still, leaf);
    book.append(layer);

    let timeout;
    const finish = () => {
      if (!turning) return;
      turning = false;
      clearTimeout(timeout);
      layer.remove();
    };
    leaf.addEventListener('transitionend', (event) => {
      if (event.target === leaf && event.propertyName === 'transform') finish();
    });
    timeout = setTimeout(finish, 1000);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('turning')));
  }

  window.LivrinhoPageTurn = { snapshot, animate, busy: () => turning };
})();
