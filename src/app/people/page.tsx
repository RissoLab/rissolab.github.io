import PeopleCard from "@/components/PeopleCard";
import { getListPage, getSinglePage } from "@/lib/contentParser";
import PageHeader from "@/partials/PageHeader";
import SeoMeta from "@/partials/SeoMeta";
import type { CSSProperties } from "react";

const sortByWeight = (items: any[]) =>
  items.sort(
    (a, b) => (a.frontmatter.weight ?? 999) - (b.frontmatter.weight ?? 999),
  );

const chunkByPattern = (items: any[], pattern: number[]) => {
  const rows = [];
  let index = 0;
  let patternIndex = 0;

  while (index < items.length) {
    const size = pattern[patternIndex % pattern.length];
    rows.push({
      people: items.slice(index, index + size),
      slots: size,
    });
    index += size;
    patternIndex += 1;
  }

  return rows;
};

const HoneycombPeople = ({
  people,
  imageShape = "circle",
}: {
  people: any[];
  imageShape?: "circle" | "rectangle";
}) => {
  const HoneycombRows = ({
    className,
    pattern,
  }: {
    className: string;
    pattern: number[];
  }) => (
    <div className={`people-honeycomb ${className}`}>
      {chunkByPattern(people, pattern).map((row, rowIndex) => (
        <div
          className="people-honeycomb__row"
          key={`${className}-${rowIndex}`}
          style={{ "--hex-row-items": row.slots } as CSSProperties}
        >
          {row.people.map((person) => (
            <div className="people-honeycomb__cell" key={person.slug}>
              <PeopleCard
                data={person}
                imageShape={imageShape}
                cardShape="hexagon"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <HoneycombRows className="people-honeycomb--sm" pattern={[1, 2]} />
      <HoneycombRows className="people-honeycomb--lg" pattern={[2, 3]} />
      <HoneycombRows className="people-honeycomb--xl" pattern={[3, 4]} />
    </>
  );
};

type AlumniPerson = {
  name: string;
  position: string;
  current_position: string;
  link?: string;
};

const HoneycombAlumni = ({ alumni }: { alumni: AlumniPerson[] }) => {
  const people = alumni.map((person) => ({
    slug: person.name,
    frontmatter: {
      title: person.name,
      role: person.position,
      description: person.current_position,
      link: person.link,
    },
  }));

  const HoneycombRows = ({
    className,
    pattern,
  }: {
    className: string;
    pattern: number[];
  }) => (
    <div className={`people-honeycomb people-honeycomb--alumni ${className}`}>
      {chunkByPattern(people, pattern).map((row, rowIndex) => (
        <div
          className="people-honeycomb__row"
          key={`${className}-${rowIndex}`}
          style={{ "--hex-row-items": row.slots } as CSSProperties}
        >
          {row.people.map((person) => (
            <div className="people-honeycomb__cell" key={person.slug}>
              <PeopleCard data={person} cardShape="hexagon" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <HoneycombRows className="people-honeycomb--sm" pattern={[2, 3]} />
      <HoneycombRows className="people-honeycomb--lg" pattern={[3, 4]} />
      <HoneycombRows className="people-honeycomb--xl" pattern={[5, 6]} />
    </>
  );
};

const People = () => {
  const peopleIndex = getListPage("people/_index.md");
  const people = getSinglePage("people");
  const {
    title,
    meta_title,
    description,
    image,
    alumni = [],
  } = peopleIndex.frontmatter;
  const members = sortByWeight(
    people.filter((person) => person.frontmatter.group === "members"),
  );
  const friends = sortByWeight(
    people.filter((person) => person.frontmatter.group === "friends"),
  );

  return (
    <>
      <SeoMeta
        title={title}
        meta_title={meta_title}
        description={description}
        image={image}
      />
      <PageHeader title={title} />
      <section className="section-sm pb-0">
        <div className="container">
          <HoneycombPeople people={members} />
        </div>
      </section>
      <section className="section-sm pb-0">
        <div className="container">
          <h2 className="mb-12 text-center">Friends of the Lab</h2>
          <HoneycombPeople people={friends} imageShape="rectangle" />
        </div>
      </section>
      <section className="section-sm">
        <div className="container">
          <h2 className="mb-12 text-center">Alumni</h2>
          <HoneycombAlumni alumni={alumni} />
        </div>
      </section>
    </>
  );
};

export default People;
