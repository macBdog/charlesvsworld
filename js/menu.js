// menu.js — BBS menu system with keyboard + click navigation
const Menu = (() => {
  const { s, p, C } = Ansi;
  let currentHandler = null;

  function removeHandler() {
    if (currentHandler) {
      document.removeEventListener('keydown', currentHandler);
      currentHandler = null;
    }
  }

  function setHandler(fn) {
    removeHandler();
    currentHandler = fn;
    document.addEventListener('keydown', currentHandler);
  }

  // ── MAIN MENU ──
  async function showMainMenu() {
    Terminal.clear();
    Terminal.hideCursor();

    // Draw character art on the left side
    const art = Ansi.getMenuArt();
    await Ansi.renderArtAnimated(art, 20);

    Terminal.writeLine('');

    // Menu box to the right — rendered below the art for terminal simplicity
    Terminal.writeLine([s('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('         CHARLES vs WORLD \u2014 MAIN MENU', C.M), s('                       \u2551', C.B)]);
    Terminal.writeLine([s('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);

    // Menu items as clickable spans
    writeMenuItem('F', 'File Areas', 'Browse Projects', () => showFileAreas());
    writeMenuItem('B', 'Bulletin Board', 'Latest Updates', () => showBulletin());
    writeMenuItem('I', 'System Info', 'About the SysOp', () => showSysInfo());
    writeMenuItem('G', 'Goodbye', 'Logoff', () => showGoodbye());

    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.B)]);
    Terminal.writeLine([s('  Time Left: 58 min \u2502 ', C.DG), s('Select: ', C.G), s('_', C.W)]);

    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'F') { removeHandler(); showFileAreas(); }
      else if (key === 'B') { removeHandler(); showBulletin(); }
      else if (key === 'I') { removeHandler(); showSysInfo(); }
      else if (key === 'G') { removeHandler(); showGoodbye(); }
    });
  }

  function writeMenuItem(key, label, desc, onClick) {
    const el = Terminal.element;
    const line = document.createElement('span');

    const border1 = document.createElement('span');
    border1.className = 'fg-blue';
    border1.textContent = '\u2551  ';
    line.appendChild(border1);

    const item = document.createElement('span');
    item.className = 'menu-item fg-cyan';
    item.textContent = `[${key}] ${label}`;
    item.addEventListener('click', (e) => { e.stopPropagation(); removeHandler(); onClick(); });
    line.appendChild(item);

    const descSpan = document.createElement('span');
    descSpan.className = 'fg-light-gray';
    const pad = 24 - label.length - key.length;
    descSpan.textContent = ' '.repeat(Math.max(1, pad)) + '- ' + desc;
    line.appendChild(descSpan);

    const padEnd = 60 - 5 - label.length - Math.max(1, pad) - 2 - desc.length;
    const endPad = document.createElement('span');
    endPad.textContent = ' '.repeat(Math.max(1, padEnd));
    line.appendChild(endPad);

    const border2 = document.createElement('span');
    border2.className = 'fg-blue';
    border2.textContent = '\u2551';
    line.appendChild(border2);

    el.appendChild(line);
    el.appendChild(document.createTextNode('\n'));
  }

  // ── FILE AREAS ──
  async function showFileAreas() {
    Terminal.clear();
    Terminal.hideCursor();

    const art = Ansi.getFileAreasArt();
    await Ansi.renderArtAnimated(art, 15);
    Terminal.writeLine('');

    Terminal.writeLine([s('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 ', C.B), s('FILE AREAS', C.M), s(' \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550', C.B)]);
    Terminal.writeLine([s(' #  ', C.W), s('Area Name                ', C.C), s('Lang   ', C.B), s('Description', C.G)]);
    Terminal.writeLine([s('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', C.DG)]);

    const repos = await GitHub.fetchRepos();

    repos.forEach((repo, i) => {
      const num = String(i + 1).padStart(2, ' ');
      const name = GitHub.truncate(repo.name, 24).padEnd(24, ' ');
      const lang = GitHub.shortLang(repo.language).padEnd(6, ' ');
      const desc = GitHub.truncate(repo.description, 24);
      writeFileItem(num, name, lang, desc, repo);
    });

    Terminal.writeLine([s('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', C.DG)]);
    Terminal.writeLine([s(' [#] View Details  ', C.C), s('[M] Main Menu  ', C.C), s('[Q] Quit', C.C)]);
    Terminal.writeLine([s(' Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
      else {
        const num = parseInt(e.key);
        if (num >= 1 && num <= repos.length) {
          removeHandler();
          showRepoDetail(repos[num - 1]);
        }
      }
    });
  }

  function writeFileItem(num, name, lang, desc, repo) {
    const el = Terminal.element;
    const line = document.createElement('span');
    line.className = 'menu-item';

    const numSpan = document.createElement('span');
    numSpan.className = 'fg-white';
    numSpan.textContent = ` ${num}  `;
    line.appendChild(numSpan);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'fg-cyan';
    nameSpan.textContent = name;
    line.appendChild(nameSpan);

    const langSpan = document.createElement('span');
    langSpan.className = 'fg-blue';
    langSpan.textContent = lang + ' ';
    line.appendChild(langSpan);

    const descSpan = document.createElement('span');
    descSpan.className = 'fg-light-gray';
    descSpan.textContent = desc;
    line.appendChild(descSpan);

    line.addEventListener('click', (e) => { e.stopPropagation(); removeHandler(); showRepoDetail(repo); });

    el.appendChild(line);
    el.appendChild(document.createTextNode('\n'));
  }

  // ── REPO DETAIL VIEW ──
  async function showRepoDetail(repo) {
    Terminal.clear();
    Terminal.hideCursor();

    Terminal.writeLine([s('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('FILE DETAIL', C.M), s('                                                 \u2551', C.B)]);
    Terminal.writeLine([s('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Name     : ', C.C), s(GitHub.truncate(repo.name, 46).padEnd(46), C.W), s(' \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Language : ', C.C), s(repo.language.padEnd(46), C.G), s(' \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Stars    : ', C.C), s(String(repo.stargazers_count).padEnd(46), C.G), s(' \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Updated  : ', C.C), s(GitHub.shortDate(repo.updated_at).padEnd(46), C.G), s(' \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Description:', C.C), s('                                               \u2551', C.B)]);

    // Word wrap description to fit
    const maxW = 56;
    const words = repo.description.split(' ');
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > maxW) {
        Terminal.writeLine([s('\u2551  ', C.B), s(line.padEnd(58), C.G), s('\u2551', C.B)]);
        line = word;
      } else {
        line = (line + ' ' + word).trim();
      }
    }
    if (line) {
      Terminal.writeLine([s('\u2551  ', C.B), s(line.padEnd(58), C.G), s('\u2551', C.B)]);
    }

    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('URL: ', C.C), s(GitHub.truncate(repo.html_url, 53).padEnd(53), C.B), s(' \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.B)]);
    Terminal.writeLine('');
    Terminal.writeLine([s('  [V] Open in Browser  ', C.C), s('[F] Back to Files  ', C.C), s('[M] Main Menu', C.C)]);
    Terminal.writeLine([s('  Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'V') { window.open(repo.html_url, '_blank'); }
      else if (key === 'F') { removeHandler(); showFileAreas(); }
      else if (key === 'M') { removeHandler(); showMainMenu(); }
    });
  }

  // ── BULLETIN BOARD ──
  async function showBulletin() {
    Terminal.clear();
    Terminal.hideCursor();

    const art = Ansi.getBulletinArt();
    await Ansi.renderArtAnimated(art, 20);
    Terminal.writeLine('');

    Terminal.writeLine([s('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('BULLETIN BOARD', C.M), s('                                              \u2551', C.B)]);
    Terminal.writeLine([s('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('>> Message of the Day', C.C), s('                                       \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Welcome to Charles vs World BBS!', C.G), s('                            \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('The SysOp has been busy crafting games, tools and', C.G), s('          \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('bizarre contraptions. Check the File Areas for the', C.G), s('         \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('latest projects, or browse System Info to learn more', C.G), s('        \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('about the hardware powering this fine establishment.', C.G), s('        \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Remember: keyboard, soldering iron, wrench.', C.M), s('                \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('The three tools of the Technomancer.', C.M), s('                        \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('                            - macBdog, SysOp', C.DG), s('              \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.B)]);
    Terminal.writeLine('');
    Terminal.writeLine([s('  [M] Main Menu  ', C.C), s('[Q] Quit', C.C)]);
    Terminal.writeLine([s('  Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
    });
  }

  // ── SYSTEM INFO ──
  async function showSysInfo() {
    Terminal.clear();
    Terminal.hideCursor();

    const art = Ansi.getSysInfoArt();
    await Ansi.renderArtAnimated(art, 20);
    Terminal.writeLine('');

    Terminal.writeLine([s('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('SYSTEM INFORMATION', C.M), s('                                          \u2551', C.B)]);
    Terminal.writeLine([s('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('SysOp   : ', C.C), s('macBdog', C.W), s('                                           \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('System  : ', C.C), s('486 DX2-66MHz', C.G), s('                                     \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Memory  : ', C.C), s('8MB RAM (4x 30-pin SIMMs)', C.G), s('                           \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Modem   : ', C.C), s('USR Sportster 14.4k', C.G), s('                                 \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('OS      : ', C.C), s('MS-DOS 6.22 + DESQview', C.G), s('                              \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('BBS SW  : ', C.C), s('RemoteAccess 2.62', C.G), s('                                   \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Storage : ', C.C), s('540MB Quantum Fireball', C.G), s('                              \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Video   : ', C.C), s('Trident TVGA 9000i (512KB)', C.G), s('                          \u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('Uptime  : ', C.C), s('\u221E hrs and counting...', C.G), s('                              \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u2551  ', C.B), s('GitHub  : ', C.C), s('github.com/macBdog', C.B), s('                                  \u2551', C.B)]);
    Terminal.writeLine([s('\u2551', C.B), s('                                                            ', C.G), s('\u2551', C.B)]);
    Terminal.writeLine([s('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', C.B)]);
    Terminal.writeLine('');
    Terminal.writeLine([s('  [M] Main Menu  ', C.C), s('[Q] Quit', C.C)]);
    Terminal.writeLine([s('  Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
    });
  }

  // ── GOODBYE ──
  async function showGoodbye() {
    Terminal.clear();
    Terminal.hideCursor();
    removeHandler();

    const art = Ansi.getGoodbyeArt();
    await Ansi.renderArtAnimated(art, 60);

    // NO CARRIER blinks, then freeze
    await Terminal.delay(2000);
  }

  return {
    showMainMenu,
    showFileAreas,
    showBulletin,
    showSysInfo,
    showGoodbye
  };
})();
