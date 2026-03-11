"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, Globe, Settings,
} from "lucide-react";
import { toast } from "sonner";

// Content types per platform
const PLATFORM_CONTENT_TYPES: Record<string, string[]> = {
  youtube: ["Explainer", "Shorts", "Community Post"],
  x_twitter: ["Thread", "Single Post"],
  instagram: ["Carousel", "Reel"],
  linkedin: ["Post", "Article"],
  blog: ["Blog Post"],
  newsletter: ["Newsletter"],
  podcast: ["Podcast Script"],
};

const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "x_twitter", label: "X/Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "podcast", label: "Podcast" },
];

interface BrandData {
  id: string;
  name: string;
  slug: string;
  language: string | null;
  tone: string | null;
  tagline: string | null;
  identityMarkdown: string | null;
  editorialCovers: string | null;
  editorialNever: string | null;
  audienceDescription: string | null;
  voiceRules: { keywords?: string[]; guidelines?: string; exampleUrls?: string[] } | null;
  contentFrequency: string | null;
  client: { id: string; name: string };
  platforms: { id: string; platform: string; config: Record<string, unknown> | null; isActive: boolean }[];
}

export default function BrandManagePage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [tone, setTone] = useState("");
  const [tagline, setTagline] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [keywords, setKeywords] = useState("");
  const [exampleUrls, setExampleUrls] = useState("");

  // Add platform modal
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newPlatformUrl, setNewPlatformUrl] = useState("");
  const [newPlatformContentTypes, setNewPlatformContentTypes] = useState<string[]>([]);
  const [addingPlatform, setAddingPlatform] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`);
      if (res.ok) {
        const data: BrandData = await res.json();
        setBrand(data);
        setName(data.name);
        setLanguage(data.language ?? "");
        setTone(data.tone ?? "");
        setTagline(data.tagline ?? "");
        const vr = data.voiceRules;
        setGuidelines(vr?.guidelines ?? "");
        setKeywords(vr?.keywords?.join(", ") ?? "");
        setExampleUrls(vr?.exampleUrls?.join("\n") ?? "");
      }
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [brandId]);

  useEffect(() => { load(); }, [load]);

  async function saveBrand() {
    setSaving(true);
    try {
      const voiceRules = {
        guidelines,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        exampleUrls: exampleUrls.split("\n").map((u) => u.trim()).filter(Boolean),
      };
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language: language || null, tone: tone || null, tagline: tagline || null, voiceRules }),
      });
      if (res.ok) {
        toast.success("Brand saved");
        load();
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function addPlatform() {
    if (!newPlatform) return;
    setAddingPlatform(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/platforms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          config: {
            url: newPlatformUrl,
            contentTypes: newPlatformContentTypes,
          },
        }),
      });
      if (res.ok) {
        toast.success("Platform added");
        setShowAddPlatform(false);
        setNewPlatform("");
        setNewPlatformUrl("");
        setNewPlatformContentTypes([]);
        load();
      }
    } catch {
      toast.error("Failed to add platform");
    }
    setAddingPlatform(false);
  }

  async function removePlatform(platformId: string) {
    if (!confirm("Remove this platform?")) return;
    try {
      const res = await fetch(`/api/brands/${brandId}/platforms/${platformId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Platform removed");
        load();
      }
    } catch {
      toast.error("Failed to remove");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#6B7280]">Brand not found.</p>
        <Link href="/brands"><Button variant="outline" size="sm" className="mt-4">Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/brands/${brandId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Manage {brand.name}</h1>
          <p className="text-sm text-[#6B7280]">{brand.client.name}</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6B7280] font-medium">Brand Name</label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] font-medium">Language</label>
              <select
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#6B7280] font-medium">Tagline</label>
              <Input className="mt-1" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Brand tagline" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Platforms */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Connected Platforms</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddPlatform(!showAddPlatform)}>
              <Plus className="h-3 w-3 mr-1" /> Add Platform
            </Button>
          </div>

          {/* Existing platforms */}
          {brand.platforms.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] italic">No platforms connected yet.</p>
          ) : (
            <div className="space-y-3">
              {brand.platforms.map((p) => {
                const cfg = (p.config || {}) as Record<string, unknown>;
                const contentTypes = (cfg.contentTypes as string[]) || PLATFORM_CONTENT_TYPES[p.platform] || [];
                return (
                  <div key={p.id} className="border border-[#E5E7EB] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#2E86AB]" />
                        <span className="text-sm font-semibold text-[#1A1A1A] capitalize">{p.platform.replace(/_/g, " ")}</span>
                        {!p.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => removePlatform(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {cfg.url ? (
                      <p className="text-xs text-[#6B7280] mb-1">URL/Handle: {String(cfg.url)}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {contentTypes.map((ct) => (
                        <Badge key={ct} variant="secondary" className="text-[10px]">{ct}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add platform form */}
          {showAddPlatform && (
            <div className="border border-[#2E86AB]/30 bg-[#2E86AB]/5 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#2E86AB]">Add New Platform</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7280] font-medium">Platform</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                    value={newPlatform}
                    onChange={(e) => {
                      setNewPlatform(e.target.value);
                      setNewPlatformContentTypes(PLATFORM_CONTENT_TYPES[e.target.value] || []);
                    }}
                  >
                    <option value="">Select...</option>
                    {PLATFORM_OPTIONS.filter((po) => !brand.platforms.some((bp) => bp.platform === po.value)).map((po) => (
                      <option key={po.value} value={po.value}>{po.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] font-medium">URL / Handle</label>
                  <Input className="mt-1" value={newPlatformUrl} onChange={(e) => setNewPlatformUrl(e.target.value)} placeholder="@handle or URL" />
                </div>
              </div>
              {newPlatform && PLATFORM_CONTENT_TYPES[newPlatform] && (
                <div>
                  <label className="text-xs text-[#6B7280] font-medium">Content Types</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PLATFORM_CONTENT_TYPES[newPlatform].map((ct) => (
                      <label key={ct} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={newPlatformContentTypes.includes(ct)}
                          onChange={(e) => {
                            if (e.target.checked) setNewPlatformContentTypes([...newPlatformContentTypes, ct]);
                            else setNewPlatformContentTypes(newPlatformContentTypes.filter((c) => c !== ct));
                          }}
                          className="accent-[#2E86AB]"
                        />
                        {ct}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#2E86AB] hover:bg-[#236b8a]" disabled={!newPlatform || addingPlatform} onClick={addPlatform}>
                  {addingPlatform ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddPlatform(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Voice */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Brand Voice</h2>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Tone Description</label>
            <Input className="mt-1" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g., authoritative but conversational" />
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Editorial Guidelines</label>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Guidelines for content creation..."
            />
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Voice Keywords</label>
            <Input
              className="mt-1"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="authoritative, data-driven, provocative (comma-separated)"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Example Content URLs</label>
            <Textarea
              className="mt-1 min-h-[80px]"
              value={exampleUrls}
              onChange={(e) => setExampleUrls(e.target.value)}
              placeholder="One URL per line..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-[#2E86AB] hover:bg-[#236b8a]" disabled={saving} onClick={saveBrand}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
