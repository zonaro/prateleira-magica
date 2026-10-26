(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  if (!preferences) return;
  const skinColors = [
    ['#f5d4b3', 'Pele clara'], ['#e9aa83', 'Pele média clara'],
    ['#c98760', 'Pele média'], ['#a66846', 'Pele bronzeada'],
    ['#75472f', 'Pele escura'], ['#4a2c28', 'Pele muito escura'],
    ['#83dca5', 'Verde fantasia'], ['#8bcfff', 'Azul fantasia'],
    ['#c1a4ff', 'Lilás fantasia'], ['#ffb7d4', 'Rosa fantasia']
  ];
  const hairStyles = [
    ['puffs', 'Coquinhos'], ['short', 'Curto'], ['long', 'Longo'],
    ['curly', 'Cacheado'], ['cap', 'Boné']
  ];
  let draft = preferences.load();
  let pronunciationTouched = false;

  const dialog = document.createElement('dialog');
  dialog.id = 'protagonistDialog';
  dialog.className = 'protagonist-dialog';
  dialog.setAttribute('aria-labelledby', 'settingsTitle');
  dialog.innerHTML = `
    <form class="preferences-form" method="dialog">
      <div class="preferences-heading">
        <div><div class="section-kicker">NOSSA ESTRELA</div><h2 id="settingsTitle">Personalizar protagonista ✨</h2></div>
        <button type="button" class="settings-close" id="closeSettings" aria-label="Fechar configurações">✕</button>
      </div>
      <p class="settings-intro">Monte seu personagem e veja seu nome aparecer dentro das histórias.</p>
      <div class="preferences-content">
        <div class="avatar-editor"><div class="avatar-stage" id="avatarStage"></div><span>Meu personagem</span></div>
        <div class="preferences-fields">
          <label class="field-label" for="childName">Nome da criança</label>
          <input id="childName" name="childName" type="text" maxlength="32" autocomplete="off" placeholder="Ex.: Ellie" required>
          <label class="field-label" for="childPronunciation">Como a voz deve pronunciar o nome?</label>
          <input id="childPronunciation" name="childPronunciation" type="text" maxlength="64" autocomplete="off" placeholder="Ex.: Éli">
          <p class="field-help">Escreva como se fala, com acentos se ajudar. Ex.: Ellie → Éli.</p>
          <fieldset class="gender-fieldset"><legend>Gênero e pronomes</legend>
            <label><input type="radio" name="childGender" value="masculino"><span>Masculino<small>ele / dele</small></span></label>
            <label><input type="radio" name="childGender" value="feminino"><span>Feminino<small>ela / dela</small></span></label>
            <label><input type="radio" name="childGender" value="neutro"><span>Neutro<small>elu / delu</small></span></label>
          </fieldset>
        </div>
      </div>
      <fieldset class="avatar-style-fieldset"><legend>Estilo do avatar</legend><div id="avatarStyles" class="avatar-style-grid"></div></fieldset>
      <fieldset class="skin-fieldset"><legend>Cor da pele — natural ou fantasia</legend><div id="skinOptions" class="skin-options"></div>
        <label class="custom-color"><span>Ou escolha qualquer cor</span><input id="customSkinColor" type="color" aria-label="Selecionar outra cor de pele"></label>
      </fieldset>
      <p class="settings-privacy">🔒 Essas escolhas ficam salvas somente neste navegador.</p>
      <div class="settings-actions"><button id="resetSettings" type="button" class="settings-reset">Restaurar padrão</button><button type="submit" class="settings-save">Salvar personagem <span aria-hidden="true">✓</span></button></div>
    </form>`;
  document.body.append(dialog);

  const $ = (selector) => dialog.querySelector(selector);
  const nameInput = $('#childName');
  const pronunciationInput = $('#childPronunciation');

  function drawPreview() {
    $('#avatarStage').innerHTML = preferences.avatarSVG(draft);
    const hero = document.getElementById('heroAvatar');
    if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
    const button = dialog.querySelector('#avatarStyles');
    for (const item of button.querySelectorAll('button')) {
      const selected = item.dataset.style === draft.avatarStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, avatarStyle: item.dataset.style });
    }
    for (const swatch of $('#skinOptions').querySelectorAll('button')) {
      swatch.classList.toggle('selected', swatch.dataset.color === draft.skinColor);
      swatch.setAttribute('aria-pressed', String(swatch.dataset.color === draft.skinColor));
    }
    $('#customSkinColor').value = draft.skinColor;
  }

  function fillDialog() {
    draft = preferences.load();
    pronunciationTouched = false;
    nameInput.value = draft.name;
    pronunciationInput.value = draft.pronunciation;
    $(`input[name="childGender"][value="${draft.gender}"]`).checked = true;
    drawPreview();
  }

  const stylesContainer = $('#avatarStyles');
  for (const [style, label] of hairStyles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'avatar-style';
    button.dataset.style = style;
    button.innerHTML = '<span class="style-preview"></span><span class="style-label"></span>';
    button.querySelector('.style-label').textContent = label;
    button.addEventListener('click', () => { draft.avatarStyle = style; drawPreview(); });
    stylesContainer.append(button);
  }
  const skinContainer = $('#skinOptions');
  for (const [color, label] of skinColors) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skin-swatch';
    button.dataset.color = color;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.style.backgroundColor = color;
    button.addEventListener('click', () => { draft.skinColor = color; drawPreview(); });
    skinContainer.append(button);
  }

  for (const button of document.querySelectorAll('[data-open-settings]')) {
    button.addEventListener('click', () => { fillDialog(); dialog.showModal(); });
  }
  $('#closeSettings').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  nameInput.addEventListener('input', () => {
    draft.name = nameInput.value;
    if (!pronunciationTouched) {
      pronunciationInput.value = nameInput.value;
      draft.pronunciation = nameInput.value;
    }
  });
  pronunciationInput.addEventListener('input', () => {
    pronunciationTouched = true;
    draft.pronunciation = pronunciationInput.value;
  });
  for (const option of dialog.querySelectorAll('input[name="childGender"]')) {
    option.addEventListener('change', () => { draft.gender = option.value; drawPreview(); });
  }
  $('#customSkinColor').addEventListener('input', (event) => { draft.skinColor = event.target.value; drawPreview(); });
  $('#resetSettings').addEventListener('click', () => {
    draft = { ...preferences.DEFAULTS };
    pronunciationTouched = false;
    nameInput.value = draft.name;
    pronunciationInput.value = draft.pronunciation;
    $(`input[name="childGender"][value="${draft.gender}"]`).checked = true;
    drawPreview();
  });
  $('.preferences-form').addEventListener('submit', (event) => {
    event.preventDefault();
    draft.name = nameInput.value;
    draft.pronunciation = pronunciationInput.value || nameInput.value;
    preferences.save(draft);
    dialog.close();
  });

  // Also show the saved character immediately when the shelf opens.
  const hero = document.getElementById('heroAvatar');
  if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
  document.addEventListener('livrinhos:protagonist-changed', () => {
    if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
  });
})();
