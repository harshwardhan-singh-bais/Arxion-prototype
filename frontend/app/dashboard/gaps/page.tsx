"use client";

import { AlertTriangle, TrendingDown, Layers, Crosshair, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const gaps = [
    {
        type: "DATA SATURATION",
        title: "GSM8K Benchmark Saturated",
        desc: "14 recent papers report <1% variance on GSM8K. Dataset is fully saturated. Future evaluation on this dataset provides zero distinguishing value.",
        confidence: 98,
        icon: <Layers className="text-[#C02B0A]" />,
        papers: ["ARX-442", "ARX-129", "ARX-988"]
    },
    {
        type: "MISSING COMBINATION",
        title: "DPO without RLHF pre-training",
        desc: "Analysis of 142 alignment papers reveals zero implementations of DPO directly on un-aligned bases without initial PPO steps. Significant opportunity gap.",
        confidence: 84,
        icon: <Crosshair className="text-[#3C091E]" />,
        papers: []
    },
    {
        type: "CONTRADICTION",
        title: "Linear Attention Scaling Law Mismatch",
        desc: "Paper ARX-711 claims O(N) scaling, but reproduced benchmarks from ARX-992 show O(N log N) degradation in specific kernel configurations.",
        confidence: 92,
        icon: <AlertTriangle className="text-yellow-500" />,
        papers: ["ARX-711", "ARX-992"]
    },
    {
        type: "FIELD STAGNATION",
        title: "Transformer Routing Protocols",
        desc: "No novel routing methodologies published in core conferences for 14 months. Current architectures rely entirely on Top-K mechanisms.",
        confidence: 76,
        icon: <TrendingDown className="text-blue-500" />,
        papers: ["ARX-112"]
    },
];

export default function GapsPage() {
    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        D. Autonomous Gap Intelligence
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="OPPORTUNITY FEED">
                        OPPORTUNITY FEED
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {gaps.map((gap, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#050505] border border-[#3C091E]/30 p-6 xl:p-8 hover:border-[#C02B0A] transition-colors relative group clip-card"
                    >
                        {/* Top Meta info */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black flex items-center justify-center border border-[#3C091E]/30">
                                    {gap.icon}
                                </div>
                                <div>
                                    <h4 className="font-mono text-[10px] tracking-widest text-[#97494E] uppercase mb-1">{gap.type}</h4>
                                    <h2 className="font-sans text-xl font-bold text-white uppercase">{gap.title}</h2>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
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
                            {gap.desc}
                        </p>

                        {/* Evidence Pointers */}
                        <div className="pl-16 flex items-center gap-4">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E]">Evidence Links:</span>
                            {gap.papers.length > 0 ? (
                                gap.papers.map(p => (
                                    <span key={p} className="text-[10px] font-mono bg-[#3C091E] text-white px-2 py-0.5 hover:bg-[#C02B0A] cursor-pointer transition-colors border border-transparent hover:border-white/20">
                                        {p}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] font-mono text-[#C02B0A] border border-[#C02B0A]/30 px-2 py-0.5">NO PRIOR LITERATURE DETECTED</span>
                            )}
                        </div>

                        <div className="absolute top-0 right-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />

                    </motion.div>
                ))}
            </div>

        </div>
    );
}
