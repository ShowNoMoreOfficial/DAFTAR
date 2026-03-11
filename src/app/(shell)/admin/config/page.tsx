"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Settings2,
  Workflow,
  Monitor,
  Shield,
  Building2,
  Pencil,
  Trash2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface DepartmentRef {
  id: string;
  name: string;
  type: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  department: DepartmentRef | null;
  stages: unknown;
  triggers: unknown;
  escalation: unknown;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PlatformConfig {
  id: string;
  platform: string;
  displayName: string;
  deliverableTypes: unknown;
  postingRules: unknown;
  analyticsMetrics: unknown;
  isActive: boolean;
}

interface RoleConfig {
  id: string;
  role: string;
  dashboardViews: unknown;
  notifications: unknown;
  reportAccess: unknown;
  giConversation: unknown;
}

interface DepartmentConfig {
  id: string;
  name: string;
  type: string;
  config: unknown;
}

const ROLES = [
  "ADMIN",
  "HEAD_HR",
  "DEPT_HEAD",
  "MEMBER",
  "CLIENT",
  "FINANCE",
  "CONTRACTOR",
];

// ─── Helper: JSON Editor Field ─────────────────────────

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isValid = (() => {
    try {
      if (value.trim()) JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <div>
      <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 font-mono text-xs ${!isValid ? "border-red-400" : ""}`}
        rows={5}
      />
      {!isValid && (
        <p className="mt-1 text-xs text-red-500">Invalid JSON</p>
      )}
    </div>
  );
}

// ─── Workflows Tab ──────────────────────────────────────

function WorkflowsTab() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    departmentId: "",
    stages: "[]",
    triggers: "",
    escalation: "",
    isDefault: false,
  });

  const fetchWorkflows = useCallback(async () => {
    const res = await fetch("/api/config/workflows");
    if (res.ok) setWorkflows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments)
      .catch(() => {});
  }, [fetchWorkflows]);

  function resetForm() {
    setForm({ name: "", description: "", departmentId: "", stages: "[]", triggers: "", escalation: "", isDefault: false });
    setEditingId(null);
  }

  function openEdit(wf: WorkflowTemplate) {
    setEditingId(wf.id);
    setForm({
      name: wf.name,
      description: wf.description || "",
      departmentId: wf.departmentId || "",
      stages: JSON.stringify(wf.stages, null, 2),
      triggers: wf.triggers ? JSON.stringify(wf.triggers, null, 2) : "",
      escalation: wf.escalation ? JSON.stringify(wf.escalation, null, 2) : "",
      isDefault: wf.isDefault,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      departmentId: form.departmentId || null,
      stages: JSON.parse(form.stages),
      triggers: form.triggers ? JSON.parse(form.triggers) : null,
      escalation: form.escalation ? JSON.parse(form.escalation) : null,
      isDefault: form.isDefault,
    };

    const url = editingId ? `/api/config/workflows/${editingId}` : "/api/config/workflows";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      resetForm();
      fetchWorkflows();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow template?")) return;
    const res = await fetch(`/api/config/workflows/${id}`, { method: "DELETE" });
    if (res.ok) fetchWorkflows();
  }

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading workflows...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Define reusable workflow templates with stages, triggers, and escalation rules.
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90">
            <Plus className="h-4 w-4" />
            Add Workflow
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Workflow Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Media Production"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                >
                  <option value="">None (General)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <JsonField
                label="Stages (JSON array)"
                value={form.stages}
                onChange={(v) => setForm({ ...form, stages: v })}
              />
              <JsonField
                label="Triggers (optional JSON)"
                value={form.triggers}
                onChange={(v) => setForm({ ...form, triggers: v })}
              />
              <JsonField
                label="Escalation Rules (optional JSON)"
                value={form.escalation}
                onChange={(v) => setForm({ ...form, escalation: v })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-subtle)]"
                />
                <label htmlFor="isDefault" className="text-sm text-[var(--text-primary)]">
                  Default workflow
                </label>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90"
              >
                {editingId ? "Update" : "Create"} Workflow
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((wf) => {
          const stageCount = Array.isArray(wf.stages) ? wf.stages.length : 0;
          return (
            <div key={wf.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h3 className="font-medium text-[var(--text-primary)]">{wf.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(wf)} className="rounded p-1 hover:bg-[var(--bg-elevated)]">
                    <Pencil className="h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                  <button onClick={() => handleDelete(wf.id)} className="rounded p-1 hover:bg-[var(--bg-elevated)]">
                    <Trash2 className="h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>
              {wf.description && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{wf.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {wf.department && (
                  <Badge variant="secondary" className="bg-[rgba(59,130,246,0.1)] text-blue-700">
                    {wf.department.name}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-[var(--bg-elevated)] text-gray-600">
                  {stageCount} stage{stageCount !== 1 ? "s" : ""}
                </Badge>
                {wf.isDefault && (
                  <Badge className="bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]">Default</Badge>
                )}
                {!wf.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          );
        })}
        {workflows.length === 0 && (
          <p className="col-span-full text-center text-sm text-[var(--text-muted)] py-8">
            No workflow templates yet. Click &quot;Add Workflow&quot; to create one.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Platforms Tab ───────────────────────────────────────

function PlatformsTab() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    platform: "",
    displayName: "",
    deliverableTypes: "[]",
    postingRules: "",
    analyticsMetrics: "",
    isActive: true,
  });

  const fetchPlatforms = useCallback(async () => {
    const res = await fetch("/api/config/platforms");
    if (res.ok) setPlatforms(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  function resetForm() {
    setForm({ platform: "", displayName: "", deliverableTypes: "[]", postingRules: "", analyticsMetrics: "", isActive: true });
    setEditingId(null);
  }

  function openEdit(pc: PlatformConfig) {
    setEditingId(pc.id);
    setForm({
      platform: pc.platform,
      displayName: pc.displayName,
      deliverableTypes: JSON.stringify(pc.deliverableTypes, null, 2),
      postingRules: pc.postingRules ? JSON.stringify(pc.postingRules, null, 2) : "",
      analyticsMetrics: pc.analyticsMetrics ? JSON.stringify(pc.analyticsMetrics, null, 2) : "",
      isActive: pc.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      platform: form.platform,
      displayName: form.displayName,
      deliverableTypes: JSON.parse(form.deliverableTypes),
      postingRules: form.postingRules ? JSON.parse(form.postingRules) : null,
      analyticsMetrics: form.analyticsMetrics ? JSON.parse(form.analyticsMetrics) : null,
      isActive: form.isActive,
    };

    const url = editingId ? `/api/config/platforms/${editingId}` : "/api/config/platforms";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      resetForm();
      fetchPlatforms();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this platform config?")) return;
    const res = await fetch(`/api/config/platforms/${id}`, { method: "DELETE" });
    if (res.ok) fetchPlatforms();
  }

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading platforms...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Configure platform-specific deliverable types, posting rules, and analytics metrics.
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90">
            <Plus className="h-4 w-4" />
            Add Platform
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Platform Config</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Platform Key</label>
                <Input
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  placeholder="e.g. youtube"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)]">Display Name</label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g. YouTube"
                  required
                />
              </div>
              <JsonField
                label="Deliverable Types (JSON array)"
                value={form.deliverableTypes}
                onChange={(v) => setForm({ ...form, deliverableTypes: v })}
              />
              <JsonField
                label="Posting Rules (optional JSON)"
                value={form.postingRules}
                onChange={(v) => setForm({ ...form, postingRules: v })}
              />
              <JsonField
                label="Analytics Metrics (optional JSON)"
                value={form.analyticsMetrics}
                onChange={(v) => setForm({ ...form, analyticsMetrics: v })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="platformActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-subtle)]"
                />
                <label htmlFor="platformActive" className="text-sm text-[var(--text-primary)]">Active</label>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90"
              >
                {editingId ? "Update" : "Create"} Platform
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((pc) => {
          const typeCount = Array.isArray(pc.deliverableTypes) ? pc.deliverableTypes.length : 0;
          return (
            <div key={pc.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h3 className="font-medium text-[var(--text-primary)]">{pc.displayName}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(pc)} className="rounded p-1 hover:bg-[var(--bg-elevated)]">
                    <Pencil className="h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                  <button onClick={() => handleDelete(pc.id)} className="rounded p-1 hover:bg-[var(--bg-elevated)]">
                    <Trash2 className="h-4 w-4 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">{pc.platform}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-[var(--bg-elevated)] text-gray-600">
                  {typeCount} deliverable type{typeCount !== 1 ? "s" : ""}
                </Badge>
                <Badge variant={pc.isActive ? "default" : "secondary"}>
                  {pc.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          );
        })}
        {platforms.length === 0 && (
          <p className="col-span-full text-center text-sm text-[var(--text-muted)] py-8">
            No platform configs yet. Click &quot;Add Platform&quot; to create one.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Roles Tab ──────────────────────────────────────────

function RolesTab() {
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [form, setForm] = useState({
    role: "ADMIN",
    dashboardViews: "[]",
    notifications: "",
    reportAccess: "",
    giConversation: "",
  });

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/config/roles");
    if (res.ok) setRoleConfigs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function openEdit(rc: RoleConfig) {
    setEditingRole(rc.role);
    setForm({
      role: rc.role,
      dashboardViews: JSON.stringify(rc.dashboardViews, null, 2),
      notifications: rc.notifications ? JSON.stringify(rc.notifications, null, 2) : "",
      reportAccess: rc.reportAccess ? JSON.stringify(rc.reportAccess, null, 2) : "",
      giConversation: rc.giConversation ? JSON.stringify(rc.giConversation, null, 2) : "",
    });
    setDialogOpen(true);
  }

  function openNew(role: string) {
    setEditingRole(null);
    setForm({
      role,
      dashboardViews: "[]",
      notifications: "",
      reportAccess: "",
      giConversation: "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      role: form.role,
      dashboardViews: JSON.parse(form.dashboardViews),
      notifications: form.notifications ? JSON.parse(form.notifications) : null,
      reportAccess: form.reportAccess ? JSON.parse(form.reportAccess) : null,
      giConversation: form.giConversation ? JSON.parse(form.giConversation) : null,
    };

    const res = await fetch("/api/config/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchRoles();
    }
  }

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading role configs...</p>;

  const configuredRoles = new Set(roleConfigs.map((rc) => rc.role));

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Configure dashboard views, notification triggers, report access, and GI conversation boundaries per role.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit" : "Configure"} Role: {form.role.replace("_", " ")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <JsonField
              label="Dashboard Views"
              value={form.dashboardViews}
              onChange={(v) => setForm({ ...form, dashboardViews: v })}
            />
            <JsonField
              label="Notifications (optional)"
              value={form.notifications}
              onChange={(v) => setForm({ ...form, notifications: v })}
            />
            <JsonField
              label="Report Access (optional)"
              value={form.reportAccess}
              onChange={(v) => setForm({ ...form, reportAccess: v })}
            />
            <JsonField
              label="GI Conversation Boundaries (optional)"
              value={form.giConversation}
              onChange={(v) => setForm({ ...form, giConversation: v })}
            />
            <button
              type="submit"
              className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90"
            >
              Save Configuration
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => {
          const config = roleConfigs.find((rc) => rc.role === role);
          const isConfigured = configuredRoles.has(role);
          return (
            <div key={role} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--accent-secondary)]" />
                  <h3 className="font-medium text-[var(--text-primary)]">{role.replace("_", " ")}</h3>
                </div>
                <button
                  onClick={() => config ? openEdit(config) : openNew(role)}
                  className="rounded p-1 hover:bg-[var(--bg-elevated)]"
                >
                  <Pencil className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <div className="mt-3">
                <Badge variant={isConfigured ? "default" : "secondary"}>
                  {isConfigured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Departments Tab ────────────────────────────────────

function DepartmentsTab() {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentConfig | null>(null);
  const [configJson, setConfigJson] = useState("");

  const fetchDepartments = useCallback(async () => {
    const res = await fetch("/api/departments");
    if (res.ok) setDepartments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function openEdit(dept: DepartmentConfig) {
    setEditingDept(dept);
    setConfigJson(dept.config ? JSON.stringify(dept.config, null, 2) : "{}");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDept) return;

    const res = await fetch(`/api/config/departments/${editingDept.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: JSON.parse(configJson) }),
    });

    if (res.ok) {
      setDialogOpen(false);
      setEditingDept(null);
      fetchDepartments();
    }
  }

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading departments...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Edit department configuration: workflow stages, KPIs, gamification rules.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Config: {editingDept?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <JsonField
              label="Department Config (JSON)"
              value={configJson}
              onChange={setConfigJson}
            />
            <p className="text-xs text-[var(--text-muted)]">
              Include workflow stages, KPIs, gamification rules, and any department-specific settings.
            </p>
            <button
              type="submit"
              className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-primary)]/90"
            >
              Save Config
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const hasConfig = dept.config && Object.keys(dept.config as object).length > 0;
          return (
            <div key={dept.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h3 className="font-medium text-[var(--text-primary)]">{dept.name}</h3>
                </div>
                <button onClick={() => openEdit(dept)} className="rounded p-1 hover:bg-[var(--bg-elevated)]">
                  <Pencil className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">{dept.type}</p>
              <div className="mt-3">
                <Badge variant={hasConfig ? "default" : "secondary"}>
                  {hasConfig ? "Configured" : "Default"}
                </Badge>
              </div>
            </div>
          );
        })}
        {departments.length === 0 && (
          <p className="col-span-full text-center text-sm text-[var(--text-muted)] py-8">
            No departments found.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-[var(--accent-primary)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">System Configuration</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configuration-over-code settings. Define workflows, platforms, roles, and department configs without changing code.
        </p>
      </div>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">
            <Workflow className="mr-1.5 h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <Monitor className="mr-1.5 h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-1.5 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="mr-1.5 h-4 w-4" />
            Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <WorkflowsTab />
        </TabsContent>
        <TabsContent value="platforms">
          <PlatformsTab />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
