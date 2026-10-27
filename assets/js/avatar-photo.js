/* Avatar por foto: MediaPipe executado sob demanda, 100% vanilla JS.
 * Nenhuma imagem é enviada, persistida, serializada ou incluída no histórico.
 * Todos os binários são servidos na mesma origem, preparados no build e cacheados pelo PWA.
 */
(() => {
  'use strict';
  const color = window.LivrinhoAvatarPhotoColors;
  if (!color) return;

  // URLs absolutas same-origin funcionam no GitHub Pages (subpasta) e localhost.
  const MP_ROOT = new URL('./assets/vendor/mediapipe/', document.baseURI).href;
  const FACE_MODEL = MP_ROOT + 'models/face_landmarker.task';
  const MULTICLASS_MODEL = MP_ROOT + 'models/selfie_multiclass_256x256.tflite';
  // Só oferecer a aba se os recursos existem no mesmo domínio ou já estão no
  // cache do PWA. HEAD não baixa modelos grandes para apenas verificar a aba.
  const REQUIRED_ASSETS = [
    'vision_bundle.mjs',
    'wasm/vision_wasm_internal.js', 'wasm/vision_wasm_internal.wasm',
    'wasm/vision_wasm_nosimd_internal.js', 'wasm/vision_wasm_nosimd_internal.wasm',
    'models/face_landmarker.task', 'models/selfie_multiclass_256x256.tflite'
  ].map((file) => MP_ROOT + file);
  let availabilityPromise = null;

  async function checkAvailability() {
    if (!availabilityPromise) {
      availabilityPromise = (async () => {
        const available = await Promise.all(REQUIRED_ASSETS.map(async (url) => {
          try {
            if (typeof caches !== 'undefined' && await caches.match(url)) return true;
          } catch { /* Cache Storage pode estar bloqueado pelo navegador. */ }
          try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return response.ok;
          } catch { return false; }
        }));
        return available.every(Boolean);
      })().catch(() => false).then((ready) => {
        if (!ready) availabilityPromise = null; // permitir nova checagem ao reconectar
        return ready;
      });
    }
    return availabilityPromise;
  }
  // Classe: 0 fundo, 1 cabelo, 2 pele do corpo, 3 rosto, 4 roupa, 5 acessórios.
  const LABEL = Object.freeze({ hair: 1, face: 3, outfit: 4, accessory: 5 });
  const NATURAL_SKIN = ['#f5d4b3', '#e9aa83', '#c98760', '#a66846', '#75472f', '#4a2c28'];
  let modelPromise;

  function getModels() {
    if (!modelPromise) {
      modelPromise = (async () => {
        const mediapipe = await import(MP_ROOT + 'vision_bundle.mjs');
        const wasm = await mediapipe.FilesetResolver.forVisionTasks(MP_ROOT + 'wasm');
        const face = await mediapipe.FaceLandmarker.createFromOptions(wasm, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
          runningMode: 'IMAGE', numFaces: 2,
          minFaceDetectionConfidence: 0.6, minFacePresenceConfidence: 0.6
        });
        try {
          const segmenter = await mediapipe.ImageSegmenter.createFromOptions(wasm, {
            baseOptions: { modelAssetPath: MULTICLASS_MODEL, delegate: 'CPU' },
            runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false
          });
          return { face, segmenter };
        } catch (error) {
          face.close();
          throw error;
        }
      })().catch((error) => {
        modelPromise = null; // permitir nova tentativa se cache/modelos estiverem indisponíveis
        const unavailable = new Error('A magia da foto está descansando! Tente voltar quando ela estiver pronta. ✨');
        unavailable.avatarModelUnavailable = true;
        throw unavailable;
      });
    }
    return modelPromise;
  }

  function getBounds(points, width, height) {
    const xs = points.map((point) => point.x * width);
    const ys = points.map((point) => point.y * height);
    return { left: Math.max(0, Math.min(...xs)), top: Math.max(0, Math.min(...ys)),
      right: Math.min(width, Math.max(...xs)), bottom: Math.min(height, Math.max(...ys)) };
  }

  function boundedRect(x0, y0, x1, y1, width, height) {
    return { x0: Math.max(0, Math.floor(x0)), y0: Math.max(0, Math.floor(y0)),
      x1: Math.min(width, Math.ceil(x1)), y1: Math.min(height, Math.ceil(y1)) };
  }

  function pixelClass(mask, mx, my, x, y, width, height) {
    const sx = Math.min(mx - 1, Math.floor(x * mx / width));
    const sy = Math.min(my - 1, Math.floor(y * my / height));
    return mask[sy * mx + sx];
  }

  function samplePixels(pixels, mask, mx, my, width, height, rect, category, predicate) {
    const output = [];
    for (let y = rect.y0; y < rect.y1; y += 3) {
      for (let x = rect.x0; x < rect.x1; x += 3) {
        if (predicate && !predicate(x, y)) continue;
        if (pixelClass(mask, mx, my, x, y, width, height) !== category) continue;
        const i = (y * width + x) * 4;
        if (pixels[i + 3] < 240) continue;
        const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
        const light = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        if (light < 25 || light > 245) continue;
        output.push(rgb);
      }
    }
    return output;
  }

  function occupancy(mask, mx, my, width, height, rect, category) {
    let total = 0;
    let positives = 0;
    for (let y = rect.y0; y < rect.y1; y += 3) {
      for (let x = rect.x0; x < rect.x1; x += 3) {
        total++;
        if (pixelClass(mask, mx, my, x, y, width, height) === category) positives++;
      }
    }
    return { count: positives, ratio: positives / Math.max(total, 1) };
  }

  function estimateHair(mask, mx, my, width, height, bounds) {
    const w = bounds.right - bounds.left;
    const h = bounds.bottom - bounds.top;
    const lower = boundedRect(bounds.left - w * .35, bounds.bottom + h * .02,
      bounds.right + w * .35, bounds.bottom + h * .7, width, height);
    const upper = boundedRect(bounds.left - w * .25, bounds.top - h * .4,
      bounds.right + w * .25, bounds.top + h * .28, width, height);
    const length = occupancy(mask, mx, my, width, height, lower, LABEL.hair);
    const top = occupancy(mask, mx, my, width, height, upper, LABEL.hair);
    // Silhueta irregular sugere cachos, mas não garante textura real.
    let transitions = 0;
    let comparisons = 0;
    for (let y = upper.y0; y < upper.y1; y += 5) {
      let previous = null;
      for (let x = upper.x0; x < upper.x1; x += 5) {
        const current = pixelClass(mask, mx, my, x, y, width, height) === LABEL.hair;
        if (previous !== null) { comparisons++; if (current !== previous) transitions++; }
        previous = current;
      }
    }
    const rough = transitions / Math.max(1, comparisons);
    if (length.ratio > .10 && length.count > 40) return rough > .14 ? 'medium_waves' : 'long';
    if (top.count < 30) return null;
    return rough > .17 ? 'curly' : 'short';
  }

  function estimateGlasses(pixels, mask, mx, my, width, height, points, bounds) {
    const faceW = bounds.right - bounds.left;
    const faceH = bounds.bottom - bounds.top;
    const eyePairs = [[33, 133], [362, 263]];
    const frameSamples = [];
    const sides = eyePairs.map(([first, last]) => {
      const a = points[first], b = points[last];
      if (!a || !b) return { ratio: 0 };
      const cx = (a.x + b.x) * width / 2, cy = (a.y + b.y) * height / 2;
      const region = boundedRect(cx - faceW * .14, cy - faceH * .09,
        cx + faceW * .14, cy + faceH * .09, width, height);
      // A máscara de acessórios seleciona pixels da armação, não da pele ao redor.
      frameSamples.push(...samplePixels(pixels, mask, mx, my, width, height, region, LABEL.accessory));
      return occupancy(mask, mx, my, width, height, region, LABEL.accessory);
    });
    const bridge = points[168];
    let bridgeScore = 0;
    if (bridge) {
      const region = boundedRect(bridge.x * width - faceW * .065, bridge.y * height - faceH * .06,
        bridge.x * width + faceW * .065, bridge.y * height + faceH * .09, width, height);
      bridgeScore = occupancy(mask, mx, my, width, height, region, LABEL.accessory).ratio;
      frameSamples.push(...samplePixels(pixels, mask, mx, my, width, height, region, LABEL.accessory));
    }
    // A categoria "acessórios" NÃO identifica especificamente óculos.
    // Exigir sinais bilaterais e ponte reduz falsos positivos.
    const positive = sides.every((side) => side.count > 3 && side.ratio > .12)
      && bridgeScore > .05;
    return {
      value: Boolean(positive),
      color: positive && frameSamples.length >= 9 ? color.trimmedColor(frameSamples, .12) : null,
      confidence: positive ? 'estimativa' : 'baixa'
    };
  }

  /** Input: canvas local efêmero. Output: apenas opções de personalização. */
  async function analyze(frame, cancelled = () => false) {
    const models = await getModels();
    if (cancelled()) return null;
    const width = frame.width, height = frame.height;
    const faceResult = models.face.detect(frame);
    if (faceResult.faceLandmarks.length !== 1) {
      throw new Error(faceResult.faceLandmarks.length > 1
        ? 'Há mais de uma pessoa na foto. Escolha uma imagem com um único rosto.'
        : 'Não encontramos um rosto nítido. Tente uma foto de frente e bem iluminada.');
    }
    const landmarks = faceResult.faceLandmarks[0];
    const bounds = getBounds(landmarks, width, height);
    const w = bounds.right - bounds.left, h = bounds.bottom - bounds.top;
    if (w < width * .13 || h < height * .15) {
      throw new Error('O rosto está muito pequeno. Aproxime-se e tente de novo.');
    }
    const ctx = frame.getContext('2d', { willReadFrequently: true });
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const result = models.segmenter.segment(frame);
    try {
      const categoryMask = result.categoryMask;
      if (!categoryMask) throw new Error('Não foi possível separar as regiões da foto.');
      const mask = categoryMask.getAsUint8Array();
      const mw = categoryMask.width, mh = categoryMask.height;
      const faceRect = boundedRect(bounds.left + w * .12, bounds.top + h * .32,
        bounds.right - w * .12, bounds.top + h * .78, width, height);
      const cheeks = (x, y) => {
        const px = (x - bounds.left) / w, py = (y - bounds.top) / h;
        return ((px - .28) / .18) ** 2 + ((py - .57) / .20) ** 2 < 1
          || ((px - .72) / .18) ** 2 + ((py - .57) / .20) ** 2 < 1;
      };
      const skinSamples = samplePixels(pixels, mask, mw, mh, width, height,
        faceRect, LABEL.face, cheeks);
      if (skinSamples.length < 18) {
        throw new Error('A iluminação ou a posição do rosto dificultou a leitura. Tente outra foto.');
      }
      const skinRaw = color.trimmedColor(skinSamples);
      const skin = color.rgbFromHex(skinRaw);
      const luminance = skin[0] * .2126 + skin[1] * .7152 + skin[2] * .0722;
      if (luminance < 46 || luminance > 230) {
        throw new Error('A iluminação está muito escura ou estourada. Tente luz indireta.');
      }

      const hairRect = boundedRect(bounds.left - w * .45, bounds.top - h * .65,
        bounds.right + w * .45, bounds.top + h * 1.1, width, height);
      const torsoRect = boundedRect(bounds.left - w * .75, bounds.bottom + h * .08,
        bounds.right + w * .75, bounds.bottom + h * 1.65, width, height);
      const hairSamples = samplePixels(pixels, mask, mw, mh, width, height,
        hairRect, LABEL.hair);
      const outfitSamples = samplePixels(pixels, mask, mw, mh, width, height,
        torsoRect, LABEL.outfit);
      const catalog = window.LivrinhoAvatar;
      const readHair = hairSamples.length > 20 ? color.dominantHairColor(hairSamples) : null;
      const readOutfit = outfitSamples.length > 25 ? color.dominantHairColor(outfitSamples) : null;
      const glasses = estimateGlasses(pixels, mask, mw, mh, width, height, landmarks, bounds);
      return {
        skinColor: color.nearestColor(skinRaw, NATURAL_SKIN),
        hairColor: readHair ? color.nearestColor(readHair, catalog.hairColors) : null,
        outfitColor: readOutfit ? color.nearestColor(readOutfit, catalog.outfitColors) : null,
        avatarStyle: readHair ? estimateHair(mask, mw, mh, width, height, bounds) : null,
        glasses: glasses.value,
        accessoryColor: glasses.color ? color.nearestColor(glasses.color, catalog.accessoryColors) : null,
        glassesConfidence: glasses.confidence,
        raw: { skin: skinRaw, hair: readHair, outfit: readOutfit, glasses: glasses.color },
        warnings: [
          ...(!readHair ? ['Cabelo não identificado; mantivemos a escolha anterior.'] : []),
          ...(!readOutfit ? ['Roupa não identificada; mantivemos a cor anterior.'] : []),
          'Penteado e óculos são sugestões; revise no editor.'
        ]
      };
    } finally {
      result.close(); // libera máscaras e buffers nativos
    }
  }

  function mount({ onApply }) {
    const screen = document.getElementById('profilePhoto');
    const host = document.getElementById('avatarPhotoApp');
    if (!screen || !host) return;

    host.innerHTML = '<div class="avatar-photo-panel">' +
      '<div class="section-kicker">UMA PITADA DE MAGIA ✨</div>' +
      '<h2>📷 Sua foto vira personagem!</h2>' +
      '<p class="avatar-photo-intro">Que tal criar um personagem parecido com você? ' +
        'A Prateleira Mágica vai observar as cores do seu cabelo, rosto e roupa para imaginar um novo visual! 🌈</p>' +
      '<p class="avatar-photo-adult">🧑‍🧑‍🧒 <strong>Chame uma pessoa adulta para ajudar!</strong> ' +
        'Juntos, escolham uma foto só sua, de frente, com o rosto e a roupa aparecendo e bastante luz.</p>' +
      '<div class="avatar-photo-camera-area">' +
        '<div class="avatar-photo-camera-placeholder" aria-hidden="true">🪄📸✨</div>' +
        '<video class="avatar-photo-video" playsinline muted autoplay hidden aria-label="Prévia da câmera"></video>' +
      '</div>' +
      '<div class="avatar-photo-buttons">' +
        '<button type="button" data-action="camera">📷 Abrir a câmera</button>' +
        '<button type="button" data-action="capture" hidden>✨ Tirar minha foto</button>' +
        '<button type="button" data-action="file">🖼️ Escolher uma foto</button>' +
        '<a href="#personalizar" class="avatar-photo-back">🎨 Voltar a personalizar</a>' +
      '</div>' +
      '<input class="avatar-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>' +
      '<p class="avatar-photo-status" role="status" aria-live="polite">Tudo pronto para começar? 🌟</p>' +
      '<p class="avatar-photo-privacy">🔒 Sua foto fica só neste aparelho enquanto a mágica acontece. ' +
        'Depois, ela é descartada: guardamos apenas as cores e escolhas do seu personagem. ' +
        'Peça sempre a ajuda de um adulto!</p>' +
      '</div>';

    const find = (selector) => host.querySelector(selector);
    const video = find('video'), input = find('input');
    const status = find('.avatar-photo-status');
    const cameraButton = find('[data-action="camera"]');
    const captureButton = find('[data-action="capture"]');
    const chooseButton = find('[data-action="file"]');
    const placeholder = find('.avatar-photo-camera-placeholder');
    let stream = null, busy = false, runId = 0, activeFrame = null;
    const isActive = () => !screen.hidden && location.hash === '#foto';

    function scrubFrame() {
      if (!activeFrame) return;
      const canvas = activeFrame;
      activeFrame = null;
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.height = 0;
    }
    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      video.pause();
      video.srcObject = null;
      video.hidden = true;
      captureButton.hidden = true;
      placeholder.hidden = false;
    }
    function setBusy(value) {
      busy = value;
      cameraButton.disabled = value;
      captureButton.disabled = value;
      chooseButton.disabled = value;
    }
    function describeError(error) {
      if (error?.name === 'NotAllowedError') return 'A câmera não foi autorizada. Um adulto pode ajudar ou escolher uma foto. 🖼️';
      if (error?.name === 'NotFoundError') return 'Não encontramos uma câmera. Você pode escolher uma foto!';
      if (error?.name === 'NotReadableError') return 'A câmera está ocupada. Feche outro aplicativo e tente de novo.';
      return error?.message || 'A foto não deu certo desta vez. Vamos tentar outra? 🌟';
    }
    function reset() {
      runId++;
      stopCamera();
      scrubFrame();
      input.value = '';
      setBusy(false);
    }
    async function takeFrom(source) {
      if (busy || !isActive()) return;
      const token = ++runId;
      const width = source.videoWidth || source.width;
      const height = source.videoHeight || source.height;
      if (!width || !height) { status.textContent = 'Não conseguimos enxergar essa foto. Tente outra!'; return; }
      const scale = Math.min(1, 768 / Math.max(width, height));
      const frame = document.createElement('canvas');
      activeFrame = frame;
      frame.width = Math.max(1, Math.round(width * scale));
      frame.height = Math.max(1, Math.round(height * scale));
      const ctx = frame.getContext('2d', { willReadFrequently: true });
      if (!ctx) { status.textContent = 'Este aparelho não conseguiu abrir a imagem.'; stopCamera(); scrubFrame(); return; }
      try {
        ctx.drawImage(source, 0, 0, frame.width, frame.height);
        stopCamera();
        setBusy(true);
        status.textContent = '✨ Misturando cores e criando seu personagem…';
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (token !== runId || !isActive()) return;
        const extracted = await analyze(frame, () => token !== runId || !isActive());
        if (token !== runId || !isActive() || !extracted) return;
        onApply(extracted);
        reset();
        location.hash = '#personalizar';
      } catch (error) {
        if (token === runId && isActive()) {
          status.textContent = describeError(error);
          if (error?.avatarModelUnavailable) {
            window.dispatchEvent(new Event('livrinhos:avatar-photo-unavailable'));
          }
        }
      } finally {
        ctx.clearRect(0, 0, frame.width, frame.height);
        frame.width = frame.height = 0;
        if (activeFrame === frame) activeFrame = null;
        if (token === runId) setBusy(false);
      }
    }

    cameraButton.addEventListener('click', async () => {
      if (busy || !isActive()) return;
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        status.textContent = 'Para abrir a câmera, use um site seguro (HTTPS) ou escolha uma foto.';
        return;
      }
      const token = ++runId;
      setBusy(true);
      status.textContent = '📷 Pedindo licença para abrir a câmera…';
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({
          audio: false, video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }
        });
        if (token !== runId || !isActive()) { acquired.getTracks().forEach((track) => track.stop()); return; }
        stream = acquired;
        video.srcObject = acquired;
        video.hidden = false;
        placeholder.hidden = true;
        await video.play();
        if (token !== runId || !isActive()) { stopCamera(); return; }
        captureButton.hidden = false;
        status.textContent = 'Sorria para a câmera! Quando estiver pronto, tire sua foto. 😄';
      } catch (error) {
        stopCamera();
        if (token === runId && isActive()) status.textContent = describeError(error);
      } finally {
        if (token === runId) setBusy(false);
      }
    });
    captureButton.addEventListener('click', () => takeFrom(video));
    chooseButton.addEventListener('click', () => { if (isActive() && !busy) input.click(); });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file || !isActive()) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) {
        status.textContent = 'Escolha uma foto JPG, PNG ou WebP de até 10 MB.';
        input.value = '';
        return;
      }
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
        if (isActive()) await takeFrom(bitmap);
      } catch (error) {
        if (isActive()) status.textContent = describeError(error);
      } finally {
        bitmap?.close();
        input.value = '';
      }
    });
    window.addEventListener('hashchange', () => {
      if (location.hash !== '#foto') reset();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        reset();
        if (isActive()) status.textContent = 'A câmera descansou enquanto você saiu da página. 💤';
      }
    });
    window.addEventListener('pagehide', reset);
    return { close: reset };
  }

  window.LivrinhoAvatarPhoto = { mount, analyze, checkAvailability };
})();
