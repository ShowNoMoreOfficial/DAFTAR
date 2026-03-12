"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const verify = searchParams.get("verify");

  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(!!verify);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");

    try {
      const result = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        setEmailSent(true);
      } else {
        setEmailError(
          result?.error === "AccessDenied"
            ? "This email is not registered. Contact your admin."
            : result?.error || "Failed to send login email"
        );
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-abyss)]">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-lg)]">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Daftar
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Sign in to your organization
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[rgba(239,68,68,0.1)] p-3 text-center text-sm text-red-600">
            {error === "AccessDenied"
              ? "Access denied. Your email is not registered. Contact your admin."
              : "An error occurred. Please try again."}
          </div>
        )}

        {/* Email Magic Link */}
        {!emailSent ? (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shownomore.com"
                required
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-400">{emailError}</p>
            )}
            <Button
              type="submit"
              disabled={emailLoading || !email}
              className="w-full py-5 text-sm font-medium"
            >
              {emailLoading ? "Sending..." : "Sign in with Email"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg bg-[var(--bg-deep)] p-6 text-center">
            <div className="mb-3 text-3xl">&#9993;</div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Check your email
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              We sent a sign-in link to{" "}
              {email ? <strong>{email}</strong> : "your email"}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Click the link in the email to log in. It expires in 24 hours.
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="mt-4 text-sm text-[var(--accent-primary)] hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-default)]" />
          <span className="text-xs uppercase text-[var(--text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-3 py-5 text-sm"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center gap-3 py-5 text-sm"
            onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </Button>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Access is invitation-only. Contact your admin if you need access.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-abyss)]">
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
