(() => {
  'use strict';
  const install = document.getElementById('installButton');
  const status = document.getElementById('connectionStatus');
  let installPrompt = null;

  function updateConnection() {
    if (!status) return;
    const offline = navigator.onLine === false;
    status.classList.toggle('offline', offline);
    status.textContent = offline ? '● Modo offline' : '● Pronto para ler';
  }
  updateConnection();
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (install) install.hidden = false;
  });
  install?.addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    install.hidden = true;
    await prompt.prompt();
  });
  window.addEventListener('appinstalled', () => { if (install) install.hidden = true; });

  // GitHub Pages supplies HTTPS, which is required for service workers.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .catch((error) => console.warn('Modo offline indisponível:', error));
    });
  }
})();
