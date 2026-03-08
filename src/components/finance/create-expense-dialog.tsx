"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface SelectOption {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: "SALARY", label: "Salary" },
  { value: "SOFTWARE", label: "Software" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "TRAVEL", label: "Travel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PRODUCTION", label: "Production" },
  { value: "OFFICE", label: "Office" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
];

export function CreateExpenseDialog({ open, onOpenChange, onCreated }: CreateExpenseDialogProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("MISCELLANEOUS");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(Array.isArray(d) ? d : []));
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("MISCELLANEOUS");
    setDepartmentId("");
    setDescription("");
    setReceiptUrl("");
    setDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !category) return;

    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          departmentId: departmentId || null,
          description: description.trim() || null,
          receiptUrl: receiptUrl.trim() || null,
          date: date || null,
        }),
      });
      if (res.ok) {
        resetForm();
        onOpenChange(false);
        onCreated?.();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Add Expense</h2>
          <button onClick={() => onOpenChange(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Expense title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Amount (INR) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Receipt URL</label>
            <Input
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expense details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !amount}>
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
