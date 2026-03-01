import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Orbitron, Rajdhani } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const rajdhani = Rajdhani({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-rajdhani" });

export const metadata: Metadata = {
  title: "Arxion | Research Intelligence Engine",
  description: "Autonomous Research Credibility & Intelligence Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
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
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} ${orbitron.variable} ${rajdhani.variable} font-sans antialiased text-foreground min-h-screen selection:bg-secondary/30`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
