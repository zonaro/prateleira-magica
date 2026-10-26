import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Regenerate the hand-composed SVG scenes for the two Draco adventures.
// Existing symbols keep the visual style of the first train adventure.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = fs.readFileSync(path.join(root, 'assets/illustrations/ellie/cover.svg'), 'utf8');
const commonDefs = original.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
if (!commonDefs) throw Error('Could not load shared vector symbols');
const originalKid = commonDefs.match(/<symbol id="ellie"[\s\S]*?<\/symbol>/)?.[0];
if (!originalKid) throw Error('Could not load original child symbol');
const drica = originalKid.replace('id="ellie"', 'id="drica"')
  .replaceAll('#fa7195', '#9682dc').replaceAll('#62465a', '#6b4750')
  .replaceAll('#604158', '#6b4750');

const newSymbols = `<defs>
  ${drica}
  <symbol id="dragon" viewBox="0 0 420 375">
    <ellipse cx="200" cy="346" rx="153" ry="15" fill="#2b6c86" opacity=".15"/>
    <path d="M315 226q110-23 79-109-5 86-110 61" fill="#58aeaa" stroke="#358e96" stroke-width="8"/>
    <path d="M136 231Q38 57 39 167q28 81 112 102m114-47Q367 53 381 170q-4 60-92 96" fill="#91c5e5" stroke="#57a5c5" stroke-width="10"/>
    <ellipse cx="212" cy="222" rx="116" ry="122" fill="#5cc3a2"/>
    <ellipse cx="210" cy="241" rx="67" ry="88" fill="#ffe2a7"/>
    <path d="M114 171q-77-48-65-5 20 39 70 46m189-41q75-48 61-6-16 34-70 45" fill="#5cc3a2"/>
    <path d="M126 105q-31-86 19-54l29 42m77 0 28-42q52-27 20 53" fill="#ffe19b" stroke="#eab982" stroke-width="7"/>
    <ellipse cx="211" cy="127" rx="112" ry="90" fill="#5cc3a2"/>
    <ellipse cx="124" cy="142" rx="52" ry="34" fill="#79d3b4"/>
    <ellipse cx="292" cy="142" rx="52" ry="34" fill="#79d3b4"/>
    <circle cx="173" cy="111" r="9" fill="#36515b"/><circle cx="251" cy="111" r="9" fill="#36515b"/>
    <path d="M182 154q30 23 58 0" fill="none" stroke="#3c827a" stroke-width="7" stroke-linecap="round"/>
    <circle cx="127" cy="149" r="9" fill="#e78e9b" opacity=".7"/><circle cx="289" cy="149" r="9" fill="#e78e9b" opacity=".7"/>
    <path d="M125 298q-34 37 0 43h48q20-11-1-40m83-3q-29 36 0 43h48q20-11-3-41" fill="#49a899"/>
  </symbol>
  <symbol id="drone" viewBox="0 0 300 175">
    <ellipse cx="150" cy="144" rx="98" ry="13" fill="#2b567c" opacity=".16"/>
    <path d="M85 64 32 38m183 26 53-26M85 87l-56 20m186-20 55 20" fill="none" stroke="#7886b0" stroke-width="17" stroke-linecap="round"/>
    <ellipse cx="34" cy="31" rx="28" ry="9" fill="#7e9ce0"/><ellipse cx="267" cy="31" rx="28" ry="9" fill="#7e9ce0"/>
    <ellipse cx="30" cy="110" rx="28" ry="9" fill="#7e9ce0"/><ellipse cx="268" cy="110" rx="28" ry="9" fill="#7e9ce0"/>
    <rect x="69" y="55" width="163" height="83" rx="35" fill="#f2bb54" stroke="#d9943d" stroke-width="7"/>
    <circle cx="112" cy="96" r="8" fill="#3f526c"/><circle cx="184" cy="96" r="8" fill="#3f526c"/><path d="M131 115q18 15 35 0" fill="none" stroke="#a86d52" stroke-width="6" stroke-linecap="round"/>
    <rect x="115" y="41" width="68" height="18" rx="8" fill="#fce5a0"/>
  </symbol>
  <symbol id="druida" viewBox="0 0 250 360">
    <ellipse cx="123" cy="338" rx="97" ry="15" fill="#275d87" opacity=".13"/>
    <path d="M49 157q75-27 151 0l24 167H24z" fill="#9068c6"/><path d="M93 158q29 20 61 0v166H93z" fill="#b9a1eb"/>
    <path d="M36 70q90-115 170 0z" fill="#6858a7"/><ellipse cx="124" cy="84" rx="112" ry="18" fill="#7c68bd"/>
    <ellipse cx="124" cy="123" rx="56" ry="60" fill="#d6a17d"/><path d="M74 106q21-56 101 0" fill="#69556c"/>
    <circle cx="106" cy="125" r="5" fill="#2e3248"/><circle cx="144" cy="125" r="5" fill="#2e3248"/>
    <path d="M114 148q14 10 25-1" stroke="#a45b60" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M43 193 17 254m185-64 29 65" fill="none" stroke="#d6a17d" stroke-width="18" stroke-linecap="round"/>
    <path d="M196 231 220 71" stroke="#8b6d5e" stroke-width="11" stroke-linecap="round"/>
    <path d="m222 36 11 22 24 4-17 16 4 25-22-12-22 12 4-25-17-16 24-4z" fill="#ffe28a"/>
    <path d="m124 35 8 15 17 2-13 12 3 18-15-9-15 9 3-18-13-12 17-2z" fill="#ffe6a5"/>
  </symbol>
  <symbol id="dromedary" viewBox="0 0 520 330">
    <ellipse cx="254" cy="304" rx="245" ry="20" fill="#5a6c4f" opacity=".15"/>
    <path d="M104 201q-5-110 77-124 16-77 89-7 55-65 88 13 63-4 60 128z" fill="#dcaa6c"/>
    <path d="M401 192q18-99 34-121 24-30 62-5 25 20 13 61-8 27-50 26l-9 69" fill="#dcaa6c"/>
    <path d="M103 201h41l-7 92h-38zm226 0h43l9 92h-40z" fill="#dcaa6c"/><path d="M96 288h57v24H95zm240 0h57v24h-57z" fill="#885c56"/>
    <circle cx="480" cy="99" r="6" fill="#4f4551"/><path d="M485 119q15 12 27-1" stroke="#94674f" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M404 154h59" stroke="#8c80d1" stroke-width="18"/><circle cx="430" cy="163" r="12" fill="#ffe28f"/>
    <path d="M97 199q-60 24-66 69" stroke="#bb8b59" stroke-width="12" fill="none" stroke-linecap="round"/>
  </symbol>
  <symbol id="andre" viewBox="0 0 210 340">
    <ellipse cx="103" cy="320" rx="74" ry="12" fill="#276f84" opacity=".13"/>
    <path d="M64 229h33l-5 88H58zm51 0h35l8 88h-36z" fill="#556a99"/>
    <path d="M58 304h42v19H48zm68 0h43v19h-43z" fill="#7b5b5b"/>
    <path d="M50 149q58-24 112 0l10 110H39z" fill="#88b98a"/>
    <path d="M44 166q-23 22-21 65m146-65q17 24 16 62" fill="none" stroke="#bb8b67" stroke-width="20" stroke-linecap="round"/>
    <ellipse cx="108" cy="103" rx="58" ry="62" fill="#bb8b67"/>
    <path d="M50 73q10-55 55-55 58 0 59 55z" fill="#538d7f"/><path d="M49 72h128q-15 24-53 20H50z" fill="#3e786e"/>
    <circle cx="88" cy="106" r="5" fill="#342c3b"/><circle cx="127" cy="106" r="5" fill="#342c3b"/><path d="M97 132q11 10 25 0" stroke="#7f4e50" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M77 160v86m62-86v86" stroke="#5e8679" stroke-width="18"/><path d="M90 186h35v49H90z" fill="#5e8679"/>
  </symbol>
  <symbol id="dracena" viewBox="0 0 180 270">
    <path d="M45 190h90l-12 70H57z" fill="#eaa579"/><path d="M35 189h110" stroke="#b97c65" stroke-width="11" stroke-linecap="round"/>
    <path d="M90 197V63" stroke="#4b9c75" stroke-width="12" stroke-linecap="round"/>
    <path d="M90 133Q15 15 38 30q90 16 52 117m0-39Q160-5 150 37q-71 25-60 115m0 4Q1 93 23 124q66 61 67 61m0-33q65-92 74-37-42 47-74 70" fill="#6bbd86" stroke="#3d9b70" stroke-width="6"/>
  </symbol>
  <symbol id="drain" viewBox="0 0 300 160">
    <ellipse cx="150" cy="123" rx="144" ry="33" fill="#a1cdd7"/>
    <ellipse cx="150" cy="103" rx="127" ry="46" fill="#7398aa"/>
    <ellipse cx="150" cy="103" rx="104" ry="27" fill="#435b77"/>
    <g stroke="#b5d3dd" stroke-width="12"><path d="M75 99h148m-113-21v48m40-50v51m40-47v45"/></g>
  </symbol>
  <symbol id="ball" viewBox="0 0 130 130"><circle cx="65" cy="65" r="57" fill="#fff2db" stroke="#6d7fc2" stroke-width="9"/><path d="m65 31 25 15-8 29H47l-8-29z" fill="#8b82d3"/><path d="M39 46 20 31m70 15 21-14M47 75l-13 26m48-26 14 28" fill="none" stroke="#8b82d3" stroke-width="9"/></symbol>
  <symbol id="truffle" viewBox="0 0 180 130"><ellipse cx="90" cy="114" rx="85" ry="15" fill="#5b566e" opacity=".15"/><circle cx="49" cy="70" r="39" fill="#a66a54"/><circle cx="105" cy="60" r="47" fill="#b7775c"/><circle cx="145" cy="85" r="28" fill="#955f54"/><path d="M20 72q28-42 54 2m5-18q26-40 50 2" stroke="#f2c59c" stroke-width="6" fill="none"/></symbol>
  <symbol id="map" viewBox="0 0 260 170"><path d="M28 36 88 17l88 25 58-22v112l-61 20-86-24-59 24z" fill="#fff1be" stroke="#c9a270" stroke-width="9"/><path d="M88 17v111m88-86v111" stroke="#dbb581" stroke-width="6" stroke-dasharray="12 8"/><path d="M64 103q47-76 99-42" fill="none" stroke="#77ac9a" stroke-width="10" stroke-dasharray="8 9"/><path d="m176 84 22 23m0-23-22 23" stroke="#df7490" stroke-width="11" stroke-linecap="round"/></symbol>
</defs>`;

