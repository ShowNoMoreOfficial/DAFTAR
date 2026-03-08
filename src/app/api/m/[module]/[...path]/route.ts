import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound } from "@/lib/api-utils";
import { canAccessModule } from "@/lib/permissions";

async function proxyRequest(
  req: Request,
  method: string,
  params: Promise<{ module: string; path: string[] }>
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { module: moduleName, path } = await params;

  // Look up module in registry
  const mod = await prisma.module.findUnique({
    where: { name: moduleName },
  });

  if (!mod || !mod.isActive) return notFound("Module not found");

  // Check permissions
  if (!canAccessModule(session.user.role, session.user.permissions, moduleName)) {
    return forbidden();
  }

  // Build target URL
  const targetPath = path.join("/");
  const targetUrl = `${mod.baseUrl}/api/${targetPath}`;
  const url = new URL(targetUrl);

  // Forward query params
  const reqUrl = new URL(req.url);
  reqUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Proxy the request with Daftar headers injected
  const headers = new Headers(req.headers);
  headers.set("X-Daftar-User", session.user.id);
  headers.set("X-Daftar-Role", session.user.role);
  headers.set("X-Daftar-Email", session.user.email);
  headers.set("X-Daftar-Brands", JSON.stringify(session.user.accessibleBrandIds));

  try {
    const proxyRes = await fetch(url.toString(), {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? await req.text() : undefined,
    });

    const data = await proxyRes.text();
    return new NextResponse(data, {
      status: proxyRes.status,
      headers: { "Content-Type": proxyRes.headers.get("Content-Type") || "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Module unavailable", module: moduleName },
      { status: 502 }
    );
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ module: string; path: string[] }> }) {
  return proxyRequest(req, "GET", ctx.params);
}

export async function POST(req: Request, ctx: { params: Promise<{ module: string; path: string[] }> }) {
  return proxyRequest(req, "POST", ctx.params);
}

export async function PUT(req: Request, ctx: { params: Promise<{ module: string; path: string[] }> }) {
  return proxyRequest(req, "PUT", ctx.params);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ module: string; path: string[] }> }) {
  return proxyRequest(req, "PATCH", ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ module: string; path: string[] }> }) {
  return proxyRequest(req, "DELETE", ctx.params);
}
