import Social from "@/components/Social";
import ImageFallback from "@/helpers/ImageFallback";

const PeopleCard = ({
  data,
  imageShape = "circle",
}: {
  data: any;
  imageShape?: "circle" | "rectangle";
}) => {
  const { title, role, description, image, link, social = [] } =
    data.frontmatter;
  const imageClass =
    imageShape === "rectangle"
      ? "h-[120px] w-[180px] rounded"
      : "h-[120px] w-[120px] rounded-full";

  const portrait = image && (
    <ImageFallback
      className={`mx-auto mb-6 ${imageClass} object-cover transition-transform duration-300 ease-out hover:scale-110`}
      src={image}
      alt={title}
      width={imageShape === "rectangle" ? 180 : 120}
      height={120}
    />
  );

  return (
    <div className="h-full rounded bg-light p-8 text-center dark:bg-darkmode-light">
      {link ? (
        <a
          aria-label={title}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {portrait}
        </a>
      ) : (
        portrait
      )}
      <h4 className="mb-3">{title}</h4>
      {role && <p className="mb-2 font-medium">{role}</p>}
      {description && <p className="mb-4">{description}</p>}
      {social.length > 0 && <Social source={social} className="social-icons" />}
    </div>
  );
};

export default PeopleCard;
