import { readdirSync, statSync } from "fs";
import path from "path";
import PackageHoneycombGrid from "./PackageHoneycombGrid";

const PackageHoneycomb = () => {
  const packageDirectory = path.join(process.cwd(), "public/images/packages");
  const packages = readdirSync(packageDirectory)
    .filter((file) => file.toLowerCase().endsWith(".webp"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      name: path.parse(file).name,
      image: `/images/packages/${file}?v=${
        statSync(path.join(packageDirectory, file)).mtimeMs
      }`,
    }));

  return <PackageHoneycombGrid packages={packages} />;
};

export default PackageHoneycomb;
