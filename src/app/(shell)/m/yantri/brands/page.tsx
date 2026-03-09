"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Globe, Mic, ChevronDown, ChevronUp } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  tagline: string | null;
  language: string;
  tone: string;
  activePlatforms: string;
  voiceRules: string[];
  editorialCovers: string;
  editorialNever: string;
  isActive: boolean;
  createdAt: string;
}

function safeParseJSON(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/m/yantri/brands");
      if (res.ok) setBrands(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Brands</h1>
        <p className="text-sm text-[#6B7280] mt-1">Brand identities and voice configurations for content generation</p>
      </div>

      {brands.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No brands configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {brands.map((brand) => {
            const platforms = safeParseJSON(brand.activePlatforms);
            const covers = safeParseJSON(brand.editorialCovers);
            const never = safeParseJSON(brand.editorialNever);
            const isExpanded = expandedId === brand.id;

            return (
              <Card key={brand.id} className="border-[#E5E7EB]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[#1A1A1A]">{brand.name}</h3>
                        <Badge className={brand.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                          : "bg-gray-100 text-gray-500 border-gray-200 text-[10px]"
                        }>
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {brand.tagline && (
                        <p className="text-xs text-[#6B7280] mt-1 italic">{brand.tagline}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : brand.id)}
                      className="text-[#9CA3AF] hover:text-[#6B7280]"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {brand.language}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mic className="h-3.5 w-3.5" />
                      {brand.tone}
                    </div>
                  </div>

                  {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {platforms.map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[10px] font-medium">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-[#E5E7EB] pt-3 mt-3 space-y-3">
                      {brand.voiceRules && brand.voiceRules.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Voice Rules</p>
                          <ul className="text-xs text-[#6B7280] space-y-0.5">
                            {brand.voiceRules.map((r, i) => (
                              <li key={i}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {covers.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Editorial Covers</p>
                          <div className="flex flex-wrap gap-1">
                            {covers.map((c: string, i: number) => (
                              <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {never.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Never Covers</p>
                          <div className="flex flex-wrap gap-1">
                            {never.map((n: string, i: number) => (
                              <Badge key={i} className="bg-red-50 text-red-600 border-red-200 text-[10px]">{n}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
