#!/usr/bin/env node
// convert-drupal.js — Extract blog posts from Drupal SQL dump and convert to blog format
const fs = require('fs');
const path = require('path');

const SQL_FILE = 'C:/Projects/backup-8.2.2023_15-44-53_mxepezvy/backup-8.2.2023_15-44-53_mxepezvy/mysql/blog.sql';
const FILES_DIR = 'C:/Projects/backup-8.2.2023_15-44-53_mxepezvy/backup-8.2.2023_15-44-53_mxepezvy/homedir/subdomains/charles/httpdocs/sites/default/files';
const UPLOAD_DIR = 'C:/Projects/backup-8.2.2023_15-44-53_mxepezvy/backup-8.2.2023_15-44-53_mxepezvy/homedir/subdomains/charles/httpdocs/upload';
const OUT_DIR = 'C:/Projects/charlesvsworld/content/engineering';

// Project groupings — map node IDs to project slugs
const PROJECT_MAP = {
  // 1979 Porsche 924 Turbo build
  '1979-porsche-924-turbo': [5,6,8,9,11,12,13,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,3,4,30,42,43,44,45,46,47,48,49,33,35,36,110,114,164,152],
  // Workshop build
  'workshop': [149,150,54,64,14],
  // Off road device
  'off-road-device': [51,53],
  // Gaming and game dev
  'gaming': [39,40,52,66,108,141,148,153,50,7],
  // San Francisco life
  'san-francisco': [67,73,75,77,78,79,81,82,83,85,87,89,90,91,92,95,97,99,101,103,105,107,112,120],
  // 2013 US Road Trip
  'road-trip-2013': [122,124,126,128,130,132,134,135],
  // Australia
  'australia': [31,32,34,116,138,139,140,143,145],
  // Speakers
  'speakers': [41],
  // Wedding
  'wedding': [163],
  // CNC
  'cnc-table': [61],
  // 924 racecar
  '924-v8-racecar': [65],
};

// Reverse map: nid -> project
const NID_TO_PROJECT = {};
for (const [project, nids] of Object.entries(PROJECT_MAP)) {
  for (const nid of nids) NID_TO_PROJECT[nid] = project;
}

// Project display names
const PROJECT_NAMES = {
  '1979-porsche-924-turbo': '1979 Porsche 924 Turbo',
  'workshop': 'Workshop',
  'off-road-device': 'Off Road Device',
  'gaming': 'Gaming & Game Dev',
  'san-francisco': 'San Francisco',
  'road-trip-2013': '2013 US Road Trip',
  'australia': 'Australia',
  'speakers': 'Full Range Speakers',
  'wedding': 'Wedding',
  'cnc-table': 'CNC Table',
  '924-v8-racecar': '924 V8 Racecar',
};

// ── SQL Parsing helpers ──

// Parse a MySQL INSERT VALUES(...),(...) into array of arrays
// Handles escaped quotes, nested parens, etc.
function parseInsertValues(sql) {
  const rows = [];
  // Find the VALUES part
  const valIdx = sql.indexOf('VALUES ');
  if (valIdx === -1) return rows;
  let pos = valIdx + 7;

  while (pos < sql.length) {
    // Find opening paren
    while (pos < sql.length && sql[pos] !== '(') pos++;
    if (pos >= sql.length) break;
    pos++; // skip (

    const fields = [];
    let field = '';
    let inStr = false;
    let escape = false;

    while (pos < sql.length) {
      const ch = sql[pos];
      if (escape) {
        // Handle MySQL escape sequences
        if (ch === 'n') field += '\n';
        else if (ch === 'r') field += '\r';
        else if (ch === 't') field += '\t';
        else if (ch === '0') field += '\0';
        else field += ch; // \', \", \\, etc.
        escape = false;
        pos++;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        pos++;
        continue;
      }
      if (ch === "'" && !inStr) {
        inStr = true;
        pos++;
        continue;
      }
      if (ch === "'" && inStr) {
        // Check for '' escape
        if (pos + 1 < sql.length && sql[pos+1] === "'") {
          field += "'";
          pos += 2;
          continue;
        }
        inStr = false;
        pos++;
        continue;
      }
      if (!inStr && (ch === ',' || ch === ')')) {
        fields.push(field.trim() === 'NULL' ? null : field);
        field = '';
        if (ch === ')') { pos++; break; }
        pos++;
        continue;
      }
      field += ch;
      pos++;
    }
    rows.push(fields);
  }
  return rows;
}

