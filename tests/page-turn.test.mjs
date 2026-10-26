import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(root, 'assets/js/page-turn.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
let reduced = false;
let mobile = false;

class Node {
  constructor(name) {
    this.name = name;
    this.children = [];
    this.handlers = {};
    this.attributes = {};
    this.className = '';
    this.classList = { add: (value) => { this.className += ` ${value}`; } };
  }
  cloneNode() { return new Node(this.name); }
  querySelectorAll() { return []; }
  removeAttribute(name) { delete this.attributes[name]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...elements) { for (const element of elements) this.children.push(element); }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  remove() { this.removed = true; }
}
const art = new Node('art-panel');
const read = new Node('read-panel');
const book = new Node('book');
book.querySelector = (selector) => selector === '.art-panel' ? art : read;
const window = { matchMedia: (query) => ({ matches: query.includes('reduced-motion') ? reduced : mobile }) };
vm.runInNewContext(js, {
  window,
  document: { createElement: (name) => new Node(name) },
  setTimeout: () => 42,
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => fn()
});

const turn = window.LivrinhoPageTurn;
assert(turn?.snapshot && turn?.animate && turn?.busy);
turn.animate(book, turn.snapshot(book), 'forward');
assert.equal(turn.busy(), true);
const layer = book.children.at(-1);
assert(layer.className.includes('forward') && layer.className.includes('turning'));
assert.equal(layer.attributes['aria-hidden'], 'true');
assert.equal(layer.children.length, 2, 'A animação deve formar uma parte fixa e uma folha');
assert.equal(layer.children[1].children.length, 2, 'A folha deve ter frente e verso');
assert.equal(turn.snapshot(book), null, 'Uma nova virada não começa antes da anterior terminar');
const leaf = layer.children[1];
leaf.handlers.transitionend({ target: leaf, propertyName: 'transform' });
assert.equal(turn.busy(), false);
assert(layer.removed);

mobile = true;
turn.animate(book, turn.snapshot(book), 'backward');
const mobileLayer = book.children.at(-1);
assert(mobileLayer.className.includes('mobile-leaf') && mobileLayer.className.includes('backward'));
const mobileLeaf = mobileLayer.children[1];
assert.equal(mobileLeaf.children[0].children[0].children.length, 2, 'No celular, ambas as metades viram juntas');
mobileLeaf.handlers.transitionend({ target: mobileLeaf, propertyName: 'transform' });

reduced = true;
const count = book.children.length;
turn.animate(book, turn.snapshot(book), 'forward');
assert.equal(turn.busy(), false, 'Preferência por movimento reduzido deve pular a animação');
assert.equal(book.children.length, count);

const reader = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
assert(reader.includes('pageTurn.animate(') && reader.includes('pageTurn?.snapshot('));
assert(reader.includes('if (!canVisit(destination))'), 'A virada não pode contornar o desafio bloqueado');
assert(reader.includes('document.addEventListener(\'keydown\''));
assert(reader.includes('const say = event.target.closest?.(\'[data-say]\')'));
assert(css.includes('rotateY(-180deg)') && css.includes('rotateY(180deg)'));
assert(css.includes('.page-turn-face.page-turn-back'));
console.log('✓ Virada 3D para frente/trás, frente/verso, mobile e movimento reduzido');
console.log('✓ Leitor mantém teclado, sons das palavras e bloqueio do desafio');
