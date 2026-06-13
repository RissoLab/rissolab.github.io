"use client";

import searchData from ".json/search.json" with { type: "json" };
import React, { useEffect, useRef, useState } from "react";
import SearchResult, { type ISearchItem } from "./SearchResult";

const SearchModal = () => {
  const [searchString, setSearchString] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // handle input change
  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    setSearchString(e.currentTarget.value.toLowerCase());
    setSelectedIndex(-1);
  };

  // generate search result
  const doSearch = (searchData: ISearchItem[]) => {
    if (searchString === "") {
      return [];
    } else {
      const searchResult = searchData.filter((item) => {
        const title = item.frontmatter.title
          .toLowerCase()
          .includes(searchString);
        const description = item.frontmatter.description
          ?.toLowerCase()
          .includes(searchString);
        const categories = item.frontmatter.categories
          ?.join(" ")
          .toLowerCase()
          .includes(searchString);
        const tags = item.frontmatter.tags
          ?.join(" ")
          .toLowerCase()
          .includes(searchString);
        const content = item.content.toLowerCase().includes(searchString);

        if (title || content || description || categories || tags) {
          return item;
        }
      });
      return searchResult;
    }
  };

  // get search result
  const startTime = performance.now();
  const searchResult = doSearch(searchData);
  const endTime = performance.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(3);

  useEffect(() => {
    const openSearch = () => setIsOpen(true);
    const searchModalTriggers = document.querySelectorAll(
      "[data-search-trigger]",
    );
    searchModalTriggers.forEach((button) =>
      button.addEventListener("click", openSearch),
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }

      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(0, index - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) =>
          Math.min(searchResult.length - 1, index + 1),
        );
      } else if (event.key === "Enter") {
        const activeLink = document.querySelector<HTMLAnchorElement>(
          `[data-search-result-index="${selectedIndex}"] a`,
        );
        activeLink?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      searchModalTriggers.forEach((button) =>
        button.removeEventListener("click", openSearch),
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, searchResult.length, selectedIndex]);

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    document
      .querySelector(`[data-search-result-index="${selectedIndex}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedIndex]);

  return (
    <div id="searchModal" className={`search-modal${isOpen ? " show" : ""}`}>
      <button
        type="button"
        aria-label="Close search"
        className="search-modal-overlay"
        onClick={() => setIsOpen(false)}
      />
      <div className="search-wrapper">
        <div className="search-wrapper-header">
          <label
            htmlFor="searchInput"
            className="absolute left-7 top-[calc(50%-7px)]"
          >
            <span className="sr-only">search icon</span>
            {searchString ? (
              <svg
                onClick={() => setSearchString("")}
                viewBox="0 0 512 512"
                height="18"
                width="18"
                className="hover:text-red-500 cursor-pointer -mt-0.5"
              >
                <path
                  fill="currentcolor"
                  d="M256 512A256 256 0 10256 0a256 256 0 100 512zM175 175c9.4-9.4 24.6-9.4 33.9.0l47 47 47-47c9.4-9.4 24.6-9.4 33.9.0s9.4 24.6.0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6.0 33.9s-24.6 9.4-33.9.0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9.0s-9.4-24.6.0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6.0-33.9z"
                ></path>
              </svg>
            ) : (
              <svg
                viewBox="0 0 512 512"
                height="18"
                width="18"
                className="-mt-0.5"
              >
                <path
                  fill="currentcolor"
                  d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8.0 45.3s-32.8 12.5-45.3.0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9.0 208S93.1.0 208 0 416 93.1 416 208zM208 352a144 144 0 100-288 144 144 0 100 288z"
                ></path>
              </svg>
            )}
          </label>
          <input
            ref={searchInputRef}
            id="searchInput"
            placeholder="Search..."
            className="search-wrapper-header-input"
            type="input"
            name="search"
            value={searchString}
            onChange={handleSearch}
            autoComplete="off"
          />
        </div>
        <SearchResult
          searchResult={searchResult}
          searchString={searchString}
          selectedIndex={selectedIndex}
        />
        <div className="search-wrapper-footer">
          <span className="flex items-center">
            <kbd>
              <svg
                width="14"
                height="14"
                fill="currentcolor"
                viewBox="0 0 16 16"
              >
                <path d="M3.204 11h9.592L8 5.519 3.204 11zm-.753-.659 4.796-5.48a1 1 0 011.506.0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 01-.753-1.659z"></path>
              </svg>
            </kbd>
            <kbd>
              <svg
                width="14"
                height="14"
                fill="currentcolor"
                viewBox="0 0 16 16"
              >
                <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 001.506.0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 00-.753 1.659z"></path>
              </svg>
            </kbd>
            to navigate
          </span>
          <span className="flex items-center">
            <kbd>
              <svg
                width="12"
                height="12"
                fill="currentcolor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M14.5 1.5a.5.5.0 01.5.5v4.8a2.5 2.5.0 01-2.5 2.5H2.707l3.347 3.346a.5.5.0 01-.708.708l-4.2-4.2a.5.5.0 010-.708l4-4a.5.5.0 11.708.708L2.707 8.3H12.5A1.5 1.5.0 0014 6.8V2a.5.5.0 01.5-.5z"
                ></path>
              </svg>
            </kbd>
            to select
          </span>
          {searchString && (
            <span>
              <strong>{searchResult.length} </strong> results - in{" "}
              <strong>{totalTime} </strong> seconds
            </span>
          )}
          <span>
            <kbd>ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
