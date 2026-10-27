import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/page-turn.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
const reader = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'livro.html'), 'utf8');
const bundle = fs.readFileSync(path.join(root, 'assets/vendor/page-flip.browser.js'), 'utf8');
let portrait = false;
let reducedMotion = false;
const received = [];
const host = {
  parentNode: { insertBefore(node) { node.parentNode = this; } },
  nextSibling: null,
  clientWidth: 1180,
  style: {},
  classList: { toggle(name, value) { this[name] = value; } },
  replaceChildren(...pages) { this.pages = pages; },
  getBoundingClientRect() { return { width: this.clientWidth }; }
};
class PageFlip {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.handlers = {};
    this.ui = { removeHandlers: () => { this.dragHandlers = false; }, setHandlers: () => { this.dragHandlers = true; } };
    this.dragHandlers = true;
    PageFlip.last = this;
  }
  getUI() { return this.ui; }
  on(name, callback) { this.handlers[name] = callback; }
  loadFromHTML(pages) { this.pages = pages; }
  turnToPage(index) { this.current = index; this.handlers.flip({ data: index }); }
  flip(index) {
    this.handlers.changeState({ data: 'flipping' });
    this.current = index;
    this.handlers.flip({ data: index });
    this.handlers.changeState({ data: 'read' });
  }
  destroy() { this.element.parentNode = null; }
}
const window = {
  innerHeight: 820,
  St: { PageFlip },
  matchMedia(query) { return { matches: query.includes('reduced-motion') ? reducedMotion : portrait }; }
};
vm.runInNewContext(source, { window, console });
const turn = window.LivrinhoPageTurn;
assert(turn?.mount && turn?.go && turn?.busy && turn?.needsResize);

turn.mount(host, Array.from({ length: 8 }, (_, i) => ({ i })), 0, (index) => received.push(index));
assert.equal(PageFlip.last.options.drawShadow, true);
assert.equal(PageFlip.last.options.usePortrait, false);
assert.equal(PageFlip.last.options.mobileScrollSupport, true, 'Gestos verticais devem permitir rolagem da história');
assert.equal(PageFlip.last.options.clickEventForward, true, 'Toque em palavras e desafio deve continuar');
assert.equal(PageFlip.last.options.disableFlipByClick, true, 'Folha deve ser puxada pelo canto e não por clique no texto');
assert.equal(turn.go(2), true);
assert.equal(PageFlip.last.current, 4, 'Duas faces físicas por página lógica no desktop');
assert.equal(received.at(-1), 2);
assert.equal(turn.busy(), false);

portrait = true;
host.clientWidth = 360;
assert(turn.needsResize(host));
turn.mount(host, Array.from({ length: 4 }, (_, i) => ({ i })), 2, (index) => received.push(index), {
  canDragPage: (index) => index !== 2
});
assert.equal(PageFlip.last.options.usePortrait, true);
assert.equal(PageFlip.last.current, 2, 'No celular cada página lógica deve ter uma única folha');
assert.equal(PageFlip.last.dragHandlers, false, 'Laboratório de cores deve soltar os gestos dos campos e botões');
assert.equal(turn.go(3), true);
assert.equal(PageFlip.last.current, 3);
assert.equal(PageFlip.last.dragHandlers, true, 'Ao sair do laboratório, o virar de páginas pelo dedo deve voltar');
turn.go(2);
assert.equal(PageFlip.last.dragHandlers, false, 'Retorno ao laboratório deve desligar o arraste novamente');
reducedMotion = true;
turn.go(1);
assert.equal(PageFlip.last.current, 1, 'Movimento reduzido usa mudança instantânea');
assert.equal(turn.needsResize(host), false);
turn.destroy();

assert(bundle.includes('St=') && bundle.includes('PageFlip'), 'Bundle real do motor de páginas indisponível');
assert(html.includes('assets/vendor/page-flip.browser.js'));
assert(html.includes('class="controls"') && !html.includes('reader-topbar'));
assert(css.includes('.reader-shell .controls{position:fixed'));
assert(css.includes('.reader-shell .book .stf__wrapper{position:relative;width:100%;height:100%'), 'Sem altura o motor corta a metade superior do livro');
assert(css.includes('object-fit:contain'), 'SVGs devem ser encaixados sem recorte');
assert(reader.includes('pageTurn.mount(') && reader.includes('pageTurn.go('));
assert(reader.includes('canDragPage: (index) => !book.pages[index]?.interactive'));
assert(reader.includes('if (!canVisit(destination))'), 'Desafio deve bloquear avanço pelo teclado e botões');
assert(reader.includes('const say = event.target.closest?.(\'[data-say]\')'));
assert(reader.includes('narrator.pause()') && reader.includes('narrator.resume()'), 'Ouvir deve pausar e continuar sem reiniciar');
assert(reader.includes('event.key === \'ArrowRight\'') && reader.includes('event.key === \'ArrowLeft\''));
console.log('✓ Motor MIT com dobra e gesto: páginas físicas desktop/mobile, avanço e movimento reduzido');
console.log('✓ Leitura por voz pausa/retoma, controles fixos, SVG inteiro e bloqueio de desafio');
