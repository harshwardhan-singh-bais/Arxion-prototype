"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera, Instances, Instance, SpotLight, Grid, Html, Float } from "@react-three/drei";
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
                <mesh key={i} position={new THREE.Vector3(...b.pos)} scale={new THREE.Vector3(b.scale, b.scale, b.scale)}>
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
            ))}
        </group>
    );
}

// Floating Features Palettes
function FloatingFeatures() {
    const { progress } = useScrollStore();

    // We want to show different groups of features based on progress.
    // They pop up around the camera randomly as we fly forward.
    const features = useMemo(() => [
        // Group 1 (3 features): progress 0.10 - 0.20
        { pos: [-5, 2, 8], title: "NEURAL CORRELATION", desc: "Evidence pointer linked. Confidence interval stabilized.", group: 1, font: "font-mono" },
        { pos: [6, 4, 6], title: "EPISTEMIC GAP", desc: "Contradiction detected across dataset boundaries.", group: 1, font: "font-cyber" },
        { pos: [1, -3, 10], title: "BASELINE DRIFT", desc: "Metrics misaligned with original methodology.", group: 1, font: "font-cyberlight" },

        // Group 2 (4 features): progress 0.15 - 0.25
        { pos: [5, 1, 4], title: "DATA SATURATION", desc: "Benchmark limits reached. Zero marginal gain.", group: 2, font: "font-mono" },
        { pos: [-6, -2, 2], title: "REPRODUCIBILITY SCORE", desc: "Code and weights unavailable in 80% of branches.", group: 2, font: "font-cyber" },
        { pos: [3, -4, 5], title: "SYNTHETIC DECAY", desc: "Model trained on generated artifacts.", group: 2, font: "font-cyberlight" },
        { pos: [-3, 5, 0], title: "CITATION GRAPH", desc: "Self-referential loop detected. Verification required.", group: 2, font: "font-mono" },

        // Group 3 (4 features): progress 0.20 - 0.30
        { pos: [-5, 3, 0], title: "COMPUTE ASYMMETRY", desc: "Hardware constraints invalidate comparison.", group: 3, font: "font-cyber" },
        { pos: [4, -1, 3], title: "HYPERPARAMETER VEIL", desc: "Critical training parameters omitted from paper.", group: 3, font: "font-cyberlight" },
        { pos: [2, 4, -2], title: "METHODOLOGICAL FLAW", desc: "Invalid ablation study. Core hypothesis unproven.", group: 3, font: "font-mono" },
        { pos: [-4, -4, 1], title: "TRUTH MATRIX", desc: "Converging multi-agent consensus achieved.", group: 3, font: "font-cyber" },

        // Group 4 (3 features): progress 0.25 - 0.35
        { pos: [5, 2, -1], title: "ONTOLOGICAL SHIFT", desc: "Definition of core metric has changed over time.", group: 4, font: "font-cyberlight" },
        { pos: [-6, 1, -3], title: "BLIND SPOT", desc: "No known literature addressing this specific node.", group: 4, font: "font-mono" },
        { pos: [0, -2, 0], title: "ARXION CORE", desc: "Intelligence extraction sequence complete.", group: 4, font: "font-cyber" },
    ], []);

    return (
        <group>
            {features.map((feat, i) => {
                let isVisible = false;
                if (feat.group === 1 && progress > 0.08 && progress < 0.22) isVisible = true;
                if (feat.group === 2 && progress > 0.14 && progress < 0.27) isVisible = true;
                if (feat.group === 3 && progress > 0.20 && progress < 0.33) isVisible = true;
                if (feat.group === 4 && progress > 0.26 && progress < 0.38) isVisible = true;

                return (
                    // Using drei's Float to make the card bob and wander effortlessly in mid-air
                    <Float key={i} speed={2} rotationIntensity={0.1} floatIntensity={1} floatingRange={[-0.5, 0.5]}>
                        <Html position={new THREE.Vector3(...feat.pos)} transform sprite>
                            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                                <div className="flex items-center gap-2">
                                    <div className="border border-[#C02B0A]/30 bg-black/80 backdrop-blur pb-2 p-4 min-w-[200px] max-w-[260px] clip-card">
                                        <div className={`flex items-center gap-2 mb-2 ${feat.font === 'font-mono' ? 'font-mono uppercase text-[10px]' : feat.font === 'font-cyber' ? 'font-cyber text-xs uppercase tracking-widest' : 'font-cyberlight text-sm uppercase tracking-widest font-bold'} text-[#C02B0A]`}>
                                            <span className="w-1.5 h-1.5 bg-[#C02B0A]" />
                                            {feat.title}
                                        </div>
                                        <p className="text-white text-[10px] font-mono opacity-80 leading-relaxed uppercase">
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Html>
                    </Float>
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
        } else if (progress < 0.6) {
            currentColor = midColor.lerp(endColor, (progress - 0.2) / 0.4); // Turns white around progress 0.6
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

    return (
        <div className="fixed inset-0 w-full h-screen -z-10 bg-transparent pointer-events-none">
            <Canvas shadows>
                <SceneController />

                <PerspectiveCamera
                    makeDefault
                    position={[0, progress * 10, 15 - progress * 15]} // Camera flies up and in
                    fov={45}
                    rotation={[-progress * 0.4, 0, 0]}
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

                {/* Floating Feature Palettes spawning and spawning */}
                <FloatingFeatures />

                {/* The Solais style perspective floor grid */}
                <Grid
                    position={[0, -10 - progress * 5, 0]}
                    args={[200, 200]}
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
