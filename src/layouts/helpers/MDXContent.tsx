import shortcodes from "@/shortcodes/all";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes } from "react";
import remarkGfm from "remark-gfm";

const MarkdownLink = ({
  href = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isHashLink = href.startsWith("#");

  return (
    <a
      href={href}
      rel={isHashLink ? undefined : "noopener noreferrer"}
      target={isHashLink ? undefined : "_blank"}
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
