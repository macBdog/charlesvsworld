# Engineering Blog Post Format

A compact, human-readable format for organizing text, images and resources
into date-ordered blog posts grouped by project, for static web delivery.

## Directory Structure

```
content/engineering/
  posts.json                              # Post index (all posts, all projects)
  projects.json                           # Project index (list of project groups)
  <project-slug>/                         # One folder per project
    <post-slug>/                          # One subfolder per post
      post.md                             # Post content with YAML frontmatter
      thumb.jpg                           # Optional thumbnail for listing view
      *.jpg, *.png, *.gif, *.webp         # Images referenced by post.md
      *.zip, *.tar.gz                     # Downloadable attachments
```

### Example

```
content/engineering/
  posts.json
  projects.json
  1979-porsche-924-turbo/
    i-bought-a-car/
      post.md
    brake-upgrade/
      post.md
      brakes.jpg
    motor-out/
      post.md
      engine-bay.jpg
  workshop/
    welding-trolley/
      post.md
      trolley.jpg
```

## Post File (post.md)

Each post is a single markdown file with YAML frontmatter delimited by `---`.
The frontmatter is the source of truth for metadata. posts.json is a derived
index used by the browser to render the listing without fetching every file.

```markdown
---
title: "Post Title Here"
date: 2024-06-15
summary: "One-line description for the post listing."
tags: [arduino, robotics]
project: project-slug
repo: github-repo-name
---

Body content in standard markdown.

## Sections Use H2

Paragraphs are plain text separated by blank lines.

- Bullet lists work normally
1. Numbered lists too

![alt text](photo.jpg)

[Download the schematic](schematic.pdf)
```

### Frontmatter Fields

| Field     | Required | Description                                       |
|-----------|----------|---------------------------------------------------|
| `title`   | yes      | Display title for the post                        |
| `date`    | yes      | Publication date, YYYY-MM-DD                      |
| `summary` | yes      | One-line summary shown in the post listing        |
| `tags`    | no       | List of topic tags for filtering                  |
| `project` | yes      | Project slug this post belongs to                 |
| `repo`    | no       | GitHub repo name if the post has associated code  |

## Post Index (posts.json)

A flat JSON array of all post metadata objects across all projects, sorted
newest-first. This file exists so the browser can render listings in one
fetch. It should be regenerated whenever posts are added or edited.

```json
[
  {
    "slug": "1979-porsche-924-turbo/i-bought-a-car",
    "title": "I bought a car.",
    "date": "2005-05-29",
    "summary": "My goal with this 1979 Porsche 924 Turbo...",
    "tags": ["1979-porsche-924-turbo"],
    "project": "1979-porsche-924-turbo"
  }
]
```

The `slug` field is hierarchical: `<project-slug>/<post-slug>`. This maps
directly to the folder path under `content/engineering/`.

## Project Index (projects.json)

A JSON array of project groups. Used to render the top-level Engineering
menu without scanning the filesystem.

```json
[
  {
    "slug": "1979-porsche-924-turbo",
    "name": "1979 Porsche 924 Turbo",
    "count": 40
  }
]
```

## Conventions

- **Project slugs** are lowercase, hyphenated, and describe the project topic.
  A project groups related posts together chronologically.

- **Post slugs** are lowercase, hyphenated, and describe the individual post.
  They do NOT include dates — dates live in the frontmatter.

- **Images** live alongside `post.md` and are referenced with relative paths.
  Use `![caption](filename.jpg)` in the markdown body. No subdirectories
  needed — a flat folder per post keeps things simple.

- **Ordering** is by `date` in frontmatter, oldest first within a project
  (build log order), newest first in the global index.

- **Linking between posts** uses relative paths:
  `[see also](../other-post-slug/post.md)` within the same project, or
  `[see also](../../other-project/post-slug/post.md)` across projects.

- **Attachments** (schematics, firmware binaries, CAD files) sit in the post
  folder and are linked with `[label](filename.ext)`.

- **Navigation** within a project supports prev/next post by date, giving
  the build-log reading experience.

## Porting From Other Formats

When converting posts from WordPress, Jekyll, Hugo, Drupal, or other blog
engines:

1. Identify projects — group related posts by topic (e.g. a car build, a
   workshop project, a trip series).
2. Create a project folder under `content/engineering/`.
3. For each post in the project:
   a. Create a subfolder named with the post slug.
   b. Create `post.md` with the frontmatter block. Map source fields:
      - WordPress `post_title` / Jekyll `title` / Drupal node title -> `title`
      - WordPress `post_date` / Jekyll `date` / Drupal `created` -> `date` (YYYY-MM-DD)
      - WordPress `post_excerpt` / Drupal `body_summary` -> `summary`
      - Jekyll `categories` + `tags` / Drupal taxonomy -> `tags`
      - Set `project` to the project folder slug.
   c. Convert the body to clean markdown:
      - Strip HTML tags, convert `<img>` to `![alt](src)`.
      - Download referenced images into the post folder, update paths to relative.
      - Convert embedded media (YouTube, etc.) to plain links.
      - Handle CMS-specific line endings (Drupal stores `\r\n` as literal
        backslash-r-backslash-n in SQL dumps — decode these to actual newlines).
      - Remove CMS shortcodes, convert to markdown equivalents where possible.
4. Add entries to `posts.json` with hierarchical slugs (`project/post`).
5. Add a project entry to `projects.json` with slug, name, and post count.
6. Verify the posts render correctly in the BBS terminal viewer.
