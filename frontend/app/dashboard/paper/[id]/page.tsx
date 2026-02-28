"use client";

import { ArrowLeft, ExternalLink, ShieldAlert, Cpu, Timer, ShieldCheck, FileKey, AlertOctagon, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PaperDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;

    // Mock data for the credibility breakdown
    const paper = {
        title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
        authors: "Rafael Rafailov, Archit Sharma, Eric Mitchell, Christopher D Manning, Stefano Ermon, Chelsea Finn",
        rci: 88.5,
        reproducibilityScore: 92,
        confidenceScore: 85,
        flags: ["MISSING_HARDWARE_SPECS", "OPEN_SOURCE_WEIGHTS"],
        effort: {
            gpuHours: "Est. 320h (A100)",
            complexity: "Moderate",
            risk: "Low"
        },
        integrity: {
            multiRun: true,
            confInterval: true,
            codeLink: "https://github.com/eric-mitchell/direct-preference-optimization"
        },
        evidence: [
            { type: "CLAIM", text: "DPO eliminates the need for fitting a reward model.", section: "Abstract", conf: 0.99 },
            { type: "METHOD", text: "Optimizing the policy directly using a simple cross-entropy loss", section: "3. Direct Preference Optimization", conf: 0.95 },
            { type: "BASELINE", text: "We compare against PPO-based RLHF.", section: "5.1 Baselines", conf: 0.88 },
            { type: "DATASET", text: "Anthropic HH dataset", section: "5. Experiments", conf: 0.94 }
        ]
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

            {/* Back Button */}
            <Link href="/dashboard/matrix" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#97494E] hover:text-[#C02B0A] transition-colors w-max">
                <ArrowLeft size={12} /> BACK TO MATRIX
            </Link>

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-[#3C091E]/30 pb-10">
                <div className="max-w-3xl">
                    <div className="font-mono text-xs text-white bg-[#C02B0A] px-2 py-0.5 w-max tracking-widest mb-4">
                        {id}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-white uppercase glitch mb-4" data-text={paper.title}>
                        {paper.title}
                    </h1>
                    <p className="font-mono text-[#97494E] text-sm uppercase tracking-widest leading-loose">
                        {paper.authors}
                    </p>
                </div>

                {/* Main RCI Score Block */}
                <div className="shrink-0 bg-[#050505] border border-[#C02B0A] clip-card-solais p-8 text-center min-w-[200px] shadow-[0_0_30px_rgba(192,43,10,0.15)] relative overflow-hidden group">
                    <div className="font-mono text-[9px] text-[#C02B0A] tracking-[0.3em] uppercase mb-4">ARXION RCI</div>
                    <div className="text-6xl font-display font-black text-white">{paper.rci}</div>
                    <div className="font-mono text-[10px] text-green-500 tracking-widest uppercase mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> Highly Credible
                    </div>

                    {/* Heat map glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#C02B0A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COL: Breakdowns */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Score Breakdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Reproducibility */}
                        <div className="bg-[#0a0a0a] border border-[#3C091E]/30 p-6 relative">
                            <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-4 flex items-center gap-2">
                                <FileKey size={14} className="text-white" /> Reproducibility
                            </h3>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-4xl font-display font-black text-white">{paper.reproducibilityScore}%</div>
                            </div>
                            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                                <div className="flex justify-between text-green-500">
                                    <span>Public Code Repo</span> <span>Verified</span>
                                </div>
                                <div className="flex justify-between text-green-500">
                                    <span>Hyperparameters</span> <span>Detailed</span>
                                </div>
                                <div className="flex justify-between text-yellow-500">
                                    <span>Evaluation Pipeline</span> <span>Partial Match</span>
                                </div>
                            </div>
                        </div>

                        {/* Confidence */}
                        <div className="bg-[#0a0a0a] border border-[#3C091E]/30 p-6 relative">
                            <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-4 flex items-center gap-2">
                                <HelpCircle size={14} className="text-white" /> Arxion Confidence
                            </h3>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-4xl font-display font-black text-white">{paper.confidenceScore}%</div>
                            </div>
                            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                                <div className="flex justify-between text-white/80">
                                    <span>Parse Completeness</span> <span>99.8%</span>
                                </div>
                                <div className="flex justify-between text-white/80">
                                    <span>Claim-to-Evidence</span> <span>1.4 Ratio</span>
                                </div>
                                <div className="flex justify-between text-[#C02B0A]">
                                    <span>Missing Context</span> <span>Hardware Topology</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Strict Evidence Pointers */}
                    <div className="bg-[#0a0a0a] border border-[#3C091E]/30 p-6">
                        <h3 className="font-mono text-xs text-[#C02B0A] tracking-widest uppercase mb-6 flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#C02B0A]" /> STRUCTURED EVIDENCE MAPPING
                        </h3>
                        <div className="space-y-4">
                            {paper.evidence.map((ev, i) => (
                                <div key={i} className="p-4 border border-[#3C091E]/20 bg-[#050505] hover:border-[#3C091E]/80 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cursor-pointer">
                                    <div className="flex-1">
                                        <div className="font-mono text-[9px] text-[#97494E] tracking-widest uppercase mb-2 flex items-center gap-2">
                                            <span className="bg-[#3C091E] text-white px-2 py-0.5">{ev.type}</span>
                                            <span>{ev.section}</span>
                                        </div>
                                        <p className="font-sans text-sm text-white">{ev.text}</p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#97494E]">Conf.</span>
                                        <span className="font-mono text-xs text-[#C02B0A]">{(ev.conf * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COL: Side info */}
                <div className="space-y-8">

                    {/* Risk Flags */}
                    <div className="border border-[#C02B0A]/30 bg-[#1A030A]/30 p-6 clip-card">
                        <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-widest uppercase mb-4 flex items-center gap-2">
                            <AlertOctagon size={14} /> Risk Assessment
                        </h3>
                        <div className="flex flex-col gap-2">
                            {paper.flags.map(f => (
                                <div key={f} className="text-xs font-mono uppercase bg-[#C02B0A] text-white p-2 text-center tracking-widest">
                                    {f.replace(/_/g, " ")}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reproduction Effort (Advanced Intel) */}
                    <div className="border border-[#3C091E]/30 bg-[#050505] p-6 clip-card-solais">
                        <h3 className="font-mono text-[10px] text-white tracking-widest uppercase mb-6 border-b border-[#3C091E]/30 pb-4">
                            Reproduction Estimator
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E] flex items-center gap-2 mb-2"><Cpu size={12} /> Compute Est.</span>
                                <span className="font-mono text-sm text-white uppercase">{paper.effort.gpuHours}</span>
                            </div>
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E] flex items-center gap-2 mb-2"><Timer size={12} /> Eng. Complexity</span>
                                <span className="font-mono text-sm text-yellow-500 uppercase">{paper.effort.complexity}</span>
                            </div>
                            <div>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#97494E] flex items-center gap-2 mb-2"><ShieldAlert size={12} /> Risk Level</span>
                                <span className="font-mono text-sm text-green-500 uppercase">{paper.effort.risk}</span>
                            </div>
                        </div>
                    </div>

                    {/* Statistical Integrity */}
                    <div className="border border-[#3C091E]/30 bg-[#050505] p-6">
                        <h3 className="font-mono text-[10px] text-white tracking-widest uppercase mb-4">
                            Statistical Integrity
                        </h3>
                        <ul className="space-y-2 font-mono text-[10px] uppercase tracking-widest">
                            <li className="flex justify-between border-b border-[#3C091E]/20 pb-2">
                                <span className="text-[#97494E]">MULTIPLE RUNS</span>
                                <span className={paper.integrity.multiRun ? "text-green-500" : "text-[#C02B0A]"}>{paper.integrity.multiRun ? "DETECTED" : "OMITTED"}</span>
                            </li>
                            <li className="flex justify-between border-b border-[#3C091E]/20 pb-2">
                                <span className="text-[#97494E]">CONF INTERVALS</span>
                                <span className={paper.integrity.confInterval ? "text-green-500" : "text-[#C02B0A]"}>{paper.integrity.confInterval ? "DETECTED" : "OMITTED"}</span>
                            </li>
                        </ul>
                        {paper.integrity.codeLink && (
                            <a href={paper.integrity.codeLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full p-3 border border-white/20 font-mono text-[9px] tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors">
                                <ExternalLink size={12} /> VERIFY PUBLIC REPO
                            </a>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
}
