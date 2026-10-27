// Empacota a arte original dos personagens prontos para uso offline e em SVGs
// exportados. <image href="arquivo.svg"> não funciona de forma confiável
// dentro de ilustrações renderizadas como Blob e exige uma conexão externa.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const presets = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/avatar-presets.json'), 'utf8'));
const layerMap = JSON.parse(fs.readFileSync(path.join(root, 'assets/avatar-reference/preset-layer-map.json'), 'utf8'));
const parts = Object.create(null);

for (const { sourceSvg } of presets) {
  if (!/^[0-9]+-(?:boy|girl)\.svg$/.test(sourceSvg)) throw Error(`Nome inválido: ${sourceSvg}`);
  if (parts[sourceSvg]) continue;
  const file = fs.readFileSync(path.join(root, 'assets/avatar-reference/svgrepo-kids', sourceSvg), 'utf8');
  const match = file.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  const viewBox = match?.[1].match(/\bviewBox="([^"]+)"/)?.[1];
  if (!viewBox || !/^0 0 \d+(?:\.\d+)? \d+(?:\.\d+)?$/.test(viewBox)) {
    throw Error(`SVG original inválido: ${sourceSvg}`);
  }
  // Estes desenhos são compostos exclusivamente de caminhos SVG sem IDs ou
  // recursos externos. Mantemos o interior sem alterar suas curvas ou cores.
  if (/<(?:image|use|script|foreignObject|style|defs)\b/i.test(match[2])) {
    throw Error(`Fonte com referência externa não suportada: ${sourceSvg}`);
  }
  const shapes = [...match[2].matchAll(/<(?:path|rect|circle|ellipse|polygon|polyline)\b[^>]*\/>/g)].map(m => m[0]);
  const roles = layerMap[sourceSvg];
  const roleNames = ['hairBack', 'face', 'outfit', 'hairFront'];
  if (!roles || roleNames.some((role) => !Array.isArray(roles[role]))) {
    throw Error(`Falta a separação das camadas: ${sourceSvg}`);
  }
  const seen = new Set(roleNames.flatMap(role => roles[role]));
  if (seen.size !== shapes.length || roleNames.reduce((n, role) => n + roles[role].length, 0) !== shapes.length
      || [...seen].some(i => !Number.isInteger(i) || i < 0 || i >= shapes.length)) {
    throw Error(`Camadas incompletas ou duplicadas: ${sourceSvg}`);
  }
  const layers = Object.fromEntries(roleNames.map(role => [role, roles[role].map(i => shapes[i]).join('')]));
  const roleByIndex = Object.fromEntries(roleNames.flatMap(role => roles[role].map(index => [index, role])));
  const segments = [];
  for (let index = 0; index < shapes.length; index++) {
    const role = roleByIndex[index];
    if (segments.at(-1)?.role === role) segments.at(-1).svg += shapes[index];
    else segments.push({ role, svg: shapes[index] });
  }
  const fill = (markup, fallback) => `#${markup.match(/fill:\s*#([0-9a-f]{6})/i)?.[1]?.toLowerCase() || fallback}`;
  parts[sourceSvg] = { viewBox, body: match[2].trim(), layers, segments,
    colors: {
      skinColor: fill(layers.face, 'e9aa83'),
      hairColor: fill(layers.hairBack || layers.hairFront, '493a55'),
      outfitColor: fill(layers.outfit, 'fa7195')
    } };
}

const target = path.join(root, 'assets/js/avatar-presets.js');
const output = `/* GERADO por tools/build-avatar-presets.mjs; não editar manualmente. */\nwindow.LivrinhoAvatarPresetParts = ${JSON.stringify(parts)};\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    throw Error('Personagens prontos desatualizados: execute node tools/build-avatar-presets.mjs');
  }
} else {
  fs.writeFileSync(target, output);
}
console.log(`✓ ${Object.keys(parts).length} personagens prontos empacotados em ${target}`);
