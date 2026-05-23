import { config } from "dotenv";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import {
  categories,
  comments,
  posts,
  users,
  type NewComment,
  type NewPost,
  type NewUser,
} from "../src/server/db/schema";

config({ path: [".env.local", ".env"] });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to apps/web/.env.local.");
}

// Use a script-local Pool — don't import ../src/server/db/client (which is server-only).
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { users, categories, posts, comments } });

// Tunables — batch size kept ≤ 1000 to stay under Postgres' bind-parameter cap.
const BATCH = 500;
const TOTAL_USERS = 10;
const TOTAL_CATEGORIES = 8;
const TOTAL_POSTS = 10_000;
const TOTAL_COMMENTS = 30_000;

const BCRYPT_ROUNDS = 10;
const ADMIN_EMAIL = "admin@blog.local";
const ADMIN_PASSWORD = "Admin123!";
const REGULAR_PASSWORD = "User123!";

const CATEGORY_NAMES = [
  "Technology",
  "Travel",
  "Food",
  "Lifestyle",
  "Business",
  "Science",
  "Arts",
  "Health",
] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

async function seed() {
  const t0 = Date.now();

  console.log("clearing existing rows…");
  await db.execute(
    sql`TRUNCATE TABLE post_tags, comments, posts, media, categories, users, tags RESTART IDENTITY CASCADE`,
  );

  console.log(`seeding ${TOTAL_USERS} users…`);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const userHash = await bcrypt.hash(REGULAR_PASSWORD, BCRYPT_ROUNDS);
  const userRows: NewUser[] = [
    {
      email: ADMIN_EMAIL,
      name: "Site Admin",
      passwordHash: adminHash,
      role: "admin",
    },
    ...Array.from({ length: TOTAL_USERS - 1 }, (_, i) => ({
      email: `user${i + 1}@blog.local`,
      name: faker.person.fullName(),
      passwordHash: userHash,
      role: "user" as const,
    })),
  ];
  const insertedUsers = await db.insert(users).values(userRows).returning();
  console.log(`  ✓ ${insertedUsers.length} users (admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD})`);

  console.log(`seeding ${TOTAL_CATEGORIES} categories…`);
  const insertedCategories = await db
    .insert(categories)
    .values(
      CATEGORY_NAMES.map((name) => ({
        name,
        slug: slugify(name),
        description: faker.lorem.sentence(),
      })),
    )
    .returning();
  console.log(`  ✓ ${insertedCategories.length} categories`);

  console.log(`seeding ${TOTAL_POSTS} posts…`);
  let postsDone = 0;
  for (let i = 0; i < TOTAL_POSTS; i += BATCH) {
    const size = Math.min(BATCH, TOTAL_POSTS - i);
    const batch: NewPost[] = Array.from({ length: size }, (_, j) => {
      const idx = i + j;
      const title = faker.lorem.sentence({ min: 5, max: 10 }).replace(/\.$/, "");
      const isPublished = Math.random() < 0.9;
      const hasCategory = Math.random() < 0.95;
      return {
        authorId: pick(insertedUsers).id,
        title,
        slug: `${slugify(title)}-${idx}`,
        excerpt: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3, "\n\n"),
        coverImageUrl: Math.random() < 0.5 ? faker.image.url({ width: 800, height: 400 }) : null,
        status: isPublished ? "published" : "draft",
        categoryId: hasCategory ? pick(insertedCategories).id : null,
        viewCount: Math.floor(Math.random() * 5000),
        publishedAt: isPublished ? faker.date.past({ years: 1 }) : null,
      };
    });
    await db.insert(posts).values(batch);
    postsDone += size;
    process.stdout.write(`\r  posts: ${postsDone}/${TOTAL_POSTS}`);
  }
  process.stdout.write("\n");

  // Cache all post ids for comment FK targeting (~10k ints, negligible memory).
  const allPostIds = (await db.select({ id: posts.id }).from(posts)).map((r) => r.id);

  console.log(`seeding ${TOTAL_COMMENTS} comments…`);
  const knownCommentIds: number[] = [];
  let commentsDone = 0;
  for (let i = 0; i < TOTAL_COMMENTS; i += BATCH) {
    const size = Math.min(BATCH, TOTAL_COMMENTS - i);
    const batch: NewComment[] = Array.from({ length: size }, () => ({
      postId: pick(allPostIds),
      authorId: pick(insertedUsers).id,
      content: faker.lorem.sentences({ min: 1, max: 3 }),
      // 10% of comments are replies to an existing comment.
      parentId:
        knownCommentIds.length > 0 && Math.random() < 0.1 ? pick(knownCommentIds) : null,
    }));
    const inserted = await db
      .insert(comments)
      .values(batch)
      .returning({ id: comments.id });
    knownCommentIds.push(...inserted.map((c) => c.id));
    commentsDone += size;
    process.stdout.write(`\r  comments: ${commentsDone}/${TOTAL_COMMENTS}`);
  }
  process.stdout.write("\n");

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✓ done in ${elapsed}s`);
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
