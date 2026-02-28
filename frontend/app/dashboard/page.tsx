"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Code, CheckCircle2, ChevronRight, FileX2 } from "lucide-react";

// Mock Data for the Heatmap / Chart
const data = [
    { name: 'Jan', RCI: 42, Saturation: 80, Contradictions: 10 },
    { name: 'Feb', RCI: 48, Saturation: 76, Contradictions: 15 },
    { name: 'Mar', RCI: 53, Saturation: 65, Contradictions: 12 },
    { name: 'Apr', RCI: 50, Saturation: 70, Contradictions: 8 },
    { name: 'May', RCI: 65, Saturation: 50, Contradictions: 30 },
    { name: 'Jun', RCI: 78, Saturation: 30, Contradictions: 5 },
    { name: 'Jul', RCI: 82, Saturation: 25, Contradictions: 2 },
];

function MetricCard({ title, value, sub, warning = false }: any) {
    return (
        <div className={`p-6 bg-black/40 border border-[#3C091E]/30 relative overflow-hidden group hover:border-[#C02B0A]/50 transition-colors`}>
            {warning && (
                <div className="absolute top-0 right-0 p-2 text-[#C02B0A]">
                    <AlertTriangle size={16} />
                </div>
            )}
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#97494E] mb-2">{title}</h4>
            <div className="text-4xl font-display font-black text-white tracking-tighter mb-4">
                {value}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#3C091E] flex items-center justify-between border-t border-[#3C091E]/20 pt-4">
                <span>{sub}</span>
                <ChevronRight size={12} />
            </div>

            {/* Hover Glitch Accent */}
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
        </div>
    );
}

export default function FieldHealthDashboard() {
    return (
        <div className="h-full w-full flex flex-col gap-8">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        Global Intelligence
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="FIELD HEALTH">
                        FIELD HEALTH
                    </h1>
                </div>
                <div className="font-mono text-xs text-[#97494E] text-right">
                    LAST UPDATED<br />
                    <span className="text-white">2026-02-28 14:15:47 UTC</span>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Arxion Credibility (RCI)" value="82.4%" sub="Global Field Average" />
                <MetricCard title="Public Code Avail." value="34.1%" sub="12% decline vs 2025" warning />
                <MetricCard title="Hyperparam Veil" value="68.9%" sub="Training params missing" warning />
                <MetricCard title="Total Ingested" value="14,092" sub="Papers verified" />
            </div>

            {/* Chart & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">

                {/* Left Side Chart - RCI Over Time */}
                <div className="lg:col-span-2 bg-[#050505] border border-[#3C091E]/30 p-6 flex flex-col relative clip-card-solais">

                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#97494E]">Credibility Trend vs Dataset Saturation</h3>
                        <div className="flex gap-4 font-mono text-[9px] tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#C02B0A]" /> RCI SCORE</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#3C091E]" /> SATURATION</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRCI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C02B0A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#C02B0A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#3C091E" tick={{ fill: '#97494E', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#3C091E" tick={{ fill: '#97494E', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#050505', borderColor: '#C02B0A', fontFamily: 'monospace', fontSize: '10px', borderRadius: 0 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="step" dataKey="RCI" stroke="#C02B0A" strokeWidth={2} fillOpacity={1} fill="url(#colorRCI)" />
                                <Area type="monotone" dataKey="Saturation" stroke="#3C091E" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Right Side - Live Epistemic Feed */}
                <div className="bg-black/60 border border-[#3C091E]/30 p-6 flex flex-col clip-card overflow-hidden">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-[#C02B0A] mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[#C02B0A] animate-pulse" />
                        LIVE CONTRADICTIONS
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-mono">
                        {[
                            { id: "1029", flag: "ONTOLOGICAL", title: "Mamba-7B Attention Claim", issue: "Contradicts standard baseline definition of non-linear attention." },
                            { id: "4491", flag: "MISSING_DATA", title: "RLHF Policy Optimization", issue: "Rewards model omitted. Cannot reproduce 99% win-rate claim." },
                            { id: "8823", flag: "SATURATED", title: "GSM8K Evaluation", issue: "Dataset completely saturated. Marginal gain statistically insignificant." },
                            { id: "9122", flag: "HARDWARE", title: "100K Token Context Window", issue: "Compute asymmetry required 8x H100s, not disclosed in abstract." },
                        ].map((feed, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="p-4 bg-[#050505] border border-[#3C091E]/20 hover:border-[#C02B0A] transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] tracking-widest text-[#3C091E]">ID: {feed.id}</span>
                                    <span className="text-[9px] bg-[#3C091E] text-white px-2 py-0.5 tracking-wider">{feed.flag}</span>
                                </div>
                                <h5 className="text-white text-xs mb-2 font-bold">{feed.title}</h5>
                                <p className="text-[10px] text-[#97494E] leading-relaxed">{feed.issue}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
