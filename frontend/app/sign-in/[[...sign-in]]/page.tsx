"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-[#1e293b]/40 bg-[#0d111c] p-8 text-center">
          <h1 className="text-2xl font-display font-black text-white mb-4 uppercase">Auth Disabled</h1>
          <p className="font-mono text-xs text-[#94a3b8] leading-relaxed uppercase tracking-wide">
            Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable Clerk authentication.
          </p>
          <Link href="/" className="inline-block mt-6 text-[#ef4444] font-mono text-xs uppercase tracking-widest">
            Back To Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background industrial grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at center, #94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#0b0f19_70%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Branding */}
        <Link href="/" className="flex flex-col items-center gap-3 group">
          <div className="flex items-center gap-4">
            <span className="w-8 h-8 bg-[#ef4444] flex items-center justify-center border border-white/20" />
            <h1 className="text-4xl font-display font-black tracking-tighter text-white group-hover:text-[#ef4444] transition-colors">
              ARXION
            </h1>
          </div>
          <div className="font-mono text-[10px] text-[#94a3b8] tracking-[0.3em] uppercase">
            Research Intelligence Engine
          </div>
        </Link>

        {/* Accent line */}
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#ef4444] to-transparent" />

        {/* Clerk SignIn Widget */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#0d111c] border border-[#1e293b]/40 shadow-[0_0_60px_rgba(192,43,10,0.1)] rounded-none",
              headerTitle: "text-white font-display font-black tracking-tighter uppercase",
              headerSubtitle: "text-[#94a3b8] font-mono text-xs tracking-widest uppercase",
              socialButtonsBlockButton:
                "bg-[#0b0f19] border border-[#1e293b]/40 text-white hover:bg-[#ef4444]/10 hover:border-[#ef4444]/60 rounded-none font-mono text-xs tracking-widest uppercase transition-all",
              socialButtonsBlockButtonText: "text-white font-mono",
              dividerLine: "bg-[#1e293b]/30",
              dividerText: "text-[#94a3b8] font-mono text-[9px] tracking-widest uppercase",
              formFieldLabel: "text-[#94a3b8] font-mono text-[10px] tracking-widest uppercase",
              formFieldInput:
                "bg-[#0b0f19] border border-[#1e293b]/40 text-white rounded-none font-mono focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/50",
              formButtonPrimary:
                "bg-[#ef4444] hover:bg-[#ef4444]/90 text-white rounded-none font-mono text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(192,43,10,0.4)] transition-all clip-button",
              footerActionLink: "text-[#ef4444] hover:text-[#ef4444]/80 font-mono",
              footerActionText: "text-[#94a3b8] font-mono text-xs",
              identityPreviewEditButton: "text-[#ef4444] hover:text-[#ef4444]/80",
              formFieldAction: "text-[#ef4444] font-mono text-xs",
              alert: "bg-[#ef4444]/10 border border-[#ef4444]/30 text-white rounded-none",
              alertText: "text-white font-mono text-xs",
              otpCodeFieldInput: "bg-[#0b0f19] border-[#1e293b]/40 text-white rounded-none",
              formHeaderTitle: "text-white font-display",
              formHeaderSubtitle: "text-[#94a3b8] font-mono text-xs",
              navbar: "hidden",
              navbarMobileMenuButton: "text-white",
              headerBackIcon: "text-[#ef4444]",
              headerBackLink: "text-[#ef4444] font-mono text-xs",
            },
          }}
        />

        {/* Bottom label */}
        <div className="font-mono text-[9px] text-[#1e293b] tracking-[0.3em] uppercase mt-4">
          [ SECURE ACCESS PORTAL ]
        </div>
      </div>
    </div>
  );
}
