// blog.js — Load and render blog posts from content/projects/
// Journal format: one post.md per project with ## YYYY-MM-DD HH:MM:SS entry headers.
// Timestamped images (YYYYMMDD_HHMMSS.*) in pics/ are auto-inserted between entries
// based on their filename date falling between two entry timestamps.
const Blog = (() => {
  const BASE = 'content/projects';
  let cachedProjects = null;

  async function fetchProjects() {
    if (cachedProjects) return cachedProjects;
    try {
      const res = await fetch(`${BASE}/projects.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cachedProjects = await res.json();
      return cachedProjects;
    } catch (e) {
      console.error('Blog: failed to load projects.json', e.message);
      return [];
    }
  }

  // Fetch and parse a project's post.md into entry objects, with timestamped
  // pics auto-inserted into each entry's body as markdown image lines.
  async function fetchPostsByProject(projectSlug) {
    try {
      const [postRes, picsRes] = await Promise.all([
        fetch(`${BASE}/${projectSlug}/post.md`),
        fetch(`${BASE}/${projectSlug}/pics/index.json`).catch(() => null),
      ]);
      if (!postRes.ok) throw new Error(`HTTP ${postRes.status}`);
      const raw = await postRes.text();

      const picIndex = (picsRes && picsRes.ok) ? await picsRes.json() : [];
      return parseJournal(projectSlug, raw, picIndex);
    } catch (e) {
      console.error('Blog: failed to load', projectSlug, e.message);
      return [];
    }
  }

  // Parse YYYYMMDD_HHMMSS filename prefix into a comparable date string YYYY-MM-DDTHH:MM:SS
  function parsePicDate(filename) {
    const m = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  }

  // Parse a journal post.md into entry objects with auto-inserted pics, oldest-first.
  function parseJournal(projectSlug, raw, picIndex) {
    const headerRe = /^## (\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)\s*$/gm;
    const headers = [...raw.matchAll(headerRe)];

    // Build sorted list of timestamped pics: { date: 'YYYY-MM-DDTHH:MM:SS', filename }
    const timedPics = picIndex
      .map(f => ({ date: parsePicDate(f), filename: f }))
      .filter(p => p.date !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Normalise an entry timestamp to ISO-like string for comparison
    const toIso = s => s.replace(' ', 'T');

    const entries = headers.map((match, i) => {
      const rawDate = match[1];
      const dateStr = rawDate.slice(0, 10); // YYYY-MM-DD
      const entryIso = toIso(rawDate);
      const nextIso  = i + 1 < headers.length ? toIso(headers[i + 1][1]) : null;

      const start = match.index + match[0].length;
      const end   = i + 1 < headers.length ? headers[i + 1].index : raw.length;
      const body  = raw.slice(start, end).trim();

      // Extract optional ### Title
      const titleMatch = body.match(/^###\s+(.+)/);
      const title    = titleMatch ? titleMatch[1].trim() : dateStr;
      let bodyText   = titleMatch ? body.slice(titleMatch[0].length).trim() : body;

      // Append auto-inserted timestamped pics that fall in [entryIso, nextIso)
      const autoPics = timedPics.filter(p =>
        p.date >= entryIso && (nextIso === null || p.date < nextIso)
      );
      if (autoPics.length > 0) {
        bodyText += '\n\n' + autoPics.map(p => `![](pics/${p.filename})`).join('\n');
      }

      return {
        slug: `${projectSlug}#${i}`,
        projectSlug,
        date: dateStr,
        title,
        body: bodyText,
      };
    });

    return entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Fetch a single entry by slug ("projectSlug#index")
  async function fetchPostContent(slug) {
    const hashIdx = slug.lastIndexOf('#');
    const projectSlug = hashIdx >= 0 ? slug.slice(0, hashIdx) : slug;
    const entries = await fetchPostsByProject(projectSlug);
    const entry = entries.find(e => e.slug === slug) || entries[0];
    if (!entry) return { meta: {}, body: 'Post not found.' };
    return { meta: { title: entry.title, date: entry.date }, body: entry.body };
  }

  // Simple markdown-to-segments parser for BBS display
  function parseMarkdown(md) {
    const lines = md.split('\n');
    const result = [];
    for (const line of lines) {
      if (line.startsWith('## ')) {
        result.push({ type: 'h2', text: line.slice(3) });
      } else if (line.startsWith('### ')) {
        result.push({ type: 'h3', text: line.slice(4) });
      } else if (line.startsWith('# ')) {
        result.push({ type: 'h1', text: line.slice(2) });
      } else if (/^\d+\.\s/.test(line)) {
        result.push({ type: 'li', text: line });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push({ type: 'li', text: line });
      } else if (/^!\[.*\]\(.*\)/.test(line)) {
        const alt = line.match(/!\[(.*?)\]/)[1];
        const src = line.match(/\((.*?)\)/)[1];
        result.push({ type: 'img', text: alt, src });
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
    fetchProjects,
    fetchPostsByProject,
    fetchPostContent,
    parseMarkdown,
    formatDate,
  };
})();
