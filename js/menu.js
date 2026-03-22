// menu.js — BBS menu system with keyboard + click navigation
const Menu = (() => {
  const { s, p, C, indent, Box, wrapText, Layout } = Ansi;

  // All boxes: 60-char inner width, centred in the 96-col screen.
  // Box total width = inner(60) + borders(2) = 62.  PAD = indent(62).
  const BOX_W = 60;
  const b     = Box({ innerWidth: BOX_W });
  const PAD   = p(indent(BOX_W + 2));

  // Render a normal (non-clickable) box line centred on screen
  function wl(segs) {
    Terminal.writeLine([PAD, ...segs]);
  }

  // Render a clickable box line (full row including borders)
  function wlClick(rowSegs, onClick) {
    Terminal.writeClickLine([PAD, ...rowSegs], onClick);
  }

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

  // ── Wider box for repo listings ──
  const FA_W  = 80;
  const fb    = Box({ innerWidth: FA_W });
  const FPAD  = p(indent(FA_W + 2));

  function fwl(segs) { Terminal.writeLine([FPAD, ...segs]); }
  function fwlClick(rowSegs, onClick) { Terminal.writeClickLine([FPAD, ...rowSegs], onClick); }

  // ── MAIN MENU ──
  const LABEL_W = 14;
  const DESC_W  = 34;

  function writeMenuItem(key, label, desc, onClick) {
    wlClick(b.row([
      s('  [', C.B),
      s(key, C.W),
      s('] ', C.B),
      s(label.padEnd(LABEL_W), C.C),
      s('  \u2502  ', C.DG),
      s(desc.padEnd(DESC_W), C.G),
    ]), onClick);
  }

  async function showMainMenu() {
    Terminal.clear();
    Terminal.hideCursor();

    await Ansi.renderArtAnimated(Ansi.getTitleBanner(), 25);

    Terminal.writeLine([PAD, s('SysOp: ', C.C), s('macBdog', C.W), s('  \u2502  ', C.DG), s('Node 1', C.G), s('  \u2502  ', C.DG), s('14400 bps', C.G), s('  \u2502  ', C.DG), s('ANSI Detected', C.C)]);
    Terminal.writeLine([PAD, s('"Workshop dwellers unite!"', C.DG)]);
    Terminal.writeLine('');

    wl(b.top('MAIN MENU', C.M));
    wl(b.emptyRow());
    writeMenuItem('G', 'Games',       'Game engines in Python and C++',       () => showGames());
    writeMenuItem('A', 'Apps',        'Useful and not-so useful web apps',    () => showApps());
    writeMenuItem('E', 'Engineering', 'Cars, microcontrollers, CNC projects', () => showProjects());
    writeMenuItem('I', 'System Info', 'About the SysOp',                     () => showSysInfo());
    writeMenuItem('Q', 'Goodbye',     'Logoff',                              () => showGoodbye());
    wl(b.emptyRow());
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    Terminal.writeLine([PAD, s('Time Left: 58 min \u2502 ', C.DG), s('Select: ', C.G), s('_', C.W)]);

    Terminal.showCursor();
    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'G') { removeHandler(); showGames(); }
      else if (key === 'A') { removeHandler(); showApps(); }
      else if (key === 'E') { removeHandler(); showProjects(); }
      else if (key === 'I') { removeHandler(); showSysInfo(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
    });
  }

  // ── GAMES (filtered repo list) ──
  async function showGames() {
    const repos = await GitHub.fetchRepos();
    const games = GitHub.filterGames(repos);
    showRepoList('GAMES', games, showGames);
  }

  // ── APPS (filtered repo list) ──
  async function showApps() {
    const repos = await GitHub.fetchRepos();
    const apps = GitHub.filterApps(repos);
    showRepoList('APPS', apps, showApps);
  }

  // ── Shared repo list renderer ──
  function showRepoList(title, repos, returnFn) {
    Terminal.clear();
    Terminal.hideCursor();

    fwl(fb.top(title, C.M));
    fwl(fb.row([
      s(' #   ', C.DG),
      s('Area Name' + ' '.repeat(24), C.C),
      s('Lang   ', C.B),
      s('Description', C.G),
    ]));
    fwl(fb.divider());

    repos.forEach((repo, i) => writeFileItem(i, repo, returnFn));

    fwl(fb.divider());
    fwl(fb.row([
      s('[', C.C), s('#', C.W), s('] View Details     ', C.C),
      s('[', C.C), s('M', C.W), s('] Main Menu     ', C.C),
      s('[', C.C), s('Q', C.W), s('] Quit', C.C),
    ]));
    fwl(fb.bottom());
    fwl(fb.shadowFloor());
    Terminal.writeLine('');
    Terminal.writeLine([FPAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
      else {
        const num = parseInt(e.key);
        if (num >= 1 && num <= repos.length) { removeHandler(); showRepoDetail(repos[num - 1], returnFn); }
      }
    });
  }

  function writeFileItem(i, repo, returnFn) {
    const num  = String(i + 1).padStart(2);
    const name = GitHub.truncate(repo.name, 33).padEnd(33);
    const lang = GitHub.shortLang(repo.language).padEnd(6);
    const desc = GitHub.truncate(repo.description || '', 34);

    fwlClick(fb.row([
      s(' ' + num + '  ', C.W),
      s(name, C.C),
      s(lang + ' ', C.B),
      s(desc, C.G),
    ]), () => showRepoDetail(repo, returnFn));
  }

  // ── REPO DETAIL VIEW ──
  function showRepoDetail(repo, returnFn) {
    Terminal.clear();
    Terminal.hideCursor();

    const lang    = repo.language || 'Unknown';
    const stars   = String(repo.stargazers_count);
    const updated = GitHub.shortDate(repo.updated_at);
    const url     = GitHub.truncate(repo.html_url, 51);

    wl(b.top('FILE DETAIL', C.M));
    wl(b.emptyRow());
    wl(b.row([s('  Name     : ', C.C), s(GitHub.truncate(repo.name, 45), C.W)]));
    wl(b.row([s('  Language : ', C.C), s(lang, C.G)]));
    wl(b.row([s('  Stars    : ', C.C), s(stars, C.G)]));
    wl(b.row([s('  Updated  : ', C.C), s(updated, C.G)]));
    wl(b.emptyRow());
    wl(b.divider('Description', C.C));
    wl(b.emptyRow());

    for (const ln of wrapText(repo.description || '', 56)) {
      wl(b.row([s('  ' + ln, C.G)]));
    }

    wl(b.emptyRow());
    wl(b.divider());
    wl(b.row([s('  URL: ', C.C), s(url, C.B)]));
    wl(b.emptyRow());
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    Terminal.writeLine([PAD, s('[V] Open in Browser   ', C.C), s('[B] Back   ', C.C), s('[M] Main Menu', C.C)]);
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'V') window.open(repo.html_url, '_blank');
      else if (key === 'B') { removeHandler(); returnFn(); }
      else if (key === 'M') { removeHandler(); showMainMenu(); }
    });
  }

  // ── ENGINEERING (blog-style post list) ──
  async function showProjects() {
    Terminal.clear();
    Terminal.hideCursor();

    const posts = await Blog.fetchPosts();

    wl(b.top('ENGINEERING', C.M));
    wl(b.row([
      s(' #   ', C.DG),
      s('Date         ', C.B),
      s('Title', C.C),
    ]));
    wl(b.divider());

    posts.forEach((post, i) => {
      const num  = String(i + 1).padStart(2);
      const date = Blog.formatDate(post.date).padEnd(13);
      const title = GitHub.truncate(post.title, 38);

      wlClick(b.row([
        s(' ' + num + '  ', C.W),
        s(date, C.B),
        s(title, C.C),
      ]), () => showPost(post));
    });

    if (posts.length === 0) {
      wl(b.emptyRow());
      wl(b.row([s('  No posts yet.', C.DG)]));
    }

    wl(b.divider());
    wl(b.row([
      s('[', C.C), s('#', C.W), s('] Read Post     ', C.C),
      s('[', C.C), s('M', C.W), s('] Main Menu     ', C.C),
      s('[', C.C), s('Q', C.W), s('] Quit', C.C),
    ]));
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
      else {
        const num = parseInt(e.key);
        if (num >= 1 && num <= posts.length) { removeHandler(); showPost(posts[num - 1]); }
      }
    });
  }

  // ── ENGINEERING POST DETAIL ──
  async function showPost(post) {
    Terminal.clear();
    Terminal.hideCursor();

    const md = await Blog.fetchPostContent(post.slug);
    const parsed = Blog.parseMarkdown(md);

    wl(b.top(post.title.toUpperCase(), C.M));
    wl(b.row([s('  Date: ', C.C), s(Blog.formatDate(post.date), C.G)]));
    wl(b.divider());
    wl(b.emptyRow());

    for (const block of parsed) {
      if (block.type === 'h1') continue; // title already in box header
      if (block.type === 'h2') {
        wl(b.emptyRow());
        wl(b.row([s('  >> ' + block.text, C.C)]));
        wl(b.emptyRow());
      } else if (block.type === 'li') {
        for (const ln of wrapText(block.text, 54)) {
          wl(b.row([s('  ' + ln, C.G)]));
        }
      } else if (block.type === 'blank') {
        wl(b.emptyRow());
      } else {
        for (const ln of wrapText(block.text, 54)) {
          wl(b.row([s('  ' + ln, C.G)]));
        }
      }
    }

    wl(b.emptyRow());
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    Terminal.writeLine([PAD, s('[E] Back to Engineering   ', C.C), s('[M] Main Menu', C.C)]);
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'E') { removeHandler(); showProjects(); }
      else if (key === 'M') { removeHandler(); showMainMenu(); }
    });
  }

  // ── SYSTEM INFO ──
  async function showSysInfo() {
    Terminal.clear();
    Terminal.hideCursor();

    await Ansi.renderArtAnimated(Ansi.getSysInfoArt(), 20);
    Terminal.writeLine('');

    const sysLines = Layout.infoPanel('SYSTEM INFORMATION', [
      { key: 'SysOp',   value: 'macBdog' },
      { key: 'System',  value: '486 DX2-66MHz' },
      { key: 'Memory',  value: '8MB RAM (4x 30-pin SIMMs)' },
      { key: 'Modem',   value: 'USR Sportster 14.4k' },
      { key: 'OS',      value: 'MS-DOS 6.22 + DESQview' },
      { key: 'BBS SW',  value: 'RemoteAccess 2.62' },
      { key: 'Storage', value: '540MB Quantum Fireball' },
      { key: 'Video',   value: 'Trident TVGA 9000i (512KB)' },
      { key: 'Uptime',  value: '\u221E hrs and counting...' },
    ], {
      innerWidth: BOX_W,
      titleColor: C.M,
      footer: [{ key: 'GitHub', value: 'github.com/macBdog', vColor: C.B }],
    });
    for (const line of sysLines) wl(line);

    Terminal.writeLine('');
    Terminal.writeLine([PAD, s('[M] Main Menu  ', C.C), s('[Q] Quit', C.C)]);
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
    });
  }

  // ── GOODBYE ──
  async function showGoodbye() {
    Terminal.clear();
    Terminal.hideCursor();
    removeHandler();
    await Ansi.renderArtAnimated(Ansi.getGoodbyeArt(), 60);
    await Terminal.delay(2000);
  }

  return { showMainMenu, showGames, showApps, showProjects, showSysInfo, showGoodbye };
})();
