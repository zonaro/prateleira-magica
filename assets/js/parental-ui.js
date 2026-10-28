(() => {
  'use strict';
  const preferences = window.LivrinhoPreferences;
  const parental = window.LivrinhoParental;
  if (!preferences || !parental) return;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const inParentSettings = () => location.pathname.endsWith('/perfil.html') && location.hash === '#pais';
  const counting = () => parental.shouldCount(location.pathname, location.hash);
  let authorized = false;
  let renderParentSettings = () => {};

  const toolbar = document.createElement('aside');
  toolbar.className = 'family-switcher';
  toolbar.setAttribute('aria-label', 'Escolher criança e conferir tempo de leitura');
  toolbar.innerHTML = `<button class="family-toggle" type="button" aria-expanded="false">👧 <span class="family-active-name"></span> · <span class="family-time"></span> ⌄</button>
    <div class="family-menu" hidden><strong>Quem vai ler agora?</strong><div class="family-children"></div>
      <a href="./perfil.html#pais">⚙️ Configurações dos pais</a></div>`;
  document.body.append(toolbar);
  const overlay = document.createElement('div');
  overlay.className = 'parental-blocker';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'parentalBlockTitle');
  overlay.innerHTML = `<div class="parental-block-card">
    <span class="parental-block-icon" aria-hidden="true">🌙</span>
    <h2 id="parentalBlockTitle">Hora de descansar!</h2>
    <p>Você já aproveitou seu tempo de leitura por hoje. Agora é hora de brincar, descansar ou conversar! 💛 Amanhã tem mais.</p>
    <label for="parentalUnlockPin">Responsável: digite a senha para liberar mais tempo.</label>
    <form class="parental-unlock-form"><input id="parentalUnlockPin" type="password" autocomplete="off" minlength="4" maxlength="64" placeholder="Senha dos pais" required>
      <button type="submit">Liberar tempo</button></form>
    <p class="parental-unlock-note" role="status" aria-live="polite"></p>
    <div class="parental-locked-profiles"><strong>Ou escolha outra criança:</strong><div class="parental-profile-choices"></div></div>
    <a href="./perfil.html#pais">⚙️ Área dos pais</a>
  </div>`;
  document.body.append(overlay);

  const showMinutes = (ms) => `${Math.ceil(ms / 60_000)} min`;
  const timeLabel = () => `${counting() ? '' : '⏸ '}${showMinutes(parental.remainingMs())}`;
  const profiles = () => preferences.family().profiles;
  function renderSelector() {
    const state = preferences.family();
    const current = state.profiles.find((entry) => entry.id === state.activeId);
    $('.family-active-name', toolbar).textContent = current?.profile.name || 'Você';
    $('.family-time', toolbar).textContent = timeLabel();
    const options = $('.family-children', toolbar);
    const blockedOptions = $('.parental-profile-choices', overlay);
    options.replaceChildren();
    blockedOptions.replaceChildren();
    for (const entry of state.profiles) {
      for (const target of [options, blockedOptions]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${entry.profile.name} · ${showMinutes(parental.remainingMs(entry.id))}`;
        button.disabled = entry.id === state.activeId || parental.locked(entry.id);
        if (entry.id === state.activeId) button.setAttribute('aria-current', 'true');
        button.addEventListener('click', () => {
          parental.pause();
          preferences.selectProfile(entry.id);
          location.reload();
        });
        target.append(button);
      }
    }
  }
  function showLock() {
    const blocked = parental.locked() && counting();
    if (overlay.hidden === blocked) {
      overlay.hidden = !blocked;
      document.body.classList.toggle('reading-time-expired', blocked);
      if (blocked) {
        $('.parental-unlock-form', overlay).hidden = !parental.hasPin();
        $('.parental-unlock-note', overlay).textContent = parental.hasPin()
          ? '' : 'Peça a um responsável para criar uma senha na Área dos pais.';
        renderSelector();
        $('#parentalUnlockPin', overlay)?.focus();
        window.LivrinhoSpeech?.stop();
      }
    }
  }
  const toggle = $('.family-toggle', toolbar);
  toggle.addEventListener('click', () => {
    const menu = $('.family-menu', toolbar);
    menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
    if (!menu.hidden) renderSelector();
  });
  $('.parental-unlock-form', overlay).addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('#parentalUnlockPin', overlay);
    const status = $('.parental-unlock-note', overlay);
    try {
      if (!await parental.verifyPin(input.value)) { status.textContent = 'Senha incorreta. Peça ajuda a um responsável.'; return; }
      parental.resetTime();
      input.value = '';
      status.textContent = '';
      renderSelector();
      showLock();
    } catch (error) { status.textContent = error.message; }
  });
  window.addEventListener('keydown', (event) => {
    if (!overlay.hidden && !overlay.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('hashchange', () => {
    if (!inParentSettings()) authorized = false;
    parental.pause();
    renderParentSettings();
    renderSelector();
    showLock();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) parental.pause(); });
  window.addEventListener('pagehide', () => parental.pause());
  window.addEventListener('storage', (event) => {
    if (event.key === 'prateleira-magica:familia:v1') location.reload();
    else { renderSelector(); showLock(); }
  });
  document.addEventListener('livrinhos:protagonist-changed', renderSelector);
  document.addEventListener('livrinhos:parental-changed', () => { renderSelector(); showLock(); });

  const parents = $('#profileParents');
  if (parents) {
    parents.innerHTML = `<div class="parent-settings-card">
      <div class="section-kicker">SOMENTE PARA RESPONSÁVEIS</div><h1>👨‍👩‍👧 Configurações dos pais</h1>
      <p>Gerencie cada criança separadamente. Nomes, datas, pronomes, tempo de tela e medalhas ficam guardados neste aparelho.</p>
      <div class="parent-gate" id="parentGate">
        <p>🔐 Digite sua senha para acessar as configurações dos pais.</p>
        <form id="parentAccessForm"><label for="parentAccessPin">Senha dos pais</label>
          <input id="parentAccessPin" type="password" autocomplete="off" maxlength="64" required>
          <button type="submit">Entrar</button></form><p id="parentGateStatus" role="status"></p>
      </div>
      <div id="parentControls" hidden>
        <p id="parentPinWarning" class="parent-warning">⚠️ Defina uma senha para impedir mudanças acidentais nas configurações e liberar tempo extra após o limite.</p>
        <div class="parent-children-header"><h2>👧 Perfis das crianças</h2><button id="parentAddChild" type="button">+ Adicionar criança</button></div>
        <div id="parentChildrenList" class="parent-children-list"></div>
        <form id="parentChildForm" class="parent-child-form">
          <h3>Dados da criança selecionada</h3>
          <label for="parentChildName">Nome da criança</label><input id="parentChildName" maxlength="32" required placeholder="Você">
          <label for="parentChildPronunciation">Pronúncia do nome na narração</label>
          <div class="pronunciation-input-row"><input id="parentChildPronunciation" maxlength="64" placeholder="Escreva como se fala"><button id="parentHearName" type="button">🔊 Ouvir</button></div>
          <label for="parentChildBirth">Data de nascimento (opcional)</label><input id="parentChildBirth" type="date">
          <label for="parentChildGender">Como os livros vão falar da criança?</label>
          <select id="parentChildGender"><option value="feminino">Feminino · ela/dela</option><option value="masculino">Masculino · ele/dele</option><option value="neutro">Neutro · elu/delu</option></select>
          <label for="parentChildMinutes">Limite de uso por dia (minutos)</label><input id="parentChildMinutes" type="number" min="5" max="480" step="1" required>
          <p class="field-help" id="parentTimeStatus"></p>
          <div class="parent-form-buttons"><button type="submit">💾 Salvar dados e limite</button><button id="parentResetChild" type="button">↻ Reiniciar tempo de hoje</button><button id="parentRemoveChild" type="button" class="settings-reset">Excluir perfil</button></div>
          <p id="parentChildStatus" role="status" aria-live="polite"></p>
        </form>
        <section class="parent-password"><h2>🔐 Senha dos pais</h2>
          <form id="parentPasswordForm"><label for="parentNewPassword">${parental.hasPin() ? 'Trocar senha' : 'Criar uma senha'} (mínimo 4 caracteres)</label>
            <input id="parentNewPassword" type="password" minlength="4" maxlength="64" autocomplete="new-password" required>
            <label for="parentConfirmPassword">Confirmar senha</label><input id="parentConfirmPassword" type="password" minlength="4" maxlength="64" autocomplete="new-password" required>
            <button type="submit">Guardar senha</button></form><p id="parentPasswordStatus" role="status"></p>
        </section>
        <section class="profile-backup" aria-label="Guardar e recuperar perfil">
          <h2>💾 Backup da criança selecionada</h2><p>Exporte ou importe um SVG com avatar e medalhas. O arquivo inclui dados pessoais: guarde-o com cuidado. O limite e a senha dos pais não entram no backup.</p>
          <div class="profile-backup-actions"><button id="downloadProfile" type="button">↓ Exportar perfil</button><button id="importProfile" type="button">↑ Importar perfil</button></div>
          <input id="profileFile" type="file" accept=".svg,image/svg+xml" hidden><p id="profileBackupStatus" role="status"></p>
        </section>
      </div>
    </div>`;
    const gate = $('#parentGate');
    const controls = $('#parentControls');
    let selectedId = preferences.family().activeId;
    $('#parentAccessForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = $('#parentAccessPin');
      try {
        if (!await parental.verifyPin(input.value)) { $('#parentGateStatus').textContent = 'Senha incorreta.'; return; }
        input.value = '';
        authorized = true;
        renderParentSettings();
      } catch (error) { $('#parentGateStatus').textContent = error.message; }
    });
    function renderChildList() {
      const state = preferences.family();
      if (!state.profiles.some((entry) => entry.id === selectedId)) selectedId = state.activeId;
      const list = $('#parentChildrenList');
      list.replaceChildren();
      for (const entry of state.profiles) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = selectedId === entry.id ? 'active' : '';
        button.textContent = `${entry.profile.name}${entry.id === state.activeId ? ' · lendo agora' : ''}`;
        button.addEventListener('click', () => { selectedId = entry.id; renderChildList(); });
        list.append(button);
      }
      const selected = state.profiles.find((entry) => entry.id === selectedId);
      $('#parentChildName').value = selected.profile.name;
      $('#parentChildPronunciation').value = selected.profile.pronunciation;
      $('#parentChildBirth').value = selected.profile.birthDate;
      $('#parentChildGender').value = selected.profile.gender;
      $('#parentChildMinutes').value = parental.limitMinutes(selectedId);
      $('#parentTimeStatus').textContent = `Hoje: ${Math.floor(parental.usedMs(selectedId) / 60_000)} min usados de ${parental.limitMinutes(selectedId)} min.`;
      $('#parentRemoveChild').disabled = state.profiles.length === 1;
      $('#parentPinWarning').hidden = parental.hasPin();
    }
    $('#parentAddChild').addEventListener('click', () => {
      try {
        const id = preferences.addProfile();
        selectedId = id;
        renderChildList();
        $('#parentChildName').focus();
        $('#parentChildStatus').textContent = 'Novo perfil criado. Preencha os dados e salve.';
      } catch (error) { $('#parentChildStatus').textContent = error.message; }
    });
    $('#parentChildForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const previous = preferences.family().profiles.find((entry) => entry.id === selectedId)?.profile;
      const name = $('#parentChildName').value.trim();
      const pronunciation = $('#parentChildPronunciation').value.trim();
      if (!name) return;
      if ($('#parentChildBirth').value && !preferences.validBirthDate($('#parentChildBirth').value)) {
        $('#parentChildStatus').textContent = 'Confira a data de nascimento.';
        return;
      }
      try {
        parental.setLimit(selectedId, Number($('#parentChildMinutes').value));
        preferences.saveProfile(selectedId, {
          name, pronunciation: pronunciation || name, birthDate: $('#parentChildBirth').value,
          gender: $('#parentChildGender').value
        });
        // Identidade padrão ainda não definida: não carregar pronúncia de outro nome.
        if (previous.name !== name) $('#parentChildStatus').textContent = `Dados de ${name} atualizados!`;
        else $('#parentChildStatus').textContent = 'Tudo salvo!';
        renderChildList();
      } catch (error) { $('#parentChildStatus').textContent = error.message; }
    });
    $('#parentChildName').addEventListener('input', () => {
      const current = preferences.family().profiles.find((entry) => entry.id === selectedId)?.profile;
      if (current && $('#parentChildPronunciation').value === current.pronunciation) {
        $('#parentChildPronunciation').value = $('#parentChildName').value;
      }
    });
    $('#parentHearName').addEventListener('click', () => window.LivrinhoSpeech?.play(
      $('#parentChildPronunciation').value.trim() || $('#parentChildName').value.trim(), { lang: 'pt-BR', rate: .78, pitch: 1.08 }));
    $('#parentRemoveChild').addEventListener('click', () => {
      const name = preferences.family().profiles.find((entry) => entry.id === selectedId)?.profile.name;
      if (!window.confirm(`Excluir o perfil de ${name}? Todas as medalhas e personalizações desta criança serão perdidas neste aparelho. Exporte um backup antes, se desejar.`)) return;
      try { preferences.removeProfile(selectedId); parental.forgetProfile(selectedId); selectedId = preferences.family().activeId; renderChildList(); }
      catch (error) { $('#parentChildStatus').textContent = error.message; }
    });
    $('#parentResetChild').addEventListener('click', () => {
      if (!window.confirm('Reiniciar o tempo de hoje para esta criança?')) return;
      parental.resetTime(selectedId);
      renderChildList();
    });
    $('#parentPasswordForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = $('#parentNewPassword').value;
      if (password !== $('#parentConfirmPassword').value) { $('#parentPasswordStatus').textContent = 'As senhas não coincidem.'; return; }
      try {
        await parental.setPin(password);
        $('#parentNewPassword').value = '';
        $('#parentConfirmPassword').value = '';
        $('#parentPasswordStatus').textContent = '🔒 Senha guardada neste aparelho!';
        renderChildList();
      } catch (error) { $('#parentPasswordStatus').textContent = error.message; }
    });
    $('#downloadProfile').addEventListener('click', () => {
      const profile = preferences.family().profiles.find((entry) => entry.id === selectedId).profile;
      const blob = new Blob([preferences.exportProfileSVG(profile)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prateleira-magica-${profile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'crianca'}.svg`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('#profileBackupStatus').textContent = 'Perfil exportado!';
    });
    $('#importProfile').addEventListener('click', () => $('#profileFile').click());
    $('#profileFile').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        if (!file.name.toLowerCase().endsWith('.svg') || file.size > 1_000_000) throw Error('Escolha um backup SVG válido.');
        const imported = preferences.parseProfileSVG(await file.text());
        if (!window.confirm(`Substituir os dados e medalhas do perfil selecionado pelos de ${imported.name}?`)) return;
        // O backup substitui apenas a criança escolhida, nunca os outros perfis.
        preferences.saveProfile(selectedId, imported);
        renderChildList();
        $('#profileBackupStatus').textContent = `Perfil de ${imported.name} importado!`;
      } catch (error) { $('#profileBackupStatus').textContent = error.message; }
      finally { event.target.value = ''; }
    });
    renderParentSettings = () => {
      if (!inParentSettings()) { authorized = false; return; }
      gate.hidden = authorized || !parental.hasPin();
      controls.hidden = !authorized && parental.hasPin();
      if (!controls.hidden) renderChildList();
    };
  }
  renderSelector();
  renderParentSettings();
  showLock();
  window.setInterval(() => {
    if (!counting()) parental.pause();
    else parental.tick(Date.now(), !document.hidden && !parental.locked());
    $('.family-time', toolbar).textContent = timeLabel();
    showLock();
  }, 1000);
})();
