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
  const isWhiteZone = progress > 0.4 && progress < 0.75;
  const textColorClass = isWhiteZone ? "text-[#3C091E]" : "text-white";
  const subtextColorClass = isWhiteZone ? "text-[#97494E]" : "text-white/60";

  return (
    <main className="relative font-sans selection:bg-secondary/40 overflow-x-hidden">
      <ScrollDispatcher />
      <Navbar />

      {/* 3D Background Geometric Mesh fixed behind everything */}
      <Hero3D />

      {/* Massive Scroll Narrative Container (800vh) */}
      <div ref={containerRef} className="relative w-full h-[800vh] pointer-events-none">

        {/* SECTION 1: HERO (0 - 0.15) */}
        <motion.div
          className="fixed top-0 left-0 w-full h-screen flex flex-col justify-end px-6 lg:px-24 pb-[15vh]"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]),
            y: useTransform(scrollYProgress, [0, 0.15], [0, -100]),
            pointerEvents: useTransform(scrollYProgress, (val) => val < 0.15 ? 'auto' : 'none') as any
          }}
        >
          <div className="flex items-center gap-4 mb-6 opacity-80 font-mono tracking-[0.2em] text-[10px] md:text-sm uppercase font-bold text-white">
            <div className="w-12 h-1 bg-[#C02B0A]" />
            <span className="text-white tracking-widest bg-[#C02B0A] px-2 py-0.5">[ ARXION DATA INTELLIGENCE MODULE ]</span>
          </div>

          <h1 className="text-5xl md:text-[9vw] font-display font-black tracking-tighter leading-[0.85] uppercase text-white mb-10 w-full glitch" data-text="MAP THE TRUTH." style={{ wordSpacing: '-10px' }}>
            MAP THE <span className="text-[#C02B0A]">TRUTH.</span><br />
            FIND THE <span className="text-[#C02B0A] italic">GAPS.</span><br />
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-12 md:mr-32 border-t border-white/20 pointer-events-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-lg rounded-none bg-[#C02B0A] hover:bg-[#C02B0A]/90 clip-button text-white font-mono tracking-widest font-bold shadow-[0_0_40px_rgba(192,43,10,0.4)] transition-all"
              asChild
            >
              <Link href="/dashboard">ACCESS SYSTEM</Link>
            </Button>
            <p className="text-sm md:text-base text-white/70 font-mono max-w-xl">
              A Research Credibility, Comparison, and Strategic Intelligence Engine.<br /> Decode contradictions across datasets.
            </p>
          </div>
        </motion.div>

        {/* SECTION 2: WHAT IS ARXION (0.15 - 0.3) */}
        <motion.div
          className={`fixed top-0 left-0 w-full h-screen flex flex-col justify-center px-6 lg:px-32 ${textColorClass} transition-colors duration-1000`}
          style={{
            opacity: useTransform(scrollYProgress, [0.12, 0.22, 0.32], [0, 1, 0]),
            x: useTransform(scrollYProgress, [0.12, 0.22, 0.32], [-200, 0, 200])
          }}
        >
          <div className="flex items-center gap-4 mb-6 font-mono tracking-[0.2em] text-sm uppercase font-bold">
            <span className="bg-white text-[#3C091E] px-3 py-1 border border-[#3C091E]/20">UNDERSTANDING</span>
            <div className={`w-12 h-0.5 bg-current opacity-30`} />
          </div>

          <h2 className="text-8xl md:text-[9vw] font-display font-black tracking-tighter leading-none uppercase" style={{ wordSpacing: '-10px' }}>
            WHAT IS<br />
            <span className="flex items-center">
              <span className="w-16 h-2 bg-current mr-6 opacity-30" />
              ARXION?
            </span>
          </h2>
        </motion.div>


        {/* SECTION 4: THE WHITE CARDS GAP FINDER (0.5 - 0.75) */}
        {/* At progress > 0.4, the 3D scene is white, perfectly setting the stage for these cards */}
        <motion.div
          className="fixed top-0 left-0 w-full h-screen flex flex-col justify-center pointer-events-auto"
          style={{
            opacity: useTransform(scrollYProgress, [0.45, 0.55, 0.8], [0, 1, 0]),
            y: useTransform(scrollYProgress, [0.45, 0.55, 0.8], [150, 0, -150]),
            pointerEvents: useTransform(scrollYProgress, (val) => val > 0.45 && val < 0.8 ? 'auto' : 'none') as any
          }}
        >
          <Features />
        </motion.div>

        {/* SECTION 5: CALL TO ACTION (0.8 - 0.9) */}
        <motion.div
          className={`fixed top-0 left-0 w-full h-screen flex flex-col items-center justify-center px-6 text-center ${textColorClass} transition-opacity duration-1000`}
          style={{
            opacity: useTransform(scrollYProgress, [0.75, 0.85, 0.95], [0, 1, 0]),
          }}
        >
          <h2 className="text-5xl md:text-[8vw] font-display font-black uppercase leading-[0.8] tracking-tighter mb-6 glitch" data-text="STOP SKIMMING.">
            STOP SKIMMING.<br />
            <span className="text-[#97494E]">START OVERRIDING.</span>
          </h2>
        </motion.div>

      </div>

      {/* SECTION 6: THE MASSIVE FOOTER BLOCK (Static end of document) */}
      <footer className="relative bg-[#050505] min-h-screen z-20 overflow-hidden flex flex-col justify-end pb-0">
        {/* Background massive glitch text */}
        <div className="absolute top-10 left-0 w-full overflow-hidden Mix-blend-overlay opacity-30 pointer-events-none flex justify-center mt-20">
          <h1 className="text-[25vw] font-display font-black tracking-tighter leading-none text-[#3C091E]">
            ARXION
          </h1>
        </div>

        {/* The white clipped footer foreground block */}
        <div className="relative w-full bg-[#f0f0f0] mt-[30vh] clip-footer px-6 md:px-24 py-32 flex flex-col lg:flex-row justify-between gap-16 pointer-events-auto">

          <div className="lg:w-1/3">
            <div className="flex items-center gap-3 font-mono text-sm tracking-widest font-bold text-[#3C091E] mb-6 border border-[#3C091E] px-4 py-2 w-max">
              <span className="w-2 h-2 bg-[#C02B0A]" />
              ARXION ENGINE
            </div>
            <p className="font-mono text-sm text-[#97494E] leading-loose max-w-sm mb-12">
              People don't just read PDFs anymore. They extract structures, find gaps, and map the contradictions. Welcome to autonomous analysis.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#3C091E] flex items-center justify-center text-white hover:bg-[#C02B0A] transition-colors cursor-pointer clip-button font-mono font-bold">X</div>
              <div className="w-10 h-10 bg-[#3C091E] flex items-center justify-center text-white hover:bg-[#C02B0A] transition-colors cursor-pointer clip-button font-mono font-bold">G</div>
            </div>
          </div>

          <div className="lg:w-1/4">
            <h4 className="font-mono text-lg font-bold tracking-widest text-[#3C091E] mb-8">EXPLORE</h4>
            <ul className="space-y-4 font-mono text-sm text-[#97494E] uppercase tracking-wide">
              <li className="hover:text-[#C02B0A] cursor-pointer transition-colors block">About Matrix</li>
              <li className="hover:text-[#C02B0A] cursor-pointer transition-colors block border-t border-[#3C091E]/10 pt-4">How it works</li>
              <li className="hover:text-[#C02B0A] cursor-pointer transition-colors block border-t border-[#3C091E]/10 pt-4">System Logic</li>
              <li className="hover:text-[#C02B0A] cursor-pointer transition-colors block border-t border-[#3C091E]/10 pt-4">Data Extraction</li>
            </ul>
          </div>

          <div className="lg:w-1/3">
            <h4 className="font-mono text-lg font-bold tracking-widest text-[#3C091E] mb-8">GET STARTED</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <input className="w-1/2 bg-transparent border-b border-[#3C091E]/30 focus:border-[#C02B0A] outline-none py-2 font-mono text-xs placeholder-[#97494E]" placeholder="First name *" />
                <input className="w-1/2 bg-transparent border-b border-[#3C091E]/30 focus:border-[#C02B0A] outline-none py-2 font-mono text-xs placeholder-[#97494E]" placeholder="Last name *" />
              </div>
              <input className="w-full bg-transparent border-b border-[#3C091E]/30 focus:border-[#C02B0A] outline-none py-2 font-mono text-xs placeholder-[#97494E]" placeholder="Email *" />
              <Button
                size="lg"
                className="mt-8 px-10 rounded-none bg-[#3C091E] hover:bg-[#C02B0A] clip-button text-white font-mono tracking-widest font-bold transition-all w-max"
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
