'use client';

import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative h-[100svh] min-h-[420px] w-full overflow-hidden pt-14 sm:min-h-[520px] lg:pt-0 md:h-[100dvh]"
    >
      <video
        className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover object-[58%_center] sm:object-center"
        src="/storage/NUE/NUE02.mp4"
        poster="/static/PNG/CHROME%20RED.png"
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent via-[40%] to-black/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,transparent_42%,rgba(13,0,0,0.34)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_90%,rgba(196,0,0,0.16)_0%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-edm-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-24 h-72 w-72 rounded-full bg-red-900/20 blur-3xl"
        aria-hidden
      />

      <div className="absolute inset-0 z-10 flex items-end justify-start pb-6 sm:pb-8 md:pb-10">
        <div className="w-full px-2 sm:px-4 md:px-6">
          <div
            className={`max-w-lg rounded-2xl border border-white/15 bg-black/20 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-1000 ease-out sm:p-5 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h1 className="font-orbitron text-left text-2xl font-semibold uppercase leading-tight tracking-[0.06em] text-edm-text sm:text-[2.5rem] md:text-3xl">
              THE NEO-UNDERGROUND
              <span className="block text-edm-text-secondary">EXPERIMENT</span>
            </h1>
            <p className="mt-2 max-w-lg text-left text-xs leading-relaxed text-edm-text-secondary sm:text-sm">
              Cinematic bass music, raw club energy, and immersive visuals in one
              premium performance.
            </p>

            <div className="mt-4 flex flex-wrap justify-start gap-2.5">
              <a
                href="#shows"
                className="font-orbitron inline-flex items-center justify-center rounded-full border border-edm-accent/60 bg-edm-accent/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-edm-text transition hover:border-edm-accent hover:bg-edm-accent/30"
              >
                View Shows
              </a>
              <a
                href="#sample-links"
                className="font-orbitron inline-flex items-center justify-center rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-white/45 hover:text-edm-text"
              >
                Explore Packs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
