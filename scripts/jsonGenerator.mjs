import fs from "fs";
import matter from "gray-matter";
import path from "path";
const configPath = path.join(process.cwd(), "src", "config", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const CONTENT_DEPTH = 2;
const JSON_FOLDER = "./.json";
const SEARCHABLE_FOLDERS = config.settings.searchable_folders;

const cleanBibValue = (value) =>
  value
    .replace(/\{\\'([A-Za-z])\}/g, "$1")
    .replace(/\{\\"([A-Za-z])\}/g, "$1")
    .replace(/\{\\`([A-Za-z])\}/g, "$1")
    .replace(/\\&/g, "&")
    .replace(/\$\\beta\$/g, "beta")
    .replace(/\$\\gamma\$/g, "gamma")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const splitBibEntries = (source) => {
  const entries = [];
  let start = -1;
  let depth = 0;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === "@" && depth === 0) start = i;
    if (start !== -1 && char === "{") depth += 1;
    if (start !== -1 && char === "}") {
      depth -= 1;
      if (depth === 0) {
        entries.push(source.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return entries;
};

const parseBibFields = (body) => {
  const fields = {};
  let index = 0;

  while (index < body.length) {
    const match = body.slice(index).match(/([a-zA-Z_]+)\s*=/);
    if (!match || match.index === undefined) break;

    const key = match[1].toLowerCase();
    index += match.index + match[0].length;
    while (/\s/.test(body[index])) index += 1;

    const quote = body[index];
    const closing = quote === "{" ? "}" : quote;
    let depth = quote === "{" ? 1 : 0;
    let value = "";
    index += quote === "{" || quote === '"' ? 1 : 0;

    while (index < body.length) {
      const char = body[index];
      if (quote === "{" && char === "{") depth += 1;
      if (quote === "{" && char === "}") depth -= 1;
      if (
        (quote === "{" && depth === 0) ||
        (quote === '"' && char === closing)
      ) {
        index += 1;
        break;
      }
      value += char;
      index += 1;
    }

    fields[key] = cleanBibValue(value);
  }

  return fields;
};

const getPublicationSearchData = (folder) => {
  const bibPath = path.join(folder, "pubs.bib");
  if (!fs.existsSync(bibPath)) return [];

  const bibtex = fs.readFileSync(bibPath, "utf-8");
  return splitBibEntries(bibtex)
    .map((entry) => {
      const header = entry.match(/^@(\w+)\s*\{\s*([^,]+),/);
      if (!header) return null;

      const [, , id] = header;
      const fields = parseBibFields(entry.slice(header[0].length, -1));
      const venue = fields.journal || fields.booktitle || fields.institution;
      const content = [
        fields.title,
        fields.author,
        venue,
        fields.year,
        fields.publisher,
      ]
        .filter(Boolean)
        .join(". ");

      return {
        group: "publications",
        slug: "publications",
        frontmatter: {
          title: fields.title || id,
          description: [venue, fields.year].filter(Boolean).join(" - "),
          categories: [],
          tags: [],
        },
        content,
      };
    })
    .filter(Boolean);
};

// get data from markdown
const getData = (folder, groupDepth) => {
  const getPath = fs.readdirSync(folder);
  const removeIndex = getPath.filter((item) => !item.startsWith("_"));

  const getPaths = removeIndex.flatMap((filename) => {
    const filepath = path.join(folder, filename);
    const stats = fs.statSync(filepath);
    const isFolder = stats.isDirectory();

    if (isFolder) {
      return getData(filepath, groupDepth);
    } else if (filename.endsWith(".md") || filename.endsWith(".mdx")) {
      const file = fs.readFileSync(filepath, "utf-8");
      const { data, content } = matter(file);
      const pathParts = filepath.split(path.sep);
      const group = pathParts[groupDepth];
      const slug =
        data.slug ||
        (group === "people" ? "people" : null) ||
        pathParts
          .slice(CONTENT_DEPTH)
          .join("/")
          .replace(/\.[^/.]+$/, "");

      return {
        group: group,
        slug: slug,
        frontmatter: {
          title: data.title || "",
          description: data.description || "",
          categories: data.categories || [],
          tags: data.tags || [],
        },
        content: content,
      };
    } else {
      return [];
    }
  });

  const publishedPages = getPaths.filter(
    (page) => !page.frontmatter?.draft && page,
  );
  return folder.endsWith(`${path.sep}publications`)
    ? [...publishedPages, ...getPublicationSearchData(folder)]
    : publishedPages;
};

try {
  // create folder if it doesn't exist
  if (!fs.existsSync(JSON_FOLDER)) {
    fs.mkdirSync(JSON_FOLDER);
  }

  // create json files
  const jsonFiles = {};
  SEARCHABLE_FOLDERS.forEach((key) => {
    jsonFiles[key] = [];
  });

  SEARCHABLE_FOLDERS.forEach((folder) => {
    const folderPosts = getData(`src/content/${folder}`, 2);
    jsonFiles[folder].push(...folderPosts);
  });

  // save each json file
  Object.keys(jsonFiles).forEach((key) => {
    fs.writeFileSync(
      `${JSON_FOLDER}/${key}.json`,
      JSON.stringify(jsonFiles[key]),
    );
  });

  // merger json files for search
  const search = [];
  Object.keys(jsonFiles).forEach((key) => {
    search.push(...jsonFiles[key]);
  });

  fs.writeFileSync(`${JSON_FOLDER}/search.json`, JSON.stringify(search));
} catch (err) {
  console.error(err);
}
