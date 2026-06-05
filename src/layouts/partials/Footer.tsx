"use client";

import Logo from "@/components/Logo";
import config from "@/config/config.json";
import { markdownify } from "@/lib/utils/textConverter";

const Footer = () => {
  const { copyright } = config.params;

  return (
    <footer className="bg-light dark:bg-darkmode-light">
      <div className="container">
        <div className="row items-center py-10">
          <div className="text-center lg:col-12">
            <Logo />
          </div>
        </div>
      </div>
      <div className="border-t border-border py-7 dark:border-darkmode-border">
        <div className="container text-center text-text-light dark:text-darkmode-text-light">
          <p dangerouslySetInnerHTML={markdownify(copyright)} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
