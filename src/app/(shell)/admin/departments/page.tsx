"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Building2, Users, UserCheck, Settings2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  type: string;
  description: string | null;
  headId: string | null;
  _count: { members: number; primaryUsers: number };
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

const DEPT_TYPES = [
  "MEDIA",
  "TECH",
  "MARKETING",
  "PRODUCTION",
  "PPC",
  "PHOTOGRAPHY",
  "HR_OPS",
  "FINANCE_DEPT",
  "CUSTOM",
];

const DEPT_TYPE_COLORS: Record<string, string> = {
  MEDIA: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  TECH: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  MARKETING: "bg-[rgba(236,72,153,0.15)] text-pink-700",
  PRODUCTION: "bg-[rgba(249,115,22,0.15)] text-orange-700",
  PPC: "bg-[rgba(234,179,8,0.15)] text-yellow-700",
  PHOTOGRAPHY: "bg-[rgba(20,184,166,0.15)] text-teal-700",
  HR_OPS: "bg-[rgba(34,197,94,0.15)] text-green-700",
  FINANCE_DEPT: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
  CUSTOM: "bg-[var(--bg-elevated)] text-gray-700",
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "CUSTOM",
    description: "",
    headId: "",
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) setDepartments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []));
  }, [fetchDepartments]);

  const resetForm = () => {
    setForm({ name: "", type: "CUSTOM", description: "", headId: "" });
    setEditingDept(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      type: dept.type,
      description: dept.description || "",
      headId: dept.headId || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      headId: form.headId || null,
    };

    const url = editingDept
      ? `/api/departments/${editingDept.id}`
      : "/api/departments";
    const method = editingDept ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      resetForm();
      fetchDepartments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Departments</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage organizational departments, assign heads, and configure teams.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDept ? "Edit Department" : "Create Department"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Media Production"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                >
                  {DEPT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What does this department do?"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Department Head
                </label>
                <select
                  value={form.headId}
                  onChange={(e) => setForm({ ...form, headId: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                >
                  <option value="">No head assigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90">
                {editingDept ? "Save Changes" : "Create Department"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Cards */}
      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]">
          Loading departments...
        </p>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
          <h3 className="mt-4 text-sm font-medium text-[var(--text-primary)]">
            No Departments
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Create your first department to organize your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const head = users.find((u) => u.id === dept.headId);
            return (
              <div
                key={dept.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                      <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {dept.name}
                      </h3>
                      <Badge
                        className={cn(
                          "mt-0.5 text-[10px]",
                          DEPT_TYPE_COLORS[dept.type] || DEPT_TYPE_COLORS.CUSTOM
                        )}
                      >
                        {dept.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                {dept.description && (
                  <p className="mb-3 text-xs text-[var(--text-secondary)] line-clamp-2">
                    {dept.description}
                  </p>
                )}

                {/* Head */}
                {head ? (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] p-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={head.avatar || undefined} />
                      <AvatarFallback className="bg-[var(--accent-secondary)] text-[9px] text-white">
                        {head.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {head.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Department Head
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[#FAFAFA] p-2">
                    <UserCheck className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">
                      No head assigned
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {dept._count.primaryUsers} primary
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {dept._count.members} total
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
