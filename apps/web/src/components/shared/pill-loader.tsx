const dustParticles = [
  { size: 5, top: 0, right: 0, delay: 0 },
  { size: 7, top: -16, right: -16, delay: -0.2 },
  { size: 8, top: 14, right: 10, delay: -0.33 },
  { size: 5, top: -16, right: 14, delay: -0.4 },
  { size: 5, top: 16, right: -14, delay: -0.5 },
  { size: 5, top: 0, right: -12, delay: -0.66 },
  { size: 5, top: -4, right: 22, delay: -0.7 },
  { size: 5, top: 20, right: -4, delay: -0.8 },
  { size: 3, top: 14, right: -22, delay: -0.99 },
  { size: 3, top: -20, right: 0, delay: -1.11 },
  { size: 3, top: 20, right: 20, delay: -1.125 },
  { size: 3, top: -22, right: -22, delay: -1.275 },
  { size: 3, top: -4, right: 10, delay: -1.33 },
  { size: 3, top: -10, right: -4, delay: -1.4 },
  { size: 3, top: -4, right: -22, delay: -1.55 },
];

export function PillLoader({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className="flex flex-col items-center justify-center gap-3 py-10"
    >
      <div className="pill-loader-content relative">
        <div className="pill-loader">
          <div className="pill-side" />
          <div className="pill-side" />
        </div>
        <div className="pill-loader-dust">
          {dustParticles.map((p, i) => (
            <i
              key={i}
              style={{
                width: p.size,
                height: p.size,
                marginTop: p.top,
                marginRight: p.right,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      </div>
      {label && <p className="text-[13px] text-muted-foreground">{label}</p>}
    </div>
  );
}
