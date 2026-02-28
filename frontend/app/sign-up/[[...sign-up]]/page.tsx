import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background industrial grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at center, #97494E 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_70%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Branding */}
        <Link href="/" className="flex flex-col items-center gap-3 group">
          <div className="flex items-center gap-4">
            <span className="w-8 h-8 bg-[#C02B0A] flex items-center justify-center border border-white/20" />
            <h1 className="text-4xl font-display font-black tracking-tighter text-white group-hover:text-[#C02B0A] transition-colors">
              ARXION
            </h1>
          </div>
          <div className="font-mono text-[10px] text-[#97494E] tracking-[0.3em] uppercase">
            Research Intelligence Engine
          </div>
        </Link>

        {/* Accent line */}
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C02B0A] to-transparent" />

        {/* Clerk SignUp Widget */}
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#0a0a0a] border border-[#3C091E]/40 shadow-[0_0_60px_rgba(192,43,10,0.1)] rounded-none",
              headerTitle: "text-white font-display font-black tracking-tighter uppercase",
              headerSubtitle: "text-[#97494E] font-mono text-xs tracking-widest uppercase",
              socialButtonsBlockButton:
                "bg-[#050505] border border-[#3C091E]/40 text-white hover:bg-[#C02B0A]/10 hover:border-[#C02B0A]/60 rounded-none font-mono text-xs tracking-widest uppercase transition-all",
              socialButtonsBlockButtonText: "text-white font-mono",
              dividerLine: "bg-[#3C091E]/30",
              dividerText: "text-[#97494E] font-mono text-[9px] tracking-widest uppercase",
              formFieldLabel: "text-[#97494E] font-mono text-[10px] tracking-widest uppercase",
              formFieldInput:
                "bg-[#050505] border border-[#3C091E]/40 text-white rounded-none font-mono focus:border-[#C02B0A] focus:ring-1 focus:ring-[#C02B0A]/50",
              formButtonPrimary:
                "bg-[#C02B0A] hover:bg-[#C02B0A]/90 text-white rounded-none font-mono text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(192,43,10,0.4)] transition-all clip-button",
              footerActionLink: "text-[#C02B0A] hover:text-[#C02B0A]/80 font-mono",
              footerActionText: "text-[#97494E] font-mono text-xs",
              identityPreviewEditButton: "text-[#C02B0A] hover:text-[#C02B0A]/80",
              formFieldAction: "text-[#C02B0A] font-mono text-xs",
              alert: "bg-[#C02B0A]/10 border border-[#C02B0A]/30 text-white rounded-none",
              alertText: "text-white font-mono text-xs",
              otpCodeFieldInput: "bg-[#050505] border-[#3C091E]/40 text-white rounded-none",
              formHeaderTitle: "text-white font-display",
              formHeaderSubtitle: "text-[#97494E] font-mono text-xs",
              navbar: "hidden",
              navbarMobileMenuButton: "text-white",
              headerBackIcon: "text-[#C02B0A]",
              headerBackLink: "text-[#C02B0A] font-mono text-xs",
            },
          }}
        />

        {/* Bottom label */}
        <div className="font-mono text-[9px] text-[#3C091E] tracking-[0.3em] uppercase mt-4">
          [ CREATE YOUR OPERATOR PROFILE ]
        </div>
      </div>
    </div>
  );
}
