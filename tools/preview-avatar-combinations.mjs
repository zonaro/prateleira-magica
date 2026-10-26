// Gera SVGs de revisão visual sem iniciar navegador nem modificar os livros.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] || '/tmp/prateleira-avatar-revisao';
fs.mkdirSync(target, { recursive: true });
const context = { window: {} };
for (const filename of ['assets/js/avatar-parts.js', 'assets/js/pet-parts.js', 'assets/js/avatar.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, filename), 'utf8'), context);
}
const renderer = context.window.LivrinhoAvatar;
const settings = {
  skinColor: '#e9aa83', hairColor: '#7b4c35', outfitColor: '#79bc8d',
  bottomColor: '#5879b9', shoeColor: '#625a89', bottomStyle: 'pants'
};
for (const [hair] of renderer.hairStyles) {
  fs.writeFileSync(path.join(target, `hair-${hair}.svg`),
    renderer.avatarSVG({ ...settings, avatarStyle: hair, outfitStyle: 'tee' }));
}
for (const [outfit] of renderer.outfitStyles) {
  fs.writeFileSync(path.join(target, `outfit-${outfit}.svg`),
    renderer.avatarSVG({ ...settings, avatarStyle: 'short', outfitStyle: outfit, bottomStyle: 'shorts' }));
}
for (const [bottom] of renderer.bottomStyles) {
  fs.writeFileSync(path.join(target, `bottom-${bottom}.svg`),
    renderer.avatarSVG({ ...settings, avatarStyle: 'bob', outfitStyle: 'blouse', bottomStyle: bottom }));
}
for (const id of ['fox', 'turtle', 'rabbit', 'penguin']) {
  fs.writeFileSync(path.join(target, `pet-${id}.svg`),
    renderer.avatarSVG({ ...settings, avatarStyle: 'long', outfitStyle: 'dress', bottomStyle: 'skirt', petId: id }));
}
const cover = fs.readFileSync(path.join(root, 'assets/illustrations/ellie/cover.svg'), 'utf8');
const newSymbol = renderer.avatarSymbol('ellie', {
  skinColor: '#8bcfff', hairColor: '#493a55', outfitColor: '#fa7195',
  avatarStyle: 'braids', outfitStyle: 'blouse', bottomStyle: 'shorts',
  bottomColor: '#8c6bd0', shoeColor: '#f3a24e'
});
fs.writeFileSync(path.join(target, 'book-cover-sample.svg'),
  cover.replace(/<symbol id="ellie"[^>]*>[\s\S]*?<\/symbol>/, newSymbol)
    .replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
    .replace(/<use href=/g, '<use xlink:href='));
console.log(`SVGs reais para revisão visual: ${target}`);
