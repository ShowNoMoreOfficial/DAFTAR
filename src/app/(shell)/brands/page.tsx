"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Globe, Palette, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Brands</h1>
        <p className="text-sm text-[var(--text-muted)]">Brands you have access to</p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]">Loading brands...</p>
      ) : brands.length === 0 ? (
        <EmptyState icon={Palette} title="No brands assigned" description="You don't have any brands assigned to you yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                    <Palette className="h-5 w-5 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{brand.name}</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">{brand.client.name}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
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
                  <span className="text-[10px] text-[var(--text-muted)]">No platforms configured</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
