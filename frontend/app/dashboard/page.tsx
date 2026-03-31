"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Code, CheckCircle2, ChevronRight, FileX2 } from "lucide-react";
import axios from "axios";

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
        <div className={`p-4 bg-white/5 border border-[#1e293b]/30 relative overflow-hidden group hover:border-[#ef4444]/50 transition-colors flex flex-col justify-between`}>
            {warning && (
                <div className="absolute top-0 right-0 p-2 text-[#ef4444]">
                    <AlertTriangle size={16} />
                </div>
            )}
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] mb-2 pr-6 leading-tight">{title}</h4>
            <div className="text-2xl lg:text-3xl font-display font-black text-white tracking-tighter mb-4 truncate">
                {value}
            </div>
            <div className="font-mono text-[8px] uppercase tracking-widest text-[#1e293b] flex items-center justify-between border-t border-[#1e293b]/20 mt-auto pt-3">
                <span>{sub}</span>
                <ChevronRight size={12} />
            </div>

            {/* Hover Glitch Accent */}
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#ef4444] group-hover:h-full transition-all duration-300" />
        </div>
    );
}

export default function FieldHealthDashboard() {
    const [stats, setStats] = useState({
        totalPapers: 0,
        rciDisplay: "--",
        codeAvailability: "--",
        reproducibility: "--",
        saturation: "--",
        totalFeatures: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [papersRes, healthRes, featuresRes] = await Promise.all([
                    axios.get("http://localhost:8000/api/v1/papers"),
                    axios.get("http://localhost:8000/api/v1/layer2/field-health"),
                    axios.get("http://localhost:8000/api/v1/features"),
                ]);
                const papers = papersRes.data;
                const health = healthRes.data;
                const features = featuresRes.data;
                setStats({
                    totalPapers: papers.length,
                    rciDisplay: papers.length > 0 ? `${health.overall_health_score}%` : "--",
                    codeAvailability: `${health.code_availability_rate}%`,
                    reproducibility: `${health.reproducibility_rate}%`,
                    saturation: `${health.benchmark_saturation_score}%`,
                    totalFeatures: features.length,
                });
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, []);
    return (
        <div className="h-full w-full flex flex-col gap-8">

            {/* Top Header */}
            <div className="flex justify-between items-end border-b border-[#1e293b]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#ef4444]" />
                        Global Intelligence
                    </div>
                    <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="FIELD HEALTH">
                        FIELD HEALTH
                    </h1>
                </div>
                <div className="font-mono text-xs text-[#94a3b8] text-right">
                    LAST UPDATED<br />
                    <span className="text-white">2026-02-28 14:15:47 UTC</span>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Arxion Credibility (RCI)" value={stats.rciDisplay} sub="Global Field Average" />
                <MetricCard title="Public Code Avail." value={stats.codeAvailability} sub="Papers with public code" />
                <MetricCard title="Reproducibility" value={stats.reproducibility} sub="Papers with disclosed hyperparams" />
                <MetricCard title="Total Ingested" value={stats.totalPapers.toString()} sub="Papers verified" />
            </div>

            {/* Chart & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">

                {/* Left Side Chart - RCI Over Time */}
                <div className="lg:col-span-2 bg-[#0b0f19] border border-[#1e293b]/30 p-6 flex flex-col relative clip-card-solais">

                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#94a3b8]">Credibility Trend vs Dataset Saturation</h3>
                        <div className="flex gap-4 font-mono text-[9px] tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ef4444]" /> RCI SCORE</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#1e293b]" /> SATURATION</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRCI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#1e293b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#1e293b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#ef4444', fontFamily: 'monospace', fontSize: '10px', borderRadius: 0 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="step" dataKey="RCI" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRCI)" />
                                <Area type="monotone" dataKey="Saturation" stroke="#1e293b" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Right Side - Live Epistemic Feed */}
                <div className="bg-white/[0.06] border border-[#1e293b]/30 p-6 flex flex-col clip-card overflow-hidden">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-[#ef4444] mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[#ef4444] animate-pulse" />
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
                                className="p-4 bg-[#0b0f19] border border-[#1e293b]/20 hover:border-[#ef4444] transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] tracking-widest text-[#1e293b]">ID: {feed.id}</span>
                                    <span className="text-[9px] bg-[#1e293b] text-white px-2 py-0.5 tracking-wider">{feed.flag}</span>
                                </div>
                                <h5 className="text-white text-xs mb-2 font-bold">{feed.title}</h5>
                                <p className="text-[10px] text-[#94a3b8] leading-relaxed">{feed.issue}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
