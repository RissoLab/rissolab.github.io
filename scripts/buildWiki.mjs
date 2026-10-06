import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const wikiDir = path.join(root, "vendor", "wiki");
const wikiOut = path.join(wikiDir, "out");
// public/wiki: served as-is (directory indexes) - used by the static export.
// public/.wiki-dev: flattened mirror (dir/index.html -> dir.html) - used by
// the dev-only rewrites in next.config.mjs.
const destDir = path.join(root, "public", "wiki");
const devMirrorDir = path.join(root, "public", ".wiki-dev");

// In CI the submodule is not initialized (the wiki source lives on Gitea).
// There, the committed public/wiki build is used as-is.
if (!fs.existsSync(path.join(wikiDir, "package.json"))) {
  if (fs.existsSync(path.join(destDir, "index.html"))) {
    console.log("vendor/wiki not checked out; using committed public/wiki build.");
    process.exit(0);
  }

  console.error(
    "vendor/wiki is not checked out and no committed wiki build found. Run: git submodule update --init vendor/wiki",
  );
  process.exit(1);
}

const run = (cmd, { cwd = root, env = {} } = {}) => {
  console.log(`\n$ ${cmd}${cwd !== root ? `  (in ${path.relative(root, cwd)})` : ""}`);
  execSync(cmd, { stdio: "inherit", cwd, env: { ...process.env, ...env } });
};

if (fs.existsSync(path.join(wikiDir, "node_modules"))) {
  run("npm install --no-audit --no-fund", { cwd: wikiDir });
} else {
  run("npm ci --no-audit --no-fund", { cwd: wikiDir });
}

run("npm run inventory:update-content", { cwd: wikiDir });
run("npm run build", { cwd: wikiDir, env: { NEXT_PUBLIC_BASE_PATH: "/wiki" } });

if (!fs.existsSync(wikiOut)) {
  console.error("Wiki build did not produce out/ in vendor/wiki");
  process.exit(1);
}

// Only the wiki docs section is published, moved from /wiki/docs to /wiki.
fs.rmSync(destDir, { recursive: true, force: true });
fs.rmSync(`${destDir}.html`, { force: true });
fs.mkdirSync(destDir, { recursive: true });

for (const name of ["_next", "static", "favicon.png", "og.png", "404", "404.html"]) {
  const source = path.join(wikiOut, name);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(destDir, name), { recursive: true });
  }
}

const docsDir = path.join(wikiOut, "docs");
if (!fs.existsSync(docsDir)) {
  console.error("Wiki build did not produce out/docs in vendor/wiki");
  process.exit(1);
}
for (const entry of fs.readdirSync(docsDir)) {
  fs.cpSync(path.join(docsDir, entry), path.join(destDir, entry), {
    recursive: true,
  });
}

// Rewrite the wiki docs URLs (/wiki/docs/...) to the new location (/wiki/...).
const TEXT_EXTENSIONS = new Set([
  ".html",
  ".txt",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".map",
  ".svg",
]);

const rewriteFiles = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteFiles(full);
      continue;
    }
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;

    const content = fs.readFileSync(full, "utf8");
    if (!content.includes("/docs")) continue;

    // Base-path-prefixed URLs (server-rendered hrefs, RSC payloads).
    let out = content
      .replaceAll("/wiki/docs/", "/wiki/")
      .replaceAll("/wiki/docs", "/wiki");

    // Client-side routes are stored without the base path ("/docs/...") and
    // the client router adds /wiki on navigation, so rewrite the quoted
    // forms only. Unquoted occurrences are asset paths (app/(marketing)/
    // docs/...), external URLs or prose and must be left untouched.
    for (const quote of ['"', "'", "`"]) {
      out = out
        .replaceAll(`${quote}/docs/`, `${quote}/`)
        .replaceAll(`${quote}/docs${quote}`, `${quote}/${quote}`);
    }
    // JSON-escaped form, ex: \"/docs\" inside flight data.
    out = out.replaceAll('\\"/docs\\"', '\\"/\\"');

    if (out !== content) {
      fs.writeFileSync(full, out);
    }
  }
};
rewriteFiles(destDir);

// Serves /wiki directly (no directory redirect) on static hosting.
fs.copyFileSync(path.join(destDir, "index.html"), `${destDir}.html`);

fs.rmSync(devMirrorDir, { recursive: true, force: true });
fs.cpSync(destDir, devMirrorDir, { recursive: true });

// The site uses trailingSlash: false (dev redirects /foo/ -> /foo), while the
// wiki is exported with trailingSlash: true (pages are directory indexes).
// The dev mirror duplicates each dir/index.html as a sibling <dir>.html so
// extension-less URLs work in dev.
const flattenIndexFiles = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    const indexFile = path.join(full, "index.html");
    if (fs.existsSync(indexFile)) {
      fs.copyFileSync(indexFile, `${full}.html`);
    }
    flattenIndexFiles(full);
  }
};
flattenIndexFiles(devMirrorDir);

console.log(`\nWiki (original template) copied to ${path.relative(root, destDir)}`);
console.log("It is served at /wiki in dev and included in the static export.");
