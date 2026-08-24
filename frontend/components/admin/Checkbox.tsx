import type { InputHTMLAttributes } from 'react';

export default function Checkbox({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="checkbox"
      className={
        'rounded border-edm-gradient/50 bg-black/20 text-edm-accent shadow-sm focus:ring-edm-accent ' +
        className
      }
    />
  );
}
