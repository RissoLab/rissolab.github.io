import Social from "@/components/Social";
import ImageFallback from "@/helpers/ImageFallback";

const PeopleCard = ({
  data,
  imageShape = "circle",
  cardShape = "default",
}: {
  data: any;
  imageShape?: "circle" | "rectangle";
  cardShape?: "default" | "hexagon";
}) => {
  const {
    title,
    role,
    description,
    image,
    link,
    social = [],
  } = data.frontmatter;
  const imageClass =
    cardShape === "hexagon"
      ? "people-hex-card__image"
      : imageShape === "rectangle"
        ? "h-[120px] w-[180px] rounded"
        : "h-[120px] w-[120px] rounded-full";

  const portrait = image && (
    <ImageFallback
      className={`mx-auto ${cardShape === "hexagon" ? "mb-3" : "mb-6"} ${imageClass} object-cover transition-transform duration-300 ease-out hover:scale-110`}
      src={image}
      alt={title}
      width={
        cardShape === "hexagon" ? 76 : imageShape === "rectangle" ? 180 : 120
      }
      height={cardShape === "hexagon" ? 76 : 120}
    />
  );

  if (cardShape === "hexagon") {
    return (
      <div className="people-hex-card">
        <div className="people-hex-card__inner">
          <div className="people-hex-card__content">
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
            <h4 className="people-hex-card__title">{title}</h4>
            {role && <p className="people-hex-card__role">{role}</p>}
            {description && (
              <p className="people-hex-card__description">{description}</p>
            )}
            {social.length > 0 && (
              <Social source={social} className="people-hex-card__social" />
            )}
          </div>
        </div>
      </div>
    );
  }

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
