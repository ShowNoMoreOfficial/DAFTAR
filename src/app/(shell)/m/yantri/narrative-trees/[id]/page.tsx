"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Plus, Trash2, ExternalLink,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  platforms: { id: string; platform: string; isActive: boolean }[];
}

interface Narrative {
  id: string;
  brandId: string;
  platform: string;
  angle: string | null;
  formatNotes: string | null;
  status: string;
  taskId: string | null;
  contentPostId: string | null;
  brand: { id: string; name: string; slug: string };
}

interface NarrativeTree {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  urgency: string;
  signalData: Record<string, unknown> | null;
  createdAt: string;
  createdBy: { name: string };
  narratives: Narrative[];
}

const STATUS_COLORS: Record<string, string> = {
  INCOMING: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PRODUCTION: "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-gray-50 text-gray-600 border-gray-200",
  SKIPPED: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function NarrativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tree, setTree] = useState<NarrativeTree | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state for adding deliverables
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [angle, setAngle] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTree = useCallback(async () => {
    try {
      const [treeRes, brandsRes] = await Promise.all([
        fetch("/api/yantri/narratives/" + id),
        fetch("/api/brands"),
      ]);
      if (treeRes.ok) setTree(await treeRes.json());
      if (brandsRes.ok) {
        const bd = await brandsRes.json();
        setBrands(Array.isArray(bd) ? bd : bd.data || []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const selectedBrandData = brands.find((b) => b.id === selectedBrand);
  const availablePlatforms = selectedBrandData?.platforms?.filter((p) => p.isActive) || [];

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleCreateDeliverables = async () => {
    if (!selectedBrand || selectedPlatforms.length === 0) return;
    setCreating(true);
    try {
      const deliverables = selectedPlatforms.map((platform) => ({
        brandId: selectedBrand,
        platform,
        angle: angle || null,
        formatNotes: null,
      }));
      const res = await fetch("/api/yantri/narratives/" + id + "/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverables }),
      });
      if (res.ok) {
        setShowForm(false);
        setSelectedBrand("");
        setSelectedPlatforms([]);
        setAngle("");
        await fetchTree();
      }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const handleUpdateStatus = async (status: string) => {
    await fetch("/api/yantri/narratives/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchTree();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this narrative tree and all its deliverables?")) return;
    await fetch("/api/yantri/narratives/" + id, { method: "DELETE" });
    router.push("/m/yantri/narrative-trees");
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
    </div>
  );

  if (!tree) return (
    <div className="text-center py-20 text-sm text-[#6B7280]">Narrative tree not found.</div>
  );

  const sc = STATUS_COLORS[tree.status] || STATUS_COLORS.INCOMING;

  return (
    <div>
      <button onClick={() => router.push("/m/yantri/narrative-trees")} className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1A1A1A] mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Narrative Trees
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]">{tree.title}</h1>
            {tree.urgency === "breaking" && (
              <Badge className="bg-red-500 text-white text-[9px] animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Breaking
              </Badge>
            )}
            {tree.urgency === "high" && <Badge className="bg-amber-500 text-white text-[9px]">High Priority</Badge>}
          </div>
          {tree.summary && <p className="text-sm text-[#6B7280] mt-1">{tree.summary}</p>}
          <p className="text-xs text-[#9CA3AF] mt-2">
            Created by {tree.createdBy.name} on {new Date(tree.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={"text-xs font-semibold border " + sc}>{tree.status.replace("_", " ")}</Badge>
        </div>
      </div>

      {/* Status Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tree.status === "INCOMING" && (
          <>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => handleUpdateStatus("APPROVED")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve for Production
            </Button>
            <Button size="sm" variant="outline" className="text-gray-500" onClick={() => handleUpdateStatus("SKIPPED")}>
              Skip
            </Button>
          </>
        )}
        {tree.status === "APPROVED" && (
          <Button size="sm" className="bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white gap-1" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Create Deliverables
          </Button>
        )}
        {tree.status === "IN_PRODUCTION" && (
          <>
            <Button size="sm" className="bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white gap-1" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Add More Deliverables
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus("COMPLETED")}>
              Mark Completed
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 ml-auto" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Create Deliverables Form */}
      {showForm && (
        <Card className="border-[#2E86AB]/30 mb-6">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Create Deliverables</h3>

            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => { setSelectedBrand(e.target.value); setSelectedPlatforms([]); }}
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#2E86AB] focus:outline-none"
              >
                <option value="">Select brand...</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {selectedBrand && (
              <div>
                <label className="text-xs font-medium text-[#6B7280] block mb-2">Platforms</label>
                {availablePlatforms.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No active platforms for this brand. Add platforms in brand settings.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availablePlatforms.map((p) => (
                      <button
                        key={p.platform}
                        onClick={() => togglePlatform(p.platform)}
                        className={
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " +
                          (selectedPlatforms.includes(p.platform)
                            ? "bg-[#2E86AB] text-white border-[#2E86AB]"
                            : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#2E86AB]")
                        }
                      >
                        {p.platform}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">Editorial Angle (optional)</label>
              <input
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="e.g. Breaking analysis with timeline..."
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white"
                onClick={handleCreateDeliverables}
                disabled={!selectedBrand || selectedPlatforms.length === 0 || creating}
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Create {selectedPlatforms.length} Deliverable{selectedPlatforms.length !== 1 ? "s" : ""}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Deliverables */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">
          Deliverables ({tree.narratives.length})
        </h2>
        {tree.narratives.length === 0 ? (
          <Card className="border-[#E5E7EB]">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-[#6B7280]">No deliverables yet.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {tree.status === "INCOMING"
                  ? "Approve this narrative first, then create deliverables."
                  : "Click 'Create Deliverables' to assign brands and platforms."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tree.narratives.map((n) => (
              <Card key={n.id} className="border-[#E5E7EB]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{n.platform}</Badge>
                    <span className="text-sm font-medium text-[#1A1A1A]">{n.brand.name}</span>
                    {n.angle && <span className="text-xs text-[#6B7280] italic">{n.angle}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[n.status] || "bg-gray-100 text-gray-600"}>
                      {n.status.replace("_", " ")}
                    </Badge>
                    {n.taskId && (
                      <a href="/pms/board" className="text-xs text-[#2E86AB] flex items-center gap-0.5 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Task
                      </a>
                    )}
                    {n.contentPostId && (
                      <a href="/relay" className="text-xs text-[#A23B72] flex items-center gap-0.5 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Post
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
