"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ModuleEmbedProps {
  moduleName: string;
  baseUrl: string;
}

export function ModuleEmbed({ moduleName, baseUrl }: ModuleEmbedProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading {moduleName}...</span>
          </div>
        </div>
      )}
      <iframe
        src={baseUrl}
        className="h-full w-full border-0 rounded-lg"
        onLoad={() => setLoading(false)}
        title={moduleName}
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
