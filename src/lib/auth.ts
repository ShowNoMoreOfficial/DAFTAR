import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";
import type { createTransport } from "nodemailer";

// Minimal adapter — only handles verification tokens for magic link login.
// We don't use the full PrismaAdapter because our User model lacks
// fields it expects (emailVerified, image). User/session management
// is handled by our custom JWT callbacks instead.
const verificationTokenAdapter: Adapter = {
  async createVerificationToken(data) {
    const token = await prisma.verificationToken.create({ data });
    return token;
  },
  async useVerificationToken({ identifier, token }) {
    try {
      const result = await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return result;
    } catch {
      return null;
    }
  },
  // Stub methods required by the Adapter interface — NextAuth calls these
  // but we handle user/account/session logic in our JWT callbacks instead.
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, emailVerified: null, image: user.avatar };
  },
  async getUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, emailVerified: null, image: user.avatar };
  },
  async createUser(data) {
    // Should never be called — invitation-only system blocks unknown emails in signIn callback
    return { id: "", email: data.email ?? "", name: data.name ?? "", emailVerified: null, image: null };
  },
  async updateUser(data) {
    return { id: data.id ?? "", email: data.email ?? "", name: data.name ?? "", emailVerified: null, image: null };
  },
  async getUserByAccount() { return null; },
  async linkAccount() { return undefined; },
  async createSession() { return { sessionToken: "", userId: "", expires: new Date() }; },
  async getSessionAndUser() { return null; },
  async updateSession() { return null; },
  async deleteSession() {},
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: verificationTokenAdapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=1",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common"}/v2.0`,
      allowDangerousEmailAccountLinking: true,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "Daftar <noreply@shownomore.com>",
      async sendVerificationRequest({ identifier: email, url }) {
        const nodemailer = await import("nodemailer");
        const port = Number(process.env.EMAIL_SERVER_PORT || 587);
        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port,
          secure: port === 465,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        } as Parameters<typeof createTransport>[0]);

        await transport.sendMail({
          to: email,
          from: process.env.EMAIL_FROM || "Daftar <noreply@shownomore.com>",
          subject: "Sign in to Daftar",
          text: `Sign in to Daftar\n\nClick this link to sign in:\n${url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.`,
          html: `
            <div style="background-color: #060B18; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="max-width: 460px; margin: 0 auto; background-color: #0F1D32; border-radius: 16px; padding: 40px; border: 1px solid #1A2D4D;">
                <h1 style="color: #00D4AA; font-size: 24px; margin: 0 0 8px 0; text-align: center;">DAFTAR</h1>
                <p style="color: #8B9BB5; font-size: 14px; text-align: center; margin: 0 0 32px 0;">Sign in to your workspace</p>
                <a href="${url}" style="display: block; background-color: #00D4AA; color: #060B18; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 16px; text-align: center; margin-bottom: 24px;">
                  Sign in to Daftar
                </a>
                <p style="color: #4A5E80; font-size: 12px; text-align: center; margin: 0;">
                  This link expires in 24 hours.<br/>
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Invitation-only: check if email exists in User table
      if (!user.email) return false;
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!existingUser) return false;

      // Activate user on first login
      if (!existingUser.isActive) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            isActive: true,
            name: user.name || existingUser.name,
            avatar: user.image || existingUser.avatar,
          },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in or when session is updated, load user data from DB
      if (user?.email || trigger === "update") {
        const email = user?.email || (token.email as string);
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: {
              brandAccess: { select: { brandId: true } },
              permissionOverrides: {
                where: { granted: true },
                select: { permission: true },
              },
            },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.avatar;
            token.role = dbUser.role;
            token.primaryDepartmentId = dbUser.primaryDeptId;
            token.accessibleBrandIds = dbUser.brandAccess.map((b) => b.brandId);
            token.permissions = dbUser.permissionOverrides.map(
              (p) => p.permission
            );
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        session.user.primaryDepartmentId =
          (token.primaryDepartmentId as string) || null;
        session.user.accessibleBrandIds =
          (token.accessibleBrandIds as string[]) || [];
        session.user.permissions = (token.permissions as string[]) || [];
      }
      return session;
    },
  },
});
