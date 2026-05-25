"use server";

import { revalidatePath } from "next/cache";
import { type UserRole, userRoleSchema } from "@blog/shared";
import { getCurrentUser } from "@/lib/auth";
import { adminDeletePost } from "@/server/services/admin.service";
import { updateUserRole } from "@/server/services/users.service";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: admin only.");
  }
  return user;
}

export async function adminDeletePostAction(postId: number): Promise<void> {
  await requireAdmin();
  await adminDeletePost(postId);
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function updateUserRoleAction(userId: string, role: UserRole): Promise<void> {
  const actor = await requireAdmin();
  if (userId === actor.id && role !== "admin") {
    // Don't let an admin demote themselves and lock the panel.
    throw new Error("You can't demote yourself.");
  }
  const parsed = userRoleSchema.safeParse(role);
  if (!parsed.success) throw new Error("Invalid role.");
  await updateUserRole(userId, parsed.data);
  revalidatePath("/admin/users");
}
