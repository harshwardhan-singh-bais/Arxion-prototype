"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, ShieldAlert, FileText, Database, Code, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-glow mb-2">Platform Dashboard</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Engine Active • 1,204 papers indexed • 14 domains tracked
                </p>
            </div>

            {/* Top Metrics - Field Health & Credibility Index */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Global Credibility Index"
                    value="78 / 100"
                    trend="+2.5"
                    subtitle="Avg. over last 30 days"
                    icon={<ShieldCheck className="w-4 h-4 text-primary" />}
                />
                <MetricCard
                    title="Code Availability"
                    value="42%"
                    trend="-1.2"
                    subtitle="Papers supplying repositories"
                    icon={<Code className="w-4 h-4 text-emerald-500" />}
                />
                <MetricCard
                    title="Saturated Datasets"
                    value="14"
                    trend="+3"
                    subtitle="Flagged for overuse"
                    icon={<Database className="w-4 h-4 text-orange-500" />}
                />
                <MetricCard
                    title="Active Contradictions"
                    value="89"
                    trend="High"
                    subtitle="Conflicts across claims"
                    icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* Gap Intelligence Feed */}
                <Card className="col-span-1 lg:col-span-4 glass-card border-white/5 bg-black/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-secondary" />
                            Gap Intelligence Feed
                        </CardTitle>
                        <CardDescription>
                            Autonomous opportunities surfaced by the engine.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <GapItem
                            title="Untried Combination: LLaMA-3 + MIMIC-IV"
                            description="81 papers use MIMIC-IV and 40 use LLaMA variants, but 0 apply LLaMA-3 specifically to this dataset. High potential for novel benchmark."
                            confidence={92}
                            type="Missing Combo"
                        />
                        <GapItem
                            title="Contradictory Results on CIFAR-100 Accuracy"
                            description="Paper A claims 89.2% with Method X, while Paper B reports 81.5% and attributes failure to convergence issues. Needs independent replication."
                            confidence={88}
                            type="Contradiction"
                        />
                        <GapItem
                            title="Metric Underexploration: Inference Latency"
                            description="Only 12% of papers in the visual transformers domain report inference latency, despite edge deployment claims."
                            confidence={75}
                            type="Field Stagnation"
                        />
                    </CardContent>
                </Card>

                {/* Recent Ingestions Pipeline */}
                <Card className="col-span-1 lg:col-span-3 glass-card border-white/5 bg-black/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Ingestion Pipeline
                        </CardTitle>
                        <CardDescription>
                            Real-time extraction status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <IngestStatus title="Attention Is All You Need.pdf" status="PROCESSED" time="2m ago" />
                            <IngestStatus title="Llama 3 Technical Report.pdf" status="PROCESSING" time="Just now" />
                            <IngestStatus title="Mamba Linear State Spaces.pdf" status="PROCESSED" time="1h ago" />
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5">
                            <Button className="w-full bg-white/5 hover:bg-white/10" variant="secondary" asChild>
                                <Link href="/upload">Upload New Paper</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

function MetricCard({ title, value, trend, subtitle, icon }: { title: string, value: string, trend: string, subtitle: string, icon: React.ReactNode }) {
    const isPositive = trend.includes("+") || trend === "High";
    return (
        <Card className="glass-card border-white/5 bg-black/40 hover:bg-white/[0.02] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                        {trend}
                    </span>
                    {subtitle}
                </div>
            </CardContent>
        </Card>
    );
}

function GapItem({ title, description, confidence, type }: { title: string, description: string, confidence: number, type: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-[15px] group-hover:text-primary transition-colors pr-4">{title}</h4>
                <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                    {type}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                {description}
            </p>
            <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Confidence</span>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${confidence}%` }} />
                    </div>
                    <span className="text-white">{confidence}%</span>
                </div>
                <span className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                    Investigate <ArrowUpRight className="w-3 h-3 ml-1" />
                </span>
            </div>
        </motion.div>
    );
}

function IngestStatus({ title, status, time }: { title: string, status: string, time: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full shrink-0 ${status === "PROCESSED" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`} />
                <div className="truncate text-sm font-medium pr-4">{title}</div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">{time}</div>
        </div>
    );
}
