const MAX_RATING = 5;

export function Rating({ value }: { value: number }) {
  return (
    <div
      role="img"
      aria-label={`Nota ${value} de ${MAX_RATING}`}
      className="flex items-center gap-1.5"
    >
      <span className="text-caption tracking-[0.5px]">
        <span className="text-star">{"★".repeat(value)}</span>
        <span className="text-line">{"★".repeat(MAX_RATING - value)}</span>
      </span>
      <strong className="ml-1 text-caption text-ink-soft">
        {value.toFixed(1)}
      </strong>
      <span className="text-caption text-ink-subtle">/ {MAX_RATING}</span>
    </div>
  );
}
