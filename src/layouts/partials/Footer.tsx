import Logo from "@/components/Logo";
import config from "@/config/config.json";
import { markdownify } from "@/lib/utils/textConverter";

const buildDate = new Date().toISOString().slice(0, 10);

const Footer = () => {
  const { copyright } = config.params;

  return (
    <footer className="border-t border-border/70 bg-white/45 backdrop-blur-xl dark:border-darkmode-border/70 dark:bg-darkmode-body/45">
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
          <p className="mt-1 text-sm">last updated: {buildDate}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
