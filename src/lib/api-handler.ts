import { getAuthSession, handleApiError } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

interface HandlerOptions {
  requireAuth?: boolean;      // default: true
  requireAdmin?: boolean;     // default: false
  requireCronSecret?: boolean; // default: false
  allowedRoles?: string[];    // if set, only these roles can access
}

type HandlerContext = {
  session: any;
  params: Record<string, string>;
};

type Handler = (
  req: NextRequest,
  ctx: HandlerContext,
) => Promise<Response>;

/**
 * Wraps a Next.js API route handler with:
 * - Auth guard (session check, role check)
 * - Cron secret validation
 * - Automatic try/catch with safe error formatting
 *
 * Usage:
 *   export const GET = apiHandler(async (req, { session, params }) => {
 *     // ... your logic
 *   });
 */
export function apiHandler(handler: Handler, options: HandlerOptions = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    requireCronSecret = false,
    allowedRoles,
  } = options;

  return async (
    req: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> },
  ) => {
    try {
      // Resolve dynamic route params (Next.js 16 passes them as a Promise)
      const params = routeContext?.params ? await routeContext.params : {};

      // Cron secret check — no session needed
      if (requireCronSecret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return handler(req, { session: null, params });
      }

      // Auth check
      let session: any = null;
      if (requireAuth || requireAdmin || allowedRoles) {
        session = await getAuthSession();
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (requireAdmin && session.user.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        }
        if (allowedRoles && !allowedRoles.includes(session.user.role)) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 },
          );
        }
      }

      return handler(req, { session, params });
    } catch (err) {
      console.error(`[API ${req.method} ${req.nextUrl.pathname}]`, err);
      return handleApiError(err);
    }
  };
}
