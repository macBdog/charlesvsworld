// blog.js — Load and render engineering blog posts from content/engineering/
const Blog = (() => {
  const BASE = 'content/engineering';
  let cachedPosts = null;
  let cachedProjects = null;

  async function fetchPosts() {
    if (cachedPosts) return cachedPosts;
    try {
      const res = await fetch(`${BASE}/posts.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cachedPosts = await res.json();
      cachedPosts.sort((a, b) => b.date.localeCompare(a.date));
      return cachedPosts;
    } catch (e) {
      return [];
    }
  }

  async function fetchProjects() {
    if (cachedProjects) return cachedProjects;
    try {
      const res = await fetch(`${BASE}/projects.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cachedProjects = await res.json();
      return cachedProjects;
    } catch (e) {
      return [];
    }
  }

  // Get posts filtered by project slug
  async function fetchPostsByProject(projectSlug) {
    const posts = await fetchPosts();
    return posts.filter(p => p.project === projectSlug);
  }

  // Fetch post content — slug is "project/post-slug"
  async function fetchPostContent(slug) {
    const url = `${BASE}/${slug}/post.md`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const raw = await res.text();
      const result = parseFrontmatter(raw);
      if (!result.body && !raw) throw new Error('Empty response');
      return result;
    } catch (e) {
      console.error('Blog fetch error:', e.message, 'URL:', url);
      return { meta: {}, body: `Error loading post: ${e.message}` };
    }
  }

  // Parse YAML frontmatter delimited by --- lines
  function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    for (const line of match[1].split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim();
      let val = line.slice(colon + 1).trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(s => s.trim());
      } else if (val.startsWith('"') && val.endsWith('"')) {
        // Strip surrounding quotes
        val = val.slice(1, -1).replace(/\\"/g, '"');
      }
      meta[key] = val;
    }
    return { meta, body: match[2] };
  }

  // Simple markdown-to-segments parser for BBS display
  function parseMarkdown(md) {
    const lines = md.split('\n');
    const result = [];
    for (const line of lines) {
      if (line.startsWith('# ')) {
        result.push({ type: 'h1', text: line.slice(2) });
      } else if (line.startsWith('## ')) {
        result.push({ type: 'h2', text: line.slice(3) });
      } else if (line.startsWith('### ')) {
        result.push({ type: 'h3', text: line.slice(4) });
      } else if (/^\d+\.\s/.test(line)) {
        result.push({ type: 'li', text: line });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push({ type: 'li', text: line });
      } else if (/^!\[.*\]\(.*\)/.test(line)) {
        const alt = line.match(/!\[(.*?)\]/)[1];
        const src = line.match(/\((.*?)\)/)[1];
        result.push({ type: 'img', text: alt, src: src });
      } else if (line.trim() === '') {
        result.push({ type: 'blank', text: '' });
      } else {
        result.push({ type: 'p', text: line });
      }
    }
    return result;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  return {
    fetchPosts,
    fetchProjects,
    fetchPostsByProject,
    fetchPostContent,
    parseFrontmatter,
    parseMarkdown,
    formatDate
  };
})();
