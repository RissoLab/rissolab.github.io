import Breadcrumbs from "@/components/Breadcrumbs";
import { humanize } from "@/lib/utils/textConverter";

const PageHeader = ({ title }: { title: string }) => {
  return (
    <section>
      <div className="container px-8 py-14 text-center">
        <h1>{humanize(title)}</h1>
        <Breadcrumbs className="mt-6" />
      </div>
    </section>
  );
};

export default PageHeader;
