"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://localhost:8000/api/v1";

export default function LiveProcessingPage() {
    const [paperId, setPaperId] = useState("");
    const [events, setEvents] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    const wsUrl = useMemo(() => {
        const base = "ws://localhost:8000/api/v1/processing/stream";
        return paperId.trim() ? `${base}?paper_id=${encodeURIComponent(paperId.trim())}` : base;
    }, [paperId]);

    useEffect(() => {
        void fetchHistory();
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [wsUrl]);

    async function fetchHistory() {
        try {
            const res = await fetch(`${API}/processing/events`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (e) {
            console.error("Failed to fetch event history:", e);
        }
    }

    function connect() {
        if (wsRef.current) wsRef.current.close();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send("subscribe");
        };

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                setEvents((prev) => [...prev.slice(-299), data]);
            } catch {
                // Ignore malformed event
            }
        };

        ws.onerror = (e) => {
            console.error("WebSocket error:", e);
        };
    }

    return (
        <div className="h-full w-full max-w-[1200px] mx-auto flex flex-col gap-6 pb-8">
            <div className="border-b border-[#1e293b]/30 pb-6">
                <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2">System Level</div>
                <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase">Live Processing Feed</h1>
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-5 flex flex-col md:flex-row gap-3 md:items-center">
                <input
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                    placeholder="Optional: filter by Paper ID"
                    className="bg-black border border-[#1e293b] px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#ef4444]"
                />
                <button onClick={fetchHistory} className="px-3 py-2 border border-[#ef4444]/60 text-[#ef4444] text-[10px] font-mono uppercase tracking-[0.2em]">Refresh History</button>
                <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">Streaming {paperId.trim() ? `for ${paperId}` : "all papers"}</span>
            </div>

            <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-5">
                <div className="font-mono text-[10px] text-[#ef4444] uppercase tracking-[0.22em] mb-3">Events ({events.length})</div>
                <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
                    {events.map((e, idx) => (
                        <div key={idx} className="bg-black border border-[#1e293b]/40 p-3">
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                                <span className="text-[#ef4444]">{e.status}</span>
                                <span className="text-white">{e.stage}</span>
                                <span className="text-[#94a3b8]">{e.paper_id}</span>
                                <span className="text-[#1e293b]">{e.timestamp}</span>
                            </div>
                            <div className="text-sm text-white/80 mt-2">{e.message}</div>
                            <pre className="text-xs text-[#94a3b8] mt-2 overflow-auto">{JSON.stringify(e.payload || {}, null, 2)}</pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
