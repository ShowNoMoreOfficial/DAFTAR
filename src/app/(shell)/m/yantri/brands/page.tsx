"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, ExternalLink } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  platforms?: { platform: string }[];
}

export default function YantriBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(Array.isArray(data) ? data : data.brands || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Brands</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Brand configurations for narrative intelligence</p>
        </div>
        <a href="/admin/clients" className="text-xs text-[var(--accent-primary)] hover:underline">
          Manage brands &rarr;
        </a>
      </div>

      {brands.length === 0 ? (
        <Card className="border-[var(--border-subtle)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Palette className="h-10 w-10 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No brands configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Card key={brand.id} className="border-[var(--border-subtle)] hover:border-[#2E86AB]/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{brand.name}</h3>
                  <a href={"/brands/" + brand.id} className="text-[var(--accent-primary)] hover:text-[#236b8a]">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">/{brand.slug}</p>
                {brand.platforms && brand.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {brand.platforms.map((p) => (
                      <Badge key={p.platform} variant="secondary" className="text-[10px]">{p.platform}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
