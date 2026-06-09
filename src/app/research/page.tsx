import MDXContent from "@/helpers/MDXContent";
import DynamicIcon from "@/helpers/DynamicIcon";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";

type ResearchArea = {
  title: string;
  content: string;
};

const splitResearchContent = (content: string) => {
  const sections = content.split(/^## /m);
  const intro = sections.shift()?.trim() ?? "";
  const areas = sections
    .map((section) => {
      const [title, ...body] = section.split("\n");

      return {
        title: title.trim(),
        content: body.join("\n").trim(),
      };
    })
    .filter((area) => area.title && area.content);

  return { intro, areas };
};

const ResearchAreaCard = ({
  area,
  icon,
}: {
  area: ResearchArea;
  icon: string;
}) => {
  return (
    <article className="glass-card h-full rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 md:p-8">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-3xl bg-transparent border-2 text-2xl text-primary dark:text-darkmode-primary">
          <DynamicIcon icon={icon} aria-hidden="true" />
        </div>
        <h2 className="h4">{area.title}</h2>
      </div>
      <div className="content prose-ul:mb-0 prose-li:mb-3 last:prose-li:mb-0">
        <MDXContent content={area.content} />
      </div>
    </article>
  );
};

const Research = () => {
  const { frontmatter, content } = getListPage("research/_index.md");
  const { title, meta_title, description, image, icons = {} } = frontmatter;
  const { intro, areas } = splitResearchContent(content);

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
            <MDXContent content={intro} />
          </div>
          <div className="rounded-3xl bg-light p-5 dark:bg-darkmode-light md:p-8 lg:p-10">
            <div className="grid auto-rows-fr gap-6 lg:grid-cols-2">
              {areas.map((area) => (
                <ResearchAreaCard
                  key={area.title}
                  area={area}
                  icon={icons[area.title] ?? "FaCircleNodes"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Research;
