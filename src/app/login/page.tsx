"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      redirect: false,
      callbackUrl: "/",
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Enter a valid email address.");
      return;
    }

    window.location.href = result?.url ?? "/";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-lg">
      <div className="w-full max-w-md rounded-2xl border border-border-passive bg-background-cream px-lg py-section-md text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <p className="font-card-title text-card-title tracking-tight text-text-charcoal">RoboMission Inspo</p>
        <p className="mt-md text-body text-text-muted">
          Sign in with your email so your embedded library and rich-text notes stay attached to you.
        </p>

        <form className="mt-xl text-left" onSubmit={(event) => void handleSubmit(event)}>
          <label className="text-caption uppercase tracking-wider text-text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-xs w-full rounded-lg border border-border-passive bg-surface-container-low px-md py-sm text-body text-text-charcoal outline-none placeholder:text-text-muted ring-ring-blue focus:ring-2"
          />

          {error ? (
            <p className="mt-sm text-caption text-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-lg w-full rounded-lg bg-primary px-lg py-md text-body font-semibold text-off-white inset-button transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Continue with email"}
          </button>
        </form>

        <p className="mt-lg text-caption leading-relaxed text-text-muted">
          No password is required for this simple version. In Vercel, set{" "}
          <code className="text-text-charcoal">AUTH_SECRET</code>,{" "}
          <code className="text-text-charcoal">AUTH_TRUST_HOST=true</code>, and{" "}
          <code className="text-text-charcoal">DATABASE_URL</code>. Build command:{" "}
          <code className="selection:bg-charcoal-4 whitespace-pre-wrap break-all text-text-charcoal">
            {`npm run migrate:deploy && npm run build`}
          </code>
          .
        </p>
      </div>
    </div>
  );
}
