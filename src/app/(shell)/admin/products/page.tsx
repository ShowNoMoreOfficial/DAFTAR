"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "internal" | "beta" | "live";
  subscriptionCount: number;
  activeOrgCount: number;
  mrr: number;
  features: string[];
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-100 text-emerald-700",
  beta: "bg-amber-100 text-amber-700",
  internal: "bg-gray-100 text-gray-600",
};

const PRODUCT_ICONS: Record<string, string> = {
  daftar: "D",
  hoccr: "H",
  relay: "R",
  yantri: "Y",
  khabri: "K",
};

const PRODUCT_COLORS: Record<string, string> = {
  daftar: "bg-[#2E86AB]",
  hoccr: "bg-[#A23B72]",
  relay: "bg-[#F18F01]",
  yantri: "bg-[#6366F1]",
  khabri: "bg-[#059669]",
};

export default function ProductPortfolioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledProducts, setEnabledProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const res = await fetch("/api/saas/products");
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts(data);
        const enabled: Record<string, boolean> = {};
        data.forEach((p) => {
          enabled[p.slug] = p.status === "live" || p.status === "beta";
        });
        setEnabledProducts(enabled);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  function toggleProduct(slug: string) {
    setEnabledProducts((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Product Portfolio</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage B2B SaaS products in the Daftar ecosystem. Enable or disable products for tenant access.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="flex gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{products.length}</p>
          <p className="text-xs text-[#6B7280]">Total Products</p>
        </div>
        <div className="h-auto w-px bg-[#E5E7EB]" />
        <div>
          <p className="text-2xl font-bold text-emerald-600">{products.filter((p) => p.status === "live").length}</p>
          <p className="text-xs text-[#6B7280]">Live</p>
        </div>
        <div className="h-auto w-px bg-[#E5E7EB]" />
        <div>
          <p className="text-2xl font-bold text-amber-600">{products.filter((p) => p.status === "beta").length}</p>
          <p className="text-xs text-[#6B7280]">Beta</p>
        </div>
        <div className="h-auto w-px bg-[#E5E7EB]" />
        <div>
          <p className="text-2xl font-bold text-gray-500">{products.filter((p) => p.status === "internal").length}</p>
          <p className="text-xs text-[#6B7280]">Internal</p>
        </div>
        <div className="h-auto w-px bg-[#E5E7EB]" />
        <div>
          <p className="text-2xl font-bold text-[#1A1A1A]">${products.reduce((s, p) => s + p.mrr, 0).toLocaleString()}</p>
          <p className="text-xs text-[#6B7280]">Total MRR</p>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isHoccr = product.slug === "hoccr";
          return (
            <div
              key={product.id}
              className={`relative rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                isHoccr ? "border-[#A23B72] ring-2 ring-[#A23B72]/20" : "border-[#E5E7EB]"
              }`}
            >
              {/* Standalone badge for HOCCR */}
              {isHoccr && (
                <div className="absolute -top-2.5 right-4">
                  <span className="inline-flex rounded-full bg-[#A23B72] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Ready for Standalone
                  </span>
                </div>
              )}

              {/* Icon + Name + Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white ${PRODUCT_COLORS[product.slug] || "bg-gray-500"}`}>
                    {PRODUCT_ICONS[product.slug] || "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">{product.name}</h3>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLES[product.status]}`}>
                      {product.status}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleProduct(product.slug)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    enabledProducts[product.slug] ? "bg-[#2E86AB]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabledProducts[product.slug] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-[#6B7280] leading-relaxed">{product.description}</p>

              {/* Features */}
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.features.map((f) => (
                    <span key={f} className="rounded-md bg-[#F8F9FA] px-2 py-0.5 text-[10px] text-[#6B7280]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E5E7EB] pt-4">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{product.activeOrgCount}</p>
                  <p className="text-[10px] text-[#6B7280]">Clients</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{product.subscriptionCount}</p>
                  <p className="text-[10px] text-[#6B7280]">Subs</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">${product.mrr.toLocaleString()}</p>
                  <p className="text-[10px] text-[#6B7280]">MRR</p>
                </div>
              </div>

              {/* Detail link for HOCCR */}
              {isHoccr && (
                <Link
                  href="/admin/products/hoccr"
                  className="mt-4 block rounded-lg bg-[#A23B72] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#A23B72]/90"
                >
                  View Standalone Details
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
