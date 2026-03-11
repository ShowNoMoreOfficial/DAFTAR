"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  maxUsers: number;
  isActive: boolean;
  userCount: number;
  subscriptionCount: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  subscriptionCount: number;
  activeOrgCount: number;
  mrr: number;
  features: string[];
}

const PLAN_BADGES: Record<string, string> = {
  STARTER: "bg-[var(--bg-elevated)] text-gray-700",
  PROFESSIONAL: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  ENTERPRISE: "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]",
};

export default function SaaSDashboardPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [orgsRes, productsRes] = await Promise.all([
        fetch("/api/saas/organizations"),
        fetch("/api/saas/products"),
      ]);
      if (orgsRes.ok) setOrgs(await orgsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter((o) => o.isActive).length;
  const totalSubscriptions = orgs.reduce((s, o) => s + o.subscriptionCount, 0);
  const totalMRR = products.reduce((s, p) => s + p.mrr, 0);
  const totalUsers = orgs.reduce((s, o) => s + o.userCount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">SaaS Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Multi-tenant overview across all organizations and products.
          </p>
        </div>
        <Link
          href="/admin/saas/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary)]/90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Onboard Organization
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Total Orgs</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{totalOrgs}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{activeOrgs} active</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{totalUsers}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">across all orgs</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Subscriptions</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{totalSubscriptions}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">active subscriptions</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">MRR</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">${totalMRR.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">monthly recurring</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Products</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{products.length}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{products.filter((p) => p.status === "live").length} live</p>
        </div>
      </div>

      {/* Organization List */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        <div className="border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Organizations</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              <th className="px-6 py-3">Organization</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Users</th>
              <th className="px-6 py-3">Subscriptions</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{org.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{org.domain || org.slug}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_BADGES[org.plan] || "bg-[var(--bg-elevated)] text-gray-700"}`}>
                    {org.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-primary)]">{org.userCount}</span>
                  <span className="text-xs text-[var(--text-secondary)]"> / {org.maxUsers}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-primary)]">{org.subscriptionCount}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${org.isActive ? "bg-[rgba(16,185,129,0.15)] text-emerald-700" : "bg-[rgba(239,68,68,0.15)] text-red-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${org.isActive ? "bg-[rgba(16,185,129,0.1)]0" : "bg-[rgba(239,68,68,0.1)]0"}`} />
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">
                  {new Date(org.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Cards */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Product Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{product.name}</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{product.description}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                  product.status === "live"
                    ? "bg-[rgba(16,185,129,0.15)] text-emerald-700"
                    : product.status === "beta"
                      ? "bg-[rgba(245,158,11,0.15)] text-amber-700"
                      : "bg-[var(--bg-elevated)] text-gray-600"
                }`}>
                  {product.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{product.activeOrgCount}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Active Orgs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{product.subscriptionCount}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Subscriptions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">${product.mrr.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">MRR</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
