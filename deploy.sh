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
WEBAPPS_DIR="${SCRIPT_DIR}/webapps"

# GitHub repos to sync as hosted webapps on henden.com.au/<repo-name>/
WEBAPP_REPOS=(
  "brownish-bomber"
)
GITHUB_USER="macBdog"

# --- Functions ----------------------------------------------------------------

build() {
  echo "==> Building site into ${BUILD_DIR}"
  rm -rf "${BUILD_DIR}"
  mkdir -p "${BUILD_DIR}"

  # Copy the site code (HTML, JS, CSS)
  cp "${SCRIPT_DIR}/index.html" "${BUILD_DIR}/"
  cp -r "${SCRIPT_DIR}/css" "${BUILD_DIR}/"
  cp -r "${SCRIPT_DIR}/js" "${BUILD_DIR}/"

  # Copy content (markdown + media)
  mkdir -p "${BUILD_DIR}/content"
  cp -r "${CONTENT_DIR}/projects" "${BUILD_DIR}/content/"
  [ -f "${CONTENT_DIR}/FORMAT.md" ] && cp "${CONTENT_DIR}/FORMAT.md" "${BUILD_DIR}/content/"

  # Copy synced webapps if present
  if [ -d "${WEBAPPS_DIR}" ]; then
    echo "==> Including webapps"
    for app_dir in "${WEBAPPS_DIR}"/*/; do
      app_name="$(basename "${app_dir}")"
      cp -r "${app_dir}" "${BUILD_DIR}/${app_name}"
      echo "    ${app_name}/ -> ${DOMAIN}/${app_name}/"
    done
  fi

  echo "==> Build complete: ${BUILD_DIR}"
}

sync_webapps() {
  echo "==> Syncing webapps from GitHub"
  mkdir -p "${WEBAPPS_DIR}"

  for repo in "${WEBAPP_REPOS[@]}"; do
    local repo_url="https://github.com/${GITHUB_USER}/${repo}.git"
    local dest="${WEBAPPS_DIR}/${repo}"

    if [ -d "${dest}/.git" ]; then
      echo "    Updating ${repo}"
      git -C "${dest}" pull --ff-only
    else
      echo "    Cloning ${repo}"
      git clone --depth 1 "${repo_url}" "${dest}"
    fi

    # Remove git metadata — we only want the static files
    rm -rf "${dest}/.git"
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

  # Set cache headers: long cache for images, short for HTML/JS
  gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "${GCP_BUCKET}/content/**"
  gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "${GCP_BUCKET}/*.html"
  gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "${GCP_BUCKET}/js/**"
  gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "${GCP_BUCKET}/css/**"

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
