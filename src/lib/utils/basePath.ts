import config from "@/config/config.json";

const basePath = config.site.base_path !== "/" ? config.site.base_path : "";

export const withBasePath = (path: string) => {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  if (!basePath || path.startsWith(`${basePath}/`) || path === basePath) {
    return path;
  }

  return `${basePath}${path}`;
};
