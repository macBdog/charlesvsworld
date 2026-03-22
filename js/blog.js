// blog.js — Load and render engineering blog posts from content/engineering/
const Blog = (() => {
  const MANIFEST = 'content/engineering/posts.json';
  let cachedPosts = null;

  async function fetchPosts() {
    if (cachedPosts) return cachedPosts;
    try {
      const res = await fetch(MANIFEST);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cachedPosts = await res.json();
      // Sort newest first
      cachedPosts.sort((a, b) => b.date.localeCompare(a.date));
      return cachedPosts;
    } catch (e) {
      return [];
    }
  }

  async function fetchPostContent(slug) {
    try {
      const res = await fetch(`content/engineering/${slug}/index.md`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      return 'Error loading post content.';
    }
  }

  // Simple markdown-to-segments parser for BBS display
  // Returns an array of { type, text } objects
  function parseMarkdown(md) {
    const lines = md.split('\n');
    const result = [];
    for (const line of lines) {
      if (line.startsWith('# ')) {
        result.push({ type: 'h1', text: line.slice(2) });
      } else if (line.startsWith('## ')) {
        result.push({ type: 'h2', text: line.slice(3) });
      } else if (/^\d+\.\s/.test(line)) {
        result.push({ type: 'li', text: line });
      } else if (line.startsWith('- ')) {
        result.push({ type: 'li', text: line });
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
    fetchPostContent,
    parseMarkdown,
    formatDate
  };
})();
