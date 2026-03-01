"use client";

import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Instances, Instance, Html, Line, Sphere, Trail } from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { Layers, FileText, Settings2, Link } from "lucide-react";
import axios from "axios";

// Type: 0 = Paper (White), 1 = Dataset (Orange), 2 = Method (Dark Red)

function NetworkNodes({ nodes }: { nodes: any[] }) {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <group>
            {nodes.map((n, i) => (
                <mesh
                    key={n.id}
                    position={new THREE.Vector3(...n.pos)}
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(n.id); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(null); }}
                >

                    <sphereGeometry args={[n.size, 16, 16]} />
                    <meshBasicMaterial color={hovered === n.id ? "#ffffff" : n.color} wireframe={hovered === n.id} />

                    {/* Solais Tooltip */}
                    {hovered === n.id && (
                        <Html distanceFactor={20} zIndexRange={[100, 0]} className="pointer-events-none">
                            <div className="border border-[#ef4444]/50 bg-black/90 p-3 min-w-[120px] transition-all clip-card text-left">
                                <div className="font-mono text-[8px] text-[#ef4444] tracking-widest uppercase mb-1 flex items-center gap-2">
                                    {n.type === 0 ? <FileText size={10} /> : n.type === 1 ? <Database size={10} /> : <Settings2 size={10} />}
                                    {n.type === 0 ? "PAPER" : n.type === 1 ? "DATASET" : "METHOD"}
                                </div>
                                <div className="font-cyber font-bold text-xs text-white uppercase">{n.label}</div>
                                {n.type === 0 && <div className="text-[7px] text-[#94a3b8] font-mono mt-1 uppercase">RCI: {(Math.random() * 40 + 60).toFixed(1)}%</div>}
                            </div>
                        </Html>
                    )}
                </mesh>
            ))}
        </group>
    );
}

function NetworkEdges({ edges }: { edges: any[] }) {
    return (
        <group>
            {edges.map((e, i) => (
                <Line
                    key={i}
                    points={[new THREE.Vector3(...e[0]), new THREE.Vector3(...e[1])]}
                    color={e[2]}
                    lineWidth={0.5}
                    transparent
                    opacity={0.3}
                />
            ))}
        </group>
    );
}

export default function NeuralGraphPage() {
    const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });

    useEffect(() => {
        const fetchAndBuildGraph = async () => {
            try {
                const res = await axios.get("http://localhost:8000/api/v1/papers");
                const papers = res.data;

                const nodes: any[] = [];
                const edges: any[] = [];
                const nodeMap = new Map<string, any>();

                // Helper to add node
                const addNode = (id: string, type: number, label: string) => {
                    if (!nodeMap.has(id)) {
                        const n = {
                            id,
                            type,
                            pos: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40],
                            size: type === 0 ? 0.4 : type === 1 ? 0.9 : 0.7,
                            color: type === 0 ? "#ffffff" : type === 1 ? "#ef4444" : "#1e293b",
                            label
                        };
                        nodeMap.set(id, n);
                        nodes.push(n);
                    }
                    return nodeMap.get(id);
                };

                papers.forEach((p: any) => {
                    const paperNode = addNode(p.id, 0, p.title || p.id);

                    if (p.datasets) {
                        p.datasets.forEach((d: any) => {
                            const dsNode = addNode(`ds_${d.name}`, 1, d.name);
                            edges.push([paperNode.pos, dsNode.pos, "#ef4444"]);
                        });
                    }

                    if (p.methods) {
                        p.methods.forEach((m: any) => {
                            const mNode = addNode(`m_${m.name}`, 2, m.name);
                            edges.push([paperNode.pos, mNode.pos, "#1e293b"]);
                        });
                    }
                });

                setGraphData({ nodes, edges });
            } catch (err) {
                console.error("Failed to fetch graph data", err);
            }
        };
        fetchAndBuildGraph();
    }, []);

    return (
        <div className="h-full w-full flex flex-col relative">

            {/* Absolute Overlay UI */}
            <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-mono text-[10px] text-[#ef4444] tracking-[0.3em] uppercase mb-2 flex items-center gap-3">
                            <div className="w-4 h-0.5 bg-[#ef4444]" />
                            C. Multi-Paper Intelligence
                        </div>
                        <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase glitch" data-text="3D KNOWLEDGE GRAPH">
                            3D KNOWLEDGE GRAPH
                        </h1>
                    </div>

                    {/* Legend */}
                    <div className="bg-[#0b0f19] border border-[#1e293b]/30 p-4 shrink-0 flex flex-col gap-2 clip-card-solais">
                        <h4 className="font-mono text-[9px] text-[#94a3b8] tracking-widest uppercase border-b border-[#1e293b]/30 pb-2 mb-2">Entity Legend</h4>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-white rounded-full" /> Extracted Paper</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#ef4444] rounded-full" /> Saturated Dataset</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#1e293b] rounded-full" /> Core Methodology</div>
                    </div>
                </div>
            </div>

            {/* 3D Canvas Fill */}
            <div className="absolute inset-0 z-0 bg-transparent">
                <Canvas camera={{ position: [0, 0, 40], fov: 45 }}>
                    <color attach="background" args={["#0b0f19"]} />
                    <fog attach="fog" args={["#0b0f19", 20, 80]} />
                    <ambientLight intensity={0.5} />

                    <NetworkNodes nodes={graphData.nodes} />
                    <NetworkEdges edges={graphData.edges} />

                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        autoRotate
                        autoRotateSpeed={0.5}
                        maxDistance={80}
                        minDistance={10}
                    />
                </Canvas>
            </div>

        </div>
    );
}

// Dummy icon for database missing
function Database(props: any) {
    return <Layers {...props} />;
}
