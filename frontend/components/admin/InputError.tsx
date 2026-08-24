import type { HTMLAttributes } from 'react';

export default function InputError({
  message,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
  return message ? (
    <p {...props} className={`text-sm text-edm-neon-pink ${className}`}>
      {message}
    </p>
  ) : null;
}
