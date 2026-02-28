"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera, Instances, Instance, SpotLight, Grid, Html, Line, Float } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/lib/store";


// Spinning Red Badges ("Coins")
function RedBadges() {
    const badges = useMemo(() => [
        { pos: [5, 5, -5], rotSpeed: 1.5, scale: 0.8 },
        { pos: [-8, 2, -12], rotSpeed: -2, scale: 1.2 },
        { pos: [3, -4, -8], rotSpeed: 1, scale: 0.6 },
        { pos: [12, -2, -15], rotSpeed: -1.2, scale: 1 },
    ], []);

    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.children.forEach((child, i) => {
            child.rotation.y = t * badges[i].rotSpeed;
            child.rotation.z = Math.sin(t) * 0.1;
            child.position.y += Math.sin(t * 2 + i) * 0.01; // subtle float
        });
    });

    return (
        <group ref={groupRef}>
            {badges.map((b, i) => (
                <Float key={i} speed={2} rotationIntensity={1} floatIntensity={1} floatingRange={[-0.5, 0.5]}>
                    <mesh position={new THREE.Vector3(...b.pos)} scale={new THREE.Vector3(b.scale, b.scale, b.scale)}>
                        {/* Beveled Box / Coin */}
                        <boxGeometry args={[1.5, 1.5, 0.2]} />
                        <meshStandardMaterial color="#C02B0A" metalness={0.6} roughness={0.3} />
                        {/* Add a generic tech icon shape inside the red coin */}
                        <mesh position={[0, 0, 0.12]}>
                            <torusGeometry args={[0.4, 0.05, 16, 32]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <mesh position={[0, 0, -0.12]}>
                            <torusGeometry args={[0.4, 0.05, 16, 32]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    </mesh>
                </Float>
            ))}
        </group>
    );
}


// Feature Graph that stretches along the Z Axis
function FeatureGraph() {
    const { progress } = useScrollStore();

    // Scale features nodes so they only appear when we are in the graph section
    const graphActive = progress > 0.40;

    const features = useMemo(() => [
        { id: 0, pos: [4, 2, 25], title: "PDF UPLOAD INGESTION", desc: "Drag & drop artifacts." },
        { id: 1, pos: [-4, -1, 20], title: "INTELLIGENT CHUNKING", desc: "LangChain semantic splitters." },
        { id: 2, pos: [5, -3, 15], title: "ENTITY EXTRACTION", desc: "Strict JSON schema via Pydantic." },
        { id: 3, pos: [-6, 3, 10], title: "VECTOR STORAGE", desc: "Qdrant claim embeddings." },
        { id: 4, pos: [3, 1, 5], title: "REPRODUCIBILITY SCORE", desc: "Compute code availability breakdown." },
        { id: 5, pos: [-3, -4, 0], title: "CONFIDENCE SCORE", desc: "Claim-to-evidence ratio." },
        { id: 6, pos: [5, -2, -5], title: "RISK FLAGS", desc: "No code links flagged." },
        { id: 7, pos: [-5, 4, -10], title: "CREDIBILITY INDEX (RCI)", desc: "Global field aggregation metric." },
        { id: 8, pos: [4, 0, -15], title: "LIT MATRIX", desc: "Tag, topic, dataset comparison." },
        { id: 9, pos: [-3, -3, -20], title: "KNOWLEDGE GRAPH", desc: "Paper-to-method network edges." },
        { id: 10, pos: [6, 2, -25], title: "GAP INTELLIGENCE", desc: "Dataset saturation detection." },
        { id: 11, pos: [-4, -1, -30], title: "CONTRADICTION FEED", desc: "Cross-paper empirical warnings." },
        { id: 12, pos: [3, 4, -35], title: "EFFORT ESTIMATOR", desc: "Compute GPU limits & risks." },
        { id: 13, pos: [-5, -2, -40], title: "CHAT WITH MATRIX", desc: "Semantic RAG verified queries." },
        { id: 14, pos: [4, 1, -45], title: "EXPORT API", desc: "Generate BibTeX and CSVs." },
        { id: 15, pos: [-2, 3, -50], title: "ARXION CORE", desc: "Differentiated strategic engine." },
    ], []);

    // Create edges connecting the sequence
    const edges = useMemo(() => {
        const lines = [];
        for (let i = 0; i < features.length - 1; i++) {
            lines.push([features[i].pos, features[i + 1].pos]);
        }
        // Add some cross-branches for graph aesthetic
        lines.push([features[2].pos, features[5].pos]);
        lines.push([features[4].pos, features[8].pos]);
        lines.push([features[9].pos, features[12].pos]);
        lines.push([features[11].pos, features[15].pos]);
        return lines;
    }, [features]);

    return (
        <group>
            {/* Draw network lines between nodes */}
            {edges.map((e, i) => (
                <Line key={`e-${i}`} points={[new THREE.Vector3(...e[0]), new THREE.Vector3(...e[1])]} color="#C02B0A" lineWidth={1.5} opacity={graphActive ? 0.4 : 0} transparent />
            ))}

            {/* Render Nodes as pure HTML tooltips floating in space */}
            {features.map((feat, i) => {
                return (
                    <Html key={i} position={new THREE.Vector3(...feat.pos)} transform sprite>
                        <div className={`transition-all duration-1000 ${graphActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'} relative group`}>

                            {/* The glowing dot anchor */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#C02B0A] blur-[4px] group-hover:scale-150 transition-transform" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />

                            {/* Connecting dash to card */}
                            <div className="absolute top-1/2 left-1/2 w-8 h-[1px] bg-[#C02B0A]" />

                            <div className="absolute top-1/2 left-[calc(50%+32px)] -translate-y-1/2 border border-[#C02B0A]/30 bg-black/80 backdrop-blur p-4 min-w-[220px] max-w-[280px] clip-card hover:border-[#C02B0A] transition-colors pointer-events-auto cursor-pointer">
                                <div className={`flex items-center gap-2 mb-2 font-mono uppercase text-[10px] tracking-widest text-[#C02B0A] group-hover:text-white transition-colors`}>
                                    {feat.title}
                                </div>
                                <p className="text-white text-[9px] font-mono opacity-80 leading-relaxed uppercase">
                                    {feat.desc}
                                </p>
                            </div>
                        </div>
                    </Html>
                );
            })}
        </group>
    );
}


function SceneController() {
    const { progress } = useScrollStore();
    const { scene } = useThree();

    useFrame(() => {
        const startColor = new THREE.Color("#1A030A");
        const midColor = new THREE.Color("#3C091E");
        const endColor = new THREE.Color("#F0F0F0");

        let currentColor;

        if (progress < 0.2) {
            currentColor = startColor.lerp(midColor, progress / 0.2);
        } else if (progress < 0.45) {
            currentColor = midColor.lerp(endColor, (progress - 0.2) / 0.25); // Turns white around progress 0.45
        } else {
            currentColor = endColor; // Stays white for the rest
        }

        scene.background = currentColor;
        scene.fog = new THREE.Fog(currentColor.getHex(), 10, 45);
    });

    return null;
}

export default function Hero3D() {
    const { progress } = useScrollStore();

    // Calculate camera position dynamically based on narrative sections
    // Phase 1: Slow drift while text floats (0 -> 0.4)
    // Phase 2: High-speed blast through the feature graph (0.4 -> 1.0)
    const cameraZ = progress < 0.40
        ? 30 - (progress * 15) // Drops from 30 down to 24 slowly
        : 24 - ((progress - 0.40) * 160); // Drops from 24 down to -72 rapidly

    // Color transition calculations: 
    // Go white when the Classy Capabilities heading comes in (approx 0.35)
    const isGraphSection = progress > 0.35;

    return (
        <div className="fixed inset-0 w-full h-screen -z-10 bg-transparent pointer-events-none">
            <Canvas shadows>
                <SceneController />

                <PerspectiveCamera
                    makeDefault
                    position={[0, progress * 6, cameraZ]}
                    fov={45}
                    rotation={[0, 0, 0]}
                />

                <ambientLight intensity={progress > 0.4 ? 0.8 : 0.2} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={progress > 0.4 ? 1 : 3}
                    color="#ffffff"
                    castShadow
                    shadow-bias={-0.0001}
                />
                <SpotLight
                    position={[-5, 5, 15]}
                    angle={0.4}
                    penumbra={1}
                    intensity={5}
                    color="#C02B0A"
                    distance={50}
                />


                {/* Spinning Solais-style Red Coins */}
                <RedBadges />


                {/* Continuous 3D Knowledge Graph appearing during Phase 2 */}
                <FeatureGraph />

                {/* The Solais style perspective floor grid */}
                <Grid
                    position={[0, -10 - progress * 5, -20]}
                    args={[200, 400]}
                    cellSize={2}
                    cellThickness={progress > 0.4 ? 1 : 0.5}
                    cellColor={progress > 0.4 ? "#cccccc" : "#601020"}
                    sectionSize={10}
                    sectionThickness={progress > 0.4 ? 2 : 1}
                    sectionColor={progress > 0.4 ? "#999999" : "#C02B0A"}
                    fadeDistance={60}
                    fadeStrength={1}
                />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
