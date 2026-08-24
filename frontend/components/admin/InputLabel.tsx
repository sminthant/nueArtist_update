import type { LabelHTMLAttributes } from 'react';

export default function InputLabel({
  value,
  className = '',
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & {
  value?: string;
}) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-edm-text-secondary ${className}`}
    >
      {value ?? children}
    </label>
  );
}
