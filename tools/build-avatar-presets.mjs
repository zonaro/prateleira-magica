// Empacota a arte original dos personagens prontos para uso offline e em SVGs
// exportados. <image href="arquivo.svg"> não funciona de forma confiável
// dentro de ilustrações renderizadas como Blob e exige uma conexão externa.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const presets = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/avatar-presets.json'), 'utf8'));
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
  parts[sourceSvg] = { viewBox, body: match[2].trim() };
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
