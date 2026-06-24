import config from "@/config/config.json";
import ImageFallback from "@/helpers/ImageFallback";
import dateFormat from "@/lib/utils/dateFormat";
import { humanize, plainify, slugify } from "@/lib/utils/textConverter";
import { Post } from "@/types";
import Link from "next/link";
import { FaRegFolder, FaRegUserCircle } from "react-icons/fa";

const BlogCard = ({ data }: { data: Post }) => {
  const { summary_length, blog_folder } = config.settings;
  const { title, image, list_image_fit, author, categories, date } =
    data.frontmatter;
  const imageFitClass =
    list_image_fit === "cover" ? "object-cover" : "object-contain";

  return (
    <div className="glass-card h-full rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="mb-6 h-48 w-full overflow-hidden rounded-3xl sm:h-56">
        {image && (
          <ImageFallback
            className={`h-full w-full ${imageFitClass}`}
            src={image}
            alt={title}
            width={445}
            height={230}
          />
        )}
      </div>
      <h4 className="mb-3">
        <Link href={`/${blog_folder}/${data.slug}`}>{title}</Link>
      </h4>
      <ul className="mb-4">
        <li className="mr-4 inline-block">
          <Link href="/people">
            <FaRegUserCircle className={"-mt-1 mr-2 inline-block"} />
            {humanize(author)}
          </Link>
        </li>
        <li className="mr-4 inline-block">
          <FaRegFolder className={"-mt-1 mr-2 inline-block"} />
          {categories?.map((category: string, index: number) => (
            <Link key={index} href={`/categories/${slugify(category)}`}>
              {humanize(category)}
              {index !== categories.length - 1 && ", "}
            </Link>
          ))}
        </li>
        {date && <li className="inline-block">{dateFormat(date)}</li>}
      </ul>
      <p className="mb-6">
        {plainify(data.content!.slice(0, Number(summary_length)))}
      </p>
      <Link
        className="btn btn-outline-primary btn-sm"
        href={`/${blog_folder}/${data.slug}`}
      >
        read more
      </Link>
    </div>
  );
};

export default BlogCard;
