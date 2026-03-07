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
  tags?: string[];
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
  tags?: string[];
  featuredImage?: {
    asset: {
      _ref: string;
    };
  };
}

// ── Writing Prompts ─────────────────────────────────────

export interface SanityWritingPrompt {
  _id: string;
  title: string;
  prompt: string;
  category: string;
  difficulty: string;
  wordGoal?: number;
  scheduledDate?: string;
  featured: boolean;
}

// ── Courses ─────────────────────────────────────────────

export interface CourseListItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  artwork?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  instructor: string;
  registrationUrl: string;
  startDate: string;
  duration: string;
  price: string;
  featured: boolean;
  status: "upcoming" | "enrolling" | "in_progress" | "completed";
  proMonthlyDiscount?: string;
  proYearlyDiscount?: string;
  vanguardMonthlyDiscount?: string;
  vanguardYearlyDiscount?: string;
  tags?: string[];
}
