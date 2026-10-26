(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  const avatarCatalog = window.LivrinhoAvatar;
  if (!preferences || !avatarCatalog) return;
  const skinColors = [
    ['#f5d4b3', 'Pele clara'], ['#e9aa83', 'Pele média clara'],
    ['#c98760', 'Pele média'], ['#a66846', 'Pele bronzeada'],
    ['#75472f', 'Pele escura'], ['#4a2c28', 'Pele muito escura'],
    ['#83dca5', 'Verde fantasia'], ['#8bcfff', 'Azul fantasia'],
    ['#c1a4ff', 'Lilás fantasia'], ['#ffb7d4', 'Rosa fantasia']
  ];
  const hairStyles = avatarCatalog.hairStyles;
  const outfitStyles = avatarCatalog.outfitStyles;
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
      <p class="settings-intro">Monte seu personagem combinando cabelos, roupas e cores. Ele aparecerá nas ilustrações de todos os livros!</p>
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
      <fieldset class="avatar-style-fieldset"><legend>Penteado</legend><div id="avatarStyles" class="avatar-style-grid"></div></fieldset>
      <fieldset class="avatar-style-fieldset"><legend>Roupa</legend><div id="outfitStyles" class="avatar-style-grid outfits-grid"></div></fieldset>
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
      <section class="profile-backup" aria-label="Backup do personagem">
        <h3>💾 Guarde seu personagem</h3>
        <p>Baixe o personagem como uma imagem SVG. Ela também guarda o nome, a pronúncia, os pronomes e as conquistas dos livros para recuperar tudo depois.</p>
        <div class="profile-backup-actions">
          <button id="downloadProfile" type="button">↓ Baixar personagem SVG</button>
          <button id="importProfile" type="button">↑ Importar personagem SVG</button>
        </div>
        <input id="profileFile" type="file" accept=".svg,image/svg+xml" hidden aria-label="Selecionar backup SVG da criança">
        <p id="profileBackupStatus" class="profile-backup-status" role="status" aria-live="polite"></p>
      </section>
      <p class="settings-privacy">🔒 Os dados são locais. Atenção: o arquivo SVG exportado contém o nome e o progresso da criança; compartilhe-o com cuidado.</p>
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
    for (const item of $('#outfitStyles').querySelectorAll('button')) {
      const selected = item.dataset.style === draft.outfitStyle;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      const thumb = item.querySelector('.style-preview');
      if (thumb) thumb.innerHTML = preferences.avatarSVG({ ...draft, outfitStyle: item.dataset.style });
    }
    for (const [containerId, key] of [['skinOptions', 'skinColor'], ['hairColorOptions', 'hairColor'], ['outfitColorOptions', 'outfitColor']]) {
      for (const swatch of $(`#${containerId}`).querySelectorAll('button')) {
        const selected = swatch.dataset.color === draft[key];
        swatch.classList.toggle('selected', selected);
        swatch.setAttribute('aria-pressed', String(selected));
      }
    }
    $('#customSkinColor').value = draft.skinColor;
    $('#customHairColor').value = draft.hairColor;
    $('#customOutfitColor').value = draft.outfitColor;
  }

  function fillDialog() {
    draft = preferences.load();
    pronunciationTouched = false;
    $('#profileBackupStatus').textContent = '';
    nameInput.value = draft.name;
    pronunciationInput.value = draft.pronunciation;
    $(`input[name="childGender"][value="${draft.gender}"]`).checked = true;
    drawPreview();
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
      button.addEventListener('click', () => { draft[field] = style; drawPreview(); });
      container.append(button);
    }
  }
  addStyles('avatarStyles', hairStyles, 'avatarStyle');
  addStyles('outfitStyles', outfitStyles, 'outfitStyle');

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
      button.addEventListener('click', () => { draft[field] = color; drawPreview(); });
      container.append(button);
    }
  }
  addColors('skinOptions', skinColors, 'skinColor');
  addColors('hairColorOptions', avatarCatalog.hairColors, 'hairColor');
  addColors('outfitColorOptions', avatarCatalog.outfitColors, 'outfitColor');

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
  $('#customHairColor').addEventListener('input', (event) => { draft.hairColor = event.target.value; drawPreview(); });
  $('#customOutfitColor').addEventListener('input', (event) => { draft.outfitColor = event.target.value; drawPreview(); });
  $('#resetSettings').addEventListener('click', () => {
    draft = { ...preferences.DEFAULTS, achievements: draft.achievements };
    pronunciationTouched = false;
    nameInput.value = draft.name;
    pronunciationInput.value = draft.pronunciation;
    $(`input[name="childGender"][value="${draft.gender}"]`).checked = true;
    drawPreview();
  });
  function currentDraft() {
    return preferences.clean({ ...draft, name: nameInput.value, pronunciation: pronunciationInput.value || nameInput.value });
  }

  $('#downloadProfile').addEventListener('click', () => {
    try {
      const saved = preferences.save(currentDraft());
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
      draft = saved;
      $('#profileBackupStatus').textContent = 'Prontinho! Seu SVG inclui o personagem e as conquistas atuais.';
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
        throw Error('Escolha um SVG de perfil com até 1 MB.');
      }
      const imported = preferences.parseProfileSVG(await file.text());
      const message = `Importar o perfil de ${imported.name}? Isso substituirá o personagem e as conquistas guardadas neste navegador.`;
      if (!window.confirm(message)) {
        $('#profileBackupStatus').textContent = 'Importação cancelada. Seu personagem não foi alterado.';
        return;
      }
      preferences.save(imported);
      fillDialog();
      $('#profileBackupStatus').textContent = `Perfil de ${imported.name} restaurado! Nome, voz, avatar e conquistas recuperados.`;
    } catch (error) {
      $('#profileBackupStatus').textContent = `Não foi possível importar: ${error.message}`;
    } finally {
      event.target.value = '';
    }
  });
  $('.preferences-form').addEventListener('submit', (event) => {
    event.preventDefault();
    preferences.save(currentDraft());
    dialog.close();
  });

  // Also show the saved character immediately when the shelf opens.
  const hero = document.getElementById('heroAvatar');
  if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
  document.addEventListener('livrinhos:protagonist-changed', () => {
    if (hero) hero.innerHTML = preferences.avatarSVG(preferences.load());
  });
})();
