"use client";

import { useState } from "react";
import { Send, CornerDownLeft, Database, Search } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function ChatMatrixPage() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState([
        {
            role: "system",
            content: "ARXION KNOWLEDGE MATRIX ACTIVE. WAITING FOR QUERY TO ANALYZE EXTRACTED LITERATURE.",
            sources: [] as Array<{ id: string, section: string, conf: number }>
        }
    ]);

    const handleSend = async () => {
        if (!query.trim() || isLoading) return;

        const text = query;
        setQuery("");
        setChat(prev => [...prev, { role: "user", content: text, sources: [] }]);
        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:8000/api/v1/chat", {
                query: text,
                paper_ids: null // Will search across all ingested papers
            });

            const answer = res.data.answer;
            const citations = res.data.citations.map((c: any) => ({
                id: c.paper_id,
                section: `Chunk ${c.chunk_index}`,
                conf: parseFloat(c.score).toFixed(2)
            }));

            setChat(prev => [...prev, {
                role: "assistant",
                content: answer,
                sources: citations
            }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setChat(prev => [...prev, {
                role: "system",
                content: "NETWORK ERROR: COULD NOT CONNECT TO ARXION MATRIX CORE.",
                sources: []
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-4">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#1e293b]/30 pb-6 shrink-0">
                <div>
                    <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#ef4444]" />
                        F. Research Exploration
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="MATRIX TERMINAL">
                        MATRIX TERMINAL
                    </h1>
                </div>
            </div>

            {/* Chat Display */}
            <div className="flex-1 overflow-y-auto space-y-6 flex flex-col clip-card-solais border border-[#1e293b]/30 bg-[#0b0f19] p-8">
                {chat.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-4xl ${msg.role === 'user' ? 'items-end self-end text-right' : 'items-start self-start'}`}
                    >
                        {/* Roles */}
                        <div className={`font-mono text-[9px] uppercase tracking-widest mb-1 opacity-60 flex items-center gap-2 ${msg.role === 'user' ? 'text-white' : 'text-[#ef4444]'}`}>
                            {msg.role === "system" ? <Database size={10} /> : null}
                            {msg.role}
                        </div>

                        {/* Message Box */}
                        <div className={`p-4 font-mono text-sm leading-relaxed uppercase tracking-wide border clip-card ${msg.role === 'user' ? 'bg-[#1e293b]/20 border-[#1e293b] text-white' : msg.role === 'system' ? 'border-[#ef4444]/50 bg-black text-[#ef4444]' : 'bg-[#0d111c] border-white/10 text-[#f0f0f0]'}`}>
                            {msg.content}
                        </div>

                        {/* Sources (if Matrix Assistant) */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {msg.sources.map((src, j) => (
                                    <div key={j} className="flex items-center gap-2 border border-[#ef4444]/30 bg-[#0f172a] px-2 py-1 cursor-pointer hover:border-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                                        <span className="text-[9px] font-mono text-[#ef4444] uppercase tracking-widest">{src.id}</span>
                                        <span className="text-[8px] font-mono text-[#94a3b8] uppercase truncate max-w-[100px]">{src.section}</span>
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
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    placeholder={isLoading ? "ANALYZING LITERATURE..." : "QUERY THE KNOWLEDGE MATRIX..."}
                    disabled={isLoading}
                    className="w-full bg-[#0b0f19] border-2 border-[#1e293b] focus:border-[#ef4444] outline-none text-white font-mono uppercase tracking-widest px-6 py-6 pr-24 clip-card transition-colors placeholder:text-[#1e293b] disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-[#1e293b] hover:bg-[#ef4444] text-white transition-colors clip-button disabled:bg-[#1e293b]/50"
                >
                    <CornerDownLeft size={18} />
                </button>
            </div>

        </div>
    );
}
