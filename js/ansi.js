// ansi.js — ANSI art rendering with per-character color support
// Color codes: W=white, G=light-gray, DG=dark-gray, B=blue, DB=dark-blue,
// C=cyan, DC=dark-cyan, M=magenta, DM=dark-magenta, R=red
// Format: each art piece is an array of lines. Each line is an array of
// { text, color } segments for colored output.

const Ansi = (() => {
  // Target content column count — matches CSS min(97vw, 102ch) minus 2×2ch padding
  const SCREEN_COLS = 96;
  // Left indent to center a block of given width within SCREEN_COLS
  function indent(contentWidth) {
    return ' '.repeat(Math.max(0, Math.floor((SCREEN_COLS - contentWidth) / 2)));
  }

  const C = {
    W: 'white', G: 'light-gray', DG: 'dark-gray',
    B: 'blue', DB: 'dark-blue', C: 'cyan', DC: 'dark-cyan',
    M: 'magenta', DM: 'dark-magenta', R: 'red', Y: 'yellow'
  };

  // Helper: create a colored segment
  function s(text, color) { return { text, color }; }
  // Plain (light gray default)
  function p(text) { return { text }; }

  // ── WELCOME SCREEN: "The Technomancer Arrives" ──
  function getWelcomeArt() {
    return [
      [s('  \u00B7  \u2219  *       \u2571\u2572    \u00B7  \u2219 \u00B7 *  \u00B7    \u2571\u2572           \u00B7  *  \u00B7', C.B)],
      [s('     \u00B7    *    \u2571\u2571\u2572\u2572  \u00B7    *     \u00B7   \u2571\u2571\u2572\u2572      \u00B7 \u2219       *', C.B)],
      [s('  \u2219    \u2572  \u2571  \u2571\u2571  \u2572\u2572      \u00B7  \u2219    \u2571\u2571  \u2572\u2572  \u2572  \u2571     \u00B7 \u2219', C.B)],
      [s('   \u2500\u2500\u2500\u2500\u2573\u2500\u2500\u2500\u2500', C.W), s('   \u2572\u2572\u2571\u2571  \u00B7 \u2219     *    \u2572\u2572\u2571\u2571   ', C.B), s('\u2500\u2500\u2500\u2500\u2573\u2500\u2500\u2500\u2500', C.W), s('    \u00B7', C.B)],
      [s('  \u2219    \u2571  \u2572    \u2572\u2571       \u00B7  \u2219       \u2572\u2571     \u2571  \u2572   *  \u2219', C.B)],
      [s('    \u00B7    *        \u00B7    ', C.B), s('\u2584\u2588\u2588\u2588\u2588\u2588\u2584', C.DM), s('    \u00B7    *          \u00B7', C.B)],
      [s('   *  \u00B7    \u2219  \u00B7       ', C.B), s('\u2588\u2592\u2591\u2592\u2591\u2592\u2591\u2588', C.DM), s('      \u00B7    \u2219  \u00B7 *      \u00B7', C.B)],
      [s('            \u00B7         ', C.B), s('\u2588\u2592\u00B7   \u00B7\u2592\u2588', C.G), s('          \u00B7        *', C.B)],
      [s('       ~    \u00B7  *      ', C.C), s('\u2588\u2592 \u2500\u2500\u2500 \u2592\u2588', C.G), s('     *  \u00B7    ', C.B), s('~', C.C), s('         \u00B7', C.B)],
      [s('     ~ ~ ~', C.C), s('             \u2588\u2592\u2584\u2584\u2584\u2592\u2588', C.G), s('            ', C.B), s('~ ~ ~', C.C)],
      [s('    ~ ~ ~ ~', C.C), s('  \u00B7      ', C.B), s('\u2584\u2584\u2588\u2557     \u2554\u2588\u2584\u2584', C.DB), s('     \u00B7  ', C.B), s('~ ~ ~ ~', C.C)],
      [s('     ~ ~ ~', C.C), s('        ', C.B), s('\u2584\u2588  \u2551\u2560\u2550\u2550\u2550\u2550\u2550\u2563\u2551  \u2588\u2584', C.DB), s('       ', C.B), s('~ ~ ~', C.C), s('   *', C.B)],
      [s('  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.C), s('\u2591\u2591    ', C.DC), s('\u2584\u2588\u2580  \u2550\u256C\u2551\u2588\u2588\u2588\u2588\u2588\u2551\u256C\u2550  \u2580\u2588\u2584', C.DB), s('   \u2591\u2591', C.DC), s('\u2554\u2550\u2550\u2550\u2564\u2550\u2550\u2557', C.G)],
      [s('  \u2551\u2593\u2591\u2593\u2591\u2593\u2591\u2551', C.C), s('\u2591\u2591  ', C.DC), s('\u2588\u2588   \u2550\u2550\u256C\u2551\u2588\u2588\u2588\u2588\u2588\u2551\u256C\u2550\u2550   \u2588\u2588', C.DB), s('  \u2591\u2591', C.DC), s('\u255F\u2510  \u2502  \u2562', C.G)],
      [s('  \u2551\u2591\u2593\u2591\u2593\u2591\u2593\u2551', C.C), s('\u2591\u2591  ', C.DC), s('\u2588\u2588     \u2550\u256C\u2551\u2588\u2588\u2588\u2588\u2588\u2551\u256C\u2550     \u2588\u2588', C.DB), s(' \u2591\u2591', C.DC), s('\u2551\u2514\u2500\u2500\u2518  \u2551', C.G)],
      [s('  \u2551\u2593\u2591\u2593\u2591\u2593\u2591\u2551', C.C), s('\u2591   ', C.DC), s('\u2588       \u2551\u2551\u2593\u2593\u2593\u2593\u2593\u2551\u2551       \u2588', C.DB), s('   \u2551  \u250C\u2500\u2500\u2510\u2551', C.G)],
      [s('  \u2551\u2591\u2593\u2591\u2593\u2591\u2593\u2551', C.C), s('   ', C.DC), s('\u2591\u2588       \u2551\u2551\u2593\u2593\u2593\u2593\u2593\u2551\u2551       \u2588\u2591', C.DG), s('  \u2551  \u2502  \u2502\u2551', C.G)],
      [s('  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.C), s('   ', C.DC), s('\u2591\u2588\u2591     \u2554\u255D\u2551     \u2551\u255A\u2557     \u2591\u2588\u2591', C.DG), s('  \u255A\u2550\u2550\u2567\u2550\u2550\u255D', C.G)],
      [s('   KEYBOARD', C.C), s('  \u2591\u2588\u2588\u2591   \u2554\u255D \u2551     \u2551 \u255A\u2557   \u2591\u2588\u2588\u2591', C.DG), s('  WRENCH', C.G)],
      [s('             \u2591\u2588 \u2588\u2591 \u2554\u255D  \u2568     \u2568  \u255A\u2557 \u2591\u2588 \u2588\u2591', C.DG)],
      [s('  \u2593\u2593\u2593\u2591\u2591\u2591', C.DM), s('    \u2591\u2588   \u2588\u255D                \u255A\u2588   \u2588\u2591    ', C.DG), s('\u2591\u2591\u2591\u2593\u2593\u2593', C.DM)],
      [s('  \u2588\u2593\u2593\u2593\u2591\u2591', C.DM), s('  \u2591\u2588\u2580     \u2580\u2588\u2584          \u2584\u2588\u2580     \u2580\u2588\u2591  ', C.DG), s('\u2591\u2591\u2593\u2593\u2593\u2588', C.DM)],
      [s('  \u2593\u2593\u2591\u2591\u2591', C.M), s('  \u2591\u2588         \u2580\u2588\u2588\u2584    \u2584\u2588\u2588\u2580         \u2588\u2591  ', C.DG), s('\u2591\u2591\u2591\u2593\u2593', C.M)],
      [s('  \u2591\u2591\u2591   \u2584\u2588', C.DB), s('\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580', C.DG), s('\u2588\u2584   \u2591\u2591\u2591', C.DB)],
      [s('  \u2591   \u2584\u2588\u2588\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2588\u2588\u2584   \u2591', C.DB)],
    ];
  }

  // ── MAIN MENU HEADER ART: "Battle Stance" (compact) ──
  function getMenuArt() {
    return [
      [s('            ', C.DB), s('\u2591\u2591\u2591\u2591\u2591', C.DB), s(' \u00B7  *  \u00B7 ', C.B), s('\u2591\u2591\u2591\u2591\u2591', C.DB)],
      [s('           ', C.DB), s('\u2591\u2592\u2592\u2592\u2592\u2592\u2591', C.B), s('  \u00B7  ', C.B), s('\u2591\u2592\u2592\u2592\u2592\u2592\u2591', C.B)],
      [s('            \u2584\u2588\u2588\u2588\u2588\u2588\u2584', C.DM), s('   *   \u00B7', C.B)],
      [s('           \u2588\u2592\u2591\u2593\u2593\u2591\u2592\u2588', C.DM), s('    \u00B7', C.B)],
      [s('           \u2588\u2592\u00B7  \u00B7\u2592\u2588', C.G), s('    ', C.B)],
      [s('           \u2588\u2592 \u2500\u2500 \u2592\u2588', C.G)],
      [s('            \u2588\u2592\u2584\u2584\u2592\u2588', C.G)],
      [s('         \u2584\u2584\u2588\u2557    \u2554\u2588\u2584\u2584', C.DB)],
      [s('  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.C), s(' \u2584\u2588\u2550\u2550\u256C\u2560\u2550\u2550\u2550\u2550\u2563\u256C\u2550\u2550\u2588\u2584', C.DB)],
      [s('  \u2551\u2593\u2591\u2593\u2591\u2593\u2591\u2551', C.C), s('\u2588  \u2550\u2550\u256C\u2551\u2588\u2588\u2588\u2588\u2551\u256C\u2550\u2550  \u2588', C.DB)],
      [s('  \u2551\u2591\u2593\u2591\u2593\u2591\u2593\u2551', C.C), s('\u2588   \u2550\u256C\u2551\u2588\u2588\u2588\u2588\u2551\u256C\u2550   \u2588', C.DB)],
      [s('  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.C), s(' \u2588    \u2551\u2551\u2593\u2593\u2593\u2593\u2551\u2551    \u2588', C.DG)],
      [s('            \u2588  \u2554\u255D\u2551    \u2551\u255A\u2557  \u2588', C.DG)],
      [s('           \u2588\u2591\u2554\u255D  \u2568    \u2568  \u255A\u2557\u2591\u2588', C.DG)],
      [s('          \u2588\u2580 \u2580\u2588\u2584        \u2584\u2588\u2580 \u2580\u2588', C.DG)],
      [s('  \u2591\u2591\u2593\u2593\u2593\u2593\u2593\u2593\u2588     \u2580\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2580     \u2588\u2593\u2593\u2593\u2593\u2593\u2593\u2591\u2591', C.DB)],
    ];
  }

  // ── SYSTEM INFO HEADER
  function getSysInfoArt() {
    return [
      [s('          \u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584', C.DG)],
      [s('         \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.DG)],
      [s('         \u2551 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u2551', C.DG), s('  486 DX2-66', C.G)],
      [s('         \u2551 \u2502', C.DG), s(' C:\\>dir /w          ', C.G), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2502', C.DG), s('  COMMAND  COM       ', C.C), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2502', C.DG), s('  AUTOEXEC BAT       ', C.C), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2502', C.DG), s('  CONFIG   SYS       ', C.C), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2502', C.DG), s('  BBS      EXE       ', C.W), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2502', C.DG), s(' C:\\>\u2588                ', C.G), s('\u2502 \u2551', C.DG)],
      [s('         \u2551 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2551', C.DG)],
      [s('         \u2551   \u2022 ', C.DG), s('TRIDENT TVGA 9000i', C.B), s('   \u2551', C.DG)],
      [s('         \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.DG)],
      [s('              \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', C.DG)],
      [s('             \u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571\u2571', C.DG)],
      [s('    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510', C.DG)],
      [s('    \u2502 \u2592 ', C.DG), s('540MB Quantum Fireball', C.G), s('  \u2591\u2591 \u25CB \u2502', C.DG)],
      [s('    \u2502 \u2592 ', C.DG), s('8MB RAM  ', C.G), s('USR 14.4k', C.B), s('  \u2591\u2591 \u25CB \u2502', C.DG)],
      [s('    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518', C.DG)],
      [s('   \u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584', C.DG)],
      [s('   ', C.DG), s('\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591', C.DG)],
    ];
  }

  // ── GOODBYE: "Until Next Time" ──
  function getGoodbyeArt() {
    return [
      [p('')],
      [s('     T H A N K S   F O R   C A L L I N G !', C.M)],
      [p('')],
      [s('            \u00B7    \u00B7    \u00B7    \u00B7    \u00B7', C.B)],
      [s('         \u00B7    \u00B7    \u00B7    \u00B7    \u00B7    \u00B7', C.B)],
      [s('      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', C.DG)],
      [s('                      \u00B7', C.W)],
      [s('                     \u2584\u2588\u2584', C.DM)],
      [s('                    \u2588\u2592\u2591\u2592\u2588', C.G), s('           \u2554\u2550\u2550\u2557', C.DG)],
      [s('                     \u2588\u2592\u2588', C.DB), s('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.DG), s('\u2551\u2592\u2592\u2551', C.M)],
      [s('                    \u2554\u2563\u2560\u2557', C.DB), s('     \u2593\u2591\u2593\u2591\u2593\u2591', C.C), s('\u255A\u2563\u2592\u2592\u2551', C.DG)],
      [s('                    \u2551\u2588\u2588\u2588\u2551', C.DB), s('    \u2591\u2593\u2591\u2593\u2591\u2593\u2591', C.C), s('\u2551\u2550\u2550\u255D', C.DG)],
      [s('                    \u2551   \u2551', C.DG), s('    \u2593\u2591\u2593\u2591\u2593\u2591', C.C), s('\u2554\u255D', C.DG)],
      [s('                   \u2554\u255D   \u255A\u2557', C.DG), s('   \u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.DG)],
      [s('                  \u2571\u2571     \u2572\u2572', C.DG)],
      [s('                \u2584\u2580         \u2580\u2584', C.DG)],
      [s('      \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500 \u2500', C.DG)],
      [s('     \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591', C.DB)],
      [s('     \u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592', C.DG)],
      [s('     \u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593', C.DG)],
      [p('')],
      [s('                 N O   C A R R I E R', C.W)],
    ];
  }

  // ── TITLE BANNER for welcome screen: solid faux-3D graffiti ──
  function getTitleBanner() {
    // "CHARLES" in magenta with dark magenta shadow, "vs", "WORLD" in cyan
    // ~11 lines total (down from 21), solid block letters using ▄▀█ glyphs
    return [
      [s('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', C.B)],
      [s(' \u2584\u2588\u2588\u2588\u2584 \u2588\u2588\u2584\u2588\u2588 \u2584\u2588\u2588\u2588\u2584 \u2588\u2588\u2588\u2588\u2584 \u2588\u2588\u2584   \u2588\u2588\u2588\u2588\u2588 \u2584\u2588\u2588\u2588\u2584', C.M)],
      [s(' \u2588\u2588    \u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2580\u2588\u2588 \u2588\u2588\u2580\u2588\u2588 \u2588\u2588    \u2588\u2588\u2580\u2584\u2584 \u2588\u2588\u2580\u2580\u2580', C.M)],
      [s(' \u2588\u2588\u2584   \u2588\u2588 \u2588\u2588 \u2588\u2588\u2584\u2588\u2588 \u2588\u2588\u2588\u2588\u2580 \u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588  \u2584\u2588\u2588\u2584', C.DM)],
      [s(' \u2580\u2588\u2588\u2588\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580\u2580\u2580\u2580 \u2580\u2580\u2580\u2580\u2580 \u2580\u2588\u2588\u2588\u2580', C.DG)],
      [s('                       ', C.DG), s('vs', C.W)],
      [s('        \u2588   \u2588\u2588 \u2584\u2588\u2588\u2588\u2584 \u2588\u2588\u2588\u2588\u2584 \u2588\u2588\u2584   \u2588\u2588\u2588\u2588\u2584', C.C)],
      [s('        \u2588 \u2584\u2584\u2588\u2588 \u2588\u2588\u2580\u2588\u2588 \u2588\u2588\u2580\u2588\u2588 \u2588\u2588    \u2588\u2588 \u2588\u2588', C.C)],
      [s('        \u2588\u2588\u2580\u2580\u2588\u2588 \u2588\u2588\u2584\u2588\u2588 \u2588\u2588\u2588\u2588\u2580 \u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2584\u2588\u2588', C.DC)],
      [s('        \u2580\u2580  \u2580\u2580 \u2580\u2588\u2588\u2588\u2580 \u2580\u2580 \u2580\u2580 \u2580\u2580\u2580\u2580\u2580 \u2580\u2588\u2588\u2588\u2580', C.DG)],
      [s('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', C.B)],
    ];
  }

  // ── JUSTIFICATION HELPERS ──

  // Sum the visible text length of a line (array of segments)
  function lineLen(line) {
    return line.reduce((n, seg) => n + seg.text.length, 0);
  }

  // Pad all lines in an art block to the width of the longest line,
  // so every line has a flush right edge (left-justified rectangle).
  function normalizeArt(artLines) {
    const maxLen = Math.max(...artLines.map(lineLen));
    return artLines.map(line => {
      const pad = maxLen - lineLen(line);
      return pad > 0 ? [...line, p(' '.repeat(pad))] : [...line];
    });
  }

  // Center an already-normalized art block within screenCols by
  // prepending equal leading spaces to every line.
  function centerArt(artLines, screenCols = 96) {
    const maxLen = Math.max(...artLines.map(lineLen));
    const leftPad = Math.max(0, Math.floor((screenCols - maxLen) / 2));
    if (leftPad === 0) return artLines;
    return artLines.map(line => [p(' '.repeat(leftPad)), ...line]);
  }

  // Normalize + center in one call
  function justifyArt(artLines, screenCols = 96) {
    return centerArt(normalizeArt(artLines), screenCols);
  }

  // Render an art array to the terminal instantly (justified)
  function renderArt(artLines, screenCols = 96) {
    for (const line of justifyArt(artLines, screenCols)) {
      Terminal.writeLine(line);
    }
  }

  // Render art with a line-by-line delay for dramatic effect (justified)
  async function renderArtAnimated(artLines, lineDelay = 30, screenCols = 96) {
    for (const line of justifyArt(artLines, screenCols)) {
      Terminal.writeLine(line);
      await Terminal.delay(lineDelay);
    }
  }

  // ── BOX DRAWING ENGINE ──

  // Character sets for box styles
  const _CHARS = {
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', ml: '╠', mr: '╣', mh: '═' },
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', ml: '├', mr: '┤', mh: '─' },
  };
  const _SHADOW = '░';

  // Box builder factory.
  //
  // Returns an object whose methods each produce one terminal line as a segments[].
  // The caller prepends the centering PAD and passes the result to Terminal.writeLine.
  //
  // opts:
  //   innerWidth  {number}  character columns inside the border walls (default 60)
  //   chars       {string}  'double' | 'single' (default 'double')
  //   hiColor     {string}  lit face: top border + left ║  (default C.G)
  //   loColor     {string}  shadow face: bottom border + right ║  (default C.DG)
  //   midColor    {string}  divider line color (default C.B)
  //   shadow      {boolean} add ░ drop-shadow right column + floor row (default true)
  //   shadowColor {string}  ░ glyph color (default C.DG)
  //
  // Faux-3D illusion: top/left borders rendered in hiColor (bright = "lit"),
  // bottom/right borders in loColor (dim = "in shadow"), plus ░ drop-shadow.
  function Box(opts) {
    opts = opts || {};
    const W           = (opts.innerWidth  !== undefined) ? opts.innerWidth  : 60;
    const charSet     = (opts.chars       !== undefined) ? opts.chars       : 'double';
    const hiColor     = (opts.hiColor     !== undefined) ? opts.hiColor     : C.G;
    const loColor     = (opts.loColor     !== undefined) ? opts.loColor     : C.DG;
    const midColor    = (opts.midColor    !== undefined) ? opts.midColor    : C.B;
    const hasShadow   = (opts.shadow      !== undefined) ? opts.shadow      : true;
    const shadowColor = (opts.shadowColor !== undefined) ? opts.shadowColor : C.DG;

    const ch = (typeof charSet === 'string') ? (_CHARS[charSet] || _CHARS.double) : charSet;
    const sh = hasShadow ? [s(_SHADOW, shadowColor)] : [];

    return {
      // ╔══ TITLE ══╗  (top border, optional centred title)
      top: function(title, titleColor) {
        titleColor = titleColor || C.M;
        if (title) {
          const t   = ' ' + title + ' ';
          const rem = Math.max(0, W - t.length);
          const lw  = Math.floor(rem / 2);
          const rw  = rem - lw;
          return [
            s(ch.tl + ch.h.repeat(lw), hiColor),
            s(t, titleColor),
            s(ch.h.repeat(rw) + ch.tr, hiColor),
          ];
        }
        return [s(ch.tl + ch.h.repeat(W) + ch.tr, hiColor)];
      },

      // ╚══════════╝░  (bottom border + optional shadow glyph)
      bottom: function() {
        return [s(ch.bl + ch.h.repeat(W) + ch.br, loColor), ...sh];
      },

      // ╠══ LABEL ══╣░  (horizontal divider, optional centred label)
      divider: function(label, labelColor) {
        labelColor = labelColor || C.M;
        if (label) {
          const t   = ' ' + label + ' ';
          const rem = Math.max(0, W - t.length);
          const lw  = Math.floor(rem / 2);
          const rw  = rem - lw;
          return [
            s(ch.ml + ch.mh.repeat(lw), hiColor),
            s(t, labelColor),
            s(ch.mh.repeat(rw) + ch.mr, loColor),
            ...sh,
          ];
        }
        return [s(ch.ml, hiColor), s(ch.mh.repeat(W), midColor), s(ch.mr, loColor), ...sh];
      },

      // ║ <content auto-padded to innerWidth> ║░
      // contentSegs: segments[] whose total text length must be ≤ innerWidth.
      // Remaining space is filled with padColor.
      row: function(contentSegs, padColor) {
        padColor = padColor || C.G;
        const used = contentSegs.reduce(function(n, seg) { return n + seg.text.length; }, 0);
        const pad  = Math.max(0, W - used);
        return [
          s(ch.v, hiColor),
          ...contentSegs,
          ...(pad > 0 ? [s(' '.repeat(pad), padColor)] : []),
          s(ch.v, loColor),
          ...sh,
        ];
      },

      // ║                    ║░  (fully empty content row)
      emptyRow: function() { return this.row([]); },

      // Shadow floor: the row of ░ glyphs below the bottom border.
      // Starts 1 column right of the box left edge to create an offset effect.
      shadowFloor: function() {
        return hasShadow ? [s(' ' + _SHADOW.repeat(W + 2), shadowColor)] : [];
      },
    };
  }

  // Word-wrap `text` to fit within `width` characters. Returns string[].
  function wrapText(text, width) {
    const words = (text || '').split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (candidate.length > width) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  // Render an array of segment-line arrays centered on screen.
  // boxWidth = innerWidth + 2 (the two border chars; do not include shadow width).
  function renderLines(lines, boxWidth, screenCols) {
    screenCols = screenCols || SCREEN_COLS;
    const padSeg = p(indent(boxWidth));
    for (const line of lines) {
      Terminal.writeLine([padSeg, ...line]);
    }
  }

  // ── LAYOUT HELPERS ──
  // Higher-level box templates built on Box(). Return segment-line arrays[].

  const Layout = {

    // Key-value info panel.
    // kvRows: [{ key, value, vColor? }]
    // opts: Box opts plus titleColor, keyWidth, footer (same shape as kvRows)
    infoPanel: function(title, kvRows, opts) {
      opts = opts || {};
      const b    = Box(opts);
      const keyW = opts.keyWidth !== undefined
        ? opts.keyWidth
        : Math.max.apply(null, kvRows.map(function(r) { return r.key.length; }));
      const lines = [b.top(title, opts.titleColor)];
      lines.push(b.emptyRow());
      for (let i = 0; i < kvRows.length; i++) {
        const r    = kvRows[i];
        const kStr = (r.key + ':').padEnd(keyW + 2);
        lines.push(b.row([
          s('  ', C.G),
          s(kStr, C.C),
          s(r.value || '', r.vColor || C.G),
        ]));
      }
      lines.push(b.emptyRow());
      if (opts.footer && opts.footer.length) {
        lines.push(b.divider());
        lines.push(b.emptyRow());
        for (let i = 0; i < opts.footer.length; i++) {
          const r    = opts.footer[i];
          const kStr = (r.key + ':').padEnd(keyW + 2);
          lines.push(b.row([
            s('  ', C.G),
            s(kStr, C.C),
            s(r.value || '', r.vColor || C.B),
          ]));
        }
        lines.push(b.emptyRow());
      }
      lines.push(b.bottom());
      lines.push(b.shadowFloor());
      return lines;
    },

    // Word-wrapped text box.
    // paragraphs: string[]  (each is independently word-wrapped)
    // opts: Box opts plus titleColor
    textBox: function(title, paragraphs, opts) {
      opts = opts || {};
      const b     = Box(opts);
      const wrapW = ((opts.innerWidth || 60) - 4);  // 2 leading spaces + 2 border = 4
      const lines = [b.top(title, opts.titleColor)];
      for (let i = 0; i < paragraphs.length; i++) {
        lines.push(b.emptyRow());
        const wrapped = wrapText(paragraphs[i], wrapW);
        for (let j = 0; j < wrapped.length; j++) {
          lines.push(b.row([s('  ' + wrapped[j], C.G)]));
        }
      }
      lines.push(b.emptyRow());
      lines.push(b.bottom());
      lines.push(b.shadowFloor());
      return lines;
    },

    // Centered splash box (no shadow by default).
    // textLines: [{ text, color }]  ('' text emits an empty row)
    // opts: Box opts plus titleColor
    splashBox: function(textLines, opts) {
      opts = Object.assign({ shadow: false }, opts || {});
      const b   = Box(opts);
      const W   = opts.innerWidth || 56;
      const lines = [b.top(opts.title, opts.titleColor)];
      lines.push(b.emptyRow());
      for (let i = 0; i < textLines.length; i++) {
        const tl = textLines[i];
        if (!tl.text) {
          lines.push(b.emptyRow());
        } else {
          const lpad = Math.max(0, Math.floor((W - tl.text.length) / 2));
          lines.push(b.row([s(' '.repeat(lpad) + tl.text, tl.color || C.G)]));
        }
      }
      lines.push(b.emptyRow());
      lines.push(b.bottom());
      return lines;
    },
  };

  return {
    SCREEN_COLS,
    indent,
    C,
    s, p,
    getWelcomeArt,
    getMenuArt,
    getSysInfoArt,
    getGoodbyeArt,
    getTitleBanner,
    renderArt,
    renderArtAnimated,
    Box,
    wrapText,
    renderLines,
    Layout,
  };
})();
