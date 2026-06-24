import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "src", "content");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(publicDir, "images", "people", "generated");
const sizes = [120, 180, 224, 240, 360, 448, 540, 672];

const imagePattern = /image:\s*["'](\/images\/people\/[^"']+)["']/g;

const walkMarkdownFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walkMarkdownFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );

  return files.flat();
};

const discoverPeopleImages = async () => {
  const files = await walkMarkdownFiles(contentDir);
  const images = new Set();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");

    for (const match of content.matchAll(imagePattern)) {
      const image = match[1].split("?")[0];

      if (!image.includes("/generated/")) {
        images.add(image);
      }
    }
  }

  return [...images].sort();
};

const outputName = (imagePath, size) => {
  const extension = path.extname(imagePath);
  const basename = path.basename(imagePath, extension);

  return `${basename}-${size}.webp`;
};

const generateVariant = async (imagePath, size) => {
  const input = path.join(publicDir, imagePath);
  const output = path.join(outputDir, outputName(imagePath, size));

  await sharp(input)
    .rotate()
    .resize(size, size, {
      fit: "cover",
      position: "attention",
      withoutEnlargement: false,
    })
    .sharpen()
    .webp({ quality: 92, effort: 6 })
    .toFile(output);
};

const main = async () => {
  const images = await discoverPeopleImages();

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  for (const image of images) {
    await fs.access(path.join(publicDir, image));

    for (const size of sizes) {
      await generateVariant(image, size);
    }
  }

  console.log(
    `Generated ${images.length * sizes.length} people image variants in ${path.relative(rootDir, outputDir)}/`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
