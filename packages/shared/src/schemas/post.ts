import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const TITLE_MAX_LENGTH = 255;
export const EXCERPT_MAX_LENGTH = 500;
export const COVER_IMAGE_URL_MAX_LENGTH = 2048;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export const createPostSchema = z.object({
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  content: z.string().min(1),
  excerpt: z.string().max(EXCERPT_MAX_LENGTH).nullish(),
  coverImageUrl: z.url().max(COVER_IMAGE_URL_MAX_LENGTH).nullish(),
  categoryId: z.number().int().positive().nullish(),
  status: postStatusSchema.optional().default("draft"),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema.partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  categorySlug: z.string().max(100).optional(),
  search: z.string().max(255).optional(),
  status: postStatusSchema.optional(),
  authorId: z.uuid().optional(),
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
