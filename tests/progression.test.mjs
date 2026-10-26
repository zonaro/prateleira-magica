import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/js/reader.js'), 'utf8');
const begin = source.indexOf('  function challengeComplete()');
const end = source.indexOf('  function notify(', begin);
assert(begin >= 0 && end > begin, 'Regras de navegação do desafio não encontradas');
const logic = source.slice(begin, end);
const rules = new Function('state', `let book = state.book; let completed = new Set(state.completed); ${logic}
return { challengeComplete, canVisit };`);
const book = {
  pages: [{ type: 'cover' }, { type: 'story' }, { type: 'challenge' }, { type: 'finish' }],
  exercises: [{}, {}, {}]
};
for (const indexes of [[], [0], [0, 1], [1, 2]]) {
  const partial = rules({ book, completed: indexes });
  assert.equal(partial.challengeComplete(), false);
  assert.equal(partial.canVisit(3), false, 'A página final precisa permanecer bloqueada');
  assert.equal(partial.canVisit(2), true, 'O desafio precisa continuar acessível');
}
const finished = rules({ book, completed: [0, 1, 2] });
assert.equal(finished.challengeComplete(), true);
assert.equal(finished.canVisit(3), true, 'A página da medalha deve liberar após todas as frases');
assert(source.includes("$('#next').disabled = challengeLocked"), 'Botão avançar deve ser bloqueado durante o desafio');
assert(source.includes('dot.disabled = true'), 'Bolinhas de páginas não podem pular o desafio');
assert(source.includes('if (!canVisit(destination))'), 'Setas e deslizes não podem pular o desafio');
assert(source.includes('rememberPage()'), 'Cada página visitada deve contar no progresso');
console.log('✓ Desafio final bloqueia botão, bolinhas, teclado e deslizes até todas as frases serem marcadas');
console.log('✓ A página final só libera com as 3/3 frases marcadas');
