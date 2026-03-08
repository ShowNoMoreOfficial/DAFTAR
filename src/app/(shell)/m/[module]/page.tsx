import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule } from "@/lib/permissions";
import { ModuleEmbed } from "@/components/shell/module-embed";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { module: moduleName } = await params;

  const mod = await prisma.module.findUnique({
    where: { name: moduleName },
  });

  if (!mod || !mod.isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Module Not Available</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          The module &quot;{moduleName}&quot; is not active or does not exist.
        </p>
      </div>
    );
  }

  if (!canAccessModule(session.user.role, session.user.permissions, moduleName)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Access Denied</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          You don&apos;t have permission to access {mod.displayName}.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ModuleEmbed
        moduleName={mod.displayName}
        baseUrl={mod.baseUrl}
      />
    </div>
  );
}
