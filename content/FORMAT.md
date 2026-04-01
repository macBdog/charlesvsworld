# Project Journal Format

A compact, human-readable format for organizing text and images into
date-ordered journal entries grouped by project.

## Directory Structure

```
content/projects/
  projects.json                           # Project index
  <project-slug>/                         # One folder per project
    post.md                               # All entries in one file
    pics/                                 # Images referenced by timestamp or name
      YYYYMMDD_HHMMSS.jpg                # Timestamped photos (EXIF date in filename)
      other-name.jpg                      # Named images (referenced explicitly)
    files/                                # Optional attachments (CAD, 3D, schematics)
```

## Post File (post.md)

Entries are delimited by H2 headers with a timestamp in `YYYY-MM-DD HH:MM:SS` format.
No YAML frontmatter. The timestamp is the sort key and display date.

```markdown
## 2025-01-11 16:44:00

I purchased the car late last year not far from the manufacturer in Azusa CA.

## 2025-01-18 18:07:00

Here is a summary of the research I've done over the past week:

* Ron Chuck built the heads and most probably the motor
* The pistons and cylinders are good to go
```

## Images

**Timestamped images** (`YYYYMMDD_HHMMSS.jpg`) are inserted chronologically
between entries — all images whose timestamp falls between two entry timestamps
appear after the earlier entry's text.

**Named images** are referenced explicitly in markdown:
`![caption](pics/engine_detail.jpg)`

## Project Index (projects.json)

```json
[
  {
    "slug": "1969-RCA-formula-vee",
    "name": "1969 RCA Formula Vee"
  }
]
```

| Field  | Required | Description                           |
|--------|----------|---------------------------------------|
| `slug` | yes      | Folder name under `content/projects/` |
| `name` | yes      | Display name for the project          |

## Conventions

- **Project slugs**: lowercase, hyphenated.
- **Entry timestamps**: `YYYY-MM-DD HH:MM:SS`, 24-hour time. Oldest first.
- **Timestamped images**: `YYYYMMDD_HHMMSS` format matching EXIF date.
- **Named images**: in `pics/`, referenced with `![alt](pics/filename.jpg)`.
- **Attachments**: in `files/`, linked with `[label](files/filename.ext)`.
