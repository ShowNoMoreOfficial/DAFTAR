"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Briefcase, UserPlus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
  id: string;
  title: string;
  description: string | null;
  isOpen: boolean;
  department: { id: string; name: string };
  _count: { candidates: number };
  candidates?: Candidate[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-[var(--bg-elevated)] text-gray-700",
  SCREENING: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  INTERVIEW: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  OFFER: "bg-[rgba(234,179,8,0.15)] text-yellow-700",
  HIRED: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
  REJECTED: "bg-[rgba(239,68,68,0.15)] text-red-700",
  WITHDRAWN: "bg-[var(--bg-elevated)] text-gray-500",
};

export default function HiringPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [addCandidateFor, setAddCandidateFor] = useState<string | null>(null);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Create position form
  const [posTitle, setPosTitle] = useState("");
  const [posDept, setPosDept] = useState("");
  const [posDesc, setPosDesc] = useState("");

  // Add candidate form
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("");

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hoccr/positions");
      if (res.ok) setPositions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(Array.isArray(d) ? d : []));
  }, [fetchPositions]);

  const handleExpandPosition = async (id: string) => {
    if (expandedPosition === id) {
      setExpandedPosition(null);
      return;
    }
    const res = await fetch(`/api/hoccr/positions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, candidates: data.candidates } : p))
      );
      setExpandedPosition(id);
    }
  };

  const handleCreatePosition = async () => {
    if (!posTitle || !posDept) return;
    const res = await fetch("/api/hoccr/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: posTitle, departmentId: posDept, description: posDesc || null }),
    });
    if (res.ok) {
      setPosTitle("");
      setPosDept("");
      setPosDesc("");
      setCreateOpen(false);
      fetchPositions();
    }
  };

  const handleAddCandidate = async () => {
    if (!candName || !candEmail || !addCandidateFor) return;
    const res = await fetch("/api/hoccr/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: candName, email: candEmail, phone: candPhone || null, positionId: addCandidateFor }),
    });
    if (res.ok) {
      setCandName("");
      setCandEmail("");
      setCandPhone("");
      setAddCandidateFor(null);
      fetchPositions();
      if (expandedPosition) handleExpandPosition(expandedPosition);
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, status: string) => {
    await fetch("/api/hoccr/candidates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, status }),
    });
    if (expandedPosition) handleExpandPosition(expandedPosition);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Hiring Pipeline</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage open positions and candidates</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Position
        </Button>
      </div>

      {/* Create position dialog */}
      {createOpen && (
        <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Position</h3>
            <button onClick={() => setCreateOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input placeholder="Position title" value={posTitle} onChange={(e) => setPosTitle(e.target.value)} />
            <select
              value={posDept}
              onChange={(e) => setPosDept(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Textarea placeholder="Description" value={posDesc} onChange={(e) => setPosDesc(e.target.value)} rows={2} className="mb-3" />
          <Button size="sm" onClick={handleCreatePosition} disabled={!posTitle || !posDept}>
            Create Position
          </Button>
        </div>
      )}

      {/* Positions list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">
          No positions yet. Create one to start your hiring pipeline.
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos) => (
            <div key={pos.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {/* Position header */}
              <div
                className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-[var(--bg-surface)]"
                onClick={() => handleExpandPosition(pos.id)}
              >
                {expandedPosition === pos.id ? (
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                )}
                <Briefcase className="h-5 w-5 text-[var(--accent-primary)]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{pos.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{pos.department.name}</Badge>
                    {!pos.isOpen && <Badge className="bg-[rgba(239,68,68,0.15)] text-red-700 text-[10px]">Closed</Badge>}
                  </div>
                  {pos.description && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{pos.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{pos._count.candidates} candidates</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddCandidateFor(pos.id);
                    }}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Expanded: Candidates */}
              {expandedPosition === pos.id && pos.candidates && (
                <div className="border-t border-[var(--border-subtle)] p-4">
                  {pos.candidates.length === 0 ? (
                    <p className="text-center text-xs text-[var(--text-muted)]">No candidates yet</p>
                  ) : (
                    <div className="space-y-2">
                      {pos.candidates.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-surface)] p-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-[var(--accent-secondary)] text-[10px] text-white">
                              {c.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{c.email}</p>
                          </div>
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateCandidateStatus(c.id, e.target.value)}
                            className={cn(
                              "rounded-full border-0 px-2.5 py-1 text-[10px] font-medium",
                              STATUS_COLORS[c.status]
                            )}
                          >
                            {["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED", "WITHDRAWN"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add candidate dialog */}
      {addCandidateFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Add Candidate</h3>
              <button onClick={() => setAddCandidateFor(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Name *" value={candName} onChange={(e) => setCandName(e.target.value)} />
              <Input placeholder="Email *" type="email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} />
              <Input placeholder="Phone" value={candPhone} onChange={(e) => setCandPhone(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddCandidateFor(null)}>Cancel</Button>
                <Button onClick={handleAddCandidate} disabled={!candName || !candEmail}>Add Candidate</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
