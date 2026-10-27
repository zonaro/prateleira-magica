// Diagnóstico HTTP público da aba de foto. Não busca nem processa fotos.
const root = 'https://zonaro.github.io/prateleira-magica/';
const assets = ['perfil.html','assets/js/avatar-photo.js','assets/js/profile-tabs.js',
'assets/vendor/mediapipe/vision_bundle.mjs','assets/vendor/mediapipe/wasm/vision_wasm_internal.js',
'assets/vendor/mediapipe/wasm/vision_wasm_internal.wasm',
'assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js',
'assets/vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm',
'assets/vendor/mediapipe/models/face_landmarker.task',
'assets/vendor/mediapipe/models/selfie_multiclass_256x256.tflite'];
for (const asset of assets) {
  const url = root + asset;
  for (const method of ['HEAD', 'GET']) {
    try {
      const controller = new AbortController();
      const response = await fetch(url, { method, signal: AbortSignal.timeout(15000), headers: { 'Cache-Control': 'no-cache' } });
      const info = { method, asset, status: response.status, type: response.headers.get('content-type'),
        length: response.headers.get('content-length'), url: response.url, redirect: response.redirected };
      console.log(JSON.stringify(info));
      if (method === 'GET') await response.body?.cancel();
    } catch (error) { console.log(JSON.stringify({ method, asset, error: error.message, cause: error.cause?.code })); }
  }
}
