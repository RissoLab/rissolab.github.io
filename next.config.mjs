import config from "./src/config/config.json" with { type: "json" };
import fs from "fs";
import path from "path";

const basePath = config.site.base_path !== "/" ? config.site.base_path : "";
const isExport = process.env.NEXT_OUTPUT === "export";

// The wiki (prebuilt, see scripts/buildWiki.mjs) is published with its docs
// section at the /wiki root. It is exported with trailingSlash: true
// (directory indexes), while the site uses trailingSlash: false, so in dev
// /foo/ URLs are normalized to /foo. One rewrite per wiki page (every
// directory with an index.html in the flattened public/.wiki-dev mirror)
// covers the extension-less URLs; assets do not match and are served as-is.
const wikiDevRewrites = (() => {
  if (isExport) {
    return {};
  }

  const mirrorDir = path.join(process.cwd(), "public", ".wiki-dev");
  const slugs = [];

  const walk = (dir, prefix) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (fs.existsSync(path.join(dir, entry.name, "index.html"))) {
        slugs.push(slug);
      }
      walk(path.join(dir, entry.name), slug);
    }
  };
  walk(mirrorDir, "");

  return {
    async rewrites() {
      return {
        beforeFiles: [
          { source: "/wiki", destination: "/.wiki-dev/index.html" },
          ...slugs.map((slug) => ({
            source: `/wiki/${slug}`,
            destination: `/.wiki-dev/${slug}.html`,
          })),
        ],
      };
    },
  };
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  trailingSlash: config.site.trailing_slash,
  output: process.env.NEXT_OUTPUT || "standalone",
  ...wikiDevRewrites,
  images: {
    unoptimized: process.env.NEXT_OUTPUT === "export",
    qualities: [75, 90, 95],
    localPatterns: [
      {
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
