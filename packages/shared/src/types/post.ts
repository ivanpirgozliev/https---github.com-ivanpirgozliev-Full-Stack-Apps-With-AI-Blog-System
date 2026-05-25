import type { PostStatus } from "../schemas/post";

export interface PublicPost {
  id: number;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  status: PostStatus;
  categoryId: number | null;
  viewCount: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicPostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicPostCategory {
  id: number;
  name: string;
  slug: string;
}

export interface PublicPostWithRefs extends PublicPost {
  author: PublicPostAuthor;
  category: PublicPostCategory | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
