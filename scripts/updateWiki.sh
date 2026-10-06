#!/usr/bin/env bash
#
# Local wiki update (everything runs on this machine):
#   1. clones/updates vendor/wiki (disposable local clone of the Gitea repo)
#   2. rebuilds the wiki static site into public/wiki
#   3. shows the commit/push commands to run manually
#
# The built wiki (public/wiki) is committed to this repo, so the GitHub
# build never needs access to Gitea.
#
# NOTE: vendor/wiki is a cache - local changes inside it are discarded.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

WIKI_URL="http://nowwhat.stat.unipd.it/gitea/NowWhat/docs.git"
WIKI_DIR="vendor/wiki"

if [ ! -d "${WIKI_DIR}/.git" ]; then
  echo "==> Cloning wiki source..."
  git clone --quiet "${WIKI_URL}" "${WIKI_DIR}"
else
  echo "==> Updating wiki source..."
  git -C "${WIKI_DIR}" fetch --quiet origin
fi

git -C "${WIKI_DIR}" checkout --force main
git -C "${WIKI_DIR}" reset --hard --quiet origin/main

WIKI_SHA="$(git -C "${WIKI_DIR}" rev-parse --short HEAD)"
echo "    vendor/wiki is now at ${WIKI_SHA}"

echo "==> Building wiki into public/wiki..."
node scripts/buildWiki.mjs

echo ""
echo "To test locally: npm run build:static (then serve out/) or npm run dev"
echo "To publish, commit and push manually:"
echo "  git add public/wiki public/wiki.html wiki-source.txt"
echo "  git commit -m \"Update wiki to ${WIKI_SHA}\""
echo "  git push origin main"
