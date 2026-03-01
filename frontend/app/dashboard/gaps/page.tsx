"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, Layers, Crosshair, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api, type GapItem } from "@/lib/api";

const GAP_ICONS: Record<string, React.ReactNode> = {
    DATA_SATURATION: <Layers className="text-[#C02B0A]" />,
    MISSING_COMBINATION: <Crosshair className="text-[#3C091E]" />,
    CONTRADICTION: <AlertTriangle className="text-yellow-500" />,
    FIELD_STAGNATION: <TrendingDown className="text-blue-500" />,
    BENCHMARK_INFLATION: <AlertTriangle className="text-orange-400" />,
    UNDEREXPLORED: <Crosshair className="text-purple-400" />,
};

export default function GapsPage() {
    const [gaps, setGaps] = useState<GapItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanTimestamp, setScanTimestamp] = useState<string>("");

    useEffect(() => {
        api.getGaps()
            .then((feed) => {
                setGaps(feed.gaps);
                setScanTimestamp(feed.scan_timestamp);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        D. Autonomous Gap Intelligence
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="OPPORTUNITY FEED">
                        OPPORTUNITY FEED
                    </h1>
                    {scanTimestamp && (
                        <p className="font-mono text-[9px] text-[#97494E] uppercase tracking-widest mt-2">
                            SCAN: {new Date(scanTimestamp).toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="font-mono text-xs text-[#97494E] text-right">
                    {!loading && <span className="text-white">{gaps.length} GAPS DETECTED</span>}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 size={18} className="animate-spin text-[#C02B0A]" />
                    <span className="font-mono text-[10px] text-[#97494E] uppercase tracking-widest">
                        SCANNING KNOWLEDGE MATRIX FOR GAPS...
                    </span>
                </div>
            ) : gaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <p className="font-mono text-[10px] text-[#97494E] uppercase tracking-widest">NO GAPS DETECTED YET</p>
                    <p className="font-mono text-[9px] text-[#3C091E] uppercase">
                        Upload at least 2 processed papers to enable gap analysis.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {gaps.map((gap, i) => (
                        <motion.div
                            key={gap.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-[#050505] border border-[#3C091E]/30 p-6 xl:p-8 hover:border-[#C02B0A] transition-colors relative group clip-card"
                        >
                            {/* Top meta */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black flex items-center justify-center border border-[#3C091E]/30">
                                        {GAP_ICONS[gap.type] ?? <Layers className="text-[#97494E]" />}
                                    </div>
                                    <div>
                                        <h4 className="font-mono text-[10px] tracking-widest text-[#97494E] uppercase mb-1">
                                            {gap.type.replace(/_/g, " ")}
                                        </h4>
                                        <h2 className="font-sans text-xl font-bold text-white uppercase">{gap.title}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Arxion Confidence</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-[#C02B0A]">{gap.confidence}%</span>
                                        <div className="w-24 h-1 bg-black overflow-hidden border border-[#3C091E]/30">
                                            <div className="h-full bg-[#C02B0A]" style={{ width: `${gap.confidence}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="font-mono text-xs text-white/70 leading-relaxed uppercase tracking-wide max-w-4xl mb-6 pl-16">
                                {gap.description}
                            </p>

                            {/* Evidence chips */}
                            <div className="pl-16 flex items-center gap-4 flex-wrap">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Evidence Links:</span>
                                {gap.evidence_paper_ids.length > 0 ? (
                                    gap.evidence_paper_ids.map(pid => (
                                        <span
                                            key={pid}
                                            className="text-[10px] font-mono bg-[#3C091E] text-white px-2 py-0.5 hover:bg-[#C02B0A] cursor-pointer transition-colors border border-transparent hover:border-white/20"
                                        >
                                            {pid.slice(0, 8).toUpperCase()}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] font-mono text-[#C02B0A] border border-[#C02B0A]/30 px-2 py-0.5">
                                        NO PRIOR LITERATURE DETECTED
                                    </span>
                                )}
                            </div>

                            <div className="absolute top-0 right-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
