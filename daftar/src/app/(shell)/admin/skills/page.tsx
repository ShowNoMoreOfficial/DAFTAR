"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface SkillItem {
  id: string;
  path: string;
  domain: string;
  module: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
  _count: { executions: number; learningLogs: number };
}

interface GroupedDomain {
  domain: string;
  skills: SkillItem[];
}

interface SkillDetail {
  skill: SkillItem & {
    learningLogs: Array<{
      id: string;
      entry: Record<string, unknown>;
      source: string;
      periodStart: string;
      periodEnd: string;
      createdAt: string;
    }>;
    executions: Array<{
      id: string;
      brandId: string | null;
      platform: string | null;
      modelUsed: string;
      durationMs: number | null;
      performanceScore: number | null;
      status: string;
      executedAt: string;
    }>;
  };
  fileContent: string | null;
}

const DOMAIN_COLORS: Record<string, string> = {
  signals: "bg-orange-100 text-orange-700",
  narrative: "bg-purple-100 text-purple-700",
  production: "bg-blue-100 text-blue-700",
  platforms: "bg-green-100 text-green-700",
  distribution: "bg-cyan-100 text-cyan-700",
  analytics: "bg-pink-100 text-pink-700",
  brand: "bg-amber-100 text-amber-700",
  gi: "bg-indigo-100 text-indigo-700",
  workflows: "bg-teal-100 text-teal-700",
  system: "bg-gray-100 text-gray-700",
};

const MODULE_COLORS: Record<string, string> = {
  khabri: "bg-orange-50 text-orange-600 border-orange-200",
  yantri: "bg-purple-50 text-purple-600 border-purple-200",
  pms: "bg-blue-50 text-blue-600 border-blue-200",
  relay: "bg-green-50 text-green-600 border-green-200",
  hoccr: "bg-pink-50 text-pink-600 border-pink-200",
  daftar: "bg-gray-50 text-gray-600 border-gray-200",
  gi: "bg-indigo-50 text-indigo-600 border-indigo-200",
};

