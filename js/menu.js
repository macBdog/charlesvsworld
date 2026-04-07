// menu.js — BBS menu system with keyboard + click navigation
const Menu = (() => {
  const { s, p, C, indent, Box, wrapText, Layout } = Ansi;

  // All boxes: 80-char inner width, centred in the 96-col screen.
  // Box total width = inner(80) + borders(2) = 82.  PAD = indent(82).
  const BOX_W = 80;
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
    wl(b.top('MAIN MENU', C.M));
    wl(b.emptyRow());
    writeMenuItem('G', 'Games',       'Game engines in Python and C++',       () => showGames());
    writeMenuItem('A', 'Apps',        'Useful and not-so useful web apps',    () => showApps());
    writeMenuItem('P', 'Projects',    'Cars, microcontrollers, CNC projects', () => showProjects());
    writeMenuItem('I', 'System Info', 'About the SysOp',                     () => showSysInfo());
    wl(b.emptyRow());
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine([PAD, s('Time Left: 58 min \u2502 ', C.DG), s('Select: ', C.G), s('_', C.W)]);

    Terminal.showCursor();
    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'G') { removeHandler(); showGames(); }
      else if (key === 'A') { removeHandler(); showApps(); }
      else if (key === 'P') { removeHandler(); showProjects(); }
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

    const lang     = repo.language || 'Unknown';
    const stars    = String(repo.stargazers_count);
    const updated  = GitHub.shortDate(repo.updated_at);
    const url      = GitHub.truncate(repo.html_url, 51);
    const homepage = GitHub.getHomepage(repo.name);

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
    if (homepage) {
      wl(b.row([s('  App: ', C.C), s(GitHub.truncate(homepage, 51), C.W)]));
    }
    wl(b.row([s('  Git: ', C.C), s(url, C.B)]));
    wl(b.emptyRow());

    if (homepage) {
      wlClick(b.row([
        s('         >>> ', C.M),
        s('[L] LAUNCH APP', C.W),
        s(' <<<', C.M),
      ]), () => window.open(homepage, '_blank'));
      wl(b.emptyRow());
    }

    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    const opts = [];
    if (homepage) opts.push(s('[L] Launch App   ', C.W));
    opts.push(s('[V] View on GitHub   ', C.C), s('[B] Back   ', C.C), s('[M] Main Menu', C.C));
    Terminal.writeLine([PAD, ...opts]);
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'L' && homepage) window.open(homepage, '_blank');
      else if (key === 'V') window.open(repo.html_url, '_blank');
      else if (key === 'B') { removeHandler(); returnFn(); }
      else if (key === 'M') { removeHandler(); showMainMenu(); }
    });
  }

  // ── Project list) ──
  async function showProjects() {
    Terminal.clear();
    Terminal.hideCursor();

    const projects = await Blog.fetchProjects();

    wl(b.top('PROJECTS', C.M));
    wl(b.row([
      s(' #   ', C.DG),
      s('Project'.padEnd(35), C.C),
      s('Posts', C.B),
    ]));
    wl(b.divider());

    // Support more than 9 items with letter keys (1-9, then a-z)
    const keyFor = (i) => i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9);

    projects.forEach((proj, i) => {
      const key  = keyFor(i);
      const name = GitHub.truncate(proj.name, 35).padEnd(35);
      const cnt  = String(proj.count).padStart(3);

      wlClick(b.row([
        s('  ' + key + '  ', C.W),
        s(name, C.C),
        s(cnt, C.G),
      ]), () => showProjectPosts(proj));
    });

    if (projects.length === 0) {
      wl(b.emptyRow());
      wl(b.row([s('  No projects yet.', C.DG)]));
    }

    wl(b.divider());
    wl(b.row([
      s('[', C.C), s('#', C.W), s('] Open Project     ', C.C),
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
        const k = e.key.toLowerCase();
        let idx = -1;
        if (k >= '1' && k <= '9') idx = parseInt(k) - 1;
        else if (k >= 'a' && k <= 'z') idx = k.charCodeAt(0) - 97 + 9;
        if (idx >= 0 && idx < projects.length) { removeHandler(); showProjectPosts(projects[idx]); }
      }
    });
  }

  // ── PROJECT POSTS ──
  async function showProjectPosts(project) {
    Terminal.clear();
    Terminal.hideCursor();

    const posts = await Blog.fetchPostsByProject(project.slug);

    wl(b.top(project.name.toUpperCase(), C.M));
    wl(b.row([
      s(' #   ', C.DG),
      s('Date         ', C.B),
      s('Title', C.C),
    ]));
    wl(b.divider());

    // Paginate: show up to 20 posts per page
    const PAGE_SIZE = 20;
    let page = 0;
    const totalPages = Math.ceil(posts.length / PAGE_SIZE);

    function renderPage() {
      const start = page * PAGE_SIZE;
      const slice = posts.slice(start, start + PAGE_SIZE);

      // Re-render from the divider down (first render only for now)
      slice.forEach((post, i) => {
        const num  = String(start + i + 1).padStart(2);
        const date = Blog.formatDate(post.date).padEnd(13);
        const title = GitHub.truncate(post.title, BOX_W - 24);

        wlClick(b.row([
          s(' ' + num + '  ', C.W),
          s(date, C.B),
          s(title, C.C),
        ]), () => showPost(post, project));
      });
    }

    renderPage();

    if (posts.length === 0) {
      wl(b.emptyRow());
      wl(b.row([s('  No posts in this project.', C.DG)]));
    }

    wl(b.divider());
    wl(b.row([
      s('[', C.C), s('#', C.W), s('] Read Post     ', C.C),
      s('[', C.C), s('E', C.W), s('] Projects   ', C.C),
      s('[', C.C), s('M', C.W), s('] Main Menu     ', C.C),
      s('[', C.C), s('Q', C.W), s('] Quit', C.C),
    ]));
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');
    if (totalPages > 1) {
      Terminal.writeLine([PAD, s(`Page ${page + 1}/${totalPages}  `, C.DG), s('[N] Next  [P] Prev  ', C.C)]);
    }
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if (key === 'E') { removeHandler(); showProjects(); }
      else if (key === 'M') { removeHandler(); showMainMenu(); }
      else if (key === 'Q') { removeHandler(); showGoodbye(); }
      else if (key === 'N' && page < totalPages - 1) { removeHandler(); page++; showProjectPosts(project); }
      else if (key === 'P' && page > 0) { removeHandler(); page--; showProjectPosts(project); }
      else {
        const num = parseInt(e.key);
        if (!isNaN(num)) {
          const idx = page * PAGE_SIZE + num - 1;
          if (idx >= 0 && idx < posts.length) { removeHandler(); showPost(posts[idx], project); }
        }
      }
    });
  }

  // ── PROJECT POST DETAIL ──
  async function showPost(post, project) {
    Terminal.clear();
    Terminal.hideCursor();

    const { meta, body } = await Blog.fetchPostContent(post.slug);
    const parsed = Blog.parseMarkdown(body);
    const tags = post.tags || meta.tags || [];
    const repo = post.repo || meta.repo || null;
    const repoUrl = repo ? `https://github.com/${GitHub.USERNAME}/${repo}` : null;
    const contentW = BOX_W - 4;

    wl(b.top(post.title.toUpperCase(), C.M));
    wl(b.row([s('  Date: ', C.C), s(Blog.formatDate(post.date), C.G)]));
    if (tags.length) {
      wl(b.row([s('  Tags: ', C.C), s(tags.join(', '), C.B)]));
    }
    if (repo) {
      wl(b.row([s('  Repo: ', C.C), s(repo, C.B)]));
    }
    wl(b.divider());
    wl(b.emptyRow());

    for (const block of parsed) {
      if (block.type === 'h1') continue;
      if (block.type === 'h2') {
        wl(b.emptyRow());
        wl(b.row([s('  >> ' + block.text, C.C)]));
        wl(b.emptyRow());
      } else if (block.type === 'h3') {
        wl(b.row([s('  > ' + block.text, C.C)]));
      } else if (block.type === 'li') {
        for (const ln of wrapText(block.text, contentW)) {
          wl(b.row([s('  ' + ln, C.G)]));
        }
      } else if (block.type === 'img') {
        // Resolve image src relative to the post's content folder
        const imgSrc = block.src.startsWith('http')
          ? block.src
          : `content/${post.slug}/${block.src}`;
        Terminal.writeImage(imgSrc, block.text || block.src, contentW);
      } else if (block.type === 'blank') {
        wl(b.emptyRow());
      } else {
        for (const ln of wrapText(block.text, contentW)) {
          wl(b.row([s('  ' + ln, C.G)]));
        }
      }
    }

    wl(b.emptyRow());
    wl(b.bottom());
    wl(b.shadowFloor());
    Terminal.writeLine('');

    // Navigation: prev/next within project
    const allPosts = project ? await Blog.fetchPostsByProject(project.slug) : [];
    const curIdx = allPosts.findIndex(p => p.slug === post.slug);
    const hasPrev = curIdx > 0;
    const hasNext = curIdx >= 0 && curIdx < allPosts.length - 1;

    const opts = [];
    if (hasPrev) opts.push(s('[P] Prev Post   ', C.C));
    if (hasNext) opts.push(s('[N] Next Post   ', C.C));
    if (repoUrl) opts.push(s('[R] View Repo   ', C.C));
    Terminal.writeLine([PAD, ...opts]);

    const opts2 = [];
    if (project) opts2.push(s('[B] Back to Projects   ', C.C));
    opts2.push(s('[E] Projects   ', C.C), s('[M] Main Menu', C.C));
    Terminal.writeLine([PAD, ...opts2]);
    Terminal.writeLine([PAD, s('Select: ', C.G), s('_', C.W)]);
    Terminal.showCursor();

    setHandler((e) => {
      const key = e.key.toUpperCase();
      if      (key === 'R' && repoUrl) window.open(repoUrl, '_blank');
      else if (key === 'P' && hasPrev) { removeHandler(); showPost(allPosts[curIdx - 1], project); }
      else if (key === 'N' && hasNext) { removeHandler(); showPost(allPosts[curIdx + 1], project); }
      else if (key === 'B' && project) { removeHandler(); showProjectPosts(project); }
      else if (key === 'E') { removeHandler(); showProjects(); }
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
