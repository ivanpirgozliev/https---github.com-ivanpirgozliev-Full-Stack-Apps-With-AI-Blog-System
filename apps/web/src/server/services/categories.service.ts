import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { categories, type Category } from "../db/schema";

export async function listCategories(): Promise<Category[]> {
  return await db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return cat ?? null;
}
