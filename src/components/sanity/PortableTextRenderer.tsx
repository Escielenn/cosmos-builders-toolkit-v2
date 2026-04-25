import { PortableText, PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlFor } from "@/lib/sanity/client";

interface ImageValue {
  _type: "image";
  asset: {
    _ref: string;
  };
  alt?: string;
  caption?: string;
}

interface LinkValue {
  _type: "link";
  href: string;
}

interface CodeValue {
  _type: "code";
  code: string;
  language?: string;
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-heading font-semibold mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-heading font-semibold mt-4 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-t3">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const linkValue = value as LinkValue;
      const isExternal = linkValue?.href?.startsWith("http");
      return (
        <a
          href={linkValue?.href}
          className="text-primary hover:underline"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const imageValue = value as ImageValue;
      if (!imageValue?.asset) return null;

      return (
        <figure className="my-6">
          <img
            src={urlFor(imageValue).width(800).url()}
            alt={imageValue.alt || "Article image"}
            className="rounded-none w-full"
          />
          {imageValue.caption && (
            <figcaption className="text-center text-sm text-t3 mt-2">
              {imageValue.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    code: ({ value }) => {
      const codeValue = value as CodeValue;
      return (
        <pre className="bg-muted p-4 rounded-none overflow-x-auto my-4">
          <code className="text-sm font-mono">
            {codeValue?.code}
          </code>
        </pre>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

interface PortableTextRendererProps {
  content: PortableTextBlock[];
}

export function PortableTextRenderer({ content }: PortableTextRendererProps) {
  return <PortableText value={content} components={components} />;
}
