"use client";

import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import config from "@/config/config.json";
import menu from "@/config/menu.json";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";

//  child navigation link interface
export interface IChildNavigationLink {
  name: string;
  url: string;
  external?: boolean;
}

// navigation link interface
export interface INavigationLink {
  name: string;
  url: string;
  hasChildren?: boolean;
  external?: boolean;
  children?: IChildNavigationLink[];
}

// The /wiki section is a separate prebuilt app served alongside this one, so
// next/link would trigger RSC prefetches/transitions against a route that
// does not exist in this app (404 + console noise). Items marked as external
// are rendered as plain anchors (optionally in a new tab) with an
// "opens externally" icon: full page navigation, which is what would happen
// anyway.
const NavHref = ({
  href,
  external,
  onClick,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) => {
  if (href.startsWith("/wiki") || external) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={className}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
        {external && (
          <FaArrowUpRightFromSquare
            className="ml-1.5 inline-block text-[11px]"
            aria-hidden="true"
          />
        )}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
};

const Header = () => {
  // distructuring the main menu from menu object
  const { main }: { main: INavigationLink[] } = menu;
  const { navigation_button, settings } = config;
  // get current path
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMobileNav = () => {
    setIsNavOpen(false);
    setOpenSubmenu(null);
  };

  // scroll to top on route change
  useEffect(() => {
    window.scroll(0, 0);
    closeMobileNav();
  }, [pathname]);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 0);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <header
      className={`header z-30 ${settings.sticky_header && "sticky top-0"} ${
        isScrolled ? "header-scrolled" : ""
      }`}
    >
      <nav className="navbar container">
        {/* logo */}
        <div className="order-0">
          <Logo />
        </div>
        {/* navbar toggler */}
        <input
          id="nav-toggle"
          type="checkbox"
          className="hidden"
          checked={isNavOpen}
          onChange={(event) => setIsNavOpen(event.target.checked)}
        />
        <label
          htmlFor="nav-toggle"
          className="order-3 cursor-pointer flex items-center text-text-dark dark:text-white xl:hidden xl:order-1"
        >
          <svg
            id="show-button"
            className="h-6 fill-current block"
            viewBox="0 0 20 20"
          >
            <title>Menu Open</title>
            <path d="M0 3h20v2H0V3z m0 6h20v2H0V9z m0 6h20v2H0V0z"></path>
          </svg>
          <svg
            id="hide-button"
            className="h-6 fill-current hidden"
            viewBox="0 0 20 20"
          >
            <title>Menu Close</title>
            <polygon
              points="11 9 22 9 22 11 11 11 11 22 9 22 9 11 -2 11 -2 9 9 9 9 -2 11 -2"
              transform="rotate(45 10 10)"
            ></polygon>
          </svg>
        </label>
        {/* /navbar toggler */}

        <ul
          id="nav-menu"
          className="navbar-nav order-3 hidden w-full pb-6 xl:order-1 xl:flex xl:w-auto xl:pb-0 xl:space-x-4"
        >
          {main.map((menu, i) => (
            <React.Fragment key={`menu-${i}`}>
              {menu.hasChildren ? (
                <li className="nav-item nav-dropdown group relative">
                  <input
                    type="checkbox"
                    id={`submenu-${menu.name}`}
                    className="peer hidden lg:hidden"
                    checked={openSubmenu === menu.name}
                    onChange={(event) =>
                      setOpenSubmenu(event.target.checked ? menu.name : null)
                    }
                  />
                  <label
                    htmlFor={`submenu-${menu.name}`}
                    className={`nav-link inline-flex items-center ${
                      menu.children?.some(
                        ({ url }) =>
                          pathname === url || pathname.startsWith(`${url}/`),
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    {menu.name}
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </label>
                  <ul className="nav-dropdown-list hidden peer-checked:block xl:invisible xl:absolute xl:block xl:opacity-0 xl:group-hover:visible xl:group-hover:opacity-100">
                    {menu.children?.map((child, i) => (
                      <li className="nav-dropdown-item" key={`children-${i}`}>
                        <NavHref
                          href={child.url}
                          external={child.external}
                          onClick={closeMobileNav}
                          className={`nav-dropdown-link block ${
                            pathname === child.url ||
                            pathname.startsWith(`${child.url}/`)
                              ? "active"
                              : ""
                          }`}
                        >
                          {child.name}
                        </NavHref>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li className="nav-item">
                  <NavHref
                    href={menu.url}
                    external={menu.external}
                    onClick={closeMobileNav}
                    className={`nav-link block ${
                      pathname === menu.url ||
                      pathname.startsWith(`${menu.url}/`)
                        ? "active"
                        : ""
                    }`}
                  >
                    {menu.name}
                  </NavHref>
                </li>
              )}
            </React.Fragment>
          ))}
          {navigation_button.enable && (
            <li className="mt-4 inline-block xl:hidden">
              <Link
                className="btn btn-outline-primary btn-sm"
                href={navigation_button.link}
                onClick={closeMobileNav}
                target={
                  navigation_button.link.startsWith("http") ? "_blank" : "_self"
                }
                rel={
                  navigation_button.link.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {navigation_button.label}
              </Link>
            </li>
          )}
        </ul>
        <div className="order-1 ml-auto flex items-center md:order-2 xl:ml-0">
          {settings.search && (
            <button
              className="border-border text-text-dark hover:text-primary dark:border-darkmode-border mr-5 inline-block border-r pr-5 text-xl dark:text-white dark:hover:text-darkmode-primary"
              aria-label="search"
              data-search-trigger
            >
              <IoSearch />
            </button>
          )}
          <ThemeSwitcher className="mr-5" />
          {navigation_button.enable && (
            <Link
              className="btn btn-outline-primary btn-sm hidden xl:inline-block"
              href={navigation_button.link}
              target={
                navigation_button.link.startsWith("http") ? "_blank" : "_self"
              }
              rel={
                navigation_button.link.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {navigation_button.label}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
