"use client";

import { useState } from "react";
import { Filter, ChevronDown, CheckCircle2, AlertOctagon, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LitMatrixPage() {
    const [filter, setFilter] = useState("all");
    const router = useRouter();

    const papers = [
        {
            id: "ARX-142",
            title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
            authors: "Gu, Dao",
            rci: 94.2,
            datasets: ["Pile", "SlimPajama"],
            method: "Selective SSM",
            status: "VERIFIED",
        },
        {
            id: "ARX-811",
            title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
            authors: "Rafailov et al.",
            rci: 88.5,
            datasets: ["Anthropic HH", "Reddit TLDR"],
            method: "DPO",
            status: "VERIFIED",
        },
        {
            id: "ARX-324",
            title: "Gemini: A Family of Highly Capable Multimodal Models",
            authors: "Google DeepMind",
            rci: 65.1,
            datasets: ["Proprietary 1T+"],
            method: "Sparse MoE",
            status: "CONTRADICTION",
            flag: "Hardware requirement unverified vs claims",
        },
        {
            id: "ARX-990",
            title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
            authors: "Touvron et al.",
            rci: 90.0,
            datasets: ["Public Web Custom"],
            method: "GQA + RLHF",
            status: "VERIFIED",
        },
        {
            id: "ARX-214",
            title: "Attention Is All You Need",
            authors: "Vaswani et al.",
            rci: 99.8,
            datasets: ["WMT 2014 EN-DE"],
            method: "Transformer",
            status: "BASELINE",
        },
    ];

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1400px] mx-auto">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        C. Multi-Paper Intelligence
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="LITERATURE MATRIX">
                        LITERATURE MATRIX
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 border border-[#3C091E]/50 px-4 py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-[#C02B0A]/10 hover:text-[#C02B0A] transition-colors text-white">
                        <Filter size={14} /> Compare Tags
                    </button>
                    <button className="flex items-center gap-2 border border-[#3C091E]/50 px-4 py-2 font-mono text-[10px] tracking-widest uppercase bg-[#3C091E] text-white hover:bg-[#C02B0A] transition-colors clip-button">
                        Export Matrix CSV
                    </button>
                </div>
            </div>

            {/* Main Matrix Table */}
            <div className="w-full overflow-x-auto bg-[#050505] border border-[#3C091E]/30 clip-card">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#3C091E]/30 bg-[#1A030A]">
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">ID</th>
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Paper Title</th>
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Arxion RCI</th>
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Datasets Scanned</th>
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Core Method</th>
                            <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Verification Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {papers.map((paper, i) => (
                            <tr key={i} onClick={() => router.push(`/dashboard/paper/${paper.id}`)} className="border-b border-[#3C091E]/10 hover:bg-white/[0.02] cursor-pointer transition-colors group">

                                <td className="p-4 font-mono text-xs text-[#C02B0A] group-hover:underline">{paper.id}</td>

                                <td className="p-4 max-w-sm">
                                    <h4 className="font-sans text-sm font-bold text-white mb-1 group-hover:text-[#C02B0A] transition-colors line-clamp-1">{paper.title}</h4>
                                    <span className="font-mono text-[9px] text-[#97494E] uppercase">{paper.authors}</span>
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Score progress bar */}
                                        <div className="w-16 h-1 bg-black overflow-hidden">
                                            <div className={`h-full ${paper.rci > 90 ? 'bg-green-500' : paper.rci > 80 ? 'bg-yellow-500' : 'bg-[#C02B0A]'}`} style={{ width: `${paper.rci}%` }} />
                                        </div>
                                        <span className="font-mono text-xs text-white">{paper.rci}</span>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <div className="flex gap-2 flex-wrap">
                                        {paper.datasets.map(d => (
                                            <span key={d} className="px-2 py-0.5 border border-[#3C091E]/50 text-[9px] font-mono uppercase text-[#97494E] bg-black">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </td>

                                <td className="p-4 font-mono text-xs text-white uppercase">{paper.method}</td>

                                <td className="p-4">
                                    {paper.status === "VERIFIED" && <span className="flex items-center gap-2 text-[10px] font-mono text-green-500 uppercase"><CheckCircle2 size={12} /> Verified</span>}
                                    {paper.status === "BASELINE" && <span className="flex items-center gap-2 text-[10px] font-mono text-blue-500 uppercase"><LinkIcon size={12} /> Root Baseline</span>}
                                    {paper.status === "CONTRADICTION" && (
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2 text-[10px] font-mono text-[#C02B0A] uppercase"><AlertOctagon size={12} /> Contradiction</span>
                                            <span className="text-[8px] text-[#97494E] font-mono uppercase truncate max-w-[150px]">{paper.flag}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
