(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  const avatarCatalog = window.LivrinhoAvatar;
  const avatarPhoto = window.LivrinhoAvatarPhoto;
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
  const footwearStyles = avatarCatalog.footwearStyles;
  const sockPatterns = avatarCatalog.sockPatterns;
  const petStyles = avatarCatalog.petStyles;
  const accessoryStyles = avatarCatalog.accessoryStyles || [];
  const accessoryGroups = Object.fromEntries(accessoryStyles.map(([id, , group]) => [id, group]));
  const toyStyles = avatarCatalog.toyStyles || [];
  const toyGroups = Object.fromEntries(toyStyles.map(([id, , group]) => [id, group]));
  const presetParts = window.LivrinhoAvatarPresetParts || {};
  let draft = preferences.load();
  let lastSaved = preferences.clean(draft);
  const undoHistory = [];
  let lastEditGroup = '';
  let lastEditAt = 0;

  // Mesmos controles em todas as partes coloríveis. As palavras geram a cor
  // localmente com NameToColor; apenas o HEX escolhido é salvo no perfil.
  const colorPickers = [
    ['customSkinColor', 'skinColor', 'cor da pele'],
    ['customHairColor', 'hairColor', 'cor do cabelo'],
    ['customOutfitColor', 'outfitColor', 'cor da roupa'],
    ['customAccessoryColor', 'accessoryColor', 'cor dos acessórios'],
    ['customToyColor', 'toyColor', 'cor dos brinquedos'],
    ['customWaterColor', 'waterColor', 'cor do líquido da garrafinha'],
    ['customBottomColor', 'bottomColor', 'cor da calça, shorts ou saia'],
    ['customShoeColor', 'shoeColor', 'cor dos sapatos, chinelos ou meias']
  ];
  const colorPicker = (id, label, accessibleName) => `<div class="custom-color-row">
    <label class="custom-color"><span>${label}</span><input id="${id}" type="color" aria-label="Selecionar ${accessibleName}"></label>
    <div class="color-word-tools">
      <label class="visually-hidden" for="${id}Word">Inventar ${accessibleName} com palavras</label>
      <input id="${id}Word" class="color-word-input" type="text" maxlength="120" autocomplete="off"
        placeholder="✨ Invente uma cor..." aria-label="Inventar ${accessibleName} com palavras">
      <button id="${id}Hear" class="color-word-hear" type="button" aria-label="Ouvir o nome da ${accessibleName}" disabled>🔊 Ouvir</button>
    </div>
    <output id="${id}Name" class="color-word-name" aria-live="polite"></output>
  </div>`;

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
      <fieldset class="avatar-style-fieldset"><legend>Penteado</legend><div id="avatarStyles" class="avatar-style-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Roupa</legend><div id="outfitStyles" class="avatar-style-grid outfits-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Parte de baixo</legend><div id="bottomStyles" class="avatar-style-grid bottoms-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Nos pés 👣</legend><div id="footwearStyles" class="avatar-style-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset" id="sockPatternFieldset"><legend>Minhas meias</legend><div id="sockPatterns" class="avatar-style-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Acessórios ✨</legend>
        <p class="settings-intro" style="margin-bottom:8px;">Escolha acessórios para seu personagem. Alguns usam o mesmo lugar e não podem ser usados juntos. A boina especial aparece depois de 3 medalhas! 🏅</p>
        <div id="accessoryStyles" class="avatar-style-grid"></div>
      </fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Brinquedos 🪀</legend>
        <p class="settings-intro" style="margin-bottom:8px;">Escolha algo para segurar, asas, bambolê ou um skate! Alguns presentes aparecem após concluir os livros. 🏅 Bola de monstrinho: 2 medalhas; skate: 4 medalhas. 🪀 Ioiô: volte uma página!</p>
        <div id="toyStyles" class="avatar-style-grid"></div>
      </fieldset>
      ${colorPicker('customWaterColor', '💧 Cor do líquido da garrafinha', 'cor do líquido da garrafinha')}
      <fieldset class="avatar-style-fieldset pet-fieldset"><legend>Minha pelúcia companheira 🧸</legend>
        <p id="petUnlockStatus" class="pet-unlock-status" role="status"></p>
        <div id="petStyles" class="pet-style-grid"></div>
      </fieldset>
      <fieldset class="skin-fieldset"><legend>Cor da pele — natural ou fantasia</legend><div id="skinOptions" class="skin-options"></div>
        ${colorPicker('customSkinColor', 'Ou escolha qualquer cor', 'cor da pele')}
      </fieldset>
      <div class="avatar-color-fields">
        <fieldset class="skin-fieldset"><legend>Cor do cabelo</legend><div id="hairColorOptions" class="skin-options"></div>
          ${colorPicker('customHairColor', 'Outra cor', 'cor do cabelo')}
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor da roupa</legend><div id="outfitColorOptions" class="skin-options"></div>
          ${colorPicker('customOutfitColor', 'Outra cor', 'cor da roupa')}
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor dos acessórios</legend><div id="accessoryColorOptions" class="skin-options"></div>
          ${colorPicker('customAccessoryColor', 'Outra cor', 'cor dos acessórios')}
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor dos brinquedos</legend><div id="toyColorOptions" class="skin-options"></div>
          ${colorPicker('customToyColor', 'Outra cor', 'cor dos brinquedos')}
        </fieldset>
      </div>
      <div class="avatar-color-fields">
        <fieldset class="skin-fieldset"><legend>Cor da calça, shorts ou saia</legend><div id="bottomColorOptions" class="skin-options"></div>
          ${colorPicker('customBottomColor', 'Outra cor', 'cor da calça, shorts ou saia')}
        </fieldset>
        <fieldset class="skin-fieldset"><legend>Cor dos sapatos, chinelos ou meias</legend><div id="shoeColorOptions" class="skin-options"></div>
          ${colorPicker('customShoeColor', 'Outra cor', 'cor dos sapatos, chinelos ou meias')}
        </fieldset>
      </div>
      <section class="mood-theme-maker" aria-labelledby="themeMoodTitle">
        <h3 id="themeMoodTitle">🌈 Meu mundo, minhas cores!</h3>
        <p>Que tal dar um novo clima para a prateleira? Escolha as cores que combinam com seu dia!</p>
        <label for="themeMood">Qual o clima da sua prateleira?</label>
        <select id="themeMood"><option value="">💗 Original da Prateleira Mágica</option></select>
        <div id="themeMoodSwatches" class="theme-mood-swatches" aria-label="Prévia da paleta"></div>
        <button id="applyThemeAvatar" type="button">🎨 Pintar meu personagem com estas cores</button>
        <p class="theme-avatar-hint">Só cabelo, roupa, calça/shorts/saia e sapatos mudam. <strong>A cor da pele continua como você escolheu.</strong></p>
      </section>
      <p class="settings-privacy">🔒 Nome, gênero, nascimento, pronúncia e backups são gerenciados na aba <a href="#pais">Configurações dos pais</a>.</p>
    </form>
    </div>`;

  const $ = (selector) => dialog.querySelector(selector);
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
          const renameDefault = draft.name === preferences.DEFAULTS.name;
          const next = preferences.clean({ ...draft, ...preset.profile, ...presetParts[preset.sourceSvg]?.colors,
            sourceSvg: preset.sourceSvg, presetEdits: [],
            avatarStyle: matchingHair || 'short', outfitStyle: matchingOutfit || 'tee',
            name: renameDefault ? preset.name : draft.name,
            pronunciation: renameDefault ? (preset.profile.pronunciation || preset.name) : draft.pronunciation,
            gender: renameDefault ? preset.gender : draft.gender,
            birthDate: draft.birthDate, achievements: draft.achievements });
          fillDialog(next);
          saveChange();
          location.hash = '#personalizar';
          $('#autoSaveStatus').textContent = `✨ Personagem "${preset.name}" aplicado!`;
        });
        presetsGrid.append(btn);
      }
    }).catch(()=>{});
  }

  window.addEventListener('hashchange', () => narrator?.stop());

  function drawPreview() {
    $('#avatarStage').innerHTML = preferences.avatarSVG(draft);
    $('#previewName').textContent = draft.name || 'Meu personagem';
    const hero = document.getElementById('heroAvatar');
    if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
    const button = dialog.querySelector('#avatarStyles');
    for (const item of button.querySelectorAll('button')) {
      const selected = item.dataset.style === draft.avatarStyle;
      const locked = !avatarCatalog.rewardUnlocked(draft, item.dataset.style);
      item.classList.toggle('selected', selected);
      item.classList.toggle('locked', locked);
      item.disabled = locked;
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) {
        const preview = { ...draft, avatarStyle: item.dataset.style,
          presetEdits: [...new Set([...(draft.presetEdits || []), 'avatarStyle'])] };
        thumb.innerHTML = locked ? avatarCatalog.avatarSVG(preview) : preferences.avatarSVG(preview);
      }
    }
    for (const item of $('#outfitStyles').querySelectorAll('button')) {
      const selected = item.dataset.style === draft.outfitStyle;
      const locked = !avatarCatalog.rewardUnlocked(draft, item.dataset.style);
      item.classList.toggle('selected', selected);
      item.classList.toggle('locked', locked);
      item.disabled = locked;
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) {
        const preview = { ...draft, outfitStyle: item.dataset.style,
          presetEdits: [...new Set([...(draft.presetEdits || []), 'outfitStyle'])] };
        thumb.innerHTML = locked ? avatarCatalog.avatarSVG(preview) : preferences.avatarSVG(preview);
      }
    }
    for (const item of $('#bottomStyles').querySelectorAll('button')) {
      const selected = item.dataset.style === draft.bottomStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, bottomStyle: item.dataset.style });
    }
    for (const [container, field] of [['#footwearStyles', 'footwearStyle'], ['#sockPatterns', 'sockPattern']]) {
      for (const item of $(container).querySelectorAll('button')) {
        const selected = item.dataset.style === draft[field];
        const locked = field === 'footwearStyle' && item.dataset.style === 'skates'
          && preferences.medalCount(draft) < 3;
        item.classList.toggle('selected', selected);
        item.classList.toggle('locked', locked);
        item.setAttribute('aria-pressed', String(selected));
        item.disabled = locked || field === 'sockPattern' && draft.footwearStyle !== 'socks';
        const thumb = item.querySelector('.style-preview');
        if (thumb) {
          const preview = { ...draft, [field]: item.dataset.style,
            ...(field === 'sockPattern' ? { footwearStyle: 'socks' } : {}) };
          thumb.innerHTML = locked ? avatarCatalog.avatarSVG(preview) : preferences.avatarSVG(preview);
        }
      }
    }
    $('#sockPatternFieldset').classList.toggle('locked', draft.footwearStyle !== 'socks');
    if (document.getElementById('accessoryStyles')) {
      const accs = Array.isArray(draft.accessories) ? draft.accessories : [];
      for (const item of document.getElementById('accessoryStyles').querySelectorAll('button')) {
        const aid = item.dataset.accessory;
        const selected = accs.includes(aid);
        const locked = !avatarCatalog.rewardUnlocked(draft, aid)
          || aid === 'plumber_beret' && preferences.medalCount(draft) < 3;
        item.disabled = locked;
        item.classList.toggle('locked', locked);
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
        const thumb = item.querySelector('.style-preview');
        if (thumb) {
          const preview = { ...draft, accessories: selected
            ? accs : [...accs.filter((id) => accessoryGroups[id] !== accessoryGroups[aid]), aid] };
          // Mostramos o prêmio bloqueado na miniatura sem permitir salvá-lo.
          thumb.innerHTML = locked ? avatarCatalog.avatarSVG(preview) : preferences.avatarSVG(preview);
        }
      }
    }
    const selectedToys = Array.isArray(draft.toys) ? draft.toys : [];
    for (const item of $('#toyStyles').querySelectorAll('button[data-toy]')) {
      const id = item.dataset.toy;
      const selected = selectedToys.includes(id);
      const locked = !avatarCatalog.rewardUnlocked(draft, id)
        || (id === 'skateboard' && preferences.medalCount(draft) < 4)
        || (id === 'yoyo' && !draft.achievements?.pageReturn);
      item.disabled = locked;
      item.classList.toggle('locked', locked);
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) {
        const preview = { ...draft, toys: selected
          ? selectedToys : [...selectedToys.filter(toy => toyGroups[toy] !== toyGroups[id]), id] };
        thumb.innerHTML = locked ? avatarCatalog.avatarSVG(preview) : preferences.avatarSVG(preview);
      }
    }
    for (const [containerId, key] of [['skinOptions', 'skinColor'], ['hairColorOptions', 'hairColor'],
      ['outfitColorOptions', 'outfitColor'], ['accessoryColorOptions', 'accessoryColor'], ['toyColorOptions', 'toyColor'],
      ['bottomColorOptions', 'bottomColor'], ['shoeColorOptions', 'shoeColor']]) {
      for (const swatch of $(`#${containerId}`).querySelectorAll('button')) {
        const selected = swatch.dataset.color === draft[key];
        swatch.classList.toggle('selected', selected);
        swatch.setAttribute('aria-pressed', String(selected));
      }
    }
    $('#customSkinColor').value = draft.skinColor;
    $('#customHairColor').value = draft.hairColor;
    $('#customOutfitColor').value = draft.outfitColor;
    $('#customAccessoryColor').value = draft.accessoryColor;
    $('#customToyColor').value = draft.toyColor;
    $('#customWaterColor').value = draft.waterColor;
    $('#customBottomColor').value = draft.bottomColor;
    $('#customShoeColor').value = draft.shoeColor;
    drawThemePalette();
    const medals = preferences.medalCount(draft);
    const unlocked = medals >= 2;
    const heartUnlocked = avatarCatalog.rewardUnlocked(draft, 'heart_plush');
    const sunUnlocked = avatarCatalog.rewardUnlocked(draft, 'sun_plush');
    $('#petUnlockStatus').textContent = (heartUnlocked || sunUnlocked) && !unlocked
      ? `💗🌞 Sua pelúcia exclusiva já está disponível! As 20 pelúcias comuns pedem 2 medalhas (${medals}/2).`
      : unlocked
      ? `✨ ${medals} medalhas! Escolha uma das 20 pelúcias comuns ou conquiste o coração e o sol em seus livros.`
      : `🔒 As 20 pelúcias comuns pedem 2 medalhas (${medals}/2). Coração e sol são exclusivos de seus livros.`;
    for (const option of $('#petStyles').querySelectorAll('button[data-pet]')) {
      const id = option.dataset.pet;
      const locked = avatarCatalog.rewardBooks[id] ? !avatarCatalog.rewardUnlocked(draft, id) : !unlocked;
      option.disabled = locked;
      option.classList.toggle('locked', locked);
      option.classList.toggle('selected', draft.petId === option.dataset.pet);
      option.setAttribute('aria-pressed', String(draft.petId === option.dataset.pet));
    }
    const none = $('#noPet');
    none.classList.toggle('selected', !draft.petId);
    none.setAttribute('aria-pressed', String(!draft.petId));
  }

  function fillDialog(state = preferences.load()) {
    draft = preferences.clean(state);
    // A palavra não faz parte do perfil: ao importar, desfazer ou trocar de
    // personagem, a cor persistida continua no seletor, sem frase antiga.
    for (const [id] of colorPickers) {
      $(`#${id}Word`).value = '';
      $(`#${id}Name`).textContent = '';
      $(`#${id}Hear`).disabled = true;
    }
    drawPreview();
  }

  // Cada mudança é guardada de imediato. O histórico existe somente durante
  // esta visita à página; digitação/arraste contínuos formam um único passo.
  function refreshHistory() {
    $('#undoSettings').disabled = undoHistory.length === 0;
    $('#autoSaveStatus').textContent = '✓ Tudo guardado!';
  }
  function currentDraft() {
    return preferences.clean(draft);
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
    $('#autoSaveStatus').textContent = '↶ Voltamos à escolha anterior!';
  });
  function edit(group, change, redraw = true) {
    change();
    saveChange(group, redraw);
  }
  function markPresetEdit(field) {
    if (!draft.sourceSvg) return;
    draft.presetEdits = [...new Set([...(draft.presetEdits || []), field])];
  }
  function clearColorWord(field) {
    const picker = colorPickers.find(([, key]) => key === field);
    if (!picker) return;
    const [id] = picker;
    $(`#${id}Word`).value = '';
    $(`#${id}Name`).textContent = '';
    $(`#${id}Hear`).disabled = true;
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
        if (!avatarCatalog.rewardUnlocked(draft, style)) return;
        if (field === 'footwearStyle' && style === 'skates' && preferences.medalCount(draft) < 3) return;
        if (field === 'avatarStyle' || field === 'outfitStyle') markPresetEdit(field);
        draft[field] = style;
      }));
      container.append(button);
    }
  }
  addStyles('avatarStyles', hairStyles, 'avatarStyle');
  addStyles('outfitStyles', outfitStyles, 'outfitStyle');
  addStyles('bottomStyles', bottomStyles, 'bottomStyle');
  addStyles('footwearStyles', footwearStyles, 'footwearStyle');
  addStyles('sockPatterns', sockPatterns, 'sockPattern');
  
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
        if (!avatarCatalog.rewardUnlocked(draft, accId)) return;
        if (accId === 'plumber_beret' && preferences.medalCount(draft) < 3) return;
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

  const toyContainer = $('#toyStyles');
  for (const [id, label, group] of toyStyles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'avatar-style';
    button.dataset.toy = id;
    button.setAttribute('aria-label', label);
    button.innerHTML = '<span class="style-preview"></span><span class="style-label"></span>';
    button.querySelector('.style-label').textContent = label;
    button.addEventListener('click', () => {
      if (!avatarCatalog.rewardUnlocked(draft, id)) return;
      if (id === 'skateboard' && preferences.medalCount(draft) < 4) return;
      if (id === 'yoyo' && !draft.achievements?.pageReturn) return;
      edit('toys', () => {
        const current = Array.isArray(draft.toys) ? draft.toys : [];
        draft.toys = current.includes(id) ? current.filter(toy => toy !== id)
          : [...current.filter(toy => toyGroups[toy] !== group), id];
      });
    });
    toyContainer.append(button);
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
        if (avatarCatalog.rewardBooks[id] ? !avatarCatalog.rewardUnlocked(draft, id) : preferences.medalCount(draft) < 2) return;
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
        clearColorWord(field);
        if (['skinColor', 'hairColor', 'outfitColor'].includes(field)) markPresetEdit(field);
        draft[field] = color;
      }));
      container.append(button);
    }
  }
  addColors('skinOptions', skinColors, 'skinColor');
  addColors('hairColorOptions', avatarCatalog.hairColors, 'hairColor');
  addColors('outfitColorOptions', avatarCatalog.outfitColors, 'outfitColor');
  addColors('accessoryColorOptions', avatarCatalog.accessoryColors, 'accessoryColor');
  addColors('toyColorOptions', avatarCatalog.toyColors, 'toyColor');
  addColors('bottomColorOptions', avatarCatalog.bottomColors, 'bottomColor');
  addColors('shoeColorOptions', avatarCatalog.shoeColors, 'shoeColor');

  for (const [id, field] of colorPickers) {
    const word = $(`#${id}Word`);
    const output = $(`#${id}Name`);
    const hear = $(`#${id}Hear`);
    word.addEventListener('input', () => {
      const generated = colors?.hex(word.value.trim());
      hear.disabled = !generated;
      output.textContent = generated ? `${colors.name(generated)} · ${generated.toUpperCase()}` : '';
      if (!generated) return; // Apagar a palavra não apaga a cor já escolhida.
      edit(field, () => {
        if (['skinColor', 'hairColor', 'outfitColor'].includes(field)) markPresetEdit(field);
        draft[field] = generated;
      });
    });
    word.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') event.preventDefault(); // Não envia o formulário.
    });
    hear.addEventListener('click', () => {
      const generated = colors?.hex(word.value.trim());
      if (!generated) return;
      narrator?.play(`Esta cor se chama ${colors.name(generated)}.`, { lang: 'pt-BR', rate: .78, pitch: 1.08 });
    });
  }
  moodSelect.addEventListener('change', () => {
    edit('', () => { draft.themeMood = moodSelect.value; });
  });
  $('#applyThemeAvatar').addEventListener('click', () => {
    const palette = colors?.palette(draft.themeMood) || defaultThemeColors;
    edit('', () => {
      markPresetEdit('hairColor');
      markPresetEdit('outfitColor');
      for (const field of ['hairColor', 'outfitColor', 'bottomColor', 'shoeColor']) clearColorWord(field);
      [draft.hairColor, draft.outfitColor, draft.bottomColor, draft.shoeColor] = palette.slice(0, 4);
    });
  });


  // A análise não salva a foto: só transfere campos reconhecidos para o draft.
  // Reaproveitar edit() garante undo, auto-save e refresh de todos os SVGs.
  // Photo changes are a real editor state transition, not a preview-only SVG.
  // Discard the chosen preset's original SVG layers: their geometry/colors no
  // longer match the modular options after changing several fields at once.
  avatarPhoto?.mount({
    onApply: (result) => {
      edit('avatar-photo', () => {
        delete draft.sourceSvg;
        delete draft.presetEdits;
        const next = {
          skinColor: result.skinColor,
          hairColor: result.hairColor,
          outfitColor: result.outfitColor,
          avatarStyle: result.avatarStyle
        };
        for (const [field, value] of Object.entries(next)) {
          if (value) draft[field] = value;
        }
        const current = Array.isArray(draft.accessories) ? draft.accessories : [];
        const selectedFace = current.find((id) => accessoryGroups[id] === 'face');
        // A mask / eye patch must never be silently replaced by glasses.
        if (result.glasses && !selectedFace) {
          draft.accessories = [...current, 'glasses_round'];
        }
        if (result.glasses && (!selectedFace || selectedFace.startsWith('glasses_'))
            && result.accessoryColor) {
          draft.accessoryColor = result.accessoryColor;
        }
      });
      // Synchronize all swatches, style buttons, color inputs, and preview
      // with the normalized state that autosave actually persisted.
      fillDialog(preferences.load());
      $('#autoSaveStatus').textContent = '✨ Foto aplicada! Confira as escolhas destacadas.';
      $('#autoSaveStatus').title = (result.warnings || []).join(' ');
    }
  });

  fillDialog();
  refreshHistory();
  window.addEventListener('hashchange', () => {
    if (location.hash !== '#personalizar') return;
    lastSaved = preferences.load();
    undoHistory.length = 0;
    fillDialog(lastSaved);
    refreshHistory();
  });
  for (const [id, field] of colorPickers) {
    $(`#${id}`).addEventListener('input', (event) => {
      clearColorWord(field);
      edit(field, () => {
        if (['skinColor', 'hairColor', 'outfitColor'].includes(field)) markPresetEdit(field);
        draft[field] = event.target.value;
      });
    });
  }
  $('.preferences-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveChange();
  });

})();
