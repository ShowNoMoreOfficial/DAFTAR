import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common"}/v2.0`,
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
