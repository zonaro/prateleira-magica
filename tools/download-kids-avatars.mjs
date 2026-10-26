import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

// Importa os SVGs originais da coleção indicada pelo usuário, para consulta
// e criação de versões modulares. Não são carregados pelo PWA em tempo de uso.
const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'assets', 'avatar-reference', 'svgrepo-kids');
const base = 'https://www.svgrepo.com';

async function download(url) {
  const { stdout } = await exec('curl', ['-fsSL', '--retry', '2', '--max-time', '35', url], {
    encoding: 'utf8', maxBuffer: 3 * 1024 * 1024
  });
  return stdout;
}

const galleryPages = await Promise.all([
  download(`${base}/collection/kids-avatars/`),
  download(`${base}/collection/kids-avatars/2`)
]);
const entries = [...new Map(galleryPages.flatMap((html) =>
  [...html.matchAll(/href="\/svg\/(\d+)\/(boy|girl)"/g)].map((match) => {
    const [, id, kind] = match;
    return [id, { id, kind, file: `${id}-${kind}.svg` }];
  })
)).values()];
if (entries.length !== 75) throw Error(`Esperados 75 SVGs, encontrados ${entries.length}. Verifique a paginação.`);

await fs.mkdir(destination, { recursive: true });
let cursor = 0;
let completed = 0;
const failed = [];
async function worker() {
  while (cursor < entries.length) {
    const entry = entries[cursor++];
    const svgUrl = `${base}/show/${entry.id}/${entry.kind}.svg`;
    const pageUrl = `${base}/svg/${entry.id}/${entry.kind}`;
    entry.source = pageUrl;
    entry.download = svgUrl;
    entry.license = 'verificar-no-site';
    try {
      const outputFile = path.join(destination, entry.file);
      let svg;
      try { svg = await fs.readFile(outputFile, 'utf8'); } catch { svg = await download(svgUrl); }
      if (!/<svg[\s>]/.test(svg) || !/<\/svg>/.test(svg)) throw Error(`SVG inválido: ${svgUrl}`);
      await fs.writeFile(outputFile, svg, 'utf8');
      entry.downloaded = true;
      completed++;
    } catch (error) {
      entry.downloaded = false;
      entry.error = `Download indisponível: ${error.message.slice(0, 140)}`;
      failed.push(entry.id);
    }
    if ((completed + failed.length) % 10 === 0 || completed + failed.length === entries.length) {
      process.stdout.write(`Verificados ${completed + failed.length}/${entries.length}: ${completed} SVGs salvos\n`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
await fs.writeFile(path.join(destination, 'sources.json'), JSON.stringify({
  sourceCollection: `${base}/collection/kids-avatars/`,
  note: 'Arquivos SVG originais de referência. Conferir a licença individual antes de redistribuir ou utilizar o conteúdo em obras derivadas.',
  entries
}, null, 2) + '\n');
console.log(`Concluído: ${completed}/${entries.length} SVGs em assets/avatar-reference/svgrepo-kids/`);
if (failed.length) console.warn(`SVG(s) indisponível(is) no servidor de origem: ${failed.join(', ')}`);
