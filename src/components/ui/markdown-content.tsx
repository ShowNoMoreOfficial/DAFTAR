"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown text as formatted HTML.
 * Used for GI assistant messages, content previews, and deliverable copy.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 text-sm text-[var(--text-primary)]">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-[var(--text-secondary)]">{children}</li>
        ),
        h1: ({ children }) => (
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1">{children}</h3>
        ),
        h2: ({ children }) => (
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1">{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 className="text-sm font-medium text-[var(--text-primary)] mt-2 mb-1">{children}</h4>
        ),
        code: ({ children }) => (
          <code className="text-xs px-1 py-0.5 rounded bg-[var(--bg-deep)] text-[var(--accent-primary)]">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--accent-primary)] pl-3 my-2 text-sm text-[var(--text-secondary)] italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
