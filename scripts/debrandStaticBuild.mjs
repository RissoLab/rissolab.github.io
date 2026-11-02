/**
 * Remove Next.js branding from the static export in out/.
 *
 * A static export inevitably ships Next.js artifacts: the /_next asset
 * directory, __next_* runtime globals, __next.*.txt RSC payload files,
 * __NEXT_DATA__, Turbopack runtime names, manifest file names, and
 * framework-typical chunk file names (main-app-*, framework-*, webpack-*).
 *
 * All of these are self-contained inside out/ (URLs are constructed from the
 * same string tokens that appear in the shipped files), so renaming them
 * consistently across content, file names and directory names keeps the site
 * fully functional while removing the framework fingerprint.
 *
 * Wired as the last step of postbuild:static (after finalizeStaticBuild).
 */
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  throw new Error("out/ not found - run the static export first");
}

const TEXT_EXTENSIONS = new Set([
  ".html",
  ".js",
  ".mjs",
  ".css",
  ".txt",
  ".json",
  ".xml",
  ".svg",
  ".webmanifest",
]);

// Ordered [find, replace] pairs applied to file content AND to file/dir
// names. Most specific patterns first.
const replacements = [
  // Next data / runtime globals and wire-protocol markers
  ["__NEXT_DATA__", "__APP_DATA__"],
  ["__next", "__app"],
  // Analytics script element ids
  ["_next-gtm", "_app-gtm"],
  ["_next-ga", "_app-ga"],
  // Pages-router data-route regex (escaped-literal form as minified)
  ["\\/_next\\/data\\/", "\\/data\\/"],
  // Resource precedence (React stylesheet API value chosen by Next) in HTML
  // attributes, JS and the escaped form embedded in flight payloads
  ['\\"precedence\\":\\"next\\"', '\\"precedence\\":\\"core\\"'],
  ['"precedence":"next"', '"precedence":"core"'],
  ['precedence:"next"', 'precedence:"core"'],
  ['\\"data-precedence\\":\\"next\\"', '\\"data-precedence\\":\\"core\\"'],
  ['data-precedence="next"', 'data-precedence="core"'],
  // Font-size-adjust meta tag
  ["next-size-adjust", "text-size-adjust"],
  // 404 route segment
  ["_not-found", "not-found"],
  // Asset base path (chunk relative names keep their "static/..." shape)
  ["/_next/", "/"],
  // Manifest names baked into the runtime config
  ["_clientMiddlewareManifest", "clientMiddlewareManifest"],
  ["_devPagesManifest", "devPagesManifest"],
  ["_devMiddlewareManifest", "devMiddlewareManifest"],
  // RSC content type and internal event/attribute names
  ["text/x-component", "text/x-rsc"],
  ["next-hmr-refresh", "app-hmr-refresh"],
  ["next-url", "app-url"],
  // Lowercase framework slugs (CSS classes, devtools names, message slugs)
  ["next build --debug-prerender", "a debug-mode build"],
  ["next dev", "npm run dev"],
  ["next-", "app-"],
  // RSC prefetch/action HTTP header names
  ["Next-", "App-"],
  // React profiler labels and error messages naming the framework
  ["Next.js", "App"],
  ["Next.Metadata", "App.Metadata"],
  // Constants, package names and paths inside shipped JS
  ["NEXT_HTTP_ERROR_FALLBACK", "APP_HTTP_ERROR_FALLBACK"],
  ["@next/third-parties", "@app/third-parties"],
  ["node_modules/next/", "node_modules/app/"],
  ["disquscdn.com/next/", "disquscdn.com/cdn/"],
  ["disqus.com/next/", "disqus.com/cdn/"],
  // Error-message wording and doc links
  ["'/_next'", "'/'"],
  ["'_next' folder", "'static' folder"],
  ["public-next-folder-conflict", "public-static-folder-conflict"],
  ["nextjs.org", "rissolab.stat.unipd.it"],
  // Turbopack (Vercel) runtime globals and symbol names
  ["TURBOPACK", "CHUNK_LOADER"],
  ["turbopack", "chunk"],
  ["Turbopack", "Chunk"],
  // Minified identifiers produced by the Next toolchain
  ["_N_E_STYLE_LOAD", "_E_STYLE_LOAD"],
  ["_N_E", "_N_X"],
  // Template leftovers
  ["nextplate", "rissolab"],
];