export default function SkillsPage() {
  const [grouped, setGrouped] = useState<GroupedDomain[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (domainFilter) params.set("domain", domainFilter);
    try {
      const res = await fetch(`/api/skills?${params}`);
      const data = await res.json();
      setGrouped(data.grouped ?? []);
      setTotal(data.total ?? 0);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [search, domainFilter]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/skills/sync", { method: "POST" });
      const data = await res.json();
      alert(`Synced ${data.synced} skills. ${data.errors?.length ?? 0} errors.`);
      fetchSkills();
    } catch {
      alert("Sync failed");
    }
    setSyncing(false);
  };

  const handleSkillClick = async (skill: SkillItem) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skill.path)}`);
      const data = await res.json();
      setSelectedSkill(data);
    } catch {
      /* ignore */
    }
    setDetailLoading(false);
  };

  const handleTestExecute = async (skillPath: string) => {
    try {
      const res = await fetch("/api/skills/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillPath,
          context: { test: true, timestamp: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      alert(
        data.success
          ? `Skill executed in ${data.durationMs}ms`
          : `Execution failed: ${data.error}`
      );
      // Refresh detail
      if (selectedSkill) {
        handleSkillClick(selectedSkill.skill);
      }
    } catch {
      alert("Execution failed");
    }
  };

  return (
    <div className="flex h-full">
      {/* Skill List */}
      <div className={`flex flex-col border-r border-[#E5E7EB] ${selectedSkill ? "w-1/2" : "w-full"}`}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white p-4">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">Skills Ecosystem</h1>
            <p className="text-sm text-[#6B7280]">{total} skills registered</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg bg-[#2E86AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#2577A0] disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync from Files"}
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[#E5E7EB] p-4">
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2E86AB]"
          />
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2E86AB]"
          >
            <option value="">All Domains</option>
            {Object.keys(DOMAIN_COLORS).map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-[#6B7280]">Loading skills...</p>
          ) : grouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6B7280] text-sm">No skills found.</p>
              <p className="text-[#9CA3AF] text-xs mt-1">Click &quot;Sync from Files&quot; to scan the /skills/ directory.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.domain} className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className={DOMAIN_COLORS[group.domain] ?? "bg-gray-100 text-gray-700"}>
                    {group.domain}
                  </Badge>
                  <span className="text-xs text-[#9CA3AF]">{group.skills.length} skills</span>
                </div>
                <div className="space-y-1">
                  {group.skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-[#F8F9FA] ${
                        selectedSkill?.skill.id === skill.id
                          ? "border-[#2E86AB] bg-[#F0F7FA]"
                          : "border-[#E5E7EB]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{skill.name}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{skill.path}</p>
                        </div>
                        <div className="ml-2 flex items-center gap-1">
                          <Badge variant="outline" className={`text-[10px] ${MODULE_COLORS[skill.module] ?? ""}`}>
                            {skill.module}
                          </Badge>
                          <span className="text-[10px] text-[#9CA3AF]">v{skill.version}</span>
                        </div>
                      </div>
                      {skill.description && (
                        <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">{skill.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                        <span>{skill._count.executions} executions</span>
                        <span>{skill._count.learningLogs} learning logs</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skill Detail Panel */}
      {selectedSkill && (
        <div className="flex w-1/2 flex-col overflow-auto">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white p-4">
            <div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">{selectedSkill.skill.name}</h2>
              <p className="text-xs text-[#9CA3AF]">{selectedSkill.skill.path}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestExecute(selectedSkill.skill.path)}
                className="rounded-lg border border-[#2E86AB] px-3 py-1.5 text-xs font-medium text-[#2E86AB] hover:bg-[#F0F7FA]"
              >
                Test Execute
              </button>
              <button
                onClick={() => setSelectedSkill(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-[#6B7280] hover:bg-[#F0F2F5]"
              >
                Close
              </button>
            </div>
          </div>

          {detailLoading ? (
            <p className="p-4 text-sm text-[#6B7280]">Loading...</p>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Metadata */}
              <div className="rounded-xl border border-[#E5E7EB] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">Metadata</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[#9CA3AF]">Domain:</span>{" "}
                    <Badge className={DOMAIN_COLORS[selectedSkill.skill.domain] ?? ""}>
                      {selectedSkill.skill.domain}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Module:</span>{" "}
                    <Badge variant="outline" className={MODULE_COLORS[selectedSkill.skill.module] ?? ""}>
                      {selectedSkill.skill.module}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Version:</span>{" "}
                    <span className="text-[#1A1A1A]">{selectedSkill.skill.version}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Executions:</span>{" "}
                    <span className="text-[#1A1A1A]">{selectedSkill.skill._count.executions}</span>
                  </div>
                </div>
                {selectedSkill.skill.metadata && (() => {
                  const meta = selectedSkill.skill.metadata as Record<string, unknown>;
                  const trigger = meta.trigger ? String(meta.trigger) : null;
                  const deps = Array.isArray(meta.dependencies) ? (meta.dependencies as string[]) : [];
                  return (
                    <div className="mt-3 space-y-1">
                      {trigger && (
                        <p className="text-xs">
                          <span className="text-[#9CA3AF]">Trigger:</span>{" "}
                          <span className="text-[#1A1A1A]">{trigger}</span>
                        </p>
                      )}
                      {deps.length > 0 && (
                        <p className="text-xs">
                          <span className="text-[#9CA3AF]">Dependencies:</span>{" "}
                          <span className="text-[#1A1A1A]">{deps.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* File Content */}
              {selectedSkill.fileContent && (
                <div className="rounded-xl border border-[#E5E7EB] p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">Skill File</h3>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-[#F8F9FA] p-3 text-xs text-[#1A1A1A] whitespace-pre-wrap">
                    {selectedSkill.fileContent}
                  </pre>
                </div>
              )}

              {/* Recent Executions */}
              <div className="rounded-xl border border-[#E5E7EB] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">
                  Recent Executions ({selectedSkill.skill.executions.length})
                </h3>
                {selectedSkill.skill.executions.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No executions yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSkill.skill.executions.map((exec) => (
                      <div key={exec.id} className="flex items-center justify-between rounded-lg bg-[#F8F9FA] p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${exec.status === "completed" ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-[#1A1A1A]">{exec.modelUsed}</span>
                          {exec.platform && <span className="text-[#9CA3AF]">• {exec.platform}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {exec.durationMs && <span className="text-[#9CA3AF]">{exec.durationMs}ms</span>}
                          {exec.performanceScore !== null && (
                            <Badge variant="outline" className="text-[10px]">
                              {exec.performanceScore.toFixed(1)}
                            </Badge>
                          )}
                          <span className="text-[#9CA3AF]">
                            {new Date(exec.executedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Learning Logs */}
              <div className="rounded-xl border border-[#E5E7EB] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">
                  Learning Logs ({selectedSkill.skill.learningLogs.length})
                </h3>
                {selectedSkill.skill.learningLogs.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No learning logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSkill.skill.learningLogs.map((log) => (
                      <div key={log.id} className="rounded-lg bg-[#F8F9FA] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[10px]">{log.source}</Badge>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {new Date(log.periodStart).toLocaleDateString()} - {new Date(log.periodEnd).toLocaleDateString()}
                          </span>
                        </div>
                        <pre className="text-xs text-[#1A1A1A] whitespace-pre-wrap">
                          {JSON.stringify(log.entry, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
