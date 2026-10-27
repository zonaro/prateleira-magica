(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  const avatarCatalog = window.LivrinhoAvatar;
  const narrator = window.LivrinhoSpeech;
  const colors = window.LivrinhoColors;
  if (!preferences || !avatarCatalog) return;
  const root = new URL('./', document.baseURI);
  const editor = document.getElementById('settingsApp');
  if (!editor) {
    const hero = document.getElementById('heroAvatar');
    if (hero) {
      const refreshHero = () => { hero.innerHTML = preferences.avatarSVG(preferences.load()); };
      refreshHero();
      document.addEventListener('livrinhos:protagonist-changed', refreshHero);
    }
    for (const button of document.querySelectorAll('[data-open-settings]')) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const destination = new URL('perfil.html#personalizar', root);
        location.assign(destination.href);
      });
    }
    return;
  }
  const returnUrl = '#conquistas';
  const skinColors = [
    ['#f5d4b3', 'Pele clara'], ['#e9aa83', 'Pele média clara'],
    ['#c98760', 'Pele média'], ['#a66846', 'Pele bronzeada'],
    ['#75472f', 'Pele escura'], ['#4a2c28', 'Pele muito escura'],
    ['#83dca5', 'Verde fantasia'], ['#8bcfff', 'Azul fantasia'],
    ['#c1a4ff', 'Lilás fantasia'], ['#ffb7d4', 'Rosa fantasia']
  ];
  const hairStyles = avatarCatalog.hairStyles;
  const outfitStyles = avatarCatalog.outfitStyles;
  const bottomStyles = avatarCatalog.bottomStyles;
  const petStyles = avatarCatalog.petStyles;
  const accessoryStyles = avatarCatalog.accessoryStyles || [];
  const accessoryGroups = Object.fromEntries(accessoryStyles.map(([id, , group]) => [id, group]));
  const presetParts = window.LivrinhoAvatarPresetParts || {};
  let draft = preferences.load();
  let lastSaved = preferences.clean(draft);
  const undoHistory = [];
  let lastEditGroup = '';
  let lastEditAt = 0;
  let pronunciationTouched = false;

  const dialog = editor;
  dialog.innerHTML = `
    <div class="settings-layout">
      <aside class="settings-preview-column" aria-label="Prévia do seu personagem">
        <div class="avatar-editor"><div class="avatar-stage" id="avatarStage"></div>
          <div class="settings-preview-label"><strong id="previewName">Meu personagem</strong><span>⭐ Sua estrela!</span></div>
        </div>
        <div class="editor-history-tools"><button id="undoSettings" type="button" disabled>↶ Desfazer</button>
          <span id="autoSaveStatus" role="status" aria-live="polite">✓ Tudo guardado!</span></div>
      </aside>
    <form class="preferences-form" id="avatarSettingsForm">
      <div class="preferences-heading">
        <div><div class="section-kicker">NOSSA ESTRELA</div><h2 id="settingsTitle">Crie seu personagem ✨</h2></div>
        <a class="settings-close" id="closeSettings" aria-label="Ir para Meu perfil" href="${returnUrl}">🏅 Meu perfil</a>
      </div>
      <p class="settings-intro">Monte seu personagem combinando cabelos, roupas e cores. Ele aparecerá nas ilustrações de todos os livros!</p>
      <div class="preferences-content">
        <div class="preferences-fields">
          <label class="field-label" for="childName">Meu nome</label>
          <input id="childName" name="childName" type="text" maxlength="32" autocomplete="off" placeholder="Ex.: Ellie" required>
          <label class="field-label" for="childPronunciation">Como a voz deve pronunciar o nome?</label>
          <div class="pronunciation-input-row">
            <input id="childPronunciation" name="childPronunciation" type="text" maxlength="64" autocomplete="off" placeholder="Ex.: Éli">
            <button id="hearPronunciation" class="pronunciation-preview-button" type="button" aria-label="Ouvir a pronúncia digitada" title="Testar a pronúncia digitada"><span aria-hidden="true">🔊</span> <span class="pronunciation-preview-text">Ouvir</span></button>
          </div>
          <p class="field-help">Escreva como se fala, com acentos se ajudar. Ex.: Ellie → Éli.</p>
          <label class="field-label" for="birthDate">Data de nascimento</label>
          <input id="birthDate" name="birthDate" type="date" aria-describedby="birthAgeHint">
          <p id="birthAgeHint" class="field-help">Opcional. A idade pode personalizar os próximos livros.</p>
          <fieldset class="gender-fieldset"><legend>Como os livros vão falar de você?</legend>
            <label><input type="radio" name="childGender" value="masculino"><span>Masculino<small>ele / dele</small></span></label>
            <label><input type="radio" name="childGender" value="feminino"><span>Feminino<small>ela / dela</small></span></label>
            <label><input type="radio" name="childGender" value="neutro"><span>Neutro<small>elu / delu</small></span></label>
          </fieldset>
        </div>
      </div>
      <fieldset class="avatar-style-fieldset"><legend>Penteado</legend><div id="avatarStyles" class="avatar-style-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Roupa</legend><div id="outfitStyles" class="avatar-style-grid outfits-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Parte de baixo</legend><div id="bottomStyles" class="avatar-style-grid bottoms-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Acessórios ✨</legend>
        <p class="settings-intro" style="margin-bottom:8px;">Adicione acessórios ao seu personagem. Alguns tipos não podem ser combinados (apenas 1 chapéu/tiara/fones, apenas 1 óculos).</p>
        <div id="accessoryStyles" class="avatar-style-grid"></div>
      </fieldset>
      <fieldset class="avatar-style-fieldset pet-fieldset"><legend>Minha pelúcia companheira 🧸</legend>
        <p id="petUnlockStatus" class="pet-unlock-status" role="status"></p>
        <div id="petStyles" class="pet-style-grid"></div>
      </fieldset>
      <fieldset class="skin-fieldset"><legend>Cor da pele — natural ou fantasia</legend><div id="skinOptions" class="skin-options"></div>
        <label class="custom-color"><span>Ou escolha qualquer cor</span><input id="customSkinColor" type="color" aria-label="Selecionar outra cor de pele"></label>
      </fieldset>
      <div class="avatar-color-fields">
        <fieldset class="skin-fieldset"><legend>Cor do cabelo</legend><div id="hairColorOptions" class="skin-options"></div>
          <label class="custom-color"><span>Outra cor</span><input id="customHairColor" type="color" aria-label="Selecionar outra cor de cabelo"></label>
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor da roupa</legend><div id="outfitColorOptions" class="skin-options"></div>
          <label class="custom-color"><span>Outra cor</span><input id="customOutfitColor" type="color" aria-label="Selecionar outra cor de roupa"></label>
        </fieldset>
      </div>
      <div class="avatar-color-fields">
        <fieldset class="skin-fieldset"><legend>Cor da calça, shorts ou saia</legend><div id="bottomColorOptions" class="skin-options"></div>
          <label class="custom-color"><span>Outra cor</span><input id="customBottomColor" type="color" aria-label="Selecionar outra cor de calça, shorts ou saia"></label>
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor dos sapatos</legend><div id="shoeColorOptions" class="skin-options"></div>
          <label class="custom-color"><span>Outra cor</span><input id="customShoeColor" type="color" aria-label="Selecionar outra cor dos sapatos"></label>
        </fieldset>
      </div>
      <section class="magic-color-maker" aria-labelledby="magicColorTitle">
        <h3 id="magicColorTitle">✨ Invente uma cor com palavras!</h3>
        <p>Escreva uma cor, um sentimento ou uma palavra maluca e veja que cor aparece! A mesma palavra sempre cria a mesma cor.</p>
        <label for="magicColorWord">Minha palavra mágica</label>
        <input id="magicColorWord" type="text" maxlength="120" placeholder="Ex.: girassol, lilás, abraço…" autocomplete="off">
        <div class="magic-color-result">
          <span id="magicColorSwatch" class="magic-color-swatch" aria-hidden="true"></span>
          <span id="magicColorName" role="status" aria-live="polite">Escreva para descobrir uma cor!</span>
          <button id="magicColorHear" type="button" aria-label="Ouvir o nome da cor" disabled>🔊 Ouvir</button>
        </div>
        <div class="magic-color-actions"><label for="magicColorTarget">Pintar qual parte?</label>
          <select id="magicColorTarget">
            <option value="hairColor">Cabelo</option><option value="outfitColor">Roupa</option>
            <option value="bottomColor">Calça, shorts ou saia</option><option value="shoeColor">Sapatos</option>
            <option value="skinColor">Pele (inclusive fantasia)</option>
          </select>
          <button id="magicColorApply" type="button" disabled>🎨 Usar esta cor</button>
        </div>
      </section>
      <section class="mood-theme-maker" aria-labelledby="themeMoodTitle">
        <h3 id="themeMoodTitle">🌈 Meu mundo, minhas cores!</h3>
        <p>Que tal dar um novo clima para a prateleira? Escolha as cores que combinam com seu dia!</p>
        <label for="themeMood">Qual o clima da sua prateleira?</label>
        <select id="themeMood"><option value="">💗 Original da Prateleira Mágica</option></select>
        <div id="themeMoodSwatches" class="theme-mood-swatches" aria-label="Prévia da paleta"></div>
        <button id="applyThemeAvatar" type="button">🎨 Pintar meu personagem com estas cores</button>
        <p class="theme-avatar-hint">Só cabelo, roupa, calça/shorts/saia e sapatos mudam. <strong>A cor da pele continua como você escolheu.</strong></p>
      </section>
      <section class="profile-backup" aria-label="Guardar e recuperar perfil">
        <h3>💾 Leve suas aventuras com você!</h3>
        <p>Guarde seu perfil para usar em outro celular ou computador. Ele leva seu personagem, seu nome, suas pelúcias e todas as medalhas!</p>
        <div class="profile-backup-actions">
          <button id="downloadProfile" type="button">↓ Exportar perfil</button>
          <button id="importProfile" type="button">↑ Importar perfil</button>
        </div>
        <input id="profileFile" type="file" accept=".svg,image/svg+xml" hidden aria-label="Escolher o perfil guardado">
        <p id="profileBackupStatus" class="profile-backup-status" role="status" aria-live="polite"></p>
      </section>
      <p class="settings-privacy">🔒 Seu nome e suas conquistas ficam guardados neste aparelho. Se compartilhar seu perfil, uma pessoa poderá ver essas informações.</p>
      <div class="settings-actions"><button id="clearProfile" type="button" class="settings-reset">🧹 Apagar meu perfil e começar de novo</button></div>
    </form>
    </div>`;

  const $ = (selector) => dialog.querySelector(selector);
  const nameInput = $('#childName');
  const pronunciationInput = $('#childPronunciation');
  const birthInput = $('#birthDate');
  const moodSelect = $('#themeMood');
  const defaultThemeColors = ['#493a55', '#fa7195', '#5879b9', '#625a89', '#fbe6f1'];
  if (colors) {
    for (const [id, label] of colors.moods) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      moodSelect.append(option);
    }
  }

  function drawThemePalette() {
    const palette = colors?.palette(draft.themeMood) || defaultThemeColors;
    $('#themeMoodSwatches').replaceChildren();
    for (const [index, color] of palette.entries()) {
      const dot = document.createElement('span');
      dot.style.backgroundColor = color;
      dot.title = colors?.name(color) || `Cor ${index + 1}`;
      dot.setAttribute('aria-label', `${dot.title}, ${color}`);
      $('#themeMoodSwatches').append(dot);
    }
    moodSelect.value = draft.themeMood;
  }

  let generatedColor = null;
  function refreshMagicColor() {
    const phrase = $('#magicColorWord').value.trim();
    generatedColor = colors?.hex(phrase) || null;
    $('#magicColorSwatch').style.background = generatedColor || 'repeating-linear-gradient(45deg,#f4e8f9 0 10px,#fff 10px 20px)';
    $('#magicColorName').textContent = generatedColor
      ? `${colors.name(generatedColor)} · ${generatedColor.toUpperCase()}`
      : 'Escreva para descobrir uma cor!';
    $('#magicColorHear').disabled = !generatedColor;
    $('#magicColorApply').disabled = !generatedColor;
  }

  // Load and render presets
  const presetsGrid = document.getElementById('avatarPresetsGrid');
  if (presetsGrid) {
    fetch('./assets/data/avatar-presets.json').then(r => r.json()).then(presets => {
      for (const preset of presets) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-style';
        btn.innerHTML = '<span class="style-preview"></span><span class="style-label"></span>';
        btn.querySelector('.style-label').textContent = preset.name;
        btn.querySelector('.style-preview').innerHTML = preferences.avatarSVG({
          ...preset.profile, ...presetParts[preset.sourceSvg]?.colors, sourceSvg: preset.sourceSvg
        });
        btn.addEventListener('click', () => {
          const matchingHair = hairStyles.find(([style]) => window.LivrinhoAvatarParts.hair[style]?.source === preset.sourceSvg)?.[0];
          const matchingOutfit = outfitStyles.find(([style]) => window.LivrinhoAvatarParts.outfit[style]?.source === preset.sourceSvg)?.[0];
          const next = preferences.clean({ ...preset.profile, ...presetParts[preset.sourceSvg]?.colors,
            sourceSvg: preset.sourceSvg, presetEdits: [],
            avatarStyle: matchingHair || 'short', outfitStyle: matchingOutfit || 'tee',
            gender: preset.gender, achievements: draft.achievements });
          fillDialog(next);
          saveChange();
          location.hash = '#personalizar';
          const status = document.getElementById('profileBackupStatus');
          if (status) status.textContent = `✨ Personagem "${preset.name}" aplicado!`;
        });
        presetsGrid.append(btn);
      }
    }).catch(()=>{});
  }

  narrator.subscribe((status) => {
    const previewButton = $('#hearPronunciation');
    if (!previewButton) return;
    const playing = status === 'playing';
    previewButton.setAttribute('aria-label', playing ? 'Parar teste de pronúncia' : 'Ouvir a pronúncia digitada');
    previewButton.setAttribute('aria-pressed', String(playing));
    previewButton.querySelector('span[aria-hidden]').textContent = playing ? '⏹' : '🔊';
    previewButton.querySelector('.pronunciation-preview-text').textContent = playing ? 'Parar' : 'Ouvir';
  });
  $('#hearPronunciation').addEventListener('click', () => {
    if (narrator.state() === 'playing') { narrator.stop(); return; }
    const value = pronunciationInput.value.trim() || nameInput.value.trim();
    if (!value) { pronunciationInput.focus(); return; }
    if (!narrator.play(value, { lang: 'pt-BR', rate: .78, pitch: 1.08 })) {
      $('#hearPronunciation').title = 'Este navegador não oferece leitura em voz alta.';
    }
  });
  window.addEventListener('hashchange', () => narrator.stop());

  function drawPreview() {
    $('#avatarStage').innerHTML = preferences.avatarSVG(draft);
    $('#previewName').textContent = nameInput.value.trim() || 'Meu personagem';
    const hero = document.getElementById('heroAvatar');
    if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
    const button = dialog.querySelector('#avatarStyles');
    for (const item of button.querySelectorAll('button')) {
      const selected = item.dataset.style === draft.avatarStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, avatarStyle: item.dataset.style,
        presetEdits: [...new Set([...(draft.presetEdits || []), 'avatarStyle'])] });
    }
    for (const item of $('#outfitStyles').querySelectorAll('button')) {
      const selected = item.dataset.style === draft.outfitStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, outfitStyle: item.dataset.style,
        presetEdits: [...new Set([...(draft.presetEdits || []), 'outfitStyle'])] });
    }
    for (const item of $('#bottomStyles').querySelectorAll('button')) {
      const selected = item.dataset.style === draft.bottomStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, bottomStyle: item.dataset.style });
    }
    if (document.getElementById('accessoryStyles')) {
      const accs = Array.isArray(draft.accessories) ? draft.accessories : [];
      for (const item of document.getElementById('accessoryStyles').querySelectorAll('button')) {
        const aid = item.dataset.accessory;
        const selected = accs.includes(aid);
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
        const thumb = item.querySelector('.style-preview');
        if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, accessories: selected
          ? accs : [...accs.filter((id) => accessoryGroups[id] !== accessoryGroups[aid]), aid] });
      }
    }
    for (const [containerId, key] of [['skinOptions', 'skinColor'], ['hairColorOptions', 'hairColor'],
      ['outfitColorOptions', 'outfitColor'], ['bottomColorOptions', 'bottomColor'], ['shoeColorOptions', 'shoeColor']]) {
      for (const swatch of $(`#${containerId}`).querySelectorAll('button')) {
        const selected = swatch.dataset.color === draft[key];
        swatch.classList.toggle('selected', selected);
        swatch.setAttribute('aria-pressed', String(selected));
      }
    }
    $('#customSkinColor').value = draft.skinColor;
    $('#customHairColor').value = draft.hairColor;
    $('#customOutfitColor').value = draft.outfitColor;
    $('#customBottomColor').value = draft.bottomColor;
    $('#customShoeColor').value = draft.shoeColor;
    drawThemePalette();
    const medals = preferences.medalCount(draft);
    const unlocked = medals >= 2;
    $('#petUnlockStatus').textContent = unlocked
      ? `✨ Você conquistou ${medals} medalhas! Escolha uma das 20 pelúcias para acompanhar suas aventuras.`
      : `🔒 Pelúcias desbloqueadas com 2 medalhas. Você tem ${medals}/2 — faltam ${2 - medals}.`;
    for (const option of $('#petStyles').querySelectorAll('button[data-pet]')) {
      option.disabled = !unlocked;
      option.classList.toggle('locked', !unlocked);
      option.classList.toggle('selected', draft.petId === option.dataset.pet);
      option.setAttribute('aria-pressed', String(draft.petId === option.dataset.pet));
    }
    const none = $('#noPet');
    none.classList.toggle('selected', !draft.petId);
    none.setAttribute('aria-pressed', String(!draft.petId));
    const years = preferences.ageOnDate(birthInput.value);
    $('#birthAgeHint').textContent = years === null
      ? 'Opcional. A idade pode personalizar os próximos livros.'
      : `🎂 ${years} ano${years === 1 ? '' : 's'} — pronta ou pronto para muitas aventuras!`;
  }

  function fillDialog(state = preferences.load()) {
    draft = preferences.clean(state);
    pronunciationTouched = false;
    nameInput.value = draft.name;
    pronunciationInput.value = draft.pronunciation;
    birthInput.value = draft.birthDate;
    refreshMagicColor();
    $(`input[name="childGender"][value="${draft.gender}"]`).checked = true;
    drawPreview();
  }

  // Cada mudança é guardada de imediato. O histórico existe somente durante
  // esta visita à página; digitação/arraste contínuos formam um único passo.
  function refreshHistory() {
    $('#undoSettings').disabled = undoHistory.length === 0;
    $('#autoSaveStatus').textContent = '✓ Tudo guardado!';
  }
  function currentDraft() {
    return preferences.clean({ ...draft, name: nameInput.value,
      pronunciation: pronunciationInput.value || nameInput.value, birthDate: birthInput.value });
  }
  function saveChange(group = '', redraw = true) {
    const next = currentDraft();
    if (JSON.stringify(next) === JSON.stringify(lastSaved)) {
      if (redraw) drawPreview();
      return;
    }
    const now = Date.now();
    const sameEdit = Boolean(group && group === lastEditGroup && now - lastEditAt < 900 && undoHistory.length);
    if (!sameEdit) {
      undoHistory.push(lastSaved);
    }
    lastSaved = preferences.save(next);
    // Nunca compartilhe a mesma referência: o próximo clique altera `draft`
    // antes de compará-lo com a última versão guardada.
    draft = preferences.clean(lastSaved);
    lastEditGroup = group;
    lastEditAt = now;
    if (redraw) drawPreview();
    refreshHistory();
  }

  $('#undoSettings').addEventListener('click', () => {
    if (!undoHistory.length) return;
    const previous = undoHistory.pop();
    lastEditGroup = '';
    lastSaved = preferences.save(previous);
    fillDialog(lastSaved);
    refreshHistory();
    $('#profileBackupStatus').textContent = '↶ Voltamos à escolha anterior!';
  });
  function edit(group, change, redraw = true) {
    change();
    saveChange(group, redraw);
  }
  function markPresetEdit(field) {
    if (!draft.sourceSvg) return;
    draft.presetEdits = [...new Set([...(draft.presetEdits || []), field])];
  }

  function addStyles(containerId, entries, field) {
    const container = $(`#${containerId}`);
    for (const [style, label] of entries) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-style';
      button.dataset.style = style;
      button.setAttribute('aria-label', label);
      button.innerHTML = '<span class="style-preview"></span><span class="style-label"></span>';
      button.querySelector('.style-label').textContent = label;
      button.addEventListener('click', () => edit('', () => {
        if (field !== 'bottomStyle') markPresetEdit(field);
        draft[field] = style;
      }));
      container.append(button);
    }
  }
  addStyles('avatarStyles', hairStyles, 'avatarStyle');
  addStyles('outfitStyles', outfitStyles, 'outfitStyle');
  addStyles('bottomStyles', bottomStyles, 'bottomStyle');
  
  // Accessories
  const accContainer = document.getElementById('accessoryStyles');
  if (accContainer && accessoryStyles.length) {
    for (const [accId, accLabel, accType] of accessoryStyles) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-style';
      button.dataset.accessory = accId;
      button.setAttribute('aria-label', accLabel);
      button.innerHTML = '<span class="style-preview"></span><span class="style-label"></span>';
      button.querySelector('.style-label').textContent = accLabel;
      button.addEventListener('click', () => {
        if (!draft.accessories) draft.accessories = [];
        const idx = draft.accessories.indexOf(accId);
        if (idx >= 0) {
          draft.accessories.splice(idx, 1);
        } else {
          draft.accessories = draft.accessories.filter((id) => accessoryGroups[id] !== accType);
          draft.accessories.push(accId);
        }
        saveChange('accessories');
      });
      accContainer.append(button);
    }
  }

  function addPets() {
    const container = $('#petStyles');
    const none = document.createElement('button');
    none.type = 'button';
    none.id = 'noPet';
    none.className = 'pet-choice';
    none.innerHTML = '<span class="pet-image pet-none">💜</span><span>Sem pelúcia</span>';
    none.addEventListener('click', () => edit('', () => { draft.petId = null; }));
    container.append(none);
    for (const [id, name, source] of petStyles) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'pet-choice';
      option.dataset.pet = id;
      const img = document.createElement('img');
      img.src = new URL(source, root).href;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'pet-image';
      const caption = document.createElement('span');
      caption.textContent = name;
      option.append(img, caption);
      option.addEventListener('click', () => {
        if (preferences.medalCount(draft) < 2) return;
        edit('', () => { draft.petId = id; });
      });
      container.append(option);
    }
  }
  addPets();

  function addColors(containerId, palette, field) {
    const container = $(`#${containerId}`);
    for (const [color, label] of palette) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'skin-swatch';
      button.dataset.color = color;
      button.title = label;
      button.setAttribute('aria-label', label);
      button.style.backgroundColor = color;
      button.addEventListener('click', () => edit('', () => {
        if (['skinColor', 'hairColor', 'outfitColor'].includes(field)) markPresetEdit(field);
        draft[field] = color;
      }));
      container.append(button);
    }
  }
  addColors('skinOptions', skinColors, 'skinColor');
  addColors('hairColorOptions', avatarCatalog.hairColors, 'hairColor');
  addColors('outfitColorOptions', avatarCatalog.outfitColors, 'outfitColor');
  addColors('bottomColorOptions', avatarCatalog.bottomColors, 'bottomColor');
  addColors('shoeColorOptions', avatarCatalog.shoeColors, 'shoeColor');

  $('#magicColorWord').addEventListener('input', refreshMagicColor);
  $('#magicColorHear').addEventListener('click', () => {
    if (generatedColor) narrator?.play(`Esta cor se chama ${colors.name(generatedColor)}.`, { lang: 'pt-BR', rate: .78, pitch: 1.08 });
  });
  $('#magicColorApply').addEventListener('click', () => {
    if (!generatedColor) return;
    const target = $('#magicColorTarget').value;
    if (!['skinColor', 'hairColor', 'outfitColor', 'bottomColor', 'shoeColor'].includes(target)) return;
    edit('', () => {
      if (['skinColor', 'hairColor', 'outfitColor'].includes(target)) markPresetEdit(target);
      draft[target] = generatedColor;
    });
  });
  moodSelect.addEventListener('change', () => {
    edit('', () => { draft.themeMood = moodSelect.value; });
  });
  $('#applyThemeAvatar').addEventListener('click', () => {
    const palette = colors?.palette(draft.themeMood) || defaultThemeColors;
    edit('', () => {
      markPresetEdit('hairColor');
      markPresetEdit('outfitColor');
      [draft.hairColor, draft.outfitColor, draft.bottomColor, draft.shoeColor] = palette.slice(0, 4);
    });
  });

  fillDialog();
  refreshHistory();
  nameInput.addEventListener('input', () => {
    edit('name', () => {
      draft.name = nameInput.value;
      if (!pronunciationTouched) {
        pronunciationInput.value = nameInput.value;
        draft.pronunciation = nameInput.value;
      }
      $('#previewName').textContent = nameInput.value.trim() || 'Meu personagem';
    }, false);
  });
  pronunciationInput.addEventListener('input', () => {
    edit('pronunciation', () => {
      pronunciationTouched = true;
      draft.pronunciation = pronunciationInput.value;
    }, false);
  });
  birthInput.addEventListener('change', () => edit('', () => { draft.birthDate = birthInput.value; }));
  for (const option of dialog.querySelectorAll('input[name="childGender"]')) {
    option.addEventListener('change', () => edit('', () => { draft.gender = option.value; }));
  }
  for (const [inputId, field] of [['customSkinColor', 'skinColor'], ['customHairColor', 'hairColor'],
    ['customOutfitColor', 'outfitColor'], ['customBottomColor', 'bottomColor'], ['customShoeColor', 'shoeColor']]) {
    $(`#${inputId}`).addEventListener('input', (event) => edit(field, () => {
      if (['skinColor', 'hairColor', 'outfitColor'].includes(field)) markPresetEdit(field);
      draft[field] = event.target.value;
    }));
  }
  $('#clearProfile').addEventListener('click', () => {
    const warning = 'Tem certeza de que quer começar de novo? Seu personagem, seus livros lidos e todas as medalhas serão apagados deste aparelho. Se quiser guardar uma cópia, use “Exportar perfil” primeiro.\n\nVocê ainda poderá tocar em “Desfazer” antes de sair desta página.';
    if (!window.confirm(warning)) return;
    fillDialog(preferences.DEFAULTS);
    saveChange();
    $('#profileBackupStatus').textContent = '🌱 Começamos de novo! Suas histórias e medalhas foram zeradas.';
  });

  $('#downloadProfile').addEventListener('click', () => {
    try {
      const saved = preferences.load();
      const svg = preferences.exportProfileSVG(saved);
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const link = document.createElement('a');
      const slug = saved.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'crianca';
      link.download = `prateleira-magica-${slug}.svg`;
      link.href = url;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('#profileBackupStatus').textContent = 'Prontinho! Seu personagem e suas conquistas estão guardados. 🌟';
    } catch (error) {
      $('#profileBackupStatus').textContent = `Não foi possível baixar o perfil: ${error.message}`;
    }
  });

  $('#importProfile').addEventListener('click', () => $('#profileFile').click());
  $('#profileFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith('.svg') || file.size > 1_000_000) {
        throw Error('Escolha um perfil exportado pela Prateleira Mágica.');
      }
      const imported = preferences.parseProfileSVG(await file.text());
      const message = `Trazer o perfil de ${imported.name}? O personagem e as medalhas atuais serão substituídos neste aparelho.`;
      if (!window.confirm(message)) {
        $('#profileBackupStatus').textContent = 'Importação cancelada. Seu personagem não foi alterado.';
        return;
      }
      fillDialog(imported);
      saveChange();
      $('#profileBackupStatus').textContent = `🌟 Oi, ${imported.name}! Seu personagem e suas medalhas voltaram!`;
    } catch (error) {
      $('#profileBackupStatus').textContent = `Não foi possível importar: ${error.message}`;
    } finally {
      event.target.value = '';
    }
  });
  $('.preferences-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveChange();
  });

})();
