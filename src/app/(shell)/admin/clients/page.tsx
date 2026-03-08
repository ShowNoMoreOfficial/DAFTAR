"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Building,
  Globe,
  Palette,
  ChevronDown,
  ChevronRight,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  slug: string;
  platforms?: { platform: string; isActive: boolean }[];
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  brands: Brand[];
  createdAt: string;
}

const PLATFORMS = [
  "youtube",
  "x",
  "instagram",
  "linkedin",
  "facebook",
  "blog",
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Client form
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    company: "",
  });

  // Brand form
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    platforms: [] as string[],
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) setClients(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clientForm.name,
        email: clientForm.email || null,
        company: clientForm.company || null,
      }),
    });
    if (res.ok) {
      setClientDialogOpen(false);
      setClientForm({ name: "", email: "", company: "" });
      fetchClients();
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: brandForm.name,
        slug: brandForm.slug,
        clientId: selectedClientId,
      }),
    });

    if (res.ok) {
      const brand = await res.json();
      // Add platforms
      for (const platform of brandForm.platforms) {
        await fetch(`/api/brands/${brand.id}/platforms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform }),
        });
      }
      setBrandDialogOpen(false);
      setBrandForm({ name: "", slug: "", platforms: [] });
      setSelectedClientId(null);
      fetchClients();
    }
  };

  const togglePlatform = (p: string) => {
    setBrandForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const openAddBrand = (clientId: string) => {
    setSelectedClientId(clientId);
    setBrandForm({ name: "", slug: "", platforms: [] });
    setBrandDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">
            Clients & Brands
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage clients, their brands, and platform configurations.
          </p>
        </div>

        <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                  Client Name *
                </label>
                <Input
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                  placeholder="e.g. Bhupendra Chaubey"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                  Email
                </label>
                <Input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  placeholder="client@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                  Company
                </label>
                <Input
                  value={clientForm.company}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#2E86AB] hover:bg-[#2E86AB]/90"
              >
                Create Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brand create dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Brand Name *
              </label>
              <Input
                value={brandForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setBrandForm({
                    ...brandForm,
                    name,
                    slug: name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  });
                }}
                placeholder="e.g. Breaking Tube"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Slug
              </label>
              <Input
                value={brandForm.slug}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, slug: e.target.value })
                }
                placeholder="breaking-tube"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      brandForm.platforms.includes(p)
                        ? "border-[#2E86AB] bg-[#2E86AB]/10 text-[#2E86AB]"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#2E86AB]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#2E86AB] hover:bg-[#2E86AB]/90"
            >
              Add Brand
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clients list */}
      {loading ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">
          Loading clients...
        </p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <Building className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">
            No Clients Yet
          </h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Add your first client to start managing brands.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-[#E5E7EB] bg-white"
            >
              {/* Client header */}
              <div
                className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-[#F8F9FA]"
                onClick={() =>
                  setExpandedClient(
                    expandedClient === client.id ? null : client.id
                  )
                }
              >
                {expandedClient === client.id ? (
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#A23B72]/10">
                  <Building className="h-4.5 w-4.5 text-[#A23B72]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A1A1A]">
                      {client.name}
                    </span>
                    {client.company && (
                      <span className="text-xs text-[#9CA3AF]">
                        {client.company}
                      </span>
                    )}
                  </div>
                  {client.email && (
                    <p className="text-xs text-[#6B7280]">{client.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    <Palette className="mr-1 h-3 w-3" />
                    {client.brands.length} brand
                    {client.brands.length !== 1 ? "s" : ""}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddBrand(client.id);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Brand
                  </Button>
                </div>
              </div>

              {/* Expanded: Brands */}
              {expandedClient === client.id && (
                <div className="border-t border-[#E5E7EB] p-4">
                  {client.brands.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#9CA3AF]">
                      No brands yet. Add a brand to get started.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {client.brands.map((brand) => (
                        <div
                          key={brand.id}
                          className="rounded-lg border border-[#F0F2F5] bg-[#F8F9FA] p-3"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Palette className="h-4 w-4 text-[#2E86AB]" />
                            <span className="text-sm font-medium text-[#1A1A1A]">
                              {brand.name}
                            </span>
                          </div>
                          <div className="mb-2 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-[#9CA3AF]" />
                            <span className="text-[10px] text-[#9CA3AF]">
                              {brand.slug}
                            </span>
                          </div>
                          {brand.platforms && brand.platforms.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {brand.platforms.map((p) => (
                                <Badge
                                  key={p.platform}
                                  variant={
                                    p.isActive ? "default" : "secondary"
                                  }
                                  className="text-[9px]"
                                >
                                  <Globe className="mr-0.5 h-2.5 w-2.5" />
                                  {p.platform}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
