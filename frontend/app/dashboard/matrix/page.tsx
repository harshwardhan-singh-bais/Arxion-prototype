"use client";

import { useEffect, useState } from "react";
import { Filter, CheckCircle2, AlertOctagon, Link as LinkIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, type MatrixRow, triggerDownload } from "@/lib/api";

export default function LitMatrixPage() {
    const [papers, setPapers] = useState<MatrixRow[]>([]);
    const [avgRci, setAvgRci] = useState(0);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filterTag, setFilterTag] = useState("");
    const router = useRouter();

    const fetchMatrix = (tag?: string) => {
        setLoading(true);
        api.getMatrix({ tag: tag || undefined })
            .then((r) => { setPapers(r.papers); setAvgRci(r.avg_rci); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchMatrix(); }, []);

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const blob = await api.exportCSV();
            triggerDownload(blob, "arxion_matrix.csv");
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col gap-8 max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#3C091E]/30 pb-6">
                <div>
                    <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                        <div className="w-4 h-0.5 bg-[#C02B0A]" />
                        C. Multi-Paper Intelligence
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="LITERATURE MATRIX">
                        LITERATURE MATRIX
                    </h1>
                    {!loading && (
                        <p className="font-mono text-[10px] text-[#97494E] mt-2 uppercase tracking-widest">
                            {papers.length} papers · avg RCI {avgRci}%
                        </p>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Filter by tag..."
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchMatrix(filterTag)}
                        className="bg-black border border-[#3C091E]/50 text-white font-mono text-[10px] px-4 py-2 uppercase tracking-widest placeholder:text-[#3C091E] focus:border-[#C02B0A] outline-none"
                    />
                    <button
                        onClick={() => fetchMatrix(filterTag)}
                        className="flex items-center gap-2 border border-[#3C091E]/50 px-4 py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-[#C02B0A]/10 hover:text-[#C02B0A] transition-colors text-white"
                    >
                        <Filter size={14} /> Filter
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting || papers.length === 0}
                        className="flex items-center gap-2 border border-[#3C091E]/50 px-4 py-2 font-mono text-[10px] tracking-widest uppercase bg-[#3C091E] text-white hover:bg-[#C02B0A] transition-colors clip-button disabled:opacity-40"
                    >
                        {exporting ? <Loader2 size={14} className="animate-spin" /> : null}
                        Export Matrix CSV
                    </button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="w-full overflow-x-auto bg-[#050505] border border-[#3C091E]/30 clip-card">
                {loading ? (
                    <div className="flex items-center justify-center py-20 font-mono text-[10px] text-[#97494E] uppercase tracking-widest">
                        <Loader2 size={16} className="animate-spin mr-3 text-[#C02B0A]" />
                        LOADING MATRIX...
                    </div>
                ) : papers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="font-mono text-[10px] text-[#97494E] uppercase tracking-widest">NO PAPERS PROCESSED YET</p>
                        <p className="font-mono text-[9px] text-[#3C091E] uppercase">Upload PDFs via the Data Pipeline to populate the matrix.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#3C091E]/30 bg-[#1A030A]">
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">ID</th>
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Paper Title</th>
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Arxion RCI</th>
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Datasets</th>
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Methods</th>
                                <th className="p-4 font-mono text-[10px] tracking-widest text-[#97494E] uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {papers.map((paper) => (
                                <tr
                                    key={paper.paper_id}
                                    onClick={() => router.push(`/dashboard/paper/${paper.paper_id}`)}
                                    className="border-b border-[#3C091E]/10 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                >
                                    <td className="p-4 font-mono text-xs text-[#C02B0A] group-hover:underline">
                                        {paper.paper_id.slice(0, 8).toUpperCase()}
                                    </td>

                                    <td className="p-4 max-w-sm">
                                        <h4 className="font-sans text-sm font-bold text-white mb-1 group-hover:text-[#C02B0A] transition-colors line-clamp-1">
                                            {paper.title}
                                        </h4>
                                        <span className="font-mono text-[9px] text-[#97494E] uppercase">
                                            {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-1 bg-black overflow-hidden">
                                                <div
                                                    className={`h-full ${paper.rci > 90 ? 'bg-green-500' : paper.rci > 70 ? 'bg-yellow-500' : 'bg-[#C02B0A]'}`}
                                                    style={{ width: `${paper.rci}%` }}
                                                />
                                            </div>
                                            <span className="font-mono text-xs text-white">{paper.rci.toFixed(1)}</span>
                                            <span className="font-mono text-[9px] text-[#97494E]">({paper.grade})</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {paper.datasets.slice(0, 3).map(d => (
                                                <span key={d} className="px-2 py-0.5 border border-[#3C091E]/50 text-[9px] font-mono uppercase text-[#97494E] bg-black">
                                                    {d}
                                                </span>
                                            ))}
                                            {paper.datasets.length > 3 && (
                                                <span className="text-[9px] font-mono text-[#97494E]">+{paper.datasets.length - 3}</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 font-mono text-xs text-white uppercase">
                                        {paper.methods.slice(0, 2).join(", ")}
                                    </td>

                                    <td className="p-4">
                                        {paper.status === "VERIFIED" && (
                                            <span className="flex items-center gap-2 text-[10px] font-mono text-green-500 uppercase">
                                                <CheckCircle2 size={12} /> Verified
                                            </span>
                                        )}
                                        {paper.status === "BASELINE" && (
                                            <span className="flex items-center gap-2 text-[10px] font-mono text-blue-500 uppercase">
                                                <LinkIcon size={12} /> Root Baseline
                                            </span>
                                        )}
                                        {paper.status === "CONTRADICTION" && (
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-2 text-[10px] font-mono text-[#C02B0A] uppercase">
                                                    <AlertOctagon size={12} /> Contradiction
                                                </span>
                                                {paper.top_flag && (
                                                    <span className="text-[8px] text-[#97494E] font-mono uppercase truncate max-w-[150px]">
                                                        {paper.top_flag.replace(/_/g, " ")}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {!["VERIFIED", "BASELINE", "CONTRADICTION"].includes(paper.status) && (
                                            <span className="text-[10px] font-mono text-[#97494E] uppercase">{paper.status}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
