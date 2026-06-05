import fs from "fs";
import crypto from "crypto";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");
const CACHE_DIR = path.join(process.cwd(), ".cache", "scholar-publications");
const OUTPUT_PATH = path.join(CONTENT_DIR, "publications", "pubs.bib");
const SCHOLAR_BASE_URL = "https://scholar.google.com";
const CROSSREF_WORKS_URL = "https://api.crossref.org/works";
const SCHOLAR_USER_PAGE_SIZE = 100;
const SCHOLAR_REQUEST_DELAY_MS = 750;
const SCHOLAR_MAX_RETRIES = 3;
const SCHOLAR_MAX_429_DELAY_MS = 10 * 60 * 1000;
const CROSSREF_REQUEST_DELAY_MS = 250;
const CROSSREF_MAX_RETRIES = 3;
const CROSSREF_MAX_429_DELAY_MS = 5 * 60 * 1000;
const CACHE_TTL_DAYS = Number(process.env.PUBLICATIONS_CACHE_TTL_DAYS || 14);
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
const FORCE_REFRESH = process.env.PUBLICATIONS_FORCE_REFRESH === "1";

const htmlDecodeMap = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const walkFiles = (directory) => {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const decodeHtml = (value = "") =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name) => htmlDecodeMap[name.toLowerCase()] || entity,
    );

const stripHtml = (value = "") =>
  decodeHtml(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const delay = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const cachePath = (namespace, key) =>
  path.join(
    CACHE_DIR,
    namespace,
    `${crypto.createHash("sha256").update(key).digest("hex")}.json`,
  );

const readCache = (namespace, key) => {
  const filePath = cachePath(namespace, key);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
};

const writeCache = (namespace, key, payload) => {
  const filePath = cachePath(namespace, key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        cachedAt: new Date().toISOString(),
        payload,
      },
      null,
      2,
    ),
  );
};

const isFreshCache = (cacheEntry) =>
  cacheEntry?.cachedAt &&
  Date.now() - new Date(cacheEntry.cachedAt).getTime() < CACHE_TTL_MS;

const staleCacheMessage = (source, url) =>
  `Using stale ${source} cache after request failure: ${url}`;

const retryAfterDelay = (response, attempt, baseDelay, maxDelay) => {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds)) {
      return retryAfterSeconds * 1000;
    }

    const retryAfterDate = Date.parse(retryAfter);

    if (!Number.isNaN(retryAfterDate)) {
      return Math.max(retryAfterDate - Date.now(), baseDelay);
    }
  }

  const exponentialDelay = Math.min(
    baseDelay * 2 ** Math.min(attempt, 8),
    maxDelay,
  );
  const jitter = Math.round(Math.random() * baseDelay);

  return exponentialDelay + jitter;
};

const findScholarIds = () => {
  const ids = new Set();
  const markdownFiles = walkFiles(CONTENT_DIR).filter((file) =>
    file.endsWith(".md"),
  );

  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.matchAll(
      /name:\s*["']?Google Scholar["']?[\s\S]*?id:\s*["']([^"']+)["']/g,
    );

    for (const match of matches) {
      ids.add(match[1].trim());
    }
  }

  return [...ids];
};

const fetchScholarPage = async (url, attempt = 1) => {
  const cached = readCache("scholar", url);

  if (!FORCE_REFRESH && isFreshCache(cached)) {
    return cached.payload;
  }

  await delay(SCHOLAR_REQUEST_DELAY_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const waitMs = retryAfterDelay(
          response,
          attempt,
          SCHOLAR_REQUEST_DELAY_MS,
          SCHOLAR_MAX_429_DELAY_MS,
        );
        console.warn(
          `Scholar returned 429. Waiting ${Math.round(waitMs / 1000)}s before continuing: ${url}`,
        );
        await delay(waitMs);
        return fetchScholarPage(url, attempt + 1);
      }

      if (response.status >= 500 && attempt < SCHOLAR_MAX_RETRIES) {
        await delay(SCHOLAR_REQUEST_DELAY_MS * attempt * 4);
        return fetchScholarPage(url, attempt + 1);
      }

      if (cached) {
        console.warn(staleCacheMessage("Scholar", url));
        return cached.payload;
      }

      throw new Error(`Scholar request failed with ${response.status}: ${url}`);
    }

    const html = await response.text();
    writeCache("scholar", url, html);
    return html;
  } catch (error) {
    if (cached) {
      console.warn(staleCacheMessage("Scholar", url));
      return cached.payload;
    }

    throw error;
  }
};

