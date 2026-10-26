// Empacota os caminhos vetoriais EXATOS dos SVGs originais para compor o pet
// dentro do avatar também nas ilustrações offline e no backup SVG.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/pets/catalog.json'), 'utf8'));
if (catalog.pets.length !== 20) throw Error('Catálogo de pets incompleto');

// Limites visíveis medidos dos SVGs originais rasterizados em 512px. A região
// de exibição é recortada só pelo viewBox do contêiner; os caminhos não mudam.
const bounds512 = {
  dinosaur: [118, 96, 274, 294], crab: [66, 70, 362, 320], elk: [105, 51, 280, 357],
  jellyfish: [146, 81, 220, 353], penguin: [132, 112, 225, 296],
  'the-cow': [109, 101, 268, 304], turtle: [59, 120, 143, 172],
  bear: [126, 110, 272, 299], shrimp: [129, 71, 274, 335],
  rabbit: [143, 80, 228, 335], lion: [129, 93, 275, 315],
  squirrel: [106, 86, 327, 317], 'polar-bear': [86, 99, 304, 313],
  raccoon: [142, 100, 262, 308], 'wild-boar': [94, 116, 319, 257],
  crocodile: [102, 106, 324, 293], hedgehog: [138, 107, 253, 318],
  fox: [111, 92, 293, 321], 'cute-animals': [127, 65, 268, 363],
  whale: [78, 59, 340, 345]
};

const pets = {};
for (const item of catalog.pets) {
  const svg = fs.readFileSync(path.join(root, item.file), 'utf8');
  const match = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/);
  const viewBox = match?.[1].match(/viewBox="([^"]+)"/)?.[1];
  if (!match || !viewBox || /<script\b|<foreignObject\b|\son[a-z]+=|href=/i.test(svg)) {
    throw Error(`SVG não compatível com composição segura: ${item.file}`);
  }
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
  const [x, y, w, h] = bounds512[item.id] || [];
  if (![vx, vy, vw, vh, x, y, w, h].every(Number.isFinite)) throw Error(`Limites SVG inválidos: ${item.id}`);
  const padding = 22;
  const frame = [vx + (x - padding) / 512 * vw, vy + (y - padding) / 512 * vh,
    (w + padding * 2) / 512 * vw, (h + padding * 2) / 512 * vh]
    .map((value) => Math.round(value * 100) / 100).join(' ');
  pets[item.id] = { name: item.name, source: item.file, originalViewBox: viewBox, viewBox: frame, body: match[2] };
}
const target = path.join(root, 'assets/js/pet-parts.js');
const output = '/* GERADO de assets/pets/*.svg; vetores mantidos intactos. */\n'
  + 'window.LivrinhoPetParts = ' + JSON.stringify(pets) + ';\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    throw Error('pet-parts.js desatualizado: execute node tools/build-pet-parts.mjs');
  }
} else fs.writeFileSync(target, output);
console.log(`✓ ${Object.keys(pets).length} pets originais incluídos no catálogo offline`);
