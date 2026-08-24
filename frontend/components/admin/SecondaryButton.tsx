import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function SecondaryButton({
  type = 'button',
  className = '',
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      type={type}
      className={
        `inline-flex items-center rounded-md border border-edm-gradient/50 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-edm-text shadow-sm transition duration-150 ease-in-out hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-edm-main disabled:opacity-25 ${
          disabled ? 'opacity-25' : ''
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  );
}
