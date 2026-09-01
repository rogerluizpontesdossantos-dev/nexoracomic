'use client';

import Link from 'next/link';
import BlackHoleHeroSection from '@/components/ui/blackhole-hero-section';

export default function Hero() {
  return (
    <section className="relative min-h-[92svh] w-full md:min-h-[720px]">
      <BlackHoleHeroSection
        focus={[0.72, 0.46]}
        scrim="left"
        scrimStrength={0.85}
        distance={24}
        elevation={-5.5}
        fov={42}
        glow={1}
        steps={300}
        resolution={0.7}
        hotColor="#FFF3DE"
        midColor="#FF9838"
        coolColor="#8E3A0B"
        starBrightness={0.15}
        doppler={0.35}
        spinSpeed={0.06}
      >
        <div className="flex h-full min-h-[92svh] items-start px-6 pt-14 sm:px-10 md:min-h-[720px] md:items-center md:pt-0 lg:px-20">
          <div className="max-w-[34rem]">
            {/* Brand name */}
            <h1 className="text-[2.5rem] font-light leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.25rem]">
              <span className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Nexora
              </span>
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                Comic
              </span>
            </h1>

            {/* Decorative line */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent to-[#d4af37]" />
              <div className="w-2 h-2 rotate-45 bg-[#d4af37]" />
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-l from-transparent to-[#d4af37]" />
            </div>

            <p className="max-w-md text-[0.95rem] leading-relaxed text-white/60">
              Uma publicação digital que conecta ciência, tecnologia, espaço, inteligência artificial e cultura geek.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/pesquisar"
                className="rounded-full bg-gradient-to-r from-[#d4af37] to-[#c9a227] px-6 py-3 text-sm font-medium text-[#050508] transition hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105"
              >
                Explorar Artigos
              </Link>
              <Link
                href="/sobre"
                className="rounded-full border border-[#d4af37]/30 px-6 py-3 text-sm text-[#d4af37] transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
              >
                Saiba Mais
              </Link>
            </div>
          </div>
        </div>
      </BlackHoleHeroSection>
    </section>
  );
}