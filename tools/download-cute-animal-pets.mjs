// Baixa os arquivos SVG originais (sem alterar seus bytes) da coleção indicada.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'assets/pets');
const collection = 'https://www.svgrepo.com/collection/cute-animal-vectors/';
const labels = new Map([
  ['dinosaur', 'Dinossauro'], ['crab', 'Caranguejo'], ['elk', 'Alce'],
  ['jellyfish', 'Água-viva'], ['penguin', 'Pinguim'], ['the-cow', 'Vaquinha'],
  ['turtle', 'Tartaruga'], ['bear', 'Urso'], ['shrimp', 'Camarão'],
  ['rabbit', 'Coelho'], ['lion', 'Leão'], ['squirrel', 'Esquilo'],
  ['polar-bear', 'Urso-polar'], ['raccoon', 'Guaxinim'], ['wild-boar', 'Javali'],
  ['crocodile', 'Crocodilo'], ['hedgehog', 'Ouriço'], ['fox', 'Raposa'],
  ['cute-animals', 'Bichinhos'], ['whale', 'Baleia']
]);

async function download(url) {
  const { stdout } = await run('curl', ['-fsSL', '--retry', '2', '--max-time', '35', url], {
    encoding: 'buffer', maxBuffer: 4 * 1024 * 1024
  });
  return stdout;
}

const html = (await download(collection)).toString('utf8');
const links = [...html.matchAll(/href="\/svg\/(\d+)\/([a-z0-9-]+)"/g)]
  .map((match) => ({ id: match[1], slug: match[2] }));
const entries = [...new Map(links.map((item) => [item.id, item])).values()];
if (entries.length !== 20 || entries.some(({ slug }) => !labels.has(slug))) {
  throw Error(`Coleção inesperada: ${entries.length} pets. Confira antes de atualizar.`);
}

await fs.mkdir(target, { recursive: true });
const catalog = [];
for (const entry of entries) {
  const filename = `${entry.id}-${entry.slug}.svg`;
  const source = `https://www.svgrepo.com/svg/${entry.id}/${entry.slug}`;
  const downloadUrl = `https://www.svgrepo.com/show/${entry.id}/${entry.slug}.svg`;
  const filePath = path.join(target, filename);
  const page = (await download(source)).toString('utf8');
  // Next.js insere comentários HTML entre “CC0” e “License”.
  if (!page.includes('/page/licensing/#CC0')) throw Error(`Licença CC0 não confirmada: ${source}`);
  let svg;
  try { svg = await fs.readFile(filePath); }
  catch { svg = await download(downloadUrl); }
  const decoded = svg.toString('utf8');
  if (!/<svg(?:\s|>)/.test(decoded) || !/<\/svg>/.test(decoded)) {
    throw Error(`SVG inválido: ${downloadUrl}`);
  }
  await fs.writeFile(filePath, svg);
  catalog.push({ id: entry.slug, name: labels.get(entry.slug), file: `assets/pets/${filename}`, source, license: 'CC0' });
  process.stdout.write(`${catalog.length}/20: ${filename}\n`);
}
await fs.writeFile(path.join(target, 'catalog.json'), JSON.stringify({
  schemaVersion: 1, sourceCollection: collection, pets: catalog
}, null, 2) + '\n');
console.log('Coleção completa: 20 SVGs originais preservados.');
