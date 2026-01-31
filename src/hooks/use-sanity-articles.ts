import { useQuery } from "@tanstack/react-query";
import {
  getArticles,
  getArticleBySlug,
  getFeaturedArticles,
  getArticlesByCategory,
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
