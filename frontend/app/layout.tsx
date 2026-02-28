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
          colorPrimary: "#C02B0A",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#050505",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#97494E",
          colorDanger: "#C02B0A",
          borderRadius: "0px",
          fontFamily: "'JetBrains Mono', monospace",
          fontFamilyButtons: "'JetBrains Mono', monospace",
        },
        elements: {
          card: "shadow-[0_0_60px_rgba(192,43,10,0.08)]",
          formButtonPrimary: "clip-button shadow-[0_0_20px_rgba(192,43,10,0.4)]",
          userButtonPopoverCard: "bg-[#0a0a0a] border border-[#3C091E]/40 rounded-none",
          userButtonPopoverActionButton: "hover:bg-[#C02B0A]/10 rounded-none",
          userButtonPopoverActionButtonText: "text-white font-mono text-xs",
          userButtonPopoverFooter: "hidden",
          userButtonAvatarBox: "w-8 h-8 rounded-none border border-[#C02B0A]/50",
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
