// modem.js — Web Audio API modem dial-up sound synthesis
const Modem = (() => {
  let ctx = null;

  function ensureContext() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Play a tone at given frequency for duration
  function playTone(freq, duration, startTime, gain = 0.15) {
    const c = ensureContext();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Dial tone: 350Hz + 440Hz combined
  function playDialTone(startTime, duration = 0.5) {
    playTone(350, duration, startTime, 0.08);
    playTone(440, duration, startTime, 0.08);
  }

  // DTMF tones for a digit
  const DTMF_LOW  = [697, 770, 852, 941];
  const DTMF_HIGH = [1209, 1336, 1477];
  const DTMF_MAP = {
    '1': [0,0], '2': [0,1], '3': [0,2],
    '4': [1,0], '5': [1,1], '6': [1,2],
    '7': [2,0], '8': [2,1], '9': [2,2],
    '*': [3,0], '0': [3,1], '#': [3,2]
  };

  function playDTMF(digit, startTime, duration = 0.1) {
    const map = DTMF_MAP[digit];
    if (!map) return;
    playTone(DTMF_LOW[map[0]], duration, startTime, 0.1);
    playTone(DTMF_HIGH[map[1]], duration, startTime, 0.1);
  }

  // Dial a phone number string with DTMF tones
  function dialNumber(number, startTime) {
    let t = startTime;
    for (const ch of number) {
      if (ch === '-' || ch === ' ') {
        t += 0.05;
        continue;
      }
      playDTMF(ch, t, 0.09);
      t += 0.12;
    }
    return t; // return end time
  }

  // Modem handshake noise: filtered white noise + frequency sweeps
  function playHandshake(startTime, duration = 1.5) {
    const c = ensureContext();

    // White noise buffer
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = c.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to shape the noise
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2;

    // Modulate filter frequency for that classic sweep sound
    filter.frequency.setValueAtTime(2600, startTime);
    filter.frequency.linearRampToValueAtTime(1200, startTime + duration * 0.4);
    filter.frequency.linearRampToValueAtTime(2200, startTime + duration * 0.6);
    filter.frequency.linearRampToValueAtTime(1400, startTime + duration);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start(startTime);
    noise.stop(startTime + duration);

    // Add some sine sweeps on top
    const osc1 = c.createOscillator();
    const g1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2100, startTime);
    osc1.frequency.linearRampToValueAtTime(1300, startTime + duration * 0.3);
    osc1.frequency.setValueAtTime(2250, startTime + duration * 0.35);
    osc1.frequency.linearRampToValueAtTime(1650, startTime + duration);
    g1.gain.setValueAtTime(0.06, startTime);
    g1.gain.linearRampToValueAtTime(0, startTime + duration);
    osc1.connect(g1);
    g1.connect(c.destination);
    osc1.start(startTime);
    osc1.stop(startTime + duration);
  }

  // Connect chime
  function playConnectChime(startTime) {
    playTone(880, 0.08, startTime, 0.08);
    playTone(1100, 0.08, startTime + 0.1, 0.08);
  }

  // Full dial-up sequence, returns total duration
  function playFullSequence() {
    const c = ensureContext();
    const now = c.currentTime + 0.05;
    let t = now;

    // Dial tone
    playDialTone(t, 0.4);
    t += 0.5;

    // DTMF dialing "5550199"
    t = dialNumber('5550199', t);
    t += 0.2;

    // Ringing pause
    playTone(440, 0.3, t, 0.04);
    t += 0.6;

    // Handshake screech
    playHandshake(t, 1.3);
    t += 1.4;

    // Connect chime
    playConnectChime(t);
    t += 0.3;

    return t - now; // total duration in seconds
  }

  return {
    ensureContext,
    playFullSequence
  };
})();
