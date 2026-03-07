import { useQuery } from "@tanstack/react-query";
import { getCourses, getFeaturedCourses } from "@/lib/sanity/queries";
import type { CourseListItem } from "@/lib/sanity/types";

export function useCourses() {
  return useQuery<CourseListItem[]>({
    queryKey: ["courses"],
    queryFn: getCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFeaturedCourses() {
  return useQuery<CourseListItem[]>({
    queryKey: ["courses", "featured"],
    queryFn: getFeaturedCourses,
    staleTime: 1000 * 60 * 5,
  });
}
