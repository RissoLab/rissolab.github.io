import config from "./src/config/config.json" with { type: "json" };

const basePath = config.site.base_path !== "/" ? config.site.base_path : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  trailingSlash: config.site.trailing_slash,
  output: process.env.NEXT_OUTPUT || "standalone",
  images: {
    unoptimized: process.env.NEXT_OUTPUT === "export",
    localPatterns: [
      {
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
