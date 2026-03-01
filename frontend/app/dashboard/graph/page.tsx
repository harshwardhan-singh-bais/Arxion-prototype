"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Layers, FileText, Settings2, Loader2 } from "lucide-react";
import { api, type GraphNode, type GraphEdge } from "@/lib/api";

// ── Fallback icon for dataset nodes ───────────────────────────────────────────
function DatasetIcon(props: any) { return <Layers {...props} />; }

// ── 3D Nodes ──────────────────────────────────────────────────────────────────

function NetworkNodes({ nodes }: { nodes: (GraphNode & { pos: [number, number, number] })[] }) {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <group>
            {nodes.map((n) => (
                <mesh
                    key={n.id}
                    position={new THREE.Vector3(...n.pos)}
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(n.id); }}
                    onPointerOut={() => setHovered(null)}
                >
                    <sphereGeometry args={[n.size, 16, 16]} />
                    <meshBasicMaterial
                        color={hovered === n.id ? "#ffffff" : n.color}
                        wireframe={hovered === n.id}
                    />
                    {hovered === n.id && (
                        <Html distanceFactor={20} zIndexRange={[100, 0]} className="pointer-events-none">
                            <div className="border border-[#C02B0A]/50 bg-black/90 p-3 min-w-[140px] clip-card text-left">
                                <div className="font-mono text-[8px] text-[#C02B0A] tracking-widest uppercase mb-1 flex items-center gap-2">
                                    {n.type === "paper" ? <FileText size={10} /> : n.type === "dataset" ? <DatasetIcon size={10} /> : <Settings2 size={10} />}
                                    {n.type.toUpperCase()}
                                </div>
                                <div className="font-mono font-bold text-xs text-white uppercase truncate max-w-[160px]">{n.label}</div>
                                {n.rci != null && (
                                    <div className="text-[7px] text-[#97494E] font-mono mt-1 uppercase">RCI: {n.rci.toFixed(1)}%</div>
                                )}
                            </div>
                        </Html>
                    )}
                </mesh>
            ))}
        </group>
    );
}

// ── 3D Edges ──────────────────────────────────────────────────────────────────

function NetworkEdges({
    edges,
    nodePositions,
}: {
    edges: GraphEdge[];
    nodePositions: Map<string, [number, number, number]>;
}) {
    return (
        <group>
            {edges.map((e, i) => {
                const src = nodePositions.get(e.source);
                const tgt = nodePositions.get(e.target);
                if (!src || !tgt) return null;
                return (
                    <Line
                        key={i}
                        points={[new THREE.Vector3(...src), new THREE.Vector3(...tgt)]}
                        color={e.color}
                        lineWidth={0.5}
                        transparent
                        opacity={e.opacity ?? 0.3}
                    />
                );
            })}
        </group>
    );
}

// ── Layout helper: assign 3D positions ────────────────────────────────────────

function assignPositions(nodes: GraphNode[]): (GraphNode & { pos: [number, number, number] })[] {
    return nodes.map((n) => ({
        ...n,
        pos: [
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
        ] as [number, number, number],
    }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NeuralGraphPage() {
    const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ nodes: 0, edges: 0 });

    useEffect(() => {
        api.getGraph()
            .then((g) => {
                setRawNodes(g.nodes);
                setEdges(g.edges);
                setCounts({ nodes: g.node_count, edges: g.edge_count });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Assign random 3D positions (memoized so they don't reshuffle on re-render)
    const nodes = useMemo(() => assignPositions(rawNodes), [rawNodes]);

    // Build id → position map for edge rendering
    const nodePositions = useMemo(() => {
        const map = new Map<string, [number, number, number]>();
        nodes.forEach(n => map.set(n.id, n.pos));
        return map;
    }, [nodes]);

    return (
        <div className="h-full w-full flex flex-col relative">

            {/* Overlay UI */}
            <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-mono text-[10px] text-[#C02B0A] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                            <div className="w-4 h-0.5 bg-[#C02B0A]" />
                            C. Multi-Paper Intelligence
                        </div>
                        <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="3D KNOWLEDGE GRAPH">
                            3D KNOWLEDGE GRAPH
                        </h1>
                        {!loading && (
                            <p className="font-mono text-[9px] text-[#97494E] mt-2 uppercase tracking-widest">
                                {counts.nodes} nodes · {counts.edges} edges
                            </p>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-[#050505]/90 border border-[#3C091E]/30 p-4 shrink-0 flex flex-col gap-2 clip-card-solais">
                        <h4 className="font-mono text-[9px] text-[#97494E] tracking-widest uppercase border-b border-[#3C091E]/30 pb-2 mb-2">Entity Legend</h4>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-white rounded-full" /> Paper</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#C02B0A] rounded-full" /> Dataset</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#3C091E] rounded-full" /> Method</div>
                    </div>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="absolute inset-0 z-0 bg-transparent">
                {loading ? (
                    <div className="flex items-center justify-center h-full gap-3">
                        <Loader2 size={20} className="animate-spin text-[#C02B0A]" />
                        <span className="font-mono text-[10px] text-[#97494E] uppercase">BUILDING KNOWLEDGE GRAPH...</span>
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p className="font-mono text-[10px] text-[#97494E] uppercase tracking-widest">NO GRAPH DATA YET</p>
                        <p className="font-mono text-[9px] text-[#3C091E] uppercase">Upload and process papers to build the knowledge graph.</p>
                    </div>
                ) : (
                    <Canvas camera={{ position: [0, 0, 40], fov: 45 }}>
                        <color attach="background" args={["#050505"]} />
                        <fog attach="fog" args={["#050505", 20, 80]} />
                        <ambientLight intensity={0.5} />
                        <NetworkNodes nodes={nodes} />
                        <NetworkEdges edges={edges} nodePositions={nodePositions} />
                        <OrbitControls
                            enablePan
                            enableZoom
                            autoRotate
                            autoRotateSpeed={0.5}
                            maxDistance={80}
                            minDistance={10}
                        />
                    </Canvas>
                )}
            </div>
        </div>
    );
}
