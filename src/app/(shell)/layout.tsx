import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ShellLayout } from "@/components/shell/shell-layout";
import { GIContextProvider } from "@/components/gi/gi-context";

export const metadata: Metadata = {
  title: {
    template: "%s | Daftar",
    default: "Daftar — ShowNoMore OS",
  },
  description: "AI-powered organizational operating system for ShowNoMore",
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <GIContextProvider userId={session.user.id} userRole={session.user.role}>
      <ShellLayout
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      >
        {children}
      </ShellLayout>
    </GIContextProvider>
  );
}
