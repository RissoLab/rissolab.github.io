import Social from "@/components/Social";
import ImageFallback from "@/helpers/ImageFallback";
import { getListPage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";
import { RegularPage } from "@/types";

const Contact = async () => {
  const data: RegularPage = getListPage("contact/_index.md");
  const { frontmatter } = data;
  const { title, description, meta_title, image, contact } = frontmatter as any;

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
          <div className="row justify-center">
            <div className="lg:col-8">
              <div className="row items-center rounded-3xl bg-light p-8 dark:bg-darkmode-light">
                <div className="mb-8 text-center md:col-4 md:mb-0">
                  <ImageFallback
                    src={contact.image}
                    alt={contact.name}
                    width={200}
                    height={200}
                    className="mx-auto h-[200px] w-[200px] rounded-full object-cover"
                  />
                </div>
                <div className="text-center md:col-8 md:text-left">
                  <h2 className="h4 mb-3">{contact.title}</h2>
                  <p className="mb-1">{contact.role}</p>
                  <p className="mb-1">{contact.department}</p>
                  <p className="mb-5">{contact.institution}</p>
                  <Social source={contact.social} className="social-icons" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
