import type { PortableTextBlock } from "@portabletext/types";

export interface SanityArticle {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: {
    current: string;
  };
  description: string;
  category: "basics" | "science" | "craft" | "case-studies";
  publishedDate: string;
  featured: boolean;
  featuredImage?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
  };
  content: PortableTextBlock[];
}

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  publishedDate: string;
  featured: boolean;
  featuredImage?: {
    asset: {
      _ref: string;
    };
  };
}
