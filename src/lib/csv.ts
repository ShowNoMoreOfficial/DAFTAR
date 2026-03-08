/**
 * Simple CSV generation utility.
 */

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string; format?: (val: unknown) => string }[]
): string {
  const header = columns.map((c) => escapeCSV(c.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        const formatted = col.format ? col.format(val) : String(val ?? "");
        return escapeCSV(formatted);
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