// Framework-typical chunk/manifest file names -> neutral names.
const chunkRenamePatterns = [
  [/^turbopack-(.+)$/, (m) => m],
  [/^main-app-(.+)$/, (m) => `app-main-${m}`],
  [/^framework-(.+)$/, (m) => `core-${m}`],
  [/^webpack-(.+)$/, (m) => `runtime-${m}`],
  [/^main-(.+)$/, (m) => `entry-${m}`],
  [/^_clientMiddlewareManifest\.json$/, () => "clientMiddlewareManifest.json"],
];

// Unused build-manifest artifacts (server-side only, never served).
const chunkDeletePatterns = [/_buildManifest\.js$/, /_ssgManifest\.js$/];

function applyReplacements(str) {
  for (const [from, to] of replacements) {
    if (str.includes(from)) str = str.split(from).join(to);
  }
  return applyUppercaseNextTokens(str);
}

// Catch-all for uppercase Next identifier tokens the explicit list does not
// cover (e.g. __NEXT_P, __NEXT_ERROR_CODE, DOT_NEXT_ALIAS,
// __PRIVATE_NEXTJS_INTERNALS_TREE). Only underscore-bound identifier tokens
// are touched, so prose words are left alone.
function applyUppercaseNextTokens(str) {
  if (!str.includes("NEXT")) return str;
  return str.replace(/[A-Za-z0-9_]*?(?:_NEXT|NEXTJS)[A-Za-z0-9_]*/g, (token) =>
    token.split("NEXTJS").join("APP").split("_NEXT").join("_APP"),
  );
}

function isTextFile(file) {
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    yield { full, entry };
    if (entry.isDirectory()) yield* walk(full);
  }
}

function* walkBottomUp(dir) {
  const entries = [];
  for (const { full, entry } of walk(dir)) entries.push({ full, entry });
  // Deepest first so parents are renamed after their children.
  entries.sort((a, b) => b.full.length - a.full.length);
  for (const item of entries) yield item;
}

function renameChunkName(name) {
  for (const [pattern, transform] of chunkRenamePatterns) {
    const match = name.match(pattern);
    if (match) return transform(match[1]);
  }
  return name;
}

/* 1. Directory surgery: merge <dir>/_next/static into <dir>/static and
 *    drop the remaining _next tree (per-build manifest dir). */
