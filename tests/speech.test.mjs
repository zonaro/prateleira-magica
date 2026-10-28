import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/speech.js'), 'utf8');
const utterances = [];
let cancels = 0;
class Utterance { constructor(text) { this.text = text; } }
const synthesis = {
  speaking: false,
  getVoices() { return [{ lang: 'pt-BR', name: 'Voz brasileira' }]; },
  speak(utterance) { utterances.push(utterance); this.speaking = true; },
  cancel() { cancels++; this.speaking = false; }
};
const window = { speechSynthesis: synthesis, SpeechSynthesisUtterance: Utterance };
vm.runInNewContext(source, { window, console }, { filename: 'speech.js' });
const voice = window.LivrinhoSpeech;
assert(voice?.play && voice?.pause && voice?.resume && voice?.stop);

const states = [];
voice.subscribe((value) => states.push(value));
assert.equal(voice.supported(), true);
assert(voice.play('O trem travesso atravessou a trilha dos trevos. Mais um trecho para ler.', { lang: 'pt-BR' }));
assert.equal(utterances.length, 1);
assert.equal(voice.state(), 'playing');
assert.equal(utterances[0].voice.name, 'Voz brasileira');

// O navegador pode ainda não indicar speaking=true enquanto a voz é preparada.
synthesis.speaking = false;
const first = utterances[0];
first.onboundary({ name: 'word', charIndex: 15 });
assert(voice.pause());
assert.equal(voice.state(), 'paused');
assert(!voice.pause(), 'Dois toques em pausar não devem reiniciar a fila');
assert(voice.resume());
assert.equal(utterances.length, 2, 'Continuar deve criar o áudio do trecho restante');
assert.equal(utterances[1].text, first.text.slice(15), 'A retomada deve começar na última palavra, não no início');
assert.equal(voice.state(), 'playing');
first.onend();
assert.equal(voice.state(), 'playing', 'Eventos atrasados da fala cancelada não devem encerrar a retomada');

// Todos os trechos devem avançar sem repetir texto previamente concluído.
for (let index = 1; index < 20 && voice.state() === 'playing'; index++) {
  const utterance = utterances.at(-1);
  utterance.onend();
}
assert.equal(voice.state(), 'idle');
assert(states.includes('paused'));
assert(cancels >= 2);

// Sem suporte a boundary, o fallback retoma apenas o trecho curto em execução.
assert(voice.play('Primeiro trecho de teste. Segundo trecho com mais palavras de leitura.', { lang: 'pt-BR' }));
const noBoundary = utterances.at(-1);
assert(voice.pause());
assert(voice.resume());
assert.equal(utterances.at(-1).text, noBoundary.text);
voice.stop();
assert.equal(voice.state(), 'idle');

// O leitor deve controlar o narrador compartilhado pela barra de espaço/botão.
const reader = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const start = reader.indexOf('  function updateListenButton()');
const end = reader.indexOf('  function renderText(', start);
assert(start > 0 && end > start);
const buttons = {
  '#listen': { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } },
  '.listen-icon': { textContent: '' },
  '.listen-text': { textContent: '' }
};
const $ = (selector) => buttons[selector];
const make = new Function('narrator', '$', 'book', 'label', 'speechText', 'notify',
  `let page = 0;\n${reader.slice(start, end)}\nreturn { hearCurrentPage, updateListenButton };`);
const controller = make(voice, $, { pages: [{ title: 'Uma aventura', blocks: [{ text: 'O trem travesso.' }] }] },
  (value) => value, (value) => value, () => {});
controller.hearCurrentPage();
controller.updateListenButton();
assert.equal(buttons['.listen-text'].textContent, 'Pausar');
controller.hearCurrentPage();
controller.updateListenButton();
assert.equal(buttons['.listen-text'].textContent, 'Continuar');
controller.hearCurrentPage();
controller.updateListenButton();
assert.equal(buttons['.listen-text'].textContent, 'Pausar');
voice.stop();

const settings = fs.readFileSync(path.join(root, 'assets/js/parental-ui.js'), 'utf8');
const profile = fs.readFileSync(path.join(root, 'perfil.html'), 'utf8');
assert(settings.includes('id="parentHearName"') && settings.includes("$('#parentChildPronunciation').value.trim()"),
  'Área dos pais precisa testar o conteúdo atual do campo de pronúncia');
assert(settings.includes('LivrinhoSpeech?.play('), 'Área dos pais deve usar o narrador compartilhado');
assert(profile.includes('assets/js/speech.js') && fs.readFileSync(path.join(root, 'livro.html'), 'utf8').includes('assets/js/speech.js'));
console.log('✓ Narração pausa e continua do último limite de palavra, ignorando a pausa quebrada do navegador');
console.log('✓ Botão do leitor alterna Ouvir/Pausar/Continuar e responsáveis testam a pronúncia digitada');
