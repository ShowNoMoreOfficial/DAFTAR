"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Globe, Palette, ArrowRight } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  client: { id: string; name: string };
  platforms: { platform: string; isActive: boolean }[];
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">My Brands</h1>
        <p className="text-sm text-[#9CA3AF]">Brands you have access to</p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">Loading brands...</p>
      ) : brands.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">No brands assigned to you.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="group rounded-xl border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E86AB]/10">
                    <Palette className="h-5 w-5 text-[#2E86AB]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">{brand.name}</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{brand.client.name}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {brand.platforms.map((p) => (
                  <Badge
                    key={p.platform}
                    variant={p.isActive ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    <Globe className="mr-1 h-3 w-3" />
                    {p.platform}
                  </Badge>
                ))}
                {brand.platforms.length === 0 && (
                  <span className="text-[10px] text-[#D1D5DB]">No platforms configured</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
