"use client";

import Social from "@/components/Social";
import ImageFallback from "@/helpers/ImageFallback";
import { withBasePath } from "@/lib/utils/basePath";
import {
  CSSProperties,
  KeyboardEvent,
  ImgHTMLAttributes,
  MouseEvent,
  useEffect,
  useState,
} from "react";

const hexagonMask = {
  clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
  WebkitClipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
} as CSSProperties;

const hexagonImageSize = 224;
const hexagonImageSizes =
  "(min-width: 1280px) 224px, (min-width: 1024px) 192px, 160px";

const peopleImageSizes = {
  circle: [120, 240, 360],
  hexagon: [224, 448, 672],
  rectangle: [180, 360, 540],
};

const isPeopleImage = (src: unknown) =>
  typeof src === "string" &&
  src.startsWith("/images/people/") &&
  !src.includes("/generated/");

const generatedPeopleImage = (
  src: string,
  imageType: keyof typeof peopleImageSizes,
) => {
  const extensionIndex = src.lastIndexOf(".");
  const directory = src.slice(0, src.lastIndexOf("/"));
  const basename = src.slice(src.lastIndexOf("/") + 1, extensionIndex);
  const sizes = peopleImageSizes[imageType];

  return {
    src: `${directory}/generated/${basename}-${sizes[1]}.webp`,
    srcSet: sizes
      .map(
        (size, index) =>
          `${directory}/generated/${basename}-${size}.webp ${index + 1}x`,
      )
      .join(", "),
  };
};

const StaticPeopleImage = ({
  fallbackSrc,
  src,
  srcSet,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc: string;
  src: string;
  srcSet: string;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgSrcSet, setImgSrcSet] = useState(srcSet);

  useEffect(() => {
    setImgSrc(src);
    setImgSrcSet(srcSet);
  }, [src, srcSet]);

  return (
    <img
      {...props}
      src={withBasePath(imgSrc)}
      srcSet={
        imgSrcSet
          ? imgSrcSet
              .split(", ")
              .map((entry) => {
                const [entrySrc, descriptor] = entry.split(" ");

                return `${withBasePath(entrySrc)} ${descriptor}`;
              })
              .join(", ")
          : undefined
      }
      onError={() => {
        setImgSrc(fallbackSrc);
        setImgSrcSet("");
      }}
    />
  );
};

const PeopleCard = ({
  data,
  imageShape = "circle",
  cardShape = "default",
}: {
  data: any;
  imageShape?: "circle" | "rectangle";
  cardShape?: "default" | "hexagon";
}) => {
  const [showHexSocial, setShowHexSocial] = useState(false);
  const [canToggleHexSocial, setCanToggleHexSocial] = useState(false);
  const {
    title,
    role,
    description,
    image,
    link,
    social = [],
  } = data.frontmatter;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 919px)");
    const updateCanToggle = () => {
      setCanToggleHexSocial(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setShowHexSocial(false);
      }
    };

    updateCanToggle();
    mediaQuery.addEventListener("change", updateCanToggle);

    return () => {
      mediaQuery.removeEventListener("change", updateCanToggle);
    };
  }, []);
  const imageClass =
    cardShape === "hexagon"
      ? "people-hex-card__image"
      : imageShape === "rectangle"
        ? "h-[120px] w-[180px] rounded"
        : "h-[120px] w-[120px] rounded-full";
  const imageType =
    cardShape === "hexagon"
      ? "hexagon"
      : imageShape === "rectangle"
        ? "rectangle"
        : "circle";
  const imageWidth =
    cardShape === "hexagon"
      ? hexagonImageSize
      : imageShape === "rectangle"
        ? 180
        : 120;
  const imageHeight = cardShape === "hexagon" ? hexagonImageSize : 120;
  const staticPeopleImage =
    isPeopleImage(image) && generatedPeopleImage(image, imageType);

  const portrait =
    image &&
    (staticPeopleImage ? (
      <StaticPeopleImage
        className={`mx-auto ${cardShape === "hexagon" ? "mb-3" : "mb-6"} ${imageClass} object-cover transition-transform duration-300 ease-out hover:scale-110`}
        src={staticPeopleImage.src}
        srcSet={staticPeopleImage.srcSet}
        alt={title}
        width={imageWidth}
        height={imageHeight}
        loading="lazy"
        decoding="async"
        fallbackSrc={image}
      />
    ) : (
      <ImageFallback
        className={`mx-auto ${cardShape === "hexagon" ? "mb-3" : "mb-6"} ${imageClass} object-cover transition-transform duration-300 ease-out hover:scale-110`}
        src={image}
        alt={title}
        width={imageWidth}
        height={imageHeight}
        quality={cardShape === "hexagon" ? 95 : 90}
        sizes={
          cardShape === "hexagon"
            ? hexagonImageSizes
            : imageShape === "rectangle"
              ? "180px"
              : "120px"
        }
      />
    ));

  if (cardShape === "hexagon") {
    const hasSocial = social.length > 0;
    const toggleHexSocial = () => {
      if (hasSocial && canToggleHexSocial) {
        setShowHexSocial((current) => !current);
      }
    };
    const handleHexClick = (event: MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("a")) {
        return;
      }
      toggleHexSocial();
    };
    const handleHexKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleHexSocial();
      }
    };
    const hexCardClass = [
      "people-hex-card",
      hasSocial ? "people-hex-card--has-social" : "",
      showHexSocial ? "people-hex-card--social-open" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        aria-expanded={
          hasSocial && canToggleHexSocial ? showHexSocial : undefined
        }
        aria-label={
          hasSocial && canToggleHexSocial ? `${title} social links` : undefined
        }
        className={hexCardClass}
        onClick={handleHexClick}
        onKeyDown={handleHexKeyDown}
        role={hasSocial && canToggleHexSocial ? "button" : undefined}
        style={hexagonMask}
        tabIndex={hasSocial && canToggleHexSocial ? 0 : undefined}
      >
        <div className="people-hex-card__inner" style={hexagonMask}>
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
            <h4 className="people-hex-card__title">
              {link && !image ? (
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {title}
                </a>
              ) : (
                title
              )}
            </h4>
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
    <div className="glass-card h-full rounded-3xl p-8 text-center">
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
