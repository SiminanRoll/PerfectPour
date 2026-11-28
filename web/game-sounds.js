/* Perfect Pour · soft procedural tap, fizz, and rewards. No samples or requests. */
(() => {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const voices = new Set();
  let context = null, bus = null, noise = null, listener = null;
  let enabled = true, volume = 1, pour = null, foam = null;
  const LEVEL = .3;

  function disconnect(node) { try { node.disconnect(); } catch (_) {} }
  function dispose(voice) {
    if (!voice || voice.disposed) return;
    voice.disposed = true;
    if (voice.cleanup) clearTimeout(voice.cleanup);
    voice.cleanup = null;
    try { voice.source.stop(); } catch (_) {}
    disconnect(voice.source); disconnect(voice.gain);
    if (voice.filter) disconnect(voice.filter);
    voices.delete(voice);
  }
  // Track the loop's ramp explicitly. Reading AudioParam.value immediately
  // after scheduling an attack is not a safe way to preserve its current
  // amplitude when the player releases quickly or the foam changes next frame.
  function rampVoice(voice, nextLevel, duration) {
    const now = voice.context.currentTime, parameter = voice.gain.gain;
    const e = voice.envelope;
    const current = e ? e.from + (e.to - e.from) * clamp((now - e.start) / Math.max(.00001, e.end - e.start), 0, 1) : parameter.value;
    if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(now);
    else {
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    parameter.linearRampToValueAtTime(nextLevel, now + duration);
    voice.envelope = {from:current, to:nextLevel, start:now, end:now + duration};
  }
  function stopVoice(voice, fade = .09) {
    if (!voice || voice.stopping || voice.disposed) return;
    voice.stopping = true;
    const now = voice.context.currentTime;
    const duration = voice.context.state === 'running' ? fade : 0;
    rampVoice(voice, 0, duration);
    try { voice.source.stop(now + duration + .01); } catch (_) {}
    // The wall clock also releases nodes if audio was suspended mid-fade.
    if (voice.cleanup) clearTimeout(voice.cleanup);
    voice.cleanup = setTimeout(() => dispose(voice), (duration + .04) * 1000);
  }
  function suspend() {
    pour = foam = null;
    for (const voice of voices) stopVoice(voice, .045);
  }
  function attach(next) {
    if (next === context) return !!context;
    for (const voice of [...voices]) dispose(voice);
    pour = foam = null;
    if (context && listener) context.removeEventListener('statechange', listener);
    if (bus) disconnect(bus);
    context = next || null; bus = noise = listener = null;
    if (!context) return false;
    bus = context.createGain(); bus.gain.value = LEVEL * volume;
    bus.connect(context.destination);
    listener = () => { if (context && context.state !== 'running') suspend(); };
    context.addEventListener('statechange', listener);
    return true;
  }
  function available() {
    return enabled && context && context.state === 'running' && !document.hidden;
  }
  function noiseBuffer() {
    if (noise) return noise;
    noise = context.createBuffer(1, Math.round(context.sampleRate * 1.4), context.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 0x16c4a7;
    // A fixed noise bed is repeatable and requires no sound download.
    for (let i = 0; i < data.length; i++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      data[i] = ((seed >>> 0) / 4294967295 * 2 - 1) * .75;
    }
    return noise;
  }
  function loop(type, frequency, level, attack = .06) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    const now = context.currentTime;
    source.buffer = noiseBuffer(); source.loop = true;
    filter.type = type; filter.frequency.value = frequency; filter.Q.value = .65;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(level, now + attack);
    source.connect(filter); filter.connect(gain); gain.connect(bus);
    const voice = {context, source, filter, gain, level, envelope:{from:0,to:level,start:now,end:now+attack}, stopping:false, disposed:false, cleanup:null};
    voices.add(voice); source.onended = () => dispose(voice);
    source.start(now);
    return voice;
  }
  function startPour(sodaIndex = 0, iceScoops = 0, pressure = 1) {
    if (!available()) return false;
    if (pour) return true;
    const soda = clamp(Math.trunc(Number(sodaIndex) || 0), 0, 3);
    const ice=clamp(Number(iceScoops)||0,0,2),force=clamp(Number(pressure)||0,0,2);
    pour = loop('lowpass', (950 + soda * 200)*(1+(force-1)*.12)+ice*110, .11 + soda * .01+ice*.009);
    return true;
  }
  function stopPour() {
    if (!pour) return;
    stopVoice(pour, .13); pour = null;
  }
  function updateFoam(fraction, sodaIndex = 0, isSettling = false) {
    const amount = Number.isFinite(Number(fraction)) ? clamp(Number(fraction), 0, 1) : 0;
    if (!available() || !isSettling || amount <= .001) {
      if (foam) { stopVoice(foam, .1); foam = null; }
      return;
    }
    const soda = clamp(Math.trunc(Number(sodaIndex) || 0), 0, 3);
    const level = (.025 + soda * .0035) * Math.sqrt(Math.min(1, amount / .32));
    if (!foam) {
      foam = loop('bandpass', 1450 + soda * 220, level, .16);
      return;
    }
    foam.level = level;
    foam.filter.frequency.value = 1450 + soda * 220;
    rampVoice(foam, level, .12);
  }
  function note(midi, delay, length, level = .16, type = 'sine') {
    if (!available()) return;
    const source = context.createOscillator(), gain = context.createGain();
    const at = context.currentTime + delay;
    source.type = type; source.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(gain); gain.connect(bus);
    const voice = {context, source, gain, level, stopping:false, disposed:false, cleanup:null};
    voices.add(voice); source.onended = () => dispose(voice);
    source.start(at); source.stop(at + length + .02);
    voice.cleanup = setTimeout(() => dispose(voice), (delay + length + .12) * 1000);
  }
  function cue(name, options = {}) {
    if (!available()) return false;
    switch (name) {
      case 'ingredient':
        if(options.kind==='ice'){
          [[94,0],[89,.045],[97,.1]].forEach(([pitch,at])=>note(pitch,at,.095,.05,'sine'));
        }else{
          note(options.kind==='lime'?70:options.kind==='syrup'?55:61,0,.09,.055,'sine');
          note(43,.025,.075,.025,'sine');
        }
        break;
      case 'knob':
        note(72,0,.035,.032,'triangle');note(48,0,.025,.02,'triangle');break;
      case 'perfect':
        [[72,0],[76,.09],[79,.18],[84,.32]].forEach(([pitch,at]) => note(pitch,at,.38,.14));
        break;
      case 'good':
        note(67,0,.18,.14); note(72,.12,.28,.14); break;
      case 'bad':
        note(55,0,.15,.11,'triangle'); note(52,.16,.22,.09,'triangle'); break;
      case 'spill':
        note(44,0,.12,.08,'triangle'); break;
      case 'purchase':
        [[69,0],[76,.08],[81,.18]].forEach(([pitch,at]) => note(pitch,at,.23,.13));
        break;
      case 'streak': {
        const high = Number(options.streak) >= 8 ? 5 : 0;
        [[67,0],[71,.08],[74,.16],[79,.29]].forEach(([pitch,at]) => note(pitch+high,at,.26,.115));
        break;
      }
      case 'day':
        [[60,0],[64,.1],[67,.2],[72,.36]].forEach(([pitch,at]) => note(pitch,at,.33,.12));
        break;
      default: return false;
    }
    return true;
  }
  function setEnabled(next) { enabled = !!next; if (!enabled) suspend(); }
  function setVolume(next) {
    if (!Number.isFinite(Number(next))) return;
    volume = clamp(Number(next), 0, 1);
    if (!bus || !context) return;
    const now = context.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(LEVEL * volume, now + .06);
  }
  function destroy() { attach(null); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
  window.addEventListener('blur', suspend);
  window.PerfectPourSounds = Object.freeze({attach, setEnabled, setVolume, startPour, stopPour, updateFoam, cue, suspend, destroy});
})();
