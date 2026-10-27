(() => {
  'use strict';
  const tabs = [
    { name: 'conquistas', tab: document.getElementById('tabConquistas'), panel: document.getElementById('profileOverview') },
    { name: 'predefinidos', tab: document.getElementById('tabPresets'), panel: document.getElementById('profilePresets') },
    { name: 'personalizar', tab: document.getElementById('tabPersonalizar'), panel: document.getElementById('profileEditor') },
    { name: 'foto', tab: document.getElementById('tabFoto'), panel: document.getElementById('profilePhoto') }
  ];
  if (tabs.some(({ tab, panel }) => !tab || !panel)) return;
  const photoTab = document.getElementById('tabFoto');
  let photoReady = false;
  let generation = 0;

  function selectTab() {
    const hash = location.hash;
    const selected = hash === '#foto' ? (photoReady ? 'foto' : 'personalizar')
      : hash === '#personalizar' ? 'personalizar'
      : hash === '#predefinidos' ? 'predefinidos' : 'conquistas';
    for (const { name, tab, panel } of tabs) {
      const active = name === selected;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    }
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }

  function setPhotoAvailability(ready) {
    photoReady = Boolean(ready);
    photoTab.hidden = !photoReady;
    photoTab.setAttribute('aria-hidden', String(!photoReady));
    if (!photoReady && location.hash === '#foto') {
      location.replace('#personalizar');
    }
    selectTab();
  }
  async function refreshPhotoAvailability() {
    const token = ++generation;
    // Falhar fechado: a aba não é oferecida até que ambos os modelos e as
    // bibliotecas de inferência respondam pelo mesmo domínio ou cache PWA.
    const available = Boolean(await window.LivrinhoAvatarPhoto?.checkAvailability());
    if (token !== generation) return;
    setPhotoAvailability(available);
  }

  window.addEventListener('hashchange', selectTab);
  window.addEventListener('online', refreshPhotoAvailability);
  navigator.serviceWorker?.addEventListener('controllerchange', refreshPhotoAvailability);
  window.addEventListener('livrinhos:avatar-photo-unavailable', () => {
    generation++; // invalida checagens pendentes
    setPhotoAvailability(false);
  });
  selectTab();
  refreshPhotoAvailability();
})();
