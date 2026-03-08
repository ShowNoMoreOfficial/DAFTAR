"use client";

import { IndianRupee, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Finance</h1>
        <p className="text-sm text-[#9CA3AF]">Financial overview and management</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceCard icon={<Wallet className="h-5 w-5 text-[#2E86AB]" />} label="Monthly Revenue" value="--" />
        <FinanceCard icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} label="Income" value="--" />
        <FinanceCard icon={<TrendingDown className="h-5 w-5 text-red-500" />} label="Expenses" value="--" />
        <FinanceCard icon={<IndianRupee className="h-5 w-5 text-[#A23B72]" />} label="Net Profit" value="--" />
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
        <IndianRupee className="mx-auto h-12 w-12 text-[#D1D5DB]" />
        <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">Finance Module</h3>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Invoice management, expense tracking, and financial reporting will be available in a future phase.
        </p>
      </div>
    </div>
  );
}

function FinanceCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-semibold text-[#1A1A1A]">{value}</p>
      <p className="mt-1 text-xs text-[#9CA3AF]">{label}</p>
    </div>
  );
}
