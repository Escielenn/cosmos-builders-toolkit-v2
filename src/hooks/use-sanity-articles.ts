import { useQuery } from "@tanstack/react-query";
import {
  getArticles,
  getArticleBySlug,
  getFeaturedArticles,
  getArticlesByCategory,
  getArticlesByTag,
  searchArticles,
  getAllTags,
} from "@/lib/sanity/queries";

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: getArticles,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: ["articles", "featured"],
    queryFn: getFeaturedArticles,
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => (slug ? getArticleBySlug(slug) : null),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticlesByCategory(category: string) {
  return useQuery({
    queryKey: ["articles", "category", category],
    queryFn: () => getArticlesByCategory(category),
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticlesByTag(tag: string) {
  return useQuery({
    queryKey: ["articles", "tag", tag],
    queryFn: () => getArticlesByTag(tag),
    enabled: !!tag,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchArticles(searchTerm: string) {
  return useQuery({
    queryKey: ["articles", "search", searchTerm],
    queryFn: () => searchArticles(searchTerm),
    enabled: searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
  });
}

export function useAllTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getAllTags,
    staleTime: 1000 * 60 * 10, // 10 minutes for tags
  });
}