const use = (id, x, y, width, height, more = '') => `<use href="#${id}" x="${x}" y="${y}" width="${width}" height="${height}" ${more}/>`;
const star = (x, y, size = 64) => use('star', x, y, size, size);
const sky = (mood = 'day') => {
  const color = mood === 'sunset' ? '#f9c6be' : mood === 'storm' ? '#a7bad9' : mood === 'magic' ? '#c9bcf0' : '#bfeefa';
  return `<rect width="1000" height="700" fill="${color}"/><rect width="1000" height="700" fill="url(#paper)"/>
    ${mood === 'storm' ? '' : '<circle cx="823" cy="105" r="68" fill="#ffe095"/>'}
    ${use('cloud', 60, 72, 165, 83)}${use('cloud', 560, 86, 157, 76)}
    <path d="M0 420Q175 334 351 412T710 396T1000 393V700H0Z" fill="${mood === 'storm' ? '#9bbeb4' : '#a8dfcd'}"/>
    <path d="M0 535Q210 423 482 507T1000 470V700H0Z" fill="${mood === 'magic' ? '#9bbdcf' : '#79c6ab'}"/>
    <path d="M0 633Q235 551 487 620T1000 559V700H0Z" fill="#4eac91"/>
    <g fill="#fce9aa"><circle cx="120" cy="557" r="5"/><circle cx="840" cy="576" r="7"/></g>`;
};
const railway = `<path d="M0 617Q500 581 1000 616" stroke="#6c6381" stroke-width="13" fill="none"/><path d="M0 644Q500 607 1000 643" stroke="#6c6381" stroke-width="13" fill="none"/>`;
const trail = `<path d="M347 700q-80-148 98-251 65-37 216-47" fill="none" stroke="#ffe0a5" stroke-width="100" opacity=".76"/>`;
const pond = `<ellipse cx="730" cy="620" rx="260" ry="50" fill="#93d5e7" opacity=".86"/>`;
const sparkles = star(110, 145, 81) + star(720, 189, 72) + star(879, 303, 53);
const notes = `<g font-family="Trebuchet MS,Arial,sans-serif" font-size="69" font-weight="900" fill="#e36da5"><text x="750" y="220">♫</text><text x="853" y="323">♪</text></g>`;
const bridge = `<path d="M420 594q257-120 544 0" fill="none" stroke="#ab8063" stroke-width="50"/><path d="M424 553q253-119 534 0" fill="none" stroke="#f9d89e" stroke-width="18"/>`;
const symbols = { sky, railway, trail, pond, sparkles, notes, bridge };

