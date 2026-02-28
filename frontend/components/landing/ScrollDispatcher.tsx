"use client";

import { useEffect, useState } from "react";
import { useScrollStore } from "@/lib/store";

export function ScrollDispatcher() {
    const setProgress = useScrollStore((state) => state.setProgress);

    useEffect(() => {
        const handleScroll = () => {
            // Calculate scroll progress from 0 to 1
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const progress = Math.min(Math.max(currentScroll / totalScroll, 0), 1);

            setProgress(progress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // Initial call
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [setProgress]);

    return null;
}
