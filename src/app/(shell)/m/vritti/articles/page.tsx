"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  X,
  Archive,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  categoryId: string | null;
  category?: Category | null;
  authorId: string | null;
  author?: { id: string; name: string } | null;
  wordCount: number | null;
  updatedAt: string;
}

const statusBadgeClasses: Record<string, string> = {
  IDEA: "bg-gray-50 text-gray-700",
  DRAFTING: "bg-blue-50 text-blue-700",
  EDITING: "bg-amber-50 text-amber-700",
  REVIEW: "bg-purple-50 text-purple-700",
  APPROVED: "bg-green-50 text-green-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const ALL_STATUSES = ["IDEA", "DRAFTING", "EDITING", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("categoryId", filterCategory);
      params.set("sort", sortOrder);
      const res = await fetch(`/api/vritti/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory, sortOrder]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/vritti/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [fetchArticles, fetchCategories]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  }

  async function handleArchiveSelected() {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/vritti/articles/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: "ARCHIVED",
        }),
      });
      setSelectedIds(new Set());
      fetchArticles();
    } catch {
      // silent
    }
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
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Articles</h1>
          <p className="text-sm text-[#6B7280]">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveSelected}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-6 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortOrder === "desc" ? "Newest" : "Oldest"}
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-6 py-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#2E86AB]"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#2E86AB]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setFilterStatus("");
              setFilterCategory("");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {articles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <FileText className="h-10 w-10 text-[#9CA3AF]" />
          <p className="mt-3 text-sm font-medium text-[#1A1A1A]">No articles found</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {search || filterStatus || filterCategory
              ? "Try adjusting your filters"
              : "Create your first article from the Pipeline tab"}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA]">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === articles.length && articles.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-[#E5E7EB]"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6B7280]">
                  Title
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6B7280]">
                  Status
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6B7280]">
                  Category
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6B7280]">
                  Author
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6B7280]">
                  Words
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6B7280]">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-[#E5E7EB] transition-colors hover:bg-[#F8F9FA]"
                >
                  <td className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="h-3.5 w-3.5 rounded border-[#E5E7EB]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`/m/vritti/articles/${article.id}`}
                      className="text-sm font-medium text-[#1A1A1A] hover:text-[#2E86AB] hover:underline"
                    >
                      {article.title}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadgeClasses[article.status] || "bg-gray-50 text-gray-700"
                      )}
                    >
                      {article.status.charAt(0) + article.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {article.category ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: article.category.color || "#6B7280" }}
                        />
                        {article.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#6B7280]">
                    {article.author?.name || <span className="text-[#9CA3AF]">--</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-[#6B7280]">
                    {article.wordCount != null
                      ? article.wordCount.toLocaleString()
                      : "--"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-[#9CA3AF]">
                    {formatDate(article.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
