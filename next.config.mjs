import config from "./src/config/config.json" with { type: "json" };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: config.base_path !== "/" ? config.base_path : "",
  trailingSlash: config.site.trailing_slash,
  output: process.env.NEXT_OUTPUT || "standalone",
  images: {
    unoptimized: process.env.NEXT_OUTPUT === "export",
  },
};

export default nextConfig;
