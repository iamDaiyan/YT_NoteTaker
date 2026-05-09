"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-lg">
      <div className="w-full max-w-md rounded-2xl border border-border-passive bg-background-cream px-lg py-section-md text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <p className="font-card-title text-card-title tracking-tight text-text-charcoal">RoboMission Inspo</p>
        <p className="mt-md text-body text-text-muted">
          Sign in so your embedded library and rich-text notes persist in PostgreSQL behind this deployment.
        </p>

        <button
          type="button"
          onClick={() => void signIn("github", { callbackUrl: "/" })}
          className="mt-xl w-full rounded-lg bg-primary px-lg py-md text-body font-semibold text-off-white inset-button hover:opacity-90"
        >
          Continue with GitHub
        </button>

        <p className="mt-lg text-caption leading-relaxed text-text-muted">
          OAuth must provide an email address. In Vercel, set{" "}
          <code className="text-text-charcoal">AUTH_SECRET</code>, <code className="text-text-charcoal">GITHUB_ID</code>,{" "}
          <code className="text-text-charcoal">GITHUB_SECRET</code>, and <code className="text-text-charcoal">
            DATABASE_URL
          </code>{" "}
          with <code className="text-text-charcoal">AUTH_TRUST_HOST=true</code>. GitHub callback:{" "}
          <code className="selection:bg-charcoal-4 break-all text-text-charcoal">
            https://YOUR_DEPLOY.vercel.app/api/auth/callback/github
          </code>
          . Build command:{" "}
          <code className="selection:bg-charcoal-4 whitespace-pre-wrap break-all text-text-charcoal">
            {`npm run migrate:deploy && npm run build`}
          </code>
          .
        </p>
      </div>
    </div>
  );
}
