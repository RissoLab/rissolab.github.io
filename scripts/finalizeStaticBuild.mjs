import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public");
const outDir = path.join(process.cwd(), "out");

if (!fs.existsSync(outDir)) {
  throw new Error("Static output directory not found: out");
}

const copyIfExists = (filename) => {
  const source = path.join(publicDir, filename);
  if (!fs.existsSync(source)) return;
  fs.copyFileSync(source, path.join(outDir, filename));
};

fs.readdirSync(publicDir)
  .filter((filename) => /^sitemap.*\.xml$/.test(filename))
  .forEach(copyIfExists);

copyIfExists("robots.txt");
copyIfExists("llms.txt");
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

console.log("Finalized static export in out/");
