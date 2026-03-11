"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, FileText, BarChart3, Users, CheckSquare } from "lucide-react";

interface Report {
  id: string;
  title: string;
  type: string;
  description: string | null;
  generatedData: Record<string, unknown> | null;
  createdBy: { id: string; name: string };
  department: { id: string; name: string } | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  DEPARTMENT_PERFORMANCE: <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />,
  TEAM_WORKLOAD: <Users className="h-5 w-5 text-[var(--accent-secondary)]" />,
  TASK_COMPLETION: <CheckSquare className="h-5 w-5 text-emerald-500" />,
  HIRING_PIPELINE: <Users className="h-5 w-5 text-purple-500" />,
  CUSTOM: <FileText className="h-5 w-5 text-[var(--text-secondary)]" />,
};

const TYPE_LABELS: Record<string, string> = {
  DEPARTMENT_PERFORMANCE: "Department Performance",
  TEAM_WORKLOAD: "Team Workload",
  TASK_COMPLETION: "Task Completion",
  HIRING_PIPELINE: "Hiring Pipeline",
  CUSTOM: "Custom",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("TASK_COMPLETION");
  const [deptId, setDeptId] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hoccr/reports");
      if (res.ok) setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(Array.isArray(d) ? d : []));
  }, [fetchReports]);

  const handleCreate = async () => {
    if (!title) return;
    setCreating(true);
    try {
      const res = await fetch("/api/hoccr/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, departmentId: deptId || null }),
      });
      if (res.ok) {
        setTitle("");
        setType("TASK_COMPLETION");
        setDeptId("");
        setCreateOpen(false);
        fetchReports();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reports</h2>
          <p className="text-sm text-[var(--text-muted)]">Generate and view organizational reports</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Generate Report
        </Button>
      </div>

      {/* Create report form */}
      {createOpen && (
        <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Generate Report</h3>
            <button onClick={() => setCreateOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Input placeholder="Report title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={creating || !title}>
            {creating ? "Generating..." : "Generate"}
          </Button>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">
          No reports yet. Generate one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all hover:shadow-md"
            >
              <div className="mb-3 flex items-start gap-3">
                {TYPE_ICONS[report.type]}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">{report.title}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {TYPE_LABELS[report.type]}
                    </Badge>
                    {report.department && (
                      <Badge variant="secondary" className="text-[10px]">
                        {report.department.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick data preview */}
              {report.generatedData && report.type === "TASK_COMPLETION" && (
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-surface)] p-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {(report.generatedData as Record<string, number>).total || 0}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">
                      {(report.generatedData as Record<string, number>).completed || 0}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--accent-primary)]">
                      {(report.generatedData as Record<string, number>).completionRate || 0}%
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">Rate</p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                <span>By {report.createdBy.name}</span>
                <span>
                  {new Date(report.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report detail modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{selectedReport.title}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary">{TYPE_LABELS[selectedReport.type]}</Badge>
              {selectedReport.department && (
                <Badge variant="secondary">{selectedReport.department.name}</Badge>
              )}
            </div>
            {selectedReport.generatedData && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-secondary)]">
                {JSON.stringify(selectedReport.generatedData, null, 2)}
              </pre>
            )}
            <div className="mt-4 text-right">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
