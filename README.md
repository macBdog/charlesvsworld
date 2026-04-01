# Charles vs World

A personal project blog disguised as a 1990s BBS terminal, hosted at **henden.com.au**.

The site is a static web app — vanilla HTML, CSS, and JavaScript with no build framework. Content is organized as project journals with timestamped entries and images (see [content/FORMAT.md](content/FORMAT.md)).

Related webapps (e.g. brownish-bomber) are synced from their GitHub repos and served under the same domain.

## Repository structure

```
index.html              # Single-page shell
js/                     # Terminal, modem audio, BBS menus, blog renderer
css/                    # CRT-style terminal theme
content/
  FORMAT.md             # Content format spec
  projects/
    projects.json       # Project index
    <project-slug>/
      post.md           # Journal entries
      pics/             # Images (not in git — lives on deploy host)
      files/            # Attachments (not in git)
deploy.sh               # Build and deploy to GCP
setup-gcp.sh            # One-time GCP infrastructure setup
```

Images and attachments under `content/projects/*/pics/` and `content/projects/*/files/` are excluded from git. They live on the machine that runs the deployment.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) with `gcloud` and `gsutil`
- A GCP project with billing enabled
- DNS control for henden.com.au

## First-time GCP setup

1. Authenticate and select your GCP project:

   ```bash
   gcloud auth login
   gcloud config set project <YOUR_PROJECT_ID>
   ```

2. Run the setup script to create the bucket, load balancer, and SSL certificate:

   ```bash
   ./setup-gcp.sh
   ```

3. Point the DNS `A` record for `henden.com.au` to the static IP printed by the script.

4. Wait for the managed SSL certificate to provision (up to 24 hours).

## Deploying

Run the full pipeline — sync webapps, build, and upload:

```bash
./deploy.sh
```

Or run individual steps:

```bash
./deploy.sh webapps    # Pull latest brownish-bomber from GitHub
./deploy.sh build      # Combine site code + content into _build/
./deploy.sh upload     # Sync _build/ to the GCS bucket
```

### Content location

By default, `deploy.sh` looks for content in `./content`. To use a different path:

```bash
CONTENT_DIR=/path/to/content ./deploy.sh
```

### Adding a webapp

Edit the `WEBAPP_REPOS` array in `deploy.sh`:

```bash
WEBAPP_REPOS=(
  "brownish-bomber"
)
```

After the next deploy, it will be available at `henden.com.au/your-new-repo/`.

## Local development

Open `index.html` in a browser. For content loading to work, serve from a local HTTP server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.
