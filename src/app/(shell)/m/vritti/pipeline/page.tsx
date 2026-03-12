"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Filter,
  X,
  User,
  FileText,
  ChevronRight,
  Loader2,
  Kanban,
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
  excerpt: string | null;
  status: string;
  categoryId: string | null;
  category?: Category | null;
  authorId: string | null;
  author?: { id: string; name: string } | null;
  wordCount: number | null;
  scheduledAt: string | null;
  updatedAt: string;
}

const STATUS_COLUMNS = [
  { key: "IDEA", label: "Idea", color: "gray" },
  { key: "DRAFTING", label: "Drafting", color: "blue" },
  { key: "EDITING", label: "Editing", color: "amber" },
  { key: "REVIEW", label: "Review", color: "purple" },
  { key: "APPROVED", label: "Approved", color: "green" },
  { key: "PUBLISHED", label: "Published", color: "emerald" },
] as const;

const statusBadgeClasses: Record<string, string> = {
  IDEA: "bg-[var(--bg-elevated)] text-gray-700",
  DRAFTING: "bg-[rgba(59,130,246,0.1)] text-blue-700",
  EDITING: "bg-[rgba(245,158,11,0.1)] text-amber-700",
  REVIEW: "bg-[rgba(168,85,247,0.1)] text-purple-700",
  APPROVED: "bg-[rgba(34,197,94,0.1)] text-green-700",
  PUBLISHED: "bg-[rgba(16,185,129,0.1)] text-emerald-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PipelinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ view: "pipeline" });
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterAuthor) params.set("author", filterAuthor);
      const res = await fetch(`/api/vritti/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Pipeline view returns { data: [{ status, articles, count }] }
        if (Array.isArray(data.data)) {
          const allArticles = data.data.flatMap(
            (group: { articles: Article[] }) => group.articles || []
          );
          setArticles(allArticles);
        } else {
          setArticles(Array.isArray(data.articles) ? data.articles : Array.isArray(data) ? data : []);
        }
      }
    } catch {
      // network error — keep empty state
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterAuthor]);

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

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/vritti/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          categoryId: newCategoryId || undefined,
          authorName: newAuthorName || undefined,
          status: "IDEA",
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewCategoryId("");
        setNewAuthorName("");
        setShowCreateForm(false);
        fetchArticles();
      }
    } catch {
      // silent
    }
  }

  const groupedByStatus = STATUS_COLUMNS.map((col) => ({
    ...col,
    articles: articles.filter((a) => a.status === col.key),
  }));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
        <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Editorial Pipeline</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {articles.length} article{articles.length !== 1 ? "s" : ""} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
          <Button
            size="sm"
            className="bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Article
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[#2E86AB]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Filter by author..."
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="h-8 w-48"
          />
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setFilterCategory("");
              setFilterAuthor("");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
          <div className="mx-auto max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Create New Article</h3>
            <div className="space-y-3">
              <Input
                placeholder="Article title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="h-8 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[#2E86AB]"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Assign author"
                value={newAuthorName}
                onChange={(e) => setNewAuthorName(e.target.value)}
              />
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
                  onClick={handleCreate}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {articles.length === 0 && !loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20">
          <Kanban className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">No articles yet</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create your first article to get started
          </p>
          <Button
            size="sm"
            className="mt-4 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Article
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          {groupedByStatus.map((column) => (
            <div
              key={column.key}
              className="flex w-64 min-w-[256px] flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      statusBadgeClasses[column.key]
                    )}
                  >
                    {column.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {column.articles.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {column.articles.map((article) => {
                  const isExpanded = expandedArticleId === article.id;
                  const catColor = article.category?.color || "#6B7280";
                  return (
                    <div
                      key={article.id}
                      className="cursor-pointer rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition-shadow hover:shadow-sm"
                      onClick={() =>
                        setExpandedArticleId(isExpanded ? null : article.id)
                      }
                    >
                      {/* Category Badge */}
                      {article.category && (
                        <span
                          className="mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: catColor + "18",
                            color: catColor,
                          }}
                        >
                          {article.category.name}
                        </span>
                      )}

                      {/* Title */}
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                        {article.title}
                      </p>

                      {/* Meta */}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        {article.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {article.author.name}
                          </span>
                        )}
                        {article.wordCount != null && article.wordCount > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {article.wordCount.toLocaleString()}w
                          </span>
                        )}
                      </div>

                      {/* Due indicator */}
                      {article.scheduledAt && (
                        <div className="mt-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              new Date(article.scheduledAt) < new Date()
                                ? "bg-[rgba(239,68,68,0.1)] text-red-700"
                                : "bg-[rgba(59,130,246,0.1)] text-blue-700"
                            )}
                          >
                            {new Date(article.scheduledAt) < new Date()
                              ? "Overdue"
                              : "Due"}{" "}
                            {formatDate(article.scheduledAt)}
                          </span>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
                          {article.excerpt && (
                            <p className="mb-2 text-xs text-[var(--text-secondary)]">
                              {article.excerpt}
                            </p>
                          )}
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Updated {formatDate(article.updatedAt)}
                          </p>
                          <a
                            href={`/m/vritti/articles/${article.id}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open article
                            <ChevronRight className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
