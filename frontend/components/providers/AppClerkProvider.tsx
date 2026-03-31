"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

type Props = {
  children: React.ReactNode;
};

export function AppClerkProvider({ children }: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn("[Arxion] Clerk is disabled: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set.");
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ef4444",
          colorBackground: "#0d111c",
          colorInputBackground: "#0b0f19",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#94a3b8",
          colorDanger: "#ef4444",
          borderRadius: "12px",
          fontFamily: "'JetBrains Mono', monospace",
          fontFamilyButtons: "'JetBrains Mono', monospace",
        },
        elements: {
          card: "shadow-[0_0_60px_rgba(239,68,68,0.08)]",
          formButtonPrimary: "clip-button shadow-[0_0_20px_rgba(239,68,68,0.4)]",
          userButtonPopoverCard: "bg-[#0d111c] border border-[#1e293b]/40 rounded-none",
          userButtonPopoverActionButton: "hover:bg-[#ef4444]/10 rounded-none",
          userButtonPopoverActionButtonText: "text-white font-mono text-xs",
          userButtonPopoverFooter: "hidden",
          userButtonAvatarBox: "w-8 h-8 rounded-none border border-[#ef4444]/50",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
