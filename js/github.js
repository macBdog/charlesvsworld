// github.js — GitHub API repo fetching with caching and fallback
const GitHub = (() => {
  const USERNAME = 'macBdog';
  const API_URL = `https://api.github.com/users/${USERNAME}/repos?type=public&sort=updated&per_page=30`;
  const CACHE_KEY = 'cvw_repos';

  // Hardcoded fallback if API fails (rate limit, offline, etc.)
  const FALLBACK_REPOS = [   
    { name: 'midimaster', description: 'A rhythm game written in Python that uses musical score notation for display.', language: 'Python', html_url: 'https://github.com/macBdog/midimaster', stargazers_count: 0, updated_at: '2025-01-01' },
    { name: 'gamejam', description: 'A Python and OpenGL game jamming framework.', language: 'Python', html_url: 'https://github.com/macBdog/gamejam', stargazers_count: 0, updated_at: '2025-01-01' },
    { name: 'brownish-bomber', description: 'The Brownish Bomber boxing workout generator webapp', language: 'HTML', html_url: 'https://github.com/macBdog/brownish-bomber', stargazers_count: 0, updated_at: '2025-01-01' },
    { name: 'galagus', description: 'A space shooter with a 3D viewpoint written in LUA for my gamejam engine.', language: 'Lua', html_url: 'https://github.com/macBdog/galagus', stargazers_count: 0, updated_at: '2025-01-01' },
    { name: 'game', description: 'Game project', language: 'C++', html_url: 'https://github.com/macBdog/game', stargazers_count: 0, updated_at: '2025-01-01' },
  ];

  async function fetchRepos() {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* fall through */ }
    }

    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const repos = data.map(r => ({
        name: r.name,
        description: r.description || 'No description',
        language: r.language || 'N/A',
        html_url: r.html_url,
        stargazers_count: r.stargazers_count || 0,
        updated_at: r.updated_at || ''
      }));
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(repos));
      return repos;
    } catch (e) {
      return FALLBACK_REPOS;
    }
  }

  // Abbreviate language names for tight column display
  function shortLang(lang) {
    const map = {
      'JavaScript': 'JS', 'TypeScript': 'TS', 'Python': 'Py',
      'C++': 'C++', 'C#': 'C#', 'HTML': 'HTML', 'Lua': 'Lua',
      'Ruby': 'Rb', 'Rust': 'Rs', 'Go': 'Go', 'Java': 'Java',
      'Shell': 'Sh', 'N/A': '-'
    };
    return map[lang] || lang.substring(0, 4);
  }

  // Truncate string to max length with ellipsis
  function truncate(str, max) {
    return str.length > max ? str.substring(0, max - 2) + '..' : str;
  }

  // Format a date string to BBS-style short date
  function shortDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // Live app URLs for repos that have a hosted version
  const HOMEPAGES = {
    'brownish-bomber': 'https://henden.com.au/brownish-bomber/'
  };

  function getHomepage(repoName) {
    return HOMEPAGES[repoName] || null;
  }

  // Repos classified as games (by name)
  const GAME_REPOS = new Set([
    'midimaster', 'gamejam', 'galagus', 'game', 'jump-buggy'
  ]);

  // Repos classified as apps (by name)
  const APP_REPOS = new Set([
    'brownish-bomber'
  ]);

  function filterGames(repos) {
    return repos.filter(r => GAME_REPOS.has(r.name));
  }

  function filterApps(repos) {
    return repos.filter(r => APP_REPOS.has(r.name));
  }

  return {
    USERNAME,
    fetchRepos,
    filterGames,
    filterApps,
    getHomepage,
    shortLang,
    truncate,
    shortDate
  };
})();
