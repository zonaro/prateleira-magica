#!/usr/bin/env node
/**
 * Instala arquivos do MediaPipe SOMENTE para build/publicação do site.
 * Runtime: sem npm, sem CDN, sem upload de fotos, servido pelo mesmo origin.
 *
 * Uso: node tools/vendor-mediapipe.mjs
 * Requer Node >=20, npm e tar. Arquivos binários são ignorados pelo Git.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, copyFile, rm, writeFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'tools/mediapipe-dependencies.json'), 'utf8'));
const destination = path.join(root, 'assets/vendor/mediapipe');
const modelDest = path.join(destination, 'models');
const temp = await mkdtemp(path.join(os.tmpdir(), 'prateleira-mediapipe-'));
const files = [
  'vision_bundle.mjs',
  'wasm/vision_wasm_internal.js',
  'wasm/vision_wasm_internal.wasm',
  'wasm/vision_wasm_nosimd_internal.js',
  'wasm/vision_wasm_nosimd_internal.wasm'
];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} falhou: ${result.stderr || result.error?.message || result.stdout}`);
  }
  return result.stdout.trim();
}
function sha256(buf) { return createHash('sha256').update(buf).digest('hex'); }
async function download({ name, url, sha256: expected }) {
  const response = await fetch(url, { signal: AbortSignal.timeout(90000), redirect: 'follow' });
  if (!response.ok) throw new Error(`Falha baixando ${name}: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length < 100_000 || data.length > 45_000_000) {
    throw new Error(`Modelo ${name} com tamanho inesperado: ${data.length}`);
  }
  const hash = sha256(data);
  if (expected && hash !== expected) {
    throw new Error(`SHA-256 divergente de ${name}. Esperado: ${expected}. Recebido: ${hash}`);
  }
  // Arquivos .tflite usam FlatBuffers (TFL3 no offset 4). .task costuma ser ZIP,
  // mas a verificação criptográfica (quando fixada) é a proteção principal.
  if (name.endsWith('.tflite') && data.toString('ascii', 4, 8) !== 'TFL3') {
    throw new Error(`Modelo ${name} não parece ser um arquivo TFLite válido`);
  }
  await writeFile(path.join(modelDest, name), data);
  console.log(`  ${name}: ${data.length} bytes | sha256 ${hash}`);
  return { name, sha256: hash, bytes: data.length, url };
}

try {
  await mkdir(destination, { recursive: true });
  await mkdir(modelDest, { recursive: true });
  console.log(`Empacotando ${config.npmPackage}@${config.version} sem instalar dependências no app…`);
  const packOutput = run('npm', ['pack', `${config.npmPackage}@${config.version}`,
    '--ignore-scripts', '--silent', '--pack-destination', temp]);
  const tarName = packOutput.split(/\r?\n/).at(-1);
  assert(tarName && tarName.endsWith('.tgz'), 'npm pack não retornou o tarball');
  run('tar', ['-xzf', path.join(temp, tarName), '-C', temp]);
  const source = path.join(temp, 'package');
  for (const item of files) {
    const sourcePath = path.join(source, item);
    const size = (await stat(sourcePath)).size;
    assert(size > (item.endsWith('.wasm') ? 1_000_000 : 30_000), `Arquivo ausente ou inválido: ${item}`);
    await mkdir(path.dirname(path.join(destination, item)), { recursive: true });
    await copyFile(sourcePath, path.join(destination, item));
    console.log(`  ${item}: ${size} bytes`);
  }
  // Preserva avisos de licença do pacote Apache-2.0 distribuído pela npm.
  for (const name of ['LICENSE', 'NOTICE']) {
    try { await copyFile(path.join(source, name), path.join(destination, name)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const modelInfo = [];
  for (const item of config.models) modelInfo.push(await download(item));
  await writeFile(path.join(destination, 'BUILD-INFO.json'),
    JSON.stringify({ package: `${config.npmPackage}@${config.version}`, models: modelInfo }, null, 2) + '\n');
  console.log('✓ MediaPipe e modelos preparados para distribuição same-origin.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
