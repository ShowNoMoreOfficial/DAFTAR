"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VrittiPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/m/vritti/pipeline");
  }, [router]);

  return null;
}
