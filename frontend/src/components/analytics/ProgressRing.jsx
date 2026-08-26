const ProgressRing = ({
  value = 0,
  size = 132,
  stroke = 10,
  color = "#8B5CF6",
  trackColor = "#EDE9FE",
  label,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold text-gray-900">
          {clamped.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
        </span>
        {label && <span className="text-xs text-gray-500 mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

export default ProgressRing;
