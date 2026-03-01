"use client";

import { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Database, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type ChatSource } from "@/lib/api";

interface Message {
    role: "system" | "user" | "assistant";
    content: string;
    sources?: ChatSource[];
}

const INITIAL_MESSAGES: Message[] = [
    {
        role: "system",
        content: "ARXION KNOWLEDGE MATRIX ACTIVE. ENTER YOUR RESEARCH QUERY BELOW.",
        sources: [],
    },
];

export default function ChatMatrixPage() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const q = query.trim();
        if (!q || loading) return;

        setQuery("");
        setMessages(prev => [...prev, { role: "user", content: q, sources: [] }]);
        setLoading(true);

        try {
            const response = await api.chat(q);
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: response.answer,
                    sources: response.sources,
                },
            ]);
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                {
                    role: "system",
                    content: `SYSTEM ERROR: ${err?.message ?? "NETWORK UNREACHABLE. CHECK BACKEND CONNECTION."}`,
                    sources: [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1200px] mx-auto pb-4">

            {/* Header */}
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
            <div className="flex-1 overflow-y-auto space-y-6 flex flex-col clip-card-solais border border-[#3C091E]/30 bg-[#050505] p-8 min-h-0">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-4xl ${msg.role === "user" ? "items-end self-end text-right" : "items-start self-start"}`}
                    >
                        {/* Role label */}
                        <div className={`font-mono text-[9px] uppercase tracking-widest mb-1 opacity-60 flex items-center gap-2 ${msg.role === "user" ? "text-white" : "text-[#C02B0A]"}`}>
                            {msg.role === "system" && <Database size={10} />}
                            {msg.role}
                        </div>

                        {/* Message box */}
                        <div className={`p-4 font-mono text-sm leading-relaxed uppercase tracking-wide border clip-card ${msg.role === "user"
                            ? "bg-[#3C091E]/20 border-[#3C091E] text-white"
                            : msg.role === "system"
                                ? "border-[#C02B0A]/50 bg-black text-[#C02B0A]"
                                : "bg-[#0a0a0a] border-white/10 text-[#f0f0f0]"
                            }`}>
                            {msg.content}
                        </div>

                        {/* Source chips */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {msg.sources.map((src, j) => (
                                    <div
                                        key={j}
                                        className="flex items-center gap-2 border border-[#C02B0A]/30 bg-[#1A030A] px-2 py-1 cursor-pointer hover:border-[#C02B0A] hover:bg-[#C02B0A]/10 transition-colors"
                                        title={src.snippet}
                                    >
                                        <span className="text-[9px] font-mono text-[#C02B0A] uppercase tracking-widest">
                                            {src.paper_id.slice(0, 8).toUpperCase()}
                                        </span>
                                        <span className="text-[8px] font-mono text-[#97494E] uppercase truncate max-w-[120px]">
                                            {src.section ?? src.title?.slice(0, 20)}
                                        </span>
                                        <span className="text-[8px] font-mono text-[#3C091E]">
                                            {(src.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 font-mono text-[10px] text-[#C02B0A] uppercase"
                        >
                            <Loader2 size={12} className="animate-spin" />
                            QUERYING KNOWLEDGE MATRIX...
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="QUERY THE KNOWLEDGE MATRIX..."
                    disabled={loading}
                    className="w-full bg-[#050505] border-2 border-[#3C091E] focus:border-[#C02B0A] outline-none text-white font-mono uppercase tracking-widest px-6 py-6 pr-24 clip-card transition-colors placeholder:text-[#3C091E] disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !query.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-[#3C091E] hover:bg-[#C02B0A] text-white transition-colors clip-button disabled:opacity-40"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CornerDownLeft size={18} />}
                </button>
            </div>
        </div>
    );
}
