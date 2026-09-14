interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'time' | 'date';
  multiline?: boolean;
  autoFocus?: boolean;
  align?: 'left' | 'center' | 'right';
}

export default function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline,
  autoFocus,
  align = 'left',
}: TextFieldProps) {
  const base: React.CSSProperties = {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 16,
    fontFamily: 'inherit',
    textAlign: align,
    width: '100%',
    userSelect: 'text' as const,
    padding: 0,
    lineHeight: 1.4,
  };

  if (multiline) {
    return (
      <textarea
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...base, minHeight: 88, resize: 'none' }}
      />
    );
  }

  return (
    <input
      autoFocus={autoFocus}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={base}
    />
  );
}