// main.js — Boot sequence orchestration and screen flow
(async function () {
  const { s, C } = Ansi;

  // Need a user gesture to enable audio context
  Terminal.clear();
  Terminal.writeLine([s('  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.B)]);
  Terminal.writeLine([s('  \u2551', C.B), s('                                                        ', C.G), s('\u2551', C.B)]);
  Terminal.writeLine([s('  \u2551', C.B), s('     CHARLES vs WORLD BBS', C.M), s('                               ', C.G), s('\u2551', C.B)]);
  Terminal.writeLine([s('  \u2551', C.B), s('                                                        ', C.G), s('\u2551', C.B)]);
  Terminal.writeLine([s('  \u2551', C.B), s('     Press any key or click to connect...', C.C), s('               ', C.G), s('\u2551', C.B)]);
  Terminal.writeLine([s('  \u2551', C.B), s('                                                        ', C.G), s('\u2551', C.B)]);
  Terminal.writeLine([s('  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.B)]);

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

  // Start modem sound sequence
  const soundDuration = Modem.playFullSequence();
  Terminal.write('\n');
  await Terminal.delay(200);

  // Show "dialing" feedback
  await Terminal.typeLine([s('DIALING...', C.DG)], 60);
  await Terminal.delay(800);

  // Handshake noise text
  await Terminal.typeLine([s('\u2591\u2592\u2593\u2588\u2593\u2592\u2591\u2592\u2593\u2588\u2588\u2593\u2591\u2592\u2593\u2588\u2593\u2592\u2591\u2592\u2593\u2588\u2593\u2591\u2592\u2593\u2588\u2593\u2592\u2591', C.DG)], 15);
  await Terminal.delay(600);

  // CONNECT
  await Terminal.typeLine([s('CONNECT 14400/ARQ/V.32bis', C.W)], 25);
  await Terminal.delay(500);
  Terminal.writeLine('');

  // Wait for sound to finish if still playing
  const elapsed = 2800; // approximate ms we've spent in text animation
  const remaining = (soundDuration * 1000) - elapsed;
  if (remaining > 0) await Terminal.delay(remaining);

  // ── WELCOME / TITLE SCREEN ──
  Terminal.clear();

  const banner = Ansi.getTitleBanner();
  await Ansi.renderArtAnimated(banner, 25);

  Terminal.writeLine([s('  SysOp: ', C.C), s('macBdog', C.W), s('  \u2502  ', C.DG), s('Node 1', C.G), s('  \u2502  ', C.DG), s('14400 bps', C.G), s('  \u2502  ', C.DG), s('ANSI Detected', C.C)]);
  Terminal.writeLine([s('  "Striving to be the best BBS this side of the internet!"', C.DG)]);
  Terminal.writeLine('');
  Terminal.writeLine([s('  Press any key to continue...', C.C)]);

  await Terminal.waitForKey();

  // Pre-fetch repos in background while user reads title
  GitHub.fetchRepos();

  // ── MAIN MENU ──
  Menu.showMainMenu();
})();
