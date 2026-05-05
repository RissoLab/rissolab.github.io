import fs from "fs";
import path from "path";

const PUBLICATIONS_BIB_URL = "https://bibbase.org/network/files/KkByu8uHcEr482MkC";
const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "publications",
  "pubs.bib",
);

const countBibEntries = (bibtex) => {
  const matches = bibtex.match(/^@\w+\s*\{/gm);
  return matches?.length || 0;
};

const updatePublications = async () => {
  const response = await fetch(PUBLICATIONS_BIB_URL);
  if (!response.ok) {
    throw new Error(`BibTeX request failed with ${response.status}`);
  }

  const bibtex = `${(await response.text()).trim()}\n`;
  const entryCount = countBibEntries(bibtex);
  if (entryCount === 0) {
    throw new Error("Downloaded file does not contain BibTeX entries");
  }

  fs.writeFileSync(OUTPUT_PATH, bibtex);
  console.log(`Updated ${OUTPUT_PATH} with ${entryCount} BibTeX entries`);
};

updatePublications().catch((error) => {
  console.error(`Failed to update publications: ${error.message}`);
  process.exit(1);
});
