import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reader = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const start = reader.indexOf('  function updateListenButton()');
const end = reader.indexOf('  function renderText(', start);
assert(start > 0 && end > start, 'Funções de narração não encontradas');
const code = reader.slice(start, end);
const spoken = [];
let cancels = 0;
let pauses = 0;
let resumes = 0;
const synthesis = {
  speaking: false, paused: false,
  cancel() { cancels++; this.speaking = false; this.paused = false; },
  getVoices() { return [{ lang: 'pt-BR' }]; },
  speak(utterance) { spoken.push(utterance.text); this.speaking = true; },
  pause() { pauses++; this.paused = true; },
  resume() { resumes++; this.paused = false; }
};
const listen = { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } };
const icon = { textContent: '' };
const text = { textContent: '' };
const $ = (selector) => ({ '#listen': listen, '.listen-icon': icon, '.listen-text': text })[selector];
class Utterance { constructor(message) { this.text = message; } }
const make = new Function('window', '$', 'SpeechSynthesisUtterance', 'book', 'label', 'speechText', 'notify',
  `let voiceState = 'idle'; let currentSpeech = null; let page = 0;
${code}
return { hearCurrentPage, stopSpeech, getState: () => voiceState };`);
const controller = make({ speechSynthesis: synthesis }, $, Utterance,
  { language: 'pt-BR', pages: [{ title: 'Era uma vez', blocks: [{ text: 'O trem travesso.' }] }] },
  (value) => value, (value) => value, () => {});

controller.hearCurrentPage();
assert.equal(spoken.length, 1);
assert.equal(controller.getState(), 'playing');
assert.equal(listen.attributes['aria-label'], 'Pausar leitura');
controller.hearCurrentPage();
assert.equal(pauses, 1, 'Segundo clique deve pausar');
assert.equal(spoken.length, 1, 'Pausar não deve gerar outra fala');
assert.equal(controller.getState(), 'paused');
controller.hearCurrentPage();
assert.equal(resumes, 1, 'Terceiro clique deve retomar');
assert.equal(spoken.length, 1, 'Retomar não pode reiniciar a leitura');
assert.equal(controller.getState(), 'playing');
spoken.length = 0;
controller.stopSpeech();
assert.equal(controller.getState(), 'idle');
assert.equal(listen.attributes['aria-pressed'], 'false');
assert(cancels > 0);
console.log('✓ Narração alterna play → pause → resume sem reiniciar a fala');
