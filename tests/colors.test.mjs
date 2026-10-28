import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');
const styles = new Map();
const attrs = new Set();
const context = {
  document: {
    body: { classList: { add() {}, remove() {} } },
    documentElement: {
      style: { setProperty(key, value) { styles.set(key, value); }, removeProperty(key) { styles.delete(key); } },
      toggleAttribute(key, enabled) { if (enabled) attrs.add(key); else attrs.delete(key); }
    }
  }
};
context.window = context;
vm.createContext(context);
for (const file of ['assets/vendor/NameToColor.js', 'assets/vendor/NameToColor.ptBR.js', 'assets/js/colors.js']) {
  vm.runInContext(read(file), context, { filename: file });
}
const colors = context.LivrinhoColors;
assert.equal(colors.moods.length, 10, 'Deve expor os 10 moods da biblioteca original');
assert.equal(colors.hex('vermelho'), '#ff0000');
assert.equal(colors.hex('azul'), '#0000ff');
assert.equal(colors.hex('abraço'), colors.hex('abraço'), 'A geração precisa ser determinística');
assert.equal(colors.name('#ff0000'), 'Vermelho');
assert(colors.name('#aabbcc'), 'Cor sem nome deve ter um nome infantil próximo');
assert.equal(colors.palette('Calm').length, 5);
assert.equal(colors.palette('inexistente'), null);
const combinations = colors.harmonies('#fa7195', 'Fun');
assert.equal(combinations.length, 4);
assert.equal(combinations[1].colors.length, 3, 'Triádica usa três cores da roda');
assert.equal(combinations[0].colors.length, 5, 'Monocromática usa cinco tons');
assert.equal(combinations[3].colors.length, 5, 'Paleta por mood usa cinco cores');
colors.applyTheme('Calm');
assert(attrs.has('data-color-theme'));
assert(styles.has('--theme-page') && styles.has('--theme-accent'));
colors.applyTheme('');
assert(!attrs.has('data-color-theme'));
assert.equal(styles.size, 0, 'Tema original limpa todas as variáveis alteradas');

const appHtml = ['index.html', 'livro.html', 'perfil.html'].map(read);
for (const html of appHtml) {
  for (const file of ['NameToColor.js', 'NameToColor.ptBR.js', 'colors.js']) {
    assert(html.includes(file), `NameToColor não carrega em todas as páginas: ${file}`);
  }
}
const ui = read('assets/js/settings-ui.js');
for (const id of ['colorPickers', 'colorPicker', 'themeMood', 'applyThemeAvatar']) {
  assert(ui.includes(id), `Editor sem controle: ${id}`);
}
const pickerDefinitions = ui.slice(ui.indexOf('  const colorPickers ='), ui.indexOf('  const dialog ='));
const { colorPickers, colorPicker } = new Function(`${pickerDefinitions}\nreturn { colorPickers, colorPicker };`)();
const fields = ['skinColor','hairColor','outfitColor','accessoryColor','toyColor','waterColor','bottomColor','shoeColor'];
assert.deepEqual(colorPickers.map(([,field])=>field),fields,'Todas as oito cores precisam de uma palavra própria');
for (const [id,,name] of colorPickers) {
  const markup = colorPicker(id,'Outra cor',name);
  for (const expected of [`id="${id}" type="color"`, `id="${id}Word"`, `id="${id}Hear"`, `id="${id}Name"`]) {
    assert(markup.includes(expected), `Controle ausente no seletor ${id}: ${expected}`);
  }
  assert(markup.includes('type="button"') && markup.includes('maxlength="120"'), `Entrada inválida em ${id}`);
}
assert(ui.includes('const generated = colors?.hex(word.value.trim())'), 'Cada palavra deve ser convertida pelo NameToColor');
assert(ui.includes('draft[field] = generated'), 'Cor inventada deve alterar diretamente o campo do perfil');
assert(ui.includes('edit(field, () =>'), 'Cor inventada precisa de salvamento automático e desfazer');
assert(ui.includes('event.key === \'Enter\'') && ui.includes('event.preventDefault()'), 'Enter não deve enviar o formulário');
assert(ui.includes('narrator?.play(`Esta cor se chama ${colors.name(generated)}.'), 'Cada campo deve permitir ouvir o nome da cor');
assert(!ui.includes('magicColorWord') && !ui.includes('magicColorTarget') && !ui.includes('magicColorApply'),
  'A seção antiga de cores não deve continuar no editor');
assert(ui.includes('[draft.hairColor, draft.outfitColor, draft.bottomColor, draft.shoeColor] = palette.slice(0, 4)'),
  'Aplicar paleta ao avatar não deve tocar no tom da pele');
assert(ui.includes('lastSaved = preferences.save(next)'), 'Personalização deve salvar automaticamente a cada mudança');
assert(ui.includes('draft = preferences.clean(lastSaved)'),
  'Rascunho deve ser cópia independente; caso contrário o próximo clique não será salvo');
assert(ui.includes('undoHistory.push(lastSaved)') && ui.includes('undoHistory.pop()'),
  'O editor deve permitir desfazer escolhas feitas nesta visita');
const parentalUi = read('assets/js/parental-ui.js');
assert(!ui.includes('id="clearProfile"') && parentalUi.includes('preferences.removeProfile(selectedId)')
  && parentalUi.includes('window.confirm('),
  'Excluir o perfil e as conquistas deve ficar somente nas configurações dos pais com confirmação');
assert(!ui.includes('type="submit" class="settings-save"'), 'Não deve existir botão de salvar');
assert(!ui.includes('O NameToColor') && !ui.includes('imagem SVG'),
  'Termos técnicos não devem aparecer nas instruções para crianças');
assert(parentalUi.includes('↓ Exportar perfil') && parentalUi.includes('↑ Importar perfil'));
const reader = read('assets/js/reader.js');
assert(reader.includes('LivrinhoColorExplorer.create'), 'Página interativa não é renderizada no leitor');
const book = JSON.parse(read('books/o-reino-das-cores.json'));
assert(book.pages.some((page) => page.interactive === 'color-explorer'));
assert.equal(new Set(book.exercises.map((exercise) => exercise.color)).size, book.exercises.length,
  'Desafio precisa mostrar cor diferente em cada frase');
assert.equal(book.medal, '🎨 Medalha das Cores');
console.log('✓ NameToColor + pacote pt-BR integrados offline: palavras, cores e nomes');
console.log('✓ 10 moods, harmonias e tema global reversível');
console.log('✓ Oito color pickers com palavra livre, nome, ouvir, atualização direta, desfazer e paleta');
console.log('✓ Personalização com gravação automática e desfazer; exclusão de perfis reservada aos pais');
console.log('✓ Livro interativo com sete cores únicas no desafio e Medalha das Cores');
