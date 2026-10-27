/**
 * Gera uma cena SVG diferente para CADA página que antes repetia a capa.
 * Preserva as 47 ilustrações originais dos livros TR/DR e as capas autorais.
 * Uso: node tools/illustrate-books.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'books/index.json'), 'utf8'));
const dir = 'assets/illustrations/capitulos';
const filename = (bookId, i) => `${dir}/${bookId}/${String(i + 1).padStart(2, '0')}.svg`;
const xml = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const themes = {
  'o-reino-das-cores': ['art','rainbow','palette','rainbow','sun','palette','palette','star','rainbow','palette','trophy'],
  'a-orquestra-dos-sons': ['nature','wind','rain','animals','ear','voice','wave','notes','party'],
  'a-festa-das-notas': ['music','notes','letters','spectrum','instruments','keyboard','melody','notes','party'],
  'o-jardim-dos-sentimentos': ['flowers','smile','tear','volcano','moon','surprise','breath','hearts','party'],
  'o-escudo-das-vacinas': ['clinic','shield','microbes','tear','hands','calendar','hearts','book','shield','party'],
  'o-corpo-em-movimento': ['park','dance','friends','bottle','rest','dumbbell','heart','book','calendar','party'],
  'o-clube-dos-dentinhos': ['tooth','tooth','microbes','toothbrush','clock','toothpaste','floss','bottle','dentist','toothbrush','book','tooth','party'],
  'o-calendario-das-festas': ['festival','fireworks','mask','eggs','bunting','flag','top','saci','pumpkin','tree','book','calendar','party'],
  'a-danca-do-tempo': ['space','earth','week','calendar','orbit','sun','newmoon','crescent','fullmoon','waning','book','clock','party'],
  'a-turma-dos-alimentos': ['kitchen','apple','grapes','yogurt','salad','bread','egg','food','book','food','party'],
  'a-viagem-dos-oito-planetas': ['space','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto','book','solar','rocket'],
  'a-trilha-do-nha-nhe-nhi-nho-nhu': ['letters','spider','bath','friends','nest','friends','letters','magnifier','letters','party'],
  'o-jardim-das-diferencas': ['community','people','indigenous','history','migration','mosaic','portraits','dna','friends','book','hands','party']
};
const alphabetSymbols = [
  'bee','ball','house','dice','star','flower','cat','hippo','island','crocodile','kiwi','moon','monkey',
  'ship','egg','duck','cheese','clock','frog','turtle','grapes','guitar','waffle','xylophone','noodles','zebra'
];
const palettes = [
  ['#ffefd1','#b9dcd8','#f2b663','#d87e84'], ['#d6ecff','#9de0c1','#6db1db','#d788af'],
  ['#ffe2eb','#fbe4a2','#dd88af','#8368b9'], ['#e4ddff','#ffd5b3','#9976cc','#e6a05c'],
  ['#d5f0dc','#ffebad','#74b99b','#e29a82'], ['#d5e8ff','#c7c4ef','#759ed2','#fcbe75']
];
const ellipse = (x,y,rx,ry,fill) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const circle = (x,y,r,fill,stroke='none',sw=0) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const rect = (x,y,w,h,fill,rx=0,stroke='none',sw=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line = (d,stroke='#695477',sw=8) => `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const text = (value,x,y,size=64,fill='#46446f') => `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="900" fill="${fill}" text-anchor="middle">${xml(value)}</text>`;
const petal = (x,y,fill='#e981a8') => `<g transform="translate(${x} ${y})"><g fill="${fill}">${circle(0,-32,23,fill)}${circle(30,-10,23,fill)}${circle(19,25,23,fill)}${circle(-19,25,23,fill)}${circle(-30,-10,23,fill)}</g>${circle(0,0,19,'#ffe1a2')}</g>`;
const face = (x,y,skin,hair,shirt,i=0) => `<g transform="translate(${x} ${y})" data-person="${i}">
  ${ellipse(0,180,70,11,'#50617d22')}${rect(-54,89,108,84,shirt,26)}
  ${i%3===0 ? `<path d="M-65 27Q-76-67 0-72q79 7 65 99Z" fill="${hair}"/>` : i%3===1 ? `${circle(-41,-17,30,hair)}${circle(0,-55,46,hair)}${circle(46,-18,31,hair)}` : `<path d="M-53-12q4-66 58-67 53 1 53 68l-18-18q-41-27-93 17Z" fill="${hair}"/>`}
  ${ellipse(0,21,53,63,skin)}${circle(-19,17,4,'#4e4045')}${circle(19,17,4,'#4e4045')}${line('M-14 51q14 13 28 0','#875967',4)}
  ${i%3===1 ? `${circle(-53,1,13,hair)}${circle(53,1,13,hair)}` : ''}
  </g>`;

function motifShape(key, primary='#ee8e9e', secondary='#77c4b1') {
  const c = (x,y,r,f) => circle(x,y,r,f,'#555571',3);
  const sun = `${c(0,0,77,'#ffdc6e')}${line('M-91 0h-20M91 0h20M0-91v-20M0 91v20','#f6b55d',9)}`;
  const moon = `${c(0,0,78,'#c8d1de')}${circle(-27,-21,18,'#9faabf')}${circle(32,28,25,'#9faabf')}${circle(29,-30,11,'#9faabf')}`;
  const planet = (base,accent,ring=false) => `<g>${ring ? `<ellipse rx="123" ry="35" transform="rotate(-22)" fill="none" stroke="${accent}" stroke-width="14"/>` : ''}
    ${c(0,0,73,base)}<clipPath id="planet-cut"><circle r="69"/></clipPath><g clip-path="url(#planet-cut)">${line('M-78-29q78 25 157-6M-76 14q81-21 156 4M-65 43q61 15 130-2',accent,13)}</g>
    ${ring ? line('M-110 32Q4 72 115-18','#f4dfad',10) : ''}</g>`;
  switch (key) {
    case 'tooth': return `<path d="M-87-77Q-50-129 0-88q50-41 87 11 24 36-2 104-17 44-34 94-18 32-39-10L0 74l-12 37q-21 42-39 10-21-56-34-96-25-72-2-102Z" fill="#fffef9" stroke="#8bbac3" stroke-width="8"/>${circle(-28,-18,7,'#5d718a')}${circle(27,-18,7,'#5d718a')}${line('M-25 16q25 24 50 0','#dc8a9f',6)}${circle(-48,10,11,'#ffb7bd')}${circle(48,10,11,'#ffb7bd')}`;
    case 'toothbrush': return `<g transform="rotate(24)">${rect(-17,-90,34,188,primary,15,'#5989a0',6)}${rect(-32,-131,64,52,'#e6f7fc',12,'#5989a0',6)}${Array.from({length:8},(_,i)=>line(`M${-24+i*7}-121v-29`,'#9dd5df',6)).join('')}${rect(-11,6,22,57,secondary,10)}</g>`;
    case 'toothpaste': return `<g transform="rotate(-20)"><path d="M-67-72h134l-15 174H-51Z" fill="#eaf7f5" stroke="#74aab6" stroke-width="7"/>${rect(-67,-101,134,34,primary,6)}${rect(-44,-13,88,68,secondary,18)}${text('F',0,35,46,'#fff')}${line('M-44 75h88','#b2c9d4',5)}</g>`;
    case 'floss': return `${rect(-90,-60,180,148,'#f8e6f8',28,'#a78cb3',7)}${circle(0,4,45,'#fffdfd','#c0a5cd',6)}${line('M-36-65q-28-68 30-69t38 55','#eafaff',8)}${text('FIO',0,21,39,'#9e85ad')}`;
    case 'dentist': return `${motifShape('tooth')}<g transform="translate(108 -86) rotate(35)">${rect(-8,-46,16,93,'#a1c2d0',5,'#6d9cae',5)}${circle(0,-51,20,'#fafafa','#6d9cae',5)}</g>`;
    case 'star': case 'fireworks': case 'party': case 'trophy':
      return `<path d="M0-102 29-34l74 4-56 47 18 74L0 51-65 91l18-74-56-47 74-4Z" fill="#f8cf62" stroke="#ca8a64" stroke-width="7"/>${c(-13,-3,7,'#6f5376')}${c(22,-3,7,'#6f5376')}${line('M-11 20q20 15 40-2','#91566c',5)}`;
    case 'sun': case 'smile': return `${sun}${c(-25,-9,6,'#7d5964')}${c(26,-9,6,'#7d5964')}${line('M-24 26q24 24 48 0','#7d5964',5)}`;
    case 'moon': case 'newmoon': case 'crescent': case 'fullmoon': case 'waning': return `<g>${moon}${key==='crescent' ? circle(40,-24,71,'#424f83') : key==='waning'?circle(-41,-24,71,'#424f83'):key==='newmoon'?circle(14,-8,71,'#424f83'):''}</g>`;
    case 'earth': return `${c(0,0,77,'#51a7d8')}<path d="M-57-43q31-18 44 4l-15 34 26 16-17 38-39-7-19-30Zm70-21q54 4 64 53l-34 2-13-26-35-1Z" fill="#62bb7a" stroke="#449972" stroke-width="5"/>`;
    case 'mercury': return `${moon}${circle(23,34,8,'#a2a4ac')}`;
    case 'venus': return planet('#e6c58b','#b58b68');
    case 'mars': return planet('#d47b59','#a94b42');
    case 'jupiter': return planet('#ebc7a6','#b88170');
    case 'saturn': return planet('#e8d6ad','#aa966b',true);
    case 'uranus': return planet('#8ed5da','#53b4c7');
    case 'neptune': return planet('#466fd2','#7297ee');
    case 'pluto': return `${moon}${circle(13,31,22,'#b0a2b9')}`;
    case 'solar': return `${sun}<g transform="translate(118 18) scale(.5)">${moon}</g>`;
    case 'orbit': return `<ellipse rx="144" ry="66" transform="rotate(-24)" fill="none" stroke="#9ca5e5" stroke-width="8" stroke-dasharray="12 16"/>${sun}<g transform="translate(124 -52) scale(.4)">${motifShape('earth')}</g>`;
    case 'flowers': case 'flower': case 'garden': case 'hearts': return `${petal(-51,12)}${petal(50,-39,'#b99bed')}${line('M-51 49v59m101-110v107','#629f75',8)}`;
    case 'tear': case 'rain': return `${circle(-54,-35,42,'#cde6f2')}${circle(25,22,63,'#8bc2e5')}${line('M28 67l-12 37','#54a1cd',10)}`;
    case 'volcano': return `<path d="M-110 98-52-39h94l71 137Z" fill="#aa8d86"/><path d="M-52-39Q-11-58 42-39l-21 32-52-1Z" fill="#f19569"/>${line('M-18-53-37-93m46 35 29-53','#df6b79',13)}`;
    case 'breath': case 'wave': case 'wind': return `${line('M-134-47Q-40-114 50-47T132-47M-134 0q94-67 184 0T132 0M-134 47q94-67 184 0T132 47',primary,14)}${circle(64,-62,9,'#f4bc69')}`;
    case 'music': case 'notes': case 'melody': return `${line('M-21-74v132m0-132 105-26v134','#685a9f',13)}${ellipse(-49,60,36,21,primary)}${ellipse(54,32,36,21,secondary)}`;
    case 'keyboard': case 'instruments': case 'letters': case 'xylophone': return `${rect(-115,-64,230,132,'#f7f5ef',12,'#64577f',7)}${Array.from({length:8},(_,i)=>rect(-106+i*27,-50,22,104,'#fff',3,'#747287',2)).join('')}${Array.from({length:5},(_,i)=>rect(-87+i*40,-49,13,61,'#51495a',2)).join('')}`;
    case 'spectrum': case 'rainbow': case 'palette': return `<path d="M-115 69a116 116 0 0 1 230 0" fill="none" stroke="#dc718c" stroke-width="29"/><path d="M-90 69a91 91 0 0 1 180 0" fill="none" stroke="#f7cc72" stroke-width="29"/><path d="M-63 69a64 64 0 0 1 126 0" fill="none" stroke="#76c3af" stroke-width="29"/><path d="M-38 69a39 39 0 0 1 76 0" fill="none" stroke="#8aa9ea" stroke-width="22"/>`;
    case 'shield': case 'guardians': return `<path d="M0-108Q64-74 107-71v72q-9 86-107 127Q-98 87-107 1v-72Q-64-74 0-108Z" fill="#8bbed3" stroke="#528eac" stroke-width="8"/><path d="M-42 9 0 50l57-79" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/>`;
    case 'microbes': return `${circle(-49,-14,57,'#91c7a8')}${circle(53,44,43,'#e8a1ae')}${circle(-57,-23,8,'#456b66')}${circle(-18,1,8,'#456b66')}${circle(58,36,7,'#865f75')}`;
    case 'bottle': case 'yogurt': return `${rect(-52,-84,104,186,'#d5f2ed',19,'#648d9d',7)}${rect(-31,-113,62,32,primary,7)}${rect(-43,19,86,65,secondary,15)}${line('M-32-22h64','#fff',7)}`;
    case 'calendar': case 'week': case 'clock': return `${rect(-107,-94,214,179,'#fff9eb',12,'#8e93ae',7)}${rect(-103,-90,207,51,primary,9)}${Array.from({length:9},(_,i)=>circle(-60+(i%3)*60,-5+Math.floor(i/3)*33,10,'#8a8dbc')).join('')}`;
    case 'apple': case 'fruit': return `<path d="M0-55q-79-48-100 21-22 102 100 145 113-42 100-145Q79-103 0-55Z" fill="#eb7772" stroke="#ba505e" stroke-width="7"/>${line('M0-58q0-48 38-59','#6f8360',10)}<path d="M16-91q39-45 77-26-22 43-77 43Z" fill="#68ae76"/>`;
    case 'grapes': return `<g>${Array.from({length:10},(_,i)=>circle((i%3-1)*42 + (Math.floor(i/3)%2)*12,Math.floor(i/3)*39-67,28,i%2?'#b59fe1':'#9479c7')).join('')}${line('M0-79q-10-37 20-48','#548b67',9)}</g>`;
    case 'salad': case 'food': return `${ellipse(0,42,110,54,'#fff7e9')}<path d="M-107 29Q-89 122 0 126q93-4 107-97" fill="#efe8ce" stroke="#8b8f99" stroke-width="8"/>${petal(-52,2,'#87c987')}${petal(47,-12,'#eaa179')}`;
    case 'bread': case 'waffle': return `${rect(-95,-83,190,179,'#ddb179',40,'#a57153',9)}${rect(-74,-59,148,131,'#f6dba5',26)}${line('M-48-1h96M-48 28h96','#cd9c62',7)}`;
    case 'egg': case 'eggs': return `${ellipse(-36,8,58,89,'#fff7e4')}${ellipse(53,24,54,77,'#f4cae0')}${circle(-35,26,19,'#f0be6b')}`;
    case 'tree': return `<path d="M0-125 92 24H-92Z" fill="#64b28b"/><path d="M0-50 113 62H-113Z" fill="#489a84"/>${rect(-14,62,28,48,'#a87660',4)}${circle(0,-74,16,'#f3c66c')}`;
    case 'flag': return `${line('M-75-115v218','#927257',9)}<path d="M-70-108H92v108H-70Z" fill="#56a878"/><path d="M12-98 80-55 12-10-58-55Z" fill="#f6ce63"/>${circle(12,-55,24,'#557dca')}`;
    case 'mask': return `<path d="M-106-38Q-52-87 0-43q56-45 109 5l-23 97Q39 78 0 37q-43 42-86 22Z" fill="#ba8ed5" stroke="#735a9a" stroke-width="8"/><ellipse cx="-50" cy="-5" rx="24" ry="12" fill="#fff"/><ellipse cx="52" cy="-5" rx="24" ry="12" fill="#fff"/>`;
    case 'pumpkin': return `${ellipse(0,22,102,90,'#ef9952')}${line('M0-67q-13-29 12-49','#5b9469',9)}<path d="m-60 7 21-17 21 18Zm78 0 21-17 21 18Zm-52 41q34 32 68 0Z" fill="#6d5262"/>${line('M0-9v36','#fff0c0',12)}`;
    case 'bunting': return `${line('M-134-75q136 17 265 0','#a08a9b',7)}${Array.from({length:6},(_,i)=>`<path d="M${-129+i*48}-74h40l-20 76Z" fill="${['#f4aaad','#ffdb82','#89d1b8','#b99bec'][i%4]}"/>`).join('')}`;
    case 'firework': return `${sun}${Array.from({length:12},(_,i)=>`<path d="M0-107v-23" transform="rotate(${i*30})" stroke="${primary}" stroke-width="8"/>`).join('')}`;
    case 'dna': return `${line('M-62-117q125 58 0 117t0 117',primary,13)}${line('M62-117q-125 58 0 117t0 117',secondary,13)}${Array.from({length:9},(_,i)=>line(`M${Math.round(Math.sin(i*.75)*58)} ${i*27-108}h${Math.round(-Math.sin(i*.75)*116)}`,'#f0ce6b',7)).join('')}`;
    case 'book': return `<path d="M-120-76Q-49-106 0-64q49-42 120-12v170Q49 75 0 117q-49-42-120-23Z" fill="#fff9e9" stroke="#8691b4" stroke-width="8"/>${line('M0-63v177M-96-43q52-14 75 0M21-43q52-14 75 0','#c2bbce',6)}`;
    case 'magnifier': return `${circle(-21,-11,72,'#d7f0f2')}${line('M32 43l89 87','#816f9d',22)}${text('NH',-23,15,36)}`;
    case 'umbrella': return `${line('M0-95v182q0 38 37 16','#7e6ca3',10)}<path d="M-111-14q0-106 111-106T111-14Z" fill="#f1a0b7"/>`;
    case 'dumbbell': return `${line('M-93 0H93','#79688d',16)}${rect(-104,-50,35,100,primary,8)}${rect(69,-50,35,100,primary,8)}`;
    case 'hands': case 'hand': return `<path d="M-111 54q-6-72 24-64l41 51q-14-84 17-87 19 2 21 30 10-31 30-20 15 8 14 34 16-16 31-3 16 13 4 39l-35 63Z" fill="#d5a37d" stroke="#9e756e" stroke-width="7"/>`;
    case 'spider': return `${c(0,10,53,'#ad8ca8')}${c(0,-46,32,'#bda5c1')}${line('M-40-13-107-62M-51 0-123 0M-39 30-105 78M40-13l67-49M51 0h72M39 30l66 48','#82698e',8)}${c(-12,-48,5,'#fff')}${c(12,-48,5,'#fff')}`;
    case 'friends': case 'people': case 'portraits': case 'community':
      return `<g transform="translate(-65 -30) scale(.74)">${face(0,0,'#7a513f','#39324e','#7cc7a8',1)}</g><g transform="translate(74 -25) scale(.74)">${face(0,0,'#e0aa86','#73504f','#eda2b2',2)}</g>${line('M-22 88q35 28 72 0','#bf987f',10)}`;
    case 'mosaic': case 'migration': case 'history': case 'indigenous':
      return `<g>${Array.from({length:12},(_,i)=>rect(-116+(i%4)*59,-97+Math.floor(i/4)*68,50,58,['#f3b8a9','#a6cda8','#f1ce79','#b4a5e1','#8bc8d5'][i%5],9,'#fff8ea',3)).join('')}</g>`;
    case 'nest': return `${ellipse(0,73,116,44,'#b98b68')}${ellipse(0,60,92,25,'#e8bf88')}${circle(-28,16,29,'#f9e5b1')}${circle(33,16,29,'#f3dbb0')}${line('M-108 72q114 35 213 0','#aa7e5b',9)}`;
    case 'bath': return `${rect(-105,-15,210,113,'#b4e5f0',40,'#729fb9',7)}${rect(-119,-24,238,24,'#fff',10,'#6daec1',5)}${circle(-55,-59,22,'#fff')}${circle(19,-88,33,'#fff')}${circle(69,-48,18,'#fff')}`;
    case 'house': return `${rect(-96,-14,192,136,'#fac5ac',9,'#b98678',7)}<path d="M-119-19 0-119 119-19Z" fill="#e98296" stroke="#ac6579" stroke-width="8"/>${rect(-27,43,54,79,'#a7819e',7)}`;
    case 'ball': return `${c(0,0,93,primary)}${line('M-92 0H92M0-92V92M-63-63Q46 5-63 63','#fff3dc',8)}`;
    case 'dice': return `${rect(-84,-86,168,168,'#faf6e7',19,'#807496',8)}${[[-41,-40],[41,-40],[0,0],[-41,40],[41,40]].map(([x,y])=>circle(x,y,11,'#7f77b3')).join('')}`;
    case 'cat': return `<path d="M-90-52-86-124-25-72Q0-83 25-72l61-52 4 72Q123 44 69 87-1 127-69 87-123 44-90-52Z" fill="#d2b1a0" stroke="#927b84" stroke-width="7"/>${c(-30,-5,6,'#554764')}${c(30,-5,6,'#554764')}${line('M-12 22 0 34l12-12M0 34q-18 22-36 10M0 34q18 22 36 10','#8c6b70',5)}`;
    case 'ship': return `<path d="M-120 20h240l-49 88H-70Z" fill="#ebae83" stroke="#a7807c" stroke-width="8"/>${line('M0-119V16','#896d7d',9)}<path d="M-8-114-95 9H-8Z" fill="#fff0d0"/><path d="M8-103 100 9H8Z" fill="#9dd1c8"/>`;
    case 'clock': return `${c(0,0,97,'#fbf6e9')}${line('M0-54V5l49 27','#79759f',11)}`;
    case 'guitar': return `<g transform="rotate(-20)"><path d="M-28 54q-92-46-29-102 30-22 56 0 27-23 56 0 64 56-29 102Z" fill="#cf955d" stroke="#946849" stroke-width="8"/>${rect(-12,-113,24,83,'#bfa077',5)}${c(0,-2,22,'#6e5463')}${line('M0-110v150','#fce9bd',3)}</g>`;
    case 'cheese': return `<path d="M-104 55 89-75 111 88h-215Z" fill="#ffe082" stroke="#dda95e" stroke-width="8"/>${circle(-40,29,17,'#e2b263')}${circle(47,31,13,'#e2b263')}`;
    case 'kiwi': return `${ellipse(0,0,95,92,'#a57f5a')}${ellipse(0,0,79,77,'#9cc86b')}${circle(0,0,33,'#fff5df')}${Array.from({length:12},(_,i)=>`<ellipse rx="4" ry="9" cy="-57" transform="rotate(${i*30})" fill="#343e43"/>`).join('')}`;
    case 'island': return `${ellipse(0,95,128,32,'#79c6d6')}<path d="M-101 92q102-113 205 0Z" fill="#e9d395"/>${line('M0-113q28 83 2 161','#846b63',11)}<path d="M0-99q-96-39-123-2 41-4 105 44M0-99q100-40 123-2-43-4-105 44" fill="#6bbb92"/>`;
    case 'duck': case 'frog': case 'turtle': case 'hippo': case 'crocodile': case 'monkey': case 'zebra':
      return `<g>${ellipse(0,45,106,71,key==='duck'?'#f4d783':key==='frog'||key==='turtle'||key==='crocodile'?'#87c99e':'#b7aaa5')}
      ${c(-42,-27,38,'#fff8e5')}${c(42,-27,38,'#fff8e5')}${circle(-38,-28,9,'#545166')}${circle(39,-28,9,'#545166')}
      ${key==='duck'?`<path d="M-30 9 0 40 30 9Z" fill="#e59c68"/>`:line('M-24 51q24 24 48 0','#796a6e',6)}
      ${key==='zebra'?line('M-90 12-58-12M-53 55l-20 45M0-1l-20 55M51 1l19 44','#6c5b71',15):''}
      ${key==='zebra'?'<path d="M-65-65-92-121-18-86 18-86 92-121 65-65" fill="#e9e7e4" stroke="#6c5b71" stroke-width="9"/>':''}</g>`;
    case 'bee': return `${ellipse(0,10,93,55,'#efc96d')}${line('M-44-23v66M0-40v96M45-23v66','#755b60',13)}${ellipse(-56,-62,52,29,'#e6f6f9')}${ellipse(51,-62,52,29,'#e6f6f9')}${circle(71,0,5,'#604f5e')}`;
    case 'noodles': return `${rect(-97,-42,194,113,'#f9ede5',22,'#a98891',7)}${Array.from({length:6},(_,i)=>line(`M${-67+i*25}-13q13-28 24 0t0 35`,'#d8b279',6)).join('')}${line('M100-107-8 44','#9f796b',8)}`;
    case 'saci': return `${face(0,-12,'#bd835d','#49374b','#d84659',1)}<path d="M-65-96Q-50-209 43-147l20 74Z" fill="#d94050"/>`;
    case 'top': return `<path d="M0-115v31m-87 57 87-57 87 57v39Q61 99 0 123-59 98-87 12Z" fill="#d9a56c" stroke="#99715e" stroke-width="7"/>${line('M-71-10h142M-61 33H62','#f6d38f',10)}`;
    case 'mask2': return `${motifShape('mask')}`;
    default: return `${petal(-33,15,primary)}${circle(68,-49,45,secondary)}`;
  }
}

// Conto clássico: personagens fixos do texto original, não substituíveis pelo avatar.
// Cada cena é composição vetorial autoral; a ilustração do PDF de referência não é utilizada.
function rapunzelScene(book, page, index) {
  const settings = [
    'tower','garden','garden','garden','witch','witch','baby','tower','braids','sing','forest','forest',
    'braids','visit','silk','witch','departure','tower','storm','storm','desert','forest','reunion','castle',
    'book','questions','celebration'
  ];
  const setting = settings[index] || 'garden';
  const [sky, hills, pink, purple] = palettes[(index*3+2)%palettes.length];
  const night = index===12 || index===17 || index===18;
  const forest = ['forest','storm','tower','braids','sing','visit'].includes(setting);
  const skyFill = night ? '#333b69' : setting==='desert' ? '#f9daaa' : sky;
  const ground = setting==='desert' ? '#e7ba82' : forest ? '#93b6ab' : hills;
  const longHair = (x,y,length=310) => `<path d="M${x} ${y}q-23 ${length*.21} 3 ${length*.47}t-3 ${length*.48}" fill="none" stroke="#98704c" stroke-width="28" stroke-linecap="round"/><path d="M${x} ${y}q-23 ${length*.21} 3 ${length*.47}t-3 ${length*.48}" fill="none" stroke="#f3c868" stroke-width="21" stroke-linecap="round" stroke-dasharray="21 3"/>`;
  const character = (kind, x, y, scale=1) => {
    const isRapunzel = kind==='rapunzel' || kind==='youngRapunzel';
    const isWitch = kind==='witch';
    const isPrince = kind==='prince';
    const hair = isRapunzel ? '#f0c36e' : isWitch ? '#69627e' : isPrince ? '#745d51' : '#946f56';
    const skin = isRapunzel ? '#f0c6a6' : isWitch ? '#d9b89c' : '#d7a27d';
    const dress = isRapunzel ? '#b39cdb' : isWitch ? '#584d85' : isPrince ? '#6083ab' : '#d68b96';
    const skirt = `<path d="M-52 56Q-61 108-73 178q73 25 145 0L53 56Z" fill="${dress}" stroke="#5c577f" stroke-width="5"/>`;
    return `<g data-character="${kind}" transform="translate(${x} ${y}) scale(${scale})">
      ${isRapunzel ? `${longHair(-39,-14,215)}${longHair(37,-16,225)}` : ''}
      ${ellipse(0,185,65,11,'#34496523')}${skirt}
      ${line('M-44 70l-45 58M43 70l45 58',skin,19)}${circle(-88,127,12,skin)}${circle(89,127,12,skin)}
      ${isWitch ? `<path d="M-60-18q-24-110 60-123 78 20 60 123l-15-18-92 0Z" fill="${hair}"/>` : `<path d="M-55-25q-11-82 51-84 74 6 57 85Z" fill="${hair}"/>`}
      ${ellipse(0,-11,49,61,skin)}${circle(-19,-18,5,'#584c61')}${circle(18,-18,5,'#584c61')}
      ${line('M-17 18q17 15 34 0',isWitch?'#866b7e':'#c37e86',5)}
      ${isWitch?'<path d="M-82-72 0-172 90-72Z" fill="#6d6398" stroke="#574c7c" stroke-width="7"/>':''}
      ${isPrince?`<path d="M-50 65h100L31 122h-61Z" fill="#779bc0"/>${line('M-40 60L24 105','#f3cd80',11)}`:''}
      ${isRapunzel ? `<path d="M-38-54q28-45 77 0" fill="none" stroke="#f7db85" stroke-width="19"/>` : ''}</g>`;
  };
  const trees = Array.from({length:7},(_,i)=>{
    const x = 54+i*145+(index*17)%65;
    return `<g opacity="${i%2?'.82':'.97'}">${rect(x-14,342+(i%3)*19,27,225,'#8b7866',9)}${circle(x,320+(i%3)*19,72,i%2?'#8abca1':'#77a995')}${circle(x-41,347+(i%3)*19,44,'#afd3ac')}${circle(x+37,337+(i%3)*19,45,'#93c6a9')}</g>`;
  }).join('');
  const hillsSvg = `<path d="M0 450Q225 ${345+index%4*14} 480 452T1000 448V700H0Z" fill="${ground}"/><path d="M0 590Q190 540 440 585T1000 569V700H0Z" fill="${purple}" opacity=".17"/>`;
  const stars = Array.from({length:21},(_,i)=>circle((i*137+index*51)%1000,(i*59+41)%310,i%3+2,night?'#ffe8ac':'#fff', 'none')).join('');
  const tower = `<g data-scene="torre" transform="translate(${index%2?635:681} 0)">
    <path d="M-95 690V195H105v495Z" fill="#d7bfd0" stroke="#a28cae" stroke-width="9"/>
    ${Array.from({length:13},(_,i)=>line(`M-89 ${238+i*33}h${i%2?82:55}M${i%2?12:30} ${238+i*33}h70`,'#bba7c1',3)).join('')}
    <path d="M-124 193-2 63l136 130Z" fill="#8d7da9" stroke="#6e668d" stroke-width="9"/><path d="M-44 317v-90q0-42 48-42t47 42v90Z" fill="#4d4b70" stroke="#e8d6df" stroke-width="10"/>
    ${longHair(-15,286,280)}<path d="M-25 251q27-12 49 0l13 61h-76Z" fill="#b39cdb"/>${circle(-3,236,29,'#f0c7a3')}${line('M-12 241h2M8 241h2','#564d65',5)}<path d="M-30 221q27-39 55-5" stroke="#f3c868" stroke-width="12" fill="none"/>
    <path d="M-70 690V530q68-50 142 0v160" fill="none" stroke="#afa0b3" stroke-width="4"/>
  </g>`;
  const garden = `<g data-scene="jardim" transform="translate(560 395)">${rect(-150,-10,340,190,'#aa826c',22,'#966d72',8)}${Array.from({length:12},(_,i)=>`<g transform="translate(${-121+(i%6)*55} ${21+Math.floor(i/6)*69})">${petal(0,-25,i%3?'#bc93cc':'#efbbd3')}${line('M0 0v48','#5e9d69',7)}</g>`).join('')}</g>`;
  const flowers = Array.from({length:10},(_,i)=>`<g transform="translate(${(i*113+index*47)%980} ${562+(i*17)%99}) scale(${.24+i%3*.08})">${petal(0,0,['#ed9bb1','#f5c66c','#c8a7ed'][i%3])}</g>`).join('');
  const storyLayers = {
    tower: `${tower}${character(index===0?'rapunzel':index===7?'witch':'prince',247,436,.85)}`,
    braids: `${tower}${character('prince',273,464,.86)}`,
    sing: `${tower}${character('prince',254,449,.86)}${text('♫',522,257,63,'#f0c36e')}`,
    garden: `${garden}${character(index===1?'parent':'parent',274,420,.92)}${index===2?character('parent',382,437,.7):''}`,
    witch: `${garden}${character('witch',646,414,.97)}${character('parent',285,465,.8)}`,
    baby: `${character('rapunzel',574,492,.54)}${character('witch',292,460,.95)}${petal(729,415)}`,
    visit: `${tower}${character('prince',230,467,.82)}${text('❤',472,299,52,'#df8498')}`,
    silk: `${tower}${character('rapunzel',275,461,.94)}${motifShape('book','#eac77b')}`,
    departure: `${character('rapunzel',316,436,.93)}${character('witch',698,438,.97)}${line('M445 518q100-72 145-4','#d6aa6d',8)}`,
    storm: `${tower}${character('prince',272,464,.86)}${Array.from({length:4},(_,i)=>line(`M${i*166+120} 160l-33 90`,'#e3d4ed',7)).join('')}`,
    desert: `${character('rapunzel',445,451,.99)}${character('youngRapunzel',640,541,.36)}${character('youngRapunzel',722,561,.32)}${circle(808,153,65,'#ffcf73')}`,
    forest: `${character('prince',277,443,.99)}${index===21?text('♪',613,305,93,'#f3c978'):''}`,
    reunion: `${character('rapunzel',402,425,.91)}${character('prince',594,425,.91)}${text('♥',511,216,72,'#ec91a7')}`,
    castle: `${character('rapunzel',350,451,.92)}${character('prince',600,451,.92)}<path d="M762 428V195l55-59 55 59v233Z" fill="#dec6e8" stroke="#a09abb" stroke-width="8"/>`,
    book: `<g transform="translate(598 402) scale(1.45)">${motifShape('book')}</g>${character('rapunzel',285,435,.78)}`,
    questions: `<g transform="translate(603 396) scale(1.5)">${motifShape('book')}</g>${text('?',603,414,120,'#c38abf')}${character('rapunzel',271,443,.78)}`,
    celebration: `${character('rapunzel',397,435,.94)}${character('prince',621,435,.94)}${Array.from({length:11},(_,i)=>text('✦',200+i*62,197+(i%3)*30,23,['#efb36c','#bc9edc','#8cc5ac'][i%3])).join('')}`
  };
  const title = (index===0 ? 'RAPUNZEL' : page.sticker || page.title).slice(0,31);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700" role="img" aria-label="${xml(page.title)}">
    <title>Rapunzel — cena ${index+1}: ${xml(page.title)}</title>
    <rect width="1000" height="700" fill="${skyFill}"/>
    ${night ? `<circle cx="888" cy="114" r="61" fill="#f3e4b7"/>` : `<circle cx="876" cy="102" r="54" fill="#ffdf9f"/>`}
    ${stars}${hillsSvg}${forest ? trees : ''}${flowers}
    ${storyLayers[setting] || storyLayers.garden}
    <rect x="45" y="39" width="760" height="93" rx="43" fill="#fff9ee" opacity=".95" stroke="${pink}" stroke-width="7"/>
    ${text(title,425,98,title.length>23?33:41,'#6c527e')}
    </svg>\n`.replace(/[ \t]+$/gm,'');
}

function sceneArt(book,page,index,bookNo) {
  if (book.protagonistMode==='fixed') return rapunzelScene(book,page,index);
  const isABC = book.id === 'a-aventura-do-abc';
  const isDiff = book.id === 'o-jardim-das-diferencas';
  const palette = palettes[(index + bookNo*2) % palettes.length];
  const [sky,land,primary,secondary] = palette;
  const subject = book.subject.split(' · ')[0];
  const night = subject==='Ciências' && /Lua|Sistema Solar|astronomia/.test(book.subject) || /^(?:moon|crescent|newmoon|waning|fullmoon|jupiter|saturn|uranus|neptune|mars|mercury|venus|pluto|rocket)$/.test((themes[book.id]||[])[index]);
  const darkSky = night ? ['#283966','#485b91','#a8b6d6','#d6e6ff'] : [sky,land,'#654d84','#8d87a0'];
  const base = `<rect width="1000" height="700" fill="${darkSky[0]}"/>
    <path d="M0 490Q245 ${400+index%4*15} 505 473T1000 ${456+index%5*12}V700H0Z" fill="${night?'#4c6599':land}"/>
    <path d="M0 599Q280 ${541+index%4*9} 527 589T1000 563V700H0Z" fill="${night?'#354f83':secondary}" opacity=".38"/>
    ${Array.from({length:11},(_,i)=>circle(43+(i*139+index*17)%934,47+(i*79+index*13)%295,i%3+3,night?'#f6f3d6':'#fff', 'none')).join('')}`;
  const key = isABC ? (index>0&&index<=26 ? alphabetSymbols[index-1] : index===0 ? 'letters':'party')
    : themes[book.id]?.[index] || 'star';
  const shouldShowGroup = isDiff && (index<=6 || index===8 || index===11);
  const people = shouldShowGroup ? [
    ['#f4c69f','#52404e','#ee8394'],['#724c3f','#302d46','#6cb9a4'],
    ['#bd845f','#4a3651','#f5b45f'],['#dfb39b','#745748','#8589cc'],
    ['#9d694c','#393147','#78aac8']
  ].map(([skin,hair,shirt],i)=>face(425+i*111,248+(i%2)*23,skin,hair,shirt,(i+index)%3)).join('') : '';
  const motif = motifShape(key, primary,secondary);
  const motiveX = shouldShowGroup ? 776 : 670+(index%3)*21;
  const motiveY = shouldShowGroup ? 410 : 341+((index*7)%5)*7;
  const prominent = `<g data-motif="${xml(key)}" transform="translate(${motiveX} ${motiveY}) rotate(${(index%5-2)*4}) scale(${shouldShowGroup ? 0.65 : 1.38})">${motif}</g>`;
  const supporting = `<g transform="translate(${index%2?810:431} ${index%2?534:541}) scale(.42)">${motifShape(isABC?'star':(themes[book.id]||[])[(index+2)%(themes[book.id]?.length||1)]||'flower',secondary,primary)}</g>`;
  const oneLetter = isABC && index>=1 && index<=26 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index-1] : null;
  const label = (oneLetter ? `${oneLetter} de ${['ABELHA','BOLA','CASA','DADO','ESTRELA','FLOR','GATO','HIPOPÓTAMO','ILHA','JACARÉ','KIWI','LUA','MACACO','NAVIO','OVO','PATO','QUEIJO','RELÓGIO','SOL','TARTARUGA','UVA','VIOLÃO','WAFFLE','XÍCARA','YAKISOBA','ZEBRA'][index-1]}` : page.sticker||page.title).slice(0,34);
  const heading = `<rect x="305" y="50" width="655" height="93" rx="44" fill="${night?'#efedf9':'#fffdf4'}" opacity=".94" stroke="${primary}" stroke-width="7"/>
    ${text(label,637,109,label.length>25?29:label.length>17?37:47,'#635175')}`;
  const letter = oneLetter ? `<g transform="translate(405 350)">${text(oneLetter,0,0,250,primary)}${line('M-92 15H92',secondary,13)}</g>` : '';
  const kid = `<use href="#kid" x="${index%2?65:113}" y="${index%2?300:299}" width="213" height="346"/>`;
  const dnaAccent = isDiff && (index===7) ? `<g transform="translate(425 421) scale(.65)">${motifShape('dna')}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700" role="img" aria-label="${xml(page.title)}">
  <title>${xml(page.title)} — cena ${index+1} de ${book.title}</title>
  <defs><symbol id="kid" viewBox="0 0 210 340"><circle cx="105" cy="92" r="67" fill="#e4ad88"/><path d="M41 165h128l16 175H25Z" fill="#e68da5"/><path d="M38 80Q53 5 112 11t65 69q-32-23-65-25Q68 75 38 80Z" fill="#4b3c58"/><circle cx="80" cy="94" r="6"/><circle cx="129" cy="94" r="6"/><path d="M81 124q25 21 50 0" stroke="#9a6570" stroke-width="6" fill="none"/></symbol></defs>
  ${base}${heading}${people}${letter}${prominent}${supporting}${dnaAccent}${kid}
  </svg>\n`.replace(/[ \t]+$/gm, '');
}

let created=0;
for (const [bookNo,entry] of catalog.books.entries()) {
  const jsonFile = path.join(root,entry.data);
  const book = JSON.parse(fs.readFileSync(jsonFile,'utf8'));
  const seen = new Set();
  let changed = false;
  for (const [i,page] of book.pages.entries()) {
    const existing = page.illustration;
    const generated = existing.startsWith(`${dir}/`);
    const duplicate = seen.has(existing);
    seen.add(existing);
    if (!generated && !duplicate) continue;
    const next = filename(book.id,i);
    if (page.illustration !== next) {
      if (check) throw Error(`${book.id}: página ${i+1} precisa de ilustração própria`);
      page.illustration = next;
      changed = true;
    }
    const svg = sceneArt(book,page,i,bookNo);
    const absolute = path.join(root,next);
    if (check) {
      if (!fs.existsSync(absolute) || fs.readFileSync(absolute,'utf8')!==svg) throw Error(`SVG gerado desatualizado: ${next}`);
    } else {
      fs.mkdirSync(path.dirname(absolute),{recursive:true});
      fs.writeFileSync(absolute,svg);
    }
    created++;
  }
  if (changed) fs.writeFileSync(jsonFile,`${JSON.stringify(book,null,2)}\n`);
  if (check && new Set(book.pages.map(p=>p.illustration)).size!==book.pages.length) throw Error(`Ilustrações repetidas em ${book.id}`);
}
console.log(`✓ ${created} cenas SVG individuais ${check?'conferidas':'geradas'}, sem reutilizar ilustração entre páginas do mesmo livro`);
