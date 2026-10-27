// Ferramenta de auditoria (não usada na publicação): cria um mapa inicial das
// camadas dos SVGs, para conferência visual antes de incorporá-las ao bundle.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = path.join(root, 'assets/avatar-reference/svgrepo-kids');
const sources = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/avatar-presets.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/avatar-reference/component-map.json'), 'utf8'));
const output = {};

const rgb = hex => hex && /^[0-9a-f]{6}$/i.test(hex) ? [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) : null;
const colorDistance = (a,b) => a && b ? Math.sqrt(a.reduce((s,v,i) => s+(v-b[i])**2,0)) : 999;

async function measure(shape, viewBox) {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="232" height="232">${shape}</svg>`;
    const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x1=999,y1=999,x2=0,y2=0,area=0;
    for (let y=0;y<info.height;y++) for (let x=0;x<info.width;x++) {
      if (data[(y*info.width+x)*info.channels+3] > 20) {
        x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);area++;
      }
    }
    return { x1:x1*2, y1:y1*2, x2:x2*2, y2:y2*2, area:area*4,
      cy:(y1+y2), cx:(x1+x2), width:(x2-x1)*2, height:(y2-y1)*2 };
  } catch { return {x1:999,y1:999,x2:0,y2:0,cy:999,cx:999,width:0,height:0,area:0}; }
}

for (const { sourceSvg } of sources) {
  const file = fs.readFileSync(path.join(reference,sourceSvg),'utf8');
  const viewBox = file.match(/viewBox="([^"]+)"/)?.[1];
  const shapes = [...file.matchAll(/<(?:path|rect|circle|ellipse|polygon|polyline)\b[^>]*\/>/g)].map(m=>m[0]);
  const xmlToOrdinal = new Map();
  let elementIndex=0,ordinal=0;
  for (const match of file.matchAll(/<(?!\?|!)(\/?)([a-z][\w:-]*)\b[^>]*>/gi)) {
    if (match[1]) continue;
    if (/^(path|rect|circle|ellipse|polygon|polyline)$/.test(match[2])) xmlToOrdinal.set(elementIndex,ordinal++);
    elementIndex++;
  }
  const knownHair = Object.values(map.hair).filter(info=>info.source===sourceSvg);
  const knownOutfit = Object.values(map.outfit).filter(info=>info.source===sourceSvg);
  const namedHairBack = new Set(knownHair.flatMap(info=>info.back).map(i=>xmlToOrdinal.get(i)));
  const namedHairFront = new Set(knownHair.flatMap(info=>info.front).map(i=>xmlToOrdinal.get(i)));
  const namedOutfit = new Set(knownOutfit.flatMap(info=>info.nodes).map(i=>xmlToOrdinal.get(i)));
  // A primeira forma pode ser cabelo ou roupa. Amostramos a bochecha/centro
  // do rosto na ilustração inteira para obter o tom verdadeiro da pele.
  const {data: portrait,info: portraitInfo} = await sharp(Buffer.from(file)).resize(464,464)
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const skinIndex = (215 * portraitInfo.width + 232) * portraitInfo.channels;
  const baseSkin = [...portrait.slice(skinIndex, skinIndex+3)];
  const stats = await Promise.all(shapes.map(s=>measure(s,viewBox)));
  const eyeIndices = stats.map((s,i)=>[s,i]).filter(([s,i]) =>
    i>0 && s.y1>=154 && s.y2<=216 && s.width<42 && s.height<65 &&
    ((s.cx>=155&&s.cx<=200)||(s.cx>=265&&s.cx<=310))).map(([,i])=>i);
  const eyeStart = eyeIndices.length ? Math.min(...eyeIndices) : Math.floor(shapes.length/3);
  const layers = { hairBack:[], face:[], outfit:[], hairFront:[] };
  for (let i=0;i<shapes.length;i++) {
    const s=stats[i], color=rgb(shapes[i].match(/fill:\s*#([0-9a-f]{6})/i)?.[1]);
    const skinLike=colorDistance(color,baseSkin)<83;
    const faceFeature=eyeIndices.includes(i)||
      (s.y1>=219 && s.y2<=262 && s.cx>=190 && s.cx<=272 && s.height<=45);
    let role;
    if(namedHairBack.has(i))role='hairBack';
    else if(namedHairFront.has(i))role='hairFront';
    else if(namedOutfit.has(i) && s.y1<180 && s.cy<235)role=i<eyeStart?'hairBack':'hairFront';
    else if(faceFeature)role='face';
    else if(s.y1>=282 || (s.cy>340 && s.y1>=245))role='outfit';
    else if(namedOutfit.has(i) && !skinLike)role='outfit';
    else if(skinLike)role='face';
    else if(s.y1<264)role=i<eyeStart?'hairBack':'hairFront';
    else role='face';
    layers[role].push(i);
  }
  output[sourceSvg]=layers;
}
const target=path.join(root,'assets/avatar-reference/preset-layer-map.json');
fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(`Criado mapa inicial: ${Object.keys(output).length} personagens`);
