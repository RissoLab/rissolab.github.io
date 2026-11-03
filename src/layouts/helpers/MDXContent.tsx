import shortcodes from "@/shortcodes/all";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes } from "react";
import remarkGfm from "remark-gfm";

const MarkdownLink = ({
  href = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);

  return (
    <a
      href={href}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      {...props}
    />
  );
};

const MDXContent = ({ content }: { content: any }) => {
  interface IMdxOptions {
    remarkPlugins?: any[];
    rehypePlugins?: any[];
  }
  const mdxOptions: IMdxOptions = {
    remarkPlugins: [remarkGfm],
  };

  return (
    <>
      {/* @ts-ignore */}
      <MDXRemote
        source={content}
        components={{ ...shortcodes, a: MarkdownLink }}
        options={{ mdxOptions }}
      />
    </>
  );
};

export default MDXContent;
