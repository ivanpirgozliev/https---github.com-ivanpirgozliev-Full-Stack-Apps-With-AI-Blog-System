import Link from "next/link";
import { listCategories } from "@/server/services/categories.service";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">About this blog</h1>

      <div className="prose">
        <p>
          This is a multi-platform blog built as a SoftUni Capstone project: a Next.js 16 web
          app that ships its own REST API for the Expo mobile companion, backed by Neon
          Postgres and Cloudflare R2.
        </p>

        <h2>Architecture</h2>
        <ul>
          <li>
            <strong>Web + API</strong> — Next.js 16 App Router. Server Components fetch
            through a service layer; the same services power the public REST API at{" "}
            <code>/api/v1/*</code>.
          </li>
          <li>
            <strong>Mobile</strong> — Expo SDK 54 with file-based routing. Consumes the REST
            API with JWTs stored in <code>expo-secure-store</code>.
          </li>
          <li>
            <strong>Database</strong> — Neon serverless Postgres via Drizzle ORM. Seeded with
            10,000 posts and 30,000 comments to verify pagination works at scale.
          </li>
          <li>
            <strong>Storage</strong> — Cloudflare R2 (S3-compatible) for user-uploaded
            cover images.
          </li>
          <li>
            <strong>Auth</strong> — JWT (jose library, edge-runtime safe) + bcryptjs.
            Web uses HttpOnly cookies; mobile uses <code>Authorization: Bearer</code>.
          </li>
        </ul>

        <h2>Categories</h2>
        {categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/categories/${cat.slug}`}>{cat.name}</Link>
                {cat.description && <span className="text-muted"> — {cat.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
