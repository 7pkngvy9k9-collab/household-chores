type Props = {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
};

export function CompleteToggle({ checked, label, onChange }: Props) {
  return (
    <button
      type="button"
      className={`complete-toggle${checked ? " is-on" : ""}`}
      aria-pressed={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.6 10.8 15.3 16.2 9.5" />
      </svg>
    </button>
  );
}
