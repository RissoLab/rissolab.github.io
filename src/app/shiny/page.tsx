import ImageFallback from "@/helpers/ImageFallback";
import shinyApps from "@/content/shiny/apps.json";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import fs from "fs";
import path from "path";

type ShinyApp = {
  title: string;
  url: string;
  description: string;
  image?: string;
};

const appImageSizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

const ShinyAppCard = ({ app }: { app: ShinyApp }) => {
  return (
    <article className="glass-card flex h-full flex-col rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 md:p-8">
      {app.image && (
        <ImageFallback
          className="mb-5 aspect-video w-full rounded-2xl object-cover"
          src={app.image}
          alt={app.title}
          width={1200}
          height={675}
          sizes={appImageSizes}
          loading="lazy"
        />
      )}
      <h2 className="h4">{app.title}</h2>
      <p className="mt-2 flex-1">{app.description}</p>
      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:text-primary/80 dark:text-darkmode-primary dark:hover:text-darkmode-primary/80"
      >
        Open app
        <FaArrowUpRightFromSquare className="text-sm" aria-hidden="true" />
      </a>
    </article>
  );
};

const hasImageFile = (image?: string) =>
  image && fs.existsSync(path.join(process.cwd(), "public", image));

const Shiny = () => {
  const { title, meta_title, description } = shinyApps;
  const apps = shinyApps.apps.map((app) => ({
    ...app,
    image: hasImageFile(app.image) ? app.image : undefined,
  }));

  return (
    <>
      <SeoMeta title={title} meta_title={meta_title} description={description} />
      <PageHeader title={title} />
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <ShinyAppCard key={app.url} app={app} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Shiny;