// Extract a single INSERT statement for a given table
function extractInsert(sql, tableName) {
  const marker = `INSERT INTO \`${tableName}\``;
  const start = sql.indexOf(marker);
  if (start === -1) return null;
  // Find the end (semicolon followed by newline)
  const end = sql.indexOf(';\n', start);
  return sql.substring(start, end > -1 ? end : undefined);
}

// ── HTML to Markdown conversion ──
function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;

  // Normalize line endings (SQL dump stores literal \r\n as backslash-r-backslash-n)
  md = md.replace(/\\r\\n/g, '\n');
  md = md.replace(/\\n/g, '\n');
  md = md.replace(/\\r/g, '\n');
  md = md.replace(/\r\n/g, '\n');
  md = md.replace(/\r/g, '\n');

  // Remove Drupal-specific wrappers
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<\/?span[^>]*>/gi, '');

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

  // Bold, italic
  md = md.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, '**$2**');
  md = md.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, '*$2*');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images — extract src, handle Drupal file paths
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Lists
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#039;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

// ── Slug generation ──
function slugify(str) {
  return str.toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// ── Unix timestamp to YYYY-MM-DD ──
function tsToDate(ts) {
  const d = new Date(parseInt(ts) * 1000);
  return d.toISOString().split('T')[0];
}

// ── Extract image paths from body HTML ──
function extractImagePaths(html) {
  const imgs = [];
  // Match /files/ and /upload/ image paths
  const re = /src="([^"]*(?:\/files\/|\/upload\/)[^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    imgs.push(m[1]);
  }
  return imgs;
}

// ── Resolve Drupal file URI to local path ──
function resolveFileUri(uri) {
  // public://filename.jpg -> FILES_DIR/filename.jpg
  if (uri.startsWith('public://')) {
    return path.join(FILES_DIR, uri.replace('public://', ''));
  }
  return null;
}

// ── Main ──
console.log('Reading SQL dump...');
const sql = fs.readFileSync(SQL_FILE, 'utf8');
console.log(`SQL dump loaded (${(sql.length / 1024 / 1024).toFixed(1)} MB)`);

// Parse nodes
console.log('Parsing nodes...');
const nodeInsert = extractInsert(sql, 'node');
const nodeRows = parseInsertValues(nodeInsert);
console.log(`Found ${nodeRows.length} nodes`);

// node columns: nid, vid, type, language, title, uid, status, created, changed, comment, promote, sticky, tnid, translate, uuid
const nodes = {};
for (const row of nodeRows) {
  const [nid, vid, type, lang, title, uid, status, created] = row;
  if (type === 'blog' && status === '1') {
    nodes[nid] = { nid, title, created: parseInt(created), date: tsToDate(created), type };
  }
}
console.log(`Found ${Object.keys(nodes).length} published blog posts`);

// Parse body content
console.log('Parsing body content...');
const bodyInsert = extractInsert(sql, 'field_data_body');
const bodyRows = parseInsertValues(bodyInsert);
// field_data_body columns: entity_type, bundle, deleted, entity_id, revision_id, language, delta, body_value, body_summary, body_format
for (const row of bodyRows) {
  const [entityType, bundle, deleted, entityId, revId, lang, delta, bodyValue, bodySummary] = row;
  if (entityType === 'node' && nodes[entityId]) {
    nodes[entityId].bodyHtml = bodyValue || '';
    nodes[entityId].summary = bodySummary || '';
  }
}

// Parse file_managed for image paths
console.log('Parsing file_managed...');
const fileInsert = extractInsert(sql, 'file_managed');
const fileRows = parseInsertValues(fileInsert);
// file_managed columns: fid, uid, filename, uri, filemime, filesize, status, timestamp, type, uuid, library
const files = {};
for (const row of fileRows) {
  const [fid, uid, filename, uri, filemime] = row;
  files[fid] = { fid, filename, uri, mime: filemime };
}
console.log(`Found ${Object.keys(files).length} managed files`);

