/* Narração compartilhada pelo leitor e pelo editor de pronúncia.
 * A pausa descarta somente o áudio atual; a retomada usa o último limite de
 * palavra conhecido, evitando o resume() nativo que pode ficar silencioso.
 */
(() => {
  'use strict';
  let playback = null;
  let utterance = null;
  let status = 'idle';
  const subscribers = new Set();

  const synthesizer = () => window.speechSynthesis;
  const supported = () => Boolean(synthesizer() && window.SpeechSynthesisUtterance);
  const state = () => status;

  function announce(next) {
    status = next;
    for (const callback of subscribers) callback(status);
  }

  // Trechos curtos limitam a repetição caso o dispositivo não envie eventos
  // `boundary`. Com eles, a retomada nunca volta ao início da página inteira.
  function chunks(text) {
    const words = String(text).trim().match(/\S+\s*/gu) || [];
    const result = [];
    let part = '';
    for (const word of words) {
      if (part && part.length + word.length > 90) {
        result.push(part);
        part = '';
      }
      part += word;
      if (part.length >= 45 && /[.!?…]["”']?\s*$/u.test(word)) {
        result.push(part);
        part = '';
      }
    }
    if (part) result.push(part);
    return result;
  }

  function stop() {
    utterance = null; // Ignorar onend/onerror atrasados após cancel().
    playback = null;
    synthesizer()?.cancel();
    announce('idle');
  }

  function speakNext() {
    if (!playback || status !== 'playing') return;
    if (playback.index >= playback.parts.length) {
      stop();
      return;
    }
    const part = playback.parts[playback.index];
    const start = playback.offset;
    const remaining = part.slice(start);
    if (!remaining.trim()) {
      playback.index += 1;
      playback.offset = 0;
      speakNext();
      return;
    }

    const spoken = new window.SpeechSynthesisUtterance(remaining);
    spoken.lang = playback.options.lang || 'pt-BR';
    spoken.rate = playback.options.rate ?? .78;
    spoken.pitch = playback.options.pitch ?? 1.08;
    const voices = synthesizer().getVoices?.() || [];
    const voice = voices.find((item) => item.lang?.toLowerCase() === spoken.lang.toLowerCase())
      || voices.find((item) => item.lang?.toLowerCase().startsWith('pt'));
    if (voice) spoken.voice = voice;
    utterance = spoken;

    spoken.onboundary = (event) => {
      if (utterance !== spoken || !playback || status !== 'playing') return;
      if (Number.isFinite(event.charIndex)) {
        // A fronteira é o início da palavra atual, que poderá ser repetida.
        playback.offset = Math.min(part.length, start + Math.max(0, event.charIndex));
      }
    };
    spoken.onend = () => {
      if (utterance !== spoken || !playback || status !== 'playing') return;
      utterance = null;
      playback.index += 1;
      playback.offset = 0;
      speakNext();
    };
    spoken.onerror = (event) => {
      if (utterance !== spoken) return;
      console.warn('Não foi possível continuar a narração:', event.error || event);
      stop();
    };
    synthesizer().speak(spoken);
  }

  function play(text, options = {}) {
    if (!supported()) return false;
    const parts = chunks(text);
    if (!parts.length) return false;
    stop();
    playback = { parts, index: 0, offset: 0, options };
    announce('playing');
    speakNext(); // No clique: mantém a ativação de áudio exigida por celulares.
    return true;
  }

  function pause() {
    if (status !== 'playing' || !playback) return false;
    utterance = null;
    synthesizer()?.cancel();
    announce('paused');
    return true;
  }

  function resume() {
    if (status !== 'paused' || !playback) return false;
    announce('playing');
    speakNext();
    return true;
  }

  function subscribe(callback) {
    subscribers.add(callback);
    callback(status);
    return () => subscribers.delete(callback);
  }

  window.LivrinhoSpeech = { supported, state, play, pause, resume, stop, subscribe };
})();
