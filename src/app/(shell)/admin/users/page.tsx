"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import type { Role } from "@prisma/client";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  primaryDepartment: { id: string; name: string } | null;
  createdAt: string;
}

const ROLES: Role[] = [
  "ADMIN",
  "HEAD_HR",
  "DEPT_HEAD",
  "MEMBER",
  "CLIENT",
  "FINANCE",
  "CONTRACTOR",
];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  HEAD_HR: "bg-blue-100 text-blue-700",
  DEPT_HEAD: "bg-teal-100 text-teal-700",
  MEMBER: "bg-gray-100 text-gray-700",
  CLIENT: "bg-amber-100 text-amber-700",
  FINANCE: "bg-green-100 text-green-700",
  CONTRACTOR: "bg-orange-100 text-orange-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "MEMBER" as Role });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ email: "", name: "", role: "MEMBER" });
      fetchUsers();
    }
  }

  if (loading) {
    return <p className="text-sm text-[#6B7280]">Loading users...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Users & Roles</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage team members, assign roles and departments.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            className="inline-flex items-center gap-2 rounded-md bg-[#2E86AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E86AB]/90"
          >
            <Plus className="h-4 w-4" />
            Invite User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={createUser} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A]">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A]">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A]">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-[#2E86AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#2E86AB]/90"
              >
                Send Invitation
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F8F9FA]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-[#2E86AB] text-white text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{user.name}</p>
                      <p className="text-xs text-[#6B7280]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={ROLE_COLORS[user.role]} variant="secondary">
                    {user.role.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[#6B7280]">
                    {user.primaryDepartment?.name || "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Pending"}
                  </Badge>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#9CA3AF]">
                  No users yet. Click &quot;Invite User&quot; to add team members.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
