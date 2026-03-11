"use client";

import { useEffect, useState } from "react";

interface HoccrStats {
  activeOrganizations: number;
  totalUsers: number;
  mrr: number;
  growthPercent: number;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  users: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

interface Client {
  id: string;
  name: string;
  plan: string;
  users: number;
  since: string;
  status: "active" | "trial" | "churned";
}

const FEATURES = [
  {
    name: "Hiring Pipeline",
    description: "End-to-end recruitment tracking with position management, candidate pipeline, and interview scheduling.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    name: "Operations KPIs",
    description: "Real-time operational metrics, capacity planning, bottleneck detection, and dependency tracking.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
    ),
  },
  {
    name: "Culture Tracking",
    description: "Employee engagement, sentiment analysis, recognition programs, and culture health monitoring.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
    ),
  },
  {
    name: "Communication Hub",
    description: "Internal announcements, feedback channels, team messaging, and organization-wide updates.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
    ),
  },
  {
    name: "Reporting Dashboard",
    description: "Comprehensive reports with exportable data, trend analysis, and executive summaries.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
    ),
  },
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    users: "Up to 10 users",
    highlighted: false,
    cta: "Start Trial",
    features: [
      "Hiring Pipeline (basic)",
      "Operations KPIs",
      "Culture Surveys",
      "Announcements",
      "Standard Reports",
      "Email Support",
    ],
  },
  {
    name: "Professional",
    price: "$149",
    period: "/mo",
    users: "Up to 50 users",
    highlighted: true,
    cta: "Start Trial",
    features: [
      "Full Hiring Pipeline",
      "Advanced Operations KPIs",
      "Culture Analytics",
      "Communication Hub",
      "Custom Reports",
      "Priority Support",
      "API Access",
      "SSO Integration",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    users: "Unlimited users",
    highlighted: false,
    cta: "Contact Sales",
    features: [
      "Everything in Professional",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
      "On-premise Option",
      "Custom Training",
      "White-label Option",
      "Advanced Security",
    ],
  },
];

const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "Acme Corp", plan: "Professional", users: 34, since: "Aug 2025", status: "active" },
  { id: "c2", name: "Globex Industries", plan: "Enterprise", users: 142, since: "Jun 2025", status: "active" },
  { id: "c3", name: "Stark Digital", plan: "Enterprise", users: 87, since: "Sep 2025", status: "active" },
  { id: "c4", name: "Wayne Enterprises", plan: "Professional", users: 45, since: "Nov 2025", status: "active" },
  { id: "c5", name: "Pied Piper", plan: "Starter", users: 8, since: "Jan 2026", status: "trial" },
  { id: "c6", name: "Hooli", plan: "Professional", users: 28, since: "Oct 2025", status: "churned" },
  { id: "c7", name: "Initech", plan: "Starter", users: 10, since: "Feb 2026", status: "active" },
];

const CLIENT_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trial: "bg-amber-100 text-amber-700",
  churned: "bg-red-100 text-red-700",
};

export default function HoccrStandalonePage() {
  const [stats, setStats] = useState<HoccrStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats from API
    const timer = setTimeout(() => {
      setStats({
        activeOrganizations: 7,
        totalUsers: 354,
        mrr: 3420,
        growthPercent: 18.5,
      });
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A23B72] text-lg font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">HOCCR Standalone</h1>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              Hiring, Operations, Culture, Communication &amp; Reporting
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      {/* Key Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Active Organizations</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{stats.activeOrganizations}</p>
            <p className="mt-1 text-xs text-emerald-600">+2 this quarter</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{stats.totalUsers}</p>
            <p className="mt-1 text-xs text-emerald-600">+{stats.growthPercent}% growth</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">MRR from HOCCR</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">${stats.mrr.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#6B7280]">35% of total MRR</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Avg Revenue / Org</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              ${stats.activeOrganizations > 0 ? Math.round(stats.mrr / stats.activeOrganizations).toLocaleString() : 0}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">per month</p>
          </div>
        </div>
      )}

      {/* Features */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Core Features</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.name} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#A23B72]/10 text-[#A23B72]">
                {feature.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#1A1A1A]">{feature.name}</h3>
              <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Pricing Tiers</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 shadow-sm ${
                tier.highlighted
                  ? "border-[#A23B72] bg-white ring-2 ring-[#A23B72]/20"
                  : "border-[#E5E7EB] bg-white"
              }`}
            >
              {tier.highlighted && (
                <span className="mb-3 inline-flex rounded-full bg-[#A23B72] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-[#1A1A1A]">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1A1A1A]">{tier.price}</span>
                {tier.period && <span className="text-sm text-[#6B7280]">{tier.period}</span>}
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">{tier.users}</p>

              <ul className="mt-5 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#1A1A1A]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A23B72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-[#A23B72] text-white hover:bg-[#A23B72]/90"
                    : "border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F8F9FA]"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">HOCCR Clients</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
              <th className="px-6 py-3">Organization</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Users</th>
              <th className="px-6 py-3">Since</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {MOCK_CLIENTS.map((client) => (
              <tr key={client.id} className="hover:bg-[#F8F9FA]">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-[#1A1A1A]">{client.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    client.plan === "Enterprise"
                      ? "bg-[#A23B72]/10 text-[#A23B72]"
                      : client.plan === "Professional"
                        ? "bg-[#2E86AB]/10 text-[#2E86AB]"
                        : "bg-gray-100 text-gray-700"
                  }`}>
                    {client.plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#1A1A1A]">{client.users}</td>
                <td className="px-6 py-4 text-xs text-[#6B7280]">{client.since}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CLIENT_STATUS_STYLES[client.status]}`}>
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
