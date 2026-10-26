/* Avatar infantil vetorial e combinável, inspirado em retratos do SVG Repo.
 * Formas originais; os SVGs baixados ficam em assets/avatar-reference/.
 * Mantém o viewBox 210x340 usado por todas as ilustrações dos livros.
 */
(() => {
  'use strict';
  const hairStyles = [
    ['puffs', 'Coquinhos'], ['short', 'Curtinho'], ['side', 'De lado'],
    ['long', 'Longo'], ['curly', 'Cacheado'], ['afro', 'Afro'],
    ['braids', 'Trancinhas'], ['ponytail', 'Rabo de cavalo'], ['cap', 'Boné']
  ];
  const outfitStyles = [
    ['hoodie', 'Moletom'], ['tee', 'Camiseta'], ['dress', 'Vestido'],
    ['overalls', 'Jardineira'], ['jacket', 'Jaqueta'], ['jersey', 'Esportivo']
  ];
  const hairColors = [
    ['#493a55', 'Castanho escuro'], ['#7b4c35', 'Castanho'],
    ['#c47b43', 'Ruivo'], ['#f5c35b', 'Loiro'],
    ['#303448', 'Preto'], ['#d38ec4', 'Rosa fantasia'],
    ['#65b8cc', 'Azul fantasia'], ['#8c6bd0', 'Roxo fantasia']
  ];
  const outfitColors = [
    ['#fa7195', 'Rosa'], ['#639de8', 'Azul'], ['#79bc8d', 'Verde'],
    ['#9c80df', 'Lilás'], ['#efb857', 'Amarelo'], ['#ed805d', 'Coral'],
    ['#5abdbb', 'Turquesa'], ['#707c9d', 'Grafite']
  ];

  function shade(hex, amount) {
    const value = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#493a55';
    const target = amount >= 0 ? 255 : 0;
    const weight = Math.min(1, Math.abs(amount));
    const parts = [1, 3, 5].map((at) => Math.round(parseInt(value.slice(at, at + 2), 16) * (1 - weight) + target * weight));
    return `#${parts.map((part) => part.toString(16).padStart(2, '0')).join('')}`;
  }

  function hairLayers(style, hair, light, dark) {
    const puffs = '<circle cx="31" cy="64" r="29"/><circle cx="179" cy="64" r="29"/>';
    switch (style) {
      case 'short': return {
        back: `<path d="M45 108Q27 17 106 17q75-1 63 94Z" fill="${dark}"/>`,
        front: `<path d="M43 91Q32 27 97 24q62-2 72 62-17-3-25-25-15 28-37 14-27 25-64 16Z" fill="${hair}"/><path d="M62 52q26-19 50-16" stroke="${light}" stroke-width="9" fill="none" stroke-linecap="round"/>`
      };
      case 'side': return {
        back: `<path d="M43 101Q26 19 104 17q79 0 67 96Z" fill="${dark}"/>`,
        front: `<path d="M43 89Q37 23 108 22q60 3 63 62-26 1-39-15-25 17-83 22Z" fill="${hair}"/><path d="M123 39q-16 36-75 48" stroke="${light}" stroke-width="9" opacity=".7" fill="none" stroke-linecap="round"/>`
      };
      case 'long': return {
        back: `<path d="M38 97Q26 15 104 15q78-3 69 92l13 118q-17 19-43 0l-9-81H74l-8 82q-23 13-43-2Z" fill="${dark}"/>`,
        front: `<path d="M42 91Q39 24 106 22q64 0 64 69-31-7-42-27-34 30-86 27Z" fill="${hair}"/><path d="M58 61q18-20 45-22" stroke="${light}" stroke-width="9" opacity=".7" fill="none" stroke-linecap="round"/>`
      };
      case 'curly': return {
        back: `<g fill="${dark}"><circle cx="50" cy="71" r="30"/><circle cx="71" cy="40" r="30"/><circle cx="110" cy="30" r="32"/><circle cx="148" cy="46" r="31"/><circle cx="170" cy="82" r="29"/></g>`,
        front: `<g fill="${hair}"><circle cx="60" cy="54" r="22"/><circle cx="89" cy="35" r="24"/><circle cx="122" cy="36" r="24"/><circle cx="151" cy="61" r="24"/><circle cx="43" cy="88" r="17"/></g><circle cx="83" cy="36" r="11" fill="${light}" opacity=".5"/>`
      };
      case 'afro': return {
        back: `<g fill="${dark}"><circle cx="40" cy="73" r="37"/><circle cx="68" cy="38" r="37"/><circle cx="107" cy="28" r="38"/><circle cx="147" cy="43" r="39"/><circle cx="175" cy="82" r="35"/><circle cx="38" cy="111" r="29"/><circle cx="173" cy="113" r="30"/></g>`,
        front: `<g fill="${hair}"><circle cx="52" cy="56" r="28"/><circle cx="83" cy="36" r="28"/><circle cx="123" cy="34" r="28"/><circle cx="157" cy="61" r="29"/><circle cx="49" cy="87" r="25"/><circle cx="164" cy="92" r="22"/></g><circle cx="81" cy="31" r="12" fill="${light}" opacity=".3"/>`
      };
      case 'braids': return {
        back: `<path d="M44 93Q33 19 105 18q72-1 64 80l-10 37H55Z" fill="${dark}"/><g fill="${hair}" stroke="${dark}" stroke-width="2"><circle cx="40" cy="162" r="14"/><circle cx="39" cy="187" r="14"/><circle cx="39" cy="213" r="12"/><circle cx="171" cy="162" r="14"/><circle cx="172" cy="187" r="14"/><circle cx="172" cy="213" r="12"/></g><path d="M28 225h23m109 0h23" stroke="#f1b970" stroke-width="9" stroke-linecap="round"/>`,
        front: `<path d="M45 96Q34 25 105 23q71 0 63 73-23-3-41-28-24 24-82 28Z" fill="${hair}"/><path d="M60 53q17-13 33-15" stroke="${light}" stroke-width="8" opacity=".6" fill="none" stroke-linecap="round"/>`
      };
      case 'ponytail': return {
        back: `<path d="M40 98Q32 20 105 17q71 0 67 79l-12 19H48Z" fill="${dark}"/><path d="M163 68q42 2 36 76-3 43-36 58-6-22 1-42 21-39-10-68Z" fill="${hair}" stroke="${dark}" stroke-width="3"/><rect x="158" y="76" width="24" height="15" rx="7" fill="#eeafbf"/>`,
        front: `<path d="M43 94Q41 25 107 22q56 0 64 68-37 0-55-29-24 26-73 33Z" fill="${hair}"/><path d="M67 56q21-18 48-18" stroke="${light}" stroke-width="9" opacity=".6" fill="none" stroke-linecap="round"/>`
      };
      case 'cap': return {
        back: `<path d="M47 101Q33 30 104 28q67-1 61 74Z" fill="${dark}"/>`,
        front: `<path d="M43 76q1-58 63-58 62 0 63 60Z" fill="#628ad5"/><path d="M34 77h148q-6 23-35 22H45Z" fill="#4268b7"/><path d="M71 36q27-15 55-2" stroke="#a6c3f8" stroke-width="9" fill="none" stroke-linecap="round"/>`
      };
      default: return {
        back: `<path d="M42 98Q30 18 106 18q74 0 66 86Z" fill="${dark}"/><g fill="${hair}" stroke="${dark}" stroke-width="3">${puffs}</g>`,
        front: `<path d="M43 93Q40 29 105 26q63 1 65 67-28-5-40-26-32 28-87 26Z" fill="${hair}"/><path d="M64 56q22-15 42-13" stroke="${light}" stroke-width="8" opacity=".65" fill="none" stroke-linecap="round"/>`
      };
    }
  }

  function clothing(style, main, light, dark, skin) {
    const torso = `<path d="M64 180q41-15 82 0 30 7 39 52l-9 54H34l-9-54q9-45 39-52Z" fill="${main}" stroke="${dark}" stroke-width="3"/>`;
    const sleeves = `<path d="M62 180q-27 7-38 52l18 21 35-48M147 180q31 5 38 52l-18 21-36-48" fill="${dark}"/>`;
    switch (style) {
      case 'tee': return `${torso}<path d="M64 181q41-12 82 0l-8 32H72Z" fill="${light}" opacity=".25"/><path d="M89 181q16 20 33 0" stroke="${dark}" stroke-width="7" fill="none"/><path d="m105 220 6 12 14 2-10 10 2 14-12-7-13 7 3-14-10-10 14-2Z" fill="#fff2b2"/>`;
      case 'dress': return `<path d="M65 182q40-17 81 0l20 51 19 71H24l21-71Z" fill="${main}" stroke="${dark}" stroke-width="3"/><path d="M80 182q25 26 51 0" stroke="#fff9e5" stroke-width="10" fill="none"/><path d="M72 236h68" stroke="${dark}" stroke-width="6" opacity=".45"/><path d="M61 271l-8 28m52-32v33m48-30 10 29" stroke="${light}" stroke-width="6" fill="none" opacity=".8"/><circle cx="106" cy="216" r="8" fill="#fff2b2"/>`;
      case 'overalls': return `<path d="M64 180q41-15 82 0 30 7 39 52l-9 54H34l-9-54q9-45 39-52Z" fill="#e0eef0" stroke="#b5cdd1" stroke-width="3"/><path d="M73 197h66l9 90H66Z" fill="${main}"/><path d="M69 191 89 185l9 47-23 5Zm72 0-20-6-9 47 23 5Z" fill="${dark}"/><circle cx="87" cy="216" r="6" fill="#f4c576"/><circle cx="124" cy="216" r="6" fill="#f4c576"/><path d="M91 252h29v18H91Z" fill="${light}" opacity=".55"/>`;
      case 'jacket': return `${torso}<path d="M80 186h51l-2 101H82Z" fill="#f9eee7"/><path d="M65 183 94 190l-14 96H33Zm80 0-27 7 11 96h48Z" fill="${main}" stroke="${dark}" stroke-width="2"/><path d="M79 186 93 201 80 215m50-29-13 15 13 14" stroke="${light}" stroke-width="8" fill="none"/><path d="M105 202v80" stroke="${dark}" stroke-width="3" stroke-dasharray="3 11"/>`;
      case 'jersey': return `${torso}${sleeves}<path d="M87 180q18 17 36 0" stroke="#fff3d8" stroke-width="8" fill="none"/><path d="M52 194v83m105-83v83" stroke="${light}" stroke-width="10" opacity=".9"/><circle cx="105" cy="237" r="24" fill="#ffffff44"/><text x="105" y="250" font-size="34" font-weight="900" text-anchor="middle" font-family="Arial,sans-serif" fill="#fffaf0">7</text>`;
      default: return `${torso}<path d="M44 189q21-25 39-8l-15 28m98-20q-21-25-39-8l15 28" fill="${dark}"/><path d="M90 185q15 17 30 0" stroke="#fff0f3" stroke-width="8" fill="none"/><path d="M96 198v26m19-26v26" stroke="#fff5e7" stroke-width="4" stroke-linecap="round"/><path d="M72 243h67l-5 27H77Z" fill="${light}" opacity=".45" stroke="${dark}" stroke-width="3"/><path d="M84 241q22 14 42 0" fill="none" stroke="${dark}" stroke-width="3"/><path d="M50 269h24m62 0h24" stroke="${light}" stroke-width="9" stroke-linecap="round"/>`;
    }
  }

  function avatarBody(settings = {}) {
    const skin = /^#[0-9a-f]{6}$/i.test(settings.skinColor || '') ? settings.skinColor : '#e9aa83';
    const hair = /^#[0-9a-f]{6}$/i.test(settings.hairColor || '') ? settings.hairColor : '#493a55';
    const outfit = /^#[0-9a-f]{6}$/i.test(settings.outfitColor || '') ? settings.outfitColor : '#fa7195';
    const style = hairStyles.some(([id]) => id === settings.avatarStyle) ? settings.avatarStyle : 'puffs';
    const clothingStyle = outfitStyles.some(([id]) => id === settings.outfitStyle) ? settings.outfitStyle : 'hoodie';
    const shadow = shade(skin, -.14);
    const hairParts = hairLayers(style, hair, shade(hair, .22), shade(hair, -.18));
    return `<ellipse cx="105" cy="329" rx="73" ry="10" fill="#243f59" opacity=".13"/>
      <path d="M68 267h33l-8 49H65Zm43 0h33l7 49h-30Z" fill="#5879b9"/>
      <path d="M65 307h35v18H52q-4-17 13-18Zm59 0h36q16 2 13 18h-48Z" fill="#625a89"/>
      ${hairParts.back}
      <path d="M89 162h33v31H89Z" fill="${shadow}"/>
      <path d="M52 207q-20 11-22 49m129-49q20 11 22 49" stroke="${skin}" stroke-width="18" stroke-linecap="round" fill="none"/>
      ${clothing(clothingStyle, outfit, shade(outfit, .28), shade(outfit, -.14), skin)}
      <ellipse cx="45" cy="116" rx="12" ry="18" fill="${shadow}"/>
      <ellipse cx="166" cy="116" rx="12" ry="18" fill="${shadow}"/>
      <ellipse cx="105" cy="106" rx="61" ry="72" fill="${skin}"/>
      <path d="M47 120q0 48 59 57 54-9 56-56-17 41-57 43-40-3-58-44Z" fill="${shadow}" opacity=".21"/>
      ${hairParts.front}
      <ellipse cx="83" cy="112" rx="5" ry="6" fill="#354050"/><ellipse cx="129" cy="112" rx="5" ry="6" fill="#354050"/>
      <circle cx="85" cy="110" r="1.7" fill="white"/><circle cx="131" cy="110" r="1.7" fill="white"/>
      <ellipse cx="62" cy="132" rx="10" ry="6" fill="#ed8494" opacity=".45"/><ellipse cx="150" cy="132" rx="10" ry="6" fill="#ed8494" opacity=".45"/>
      <path d="M95 137q11 12 23 0" fill="none" stroke="${shade(skin, -.38)}" stroke-width="5" stroke-linecap="round"/>`;
  }

  function avatarSymbol(id, settings) {
    if (!/^[a-z]+$/.test(id)) throw Error('Invalid SVG symbol id');
    return `<symbol id="${id}" viewBox="0 0 210 340">${avatarBody(settings)}</symbol>`;
  }
  function avatarSVG(settings) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="340" viewBox="0 0 210 340" role="img" aria-label="Avatar infantil personalizável">${avatarBody(settings)}</svg>`;
  }
  window.LivrinhoAvatar = { hairStyles, outfitStyles, hairColors, outfitColors, avatarBody, avatarSymbol, avatarSVG };
})();
