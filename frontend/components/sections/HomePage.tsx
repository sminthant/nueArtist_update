'use client';

import Footer from '@/components/layout/Footer';
import FloatingSocialLinks from '@/components/layout/FloatingSocialLinks';
import Navbar from '@/components/layout/Navbar';
import AnnouncementSection from '@/components/sections/AnnouncementSection';
import ArtistOverviewSection from '@/components/sections/ArtistOverviewSection';
import EventSection from '@/components/sections/EventSection';
import HeroSection from '@/components/sections/HeroSection';
import MusicSection from '@/components/sections/MusicSection';
import SampleLinksSection from '@/components/sections/SampleLinksSection';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { HomePageData } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function HomePage({ data }: { data: HomePageData }) {
  const {
    navigation = [],
    socialLinks = [],
    contactEmail = '',
    featuredAlbum = null,
    musicReleases = [],
    latestAnnouncement = null,
    upcomingEvents = [],
    pastEvents = [],
    sampleLinks = [],
    artistOverview = null,
  } = data;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [floatingSocialVisible, setFloatingSocialVisible] = useState(true);
  const footerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateScrollProgress = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    const updateFloatingSocialVisibility = () => {
      const footerElement = footerContainerRef.current;
      if (!footerElement) {
        setFloatingSocialVisible(true);
        return;
      }

      const baseBottom = 24;
      const iconSize = 44;
      const iconGap = 12;
      const iconStackHeight =
        socialLinks.length > 0
          ? socialLinks.length * iconSize + (socialLinks.length - 1) * iconGap
          : 0;
      const hideThreshold = baseBottom + iconStackHeight + 24;
      const footerTop = footerElement.getBoundingClientRect().top;

      setFloatingSocialVisible(footerTop >= window.innerHeight - hideThreshold);
    };

    updateFloatingSocialVisibility();
    window.addEventListener('scroll', updateFloatingSocialVisibility, {
      passive: true,
    });
    window.addEventListener('resize', updateFloatingSocialVisibility);

    return () => {
      window.removeEventListener('scroll', updateFloatingSocialVisibility);
      window.removeEventListener('resize', updateFloatingSocialVisibility);
    };
  }, [socialLinks.length]);

  const animatedBackgroundStyle = useMemo(() => {
    const x = 14 + scrollProgress * 48;
    const y = 8 + scrollProgress * 46;
    const x2 = 86 - scrollProgress * 42;
    const y2 = 86 - scrollProgress * 56;

    return {
      backgroundImage: [
        'radial-gradient(1200px 760px at var(--g1x) var(--g1y), rgba(196, 0, 0, 0.38), transparent 72%)',
        'radial-gradient(900px 620px at var(--g2x) var(--g2y), rgba(115, 0, 0, 0.32), transparent 70%)',
        'linear-gradient(165deg, #050001 0%, #0d0000 35%, #1a0000 65%, #2d0000 100%)',
      ].join(','),
      ['--g1x' as string]: `${x}%`,
      ['--g1y' as string]: `${y}%`,
      ['--g2x' as string]: `${x2}%`,
      ['--g2y' as string]: `${y2}%`,
    } as React.CSSProperties;
  }, [scrollProgress]);

  return (
    <div className="relative min-h-screen text-edm-text" style={animatedBackgroundStyle}>
      <Navbar navigation={navigation} showSocial={false} variant="mobile" />

      <HeroSection />

      <div
        className="
                        pointer-events-none
                        absolute bottom-0 left-0 h-32 w-full
                        bg-gradient-to-t
                        from-black/60
                        to-transparent
                        backdrop-blur-md
                    "
      />

      <Navbar navigation={navigation} showSocial={false} variant="desktop" />

      <FloatingSocialLinks
        socialLinks={socialLinks}
        visible={floatingSocialVisible}
      />

      <main className="relative overflow-x-clip">
        <ScrollReveal delay={100} direction="down">
          <AnnouncementSection latestAnnouncement={latestAnnouncement} />
        </ScrollReveal>
        <ScrollReveal direction="left">
          <MusicSection featuredAlbum={featuredAlbum} releases={musicReleases} />
        </ScrollReveal>
        <ScrollReveal delay={100} direction="up">
          <EventSection upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
        </ScrollReveal>
        <ScrollReveal delay={120} direction="left">
          <SampleLinksSection sampleLinks={sampleLinks} />
        </ScrollReveal>
        <ScrollReveal delay={150} direction="right">
          <ArtistOverviewSection artistOverview={artistOverview} />
        </ScrollReveal>
      </main>

      <div ref={footerContainerRef}>
        <ScrollReveal delay={80} direction="up">
          <Footer
            navigation={navigation}
            socialLinks={socialLinks}
            contactEmail={contactEmail}
          />
        </ScrollReveal>
      </div>
    </div>
  );
}
