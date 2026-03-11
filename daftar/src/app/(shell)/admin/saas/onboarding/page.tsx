"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "profile" | "departments" | "invite" | "complete";

const STEPS: { key: Step; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "departments", label: "Departments" },
  { key: "invite", label: "Invite" },
  { key: "complete", label: "Complete" },
];

const PLANS = [
  { value: "STARTER", label: "Starter", price: "$49/mo", users: "Up to 10 users", color: "border-gray-300" },
  { value: "PROFESSIONAL", label: "Professional", price: "$149/mo", users: "Up to 50 users", color: "border-[#2E86AB]" },
  { value: "ENTERPRISE", label: "Enterprise", price: "Custom", users: "Unlimited users", color: "border-[#A23B72]" },
];

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("profile");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Profile state
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [plan, setPlan] = useState("PROFESSIONAL");

  // Departments state
  const [departments, setDepartments] = useState<string[]>(["Engineering", "Design", "Marketing"]);
  const [newDept, setNewDept] = useState("");

  // Invite state
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  function handleNameChange(value: string) {
    setOrgName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  function addDepartment() {
    const trimmed = newDept.trim();
    if (trimmed && !departments.includes(trimmed)) {
      setDepartments([...departments, trimmed]);
      setNewDept("");
    }
  }

  function removeDepartment(index: number) {
    setDepartments(departments.filter((_, i) => i !== index));
  }

  function addInvite() {
    const trimmed = inviteEmail.trim();
    if (trimmed && !invites.some((inv) => inv.email === trimmed)) {
      setInvites([...invites, { email: trimmed, role: inviteRole }]);
      setInviteEmail("");
      setInviteRole("MEMBER");
    }
  }

  function removeInvite(index: number) {
    setInvites(invites.filter((_, i) => i !== index));
  }

  function goNext() {
    if (currentStep === "profile") {
      if (!orgName.trim()) { setError("Organization name is required"); return; }
      if (!slug.trim()) { setError("Slug is required"); return; }
      setError("");
      setCurrentStep("departments");
    } else if (currentStep === "departments") {
      setCurrentStep("invite");
    } else if (currentStep === "invite") {
      handleSubmit();
    }
  }

  function goBack() {
    if (currentStep === "departments") setCurrentStep("profile");
    else if (currentStep === "invite") setCurrentStep("departments");
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/saas/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slug,
          domain: domain || null,
          plan,
          departments,
          invites,
        }),
      });
      if (res.ok) {
        setCurrentStep("complete");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create organization");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Onboard Organization</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Set up a new tenant with profile, departments, and team invites.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i < stepIndex
                ? "bg-[#2E86AB] text-white"
                : i === stepIndex
                  ? "bg-[#2E86AB] text-white ring-4 ring-[#2E86AB]/20"
                  : "bg-[#E5E7EB] text-[#6B7280]"
            }`}>
              {i < stepIndex ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs font-medium ${i <= stepIndex ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < stepIndex ? "bg-[#2E86AB]" : "bg-[#E5E7EB]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        {/* PROFILE STEP */}
        {currentStep === "profile" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Organization Profile</h2>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A]">Organization Name *</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corp"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A]">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] font-mono focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
              />
              <p className="mt-1 text-xs text-[#9CA3AF]">URL-safe identifier, auto-generated from name</p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A]">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.com"
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
              />
              <p className="mt-1 text-xs text-[#9CA3AF]">Optional. Used for SSO and email verification.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">Plan *</label>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlan(p.value)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      plan === p.value
                        ? `${p.color} bg-[#F8F9FA] shadow-sm`
                        : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#1A1A1A]">{p.label}</p>
                    <p className="mt-1 text-lg font-bold text-[#1A1A1A]">{p.price}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{p.users}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENTS STEP */}
        {currentStep === "departments" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Department Setup</h2>
            <p className="text-xs text-[#6B7280]">Add the departments for this organization. You can always add more later.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDepartment())}
                placeholder="Department name"
                className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
              />
              <button
                type="button"
                onClick={addDepartment}
                className="rounded-lg bg-[#2E86AB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {departments.map((dept, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2.5">
                  <span className="text-sm text-[#1A1A1A]">{dept}</span>
                  <button
                    type="button"
                    onClick={() => removeDepartment(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {departments.length === 0 && (
                <p className="py-6 text-center text-sm text-[#9CA3AF]">
                  No departments added yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* INVITE STEP */}
        {currentStep === "invite" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Invite Team Members</h2>
            <p className="text-xs text-[#6B7280]">Add team members by email. They will receive invitations after organization is created.</p>

            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                placeholder="user@company.com"
                className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
              >
                <option value="ADMIN">Admin</option>
                <option value="HEAD_HR">Head HR</option>
                <option value="DEPT_HEAD">Dept Head</option>
                <option value="MEMBER">Member</option>
              </select>
              <button
                type="button"
                onClick={addInvite}
                className="rounded-lg bg-[#2E86AB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {invites.map((inv, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#1A1A1A]">{inv.email}</span>
                    <span className="inline-flex rounded-full bg-[#2E86AB]/10 px-2 py-0.5 text-[10px] font-medium text-[#2E86AB]">
                      {inv.role.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInvite(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {invites.length === 0 && (
                <p className="py-6 text-center text-sm text-[#9CA3AF]">
                  No invites added yet. You can skip this step and invite later.
                </p>
              )}
            </div>
          </div>
        )}

        {/* COMPLETE STEP */}
        {currentStep === "complete" && (
          <div className="space-y-5 text-center py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Organization Created</h2>
            <p className="text-sm text-[#6B7280]">
              <strong>{orgName}</strong> has been set up with the <strong>{plan}</strong> plan,{" "}
              {departments.length} department{departments.length !== 1 ? "s" : ""}, and{" "}
              {invites.length} pending invite{invites.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => router.push("/admin/saas")}
                className="rounded-lg bg-[#2E86AB] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90"
              >
                Go to SaaS Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentStep("profile");
                  setOrgName("");
                  setSlug("");
                  setDomain("");
                  setPlan("PROFESSIONAL");
                  setDepartments(["Engineering", "Design", "Marketing"]);
                  setInvites([]);
                }}
                className="rounded-lg border border-[#E5E7EB] px-6 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FA]"
              >
                Onboard Another
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {/* Navigation */}
        {currentStep !== "complete" && (
          <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F9FA]"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="rounded-lg bg-[#2E86AB] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90 disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : currentStep === "invite"
                  ? "Create Organization"
                  : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
