/* Avatar por foto: MediaPipe executado sob demanda, 100% vanilla JS.
 * Nenhuma imagem é enviada, persistida, serializada ou incluída no histórico.
 * Os arquivos dos modelos/biblioteca são baixados no primeiro uso (ver docs).
 */
(() => {
  'use strict';
  const color = window.LivrinhoAvatarPhotoColors;
  if (!color) return;

  const MP_VERSION = '0.10.22';
  const MP_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VERSION;
  const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const MULTICLASS_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
  // Classe: 0 fundo, 1 cabelo, 2 pele do corpo, 3 rosto, 4 roupa, 5 acessórios.
  const LABEL = Object.freeze({ hair: 1, face: 3, outfit: 4, accessory: 5 });
  const NATURAL_SKIN = ['#f5d4b3', '#e9aa83', '#c98760', '#a66846', '#75472f', '#4a2c28'];
  let modelPromise;

  function getModels() {
    if (!modelPromise) {
      modelPromise = (async () => {
        const mediapipe = await import(MP_ROOT + '/vision_bundle.mjs');
        const wasm = await mediapipe.FilesetResolver.forVisionTasks(MP_ROOT + '/wasm');
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
        modelPromise = null; // permitir nova tentativa caso não haja rede
        throw error;
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

  function estimateGlasses(mask, mx, my, width, height, points, bounds) {
    const faceW = bounds.right - bounds.left;
    const faceH = bounds.bottom - bounds.top;
    const eyePairs = [[33, 133], [362, 263]];
    const sides = eyePairs.map(([first, last]) => {
      const a = points[first], b = points[last];
      if (!a || !b) return { ratio: 0 };
      const cx = (a.x + b.x) * width / 2;
      const cy = (a.y + b.y) * height / 2;
      return occupancy(mask, mx, my, width, height,
        boundedRect(cx - faceW * .14, cy - faceH * .065,
          cx + faceW * .14, cy + faceH * .075, width, height), LABEL.accessory);
    });
    const bridge = points[168];
    const bridgeScore = bridge ? occupancy(mask, mx, my, width, height,
      boundedRect(bridge.x * width - faceW * .055, bridge.y * height - faceH * .04,
        bridge.x * width + faceW * .055, bridge.y * height + faceH * .075,
        width, height), LABEL.accessory).ratio : 0;
    // Modelo multiclasse não é classificador de óculos; só sugerir quando há
    // sinais dos dois lados E na ponte. Não apagar óculos em um falso negativo.
    const positive = sides.every((side) => side.ratio > .16) && bridgeScore > .08;
    return { value: Boolean(positive), confidence: positive ? 'estimativa' : 'baixa' };
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
      const readHair = hairSamples.length > 20 ? color.trimmedColor(hairSamples) : null;
      const readOutfit = outfitSamples.length > 25 ? color.trimmedColor(outfitSamples) : null;
      const glasses = estimateGlasses(mask, mw, mh, width, height, landmarks, bounds);
      return {
        skinColor: color.nearestColor(skinRaw, NATURAL_SKIN),
        hairColor: readHair ? color.nearestColor(readHair, catalog.hairColors.slice(0, 5)) : null,
        outfitColor: readOutfit ? color.nearestColor(readOutfit, catalog.outfitColors) : null,
        avatarStyle: readHair ? estimateHair(mask, mw, mh, width, height, bounds) : null,
        glasses: glasses.value,
        glassesConfidence: glasses.confidence,
        raw: { skin: skinRaw, hair: readHair, outfit: readOutfit },
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

  function mount({ editor, onApply }) {
    const toolbar = editor.querySelector('.editor-history-tools');
    if (!toolbar) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'avatar-photo-start';
    button.textContent = '📷 Criar pela minha foto';
    toolbar.insertAdjacentElement('afterend', button);

    const modal = document.createElement('dialog');
    modal.className = 'avatar-photo-modal';
    modal.setAttribute('aria-label', 'Criar avatar a partir de uma foto');
    modal.innerHTML = '<div class="avatar-photo-panel">' +
      '<h2>📷 Meu avatar por foto</h2>' +
      '<p>Use uma foto com seu rosto e a parte de cima da roupa, de frente, com boa luz.</p>' +
      '<video class="avatar-photo-video" playsinline muted autoplay hidden aria-label="Prévia da câmera"></video>' +
      '<div class="avatar-photo-buttons">' +
        '<button type="button" data-action="camera">Abrir câmera</button>' +
        '<button type="button" data-action="capture" hidden>📸 Tirar foto</button>' +
        '<button type="button" data-action="file">Escolher imagem</button>' +
        '<button type="button" data-action="close">Cancelar</button>' +
      '</div>' +
      '<input class="avatar-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>' +
      '<p class="avatar-photo-status" role="status" aria-live="polite"></p>' +
      '<p class="avatar-photo-privacy">🔒 A foto é analisada no aparelho, não é salva nem enviada pelo aplicativo. ' +
      'Na primeira utilização, os modelos são baixados da internet. Peça ajuda a um responsável.</p>' +
      '</div>';
    editor.append(modal);
    const find = (selector) => modal.querySelector(selector);
    const video = find('video'), input = find('input');
    const status = find('.avatar-photo-status');
    const cameraButton = find('[data-action="camera"]');
    const captureButton = find('[data-action="capture"]');
    const chooseButton = find('[data-action="file"]');
    let stream = null, busy = false, runId = 0, activeFrame = null;

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
    }
    function setBusy(value) {
      busy = value;
      cameraButton.disabled = value;
      captureButton.disabled = value;
      chooseButton.disabled = value;
    }
    function describeError(error) {
      if (error?.name === 'NotAllowedError') return 'A câmera foi bloqueada. Permita o acesso ou envie uma imagem.';
      if (error?.name === 'NotFoundError') return 'Nenhuma câmera encontrada. Escolha uma imagem.';
      if (error?.name === 'NotReadableError') return 'A câmera está ocupada. Feche outros aplicativos.';
      return error?.message || 'Não foi possível analisar a foto. Tente novamente.';
    }
    function close() {
      runId++;
      stopCamera();
      scrubFrame();
      input.value = '';
      if (modal.open) modal.close();
    }

    async function takeFrom(source) {
      if (busy) return;
      const token = ++runId;
      const width = source.videoWidth || source.width;
      const height = source.videoHeight || source.height;
      if (!width || !height) { status.textContent = 'Não conseguimos ler esta imagem.'; return; }
      // Limitar dimensões ajuda a não esgotar a RAM de celulares modestos.
      const scale = Math.min(1, 768 / Math.max(width, height));
      const frame = document.createElement('canvas');
      activeFrame = frame;
      frame.width = Math.max(1, Math.round(width * scale));
      frame.height = Math.max(1, Math.round(height * scale));
      const ctx = frame.getContext('2d', { willReadFrequently: true });
      if (!ctx) { status.textContent = 'Seu navegador não oferece Canvas 2D.'; stopCamera(); scrubFrame(); return; }
      try {
        ctx.drawImage(source, 0, 0, frame.width, frame.height);
        stopCamera();
        setBusy(true);
        status.textContent = 'Analisando apenas neste aparelho…';
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (token !== runId || !modal.open) return;
        const extracted = await analyze(frame, () => token !== runId || !modal.open);
        if (token !== runId || !modal.open || !extracted) return;
        onApply(extracted);
        close();
      } catch (error) {
        if (token === runId) status.textContent = describeError(error);
      } finally {
        ctx.clearRect(0, 0, frame.width, frame.height);
        frame.width = frame.height = 0; // libera pixels do Canvas
        if (activeFrame === frame) activeFrame = null;
        setBusy(false);
      }
    }

    button.addEventListener('click', () => {
      status.textContent = 'Sua foto será descartada após a análise.';
      modal.showModal();
    });
    cameraButton.addEventListener('click', async () => {
      if (busy) return;
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        status.textContent = 'A câmera exige HTTPS ou localhost. Use uma imagem salva.';
        return;
      }
      setBusy(true);
      status.textContent = 'Solicitando permissão para a câmera…';
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({
          audio: false, video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }
        });
        if (!modal.open) { acquired.getTracks().forEach((track) => track.stop()); return; }
        stream = acquired;
        video.srcObject = acquired;
        video.hidden = false;
        await video.play();
        captureButton.hidden = false;
        status.textContent = 'Olhe para a câmera e toque em Tirar foto.';
      } catch (error) {
        stopCamera();
        status.textContent = describeError(error);
      } finally { setBusy(false); }
    });
    captureButton.addEventListener('click', () => takeFrom(video));
    chooseButton.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) {
        status.textContent = 'Use JPG, PNG ou WebP com até 10 MB.';
        input.value = '';
        return;
      }
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
        if (modal.open) await takeFrom(bitmap);
      } catch (error) {
        status.textContent = describeError(error);
      } finally {
        bitmap?.close();
        input.value = '';
      }
    });
    find('[data-action="close"]').addEventListener('click', close);
    modal.addEventListener('close', () => { runId++; stopCamera(); scrubFrame(); input.value = ''; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && modal.open) {
        stopCamera();
        status.textContent = 'A câmera foi desligada porque a página saiu de foco.';
      }
    });
    window.addEventListener('pagehide', close);
    return { close };
  }

  window.LivrinhoAvatarPhoto = { mount, analyze };
})();