const dracoLayouts = [
  { mood: 'sunset', items: [['dragon',230,248,435,387],['ellie',52,376,190,293],['drone',650,175,280,165]], effects: ['sparkles'] },
  { mood: 'magic', items: [['ellie',100,347,208,310],['dragon',440,303,382,333]], effects: ['sparkles'], text: [['DRA',75,277],['DRE',765,322],['DRI',90,457],['DRO',791,486],['DRU',463,211]] },
  { items: [['dracena',42,345,193,294],['dracena',769,330,184,287],['dragon',309,263,439,395],['ellie',95,380,165,276]], effects: ['sparkles'] },
  { items: [['tree',705,250,250,411],['dragon',226,323,392,321],['ellie',58,373,175,300],['drone',610,165,310,175]], effects: ['trail'] },
  { items: [['drica',530,332,225,335],['ellie',184,340,190,314],['ball',404,519,105,105]], effects: ['trail', 'sparkles'] },
  { items: [['andre',570,302,225,344],['ellie',130,363,181,300],['drain',367,531,300,145]], effects: ['pond'] },
  { mood:'magic', items: [['druida',554,283,275,372],['ellie',130,365,190,306],['dragon',292,385,275,239],['map',374,322,187,128]], effects: ['sparkles'] },
  { items: [['dromedary',367,345,580,307],['ellie',83,345,195,311],['drone',599,178,262,149]], effects: ['trail'] },
  { items: [['dracena',52,372,177,264],['dracena',267,351,165,252],['dracena',789,336,170,279],['dragon',458,316,340,315],['ellie',94,385,150,253]], effects: ['sparkles'] },
  { items: [['drica',560,328,231,338],['ellie',149,352,205,320],['ball',422,525,116,116],['drone',622,178,255,140]], effects: ['trail'] },
  { items: [['andre',575,309,235,344],['ellie',130,365,200,300],['drain',352,525,332,156]], effects: ['pond', 'sparkles'] },
  { mood:'magic', items: [['tree',658,197,285,453],['drone',729,245,196,120],['dragon',337,311,337,309],['druida',134,374,196,269],['ellie',27,405,148,243]], effects: ['sparkles'] },
  { items: [['dragon',377,265,438,374],['drone',602,140,302,183],['ellie',77,342,205,318]], effects: ['sparkles'] },
  { mood:'sunset', items: [['dragon',314,298,343,326],['dromedary',543,390,411,243],['ellie',102,353,185,302],['druida',686,322,178,263],['drone',491,178,235,141]], effects: ['sparkles'] },
  { mood:'magic', items: [['ellie',374,316,246,348],['dragon',95,349,326,298],['drone',692,239,251,142]], effects: ['sparkles'], text: [['DRA',74,247],['DRE',757,393],['DRI',442,237],['DRO',54,460],['DRU',785,526]] },
  { mood:'sunset', items: [['ellie',292,326,241,337],['dragon',505,321,381,340],['trophy',89,296,246,310]], effects: ['sparkles'] }
];

