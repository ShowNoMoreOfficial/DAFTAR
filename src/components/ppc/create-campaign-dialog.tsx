"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface BrandOption {
  id: string;
  name: string;
}

const PLATFORMS = [
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads" },
  { value: "YOUTUBE_ADS", label: "YouTube Ads" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
  { value: "X_ADS", label: "X Ads" },
];

const OBJECTIVES = [
  { value: "BRAND_AWARENESS", label: "Brand Awareness" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "VIDEO_VIEWS", label: "Video Views" },
  { value: "LEAD_GENERATION", label: "Lead Generation" },
  { value: "CONVERSIONS", label: "Conversions" },
];

export function CreateCampaignDialog({ open, onOpenChange, onCreated }: CreateCampaignDialogProps) {
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [platform, setPlatform] = useState("");
  const [objective, setObjective] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<BrandOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/brands")
        .then((r) => r.json())
        .then((d) => setBrands(Array.isArray(d) ? d : []));
    }
  }, [open]);

  const resetForm = () => {
    setName("");
    setBrandId("");
    setPlatform("");
    setObjective("");
    setDailyBudget("");
    setTotalBudget("");
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!name || !brandId || !platform || !objective) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ppc/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          brandId,
          platform,
          objective,
          dailyBudget: dailyBudget || undefined,
          totalBudget: totalBudget || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create campaign");
      }

      toast.success("Campaign created");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectClass =
    "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Campaign</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Campaign Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Brand Awareness Push"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Brand *
            </label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={selectClass}>
              <option value="">Select a brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Platform + Objective row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Platform *
              </label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
                <option value="">Select...</option>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Objective *
              </label>
              <select value={objective} onChange={(e) => setObjective(e.target.value)} className={selectClass}>
                <option value="">Select...</option>
                {OBJECTIVES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Daily Budget (₹)
              </label>
              <Input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Total Budget (₹)
              </label>
              <Input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Start Date
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                End Date
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Campaign notes, target audience details..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" disabled={loading} onClick={handleSubmit}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
