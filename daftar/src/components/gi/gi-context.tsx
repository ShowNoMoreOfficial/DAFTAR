"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Role } from "@prisma/client";
import type { GIContext } from "@/types";

const GICtx = createContext<{
  context: GIContext;
  updateContext: (partial: Partial<GIContext>) => void;
} | null>(null);

export function GIContextProvider({
  userId,
  userRole,
  children,
}: {
  userId: string;
  userRole: Role;
  children: React.ReactNode;
}) {
  const [context, setContext] = useState<GIContext>({
    currentModule: "daftar",
    currentView: "dashboard",
    currentEntityId: null,
    currentEntityType: null,
    userRole,
    userId,
    timestamp: new Date(),
  });

  const updateContext = useCallback((partial: Partial<GIContext>) => {
    setContext((prev) => ({ ...prev, ...partial, timestamp: new Date() }));
  }, []);

  return (
    <GICtx.Provider value={{ context, updateContext }}>
      {children}
    </GICtx.Provider>
  );
}

export function useGIContext() {
  const ctx = useContext(GICtx);
  if (!ctx) throw new Error("useGIContext must be used within GIContextProvider");
  return ctx;
}