const fetchCrossrefJson = async (url, attempt = 1) => {
  const cached = readCache("crossref", url);

  if (!FORCE_REFRESH && isFreshCache(cached)) {
    return cached.payload;
  }

  await delay(CROSSREF_REQUEST_DELAY_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "RissoLabPublicationGenerator/1.0 (https://example.com; mailto:davide.risso@unipd.it)",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const waitMs = retryAfterDelay(
          response,
          attempt,
          CROSSREF_REQUEST_DELAY_MS,
          CROSSREF_MAX_429_DELAY_MS,
        );
        console.warn(
          `Crossref returned 429. Waiting ${Math.round(waitMs / 1000)}s before continuing: ${url}`,
        );
        await delay(waitMs);
        return fetchCrossrefJson(url, attempt + 1);
      }

      if (response.status >= 500 && attempt < CROSSREF_MAX_RETRIES) {
        await delay(CROSSREF_REQUEST_DELAY_MS * attempt * 4);
        return fetchCrossrefJson(url, attempt + 1);
      }

      if (cached) {
        console.warn(staleCacheMessage("Crossref", url));
        return cached.payload;
      }

      throw new Error(
        `Crossref request failed with ${response.status}: ${url}`,
      );
    }

    const json = await response.json();
    writeCache("crossref", url, json);
    return json;
  } catch (error) {
    if (cached) {
      console.warn(staleCacheMessage("Crossref", url));
      return cached.payload;
    }

    throw error;
  }
};

const parseAuthorPublications = (html) => {
  const publications = [];
  const rowPattern = /<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[1];
    const citationMatch = row.match(/citation_for_view=([^"&]+)["&]/);
    const titleMatch = row.match(
      /<a[^>]+class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/,
    );
    const detailMatches = [
      ...row.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g),
    ];
    const yearMatch = row.match(
      /<span class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<\/span>/,
    );

    if (!citationMatch || !titleMatch) {
      continue;
    }

    publications.push({
      authorSummary: stripHtml(detailMatches[0]?.[1] || ""),
      citationId: decodeURIComponent(citationMatch[1]),
      title: stripHtml(titleMatch[1]),
      venueSummary: stripHtml(detailMatches[1]?.[1] || ""),
      year: yearMatch?.[1],
    });
  }

  return publications;
};

const parseCitationDetails = (html) => {
  const details = {};
  const fieldPattern =
    /<div class="gsc_oci_field">([\s\S]*?)<\/div>\s*<div class="gsc_oci_value">([\s\S]*?)<\/div>/g;

  for (const match of html.matchAll(fieldPattern)) {
    const key = stripHtml(match[1]).toLowerCase();
    const value = stripHtml(match[2]);

    if (key && value) {
      details[key] = value;
    }
  }

  return details;
};

const detailsUrl = (scholarId, citationId) => {
  const params = new URLSearchParams({
    citation_for_view: citationId,
    hl: "en",
    user: scholarId,
    view_op: "view_citation",
  });

  return `${SCHOLAR_BASE_URL}/citations?${params.toString()}`;
};

const authorUrl = (scholarId, start = 0) => {
  const params = new URLSearchParams({
    cstart: String(start),
    hl: "en",
    pagesize: String(SCHOLAR_USER_PAGE_SIZE),
    user: scholarId,
  });

  return `${SCHOLAR_BASE_URL}/citations?${params.toString()}`;
};

const collectScholarPublications = async (scholarId) => {
  const publications = [];
  let start = 0;

  while (true) {
    const html = await fetchScholarPage(authorUrl(scholarId, start));
    const pagePublications = parseAuthorPublications(html);
    publications.push(...pagePublications);

    if (pagePublications.length < SCHOLAR_USER_PAGE_SIZE) {
      break;
    }

    start += SCHOLAR_USER_PAGE_SIZE;
  }

  const detailedPublications = [];

  for (const publication of publications) {
    const html = await fetchScholarPage(
      detailsUrl(scholarId, publication.citationId),
    );

    detailedPublications.push({
      ...publication,
      details: parseCitationDetails(html),
    });
  }

  return detailedPublications;
};

const normalizeKeyPart = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalizeTitle = (value = "") => normalizeKeyPart(value).join(" ");

const isLikelySameTitle = (sourceTitle = "", candidateTitle = "") => {
  const source = normalizeTitle(sourceTitle);
  const candidate = normalizeTitle(candidateTitle);

  if (!source || !candidate) {
    return false;
  }

  return (
    source === candidate ||
    source.includes(candidate) ||
    candidate.includes(source)
  );
};

const crossrefUrl = (title) => {
  const params = new URLSearchParams({
    "query.title": title,
    rows: "1",
    select: "DOI,URL,abstract,title",
  });

  return `${CROSSREF_WORKS_URL}?${params.toString()}`;
};

