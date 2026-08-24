'use client';

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  label = 'Toggle',
}: {
  checked?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled && typeof onChange === 'function') {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        checked
          ? 'border-edm-accent bg-edm-accent/30'
          : 'border-edm-text-muted/40 bg-black/30'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-edm-text transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