const mixLayouts = [
  { mood:'sunset', items: [['train',59,352,693,315],['dragon',626,290,310,276],['ellie',78,310,188,314]], effects: ['railway', 'sparkles'] },
  { mood:'magic', items: [['ellie',361,324,244,331],['dragon',642,361,294,257],['train',35,466,387,203]], effects: ['sparkles'], text: [['TRA',64,243],['TRE',760,228],['DRA',357,224],['DRU',790,483]] },
  { items: [['train',244,359,694,304],['ellie',45,347,208,323],['dragon',666,301,279,265]], effects: ['railway', 'sparkles'] },
  { items: [['dragon',511,312,378,324],['ellie',86,353,195,307],['clover',300,470,101,132],['clover',398,448,103,135],['clover',476,460,104,131]], effects: ['sparkles'] },
  { items: [['drone',588,149,312,180],['ellie',83,355,210,307],['tree',721,301,242,351]], effects: ['trail'] },
  { items: [['drica',627,278,219,322],['tricycle',351,417,435,267],['ellie',96,342,182,305]], effects: ['trail', 'sparkles'] },
  { items: [['andre',573,308,221,321],['ellie',106,345,184,304],['drain',324,527,300,142],['clover',804,467,100,144]], effects: ['pond'] },
  { mood:'magic', items: [['train',209,390,629,266],['ellie',71,367,185,295],['druida',689,267,235,349],['dragon',407,415,237,216]], effects: ['railway', 'sparkles'] },
  { mood:'storm', items: [['drone',667,162,293,181],['ellie',102,363,189,297],['squirrel',350,348,255,297],['trumpet',474,418,251,155]], effects: ['notes'], extra: '<path d="M674 124 613 230h59l-35 99 113-142h-59l51-63z" fill="#ffe49a" stroke="#fff3c4" stroke-width="8"/>' },
  { items: [['tractor',330,306,628,344],['dragon',35,307,347,311],['dracena',682,212,140,193],['ellie',103,433,125,215]], effects: ['trail'] },
  { mood:'magic', items: [['druida',582,259,272,364],['ellie',113,336,208,320],['truffle',324,452,216,159]], effects: ['sparkles'] },
  { items: [['drica',545,322,234,330],['ellie',80,344,204,322],['ball',384,527,113,113],['tree',797,221,196,387]], effects: ['trail'] },
  { items: [['dromedary',381,350,586,305],['ellie',87,349,202,310],['drone',624,154,254,151],['trophy',285,415,134,191]], effects: ['sparkles'] },
  { items: [['train',107,355,663,283],['dragon',709,300,267,256],['ellie',35,384,166,258]], effects: ['railway', 'bridge'] },
  { mood:'sunset', items: [['trophy',417,248,273,365],['ellie',80,365,192,293],['dragon',637,329,320,297],['drone',679,161,245,144]], effects: ['sparkles'] },
  { mood:'magic', items: [['ellie',382,318,236,343],['dragon',103,354,315,292],['train',619,441,353,185]], effects: ['sparkles'], text: [['TRA',68,250],['TRU',740,237],['DRA',358,241],['DRU',770,522]] },
  { mood:'sunset', items: [['ellie',324,304,255,354],['dragon',560,343,328,290],['trophy',78,331,267,327]], effects: ['sparkles'] }
];

