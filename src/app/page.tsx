import ImageFallback from "@/helpers/ImageFallback";
import MDXContent from "@/helpers/MDXContent";
import { getListPage } from "@/lib/contentParser";
import { markdownify } from "@/lib/utils/textConverter";
import SeoMeta from "@/partials/SeoMeta";
import PackageHoneycomb from "@/components/PackageHoneycomb";
import { Button, Feature } from "@/types";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";

const Home = () => {
  const homepage = getListPage("homepage/_index.md");
  const { frontmatter, content } = homepage;
  const {
    banner,
    features,
  }: {
    banner: { title: string; image: string; content?: string; button?: Button };
    features: Feature[];
  } = frontmatter;

  return (
    <>
      <SeoMeta />
      <section className="section pt-14">
        <div className="container">
          <div className="row justify-center">
            <div className="lg:col-7 md:col-9 mb-8 text-center">
              <h1
                className="mb-4 text-h3 font-extrabold leading-[1.05] tracking-[-0.04em] lg:text-h1"
                dangerouslySetInnerHTML={markdownify(banner.title)}
              />
              <p
                className="mb-8 text-base font-medium leading-relaxed text-text-light dark:text-darkmode-text-light md:text-lg"
                dangerouslySetInnerHTML={markdownify(banner.content ?? "")}
              />
              {banner.button!.enable && (
                <Link
                  className="btn btn-primary"
                  href={banner.button!.link}
                  target={
                    banner.button!.link.startsWith("http") ? "_blank" : "_self"
                  }
                  rel="noopener"
                >
                  {banner.button!.label}
                </Link>
              )}
            </div>
            {banner.image && (
              <div className="col-12 lg:mt-20">
                <ImageFallback
                  src={banner.image}
                  className="mx-auto w-56 md:w-72 h-auto"
                  width="800"
                  height="420"
                  alt="banner image"
                  priority
                />
              </div>
            )}
            {content && (
              <div className="lg:col-8 md:col-10 content mt-10">
                <MDXContent content={content} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 xl:py-16">
        <div className="container">
          <div className="space-y-6 rounded-3xl bg-light p-5 dark:bg-darkmode-light md:p-8 lg:p-10">
            {features.map((feature, index: number) => (
              <div
                key={index}
                className="glass-card rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 md:p-10 lg:p-12"
              >
                <div className="row items-center justify-between">
                  <div
                    className={`order-2 mt-6 md:col-5 md:mt-0 ${
                      index % 2 !== 0 ? "md:order-2" : "md:order-1"
                    }`}
                  >
                    {feature.layout === "package-honeycomb" ? (
                      <PackageHoneycomb />
                    ) : (
                      <ImageFallback
                        src={feature.image}
                        height={480}
                        width={520}
                        alt={feature.title}
                      />
                    )}
                  </div>
                  <div
                    className={`order-1 md:col-7 lg:col-6 ${
                      index % 2 !== 0 ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <h2
                      className="mb-4"
                      dangerouslySetInnerHTML={markdownify(feature.title)}
                    />
                    <p
                      className="mb-8 text-lg"
                      dangerouslySetInnerHTML={markdownify(feature.content)}
                    />
                    <ul>
                      {feature.bulletpoints.map((bullet: string) => (
                        <li className="relative mb-4 pl-6" key={bullet}>
                          <FaCheck className={"absolute left-0 top-1.5"} />
                          <span dangerouslySetInnerHTML={markdownify(bullet)} />
                        </li>
                      ))}
                    </ul>
                    {feature.button.enable && (
                      <Link
                        className="btn btn-primary mt-5"
                        href={feature.button.link}
                      >
                        {feature.button.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
