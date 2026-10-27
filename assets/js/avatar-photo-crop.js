/* Geometria pura e testável do recorte 4:5, sem guardar ou enviar imagens. */
(() => {
  'use strict';
  const ratio = 4 / 5;
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));

  function rect(state) {
    const { width, height } = state;
    const zoom = clamp(Number(state.zoom) || 1, 1, 4);
    const baseWidth = Math.min(width, height * ratio);
    const cropWidth = baseWidth / zoom;
    const cropHeight = cropWidth / ratio;
    const cx = clamp(Number.isFinite(state.cx) ? state.cx : .5, cropWidth / (2 * width), 1 - cropWidth / (2 * width));
    const cy = clamp(Number.isFinite(state.cy) ? state.cy : .5, cropHeight / (2 * height), 1 - cropHeight / (2 * height));
    return {
      x: clamp(cx * width - cropWidth / 2, 0, width - cropWidth),
      y: clamp(cy * height - cropHeight / 2, 0, height - cropHeight),
      width: cropWidth, height: cropHeight, zoom
    };
  }
  function make(width, height) {
    if (!(width > 0 && height > 0)) throw new TypeError('Imagem inválida para recorte');
    return { width, height, cx: .5, cy: .5, zoom: 1 };
  }
  function pan(state, deltaX, deltaY, viewportWidth, viewportHeight) {
    const crop = rect(state);
    const limitX = crop.width / (2 * state.width);
    const limitY = crop.height / (2 * state.height);
    return {
      ...state,
      cx: clamp(state.cx - (deltaX / viewportWidth) * (crop.width / state.width), limitX, 1 - limitX),
      cy: clamp(state.cy - (deltaY / viewportHeight) * (crop.height / state.height), limitY, 1 - limitY)
    };
  }
  function draw(image, state, ctx, targetWidth, targetHeight) {
    const crop = rect(state);
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height,
      0, 0, targetWidth, targetHeight);
    return crop;
  }
  window.LivrinhoAvatarPhotoCrop = { make, rect, pan, draw, clamp };
})();
