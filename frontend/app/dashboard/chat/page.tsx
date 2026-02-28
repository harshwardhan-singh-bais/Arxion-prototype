"use client";

import { useState } from "react";
import { Send, CornerDownLeft, Database, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatMatrixPage() {
    const [query, setQuery] = useState("");
    const [chat, setChat] = useState([
        {
            role: "system",
            content: "ARXION KNOWLEDGE MATRIX ACTIVE. 14,092 VECTORS LOADED. ENTER QUERY.",
            sources: []
        },
        {
            role: "user",
            content: "What is the primary contradiction between ARX-711 and ARX-992 regarding sequence length scaling?",
            sources: []
        },
        {
            role: "assistant", // "matrix"
            content: "Based on the extracted baseline statements, ARX-711 claims O(N) scaling using a Mamba-derived state-space formulation. However, ARX-992's empirical ablation study (Table 4) demonstrates O(N log N) degradation when sequence length exceeds 32K tokens in actual multi-node deployments. This represents a 43% performance contradiction in assumed theoretical capability versus hardware execution.",
            sources: [
                { id: "ARX-711", section: "Abstract", conf: 0.92 },
                { id: "ARX-992", section: "4.1 Extrapolation", conf: 0.88 },
            ]
        }
    ]);

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-4">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6 shrink-0">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        F. Research Exploration
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="MATRIX TERMINAL">
                        MATRIX TERMINAL
                    </h1>
                </div>
            </div>

            {/* Chat Display */}
            <div className="flex-1 overflow-y-auto space-y-6 flex flex-col clip-card-solais border border-[#3C091E]/30 bg-[#050505] p-8">
                {chat.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-4xl ${msg.role === 'user' ? 'items-end self-end text-right' : 'items-start self-start'}`}
                    >
                        {/* Roles */}
                        <div className={`font-mono text-[9px] uppercase tracking-widest mb-1 opacity-60 flex items-center gap-2 ${msg.role === 'user' ? 'text-white' : 'text-[#C02B0A]'}`}>
                            {msg.role === "system" ? <Database size={10} /> : null}
                            {msg.role}
                        </div>

                        {/* Message Box */}
                        <div className={`p-4 font-mono text-sm leading-relaxed uppercase tracking-wide border clip-card ${msg.role === 'user' ? 'bg-[#3C091E]/20 border-[#3C091E] text-white' : msg.role === 'system' ? 'border-[#C02B0A]/50 bg-black text-[#C02B0A]' : 'bg-[#0a0a0a] border-white/10 text-[#f0f0f0]'}`}>
                            {msg.content}
                        </div>

                        {/* Sources (if Matrix Assistant) */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {msg.sources.map((src, j) => (
                                    <div key={j} className="flex items-center gap-2 border border-[#C02B0A]/30 bg-[#1A030A] px-2 py-1 cursor-pointer hover:border-[#C02B0A] hover:bg-[#C02B0A]/10 transition-colors">
                                        <span className="text-[9px] font-mono text-[#C02B0A] uppercase tracking-widest">{src.id}</span>
                                        <span className="text-[8px] font-mono text-[#97494E] uppercase truncate max-w-[100px]">{src.section}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Input Area */}
            <div className="shrink-0 relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="QUERY THE KNOWLEDGE MATRIX..."
                    className="w-full bg-[#050505] border-2 border-[#3C091E] focus:border-[#C02B0A] outline-none text-white font-mono uppercase tracking-widest px-6 py-6 pr-24 clip-card transition-colors placeholder:text-[#3C091E]"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-[#3C091E] hover:bg-[#C02B0A] text-white transition-colors clip-button">
                    <CornerDownLeft size={18} />
                </button>
            </div>

        </div>
    );
}
