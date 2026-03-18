import { NextResponse } from "next/server";
import { forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

interface SaaSProduct {
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

// GET /api/saas/products — List all SaaS products with subscription counts
export const GET = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const products: SaaSProduct[] = [
    {
      id: "product-daftar",
      name: "Daftar OS",
      slug: "daftar",
      description:
        "All-in-one workspace operating system for managing teams, tasks, departments, and workflows.",
      status: "live",
      subscriptionCount: 12,
      activeOrgCount: 10,
      mrr: 4870,
      features: [
        "Task Management",
        "Department Hierarchy",
        "Role-based Access",
        "Gamification",
        "Finance Tracking",
        "Knowledge Base",
      ],
    },
    {
      id: "product-hoccr",
      name: "HOCCR",
      slug: "hoccr",
      description:
        "Hiring, Operations, Culture, Communication, and Reporting platform for HR and people ops.",
      status: "live",
      subscriptionCount: 8,
      activeOrgCount: 7,
      mrr: 3420,
      features: [
        "Hiring Pipeline",
        "Operations KPIs",
        "Culture Tracking",
        "Communication Hub",
        "Reporting Dashboard",
      ],
    },
    {
      id: "product-relay",
      name: "Relay",
      slug: "relay",
      description:
        "Social media management and content scheduling platform for brands and agencies.",
      status: "beta",
      subscriptionCount: 5,
      activeOrgCount: 4,
      mrr: 1245,
      features: [
        "Multi-platform Publishing",
        "Content Calendar",
        "Analytics Dashboard",
        "Brand Management",
        "Collaboration Tools",
      ],
    },
    {
      id: "product-yantri",
      name: "Yantri",
      slug: "yantri",
      description:
        "Workflow automation engine with visual builder for business process automation.",
      status: "internal",
      subscriptionCount: 2,
      activeOrgCount: 1,
      mrr: 0,
      features: [
        "Visual Workflow Builder",
        "Trigger-based Automation",
        "Integration Hub",
        "Approval Chains",
        "Audit Trail",
      ],
    },
    {
      id: "product-khabri",
      name: "Khabri",
      slug: "khabri",
      description:
        "Internal communications and announcement system for organization-wide updates.",
      status: "internal",
      subscriptionCount: 1,
      activeOrgCount: 1,
      mrr: 0,
      features: [
        "Announcements",
        "Feedback Channels",
        "Pulse Surveys",
        "Newsletter Builder",
        "Read Tracking",
      ],
    },
  ];

  return NextResponse.json(products);
});
