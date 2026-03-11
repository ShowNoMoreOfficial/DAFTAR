"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTENT_TYPES } from "@/components/yantri/content-type-icons";

export default function ContentTypesPage() {
  const entries = Object.entries(CONTENT_TYPES);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Content Types</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Reference guide for all {entries.length} content types supported by the Yantri pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([key, ct]) => {
          const Icon = ct.icon;
          return (
            <Card key={key} className="border-[#E5E7EB] hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2E86AB]/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#2E86AB]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">{ct.label}</h3>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{ct.platform}</Badge>
                  </div>
                </div>
                <p className="text-sm text-[#6B7280] mb-3">{ct.description}</p>
                <div>
                  <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Generated Output</span>
                  <p className="text-xs text-[#6B7280] mt-0.5">{ct.outputs}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
