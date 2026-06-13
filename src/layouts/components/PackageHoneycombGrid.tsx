"use client";

import ImageFallback from "@/helpers/ImageFallback";
import { CSSProperties, useEffect, useRef, useState } from "react";

type Package = {
  name: string;
  image: string;
  href?: string;
};

type Layout = {
  tileSize: number;
};

type PackageRow = {
  packages: Package[];
  slots: number;
};

const SHORT_ROW_SIZE = 2;
const LONG_ROW_SIZE = 3;
const HORIZONTAL_STEP = 0.866;
const VERTICAL_STEP = 0.75;

const getRowSizes = (count: number) => {
  const rowSizes: number[] = [];
  let remaining = count;

  while (remaining > 0) {
    const rowCapacity =
      rowSizes.length % 2 === 0 ? SHORT_ROW_SIZE : LONG_ROW_SIZE;
    const rowSize = Math.min(rowCapacity, remaining);
    rowSizes.push(rowSize);
    remaining -= rowSize;
  }

  return rowSizes;
};

const placePackagesInSlots = (packages: Package[], slots: number) => {
  if (packages.length >= slots) return packages;

  return [...packages, ...Array<null>(slots - packages.length).fill(null)];
};

const findBestLayout = (
  width: number,
  height: number,
  count: number,
): Layout => {
  const rowSizes = getRowSizes(count);
  const widestRow = rowSizes.length > 1 ? LONG_ROW_SIZE : SHORT_ROW_SIZE;
  const tileByWidth = width / (1 + (widestRow - 1) * HORIZONTAL_STEP);
  const tileByHeight = height / (1 + (rowSizes.length - 1) * VERTICAL_STEP);

  return { tileSize: Math.min(tileByWidth, tileByHeight) };
};

const PackageHoneycombGrid = ({ packages }: { packages: Package[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({
    tileSize: 96,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || packages.length === 0) return;

    const updateLayout = () => {
      const { width, height } = container.getBoundingClientRect();
      setLayout(findBestLayout(width, height, packages.length));
    };
    const observer = new ResizeObserver(updateLayout);

    observer.observe(container);
    updateLayout();

    return () => observer.disconnect();
  }, [packages.length]);

  const rows: PackageRow[] = [];
  let packageIndex = 0;

  for (const [rowIndex, rowSize] of getRowSizes(packages.length).entries()) {
    rows.push({
      packages: packages.slice(packageIndex, packageIndex + rowSize),
      slots: rowIndex % 2 === 0 ? SHORT_ROW_SIZE : LONG_ROW_SIZE,
    });
    packageIndex += rowSize;
  }

  return (
    <div
      ref={containerRef}
      className="package-honeycomb"
      aria-label="Open-source software packages"
      style={
        {
          "--package-tile-size": `${layout.tileSize}px`,
        } as CSSProperties
      }
    >
      <div className="package-honeycomb__rows">
        {rows.map((row, rowIndex) => (
          <div
            className="package-honeycomb__row"
            key={rowIndex}
            style={
              {
                "--package-row-slots": row.slots,
              } as CSSProperties
            }
          >
            {placePackagesInSlots(row.packages, row.slots).map(
              (softwarePackage, slotIndex) => (
                <div
                  className={`package-honeycomb__cell ${
                    !softwarePackage ? "package-honeycomb__cell--empty" : ""
                  }`}
                  key={softwarePackage?.image ?? `empty-${slotIndex}`}
                >
                  {softwarePackage &&
                    (softwarePackage.href ? (
                      <a
                        href={softwarePackage.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${softwarePackage.name} package page`}
                        className="block transition-transform hover:scale-110"
                      >
                        <ImageFallback
                          src={softwarePackage.image}
                          alt={`${softwarePackage.name} package sticker`}
                          width={240}
                          height={240}
                          sizes="(max-width: 767px) 25vw, 10vw"
                        />
                      </a>
                    ) : (
                      <ImageFallback
                        src={softwarePackage.image}
                        alt={`${softwarePackage.name} package sticker`}
                        width={240}
                        height={240}
                        sizes="(max-width: 767px) 25vw, 10vw"
                      />
                    ))}
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageHoneycombGrid;
