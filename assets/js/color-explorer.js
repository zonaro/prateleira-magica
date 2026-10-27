/* A oficina interativa do Livro das Cores. Toda a lógica funciona offline. */
(() => {
  'use strict';
  const colors = window.LivrinhoColors;
  const narrator = window.LivrinhoSpeech;

  function create() {
    const section = document.createElement('section');
    section.className = 'color-explorer';
    section.setAttribute('aria-label', 'Laboratório interativo de cores');
    section.innerHTML = `
      <div class="color-explorer-top">
        <div class="color-explorer-preview" data-color-preview aria-hidden="true">✦</div>
        <div class="color-explorer-description"><span class="color-mini-label">MINHA COR MÁGICA</span>
          <strong data-color-name aria-live="polite">Rosa</strong><span data-color-hex>#f44e9a</span>
          <button type="button" data-hear-color aria-label="Ouvir nome da cor">🔊 Ouvir esta cor</button></div>
      </div>
      <div class="color-explorer-pickers">
        <label>Escolha no arco-íris <input data-color-picker type="color" value="#f44e9a" aria-label="Escolher uma cor no seletor"></label>
        <label>Ou escreva uma palavra mágica <input data-color-word type="text" maxlength="120" placeholder="Ex.: azul, girassol, abraço…" autocomplete="off"></label>
      </div>
      <div class="color-ready"><span>Ou toque em uma bolinha:</span><div data-color-quick class="color-quick" aria-label="Cores prontas"></div></div>
      <p data-color-feedback class="color-feedback" role="status" aria-live="polite">Qual cor você vai inventar hoje?</p>
      <div class="color-harmonies-heading"><strong>🎼 Qual combinação vamos criar?</strong>
        <label>Sentimento da paleta <select data-color-mood aria-label="Escolher sentimento da paleta"></select></label>
      </div><div data-color-harmonies class="color-harmonies"></div>
      <p class="color-harmony-hint">💡 Harmonia é como uma banda: as cores podem tocar a mesma melodia ou fazer contrastes divertidos. Experimente!</p>`;

    const $ = (selector) => section.querySelector(selector);
    let current = '#f44e9a';
    let mood = 'Fun';
    const moodSelect = $('[data-color-mood]');
    for (const [key, label] of colors.moods) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = label;
      moodSelect.append(option);
    }
    moodSelect.value = mood;
    for (const [hex, name] of colors.swatches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-quick-dot';
      button.style.background = hex;
      button.dataset.color = hex;
      button.title = name;
      button.setAttribute('aria-label', `Escolher ${name}`);
      button.addEventListener('click', () => updateColor(hex, '', `Você escolheu ${name}!`));
      $('[data-color-quick]').append(button);
    }
    function updateColor(color, word = '', feedback = '') {
      if (!colors.validHex(color)) return;
      current = color.toLowerCase();
      $('[data-color-preview]').style.background = current;
      $('[data-color-name]').textContent = colors.name(current);
      $('[data-color-hex]').textContent = current.toUpperCase();
      $('[data-color-picker]').value = current;
      $('[data-color-word]').value = word;
      $('[data-color-feedback]').textContent = feedback || `Essa cor parece ${colors.name(current).toLowerCase()}.`;
      for (const button of $('[data-color-quick]').children) {
        const selected = button.dataset.color.toLowerCase() === current;
        button.setAttribute('aria-pressed', String(selected));
      }
      renderHarmonies();
    }
    function renderHarmonies() {
      const container = $('[data-color-harmonies]');
      container.replaceChildren();
      for (const harmony of colors.harmonies(current, mood)) {
        const card = document.createElement('article');
        card.className = 'color-harmony-card';
        const title = document.createElement('h3');
        title.textContent = harmony.title;
        const text = document.createElement('p');
        text.textContent = harmony.description;
        const swatchRow = document.createElement('div');
        swatchRow.className = 'color-harmony-swatches';
        for (const hex of harmony.colors) {
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.style.background = hex;
          swatch.title = `${colors.name(hex)} · ${hex}`;
          swatch.setAttribute('aria-label', `Escolher ${colors.name(hex)} (${hex})`);
          swatch.addEventListener('click', () => updateColor(hex, '', `Agora vamos descobrir a cor ${colors.name(hex).toLowerCase()}!`));
          swatchRow.append(swatch);
        }
        card.append(title, text, swatchRow);
        container.append(card);
      }
    }
    $('[data-color-picker]').addEventListener('input', (event) => updateColor(event.target.value));
    $('[data-color-word]').addEventListener('input', (event) => {
      const word = event.target.value;
      const generated = colors.hex(word);
      if (!generated) {
        $('[data-color-feedback]').textContent = word ? 'Continue escrevendo a palavra mágica…' : 'Escolha uma bolinha ou digite uma palavra!';
        return;
      }
      updateColor(generated, word, `A palavra “${word}” criou uma cor parecida com ${colors.name(generated).toLowerCase()}!`);
    });
    moodSelect.addEventListener('change', () => { mood = moodSelect.value; renderHarmonies(); });
    $('[data-hear-color]').addEventListener('click', () => {
      narrator?.play(`Esta cor se chama ${colors.name(current)}.`, { lang: 'pt-BR', rate: .77, pitch: 1.08 });
    });
    updateColor(current);
    return section;
  }
  window.LivrinhoColorExplorer = { create };
})();
