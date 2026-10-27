import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const landing = read('index.html');
const css = read('assets/css/app.css');
const page = read('.github/workflows/pages.yml');
const sw = read('sw.js');
const qr = fs.readFileSync(path.join(root, 'assets/images/pix-qrcode.png'));
assert.equal(qr.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Imagem deve ser PNG real');
assert.equal(qr.readUInt32BE(16), 280);
assert.equal(qr.readUInt32BE(20), 280);
assert.equal(crypto.createHash('sha256').update(qr).digest('hex'),
  '23c67a7e958be5270f66a59531243707ee6bf77acae78c19209a9add27a9e069',
  'QR deve preservar exatamente a imagem do usuário (compressão sem perdas)');
assert(landing.includes('src="./assets/images/pix-qrcode.png"'), 'Home deve mostrar imagem real');
assert(landing.includes('id="copyPix"') && landing.includes('navigator.clipboard.writeText'),
  'Deve existir o botão de copiar PIX');
assert(!landing.includes('qrcodejs') && !landing.includes('new QRCode('), 'Não carregar gerador externo');
assert(!landing.includes('Chave PIX (BRCode)') && !landing.includes('<code>'), 'Não exibir chave CPF');
assert(!/\bCPF\b/i.test(landing), 'Não divulgar CPF na home');
const match = landing.match(/<textarea id="pixCopyPaste"[^>]*>([^<]+)<\/textarea>/);
assert(match, 'O código PIX precisa ser copiável');
const pix = match[1].trim();
assert(pix.startsWith('000201') && pix.includes('BR.GOV.BCB.PIX'));
const crcInput = pix.slice(0, -4);
let crc = 0xFFFF;
for (const byte of Buffer.from(crcInput, 'utf8')) {
  crc ^= byte << 8;
  for (let j = 0; j < 8; j++) crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xFFFF;
}
assert.equal(pix.slice(-4), crc.toString(16).padStart(4, '0').toUpperCase(),
  'PIX copia e cola deve ter CRC válido');
for (const selector of ['.hero-book', '.landing-book', '.story-preview-cover', '.book-card-cover']) {
  assert(css.includes(selector), 'Livro sem CSS: ' + selector);
  const line = css.split('\n').find((item) => item.trim().startsWith(selector + '{'));
  assert(line && line.includes('border-radius:10px 40px 40px 10px;'),
    'Raio assimétrico não aplicado à capa: ' + selector);
}
assert(page.includes('assets/images') && sw.includes("'./assets/images/pix-qrcode.png'"),
  'QR deve ser incluído no GitHub Pages e no pré-cache offline');
console.log('✓ QR original compactado, PIX CRC válido, copiar e dados pessoais ocultos');
console.log('✓ Capas com 10px 40px 40px 10px e QR servido offline sem CDN');
