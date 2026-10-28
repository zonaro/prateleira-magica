import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
function element() {
  const handlers = new Map();
  return {
    handlers, hidden: false, disabled: false, value: '', files: [], width: 360, height: 450,
    classList: { toggle() {} },
    addEventListener(type, listener) {
      handlers.set(type, [...(handlers.get(type) || []), listener]);
    },
    setAttribute() {}, focus() {}, pause() {}, async play() {}, setPointerCapture() {},
    getBoundingClientRect() { return { width: 360, height: 450 }; },
    getContext() { return { drawImage() {}, clearRect() {}, setTransform() {} }; }
  };
}
const screen = { hidden: false }, host = element();
const fileInput = element(), zoomInput = element(), video = element();
const cameraArea = element(), cameraActions = element(), cropPanel = element(), preview = element();
const status = element(), captureButton = element(), chooseLabel = element();
const resetCropButton = element(), cancelCropButton = element(), analyzeButton = element();
const placeholder = element();
const nodes = {
  'video': video, 'input': zoomInput,
  'input.avatar-photo-input[type="file"]': fileInput,
  '.avatar-photo-status': status,
  '[data-action="capture"]': captureButton, '[data-action="file"]': chooseLabel,
  '.avatar-photo-camera-area': cameraArea, '.avatar-photo-buttons': cameraActions,
  '.avatar-photo-camera-placeholder': placeholder,
  '.avatar-photo-crop-editor': cropPanel, '.avatar-photo-crop-preview': preview,
  '.avatar-photo-zoom': zoomInput, '[data-action="analyze"]': analyzeButton,
  '[data-action="reset-crop"]': resetCropButton, '[data-action="cancel-crop"]': cancelCropButton
};
host.querySelector = (selector) => {
  assert(selector in nodes, 'Campo desconhecido: '+selector);
  return nodes[selector];
};
const document = {
  baseURI: 'https://zonaro.github.io/prateleira-magica/',
  getElementById(id) { return {profilePhoto:screen, avatarPhotoApp:host}[id] || null; },
  createElement(tag) { assert.equal(tag, 'canvas'); const canvas = element(); canvas.width = canvas.height = 0; return canvas; },
  addEventListener() {}
};
let bitmapClosed = false;
const location = { hash:'#foto' }, events = {};
const window = {
  LivrinhoAvatarPhotoColors: {},
  LivrinhoParental: { photoAllowed() { return true; } },
  isSecureContext: true,
  addEventListener(event,fn) { events[event] = fn; },
  dispatchEvent() {}
};
let cameraStarts = 0, tracksStopped = 0;
const navigator = { mediaDevices: { async getUserMedia() {
  cameraStarts++;
  return { getTracks() { return [{ stop() { tracksStopped++; } }]; } };
} } };
vm.runInNewContext(read('assets/js/avatar-photo-crop.js'), {window}, {filename:'avatar-photo-crop.js'});
let bitmapCreated = 0;
vm.runInNewContext(read('assets/js/avatar-photo.js'), {
  window, document, location, URL, console, navigator,
  createImageBitmap: async () => {
    bitmapCreated++;
    return { width:1200, height:1600, close(){ bitmapClosed=true; } };
  }
}, {filename:'avatar-photo.js'});
const mount = window.LivrinhoAvatarPhoto.mount;
assert.equal(typeof mount, 'function');
mount({ onApply() {} });
assert(host.innerHTML.includes('<label class="avatar-photo-file-control"'));
assert(host.innerHTML.includes('<input class="avatar-photo-input" type="file"'));
assert(!host.innerHTML.includes('data-action="camera"'), 'Abrir a câmera não deve ter botão');
assert.equal(typeof events['livrinhos:avatar-photo-open'], 'function');
await events['livrinhos:avatar-photo-open']();
assert.equal(cameraStarts, 1, 'Câmera abre automaticamente ao entrar em Minha Foto');
assert.equal(video.hidden, false, 'Prévia deve aparecer após abrir a câmera');
assert.equal(captureButton.hidden, false, 'Botão Tirar minha foto deve aparecer');
events['livrinhos:reading-time-expired']();
assert.equal(video.hidden, true, 'Esgotar o tempo deve desligar a prévia da câmera');
assert.equal(tracksStopped, 1, 'Esgotar o tempo deve parar a captura física');
await events['livrinhos:reading-time-restored']();
assert.equal(cameraStarts, 2, 'Após o responsável liberar o tempo, a câmera volta');
assert(!host.innerHTML.includes('type="file" accept="image/jpeg,image/png,image/webp" hidden'));
assert(fileInput.handlers.has('change'), 'Evento change deve estar no arquivo real');
assert(!zoomInput.handlers.has('change'), 'Slider de zoom não deve receber evento de upload');
assert(!chooseLabel.handlers.has('click'), 'Abertura de arquivos deve ser nativa, não por .click() JS');
assert(zoomInput.handlers.has('input'), 'Controle de zoom deve continuar ativo');
fileInput.files=[{type:'image/png',size:1500,name:'foto.png'}];
await fileInput.handlers.get('change')[0]();
assert.equal(bitmapCreated,1,'Arquivo selecionado deve chegar à decodificação');
assert(bitmapClosed,'ImageBitmap deve ser liberado');
assert.equal(cropPanel.hidden,false,'Galeria deve abrir etapa de crop');
assert.equal(cameraArea.hidden,true,'Prévia da câmera deve desaparecer ao recortar');
assert.equal(tracksStopped, 2, 'Escolher imagem deve desligar a câmera anterior');
assert(status.textContent.includes('enquadramento'),'Avisar para ajustar o recorte');
assert.equal(fileInput.value,'','O campo deve permitir reescolher o mesmo arquivo');
location.hash = '#personalizar';
events.hashchange();
assert.equal(cropPanel.hidden,true,'Ao sair da aba, descartar a foto');
console.log('✓ Picker nativo abre fluxo file → crop sem confundir com o input range de zoom');
console.log('✓ Arquivo descartado após sair, possibilidade de reescolher e zoom preservado');
