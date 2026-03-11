import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import type { ZodSchema } from "zod";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export function requireRoles(...roles: Role[]) {
  return async () => {
    const session = await getAuthSession();
    if (!session) return null;
    if (!roles.includes(session.user.role)) return null;
    return session;
  };
}

/**
 * Standardized API error handler. Catches Prisma-specific errors and returns
 * appropriate HTTP status codes. Never exposes stack traces.
 */
export function handleApiError(error: unknown): NextResponse {
  // Prisma known errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Record not found" } },
        { status: 404 }
      );
    }
    if (prismaError.code === "P2002") {
      const fields = prismaError.meta?.target?.join(", ") || "field";
      return NextResponse.json(
        { error: { code: "CONFLICT", message: `Duplicate value for ${fields}` } },
        { status: 409 }
      );
    }
    if (prismaError.code === "P2003") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid reference — related record not found" } },
        { status: 400 }
      );
    }
  }

  console.error("[API Error]", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}

/**
 * Safely parse a JSON request body and validate with a Zod schema.
 * Returns either the validated data or a 400 NextResponse.
 */
export async function safeParseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { error: badRequest(`Validation failed: ${issues}`) };
  }
  return { data: result.data };
}
