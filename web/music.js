/* Perfect Pour · original, quiet soda-bar music. No samples or network assets. */
(() => {
  'use strict';

  const BPM = 78;
  const BEAT = 60 / BPM;
  const LOOP_BEATS = 64;
  const LOOK_AHEAD = .14;
  const MASTER_LEVEL = .14;
  const FADE_SECONDS = .14;
  let context = null, output = null, room = null, feedback = null, roomLevel = null;
  let current = null, contextListener = null, savedBeat = 0, volume = 1;
  const retiring = new Set();

  // A small original 16-bar tune: warm extended chords, a walking two-note
  // bass, and a sparse melody. The second pass answers the first softly.
  const harmony = [
    {bass:41, chord:[57,60,64,67]},
    {bass:38, chord:[53,57,60,64]},
    {bass:46, chord:[53,57,62,65]},
    {bass:48, chord:[55,57,60,64]},
    {bass:41, chord:[57,60,62,67]},
    {bass:45, chord:[55,60,64,67]},
    {bass:43, chord:[53,57,58,62]},
    {bass:48, chord:[52,58,62,67]}
  ];
  const melodies = [
    [[1.5,69,.5],[2.5,67,.5],[3,64,.8]],
    [[.5,62,.7],[1.5,65,.5],[3,69,.7]],
    [[1,72,.8],[2.5,69,.5],[3,65,.7]],
    [[.5,64,.8],[2,67,.7],[3,62,.7]],
    [[1,69,.5],[1.5,67,.5],[2.5,64,.9]],
    [[.5,67,.8],[1.5,64,.5],[3,60,.7]],
    [[1,62,.7],[2,65,.5],[3,69,.7]],
    [[.5,67,.6],[1.5,64,.5],[2.5,62,.5],[3,67,.7]],
    [[.5,65,.7],[2,69,.6],[3,67,.7]],
    [[1,65,.6],[2.5,64,.5],[3,62,.7]],
    [[.5,65,.7],[1.5,69,.5],[3,72,.7]],
    [[1,69,.6],[2,67,.5],[3,64,.7]],
    [[.5,67,.5],[1.5,69,.5],[2.5,72,.8]],
    [[1,71,.7],[2.5,67,.5],[3,64,.7]],
    [[.5,62,.7],[2,65,.6],[3,69,.7]],
    [[.5,67,.6],[1.5,64,.5],[2.5,62,.7]]
  ];
  const swing = beat => Math.floor(beat) + (beat % 1 === .5 ? .57 : beat % 1);
  const notes = [];
  for(let bar=0;bar<16;bar++) {
    const part = harmony[bar % harmony.length], offset = bar * 4;
    notes.push({beat:offset, midi:part.bass, length:1.5, level:.17, voice:'bass', pan:0});
    notes.push({beat:offset+2, midi:part.bass+7, length:1.05, level:.12, voice:'bass', pan:0});
    for(const [stroke,level,length] of [[.5,.056,1.35],[2.5,.043,.95]]) {
      part.chord.forEach((midi,i) => notes.push({beat:offset+swing(stroke)+i*.012,midi,length,level,voice:'keys',pan:-.18+i*.12}));
    }
    for(const [beat,midi,length] of melodies[bar]) {
      notes.push({beat:offset+swing(beat),midi,length,level:.105,voice:'melody',pan:.12});
    }
  }
  notes.sort((a,b) => a.beat-b.beat);

  function disconnect(node) { try { node.disconnect(); } catch(_) {} }
  function dispose(run) {
    if(run.cleanup) { clearTimeout(run.cleanup); run.cleanup = null; }
    for(const voice of run.voices) {
      try { voice.oscillator.stop(); } catch(_) {}
      disconnect(voice.oscillator); disconnect(voice.gain);
      if(voice.pan) disconnect(voice.pan);
    }
    run.voices.clear(); disconnect(run.gain); retiring.delete(run);
  }

  function stop() {
    const run = current;
    if(!run) return;
    // Pause the musical clock with the game. A visit to the shop or help
    // should continue the tune, not replay its opening phrase.
    savedBeat = Math.max(0,(run.context.currentTime-run.anchor)/BEAT) % LOOP_BEATS;
    current = null; clearInterval(run.timer); run.timer = null;
    const now = run.context.currentTime;
    // Each playback owns its gain so a rapid off/on cannot revive old notes.
    run.gain.gain.cancelScheduledValues(now);
    const level = MASTER_LEVEL*volume*Math.min(1,Math.max(0,(now-run.fadeStart)/.6));
    run.gain.gain.setValueAtTime(level,now);
    run.gain.gain.linearRampToValueAtTime(0,now+FADE_SECONDS);
    for(const voice of run.voices) {
      try { voice.oscillator.stop(voice.at>now ? now : now+FADE_SECONDS); } catch(_) {}
    }
    retiring.add(run);
    // Wall-clock cleanup also silences a graph whose context was suspended.
    run.cleanup = setTimeout(() => dispose(run),(FADE_SECONDS+.04)*1000);
  }

  function attach(nextContext) {
    if(nextContext === context) return !!context;
    stop();
    for(const run of [...retiring]) dispose(run);
    if(context && contextListener) context.removeEventListener('statechange',contextListener);
    for(const node of [output,room,feedback,roomLevel]) if(node) disconnect(node);
    context = nextContext || null; output = room = feedback = roomLevel = null;
    if(!context) return false;
    output = context.createBiquadFilter(); output.type = 'lowpass';
    output.frequency.value = 1550; output.Q.value = .35;
    output.connect(context.destination);
    // A very short, low-level room echo softens the synthesized keys.
    room = context.createDelay(.5); room.delayTime.value = .17;
    feedback = context.createGain(); feedback.gain.value = .12;
    roomLevel = context.createGain(); roomLevel.gain.value = .12;
    output.connect(room); room.connect(feedback); feedback.connect(room);
    room.connect(roomLevel); roomLevel.connect(context.destination);
    contextListener = () => { if(context && context.state !== 'running') stop(); };
    context.addEventListener('statechange',contextListener);
    return true;
  }

  function playNote(run,note,at) {
    const audio = run.context, oscillator = audio.createOscillator(), gain = audio.createGain();
    const pan = audio.createStereoPanner ? audio.createStereoPanner() : null;
    const duration = note.length * BEAT;
    oscillator.type = note.voice === 'keys' ? 'triangle' : 'sine';
    oscillator.frequency.value = 440 * Math.pow(2,(note.midi-69)/12);
    const attack = note.voice === 'bass' ? .025 : .012;
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(note.level,at+attack);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    oscillator.connect(gain);
    if(pan) { pan.pan.value = note.pan; gain.connect(pan); pan.connect(run.gain); }
    else gain.connect(run.gain);
    const voice = {oscillator,gain,pan,at};
    run.voices.add(voice);
    oscillator.onended = () => {
      run.voices.delete(voice); disconnect(oscillator); disconnect(gain);
      if(pan) disconnect(pan);
    };
    oscillator.start(at); oscillator.stop(at+duration+.02);
  }

  function schedule(run) {
    if(current !== run) return;
    if(run.context.state !== 'running' || document.hidden) { stop(); return; }
    const now = run.context.currentTime;
    const elapsedLoop = Math.floor((now-run.anchor)/(LOOP_BEATS*BEAT));
    if(elapsedLoop > run.loop) { run.loop = elapsedLoop; run.index = 0; }
    for(;;) {
      const note = notes[run.index];
      const at = run.anchor + (run.loop*LOOP_BEATS+note.beat)*BEAT;
      if(at > now+LOOK_AHEAD) break;
      // Missed timers skip past notes rather than playing a loud backlog.
      if(at >= now-.025) playNote(run,note,Math.max(at,now));
      run.index++;
      if(run.index === notes.length) { run.index = 0; run.loop++; }
    }
  }

  function start(nextContext) {
    if(nextContext) attach(nextContext);
    if(!context || context.state !== 'running' || document.hidden) return false;
    if(current) return true;
    const gain = context.createGain(), now = context.currentTime;
    gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(MASTER_LEVEL*volume,now+.6);
    gain.connect(output);
    let index = notes.findIndex(note => note.beat >= savedBeat);
    const loop = index === -1 ? 1 : 0;
    if(index === -1) index = 0;
    const run = {context,gain,fadeStart:now,anchor:now+.035-savedBeat*BEAT,index,loop,voices:new Set(),timer:null,cleanup:null};
    current = run; schedule(run); run.timer = setInterval(() => schedule(run),30);
    return true;
  }

  function setVolume(next) {
    if(!Number.isFinite(Number(next))) return;
    volume = Math.max(0,Math.min(1,Number(next)));
    if(!current) return;
    const now = current.context.currentTime;
    current.gain.gain.cancelScheduledValues(now);
    current.gain.gain.setValueAtTime(current.gain.gain.value,now);
    current.gain.gain.linearRampToValueAtTime(MASTER_LEVEL*volume,now+.08);
  }

  function position() {
    return current ? Math.max(0,(current.context.currentTime-current.anchor)/BEAT) % LOOP_BEATS : savedBeat;
  }

  // These are safety stops only. Resuming always belongs to the game's
  // user-gesture/audio policy, never to a visibility or focus event here.
  document.addEventListener('visibilitychange',() => { if(document.hidden) stop(); });
  window.addEventListener('blur',stop);
  window.PourMusic = Object.freeze({attach,start,stop,setVolume,position,isPlaying:() => current !== null});
})();
