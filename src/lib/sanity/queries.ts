import { sanityClient } from "./client";
import type { SanityArticle, ArticleListItem } from "./types";

// Get all articles for listing
export async function getArticles(): Promise<ArticleListItem[]> {
  const query = `*[_type == "article"] | order(publishedDate desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    category,
    publishedDate,
    featured,
    featuredImage
  }`;

  return sanityClient.fetch(query);
}

// Get featured articles
export async function getFeaturedArticles(): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && featured == true] | order(publishedDate desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    category,
    publishedDate,
    featured,
    featuredImage
  }`;

  return sanityClient.fetch(query);
}

// Get a single article by slug
export async function getArticleBySlug(
  slug: string
): Promise<SanityArticle | null> {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id,
    _createdAt,
    _updatedAt,
    title,
    slug,
    description,
    category,
    publishedDate,
    featured,
    featuredImage,
    content
  }`;

  return sanityClient.fetch(query, { slug });
}

// Get articles by category
export async function getArticlesByCategory(
  category: string
): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && category == $category] | order(publishedDate desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    category,
    publishedDate,
    featured,
    featuredImage
  }`;

  return sanityClient.fetch(query, { category });
}