function drawing(layout) {
  const effects = (layout.effects || []).map((effect) => symbols[effect] || '').join('');
  const items = layout.items.map(([id, x, y, w, h, more]) => use(id, x, y, w, h, more || '')).join('');
  const captions = (layout.text || []).map(([word, x, y]) => `<text x="${x}" y="${y}" font-family="Trebuchet MS,Arial,sans-serif" font-weight="900" font-size="48" fill="#7353b5">${word}</text>`).join('');
  return sky(layout.mood) + effects + items + (layout.extra || '') + captions;
}

for (const [file, layouts] of [
  ['books/draco-e-o-drone-desaparecido.json', dracoLayouts],
  ['books/ellie-e-o-trem-dos-dragoes.json', mixLayouts]
]) {
  const book = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  if (book.pages.length !== layouts.length) throw Error(`Wrong number of illustrations for ${book.id}`);
  for (const [index, page] of book.pages.entries()) {
    const destination = path.join(root, page.illustration);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700" role="img">
<title>${page.title.replaceAll('&', '&amp;')}</title>
${commonDefs}
${newSymbols}
${drawing(layouts[index])}
</svg>\n`;
    fs.writeFileSync(destination, svg);
  }
  console.log(`${book.title}: ${layouts.length} SVGs gerados`);
}