// Parse field_data_field_image for node->file mappings
console.log('Parsing field_image...');
const imgInsert = extractInsert(sql, 'field_data_field_image');
const imgRows = parseInsertValues(imgInsert);
// columns: entity_type, bundle, deleted, entity_id, revision_id, language, delta, field_image_fid, alt, title, width, height
for (const row of imgRows) {
  const [entityType, bundle, deleted, entityId, revId, lang, delta, fid, alt, title] = row;
  if (entityType === 'node' && nodes[entityId] && files[fid]) {
    if (!nodes[entityId].images) nodes[entityId].images = [];
    nodes[entityId].images.push({ fid, alt, title, ...files[fid] });
  }
}

// Parse media gallery images (field_data_field_mg_images links galleries to files)
console.log('Parsing media gallery images...');
const mgImgInsert = extractInsert(sql, 'field_data_field_mg_images');
if (mgImgInsert) {
  const mgImgRows = parseInsertValues(mgImgInsert);
  // Store gallery images by gallery nid
  const galleryImages = {};
  for (const row of mgImgRows) {
    const [entityType, bundle, deleted, entityId, revId, lang, delta, fid] = row;
    if (entityType === 'node' && files[fid]) {
      if (!galleryImages[entityId]) galleryImages[entityId] = [];
      galleryImages[entityId].push(files[fid]);
    }
  }
  console.log(`Found ${Object.keys(galleryImages).length} media galleries`);
}

// ── Generate output ──
console.log('\nGenerating blog posts...');

// Group nodes by project
const projects = {};
const unassigned = [];

for (const [nid, node] of Object.entries(nodes)) {
  const project = NID_TO_PROJECT[nid];
  if (project) {
    if (!projects[project]) projects[project] = [];
    projects[project].push(node);
  } else {
    unassigned.push(node);
  }
}

// Assign unassigned to 'misc' project
if (unassigned.length) {
  projects['misc'] = unassigned;
  PROJECT_NAMES['misc'] = 'Miscellaneous';
}

// Sort posts within each project by date
for (const posts of Object.values(projects)) {
  posts.sort((a, b) => a.created - b.created);
}

// Track all posts for posts.json
const allPosts = [];

