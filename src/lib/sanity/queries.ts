import { sanityClient } from "./client";
import type { SanityArticle, ArticleListItem, CourseListItem } from "./types";

// Base projection for article list items
const articleListProjection = `{
  _id,
  title,
  "slug": slug.current,
  description,
  category,
  publishedDate,
  featured,
  tags,
  featuredImage
}`;

// Get all articles for listing
export async function getArticles(): Promise<ArticleListItem[]> {
  const query = `*[_type == "article"] | order(publishedDate desc) ${articleListProjection}`;
  return sanityClient.fetch(query);
}

// Get featured articles
export async function getFeaturedArticles(): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && featured == true] | order(publishedDate desc) ${articleListProjection}`;
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
    tags,
    featuredImage,
    content
  }`;

  return sanityClient.fetch(query, { slug });
}

// Get articles by category
export async function getArticlesByCategory(
  category: string
): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && category == $category] | order(publishedDate desc) ${articleListProjection}`;
  return sanityClient.fetch(query, { category });
}

// Get articles by tag
export async function getArticlesByTag(
  tag: string
): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && $tag in tags] | order(publishedDate desc) ${articleListProjection}`;
  return sanityClient.fetch(query, { tag });
}

// Search articles by text (searches title, description, and content)
export async function searchArticles(
  searchTerm: string
): Promise<ArticleListItem[]> {
  const query = `*[_type == "article" && (
    title match $searchTerm + "*" ||
    description match $searchTerm + "*" ||
    pt::text(content) match $searchTerm + "*"
  )] | order(publishedDate desc) ${articleListProjection}`;

  return sanityClient.fetch(query, { searchTerm });
}

// Get all unique tags from articles
export async function getAllTags(): Promise<string[]> {
  const query = `array::unique(*[_type == "article" && defined(tags)].tags[])`;
  return sanityClient.fetch(query);
}

// ── Courses ─────────────────────────────────────────────────

const courseListProjection = `{
  _id,
  title,
  "slug": slug.current,
  description,
  artwork,
  instructor,
  registrationUrl,
  startDate,
  duration,
  price,
  featured,
  status,
  proMonthlyDiscount,
  proYearlyDiscount,
  vanguardMonthlyDiscount,
  vanguardYearlyDiscount,
  tags
}`;

// Get all active courses (not completed)
export async function getCourses(): Promise<CourseListItem[]> {
  const query = `*[_type == "course" && status != "completed"] | order(startDate asc) ${courseListProjection}`;
  return sanityClient.fetch(query);
}

// Get featured courses
export async function getFeaturedCourses(): Promise<CourseListItem[]> {
  const query = `*[_type == "course" && featured == true && status != "completed"] | order(startDate asc) ${courseListProjection}`;
  return sanityClient.fetch(query);
}
