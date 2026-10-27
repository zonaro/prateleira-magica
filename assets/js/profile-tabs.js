(() => {
  'use strict';
  const tabs = [
    { name: 'conquistas', tab: document.getElementById('tabConquistas'), panel: document.getElementById('profileOverview') },
    { name: 'predefinidos', tab: document.getElementById('tabPresets'), panel: document.getElementById('profilePresets') },
    { name: 'personalizar', tab: document.getElementById('tabPersonalizar'), panel: document.getElementById('profileEditor') }
  ];
  if (tabs.some(({ tab, panel }) => !tab || !panel)) return;
  function selectTab() {
    const hash = location.hash;
    const selected = hash === '#personalizar' ? 'personalizar' : (hash === '#predefinidos' ? 'predefinidos' : 'conquistas');
    for (const { name, tab, panel } of tabs) {
      const active = name === selected;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    }
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }
  window.addEventListener('hashchange', selectTab);
  selectTab();
})();
