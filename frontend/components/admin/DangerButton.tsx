import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function DangerButton({
  className = '',
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={
        `inline-flex items-center rounded-md border border-transparent bg-edm-accent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-edm-text transition duration-150 ease-in-out hover:bg-edm-gradient focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-edm-main active:opacity-90 ${
          disabled ? 'opacity-25' : ''
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  );
}
