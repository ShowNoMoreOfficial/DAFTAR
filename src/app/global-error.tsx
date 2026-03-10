"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#F8F9FA",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 24,
              }}
            >
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginBottom: 16,
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "10px 24px",
                backgroundColor: "#2E86AB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
