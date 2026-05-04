import MDXContent from "@/helpers/MDXContent";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";
import fs from "fs";
import path from "path";

type BibPublication = {
  id: string;
  type: string;
  order: number;
  title?: string;
  author?: string;
  journal?: string;
  booktitle?: string;
  institution?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  year?: string;
};

const splitEntries = (source: string) => {
  const entries: string[] = [];
  let start = -1;
  let depth = 0;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === "@" && depth === 0) {
      start = i;
    }
    if (start !== -1 && char === "{") {
      depth += 1;
    }
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

const parseFields = (body: string) => {
  const fields: Record<string, string> = {};
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

const parseBibtex = (source: string): BibPublication[] =>
  splitEntries(source)
    .map((entry, order) => {
      const header = entry.match(/^@(\w+)\s*\{\s*([^,]+),/);
      if (!header) return null;

      const [, type, id] = header;
      const body = entry.slice(header[0].length, -1);

      return {
        id,
        type,
        order,
        ...parseFields(body),
      };
    })
    .filter(Boolean) as BibPublication[];

const cleanBibValue = (value: string) =>
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

const formatAuthors = (authors = "") => {
  const formatted = authors.split(/\s+and\s+/).map((author) => {
    if (author.toLowerCase() === "others") return "et al.";
    const parts = author.split(",").map((part) => part.trim());
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : author;
  });

  return formatted.join(", ");
};

const getPublications = () => {
  const bibPath = path.join(process.cwd(), "src/content/publications/pubs.bib");
  const bibtex = fs.readFileSync(bibPath, "utf-8");
  return parseBibtex(bibtex).sort((a, b) => {
    const yearDiff = Number(b.year || 0) - Number(a.year || 0);
    return yearDiff || b.order - a.order;
  });
};

const Publications = () => {
  const data = getListPage("publications/_index.md");
  const { frontmatter, content } = data;
  const { title, meta_title, description, image } = frontmatter;
  const publications = getPublications();

  return (
    <>
      <SeoMeta
        title={title}
        meta_title={meta_title}
        description={description}
        image={image}
      />
      <PageHeader title={title} />
      <section className="section">
        <div className="container">
          <div className="content">
            <MDXContent content={content} />
            <div className="not-prose mt-8 space-y-5">
              {publications.map((publication) => {
                const venue =
                  publication.journal ||
                  publication.booktitle ||
                  publication.institution;
                const details = [
                  venue,
                  publication.volume && `vol. ${publication.volume}`,
                  publication.number && `no. ${publication.number}`,
                  publication.pages && `pp. ${publication.pages}`,
                ].filter(Boolean);

                return (
                  <article
                    className="rounded border border-border bg-light p-5 dark:border-darkmode-border dark:bg-darkmode-light"
                    key={`${publication.id}-${publication.title}`}
                  >
                    <h2 className="h5 mb-3 text-text-dark dark:text-darkmode-text-dark">
                      {publication.title}
                    </h2>
                    {publication.author && (
                      <p className="mb-2 text-text dark:text-darkmode-text">
                        {formatAuthors(publication.author)}
                      </p>
                    )}
                    <p className="mb-0 text-sm text-text-light dark:text-darkmode-text-light">
                      {details.join(", ")}
                      {details.length > 0 && publication.year ? " - " : ""}
                      {publication.year}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Publications;
