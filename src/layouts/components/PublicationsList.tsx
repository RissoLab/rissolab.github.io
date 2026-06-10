"use client";

import { useEffect, useRef, useState } from "react";
import { IoCheckmark, IoCopyOutline } from "react-icons/io5";

export type BibPublication = {
  id: string;
  type: string;
  order: number;
  bibtex: string;
  title?: string;
  author?: string;
  journal?: string;
  booktitle?: string;
  institution?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  year?: string;
  abstract?: string;
  doi?: string;
  url?: string;
};

const formatAuthors = (authors = "") => {
  const formatted = authors.split(/\s+and\s+/).map((author) => {
    if (author.toLowerCase() === "others") return "et al.";
    const parts = author.split(",").map((part) => part.trim());
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : author;
  });

  return formatted.join(", ");
};

const publicationLink = (publication: BibPublication) => {
  if (publication.url) {
    return publication.url;
  }

  if (publication.doi) {
    return `https://doi.org/${publication.doi}`;
  }

  return null;
};

const PublicationsList = ({
  publications,
}: {
  publications: BibPublication[];
}) => {
  const [openPublicationId, setOpenPublicationId] = useState<string | null>(
    null,
  );
  const [copiedPublicationId, setCopiedPublicationId] = useState<string | null>(
    null,
  );
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const copyBibtex = async (publication: BibPublication) => {
    try {
      await navigator.clipboard.writeText(publication.bibtex);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = publication.bibtex;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedPublicationId(publication.id);

    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedPublicationId(null), 2000);
  };

  useEffect(
    () => () => {
      clearHoverTimer();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  return (
    <div className="not-prose space-y-5">
      {publications.map((publication) => {
        const itemId = `${publication.id}-${publication.title}`;
        const isOpen = openPublicationId === itemId;
        const venue =
          publication.journal ||
          publication.booktitle ||
          publication.institution;
        const details = [
          venue,
          publication.volume && `vol. ${publication.volume}`,
          publication.number && `no. ${publication.number}`,
          publication.pages && `pp. ${publication.pages}`,
        ].filter(Boolean);
        const link = publicationLink(publication);
        const hasExpandedContent = Boolean(publication.abstract);
        const titleClassName =
          "mb-3 block text-lg font-semibold leading-snug text-text-dark dark:text-darkmode-text-dark";

        return (
          <article
            className="glass-card rounded-xl transition-transform duration-200 ease-out hover:scale-[1.01]"
            key={itemId}
            onMouseEnter={() => {
              clearHoverTimer();

              if (hasExpandedContent) {
                hoverTimer.current = setTimeout(() => {
                  setOpenPublicationId(itemId);
                }, 3000);
              }
            }}
            onMouseLeave={clearHoverTimer}
          >
            <div
              aria-expanded={isOpen}
              className="block w-full cursor-pointer p-5 text-left"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpenPublicationId((current) =>
                    current === itemId ? null : itemId,
                  );
                }
              }}
              onClick={() =>
                setOpenPublicationId((current) =>
                  current === itemId ? null : itemId,
                )
              }
              role="button"
              tabIndex={0}
            >
              {link ? (
                <a
                  className={`${titleClassName} hover:text-primary dark:hover:text-darkmode-primary`}
                  href={link}
                  onClick={(event) => event.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {publication.title}
                </a>
              ) : (
                <span className={titleClassName}>{publication.title}</span>
              )}
              {publication.author && (
                <p className="mb-2 text-text dark:text-darkmode-text">
                  {formatAuthors(publication.author)}
                </p>
              )}
              <p className="mb-0 text-sm text-text-light dark:text-darkmode-text-light">
                {details.join(", ")}
                {details.length > 0 && publication.year ? " - " : ""}
                {publication.year}
              </p>
            </div>
            {hasExpandedContent && (
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-1">
                    {publication.abstract && (
                      <p className="mb-0 text-sm leading-relaxed text-text dark:text-darkmode-text">
                        <span className="font-semibold text-text-dark dark:text-darkmode-text-dark">
                          Abstract.
                        </span>{" "}
                        {publication.abstract}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end border-t border-white/60 px-5 py-3 dark:border-white/10">
              <button
                aria-label={`Copy BibTeX for ${publication.title}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/40 px-3 py-1.5 text-xs font-semibold text-text-dark shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-darkmode-text-dark dark:hover:border-darkmode-primary/30 dark:hover:text-darkmode-primary"
                onClick={() => void copyBibtex(publication)}
                type="button"
              >
                {copiedPublicationId === publication.id ? (
                  <>
                    <IoCheckmark aria-hidden="true" className="text-base" />
                    Copied
                  </>
                ) : (
                  <>
                    <IoCopyOutline aria-hidden="true" className="text-base" />
                    Copy BibTeX
                  </>
                )}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PublicationsList;
