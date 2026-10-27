/* Instrumento local, sem arquivos de áudio ou coleta de dados. */
(() => {
  'use strict';
  const NOTES = [
    ['Dó', 'C', 261.63], ['Ré', 'D', 293.66], ['Mi', 'E', 329.63],
    ['Fá', 'F', 349.23], ['Sol', 'G', 392], ['Lá', 'A', 440],
    ['Si', 'B', 493.88], ['Dó', 'C', 523.25]
  ];
  let audioContext;
  function play(frequency) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      const start = audioContext.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.2, start + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.57);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.6);
      return true;
    } catch (error) {
      console.warn('Som do teclado indisponível:', error);
      return false;
    }
  }
  function create() {
    const panel = document.createElement('section');
    panel.className = 'music-keyboard';
    panel.setAttribute('aria-label', 'Teclado musical interativo');
    const info = document.createElement('p');
    info.textContent = '🎹 Toque em cada tecla! A letra é a cifra usada por músicos no mundo todo.';
    const keys = document.createElement('div');
    keys.className = 'music-keys';
    const status = document.createElement('p');
    status.className = 'music-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Qual nota você quer ouvir?';
    NOTES.forEach(([name, code, hz], index) => {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'music-key';
      key.setAttribute('aria-label', `Tocar nota ${name}, cifra ${code}${index === 7 ? ', oitava acima' : ''}`);
      key.innerHTML = '<strong></strong><span></span>';
      key.querySelector('strong').textContent = name;
      key.querySelector('span').textContent = code;
      key.addEventListener('click', () => {
        window.LivrinhoSpeech?.stop?.();
        const sounded = play(hz);
        status.textContent = sounded ? `🎵 ${name} = ${code}${index === 7 ? ' (mais agudo!)' : ''}`
          : `${name} = ${code}. O som precisa de um navegador com áudio.`;
        key.classList.add('playing');
        window.setTimeout(() => key.classList.remove('playing'), 250);
      });
      keys.append(key);
    });
    panel.append(info, keys, status);
    return panel;
  }
  window.LivrinhoMusicKeyboard = { create, notes: NOTES };
})();
