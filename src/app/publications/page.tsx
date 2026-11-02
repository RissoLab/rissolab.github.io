import MDXContent from "@/helpers/MDXContent";
import PublicationsList, {
  type BibPublication,
} from "@/layouts/components/PublicationsList";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";
import fs from "fs";
import path from "path";

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
      <section className="section-sm">
        <div className="container">
          <div className="content mx-auto mb-12 max-w-4xl text-lg">
            <MDXContent content={content} />
          </div>
          <div className="rounded-3xl  md:p-8 lg:p-10"> {/*bg-light p-5 dark:bg-darkmode-light*/}
            <PublicationsList publications={publications} />
          </div>
        </div>
      </section>
    </>
  );
};

export default Publications;
