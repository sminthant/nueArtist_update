'use client';

import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { Biography, NavigationItem, SocialLink } from '@/types';

export default function BiographiesPage({
  biographies = [],
  navigation = [],
  socialLinks = [],
  contactEmail = '',
}: {
  biographies?: Biography[];
  navigation?: NavigationItem[];
  socialLinks?: SocialLink[];
  contactEmail?: string;
}) {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-edm-black-red text-edm-text">
      <header className="border-b border-edm-accent/20 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="font-orbitron inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-edm-text-secondary transition hover:text-edm-text"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <h1 className="font-orbitron mb-10 text-center text-3xl uppercase tracking-[0.12em] text-edm-text sm:text-4xl">
            Artist Details
          </h1>
        </ScrollReveal>

        {biographies.length > 0 ? (
          <section className="space-y-10">
            {biographies.map((biography, index) => (
              <ScrollReveal
                key={biography.id}
                direction={index % 2 === 0 ? 'left' : 'right'}
                delay={Math.min(index * 60, 360)}
              >
                <article className="grid gap-6 lg:grid-cols-[1fr,1.1fr] lg:gap-8">
                  <div className="overflow-hidden border border-edm-accent/20 bg-black/30">
                    <div className="aspect-[4/5] w-full">
                      {biography.image_url ? (
                        <img
                          src={biography.image_url}
                          alt={biography.title || 'Artist'}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-edm-text-muted">
                          No image available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <h2 className="font-orbitron mb-4 text-2xl uppercase tracking-[0.08em] text-edm-text sm:text-3xl">
                      {biography.title || 'Artist Biography'}
                    </h2>
                    <div className="space-y-5 text-[1.1rem] leading-relaxed text-edm-text-secondary sm:text-[1.2rem]">
                      {(biography.content || '')
                        .split(/\n\s*\n/)
                        .filter((paragraph) => paragraph.trim().length > 0)
                        .map((paragraph, paragraphIndex) => (
                          <p key={`${biography.id}-paragraph-${paragraphIndex}`}>
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </section>
        ) : (
          <div className="rounded-xl border border-edm-accent/20 bg-black/40 p-8 text-sm text-edm-text-secondary">
            No artist details available yet.
          </div>
        )}
      </main>
      <Footer
        navigation={navigation}
        socialLinks={socialLinks}
        contactEmail={contactEmail}
      />
    </div>
  );
}
