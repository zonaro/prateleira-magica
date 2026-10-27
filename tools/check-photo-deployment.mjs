#!/usr/bin/env node
/**
 * Detecta se os arquivos do MediaPipe estão realmente acessíveis no Pages.
 * Uso: node tools/check-photo-deployment.mjs --local
 *      node tools/check-photo-deployment.mjs --public
 *
 * Sem imagens, câmera ou dados de crianças. --public usa HTTP HEAD e não
 * transfere os arquivos grandes; inclui query única para evitar cache CDN antigo.
 */
import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = process.env.PAGES_URL || 'https://zonaro.github.io/prateleira-magica/';
const base = pageUrl.endsWith('/') ? pageUrl : pageUrl + '/';
const assets = [
  ['vision_bundle.mjs', 100_000],
  ['wasm/vision_wasm_internal.js', 100_000],
  ['wasm/vision_wasm_internal.wasm', 1_000_000],
  ['wasm/vision_wasm_nosimd_internal.js', 100_000],
  ['wasm/vision_wasm_nosimd_internal.wasm', 1_000_000],
  ['models/face_landmarker.task', 1_000_000],
  ['models/selfie_multiclass_256x256.tflite', 1_000_000]
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function local() {
  for (const [name, minimum] of assets) {
    const location = path.join(root, 'assets/vendor/mediapipe', name);
    const file = await stat(location);
    assert(file.isFile() && file.size >= minimum, 'Arquivo de IA ausente/incompleto: ' + name);
    console.log('✓ Local', name, file.size, 'bytes');
  }
  const html = await readFile(path.join(root, 'perfil.html'), 'utf8');
  assert(html.includes('id="tabFoto"'), 'A aba Minha foto deve existir na página');
}
async function publicDeployment() {
  const retries = 18; // até ~90s para propagação após deploy-pages
  const marker = encodeURIComponent(process.env.GITHUB_SHA || Date.now().toString());
  for (let attempt = 1; attempt <= retries; attempt++) {
    const failures = [];
    for (const [name, minimum] of assets) {
      const url = new URL('assets/vendor/mediapipe/' + name, base);
      url.searchParams.set('deployment', marker);
      try {
        const response = await fetch(url, {
          method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(15_000)
        });
        const type = (response.headers.get('content-type') || '').toLowerCase();
        const size = Number(response.headers.get('content-length') || 0);
        // O CDN pode não informar o tamanho ou aplicar compressão em JS.
        if (!response.ok || type.includes('text/html') ||
            (size > 0 && size < Math.min(minimum, name.endsWith('.js') || name.endsWith('.mjs') ? 25_000 : minimum))) {
          failures.push(name + ': HTTP ' + response.status + ', ' + type + ', bytes=' + size);
        } else if (attempt === 1) {
          console.log('✓ Público', name, response.status, type, size || 'tamanho indisponível');
        }
      } catch (error) { failures.push(name + ': ' + error.message); }
    }
    if (failures.length === 0) {
      // Verificar também que o HTML servido contém a aba mais recente.
      const url = new URL('perfil.html', base);
      url.searchParams.set('deployment', marker);
      const htmlResponse = await fetch(url, {cache:'no-store',signal:AbortSignal.timeout(15_000)});
      if (htmlResponse.ok && (await htmlResponse.text()).includes('id="tabFoto"')) {
        console.log('✓ Publicação verificada: sete modelos/bibliotecas e aba Minha foto disponíveis.');
        return;
      }
      failures.push('perfil.html: aba não encontrada');
    }
    console.warn('Tentativa ' + attempt + '/' + retries + ': ' + failures.join(' | '));
    if (attempt < retries) await sleep(5_000);
  }
  throw Error('Deploy publicado sem os arquivos de IA necessários. Verifique Settings → Pages → Source = GitHub Actions.');
}

const mode = process.argv[2];
if (mode === '--local') await local();
else if (mode === '--public') await publicDeployment();
else throw Error('Uso: node tools/check-photo-deployment.mjs --local|--public');
