"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    LogOut,
    PanelLeftClose,
    PanelLeft,
    FileStack,
    User,
} from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";

const links = [
    { name: "FIELD HEALTH", href: "/dashboard", icon: Activity },
    { name: "INGESTION", href: "/dashboard/upload", icon: Upload },
    { name: "PAPERS", href: "/dashboard/papers", icon: FileStack },
    { name: "LIT MATRIX", href: "/dashboard/matrix", icon: Database },
    { name: "3D NEURAL GRAPH", href: "/dashboard/graph", icon: Network },
    { name: "GAP INTELLIGENCE", href: "/dashboard/gaps", icon: Crosshair },
    { name: "MATRIX CHAT", href: "/dashboard/chat", icon: MessageSquare },
    { name: "DRAFTS & EXPORT", href: "/dashboard/export", icon: FileSignature },
    { name: "PROFILE", href: "/dashboard/profile", icon: User },
];

export function Sidebar() {
    const [expanded, setExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);
    const pathname = usePathname();

    const closeMobile = useCallback(() => setMobileOpen(false), []);

    // Mobile: close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMobile();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [closeMobile]);

    // Mobile: close on outside click
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                closeMobile();
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [mobileOpen, closeMobile]);

    // Mobile: lock body scroll
    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* ── Top Header ── */}
            <div className={`px-4 pt-5 pb-3 flex items-center ${expanded ? "justify-between" : "justify-center"}`}>
                {expanded && (
                    <Link href="/" className="block min-w-0">
                        <h1 className="text-xl font-display font-black tracking-tighter text-[#ef4444] truncate">
                            ARXION
                        </h1>
                        <div className="font-mono text-[8px] text-[#94a3b8] tracking-[0.25em] mt-0.5 uppercase">
                            System Active
                        </div>
                    </Link>
                )}

                {/* Toggle */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="hidden lg:flex items-center justify-center w-7 h-7 text-[#94a3b8] hover:text-[#ef4444] hover:bg-white/[0.03] transition-all flex-shrink-0"
                    aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {expanded ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
                </button>
            </div>

            {expanded && <div className="mx-4 h-[1px] bg-gradient-to-r from-[#ef4444]/40 to-transparent mb-3" />}
            {!expanded && <div className="mb-2" />}

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            title={!expanded ? link.name : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-all relative group ${
                                isActive
                                    ? "text-[#ef4444] bg-[#ef4444]/[0.07]"
                                    : "text-[#94a3b8] hover:text-[#ef4444] hover:bg-white/[0.02]"
                            } ${!expanded ? "justify-center px-0" : ""}`}
                        >
                            {/* Left accent bar */}
                            <div
                                className={`absolute left-0 top-1 bottom-1 w-[2px] transition-all duration-200 ${
                                    isActive
                                        ? "bg-[#ef4444] shadow-[0_0_8px_rgba(192,43,10,0.5)]"
                                        : "bg-transparent group-hover:bg-[#ef4444]/30"
                                }`}
                            />

                            <Icon
                                size={16}
                                className={`flex-shrink-0 ${isActive ? "text-[#ef4444]" : "opacity-50 group-hover:opacity-80"}`}
                            />

                            {expanded && (
                                <span className="truncate transition-opacity duration-200">
                                    {link.name}
                                </span>
                            )}

                            {/* Active glow */}
                            {isActive && <div className="absolute inset-0 bg-[#ef4444]/[0.03] pointer-events-none" />}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Bottom: Status ── */}
            <div className="px-3 py-3 border-t border-[#1e293b]/30 bg-black/30 space-y-3">
                {/* User + Status */}
                <div className={`flex items-center ${expanded ? "gap-3" : "justify-center"}`}>
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                userButtonTrigger: "rounded-full focus:shadow-none focus:outline-none",
                                userButtonBox: "w-10 h-10",
                                avatarBox: "!rounded-full w-10 h-10 border border-[#1e293b]/40 hover:brightness-125 transition-all duration-200 cursor-pointer",
                                avatarImage: "!rounded-full",
                                userButtonPopoverCard: "bg-[#0d111c] border border-[#1e293b]/40 rounded-none",
                                userButtonPopoverActionButton: "hover:bg-[#ef4444]/10 rounded-none",
                                userButtonPopoverActionButtonText: "text-white font-mono text-xs tracking-widest",
                                userButtonPopoverFooter: "hidden",
                            },
                        }}
                    />
                    {expanded && (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 bg-[#ef4444] animate-pulse rounded-full flex-shrink-0" />
                            <span className="font-mono text-[8px] text-[#94a3b8] tracking-[0.2em] uppercase truncate">
                                Engine Stable
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics */}
                {expanded && (
                    <div className="flex gap-3 font-mono text-[7px] text-[#1e293b] uppercase tracking-[0.2em]">
                        <span>MEM: 64.2%</span>
                        <span>GPU: ON</span>
                        <span>RCI: OK</span>
                    </div>
                )}

                {/* Disconnect */}
                <SignOutButton>
                    <button
                        className={`flex items-center gap-2.5 text-[#94a3b8] hover:text-[#ef4444] transition-colors font-mono text-[9px] tracking-[0.2em] uppercase w-full ${
                            !expanded ? "justify-center" : ""
                        }`}
                        title={!expanded ? "DISCONNECT" : undefined}
                    >
                        <LogOut size={13} />
                        {expanded && <span>DISCONNECT</span>}
                    </button>
                </SignOutButton>
            </div>
        </div>
    );

    return (
        <>
            {/* ════════ MOBILE: Hamburger Toggle ════════ */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-[70] w-9 h-9 flex lg:hidden flex-col items-center justify-center gap-[5px] bg-[#0b0f19] border border-[#1e293b]/40 hover:border-[#ef4444]/60 transition-all"
                aria-label="Open sidebar"
            >
                <span className="block w-4 h-[1.5px] bg-[#94a3b8]" />
                <span className="block w-4 h-[1.5px] bg-[#94a3b8]" />
                <span className="block w-4 h-[1.5px] bg-[#94a3b8]" />
            </button>

            {/* ════════ MOBILE: Backdrop ════════ */}
            <div
                className={`fixed inset-0 z-[59] bg-white/[0.06] backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={closeMobile}
                aria-hidden="true"
            />

            {/* ════════ MOBILE: Overlay Sidebar ════════ */}
            <aside
                ref={sidebarRef}
                className={`fixed top-0 left-0 z-[60] w-[240px] h-screen bg-[#0b0f19] border-r border-[#1e293b]/30 lg:hidden transition-transform duration-300 ease-in-out ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                role="navigation"
            >
                {sidebarContent}
            </aside>

            {/* ════════ DESKTOP: Push Sidebar ════════ */}
            <aside
                className={`hidden lg:flex flex-col h-screen bg-[#0b0f19] border-r border-[#1e293b]/30 flex-shrink-0 transition-all duration-300 ease-in-out ${
                    expanded ? "w-[240px]" : "w-[70px]"
                }`}
                role="navigation"
                aria-expanded={expanded}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
