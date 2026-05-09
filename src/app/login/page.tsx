"use client";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/";
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet.");
      return;
    }

    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Check your email for the login link.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-lg">
      <div className="w-full max-w-md rounded-2xl border border-border-passive bg-background-cream px-lg py-section-md text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <p className="font-card-title text-card-title tracking-tight text-text-charcoal">RoboMission Inspo</p>
        <p className="mt-md text-body text-text-muted">
          Sign in with your email. Supabase will send a secure magic link.
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

          {message ? (
            <p className="mt-sm text-caption text-text-muted" role="status">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-lg w-full rounded-lg bg-primary px-lg py-md text-body font-semibold text-off-white inset-button transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending link..." : "Send login link"}
          </button>
        </form>

        <p className="mt-lg text-caption leading-relaxed text-text-muted">
          In Supabase, add this site URL to Auth redirect URLs. In Vercel, set{" "}
          <code className="text-text-charcoal">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-text-charcoal">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    </div>
  );
}
