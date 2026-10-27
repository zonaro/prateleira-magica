import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const window={};
vm.runInNewContext(read('assets/js/avatar-photo-colors.js'),{window});
vm.runInNewContext(read('assets/js/avatar-photo-crop.js'),{window});
const colors=window.LivrinhoAvatarPhotoColors, crop=window.LivrinhoAvatarPhotoCrop;
const avatar=read('assets/js/avatar.js'),photo=read('assets/js/avatar-photo.js'),editor=read('assets/js/settings-ui.js');
const vividBlue=[...Array.from({length:85},()=>[55,145,242]),...Array.from({length:15},()=>[160,123,96])];
const blue=colors.dominantHairColor(vividBlue);
assert(colors.hsv(colors.rgbFromHex(blue)).hue>195,'Preservar tintura azul');
assert.equal(colors.nearestColor(blue,['#493a55','#65b8cc','#53b978']),'#65b8cc');
const green=colors.dominantHairColor([...Array.from({length:85},()=>[50,206,89]),...Array.from({length:15},()=>[177,132,100])]);
assert(colors.hsv(colors.rgbFromHex(green)).hue>90&&colors.hsv(colors.rgbFromHex(green)).hue<160);
assert.equal(colors.dominantHairColor(Array.from({length:70},()=>[82,60,48])),'#523c30');
const sparse=colors.dominantHairColor([...Array.from({length:96},()=>[80,60,52]),...Array.from({length:4},()=>[40,155,255])]);
assert(colors.rgbFromHex(sparse)[0]>=75,'Reflexos isolados não podem dominar a cor');
assert(avatar.includes("'#53b978', 'Verde fantasia'"));
assert(avatar.includes("'#e65a76', 'Vermelho fantasia'"));
assert(avatar.includes('glasses_round: '+'<g fill="none" stroke="'+'$'+'{decoration}"') ||
       avatar.includes('glasses_round: '+String.fromCharCode(96)+'<g fill="none" stroke="'+'$'+'{decoration}"'),
       'Armação deve mostrar a cor detectada');
assert(photo.includes('samplePixels(pixels, mask, mx, my, width, height, region, LABEL.accessory)'));
assert(editor.includes('draft.accessoryColor = result.accessoryColor'));
assert(editor.includes('fillDialog(preferences.load())'));
assert(editor.includes('delete draft.sourceSvg'));
for(const [w,h] of [[1200,1600],[2000,950],[420,1100]]) {
  const state=crop.make(w,h);let r=crop.rect(state);
  assert(Math.abs(r.width/r.height-.8)<1e-9);
  assert(r.x>=0&&r.y>=0&&r.x+r.width<=w+1e-6&&r.y+r.height<=h+1e-6);
  state.zoom=3;r=crop.rect(state);
  assert(r.width<Math.min(w,h*.8));
  state.cx=-100;state.cy=100;r=crop.rect(state);
  assert(r.x>=0&&r.y>=0&&r.x+r.width<=w+1e-6&&r.y+r.height<=h+1e-6);
  const next=crop.pan(state,40,-20,360,450);
  assert(next.cx<state.cx&&next.cy>state.cy);
}
const calls=[];crop.draw({fake:'image'},crop.make(1200,1600),{drawImage:(...args)=>calls.push(args)},512,640);
assert.equal(calls.length,1);assert.equal(calls[0][7],512);assert.equal(calls[0][8],640);
assert(Math.abs(calls[0][3]/calls[0][4]-.8)<1e-9);
assert.throws(()=>crop.make(0,100),/inválida/);
for(const marker of ['avatar-photo-crop-editor','data-action="reset-crop"','data-action="cancel-crop"',
  'data-action="analyze"','pointerdown','pointermove','pointercancel','wheel','keydown',
  'zoomSlider.addEventListener','setCropSource(video, true)','setCropSource(bitmap)',
  'crop.draw(cropSource, cropState, ctx, frame.width, frame.height)',
  'stream.getTracks().forEach((track) => track.stop())','wipe(cropSource)',
  "location.hash = '#personalizar'"])assert(photo.includes(marker),'Etapa ausente: '+marker);
assert(!photo.includes('toDataURL(')&&!photo.includes('localStorage.')&&!photo.includes('fetch(file'));
console.log('✓ Tinturas vivas, cores de armação, editor sincronizado e matemática do recorte');
