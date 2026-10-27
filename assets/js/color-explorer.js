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
          <strong data-color-name aria-live="polite">Rosa</strong><div class="color-explorer-meta"><span data-color-hex>#f44e9a</span><span data-color-temp class="color-explorer-temp"></span></div>
          <button type="button" data-hear-color aria-label="Ouvir nome da cor">🔊 Ouvir esta cor</button></div>
      </div>
      <div class="color-explorer-pickers">
        <label>Escolha no arco-íris <input data-color-picker type="color" value="#f44e9a" aria-label="Escolher uma cor no seletor"></label>
        <label>Ou escreva uma palavra mágica <input data-color-word type="text" maxlength="120" placeholder="Ex.: azul, girassol, abraço…" autocomplete="off"></label>
      </div>
      <div class="color-ready"><span>Ou toque em uma bolinha:</span><div class="color-quick-row"><button type="button" class="color-random-btn" data-color-random aria-label="Sortear cor aleatória">🎲 Sortear cor</button><div data-color-quick class="color-quick" aria-label="Cores prontas"></div></div></div>
      <p data-color-feedback class="color-feedback" role="status" aria-live="polite">Qual cor você vai inventar hoje?</p>
      <div class="color-harmonies-heading"><strong>🎼 Qual combinação vamos criar?</strong>
        <label>Qual é o clima das cores? <select data-color-mood aria-label="Escolher o clima das cores"></select></label>
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
    const quickContainer = $('[data-color-quick]');
    for (const [hex, name] of colors.swatches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-quick-dot';
      button.style.background = hex;
      button.dataset.color = hex;
      button.title = name;
      button.setAttribute('aria-label', `Escolher ${name}`);
      button.addEventListener('click', () => updateColor(hex, '', `Você escolheu ${name}!`));
      quickContainer.append(button);
    }
    $('[data-color-random]').addEventListener('click', () => {
      let random;
      if (typeof colors.randomNamedColor === 'function') {
        random = colors.randomNamedColor();
      } else {
        const list = colors.swatches || [];
        if (!list.length) return;
        const [hex] = list[Math.floor(Math.random() * list.length)];
        random = { hex };
      }
      const hex = random?.hex;
      if (!colors.validHex(hex)) return;
      const colorName = colors.name(hex);
      updateColor(hex, random.key ? colorName.toLowerCase() : '', `Surpresa! Sorteamos a cor ${colorName.toLowerCase()}!`);
    });
    function temperatureLabel(temp) {
      const value = String(temp || '').toLowerCase();
      if (!value) return '';
      if (value.includes('veryhot')) return 'Muito quente';
      if (value.includes('hot')) return 'Quente';
      if (value.includes('neutralhot')) return 'Neutro-quente';
      if (value.includes('neutralcold')) return 'Neutro-frio';
      if (value.includes('cold')) return 'Frio';
      if (value.includes('verycold')) return 'Muito frio';
      if (value.includes('neutral')) return 'Neutro';
      return temp;
    }
    function updateColor(color, word = '', feedback = '') {
      if (!colors.validHex(color)) return;
      current = color.toLowerCase();
      $('[data-color-preview]').style.background = current;
      const name = colors.name(current);
      $('[data-color-name]').textContent = name;
      $('[data-color-hex]').textContent = current.toUpperCase();
      const tempEl = $('[data-color-temp]');
      if (tempEl) {
        const temp = colors.temperature ? colors.temperature(current) : '';
        const label = temperatureLabel(temp);
        tempEl.textContent = label ? `• Temperatura: ${label.toLowerCase()}` : '';
        tempEl.style.display = label ? 'inline' : 'none';
      }
      $('[data-color-picker]').value = current;
      $('[data-color-word]').value = word;
      $('[data-color-feedback]').textContent = feedback || `Essa cor parece ${name.toLowerCase()}.`;
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
          if (!hex) continue;
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.style.background = hex;
          const colorName = colors.name(hex);
          swatch.title = `${colorName} · ${String(hex).toUpperCase()}`;
          swatch.setAttribute('aria-label', `Escolher ${colorName} (${String(hex).toUpperCase()})`);
          swatch.addEventListener('click', () => updateColor(hex, '', `Agora vamos descobrir a cor ${colorName.toLowerCase()}!`));
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
    function temperatureLabelForSpeech(temp) {
      const value = String(temp || '').toLowerCase();
      if (!value) return '';
      if (value.includes('veryhot')) return 'muito quente';
      if (value.includes('hot')) return 'quente';
      if (value.includes('neutralhot')) return 'neutro-quente';
      if (value.includes('neutralcold')) return 'neutro-fria';
      if (value.includes('cold')) return 'fria';
      if (value.includes('verycold')) return 'muito fria';
      if (value.includes('neutral')) return 'neutra';
      return '';
    }
    $('[data-hear-color]').addEventListener('click', () => {
      const name = colors.name(current);
      const temp = colors.temperature ? colors.temperature(current) : '';
      const tempLabel = temperatureLabelForSpeech(temp);
      const text = tempLabel ? `Essa cor se chama ${name} e ela é ${tempLabel}.` : `Essa cor se chama ${name}.`;
      try {
        const synth = window.speechSynthesis;
        if (synth && typeof synth.resume === 'function' && synth.state === 'paused') {
          synth.resume();
        }
      } catch {}
      const played = narrator?.play ? narrator.play(text, { lang: 'pt-BR', rate: .77, pitch: 1.08 }) : false;
      if (played) return;
      try {
        const synth = window.speechSynthesis;
        if (!synth || !window.SpeechSynthesisUtterance) return;
        synth.cancel();
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = 'pt-BR';
        utter.rate = .77;
        utter.pitch = 1.08;
        const voices = synth.getVoices?.() || [];
        const voice = voices.find((item) => item.lang?.toLowerCase() === 'pt-br')
          || voices.find((item) => item.lang?.toLowerCase().startsWith('pt'));
        if (voice) utter.voice = voice;
        synth.speak(utter);
      } catch (error) {
        console.warn('Não foi possível reproduzir o áudio da cor:', error);
      }
    });
    updateColor(current);
    return section;
  }
  window.LivrinhoColorExplorer = { create };
})();
