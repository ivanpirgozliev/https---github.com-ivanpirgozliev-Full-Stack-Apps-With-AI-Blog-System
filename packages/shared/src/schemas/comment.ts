import { z } from "zod";

export const COMMENT_MAX_LENGTH = 2000;

export const addCommentSchema = z.object({
  content: z.string().min(1).max(COMMENT_MAX_LENGTH),
  parentId: z.number().int().positive().nullish(),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
