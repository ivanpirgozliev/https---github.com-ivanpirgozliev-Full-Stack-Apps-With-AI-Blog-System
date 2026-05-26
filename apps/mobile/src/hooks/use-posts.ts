import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePostInput,
  Paginated,
  PublicComment,
  PublicCommentWithAuthor,
  PublicPostWithRefs,
} from "@blog/shared";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export interface ListPostsParams {
  status?: "published" | "draft";
  authorId?: string;
  categorySlug?: string;
  search?: string;
  pageSize?: number;
}

export function usePostsInfinite(params: ListPostsParams) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["posts", params],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const search = new URLSearchParams();
      search.set("page", String(pageParam));
      search.set("pageSize", String(params.pageSize ?? 20));
      if (params.status) search.set("status", params.status);
      if (params.authorId) search.set("authorId", params.authorId);
      if (params.categorySlug) search.set("categorySlug", params.categorySlug);
      if (params.search) search.set("search", params.search);
      return await api<Paginated<PublicPostWithRefs>>(`/api/v1/posts?${search.toString()}`, {
        token,
      });
    },
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < last.total ? all.length + 1 : undefined;
    },
  });
}

export function usePost(slug: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    enabled: !!slug,
    queryKey: ["post", slug],
    queryFn: () => api<PublicPostWithRefs>(`/api/v1/posts/${slug}`, { token }),
  });
}

export function useComments(slug: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    enabled: !!slug,
    queryKey: ["comments", slug],
    queryFn: () =>
      api<Paginated<PublicCommentWithAuthor>>(`/api/v1/posts/${slug}/comments?pageSize=50`, {
        token,
      }),
  });
}

export function useAddComment(slug: string | undefined) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api<PublicComment>(`/api/v1/posts/${slug}/comments`, {
        body: { content },
        token,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", slug] });
      qc.invalidateQueries({ queryKey: ["post", slug] });
    },
  });
}

export function useCreatePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) =>
      api<PublicPostWithRefs>("/api/v1/posts", { body: input, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
