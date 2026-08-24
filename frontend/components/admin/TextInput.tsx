'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';

type TextInputProps = ComponentPropsWithoutRef<'input'> & {
  isFocused?: boolean;
};

export default forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { type = 'text', className = '', isFocused = false, ...props },
  ref,
) {
  const localRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

  useEffect(() => {
    if (isFocused) {
      localRef.current?.focus();
    }
  }, [isFocused]);

  return (
    <input
      {...props}
      type={type}
      className={
        'rounded-md border-edm-gradient/50 bg-black/20 text-edm-text placeholder-edm-text-muted shadow-sm focus:border-edm-accent focus:ring-edm-accent ' +
        className
      }
      ref={localRef}
    />
  );
});
