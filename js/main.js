// main.js — Boot sequence orchestration and screen flow
(async function () {
  const { s, p, C } = Ansi;

  // Need a user gesture to enable audio context
  Terminal.clear();
  // Splash box: 56-char inner width, centred via renderLines(lines, 58)
  Ansi.renderLines(Ansi.Layout.splashBox([
    { text: 'CHARLES vs WORLD BBS', color: C.M },
    { text: '' },
    { text: 'Press any key or click to connect...', color: C.C },
  ], { innerWidth: 56 }), 58);

  await Terminal.waitForKey();

  // ── DIAL-UP SEQUENCE ──
  Terminal.clear();
  Terminal.hideCursor();

  // Initialize audio context on user gesture
  Modem.ensureContext();

  // ATZ — Modem reset
  await Terminal.typeLine([s('ATZ', C.G)], 50);
  await Terminal.delay(400);
  await Terminal.typeLine([s('OK', C.W)], 50);
  await Terminal.delay(300);

  // ATDT — Dial
  await Terminal.typeText([s('ATDT 555-0199', C.G)], 40);

  // Start modem dial sounds (no handshake)
  const soundDuration = Modem.playDialOnly();
  Terminal.write('\n');

  // Wait for dial tones to finish
  await Terminal.delay(soundDuration * 1000);

  // CONNECT
  await Terminal.typeLine([s('CONNECT 14400/ARQ/V.32bis', C.W)], 25);
  Terminal.writeLine('');

  // Pre-fetch repos in background
  GitHub.fetchRepos();

  // ── MAIN MENU ──
  Menu.showMainMenu();
})();
