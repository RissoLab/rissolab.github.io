import MDXContent from "@/helpers/MDXContent";
import DynamicIcon from "@/helpers/DynamicIcon";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";

type WorkWithUsSection = {
  title: string;
  content: string;
};

const splitSections = (content: string) =>
  content
    .split(/^## /m)
    .filter(Boolean)
    .map((section) => {
      const [title, ...body] = section.split("\n");

      return {
        title: title.trim(),
        content: body.join("\n").trim(),
      };
    })
    .filter((section) => section.title && section.content);

const WorkWithUsCard = ({
  section,
  icon,
}: {
  section: WorkWithUsSection;
  icon: string;
}) => (
  <article className="glass-card h-full rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 md:p-8">
    <div className="mb-5 flex items-center gap-4">
      <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-3xl border-2 bg-transparent text-2xl text-primary dark:text-darkmode-primary">
        <DynamicIcon icon={icon} aria-hidden="true" />
      </div>
      <h2 className="h4">{section.title}</h2>
    </div>
    <div className="content prose-ul:mb-0 prose-li:mb-3 last:prose-li:mb-0">
      <MDXContent content={section.content} />
    </div>
  </article>
);

const WorkWithUs = () => {
  const { frontmatter, content } = getListPage("work-with-us/_index.md");
  const { title, meta_title, description, image, icons = {} } = frontmatter;
  const sections = splitSections(content);

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
          <div className="rounded-3xl bg-light p-5 dark:bg-darkmode-light md:p-8 lg:p-10">
            <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-2">
              {sections.map((section) => (
                <WorkWithUsCard
                  key={section.title}
                  section={section}
                  icon={icons[section.title] ?? "FaCircleNodes"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WorkWithUs;
