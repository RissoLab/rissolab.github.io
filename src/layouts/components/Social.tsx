import DynamicIcon from "@/helpers/DynamicIcon";

export interface ISocial {
  name: string;
  id?: string;
  icon?: string;
  link?: string;
}

const socialConfig: Record<
  string,
  { icon: string; buildLink: (id: string) => string }
> = {
  email: {
    icon: "FaEnvelope",
    buildLink: (id) => `mailto:${id}`,
  },
  github: {
    icon: "FaGithub",
    buildLink: (id) => `https://github.com/${id}`,
  },
  "google scholar": {
    icon: "FaGoogleScholar",
    buildLink: (id) => `https://scholar.google.com/citations?user=${id}&hl=en`,
  },
  linkedin: {
    icon: "FaLinkedin",
    buildLink: (id) => `https://www.linkedin.com/in/${id}`,
  },
  orcid: {
    icon: "FaOrcid",
    buildLink: (id) => `https://orcid.org/${id}`,
  },
  twitter: {
    icon: "FaTwitter",
    buildLink: (id) => `https://twitter.com/${id}`,
  },
};

const normalizeSocialName = (name: string) => name.trim().toLowerCase();

const resolveSocial = (social: ISocial) => {
  const config = socialConfig[normalizeSocialName(social.name)];
  const link = social.link || (social.id && config?.buildLink(social.id));
  const icon = social.icon || config?.icon;

  if (!link || !icon) {
    return null;
  }

  return {
    icon,
    link,
    name: social.name,
  };
};

const Social = ({
  source,
  className,
}: {
  source: ISocial[];
  className: string;
}) => {
  const socials = source.map(resolveSocial).filter((social) => social !== null);

  return (
    <ul className={className}>
      {socials.map((social) => (
        <li key={social.name}>
          <a
            aria-label={social.name}
            href={social.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <span className="sr-only">{social.name}</span>
            <DynamicIcon className="inline-block" icon={social.icon} />
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Social;