const nextDirs = [];
for (const { full, entry } of walk(outDir)) {
  if (entry.isDirectory() && entry.name === "_next") nextDirs.push(full);
}
for (const dir of nextDirs.sort((a, b) => b.length - a.length)) {
  const parent = path.dirname(dir);
  const staticSrc = path.join(dir, "static");
  const staticDst = path.join(parent, "static");
  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(staticDst, { recursive: true });
    for (const item of fs.readdirSync(staticSrc)) {
      fs.cpSync(path.join(staticSrc, item), path.join(staticDst, item), {
        recursive: true,
        force: true,
      });
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

/* 2. Collect chunk renames/deletions. */
const chunkRenames = new Map(); // old basename -> new basename
const filesToDelete = [];
for (const { full, entry } of walk(outDir)) {
  if (!entry.isFile()) continue;
  const name = entry.name;
  if (chunkDeletePatterns.some((p) => p.test(name))) {
    filesToDelete.push(full);
    continue;
  }
  const newName = renameChunkName(name);
  if (newName !== name) chunkRenames.set(name, newName);
}
for (const file of filesToDelete) fs.rmSync(file);

/* 3. Content pass: exact chunk-name swaps first, then token replacements
 *    (so generic patterns like "turbopack" -> "chunk" cannot corrupt a
 *    chunk file name that the exact rename is about to handle). */
let filesUpdated = 0;
for (const { full, entry } of walk(outDir)) {
  if (!entry.isFile() || !isTextFile(full)) continue;
  let content = fs.readFileSync(full, "utf8");
  const original = content;
  for (const [oldName, newName] of chunkRenames) {
    if (content.includes(oldName)) {
      content = content.split(oldName).join(newName);
    }
  }
  content = applyReplacements(content);
  if (content !== original) {
    fs.writeFileSync(full, content);
    filesUpdated += 1;
  }
}

/* 4. Rename files/directories: exact chunk names first, then token-based
 *    names (bottom-up). */
for (const { full, entry } of walkBottomUp(outDir)) {
  if (entry.isFile() && chunkRenames.has(entry.name)) {
    const target = path.join(path.dirname(full), chunkRenames.get(entry.name));
    if (fs.existsSync(target)) {
      throw new Error(`Rename collision: ${full} -> ${target}`);
    }
    fs.renameSync(full, target);
  }
}
for (const { full, entry } of walkBottomUp(outDir)) {
  const newName = applyReplacements(entry.name);
  if (newName !== entry.name) {
    const target = path.join(path.dirname(full), newName);
    if (fs.existsSync(target)) {
      throw new Error(`Rename collision: ${full} -> ${target}`);
    }
    fs.renameSync(full, target);
  }
}

/* 5. Drop sourcemaps (they leak internal build paths). */
for (const { full, entry } of walk(outDir)) {
  if (entry.isFile() && entry.name.endsWith(".map")) fs.rmSync(full);
}

/* 6. Verification: no banned token may remain in content or file names. */
const bannedPatterns = [
  // underscore-bound tokens (React's own `unstable_next` API is exempt)
  { name: "next tokens", re: /(?<!unstable)_next/i },
  { name: "next headers/labels", re: /Next-/ },
  { name: "next slugs", re: /next-[a-z0-9]/ },
  { name: "framework names", re: /Next\.js|Next\.Metadata|nextjs\.org|NEXT_HTTP/ },
  { name: "next cli", re: /next (build|dev|start|export)\b/ },
  { name: "turbopack", re: /turbopack/i },
  { name: "nextplate", re: /nextplate/i },
  { name: "_not-found", re: /_not-found/ },
  { name: "rsc content type", re: /text\/x-component/ },
  { name: "paths to next pkgs", re: /node_modules\/next\/|@next\// },
  { name: "minified toolchain ids", re: /_N_E/ },
  { name: "precedence value", re: /precedence[^a-z]{1,2}next/ },
];
const violations = [];
for (const { full, entry } of walk(outDir)) {
  const name = entry.name;
  if (entry.isFile() && isTextFile(full)) {
    const lines = fs.readFileSync(full, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const { name: label, re } of bannedPatterns) {
        if (re.test(line)) {
          violations.push(`${path.relative(outDir, full)}:${i + 1} [${label}] ${line.slice(0, 120)}`);
        }
      }
    });
  }
  for (const { name: label, re } of bannedPatterns) {
    if (re.test(name)) violations.push(`${path.relative(outDir, full)} [${label}] (file name)`);
  }
}
if (violations.length) {
  console.error(`Debrand: ${violations.length} leftover reference(s):`);
  for (const v of violations.slice(0, 40)) console.error(`  ${v}`);
  throw new Error("Debrand verification failed");
}

/* 7. Sanity: asset URLs referenced from HTML resolve to files on disk. */
let checkedRefs = 0;
for (const { full, entry } of walk(outDir)) {
  if (!entry.isFile() || !full.endsWith(".html")) continue;
  const html = fs.readFileSync(full, "utf8");
  for (const match of html.matchAll(/(?:href|src)="(\/static\/[^"]+)"/g)) {
    const file = path.join(outDir, decodeURIComponent(match[1]));
    if (!fs.existsSync(file)) {
      throw new Error(`Missing asset referenced by ${path.relative(outDir, full)}: ${match[1]}`);
    }
    checkedRefs += 1;
  }
}

console.log(
  `Debrand complete: ${filesUpdated} files rewritten, ${chunkRenames.size} chunk(s) renamed, ${checkedRefs} asset refs verified.`,
);
