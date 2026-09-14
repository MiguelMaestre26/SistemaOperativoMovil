interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ value, color = 'var(--accent)', height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      style={{
        height,
        borderRadius: height,
        background: 'var(--bg-tertiary)',
        overflow: 'hidden',
        flex: 1,
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: height,
          background: color,
          width: `${clamped * 100}%`,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}