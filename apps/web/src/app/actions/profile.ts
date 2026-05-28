"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateUserAvatar } from "@/server/services/users.service";

export async function updateAvatarAction(avatarUrl: string | null) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  await updateUserAvatar(user.id, avatarUrl);
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}
