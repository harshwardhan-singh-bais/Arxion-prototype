"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    return (
        <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b-[0.5px] border-white/10 font-mono tracking-widest text-[11px] uppercase">
            <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-bold flex items-center gap-3">
                        <span className="w-6 h-6 bg-secondary flex items-center justify-center border border-white/20">
                            {/* Minimalist square block logo */}
                        </span>
                        <span className="text-white hover:text-secondary transition-colors">ARXION</span>
                    </Link>
                </div>

                {!isLanding && (
                    <nav className="hidden md:flex gap-6 text-muted-foreground mr-auto ml-10">
                        <Link href="/dashboard" className="hover:text-white transition-colors">DASHBOARD</Link>
                        <span className="text-white/20">/</span>
                        <Link href="/upload" className="hover:text-white transition-colors">INGEST</Link>
                        <span className="text-white/20">/</span>
                        <Link href="/matrix" className="hover:text-white transition-colors">MATRIX</Link>
                        <span className="text-white/20">/</span>
                        <Link href="/graph" className="hover:text-white transition-colors">GRAPH</Link>
                    </nav>
                )}

                <div className="flex items-center gap-6">
                    {/* Signed Out: Show LOG IN link */}
                    <SignedOut>
                        {isLanding && (
                            <Link href="/sign-in" className="text-muted-foreground hover:text-white transition-colors">
                                LOG IN
                            </Link>
                        )}
                    </SignedOut>

                    {/* Signed In: Show UserButton */}
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    userButtonTrigger: "rounded-full focus:shadow-none focus:outline-none",
                                    userButtonBox: "w-8 h-8",
                                    avatarBox: "!rounded-full w-8 h-8 border border-[#3C091E]/40 hover:brightness-125 transition-all duration-200 cursor-pointer",
                                    avatarImage: "!rounded-full",
                                    userButtonPopoverCard: "bg-[#0a0a0a] border border-[#3C091E]/40 rounded-none",
                                    userButtonPopoverActionButton: "hover:bg-[#C02B0A]/10 rounded-none",
                                    userButtonPopoverActionButtonText: "text-white font-mono text-xs tracking-widest",
                                    userButtonPopoverFooter: "hidden",
                                },
                            }}
                        />
                    </SignedIn>

                    <Button
                        asChild
                        className="bg-secondary hover:bg-secondary/90 text-white clip-button h-8 rounded-none px-6 shadow-[0_0_15px_rgba(192,43,10,0.5)] transition-all font-mono"
                    >
                        <Link href="/dashboard">ACCESS ENGINE</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
