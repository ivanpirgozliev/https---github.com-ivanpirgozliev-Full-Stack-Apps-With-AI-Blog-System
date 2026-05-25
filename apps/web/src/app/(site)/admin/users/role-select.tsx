"use client";

import { useTransition } from "react";
import type { UserRole } from "@blog/shared";
import { updateUserRoleAction } from "@/app/actions/admin";

interface RoleSelectProps {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}

export function RoleSelect({ userId, currentRole, disabled }: RoleSelectProps) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={currentRole}
      disabled={disabled || pending}
      onChange={(e) => {
        const newRole = e.target.value as UserRole;
        if (newRole === currentRole) return;
        startTransition(async () => {
          try {
            await updateUserRoleAction(userId, newRole);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update role");
          }
        });
      }}
      className="select text-sm py-1"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
  );
}
