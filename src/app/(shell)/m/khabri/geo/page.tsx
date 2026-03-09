"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2,
  Loader2,
  RefreshCw,
  MapPin,
  Radio,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriGeoHotspot, KhabriCountryIntel } from "@/types/khabri";

// ─── Component ──────────────────────────────────────────

export default function KhabriGeoPage() {
  const [hotspots, setHotspots] = useState<KhabriGeoHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [countryIntel, setCountryIntel] = useState<KhabriCountryIntel | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  const fetchHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/khabri/geo/hotspots?hours=${hours}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setHotspots(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { fetchHotspots(); }, [fetchHotspots]);

  const toggleCountry = async (countryCode: string) => {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null);
      setCountryIntel(null);
      return;
    }

    setExpandedCountry(countryCode);
    setIntelLoading(true);
    setCountryIntel(null);

    try {
      const res = await fetch(`/api/khabri/geo/${countryCode}`);
      if (res.ok) {
        const data = await res.json();
        setCountryIntel(data.data || null);
      }
    } catch {
      // ignore
    } finally {
      setIntelLoading(false);
    }
  };

  // Calculate max signal count for bar widths
  const maxSignals = Math.max(...hotspots.map((h) => h.signalCount), 1);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-emerald-600" /> Geo Intelligence
          </h1>
          <p className="text-sm text-[#6B7280]">Geographic hotspot analysis and country-level intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {[6, 12, 24, 48].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  hours === h
                    ? "bg-[#2E86AB] text-white"
                    : "bg-white text-[#6B7280] hover:bg-[#F8F9FA]"
                )}
              >
                {h}h
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchHotspots} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
        </div>
      ) : (
        <div className="space-y-2">
          {hotspots.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-12 text-center text-sm text-[#9CA3AF]">
              No geo hotspots detected in the last {hours} hours
            </div>
          ) : (
            hotspots.map((hotspot, index) => {
              const isExpanded = expandedCountry === hotspot.countryCode;
              const barWidth = (hotspot.signalCount / maxSignals) * 100;

              return (
                <div
                  key={hotspot.countryCode}
                  className={cn(
                    "rounded-xl border bg-white transition-colors",
                    isExpanded ? "border-emerald-300" : "border-[#E5E7EB]"
                  )}
                >
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                    onClick={() => toggleCountry(hotspot.countryCode)}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium text-[#1A1A1A]">{hotspot.country}</span>
                        <span className="text-xs text-[#9CA3AF]">({hotspot.countryCode})</span>
                      </div>
                      {hotspot.topCategories && hotspot.topCategories.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {hotspot.topCategories.slice(0, 3).map((cat) => (
                            <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 rounded-full bg-[#F0F2F5] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#1A1A1A]">
                        <Radio className="h-3 w-3 text-[#9CA3AF]" /> {hotspot.signalCount}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Country Intel */}
                  {isExpanded && (
                    <div className="border-t border-[#F0F2F5] px-5 py-4">
                      {intelLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </div>
                      ) : countryIntel ? (
                        <div className="space-y-3">
                          {countryIntel.briefing && (
                            <div className="rounded-lg bg-emerald-50 p-3">
                              <p className="text-xs font-medium text-emerald-800 mb-1">AI Briefing</p>
                              <p className="text-sm text-emerald-900 leading-relaxed">{countryIntel.briefing}</p>
                            </div>
                          )}

                          {countryIntel.sentiment && (
                            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                              Overall sentiment:
                              {countryIntel.sentiment.label === "POSITIVE" && <ThumbsUp className="h-4 w-4 text-emerald-500" />}
                              {countryIntel.sentiment.label === "NEGATIVE" && <ThumbsDown className="h-4 w-4 text-red-500" />}
                              {countryIntel.sentiment.label === "NEUTRAL" && <Minus className="h-4 w-4 text-gray-400" />}
                              <strong className="text-[#1A1A1A]">{countryIntel.sentiment.label}</strong>
                              <span>({countryIntel.sentiment.score.toFixed(2)})</span>
                            </div>
                          )}

                          {countryIntel.topTopics && countryIntel.topTopics.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-[#6B7280] mb-1.5">Top Topics</p>
                              <div className="flex flex-wrap gap-1.5">
                                {countryIntel.topTopics.map((topic) => (
                                  <span key={topic} className="rounded-full bg-[#F0F2F5] px-2.5 py-0.5 text-xs text-[#6B7280]">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">No detailed intelligence available</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
