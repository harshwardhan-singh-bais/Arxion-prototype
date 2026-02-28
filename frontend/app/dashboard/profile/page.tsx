"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { ChevronRight, FileText, CheckCircle2, Crosshair, Pencil, Save } from "lucide-react";

function MetricCard({ title, value, sub }: { title: string; value: string | number; sub: string }) {
    return (
        <div className="p-6 bg-black/40 border border-[#3C091E]/30 relative overflow-hidden group hover:border-[#C02B0A]/50 transition-colors">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#97494E] mb-2">{title}</h4>
            <div className="text-4xl font-display font-black text-white tracking-tighter mb-4">
                {value}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#3C091E] flex items-center justify-between border-t border-[#3C091E]/20 pt-4">
                <span>{sub}</span>
                <ChevronRight size={12} />
            </div>
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
        </div>
    );
}

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [displayName, setDisplayName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [stats, setStats] = useState({ papers: 0, processed: 0, gaps: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            setDisplayName(user.fullName || user.firstName || "");
            fetchStats();
        }
    }, [isLoaded, user]);

    async function fetchStats() {
        try {
            const res = await fetch("/api/v1/profile", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setStats({
                    papers: data.papers_count || 0,
                    processed: data.processed_count || 0,
                    gaps: data.gaps_count || 0,
                });
                if (data.display_name) setDisplayName(data.display_name);
            }
        } catch (e) {
            console.error("Failed to fetch profile stats:", e);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await fetch("/api/v1/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ display_name: displayName }),
            });
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save profile:", e);
        } finally {
            setSaving(false);
        }
    }

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#C02B0A] animate-pulse rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-8">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        User Intelligence
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tighter uppercase">
                        Profile
                    </h1>
                </div>
            </div>

            {/* Profile Card */}
            <div className="p-8 bg-black/40 border border-[#3C091E]/30">
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                userButtonTrigger: "rounded-full focus:shadow-none focus:outline-none",
                                userButtonBox: "w-16 h-16",
                                avatarBox: "!rounded-full w-16 h-16 border-2 border-[#3C091E]/40",
                                avatarImage: "!rounded-full",
                                userButtonPopoverCard: "bg-[#0a0a0a] border border-[#3C091E]/40 rounded-none",
                                userButtonPopoverActionButton: "hover:bg-[#C02B0A]/10 rounded-none",
                                userButtonPopoverActionButtonText: "text-white font-mono text-xs tracking-widest",
                                userButtonPopoverFooter: "hidden",
                            },
                        }}
                    />

                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="bg-black/60 border border-[#3C091E]/50 px-4 py-2 font-mono text-sm text-white tracking-wider focus:outline-none focus:border-[#C02B0A]/50 w-full max-w-xs"
                                    placeholder="Enter display name"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#C02B0A] text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-[#C02B0A]/80 transition-colors disabled:opacity-50"
                                >
                                    <Save size={12} />
                                    {saving ? "SAVING..." : "SAVE"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-display font-black text-white tracking-tighter truncate">
                                    {displayName || "Unnamed Agent"}
                                </h2>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[#97494E] hover:text-[#C02B0A] transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        )}
                        <div className="font-mono text-[9px] text-[#97494E] tracking-[0.2em] uppercase mt-1">
                            {user?.primaryEmailAddress?.emailAddress || "No email"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Papers Uploaded"
                    value={stats.papers}
                    sub="Total ingested"
                />
                <MetricCard
                    title="Papers Processed"
                    value={stats.processed}
                    sub="Analysis complete"
                />
                <MetricCard
                    title="Gaps Created"
                    value={stats.gaps}
                    sub="Research gaps"
                />
            </div>

            {/* Account Info */}
            <div className="p-6 bg-black/40 border border-[#3C091E]/30">
                <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
                    <div className="w-3 h-0.5 bg-[#C02B0A]" />
                    Account Details
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[#3C091E]/20">
                        <span className="font-mono text-[10px] text-[#97494E] tracking-[0.2em] uppercase">Email</span>
                        <span className="font-mono text-xs text-white">{user?.primaryEmailAddress?.emailAddress}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#3C091E]/20">
                        <span className="font-mono text-[10px] text-[#97494E] tracking-[0.2em] uppercase">Joined</span>
                        <span className="font-mono text-xs text-white">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="font-mono text-[10px] text-[#97494E] tracking-[0.2em] uppercase">Auth Provider</span>
                        <span className="font-mono text-xs text-[#C02B0A]">CLERK</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
