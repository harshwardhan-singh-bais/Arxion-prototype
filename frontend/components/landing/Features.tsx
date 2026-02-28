"use client";

import { motion } from "framer-motion";

const industries = [
    {
        number: "01",
        label: "PHD RESEARCHERS",
        title: "LABORATORY TEAMS",
        description: "Use Arxion to radically accelerate literature reviews and gap analysis. Instantly verify if a specific dataset-method combination has already been tried, reducing parallel invention completely.",
    },
    {
        number: "02",
        label: "AI ENGINEERS",
        title: "ENTERPRISE",
        description: "Benchmark open-source model replication accurately. Arxion immediately highlights missing hyperparameters and tracks code availability exactly as stated in foundational papers across arxiv.",
    },
    {
        number: "03",
        label: "DATA ANALYSTS",
        title: "META-SCIENCE",
        description: "Map macroscopic trends in AI safety, reproducibility, and dataset saturation. Generate verifiable macro-intelligence on the specific trajectories of machine learning benchmarks over real time.",
    },
];

export function Features() {
    return (
        <section className="py-40 relative z-10 border-t border-black bg-transparent">
            {/* Container is completely transparent so the 3D white/red scene shows underneath. The cards are solid and float. */}
            <div className="w-full flex flex-col xl:flex-row max-w-[1400px] mx-auto px-6 xl:px-0 gap-16">

                {/* Left Side Massive Title block */}
                <div className="xl:w-1/3 flex flex-col justify-start xl:sticky xl:top-40 h-fit">
                    <h2 className="text-6xl md:text-8xl font-display font-black uppercase leading-[0.9] tracking-tighter text-[#3C091E] mb-8" style={{ wordSpacing: '-10px' }}>
                        FIND YOUR<br />
                        <span className="flex items-center">
                            <span className="w-20 h-1 bg-[#3C091E] mr-6 opacity-30 mt-4" />
                            USE CASE
                        </span>
                    </h2>

                    <p className="font-mono text-[#3C091E] text-base leading-relaxed tracking-wide opacity-90 border-l border-[#3C091E]/20 pl-6">
                        Arxion is built specifically for the teams responsible for ensuring reproducibility, discovering algorithmic gaps, and avoiding dead-end dataset combinations.
                    </p>

                    <div className="mt-12">
                        <button className="border-2 border-[#3C091E] text-[#3C091E] px-8 py-4 font-mono uppercase tracking-widest text-sm font-bold hover:bg-[#3C091E] hover:text-white transition-colors clip-button">
                            GET STARTED
                        </button>
                    </div>
                </div>

                {/* Right Side Cards Wrapper */}
                <div className="xl:w-2/3 flex overflow-x-auto gap-8 pb-10 hide-scroll-solais">
                    {industries.map((ind, idx) => (
                        <motion.div
                            key={ind.number}
                            initial={{ opacity: 0, x: 100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex-shrink-0 w-[400px] bg-white border border-[#3C091E]/20 clip-card-solais flex flex-col justify-between shadow-2xl relative"
                        >
                            <div className="p-12">
                                {/* Card Top Label */}
                                <div className="flex items-center font-mono text-[#3C091E] text-xs font-bold tracking-widest mb-12">
                                    <span>ARXION</span>
                                    <div className="flex-1 border-b border-[#3C091E]/20 mx-4" />
                                    <span>{ind.number}</span>
                                </div>

                                {/* Card Title */}
                                <h3 className="text-4xl font-display font-black uppercase text-[#3C091E] leading-[0.9] mb-12">
                                    <span className="block">{ind.title.split(' ')[0]}</span>
                                    <span className="block">{ind.title.split(' ')[1]}</span>
                                </h3>

                                {/* Card Description */}
                                <p className="font-mono text-[#97494E] text-sm leading-relaxed tracking-wide">
                                    {ind.description}
                                </p>
                            </div>

                            {/* Barcode bottom accent */}
                            <div className="p-8 flex justify-end">
                                <div className="flex gap-1 h-6">
                                    <div className="w-1 bg-[#3C091E]" />
                                    <div className="w-1 bg-[#3C091E]" />
                                    <div className="w-1 bg-[#3C091E]" />
                                    <div className="w-0.5 bg-[#3C091E]" />
                                    <div className="w-1.5 bg-[#3C091E]" />
                                    <div className="w-1 bg-[#3C091E]" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
