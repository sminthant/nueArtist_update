'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'down';
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let hiddenClass = 'translate-y-8 opacity-0';

  if (direction === 'left') {
    hiddenClass = '-translate-x-12 opacity-0';
  }

  if (direction === 'right') {
    hiddenClass = 'translate-x-12 opacity-0';
  }

  if (direction === 'up' || direction === 'down') {
    hiddenClass = 'translate-y-8 opacity-0';
  }

  return (
    <div
      ref={ref}
      className={`
                overflow-x-hidden transition-all duration-700 ease-out
                ${visible ? 'translate-x-0 translate-y-0 opacity-100' : hiddenClass}
                ${className}
            `}
      style={visible && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
