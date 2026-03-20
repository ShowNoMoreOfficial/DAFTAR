import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import crypto from "crypto";

const BASE_URL = (
  process.env.NEXTAUTH_URL || "https://daftar-one.vercel.app"
).replace(/\/$/, "");

/**
 * POST /api/auth/magic-link
 *
 * Admin-only. Generates a one-time magic login link for any registered user.
 * The link can be shared via WhatsApp, text, etc. — no SMTP required.
 *
 * Body: { email: string, expiresInHours?: number }
 * Returns: { url: string, expiresAt: string }
 */
export const POST = apiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No user found with this email" },
        { status: 404 }
      );
    }

    const expiresInHours = Math.min(body.expiresInHours || 72, 168); // max 7 days
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Clean up any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new token
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const url = `${BASE_URL}/login?token=${token}&email=${encodeURIComponent(email)}`;

    return NextResponse.json({
      url,
      expiresAt: expires.toISOString(),
      user: { name: user.name, email: user.email, role: user.role },
    });
  },
  { requireAdmin: true }
);
