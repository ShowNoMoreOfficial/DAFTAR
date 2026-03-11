"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Mail, XCircle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/constants";
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

interface InviteRecord {
  id: string;
  email: string;
  role: Role;
  status: string;
  department: { id: string; name: string } | null;
  expiresAt: string;
  createdAt: string;
}

interface DeptOption {
  id: string;
  name: string;
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

const INVITE_STATUS_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  PENDING: { bg: "bg-[rgba(245,158,11,0.15)] text-amber-700", icon: <Clock className="h-3 w-3" /> },
  ACCEPTED: { bg: "bg-[rgba(16,185,129,0.15)] text-emerald-700", icon: <CheckCircle className="h-3 w-3" /> },
  REVOKED: { bg: "bg-[rgba(239,68,68,0.15)] text-red-700", icon: <XCircle className="h-3 w-3" /> },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "invites">("users");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "MEMBER" as Role, departmentId: "" });
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [usersRes, invitesRes, deptsRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/invites"),
      fetch("/api/departments"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (invitesRes.ok) setInvites(await invitesRes.json());
    if (deptsRes.ok) setDepartments(await deptsRes.json());
    setLoading(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          departmentId: form.departmentId || null,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ email: "", role: "MEMBER", departmentId: "" });
        fetchAll();
      } else {
        const data = await res.json();
        setInviteError(data.error || "Failed to send invite");
      }
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch("/api/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "revoke" }),
    });
    if (res.ok) fetchAll();
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading users...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Users & Roles</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage team members, send invites, and assign roles.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); setInviteError(""); }}>
          <DialogTrigger>
            <Button>
              <Mail className="mr-1.5 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
            </DialogHeader>
            <form onSubmit={sendInvite} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {inviteError && (
                <p className="text-sm text-red-600">{inviteError}</p>
              )}
              <Button type="submit" className="w-full" disabled={inviting || !form.email}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                The user will be able to sign in via Google or Microsoft OAuth. Invite expires in 7 days.
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 w-fit">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "users" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          )}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab("invites")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "invites" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          )}
        >
          Invites ({invites.filter((i) => i.status === "PENDING").length} pending)
        </button>
      </div>

      {tab === "users" ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--bg-surface)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-[var(--accent-primary)] text-white text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={ROLE_COLORS[user.role]} variant="secondary">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--text-secondary)]">
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
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                    No users yet. Click &quot;Invite User&quot; to add team members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sent</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {invites.map((invite) => {
                const isExpired = new Date(invite.expiresAt) < new Date() && invite.status === "PENDING";
                const style = isExpired
                  ? { bg: "bg-[var(--bg-elevated)] text-gray-500", icon: <Clock className="h-3 w-3" /> }
                  : INVITE_STATUS_STYLES[invite.status];
                return (
                  <tr key={invite.id} className="hover:bg-[var(--bg-surface)]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{invite.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={ROLE_COLORS[invite.role]} variant="secondary">
                        {invite.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {invite.department?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn("gap-1", style.bg)}>
                        {style.icon}
                        {isExpired ? "EXPIRED" : invite.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">
                      {new Date(invite.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {invite.status === "PENDING" && !isExpired && (
                        <button
                          onClick={() => revokeInvite(invite.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                    No invitations sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
