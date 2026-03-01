"use client";

import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Instances, Instance, Html, Line, Sphere, Trail } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { Layers, FileText, Settings2, Link } from "lucide-react";

// Massive Graph Data Simulation
const GRAPH_SIZE = 120;
const D_SIZE = 15;
const M_SIZE = 10;

// Type: 0 = Paper (White), 1 = Dataset (Orange), 2 = Method (Dark Red)
const generateNodes = () => {
    const nodes = [];
    for (let i = 0; i < GRAPH_SIZE; i++) {
        const type = i < D_SIZE ? 1 : i < D_SIZE + M_SIZE ? 2 : 0;
        nodes.push({
            id: i,
            type,
            pos: [
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            ],
            size: type === 0 ? 0.3 : type === 1 ? 0.8 : 0.6,
            color: type === 0 ? "#ffffff" : type === 1 ? "#C02B0A" : "#3C091E",
            label: type === 0 ? `ARX-${200 + i}` : type === 1 ? `DATA-${i}` : `METH-${i}`
        });
    }
    return nodes;
};

const generateEdges = (nodes: any[]) => {
    const edges: any[] = [];
    nodes.forEach((n, i) => {
        if (n.type === 0) { // If paper
            // Connect to 1 random dataset
            const dsIndex = Math.floor(Math.random() * D_SIZE);
            edges.push([n.pos, nodes[dsIndex].pos, "#C02B0A"]);
            // Connect to 1 random method
            const mIndex = Math.floor(Math.random() * M_SIZE) + D_SIZE;
            edges.push([n.pos, nodes[mIndex].pos, "#3C091E"]);
            // Maybe cite another paper
            if (Math.random() > 0.8) {
                const pIndex = Math.floor(Math.random() * (GRAPH_SIZE - D_SIZE - M_SIZE)) + D_SIZE + M_SIZE;
                edges.push([n.pos, nodes[pIndex].pos, "#ffffff"]);
            }
        }
    });
    return edges;
};

function NetworkNodes({ nodes }: { nodes: any[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

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
                            <div className="border border-[#C02B0A]/50 bg-black/90 p-3 min-w-[120px] transition-all clip-card text-left">
                                <div className="font-mono text-[8px] text-[#C02B0A] tracking-widest uppercase mb-1 flex items-center gap-2">
                                    {n.type === 0 ? <FileText size={10} /> : n.type === 1 ? <Database size={10} /> : <Settings2 size={10} />}
                                    {n.type === 0 ? "PAPER" : n.type === 1 ? "DATASET" : "METHOD"}
                                </div>
                                <div className="font-cyber font-bold text-xs text-white uppercase">{n.label}</div>
                                {n.type === 0 && <div className="text-[7px] text-[#97494E] font-mono mt-1 uppercase">RCI: {(Math.random() * 40 + 60).toFixed(1)}%</div>}
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
    const nodes = useMemo(() => generateNodes(), []);
    const edges = useMemo(() => generateEdges(nodes), [nodes]);

    return (
        <div className="h-full w-full flex flex-col relative">

            {/* Absolute Overlay UI */}
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
                    </div>

                    {/* Legend */}
                    <div className="bg-[#050505] border border-[#3C091E]/30 p-4 shrink-0 flex flex-col gap-2 clip-card-solais">
                        <h4 className="font-mono text-[9px] text-[#97494E] tracking-widest uppercase border-b border-[#3C091E]/30 pb-2 mb-2">Entity Legend</h4>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-white rounded-full" /> Extracted Paper</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#C02B0A] rounded-full" /> Saturated Dataset</div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white uppercase"><div className="w-2 h-2 bg-[#3C091E] rounded-full" /> Core Methodology</div>
                    </div>
                </div>
            </div>

            {/* 3D Canvas Fill */}
            <div className="absolute inset-0 z-0 bg-transparent">
                <Canvas camera={{ position: [0, 0, 40], fov: 45 }}>
                    <color attach="background" args={["#050505"]} />
                    <fog attach="fog" args={["#050505", 20, 80]} />
                    <ambientLight intensity={0.5} />

                    <NetworkNodes nodes={nodes} />
                    <NetworkEdges edges={edges} />

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
