// Build output verification (run from repo root after npm run build:static)
import fs from "fs";
import path from "path";

const out = "out";
let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
};

const htmlFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith(".html")) htmlFiles.push(f);
  }
})(out);

// 1. no broken internal references
const missing = new Set();
for (const h of htmlFiles) {
  const s = fs.readFileSync(h, "utf8");
  for (const m of s.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    const u = m[1].split("#")[0].split("?")[0];
    if (!u || !u.startsWith("/") || /^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    // /wiki is linked from the menu but served from a separate prebuilt app,
    // not from this build output.
    if (u === "/wiki") continue;
    const f = path.join(out, decodeURIComponent(u));
    const ok =
      fs.existsSync(f) ||
      (u.endsWith("/") && fs.existsSync(path.join(out, decodeURIComponent(u), "index.html")));
    if (!ok) missing.add(`${h.replace(out + "/", "")} -> ${m[1]}`);
  }
}
check("no broken internal refs", missing.size === 0, [...missing].slice(0, 5).join("; "));

// 2. sitemap: no ai-guidelines, all urls resolve
const smIndex = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
const subUrl = smIndex.match(/<loc>([^<]+)<\/loc>/)[1];
const subPath = path.join(out, decodeURIComponent(new URL(subUrl).pathname));
const sm = fs.readFileSync(subPath, "utf8");
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap: no /ai-guidelines", !urls.some((u) => u.includes("/ai-guidelines")));
let smMissing = 0;
for (const u of urls) {
  const p = decodeURIComponent(new URL(u).pathname);
  const f = path.join(out, p === "/" ? "/index.html" : p);
  if (!fs.existsSync(f) && !(f.endsWith("/") && fs.existsSync(path.join(f, "index.html")))) smMissing += 1;
}
check(`sitemap: all ${urls.length} urls resolve`, smMissing === 0, `${smMissing} missing`);

// 3. homepage meta
const home = fs.readFileSync(path.join(out, "index.html"), "utf8");
const homeTitle = (home.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
check("home: SEO title", homeTitle.startsWith("Risso Lab — Computational Biology"), JSON.stringify(homeTitle.slice(0, 60)));
const homeDesc = (home.match(/name="description" content="([^"]*)"/) || [])[1] || "";
check("home: description trimmed", homeDesc.length > 80 && !homeDesc.endsWith("\n"), JSON.stringify(homeDesc.slice(0, 60)));
check("home: og:image no double slash", !home.includes(".it//") && !home.includes(".io//"));
check("home: single viewport meta", (home.match(/name="viewport"/g) || []).length === 1);

// 4. favicon at root
check("root favicon.png exists", fs.existsSync(path.join(out, "favicon.png")));

// 5. publications lazy bibtex
check("pubs.bib served", fs.existsSync(path.join(out, "pubs.bib")));
const pubs = fs.readFileSync(path.join(out, "publications.html"), "utf8");
const pubsSize = fs.statSync(path.join(out, "publications.html")).size;
check("publications.html lighter (<450KB, was 476KB with embedded bibtex)", pubsSize < 450 * 1024, `${(pubsSize / 1024).toFixed(0)}KB`);
check("publications: no embedded bibtex", !pubs.includes("@article{") && !pubs.includes("@inproceedings{"));

// 6. dead images gone
const dead = [
  "images/people/dr.jpeg",
  "images/packages/mbkmeans.png",
  "images/og-image.png",
  "images/sticker.png",
  "images/packages/links.json.sh",
];
check("orphan assets removed", !dead.some((d) => fs.existsSync(path.join(out, d))));
check("generated: no 120/180/240/360/540 variants",
  !fs.readdirSync(path.join(out, "images/people/generated")).some((f) => /-(120|180|240|360|540)\.webp$/.test(f)));

// 7. total size
let total = 0;
(function walkSize(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walkSize(f);
    else total += fs.statSync(f).size;
  }
})(out);
console.log(`\nout/ total: ${(total / 1048576).toFixed(1)} MB (${htmlFiles.length} html pages)`);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
