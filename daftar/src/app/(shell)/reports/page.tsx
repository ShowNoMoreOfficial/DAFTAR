"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckSquare, Users, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  type: string;
  generatedData: Record<string, unknown> | null;
  createdBy: { id: string; name: string };
  department: { id: string; name: string } | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  DEPARTMENT_PERFORMANCE: <BarChart3 className="h-5 w-5 text-[#2E86AB]" />,
  TEAM_WORKLOAD: <Users className="h-5 w-5 text-[#A23B72]" />,
  TASK_COMPLETION: <CheckSquare className="h-5 w-5 text-emerald-500" />,
  HIRING_PIPELINE: <Users className="h-5 w-5 text-purple-500" />,
  CUSTOM: <FileText className="h-5 w-5 text-[#6B7280]" />,
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hoccr/reports")
      .then((r) => r.json())
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Reports</h1>
          <p className="text-sm text-[#9CA3AF]">View generated organizational reports</p>
        </div>
        <Button size="sm" onClick={() => window.location.href = "/hoccr/reports"}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Generate Report
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">No Reports Yet</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Generate reports from the HOCCR module to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4 transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-start gap-3">
                {TYPE_ICONS[report.type]}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[#1A1A1A]">{report.title}</h3>
                  {report.department && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">{report.department.name}</Badge>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[10px] text-[#9CA3AF]">
                By {report.createdBy.name} · {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
