'use client';

import { useCallback, useEffect, useState } from 'react';

export default function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[60] max-w-sm rounded-lg border border-edm-accent/40 bg-edm-main/95 px-4 py-3 text-sm text-edm-text shadow-edm-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-edm-text-secondary transition hover:text-edm-text"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast(duration = 2500) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setMessage(''), duration);
    return () => window.clearTimeout(timeout);
  }, [message, duration]);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  const clearToast = useCallback(() => {
    setMessage('');
  }, []);

  return { message, showToast, clearToast };
}