const findCrossrefDetails = async (publication) => {
  const title = publication.details.title || publication.title;

  if (!title) {
    return {};
  }

  try {
    const data = await fetchCrossrefJson(crossrefUrl(title));
    const item = data?.message?.items?.[0];
    const crossrefTitle = item?.title?.[0];

    if (!item || !isLikelySameTitle(title, crossrefTitle)) {
      return {};
    }

    return {
      abstract: item.abstract ? stripHtml(item.abstract) : undefined,
      doi: item.DOI,
      url: item.URL,
    };
  } catch (error) {
    console.warn(
      `Skipping Crossref enrichment for "${title}": ${error.message}`,
    );
    return {};
  }
};

const enrichPublications = async (publications) => {
  const enrichedPublications = [];

  for (const publication of publications) {
    const crossref = await findCrossrefDetails(publication);

    enrichedPublications.push({
      ...publication,
      crossref,
    });
  }

  return enrichedPublications;
};

const citationKey = (publication, usedKeys) => {
  const authors =
    publication.details.authors ||
    publication.details.author ||
    publication.authorSummary ||
    "publication";
  const firstAuthor =
    normalizeKeyPart(authors.split(",")[0])[0] || "publication";
  const titlePart =
    normalizeKeyPart(publication.details.title || publication.title)[0] ||
    "work";
  const year = publication.details.year || publication.year || "n.d.";
  const baseKey = `${firstAuthor}${year}${titlePart}`;
  let key = baseKey;
  let suffix = 2;

  while (usedKeys.has(key)) {
    key = `${baseKey}${suffix}`;
    suffix += 1;
  }

  usedKeys.add(key);
  return key;
};

const bibEscape = (value = "") =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/&/g, "\\&");

const bibType = (details) => {
  const publication = (details.publication || "").toLowerCase();
  const journal = details.journal || details["journal name"];

  if (journal || publication.includes("journal")) {
    return "article";
  }

  if (details.conference || details["conference name"]) {
    return "inproceedings";
  }

  if (details.book || details.publisher) {
    return "incollection";
  }

  return "misc";
};

const formatBibAuthors = (authors = "") =>
  authors
    .split(/\s*,\s*/)
    .map((author) => author.trim())
    .filter(Boolean)
    .join(" and ");

const bibFields = (publication) => {
  const details = publication.details;
  const crossref = publication.crossref || {};
  const fields = {
    title: details.title || publication.title,
    author: formatBibAuthors(
      details.authors || details.author || publication.authorSummary,
    ),
    journal: details.journal || details.publication,
    booktitle: details.conference || details.book || details["conference name"],
    volume: details.volume,
    number: details.issue,
    pages: details.pages,
    publisher: details.publisher,
    year: details.year || publication.year,
    doi: details.doi || crossref.doi,
    url: details.url || crossref.url,
    abstract: details.description || crossref.abstract,
  };

  return Object.entries(fields).filter(([, value]) => value);
};

const toBibtex = (publications) => {
  const usedKeys = new Set();

  return `${publications
    .map((publication) => {
      const type = bibType(publication.details);
      const key = citationKey(publication, usedKeys);
      const fields = bibFields(publication)
        .map(([field, value]) => `  ${field}={${bibEscape(value)}},`)
        .join("\n");

      return `@${type}{${key},\n${fields}\n}`;
    })
    .join("\n\n")}\n`;
};

const uniquePublications = (publications) => {
  const seen = new Set();

  return publications.filter((publication) => {
    const key = [
      publication.details.title || publication.title,
      publication.details.year || publication.year,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const generateScholarPublications = async () => {
  const scholarIds = findScholarIds();

  if (scholarIds.length === 0) {
    throw new Error("No Google Scholar ids found in content markdown files");
  }

  const publications = await enrichPublications(
    uniquePublications(
      (await Promise.all(scholarIds.map(collectScholarPublications))).flat(),
    ),
  ).sort((a, b) => {
    const yearDiff =
      Number(b.details.year || b.year || 0) -
      Number(a.details.year || a.year || 0);

    return (
      yearDiff ||
      (a.details.title || a.title).localeCompare(b.details.title || b.title)
    );
  });

  if (publications.length === 0) {
    throw new Error("No Google Scholar publications found");
  }

  fs.writeFileSync(OUTPUT_PATH, toBibtex(publications));
  console.log(
    `Updated ${OUTPUT_PATH} with ${publications.length} BibTeX entries from ${scholarIds.length} Google Scholar profile(s)`,
  );
};

generateScholarPublications().catch((error) => {
  console.error(`Failed to generate publications: ${error.message}`);
  process.exit(1);
});
