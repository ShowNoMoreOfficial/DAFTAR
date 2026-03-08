"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  _count?: { articles: number };
  children?: Category[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

const PRESET_COLORS = [
  "#2E86AB",
  "#A23B72",
  "#E74C3C",
  "#E67E22",
  "#F1C40F",
  "#27AE60",
  "#8E44AD",
  "#1ABC9C",
  "#34495E",
  "#D35400",
  "#16A085",
  "#2980B9",
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#2E86AB");
  const [formParentId, setFormParentId] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vritti/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function resetForm() {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormColor("#2E86AB");
    setFormParentId("");
    setSlugManuallyEdited(false);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setFormColor(cat.color || "#2E86AB");
    setFormParentId(cat.parentId || "");
    setSlugManuallyEdited(true);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    const slug = formSlug.trim() || generateSlug(formName);
    const payload = {
      name: formName.trim(),
      slug,
      description: formDescription.trim() || null,
      color: formColor,
      parentId: formParentId || null,
    };

    try {
      if (editingId) {
        await fetch(`/api/vritti/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/vritti/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchCategories();
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/vritti/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch {
      // silent
    }
  }

  function handleNameChange(value: string) {
    setFormName(value);
    if (!slugManuallyEdited) {
      setFormSlug(generateSlug(value));
    }
  }

  const tree = buildTree(categories);

  function renderCategoryRow(cat: Category, depth: number = 0) {
    const articleCount = cat._count?.articles ?? 0;
    const rows: React.ReactNode[] = [];

    rows.push(
      <div
        key={cat.id}
        className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-6 py-3 transition-colors hover:bg-[#F8F9FA]"
      >
        {/* Indentation */}
        {depth > 0 && <div style={{ width: depth * 24 }} className="shrink-0" />}
        {depth > 0 && (
          <ChevronRight className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
        )}

        {/* Color Swatch */}
        <div
          className="h-4 w-4 shrink-0 rounded-full border border-white shadow-sm"
          style={{ backgroundColor: cat.color || "#6B7280" }}
        />

        {/* Name & Description */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#1A1A1A]">{cat.name}</p>
          {cat.description && (
            <p className="mt-0.5 truncate text-xs text-[#6B7280]">
              {cat.description}
            </p>
          )}
        </div>

        {/* Article Count */}
        <span className="shrink-0 text-xs text-[#9CA3AF]">
          {articleCount} article{articleCount !== 1 ? "s" : ""}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => startEdit(cat)}
          >
            <Pencil className="h-3 w-3 text-[#6B7280]" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => handleDelete(cat.id)}
          >
            <Trash2 className="h-3 w-3 text-[#6B7280]" />
          </Button>
        </div>
      </div>
    );

    if (cat.children) {
      for (const child of cat.children) {
        rows.push(...renderCategoryRow(child, depth + 1));
      }
    }

    return rows;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B7280]" />
        <span className="ml-2 text-sm text-[#6B7280]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8F9FA] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Categories</h1>
          <p className="text-sm text-[#6B7280]">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#2E86AB] text-white hover:bg-[#2E86AB]/90"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          New Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
          <div className="mx-auto max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                {editingId ? "Edit Category" : "New Category"}
              </h3>
              <Button variant="ghost" size="icon-xs" onClick={resetForm}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Name
                </label>
                <Input
                  placeholder="Category name"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Slug
                </label>
                <Input
                  placeholder="auto-generated-slug"
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Description
                </label>
                <Input
                  placeholder="Optional description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Parent Category
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#2E86AB]"
                >
                  <option value="">None (top-level)</option>
                  {categories
                    .filter((c) => c.id !== editingId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                        formColor === color
                          ? "border-[#1A1A1A] scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-6 w-8 cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-[#2E86AB] text-white hover:bg-[#2E86AB]/90"
                  onClick={handleSave}
                >
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category List */}
      {categories.length === 0 && !showForm ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <Tag className="h-10 w-10 text-[#9CA3AF]" />
          <p className="mt-3 text-sm font-medium text-[#1A1A1A]">No categories yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Create your first category to organize articles
          </p>
          <Button
            size="sm"
            className="mt-4 bg-[#2E86AB] text-white hover:bg-[#2E86AB]/90"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Category
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tree.map((cat) => renderCategoryRow(cat))}
        </div>
      )}
    </div>
  );
}
