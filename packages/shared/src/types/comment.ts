import type { PublicPostAuthor } from "./post";

export interface PublicComment {
  id: number;
  postId: number;
  authorId: string;
  content: string;
  parentId: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicCommentWithAuthor extends PublicComment {
  author: PublicPostAuthor;
}
