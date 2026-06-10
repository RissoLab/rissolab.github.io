"use client";

import Social from "@/components/Social";
import ImageFallback from "@/helpers/ImageFallback";
import { KeyboardEvent, MouseEvent, useEffect, useState } from "react";

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
        tabIndex={hasSocial && canToggleHexSocial ? 0 : undefined}
      >
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
