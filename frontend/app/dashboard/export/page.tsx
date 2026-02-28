"use client";

import { useState } from "react";
import { DownloadCloud, Quote, FileText, CheckSquare, Layers, FileJson } from "lucide-react";
import { motion } from "framer-motion";

export default function ExportDraftsPage() {
    const [selectedFormat, setSelectedFormat] = useState("bibtex");

    const selectedPapers = [
        { id: "ARX-142", title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces" },
        { id: "ARX-811", title: "Direct Preference Optimization" },
        { id: "ARX-990", title: "Llama 2: Open Foundation and Fine-Tuned Chat Models" }
    ];

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-10">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6 shrink-0">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        G. Writing & Export Layer
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="DRAFTS & EXPORT">
                        DRAFTS & EXPORT
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Export Controls */}
                <div className="lg:col-span-1 space-y-6">

                    <div className="bg-[#050505] border border-[#3C091E]/30 p-6 clip-card-solais">
                        <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <Layers size={14} className="text-white" /> Target Selection
                        </h3>
                        <div className="space-y-3 font-mono text-[10px] text-white uppercase tracking-widest">
                            {selectedPapers.map(p => (
                                <div key={p.id} className="flex gap-3 items-center border border-[#3C091E]/20 p-2 hover:bg-[#3C091E]/10 transition-colors">
                                    <CheckSquare size={12} className="text-[#C02B0A]" />
                                    <span className="truncate flex-1">{p.id} - {p.title}</span>
                                </div>
                            ))}
                            <button className="w-full mt-4 p-2 border border-dashed border-[#3C091E] text-[#97494E] hover:text-[#C02B0A] hover:border-[#C02B0A] transition-colors">
                                + Select From Matrix
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#050505] border border-[#3C091E]/30 p-6 clip-card">
                        <h3 className="font-mono text-xs text-[#97494E] tracking-widest uppercase mb-6 flex items-center gap-2">
                            <FileJson size={14} className="text-white" /> Output Formats
                        </h3>
                        <div className="flex flex-col gap-2 font-mono text-xs tracking-widest uppercase">
                            {['bibtex', 'csv_matrix', 'related_work_draft'].map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => setSelectedFormat(fmt)}
                                    className={`p-3 border text-left flex items-center gap-3 transition-colors
                                ${selectedFormat === fmt
                                            ? 'bg-[#C02B0A]/10 border-[#C02B0A] text-[#C02B0A]'
                                            : 'bg-black border-[#3C091E]/30 text-white hover:border-[#97494E]'}`}
                                >
                                    {fmt === 'bibtex' && <Quote size={14} />}
                                    {fmt === 'csv_matrix' && <FileText size={14} />}
                                    {fmt === 'related_work_draft' && <Layers size={14} />}
                                    {fmt.replace(/_/g, " ")}
                                </button>
                            ))}
                        </div>

                        <button className="mt-8 w-full flex items-center justify-center gap-3 bg-[#3C091E] hover:bg-[#C02B0A] text-white p-4 font-mono text-xs tracking-widest uppercase transition-colors clip-button">
                            <DownloadCloud size={16} /> GENERATE ARTIFACT
                        </button>
                    </div>

                </div>

                {/* RIGHT: Live Preview */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#C02B0A]/30 p-8 clip-card relative overflow-hidden h-[600px] flex flex-col">

                    <div className="flex items-center justify-between border-b border-[#3C091E]/30 pb-4 mb-6 shrink-0">
                        <h3 className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase">
                            LIVE STREAM PREVIEW
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 font-mono text-xs text-white/80 leading-loose tracking-wide whitespace-pre-wrap">
                        {selectedFormat === 'bibtex' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <span className="text-[#C02B0A]">@inproceedings</span>{`{gu2023mamba,
   title={Mamba: Linear-Time Sequence Modeling with Selective State Spaces},
   author={Gu, Albert and Dao, Tri},
   booktitle={ArXiv},
   year={2023}
}`}<br /><br />
                                <span className="text-[#C02B0A]">@article</span>{`{rafailov2023dpo,
   title={Direct Preference Optimization: Your Language Model is Secretly a Reward Model},
   author={Rafailov, Rafael and Sharma, Archit and Mitchell, Eric and Manning, Christopher D and Ermon, Stefano and Finn, Chelsea},
   journal={NeurIPS},
   year={2023}
}`}
                            </motion.div>
                        )}

                        {selectedFormat === 'csv_matrix' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto text-[10px]">
                                ID, TITLE, AUTHORS, RCI_SCORE, REPRODUCIBILITY, DATASETS_USED, METHODS_USED<br />
                                ARX-142, "Mamba: Linear-Time Sequence Modeling...", "Gu, Dao", 94.2, 92, "Pile; SlimPajama", "Selective SSM"<br />
                                ARX-811, "Direct Preference Optimization...", "Rafailov et al.", 88.5, 96, "Anthropic HH; Reddit TLDR", "DPO"<br />
                                ARX-990, "Llama 2: Open Foundation...", "Touvron et al.", 90.0, 85, "Public Web Custom", "GQA; RLHF"
                            </motion.div>
                        )}

                        {selectedFormat === 'related_work_draft' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h4 className="font-bold text-white mb-4 text-sm font-sans uppercase">2. Related Work</h4>

                                <p className="mb-4">
                                    Recent advancements in foundation models have largely been driven by scaling transformer architectures [ARX-990] and refining alignment techniques. While Reinforcement Learning from Human Feedback (RLHF) established the standard for model alignment, it suffers from significant optimization instability. <span className="bg-[#3C091E] text-white px-1">To address this, [ARX-811] introduced Direct Preference Optimization (DPO), which elegantly circumvents the need for an explicit reward model by re-parameterizing the policy itself.</span>
                                </p>

                                <p>
                                    Concurrently, the quadratic scaling bottleneck of self-attention has motivated the search for sub-quadratic alternatives. <span className="bg-[#3C091E] text-white px-1">Among recent state-space models, Mamba [ARX-142] has demonstrated strong empirical results by incorporating data-dependent selectivity.</span> Our work builds directly upon the hardware-aware selective scan mechanisms detailed by Gu and Dao, while addressing the missing reproducibility constraints identified during the evaluation of DPO [ARX-811].
                                </p>

                                <div className="mt-8 p-4 border border-[#C02B0A]/30 bg-black text-[#C02B0A] text-[9px] uppercase tracking-widest">
                                    [SYS] Arxion positioned your draft by bridging [ARX-990] base scaling with [ARX-811] alignment and [ARX-142] hardware bottlenecks.
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Solais scan line */}
                    <div className="absolute left-0 top-0 w-full h-[1px] bg-[#C02B0A]/50 shadow-[0_0_15px_rgba(192,43,10,1)] z-10 animate-[scan_3s_ease-in-out_infinite]" />
                    <style jsx>{`
                 @keyframes scan {
                    0% { top: -10px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                 }
              `}</style>

                </div>

            </div>

        </div>
    );
}
