#!/usr/bin/env bash
#
# Local wiki update (everything runs on this machine):
#   1. pulls the latest vendor/wiki submodule from Gitea
#   2. rebuilds the wiki static site into public/wiki
#   3. shows the commit/push commands to run manually
#
# The built wiki (public/wiki) is committed to this repo, so the GitHub
# build never needs access to Gitea.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git -C vendor/wiki status --porcelain 2>/dev/null || true)" ]; then
  echo "!! vendor/wiki has local changes (builds regenerate some content files)."
  echo "   If the update below fails: git -C vendor/wiki checkout -- ."
fi

echo "==> Pulling latest wiki (vendor/wiki)..."
git submodule update --init --remote vendor/wiki

WIKI_SHA="$(git -C vendor/wiki rev-parse --short HEAD)"
echo "    vendor/wiki is now at ${WIKI_SHA}"

echo "==> Building wiki into public/wiki..."
node scripts/buildWiki.mjs

echo ""
echo "To test locally: npm run build:static (then serve out/) or npm run dev"
echo "To publish, commit and push manually:"
echo "  git add vendor/wiki public/wiki public/wiki.html"
echo "  git commit -m \"Update wiki to ${WIKI_SHA}\""
echo "  git push origin main"
