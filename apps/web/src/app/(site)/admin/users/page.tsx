import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/server/services/users.service";
import { RoleSelect } from "./role-select";

export const metadata = { title: "Users" };

interface UsersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const me = (await getCurrentUser())!;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 25;

  const { users, total } = await listUsers({ page, pageSize });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-muted hover:text-accent">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Users</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString()} total</p>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted-bg text-muted uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted-bg/50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/profile/${u.id}`} className="flex items-center gap-2 hover:text-accent">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {u.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={u.id}
                    currentRole={u.role}
                    disabled={u.id === me.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        hrefForPage={(p) => `/admin/users?page=${p}`}
      />
    </div>
  );
}
