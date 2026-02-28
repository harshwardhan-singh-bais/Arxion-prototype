"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    Upload,
    Database,
    Network,
    Crosshair,
    MessageSquare,
    FileSignature,
    LogOut
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: "FIELD HEALTH", href: "/dashboard", icon: <Activity size={18} /> },
        { name: "INGESTION", href: "/dashboard/upload", icon: <Upload size={18} /> },
        { name: "LIT MATRIX", href: "/dashboard/matrix", icon: <Database size={18} /> },
        { name: "3D NEURAL GRAPH", href: "/dashboard/graph", icon: <Network size={18} /> },
        { name: "GAP INTELLIGENCE", href: "/dashboard/gaps", icon: <Crosshair size={18} /> },
        { name: "MATRIX CHAT", href: "/dashboard/chat", icon: <MessageSquare size={18} /> },
        { name: "DRAFTS & EXPORT", href: "/dashboard/export", icon: <FileSignature size={18} /> },
    ];

    return (
        <aside className="w-64 h-screen border-r border-[#3C091E]/30 bg-[#050505] hidden md:flex flex-col justify-between sticky top-0 z-50">

            {/* Top Branding */}
            <div className="p-8">
                <Link href="/">
                    <h1 className="text-3xl font-display font-black tracking-tighter text-[#C02B0A]">
                        ARXION
                    </h1>
                    <div className="font-mono text-[10px] text-[#97494E] tracking-widest mt-1 uppercase">
                        System Active
                    </div>
                </Link>
                <div className="w-full h-[1px] bg-gradient-to-r from-[#C02B0A] to-transparent mt-6 opacity-30" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-4 px-4 py-3 font-mono text-xs tracking-widest uppercase transition-all
                ${isActive
                                    ? "bg-[#C02B0A]/10 text-[#C02B0A] border-l-2 border-[#C02B0A]"
                                    : "text-[#97494E] hover:text-[#C02B0A] hover:bg-white/[0.02] border-l-2 border-transparent"
                                }
              `}
                        >
                            <div className={isActive ? "text-[#C02B0A]" : "opacity-60"}>
                                {link.icon}
                            </div>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Status Panel */}
            <div className="p-6 border-t border-[#3C091E]/30 bg-black/40">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-[#C02B0A] animate-pulse rounded-full" />
                    <span className="font-mono text-[10px] text-[#97494E] tracking-widest uppercase">
                        Engine Stable
                    </span>
                </div>

                <div className="flex flex-col gap-1 font-mono text-[9px] text-[#3C091E] uppercase tracking-widest mb-6">
                    <span>MEM: 64.2%</span>
                    <span>GPU: ALLOCATED</span>
                    <span>RCI: COMPUTING</span>
                </div>

                <button className="flex items-center gap-3 text-[#97494E] hover:text-[#C02B0A] transition-colors font-mono text-[10px] tracking-widest uppercase w-full">
                    <LogOut size={14} />
                    <span>DISCONNECT</span>
                </button>
            </div>

        </aside>
    );
}
