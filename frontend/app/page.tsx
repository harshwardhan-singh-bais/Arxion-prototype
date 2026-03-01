"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Features } from "@/components/landing/Features";
import { ScrollDispatcher } from "@/components/landing/ScrollDispatcher";
import { useScrollStore } from "@/lib/store";
import Link from "next/link";
import { useRef } from "react";

// Using dynamic import so threejs doesn't SSR crash
const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), { ssr: false });

export default function LandingPage() {
  const { progress } = useScrollStore();
  const containerRef = useRef(null);

  // Track scroll progress within the massive 800vh hero section
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  // Color transitions based on the overall scroll progress of the viewport
  // 3D scene turns white around 40-75% scroll. We adjust DOM elements to contrast.
  const isWhiteZone = false;
  const textColorClass = "text-white";
  const subtextColorClass = "text-[#94a3b8]";

  return (
    <main className="relative font-sans selection:bg-secondary/40 overflow-x-hidden">
      <ScrollDispatcher />
      <Navbar />

      {/* 3D Background Geometric Mesh fixed behind everything */}
      <Hero3D />

      {/* Massive Scroll Narrative Container (2000vh) */}
      <div ref={containerRef} className="relative w-full h-[2000vh] pointer-events-none">

        {/* SECTION 1: HERO (0 - 0.05) */}
        <motion.div
          className="fixed top-0 left-0 w-full h-screen flex flex-col justify-end px-6 lg:px-24 pb-[15vh]"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]),
            y: useTransform(scrollYProgress, [0, 0.05], [0, -100]),
            pointerEvents: useTransform(scrollYProgress, (val) => val < 0.05 ? 'auto' : 'none') as any
          }}
        >
          <div className="flex items-center gap-4 mb-6 opacity-80 font-mono tracking-[0.2em] text-[10px] md:text-sm uppercase font-bold text-white">
            <div className="w-12 h-1 bg-[#ef4444]" />
            <span className="text-white tracking-widest bg-[#ef4444] px-2 py-0.5">[ ARXION DATA INTELLIGENCE MODULE ]</span>
          </div>

          <h1 className="text-5xl md:text-[9vw] font-display font-black tracking-tighter leading-[0.85] uppercase text-white mb-10 w-full glitch" data-text="MAP THE TRUTH." style={{ wordSpacing: '-10px' }}>
            MAP THE <span className="text-[#ef4444]">TRUTH.</span><br />
            FIND THE <span className="text-[#ef4444] italic">GAPS.</span><br />
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-12 md:mr-32 border-t border-white/20 pointer-events-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-lg rounded-none bg-[#ef4444] hover:bg-[#ef4444]/90 clip-button text-white font-mono tracking-widest font-bold shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all"
              asChild
            >
              <Link href="/dashboard">ACCESS SYSTEM</Link>
            </Button>
            <p className="text-sm md:text-base text-white/70 font-mono max-w-xl">
              A Research Credibility, Comparison, and Strategic Intelligence Engine.<br /> Decode contradictions across datasets.
            </p>
          </div>
        </motion.div>

        {/* SECTION 2: WHAT IS ARXION - FLOATING SENTENCES (0.08 - 0.28) */}
        <motion.div
          className="fixed top-0 left-0 w-full h-screen flex flex-col justify-center items-center text-center px-6 pointer-events-none"
        >
          {/* Sentence 1 */}
          <motion.div
            className="absolute w-full px-6 flex flex-col items-center"
            style={{
              opacity: useTransform(scrollYProgress, [0.08, 0.12, 0.16], [0, 1, 0]),
              y: useTransform(scrollYProgress, [0.08, 0.16], [100, -100]),
            }}
          >
            <div className="font-mono text-[9px] text-[#ef4444] tracking-[0.4em] uppercase mb-4 border border-[#ef4444]/30 bg-black/50 px-3 py-1 backdrop-blur inline-block w-max">
              CORE DEFINITION
            </div>
            <h3 className="text-3xl md:text-5xl font-cyber text-white uppercase tracking-widest max-w-3xl leading-snug">
              Arxion is a Research Credibility & Intelligence Engine.
            </h3>
          </motion.div>

          {/* Sentence 2 */}
          <motion.div
            className="absolute w-full px-6 flex flex-col items-center"
            style={{
              opacity: useTransform(scrollYProgress, [0.15, 0.19, 0.23], [0, 1, 0]),
              y: useTransform(scrollYProgress, [0.15, 0.23], [100, -100]),
            }}
          >
            <div className="font-mono text-[9px] text-[#ef4444] tracking-[0.4em] uppercase mb-4 border border-[#ef4444]/30 bg-black/50 px-3 py-1 backdrop-blur inline-block w-max">
              THE PROBLEM
            </div>
            <h3 className="text-3xl md:text-5xl font-cyberlight font-bold text-white uppercase tracking-widest max-w-4xl leading-snug">
              It structures papers, scores credibility, and detects contradictions across dataset boundaries.
            </h3>
          </motion.div>

          {/* Sentence 3 */}
          <motion.div
            className="absolute w-full px-6 flex flex-col items-center"
            style={{
              opacity: useTransform(scrollYProgress, [0.22, 0.26, 0.30], [0, 1, 0]),
              y: useTransform(scrollYProgress, [0.22, 0.30], [100, -100]),
            }}
          >
            <div className="font-mono text-[9px] text-[#ef4444] tracking-[0.4em] uppercase mb-4 border border-[#ef4444]/30 bg-black/50 px-3 py-1 backdrop-blur inline-block w-max">
              THE OBJECTIVE
            </div>
            <h3 className="text-3xl md:text-5xl font-cyber text-white uppercase tracking-widest max-w-3xl leading-snug">
              Helping you decide exactly what to trust, and what to build next.
            </h3>
          </motion.div>
        </motion.div>

        {/* SECTION 3: CLASSY CAPABILITIES HEADING (0.32 - 0.42) */}
        <motion.div
          className={`fixed top-0 left-0 w-full h-screen flex flex-col justify-center px-6 lg:px-32 ${textColorClass} transition-colors duration-1000`}
          style={{
            opacity: useTransform(scrollYProgress, [0.32, 0.37, 0.45], [0, 1, 0]),
            x: useTransform(scrollYProgress, [0.32, 0.37, 0.45], [-200, 0, 200])
          }}
        >
          <div className="flex items-center gap-4 mb-6 font-mono tracking-[0.2em] text-sm uppercase font-bold">
            <span className="bg-[#ef4444] text-white px-3 py-1 border border-[#ef4444]/20 tracking-widest text-[10px]">SYSTEM INFRASTRUCTURE</span>
            <div className={`w-12 h-0.5 bg-current opacity-30`} />
          </div>

          <h2 className="text-6xl md:text-[8vw] font-display font-black tracking-tighter leading-none uppercase text-white" style={{ wordSpacing: '-5px' }}>
            AUTONOMOUS<br />
            <span className="flex items-center text-[#94a3b8]">
              <span className="w-16 h-1 bg-[#1e293b] mr-6" />
              CAPABILITIES
            </span>
          </h2>
        </motion.div>


        {/* SECTION 4: THE GRAPH INTERACTION LAYER (0.45 - 0.90) */}
        {/* At progress > 0.45, the 3D graph elements become interactable as the camera flies through them */}
        <motion.div
          className="fixed top-0 left-0 w-full h-screen flex flex-col justify-center pointer-events-auto"
          style={{
            opacity: useTransform(scrollYProgress, [0.45, 0.50, 0.90], [0, 1, 0]),
            pointerEvents: useTransform(scrollYProgress, (val) => val > 0.45 && val < 0.90 ? 'auto' : 'none') as any
          }}
        >
          {/* We rely entirely on the 3D scene (Hero3D) for the graph display here */}
        </motion.div>

        {/* SECTION 5: CALL TO ACTION (0.92 - 1.0) */}
        <motion.div
          className={`fixed top-0 left-0 w-full h-screen flex flex-col items-center justify-center px-6 text-center ${textColorClass} transition-opacity duration-1000`}
          style={{
            opacity: useTransform(scrollYProgress, [0.90, 0.95, 1.0], [0, 1, 0]),
          }}
        >
          <h2 className="text-5xl md:text-[8vw] font-display font-black uppercase leading-[0.8] tracking-tighter mb-6 glitch" data-text="STOP SKIMMING.">
            STOP SKIMMING.<br />
            <span className="text-[#94a3b8]">START OVERRIDING.</span>
          </h2>
        </motion.div>

      </div>

      {/* SECTION 6: THE WHITE CARDS GAP FINDER / USE CASES (Static rendering before footer) */}
      <div className="relative w-full bg-gradient-to-br from-[#0b0f19] via-[#0d111c] to-[#111827] z-20 pointer-events-auto py-32 border-b border-[#1e293b]/20">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(239,68,68,0.08), transparent 60%)', opacity: 0.1 }} />
        <Features />
      </div>

      {/* SECTION 7: THE MASSIVE FOOTER BLOCK (Static end of document) */}
      <footer className="relative bg-[#0b0f19] min-h-screen z-20 overflow-hidden flex flex-col justify-end pb-0">
        {/* Background massive glitch text */}
        <div className="absolute top-10 left-0 w-full overflow-hidden Mix-blend-overlay opacity-5 pointer-events-none flex justify-center mt-20">
          <h1 className="text-[25vw] font-display font-black tracking-tighter leading-none text-white">
            ARXION
          </h1>
        </div>

        {/* The white clipped footer foreground block */}
        <div className="relative w-full bg-gradient-to-br from-[#0b0f19] via-[#0d111c] to-[#111827] mt-[30vh] clip-footer px-6 md:px-24 py-32 flex flex-col lg:flex-row justify-between gap-16 pointer-events-auto">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(239,68,68,0.08), transparent 60%)', opacity: 0.1 }} />

          <div className="lg:w-1/3">
            <div className="flex items-center gap-3 font-mono text-sm tracking-widest font-bold text-white mb-6 border border-white/10 p-4 w-max rounded-xl bg-white/5 backdrop-blur-sm shadow-[0_0_30px_rgba(239,68,68,0.05)]">
              <span className="w-2 h-2 bg-[#ef4444] rounded-full" />
              ARXION ENGINE
            </div>
            <p className="font-mono text-sm text-[#94a3b8] leading-loose max-w-sm mb-12">
              People don't just read PDFs anymore. They extract structures, find gaps, and map the contradictions. Welcome to autonomous analysis.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-white/10 hover:text-white transition-colors cursor-pointer font-mono font-bold">X</div>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-white/10 hover:text-white transition-colors cursor-pointer font-mono font-bold">G</div>
            </div>
          </div>

          <div className="lg:w-1/4 z-10">
            <h4 className="font-mono text-lg font-bold tracking-widest text-[#94a3b8] mb-8">EXPLORE</h4>
            <ul className="space-y-4 font-mono text-sm text-[#94a3b8] uppercase tracking-wide">
              <li className="hover:text-[#ef4444] cursor-pointer transition-colors block">About Matrix</li>
              <li className="hover:text-white cursor-pointer transition-colors block border-t border-white/10 pt-4">How it works</li>
              <li className="hover:text-white cursor-pointer transition-colors block border-t border-white/10 pt-4">System Logic</li>
              <li className="hover:text-white cursor-pointer transition-colors block border-t border-white/10 pt-4">Data Extraction</li>
            </ul>
          </div>

          <div className="lg:w-1/3 z-10">
            <h4 className="font-mono text-lg font-bold tracking-widest text-[#94a3b8] mb-8">GET STARTED</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <input className="w-1/2 bg-transparent border-b border-white/10 focus:border-[#ef4444] text-white outline-none py-2 font-mono text-xs placeholder-[#94a3b8]" placeholder="First name *" />
                <input className="w-1/2 bg-transparent border-b border-white/10 focus:border-[#ef4444] text-white outline-none py-2 font-mono text-xs placeholder-[#94a3b8]" placeholder="Last name *" />
              </div>
              <input className="w-full bg-transparent border-b border-white/10 focus:border-[#ef4444] text-white outline-none py-2 font-mono text-xs placeholder-[#94a3b8]" placeholder="Email *" />
              <Button
                size="lg"
                className="mt-8 px-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono tracking-widest font-bold transition-all w-max shadow-[0_0_30px_rgba(239,68,68,0.05)]"
                asChild
              >
                <Link href="/dashboard">SUBMIT</Link>
              </Button>
            </div>
          </div>

        </div>
      </footer>

    </main>
  );
}
