"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { api, type FieldHealth, type CredibilitySummary } from "@/lib/api";

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({ title, value, sub, warning = false }: {
    title: string; value: string; sub: string; warning?: boolean;
}) {
    return (
        <div className="p-6 bg-black/40 border border-[#3C091E]/30 relative overflow-hidden group hover:border-[#C02B0A]/50 transition-colors">
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
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#C02B0A] group-hover:h-full transition-all duration-300" />
        </div>
    );
}

// ── Grade chart derives grade label → month by using grade_distribution ────────
function gradeToChartData(dist: Record<string, number>) {
    return Object.entries(dist).map(([grade, count]) => ({
        name: grade,
        Papers: count,
    }));
}

export default function FieldHealthDashboard() {
    const [health, setHealth] = useState<FieldHealth | null>(null);
    const [summary, setSummary] = useState<CredibilitySummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getFieldHealth(), api.getCredibilitySummary()])
            .then(([h, s]) => { setHealth(h); setSummary(s); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

    // Build grade distribution chart data from back-end
    const chartData = health
        ? gradeToChartData(health.grade_distribution)
        : [];

    return (
        <div className="h-full w-full flex flex-col gap-8">

            {/* Header */}
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
                    <span className="text-white">{now}</span>
                </div>
            </div>

            {/* KPI Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-6 bg-black/40 border border-[#3C091E]/30 animate-pulse h-32" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Arxion Avg RCI"
                        value={`${health?.avg_rci ?? 0}%`}
                        sub={`${health?.processed_papers ?? 0} papers processed`}
                    />
                    <MetricCard
                        title="Public Code Avail."
                        value={`${health?.pct_public_code ?? 0}%`}
                        sub="Papers with code link"
                        warning={(health?.pct_public_code ?? 100) < 50}
                    />
                    <MetricCard
                        title="Hyperparam Disclosure"
                        value={`${health?.pct_full_hyperparams ?? 0}%`}
                        sub="Full training params disclosed"
                        warning={(health?.pct_full_hyperparams ?? 100) < 50}
                    />
                    <MetricCard
                        title="Total Ingested"
                        value={String(health?.total_papers ?? 0)}
                        sub="Papers in matrix"
                    />
                </div>
            )}

            {/* Chart + Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">

                {/* Grade Distribution Chart */}
                <div className="lg:col-span-2 bg-[#050505] border border-[#3C091E]/30 p-6 flex flex-col relative clip-card-solais">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#97494E]">
                            Grade Distribution (A–F)
                        </h3>
                        <div className="flex gap-4 font-mono text-[9px] tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#C02B0A]" /> PAPERS</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
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
                                <Area type="step" dataKey="Papers" stroke="#C02B0A" strokeWidth={2} fillOpacity={1} fill="url(#colorGrade)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dataset Overuse Feed */}
                <div className="bg-black/60 border border-[#3C091E]/30 p-6 flex flex-col clip-card overflow-hidden">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-[#C02B0A] mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[#C02B0A] animate-pulse" />
                        DATASET OVERUSE
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-mono">
                        {health?.dataset_overuse?.length ? health.dataset_overuse.map((ds, i) => (
                            <motion.div
                                key={ds.name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 bg-[#050505] border border-[#3C091E]/20 hover:border-[#C02B0A] transition-colors"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h5 className="text-white text-xs font-bold truncate max-w-[130px]">{ds.name}</h5>
                                    <span className="text-[9px] bg-[#3C091E] text-white px-2 py-0.5">{ds.count}x</span>
                                </div>
                                <div className="w-full h-0.5 bg-[#3C091E]">
                                    <div
                                        className="h-full bg-[#C02B0A]"
                                        style={{ width: `${Math.min(100, (ds.count / (health.dataset_overuse[0]?.count || 1)) * 100)}%` }}
                                    />
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-[10px] text-[#97494E] uppercase tracking-widest mt-4">
                                NO PAPERS PROCESSED YET
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
