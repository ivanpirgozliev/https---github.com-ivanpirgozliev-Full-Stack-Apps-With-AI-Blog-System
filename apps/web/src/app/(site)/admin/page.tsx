import Link from "next/link";
import { Eye, FileText, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { getRecentComments, getRecentPosts, getStats } from "@/server/services/admin.service";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [stats, recentPosts, recentComments] = await Promise.all([
    getStats(),
    getRecentPosts(5),
    getRecentComments(5),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">Site-wide stats and recent activity.</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard icon={<Users size={18} />} label="Users" value={formatNumber(stats.totalUsers)} />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label="Admins"
          value={formatNumber(stats.totalAdmins)}
        />
        <StatCard
          icon={<FileText size={18} />}
          label="Posts"
          value={formatNumber(stats.totalPosts)}
        />
        <StatCard
          icon={<FileText size={18} />}
          label="Published"
          value={formatNumber(stats.totalPublishedPosts)}
        />
        <StatCard
          icon={<MessageCircle size={18} />}
          label="Comments"
          value={formatNumber(stats.totalComments)}
        />
        <StatCard
          icon={<Eye size={18} />}
          label="Views"
          value={formatNumber(stats.totalViews)}
        />
      </section>

      <nav className="flex gap-3 mb-10">
        <Link href="/admin/users" className="btn-gradient text-sm">
          Manage users
        </Link>
        <Link href="/admin/posts" className="btn-gradient text-sm">
          Moderate posts
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Recent posts</h2>
          <ul className="divide-y divide-border">
            {recentPosts.map((p) => (
              <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={p.status === "published" ? `/posts/${p.slug}` : `/dashboard/posts/${p.id}/edit`}
                  className="text-sm font-medium hover:text-accent truncate block"
                >
                  {p.title}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar name={p.author.name} avatarUrl={p.author.avatarUrl} size={16} />
                  <p className="text-xs text-muted">
                    {p.author.name} · {formatDate(p.createdAt)} · {p.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Recent comments</h2>
          <ul className="divide-y divide-border">
            {recentComments.map((c) => (
              <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm line-clamp-2">{c.content}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar name={c.author.name} avatarUrl={c.author.avatarUrl} size={16} />
                  <p className="text-xs text-muted">
                    {c.author.name} on{" "}
                    <Link href={`/posts/${c.post.slug}`} className="hover:text-accent">
                      {c.post.title}
                    </Link>{" "}
                    · {formatDate(c.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl: string | null; size: number }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-accent text-white font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-muted text-xs mb-1">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
