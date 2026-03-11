"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import BrandForm from "@/components/yantri/BrandForm";

interface BrandData {
  id: string;
  name: string;
  tagline: string | null;
  language: string | null;
  tone: string | null;
  editorialCovers: string | null;
  editorialNever: string | null;
  audienceDescription: string | null;
  activePlatforms: string | null;
  voiceRules: string[] | string | null;
  editorialPriorities: string | null;
}

export default function EditBrandPage() {
  const params = useParams();
  const id = params.id as string;
  const [brand, setBrand] = useState<BrandData | null>(null);

  useEffect(() => {
    fetch(`/api/brands/${id}`)
      .then((r) => r.json())
      .then(setBrand);
  }, [id]);

  if (!brand) return <div className="text-muted-foreground">Loading brand...</div>;

  const initial = {
    id: brand.id,
    name: brand.name,
    tagline: brand.tagline || "",
    language: brand.language || "English",
    tone: brand.tone || "neutral",
    editorialCovers: JSON.parse(brand.editorialCovers ?? "[]"),
    editorialNever: JSON.parse(brand.editorialNever ?? "[]"),
    audienceDescription: brand.audienceDescription || "",
    activePlatforms: JSON.parse(brand.activePlatforms ?? "[]"),
    voiceRules: Array.isArray(brand.voiceRules) ? brand.voiceRules : [],
    editorialPriorities: JSON.parse(brand.editorialPriorities ?? "[]"),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Edit Brand: {brand.name}</h1>
      <BrandForm initial={initial} />
    </div>
  );
}