for (const [projectSlug, posts] of Object.entries(projects)) {
  const projectDir = path.join(OUT_DIR, projectSlug);
  fs.mkdirSync(projectDir, { recursive: true });

  console.log(`\n── ${PROJECT_NAMES[projectSlug] || projectSlug} (${posts.length} posts) ──`);

  for (const node of posts) {
    const postSlug = slugify(node.title);
    const postDir = path.join(projectDir, postSlug);
    fs.mkdirSync(postDir, { recursive: true });

    // Convert body HTML to markdown
    let bodyMd = htmlToMarkdown(node.bodyHtml || '');

    // Extract and copy images referenced in body HTML
    const bodyImages = extractImagePaths(node.bodyHtml || '');
    const copiedImages = [];

    // Copy hero image (from field_image)
    if (node.images && node.images.length > 0) {
      for (const img of node.images) {
        const localPath = resolveFileUri(img.uri);
        if (localPath && fs.existsSync(localPath)) {
          const destName = img.filename;
          const dest = path.join(postDir, destName);
          try {
            fs.copyFileSync(localPath, dest);
            copiedImages.push(destName);
          } catch (e) {
            console.log(`  Warning: could not copy ${localPath}: ${e.message}`);
          }
        }
      }
    }

    // Copy images referenced in body HTML (both /files/ and /upload/ paths)
    for (const imgUrl of bodyImages) {
      let relPath, baseDir;
      const filesIdx = imgUrl.indexOf('/files/');
      const uploadIdx = imgUrl.indexOf('/upload/');
      if (filesIdx !== -1) {
        relPath = imgUrl.substring(filesIdx + 7);
        baseDir = FILES_DIR;
      } else if (uploadIdx !== -1) {
        relPath = imgUrl.substring(uploadIdx + 8);
        baseDir = UPLOAD_DIR;
      } else {
        continue;
      }
      const localPath = path.join(baseDir, relPath);
      if (fs.existsSync(localPath)) {
        const destName = path.basename(relPath);
        const dest = path.join(postDir, destName);
        if (!fs.existsSync(dest)) {
          try {
            fs.copyFileSync(localPath, dest);
            copiedImages.push(destName);
          } catch (e) { /* skip */ }
        }
        bodyMd = bodyMd.split(imgUrl).join(destName);
      }
    }

    // Also fix any remaining /sites/default/files/ references in markdown
    bodyMd = bodyMd.replace(/\/sites\/default\/files\/([^\s\)]+)/g, (match, p1) => {
      const localPath = path.join(FILES_DIR, p1);
      if (fs.existsSync(localPath)) {
        const destName = path.basename(p1);
        const dest = path.join(postDir, destName);
        if (!fs.existsSync(dest)) {
          try { fs.copyFileSync(localPath, dest); copiedImages.push(destName); } catch (e) { /* skip */ }
        }
        return destName;
      }
      return match;
    });

    // Fix /upload/ references — copy from UPLOAD_DIR and rewrite to local filenames
    bodyMd = bodyMd.replace(/\/upload\/([^\s\)]+)/g, (match, p1) => {
      const localPath = path.join(UPLOAD_DIR, p1);
      if (fs.existsSync(localPath)) {
        const destName = path.basename(p1);
        const dest = path.join(postDir, destName);
        if (!fs.existsSync(dest)) {
          try { fs.copyFileSync(localPath, dest); copiedImages.push(destName); } catch (e) { /* skip */ }
        }
        return destName;
      }
      return match;
    });

    // Build summary from body or existing summary
    let summary = node.summary ? htmlToMarkdown(node.summary) : '';
    if (!summary) {
      // First non-image, non-empty line of body
      const firstLine = bodyMd.split('\n').find(l => l.trim().length > 10 && !l.startsWith('![')) || '';
      summary = firstLine.substring(0, 120).replace(/\n/g, ' ').trim();
      if (summary.length >= 118) summary += '...';
    }
    // Clean summary of any remaining markdown/image refs
    summary = summary.replace(/!\[.*?\]\(.*?\)/g, '').trim();

    // Build hero image reference
    let heroRef = '';
    if (node.images && node.images.length > 0 && copiedImages.length > 0) {
      heroRef = `\n![${node.title}](${copiedImages[0]})\n`;
    }

    // Write post.md
    const frontmatter = [
      '---',
      `title: "${node.title.replace(/"/g, '\\"')}"`,
      `date: ${node.date}`,
      `summary: "${summary.replace(/"/g, '\\"').substring(0, 200)}"`,
      `tags: [${projectSlug}]`,
      `project: ${projectSlug}`,
      '---',
    ].join('\n');

    const postContent = `${frontmatter}\n${heroRef}\n${bodyMd}\n`;
    fs.writeFileSync(path.join(postDir, 'post.md'), postContent, 'utf8');

    console.log(`  ${node.date} - ${node.title} (${copiedImages.length} images)`);

    // Add to index
    allPosts.push({
      slug: `${projectSlug}/${postSlug}`,
      title: node.title,
      date: node.date,
      summary: summary.substring(0, 200),
      tags: [projectSlug],
      project: projectSlug,
    });
  }
}

// Sort all posts newest first
allPosts.sort((a, b) => b.date.localeCompare(a.date));

// Write posts.json
fs.writeFileSync(path.join(OUT_DIR, 'posts.json'), JSON.stringify(allPosts, null, 2), 'utf8');
console.log(`\nWrote posts.json with ${allPosts.length} entries`);

// Write a project index for the menu
const projectIndex = Object.entries(PROJECT_NAMES).map(([slug, name]) => ({
  slug,
  name,
  count: (projects[slug] || []).length,
}));
fs.writeFileSync(path.join(OUT_DIR, 'projects.json'), JSON.stringify(projectIndex, null, 2), 'utf8');
console.log(`Wrote projects.json with ${projectIndex.length} projects`);

console.log('\nDone!');
