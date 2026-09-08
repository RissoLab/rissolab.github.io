import MDXContent from "@/helpers/MDXContent";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";

const AiGuidelines = () => {
  const { frontmatter, content } = getListPage("ai-guidelines/_index.md");
  const { title, meta_title, description, image } = frontmatter;

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
          <div className="content mx-auto max-w-4xl">
            <MDXContent content={content} />
          </div>
        </div>
      </section>
    </>
  );
};

export default AiGuidelines;
