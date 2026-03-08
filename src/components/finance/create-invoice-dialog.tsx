"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Trash2 } from "lucide-react";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface SelectOption {
  id: string;
  name: string;
  company?: string;
}

interface LineItem {
  description: string;
  amount: number;
}

export function CreateInvoiceDialog({ open, onOpenChange, onCreated }: CreateInvoiceDialogProps) {
  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : []));
      fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(Array.isArray(d) ? d : []));
    }
  }, [open]);

  // Auto-calculate amount from line items if items exist
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const effectiveAmount = lineItems.length > 0 ? lineItemsTotal : parseFloat(amount) || 0;
  const taxAmount = parseFloat(tax) || 0;
  const totalAmount = effectiveAmount + taxAmount;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === "amount") {
      updated[index] = { ...updated[index], amount: parseFloat(value as string) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setLineItems(updated);
  };

  const resetForm = () => {
    setNumber("");
    setClientId("");
    setBrandId("");
    setAmount("");
    setTax("");
    setDueDate("");
    setDescription("");
    setLineItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount <= 0 || !dueDate) return;

    setLoading(true);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: number.trim() || undefined,
          clientId: clientId || null,
          brandId: brandId || null,
          amount: effectiveAmount,
          tax: taxAmount,
          totalAmount,
          dueDate,
          description: description.trim() || null,
          items: lineItems.length > 0 ? lineItems : null,
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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Create Invoice</h2>
          <button onClick={() => onOpenChange(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Number */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Invoice Number</label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Brand</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#6B7280]">Line Items</label>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs text-[#2E86AB] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount || ""}
                      onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                      placeholder="Amount"
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(i)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount & Tax (manual entry when no line items) */}
          {lineItems.length === 0 && (
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
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">Tax (INR)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {lineItems.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6B7280]">Tax (INR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Due Date *</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#6B7280]">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Invoice description..."
              rows={3}
            />
          </div>

          {/* Total Preview */}
          {effectiveAmount > 0 && (
            <div className="rounded-lg bg-[#F8F9FA] p-3 text-sm">
              {lineItems.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  {lineItems.filter(i => i.description).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#9CA3AF]">
                      <span>{item.description}</span>
                      <span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(effectiveAmount)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>Tax</span>
                  <span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(taxAmount)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-[#E5E7EB] pt-1 font-semibold text-[#1A1A1A]">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || effectiveAmount <= 0 || !dueDate}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
