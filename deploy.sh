#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — Build and deploy charlesvsworld to GCP
#
# Prerequisites:
#   - gcloud CLI authenticated with access to the target project
#   - Content (pics/files) already present on the GCP host at CONTENT_DIR
#   - gsutil available (comes with gcloud SDK)
#
# Usage:
#   ./deploy.sh              # Full deploy (build + sync webapps + upload)
#   ./deploy.sh build        # Build only (combine code + content locally)
#   ./deploy.sh webapps      # Sync webapps only
#   ./deploy.sh upload       # Upload to GCP only

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Configuration -----------------------------------------------------------
DOMAIN="henden.com.au"
GCP_BUCKET="gs://${DOMAIN}"
BUILD_DIR="${SCRIPT_DIR}/_build"
CONTENT_DIR="${CONTENT_DIR:-${SCRIPT_DIR}/content}"

# GitHub repos to sync as hosted webapps on henden.com.au/<repo-name>/
WEBAPP_REPOS=(
  "brownish-bomber"
)
GITHUB_USER="macBdog"

# --- Functions ----------------------------------------------------------------

build() {
  echo "==> Building site into ${BUILD_DIR}"
  mkdir -p "${BUILD_DIR}"

  # copy_newer <src_dir> <dest_dir>
  # Copies files from src to dest only if missing or source is newer.
  # Works on both Linux and Git Bash (no rsync required).
  # Prints the number of files updated.
  copy_newer() {
    local src="$1" dest="$2"
    local count=0
    mkdir -p "${dest}"
    for src_file in "${src}"/*; do
      [ -f "${src_file}" ] || continue
      local fname dest_file
      fname="$(basename "${src_file}")"
      dest_file="${dest}/${fname}"
      if [ ! -f "${dest_file}" ] || [ "${src_file}" -nt "${dest_file}" ]; then
        cp "${src_file}" "${dest_file}"
        count=$((count + 1))
      fi
    done
    echo "${count}"
  }

  # remove_deleted <src_dir> <dest_dir> [exclude_filename]
  # Removes files from dest that no longer exist in src.
  # Optional third argument: a filename to never delete (e.g. index.json).
  # Prints the number of files removed.
  remove_deleted() {
    local src="$1" dest="$2" exclude="${3:-}"
    local count=0
    [ -d "${dest}" ] || return 0
    for dest_file in "${dest}"/*; do
      [ -f "${dest_file}" ] || continue
      local fname
      fname="$(basename "${dest_file}")"
      [ "${fname}" = "${exclude}" ] && continue
      if [ ! -f "${src}/${fname}" ]; then
        rm "${dest_file}"
        count=$((count + 1))
      fi
    done
    echo "${count}"
  }

  # Site code (HTML, JS, CSS)
  echo "    Syncing site code..."
  cp -u "${SCRIPT_DIR}/index.html" "${BUILD_DIR}/"
  js_updated=$(copy_newer  "${SCRIPT_DIR}/js"  "${BUILD_DIR}/js")
  remove_deleted "${SCRIPT_DIR}/js"  "${BUILD_DIR}/js"  > /dev/null
  css_updated=$(copy_newer "${SCRIPT_DIR}/css" "${BUILD_DIR}/css")
  remove_deleted "${SCRIPT_DIR}/css" "${BUILD_DIR}/css" > /dev/null
  [ "${js_updated}"  -gt 0 ] && echo "    js:  ${js_updated} file(s) updated"  || echo "    js:  up to date"
  [ "${css_updated}" -gt 0 ] && echo "    css: ${css_updated} file(s) updated" || echo "    css: up to date"

  # Content — sync each project incrementally
  echo "    Syncing content from ${CONTENT_DIR}..."
  mkdir -p "${BUILD_DIR}/content/projects"
  cp -u "${CONTENT_DIR}/projects/projects.json" "${BUILD_DIR}/content/projects/" 2>/dev/null || true
  cp -u "${CONTENT_DIR}/FORMAT.md"              "${BUILD_DIR}/content/"          2>/dev/null || true

  # Remove project folders in _build that no longer exist in content
  for build_proj in "${BUILD_DIR}/content/projects"/*/; do
    [ -d "${build_proj}" ] || continue
    proj_name="$(basename "${build_proj}")"
    if [ ! -d "${CONTENT_DIR}/projects/${proj_name}" ]; then
      echo "    Removing deleted project: ${proj_name}"
      rm -rf "${build_proj}"
    fi
  done

  project_count=$(find "${CONTENT_DIR}/projects" -maxdepth 1 -mindepth 1 -type d | wc -l)
  echo "    ${project_count} projects found"
  total_new=0

  for proj_dir in "${CONTENT_DIR}/projects"/*/; do
    proj_name="$(basename "${proj_dir}")"
    dest="${BUILD_DIR}/content/projects/${proj_name}"
    mkdir -p "${dest}"

    changed=0

    # post.md — copy if newer
    if [ -f "${proj_dir}/post.md" ]; then
      if [ ! -f "${dest}/post.md" ] || [ "${proj_dir}/post.md" -nt "${dest}/post.md" ]; then
        cp "${proj_dir}/post.md" "${dest}/"
        changed=$((changed + 1))
      fi
    fi

    # pics/ — copy newer files, remove deleted, then regenerate index.json
    if [ -d "${proj_dir}/pics" ]; then
      pic_new=$(copy_newer "${proj_dir}/pics" "${dest}/pics")
      remove_deleted "${proj_dir}/pics" "${dest}/pics" "index.json" > /dev/null
      changed=$((changed + pic_new))

      # Generate pics/index.json — array of filenames for browser auto-insertion
      index_json="${dest}/pics/index.json"
      (
        echo '['
        first=1
        for f in "${dest}/pics/"*; do
          fname="$(basename "${f}")"
          [ "${fname}" = "index.json" ] && continue
          [ -d "${f}" ] && continue
          [ "${first}" = "1" ] && first=0 || echo ','
          printf '  "%s"' "${fname}"
        done
        echo ''
        echo ']'
      ) > "${index_json}"
    fi

    # files/ — copy newer files, remove deleted
    if [ -d "${proj_dir}/files" ]; then
      files_new=$(copy_newer "${proj_dir}/files" "${dest}/files")
      remove_deleted "${proj_dir}/files" "${dest}/files" > /dev/null
      changed=$((changed + files_new))
    fi

    if [ "${changed}" -gt 0 ]; then
      pic_total=$(find "${dest}/pics" -maxdepth 1 -type f 2>/dev/null | wc -l)
      echo "    ${proj_name}: ${changed} file(s) updated (${pic_total} pics total)"
      total_new=$((total_new + changed))
    else
      echo "    ${proj_name}: up to date"
    fi
  done

  echo "    Content sync: ${total_new} file(s) updated"

  total_files=$(find "${BUILD_DIR}" -type f | wc -l)
  build_size=$(du -sh "${BUILD_DIR}" | cut -f1)
  echo "==> Build complete: ${total_files} files, ${build_size} — ${BUILD_DIR}"
}

sync_webapps() {
  echo "==> Syncing webapps from GitHub"
  mkdir -p "${BUILD_DIR}"

  for repo in "${WEBAPP_REPOS[@]}"; do
    local repo_url="https://github.com/${GITHUB_USER}/${repo}.git"
    local dest="${BUILD_DIR}/${repo}"

    if [ -d "${dest}/.git" ]; then
      echo "    Updating ${repo}"
      git -C "${dest}" pull --ff-only
    else
      # No .git means either first run or .git was stripped after last deploy — re-clone
      rm -rf "${dest}"
      echo "    Cloning ${repo}"
      git clone --depth 1 "${repo_url}" "${dest}"
    fi

    # Remove git metadata — we only want the static files
    rm -rf "${dest}/.git"

    # Ensure there is an index.html — use <repo>.html as fallback entry point
    if [ ! -f "${dest}/index.html" ] && [ -f "${dest}/${repo}.html" ]; then
      cp "${dest}/${repo}.html" "${dest}/index.html"
      echo "    ${repo}: created index.html from ${repo}.html"
    fi

    echo "    ${repo} ready at ${DOMAIN}/${repo}/"
  done

  echo "==> Webapps synced"
}

upload() {
  echo "==> Uploading to ${GCP_BUCKET}"

  if ! command -v gsutil &>/dev/null; then
    echo "ERROR: gsutil not found. Install the Google Cloud SDK." >&2
    exit 1
  fi

  # Sync build output to the GCS bucket serving henden.com.au
  gsutil -m rsync -r -d "${BUILD_DIR}" "${GCP_BUCKET}"

  # Set cache headers:
  #   images/files: long cache (they don't change between deploys)
  #   markdown/json content: no-cache (always re-validate so deploys show immediately)
  #   html/js/css: short cache
  gsutil -m setmeta -h "Cache-Control:public, max-age=86400" \
    "${GCP_BUCKET}/content/projects/*/pics/**" 2>/dev/null || true
  gsutil -m setmeta -h "Cache-Control:no-cache, must-revalidate" \
    "${GCP_BUCKET}/content/**/*.md" "${GCP_BUCKET}/content/**/*.json" 2>/dev/null || true
  gsutil -m setmeta -h "Cache-Control:public, max-age=300" \
    "${GCP_BUCKET}/*.html" "${GCP_BUCKET}/js/**" "${GCP_BUCKET}/css/**" 2>/dev/null || true

  # Invalidate Cloud CDN so the new files are served immediately
  echo "==> Invalidating CDN cache"
  gcloud compute url-maps invalidate-cdn-cache "${DOMAIN//./-}-urlmap" \
    --path "/*" \
    --global \
    --async 2>/dev/null || echo "    (CDN invalidation skipped — not configured)"

  echo "==> Upload complete: https://${DOMAIN}"
}

# --- Main ---------------------------------------------------------------------

command="${1:-all}"

case "${command}" in
  build)   build ;;
  webapps) sync_webapps ;;
  upload)  upload ;;
  all)
    sync_webapps
    build
    upload
    ;;
  *)
    echo "Usage: $0 {build|webapps|upload|all}" >&2
    exit 1
    ;;
esac
